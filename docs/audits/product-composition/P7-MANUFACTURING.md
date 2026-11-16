# P7 - Manufacturing, Production Costing and Component Usage

**Date:** 2026-11-15
**Branch:** `feature/product-composition`
**Status:** Implemented. Production orders consume components through P3, receive finished goods through the canonical inventory ledger, transfer cost into finished stock, support explicit reversal, and expose component usage reporting. No revenue or manufacturing-driven sale records are created.

---

## 1. Scope

P7 adds real manufacturing on top of the completed composition/consumption domain:

- draft production orders;
- start, cancel, execute and reverse lifecycle;
- assembly-composition execution through P3;
- finished-goods inventory receipt;
- production cost transfer into finished-goods inventory value;
- incomplete-cost handling;
- idempotent completion and reversal;
- production history and component usage reporting;
- admin-only production authorization;
- production UI and report pages.

Not implemented:

- P8 hardening or fashion-branch porting;
- warehouse transfers/reservations;
- purchase-order or supplier workflow redesign;
- component recovery on production reversal;
- manufacturing MRP/scheduling;
- unrelated accounting redesign.

---

## 2. Manufacturing architecture

### Production order

`production_orders` is the single production document. One completed order represents one production execution/output. Multiple outputs are separate orders.

Fields include:

- `production_number` unique;
- finished `product_id`;
- `composition_id` and `composition_version` snapshot;
- `planned_quantity` / `output_unit_id`;
- `actual_output_quantity` / `actual_output_base_quantity`;
- draft/in-progress/completed/cancelled/reversed status;
- `location` snapshot;
- planned/started/completed/reversed timestamps;
- `composition_run_id`;
- known `total_cost`, complete `unit_cost`, `cost_basis`, `cost_complete`;
- finished/reversal inventory transaction ids;
- unique execution/reversal idempotency keys;
- created/completed/reversed user names, reference, notes.

### Lifecycle

```text
draft -> in_progress -> completed -> reversed
  |          |
  +----------+-> cancelled
```

- Draft creation and updates are inventory-neutral.
- Starting an order is inventory-neutral.
- Execution consumes components and receives finished goods atomically.
- Completed production cannot be edited or cancelled as if it never happened.
- Reversal is explicit and only from `completed`.
- Draft/in-progress orders can be cancelled without inventory effects.

---

## 3. Composition execution integration

`ProductionService::execute()` calls:

```php
CompositionExecutionService::executeWithinTransaction($data, ProductComposition::KIND_ASSEMBLY)
```

This keeps one component consumption engine:

- validates the active assembly composition and its version;
- locks component and finished-product rows through P3 ordering;
- performs the P3 stock preflight;
- expands nested consumption composition rules as P3 does;
- applies wastage and actual output scaling;
- writes the immutable composition run and run items;
- snapshots component costs;
- preserves P3 idempotency.

P3 now has a `requiredKind` parameter; POS consumption remains consumption-only.

Production execution source metadata:

- `source_type = 'production'`;
- `source_id = production_orders.id`;
- `reference = production_number`;
- deterministic run key `production:{order_id}:execute`.

No sale, customer payment, cash receipt, purchase, payable or invoice is created.

---

## 4. Finished-goods inventory

Finished goods are received through `InventoryService::recordProduction()`:

- canonical `inventory_transactions.type = 'production'`;
- positive quantity in the product base unit;
- `reference_type = 'production'`, `reference_id = production_orders.id`;
- unit cost is the completed production unit cost, or `null` when incomplete;
- no direct stock-column mutation outside the canonical inventory service.

The ledger/report layer was extended:

- `InventoryReportService::stockMovement` now reports a net `produced` bucket;
- `ProductReportService` includes total produced;
- `StockReconcileCommand` remains ledger-based;
- the UI movement config recognizes `production`.

### Location

