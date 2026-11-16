# 00 — Executive Summary

## 1. What exists today

**VERIFIED.** Invenos is a Laravel 13 + Inertia/React 18 application backed by MySQL:

- **51 migrations**, **162 PHP files under `app/`**, **221 TS/TSX files under `resources/js/`**.
- Controllers are thin; business logic lives in `app/Domains/*/Services`.
- No repositories, no API Resources, no DTO serialization layer: Eloquent models are passed
  raw to Inertia.
- Authentication is session-based. Roles are `admin` and `salesman`; Spatie permissions are
  seeded, but only lifecycle actions are actually gated.
- The business is **single-tenant** on this branch: `App\Services\BusinessContext` hardcodes
  id `'1'`, and no `company_id` / `organization_id` column exists in any table.

### Modules present

Product/inventory, POS/sales, purchases, returns, payments, contacts/ledger, expenses, reports,
clinic (consultations/prescriptions), settings, users/permissions, backup/restore, audit log,
recycle bin.

### Modules assumed by the brief but ABSENT

| Assumed subsystem | Result |
|---|---|
| Companies / organizations | **ABSENT** (fashion branch only) |
| Warehouses / locations | **ABSENT**; `products.location` is a free-text string |
| Stock transfers | **ABSENT**; no table, type, route or service |
| Production / manufacturing | **ABSENT**; no table, route, type or service |
| Formula / BOM / recipe / components | **ABSENT** |
| Brands | **ABSENT** |
| Product variants | **ABSENT** |
| Product import / export | **ABSENT** (only report CSV/XLSX/PDF export) |
| Webhooks / external integrations | **ABSENT** |
| API versioning | **ABSENT** |
| Events / listeners / observers | **ABSENT** |
| Background jobs for domain work | **ABSENT** (only backup scheduling) |
| Reservations / available-vs-on-hand | **ABSENT** |
| Batch / lot / expiry | **ABSENT** |
| Company-specific pricing | **ABSENT** |

These must be treated as greenfield decisions, not as existing integration points.

## 2. What composition must integrate with

**VERIFIED.** The two structural facts that make this feature feasible:

1. **One signed inventory ledger.** `inventory_transactions` stores `+` inflow / `−` outflow
   with a `type` enum that already contains `consumption`. All stock math can stay in one
   table.
2. **One sellable product entity.** `products` is the SKU/pricing/stock identity. A composite
   product can be a normal product row; composition is a relationship, not a new type.

The two structural facts that make it dangerous:

1. **Stock is not written in one place.** Four write paths exist, and one of them
   (`ProductService::update`) writes `stock_quantity` with no ledger row.
2. **Every sale line is assumed to be a stock movement.** Reports, COGS and returns all join
   `sale_items` directly to inventory movements. Components consumed by a composite are not
   sale lines, so they disappear from those reports unless a new link is added.

## 3. Overall impact assessment

| Area | Impact | Why |
|---|---|---|
| Product schema | **Medium** | Additive composition tables; `product_type` left dead |
| Product backend | **Medium** | New domain service, read props, validation |
| Product frontend | **Medium–High** | New Formula/Recipe builder screen |
| Inventory | **Critical** | Consumption must go through the ledger atomically |
| Sales / POS | **Critical** | Expansion and consumption timing decide correctness |
| Purchasing | **Low** | Components are purchased as ordinary products; no change required |
| Returns | **Critical** | Consumed ingredients must not be auto-restored |
| Costing | **High** | Roll-up and snapshot policy |
| Reports | **High** | Commercial product vs consumed component must be separated |
| Authorization | **High** | Current model has no per-action enforcement |
| Backup/restore | **Low** | Automatic table discovery already includes new tables |
| Testing | **High** | No composition coverage exists |

## 4. Feature complexity

**Medium-high, not because the schema is hard, but because the existing transaction boundary
is inconsistent.**

- The schema for a template + immutable execution record is straightforward.
- The hard parts are: deciding *when* consumption happens, preventing partial deductions,
  preserving historical recipes, preventing double counting in revenue/COGS, and defining
  return behavior for already-consumed components.
- Manufacturing (produce into stock, then sell) and consumption-at-sale are **different**
  execution models and must not be conflated.

## 5. Major dependencies

| Dependency | Used by composition for | Verified location |
|---|---|---|
| `InventoryService::recordAdjustment` / `recordSale` / `recordReturn` | all stock effects | `app/Domains/Inventory/Services/InventoryService.php` |
| `CostResolver::unitCost` | component cost at execution | `app/Domains/Inventory/Services/CostResolver.php` |
| `ProductUnitService` | unit display and conversion | `app/Domains/Products/Services/ProductUnitService.php` |
| `DB::transaction` | atomic multi-component consumption | services |
| `SaleService::create` | execution point for consumption-based products | `app/Domains/Sales/Services/SaleService.php` |
| `ReturnService` | reversal/return semantics | `app/Domains/Returns/Services/ReturnService.php` |
| Inertia props | formula data to React | controllers |
| Backup table discovery | new tables automatically included | `DatabaseExporter::baseTables()` |

