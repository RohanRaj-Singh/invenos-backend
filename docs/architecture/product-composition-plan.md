# Invenos — Product Composition (Formula / Composite) Audit & Plan

**Status:** Read-only audit plus isolated worktree setup. No application code changed.
**Date:** 2026-11-15
**Branch:** `feature/product-composition` (worktree: `Projects/invenos-product-composition`), based on `master` @ `50be1bd`.

---

## 1. Git Repository Audit

### 1.1 Facts

| Item | Value |
|---|---|
| Repository root | `C:\Users\Rohan Raj Singh\Projects\invenos-backend` |
| Remote | `https://github.com/RohanRaj-Singh/invenos-backend.git` (unreachable — DNS failure, offline) |
| **Fashion branch (actual name)** | **`variation/clothing-erp`** @ `d0ff43e` |
| **Clinic branch (actual name)** | **`master`** @ `50be1bd` — confirmed by the repository owner: the clinic branch was never renamed and is called `master` |
| Clinic alias | `feature/advanced-product-types` — same commit as `master` |
| Branch named `clinic` | None (the branch exists, under its default name `master`) |
| Stashes | none |
| Tags | `base-v1.0` (`0ee9592`) |

The clinic module was developed **on `master`**, not on a branch named `clinic`:
`36a3451 feat(clinic): production-ready clinic module with prescription management` is in `master`'s history.
`master` and `feature/advanced-product-types` both point at `50be1bd`; the latter was created from
`base-v1.0` and then "Reset to master" twice, so it carries no unique work.

Because the branch carries its default name, a `clinic` label never appeared in the ref list; the
owner confirmed `master` **is** the clinic branch. `master` is therefore the clinic development
baseline, and `feature/product-composition` descends from it. This is reversible: nothing was
rebased or reset.

### 1.2 Divergence

- `variation/clothing-erp` is **strictly ahead** of `master` by exactly **1 commit**
  (`d0ff43e feat: complete multi-company isolation and company settings`).
- That single commit touches **373 files** (`+31,449 / −7,647`) — multi-company isolation is a
  large architectural layer, not a cosmetic variation.
- The fashion working tree additionally holds **uncommitted work**: 197 tracked modifications
  (incl. the 2026-11-10 company product availability, company selling price, and checkout
  idempotency features) plus 156 untracked files. All of it was left untouched.
- Merge base: `50be1bd`. There is no true "divergence" — fashion is clinic plus a large delta.

### 1.3 Worktrees (pre-existing)

| Path | HEAD | Branch |
|---|---|---|
| `Projects/invenos-backend` | `d0ff43e` | `variation/clothing-erp` |
| `Projects/invenos-clothing-erp` | `d0ff43e` | `variation/clothing-erp` ← **same branch attached twice** |
| `.local/share/kilo/worktree-pool/.../curious-ladybug` | `50be1bd` | detached |

