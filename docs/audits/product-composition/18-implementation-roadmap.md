# 18 — Implementation Phases & Dependency Map

> This is a **proposed** roadmap. No phase has been implemented. Phase 0 is the first
> implementation phase and contains no composition feature code.

## Dependency graph

```
P0 integrity
  └─> P1 schema + domain
        ├─> P2 formula management UI/API
        └─> P3 execution engine
              ├─> P4 POS integration
              ├─> P5 costing
              │     └─> P7 reports
              └─> P6 returns/reversals
                        └─> P7 reports
P8 hardening/port depends on P0–P7
```

## P0 — Integrity prerequisites

**Objective:** make stock, cost and authorization trustworthy before adding a second stock-consuming feature.

**Scope:** fix or fence the defects in documents 03, 04, 13.

**Prerequisites:** none.

**Database changes:** none. Optionally add indexes on `products.sku` and `products.barcode`.

**Backend changes:**
1. Remove `stock_quantity` from `UpdateProductRequest` and `ProductService::update`; route stock
   changes through `InventoryService` with an explicit adjustment.
2. Add a public `InventoryService::recordConsumption()` (do not expose `applyMovement`).
3. Fix `TransactionEngine` (remove or repair) or delete it; it currently calls a private method.
4. Deprecate/fence `SaleReturnService::create` and `PurchaseReturnService::create` (they bypass
   the guard).
5. Preserve packaging in `ProductController::store()` collision branches.
6. Add `authorize()`/permission middleware to product/sale/purchase/return/settings CRUD.
7. Disable public registration; protect `/api/dashboard/metrics`.
8. Reconcile COGS return exclusion between overview and P&L (or document the difference).
9. Add sale idempotency key (recommended).

**Frontend changes:** remove the stock field from the edit payload (render-only), replace the
mock permission context with server-shared permissions if permissions are enforced.

**API changes:** none new; request contract loses `stock_quantity` on update.

**Reports affected:** COGS consistency; valuation remains as-is.

**Tests required:** the P0 list in document 17 (tests 1–5).

**Migration strategy:** deploy code first; if `stock_quantity` was used by external clients,
provide a compatibility window that converts it to an adjustment.

**Rollback:** revert the code; no schema change.

**Acceptance criteria:**
- editing a product never changes `stock_quantity`;
- `stock:reconcile` reports no drift after sale/purchase/return;
- unauthorized roles receive 403 on write routes;
- no route calls the dead engine.

**UAT:** Scenario A (simple product regression).

**Definition of done:** P0 tests green, existing suite green, no schema changes.

---

## P1 — Composition schema and domain

**Objective:** model reusable templates and immutable runs, with validation, but **no stock effects**.

**Prerequisites:** P0.

**Database changes:**
- `product_compositions`, `product_composition_items`;
- `composition_runs`, `composition_run_items`;
- optional `inventory_transactions.composition_run_id`;
- optional quantity precision widening (decimal 14,6);
- indexes and FKs as in document 02.

**Backend changes:** models, `CompositionService` (CRUD), `CompositionValidator` (self, duplicate,
archived, unit, cycle, depth), `CompositionResolver` (base-unit normalisation),
`CompositionCostCalculator` (preview only), policies/permissions.

**Frontend changes:** none required; optional read-only display behind a flag.

**API changes:** `composition` prop/endpoint (read/write) — can land here or in P2.

**Reports affected:** none.

**Tests required:** schema, validation, cycle, no-stock-effect, versioning (tests 6–9).

**Migration strategy:** additive; run on both branches unchanged (no `company_id`).

**Rollback:** drop new tables; no existing data touched.

**Acceptance criteria:**
- a formula can be created, edited and versioned;
- saving never changes stock or creates a ledger row;
- cycles and invalid units are rejected server-side;
- simple products are untouched.

**UAT:** Scenario B (formula product, no stock deduction).

**Definition of done:** tables migrated, domain tests green, no stock writes.

---

## P2 — Formula management UI/API

**Status:** Implemented — see `P2-MANAGEMENT.md`.

**Objective:** let users create and edit formulas from the product detail page without slowing simple product creation.

**Prerequisites:** P1.

**Database changes:** none.

**Backend changes:** product detail `composition` prop; save/update endpoints; authorization;
component search endpoint (server-side, paginated); cost preview endpoint (read-only).

**Frontend changes:** `features/composition/` builder; new detail tab; component picker;
validation display; loading/empty/error states; dirty guard.

