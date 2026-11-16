# P6 — Composition Returns, Reversals and Material Restoration

**Date:** 2026-11-15
**Branch:** `feature/product-composition`
**HEAD:** `50be1bd` (no commit created)
**Status:** Implemented. Commercial returns are enabled for consumption composition sales. Material restoration is explicit, proportional, idempotent and never automatic.

---

## 1. Scope

P6 closes the loop opened by P4/P5: a consumption-based product sold through POS can now be returned without corrupting inventory, cost or history.

Implemented:

- commercial sale returns for composition sale lines (full and partial);
- explicit, verified material recovery with an immutable link to the original composition run;
- canonical inventory restoration movements;
- DB-backed idempotency for both refunds and restoration;
- COGS reversal integrated with P5's canonical calculator;
- sale-deletion protection extended to returns;
- recovery UI on the existing return screen + a real server-backed return detail view;
- 30 dedicated tests plus updates to the P4 test that asserted the temporary "returns blocked" guard.

Not implemented (deliberately): manufacturing/production orders, finished-goods output, component-usage reports, warehouses/transfers/reservations, and any redesign of the commercial return architecture.

---

## 2. Return architecture (unchanged spine)

`App\Domains\Returns\Services\ReturnService` remains the canonical implementation:

```text
createReturn (pending)  →  completeReturn (effects applied once)  →  reverseReturn (compensating rows)
                        ↘  cancelReturn (no effects)
```

P6 adds behaviour inside those three methods; it does not add a competing return system.

| Concern | Owner |
| --- | --- |
| Refund, credit note, cash ledger, returned quantity, sale `return_total` / `return_status` | `ReturnService` (existing) |
| Material recovery eligibility, restoration, recovery audit | `CompositionReturnRecoveryService` (new) |
| Inventory ledger | `InventoryService` (existing) |
| COGS | `CogsCalculator` (existing, unchanged) |

---

## 3. Commercial return semantics

### 3.1 Composition lines and the commercial product

A consumption sale line never moved the sold product's own stock at checkout (P4). P6 therefore **skips the parent product restock for any sale line that has completed composition runs**, regardless of the `restock` flag.

Without that rule a refund would create phantom stock: the commercial identity was never deducted, so there is nothing to give back. This is enforced in `ReturnService::applyStock()` via `CompositionReturnRecoveryService::isCompositionSaleItem()`.

Simple and assembly lines keep the pre-existing behaviour byte-for-byte (`sale-return` when `restock`, `damage` in/out when not).

### 3.2 Refund vs. restoration

Three quantities are kept distinct and are never treated as equal:

| Quantity | Source |
| --- | --- |
| Commercial returned quantity | `return_items.quantity` / `base_quantity` (user-entered, validated against sold quantity) |
| Refund amount | `returns.refund_amount` (cash ledger `refund` row) |
| Recoverable component quantity | derived from the immutable `composition_run_items` snapshot |
| Actually restored quantity | `return_component_recoveries.recovered_quantity` |

A refund with no recovery rows changes money and balances only.

---

## 4. Material recovery policy

### 4.1 Default

**No automatic restoration.** A commercial refund never returns components to inventory. `material_recoveries` is empty by default at every layer (DTO, request validation, UI).

### 4.2 Explicit policy model

Rather than storing a policy enum, the policy is expressed by facts:

- no recovery rows → `no_material_restoration` (the default);
- recovery rows with quantities → explicit, audited restoration of exactly those quantities.

That satisfies the three conceptual policies from the brief without a column that could contradict the recovery rows.

### 4.3 Eligibility calculation

For a returned commercial quantity `q` on sale line with sold quantity `S`:

```text
previouslyReturned = Σ quantity of COMPLETED returns for the line
cumulative         = previouslyReturned + q
proportion         = min(1, cumulative / S)

for each run item (immutable snapshot):
    basis            = min(template_quantity, actual_quantity)     // consumed material, excluding wastage
    alreadyRestored  = Σ recovered_quantity of COMPLETED returns for that run item
    eligible         = max(0, basis × proportion − alreadyRestored)
```

Properties:

- cumulative proportionality, so multiple partial returns never exceed the consumed material;
- `basis` uses the **template** quantity, so wastage is excluded;
- an override that consumed more than the template cannot raise the ceiling (`min`);
- `basis` and `alreadyRestored` come from persisted run snapshots and completed return documents, never from the request.

### 4.4 Wastage

P3 stores `actual_quantity = template_quantity × (1 + wastage/100)` (or the explicit override). Wastage is material that did not become product and is therefore not recoverable. The ceiling is `min(template, actual)`; the UI shows the non-restorable remainder (`wastage_quantity`) but never offers it as an input.

