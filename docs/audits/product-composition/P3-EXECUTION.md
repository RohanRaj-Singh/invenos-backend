# P3 - Composition Consumption Execution Engine

**Date:** 2026-11-15
**Branch:** `feature/product-composition`
**Status:** Implemented. Consumption engine and admin-only manual execution endpoint. No POS integration, no COGS posting, no manufacturing output, no returns.

---

## 1. Scope

P3 adds the reusable execution engine that:

- resolves an active consumption composition and its nested consumption compositions;
- converts submitted quantities to authoritative base units;
- applies output scaling and component wastage;
- applies transaction-specific actual-consumption overrides without changing the template;
- selects optional components server-side;
- aggregates repeated component requirements while retaining source traceability;
- locks and re-checks authoritative stock before any movement;
- consumes every component atomically through `InventoryService::recordConsumption()`;
- writes an immutable `composition_runs` / `composition_run_items` snapshot;
- snapshots costs and cost basis at execution time;
- enforces DB-backed idempotency for retries;
- writes an `audit_logs` entry for the execution.

P3 does **not**:

- create sale items or component revenue lines;
- post composition cost into sale-item COGS (P5);
- reverse or return consumption (P6);
- produce assembly/finished-goods output (P7);
- add warehouses, transfers, or reservations (not present in this branch);
- execute assembly compositions.

---

## 2. Execution service

`App\Domains\Composition\Services\CompositionExecutionService`

```php
$run = $executions->execute(new ExecuteCompositionData(
    compositionId: $composition->id,
    quantity: 2,                    // number of composition output units
    quantityUnitId: 'piece',        // optional; defaults to composition output unit
    sourceType: 'sale',
    sourceId: $sale->id,
    reference: $sale->invoice_number,
    idempotencyKey: $request->header('Idempotency-Key'),
    createdBy: $user->name,
    optionalItemIds: [42],
    overrides: [
        new CompositionItemOverrideData(41, 3, 'ml'),
    ],
));
```

The service **owns its transaction boundary**. Callers must not wrap it in another
transaction. `InventoryService` does not open a transaction, so the run header, stock
preflight, component movements, run items, cost snapshot, audit entry, and completion all
commit or roll back together.

### Execution algebra

Let:

- `executionBase = convert(quantity, quantityUnitId, product.base_unit_id)`
- `templateOutputBase = convert(composition.output_quantity, composition.output_unit_id, product.base_unit_id)`
- `scale = executionBase / templateOutputBase`

For every included composition item:

- `templateQuantity = item.quantity_base * scale`
- `actualQuantity = overrideBase` when an override exists;
- otherwise `actualQuantity = templateQuantity * (1 + item.wastage_pct / 100)`.

For a nested consumption composition, it is expanded with:

- `nestedScale = parentActualQuantity / convert(nested.output_quantity, nested.output_unit_id, component.base_unit_id)`.

Quantities are rounded to six decimal places after each expansion step, matching the
existing `decimal(14,6)` composition columns and the widened inventory columns.

### Nesting rules

- Only **active consumption** compositions are expanded.
- An **assembly** component is treated as a stocked product. Its BOM is not exploded in P3;
  producing it belongs to P7.
- Nested depth is capped at 20.
- A defensive cycle check rejects a cycle even if a malformed template was written outside
  `CompositionValidator`.
- Nested compositions with no components, archived/deleted components, or non-inventory
  components are rejected.
- Execution of an assembly composition itself is rejected in P3.

### Optional components

- Optional components are **omitted by default**.
- They are included only when their `product_composition_items.id` appears in
  `optionalItemIds`.
- Selecting a mandatory item as optional, selecting an unknown/out-of-tree item, or
  overriding an omitted optional item is rejected with a 422 validation response.
- Selection applies to the execution only. The saved template version is never modified.

### Actual-consumption overrides

- Overrides are keyed by `product_composition_items.id`.
- An override quantity is the **absolute total actual quantity for this run**, not a
  per-output-unit quantity. It replaces scaling and wastage for that source row.
- Overrides may be submitted as `{quantity, unit_id}`; the server converts to the
  component base unit. Clients cannot submit `quantity_base` or costs.