## 6. High-risk areas

1. **Atomicity.** `InventoryService::applyMovement` locks the product row but opens no
   transaction; atomicity depends entirely on the caller.
2. **Partial deduction.** Multi-component consumption must validate every component before the
   first movement. Today the guard runs per movement, so a later short component rolls back
   only if the caller wrapped the operation in a transaction.
3. **Negative-stock policy.** `Product::$attributes` defaults `allow_negative_stock => true`,
   while the global setting defaults to `false`. Components could silently go negative.
4. **Dead `TransactionEngine`.** It calls a private method and is unreachable; do not revive it.
5. **Product edit writes stock.** `ProductService::update()` accepts `stock_quantity` from the
   form and writes it with no ledger row.
6. **Returns bypass the ledger guard in legacy services.** `SaleReturnService` and
   `PurchaseReturnService` write `InventoryTransaction` rows directly; their create methods are
   not currently routed, but they remain callable.
7. **COGS/report divergence.** A composite sold at one price with consumed components can be
   reported as pure margin unless component cost is rolled into the sale item cost snapshot or
   a consumption record is joined into COGS.

## 7. Critical architectural decisions

| # | Decision | Recommendation |
|---|---|---|
| D1 | Template vs execution storage | Separate `product_compositions` + items from `composition_runs` + run items. Never rewrite templates on execution. |
| D2 | `product_type` | Leave it dead. Drive composition from table presence. Do not add a new enum value. |
| D3 | When stock is consumed | Two distinct kinds: `assembly` (produce into stock; consume on production run) and `consumption` (consume on sale/service). Do not explode a composite at sale unless it is explicitly consumption kind. |
| D4 | Cost snapshot | Write component unit cost and total into `composition_run_items`; write rolled cost into the finished product movement / sale item cost. |
| D5 | Revenue | Only the commercial product produces revenue. Components produce no sale lines. |
| D6 | Returns | Restock the commercial product if it is stocked; never auto-restock consumed ingredients. Record a reversal decision explicitly. |
| D7 | Units | Store formula quantities in the component's **base unit**; display conversions only in the UI. |
| D8 | Authorization | Add a `composition.*` permission set; enforce server-side, not only in React. |

## 8. Implementation readiness

**Conditionally ready.** The ledger, costing and units infrastructure are sufficient. The
following prerequisites should land before composition writes stock:

- P0: single stock-writer policy (remove `stock_quantity` from product edit, deprecate legacy
  return writers);
- P0: a public, intention-revealing inventory method for component consumption;
- P0: server-side validation of component availability before the first movement;
- P0: authorization for composition create/edit/execute.

## 9. Recommended implementation sequence

| Phase | Name | Outcome |
|---|---|---|
| P0 | Integrity prerequisites | Stock has one writer; defects documented in this audit are fixed or fenced |
| P1 | Composition schema + domain | Template tables, models, resolver, validator; no stock effects |
| P2 | Formula management UI/API | Create/edit/view formulas from product detail; still no stock effects |
| P3 | Consumption execution | Atomic component consumption with runs + snapshots |
| P4 | POS integration | Consumption editor, scaling, availability pre-check, rollback |
| P5 | Costing | Roll-up, finished/sale cost snapshot, margin visibility |
| P6 | Returns/reversals | Correct behavior for composite sales and services |
| P7 | Reports/manufacturing | Separate commercial vs consumed vs produced; optional production runs |
| P8 | Hardening/port | Permissions, performance, regression suite, fashion port plan |

P0 is the first implementation phase and is **not** composition code.

## 10. How this audit protects simple products

- It makes no schema change and no code change.
- It identifies every place that assumes "product = single stocked item" so composition can be
  added as a parallel path rather than by rewriting existing queries.
- It explicitly keeps `product_type` unused and keeps simple-product create/edit payloads
  identical.
- It records the exact regression surface (`17-testing-regression-impact.md`) so the existing
  product/purchase/POS/return/report behavior is tested before and after.
- It separates manufacturing from consumption, so neither path has to weaken the simple-product
  workflow.

## 11. Document map

All documents `00`–`20` are listed in `README.md`. The mandatory cross-system matrix is
`20-cross-system-impact-matrix.md`.

## 12. Outstanding questions

1. Is a composite product **produced into stock** or **consumed at sale**? Both?
2. Does one formula produce exactly `1` sellable unit, or an arbitrary output quantity/yield?
3. Are component quantities entered in base units or display units?
4. Is wastage per component, per run, or captured as actual-vs-planned?
5. Is overhead (labour, packaging, utilities) part of the finished cost?
6. Can components be substituted at execution time?
7. Should a short component block the sale even when the component allows negative stock?
8. Who may create, edit, execute and reverse formulas?
9. Can a composite be a component of another composite? What is the depth limit?
10. Should a returned composite restore the finished item, the ingredients, or neither?
11. Should `product_type` be left unused permanently, or mapped to "has an active formula" for
    display only?
12. Should historical costs be frozen per run, or recalculated when component costs change?
