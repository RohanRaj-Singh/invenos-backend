# P11 — Inventory, POS, Formula, Sales, COGS & Return Integrity Audit

**Date:** 2026-11-15
**Branch:** `feature/product-composition`
**HEAD:** `50be1bd911f8c0ad46a9232aac4396837f457843` (no commit)
**Status:** Audit complete for the agreed scope. Confirmed defects remediated with regression tests.
Multi-company isolation is **not implemented on this branch** and is disclosed, not claimed.

---

## A. Executive summary

The composition/formula execution core is sound. Recursive explosion, unit conversion, atomic
deduction, row locking, idempotency, immutable run snapshots and COGS derivation from actual
consumed quantities all hold up under inspection and test.

The defects found were at the **boundaries**: what the server accepted from the client, and what
services allowed to be mutated. Three of them were confirmed and fixed:

1. **P1** — `POST /inventory/adjust` accepted formula-only products, letting an admin create
   phantom stock on a record that has no stock by design.
2. **P1** — Sale line totals and the document discount were accepted verbatim, so a crafted
   request could record revenue unrelated to the quantity sold, or a negative sale.
3. **P1** — Return values were only bounded by the client's own figures, so a return could credit
   more than the original document was worth.

One further confirmation, fixed as part of item 2: `payment_status` was stored exactly as the
client claimed it, so a sale with a partially paid amount could be recorded as `paid`.

Nothing in the inventory ledger, COGS path, snapshots, or recovery logic was rewritten. No
historical data was mutated.

---

## B. Architecture map

### Canonical services

| Concern | Service | Notes |
|---|---|---|
| Stock mutation (all types) | `InventoryService::applyMovement` | Single choke point: locks product, applies signed quantity, recomputes status, writes ledger row |
| Stock balance | `products.stock_quantity` | Maintained only by `applyMovement` |
| Stock ledger | `inventory_transactions` | Signed quantity; `SUM(quantity)` is the reconciliation target |
| Sale creation | `SaleService::create` | One DB transaction: sale, items, stock, runs, COGS, ledger, balances |
| Purchase receiving | `PurchaseService` | Weighted average over costed quantity, then `recordPurchase` |
| Composition execution | `CompositionExecutionService` | Explode → aggregate → order-lock products → lock composition → preflight → move stock → snapshot |
| Composition template | `CompositionService::save/update` | Versioned; never moves stock |
| COGS | `CogsCalculator` | Derives from `sale_items.cost_price` + `cost_complete`, never from current costs |
| Return/recovery | `ReturnService` + `CompositionReturnRecoveryService` | Commercial refund and material recovery are separate concerns |
| Cash/party ledger | `CashLedgerService`, `PartyBalance` | `event_key` gives idempotency per document event |

### Data flow

```text
POS/cart (client amounts)
   └─ POST /sales → CreateSaleRequest → CreateSaleData/SaleItemData
        └─ SaleService::create  [DB::transaction]
             ├─ Sale + SaleItem rows
             ├─ simple/assembly: InventoryService::recordSale → products.stock_quantity
             ├─ formula: CompositionExecutionService::executeWithinTransaction
             │     ├─ component locks (sorted, deterministic)
             │     ├─ preflight stock check
             │     ├─ InventoryService::recordConsumption per component
             │     └─ CompositionRun + CompositionRunItem (immutable snapshot + cost)
             ├─ SaleItem.cost_price / cost_complete from run items
             ├─ PartyBalance + CashLedgerService
             └─ rollback on any failure
```

**Key structural finding:** the formula's own `products.stock_quantity` is never touched by
checkout. `SaleService` defers composition lines and `continue`s before `recordSale`. Verified by
test, not by reading alone.

---

## C. Integrity invariants and results