- Unknown, duplicate, zero, or negative overrides are rejected.
- The source template row and its `quantity_base` remain unchanged.
- If one template item is reached through multiple nested paths, the same override applies
  to each occurrence. P3 documents this; path-specific overrides are deferred.

### Aggregation and traceability

Repeated inventory products are aggregated into one requirement for stock checking and one
ledger movement. The aggregated `composition_run_items` row keeps:

- component product id, name, and SKU snapshot;
- base unit and display unit/quantity;
- aggregated scaled template quantity and actual consumed quantity;
- weighted template wastage on the aggregated row, with exact per-source wastage in `source_breakdown`;
- cost and cost basis;
- inventory transaction id;
- `source_breakdown` JSON containing every contributing source with composition id,
  composition version, composition kind, composition item id, depth, template quantity,
  actual quantity, wastage, optional flag, override flag, and display quantity.

This respects the existing unique key `(composition_run_id, component_product_id)` while
retaining full source traceability.

---

## 3. Stock preflight and atomicity

Inside the transaction:

1. Resolve the composition tree.
2. Lock the parent product and all component product rows in ascending id order.
3. Re-read the composition row and verify its version is still active.
4. Create the `pending` run (claims the idempotency key).
5. Validate every aggregated component:
   - exists and is not archived / soft-deleted;
   - tracks inventory;
   - actual quantity is positive;
   - locked `stock_quantity >= actual_quantity`.
6. Consume components through `InventoryService::recordConsumption()`.
7. Write run items with movement ids.
8. Mark the run `completed`, persist costs, and write the audit entry.

Any failure throws out of the transaction. The pending run, movements, run items, and audit
entry are rolled back; the original stock is preserved. P3 is deliberately stricter than
the legacy `allow_negative_stock` setting: composition execution never allows a component
shortage, even when the product would otherwise allow negative stock.

The insufficient-stock exception is:
`App\Domains\Composition\Exceptions\InsufficientComponentStockException`

It exposes `component_product_id`, `component_name`, `required_quantity`, and
`available_quantity` for structured API errors.

---

## 4. Run snapshot

New `composition_runs` columns (migration `2026_11_15_000007`):

- `idempotency_key` unique nullable;
- `output_unit_id`;
- `reference`;
- `location`;
- `cost_basis`.

New `composition_run_items` columns (migration `2026_11_15_000008`):

- `component_name`, `component_sku`;
- `display_unit_id`, `display_quantity`;
- `wastage_pct`, `is_optional`;
- `cost_basis`;
- `source_breakdown` JSON.

The run stores the top-level composition version and `template_snapshot`. Historical runs
remain unchanged when products are renamed, SKUs change, units are renamed, templates gain
new versions, compositions are deactivated, or products are archived. Run item component
names/SKUs and source breakdown are snapshots, not live joins.

There is no warehouse table in this branch. `location` is the execution location from the
request, falling back to `products.location`. "Warehouse" behavior remains out of scope.

---

## 5. Cost snapshots

Component cost is resolved with the existing `App\Domains\Inventory\Services\CostResolver`
at execution time:

- `unit_cost` is per component base unit;
- `total_cost = actual_quantity * unit_cost`;
- `cost_basis` is `exact`, `estimated`, or `unavailable`;
- an unavailable cost is stored as `null`, never `0`;
- if any line cost is unavailable, the run total and run unit cost are `null` and the run
  cost basis is `unavailable`.

P3 does not write these amounts into sale-item COGS. That is P5.

---

## 6. Idempotency

- Unique nullable `composition_runs.idempotency_key` enforces correctness in the database.
- A pre-check outside the transaction returns the original run for a retry.
- Inside the transaction, the pending run claims the key before stock preflight. A
  concurrent duplicate therefore collides on the unique key instead of consuming stock.
- The outer catch looks up the winning run and returns it.
- A failed execution rolls back the pending run, so its key can be retried.
- Scope is global on this single-tenant branch.
- HTTP responses: `201` for a newly created run, `200` when an existing run is replayed.

The execution endpoint accepts the key in the request body or in the `Idempotency-Key`
header.

---

## 7. Manual execution API

