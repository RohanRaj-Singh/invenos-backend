# 05 — Backend Sales & POS Transaction Impact

## 1. Sale routes

**VERIFIED.** `routes/web.php`:

| Route | Method | Purpose |
|---|---|---|
| `GET /sales` | `SaleController@index` | sales list |
| `POST /sales` | `SaleController@store` | create sale |
| `GET /sales/pos` | `SaleController@create` | POS page + product/customer props |
| `GET /sales/{id}` | `SaleController@show` | detail |
| `GET /sales/{id}/print` | `SaleController@printInvoice` | receipt |
| `GET /sales/{id}/pdf` | `DocumentPdfController@invoice` | PDF |
| `DELETE /sales/{id}` | `SaleController@destroy` | soft delete + reversal |

**ABSENT:** sale edit/update, void, cancel, draft, duplicate, split payment records, idempotency
key. A sale is created once and either stands or is deleted.

## 2. POS data supply

`SaleController@create`:

```php
$products = Product::with('sellingUnits')->orderBy('name')->get()->toArray();
$customers = Contact::whereJsonContains('roles','customer')->orderBy('name')->get([...]);
```

- The global `notArchived` scope hides archived products.
- **Every non-archived product is sent**, including products with no selling unit and products
  with zero stock. There is no product-type or buildability filter.
- Products are sent raw (`toArray()`), including cost fields.

## 3. Client POS flow (summary; detail in document 08)

**VERIFIED.** `resources/js/Pages/pos/SaleBill.tsx`:

1. normalizes products to camelCase;
2. filters archived products;
3. search is name/SKU only (placeholder says barcode, but barcode is not searched);
4. `addToCart` uses the default selling unit and keeps **one cart line per product**;
5. quantity edits multiply `packagingQuantity × baseUnitQuantity`;
6. price override and discount % are client-side maps;
7. pre-submit stock check runs only for `track_inventory !== false`;
8. on shortage, a dialog offers `bypass_stock_check = true`;
9. posts `/sales` with `product_id`, quantities, `selling_unit_id`, `base_unit_quantity`,
   `unit_price`, `total`, discount and payment fields;
10. on success, the receipt is built **client-side** with `saleId = sale-${Date.now()}` and
    `invoiceNumber = INV-${Date.now()}` — not the real database invoice number.

## 4. Server sale lifecycle

**VERIFIED.** `SaleService::create(CreateSaleData $data, bool $bypassStockCheck = false)` runs
inside `DB::transaction`:

1. Rejects an empty item list.
2. If `customerId > 0`, locks the contact and requires the `customer` role.
3. Validates each item: `baseQuantity > 0`, `unitPrice >= 0`.
4. Computes `subtotal = Σ item.total`, `grandTotal = subtotal − discount`,
   `outstanding = max(0, grandTotal − amountPaid)`.
5. Creates the `sales` row.
6. For each item:
   - locks the product (`withArchived()`);
   - rejects archived products;
   - if `selling_unit_id` is supplied, re-reads `selling_units.quantity` and uses it as the
     authoritative factor;
   - `baseQty = packaging_quantity × authoritativeBaseUnitQty`;
   - decrements `uncosted_qty` first;
   - snapshots `cost_price = CostResolver::unitCost($product)`;
   - creates the `sale_items` row;
   - calls `InventoryService::recordSale(...)`.
7. Applies the customer balance increase (`PartyBalance::apply`).
8. Records the initial cash receipt (including walk-ins) and an invoice memo in the cash ledger.

### What is server-authoritative

| Value | Authority |
|---|---|
| Customer role | server |
| Product exists/archived | server |
| Selling unit factor | server when `selling_unit_id` is present |
| Base quantity | server (factor × `packaging_quantity`) |
| **Unit price** | **client** |
| **Line total** | **client** |
| Discount | client |
| Payment status | client (derived on client) |
| Invoice number | server default or client value |

**RISK:** `sale_items.total` and `sales.subtotal` are accepted from the client. The server never
checks `total ≈ packaging_quantity × unit_price − discount`. A crafted request can understate
revenue while stock is still deducted exactly.

**RISK:** there is no idempotency key or duplicate-submission guard. A double-click can create
two sales and two stock deductions. The invoice number is random, so the unique constraint will
not reliably stop it.

## 5. Stock deduction timing and rollback

- Stock is deducted **inside** the sale transaction, after the sale header and before the
  ledger entries. If any `recordSale` throws (insufficient stock, missing product), the whole
  transaction rolls back: no sale, no sale items, no ledger rows.
- `InventoryService::applyMovement` itself does not open a transaction, but it participates in
  the caller's transaction and locks each product row.
- `bypassStockCheck` disables the insufficient-stock guard for the whole sale.
- There is no reservation step; stock is checked at movement time.

**Composition consequence:** if consumption is executed inside `SaleService::create`, a failure
in the last component rolls back the sale and all previous components. That is the correct
all-or-nothing behavior and is the strongest argument for doing consumption in the same
transaction rather than in a separate job.

## 6. Sale deletion / restoration

`SaleController@destroy` → `RecordLifecycleService::delete` → `SalePolicy`:

- `canDelete` blocks if any `sale-return` inventory movement references the invoice.
- `executeDelete` adds stock back per `sale_item` via `recordAdjustment` with a `REV-`
  reference, decrements customer balance, reverses cash rows, deletes the invoice financial
  memo.
- Restore re-deducts stock and re-posts cash.

