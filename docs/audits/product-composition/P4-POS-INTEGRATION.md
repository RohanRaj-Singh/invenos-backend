# P4 - Composition POS Integration

**Date:** 2026-11-15
**Branch:** `feature/product-composition`
**Status:** Implemented. Consumption compositions execute automatically inside the existing sale transaction. No component sale lines, no COGS posting, no return/reversal execution.

---

## 1. Scope

P4 connects the P3 execution engine to the existing POS checkout:

- a consumption-based product remains one commercial sale line;
- its active consumption composition is expanded and consumed automatically;
- component stock and composition runs commit or roll back with the sale;
- simple and assembly products keep their existing sale behavior;
- sale idempotency prevents duplicate consumption on retries;
- multiple composition lines are executed cumulatively against stock;
- sale deletion and sale returns are blocked for composition sales until P6.

P4 does **not**:

- create component sale lines, component revenue, or component payments;
- post composition cost into sale-item COGS (P5);
- restore components on return or deletion (P6);
- execute manufacturing or credit finished goods (P7);
- add a POS consumption editor or reserve inventory;
- change sale pricing, discount, or payment architecture.

---

## 2. Sale transaction integration

`SaleService::create()` keeps its existing `DB::transaction` boundary and adds
`DB::transaction($callback, 3)` deadlock retries. Inside the transaction:

1. Resolve/lock the customer.
2. Create the sale header.
3. For each sale line:
   - lock the parent product;
   - resolve the authoritative selling-unit factor;
   - resolve the active `kind=consumption` composition, if any;
   - create the commercial `sale_items` row;
   - for simple/assembly lines, keep the existing parent `recordSale`;
   - for consumption lines, defer the composition execution.
4. Execute each deferred consumption composition through
   `CompositionExecutionService::executeWithinTransaction()`.
5. Apply customer balance/invoice/cash ledger effects.
6. Commit.

If any composition line fails:

- the sale header and all sale items roll back;
- every earlier composition run and component movement rolls back;
- simple/assembly parent movements from the same sale roll back;
- no cash or invoice ledger row is written;
- idempotency keys are not left reserved.

`executeWithinTransaction()` is the new P3 transaction contract: the caller owns the
transaction; the method does not open a nested transaction.

---

## 3. Product behavior

### Simple product

- No active consumption composition.
- Existing sale-item creation, parent stock movement, pricing, discounts, and payments.
- No composition run.

### Consumption-based product

- Has an active `kind=consumption` composition.
- One commercial sale item for the parent product.
- The parent product is **not** moved in inventory; it is the commercial/service identity.
- `uncosted_qty` is not consumed for the parent.
- Components are consumed through the P3 ledger movements.
- One composition run per sale line.
- Components never appear in `sale_items`.

### Assembly product

- No active consumption composition is used at sale.
- Existing parent stock movement is preserved.
- Assembly components are not consumed at sale; production belongs to P7.
- No composition run.

### Both kinds active

If a product has both active assembly and consumption compositions, P4 treats it as a
consumption product at sale. This keeps the sale-time consumption semantics deterministic.
The ambiguity is documented for P7.

### Mixed carts and multiple lines

- Each commercial cart line remains a separate sale item.
- Each consumption line executes independently.
- Repeated component usage is aggregated within each P3 run, then each run's preflight sees
  stock already reduced by earlier lines in the same sale.
- Shared-component shortages therefore reject the entire sale cumulatively.
- Sale lines are never merged because they share components.

---

## 4. Quantity mapping

The execution quantity is derived from the server-validated sale line:

- `authoritativeBaseUnitQty` comes from `selling_units.quantity` when a selling unit is
  supplied and belongs to the product;
- for a consumption line with no selling unit, the factor is `1` (base unit), never the
  client-submitted `base_unit_quantity`;
- `baseQuantity = packaging_quantity * authoritativeBaseUnitQty`;
- P3 receives `quantity = baseQuantity` and `quantityUnitId = product.base_unit_id`;
- P3 applies composition output scaling and wastage.

Client `base_unit_quantity`/`base_quantity` values are intentionally ignored for consumption
lines. Client price/discount values still affect commercial revenue exactly as before; they
do not affect component quantities.

---

## 5. Composition run linkage

P4 adds nullable `composition_runs.sale_item_id` (migration `2026_11_15_000009`):

- foreign key to `sale_items`, `nullOnDelete`;
- historical runs remain if a sale item is hard-deleted;
- the sale itself is linked through the existing P3 `source_type='sale'` / `source_id=sale.id`;
- `reference` stores the invoice number;
- `sale_item_id` identifies the exact commercial line.

Relationships:

- `Sale::compositionRuns()`
- `SaleItem::compositionRuns()`
- `CompositionRun::saleItem()`

No duplicate execution tables were introduced.

---

## 6. Idempotency

Sale idempotency remains the outer guard:

- the same `sales.idempotency_key` returns the original sale before any transaction;
- a concurrent duplicate collides on `sales_idempotency_key_unique`;
- the SaleService collision check was narrowed to the sales index so a composition-run
  collision cannot be mistaken for a sale retry.

Composition execution uses a deterministic per-line key:

```text
sale:{sale_id}:item:{sale_item_id}:composition:{composition_id}
```

This guarantees:

- one run per commercial line/version;
- distinct keys for multiple composition lines;
- no cross-line collisions;
- retries of a committed sale never re-enter composition execution.

