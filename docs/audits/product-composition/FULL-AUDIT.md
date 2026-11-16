# Invenos - Product Composition Audit (Consolidated)

**Status:** Read-only audit. No application code, schema or data was changed.
**Date:** 2026-11-15
**Branch audited:** `feature/product-composition` @ `50be1bd` (clinic baseline `master`)

This single file consolidates the audit index and documents 00-20 from this directory.
Each section is reproduced verbatim from its source file.

## Contents

- [Audit index / methodology](#readme)
- [00 - Executive Summary](#doc-00)
- [01 - Existing Product Architecture](#doc-01)
- [02 - Database & Data Integrity](#doc-02)
- [03 - Backend Product & Domain Entities](#doc-03)
- [04 - Backend Inventory & Stock Movement](#doc-04)
- [05 - Backend Sales & POS Transaction Impact](#doc-05)
- [06 - Backend Purchase & Procurement Impact](#doc-06)
- [07 - Frontend Product Management](#doc-07)
- [08 - Frontend POS / Sales](#doc-08)
- [09 - Reports & Analytics](#doc-09)
- [10 - Returns, Refunds & Reversals](#doc-10)
- [11 - Product Costing & Profitability](#doc-11)
- [12 - API, Serialization & Integrations](#doc-12)
- [13 - Authorization, Company Isolation & Security](#doc-13)
- [14 - Backup, Restore, Import & Export](#doc-14)
- [15 - Events, Jobs, Notifications & Automation](#doc-15)
- [16 - Frontend Shared Components & UX](#doc-16)
- [17 - Testing & Regression Coverage](#doc-17)
- [18 - Implementation Phases & Dependency Map](#doc-18)
- [19 - User Acceptance & Operational Testing](#doc-19)
- [20 - Cross-System Impact Matrix](#doc-20)

---

<a id="readme"></a>

<!-- ===== Source: README.md ===== -->

# Invenos — Product Composition Audit

**Status:** Read-only audit. No application code, schema, data, or branch was modified.
**Date:** 2026-11-15

## 1. Scope

This audit covers every subsystem that can be affected by introducing Formula / Composite
Products into Invenos:

- product identity, units, packaging, pricing and lifecycle;
- inventory ledger and stock writers;
- POS and sales;
- purchasing and procurement;
- returns, refunds and reversals;
- costing and profitability;
- reports, dashboards and exports;
- serialization, JSON endpoints and integrations;
- authorization and tenant isolation;
- backup/restore and data transfer;
- events, jobs, audit and automation;
- frontend product management, POS and shared UI;
- tests, regression coverage and implementation sequencing.

It covers three intended behaviors:

1. **Simple products** — unchanged.
2. **Composite / formula products** — a sellable product assembled from component products.
3. **Consumption-based products** — a service/sale whose template consumes components, with
   per-transaction overrides that never mutate the saved template.

## 2. Branch / worktree audited

| Item | Value |
|---|---|
| Repository root | `C:\Users\Rohan Raj Singh\Projects\invenos-product-composition` |
| Current branch | `feature/product-composition` @ `50be1bd` |
| Base branch | `master` @ `50be1bd` (the clinic baseline) |
| Fashion branch | `variation/clothing-erp` @ `d0ff43e`, in the separate `invenos-clothing-erp` / `invenos-backend` worktrees |
| Branch named `clinic` | **None.** The clinic line is `master`; `feature/product-composition` descends from it |
| Branch named `fashion` | **None.** Fashion is `variation/clothing-erp` |
| Uncommitted work in this worktree | `docs/architecture/product-composition-plan.md` (untracked, pre-existing; left untouched) |
| Fashion worktree | Not entered, not read beyond git metadata, not modified |

**Safety posture:** no branch switch, merge, rebase, reset, stash, checkout or commit was
performed. No fashion file was touched. No migration was executed. This directory is the only
write.

## 3. Method

1. Read git state (`branch -a -vv`, `worktree list`, `status`, `log`).
2. Mapped every PHP and TS/TSX file under `app/` and `resources/js/`.
3. Read all product, inventory, sales, purchase, return, report, backup, lifecycle and settings
   services and their controllers/requests.
4. Read every relevant migration to reconstruct the actual schema.
5. Searched the whole repository for product-type assumptions, stock writers, authorization and
   absent subsystems (`company_id`, `warehouse`, `production`, `formula`, `composite`).
6. Compared findings against the pre-existing (untracked) plan and the prior formula audit in
   `docs/`, and re-verified their claims against current code.
7. Wrote the audit as separate documents, then reconciled them into the cross-system matrix
   (`20-cross-system-impact-matrix.md`).

### Evidence legend

| Marker | Meaning |
|---|---|
| **VERIFIED** | Read directly in code, migration, route or test |
| **RISK** | Verified defect or architectural limitation that the feature would amplify |
| **PROPOSED** | Recommended design; not implemented |
| **ABSENT** | Searched for and not found |
| **UNKNOWN** | Requires a business/product decision |

File references use `path` plus class/method/table names. Exact line numbers are cited only
where they were captured directly during the audit; method names are used otherwise so the
reference does not rot.

## 4. Document index

| # | Document | Contents |
|---|---|---|
| 00 | [00-executive-summary.md](./00-executive-summary.md) | Overall findings, risk, sequence, decisions |
| 01 | [01-product-architecture.md](./01-product-architecture.md) | Product model, schema, units, packaging, lifecycle |
| 02 | [02-database-impact.md](./02-database-impact.md) | Every relevant table and relationship, schema proposal |
| 03 | [03-backend-product-domain.md](./03-backend-product-domain.md) | Services, DTOs, requests, controllers, dead code |
| 04 | [04-inventory-stock-impact.md](./04-inventory-stock-impact.md) | Ledger, stock writers, guards, transaction boundaries |
| 05 | [05-sales-pos-impact.md](./05-sales-pos-impact.md) | Sale lifecycle, server trust, formula expansion |
| 06 | [06-purchase-procurement-impact.md](./06-purchase-procurement-impact.md) | Purchasing, costing, component procurement |
| 07 | [07-frontend-product-management.md](./07-frontend-product-management.md) | Product list/form/detail, formula builder fit |
| 08 | [08-frontend-pos-impact.md](./08-frontend-pos-impact.md) | POS cart, editor, stock checks, receipts |
| 09 | [09-reports-analytics-impact.md](./09-reports-analytics-impact.md) | Every report and its formula |
| 10 | [10-returns-reversals-impact.md](./10-returns-reversals-impact.md) | Returns, refunds, reversal behavior |
| 11 | [11-costing-profitability-impact.md](./11-costing-profitability-impact.md) | Cost sources, roll-up, snapshots, margins |
| 12 | [12-api-integrations-impact.md](./12-api-integrations-impact.md) | Inertia, JSON endpoints, import/export, barcode |
| 13 | [13-security-permissions-impact.md](./13-security-permissions-impact.md) | Auth, roles, permissions, isolation |
| 14 | [14-backup-restore-data-transfer-impact.md](./14-backup-restore-data-transfer-impact.md) | Backup, restore, portability |
| 15 | [15-events-jobs-automation-impact.md](./15-events-jobs-automation-impact.md) | Events, jobs, audit, scheduling |
| 16 | [16-frontend-shared-components-impact.md](./16-frontend-shared-components-impact.md) | Reusable UI and accessibility |
| 17 | [17-testing-regression-impact.md](./17-testing-regression-impact.md) | Existing tests, gaps, regression matrix |
| 18 | [18-implementation-roadmap.md](./18-implementation-roadmap.md) | Phased plan, acceptance, rollback |
| 19 | [19-user-acceptance-testing.md](./19-user-acceptance-testing.md) | Business scenarios and pass/fail |
| 20 | [20-cross-system-impact-matrix.md](./20-cross-system-impact-matrix.md) | Mandatory cross-system matrix |

## 5. Important findings (short form)

1. **The composition domain is greenfield.** No formula, BOM, recipe, component, production or
   run table exists. `products.product_type` is a dead enum: it is fillable, but no request,
   DTO, service or UI writes or reads it; the live form hard-codes `'simple'`.
2. **The ledger already has a `consumption` movement type** and a single signed
   `inventory_transactions` table. There is no `production`, `transfer` or reserved-stock
   concept.
3. **Inventory is written from several places, not one.** `InventoryService` is the intended
   gateway, but product create writes an opening ledger row directly, product edit writes
   `stock_quantity` with no ledger at all, and two legacy return services write rows and
   increment/decrement directly.
4. **`InventoryService::applyMovement()` is private, yet `TransactionEngine` calls it.** The
   engine is registered but unreachable from any live route; if revived it fatals.
5. **All sale and purchase stock movements are atomic only because their services open
   `DB::transaction`.** The inventory method itself opens no transaction.
6. **No multi-company, warehouse, transfer, brand, variant, product-import, product-export,
   webhook or API-versioning layer exists on this branch.** Those parts of the brief are
   **ABSENT**, not merely incomplete.
7. **Authorization is mostly absent.** Only lifecycle delete/archive/restore are gated (and
   those gates are all `isAdmin`). Product/sale/purchase/return create and update run for any
   authenticated user; every relevant FormRequest returns `authorize(): true`.
8. **Costing has four valuation variants and three COGS variants.** Formula consumption must
   write cost explicitly or reports will disagree with each other.
9. **Reports treat one sale line = one stock movement = one revenue line.** A composite product
   breaks that assumption unless component consumption is recorded separately from sale lines.

## 6. Completeness checklist

| Area | Searched | Result |
|---|---|---|
| Product model/schema | `app/Models`, `database/migrations` | Complete |
| Product backend flow | controllers, requests, DTOs, services | Complete |
| Units/packaging | `ProductUnitService`, `PackagingDerivationEngine`, `app/Domains/Products` | Complete |
| Inventory | `InventoryService`, ledger, reconcile command | Complete |
| Sales/POS | `SaleService`, `SaleController`, `SaleBill.tsx` | Complete |
| Purchases | `PurchaseService`, `PurchaseController`, purchase migrations | Complete |
| Returns | canonical `ReturnService` + legacy return services | Complete |
| Reports | all `app/Domains/Reports/Services` + routes | Complete |
| Costing | `CostResolver`, purchase averaging, sale snapshot | Complete |
| Serialization/API | controllers, Inertia props, JSON endpoints | Complete (API thin) |
| Authorization | gates, policies, requests, controller `authorize` | Complete |
| Backup/restore | exporter, restorer, manifest, config | Complete |
| Events/jobs | observers, listeners, queue, schedule | Complete (none) |
| Frontend | `resources/js` pages, features, components, lib | Complete |
| Tests | `tests/Unit`, `tests/Feature` | Complete (catalogued) |
| Companies/warehouses/transfers | repository-wide search | **ABSENT** |
| Product import/export | repository-wide search | **ABSENT** |
| Brands/variants | repository-wide search | **ABSENT** |
| Manufacturing/production | repository-wide search | **ABSENT** |

## 7. Known limitations

- The full test suite was **not executed** during this audit. Test behavior is documented from
  the test source. The pre-existing plan records two failures on this baseline; they were not
  re-run here.
- Fashion was deliberately not audited beyond git metadata. Any statement about fashion comes
  from the pre-existing plan and is marked as such.
- Business decisions (yield, wastage, overhead, substitution, negative stock policy) cannot be
  resolved from code.
- No production database was inspected. All schema statements come from migrations and models.

## 8. Outstanding questions

See §7 of `00-executive-summary.md`. The blocking decisions are: composite vs consumption
semantics, whether consumption happens at sale or production, output yield, wastage, cost
snapshot policy, negative-stock policy for components, permission model, and whether
`product_type` should ever become meaningful.

## 9. Explicit non-goals

This audit does not implement formula functionality, does not create migrations, does not
modify models, forms, POS, inventory, reports, tests or configuration, and does not merge the
fashion branch.

---

<a id="doc-00"></a>

<!-- ===== Source: 00-executive-summary.md ===== -->

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

---

<a id="doc-01"></a>

<!-- ===== Source: 01-product-architecture.md ===== -->

# 01 — Existing Product Architecture

## 1. Product identity

**VERIFIED.** `App\Models\Product` (`app/Models/Product.php`) is the single Sku/pricing/stock
entity. It uses `SoftDeletes` and an independent archive axis.

| Column | Type | Default / constraint | Notes |
|---|---|---|---|
| `id` | bigint PK | auto | |
| `name` | varchar(255) | required | |
| `sku` | varchar(100) | unique constraint **dropped** | no index remains |
| `barcode` | varchar(100) nullable | unique constraint **dropped** | no index remains |
| `category_id` | FK `product_categories` | nullable, `nullOnDelete` | |
| `description` | text nullable | | |
| `product_type` | enum(`simple`,`composite`) | `simple` | **dead: never read or written by PHP** |
| `base_unit_id` | varchar(50) | `piece` | string, **no FK** to `product_units` |
| `track_inventory` | boolean | `true` | used by the stock guard only |
| `allow_negative_stock` | boolean nullable | no DB default; model default `true` | global setting default `false` |
| `stock_quantity` | decimal(12,2) | `0` | materialised cache of the ledger |
| `low_stock_threshold` | decimal(12,2) | `10` | |
| `status` | enum(`in-stock`,`low-stock`,`out-of-stock`) | DB `in-stock`, model `out-of-stock` | recomputed on movement |
| `last_purchase_cost` | decimal(12,2) nullable | | **per purchase pack**, not base unit |
| `default_purchase_cost` | decimal(12,2) nullable | | per purchase pack |
| `opening_cost` | decimal(14,6) nullable | | per base unit |
| `average_cost` | decimal(14,6) nullable | | weighted average per base unit |
| `uncosted_qty` | decimal(14,4) | `0` | stock quarantined from valuation |
| `supplier_name`, `location`, `created_by` | varchar | | free text, no FKs |
| `deleted_at` | timestamp nullable | SoftDeletes | |
| `archived_at`, `archive_reason`, `archived_by`, `delete_reason`, `deleted_by` | mixed | | archive and delete are independent |

Sources: `2026_07_25_204225_create_products_table.php`,
`2026_07_27_122649_add_last_purchase_cost_to_products.php`,
`2026_07_28_033719_add_allow_negative_stock_to_products.php`,
`2026_07_29_155741_add_lifecycle_fields_to_products.php`,
`2026_11_01_000002_add_cost_columns_for_weighted_average.php`,
`2026_11_01_000005_add_uncosted_qty_to_products.php`.

## 2. Model behavior

**VERIFIED.**

- `$attributes = ['stock_quantity' => 0, 'status' => 'out-of-stock', 'allow_negative_stock' => true]`.
  The model default for negative stock contradicts the global setting default.
- `$fillable` includes `product_type`, `stock_quantity`, `average_cost`, `opening_cost`,
  `uncosted_qty`, `allow_negative_stock`, `archived_at` is **not** fillable (set directly by
  the lifecycle service).
- Global scope `notArchived` → `whereNull('products.archived_at')`. `withArchived()` opts out.
- Relationships: `category()`, `sellingUnits()`, `packaging()`, `inventoryTransactions()`,
  `deletedBy()`. **No `sales()`, `purchases()`, `components()`, `formula()` relations.**
- `baseUnitName` accessor resolves display names through `ProductUnitService`.
- **No observers, events, listeners, jobs or policies on the model.**

## 3. Units and packaging

### 3.1 Canonical unit registry

`product_units` is seeded by `2026_07_28_121124_create_product_units_table.php` with 27 display
names (count/weight/volume/length). It has **no measurement-type column**. The type mapping and
conversion factors live in `ProductUnitService::MEASUREMENT_TYPES` and in the mirrored
`resources/js/lib/units.ts`.

| Unit family | Canonical base | Factors |
|---|---|---|
| count | `piece` | all count units factor 1 |
| weight | `mg` | `g` = 1000, `kg` = 1,000,000 |
| volume | `ml` | `litre` = 1000 |
| length | `cm` | `meter` = 100 |

`products.base_unit_id` is a **string**, not an FK. A formula line that stores
`product_units.id` and a ledger row that stores `products.base_unit_id` speak different
vocabularies; bridging must go through `ProductUnitService::resolveDisplayUnit()`.

### 3.2 Packaging is a unit hierarchy, not a recipe

`product_packaging` (`2026_07_28_121131_create_product_packaging_table.php`) is a directed
container→contains graph:

- `product_id`, `container_unit_id`, `contains_unit_id`, `quantity`, `level`;
- unique triple `(product_id, container_unit_id, contains_unit_id)`.

`PackagingDerivationEngine::derive($productId)` computes transitive factors at write time and
creates/updates `selling_units` (`quantity` = factor to base unit). `ConversionGraphService`,
`RelationshipTransformer` and `RelationshipGraphValidator` exist but have **zero callers** in
this branch.

**RISK:** packaging is sometimes mistaken for a bill of materials. It is not. It expresses
"1 Box = 12 Packs = 120 Capsules" for one product; a formula expresses "1 Burger = 1 Bun + 1
Patty + 1 Cheese + 20 ml Sauce" across products. Reusing `product_packaging` for formulas would
corrupt the derivation engine and mix two different graphs.

## 4. Selling units

`selling_units` (`2026_07_25_204226_create_selling_units_table.php`, extended by
`2026_07_28_121132_add_packaging_id_to_selling_units_table.php`):

| Column | Type | Notes |
|---|---|---|
| `product_id` | FK cascade | |
| `name` | varchar(100) | display |
| `unit_id` | varchar(50) | legacy string |
| `product_unit_id` | bigint nullable | current FK |
| `quantity` | decimal(12,4) | **base units per selling unit** |
| `sale_price` | decimal(12) | per selling unit |
| `barcode`, `sku` | varchar nullable | |
| `is_default` | boolean | service ensures exactly one |
| `packaging_id` | FK nullable | set when derived from packaging |

The POS and sale service treat `selling_units.quantity` as the conversion factor. The sale
service re-reads it server-side when `selling_unit_id` is supplied, which is the correct
authority; it trusts the client factor only when no selling unit id is sent.

## 5. Product lifecycle

**VERIFIED.**

```
create ──> active ──> archived ──> unarchived ──> active
                 └──> soft-deleted ──> restored ──> active
                 └──> soft-deleted ──> permanently deleted (admin)
```

- `archive` sets `archived_at` / reason / user, writes an audit log, and has **no stock effect**.
- `unarchive` clears those fields; `ProductPolicy::executeUnarchive` does nothing else.
- `delete` is blocked by `ProductPolicy::deleteBlocker()` when the product appears in any
  `sale_items` or `purchase_bill_items`. Archived products with stock can be deleted only if
  they have no document lines; stock is **not** reconciled by deletion.
- `restore` clears `deleted_at`; no stock effect.

**RISK:** product deletion is blocked only by sales/purchase line counts. A product that is
used only in a future composition table would not be protected unless the policy is extended.
Conversely, a composite that is a component of another formula must be added to the blocker.

## 6. Create workflow

```
GET /inventory/add  → ProductController@create
  props: categories, products (search 999), generated_sku
POST /inventory     → ProductController@store (CreateProductRequest)
  → CreateProductData::fromRequest()
  → ProductService::create() in DB::transaction
```

`ProductService::create()`:

1. inserts `products`;
2. if `stock_quantity > 0`, inserts an `inventory_transactions` row directly
   (`type=adjustment`, `reference=INITIAL`) — **bypasses `InventoryService`**;
3. recomputes `status`;
4. saves packaging levels and runs the derivation engine;
5. saves explicit selling units;
6. ensures at least one default selling unit;
7. ensures exactly one default.

**RISK:** `CreateProductData` has no `product_type`, `track_inventory` is passed, and
`allow_negative_stock` is validated but **not persisted** because the DTO does not carry it.
Any composition key added to the request must be threaded through `fromRequest()`, `toArray()`,
and both collision-branch reconstructions in `ProductController::store()`.

**RISK (verified defect):** on a SKU or barcode collision, `ProductController::store()`
reconstructs `CreateProductData` without the `packaging` argument, silently dropping packaging
levels.

## 7. Edit workflow

```
GET  /inventory/product/{id}/edit → ProductController@edit
PUT  /inventory/product/{id}      → ProductController@update (UpdateProductRequest)
```

`ProductService::update()`:

- `$product->update($data)` — **this writes `stock_quantity` directly from the form** with no
  inventory movement and no row lock;
- replaces packaging and re-derives if `packaging` is present;
- syncs custom selling units positionally;
- recomputes status.

**RISK (critical):** editing a product can silently change stock, diverging
`products.stock_quantity` from `SUM(inventory_transactions.quantity)`. This must be fixed in P0
before any feature that depends on stock integrity.

## 8. Deletion / restore

`ProductService::delete()` deletes packaging rows and soft-deletes the product. It does not
touch inventory or ledger rows. `ProductPolicy` blocks deletion when sale/purchase lines exist.
`ProductService::restore()` restores the model; no packaging is recreated.

## 9. Serialization

**VERIFIED.** There are **no API Resources**. Controllers pass models or `toArray()` directly
to Inertia. This means:

- `product_type`, `deleted_at`, `archived_by`, `archive_reason`, cost fields and all selling
  units are exposed to the browser;
- component/formula data added later would be exposed by default unless explicitly shaped.

## 10. Validation and authorization

| Request | Rules that matter | Authorization |
|---|---|---|
| `CreateProductRequest` | name, sku, base_unit_id required; packaging `required_with`; selling unit price `required_with` | `authorize(): true` |
| `UpdateProductRequest` | same + inline SKU/barcode closures | `authorize(): true` |
| `ProductController` | – | only `destroy/archive/unarchive` call `authorize('lifecycle.*')`; create/update are open to any authenticated user |

`product_type` is not validated anywhere. A crafted request cannot set it because the DTO drops
it; this is accidental safety, not policy.

## 11. Product-related JSON endpoints

| Endpoint | Route? | Reality |
|---|---|---|
| `GET /inventory/generate-sku` | yes | JSON; **the UI never calls it** (client has its own generator) |
| `GET /inventory/product-units` | **no** | `UnitRelationEditor` calls it, gets 404; unit autocomplete is dead |
| `GET /inventory/measurement-options` | **no** | dead |
| `GET /inventory/preview-packaging` | **no** | dead |
| `ProductController@index` | **no** | `inventory.index` is bound to `InventoryController@index` |

## 12. Introducing composition without breaking simple products

**PROPOSED.** The safe shape, given the code above:

1. Leave `products` table and `product_type` untouched.
2. Add `product_compositions` and `product_composition_items` keyed by `product_id`.
3. Read composition only on the product detail page / a dedicated tab; do not change the create
   payload.
4. Keep all existing simple-product queries valid by using `whereDoesntHave('composition')` only
   where a surface must distinguish the two.
5. Never infer "composite" from `product_type`; infer it from the presence of an active
   composition row.
6. Add a nullable `composition` key to the product detail props, not to the product table.

This preserves the current fast create path byte-for-byte, which is the explicit requirement.

---

<a id="doc-02"></a>

<!-- ===== Source: 02-database-impact.md ===== -->

# 02 — Database & Data Integrity Impact

## 1. Schema at a glance

**VERIFIED from `database/migrations/` (51 migrations).** Tables relevant to composition:

`products`, `product_categories`, `product_units`, `product_packaging`, `selling_units`,
`inventory_transactions`, `sales`, `sale_items`, `purchase_bills`, `purchase_bill_items`,
`returns`, `return_items`, `return_reasons`, `financial_transactions`, `contacts`,
`expenses`, `expense_categories`, `audit_logs`, `backups`, `restore_runs`,
`settings`, `users`, `roles`, `permissions`.

**ABSENT:** `companies`, `organizations`, `warehouses`, `stock_transfers`,
`product_formulas`, `product_compositions`, `production_runs`, `product_batches`,
`company_product_stock`, `company_selling_unit_prices`.

## 2. Table-by-table audit

### 2.1 `products`

| Attribute | Details |
|---|---|
| Purpose | Product identity, pricing anchor, materialised stock cache |
| PK | `id` bigint |
| FKs | `category_id → product_categories.id` (`nullOnDelete`) |
| Relationships (model) | category, sellingUnits, packaging, inventoryTransactions, deletedBy |
| Important columns | `name`, `sku`, `barcode`, `product_type`, `base_unit_id`, `track_inventory`, `stock_quantity`, `average_cost`, `opening_cost`, `uncosted_qty`, `allow_negative_stock`, lifecycle columns |
| Constraints | PK; `category_id` FK; **no unique index on SKU/barcode** (dropped); status index |
| Lifecycle | create / update / archive / soft delete / permanent delete |
| Composition impact | Must remain the identity for both simple and composite products. Formula tables reference it. Do not add composition columns here. |

**Precision:** `stock_quantity` decimal(12,2); `uncosted_qty` decimal(14,4); `average_cost` /
`opening_cost` decimal(14,6). Formula component quantities should not be constrained by the
products table precision; use decimal(14,6) or higher on formula rows.

**RISK:** `products.stock_quantity` can be written by product edit without a ledger row.

### 2.2 `product_categories`

| Attribute | Details |
|---|---|
| Purpose | Categories, optional industry label |
| PK | `id` |
| Constraints | `name` unique |
| Composition impact | None. A composite product uses the same category vocabulary. |

### 2.3 `product_units`

| Attribute | Details |
|---|---|
| Purpose | Unit display-name registry |
| PK | `id` |
| Constraints | `name` unique |
| Lifecycle | Inserted once; no UI management |
| Composition impact | Formula percentages/quantities need a unit identity. The registry has no measurement type, so conversion rules live in `ProductUnitService`. A formula row should store the unit **string used by the ledger** (the component's `base_unit_id`) or a `product_unit_id` plus a conversion snapshot. Storing both avoids later ambiguity. |

### 2.4 `product_packaging`

| Attribute | Details |
|---|---|
| Purpose | Container→contains unit hierarchy per product |
| PK | `id` |
| FKs | `product_id` cascade; `container_unit_id`/`contains_unit_id → product_units.id` |
| Constraints | unique `(product_id, container_unit_id, contains_unit_id)` |
| Composition impact | **Do not reuse.** It is a unit graph, not a multi-product recipe. |

### 2.5 `selling_units`

| Attribute | Details |
|---|---|
| Purpose | Sellable pack definitions and price |
| PK | `id` |
| FKs | `product_id` cascade; `packaging_id` nullable |
| Constraints | index `product_id`; service enforces one default |
| Important columns | `quantity` = base units per sale unit; `sale_price`; `is_default` |
| Composition impact | A composite is sold through a selling unit exactly like a simple product. The formula does not change the selling unit; it changes the stock effect. |

### 2.6 `inventory_transactions`

| Attribute | Details |
|---|---|
| Purpose | The only stock ledger; signed quantity |
| PK | `id` |
| FKs | `product_id → products.id` cascade |
| Important columns | `type`, signed `quantity` decimal(12,2), `unit_cost` decimal(14,6), `unit` varchar(50), `packaging_name`, `packaging_quantity`, `date`, `document_date`, `reference` varchar(100), `reference_type`, `reference_id`, `running_balance`, `user` |
| Constraints | indexes on product/type/date; **type enum** |
| Type values | `purchase`, `sale`, `return`, `sale-return`, `purchase-return`, `adjustment`, `damage`, `consumption` |
| Composition impact | `consumption` already exists. It is the natural type for component outflow. There is **no `production` / `production-output` type**, and no FK to a run. |

**RISK:** `reference_type`/`reference_id` are untyped (varchar/bigint) and there is no model
relation from the ledger back to sales, purchases or returns. A formula execution record must
use its own reference pair and should add an explicit FK if foreign-key integrity is required.
Adding a nullable `composition_run_id` to the ledger is the smallest safe change.

**Precision:** component quantities can be fractional (`20 ml`, `0.25 g`). The ledger stores
decimal(12,2) for quantity. That is **two decimal places**, which cannot represent `0.125 g`
exactly. This is a genuine precision risk for formula execution. A migration widening
`quantity` (and `running_balance`) to decimal(14,4) or (14,6) should be evaluated in P0/P1.

### 2.7 `sales` / `sale_items`

| Table | Constraints | Composition impact |
|---|---|---|
| `sales` | `invoice_number` unique; `customer_id` FK nullOnDelete; soft deletes; return fields | Revenue header for both simple and composite sales |
| `sale_items` | `sale_id` FK cascade; `product_id` FK restrict; `selling_unit_id` bigint nullable (no FK); `packaging_quantity`, `base_unit_quantity`, `base_quantity`, `unit_price`, `cost_price`, `total`, `discount_pct`, `restock` | A composite sale produces **one sale item** (the commercial product). Consumed components must not become sale items or revenue will double. |

**RISK:** `sale_items.cost_price` is the only COGS input. A composite's cost must be rolled up
and written here (or joined through a run) or profit reports will treat the whole unit price as
margin.

### 2.8 `purchase_bills` / `purchase_bill_items`

| Table | Constraints | Composition impact |
|---|---|---|
| `purchase_bills` | `invoice_ref` unique; `supplier_id` FK; soft deletes; return fields | Components are purchased as ordinary products; no change |
| `purchase_bill_items` | `purchase_bill_id` cascade; `product_id` restrict; `unit_cost_base` decimal(14,6) | Component purchase updates `products.average_cost`, which formula costing consumes |

### 2.9 `returns` / `return_items`

| Attribute | Details |
|---|---|
| Purpose | Canonical return header/line |
| PK | `id` |
| FKs | `reference_id` untyped; `contact_id` nullOnDelete; `reference_item_id` untyped; `product_id` nullOnDelete; `selling_unit_id` nullOnDelete |
| Constraints | unique `return_number`; indexes on reference/date/status/type |
| Lifecycle | `pending → completed → reversed`; `pending → cancelled` |
| Composition impact | Only the commercial product's line exists. A return must not try to restore components unless an explicit business decision says so. |

**RISK:** `return_items.reference_item_id` points to a `sale_items.id`. If a composite sale's
components are not sale items, there is nothing for a component return to reference. This is
acceptable only if components are never returned individually.

### 2.10 `financial_transactions`

| Attribute | Details |
|---|---|
| Purpose | Party invoice memos and cash movements |
| PK | `id` |
| FKs | `contact_id → contacts.id` (nullable after `2026_11_01_000001`); `linked_sale_id`, `linked_purchase_id`, `linked_return_id` nullable |
| Important columns | `event_key` unique (idempotent cash posting), `reversal_of_id`, `reversed_at`, `source_type`, `source_id` |
| Composition impact | None if consumption is an inventory-only event. No financial row should be created for component consumption. |

The original migration required `contact_id`; `2026_11_01_000001_add_cash_ledger_columns...`
changes it to nullable so walk-in sales and expenses can post cash. The same migration adds
`event_key`, which `CashLedgerService::record()` uses to make cash posting idempotent. Formula
execution should not write here at all.

### 2.11 `contacts`

Roles are JSON (`customer`, `supplier`, `patient`, …), balances are scalars. No composition
impact. Cross-company component references are impossible because there is no company concept.

### 2.12 `settings`

Single JSON row (`values`) with business/POS/inventory/sales/purchases/backup/receipt groups.
`inventory.allow_negative_stock` defaults to `false`, `stock_valuation_method` says `fifo`
but no FIFO engine exists. Composition policy (e.g. block short components) may belong here.

### 2.13 `audit_logs`

Morph `auditable_type`/`auditable_id`, event, reason, user, IP. Only lifecycle actions write
it today. Formula create/edit/execute/reverse should write there.

### 2.14 `backups` / `restore_runs`

Metadata only. New composition tables are automatically included in dumps (see document 14).

## 3. Referential integrity and lifecycle risks

| Concern | Current behavior | Composition risk |
|---|---|---|
| FK on component product | none (no formula table) | Must be `products.id`; decide `restrict` vs `nullOnDelete`. `restrict` protects history; `nullOnDelete` loses it. |
| Soft delete / archive | `products` archives and soft-deletes independently | A deleted/archived component must be rejected for new formulas and new executions, but historical runs must still render. Use `withArchived()`/`withTrashed()` in history reads. |
| Product permanent delete | blocked only by sale/purchase line counts | Must also be blocked by composition membership. |
| Cascade on formula delete | none | If a formula is deleted, runs must survive. Use soft delete on the template or restrict. |
| Case/rounding | decimal(12,2) ledger quantity | Fractional ml/g quantities need more precision. |
| Company isolation | **ABSENT** | No `company_id`; all products/components are global. |
| Historical integrity | sale/return snapshots store product name, price, cost | Formula runs must snapshot the template they used. |

## 4. Should template and execution be separated?

**PROPOSED: yes.** The two requirements conflict if merged:

- a saved formula must be editable and reusable;
- a past transaction must retain exactly what it consumed, even after the formula changes.

Therefore:

```
product_compositions          -- reusable template (versionable)
product_composition_items     -- template lines

composition_runs              -- one execution (sale, service, production)
composition_run_items         -- actual consumption snapshot per component
```

The run stores `template_quantity`, `actual_quantity`, `unit`, `unit_cost`, `total_cost` and a
nullable `inventory_transaction_id`. The template is never rewritten by an execution.

**Alternative considered:** one `product_components` table only. Rejected because editing the
formula would rewrite history and because per-transaction overrides are explicitly required.

**Versioning:** a `version` column on `product_compositions` plus `is_active`, or immutable
template rows. Recommended: `version` + `is_active`, and every run stores `formula_version`
and a JSON snapshot.

## 5. Proposed additive schema (not implemented)

```text
product_compositions
  id
  product_id            FK products (restrict)
  kind                  enum('assembly','consumption')
  version               unsigned int default 1
  name                  varchar nullable
  output_quantity       decimal(14,6) default 1
  output_unit_id        varchar(50) nullable
  is_active             boolean default true
  notes                 text nullable
  created_by            varchar nullable
  timestamps
  unique (product_id, kind, version)
  index (product_id, is_active)

product_composition_items
  id
  composition_id        FK product_compositions cascade
  component_product_id  FK products restrict
  quantity_base         decimal(14,6)       -- in component base unit
  display_unit_id       varchar(50) nullable
  wastage_pct           decimal(6,3) default 0
  is_optional           boolean default false
  sort_order            int default 0
  timestamps
  unique (composition_id, component_product_id)

composition_runs
  id
  run_number            varchar(50) unique
  composition_id        FK product_compositions restrict
  product_id            FK products restrict
  kind                  enum('assembly','consumption')
  source_type           varchar(50) nullable   -- sale, consultation, manual
  source_id             bigint nullable
  template_version      int
  template_snapshot     json
  quantity              decimal(14,6)          -- commercial qty sold/produced
  output_quantity       decimal(14,6) nullable
  total_cost            decimal(14,6) nullable
  unit_cost             decimal(14,6) nullable
  status                enum('pending','completed','reversed')
  effects_applied_at    timestamp nullable
  created_by            varchar nullable
  timestamps
  index (source_type, source_id)

composition_run_items
  id
  composition_run_id        FK cascade
  component_product_id      FK products restrict
  unit                      varchar(50)
  template_quantity         decimal(14,6)
  actual_quantity           decimal(14,6)
  unit_cost                 decimal(14,6) nullable
  total_cost                decimal(14,6) nullable
  inventory_transaction_id  FK inventory_transactions nullable (restrict)
  timestamps

inventory_transactions (additive, optional)
  + composition_run_id bigint nullable indexed
```

**Design notes**

- Quantities are decimal(14,6) to support grams/ml fractions.
- `template_snapshot` is the historical guarantee; `composition_run_items` is the queryable
  record.
- Do **not** add `company_id`; this branch is single-tenant. If it is ever needed, add a
  separate fashion-only migration.
- Do **not** add a `product_type` value. Composition is derived from an active
  `product_compositions` row.

## 6. Migration compatibility

| Concern | Assessment |
|---|---|
| Existing rows | Additive tables only; no backfill required |
| Existing simple products | Unchanged; they have no composition row |
| Existing reports | Unchanged until new movement types/joins are added |
| Migration order | Composition tables reference `products` only; safe on both branches |
| Down migrations | Drop new tables first; the ledger's nullable column last |
| Backup restore | New tables are discovered automatically; older backups restore to a schema that then runs `migrate` |

## 7. Data-integrity decisions still open

1. Should component lines be `restrict` on delete (recommended) or cascade?
2. Should a formula be soft-deleted, versioned, or both?
3. Is `output_quantity` fixed per template or per run?
4. Should the ledger quantity precision be widened before or during P1?
5. Should composition runs be reversible, and what does reversal do to `average_cost`?

---

<a id="doc-03"></a>

<!-- ===== Source: 03-backend-product-domain.md ===== -->

# 03 — Backend Product & Domain Entities

## 1. Layering

**VERIFIED.** The backend follows a light domain-service pattern:

```
routes/web.php
  → Controller (thin)
    → FormRequest (validation)
      → DTO (readonly constructor)
        → Domain Service
          → Eloquent model
            → DB::transaction
```

There are **no repositories**, **no API Resources**, **no events/observers**, and **no Actions
classes in use** (`app/Domains/*/Actions` directories exist only to satisfy the architecture
test). Business logic is centralized in services, but several small rules are duplicated.

## 2. Product routes and controller methods

| Route | Controller method | Routed? | Notes |
|---|---|---|---|
| `GET /inventory` | `InventoryController@index` | yes | `ProductController@index` is **dead** (no route) |
| `GET /inventory/add` | `ProductController@create` | yes | props: categories, all products, generated SKU |
| `POST /inventory` | `ProductController@store` | yes | |
| `GET /inventory/product/{id}` | `ProductController@show` | yes | props: product, movements, purchases, sales, lifecycle |
| `GET /inventory/product/{id}/edit` | `ProductController@edit` | yes | |
| `PUT /inventory/product/{id}` | `ProductController@update` | yes | |
| `DELETE /inventory/product/{id}` | `ProductController@destroy` | yes | lifecycle, admin gate |
| `POST /inventory/product/{id}/archive` | `ProductController@archive` | yes | admin gate |
| `POST /inventory/product/{id}/unarchive` | `ProductController@unarchive` | yes | admin gate |
| `GET /inventory/generate-sku` | `ProductController@generateSku` | yes | UI uses a client-side generator instead |
| `GET /inventory/product-units` | `ProductController@productUnits` | **no** | `UnitRelationEditor` calls it → 404 |
| `GET /inventory/measurement-options` | `ProductController@measurementOptions` | **no** | dead |
| `GET /inventory/preview-packaging` | `ProductController@previewPackaging` | **no** | dead |

**Evidence:** `routes/web.php` lines 21–36; `app/Http/Controllers/ProductController.php`.

## 3. Controllers

### `ProductController`

- `create`, `store`, `show`, `edit`, `update` render/redirect and delegate to `ProductService`,
  `PackagingDerivationEngine`, `ProductUnitService`, `InventoryService` (read-only) and
  `ProductPolicy`.
- `store` performs SKU/barcode collision handling by rebuilding `CreateProductData`.
  **RISK:** both reconstructions omit `packaging`.
- `show` loads only the last 20 movements/purchases/sales and calls
  `ProductPolicy::deleteBlocker()`.
- `destroy`/`archive`/`unarchive` call `authorize('lifecycle.*')`, which is admin-only.
- No `authorize()` on `create/store/edit/update`.

### `InventoryController`

- `index` is the real product list. It uses `InventoryService::search`, allowlists page sizes,
  and supports `archived=active|archived|all`.
- `adjust` validates `product_id` exists and is not archived, then calls
  `InventoryService::recordTransaction`.
- `overview`, `movements`, `lowStock`, `valuation` are read surfaces.

## 4. Form requests

### `CreateProductRequest`

Required: `name`, `sku`, `base_unit_id`.

Validates but does not persist:
- `allow_negative_stock` (validated, absent from `CreateProductData`),
- `product_type` (not validated at all).

Packaging rules use `required_with:packaging`; selling-unit price uses
`required_with:selling_units`.

### `UpdateProductRequest`

Same shape, plus inline closures for SKU/barcode uniqueness that query the database directly
and ignore `deleted_at` only because they call `withTrashed()`.

**RISK:** `stock_quantity` is validated and passed to `ProductService::update`, which writes it
directly. This is the single most important pre-existing integrity defect for composition.

### Other requests

`CreateSaleRequest`, `CreatePurchaseRequest`, `CreateSaleReturnRequest`,
`CreateContactRequest`, `UpdateSettingsRequest` all return `authorize(): true`.

## 5. DTOs

### `CreateProductData`

Fixed-arity readonly constructor. Fields: name, sku, barcode, categoryId, description,
baseUnitId, trackInventory, lowStockThreshold, stockQuantity, defaultPurchaseCost,
supplierName, location, createdBy, sellingUnits, purchaseConfig, packaging.

- `fromRequest()` maps snake_case.
- `toArray()` persists only product columns; it does **not** include `product_type`,
  `allow_negative_stock`, or composition.
- Any new key must be threaded through:
  1. `fromRequest()`,
  2. `toArray()`,
  3. both collision reconstructions in `ProductController::store()`.

### Sale/purchase DTOs

`CreateSaleData`, `SaleItemData`, `CreatePurchaseData`, `PurchaseItemData` are readonly and
carry client-supplied prices/quantities. See documents 05 and 06.

## 6. Services

### `ProductService`

| Method | Behavior | Composition relevance |
|---|---|---|
| `search` | name/SKU/barcode, category, paginated, eager loads category + selling units | New component picker can reuse |
| `create` | DB transaction; product insert; opening `adjustment` ledger row written **directly**; status; packaging + derivation; selling units; default enforcement | Formula must **not** create stock; do not attach here |
| `update` | DB transaction; `update($data)` writes stock directly; packaging replace + re-derive; custom selling-unit sync; status | Do not add stock-affecting formula behavior here |
| `delete` | deletes packaging, soft-deletes product | Composition membership must block deletion |
| `restore` | restore product | Should formula survive independently |
| `get` | `withArchived()` + category + selling units + packaging units | Add composition relation here for detail props |
| `generateSku` | prefix from name + count | Unrelated |
| `allCategories` | category list | Reusable for component filters |

### `PackagingDerivationEngine`

Write-time only; one-way `product_packaging → selling_units`. Computes transitive factors,
updates existing units without overwriting business fields, cleans up orphans. **No callers on
read paths.** Do not reuse for formulas.

### `ProductUnitService`

Single backend source for unit display and conversion (`resolveDisplayUnit`,
`resolveSellingUnit`, `resolvePurchaseUnit`, `getMeasurementType`, `getMeasurementOptions`,
`getConversionFactor` private). It is the correct service for formula unit conversion.

### `CostResolver`

`unitCost()` order: `average_cost` → `opening_cost` → latest purchase line `unit_cost_base` →
latest `unit_cost / pack_qty` → `last_purchase_cost / pack` → `default_purchase_cost / pack` →
`null`. `costBasis()` returns `exact`, `estimated`, `unavailable`. Use this for component cost
at execution.

## 7. Duplicated rules (verified)

| Rule | Implementations |
|---|---|
| Status recalculation | `InventoryService::applyMovement`, `ProductService::create`, `ProductService::update`, `SaleReturnService::recalculateStatus`, `PurchaseReturnService::create` |
| Base-unit conversion | `ProductUnitService`, `SaleService` (selling unit re-read), `PurchaseService` (pack × qty), frontend `units.ts` |
| Cost resolution | `CostResolver`, `InventoryService::getValuation` (sale price), `InventoryReportService::productCost` (legacy per-pack), `FinancialReportService` SQL, `ProductReportService` (last purchase cost), `PurchaseService` averaging |
| Stock writes | `InventoryService`, `ProductService::create`, `ProductService::update`, `SaleReturnService`, `PurchaseReturnService` |

This duplication is the main reason a new formula path must not invent another stock or cost
implementation.

## 8. Transaction boundaries

| Operation | Transaction? | Verified |
|---|---|---|
| `ProductService::create` | yes (`DB::transaction`) | yes |
| `ProductService::update` | yes | yes |
| `ProductService::delete` | yes | yes |
| `InventoryService::applyMovement` | **no** | yes; relies on caller |
| `SaleService::create` | yes | yes |
| `PurchaseService::create` | yes | yes |
| `ReturnService::createReturn` | yes | yes |
| `ReturnService::completeReturn` | yes | yes |
| `ReturnService::reverseReturn` | yes | yes |
| `RecordLifecycleService::archive` | **no** | yes (unarchive/delete/restore are wrapped) |
| `TransactionEngine::process` | yes | yes, but unreachable |

## 9. Events, observers and jobs

**ABSENT.** No model observers, no events/listeners, no queued domain jobs. The only listener-
like code is Laravel's auth email verification notification. Side effects are explicit service
calls, which is good for deterministic composition execution but means nothing happens
automatically on product/formula change.

## 10. Dead / unreachable code that composition must not reuse

| Item | Evidence | Decision |
|---|---|---|
| `TransactionEngine` | `app/Domains/Transactions/Services/TransactionEngine.php`; registered in `TransactionServiceProvider`, no consumer | Do not revive; it calls `InventoryService::applyMovement()` which is **private** |
| `SaleType`/`ReturnType` registry | only used by the engine | Unused |
| `SaleReturnService::create`/`PurchaseReturnService::create` | legacy direct ledger writers; `SaleReturnService` is injected into `SaleReturnController`, whose `store()` has no route but is still exercised by `ArchivedProductTest`; `PurchaseReturnService` has no consumer | Do not use for composition; do not remove without updating tests |
| `ConversionGraphService`, `RelationshipTransformer`, `RelationshipGraphValidator` | zero callers | Do not build on them |
| `ProductController` JSON endpoints | no routes | Do not expose without adding routes |
| `product_type` | no writer/reader | Do not add semantics |

## 11. How formula definitions fit

**PROPOSED**, following existing conventions:

| Concern | Implementation |
|---|---|
| Model | `App\Models\ProductComposition`, `ProductCompositionItem`, `CompositionRun`, `CompositionRunItem` |
| Service | `App\Domains\Composition\Services\CompositionService` (CRUD), `CompositionResolver`, `CompositionValidator`, `ConsumptionExecutor`, `CompositionCostCalculator` |
| Controller | `ProductCompositionController` (nested under product) or props on `ProductController@show` |
| Request | `SaveCompositionRequest` with `components.*` rules |
| Validation | component exists, not archived, `track_inventory`, quantity > 0, no self-reference, cycle detection, unit compatibility |
| Reads | product detail props `composition` (only for the detail page) |
| Writes | additive tables only; no product-table change |
| Versioning | `version` + `is_active`; runs store `template_version` + `template_snapshot` |

The existing service style (readonly DTO, `DB::transaction`, controller delegation) should be
followed. Do not put formula logic in `ProductService` beyond a read relation, to avoid touching
the most-used create/update path.

## 12. Authorization in the product domain

Only lifecycle actions are gated. There is no `products.create` / `products.edit` enforcement
even though those permissions are seeded. A formula permission set must be enforced in
controllers/requests, not only in React.

## 13. Findings summary

1. **VERIFIED:** product logic is centralized in `ProductService`, but stock/status/cost rules
   are duplicated across five services.
2. **VERIFIED DEFECT:** product update writes stock without a ledger row.
3. **VERIFIED DEFECT:** `TransactionEngine` calls a private method.
4. **VERIFIED DEFECT:** SKU/barcode collision drops packaging.
5. **RISK:** `product_type` is fillable but unvalidated and never written; any future writer
   could create a meaningless `composite` label.
6. **ABSENT:** composition relations, formula validation, formula permissions.

---

<a id="doc-04"></a>

<!-- ===== Source: 04-inventory-stock-impact.md ===== -->

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

---

<a id="doc-05"></a>

<!-- ===== Source: 05-sales-pos-impact.md ===== -->

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

---

<a id="doc-06"></a>

<!-- ===== Source: 06-purchase-procurement-impact.md ===== -->

# 06 — Backend Purchase & Procurement Impact

## 1. Purchase routes

**VERIFIED.** `routes/web.php`:

| Route | Method | Purpose |
|---|---|---|
| `GET /purchases` | `PurchaseController@index` | list |
| `GET /purchases/new` | `PurchaseController@create` | form |
| `POST /purchases` | `PurchaseController@store` | create |
| `GET /purchases/{id}` | `PurchaseController@show` | detail |
| `GET /purchases/{id}/print` | `PurchaseController@printBill` | print |
| `DELETE /purchases/{id}` | `PurchaseController@destroy` | soft delete + reversal |
| `GET /purchases/returns` | `PurchaseReturnController@index` | list |
| `GET /purchases/returns/{id}` | `PurchaseReturnController@show` | detail |

**ABSENT:** purchase edit/update, partial receiving workflow, purchase-order → bill
conversion, purchase import/export.

## 2. Purchase creation

**VERIFIED.** `PurchaseService::create(CreatePurchaseData)` inside `DB::transaction`:

1. requires a supplier contact with the `supplier` role;
2. for each line, locks the product, rejects archived products, computes
   `baseQuantity = purchase_pack_qty × purchase_quantity`, validates positive quantity and
   non-negative cost;
3. computes subtotal, discount, total, outstanding;
4. creates `purchase_bills`;
5. per line:
   - resolves the pack display name through `ProductUnitService`;
   - computes `costPerBase = unit_cost / purchase_pack_qty`;
   - creates `purchase_bill_items` with `unit_cost_base`;
   - updates `last_purchase_cost`, `default_purchase_cost`;
   - updates `average_cost` / `uncosted_qty` using the weighted-average rule;
   - calls `InventoryService::recordPurchase`;
6. updates supplier balance; records initial payout and invoice memo in the cash ledger.

### Weighted-average rule (verified)

```
costPerBase = unit_cost / purchase_pack_qty
if oldAvg === null:
    if qtyOnHand > 0: uncosted_qty += qtyOnHand
    average_cost = costPerBase
else:
    costedQty = max(0, qtyOnHand - uncosted_qty)
    average_cost = (costedQty*oldAvg + inQty*costPerBase) / (costedQty + inQty)
```

This is the cost that `CostResolver` will use to price component consumption.

## 3. Purchase validation gaps

| Gap | Evidence | Consequence for composition |
|---|---|---|
| No server-side pack/unit validation | `PurchaseService` uses `purchase_pack_qty` as supplied | A component's base-unit cost can be wrong, which propagates into formula cost |
| `purchase_quantity`/`purchase_pack_qty` client-supplied | `CreatePurchaseRequest` | Same |
| No `unit_cost_base` validation beyond numeric | request | Cost roll-up can inherit a bad cost |
| `status` is `received|pending` only | migration | No partial receiving; a purchase is either on stock or not |

These are pre-existing issues. They matter because formula cost and margin are only as correct
as the component's `average_cost`.

## 4. Purchasing components

**VERIFIED:** components are ordinary products. Buying them requires **no change**:

- the purchase form lists all non-archived products;
- purchasing a component updates its stock and `average_cost`;
- the next formula execution reads the updated `CostResolver` value.

**PROPOSED:** no automatic procurement, no MRP, no suggested purchase orders. The existing
system has no demand planning and the brief explicitly discourages introducing it without a
business requirement.

## 5. Purchasing a composite product

**RISK.** The purchase picker currently lists every non-archived product, including a future
composite. Buying a composite would increment its `stock_quantity` **without consuming its
components**, creating finished stock out of nothing.

Options:

| Option | Behavior | Assessment |
|---|---|---|
| Allow and treat as purchased finished goods | Stock in, no component consumption | Legitimate if the business buys the finished item instead of making it |
| Hide composites from purchasing | No way to buy a finished good | Safer default if the business never buys them |
| Allow but label "purchased finished good" | Clear intent | Recommended if both are possible |

**Decision required.** The system cannot infer intent. At minimum, the purchase UI should
indicate whether a product has a formula, and the backend should not silently accept it without
a documented rule.

## 6. Purchase returns

Two implementations exist:

1. **Canonical `ReturnService`** (`type=PURCHASE`) via `/returns/purchase`:
   - `createReturn` (pending) → `completeReturn` (applies effects once) → optional
     `reverseReturn`;
   - stock effect: `recordReturn(returnType: 'purchase')` = negative quantity, only when
     `restock` is true;
   - cost: current weighted average via `CostResolver`;
   - updates `purchase_bills.return_total` / `return_status`.
2. **Legacy `PurchaseReturnService`**:
   - creates a negative `purchase_bills` "PRET-…" document;
   - writes `inventory_transactions` directly and `decrement`s stock;
   - **no route consumes it** (verified: no controller references it).

**Composition consequence:** returning a component is normal. Returning a **composite** purchase
(if allowed) must not restore components; it should only reverse the finished-good stock that
the purchase added.

## 7. Supplier balances and cash

Purchases raise payables; payments settle them. Component consumption is an internal inventory
movement with **no supplier and no cash effect**. Do not create financial transactions for
formula execution.

## 8. Purchase reports

`PurchaseReportService` (delegated through `ReportService`, plus `/reports/purchases` and CSV
export) aggregates purchase bills and items. It has no concept of formula or component. No report
change is required merely because a product has a formula, except:

- if composites are purchasable, purchase reports should distinguish "finished good purchase"
  from "component purchase";
- component purchase cost is the input to formula costing, so a cost report that ignores
  `unit_cost_base` will mislead.

## 9. Required purchase changes

| Change | Phase | Notes |
|---|---|---|
| Decide whether composites are purchasable | P1 decision | Document the rule |
| Optionally filter/label composites in the purchase picker | P2/P7 | UI only |
| Validate pack quantity server-side | P0 (independent) | Protects formula cost |
| Extend `ProductPolicy` / picker for archived components | P1 | Already rejects archived on create |
| No procurement automation | – | Explicit non-goal |

## 10. Findings summary

1. **VERIFIED:** purchase creation is transactional and updates weighted average cost.
2. **VERIFIED:** no purchase edit, partial receiving or import/export exists.
3. **VERIFIED:** two purchase-return implementations exist; only the canonical one is routed.
4. **RISK:** purchase pack quantities are client-trusted, so component cost can be wrong.
5. **RISK:** purchasing a composite without a rule would create stock without consumption.
6. **PROPOSED:** no procurement automation; treat components as ordinary purchased products.

---

<a id="doc-07"></a>

<!-- ===== Source: 07-frontend-product-management.md ===== -->

# 07 — Frontend Product Management

## 1. Pages and routes

**VERIFIED.**

| Route | Page component | Wrapper |
|---|---|---|
| `GET /inventory` | `Pages/inventory/ProductList.tsx` | direct |
| `GET /inventory/add` | `Pages/inventory/CreateProduct.tsx` | renders `components/ProductForm.tsx` |
| `GET /inventory/product/{id}` | `Pages/inventory/ProductDetails.tsx` | direct |
| `GET /inventory/product/{id}/edit` | `Pages/inventory/EditProduct.tsx` (wrapper) | renders `components/ProductForm.tsx` |

Dead/duplicate page files exist (`ProductForm.tsx` at page level, `AddProduct.tsx`) and are not
routed.

## 2. Product list

`ProductList.tsx`:

- reads `products`, `categories`, `meta`, `filters` from Inertia props;
- **server-side** search/category/stock/archived/per-page via `router.get('/inventory', ...,
  { only: ['products','meta','filters'], preserveState: true, replace: true })`;
- completion status is computed **client-side** on the loaded page only;
- renders `ProductTable` on desktop and `ProductCardView` on mobile;
- total stock value is computed with `last_purchase_cost ?? default_purchase_cost`, i.e. a
  different basis from the reports.

`ProductTable.tsx` columns: product, SKU, category, stock, purchase price, sale price, value,
status, chevron. `ProductFilters.tsx`: search, category chips, stock chips, completion chips,
active/archived chips, mobile filter drawer.

**Composition relevance:** this list has no product-type column and no composition badge. A
formula product will look identical to a simple product. If the business needs to distinguish
them, add a read-only badge/prop rather than a filter that changes queries.

## 3. Add/Edit form

`components/ProductForm.tsx` is the only live form (hand-rolled state, no `<form>`, no
`useForm`).

### Structure

1. Product name (required, autofocus).
2. Your Cost / Selling Price.
3. Unit + Category (autocomplete; category "create on type" only writes the name into local
   state — it does not create a category).
4. **Unit relationships** — `components/unit/UnitRelationEditor.tsx`.
5. Collapsible **More Options**: barcode, SKU, starting/current stock, minimum stock, allow
   negative stock, description.
6. Sticky save bar: Enter = Save & Add Next, Ctrl/Cmd+Enter = Save & View.

### Payload

`buildPayload()` returns:

```ts
{
  name, sku, category_id, barcode, description,
  product_type: 'simple',       // hard-coded
  base_unit_id, selling_units, packaging,
  stock_quantity: stockQty,     // posted on BOTH create and edit
  low_stock_threshold,
  default_purchase_cost,
  allow_negative_stock,
  status
}
```

**VERIFIED:** `product_type` is hard-coded to `'simple'` (`ProductForm.tsx:177`). There is no UI
to choose a type, and the backend ignores it.

**RISK:** on edit, the form renders current stock as read-only text but still includes
`stock_quantity` in the payload from state (`openingStock` initialized to
`product.stock_quantity`). `ProductService::update` therefore writes stock directly. The UI does
not look like it changes stock, but the request does.

**RISK:** the unit autocomplete in `UnitRelationEditor` calls
`GET /inventory/product-units`, which has **no route**. Suggestions never appear; Enter on the
field bubbles to the global save handler.

**RISK:** the client relationship transformer can emit `container_unit_id: null` /
`contains_unit_id: null` for unfinished rows, while the server requires them
(`required_with:packaging`). A product with an incomplete relationship can fail with a 422.

**Validation:** only `name.trim()` is checked client-side. All server errors are joined into one
toast via `onError`. There are no field-level errors, no dirty-state guard, and no unsaved-change
confirmation.

## 4. Product detail

`ProductDetails.tsx`:

- header with stock badge, completion badge, archived badge;
- actions: Adjust Stock, Edit, Archive/Unarchive, Delete (admin-gated, disabled by server
  `deleteBlocker`);
- tabs built from an inline array: `Overview`, `Stock Movements`, `Purchase History`,
  `Sales History`;
- Overview cards: details (category, **product type**, track inventory, status, description),
  stock, pricing (cost, selling, margin);
- `AdjustStockDialog` posts `/inventory/adjust` with type `adjustment|damage|consumption` and a
  signed quantity (the dialog forces damage/consumption negative).

**Composition relevance:** the tab array at `ProductDetails.tsx` is the natural insertion point
for a `Formula` / `Recipe` tab. It adds zero cost to the create flow because it is only fetched
for the detail page.

## 5. Where a Formula Builder should live

**PROPOSED.**

| Option | Cost to simple-product flow | Assessment |
|---|---|---|
| **Formula tab on product detail** | Zero; loaded only when the page/tab is opened | **Recommended** |
| Collapsed section in More Options | One extra collapsed row; payload can omit the key when untouched | Good secondary entry |
| Type toggle on create ("I buy / I make") | Slows the fast create path; requires a real `product_type` write path | **Not recommended** |
| Separate "Formula Product" create page | Duplicates product creation and splits the catalog | Rejected |

Recommended behavior:

1. Product create/edit payload remains unchanged.
2. Product detail adds `composition` prop (null for simple products).
3. The Formula tab loads lazily (server prop or a JSON endpoint) and lets the user add, edit,
   reorder and remove components.
4. Saving a formula never touches `products.stock_quantity` and never creates an inventory row.

## 6. Formula builder UX requirements

| Requirement | Existing pattern to reuse |
|---|---|
| Component search | `ProductList` server search or a new JSON product search; do not send all products |
| Unit selection | `ProductUnitService` conventions; display the component's base unit and allow measurement conversion |
| Quantity input | `EditableQuantity` or a plain numeric input with `step` |
| Add/remove rows | `UnitRelationEditor` row pattern (plus icon, delete icon, inline validation) |
| Scaling preview | Show "per 1 unit × N" totals |
| Cost preview | Use component `average_cost`/`CostResolver`, display estimated only |
| Loading state | `ReportSkeleton` pattern or a simple skeleton |
| Empty state | `ProductTable` empty state pattern |
| Server errors | `onError` toast; add field-level errors if the builder is large |
| Large component lists | Server-side search/pagination; cap visible rows or virtualize |
| Unsaved changes | Add `beforeunload` guard (POS already does this) |
| Mobile | Use `Sheet`/drawer for the picker; keep the list scrollable |

### Invalid composition guards to surface

- a product cannot contain itself;
- duplicate component rows should merge or be rejected;
- quantity must be > 0;
- incompatible units must be rejected (count vs weight vs volume vs length);
- archived/deleted components cannot be added;
- a component that tracks no inventory needs an explicit decision;
- cycles (composite within composite) must be rejected server-side, even if the UI hides them.

## 7. Product type / capability display

`ProductDetails.tsx:238` prints `product.product_type || 'Simple'`. If composition is implemented
without changing `product_type`, this line will continue to say "Simple" for a formula product.
**PROPOSED:** derive the display from composition presence ("Formula" badge) and leave
`product_type` untouched. Do not backfill `product_type='composite'` unless a migration and all
readers are updated.

## 8. Frontend state and API integration

- Inertia `router` for navigation and mutations; `axios` only in the unit autocomplete (dead).
- No global state library: page-level `useState`.
- No optimistic updates; a successful save triggers an Inertia redirect/reload.
- No client-side pagination for products; the server paginates.
- No form schema validation library.

A formula builder can follow the same local-state + `router.post/put` pattern. If the builder is
large, a single form submit is still preferable to per-row requests, to keep the formula
transactional.

## 9. Findings summary

1. **VERIFIED:** the live product form is a single hand-rolled component; add/edit share it.
2. **VERIFIED:** `product_type` is hard-coded and inert.
3. **VERIFIED:** the product edit request can overwrite stock.
4. **VERIFIED:** the unit autocomplete endpoint is missing.
5. **PROPOSED:** attach formula management to the detail page, not the create path.

---

<a id="doc-08"></a>

<!-- ===== Source: 08-frontend-pos-impact.md ===== -->

# 08 — Frontend POS / Sales

## 1. Page and component map

**VERIFIED.** `Pages/pos/SaleBill.tsx` is the POS page. It composes:

| Component | Path | Responsibility |
|---|---|---|
| `TransactionSearchBar` | `features/transactions/search/SearchBar.tsx` | search, arrow/Enter selection |
| Cart table (inline) | `SaleBill.tsx` | desktop rows, unit select, qty, price, discount, total |
| `MobileCartList` | `features/billing/MobileCartList.tsx` | mobile cart |
| `TransactionSummary` | `features/transactions/cart/CartSummary.tsx` | subtotal, discount, grand total |
| `PaymentPanel` | `features/transactions/payment/PaymentPanel.tsx` | method, amount, hold, clear, record |
| `ConfirmTransactionDialog` | `features/transactions/dialogs/ConfirmDialog.tsx` | confirmation |
| `ConfirmClearDialog` | `features/transactions/dialogs/ClearConfirmDialog.tsx` | clear cart |
| `ReceiptDialog` | `features/pos/components/ReceiptDialog.tsx` | success receipt |
| `MobilePaymentDrawer` | `features/billing/MobilePaymentDrawer.tsx` | mobile payment |
| `CustomerSelect` | `features/pos/components/CustomerSelect.tsx` | customer |
| `EditableQuantity` | `Pages/pos/components/EditableQuantity.tsx` | qty editing |
| `BillResponsiveWrapper` | `features/billing/BillResponsiveWrapper.tsx` | layout |

There is **no** separate cart state store: all state is local `useState` in `SaleBill.tsx`.

## 2. State and persistence

| State | Persistence |
|---|---|
| `cart`, `discount`, `customer` | `sessionStorage` keys `invenos-pos-cart`, `invenos-pos-discount`, `invenos-pos-customer` (restored on mount, saved on change) |
| `priceOverrides`, `discountPcts` | memory only |
| held sales | `sessionStorage` key `invenos-pos-held` |
| payment method / amount | memory only |

A `beforeunload` guard is installed while the cart is non-empty. There is no server-side draft.

## 3. Cart model

`CartItem`:

```ts
{
  id, productId, name, sellingUnitId?, packagingName,
  packagingQuantity, baseUnitQuantity, baseQuantity,
  unitPrice, total, category
}
```

- **One cart line per product.** `addToCart` finds an existing `productId` and increments
  `packagingQuantity` instead of adding a second line.
- `baseQuantity = packagingQuantity × baseUnitQuantity`.
- Changing the selling unit recomputes `baseUnitQuantity` and `unitPrice`.
- Custom measurement units (`__custom_gram`, `__custom_ml`, …) are client-side options with a
  factor computed from `lib/units.ts`; the server re-derives only when a real `selling_unit_id`
  is posted, otherwise it trusts `base_unit_quantity`.
- Price override and discount % are maps keyed by `productId`, not by line id.

**Composition consequence:** because one line per product is enforced, a composite product's
consumption editor should be attached to the cart line/product, not to a sale-item id. If the
same composite is added twice, quantities merge; the consumption editor must reflect the merged
quantity or allow a per-line override model.

## 4. Search and barcode

- Search filters `name` and `sku` only (`filterPOSProducts`).
- The placeholder says "name, SKU, or barcode", but **barcode is not searched**.
- `settings.pos.barcode_scanner_enabled` and `auto_focus_barcode` exist but are not wired into
  this page.
- Arrow keys/Enter are handled in `TransactionSearchBar`.
- Products with no selling unit cannot be added (silently returns).

**ABSENT:** barcode scan buffer, hardware scanner integration, quantity scan multiplier.

## 5. Stock checks

- `handleRecordSale` performs a client-side check for each cart line where
  `product.track_inventory !== false`.
- If insufficient, a dialog shows the shortage and offers **Proceed with Sale**, which posts
  `bypass_stock_check: true`.
- The server guard is the real check, but `bypass_stock_check` disables it.
- There is no check for component availability because components are not in the cart.

**Composition consequence:** the client cannot compute component availability from the current
props. It must either receive a server-computed `available`/`max_sellable` value per composite or
rely on the server to reject and display a structured error.

## 6. Checkout and API request

`doSubmitSale(bypassStockCheck)` posts:

```json
{
  "items": [{
    "product_id", "quantity", "packaging_quantity", "packaging_name",
    "selling_unit_id", "base_unit_quantity", "unit_price", "total"
  }],
  "customer_id", "discount", "amount_paid", "payment_method",
  "payment_status", "source": "pos", "date", "bypass_stock_check": true
}
```

- `payment_status` is derived on the client.
- No idempotency key.
- On success, the receipt is built **client-side** with fake `saleId`/`invoiceNumber`.
- On error, the first error value is toasted as a string.

## 7. Receipt

`ReceiptDialog` shows a success card, item summary, totals and payment. "Print Receipt" and
"Share Receipt" are prototype toasts. "View Sale" navigates to `/sales/${saleData.saleId}`, where
`saleData.saleId` is `sale-${Date.now()}` — **not** a valid sale id. The real sale is accessible
only from the Sales list.

**Composition consequence:** a consumption summary would be useful on the receipt if the
business wants transparency ("used 5 ml serum"), but it must not look like sold line items.

## 8. Keyboard, touch and mobile

- `Ctrl/Cmd+Enter` opens the confirm dialog.
- `TransactionSearchBar` supports ArrowUp/Down/Enter/Escape.
- Desktop table and mobile card list are separate render paths (`hidden sm:flex` vs
  `block sm:hidden`).
- Mobile uses `MobilePaymentDrawer` and `MobileCartList`.
- No explicit `aria-label` on most icon buttons; several rely on `title`.

**Composition consequence:** a consumption editor must work in both desktop and mobile paths.
The existing `Dialog`/`Sheet` components are responsive enough; do not build a new modal system.

## 9. Where the consumption editor belongs

**PROPOSED.**

| Placement | Pros | Cons |
|---|---|---|
| **On add-to-cart for a consumption product** | Operator decides at capture time; clear intent | Interrupts fast scanning |
| **A "Consumption" button on the cart line** | Non-blocking; default template is used if never opened | Easy to forget |
| **Checkout review step** | One place to confirm all components | Too late for a long cart |

Recommended hybrid:

1. Adding a consumption product uses the saved template automatically (fast path).
2. The cart line shows a badge and a small "Consumption" action.
3. Opening it shows a modal/sheet with component rows, default quantities × sold quantity,
   and an override input.
4. Checkout shows a compact "will consume N components" review; shortages are surfaced there
   and the sale is blocked server-side.

The editor must never modify the saved template. It sends only the per-sale overrides.

## 10. Representation of formula products

| Surface | Recommendation |
|---|---|
| Search result | Small badge ("Formula"/"Service") next to the name |
| Cart line | Badge + "Consumption" action; quantity remains the commercial unit |
| Confirm dialog | Show sold commercial line; optionally a collapsible consumption summary |
| Receipt | Optional "Materials used" section, visually separate from items |
| Product picker | No filtering by default; a chip filter if catalogs grow |

Do **not** explode components into cart lines. That would:
- show ingredient quantities as sold items;
- multiply revenue lines;
- make returns ambiguous;
- break the "one line per product" invariant.

## 11. Error and loading states

- Sale submission uses Inertia `onError` and a single toast.
- There is no per-field error display.
- There is no optimistic cart persistence on the server.
- A server rejection of a component shortage must map to a readable message; recommended shape:
  `{ items: "Insufficient Serum: need 10 ml, available 4 ml" }`.

## 12. Findings summary

1. **VERIFIED:** POS is a single page with local state and sessionStorage cart.
2. **VERIFIED:** one cart line per product; selling-unit changes recompute base quantity.
3. **VERIFIED:** barcode is not searched despite the placeholder.
4. **VERIFIED:** the client can bypass the stock guard and the receipt is fabricated.
5. **RISK:** the client cannot compute component availability; server must be authoritative.
6. **PROPOSED:** default-template consumption with an optional per-line override editor.

---

<a id="doc-09"></a>

<!-- ===== Source: 09-reports-analytics-impact.md ===== -->

# 09 — Reports & Analytics Impact

## 1. Report surface inventory

**VERIFIED.** All report routes are in `routes/web.php` under `/reports`, served by
`ReportController`, which delegates to `app/Domains/Reports/Services/*`.

| Route | Page | Service method | Primary sources |
|---|---|---|---|
| `/reports` | `reports/ReportsLanding` | – | – |
| `/reports/sales` | `reports/SalesReport` | `SalesReportService::register` + `topProducts` + `byCustomer` | `sales`, `sale_items`, `returns` |
| `/reports/sales/by-customer` | `reports/CustomerSales` | `byCustomer` | `sales` |
| `/reports/sales/top-products` | `reports/TopProducts` | `topProducts` | `sale_items`, `sales` |
| `/reports/purchases` | `reports/PurchaseReport` | `PurchaseReportService::register` | `purchase_bills`, `returns` |
| `/reports/stock` | `reports/StockReport` | `InventoryReportService::stockReport` | `products`, `inventory_transactions`, `return_items` |
| `/reports/stock/print` | `reports/StockPrint` | `stockReport` (all rows) | same |
| `/reports/stock/ledger` | `reports/StockLedger` | `stockLedger` | `inventory_transactions` |
| `/reports/stock/low-stock` | `reports/LowStockReport` | `lowStock` | `products` |
| `/reports/customers/ledger` | `reports/CustomerLedger` | `ContactReportService::customerLedger` | party ledger |
| `/reports/suppliers/ledger` | `reports/SupplierLedger` | `supplierLedger` | party ledger |
| `/reports/day-book` | `reports/DayBookReport` | `DayBookReportService::generate` | all documents + ledger |
| `/reports/financial-overview` | `reports/FinancialOverview` | `FinancialReportService::overview` | sales, returns, purchases, expenses, `sale_items`, products |
| `/reports/product-ledger` | `reports/ProductLedger` | `ProductReportService::timeline` | `inventory_transactions` |
| `/reports/cash-flow` | `reports/CashFlowReport` | `FinancialReportService::cashFlow` | cash ledger |
| `/reports/pnl` | `reports/PnLReport` | `SalesReportService::profit` | sales, returns, `sale_items`, expenses |
| `/reports/balance-sheet` | `reports/BalanceSheetReport` | `FinancialReportService::balanceSheet` | cash, products, sales, purchases, expenses |
| `/reports/party` | `reports/PartyReport` | `PartyLedgerService::statement` | ledger |
| `/reports/sales/export/csv` | stream | `ExportService::csv` | sales |
| `/reports/purchases/export/csv` | stream | `ExportService::csv` | purchases |
| `/reports/stock/export/csv` | stream | `ExportService::csv` | stock report |
| `/reports/stock/export/excel` | download | `ExportService::excel` | stock report |
| `/reports/stock/ledger/export/csv` | stream | `ExportService::csv` | ledger |
| `/reports/stock/low-stock/export/csv` | stream | `ExportService::csv` | low stock |
| `/reports/day-book/export/csv` | stream | `ExportService::csv` | day book |
| `/reports/share/{report}` | `ReportShareController` | PDF/temp share | varies |

Dashboard (`DashboardController` + `DashboardReportService`) shows today's sales, returns,
purchases, expenses, low stock, receivables and recent sales.

## 2. Current formulas

### 2.1 Revenue

| Report | Formula |
|---|---|
| Sales register | `sales.grand_total` per invoice; returns subtracted separately |
| Financial overview | `Σ sales.grand_total` − completed sale returns |
| P&L | `net revenue = gross sales − completed returns` |
| Day book | same plus payments/expenses |

### 2.2 COGS

| Report | Formula | Difference |
|---|---|---|
| Financial overview | `Σ sale_items.base_quantity × COALESCE(cost_price,0)` for **all** sales in range | does not exclude returned sales; unknown cost = 0 |
| P&L (`SalesReportService::profit`) | same, **excluding** sales with completed returns | different number from overview |
| Day book | same as financial overview | |
| Balance sheet | `Σ sale_items.base_quantity × cost_price` up to date | |

### 2.3 Inventory valuation

| Surface | Formula |
|---|---|
| `InventoryService::getOverview` | `stock × MIN(sale_price)` |
| `InventoryService::getValuation` | `stock × MIN(sale_price)` |
| `InventoryReportService::stockReport` summary | `max(0, stock − uncosted) × productCost()` where `productCost` = average → opening → last purchase → default |
| `InventoryReportService::stockReport` per-row `value` | `stock × productCost()` (does **not** subtract uncosted) |
| `FinancialReportService` / balance sheet | SQL `GREATEST(stock − uncosted,0) × COALESCE(average, opening, last, default)` |
| `ProductReportService::timeline` | `stock × last_purchase_cost` |
| `ProductList.tsx` / `ProductTable.tsx` | `last_purchase_cost ?? default_purchase_cost` |

**RISK:** these are four different valuation bases (sale price, cost with uncosted subtraction,
cost without subtraction, legacy pack cost). A composed product will inherit all of them.

### 2.4 Stock movement

`InventoryReportService::stockMovement`:

```
purchased      = Σ quantity where type=purchase
sold           = |Σ quantity where type=sale|
sale_returns   = return_items (completed SALE)
purchase_returns = return_items (completed PURCHASE)
adjustments    = Σ quantity where type IN ('adjustment','damage','consumption')
                 and reference <> 'INITIAL'
net            = purchased − sold + sale_returns − purchase_returns + adjustments
opening        = closing − net
```

**VERIFIED:** `consumption` is folded into `adjustments` (line ~368). It is not separately
visible.

### 2.5 Top selling

`SalesReportService::topProducts` and `InventoryReportService::topSelling` aggregate
`sale_items` by product. Components are invisible unless they have sale items.

## 3. Impact of composition

### 3.1 Revenue

- A composite sold as one commercial line produces one revenue line. **Correct.**
- If components are expanded into sale items, revenue is multiplied and reports become wrong.
  **Do not do this.**
- A consumption-based service produces revenue for the service product only. Its consumed
  components must not appear as revenue.

### 3.2 COGS

- Current COGS reads `sale_items.cost_price`. If a composite's cost is not rolled up into that
  field, COGS = 0 and gross profit = full revenue (overstated).
- If components are added as sale items with cost but zero price, revenue is unchanged but
  top-product/quantity reports count components as sold. **Not recommended.**
- Recommended: write the rolled component cost into the composite's `sale_items.cost_price` and
  retain the breakdown in `composition_run_items`.

### 3.3 Inventory valuation

- Consumed components reduce their own stock and value. That is correct.
- A finished composite produced into stock must have its `average_cost` written from the run, or
  its stock value will be zero/legacy.
- A consumption-based service product should not hold stock; if it has `track_inventory = false`
  or zero stock, valuation is unaffected.

### 3.4 Stock movement

- Component consumption appears as `consumption`. Today it is lumped into "adjustments". This
  makes the stock report show a large unexplained adjustment line.
- **Required change:** add a distinct `consumed` bucket to `stockMovement`, and decide whether it
  is shown separately or netted into a "component usage" section.
- Production output needs a positive movement type that is not `purchase`; otherwise purchased
  stock is overstated.

### 3.5 Top products / product profitability

- Top products by quantity and revenue should list commercial products, not components.
- A "component usage" report is a **new** report; do not overload top-selling.

### 3.6 Returns

- Revenue reports subtract completed returns.
- Stock reports use `return_items` for sale/purchase returns. Component consumption reversals
  (if any) are not return items and would not be counted.

## 4. Distinguishing the four product roles

| Role | Revenue | COGS | Stock effect | Report treatment |
|---|---|---|---|---|
| **Commercial product sold** | yes | yes | sale movement | sales, top products, P&L |
| **Component consumed** | no | part of parent cost | consumption movement | inventory usage report (new) |
| **Finished product manufactured** | no (until sold) | cost transferred in | positive production movement | inventory/valuation |
| **Finished product sold** | yes | finished cost | sale movement | sales, top products |

Reports must not collapse roles 1 and 3 merely because both are rows in `products`.

## 5. Reports that become misleading if unchanged

| Report | Why it misleads |
|---|---|
| Stock Report movement | consumption hidden inside "adjustments" |
| Stock valuation | produced goods have no cost unless written; components consumed reduce value correctly but the reason is invisible |
| Financial Overview COGS | unknown/rolled cost = 0; returns not excluded |
| P&L | COGS excludes returned sales but overview does not; two different answers |
| Top Products | components omitted or, if expanded, falsely counted as sold |
| Product Ledger | only shows movements for the selected product; no link to the parent formula |
| Day Book | no composition events; consumption is invisible operationally |
| Dashboard | low stock is component-aware automatically, but no "formula product unavailable" signal |

## 6. Required report changes by phase

| Change | Phase | Report |
|---|---|---|
| Add `consumed` bucket to stock movement | P7 | `InventoryReportService::stockMovement` |
| Classify new production movement type | P7 | same |
| Roll cost into sale item cost (or join runs) | P5 | COGS paths |
| Do not create component sale items | P4 | sales/top products |
| Add component usage report | P7 | new |
| Add formula availability/stock warning | P4 | POS/dashboard |
| Keep valuation basis consistent | P7 (or P0) | all valuation paths |
| Exclude returned sales consistently | P0 (independent) | overview vs P&L |

## 7. Export impact

`ExportService` is generic; CSV/Excel/PDF column maps live in `ReportController`. New
composition columns must be added explicitly to those maps. There is no product import/export,
so no format migration is required.

## 8. Findings summary

1. **VERIFIED:** report formulas are inconsistent across surfaces (4 valuation, 3 COGS).
2. **VERIFIED:** consumption is currently invisible, folded into adjustments.
3. **RISK:** composite COGS will be zero unless cost is rolled up.
4. **RISK:** expanding components into sale items corrupts revenue and top-product reports.
5. **PROPOSED:** keep one commercial sale line, add a consumption breakdown, and add a separate
   component usage report.

---

<a id="doc-10"></a>

<!-- ===== Source: 10-returns-reversals-impact.md ===== -->

# 10 — Returns, Refunds & Reversals

## 1. Canonical return lifecycle

**VERIFIED.** `App\Domains\Returns\Services\ReturnService` is the routed implementation
(`ReturnWorkflowController`).

```
createReturn (pending)
   → completeReturn (completed, effects applied once)
        → reverseReturn (reversed, compensating records)
   → cancelReturn (cancelled, no effects)
```

Guards:

- cannot complete twice (`effects_applied_at` check);
- cannot complete a non-pending return;
- cannot reverse a non-completed return;
- over-return is rejected using `ReturnModel::returnedQuantityForItem()`.

## 2. Effects applied on completion

**VERIFIED.**

1. **Stock**
   - Sale return + `restock=true`: `recordReturn(returnType: 'sale')` → `sale-return` positive.
   - Sale return + `restock=false`: `damage` +qty then `damage` −qty (net zero, visible as
     returned-then-written-off).
   - Purchase return + `restock=true`: `recordReturn(returnType: 'purchase')` →
     `purchase-return` negative.
   - Purchase return + `restock=false`: no stock effect.
   - Cost: sale return uses the original `sale_items.cost_price`; purchase return uses current
     `CostResolver`.
2. **Party balance:** credit note reduces the contact balance by `grand_total`.
3. **Cash:** only the refund amount moves, through `CashLedgerService` with
   `event_key = refund:{id}:{return_number}`.
4. **Original document:** `return_total` / `return_status` updated.

## 3. Reversal

`reverseReturn`:

- finds ledger rows by `reference = return_number` and types
  `sale-return|purchase-return|damage`;
- writes negated adjustments with `REV-{return_number}` (which **bypasses the negative-stock
  guard by design**);
- reverses refunds via `CashLedgerService::reverse`;
- undoes the credit note;
- restores the original document's return tracking;
- marks `reversed`.

## 4. Legacy return services

**VERIFIED (dead via HTTP, still callable):**

| Service | Behavior | Routed? |
|---|---|---|
| `SaleReturnService::create` | creates a `RET-…` sale, creates sale items, writes `inventory_transactions` directly and `increment`s stock | `SaleReturnController@store` has no route |
| `PurchaseReturnService::create` | creates a `PRET-…` bill, writes a negative ledger row and `decrement`s stock | no controller at all |

They bypass `InventoryService`, the negative guard, and the run/return lifecycle. **Do not use
them for composition.**

## 5. Sale deletion as a reversal

`SalePolicy::executeDelete`:

- adds back each `sale_items.base_quantity` via `recordAdjustment` with `REV-…`;
- decrements customer balance;
- reverses cash rows;
- deletes the invoice memo.

`canDelete` blocks only when a `sale-return` ledger row references the invoice.

**RISK:** if a sale consumed components, deleting the sale restores the commercial product but
does nothing about the components. If the composite is not stocked, the sale item's
`base_quantity` may be unrelated to the component usage.

## 6. Formula / composite return semantics

### 6.1 Assembled composite (produced into stock)

- The finished good is a normal stocked product, so a normal sale return can restock it when
  `restock=true`.
- The components consumed during **production** are not returned by a sale return. They were not
  consumed by the sale.
- Reversing the **production run** is a separate operation and must be explicit.

**Recommended:** sale return restocks the finished good only. Production reversal is a separate
manufacturing action.

### 6.2 Consumption-based service

- The service product is not stocked (or has no meaningful stock).
- The ingredients have already been consumed and generally cannot be restored.
- A refund should reverse revenue/cash, not inventory.
- **Recommended:** no automatic component restoration. Optionally allow an explicit
  "recovered quantity" input if some components are physically recoverable, but that should
  create a new adjustment with a reason, not silently restore the formula.

### 6.3 Composite sold without production (assembly at sale)

This model should be avoided, but if used:

- components were consumed at sale, so a return must decide whether to restore them;
- restoring all components can create stock that no longer exists physically;
- restoring none overstates cost.

**Decision required.** The safest default is: do not restore components automatically; require
an explicit restock decision per component (or treat the whole return as a service refund).

## 7. Return quantities and snapshots

- `return_items` references the original `sale_items`/`purchase_bill_items` by id and stores
  `quantity`, `base_quantity`, `unit_price`, `total`, `restock`.
- There is no reference to a composition run. If a component-level return is ever needed, the
  schema must add `composition_run_item_id`.
- Over-return is computed from the original item quantity, not from the composition run.

## 8. Failure and partial-processing behavior

- All effects are inside `DB::transaction`; a failure rolls back the whole completion.
- Reversal is also transactional and writes compensating rows rather than deleting history.
- A sale delete is transactional.
- Legacy services are transactional but bypass the guard.

**Composition consequence:** component consumption must share the same transaction as the sale
so a failed sale leaves no consumption. Return completion must likewise wrap any restock
decision.

## 9. Business decisions required

1. Does a returned consumption-based service restore any component? (Recommendation: no by
   default.)
2. Does a returned assembled composite restock the finished good? (Recommendation: yes if
   `restock=true`.)
3. Can a production run be reversed independently of a sale? (Recommendation: yes, explicit
   action.)
4. If a component is restocked on return, at what cost? (Recommendation: original run cost
   snapshot, not current average.)
5. Should deleting a sale with a consumption run be blocked, or should it reverse the
   consumption? (Recommendation: block until the run is explicitly reversed, or reverse with a
   clear audit event.)
6. Are partial returns of a service allowed? (Revenue refund can be partial; component
   restoration should not be proportional automatically.)

## 10. Required changes

| Change | Phase | Notes |
|---|---|---|
| Decide component restoration policy | P1 decision | Document it |
| Add `composition_run_id` linkage to return flow if needed | P6 | Optional |
| Block or handle sale deletion with runs | P6 | `SalePolicy` |
| Never use legacy return services for new paths | P0 | Fence or remove |
| Record return cost from run snapshot | P6 | Preserve historical cost |
| Add regression tests for service refunds | P6 | No stock change expected |

## 11. Findings summary

1. **VERIFIED:** canonical returns are idempotent, transactional and reversal-based.
2. **VERIFIED:** legacy return services bypass the inventory gateway.
3. **RISK:** sale deletion has no concept of component consumption.
4. **UNKNOWN:** whether consumed components can be recovered.
5. **PROPOSED:** refund money without restoring ingredients; restock only the commercial
   finished good when explicitly requested.

---

<a id="doc-11"></a>

<!-- ===== Source: 11-costing-profitability-impact.md ===== -->

# 11 — Product Costing & Profitability

## 1. Existing cost sources

**VERIFIED.**

| Field | Meaning | Precision |
|---|---|---|
| `products.average_cost` | weighted average per base unit | decimal(14,6) |
| `products.opening_cost` | declared cost of opening stock per base unit | decimal(14,6) |
| `products.last_purchase_cost` | **per purchase pack** | decimal(12,2) |
| `products.default_purchase_cost` | **per purchase pack** | decimal(12,2) |
| `products.uncosted_qty` | stock with no reliable cost | decimal(14,4) |
| `purchase_bill_items.unit_cost` | per purchase pack | decimal(12) |
| `purchase_bill_items.unit_cost_base` | true cost per base unit | decimal(14,6) |
| `sale_items.cost_price` | cost snapshot per base unit at sale | decimal(12) |
| `inventory_transactions.unit_cost` | cost per base unit at movement | decimal(14,6) |

## 2. `CostResolver`

`app/Domains/Inventory/Services/CostResolver.php`:

```
average_cost
  ?? opening_cost
  ?? latest purchase line unit_cost_base
  ?? latest purchase line unit_cost / purchase_pack_qty
  ?? last_purchase_cost / default pack qty
  ?? default_purchase_cost / default pack qty
  ?? null
```

`costBasis()`: `exact` (average/opening), `estimated` (purchase line or legacy pack),
`unavailable` (null). This is the correct service for formula component cost.

## 3. Purchase cost update

`PurchaseService::create` per line:

```
costPerBase = unit_cost / purchase_pack_qty
if oldAvg === null:
    if qtyOnHand > 0: uncosted_qty += qtyOnHand
    average_cost = costPerBase
else:
    costedQty = max(0, qtyOnHand - uncosted_qty)
    average_cost = (costedQty*oldAvg + inQty*costPerBase) / (costedQty + inQty)
```

It also stores `last_purchase_cost` and `default_purchase_cost` per **pack**, which is why every
consumer must divide by the pack factor. `CostResolver` does; some reports do not.

## 4. Sale cost snapshot

`SaleService::create`:

1. consumes `uncosted_qty` first (`max(0, uncosted − baseQty)`);
2. `cost_price = CostResolver::unitCost($product)`;
3. writes `sale_items.cost_price`;
4. passes `unit_cost` to `recordSale`.

**RISK:** if `uncosted_qty > 0`, the sale still writes the full average as `cost_price` for the
whole quantity, so COGS prices uncosted units at the average. The quarantine is in quantity and
valuation, not in the sale cost snapshot. This is a pre-existing inconsistency.

## 5. Report cost formulas

### COGS

| Report | Formula |
|---|---|
| Financial overview | `Σ base_quantity × COALESCE(cost_price,0)` all sales in range |
| P&L | same, excluding sales with completed returns |
| Day book | same as overview |
| Balance sheet | same up to date |

Unknown cost is treated as **zero**, which overstates profit.

### Inventory value

See document 09 §2.3 for the four variants. In summary:

- `InventoryService` uses **sale price**;
- `InventoryReportService::stockReport` uses average/opening/legacy cost and subtracts
  `uncosted` in summary but not per row;
- `FinancialReportService` uses SQL with `GREATEST(stock−uncosted,0)`;
- `ProductReportService` uses `last_purchase_cost` only.

## 6. Formula costing model

**PROPOSED.**

### 6.1 Component cost

For each component line:

```
component_cost_per_base = CostResolver::unitCost(component)
line_cost               = actual_quantity_in_base_unit × component_cost_per_base
```

If `unitCost` is null, mark the line `estimated`/`unavailable`; never silently use zero for
valuation of a produced good.

### 6.2 Run cost

```
run_cost  = Σ line_cost + overhead (if configured)
unit_cost = run_cost / output_quantity
```

Store the result in:

- `composition_runs.total_cost`, `unit_cost`;
- `composition_run_items.unit_cost`, `total_cost`;
- the finished-good `inventory_transactions.unit_cost` for the output row;
- `products.average_cost` for the finished good when producing into stock (same weighted-average
  rule as purchases, over costed quantity);
- `sale_items.cost_price` when selling a consumption-based service (rolled cost per commercial
  unit), so existing COGS reports stay correct.

### 6.3 Overrides and wastage

- Actual consumption overrides change `actual_quantity`, therefore `line_cost` and `run_cost`.
  The template is untouched.
- Wastage can be stored as a percentage or as a separate actual-vs-planned delta. Decide whether
  wastage is costed (recommended: yes, if material was consumed).
- Rounding: store 6 decimals; round only for display.

### 6.4 Historical integrity

- `composition_runs.template_snapshot` preserves the exact recipe.
- `composition_run_items` preserves actual quantities and unit costs at execution.
- A later component price change must not rewrite a past run.
- Sale COGS remains the snapshot in `sale_items.cost_price`.

### 6.5 Manufactured vs consumption-based

| Model | Cost behavior |
|---|---|
| **Assembly** (produce into stock) | Component cost moves into finished `average_cost`; no expense at production; COGS when the finished good is sold |
| **Consumption at sale** | Component cost is part of the sale's COGS immediately; the service product has no inventory value |
| **Assembly at sale** (not recommended) | Component cost is COGS at sale; no finished stock; revenue allocation still needed |

Do not expense components at production **and** again at sale. That is double counting.

## 7. Reverse costing

On reversal:

- ingredient quantities are restored;
- finished-good quantity is removed;
- the finished `average_cost` should either be recomputed from remaining stock or left unchanged
  with a documented note;
- the run records a reversal value, not a deleted history.

**Recommendation:** leave `average_cost` unchanged on reversal unless the remaining stock is
zero, and record the reversal value in the run. Recomputing from partial remaining stock can
produce a misleading average.

## 8. Existing duplication to avoid

| Cost logic | Location |
|---|---|
| `CostResolver` | canonical |
| Purchase weighted average | `PurchaseService` |
| Sale snapshot | `SaleService` |
| Inventory overview/valuation | `InventoryService` (sale price) |
| Stock report cost | `InventoryReportService::productCost` (legacy per-pack, no division) |
| Financial inventory value | `FinancialReportService` SQL |
| Product timeline value | `ProductReportService` |
| Product list value | React `last_purchase_cost ?? default_purchase_cost` |

**VERIFIED:** `InventoryReportService::productCost()` uses legacy per-pack columns without
dividing by the pack factor, so it diverges from `CostResolver`.

## 9. Required costing changes

| Change | Phase | Notes |
|---|---|---|
| Use `CostResolver` for every formula line | P3 | Never read legacy pack cost directly |
| Write run cost + item cost | P3 | Snapshot |
| Write finished `average_cost` on production | P7 | Avoid zero-cost stock |
| Roll cost into `sale_items.cost_price` for services | P5 | Keeps COGS correct |
| Decide wastage/overhead | P1 | Business |
| Keep past runs immutable | P3 | Snapshot |
| Unify valuation (optional but recommended) | P7 | Four variants today |
| Mark uncosted components | P3 | Disclose separately |

## 10. Findings summary

1. **VERIFIED:** `CostResolver` is a correct, centralized cost source.
2. **VERIFIED:** valuation and COGS are inconsistent across reports.
3. **RISK:** a composite with no rolled cost shows 100% margin.
4. **RISK:** consuming uncosted stock still snapshots the average cost.
5. **PROPOSED:** cost snapshot per run item; rolled cost into sale/finished cost; no expense at
   production.

---

<a id="doc-12"></a>

<!-- ===== Source: 12-api-integrations-impact.md ===== -->

# 12 — API, Serialization & Integrations

## 1. Transport reality

**VERIFIED.**

- There is **no `routes/api.php`**.
- The UI is server-rendered through **Inertia**; pages receive raw Eloquent arrays.
- A small number of JSON endpoints exist inside `routes/web.php`.
- There are **no API Resources**, no transformers, no versioning, no OpenAPI schema, no webhooks
  and no external integrations.

## 2. JSON endpoints

| Endpoint | Auth | Route exists? | Behavior |
|---|---|---|---|
| `GET /inventory/generate-sku` | yes | yes | `{sku}`; UI never calls it |
| `GET /api/dashboard/metrics` | **no** | yes (outside the auth group) | today's sales/returns/purchases/expenses/low stock/receivables/recent sales |
| `POST /api/prescriptions/{id}/images` | yes | yes | upload |
| `GET /api/prescriptions/{id}/images` | yes | yes | list |
| `DELETE /api/prescription-images/{id}` | yes | yes | delete |
| `GET /api/prescription-images/{id}/download` | yes | yes | download |
| `GET /inventory/product-units` | – | **no** | dead; called by `UnitRelationEditor` |
| `GET /inventory/measurement-options` | – | **no** | dead |
| `GET /inventory/preview-packaging` | – | **no** | dead |

**RISK:** `/api/dashboard/metrics` is unauthenticated and exposes business totals.

## 3. Inertia payload shapes that matter

| Page | Props | Notes |
|---|---|---|
| `inventory/ProductList` | `products[]`, `categories[]`, `meta`, `filters` | raw product arrays incl. cost fields, selling units, `product_type` |
| `inventory/CreateProduct` | `categories`, `products`, `generated_sku` | sends up to 999 products to the browser |
| `inventory/ProductDetails` | `product`, `movements`, `purchases`, `sales`, `lifecycle` | last 20 of each; `product` raw |
| `inventory/EditProduct` | `product`, `categories`, `products` | raw |
| `sales/SaleBill` | `products[]`, `customers[]` | all non-archived products with selling units |
| `sales/SaleDetail` | `sale` with items/customer | |
| `returns/ReturnPage` | `transactions`, `type`, `strategy`, `title`, `isPurchase`, `backPath` | raw sales/purchases with items |
| reports | service output arrays | server-computed |

### Serialization risks

1. **Over-exposure:** raw models expose `deleted_at`, `archived_by`, `archive_reason`, costs and
   `product_type`. A formula relation added to the model would be serialized everywhere unless
   explicitly eager-loaded/shaped.
2. **Payload size:** `CreateProduct`/`EditProduct` send `search(perPage: 999)`; the POS sends all
   products. A formula builder must **not** reuse "send everything".
3. **No stable contract:** field names are snake_case in props, camelCase in the TS domain
   adapters, and some pages normalize manually. A formula payload should be explicit and typed.

## 4. Recommended formula representation

**PROPOSED.** Use a dedicated prop only where needed:

```json
{
  "composition": {
    "id": 12,
    "kind": "consumption",
    "version": 3,
    "is_active": true,
    "output_quantity": 1,
    "output_unit": "piece",
    "items": [
      {
        "id": 40,
        "component_product_id": 11,
        "component_name": "Serum",
        "base_unit": "ml",
        "quantity": 2,
        "display_unit": "ml",
        "is_optional": false,
        "estimated_unit_cost": 12.5
      }
    ],
    "estimated_cost": 25.0,
    "cost_basis": "estimated"
  }
}
```

Rules:

- Do not attach `composition` to every product payload; only the detail page and the POS product
  capability summary.
- Do not expose `composition_runs` internals to the POS.
- Expose a minimal capability flag to POS: `has_composition`, `composition_kind`,
  `max_sellable_estimate` (optional).
- Expose permissions separately (`can_edit_composition`, `can_override_consumption`).
- Keep calculation details server-side; never trust client-submitted component costs.

## 5. Barcode interfaces

**VERIFIED:** barcode is a string column with no unique constraint and no index. POS search
ignores it. No scanner integration exists. `settings.pos.barcode_scanner_enabled` and
`auto_focus_barcode` are stored but unused.

**Composition relevance:** a composite can have a barcode for the commercial product. Component
barcodes are independent. No change is needed unless a scan should open the consumption editor.

## 6. Import / export

**VERIFIED ABSENT:** product import, product export, inventory import, company migration and data
portability tools do not exist. The only exports are report CSV/XLSX/PDF through
`ExportService`.

**Composition consequence:** there is no import format to extend. If product export is added
later, include composition as nested rows with a stable schema version.

## 7. External integrations

**VERIFIED ABSENT:** no webhooks, queues to external services, payment gateways, accounting
integrations, e-commerce sync or barcode hardware SDKs.

## 8. API versioning and compatibility

- No versioning exists.
- Inertia props are effectively an internal, unversioned contract; React pages and controllers
  must change together.
- A future JSON API for composition should be additive and versioned (`/api/v1/...`) rather than
  bolted onto the Inertia endpoints.

## 9. Findings summary

1. **VERIFIED:** Inertia + a handful of JSON endpoints; no API layer.
2. **VERIFIED:** raw models are serialized; no Resources.
3. **VERIFIED:** one dashboard metrics endpoint is unauthenticated.
4. **ABSENT:** product import/export, webhooks, barcode integration, versioning.
5. **PROPOSED:** a narrowly scoped `composition` prop plus capability flags, never raw run data.

---

<a id="doc-13"></a>

<!-- ===== Source: 13-security-permissions-impact.md ===== -->

# 13 — Authorization, Company Isolation & Security

## 1. Authentication

**VERIFIED.**

- Session authentication (`auth` middleware) guards `routes/web.php` business routes.
- `routes/auth.php` provides login, password reset, email verification and **public
  registration** (`GET/POST /register`).
- The demo/data layer is single-business; there is no tenant selector.
- `App\Models\User` uses `role` (`admin|salesman`), `active`, Spatie `HasRoles`, soft deletes.

### Verified authorization defects / risks

| # | Finding | Evidence | Impact |
|---|---|---|---|
| S1 | **Public registration route is enabled** | `routes/auth.php` `register` routes | Anyone who can reach the app can create an account |
| S2 | **Only lifecycle actions are gated** | `authorize()` grep: delete/archive/restore/permanent-delete only | Any authenticated user can create/edit products, sales, purchases, returns, settings, expenses |
| S3 | **All FormRequests return `authorize(): true`** | product/sale/purchase/contact/settings requests | No per-action policy |
| S4 | **Seeded Spatie permissions are not enforced** | `DatabaseSeeder` seeds them; no `can:` middleware or `authorize` uses them | Permission matrix is decorative on the backend |
| S5 | **Settings user-management routes point at missing methods** | `routes/web.php` `settings.users`, `settings.users.store`, `settings.users.update`, `settings.permissions`, `settings.permissions.update` → `SettingsController@users` etc., which do not exist | Those routes will fail (500) |
| S6 | **Frontend permission checks use an in-memory mock** | `AuthContext` reads `resources/js/data/users.ts`, which seeds `admin/admin` and `saleem/1234` and keeps users in memory | React `PermissionGuard` is disconnected from the server user; it is not a security control |
| S7 | **Unauthenticated metrics endpoint** | `GET /api/dashboard/metrics` is defined outside the `auth` group | Business totals are public |
| S8 | **No per-company scope** | no `company_id`; `BusinessContext` hardcodes `'1'` | Cross-company leakage is impossible only because multi-company does not exist here |

## 2. Roles and permissions

### Backend seed

`database/seeders/DatabaseSeeder.php` seeds:

- users: admin `mahinder@invenos.com`, salesman `saleem@invenos.com`;
- 36 permissions across dashboard/products/inventory/purchases/sales/customers/suppliers/
  expenses/reports/settings;
- role `admin` with all permissions;
- settings and expense categories.

### Enforcement

- `AppServiceProvider` defines lifecycle gates, all `isAdmin()`.
- Controllers call `authorize('lifecycle.*')` only on destroy/archive/unarchive.
- No `permission:` middleware, no `Gate::before`, no policy registration for CRUD.
- Frontend `PermissionGuard` exists but uses the mock user store.

**Conclusion:** the permission catalog is a **design intent**, not an enforced control.

## 3. Company / organization isolation

**VERIFIED ABSENT on this branch.**

- No `companies`, `organizations`, `company_id`, `organization_id`, `company_product_stock` or
  company price tables.
- `App\Services\BusinessContext` is a singleton returning `id='1'`, `name='Invenos'`, with a TODO
  for multi-tenancy.
- The fashion branch (`variation/clothing-erp`) contains a multi-company layer
  (`company_id`, `company_product_stock`, `company_selling_unit_prices`,
  `AuthorizationService`), but it is **not** in this worktree and was not audited.

**Composition consequence:** cross-company component references cannot occur today because there
is only one catalog. If composition is later ported to fashion, component references must be
org-scoped and availability must use `company_product_stock`, not the global scalar.

## 4. Formula-specific authorization

**PROPOSED permission set:**

| Permission | Who | Purpose |
|---|---|---|
| `products.composition.view` | roles that can view products | see a formula |
| `products.composition.create` | admin/manager | create a template |
| `products.composition.edit` | admin/manager | edit a template |
| `products.composition.delete` | admin | deactivate/delete |
| `sales.consume.override` | trusted operator | change actual consumption at sale |
| `sales.consume.execute` | all sellers | execute the saved template |
| `manufacturing.run` | production role | produce into stock |
| `manufacturing.reverse` | manager/admin | reverse a run |

Enforcement must be server-side in the controller/FormRequest and in the sale service, not only
in React. Sensitive actions:

- viewing component quantities and costs (could leak supplier/pricing data);
- overriding consumption (could hide theft/wastage);
- executing a formula that consumes inventory;
- reversing a run or a return.

## 5. Data exposure risks

| Risk | Detail |
|---|---|
| Cost leakage | `Product` and `SaleItem` are serialized raw; component costs would be exposed to any authenticated user who can open the product detail or POS payload |
| Formula leakage | Composition may reveal trade secrets; expose only to permitted roles |
| Inventory leakage | Component availability could reveal stock levels; keep the POS capability payload minimal |
| Mass assignment | `Product::$fillable` includes `stock_quantity`, costs and `product_type`; only DTO/request constraints prevent abuse. FormRequests must never pass arbitrary arrays to `update()` |
| IDOR | Routes use numeric ids and there is no ownership check; single-tenant makes this less severe, but formula endpoints must still check product and permission |
| Public endpoints | `/api/dashboard/metrics` is public; do not add composition endpoints there |

## 6. CSRF and transport

- Laravel web middleware provides CSRF for Inertia mutations.
- The app is assumed HTTPS in production (`DEPLOY.md`).
- Backup artifacts can be password-protected (`BackupCipher`).
- `APP_DEBUG=true` in the local `.env`; production must be `false`.

## 7. Suggested controls before implementation

1. Remove or disable public registration.
2. Add permission middleware/`authorize()` to product, sale, purchase, return, settings and
   composition routes.
3. Replace the frontend mock `AuthContext` with server-shared permissions
   (`HandleInertiaRequests` currently shares only `auth.user`).
4. Fix the settings user-management routes or remove them.
5. Protect `/api/dashboard/metrics`.
6. Add `products.composition.*` permissions and enforce them in requests/controllers.
7. Keep composition cost/availability out of broad Inertia props.
8. Audit formula create/edit/execute/reverse into `audit_logs`.

## 8. Findings summary

1. **VERIFIED:** authentication works; authorization is mostly absent.
2. **VERIFIED:** frontend permission UI is a mock, not a control.
3. **VERIFIED:** public registration and a public metrics endpoint exist.
4. **VERIFIED:** no multi-company layer on this branch.
5. **PROPOSED:** explicit composition permissions enforced server-side.

---

<a id="doc-14"></a>

<!-- ===== Source: 14-backup-restore-data-transfer-impact.md ===== -->

# 14 — Backup, Restore, Import & Export

## 1. Backup architecture

**VERIFIED.**

`app/Domains/Backup/Services/BackupService` creates an encrypted/zip archive containing:

- `manifest.json` (`BackupManifest`);
- `database.sql` (`DatabaseExporter`);
- selected file sources (`FileCollector`);
- optional encryption (`BackupCipher`).

`BackupService::create` uses a cache lock, a duplicate window, and records metadata in
`backups`. `BackupRunCommand`/`schedule` drive scheduled backups; `BackupRecoverCommand` restores
service after a failed restore.

### Database export

`DatabaseExporter::dump()`:

1. requires MySQL;
2. reads `config('backup.exclude_tables')`;
3. counts rows per table;
4. tries `mysqldump` (with `--single-transaction`, `--set-gtid-purged=OFF` unless MariaDB,
   `--ignore-table` for each excluded table);
5. falls back to a chunked PHP exporter using `SHOW CREATE TABLE` + batched inserts.

It dumps **every base table that is not excluded**, discovered dynamically:

```php
SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'
```

### Excluded tables

```
cache, cache_locks, sessions, jobs, job_batches, failed_jobs, backups, restore_runs
```

### File sources

```
prescriptions → storage/app/prescriptions
logos         → storage/app/public/logos
```

## 2. Composition tables in backups

**VERIFIED:** because the exporter discovers tables dynamically, any new composition tables
(`product_compositions`, `product_composition_items`, `composition_runs`,
`composition_run_items`) are included automatically. No backup configuration change is needed.

The manifest records per-table row counts (`table_counts`) and `excluded_tables`. A backup taken
after composition will therefore advertise those tables and their counts.

## 3. Restore architecture

`RestoreService`:

1. inspects an uploaded/local artifact (decrypts if needed, reads manifest);
2. rejects a backup whose `schema_version` is greater than the current migration count;
3. creates a **safety backup** before touching data;
4. enables maintenance mode (`artisan down`);
5. sanitizes GTID/session lines (`SqlSanitizer`);
6. imports the SQL with FK/unique checks disabled, via `mysql` CLI or PHP `SqlSplitter`;
7. restores files;
8. verifies every table count is **>=** the manifest count;
9. runs `php artisan migrate --force` (so older backups gain new tables);
10. clears caches, invalidates sessions, exits maintenance mode.

`databaseLooksIntact()` can re-enable service if the import failed before dropping rows.

## 4. Effect on composition data

| Scenario | Result |
|---|---|
| New backup, same/newer app | All composition tables restored; FKs disabled during import so order is not a problem |
| Old backup (pre-composition) restored into new app | Import succeeds; `migrate` creates empty composition tables; no formulas exist |
| New backup restored into older app | Rejected because `schema_version` > current |
| Restore fails mid-import | Safety backup exists; maintenance may stay on by design until `backup:recover`/`artisan up` |
| Foreign keys | Dumps include `DROP TABLE`/`CREATE TABLE`; restore disables FK checks; counts verified afterward |

**RISK:** the verifier checks `actual >= expected`, not equality. Extra rows are tolerated. This
is acceptable for restore but means a formula table could contain more rows than the manifest
without failing verification.

## 5. Ordering and dependencies

- The dump is ordered by table discovery, not by a dependency graph. FK checks are off during
  import, so formula tables can be created in any order.
- `composition_run_items.inventory_transaction_id` must reference a ledger row. Both tables are
  in the same dump; with FK checks off, the insert order does not matter.
- On a fresh restore, `migrate` runs after import. Migrations must be idempotent enough not to
  fail if the tables already exist (they won't, because the import recreated them from the
  dump; `migrate` sees the migration row and skips).

## 6. Product import / export

**VERIFIED ABSENT.**

There is no product import, product export, inventory import, CSV product upload or company
migration. The only exports are report CSV/XLSX/PDF via `ExportService`.

Therefore:

- there is no product export format that must learn about composition;
- there is no import path that could create a composite without its components;
- a full database backup is the only way to move formulas between installations.

**PROPOSED:** if a product export is added later, define a versioned schema with nested
composition items, and import in two passes (products, then composition) with a dry-run.

## 7. Data portability concerns

| Concern | Detail |
|---|---|
| Component identity | A formula references component `products.id`. Exporting to another install requires remapping ids. |
| Units | `base_unit_id` is a string, so it is portable; `product_unit_id` is an id and needs remapping. |
| Run history | `composition_runs`/`composition_run_items` are historical; importing them into a new install is optional and should preserve `template_snapshot`. |
| Costs | Historical costs are snapshots; do not recompute on import. |
| Schema version | The backup manifest's migration count is the compatibility gate. |

## 8. Required changes

| Change | Phase | Notes |
|---|---|---|
| None for backup inclusion | – | Dynamic discovery already handles new tables |
| Add composition tables to test fixtures | P1 | Backup/restore tests should include them |
| Verify restore with runs/items | P7 | Add to the backup test suite |
| Product export (if added) | later | Versioned nested format |
| Do not exclude composition tables | – | Keep them in the dump |

## 9. Findings summary

1. **VERIFIED:** backups discover tables dynamically; new tables are included automatically.
2. **VERIFIED:** restore disables FK checks, verifies counts, then migrates.
3. **VERIFIED:** newer-schema backups are rejected on older apps.
4. **VERIFIED:** no product import/export exists.
5. **PROPOSED:** only add restore tests for runs; no backup code change is required.

---

<a id="doc-15"></a>

<!-- ===== Source: 15-events-jobs-automation-impact.md ===== -->

# 15 — Events, Jobs, Notifications & Automation

## 1. Current state

**VERIFIED.**

- **No model observers.**
- **No application events or listeners** (only Laravel's built-in auth notification).
- **No domain jobs**; `QUEUE_CONNECTION=database` and the `jobs` tables exist but nothing
  dispatches to them.
- **No notifications** beyond email verification.
- **No background synchronization.**
- **Audit:** `App\Services\Lifecycle\AuditService` writes `audit_logs`, but only for archive /
  delete / restore / permanent delete.
- **Scheduling:** `routes/console.php` schedules `backup:run --scheduled` **every minute** with
  `withoutOverlapping(180)`.

## 2. Why this matters for composition

Composition execution has real side effects (stock, cost, history). The absence of an event
system is **not a blocker**; in fact it makes correctness easier:

- all effects can be applied synchronously inside the existing `DB::transaction`;
- there is no queue retry that could consume twice;
- there is no asynchronous listener ordering to reason about.

**Recommendation:** keep execution synchronous and transactional. Do not introduce a job for
consumption in v1.

## 3. Duplicate-execution risk

**VERIFIED:** there is no idempotency mechanism for sales or purchases. A double submit creates
two documents and two stock movements. Composition adds a second expensive side effect
(component consumption), so the risk is higher.

**PROPOSED safeguards:**

1. Add an idempotency key to sale creation (client-generated UUID, unique per tenant) and to
   composition execution.
2. Add a unique constraint on `composition_runs (source_type, source_id, composition_id)` so a
   retry cannot create a second run for the same sale.
3. Check `effects_applied_at` before applying (same pattern as `ReturnService`).
4. Wrap execution in `DB::transaction` and lock the run row.

## 4. Audit records

**PROPOSED events to write into `audit_logs`:**

| Event | When | Reason field |
|---|---|---|
| `ProductComposition.created` | template saved | – |
| `ProductComposition.updated` | template edited | – |
| `ProductComposition.deactivated` | template disabled | reason |
| `CompositionRun.completed` | consumption applied | source document |
| `CompositionRun.reversed` | run reversed | reason |
| `CompositionRun.failed` | validation/transaction failure (optional) | error summary |

`audit_logs` stores `auditable_type`/`auditable_id`; the run/template is a valid morph target.
Do not log component costs in the description if cost visibility is restricted.

## 5. Notifications

**ABSENT.** If the business wants low-component alerts or failed-run alerts, they must be added
explicitly. Do not add notifications in v1 unless requested; they add delivery and retry
semantics that the current app does not have.

## 6. Scheduled tasks

Only the backup schedule exists. If composition needs a scheduled reconciliation (e.g. rebuild
run totals), add a command and schedule it explicitly. There is no queue worker requirement for
backups (`backup:run` executes directly), and the same should hold for any composition command.

## 7. Side effects and ordering

A single composition execution must, in order:

1. lock the template/run (if re-executing);
2. lock component product rows in a deterministic order;
3. validate availability and units;
4. write `composition_runs` (pending);
5. apply component movements;
6. write `composition_run_items` with the movement ids;
7. write the finished/sale cost;
8. mark the run completed;
9. write the audit record.

All inside one transaction. If an event system is added later, it must fire **after commit**
(`DB::afterCommit`) to avoid acting on rolled-back data.

## 8. Existing automation that composition must not disturb

| Automation | Behavior | Risk |
|---|---|---|
| Backup every minute | duplicate window prevents spam | none |
| `stock:reconcile` | reports drift, does not fix | will report formula drift if the ledger is bypassed |
| `backup:run` schedule | direct execution | none |
| Cash/party ledger rebuild commands | not read in detail; do not touch | none |

## 9. Findings summary

1. **VERIFIED:** no events, jobs, observers or notifications.
2. **VERIFIED:** audit logging exists only for lifecycle.
3. **VERIFIED:** no idempotency for transactions.
4. **PROPOSED:** synchronous transactional execution; audit events; unique run per source.

---

<a id="doc-16"></a>

<!-- ===== Source: 16-frontend-shared-components-impact.md ===== -->

# 16 — Frontend Shared Components & UX

## 1. Component inventory

**VERIFIED.**

| Layer | Components |
|---|---|
| UI primitives (`components/ui`) | `button`, `card`, `input`, `table`, `badge`, `dialog`, `sheet` |
| Layout (`layouts`) | `AppLayout`, `Header`, `Sidebar`, `BottomNav` |
| Product | `ProductForm`, `ProductTable`, `ProductCardView`, `ProductFilters`, `StockBadge`, `ArchivedBadge`, `CompletionBadge`, `InventoryTimeline`, `AdjustStockDialog`, `UnitRelationEditor` |
| POS | `SaleBill`, `EditableQuantity`, `SearchBar`, `CartSummary`, `PaymentPanel`, `ConfirmDialog`, `ClearConfirmDialog`, `ReceiptDialog`, `CustomerSelect`, `MobileCartList`, `MobilePaymentDrawer`, `BillResponsiveWrapper` |
| Reports | `ReportDocumentTable`, `ReportSkeleton`, `DateRangeFilter`, `DateFilter`, report hooks |
| Shared | `use-flash-toasts`, `use-lifecycle-action`, `DateFilter`, `formatCurrency`, `ns` |
| Auth | `LoginPage`, `PermissionGuard`, `AccessDenied`, `AuthContext` |

## 2. Reusable for a Formula Builder

### Directly reusable

| Need | Component / utility |
|---|---|
| Modal | `components/ui/dialog` (Radix-based) |
| Side panel / mobile | `components/ui/sheet` |
| Table of components | `components/ui/table` (or the plain table pattern used in `ProductTable`) |
| Inputs | `components/ui/input` |
| Buttons | `components/ui/button` |
| Status chips | `components/ui/badge`, `StockChip` pattern in `ProductFilters` |
| Product search UI | `features/transactions/search/SearchBar` (add a mode without "add to cart") |
| Row add/remove | `UnitRelationEditor` row pattern |
| Quantity stepping | `domain/products/unit-stepping.ts`, `EditableQuantity` |
| Unit display | `lib/product-unit-display.ts`, `lib/units.ts` |
| Currency | `lib/format.ts` |
| Toasts | `sonner` (`toast`) |
| Empty state | `ProductTable` empty row, `ReportSkeleton` |
| Dirty guard | `beforeunload` pattern in `SaleBill.tsx` |

### Not reusable as-is

| Component | Why |
|---|---|
| `UnitRelationEditor` | It models one product's unit hierarchy, not multi-product components. Reuse the **row layout**, not the semantics. |
| `ProductForm` | It is the simple-product fast path; embedding a formula builder would slow it and complicate payloads. |
| `PermissionGuard` | Uses the in-memory mock auth store; not a real control. |
| `AuthContext` | Mock/demo data; not the server session. |
| `inventory-engine.ts` | Legacy client engine with a hardcoded date and deprecated packaging model; do not build on it. |

## 3. Formula Builder UX design

**PROPOSED.** A dedicated `features/composition/` folder:

```
FormulaBuilder.tsx        // container
ComponentPicker.tsx       // search + select product
ComponentRow.tsx          // unit, qty, optional/wastage, remove
ConsumptionEditor.tsx     // per-sale override dialog
CompositionSummary.tsx    // cost/availability preview
```

### Layout

- Header: product name, kind (`assembly` / `consumption`), active/version.
- Component list: product, unit, quantity per output unit, optional flag, wastage, line cost.
- Add component: searchable picker, only non-archived products, excludes self.
- Footer: total estimated cost, cost basis, save/cancel.
- Read-only mode for historical runs; editable only for the active template.

### States

| State | Treatment |
|---|---|
| Loading | skeleton rows (reuse `ReportSkeleton` style) |
| Empty | "No components yet — add the first component" |
| Error | inline row error + toast; keep user input |
| Large list | server-side search, paginate or cap at ~50 rows |
| Unsaved | `beforeunload` guard and a "discard changes?" dialog |
| Archived component | show a warning chip; block new saves |
| Cycle | block save with a clear message |

### Unit UX

- Default to the component's `base_unit_id`.
- If the user selects another compatible unit, convert on the client for display and send the
  base quantity plus the display unit.
- Reject incompatible units (weight vs volume vs count).
- Never allow a quantity of 0 or a negative number.

### Cost UX

- Show "estimated" when any component cost is `null`/legacy.
- Do not show cost to roles without cost visibility.
- Recalculate on quantity/unit change; do not save the preview cost.

## 4. POS consumption editor UX

- A modal/sheet triggered from a cart line labelled "Consumption".
- Rows: component name, default quantity × sold quantity, actual quantity input, unit.
- A "reset to default" action.
- A "remaining stock" indicator if the server supplies it.
- Save is local until the sale submit; the sale request carries overrides.
- Server errors (shortage) must keep the editor open with the offending rows highlighted.

## 5. Accessibility and interaction

**VERIFIED gaps:**

- Many icon-only buttons rely on `title` rather than `aria-label`.
- Form labels are not consistently linked with `htmlFor`/`id` (e.g. `ProductForm`).
- Dialog focus trapping is provided by Radix, but custom drawers may need review.
- Keyboard support exists in POS search and confirm (`Ctrl/Cmd+Enter`), but not in product forms
  beyond the global Enter handler.

**PROPOSED requirements for the builder:**

- labelled inputs;
- keyboard add/remove rows;
- focus the first field on open;
- Escape closes without saving (with confirmation if dirty);
- visible focus rings;
- touch targets >= 40px (existing POS uses 36–40px);
- do not rely on color alone for "archived"/"unavailable".

## 6. Mobile and responsive

- Layout already switches tables to cards at `sm`/`md`.
- `Sheet` is available for mobile.
- The builder should use a full-width sheet on mobile and a two-column layout on desktop.
- Long component lists need `overflow-y-auto` with a max height.

## 7. Findings summary

1. **VERIFIED:** the UI kit and interaction patterns are sufficient for a formula builder.
2. **VERIFIED:** `UnitRelationEditor` is the closest row pattern but not semantically reusable.
3. **VERIFIED:** several accessibility gaps exist (labels, icon-button names).
4. **PROPOSED:** new `features/composition` with `Dialog`/`Sheet`, server-side product search,
   and no changes to the simple product form.

---

<a id="doc-17"></a>

<!-- ===== Source: 17-testing-regression-impact.md ===== -->

# 17 — Testing & Regression Coverage

## 1. Test inventory

**VERIFIED.** 42 test files under `tests/`:

### Unit (4)
| File | Covers |
|---|---|
| `Unit/ExampleTest.php` | placeholder |
| `Unit/Backup/SqlSplitterTest.php` | SQL statement splitting |
| `Unit/Backup/SqlSanitizerTest.php` | GTID/session line removal |
| `Unit/Backup/BackupCipherTest.php` | encryption/decryption |

### Feature — products/lifecycle
| File | Asserts |
|---|---|
| `Feature/Products/ProductsTest.php` | service create, selling units, search, delete, HTTP create |
| `Feature/Products/ProductLifecycleTest.php` | delete blocked with transactions, delete/restore, blocker counts, Inertia lifecycle props |
| `Feature/Products/ArchivedProductTest.php` | archive hidden by default, archived filter, low-stock exclusion, detail/unarchive, sale/adjust guard, **legacy sale return on archived product** |

### Feature — inventory/costing
| File | Asserts |
|---|---|
| `Feature/Inventory/InventoryTest.php` | overview counts, status filter, movements, low stock, valuation keys |
| `Feature/Inventory/CostingTest.php` | pack→base conversion, weighted average, sale cost snapshot, uncosted quarantine/consumption, legacy pack fallback, null cost, opening cost precedence |

### Feature — sales/purchases/returns
| File | Asserts |
|---|---|
| `Feature/Sales/SalesTest.php` | sale create, stock decrement, insufficient stock, invalid customer, search |
| `Feature/Purchases/PurchasesTest.php` | purchase create, stock increase, invalid supplier, search, HTTP create |
| `Feature/Returns/ReturnServiceTest.php` | full/partial/credit-only refund, non-restock, double complete, reversal, over-return |
| `Feature/Returns/SaleReturnTest.php` | legacy sale return |
| `Feature/Returns/PurchaseReturnTest.php` | legacy purchase return |

### Feature — ledger/payments
| File | Asserts |
|---|---|
| `Feature/Ledger/PartyLedgerTest.php` | party statements |
| `Feature/Ledger/CashLedgerTest.php` | cash movement |
| `Feature/Payments/PaymentsTest.php` | payment recording |

### Feature — reports/dashboard
| File | Asserts |
|---|---|
| `Feature/Reports/ReportsTest.php` | sales summary, inventory counts, financial keys, profit metrics, soft-deleted sales excluded from COGS, dashboard keys |
| `Feature/Reports/FinancialReportsTest.php` | preset resolution, cash flow from receipts, balance sheet balancing |

### Feature — backup
| File | Asserts |
|---|---|
| `Feature/Backup/BackupServiceTest.php` | backup creation |
| `Feature/Backup/RestoreTest.php` | restore round trip |
| `Feature/Backup/RetentionTest.php` | retention |
| `Feature/Backup/BackupScheduleTest.php` | schedule |
| `Feature/Backup/BackupHttpTest.php` | HTTP endpoints |
| `Feature/Backup/BackupRecoverTest.php` | recovery |

### Feature — other
`Feature/Auth/*` (login, registration, password, email verification, confirmation),
`Feature/Settings/SettingsTest.php`, `Feature/Contacts/ContactsTest.php`,
`Feature/Branding/BrandingTest.php`, `Feature/Dashboard/DashboardTest.php`,
`Feature/Database/SalesTest.php`, `Feature/Database/ContactsTest.php`,
`Feature/Architecture/ArchitectureTest.php`, `Feature/ExampleTest.php`.

## 2. Test characteristics

- Every database test uses `RefreshDatabase`.
- `phpunit.xml` forces `APP_ENV=testing`, `DB_DATABASE=invenos_testing`, `BCRYPT_ROUNDS=4`.
- Tests call services directly in many cases (fast, no HTTP) and use Inertia assertions for
  page props.
- There are **no browser/E2E tests**, no frontend unit tests, and no CI workflow files in the
  repository root.

## 3. Known / likely pre-existing failures

The pre-existing untracked plan records 35 passed / 2 failed for
`tests/Feature/Products tests/Feature/Inventory tests/Feature/Sales`. This audit did **not**
re-run the suite, but the source supports both failures:

| Test | Why it likely fails |
|---|---|
| `ProductsTest::test_http_create` | posts to `/inventory` without `actingAs`; the route is behind `auth`, so it redirects to login and never sets `success` |
| `SalesTest::test_insufficient_stock_rejected` | expects `RuntimeException`, but `Product::$attributes` defaults `allow_negative_stock => true`, so the guard is bypassed and the sale succeeds |

**Regression note:** these must be resolved or explicitly quarantined before composition tests
are added, or the suite baseline is ambiguous.

## 4. Coverage gaps relevant to composition

**VERIFIED absent:**

- No tests for `PackagingDerivationEngine`, `ProductUnitService`, `ConversionGraphService`,
  `RelationshipGraphValidator`.
- No tests for `ProductService::update` (stock overwrite, packaging re-derive).
- No negative-stock matrix (`NULL`/true/false, `track_inventory=false`, `bypass`, `REV-`).
- No test for `TransactionEngine` (which would fail).
- No test for legacy writers' guard bypass.
- No COGS test with uncosted stock.
- No consistency test across the four valuation paths.
- No test for formula/consumption/production (nothing exists).
- No frontend tests for POS cart, product form or unit editor.
- No backup test that includes formula tables (they do not exist yet).

## 5. Tests that may fail when product serialization/schema changes

| Change | At-risk tests |
|---|---|
| Add composition relation to `Product` | tests using `toArray()`/Inertia product props (Archive, Lifecycle, Products) |
| Add columns to `products` | factory-less `Product::create` tests are tolerant unless columns are required |
| Change `sale_items.cost_price` behavior | `CostingTest`, `FinancialReportsTest`, `ReportsTest` |
| Add consumption movements | `InventoryTest` (movement counts), `ReportsTest` (stock summary) |
| Change return behavior | `ReturnServiceTest`, `SaleReturnTest`, `ArchivedProductTest` |
| Change `ProductPolicy` blockers | `ProductLifecycleTest` |
| Add permissions | auth/HTTP tests (if they start asserting 403) |

## 6. Required new tests

### P0 — integrity
1. Product update cannot change `stock_quantity` (or must create an adjustment).
2. `InventoryService::recordConsumption` applies one negative ledger row and updates status.
3. Negative-stock matrix: NULL / true / false, `track_inventory=false`, `bypass`,
   `REV-` prefix.
4. `stock:reconcile` reports zero mismatches after a sale/purchase/return.
5. Unauthorized roles cannot create/edit/delete products (once enforced).

### P1 — schema/domain
6. Composition create/update validation: self-reference, duplicate component, archived
   component, zero/negative quantity, incompatible unit.
7. Cycle detection (A→B→A) and depth cap.
8. Saving a formula creates no inventory movement.
9. Formula versioning: editing creates a new version or increments; old runs keep their snapshot.

### P3 — execution
10. Consumption of N components writes N `consumption` movements and one run + items.
11. Insufficient component rejects the whole run with **zero** movements.
12. Actual override changes run item quantities but not template.
13. Component cost snapshot equals `CostResolver` at execution.
14. Reversal restores components and marks the run reversed.
15. `SUM(ledger) == products.stock_quantity` after every run.

### P4 — POS
16. Selling a consumption product without an override uses the template × quantity.
17. Selling with overrides consumes the overridden quantities.
18. A shortage blocks the sale; no sale row, no sale items, no movements.
19. A composite sale creates one sale item and no component sale items.
20. Duplicate submit with the same idempotency key creates one sale/run.

### P5 — costing
21. Composite COGS equals rolled component cost.
22. Changing a component cost after the sale does not change the historical COGS.
23. Unknown component cost is disclosed, not treated as zero.

### P6 — returns
24. Returning a service refunds cash and does not restock components.
25. Returning an assembled composite restocks the finished good only.
26. Reversing a return compensates consumption if the business allows it.

### P7 — reports
27. Stock report separates purchased/sold/consumed/produced.
28. Valuation includes produced stock at its rolled cost.
29. Top products lists commercial products only.

### P8 — portability
30. Backup/restore round trip includes composition tables and run history.
31. Restoring a pre-composition backup into the new app succeeds and leaves empty tables.

## 7. Regression matrix

| Area | Existing tests | Add before change | Add after change | Pass criterion |
|---|---|---|---|---|
| Product CRUD | ProductsTest, LifecycleTest, ArchivedTest | serialization snapshot | composition props | all existing pass |
| Product edit stock | none | test that stock can't be overwritten | – | no direct stock write |
| Units/packaging | none | derivation tests | formula unit compatibility | existing behavior unchanged |
| Purchase create | PurchasesTest, CostingTest | pack validation | component purchase | stock/average correct |
| Purchase return | PurchaseReturnTest | – | composite purchase rule | existing pass |
| Sale create | SalesTest, CostingTest | price/total validation | consumption | existing pass + no component sale lines |
| POS HTTP | none | – | consumption payload | one sale, one run |
| Sale delete | LifecycleTest (sales) | – | run handling | stock ledger consistent |
| Sale return | ReturnServiceTest, SaleReturnTest | – | service refund | no component restoration |
| Inventory | InventoryTest, CostingTest | negative matrix | consumption bucket | no drift |
| Reports | ReportsTest, FinancialReportsTest | valuation consistency | consumption/production | no misleading totals |
| Dashboard | DashboardTest | – | formula availability | existing pass |
| Backup | 6 backup tests | – | composition tables | round trip |
| Auth/permissions | Auth tests | composition permissions | – | 403 for unauthorized |
| Architecture | ArchitectureTest | – | new domain directories | pass |

## 8. Test execution notes

- Run with `php artisan test` or `vendor/bin/phpunit`.
- Ensure `invenos_testing` exists (it does on this machine).
- `phpunit.xml` forcibly overrides DB env, so the shell's `DB_DATABASE` does not leak.
- A full run was not part of this audit; no tests were executed.

## 9. Findings summary

1. **VERIFIED:** 42 test files; strong coverage of costing, returns, lifecycle, reports, backup.
2. **VERIFIED:** no frontend/E2E tests and no composition coverage.
3. **VERIFIED:** two pre-existing tests are inconsistent with current code.
4. **PROPOSED:** the 31 tests above as the acceptance backbone for each phase.

---

<a id="doc-18"></a>

<!-- ===== Source: 18-implementation-roadmap.md ===== -->

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

**UAT:** Scenario F.

**Definition of done:** return tests green; no double restoration.

---

## P7 — Reports, manufacturing and visibility

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

**Objective:** production readiness and a safe path to the fashion branch.

**Prerequisites:** P0–P7.

**Database changes:** none planned; fashion-only `company_id` migration if needed.

**Backend changes:** performance indexes, query review, permission audit, idempotency,
observability, backup/restore verification.

**Frontend changes:** accessibility fixes, large-list performance, mobile polish.

**API changes:** document the composition contract.

**Reports affected:** none new.

**Tests required:** tests 30–31 plus the full regression matrix; load test on large formulas.

**Migration strategy:** additive only; do not merge branches. Cherry-pick additive commits and
hand-port the touch points named in the pre-existing plan.

**Rollback:** feature flag off; routes disabled; additive tables remain.

**Acceptance criteria:**
- backup/restore round trip includes composition;
- no N+1 or unbounded payloads;
- unauthorized access blocked;
- simple-product regression suite green.

**UAT:** all scenarios A–H, plus operational sign-off.

**Definition of done:** audit checklist signed, regression suite green, deployment notes updated.

## First implementation phase

**P0 — Integrity prerequisites.** It is the only phase that can be started without deciding the
composition semantics, and every later phase depends on its guarantees.

---

<a id="doc-19"></a>

<!-- ===== Source: 19-user-acceptance-testing.md ===== -->

# 19 — User Acceptance & Operational Testing

Each scenario states steps, expected results and measurable pass/fail criteria. All scenarios
assume the app is running against a disposable test database. None have been executed; this is
the acceptance plan.

---

## Scenario A — Simple product regression

**Purpose:** prove composition work does not change ordinary products.

**Steps**
1. Create a product with name, cost, selling price, unit `piece`, starting stock `0`.
2. Purchase 100 units at Rs. 10 each from a supplier.
3. Sell 10 units at Rs. 20 to a walk-in customer.
4. Return 2 units, resellable.
5. Open Inventory, the product detail, Stock Movements, Sales list, Sales report and P&L.

**Expected**
- Product create saves with no errors and no ledger rows besides the opening adjustment if stock
  was entered.
- Purchase increases stock by 100 and sets `average_cost = 10`.
- Sale decreases stock by 10 and snapshots `cost_price = 10`.
- Return increases stock by 2 and reduces revenue/party balance.
- Stock Movements shows `purchase`, `sale`, `sale-return`.
- Report totals match the document totals.

**Pass/fail**
- PASS: final stock = 92; ledger sum = 92; sale COGS = 100; return reflected in net sales.
- FAIL: any stock mismatch, missing movement, or report total differing from the documents.

---

## Scenario B — Formula product definition (no stock effect)

**Purpose:** define a reusable formula without deducting inventory.

**Steps**
1. Create components: Bun, Patty, Cheese, Sauce (each with a base unit and opening stock).
2. Open the Bun product detail → Formula tab (or the agreed builder entry point).
3. Set kind = `assembly`, output quantity = 1.
4. Add Bun ×1, Patty ×1, Cheese ×1, Sauce ×20 ml.
5. Save. Return to Inventory and open Stock Movements for every component.
6. Edit the formula to Sauce ×25 ml and save again.

**Expected**
- The formula saves and reloads.
- No `inventory_transactions` row is created for any component.
- `products.stock_quantity` is unchanged for all components.
- The edit is versioned or replaces the active template according to the chosen policy; past
  versions/runs (none yet) are unaffected.

**Pass/fail**
- PASS: 0 new movements, 0 stock change, formula persists and validates.
- FAIL: any stock movement, any change to `stock_quantity`, or a formula that cannot be reloaded.

---

## Scenario C — Consumption-based service at POS

**Purpose:** sell a service that consumes a template and allows a per-sale override.

**Precondition:** components stocked; service product exists with a `consumption` template:
Cleanser 5 ml, Serum 2 ml, Mask 1 unit, Gloves 1 pair.

**Steps**
1. Add the service to the cart at Rs. 1,500.
2. Open the Consumption editor; verify defaults are 5/2/1/1 × quantity 1.
3. Change Serum to 3 ml.
4. Complete the sale, cash, full payment.
5. Inspect Stock Movements for each component, the sale detail, COGS/profit and the receipt.

**Expected**
- Exactly one `sale_items` row (the service).
- Component movements: Cleanser −5, Serum −3, Mask −1, Gloves −1, typed `consumption`.
- The saved template still says Serum 2 ml.
- Revenue = 1,500; COGS = rolled component cost; no component revenue.
- Receipt optionally shows "materials used", separate from sold items.

**Pass/fail**
- PASS: one sale line, four consumption movements, template unchanged, COGS = rolled cost.
- FAIL: component sale lines, wrong quantities, template mutation, or COGS = 0.

---

## Scenario D — Multiple quantities, fractional units, unit conversion

**Purpose:** prove scaling and unit conversion.

**Steps**
1. Sell 5 units of the Scenario C service with defaults.
2. Sell 0.5 of a service whose template uses 2 ml.
3. Define a component in grams while its base unit is kilograms; enter 250 g.
4. Verify the ledger quantities.

**Expected**
- Defaults scale linearly: 5 → Cleanser 25 ml, Serum 10 ml, etc.
- Fractional quantity: 0.5 → 1 ml.
- 250 g is stored as 0.25 kg (base unit), not 250.
- Unit compatibility is enforced; a count unit cannot be converted to ml.

**Pass/fail**
- PASS: all scaled quantities exact within the documented rounding; incompatible units rejected.
- FAIL: any linear-scaling error, base-unit error, or silent unit mismatch.

---

## Scenario E — Insufficient component inventory

**Purpose:** prove all-or-nothing.

**Steps**
1. Set Serum stock to 4 ml.
2. Attempt to sell a service requiring 2 ml of Serum and 5 ml of Cleanser three times (total
   Serum 6 ml).
3. Observe the error.
4. Inspect sales, sale items, ledger and stock for all components.

**Expected**
- The sale is rejected before any movement.
- No sale row, no sale items, no consumption rows.
- Cleanser stock is unchanged (no partial deduction).
- The error names the shortage (need/available).

**Pass/fail**
- PASS: 0 new documents, 0 new movements, stock unchanged.
- FAIL: a sale exists, any component deducted, or a generic/unreadable error.

---

## Scenario F — Returns and refunds

**Purpose:** prove consumed materials are not silently restored.

**Steps**
1. Complete Scenario C.
2. Return the service in full with a cash refund.
3. Return an assembled composite sale with `restock=true`.
4. Reverse a production run (if implemented).

**Expected**
- Service refund: cash out, party balance adjusted, revenue reduced, **component stock unchanged**.
- Assembled composite return: finished good restocked if `restock=true`; components unchanged.
- Run reversal: components restored, finished stock removed, run marked reversed, audit written.
- No double restoration and no negative guard bypass beyond documented reversal.

**Pass/fail**
- PASS: service components unchanged; finished good correct; reversal compensated and auditable.
- FAIL: ingredients restored automatically, double restock, or ledger drift.

---

## Scenario G — Company / tenant isolation

**Purpose:** record the current reality and define the future test.

**Current branch (single tenant):**
1. Search the schema and code for `company_id`/`organization_id`.
2. Attempt to access a formula by product id from another "company" — not possible.

**Expected:** no company concept exists; all data is global. This is **N/A** on this branch.

**Fashion branch (future port):**
1. Create a formula in company A using a component available only to A.
2. Log in as company B.
3. Attempt to view/execute the formula and reference the component.

**Expected:** B cannot see or execute A's formula; B cannot consume A's component stock;
availability uses `company_product_stock`, not the global scalar.

**Pass/fail**
- PASS (clinic): documented as N/A, no false isolation claim.
- PASS (fashion): 403/404 and no cross-company stock movement.
- FAIL: any cross-company read or execution.

---

## Scenario H — Historical integrity

**Purpose:** changing a formula must not rewrite history.

**Steps**
1. Sell a service with the Scenario C template.
2. Record the run's `template_snapshot`, component quantities and cost.
3. Edit the template (change Serum to 10 ml, change component prices via a new purchase).
4. Re-open the original sale and run history.
5. Run COGS/profit reports for the original period.

**Expected**
- The original run still shows Serum 2 ml (or the overridden 3 ml).
- The original cost snapshot is unchanged.
- New sales use the new template.
- Historical reports do not change because of the template/cost edit.

**Pass/fail**
- PASS: run snapshot and sale COGS identical before/after the edit.
- FAIL: history mutated, COGS recalculated, or old run shows new quantities.

---

## Scenario I — Negative-stock policy

**Purpose:** prove the policy is explicit and consistent.

**Steps**
1. For a component, test `allow_negative_stock = null`, `true`, `false`.
2. Test `track_inventory = false`.
3. Attempt a sale that exceeds stock with and without `bypass_stock_check`.
4. Test a `REV-` reversal movement.

**Expected**
- `false` blocks the sale.
- `true`/`null` follows the global setting and the model default (currently `true`).
- `track_inventory = false` does not block.
- `bypass_stock_check` allows the sale and records the negative movement.
- Reversals are allowed and documented.

**Pass/fail**
- PASS: behavior matches the documented matrix; the formula path uses the same policy.
- FAIL: the formula path silently allows negatives regardless of policy.

---

## Scenario J — Authorization

**Purpose:** prove composition actions are protected server-side.

**Steps**
1. Log in as `salesman`.
2. Attempt to create/edit a formula via the UI and via a direct request.
3. Attempt to override consumption.
4. Attempt to reverse a run.
5. Attempt to view another role's cost data.

**Expected**
- Create/edit formula: 403 unless permitted.
- Override consumption: allowed only with `sales.consume.override`.
- Reverse run: 403 unless manager/admin.
- Cost/availability payloads are filtered by permission.

**Pass/fail**
- PASS: every forbidden action returns 403 at the server, not just hidden in React.
- FAIL: any action succeeds despite the role.

---

## Scenario K — Backup / restore with composition

**Steps**
1. Create formulas, runs and a service sale.
2. Create a backup.
3. Restore it into a clean database.
4. Reopen product detail, run history, sale detail and reports.

**Expected**
- All composition tables, runs and items restore.
- FKs resolve; counts verify.
- Reports match the pre-backup state.
- Restoring a pre-composition backup succeeds and leaves empty composition tables.

**Pass/fail**
- PASS: exact counts and relationships after restore.
- FAIL: missing runs/items, broken FKs, or reports differing after restore.

---

## UAT sign-off checklist

| # | Scenario | Owner | Result | Evidence |
|---|---|---|---|---|
| A | Simple product regression | | | |
| B | Formula definition | | | |
| C | Consumption sale | | | |
| D | Scaling/units | | | |
| E | Insufficient inventory | | | |
| F | Returns/refunds | | | |
| G | Tenant isolation | | | |
| H | Historical integrity | | | |
| I | Negative stock | | | |
| J | Authorization | | | |
| K | Backup/restore | | | |

---

<a id="doc-20"></a>

<!-- ===== Source: 20-cross-system-impact-matrix.md ===== -->

# 20 — Cross-System Impact Matrix

Risk: **Critical** = can corrupt stock/money/history; **High** = wrong totals or access;
**Medium** = localized change; **Low** = cosmetic or unaffected.
Phase: implementation phase from document 18.

| # | Subsystem | Existing files | Database | Backend | Frontend | Reports | Tests | Required change | Dependency | Risk | Phase |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Product list | `Pages/inventory/ProductList.tsx`, `ProductTable.tsx`, `ProductFilters.tsx`, `InventoryController@index` | `products` | `InventoryService::search` | list/filters/cards | stock value on page | `InventoryTest` | optional formula badge; no filter change required | P1 read model | Medium | P2 |
| 2 | Product create | `ProductForm.tsx`, `ProductController@store`, `CreateProductRequest`, `CreateProductData` | `products`, `inventory_transactions`, `selling_units`, `product_packaging` | `ProductService::create` | fast form | – | `ProductsTest` | keep payload unchanged; do not add formula fields | – | High | P0/P2 |
| 3 | Product edit | `ProductForm.tsx`, `UpdateProductRequest`, `ProductService::update` | `products` | writes stock directly | edit form | – | none | remove stock write; formula editing elsewhere | P0 | **Critical** | P0 |
| 4 | Product detail | `ProductDetails.tsx`, `ProductController@show` | `products` | read | tabs/cards | – | `ProductLifecycleTest`, `ArchivedProductTest` | add Formula tab + composition prop | P1 | Medium | P2 |
| 5 | Product lifecycle | `RecordLifecycleService`, `ProductPolicy`, `LifecycleServiceProvider` | `products` | archive/delete/restore | detail dialogs | – | `ProductLifecycleTest`, `ArchivedProductTest` | block delete/archive if component used; historical runs survive | P1 | High | P1/P6 |
| 6 | Units / packaging | `ProductUnitService`, `PackagingDerivationEngine`, `UnitRelationEditor`, `lib/units.ts` | `product_units`, `product_packaging`, `selling_units` | derivation | relation editor | – | none | reuse conversion; do not reuse packaging as BOM | P1 | High | P1 |
| 7 | Selling units / pricing | `SellingUnit`, `ProductService`, POS | `selling_units` | factor resolution | unit selector | top products | `CostingTest` | no change; formula does not alter price | – | Medium | P4 |
| 8 | Inventory ledger | `InventoryService`, `InventoryTransaction`, `StockReconcileCommand` | `inventory_transactions` | all movements | timeline | stock ledger | `InventoryTest` | public consumption method; new buckets; optional run FK | P0 | **Critical** | P0/P3 |
| 9 | Manual stock adjustment | `InventoryController@adjust`, `AdjustStockDialog` | ledger, products | `recordTransaction` | dialog | stock report | `ArchivedProductTest` | none | – | Medium | – |
| 10 | Purchases | `PurchaseController`, `PurchaseService`, `PurchaseBill.tsx` | `purchase_bills`, `purchase_bill_items`, products | cost averaging, stock | purchase form | purchase report | `PurchasesTest`, `CostingTest` | decide if composites purchasable; validate pack qty | P1 decision | High | P1/P6 |
| 11 | Purchase returns | `ReturnService`, `PurchaseReturnService`, `PurchaseReturnController` | `returns`, `return_items`, ledger | reversal | return UI | purchase report | `PurchaseReturnTest`, `ReturnServiceTest` | do not restore components on composite purchase return | P3 | High | P6 |
| 12 | POS page | `SaleBill.tsx`, search/cart/payment components | products, selling_units | `SaleController@create` | one page, session cart | – | none | cap badge, consumption editor, availability | P3 | **Critical** | P4 |
| 13 | Sale creation | `SaleService`, `CreateSaleRequest`, `SaleItem` | `sales`, `sale_items`, ledger | transactional | POS | sales/COGS | `SalesTest`, `CostingTest` | accept consumption; one sale line; no component lines | P3 | **Critical** | P4 |
| 14 | Sale deletion/restore | `SalePolicy`, `RecordLifecycleService` | ledger, sales | compensating adjustments | detail | – | lifecycle tests | handle runs explicitly | P3 | **Critical** | P6 |
| 15 | Sale returns/refunds | `ReturnService`, `ReturnWorkflowController`, return pages | `returns`, `return_items`, ledger | stock/party/cash | return UI | returns/COGS | `ReturnServiceTest` | service refunds do not restore components | P4 | **Critical** | P6 |
| 16 | Legacy return writers | `SaleReturnService`, `PurchaseReturnService` | ledger | direct writes | – | – | `SaleReturnTest`, `ArchivedProductTest` | fence; do not use for composition | P0 | High | P0 |
| 17 | Costing | `CostResolver`, `PurchaseService`, `SaleService` | cost columns | weighted avg + snapshot | price/margin | all cost reports | `CostingTest` | roll-up + snapshots | P3 | High | P5 |
| 18 | Sales reports | `SalesReportService`, `reports/*` | sales, sale_items | aggregates | report pages | revenue/top products | `ReportsTest` | exclude component lines (never exist) | P4 | High | P7 |
| 19 | Inventory reports | `InventoryReportService` | ledger, products, returns | movement/valuation | StockReport/Print | stock, valuation | `InventoryTest`, `ReportsTest` | separate consumed/produced buckets | P3 | High | P7 |
| 20 | Financial reports | `FinancialReportService` | sales, sale_items, products | COGS/valuation SQL | FinancialOverview, P&L, balance sheet | COGS, profit | `FinancialReportsTest` | rolled cost; consistent returns; no double count | P5 | High | P5/P7 |
| 21 | Dashboard | `DashboardController`, `DashboardReportService` | products, sales, returns | metrics | Dashboard | KPIs | `DashboardTest` | formula availability warning (optional) | P4 | Medium | P7 |
| 22 | Exports | `ExportService`, `ReportController` export methods | same as reports | CSV/XLSX/PDF | export buttons | all exports | none | add composition columns if wanted | P7 | Low | P7 |
| 23 | Backup/restore | `BackupService`, `DatabaseExporter`, `RestoreService` | all tables | dump/import | settings UI | – | 6 backup tests | include new tables automatically; add round-trip test | P1 | Medium | P7 |
| 24 | AuthN/AuthZ | `routes/auth.php`, gates in `AppServiceProvider`, requests | users, roles, permissions | session + gates | mock `AuthContext` | – | auth tests | add composition permissions; enforce CRUD | P0 | **Critical** | P0/P1 |
| 25 | Settings | `SettingsController`, `SettingService`, settings pages | `settings` JSON | read/write | settings pages | – | `SettingsTest` | add composition policy flags if needed; fix missing user methods | – | Medium | P1 |
| 26 | Audit log | `AuditService`, `audit_logs`, `AuditLogController` | `audit_logs` | lifecycle only | audit page | – | none | log formula/run events | P3 | Medium | P3 |
| 27 | Product search/pickers | `ProductService::search`, POS props, component picker | products | query | search UI | – | none | server-side search endpoint; exclude self/archived | P1 | Medium | P2 |
| 28 | Barcode | `products.barcode`, POS search | products | none | not wired | – | none | no change; optionally scan opens editor | – | Low | P8 |
| 29 | Product import/export | **ABSENT** | – | – | – | – | – | none; define later if needed | – | Low | – |
| 30 | Companies/organizations | **ABSENT** on clinic; fashion only | – | – | – | – | – | do not add `company_id` here | – | High (port) | P8 |
| 31 | Warehouses/transfers | **ABSENT** | – | – | – | – | – | out of scope; no schema | – | Medium | – |
| 32 | Manufacturing/production | **ABSENT** | – | – | – | – | – | optional P7; distinct from consumption | P3 | High | P7 |
| 33 | Events/jobs/notifications | **ABSENT** | jobs tables | none | – | – | – | keep execution synchronous; audit only | – | Low | P3 |
| 34 | Clinic module | `ConsultationService`, `ClinicController`, prescription models | consultations, prescriptions, sale link | creates sales | clinic pages | clinic reports | clinic tests (if any) | consumption services can reuse the sale link | P4 | Medium | P4 |
| 35 | Shared UI | `components/ui`, `features/*` | – | – | dialogs/sheets/tables | – | – | reuse; add a11y labels | P2 | Low | P2 |
| 36 | Tests/CI | `tests/**`, `phpunit.xml` | testing DB | – | – | – | – | add composition suite; fix baseline failures | P0 | High | all |
| 37 | Decimal precision | ledger/product migrations | `inventory_transactions.quantity` decimal(12,2) | rounding | inputs | valuation | none | widen to 14,6 if fractional recipes | P1 | High | P1 |
| 38 | Performance/large catalogs | POS sends all products; create sends 999 | – | queries | payload size | reports | none | component search must paginate | P2 | Medium | P2 |
| 39 | Seeders/demo data | `DatabaseSeeder` | users/settings/expense categories | – | – | – | – | add demo formula only in test/dev, not production | – | Low | P8 |
| 40 | Deployment | `DEPLOY.md` | – | migrations | assets | – | – | document new migrations and cron unchanged | – | Low | P8 |

## Crossing summary

| Risk | Subsystems |
|---|---|
| **Critical** | product edit stock write, inventory ledger, sale creation, sale deletion, returns, authorization |
| **High** | purchasing cost/units, lifecycle blockers, costing, reports, units, precision, tenant port |
| **Medium** | product detail/list, audit, settings, search, clinic, performance |
| **Low** | barcode, exports, seeders, deployment, shared UI |

## Reconciliation statement

This matrix was reconciled against the repository-wide searches performed for:

- `company_id`, `organization_id`, `warehouse`, `transfer`, `production`, `manufactur`,
  `formula`, `composite`, `consumption`;
- `product_type`, `track_inventory`;
- every `inventory_transactions` writer;
- every controller `authorize()` call and every FormRequest `authorize()`;
- every report service and route;
- every test file.

Areas marked **ABSENT** were searched and not found. They must not be described as existing
integration points in any implementation plan.