| # | Invariant | Verification | Result |
|---|---|---|---|
| 1 | Stock cannot go negative when the policy forbids it | `applyMovement` guard + `InsufficientComponentStockException` | **Holds** |
| 2 | Stored stock reconciles with the ledger | `php artisan stock:reconcile` + per-product audit script | **Holds** for all transaction-backed products; 2 legacy fixtures deviate (see E) |
| 3 | Adjustments cannot bypass validation | New formula-only guard | **Holds** (was violated) |
| 4 | Movements are not duplicated | Idempotency keys + `event_key` + unique constraints | **Holds** |
| 5 | Repeated requests do not double-deduct | `SaleIdempotencyTest`, execution idempotency | **Holds** |
| 6 | Unit conversions are consistent | `CompositionExecutionTest`, `CompositionPrecisionTest` | **Holds** |
| 7 | Purchase quantities convert to stock units | `PurchaseService` `baseQuantity = packQty × purchaseQuantity` | **Holds** |
| 8 | Selling quantities convert to stock units | Server re-resolves `selling_units.quantity`; client `base_unit_quantity` ignored | **Holds** |
| 9 | Formula-only products cannot receive stock | New guard + purchase picker exclusion | **Holds** (was violated via adjust) |
| 10 | Formula consumption deducts actual ingredient quantities | `FormulaRuntimeTest`, new integrity test | **Holds** |
| 11 | Formulas do not appear as physical inventory | P10 scope + report exclusions | **Holds** |
| 12 | Ordinary products unaffected by formula rules | `excludingFormulaOnly` only excludes consumption-only rows | **Holds** |
| 13 | Warehouse-specific stock correct | No warehouse dimension exists on this branch | **N/A — disclosed** |
| 14 | Company-specific stock isolated | No company dimension exists on this branch | **N/A — disclosed** |
| 15 | Historical movements immutable | No update/delete path on ledger rows; corrections are compensating movements | **Holds** |

---

## D. Findings register

### P1-01 — Formula-only products accepted stock adjustments (Fixed)

- **Severity:** P1 (unauthorised stock manipulation surface)
- **Reproduction:** as admin, `POST /inventory/adjust` with `product_id` of a product whose only
  active composition is a consumption formula and `quantity: 50`.
- **Before:** 302 redirect, product `stock_quantity` became 50, an `inventory_transactions` row was
  written. Nothing would ever consume it, so it permanently inflated stock value.
- **Root cause:** `InventoryController::adjust` validated only existence + not archived. P10 fixed
  the UI (`Adjust Stock` disabled) but not the server.
- **Files:** `app/Http/Controllers/InventoryController.php`
- **Fix:** reject when `Product::isFormulaOnly()`; message points to ingredient products.
- **Regression:** `FormulaStockAndAmountIntegrityTest::test_stock_adjustment_rejects_a_formula_only_product`
  and `..._still_works_for_a_physical_product`.

### P1-02 — Client-supplied line total accepted without bound (Fixed)

- **Severity:** P1 (financial corruption)
- **Reproduction:** `POST /sales` with `quantity: 2`, `unit_price: 100`, `total: 5000`.
- **Before:** accepted. `sale_items.total` = 5000, `sales.subtotal` = 5000, revenue reports
  inflated, customer balance and cash ledger built from the inflated figure.
- **Root cause:** `CreateSaleData::fromRequest` copied `total` verbatim; `SaleService` only checked
  quantity/price signs, never their relationship to the total.
- **Files:** `app/Domains/Sales/Services/SaleService.php`
- **Fix:** reject `total < 0` and `total > packagingQuantity × unitPrice + 0.01`.
  A line may still be discounted to zero, and `unit_price` remains a deliberate override.
- **Regression:** `test_sale_rejects_a_line_total_above_quantity_times_price`.

### P1-03 — Document discount unbounded (Fixed)

- **Severity:** P1 (financial corruption)
- **Reproduction:** `POST /sales` with `subtotal 100`, `discount: 500`.
- **Before:** `grand_total = -400` stored. Financial reports summed a negative sale, customer
  balance decreased, and the invoice memo wrote a negative amount.
- **Root cause:** `CreateSaleRequest` only required `numeric|min:0`; `SaleService` subtracted
  without checking.
- **Files:** `app/Domains/Sales/Services/SaleService.php`
- **Fix:** reject `discount < 0` or `discount > subtotal + 0.01`; grand total is rounded.
- **Regression:** `test_sale_rejects_a_discount_above_the_subtotal`.

### P1-04 — `payment_status` trusted from the client (Fixed)

- **Severity:** P1 (financial reporting integrity)
- **Reproduction:** `POST /sales` with `grand_total 100`, `amount_paid: 40`, `payment_status: paid`.
- **Before:** stored as `paid` with `outstanding_balance` 60 — reports and the receivables view
  disagreed with the money.
- **Root cause:** `SaleService` persisted `$data->paymentStatus`.
- **Files:** `app/Domains/Sales/Services/SaleService.php`
- **Fix:** derive from amounts — `paid` when `amountPaid >= grandTotal`, `partial` when `> 0`, else
  `unpaid`.
