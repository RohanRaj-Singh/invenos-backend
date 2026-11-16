# 04 — Backend Inventory & Stock Movement

## 1. The ledger

**VERIFIED.** `inventory_transactions` is the single stock ledger.

| Column | Type | Meaning |
|---|---|---|
| `product_id` | FK products cascade | |
| `type` | enum | `purchase`, `sale`, `return`, `sale-return`, `purchase-return`, `adjustment`, `damage`, `consumption` |
| `quantity` | decimal(12,2) **signed** | `+` inflow, `−` outflow |
| `unit_cost` | decimal(14,6) nullable | cost per base unit at movement time |
| `unit` | varchar(50) | the product's base-unit string |
| `packaging_name`, `packaging_quantity` | varchar/decimal | display context only |
| `date` | date | always `now()` except backfills |
| `document_date` | date nullable | business document date |
| `reference` | varchar(100) | invoice/return/adjustment document |
| `reference_type`, `reference_id` | varchar/bigint untyped | source link |
| `running_balance` | decimal(12,2) | product balance after movement |
| `user` | varchar(255) | user **name**, not id |

There is **no relation** from `InventoryTransaction` to sales, purchases or returns. Linking is
by the free-string `reference` plus the untyped pair. `InventoryTransaction` exposes only
`product()`.

### Sign convention

| Movement | Type | Sign |
|---|---|---|
| Purchase | `purchase` | + |
| Sale | `sale` | − |
| Sale return (restock) | `sale-return` | + |
| Purchase return | `purchase-return` | − |
| Adjustment | `adjustment` | caller |
| Damage | `damage` | caller (return flow writes + then −) |
| Consumption | `consumption` | caller (normally −) |
| Opening stock | `adjustment`, reference `INITIAL` | + |
| Reversal | same type / adjustment, negated | depends |

**VERIFIED invariant (intended):** `SUM(quantity) = on-hand`; `products.stock_quantity` is a
cache.

## 2. Who writes stock

| Path | Mechanism | Ledger? | Guard? |
|---|---|---|---|
| Product create with opening stock | direct `InventoryTransaction::create` in `ProductService::create` | yes | **no** |
| **Product edit** | `$product->update(['stock_quantity' => …])` in `ProductService::update` | **no** | **no** |
| Purchase | `InventoryService::recordPurchase` | yes | positive, no guard |
| Sale | `InventoryService::recordSale` | yes | yes |
| Canonical sale/purchase return | `ReturnService::applyStock` → `recordReturn` / `recordAdjustment` | yes | yes (but `REV-` bypasses) |
| Return reversal | `recordAdjustment` with `REV-` reference | yes | **bypasses guard** |
| Manual adjustment | `InventoryController@adjust` → `recordTransaction` | yes | caller-supplied |
| Sale delete/restore | lifecycle policies → `recordAdjustment` | yes | `REV-`/`RESTORE-` |
| Purchase delete/restore | lifecycle policies → `recordAdjustment` | yes | `REV-`/`RESTORE-` |
| Legacy sale return | `SaleReturnService` direct `InventoryTransaction::create` + `increment` | yes | **bypassed** |
| Legacy purchase return | `PurchaseReturnService` direct row + `decrement` | yes | **bypassed** |
| Archive / delete product | none | n/a | n/a |

### Consequence

**RISK:** `products.stock_quantity == SUM(inventory_transactions.quantity)` is not structurally
enforced. `php artisan stock:reconcile` reports mismatches but explicitly **does not correct**
them (`StockReconcileCommand`: "Differences are reported, not corrected."). It also reports
negative stock and stock without an `INITIAL` movement.

## 3. `InventoryService` internals

**VERIFIED.** Public methods: `recordPurchase`, `recordSale`, `recordReturn`,
`recordAdjustment`, `recordTransaction` (legacy), plus read methods.

All wrappers call a **private** `applyMovement()` (line 222). `applyMovement`:

1. `Product::lockForUpdate()->findOrFail($productId)` — row lock, no transaction opened;
2. computes `$isReversal = str_starts_with($reference, 'REV-')`;
3. computes `$productAllowsNegative = $product->allow_negative_stock ?? setting(...) ?? true`;
4. throws when `quantity < 0 && stock + quantity < 0 && !isReversal && !productAllowsNegative
   && !($product->track_inventory === false) && !$bypassStockCheck` (line ~246);
5. updates `stock_quantity`, recomputes `status`;
6. if `newStock <= 0` and negatives are not allowed and not a reversal, clamps stock to `0`;
7. inserts `inventory_transactions` with the **original, unclamped** `quantity`.

### Verified defects / limitations

| # | Issue | Evidence | Impact |
|---|---|---|---|
| I1 | `applyMovement` is private, but `TransactionEngine` calls it | `InventoryService.php:222`, `TransactionEngine.php:138` | Fatal error if the engine is ever used |
| I2 | No transaction inside `applyMovement` | service method | Atomicity depends on caller |
| I3 | Stock clamped to 0 but ledger keeps unclamped quantity | `applyMovement` | Ledger drift whenever the guard is bypassed or negatives are disallowed |
| I4 | Any reference starting `REV-` bypasses the negative guard **and** clamping | `applyMovement` | A crafted reversal can push stock negative |
| I5 | `allow_negative_stock ?? setting ?? true` plus model default `true` | `Product::$attributes` | New products allow negative stock unless the form explicitly sets false |
| I6 | Legacy return services bypass both the service and the guard | `SaleReturnService`, `PurchaseReturnService` | Unsafe stock writers remain callable |
| I7 | `quantity` precision is 2 decimals | migration | Cannot represent `0.125 g` / `0.25 ml` exactly |