### 4.5 Repeated and nested components

P3 already flattens nested consumption compositions and aggregates repeated components into **one** `composition_run_items` row per component per run. Recovery therefore:

- keys on `composition_run_item_id`, not on the product or the template row;
- restores a repeated component once, via the single aggregated row;
- works for nested compositions without any template traversal at return time.

---

## 5. Restoration execution

`CompositionReturnRecoveryService::restore()` runs **inside** the `completeReturn` transaction:

1. re-resolves eligibility from live state (another return may have completed while this one was pending);
2. rejects a declared quantity that no longer fits;
3. writes one canonical movement per component through
   `InventoryService::recordReturn(returnType: 'sale')` → `inventory_transactions.type = 'sale-return'`;
4. stamps `inventory_transaction_id`, `restored_at` and the re-validated eligible quantity on the recovery row;
5. writes an `audit_logs` entry (`composition.return_recovered`).

Properties:

- movement `reference` = return number, `reference_type = 'return'`, `reference_id` = return id;
- no direct stock mutation, no parallel ledger;
- no purchase bill, no supplier payable, no production movement;
- the composition run and its items are never modified;
- unit cost is the **run-item snapshot**, never the current component cost;
- quantities are the component base unit, matching P3's `decimal(14,6)` precision.

**Reversal:** `reverseReturn` already finds movements by `reference = return_number` and negates them with a `REV-` prefix. Because restoration movements use that reference and type, they are compensated automatically — no new reversal path, and no risk of double reversal.

---

## 6. Idempotency

| Guarantee | Mechanism |
| --- | --- |
| Duplicate return request creates one return | `returns.idempotency_key` unique index + pre-check + `QueryException` replay, mirroring `sales.idempotency_key` |
| Duplicate completion applies effects once | existing `status`/`effects_applied_at` guard inside a `lockForUpdate` transaction |
| Duplicate restoration of the same consumed line | unique `(return_item_id, composition_run_item_id)` on `return_component_recoveries` |
| Retry after a failed completion | the whole transaction rolls back (rows, movements, refund, ledger); the return stays `pending` and can be retried |
| Multiple legitimate returns | separate return documents each get rows keyed by their own `return_item_id` |
| Multiple legitimate restoration events | each return restores its own proportional share; eligibility is recomputed against completed returns |

`completeReturn` additionally re-validates over-return at completion time (`assertQuantitiesStillReturnable`), closing the gap where two pending returns could each pass creation and then both complete.

---

## 7. Costing and profitability

No change to `CogsCalculator` was needed or made.

- Composition COGS remains `Σ composition_run_items.total_cost` for completed runs (P5).
- Return COGS remains proportional: `returned_base_quantity × (line_total_cost / line_base_quantity)` — which is exactly correct for composition lines.
- A refund without recovery reverses COGS; a refund with recovery reverses the *same* COGS once. Restoration is an inventory movement and creates **no** additional COGS or valuation adjustment.
- Reversed returns (`status = 'reversed'`) are excluded from the returned-COGS query, so COGS returns to the original value.
- `composition_runs.status` stays `completed`; P6 never marks a run reversed, because that would silently remove historical COGS from every report.
- Run item costs are never rewritten; changing a component's cost afterwards does not alter history (covered by test).

Partial returns allocate cost proportionally through the existing returned-quantity mechanism; no new allocation scheme was introduced.

---

## 8. Historical integrity and deletion

- `SalePolicy::canDelete()` still blocks deleting a sale with composition runs.
- It now also blocks deleting a sale that has `pending`/`completed` return documents. Composition returns perform no parent stock movement, so the previous ledger-based check could not see them.
- Returns have no delete route; they are cancelled or reversed, never removed. Soft-delete fields exist but are not exposed by any endpoint, so a refund/restoration can never be orphaned by deletion.

---

## 9. Security

| Control | Implementation |
| --- | --- |
| Authorization | `returns.create` / `returns.process` gates unchanged (admin-only). Recovery happens inside completion, so it shares the `returns.process` gate. |
| Sale-line ownership | **New:** a returned `reference_item_id` must belong to the referenced sale/purchase (`assertItemBelongsToReference`). Previously a crafted line from another invoice validated cleanly. |
| Run ownership | Recovery must reference a `composition_run_items.id` belonging to that sale item's completed runs; anything else is rejected. |
| Component identity / unit / cost | Never accepted from the client. Only `composition_run_item_id` + `quantity` are read; everything else is resolved server-side. |
| Recovered quantity | Clamped by server-side eligibility; over-declaration is rejected with a 422/validation error. |
| Refund amount | Unchanged rules (`0 … grand_total`), still server-validated. |
| Cross-company | Not applicable: this branch is single-tenant (`BusinessContext`). Composition and return rows carry no company columns, by design (P1). |
| Frontend | Buttons are hidden/disabled for unauthorized users, but the server re-checks; the salesman case is covered by a test. |