- **Regression:** `test_payment_status_is_derived_from_the_money_not_the_client`.

### P1-05 — Return value not bounded by the original document (Fixed)

- **Severity:** P1 (financial corruption / over-credit)
- **Reproduction:** sale `grand_total` 100; `POST /returns/sale` with `grand_total: 900`.
- **Before:** accepted. `PartyBalance::apply` credited 900 against a 100 sale, and refund movement
  could exceed what was ever collected.
- **Root cause:** creation-time validation compared `refund_amount` to the client's own
  `grand_total`; nothing compared `grand_total` to the document.
- **Files:** `app/Domains/Returns/Services/ReturnService.php`
- **Fix:** creation rejects a return value above `document value − completed returns`. Completion
  re-validates against other **completed** returns (`assertValueStillReturnable`), mirroring the
  existing quantity revalidation. Pending drafts intentionally do not count, matching the
  established two-stage return design.
- **Regression:** `test_return_value_cannot_exceed_the_original_sale`,
  `test_overlapping_return_values_cannot_both_complete`.

### P2-01 — Two local products have stock with no ledger movement (Not fixed — pre-existing)

- **Severity:** P2 (data quality, local fixture only)
- **Evidence:** `stock:reconcile` reports `#2 P` and `#3 C`, both `stored=1 ledger=0`, created
  `2026-11-15 11:28:43` — before any composition work, with 0 compositions and 0 movements.
- **Impact:** they overstate stock value by their cost; no ledger is inconsistent.
- **Decision:** documented, **not repaired**. Repairing means inserting synthetic `INITIAL`
  movements, which is a data mutation reserved for the owner. Product `#4` reconciles exactly
  (`stored=-2 ledger=-2`), confirming the ledger itself is sound.

### P2-02 — Formula classification nuance: consumption + assembly (Not a defect)

- **Severity:** P2 (clarification, no change)
- **Question raised in P10:** is `Product::formulaOnly()` right for products with both kinds?
- **Finding:** correct as implemented. Requiring *no active assembly* means an assembled good that
  is also sold as a formula still counts as physical inventory. Such a product can hold real
  finished stock, so excluding it would hide genuine stock. A consumption-only record cannot.
- **Decision:** no change. Covered by `FormulaScopeCleanupTest`.

### P3-01 — Backend "component" naming retained (Won't fix)

- **Severity:** P3 (terminology)
- `composition_run_items`, `component_product_id`, `searchComponents()` remain. Renaming columns
  requires a migration and offers no integrity value. Documented as intentional.

### Suspected but not reproduced

| Item | Attempt | Outcome |
|---|---|---|
| Concurrent checkout overselling ingredients | Deterministic `orderBy('id')->lockForUpdate()` on all components before preflight | Design is correct; true parallel contention is not testable on a single SQLite connection. Not claimed as verified under load. |
| Formula sale deletion restoring phantom parent stock | `SalePolicy::canDelete` rejects any sale with a `source_type='sale'` composition run | Guarded |
| Return restock for a formula line creating parent stock | `applyStock` returns early when `isCompositionSaleItem` | Guarded |
| Cross-company data leakage | No company/tenant columns exist on this branch | Not applicable here; see I |

---

## E. Inventory reconciliation

### Canonical balance

```text
products.stock_quantity  ==  SUM(inventory_transactions.quantity)
```

Movement semantics are already signed at the source:

| Intent | Signed effect |
|---|---|
| `purchase` | `+quantity` |
| `sale` | `−quantity` |
| `consumption` | `−quantity` |
| `sale-return` | `+quantity` |
| `purchase-return` | `−quantity` |
| `production` | `+quantity` |
| `adjustment` / `damage` | caller-signed |
| Composition recovery | `+quantity` |

`applyMovement` is the only writer of `products.stock_quantity`, which is why the invariant holds.

### Actual result

`php artisan stock:reconcile` on the local database:

```text
Products scanned: 3
Mismatches: 2
Negative stock: 1
Stock without an INITIAL movement: 3
#2 P  stored=1 ledger=0   diff=1
#3 C  stored=1 ledger=0   diff=1
```

Per-product audit confirmed `#4 Comp Prod` reconciles exactly (`stored=-2 ledger=-2`). The two
mismatches are the pre-existing fixtures in P2-01. **No balances were rewritten.**

---

## F. Formula integrity

- **Template:** versioned via `CompositionService`; update creates a new version and never mutates
  the prior one. Saving never moves stock.