**API changes:** `GET/PUT /inventory/product/{id}/composition` and
`GET /inventory/components/search` (or equivalent).

**Reports affected:** none.

**Tests required:** HTTP create/update/view, authorization, component search, no stock effect.

**Migration strategy:** none.

**Rollback:** remove routes/UI; data remains.

**Acceptance criteria:**
- the create-product flow is unchanged (same fields, same payload size);
- the detail page shows a Formula tab only when a composition exists or the user starts one;
- large catalogs are searched server-side;
- invalid compositions cannot be saved.

**UAT:** Scenario B, plus the UX checks in document 07 §6.

**Definition of done:** UI usable on desktop/mobile, tests green, no stock writes.

---

## P3 — Consumption execution

**Implementation status:** implemented. See `P3-EXECUTION.md` for the execution algebra,
precision migration, idempotency contract, API, and tests.

**Objective:** apply actual consumption atomically, with immutable run history.

**Prerequisites:** P1, P0 (public inventory method).

**Database changes:** any run/template columns not added in P1; `composition_run_id` on ledger if
chosen.

**Backend changes:** `ConsumptionExecutor`:
- validate all components first;
- deterministic lock order;
- `recordConsumption` per component;
- write run + items with costs and movement ids;
- mark completed;
- audit.

**Frontend changes:** optional manual "consume" action for testing; not the POS yet.

**API changes:** manual execution endpoint (admin-only).

**Reports affected:** stock movement will start seeing `consumption` rows.

**Tests required:** tests 10–15.

**Migration strategy:** none.

**Rollback:** disable routes; runs already applied must be reversed, not deleted.

**Acceptance criteria:**
- one run consumes exactly the resolved quantities;
- any shortage aborts with zero movements;
- overrides do not mutate the template;
- ledger and product balance agree;
- costs are snapshotted.

**UAT:** Scenario C (manual), Scenario E (insufficient).

**Definition of done:** transactional execution, audit log, tests green.

---

## P4 — POS integration

**Implementation status:** implemented. See `P4-POS-INTEGRATION.md` for the transaction
integration, quantity mapping, sale-item linkage, idempotency, guards, and tests.

**Objective:** sell consumption-based products with default or overridden consumption.

**Prerequisites:** P3.

**Database changes:** none (idempotency key/index if not in P0).

**Backend changes:**
- accept `consumption` on sale items;
- resolve template server-side if omitted;
- validate overrides and authorization;
- execute within `SaleService` transaction;
- return structured shortage errors;
- roll cost into sale item cost (can move to P5 if cost is not yet final).

**Frontend changes:** capability badge; per-line Consumption editor; shortage display; review at
checkout; mobile sheet; no component cart lines.

**API changes:** sale request contract extension (backward compatible: absent = template).

**Reports affected:** COGS (once cost rolled), top products (must not include components).

**Tests required:** tests 16–20.

**Migration strategy:** none; old clients omit the field and get template behavior.

**Rollback:** remove the UI/field; existing runs remain valid.

**Acceptance criteria:**
- simple sales behave exactly as before;
- a consumption product consumes template × quantity by default;
- overrides are honored and not persisted to the template;
- shortage blocks the entire sale;
- one commercial sale item, no component sale items.

**UAT:** Scenario C (POS), D (multiple quantities), E (shortage).

**Definition of done:** end-to-end POS test, no regression in simple sales.

---

## P5 — Costing

**Implementation status:** implemented. See `P5-COSTING.md` for the canonical COGS source,
sale-item roll-up, completeness model, report integration, and tests.

**Objective:** correct composite cost, COGS and margin.

**Prerequisites:** P3/P4.

**Database changes:** cost columns on runs/items if not in P1.

**Backend changes:**
- component cost via `CostResolver`;
- run cost + unit cost;
- write finished `average_cost` on production;
- write rolled cost to `sale_items.cost_price` for services;
- disclose estimated/unavailable cost.

**Frontend changes:** cost preview in builder; margin display; "estimated" label.

**API changes:** cost fields in composition/run responses for permitted roles.

**Reports affected:** COGS, P&L, balance sheet, inventory valuation.

**Tests required:** tests 21–23; extend `CostingTest`.

**Migration strategy:** no backfill of historical sales; forward-only.

**Rollback:** code revert; historical runs keep snapshots.