---

## 10. Frontend

### 10.1 Return screen (`resources/js/Pages/returns/ReturnPage.tsx`)

- Composition sale lines carry a `Formula` badge (desktop and mobile).
- Selecting composition lines reveals a **Recovered materials (optional)** panel:
  - explicit per-component numeric inputs, default empty/zero;
  - ceiling recalculated from the returned quantity (`per_unit_quantity × returnQty − restored`);
  - wastage and previously restored quantities shown as non-editable context;
  - "a refund does not restore ingredients" copy, and nothing is written to inventory until completion.
- Invoices containing composition lines are submitted to the canonical server workflow (`POST /returns/sale`) with an idempotency key; simple-only invoices keep the pre-existing client recording path unchanged.
- Submit is disabled for users without `returns.create` and while a request is in flight.

### 10.2 Return detail (`resources/js/Pages/returns/SaleReturnDetail.tsx`)

- Renders server data when `ReturnWorkflowController@show` provides a `return` prop, falling back to the previous mock view otherwise (no regression for the prototype pages).
- Shows status, returned items, credit note, refund, and a separate **Material Restoration** card with per-component recovered quantity, snapshot cost and `Restored`/`Pending` status.
- When nothing was recovered it states explicitly that a commercial refund does not return ingredients.
- Complete / Cancel / Reverse actions are shown only when `canProcess` (from `returns.process`).

---

## 11. Schema changes

Two additive migrations, no destructive change:

### `2026_11_15_000011_add_idempotency_key_to_returns_table`

- `returns.idempotency_key` varchar(100) nullable
- unique `returns_idempotency_key_unique`

### `2026_11_15_000012_create_return_component_recoveries_table`

| Column | Purpose |
| --- | --- |
| `return_id`, `return_item_id` | owning return (cascade delete with the return/item) |
| `composition_run_id`, `composition_run_item_id` | immutable consumption snapshot (RESTRICT) |
| `component_product_id`, `component_name`, `unit` | component identity snapshot (RESTRICT) |
| `basis_quantity` | recoverable basis = `min(template, actual)`, wastage excluded |
| `eligible_quantity` | proportional cap for this return line |
| `recovered_quantity` | verified restored quantity |
| `unit_cost`, `total_cost` | cost snapshot copied from the run item |
| `inventory_transaction_id` | canonical movement (RESTRICT) |
| `restored_at`, `created_by` | audit |
| unique `rcr_item_run_item_unique` | `(return_item_id, composition_run_item_id)` — DB-level duplicate guard |

Indexes: `return_id`, `composition_run_id`, `component_product_id`. Precision is `decimal(14,6)` throughout, consistent with P3/P5.

No `company_id`/`organization_id` was introduced, keeping the tables portable to the fashion branch (P8).

---

## 12. Reports

- Sales profit / P&L / financial overview / day book / balance sheet: unchanged code path, but now correct for composition returns because `CogsCalculator::returned()` already allocates composition line cost. Verified by tests (`net` drops by the returned share, never below zero, never twice).
- Inventory movement reports see restoration as a `sale-return` inflow on the component — not a purchase, not a `consumption` reversal, not an adjustment.
- Customer balance / cash: credit note and refund behave exactly like simple returns (single refund row per return, `event_key = refund:{id}:{number}`).
- Component usage reporting remains P7 scope.

---

## 13. Tests

`tests/Feature/Composition/CompositionReturnsTest.php` — **30 tests, 112 assertions**, all passing.

| Group | Coverage |
| --- | --- |
| Commercial | full return without restoration, refund vs credit note, partial + multiple returns, over-return rejection, sale-line ownership, run immutability |
| Material | explicit recovery + canonical movement, partial recovery, multiple components, wastage ceiling, proportional eligibility, per-return share, non-composition rejection, foreign run item rejection, nested/repeated-component aggregation, base-unit restoration, no purchase/payable |
| Idempotency | same key → one return, DB unique key, double completion, completion-time revalidation + rollback, DB unique recovery row |
| Costing | full/partial COGS reversal, no double reversal on restoration, historical cost stability after component cost change |
| Reversal | compensating restoration + refund, re-restoration after reversal |
| Lifecycle | sale with a return cannot be deleted |
| Security/HTTP | salesman forbidden, admin create+complete over HTTP, forged recovered quantity rejected |

