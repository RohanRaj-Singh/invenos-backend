# Invenos POS — Architecture Impact Assessment

## 1. UI Differences Identified

### 1A. Product Form (Inventory)

| UI Feature | Prototype Expects | Current Backend | Gap | Resolution |
|---|---|---|---|---|
| **Selling Units** | `sellingUnits[]` with `id, name, unitId, quantity, salePrice, isDefault, barcode, sku` | `selling_units` table has `id, product_id, name, unit_id, quantity, sale_price, barcode, sku, is_default` | Minor naming (snake_case vs camelCase) — already handled by normalization layer in frontend | **No DB change**. Normalization layer handles the mapping |
| **Purchase Config** | `purchaseConfig: { unitId, quantity, cost, name }` | Not stored as a persisted entity | The prototype's `purchaseConfig` is **UI state**, not a database concept. It represents "this product is usually bought in this packaging" | **No new table**. Derive purchase defaults from existing data or add optional columns to the `products` table (`purchase_unit_id`, `purchase_unit_cost`, `purchase_unit_qty`) if they represent persistent defaults rather than transient UI state |
| **Composite Products (Ingredients)** | `ingredients: [{ productId, quantity, unitId }]` for composite products | No table exists | **Scoped to future phase**. BOM/manufacturing is a separate feature that affects inventory consumption, costing, and production workflows | **Deferred**. Move to a distinct manufacturing phase |
| **Product Category** | `category: string` | `category_id: int` → `categories` table with `id, name` | Mismatch resolved by normalization — `category?.name` used in display | **No change needed** |
| **Custom Sizing** | UI shows measurement-based templates (50g/100g/250g etc.) when `measurementType` is weight/volume | Backend `units` system has measurement types but not fed into product form | The unit's measurement type is available via the `units` library. The product form should read it at render time, not require a DB change | **Frontend-only**. Templates are computed from existing unit metadata |
| **SKU Generation** | Auto-generates based on category prefix + sequence | `ProductService::generateSku()` generates based on name prefix, not category | Format differs but functionally equivalent | **No change**. Functionally interchangeable |

### 1B. Purchase Bill

| UI Feature | Prototype Expects | Current Backend | Gap | Resolution |
|---|---|---|---|---|
| **Transaction Recorder** | `useTransactionRecorder()` with `purchaseStrategy` — strategy pattern | `PurchaseService::create()` with atomic DB transaction, auto inventory update | Strategy pattern bypassed in favor of direct Inertia submission | **No change needed**. Backend services already handle validation, inventory, and atomicity |
| **Discount Mode** | `discountMode: 'flat' | 'pct'` — supports both flat and percentage discount | `purchase_bills` has no discount column. `total_amount` - `subtotal` = effective discount | Purchase bill discount should be persisted | **Add `discount` column** to `purchase_bills` |
| **Supplier Contact Picker** | Full searchable combobox with contact info | Passed via `PurchaseController::create()` → `suppliers` Inertia prop | Works correctly | **No change needed** |

### 1C. Sale Bill (POS)

| UI Feature | Prototype Expects | Current Backend | Gap | Resolution |
|---|---|---|---|---|
| **Transaction Recorder** | `useTransactionRecorder()` with `saleStrategy` | `SaleService::create()` with inventory decrement | Strategy pattern bypassed | **No change needed**. Backend services are production-ready |
| **Payment Panel** | Complex dialog with 5 methods, partial payment, change calc | `SaleService::create()` accepts `amount_paid` and `payment_status` | Fields align | **No change needed** |

---

## 2. Database Impact

### Deeply reconsidered: no `product_purchase_units` table

The proposed `product_purchase_units` table was driven by the prototype's `PurchaseConfig` interface shape, not by an actual business requirement. Before introducing a new table, verify whether purchase defaults can be:

- **Derived** from the most recent purchase bill item for that product (cost, unit)
- **Stored** as optional columns on the `products` table (default purchase unit, cost, quantity) — only if the business needs to remember purchase settings across sessions

**Decision**: Start with what exists. The frontend normalization layer already provides fallback values. Add persisted purchase defaults only when a concrete business requirement demands it.

### Tables requiring changes

| Table | Change | Justification |
|---|---|---|
| `purchase_bills` | Add `discount` column (decimal, default 0) | PurchaseBill UI allows discount entry; currently lost on save |
| `purchase_bill_items` | Add `discount_pct` column (decimal, nullable) | Per-line discount tracking for purchase items |

### Tables not requiring changes

- `products` — current columns support all approved workflows
- `selling_units` — schema matches prototype after normalization
- `sales` / `sale_items` — fields match prototype requirements
- `inventory_transactions` — columns exist, just need populating
- `contacts` — single-entity model with JSON roles works for both customer and supplier
- `categories` — `id, name` covers prototype usage

---

## 3. Corrected Dependency Graph

```
Inventory Architecture
        ↓
Product Model
        ↓
Selling Units
        ↓
Purchase Flow
        ↓
Sale Flow
        ↓
Returns
        ↓
Reports
        ↓
Dashboard
```

Everything eventually becomes inventory movement. The dependency graph should flow from inventory outward.

---

## 4. Implementation Order (Revised)

### Phase 1: Purchase Discounts (Small, Focused)
**Step 1.1** — Add `discount` column to `purchase_bills` migration
**Step 1.2** — Add `discount_pct` to `purchase_bill_items` migration
**Step 1.3** — Update `CreatePurchaseData` DTO
**Step 1.4** — Update `PurchaseService::create()` to handle discount

### Phase 2: Inventory Transaction Packaging (Display Quality)
**Step 2.1** — Update `InventoryService::recordTransaction()` to accept `packaging_name` and `packaging_quantity`
**Step 2.2** — Update `PurchaseService::create()` and `SaleService::create()` to pass packaging info to inventory transactions
**Rationale**: Improves inventory timeline display without structural changes

### Phase 3: Auto-generated Invoice References
**Step 3.1** — Update `CreateSaleRequest` to generate `invoice_number` if not provided
**Step 3.2** — Update `CreatePurchaseRequest` to generate `invoice_ref` if not provided

### Phase 4: Testing & Verification
**Step 4.1** — Update existing tests for new discount fields
**Step 4.2** — Full test suite run + manual workflow verification

---

## 5. Deferred Features

| Feature | Reason | When |
|---|---|---|
| **Composite/BOM Products** | Affects manufacturing, inventory consumption, costing, production — entirely separate domain | Future dedicated phase |
| **Product Purchase Config persistence** | No business requirement yet; frontend handles defaults via normalization | If/when multi-session purchase defaults are needed |
| **Ingredient tracking** | Tied to composite products | Same future phase as BOM |

---

## 6. Principle

> The prototype tells us what the user experiences. It does not tell us how Laravel should model it.
>
> The database should exist because of business requirements, not because a React component has a certain object shape.

Every proposed schema change must be justified by a business requirement, not by frontend convenience.