**Acceptance criteria:**
- composite COGS equals component cost;
- historical cost is stable after component price change;
- unknown cost is visible, not zero-silent;
- no double expensing.

**UAT:** Scenario C (cost), H (historical integrity).

**Definition of done:** costing tests green; report numbers reconcile.

---

## P6 — Returns and reversals

**Implementation status:** implemented. See `P6-RETURNS-REVERSALS.md` for the commercial
return vs. material recovery separation, eligibility maths, wastage rule, restoration
movements, idempotency, COGS behaviour, schema, security and tests.

**Objective:** define and implement correct return behavior for composite and service sales.

**Prerequisites:** P3/P4, P5.

**Database changes:** optional run/return linkage.

**Backend changes:**
- sale return restocks only the commercial product when `restock`;
- service refunds do not restore components;
- explicit run reversal endpoint with compensating ledger rows;
- `SalePolicy` handles runs (block or reverse);
- audit.

**Frontend changes:** return screen shows "consumed materials are not restored"; optional
"recovered quantity" only if the business demands it.

**API changes:** return/run reversal contract.

**Reports affected:** returns, COGS, inventory movement.

**Tests required:** tests 24–26.

**Migration strategy:** none.

**Rollback:** code revert; applied returns remain valid.

**Acceptance criteria:**
- a service refund changes cash/party but not component stock;
- a finished-good return restocks only the finished good;
- reversing a run is explicit and compensated;
- no negative-stock guard bypass except documented reversal.

**Definition of done:** return tests green; no double restoration.

**Delivered (P6):**
- `ReturnService` gained composition-aware returns without a competing return system;
- commercial refund never restores components; recovery is explicit and verified;
- wastage excluded from the recoverable basis; eligibility is proportional and cumulative;
- canonical `sale-return` movements, compensated automatically on reversal;
- DB-backed idempotency for the return document and for each restored component line;
- COGS reversal reuses P5's canonical calculator (runs stay `completed`, never rewritten);
- sale deletion blocked when returns exist;
- 30 dedicated tests; full suite 338 passed / 9 pre-existing Auth-Profile failures.

---

## P7 — Reports, manufacturing and visibility

**Implementation status:** implemented. See `P7-MANUFACTURING.md` for the production domain,
finished-goods costing, reversal, component usage reporting, UI, and tests.

**Objective:** make reports truthful and add optional production (assembly) execution.

**Prerequisites:** P3–P6 (manufacturing can be split out if deferred).

**Database changes:** production movement type or reuse of `consumption` + positive adjustment;
run linkage.

**Backend changes:**
- stock movement buckets: purchase, sale, consumed, produced, returned, adjusted;
- valuation uses the same cost basis;
- component usage report;
- production run service (if in scope): consume components, credit finished good, write cost;
- dashboard formula availability.

**Frontend changes:** report columns, component usage page, production screen (optional).

**API changes:** report payloads gain buckets; exports gain columns.

**Reports affected:** all inventory/valuation/COGS/top-product/day-book surfaces.

**Tests required:** tests 27–29.

**Migration strategy:** no data migration for buckets; movement types are forward-only.

**Rollback:** reports revert; runs remain.

**Acceptance criteria:**
- consumption is visible and not called an adjustment;
- produced stock is valued at its cost;
- top products contain only commercial products;
- all valuation surfaces agree.

**UAT:** Scenario G (isolation is trivially true on single tenant), H, plus report review.

**Definition of done:** report reconciliation sign-off.

---

## P8 — Hardening and port

**Implementation status:** **source-branch hardening complete; fashion integration pending approval.**
See `P8-FINAL-HARDENING.md`, `P8.1` through `P8.7`.

**Objective:** production readiness and a safe path to the fashion branch.

**Prerequisites:** P0–P7.

**Source hardening delivered:**
- architecture/security/inventory/costing audit;
- production reversal now re-bases weighted-average cost;
- uncosted finished/simple stock sales now carry an explicit incomplete-cost signal
  (`sale_items.cost_complete`, `uncosted_quantity`, migration 015) instead of being silently
  valued at the previous average;
- COGS, bill-wise profit, financial overview, day book and balance sheet expose composition and
  stock-line completeness;
- MySQL fresh-install/upgrade and rollback constraints audited;
- route, reconciliation, build, type, lint and full-suite verification;
- 4 new regression tests.

**Regression baseline:** 354 passed / 9 pre-existing Auth/Profile failures / 1,468 assertions.