## 4. Transaction boundaries and concurrency

- `DB::transaction` is opened by `SaleService`, `PurchaseService`, `ProductService` and
  `ReturnService`; `InventoryService` itself does not open one.
- `applyMovement` locks one product row at a time. A multi-item sale locks products in cart
  order. Two concurrent sales with the same products in different orders can deadlock in MySQL;
  there is no retry policy.
- `products.stock_quantity` is the concurrency authority, not the ledger, so a lock on the
  product row is sufficient for a single movement.
- There is **no reservation/available quantity** concept, no warehouse, no transfer.

**Composition consequence:** a multi-component run must lock all component product rows in a
**deterministic order** (e.g. ascending product id) to avoid deadlocks, and must validate every
component before applying the first movement.

## 5. Negative stock and stock validation

- The guard is per movement, not per transaction.
- `bypassStockCheck` comes from the POS confirmation dialog (`bypass_stock_check` in
  `CreateSaleRequest`/`SaleController@store`) and from `SaleService::create($data, $bypass)`.
- The POS pre-check is client-side (`SaleBill.tsx`: `if (product?.track_inventory === false)
  return false`, then compares `stock < baseQty`). It can be bypassed by a crafted request;
  the server guard is the real check, and it can also be bypassed with `bypass_stock_check`.
- `products.track_inventory === false` disables the guard entirely.

## 6. Inventory reporting paths

| Surface | Source | Behavior |
|---|---|---|
| `InventoryService::getOverview` | products + ledger | stock counts; **value uses min sale price**, not cost |
| `InventoryService::getValuation` | products + selling units | **sale-price basis**, not cost |
| `InventoryReportService::stockReport` | products + ledger | cost basis, `uncosted_qty` subtracted, movement summary |
| `InventoryReportService::stockSummary` | products | cost basis (different from `stockReport` row value) |
| `FinancialReportService::overview` / `balanceSheet` | SQL | `GREATEST(stock − uncosted, 0) × average/opening/last/default` |
| `ProductReportService::timeline` | ledger | stock value = `stock × last_purchase_cost` |
| `ProductList.tsx` | props | `last_purchase_cost ?? default_purchase_cost` |

**Composition consequence:** a new movement type must be classified in every one of these or
valuation/stock movement reports will silently misstate inventory.

## 7. Safest integration point for consumption

**PROPOSED.**

1. Add a **public** intention-revealing method on `InventoryService`, e.g.
   `recordConsumption(int $productId, float $baseQuantity, string $reference, ...)`, that calls
   `recordAdjustment(type: 'consumption')`.
2. Wrap the whole execution in `DB::transaction` in the composition service.
3. Sort component rows by product id before locking.
4. Validate every component first:
   - product exists, not archived;
   - `track_inventory` is true (or decide that non-tracked components are allowed);
   - available stock >= required, unless the business explicitly allows negative components;
   - unit is compatible with the component base unit.
5. Apply all consumption movements, then write `composition_run_items` with the actual
   quantities and the returned `inventory_transaction_id`.
6. Snapshot `unit_cost` from `CostResolver` at execution time.
7. Mark the run `completed` with `effects_applied_at`.

**Do not**:
- insert ledger rows directly;
- call `applyMovement` (private);
- reuse `TransactionEngine`;
- create artificial ingredient sale lines;
- write an expense for component consumption.

## 8. Why bypassing the ledger is dangerous

If a formula implementation decrements `products.stock_quantity` directly (as the legacy
purchase-return service does), then:

- `stock:reconcile` reports drift and cannot fix it;
- `InventoryReportService` period movement is wrong because there is no ledger row;
- COGS per component cannot be reconstructed;
- concurrent sales race on a value with no row lock;
- sale deletion/restore cannot reverse the consumption.

The ledger is the only defensible integration point.

## 9. Precision and rounding

- Ledger quantity is decimal(12,2). Formula recipes commonly use grams/ml. A 0.125 g component
  would round to 0.13 at persistence.
- `composition_run_items` should use decimal(14,6), and the ledger should be widened if
  fractional consumption below 0.01 of a base unit is realistic.
- Rounding policy must be explicit: round at the component line, at the run total, or not at
  all. Recommend: store full precision, display rounded.

## 10. Findings summary

1. **VERIFIED:** one ledger, signed quantities, `consumption` type already present.
2. **VERIFIED:** `applyMovement` is private and no transaction is opened there.
3. **VERIFIED:** three stock writers bypass the intended gateway; one writes no ledger at all.
4. **VERIFIED:** the negative-stock guard is bypassable via `REV-`, `bypassStockCheck`, and
   `track_inventory = false`.
5. **RISK:** ledger precision is insufficient for fractional recipe units.
6. **ABSENT:** reservations, warehouses, transfers, production movement type, run linkage.

## 11. Required inventory changes for composition

| Change | Phase | Notes |
|---|---|---|
| Public `recordConsumption()` | P0/P3 | Do not expose `applyMovement` |
| Deterministic lock order in multi-component execution | P3 | Prevent deadlocks |
| Widen ledger quantity precision (optional) | P1 | Business decision |
| Add `composition_run_id` to ledger (optional) | P1 | Strong traceability |
| Classify `consumption` separately in reports | P7 | Currently folded into adjustments |
| Block component archive/delete while used | P1 | Extend `ProductPolicy` |
| Pre-flight availability check | P3 | All-or-nothing |