- **Identity:** ingredient ids, units and quantities are validated (positive, compatible unit,
  duplicate rejection, cycle rejection, archived/non-inventory rejection).
- **Runtime overrides:** per-formula-unit in the API, converted to absolute in `SaleService`
  (`absolute = perFormula × formulaUnits`). Identities cannot change; forged ingredient ids are
  rejected; the template is never mutated.
- **Stale version:** the cart pins `formula_composition_id`; checkout rejects if the active
  composition changed.
- **Execution:** explode → aggregate repeated components → ordered locks → composition version
  re-check → preflight → consumption → snapshot (template version, template snapshot, per-line
  `template_quantity`, `actual_quantity`, `source_breakdown.overridden`, cost basis).
- **Immutability:** verified by `historical runtime snapshot survives formula edit` and
  `run snapshot survives template changes renames and archival`.
- **Formula stock:** verified untouched by checkout (new test asserts zero movements on the parent).

---

## G. POS integrity

| Check | Result |
|---|---|
| Server-side unit conversion (client `base_unit_quantity` ignored) | Holds — `CompositionPosIntegrationTest` sends `999` deliberately |
| Server-side price | `unit_price` is an intentional override; **bounded** so it can no longer inflate beyond gross |
| Discount | Now bounded by subtotal |
| Payment status | Now derived |
| Formula runtime scaling | Holds (`2 × 20g = 40g`) |
| Atomicity | Single `DB::transaction` covering sale, items, stock, runs, COGS, ledger, balances |
| Rollback | `shared component shortage rejects the whole sale without partial consumption`, `simple line movement rolls back when a composition fails` |
| Idempotency | Sale key + per-run key `sale:{id}:item:{id}:composition:{id}` |
| Concurrency | Ordered `lockForUpdate` on components and the composition row |

---

## H. Financial integrity

- **COGS source:** `sale_items.cost_price`, written from run-item `total_cost / base_quantity`, or
  the uncosted-first split for simple lines. Never recomputed from current product costs.
- **Completeness:** `cost_complete` + `uncosted_quantity` prevent silent valuation of uncosted
  stock; incomplete cost stays `null` rather than `0`.
- **Historical stability:** verified by `historical cost survives component cost template and
  archive changes` and `historical run cost survives component cost changes`.
- **Returns:** COGS reversed proportionally; recovery does not create a second reversal.
- **Ambiguity documented:** there is **no tax engine** on this branch (`sales` has no tax column),
  so "tax correctness" is not applicable rather than violated.
- **Rounding:** line totals are rounded to 6dp in storage; grand total to 2dp.

---

## I. Multi-company isolation

**Not implemented on this branch.** `App\Services\BusinessContext` is a hard-coded singleton
(`id = '1'`), and no audited table carries `company_id`, `organization_id` or `warehouse_id`.

Consequences, stated plainly:

- No cross-company leak is possible **because there is no second company**.
- Equally, **no isolation guarantee is claimed.** Any deployment serving two businesses from this
  branch would share every record.
- The company layer exists only in the separate `variation/clothing-erp` worktree, which P8.7
  analysed and which remains untouched pending approval.

This is a scope fact, not a passing audit result.

---

## J. Database integrity

- **Unique:** `sales.invoice_number`, `sales.idempotency_key`, `returns.idempotency_key`, run
  idempotency, `(composition_id, component_product_id)` uniques — all present and exercised.
- **Foreign keys:** component references, composition ownership, run → sale item; invalid
  references rejected by tests.
- **Orphans:** none found. Runs without sale items, run items without runs and recoveries without
  returns are prevented by FKs plus `run delete cascades run items`.
- **Soft deletes:** products use `archived_at` global scope plus `SoftDeletes`; archived products
  are rejected from sales/adjustments but remain visible in composition history.
- **No migration was added or run in P11.** No constraint was dropped.

---

## K. Reporting integrity

All inventory-facing reports consume `InventoryReportService`, which since P10 routes through one
`scopedProducts()` query excluding formula-only records — so the stock report, ledger, valuation,
low-stock list, dashboard summary and low-stock alert cannot drift from each other.

- Inventory valuation: purchase-cost basis (`average_cost → opening_cost → last_purchase_cost →
  default_purchase_cost`), matching `CostResolver`.
- Ingredient Usage: aggregates `composition_run_items` by ingredient and unit, from snapshots.
- Returns: recovery is netted, not double-counted; wastage excluded.
- Sales/profit: both read `sale_items` + canonical COGS, so a partial return reduces both
  identically (`CogsConsistencyTest`).