**Database changes:** additive migration 015 plus the P3–P7 schema. No source company columns.

**Fashion status:** **not executed.** The actual target branch is `variation/clothing-erp` at
`d0ff43e`; its committed delta is multi-company isolation, not a variation implementation. The
target worktree contains a large staged change set and must not be touched. Company stock
hydration, company ownership, company-scoped idempotency and report filters are required before
any port.

**Migration strategy:** additive only; do not merge branches. Use the selective, file-level plan
in `P8.7-FASHION-INTEGRATION-PLAN.md` after approval.

**Rollback:** precision/enum rollback is data-lossy; see `P8.4-DEPLOYMENT-AUDIT.md`.

**Definition of done:** source audit checklist signed, regression suite green, deployment notes
updated. Fashion port is complete only after explicit approval, target-state resolution and
target tests.

**Remaining:** fashion integration approval; nested-version concurrency hardening; reversed
production net reporting; company-scoped target migration.

## P9 — Herbal formula simplification and runtime customization

**Implementation status:** **implemented on the source branch.** See
`P9-FORMULA-SIMPLIFICATION.md`.

**Objective:** make formulas reusable ingredient templates with POS runtime quantity
customization, without requiring manufacturing or production orders.

**Delivered:**
- formula-only UX in the Formula tab and builder (ingredient consumption; no assembly kind or
  optional-component controls);
- Formulas navigation/filter (`/inventory?composition=formula`) and New Formula hand-off;
- POS Formula search badge, barcode matching and Formula · edit cart control;
- runtime customization dialog with fixed ingredient identities, editable per-formula-unit
  quantities, restore defaults, cancel and reopen support;
- sale request fields `formula_composition_id`, `formula_overrides`,
  `formula_optional_item_ids`;
- backend conversion from per-formula quantities to P3 absolute overrides, with composition id
  pinning and authoritative validation;
- sales-detail formula snapshot for staff, without internal costs;
- ingredient usage report with actual consumption, recovery netting and ingredient aggregation;
- return recovery based on actual runtime consumption for overridden lines;
- manufacturing navigation/report links hidden; backend production files/data retained.

**Regression:** 364 passed / 9 failed / 1,537 assertions; the 9 failures are the same documented
Auth/Profile Inertia gaps. P9 adds 10 passing tests over the P8 baseline.

**Deferred / retained:**
- production backend and direct routes retained for other business types;
- formula availability endpoint not added (authoritative check remains checkout);
- optional components hidden from formula UI;
- no separate formula table or formula report module;
- company/fashion integration remains pending P8.7 approval.

**Definition of done:** formula templates usable without manufacturing, runtime quantities stored
independently, actual inventory consumption and reporting verified, and no unrelated regression.

---

## P10 — Formula UX cleanup and scope consolidation

**Implementation status:** implemented. See `P10-UX-CLEANUP.md`.

**Objective:** remove the remaining confusing UI, misleading stock representations, manufacturing
remnants and inconsistent naming without changing business logic.

**Delivered:**
- single authoritative formula predicate on `Product` (`formulaOnly`, `excludingFormulaOnly`);
- formula-only products excluded from inventory overview counts, low-stock alerts, stock valuation,
  stock/ledger reports and the purchase picker;
- formula rows show "Not stocked" plus ingredient count instead of stock, purchase price or value;
- product detail disables stock adjustment and hides the stock-movement tab for formulas;
- ingredient picker excludes formulas and uses ingredient terminology;
- formula builder/panel use ingredient/yield wording; the redundant "Kind" table column is gone;
- POS cart states the per-formula ingredient list and the commercial formula count;
- sales detail renamed to "Formula ingredients consumed" with per-formula and total amounts;
- remaining manufacturing UI carries a scope notice; navigation links stay hidden.

**Explicitly not changed:** `CompositionExecutionService`, unit conversion, inventory locking,
atomic deduction, idempotency, formula versioning, sale creation, COGS, execution snapshots,
return/recovery, inventory movement generation.

**Regression:** 369 passed / 9 failed / 1,557 assertions; +5 tests over P9. The 9 failures are the
same documented Auth/Profile Inertia gaps.

**Deferred:** possible rename of `composition_run_items`/`component_*` columns; separate formula
module.

---

## P11 — Inventory, POS, formula, sales, COGS & return integrity audit