Updated: `tests/Feature/Composition/CompositionPosIntegrationTest.php` — the P4 guard test now asserts that deletion stays blocked while returns are allowed and restore nothing by default.

### Verified results

```text
php artisan test tests/Feature/Composition/CompositionReturnsTest.php
→ 30 passed (112 assertions)

php artisan test tests/Feature/Composition tests/Feature/Returns   (baseline was 124)
→ 154 passed

php artisan test
→ 338 passed, 9 failed (1,322 assertions)
```

The 9 failures are the pre-existing missing Auth/Profile Inertia pages documented in `P0.1-FINALIZATION.md`; running `tests/Feature/Auth tests/Feature/ProfileTest.php` in isolation reproduces exactly those 9. Baseline before P6 was 308 passed / 9 failed.

```text
npm run build   → passed (tsc + vite)
vendor/bin/pint → changed P6 files clean (repository-wide pre-existing violations untouched)
```

Generated `public/build` artifacts were restored to their tracked state after verification; rebuild before deployment.

---

## 14. Files changed

**New**
- `app/Domains/Composition/Services/CompositionReturnRecoveryService.php`
- `app/Models/ReturnComponentRecovery.php`
- `database/migrations/2026_11_15_000011_add_idempotency_key_to_returns_table.php`
- `database/migrations/2026_11_15_000012_create_return_component_recoveries_table.php`
- `tests/Feature/Composition/CompositionReturnsTest.php`
- `docs/audits/product-composition/P6-RETURNS-REVERSALS.md`

**Modified**
- `app/Domains/Returns/Services/ReturnService.php` (recovery integration, ownership validation, idempotency, completion re-validation)
- `app/Domains/Returns/DTOs/ReturnCreateData.php` (`idempotencyKey`)
- `app/Domains/Returns/DTOs/ReturnItemData.php` (`materialRecoveries`)
- `app/Models/ReturnModel.php`, `app/Models/ReturnItem.php` (relations, fillable)
- `app/Http/Controllers/ReturnWorkflowController.php` (validation, recovery props, `canProcess`)
- `app/Policies/Lifecycle/SalePolicy.php` (return-document deletion block)
- `routes/web.php` (recovery context for the return screen)
- `resources/js/Pages/returns/ReturnPage.tsx`, `resources/js/Pages/returns/SaleReturnDetail.tsx`
- `tests/Feature/Composition/CompositionPosIntegrationTest.php`
- `docs/audits/product-composition/18-implementation-roadmap.md`

---

## 15. Known limitations

- Restoration ceiling is `min(template, actual)`. If a business considers some wastage physically recoverable, that needs an explicit, audited adjustment policy that P6 deliberately does not provide.
- Recovery is per return line and per consumed run item; there is no "restore across several runs in one row" concept (the aggregated run item already covers repeated components).
- Recovery unit cost is the run-item snapshot and does not update the component's weighted-average cost. Restored stock is valued at its historical cost, which is intentional but means average cost can drift from physical reality after many returns.
- The parent product is never restocked for consumption sale lines; a product that both tracks inventory and has a consumption composition cannot have its own stock returned.
- Over-return at completion is validated per item, but two concurrent completions of *different* returns still rely on row locks/unique keys rather than a serializable isolation level.
- Returns cannot be hard-deleted (no route); permanent cleanup only happens through the existing reset command, which truncates the new table too.
- The return screen is server-backed only for invoices containing composition lines; simple-product returns still use the pre-existing client-side recorder.
- No component-usage or restoration reporting (P7).

---

## 16. P7 prerequisites

- Production/assembly execution must emit its own `reversed`/compensating semantics; P6 deliberately leaves `composition_runs.status` untouched for consumption returns.
- If P7 adds finished-goods output, it must define whether a produced good's sale return restocks the good (yes, as a stocked product) versus restoring components (no).
- A production reversal will need the same separation P6 established: commercial reversal ≠ material recovery.
- Component-usage reporting (P7) can read `return_component_recoveries` alongside `composition_run_items` to net consumption.

## 17. P8 prerequisites

- `return_component_recoveries` and `returns.idempotency_key` are additive and carry no company/organization columns. Porting to the fashion branch needs only a fashion-side migration if per-company scoping is required.
- `ReturnService` now depends on `CompositionReturnRecoveryService`; the fashion branch must port the composition domain together with it.
- Fashion-side company ownership checks must be added to the recovery path (sale ownership, component ownership, warehouse/location) at port time.