The duplicate attachment of `variation/clothing-erp` is a pre-existing hazard: a commit made in
either directory moves the branch under the other one's feet, and `git worktree add` refuses to
attach it a third time. Git normally blocks this; it exists already, so it must not be "fixed" by
force. Recommendation: treat `Projects/invenos-backend` as the only fashion working directory and
leave `invenos-clothing-erp` alone (or detach it later with the owner's approval).

### 1.4 Safety posture adopted

- No reset, no rebase, no force-push, no branch deletion, no stash, no checkout in the fashion tree.
- All clinic development happens in a **new** worktree on a **new** branch.
- The only write outside that worktree was this document.

---

## 2. Isolated Clinic Development Environment

Created with:

```text
git worktree add -b feature/product-composition C:\Users\Rohan Raj Singh\Projects\invenos-product-composition master
```

Resulting state:

| Path | HEAD | Branch | Dirty |
|---|---|---|---|
| `Projects/invenos-product-composition` | `50be1bd` | `feature/product-composition` | clean |

- The fashion tree remains at `d0ff43e` with its 350 dirty entries intact.
- No existing directory was overwritten; no branch is attached twice.
- `vendor/` and `node_modules/` do not exist in the new worktree (they are not tracked).
  Run `composer install` and `npm ci` there before executing tests or the frontend build.
- Because `feature/product-composition` descends from `master`, any commit on it remains a
  potential clean cherry-pick onto `variation/clothing-erp` later (see §6).

---

## 3. Architecture Audit

### 3.1 Present on **both** branches (identical or near-identical)

| Area | Reality |
|---|---|
| Product model | `App\Models\Product`, `SoftDeletes`, archive global scope |
| Product types | `products.product_type` enum `('simple','composite')`, default `simple` |
| Units | `ProductUnitService` — canonical unit registry, `count/weight/volume/length`, base factors (`mg`, `ml`, `cm`, `piece`) |
| Packaging | `product_packaging` levels; `selling_units` with `quantity` = base units per selling unit |
| Inventory ledger | `inventory_transactions`; `type` enum **already includes `consumption`** |
| Inventory writes | `InventoryService::recordPurchase / recordSale / recordReturn / recordAdjustment` (identical signatures) |
| Sales | `SaleService::create()` deducts each line through `InventoryService::recordSale` |
| Costing | `CostResolver::unitCost()` — average → opening → latest purchase line → default pack cost |
| Clinic | `ConsultationService` → `SaleService` → `Prescription`/`PrescriptionItem` linked by `sale_item_id` |
| Reports | `InventoryReportService` folds `adjustment`/`damage`/`consumption` into one "adjustments" bucket |

### 3.2 `product_type` is a dead column (both branches)

- Persisted and displayed (`ProductDetails.tsx`), but:
- **not accepted** by `CreateProductRequest` / `UpdateProductRequest` (fashion) or their clinic equivalents;
- hard-coded to `'simple'` in `ProductForm.tsx` payload;
- `resources/js/lib/product-types.ts` declares `features.allowsBom: true` for `composite`, but nothing reads it;
- no `product_compositions`, `bom_*`, `recipe_*`, or component table exists anywhere.

So "composite" today is a label with no behavior. The composition system is greenfield.

### 3.3 Genuine differences that constrain integration

| Concern | Clinic (`master`) | Fashion (`variation/clothing-erp`) |
|---|---|---|
| Tenancy | single business | organization + company |
| Stock authority | `products.stock_quantity` scalar | `company_product_stock` per `(company, product)`, scalar kept as mirror |
| Ledger scoping | global | `inventory_transactions.company_id` |
| Product identity | global | `products.organization_id`, org-scoped SKU |
| Availability | none | `company_products.is_active` |
| Pricing | `selling_units.sale_price` | + `company_selling_unit_prices` override, server-enforced |
| Authorization | none beyond plain roles | `AuthorizationService`, `PermissionCatalog`, company/org permission maps |
| Sale creation | trusts client price | resolves authoritative price, idempotency key, availability check |
| Migrations | 51 | + 21 org/company/availability/pricing/idempotency migrations |
| Tests | 37 feature tests | 85 feature tests incl. company isolation suite |

Both branches share the same **product/inventory domain boundaries**; fashion adds a scoping
layer *around* them rather than replacing them. That is what makes a clean seam possible.

### 3.4 Existing clinic "consumption" precedent

`ConsultationService` already models the exact shape a consumption template needs:

```text
Consultation (service event)
  └── Sale            (billing + inventory deduction, via SaleService)
        └── SaleItem  (product, selling unit, quantity, price, cost snapshot)
  └── Prescription
        └── PrescriptionItem → sale_item_id   (clinical instructions only)
```

The clinical record is separated from the inventory effect and linked by ID. A consumption
template should follow the same pattern: clinical/operational record separate, inventory effect
executed through `InventoryService`, joined by a reference.

---

## 4. Proposed Composition Architecture

### 4.1 Design constraints taken from the audit

1. **Never read or write stock directly.** All stock effects go through
   `InventoryService::recordSale/recordReturn/recordAdjustment`. On fashion that method already
   hydrates `company_product_stock` internally; on clinic it writes the scalar. One call site
   works on both branches unchanged.
2. **Never modify `SaleService::create()`.** It is the most divergent file in the repo
   (311 changed lines). Expansion happens before it, or beside it.
3. **Migrations reference only `products`.** No `company_id`, no `organization_id`, no
   `selling_units`-scope assumptions — so they apply unchanged on either branch.
4. **Templates are immutable.** Adjustments at execution time produce new instance rows; the
   template rows are never rewritten.
5. **Units resolved by `ProductUnitService`**, not by ad-hoc string math.

### 4.2 New domain — `app/Domains/Composition/`

```text
product_compositions
  id
  product_id            FK products (the sellable/manufactured product)
  kind                  enum: 'assembly' | 'consumption'
  name                  nullable
  output_quantity       decimal(12,4) default 1   -- assembly: units produced per run
  is_active             boolean default true
  timestamps
  unique (product_id, kind, is_active=true-equivalent handled in service)
  index (product_id), index (kind)

product_composition_items
  id
  composition_id        FK product_compositions cascade
  component_product_id  FK products
  component_unit_id     string(50)         -- unit the quantity is expressed in
  quantity              decimal(12,4)      -- template quantity
  is_optional           boolean default false
  sort_order            integer default 0
  timestamps
  unique (composition_id, component_product_id)

composition_runs                    -- execution instance (both kinds)
  id
  composition_id        FK
  product_id            FK products
  run_type              enum: 'production' | 'consume'
  source_type           string(50) nullable   -- 'sale' | 'consultation' | 'manual'
  source_id             integer nullable
  quantity              decimal(12,4)         -- output qty produced or services performed
  output_cost           decimal(12,4) nullable -- rolled cost, production only
  notes                 text nullable
  created_by            string nullable
  timestamps
  index (source_type, source_id)

composition_run_items               -- actual consumption, snapshot of the template
  id
  composition_run_id    FK cascade
  component_product_id  FK products
  component_unit_id     string(50)
  template_quantity     decimal(12,4)  -- what the template said
  actual_quantity       decimal(12,4)  -- what was really consumed (may differ)
  inventory_transaction_id FK nullable
  timestamps
```

Why five tables and not three: `product_compositions` + `product_composition_items` hold the
reusable template; `composition_runs` + `composition_run_items` hold the immutable execution
ledger. Collapsing them would either mutate templates on transaction edits (violating the stated
requirement) or lose the audit trail.

### 4.3 Services

| Service | Responsibility |
|---|---|
| `CompositionResolver` | Loads template, converts each item to base units via `ProductUnitService`, returns typed DTOs |
| `CompositionValidator` | Cycle detection (a composite may not contain itself, directly or transitively), same-organization check (fashion), component must be inventory-tracked, quantity > 0 |
| `CompositionCostCalculator` | Rolls component costs via `CostResolver::unitCost()` + unit factor → `output_cost`; never writes `average_cost` |
| `ConsumptionExecutor` | Given a composition + actual quantities, calls `InventoryService::recordAdjustment(type: 'consumption')` per component inside one `DB::transaction`, writes `composition_run_items` |
| `ProductionExecutor` | Assembly kind: consumes components (`type: 'consumption'`), then adds output via `recordAdjustment(type: 'adjustment')` or `recordPurchase`, at the rolled cost |
| `CompositionSaleExpander` | Maps a composite cart line into component lines *before* `SaleService::create()`; allocates the charged price across components |
| `CompositionAvailabilityAdapter` | Optional interface with two implementations (`Null`, `CompanyAvailability`) so the fashion branch can reject components the company cannot use, without clinic code knowing about companies |

`CompositionSaleExpander` keeps `SaleService` untouched, which is what makes the fashion port
survivable.

### 4.4 Behavior of each product kind

| Kind | Template | Execution | Stock effect |
|---|---|---|---|
| Simple | none | existing sale path | existing |
| Composite / manufactured | `assembly` items | POS sale *or* explicit production run | components out (`consumption`), product in at rolled cost |
| Consumption-based service | `consumption` items | sale, consultation, or manual service run with overridable quantities | components out (`consumption`) only; the service itself is not stocked |

Manual override is per-run: `composition_run_items.actual_quantity` diverges from
`template_quantity`, and the template row is untouched.

---

## 5. Shared vs Clinic-Specific

**Shared (port to fashion as-is):**
`product_compositions`, `product_composition_items`, `composition_runs`, `composition_run_items`
+ migrations; `CompositionResolver`, `CompositionValidator`, `CompositionCostCalculator`,
`ConsumptionExecutor`, `ProductionExecutor`, `CompositionSaleExpander`; the formula builder UI
(generic product-picker + unit + quantity); generic tests (expansion, cycle rejection, unit
conversion, template immutability, cost roll-up).

**Clinic-specific (stays on the clinic branch):**
consultation/appointment wiring, prescription linkage of consumption runs, patient-facing UI and
routes, clinic permissions, clinic report surfaces.

**Fashion-specific (never enters the clinic branch):**
`CompositionAvailabilityAdapter` company implementation, company price resolution for expanded
lines, organization catalog governance for composition definitions.

Do not add an abstraction for anything in the "shared" list beyond the one adapter interface above.

---

## 6. Integration Strategy for `variation/clothing-erp`

**Do not merge the clinic branch into fashion.** Fashion is already a superset commit-wise, but a
merge would drag clinic-only route/UI churn across and would be irreversible in spirit.

Recommended sequence:

1. **Keep composition commits additive.** One migration set + one new domain directory + one
   adapter interface + minimal hooks. No edits to `SaleService`, `InventoryService`,
   `ProductService`, `PurchaseService`, or `ReturnService`.
2. **Contact points to accept as small, hand-ported conflicts** (fashion versions differ):
   - `routes/web.php` (483 changed lines vs clinic) — add routes in the fashion file by hand;
   - `resources/js/Pages/inventory/components/ProductForm.tsx` (36 changed lines) — add the
     composition section by hand;
   - `ProductController` / `OrganizationCatalogController` payloads — add `composition` key;
   - product detail page — add the composition card.
3. **Cherry-pick the additive commits** (`git cherry-pick` of migration/domain/tests commits) onto
   fashion, then hand-port step 2's four touch points. Cherry-pick is safe here precisely because
   the additive commits do not touch the divergent files.
4. Verify with fashion's own suite (`tests/Feature/Company/*`, `SalesTest`, `CostingTest`) plus the
   ported composition tests.
5. Only after the port: implement `CompositionAvailabilityAdapter` for company availability and
   company-price resolution for expanded lines.

**Migrations:** must be written as create-only and product-scoped so they apply unchanged on both
branches. Adding a `company_id` later (fashion-only) would break the portability — if company
scoping is ever needed on runs, add it in a separate fashion-only migration.

---

## 7. Risks and Open Decisions

| Risk / decision | Note |
|---|---|
| Dead `product_type` column | Decide: drive composition from table presence, or set `product_type='composite'` on save. Table presence is the safer source of truth. |
| Reports lump `consumption` into "adjustments" | `InventoryReportService` sums `adjustment/damage/consumption`. Composition consumption will show as adjustments until a dedicated bucket is added. |
| Cost interaction | Rolled cost must not overwrite `company_product_stock.average_cost`; production output should be added at the rolled cost as its own movement. |
| Negative-stock policy | Component outflows obey each product's `allow_negative_stock` / company setting; a failed component blocks the whole run — keep one transaction. |
| Cycle risk | Composite-of-composite needs transitive cycle detection; also cap expansion depth. |
| Price allocation on expansion | A composite sold at a single price must apportion to components; define rounding policy (largest-remainder into the last component). |
| Duplicate fashion worktrees | `variation/clothing-erp` is attached at two paths; resolve with the owner before any branch-level rewrite. |
| Offline remote | Cannot verify whether an upstream branch named `clinic` exists; re-check with `git ls-remote --heads origin` when network returns. |

---

## 8. Verification Performed

- `git worktree add` created `feature/product-composition` at `50be1bd`; `git worktree list`
  confirms four worktrees, no duplicate branch attachment introduced.
- Fashion tree re-checked after creation and again after environment setup:
  `variation/clothing-erp` @ `d0ff43e`, same 350 dirty entries, no file modified.
- Clinic `invenos_clinic` database migrated successfully (51 migrations).
- `php artisan test tests/Feature/Products tests/Feature/Inventory tests/Feature/Sales`:
  **35 passed, 2 failed (406 s)**. Both failures are pre-existing on `master`, not environment
  artifacts — the tree is pristine at `50be1bd`:
  - `ProductsTest::test_http_create` posts to `/inventory` without `actingAs`, so it is redirected
    to login and never receives a `success` session. Stale test from before authentication.
  - `SalesTest::test_insufficient_stock_rejected` expects `RuntimeException`, but
    `Product::$attributes` now defaults `allow_negative_stock => true`, so the sale succeeds.
- No application code was changed; only this document was added.

---

## 9. Local Development Environment (clinic worktree)

| Item | Value |
|---|---|
| Working directory | `C:\Users\Rohan Raj Singh\Projects\invenos-product-composition` |
| Branch | `feature/product-composition` (from `master` / clinic) |
| Database | `invenos_clinic` (created for this worktree — never shared with the fashion DB) |
| `.env` | copied from the fashion worktree, `APP_NAME=InvenosClinic`, `DB_DATABASE=invenos_clinic`; git-ignored |
| `vendor/`, `node_modules/` | copied from the fashion worktree because `composer.lock` and `package-lock.json` are **identical** across both branches and the machine is offline (no Composer cache; `composer install` cannot resolve Packagist) |
| Test database | `invenos_testing` (from `phpunit.xml`, root/root) |

**Gotcha — shell environment overrides `.env`:** this machine's shell exports
`DB_DATABASE=invenos_snapshot` (plus `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_USERNAME`,
`DB_PASSWORD`, `APP_ENV`). phpdotenv never overwrites an already-set environment variable, so
Artisan silently runs against `invenos_snapshot` instead of the worktree database. Clear them in
the same command as any Artisan call:

```powershell
@('DB_CONNECTION','DB_DATABASE','DB_HOST','DB_PORT','DB_USERNAME','DB_PASSWORD','APP_ENV') |
  ForEach-Object { Remove-Item "Env:$_" -ErrorAction SilentlyContinue }
php artisan migrate --force
```

This is why the first `migrate` attempt reported "Nothing to migrate": it was pointed at the
already-migrated `invenos_snapshot`. The command was a no-op; no data was changed.
Do not commit `.env`; it is ignored by `.gitignore:3`.