---

## L. Remediation

| File | Change |
|---|---|
| `app/Http/Controllers/InventoryController.php` | Reject formula-only stock adjustments; added `Product` and `ValidationException` imports |
| `app/Domains/Sales/Services/SaleService.php` | Bound line total to quantity × price; bound discount to subtotal; derive `payment_status` |
| `app/Domains/Returns/Services/ReturnService.php` | Bound return value to document value; added `assertValueStillReturnable` at completion |
| `tests/Feature/Integrity/FormulaStockAndAmountIntegrityTest.php` | **New** — 8 tests / 18 assertions |

Deliberately **not** changed: `InventoryService::applyMovement`, composition explosion/locking,
snapshots, `CogsCalculator`, ledger services, any migration, any historical row.

---

## M. Outstanding issues

1. **Legacy fixture stock (`P`, `C`)** — needs an owner decision: insert `INITIAL` movements or
   zero the balances. Not done unilaterally.
2. **Concurrency under real load** — locking order is correct by inspection; genuine parallel
   contention on MySQL/MariaDB is untested here (SQLite, single connection).
3. **Multi-company isolation** — entirely absent on this branch; must not be claimed and must be
   built before multi-tenant deployment.
4. **Return value bound uses document value, not line value** — a return may legitimately be
   allocated to any line as long as the document total is respected. Tightening to per-line value
   is possible but would change behaviour for discounted invoices, so it is left as-is.
5. **No tax engine** — if tax is required, it is a feature, not a repair.
6. **`scripts/p11-inspect.php`** — audit helper left in the repo; safe to delete or keep.

---

## N. Manual QA checklist

- [ ] Purchase an ordinary product; stock and ledger both increase.
- [ ] Sell an ordinary product; stock and ledger decrease equally.
- [ ] Adjust stock on an ordinary product; succeeds.
- [ ] Adjust stock on a formula product; rejected with a clear message.
- [ ] Run `php artisan stock:reconcile`; only the known fixtures deviate.
- [ ] Create/edit a formula; a new version appears, stock does not move.
- [ ] POS: select formula, change quantities, restore defaults, cancel.
- [ ] Checkout a formula with quantity > 1; ingredient deduction is scaled.
- [ ] Formula parent stock is unchanged after a formula sale.
- [ ] Force an ingredient shortage; the whole sale rolls back.
- [ ] Submit the same checkout twice; one sale, one consumption.
- [ ] Sale detail shows the formula snapshot after editing the formula.
- [ ] Return part of a formula sale; refund and recovery match the snapshot.
- [ ] Full return, then attempt an overlapping return; the second is rejected at completion.
- [ ] Ingredient Usage reflects actual consumption, not defaults.
- [ ] Valuation excludes formula products.
- [ ] Profitability reconciles with the sales report for the same period.
- [ ] A sale with `amount_paid < grand_total` shows `partial`, never `paid`.

---

## O. Test results

```text
php artisan test tests/Feature/Integrity
→ 8 passed (18 assertions)

php artisan test tests/Feature/Returns tests/Feature/Composition/CompositionReturnsTest.php tests/Feature/Integrity
→ 48 passed (152 assertions)

php artisan test
→ 377 passed, 9 failed (1,575 assertions)

php artisan stock:reconcile
→ 3 scanned, 2 mismatches (pre-existing fixtures), 1 negative, 3 without INITIAL
```

The 9 failures are the unchanged pre-existing missing Auth/Profile Inertia pages (500/404 on
`verify-email`, `confirm-password`, `reset-password`, `profile`). They are **not** P11 regressions;
the same 9 fail on the untouched baseline.

P10 baseline was 369 passed; P11 adds 8 passing tests.

---

## P. Git safety

- **Original branch:** `feature/product-composition`
- **Original HEAD:** `50be1bd911f8c0ad46a9232aac4396837f457843`
- **Final branch:** `feature/product-composition`
- **Final HEAD:** `50be1bd911f8c0ad46a9232aac4396837f457843`

Confirmed:
- No commits created.
- No Git history operations performed (no switch, merge, rebase, reset, clean, stash, cherry-pick).
- No unrelated modifications discarded; all 123 pre-existing working-tree entries preserved.
- The `fashion` worktree was not touched (`variation/clothing-erp` @ `d0ff43e`).
- No destructive database command was run; no stock balance, ledger row, sale, or return was
  modified outside the test database.