The branch has a product `location` string and no warehouse/location ledger or location table. P7 stores the production location snapshot on the order/run and uses it for display/filtering, but stock remains single-location. There is no per-location stock reservation or transfer. This is an explicit limitation pending a warehouse architecture.

---

## 5. Production costing

Production cost comes from the immutable P3 run:

```text
known production cost = sum(composition_run_items.total_cost where not null)
```

If every run-item cost is known:

```text
total production cost = known cost
finished unit cost    = known cost / actual output base quantity
```

The finished product moving average is updated using the existing weighted-average convention over costed quantity only. Existing uncosted stock is quarantined in `uncosted_qty`; it is not blended into the new average.

If any component cost is unavailable:

- the production order keeps the known component subtotal;
- `cost_complete = false`;
- `unit_cost = null`;
- the finished quantity is added to `products.uncosted_qty`;
- `average_cost` is not updated;
- the production inventory movement stores `unit_cost = null`;
- no zero cost is fabricated.

The historical production order and composition run are immutable. Component cost changes, composition changes, renaming or archival do not rewrite them.

### Future finished-goods sale

When the finished good is sold later:

- it follows the existing simple/assembly sale flow;
- stock is deducted once;
- P5 COGS uses the finished product's cost snapshot;
- no components are consumed again;
- production is not revenue.

Incomplete production stock remains uncosted. The existing simple-product COGS path does not have a completeness flag for uncosted stock; this limitation is documented for P8/hardening rather than hidden.

---

## 6. Reversal

Production reversal is separate from P6 sale returns and material recovery.

`ProductionService::reverse()`:

- requires `completed`;
- locks the order and finished product;
- verifies current finished stock is at least the produced base quantity;
- writes a negative canonical `production` movement with `REV-{production_number}`;
- uses the original production unit cost snapshot;
- marks the order `reversed`, storing reversal transaction and key;
- preserves the original run, run items and component movements;
- **does not restore components**;
- creates no refund, sale, purchase, payable or customer balance event;
- notifies audit log `production.reversed`.

Idempotency:

- unique `production_orders.reversal_idempotency_key`;
- duplicate replay returns the reversed order;
- only one reversal movement is possible.

If finished goods were sold or otherwise reduced below produced quantity, reversal is rejected with a validation error. There is no batch-level inventory identity, so the check is quantity-based across the product; this is a documented limitation.

---

## 7. Idempotency and transaction integrity

- Production execution is one DB transaction: order lock, P3 consumption, cost transfer, finished receipt, order completion, audit.
- Any failure rolls back the run, component movements, finished movement and order update.
- Unique `production_orders.idempotency_key` prevents duplicate completion keys.
- The P3 run key is deterministic per order.
- Unique `reversal_idempotency_key` prevents duplicate reversal.
- Duplicate execution with the same key returns the completed order without producing again.

---

## 8. Reporting

### Component usage report

`ProductionReportService::componentUsage()` combines:

- manufacturing consumption from production orders/run items;
- POS consumption from sale-linked composition runs;
- material recovery from completed `return_component_recoveries`;
- production reversal status on manufacturing rows (`completed` / `reversed`).

Each row carries:

- source;
- document number/date;
- finished product;
- component product/name/unit;
- actual consumed quantity;
- template quantity and wastage quantity;
- unit cost and total cost;
- cost basis and completeness;
- production output quantity and production total cost;
- location and production status.

Summary exposes manufacturing/POS/recovered/net quantities, production output/cost, completeness and uncosted line count. Aggregation by component is also returned.

### Production history report

Lists orders, outputs, costs, statuses, completed dates and summary output/cost totals.

### Financial reports

- Production creates no revenue or sales COGS.
- Component consumption is already visible in the inventory ledger.
- Finished-goods inventory value increases through `average_cost` when complete; incomplete output is quarantined as uncosted.
- P5 sales COGS remains the only sale-profitability path; P7 does not touch revenue or sale profitability.
- Financial position inventory value reflects the finished stock and average cost; incomplete produced stock is excluded from valued quantity via `uncosted_qty`.