**Implementation status:** audit complete for the agreed scope, with confined remediation.
See `P11-INTEGRITY-AUDIT.md`.

**Objective:** establish whether business data stays correct under normal use, failures, retries,
concurrency and historical changes — and fix only what is confirmed wrong.

**Core finding:** the composition execution core is sound (explosion, unit conversion, atomic
deduction, ordered row locking, idempotency, immutable snapshots, snapshot-based COGS). The defects
were at trust boundaries — what the server accepted from the client.

**Confirmed and fixed (P1):**
- `POST /inventory/adjust` accepted formula-only products, creating phantom stock;
- sale line totals were unbounded relative to quantity × price;
- the document discount was unbounded against the subtotal;
- `payment_status` was stored from the client claim instead of from the money;
- return values were bounded only by the client's own figures, not by the document;
- added completion-time return-value revalidation alongside the existing quantity revalidation.

**Documented, not changed:**
- two legacy local fixture products hold stock with no ledger movement (needs owner decision);
- no warehouse, company or organization dimension exists on this branch, so isolation is absent
  rather than verified;
- no tax engine, so tax correctness is not applicable;
- backend `component_*` naming retained.

**Regression:** 377 passed / 9 failed / 1,575 assertions; +8 tests over P10. The 9 failures are the
unchanged Auth/Profile Inertia gaps.

**Not claimed:** concurrency safety under real MySQL load, and any multi-company isolation.

---

## P12 — Frontend UI/UX integrity and discoverability

**Implementation status:** implemented. See `docs/audits/frontend/P12-UI-UX-INTEGRITY.md`.

**Objective:** make every existing business capability reachable and operable through its intended
interface, starting with formula creation.

**Confirmed and fixed:**
- formula creation was hidden inside the formula view only — added an explicit
  Physical Product / Formula choice on Add Product plus sidebar, dashboard and list-header entry
  points;
- `/inventory/movements`, `/inventory/low-stock` and `/inventory/valuation` returned HTTP 500
  because their page components never existed — now redirect to the canonical reports;
- `/reports/product-ledger` crashed without a `product_id` — now renders an empty state with a
  product picker;
- `/reports/sales/by-customer` and `/reports/sales/top-products` returned 500 — their page
  components were created;
- Reports landing was unreachable and eight implemented reports were unlinked — sidebar and landing
  page now cover them;
- mobile navigation had no formula entry point — added to the More sheet.

**Method note:** a static reflection check over `Inertia::render` calls passed while three routes
were still failing. It was replaced with a real HTTP probe, which caught them.

**Regression:** 382 passed / 9 failed / 1,644 assertions; +5 over P11. Build and Pint pass.

**Not done:** no browser automation, so visual and responsive behaviour remains unverified;
`reports/FinancialReport` stays missing but unreachable; formula ingredients still cannot be entered
before the first save.

**Production readiness is not claimed.**

---

## P13 — Formula POS negative-stock policy consistency

**Implementation status:** implemented. See `P13-FORMULA-NEGATIVE-STOCK.md`.

**Root cause:** formula checkout ran two stock checks. `applyMovement` consulted the
negative-stock policy; `CompositionExecutionService::preflight` did not, and it ran first. A
traditional product therefore obeyed the policy while a formula was always blocked.

**Delivered:**
- one resolver, `InventoryService::allowsNegativeStock()`, used by both the movement writer and the
  composition preflight, so the two cannot diverge again;
- preflight's quantity check is now conditional on that policy; existence, active, `track_inventory`,
  cycle, depth and unit validation still always reject;
- formula ingredient shortfalls surface in the existing POS Insufficient Stock dialog, but only
  where the policy permits negative stock (where it forbids it, the server rejects as before);
- composition item payload exposes the resolved policy and display-unit stock so the warning
  compares like with like;
- no formula-specific setting, no client flag can bypass the server policy.

**Regression:** 394 passed / 9 failed / 1,671 assertions; +12 over P12. Build and Pint pass.

**Note:** three existing composition fixtures silently inherited the product model default
(`allow_negative_stock = true`) while asserting rejection. Their preconditions were made explicit;
no behavioural assertion was changed.

**Remaining risk:** the shipped product-level default permits negative stock even though the
business setting defaults to forbidden. That precedence is pre-existing and documented, not changed
here.

## First implementation phase

**P0 — Integrity prerequisites.** It is the only phase that can be started without deciding the
composition semantics, and every later phase depends on its guarantees.