**Composition consequence:** deleting a sale whose components were consumed must either
re-enable or reject the consumption reversal. The current policy only knows about sale items; it
will happily restore the commercial product even if components were consumed and cannot be
un-consumed. This must be decided in P6.

## 7. Where composition fits in sales

### 7.1 Two distinct execution models

| Model | Stock at sale | Stock at production | POS change |
|---|---|---|---|
| **A. Composite produced into stock (assembly)** | Sells finished good normally (already stocked) | Consumes components, credits finished good | **None** if production is a separate screen |
| **B. Consumption at sale (service/treatment)** | Consumes components at sale | n/a | **Required** (consumption editor) |
| **C. Assembly at sale (explode cart line)** | Consumes components at sale and does not track finished stock | n/a | Required, plus revenue allocation; **not recommended as the default** |

The brief explicitly separates "manufacturing" from "consumption at sale". The implementation
must keep A and B distinct.

### 7.2 Recommended sale-time consumption (B)

**PROPOSED.** Add an optional `consumption` payload to sale items:

```json
{
  "product_id": 42,
  "selling_unit_id": 7,
  "packaging_quantity": 2,
  "unit_price": 1500,
  "consumption": [
    { "component_product_id": 11, "quantity": 5, "unit": "ml", "is_override": true },
    { "component_product_id": 12, "quantity": 1, "unit": "piece", "is_override": false }
  ]
}
```

Server rules:

1. Only products with an active `kind=consumption` composition accept a `consumption` payload.
2. If no payload is supplied, resolve the saved template and scale by `packaging_quantity`.
3. If a payload is supplied, validate every component belongs to the active template, quantities
   are positive, units are compatible, and the override is allowed for this user.
4. Do **not** trust client costs or component prices.
5. Apply consumption through `InventoryService::recordConsumption` / `recordAdjustment` inside
   the existing sale transaction.
6. Write `composition_runs` + `composition_run_items` with `source_type='sale'`,
   `source_id=sale.id`.
7. Do **not** create `sale_items` for components.
8. Keep `sale_items.cost_price` as the commercial product's cost. If the business wants
   consumption cost in COGS, either:
   - roll the component cost into the sale item's `cost_price` (simple, but loses breakdown), or
   - leave `cost_price` as-is and have COGS reports join `composition_runs` (accurate, more
     query work).
   Recommended: write the rolled cost into `sale_items.cost_price` **and** keep the breakdown
   in run items, so existing COGS reports remain correct without modification.

### 7.3 Quantity scaling

- Template quantities are per **one commercial unit**.
- Selling `packaging_quantity = 5` multiplies every component by 5.
- Fractional sale quantities must be supported (e.g. 0.5 of a service).
- Rounding must happen once, at the component line, with a documented policy
  (recommended: `round(qty, 4)` and never round to zero silently).

### 7.4 Insufficient components

**Required behavior:** reject before the first deduction. Check every component's available
stock after all overrides and scaling, then apply movements. Do not rely on the per-movement
guard, because earlier components would already have been deducted in the transaction and only
rolled back if the caller wrapped it — which it should, but validation is clearer and cheaper.

### 7.5 Sale return/cancellation behavior

See document 10. Short version: a returned consumption-based sale should refund money and
**not** restore consumed ingredients by default. It may optionally restock the commercial
product if that product is stocked. A returned assembled finished good may be restocked if it
is resellable.

## 8. POS editing surface

There is no sale edit. "Editing" means:
- deleting and recreating a sale (admin only), or
- completing a return (document 10).

Therefore a consumption editor only needs to exist at sale creation. A future "edit sale"
feature would require reversing and re-applying consumption, which is a new workflow.

## 9. Client-trusted values summary

| Trusted value | Risk | Composition impact |
|---|---|---|
| `unit_price`, `total`, `discount` | Understated revenue | A composite's price must be server-validated if components are expanded |
| `base_unit_quantity` when no `selling_unit_id` | Wrong stock quantity | Formula scaling must never trust this |
| `bypass_stock_check` | Negative stock | Must not be usable to bypass component validation silently |
| `payment_status` | Misstated receivables | Unrelated but should be derived server-side |
| `packaging_quantity` | Negative stock within guard | Must be > 0 server-side |

## 10. Required sales changes for composition

| Change | Phase | Notes |
|---|---|---|
| Accept `consumption` payload on sale items | P4 | Validate strictly |
| Resolve template server-side when omitted | P4 | Never trust client component list wholesale |
| Execute consumption in the sale transaction | P4 | All-or-nothing |
| Roll component cost into sale item cost | P5 | Keeps existing COGS correct |
| Write run + items | P3/P4 | Historical record |
| Add product capability flag to POS payload | P4 | Drives the consumption editor |
| Block deleting sales with consumed runs (or reverse deliberately) | P6 | Policy change |
| Add idempotency key | P0 (independent) | Prevents duplicate sales |

## 11. Findings summary

1. **VERIFIED:** sale creation is wrapped in a transaction and rolls back on failure.
2. **VERIFIED:** server re-reads the selling unit factor but trusts price/total.
3. **VERIFIED:** there is no sale edit, void or idempotency mechanism.
4. **VERIFIED:** the client receipt is fabricated and does not match the database invoice.
5. **RISK:** composition expansion into sale items would corrupt revenue and returns.
6. **PROPOSED:** execute consumption as a separate, linked effect inside the same transaction.