---

## 9. Security

New gates:

- `production.view`: admin only;
- `production.manage`: admin only.

Server enforcement:

- controller/request authorization;
- product must be active and track inventory;
- composition must be active, assembly-kind and belong to the product;
- composition version must match the order at execution;
- run/order ownership is implicit through the production order;
- client cannot submit component identities, component costs or finished unit costs;
- actual output quantity and unit are server-validated/converted;
- location is stored as a single-location snapshot; no cross-company scoping exists on this branch.

Salesman production access is denied; coverage is in the manufacturing tests.

---

## 10. Schema changes

### `2026_11_15_000013_extend_inventory_transaction_types_for_production`

Adds `production` to `inventory_transactions.type`. Reversal uses the same type with a negative quantity and `REV-` reference.

### `2026_11_15_000014_create_production_orders_table`

Additive table with product/composition/run and inventory-transaction foreign keys, decimals `14,6`, unique production number, execution/reversal idempotency keys, status and lifecycle timestamps.

No existing rows are destroyed. Rollback of the enum would require removing production rows first.

---

## 11. UI

- `/production` - production order list, status/search, links.
- `/production/create` - product/assembly formula selection, planned quantity/unit, location, date, notes, component preview.
- `/production/{id}` - status, planned/produced/cost, component run items, finished receipt, start/cancel/execute/reverse actions, draft edit.
- `/reports/component-usage` - cross-source usage report.
- `/reports/production-history` - production history report.
- Sidebar entry and report links added.

All pages use the existing Inertia/React shell and current UI primitives.

---

## 12. Tests

`tests/Feature/Composition/CompositionManufacturingTest.php` - **12 passed (124 assertions)**:

- draft neutrality and update;
- successful production/component consumption/finished receipt;
- finished goods sold later at production cost;
- incomplete cost quarantine;
- insufficient component atomic rollback;
- reversal without component restoration;
- reversal idempotency and unsafe-stock rejection;
- execution idempotency;
- manufacturing usage report;
- POS consumption in the usage report;
- admin pages/reports and salesman denial.

Broader P7/P5/P4/report regression command:

```text
php artisan test --filter='CompositionManufacturingTest|CompositionCostingTest|CompositionPosIntegrationTest|CogsConsistencyTest|FinancialReportsTest|ReportsTest'
→ 49 passed (400 assertions)
```

Full suite:

```text
php artisan test
→ 350 passed, 9 failed (1,446 assertions)
```

The 9 failures are the same pre-existing missing Auth/Profile Inertia pages. Baseline was 338 passed / 9 failed (P6); P7 adds 12 passing tests.

`php artisan migrate --force` applied migrations 013 and 014. `npm run build` including `tsc` passed. Generated `public/build` artifacts were restored after verification; rebuild before deployment.

---

## 13. Known limitations

- No warehouse/location ledger: production location is a snapshot, not per-location stock.
- Reversal is quantity-based across the finished product; it cannot identify a specific production batch after commingling.
- Reversal does not restore consumed components; component recovery is a separate policy and is not implemented.
- Incomplete production cost leaves finished stock uncosted; the existing simple-product COGS path does not carry a completeness flag for that stock.
- One production execution/output per order; multiple outputs use multiple orders.
- No production reservations, scheduling, MRP, work centers or labor/overhead allocation.
- No batch/lot/expiry tracking.
- Production history and usage reports aggregate in PHP for clarity; large datasets may need query optimization.
- Single-tenant/company model; no organization/company ownership columns.

## 14. P8 prerequisites

- Decide whether production reversal should ever restore components through a separate, explicit recovery workflow.
- Add warehouse/location stock if multi-location manufacturing is required.
- Add a production-cost completeness signal to simple/assembly sale COGS for uncosted finished stock.
- Consider batch/lot identity if exact production-batch reversal is required.
- Add production reservation/scheduling only if the business model requires it.
- Harden report performance and authorization/company scoping in P8.