A failed checkout rolls back its pending runs, so no unusable key is reserved.

---

## 7. Stock locking and cumulative validation

P3 remains the authority:

- parent + component product rows are locked in ascending id order;
- stock is re-read after locking;
- all mandatory component quantities are checked before any movement;
- component shortages reject the whole sale;
- `bypass_stock_check` does **not** bypass composition validation.

Multiple composition lines execute sequentially inside the same transaction. Each later run
reads the stock balance already reduced by earlier lines, so shared components are validated
cumulatively rather than independently against the initial balance.

Sale transactions retry up to three times on deadlock, while preserving all transaction
semantics.

---

## 8. Commercial and financial integrity

For a consumption sale:

- one `sales` row;
- one `sale_items` row per commercial line;
- parent product identity, selling unit, quantity, unit price, discounts, totals, payments;
- P3 run and run-item snapshots with component cost and source breakdown;
- internal `consumption` ledger movements.

Not created:

- component sale items;
- component revenue;
- component payments;
- purchase/supplier records;
- production or finished-goods movements.

### Cost boundary

- P4 preserves P3 component cost snapshots.
- `sale_items.cost_price` keeps the existing commercial-product cost resolution.
- P4 does not roll component cost into sale-item COGS and does not change
  `CogsCalculator`.
- P5 owns composition COGS roll-up and report changes.
- Component costs are never replaced with fabricated zero values in run items.

### Discounts and overrides

- Discounts affect commercial revenue only.
- Price overrides affect sale price only.
- Neither changes component consumption.
- There is no POS consumption override payload in P4.

---

## 9. Returns and deletion compatibility

Until P6 implements composition reversal:

- `SalePolicy::canDelete()` blocks deleting a sale that has composition runs;
- `ReturnService::validate()` rejects sale returns for such sales with a validation error;
- the sale, sale items, runs, run items, and consumption movements remain intact;
- components are not automatically restored;
- no composition reversal transactions are created.

This prevents phantom parent stock from the existing sale-item reversal/restock paths. P6
must implement deliberate reversal/return semantics.

---

## 10. Frontend

Minimal changes only:

- `SaleController@create()` exposes `has_consumption_composition` and
  `consumption_composition_version` per product using `withExists`/subquery; no component
  rows or component quantities are sent;
- `SaleBill.tsx` maps the flag, shows a compact "Formula" badge on desktop and mobile cart
  lines, and skips the parent-stock pre-check for composition products;
- `CartItem`/`MobileCartItem` gained optional display-only composition flags;
- no component rows are added to the cart;
- no consumption editor, reservation, or execution button was added;
- barcode/search, units, quantities, discounts, price overrides, payment, and receipt flow
  are unchanged.

The server revalidates everything at checkout.

---

## 11. Authorization

- `POST /sales` continues to use the existing `sales.create` gate:
  - admin and salesman allowed;
  - inactive users denied;
  - guests redirected to login.
- Composition execution is internal to `SaleService`; it does not call an HTTP endpoint and
  does not depend on HTTP composition authorization.
- The P3 admin-only manual execution endpoint remains separate and unchanged.

---

## 12. Tests

New `tests/Feature/Composition/CompositionPosIntegrationTest.php` covers:

- one commercial line + component consumption;
- parent stock unchanged for consumption products;
- selling-unit factor quantity mapping;
- ignoring client base quantities without a selling unit;
- wastage and component cost snapshots;
- multiple composition lines and cumulative shared-component validation;
- shared shortage rollback;
- simple-line rollback when a later composition fails;
- bypass stock check not bypassing composition;
- sale idempotency not repeating consumption;
- discounts/price overrides not changing quantities;
- simple and assembly product regression;
- active composition versions and preserved prior runs;
- deletion/return guards;
- admin/salesman/inactive/guest authorization;
- POS props exposing capability without components.

Verified P4 result: **15 passed (134 assertions)**.

Full suite: **296 passed, 9 failed (1,133 assertions)**. The 9 failures are the same
pre-existing missing Auth/Profile Inertia pages; the baseline remains unchanged.
`npm run build` (including `tsc`) passed. Generated `public/build` artifacts were restored
to their tracked state after verification; rebuild before deployment.

---

## 13. Known limitations

- Composition cost is not yet in sale-item COGS (P5).
- Composition sale deletion/returns are blocked, not reversed (P6).
- Optional components are omitted by default; a composition with only optional components
  cannot be sold through P4 because there is no POS selection UI.
- No per-sale consumption overrides/editor (intentionally excluded).
- Consumption products do not move their own stock; their commercial identity is the sale
  line only.
- True concurrent checkout is enforced by row locks/unique keys/retries but is not exercised
  by a process-level test in this suite.
- Existing client-trusted commercial price/total behavior is preserved; P4 does not redesign
  pricing enforcement.
- No warehouses, reservations, transfers, manufacturing, or component usage reports.

## 14. P5 / P6 / P7 prerequisites

- **P5:** roll composition cost into sale-item COGS or join run items, update reports, and
  reconcile margins without double counting.
- **P6:** implement deliberate sale return/deletion reversal: decide whether components are
  restored, parent stock is restored (only if stocked), and runs are marked reversed.
- **P7:** assembly production, finished-goods costing/stock, and optional nested
  manufacturing.