All routes are inside the authenticated web group.

| Method | Path | Purpose |
|---|---|---|
| POST | `/inventory/product/{product}/composition/{composition}/execute` | Admin-only manual execution |

`ExecuteCompositionRequest` authorizes `manage` on `ProductComposition`; salesman, guests,
and inactive users are denied. The nested composition must belong to the route product
(404 otherwise).

### Request

```json
{
  "quantity": 2,
  "quantity_unit_id": "piece",
  "source_type": "manual",
  "source_id": null,
  "reference": "MANUAL-1",
  "location": "Treatment room",
  "document_date": "2026-11-15",
  "idempotency_key": "manual-2026-11-15-0001",
  "optional_item_ids": [42],
  "overrides": [
    {
      "composition_item_id": 41,
      "quantity": 3,
      "unit_id": "ml"
    }
  ]
}
```

### Responses

- `201` new run; `200` idempotent replay;
- `422` validation failure or insufficient stock. Insufficient stock includes a
  `component` object with `component_product_id`, `component_name`,
  `required_quantity`, and `available_quantity`;
- `403` unauthorized;
- `404` composition does not belong to the product.

No frontend "consume" action was added in P3. The endpoint exists for manual UAT and P4
will call the service directly from the sale flow.

---

## 8. Precision investigation and migration

The composition tables already used `decimal(14,6)`, but the stock authority and ledger
were `decimal(12,2)`:

- `inventory_transactions.quantity`
- `inventory_transactions.running_balance`
- `products.stock_quantity`
- `products.low_stock_threshold`
- `products.uncosted_qty` (`14,4`)

Fractional component consumption such as `0.125 ml` would otherwise have been truncated to
`0.13` or `0.12`, causing ledger drift and incorrect stock. P3 therefore widens them to
`decimal(14,6)` in migration `2026_11_15_000006`.

Evidence reviewed:

- `InventoryService::applyMovement()` writes product balance and ledger quantity;
- `Product` casts stock quantities to float and reads the widened columns;
- `StockReconcileCommand` compares product stock to the signed ledger; its tolerance was
  tightened from `0.005` to `0.000001` and its displayed diff now uses six decimals;
- composition templates and run items already use `14,6`;
- reports and valuation aggregate the same normalized columns;
- sale/purchase/return item quantity columns are revenue or document quantities, not the
  component stock authority, and were not widened.

The migration only increases scale, so existing values are preserved. The down migration
reverts to `12,2`/`14,4`; rolling back after fractional values exist would truncate them and
is documented as data-lossy.

`CompositionPrecisionTest` asserts the information-schema scale and a fractional
product/ledger round trip.

---

## 9. Tests

P3 tests:

- `tests/Feature/Composition/CompositionExecutionTest.php` (24 tests):
  scaling, output-unit conversion, wastage, overrides, optional selection, unknown
  selections, atomic shortage rollback, archived components, inactive/assembly rejection,
  nested consumption expansion, assembly-as-stock, repeated-component aggregation, cycle
  defense, idempotent retry, failed-key release, DB unique constraint, source metadata,
  cost snapshots, null unavailable cost, snapshot immutability, fractional ledger round
  trip.
- `tests/Feature/Composition/CompositionExecutionApiTest.php` (5 tests):
  admin execution, authorization, structured shortage, validation/ownership, HTTP
  idempotency.
- `tests/Feature/Composition/CompositionPrecisionTest.php` (2 tests):
  schema scale and fractional inventory round trip.

Verified final result: 281 passed, 9 failed (999 assertions). All 9 failures are the
pre-existing missing Auth/Profile Inertia pages, unchanged from P0.1/P2. All 89 composition
tests pass (366 assertions when run as the composition group).

---

## 10. Deferred

- P4 POS integration and cart expansion.
- P5 COGS posting from run items.
- P6 return/reversal behavior for consumed components.
- P7 assembly/finished-goods production and nested manufacturing expansion.
- Frontend consume action.
- Warehouse/transfer/reservation concepts.
- Path-specific overrides when the same template row appears through multiple nested paths.
- Idempotency for purchases/returns.
- Widening sale/purchase/return document quantity columns.
