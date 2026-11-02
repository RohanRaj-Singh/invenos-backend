# Invenos — Multi-Company Foundation Audit

**Date:** 2026-11-02  
**Type:** Read-only architectural audit (no application code changed)  
**Scope:** Laravel backend (`app/`, `database/`, `routes/`, `config/`) and the served Inertia/React frontend (`resources/js/`)  
**Runtime inspected:** live MySQL database `invenos_snapshot` (39 base tables, all InnoDB)  
**Repository state:** branch `master`, HEAD `7ad87e9` plus uncommitted work already present at audit time

**Evidence tags used throughout**

| Tag | Meaning |
| --- | --- |
| **[VERIFIED]** | Read directly from source, migrations, routes, or the live database |
| **[INFERRED]** | Logical conclusion from verified evidence; not explicitly asserted by code |
| **[RECOMMENDED]** | Proposed future architecture; not implemented |
| **[UNRESOLVED]** | Requires a business/product decision |

---

## 1. Executive Summary

The Invenos installation is a **single-tenant, single-business, single-stock-pool application**. There is no organization, company, tenant, branch, outlet, or warehouse entity anywhere in the code or schema. The entire database is the business. The only "business identity" is a JSON row in `settings` and a hard-coded name inside a dead utility class.

The most important findings:

1. **No tenant model exists.** No `organizations`, `companies`, `tenants`, `branches`, `outlets`, or `warehouses` table or model exists. A live `information_schema` scan for columns matching `%business%`, `%company%`, `%tenant%`, `%warehouse%`, `%branch%`, `%outlet%`, or `location_id` returned exactly one column: `contacts.company_name` (a contact's employer name, unrelated to tenancy).
2. **`BusinessContext` is dead scaffolding.** `app/Services/BusinessContext.php` hard-codes `id = '1'`, `name = 'Invenos'`, and is referenced nowhere outside itself. ADR-006 claims "every service constructor accepts it"; that is **not true** in the codebase.
3. **Settings are global and singleton.** `SettingService` always calls `Setting::first()` and caches under the global key `app_settings`. One row exists today.
4. **Stock is a single scalar per product.** `products.stock_quantity` is the only stock balance. There is no location dimension, no per-warehouse balance, and no transfer entity. `inventory_transactions` records movement history but has no location column.
5. **Permissions are not enforced server-side.** Every business route is behind `auth` only. There is no permission middleware. The only authorization checks are `lifecycle.*` gates that read `users.role === 'admin'`. Spatie roles/permissions are seeded but effectively unused. The visible frontend permission system is an **in-memory mock** under `resources/js/data/users.ts`.
6. **Several documented user-management endpoints do not exist.** `routes/web.php` points `settings.users`, `settings.users.store`, `settings.users.update`, `settings.permissions`, and `settings.permissions.update` at `SettingsController` methods that are not implemented. Those routes will fail if the frontend ever calls them; the current frontend uses the mock store instead.
7. **Global uniqueness is pervasive.** Invoice numbers, purchase refs, return numbers, expense numbers, user emails/usernames, category names, return-reason codes, and `financial_transactions.event_key` are all globally unique. These are the first things that break when two companies share one database.
8. **All reports, dashboards, cash ledger, and exports aggregate globally.** There is no company filter anywhere. Adding companies without changing these services would silently produce **combined-company financial statements**.
9. **Multi-company can be added additively.** The codebase already has clean service boundaries, a ledger, a lifecycle service, and an event-ready transaction model. The safest path is an additive scoping layer, not a rewrite.

**Recommendation:** **Option A+ — Organization → Company → Warehouse (warehouse as the single stock location), with an organization-level shared product catalog.** Do not duplicate products per company. Add company-scoped settings and price overrides, warehouse-scoped stock balances and movements, and server-resolved active company context enforced by middleware + global scopes + policies.

**First milestone:** Create `organizations`, `companies`, `warehouses`, `company_user`, and a `CompanyContext` service; backfill one default organization/company/warehouse for the existing installation; add a `ResolveCompanyContext` middleware; make **zero behavioral changes** to existing workflows until the context layer is proven.

---

## 2. Actual Current Architecture

### 2.1 Stack and layering [VERIFIED]

| Concern | Implementation |
| --- | --- |
| Framework | Laravel (`composer.json`: `laravel/framework ^13.8`, PHP `^8.3`) |
| Frontend | Inertia.js 2 + React 18 + TypeScript + Tailwind, built by Vite (`vite.config.js` → `resources/js/app.tsx`) |
| Database | MySQL / MariaDB compatible, default connection `mysql`, live DB `invenos_snapshot`, 39 base tables, all InnoDB |
| Auth | Laravel session auth (Breeze-style), `LoginRequest` accepts email **or** username |
| Roles | Two parallel systems: `users.role` enum (`admin`, `salesman`) and Spatie `HasRoles` (seeded but not enforced) |
| Domain layout | `app/Domains/{Module}/{Services,DTOs,...}` with thin controllers in `app/Http/Controllers` (ADR-004/005) |
| Cross-cutting | `app/Services/Lifecycle/RecordLifecycleService.php`, `app/Domains/Ledger/*`, `app/Domains/Reports/*` |
| Backups | Whole-database export (`app/Domains/Backup/Services/DatabaseExporter.php`) plus file sources |
| Permissions package | `spatie/laravel-permission ^8.3`; `config/permission.php` has `'teams' => false`, `'team' => null` |

### 2.2 Runtime request flow [VERIFIED]

1. `bootstrap/app.php` registers the `web` middleware group with `HandleInertiaRequests` and `AddLinkHeadersForPreloadedAssets`.
2. `routes/web.php` wraps every business route in `Route::middleware('auth')`. There is **no** permission/company middleware.
3. Controllers call domain services; services query Eloquent models directly (no repositories for simple CRUD, per ADR-003).
4. `HandleInertiaRequests::share()` sends `auth.user` (the full Eloquent user) and `settings` (the global settings array) to every Inertia page.
5. React mounts `AuthProvider` and `TransactionProvider` around the Inertia app (`resources/js/app.tsx`).

### 2.3 Live database profile [VERIFIED]

| Table | Rows | Note |
| --- | ---: | --- |
| `users` | 2 | admin + salesman |
| `roles` | 1 | `admin` |
| `permissions` | 35 | seeded Spatie permissions |
| `settings` | 1 | single JSON row |
| `contacts` | 0 | customers/suppliers/patients all live here |
| `products` | 1,137 | |
| `product_categories` | 0 | all products uncategorized |
| `selling_units` | 1,137 | one selling unit per product |
| `sales` | 280 | |
| `sale_items` | 1,984 | |
| `purchase_bills` | 0 | |
| `purchase_bill_items` | 0 | |
| `inventory_transactions` | 3,397 | opening stock + sales movements |
| `financial_transactions` | 222 | cash ledger |
| `expenses` | 0 | |
| `expense_categories` | 7 | |
| `returns` / `return_items` | 0 | |
| `consultations` / `prescriptions` | 0 | |
| `audit_logs` | 73 | |

The live data volume is small and heavily product/sales oriented. A backfill to a default company is mechanically simple; the risk is **constraint changes**, not row volume.

---

## 3. Current Business/Tenant Model

### 3.1 Verified facts [VERIFIED]

| Question | Answer |
| --- | --- |
| Is there an `Organization` model? | **No.** No such class or table. |
| Is there a `Business` model? | **No.** Only a `BusinessContext` utility class with no persistence. |
| Is there a `Tenant` model? | **No.** |
| Is the application a singleton business? | **Yes.** One installation = one business. |
| Is a business context implemented? | **Only as dead code.** `app/Services/BusinessContext.php` returns hard-coded `'1'` / `'Invenos'`. Nothing calls it. |
| Does the authenticated user belong to a business? | **No.** `users` has no `business_id`/`company_id` and no membership pivot. |
| Are business settings stored globally or per business? | **Globally.** One `settings` row (`values` JSON); `SettingService::get()` uses `Setting::first()`; cache key `app_settings` is global. |
| Does any business identifier exist in the database? | **No.** The only `%company%` column is `contacts.company_name`. |
| Any existing company/branch/outlet/warehouse/location concept? | **No entity.** `products.location` is a nullable free-text column from the original schema; it is not a foreign key or location object. |

### 3.2 The `BusinessContext` discrepancy [VERIFIED]

`app/Services/BusinessContext.php`:

```php
private function __construct()
{
    // TODO: Resolve from authenticated user's business in Phase 2
    $this->id = '1';
    $this->name = 'Invenos';
}
```

A full-repository search for `BusinessContext` finds only the class's own docblock and definitions. No service constructor accepts it, no middleware resolves it, and no provider binds it. The architecture test only asserts the class exists (`tests/Feature/Architecture/ArchitectureTest.php::test_business_context_exists`). **ADR-006 describes an intended design, not the implemented one.**

### 3.3 Where "business identity" actually appears today

- `settings.values.business.business_name` — displayed on login, receipts, report headers, and print layouts.
- `config/app.php` / `.env` `APP_NAME` — Inertia title suffix.
- Hard-coded strings `"Invenos"` in `resources/js/layouts/Sidebar.tsx` and `Header.tsx`.
- `BusinessContext` — unused.

There is no server-side object that can answer "which business is this request operating on?"

---

## 4. Authentication and User Architecture

### 4.1 Models and tables [VERIFIED]

**`app/Models/User.php`**

- Extends `Authenticatable`, uses `HasFactory`, `Notifiable`, `SoftDeletes`, and Spatie `HasRoles`.
- Fillable: `name`, `username`, `email`, `password`, `phone`, `role`, `active`.
- `role` is an enum column: `admin | salesman` (migration `2026_07_25_212120_add_user_fields_to_users_table.php`).
- `isAdmin(): bool` returns `$this->role === 'admin'`.
- `active` boolean, `last_login` timestamp, soft deletes.

**`users` table [VERIFIED]**

| Column | Constraint |
| --- | --- |
| `email` | globally unique |
| `username` | globally unique, NOT NULL |
| `role` | enum `admin|salesman`, default `salesman` |
| `active` | boolean, default true |
| `last_login` | nullable timestamp |
| `deleted_at` | soft delete |

There is **no** `business_id`, `company_id`, or membership table.

### 4.2 Roles and permissions [VERIFIED]

**Two systems exist:**

1. **`users.role` enum** — authoritative for `User::isAdmin()` and the `lifecycle.*` gates in `app/Providers/AppServiceProvider.php`.
2. **Spatie permissions** — 35 permissions seeded by `DatabaseSeeder` (`products.view`, `sales.create`, `reports.export`, etc.), plus an `admin` role that receives all permissions and is assigned to the seeded admin. `config/permission.php` has `teams => false` and `team => null`, so roles are **global**, not scoped to any business/team.

**No route or controller enforces Spatie permissions.** A `findstr` across `app/Http/Controllers` and `app/Http/Middleware` finds only `$this->authorize('lifecycle.*')` calls. The gates are:

```php
Gate::define('lifecycle.delete-sales', fn (User $user) => $user->isAdmin());
Gate::define('lifecycle.delete-purchases', fn (User $user) => $user->isAdmin());
Gate::define('lifecycle.delete-products', fn (User $user) => $user->isAdmin());
Gate::define('lifecycle.archive-products', fn (User $user) => $user->isAdmin());
Gate::define('lifecycle.archive-contacts', fn (User $user) => $user->isAdmin());
Gate::define('lifecycle.view-recycle-bin', fn (User $user) => $user->isAdmin());
Gate::define('lifecycle.restore-recycle-bin', fn (User $user) => $user->isAdmin());
Gate::define('lifecycle.permanent-delete', fn (User $user) => $user->isAdmin());
```

Everything else — creating sales, editing products, viewing reports, changing settings, exporting data — is available to **any authenticated user**, including `salesman`.

### 4.3 User management [VERIFIED — with a defect]

- `routes/web.php` defines:
  - `GET /settings/users` → `SettingsController@users`
  - `POST /settings/users` → `SettingsController@storeUser`
  - `PUT /settings/users/{id}` → `SettingsController@updateUser`
  - `GET /settings/permissions` → `SettingsController@permissions`
  - `POST /settings/permissions/user/{id}` → `SettingsController@updateUserPermissions`
- `app/Http/Controllers/SettingsController.php` contains **only** `__construct`, `index`, `edit`, `update`. The five methods above **do not exist**.
- The frontend `resources/js/Pages/settings/UsersList.tsx` and `Permissions.tsx` do not call those routes; they use the in-memory mock API in `resources/js/data/users.ts`.
- **Result:** user management is a demo/mock surface, and the backend routes are dead (and would 500 if used).

### 4.4 Frontend auth is separate from backend auth [VERIFIED]

`resources/js/features/auth/AuthContext.tsx`:

- Imports `getCurrentUser`, `can`, `canModule`, `loginAs`, `loginWithPassword`, `subscribeUsers` from `@/data/users`.
- `resources/js/data/users.ts` is a module-level in-memory array seeded with `admin` / `admin` and `saleem` / `1234`.
- `PermissionGuard` and `usePermission` call this mock store.
- The real login page is `resources/js/Pages/Auth/Login.tsx`, which posts to `/login` and authenticates against the backend. After that, the shell does not hydrate `AuthContext` from the server user; it keeps its own mock user state.
- `HandleInertiaRequests` shares `auth.user`, and `Sidebar` reads `pageProps.auth.user` for the name/role, but permission checks still use the mock store.

**Implication for multi-company:** there is no trustworthy frontend permission or context state to extend. Server-side context must drive the frontend; the mock permission layer should be retired or replaced.

### 4.5 Public registration [VERIFIED + INFERRED]

- `routes/auth.php` exposes `GET/POST /register` (guest middleware).
- `RegisteredUserController::store()` creates a user with only `name`, `email`, `password`.
- `users.username` is `NOT NULL` and unique with no database default.
- **[INFERRED, high confidence]** registration will fail at the database layer because `username` is never supplied. If it were fixed, the new user would default to `role = salesman` and `active = true` with no business membership.

### 4.6 Answers to the audit questions

| # | Question | Answer |
| --- | --- | --- |
| 1 | Can a user belong to multiple businesses? | **No.** No membership relationship exists. |
| 2 | Can a user be assigned to multiple outlets? | **No.** No outlet entity exists. |
| 3 | Is the role globally assigned or business-scoped? | **Globally assigned.** `users.role` is one column; Spatie teams are disabled. |
| 4 | Are permissions dynamically configurable? | **[VERIFIED] Not in the backend.** Spatie rows exist, but nothing checks them. The mock frontend can change a mock permission set only. |
| 5 | Are there existing owner/admin restrictions? | **Only lifecycle gates** (`isAdmin()`), plus the mock frontend's `settings.access` check. There is no server-side restriction on settings, reports, or data creation. |
| 6 | How are employee permissions enforced? | **They are not** server-side. The frontend hides some UI using mock permissions; a direct HTTP request bypasses it. |
| 7 | Can a user switch operational contexts? | **No.** No context, company, or location selector exists. |
| 8 | Which components assume a single business? | Effectively all of them. The strongest assumptions are in `SettingService`, every report service, `CashLedgerService`, `PartyBalance`, `Product`, `InventoryService`, the global unique constraints, and the Inertia shell. |

---

## 5. Operational Database Ownership Matrix

**Ownership pattern today:** every operational table is **implicitly owned by "the installation."** No table has a tenant/company/location foreign key. Some tables inherit company ownership transitively through a parent document (e.g., `sale_items` → `sales`), but there is no explicit scope at the line level.

Legend: **Yes (implicit)** = business-owned but scoped only by the fact that there is one business.

| Table | Business-owned? | Existing scope field | Ownership relationship | Risks |
| --- | --- | --- | --- | --- |
| `users` | Yes (implicit) | none | Installation | One identity per installation; no company membership; global email/username |
| `roles`, `permissions`, `model_has_roles`, `model_has_permissions`, `role_has_permissions` | Yes (implicit) | none | Installation | Spatie teams disabled; roles cannot differ per company |
| `settings` | Yes (implicit) | none | Single row | Global JSON; one row for the whole install; global cache key |
| `contacts` | Yes (implicit) | none | Installation | Customers/suppliers/patients shared across future companies; single `current_balance` |
| `product_categories` | Yes (implicit) | none | Installation | `name` globally unique |
| `products` | Yes (implicit) | none | Installation | Single catalog; single `stock_quantity`; `location` is free text |
| `product_units` | Yes (implicit) | none | Global registry | Unit names globally unique; arguably universal reference data |
| `product_packaging` | Yes (implicit) | `product_id` | Derived from product | Per-product structure; safe if products stay org-level |
| `selling_units` | Yes (implicit) | `product_id` | Derived from product | One sale price per unit for the whole installation; no company price list |
| `inventory_transactions` | Yes (implicit) | `product_id` | Installation | No location; no company; `running_balance` is global |
| `sales` | Yes (implicit) | `customer_id` (party) | Installation | `invoice_number` globally unique; no company/warehouse |
| `sale_items` | Yes (implicit) | `sale_id`, `product_id` | Via `sales` | No company; inherits sale only by convention |
| `purchase_bills` | Yes (implicit) | `supplier_id` (party) | Installation | `invoice_ref` globally unique; no company/warehouse |
| `purchase_bill_items` | Yes (implicit) | `purchase_bill_id`, `product_id` | Via purchase | No company |
| `financial_transactions` | Yes (implicit) | `contact_id`, linked document IDs | Installation | No company, no cash account; `event_key` globally unique; global cash balance |
| `expenses` | Yes (implicit) | `category_id` | Installation | `expense_number` globally unique; no company |
| `expense_categories` | Yes (implicit) | none | Installation | `name` globally unique |
| `returns` | Yes (implicit) | `reference_type/reference_id`, `contact_id` | Installation | `return_number` globally unique; no company/warehouse |
| `return_items` | Yes (implicit) | `return_id`, `product_id` | Via return | No company |
| `return_reasons` | Yes (implicit) | none | Global reference | `(type, code)` globally unique |
| `consultations` | Yes (implicit) | `patient_id`, `doctor_id`, `sale_id` | Installation | No company; doctor is a global user |
| `prescriptions` | Yes (implicit) | `consultation_id`, `patient_id` | Via consultation | No company |
| `prescription_items` | Yes (implicit) | `prescription_id`, `sale_item_id` | Via prescription | `sale_item_id` globally unique (one Rx item per sale item) |
| `prescription_images` | Yes (implicit) | `prescription_id` | Via prescription | Files stored under one global storage path |
| `audit_logs` | Yes (implicit) | `auditable_type/id`, `user_id` | Installation | No company; cross-company audit bleed |
| `backups` | Yes (implicit) | none | Installation | Whole-DB dump; cannot export/restore one company |
| `restore_runs` | Yes (implicit) | `backup_id` | Installation | Whole-DB restore |
| `sessions`, `cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs` | Infrastructure | none | Installation | Cache/queue payloads have no company context |

**Ownership conclusion:** ownership is **implicit and installation-wide**, not direct and not transitive-by-design. Adding companies requires an explicit ownership column on every business-owned table, plus a deliberate decision for shared reference data (`products`, `product_units`, `contacts`, `roles`).

---

## 6. Product Catalog Architecture

### 6.1 Current implementation [VERIFIED]

| Concern | Implementation |
| --- | --- |
| Product | `App\Models\Product` → `products` |
| Category | `App\Models\Category` → `product_categories` |
| Unit registry | `App\Models\ProductUnit` → `product_units` (`name` globally unique; seeded with count/weight/volume/length units) |
| Packaging structure | `App\Models\ProductPackaging` → `product_packaging` (container/contains/quantity/level; unique tuple per product) |
| Selling configuration | `App\Models\SellingUnit` → `selling_units` (`sale_price`, barcode, SKU, default flag, `packaging_id`, `product_unit_id`) |
| Creation / editing | `app/Domains/Products/Services/ProductService.php`, `PackagingDerivationEngine`, `ProductUnitService` |
| SKU / barcode | App-level uniqueness only. The DB unique indexes on `products.sku` and `products.barcode` were explicitly dropped (`2026_07_28_043414_remove_barcode_unique_from_products.php`). `ProductController::store()` appends `-1`, `-2`, … on collision. |
| Pricing | One `selling_units.sale_price` per unit per product, global to the installation |
| Availability | Only `products.status`, `archived_at`, `track_inventory`, and global stock |
| Import/export | No product import/export module found |
| POS selection | `SaleController::create()` loads all products and customers globally |

### 6.2 Are products global or business-owned?

**They are global to the installation.** All references point to a single `products.id`:

- `sale_items.product_id`
- `purchase_bill_items.product_id`
- `inventory_transactions.product_id`
- `return_items.product_id`
- `selling_units.product_id`
- `product_packaging.product_id`
- `products.category_id`

### 6.3 Can an organization share one catalog?

**Yes, and it is the least disruptive design.** Keeping `products` at organization level preserves every existing foreign key and historical document. Per-company behavior can be layered on:

- **Availability:** `product_company` (organization product × company, enabled/disabled).
- **Pricing:** `product_prices` (product/selling unit × company, price, effective dates) overriding `selling_units.sale_price`.
- **Stock:** per-warehouse balances, not per-product-per-company duplicates.
- **Categories:** either organization-shared (recommended) or `company_id NULL` = shared plus company overrides.

**Do not duplicate products per company.** Duplication would break historical references, multiply a 1,137-product catalog, and make consolidated reporting impossible without a product-identity map.

### 6.4 What would break if products were naively scoped by company

- Existing `sale_items`, `purchase_bill_items`, `inventory_transactions`, and `return_items` reference product IDs created before any company split.
- `selling_units` and `product_packaging` cascade from products, so duplicating a product duplicates its packaging graph.
- `generateSku()` counts `Product::withTrashed()->withArchived()->where('sku', 'like', ...)` globally; company-scoped SKUs would need a company prefix or composite uniqueness.
- `product_categories.name` is globally unique; per-company categories with the same name would collide.

---

## 7. Inventory Architecture

### 7.1 Verified model [VERIFIED]

Inventory is **not** a pure projection of movement history. It is a **materialized scalar plus an append-only ledger**:

- `products.stock_quantity` (`decimal(12,2)`) is the current balance.
- `products.status` is denormalized (`in-stock`, `low-stock`, `out-of-stock`) and recalculated on every movement.
- `inventory_transactions` records each movement: signed `quantity`, `unit`, `packaging_name`, `packaging_quantity`, `date`, `document_date`, `reference`, `reference_type/reference_id`, `unit_cost`, `user`, `running_balance`.
- `products.average_cost`, `opening_cost`, `uncosted_qty` hold cost state. `CostResolver` picks the best available cost.

### 7.2 Answers to the inventory questions

| # | Question | Answer |
| --- | --- | --- |
| 1 | Is inventory maintained directly on products? | **Yes.** `products.stock_quantity` is the balance. |
| 2 | Are inventory movements recorded? | **Yes.** `inventory_transactions` (3,397 rows live). |
| 3 | Is inventory a projection of movement history? | **No.** The ledger exists, but `products.stock_quantity` is authoritative and updated incrementally. Nothing rebuilds it from the ledger. |
| 4 | Is stock installation-wide? | **Yes.** One balance per product for the whole installation. |
| 5 | Is inventory location-aware? | **No.** No location column, no warehouse table. `products.location` is free text. |
| 6 | Can the same product have different stock at different locations? | **No.** |
| 7 | How are balances calculated? | `InventoryService::applyMovement()` locks the product row, applies the signed delta, recalculates `status`, saves the product, and writes the ledger row with `running_balance`. |
| 8 | Which operations modify inventory? | Purchases, sales, sale returns, purchase returns, manual adjustments, damage/consumption, product opening stock, and lifecycle delete/restore reversals. |
| 9 | Is `InventoryService` the authoritative mutation service? | **Partially.** It is the intended authority, but **not the only writer.** See 7.3. |
| 10 | Which workflows need location context? | Every stock mutation: purchase receiving, sale deduction, sale return restock, purchase return deduction, adjustments, damage/consumption, opening stock, transfers, and lifecycle reversal. |

### 7.3 Inventory mutation map [VERIFIED]

| Path | Uses `InventoryService`? | Evidence |
| --- | --- | --- |
| `PurchaseService::create()` | **Yes** — `recordPurchase()` | `app/Domains/Purchasing/Services/PurchaseService.php` |
| `SaleService::create()` | **Yes** — `recordSale()` | `app/Domains/Sales/Services/SaleService.php` |
| `ReturnService::completeReturn()` | **Yes** — `recordReturn()`, `recordAdjustment()` | `app/Domains/Returns/Services/ReturnService.php` |
| `ReturnService::reverseReturn()` | **Yes** — `recordAdjustment()` | same |
| `SalePolicy` / `PurchasePolicy` lifecycle delete/restore | **Yes** — `recordAdjustment()` | `app/Policies/Lifecycle/*.php` |
| `InventoryController::adjust()` | **Yes** — via `recordTransaction()` → `recordAdjustment()` | `app/Http/Controllers/InventoryController.php` |
| `ProductService::create()` | **No — bypasses the service** | Creates `InventoryTransaction` (`INITIAL`) and sets `stock_quantity` directly |
| `SaleReturnService::create()` (legacy) | **No — bypasses the service** | Creates `InventoryTransaction` and calls `increment('stock_quantity')` |
| `PurchaseReturnService::create()` (legacy) | **No — bypasses the service** | Creates `InventoryTransaction` and calls `decrement('stock_quantity')` |

**Consequence:** location context cannot be added only to `InventoryService::applyMovement()`. The three legacy/direct writers must be migrated or wrapped, or they will write stock without a warehouse and corrupt per-location balances.

### 7.4 Concurrency and transaction boundaries [VERIFIED]

- `InventoryService::applyMovement()` uses `Product::lockForUpdate()->findOrFail($productId)` before changing stock.
- `SaleService::create()` and `PurchaseService::create()` wrap the whole document in `DB::transaction()`.
- `ReturnService::completeReturn()` locks the return row and the contact, and wraps effects in one transaction.
- `ProductService::create()` wraps creation and the INITIAL movement in `DB::transaction()`.
- `SaleReturnService` / `PurchaseReturnService` wrap legacy returns in `DB::transaction()` but do not lock the product row before mutating stock, so they are weaker than the canonical path.
- `CashLedgerService::record()` uses `event_key` for idempotency; `reverse()` writes compensating rows rather than deleting.

### 7.5 Existing warehouse/location functionality

**None.** There is no warehouse, outlet, branch, or stock-location table, service, route, UI, or report. `products.location` is a legacy free-text field and is not used by inventory logic.

---

## 8. Sales and Financial Architecture

### 8.1 Documents [VERIFIED]

| Document | Table | Key constraints | Notes |
| --- | --- | --- | --- |
| Sale | `sales` | `invoice_number` **globally unique** | `source` = `pos|clinic|manual`; soft deletes + lifecycle fields |
| Sale line | `sale_items` | FK `sale_id`, `product_id` | Snapshots product name, packaging, base quantity, unit price, `cost_price` |
| Purchase | `purchase_bills` | `invoice_ref` **globally unique** | Soft deletes + lifecycle fields |
| Purchase line | `purchase_bill_items` | FK `purchase_bill_id`, `product_id` | Snapshots pack/unit/cost |
| Return | `returns` | `return_number` **globally unique** | Polymorphic `reference_type/reference_id`; statuses pending/completed/cancelled/reversed |
| Return line | `return_items` | FK `return_id`, `product_id` | Polymorphic original line reference |
| Expense | `expenses` | `expense_number` **globally unique** | `category_id` → `expense_categories` |
| Cash/ledger | `financial_transactions` | `event_key` **globally unique** | `contact_id` nullable; source/linked document columns; reversal columns |

### 8.2 Financial derivation [VERIFIED]

- `CashLedgerService` is the single source of truth for **actual cash** (`collection`, `payout`, `refund`, `adjustment`), excluding `invoice` memos and `OPENING` positions.
- `PartyBalance` maintains `contacts.current_balance` as a cached scalar. `PartyLedgerService` derives statements from sales, purchases, returns, and cash rows.
- `FinancialReportService` computes income, purchases, expenses, COGS, cash flow, receivables, payables, inventory value, and a management balance sheet from **global** queries.
- There is **no chart of accounts**, no cash-account entity, no bank account, and no company dimension. "Cash balance" is one number for the installation.

### 8.3 Multi-company implications

- A company cannot have its own invoice sequence without changing the unique index to `(company_id, invoice_number)`.
- A company cannot have its own cash balance without `company_id` (and ideally `cash_account_id`) on `financial_transactions`.
- A contact cannot have a different balance per company while `contacts.current_balance` is one column. Either contacts become company-owned, or balances move to a `contact_balances(contact_id, company_id, balance)` table.
- Consolidated reporting becomes possible only if company scoping is explicit. Today, consolidated and per-company views are indistinguishable because there is only one company.

---

## 9. Reports and Dashboard Architecture

### 9.1 Report services [VERIFIED]

All live under `app/Domains/Reports/Services/`:

| Service | Primary sources | Company filter today? |
| --- | --- | --- |
| `SalesReportService` | `sales`, `sale_items`, `returns`, `expenses` | No |
| `PurchaseReportService` | `purchase_bills`, `returns` | No |
| `InventoryReportService` | `products`, `inventory_transactions`, `return_items` | No |
| `ContactReportService` | `PartyLedgerService` → sales/purchases/returns/cash | No |
| `DashboardReportService` | `sales`, `purchases`, `returns`, `expenses`, `products` | No |
| `DayBookReportService` | all of the above + `financial_transactions` + `inventory_transactions` | No |
| `FinancialReportService` | sales, purchases, returns, expenses, `sale_items` COGS, `CashLedgerService`, `products` valuation | No |
| `ProductReportService` | `inventory_transactions`, `products` | No |
| `ExportService` | Receives already-computed rows from the above | No |
| `ReportService` (legacy facade) | Delegates to the above | No |

### 9.2 Queries that assume one business [VERIFIED]

- `DashboardReportService::today()` — `Sale::whereDate(...)`, `PurchaseBill::whereDate(...)`, `Expense::whereDate(...)`, `Product::whereIn('status', ...)`, `Sale::where('outstanding_balance', '>', 0)`.
- `SalesReportService::register()` — `Sale::with('customer')` with no company predicate; summary sums all sales.
- `PurchaseReportService::register()` — `PurchaseBill::with('supplier')` with no company predicate.
- `InventoryReportService::stockReport()` — `Product::query()` with no company/location predicate; stock totals are installation-wide.
- `FinancialReportService::overview()` / `balanceSheet()` — global cash, global inventory value, global receivables/payables.
- `CashLedgerService::summary()` — global `financial_transactions` query.
- `PartyLedgerService::movements()` — global sales/purchases/returns/cash for a contact.
- `DayBookReportService::generate()` — every source is queried without a company filter.

### 9.3 Aggregations that would become incorrect

If a second company is added **without scoping**, every one of these becomes a cross-company total:

- Total sales / net sales / average order value.
- Total purchases / net purchases.
- COGS, gross profit, net profit, gross margin.
- Cash in/out/closing balance.
- Receivables/payables.
- Inventory quantity and valuation.
- Customer/supplier ledgers.
- Day Book events and closing summary.
- Dashboard KPIs and trends.

### 9.4 Reports that should support company filters vs consolidated views

**[RECOMMENDED]**

- **Company-scoped by default:** Sales Register, Purchase Register, Stock Report, Stock Ledger, Low Stock, Customer/Supplier Ledger, Day Book, P&L, Cash Flow, Balance Sheet, Financial Overview, Product Ledger, all CSV/Excel/PDF exports.
- **Consolidated (organization-wide) with explicit permission:** Financial Overview, P&L, Balance Sheet, Cash Flow, Inventory Valuation, Sales/Purchase totals, dashboard executive view.
- **Never consolidated for operational lists:** individual invoices, returns, stock movements, customer ledgers (unless an org-level roll-up is explicitly designed).

### 9.5 Export leakage risk

`ReportController` exports call the same report services and the same `ReportFilters`. Since `ReportFilters` has no company field (`app/Domains/Reports/DTOs/ReportFilters.php`), an authenticated user can export every company's data in one CSV. `ReportShareController` stores generated files and serves them by path; those artifacts need company ownership and authorization once companies exist.

---

## 10. Frontend Context Architecture

### 10.1 Shell and navigation [VERIFIED]

- `resources/js/app.tsx` creates the Inertia app, applies `AppLayout` as the default layout (except print pages), and wraps the tree in `AuthProvider` + `TransactionProvider`.
- `resources/js/layouts/AppLayout.tsx` composes `Sidebar`, `Header`, `BottomNav`, dark mode, and flash toasts.
- `Sidebar.tsx` hard-codes the navigation tree (Home, Inventory, Sales, Purchases, Payments, Expenses, Contacts, Reports, Utilities, Settings, Modules) and reads `pageProps.auth.user` for the footer name/role.
- `Header.tsx` hard-codes the mobile brand "Invenos", quick actions, search, notifications, and a static `DA` avatar.
- `BottomNav.tsx` is the mobile navigation.
- There is **no company selector, location selector, or context switcher**.

### 10.2 Shared Inertia props [VERIFIED]

`app/Http/Middleware/HandleInertiaRequests.php` shares exactly:

```php
'auth' => ['user' => $request->user()],
'settings' => fn () => app(SettingService::class)->get(),
'flash' => ['success','error','warning','info'],
```

No `company`, `companies`, `warehouse`, `capabilities`, or `permissions` prop. `resources/js/types/index.d.ts` defines `PageProps` with only `auth.user` and `flash`.

### 10.3 Business settings presentation [VERIFIED]

- `resources/js/Pages/settings/Business.tsx` edits the global `settings.business` object.
- Business name is rendered in `resources/js/features/printing/components/BusinessHeader.tsx`, `resources/js/Pages/reports/components/ReportLayout.tsx`, `resources/js/Pages/reports/StockPrint.tsx`, `resources/js/Pages/Auth/Login.tsx`, and `resources/js/Pages/settings/Receipt.tsx`.
- The app shell itself still says "Invenos" in `Sidebar.tsx` and `Header.tsx`, independent of settings.

### 10.4 Permissions in navigation [VERIFIED]

The sidebar does **not** use `usePermission`/`PermissionGuard`; it renders every item. `PermissionGuard` and `usePermission` exist (`resources/js/features/auth/PermissionGuard.tsx`) but are wired to the mock `AuthContext`. Some settings pages call `auth.can('settings', 'access')` to hide actions, but this checks the mock user, not the server.

### 10.5 Best integration point for a future company switcher [RECOMMENDED]

1. **Server:** add `ResolveCompanyContext` middleware after `auth`; set a request-scoped `CompanyContext`; share only the companies the user may access.
2. **Inertia:** extend `HandleInertiaRequests::share()` with:
   - `company` — the active company (id, name, currency, timezone, capabilities).
   - `companies` — accessible companies for the switcher.
   - `warehouse` / `warehouses` — where relevant.
   - `permissions` — effective server-computed permission set.
3. **Client:** hydrate `AuthContext` from `pageProps.auth`/`pageProps.permissions` instead of the mock store.
4. **UI:** put the switcher in `Header.tsx` (desktop) and the mobile drawer (`AppLayout`/`Sidebar`), and make the brand label read `settings.business.business_name` or the active company name.
5. **Never** let the switcher send a raw `company_id` that the server trusts; the server must validate membership on every request.

**Do not implement the switcher in this phase.**

---

## 11. Existing Constraints and Risks

### 11.1 Global unique constraints [VERIFIED — live indexes]

| Table | Unique index | Columns | Why it blocks multi-company |
| --- | --- | --- | --- |
| `sales` | `sales_invoice_number_unique` | `invoice_number` | Two companies cannot both use `INV-0001` |
| `purchase_bills` | `purchase_bills_invoice_ref_unique` | `invoice_ref` | Two companies cannot reuse supplier bill numbers |
| `returns` | `returns_return_number_unique` | `return_number` | Return sequences collide |
| `expenses` | `expenses_expense_number_unique` | `expense_number` | Expense sequences collide |
| `financial_transactions` | `financial_transactions_event_key_unique` | `event_key` | Idempotency keys collide across companies |
| `users` | `users_email_unique` | `email` | One email cannot belong to two companies unless identities are org-level |
| `users` | `users_username_unique` | `username` | Same |
| `product_categories` | `product_categories_name_unique` | `name` | Company-specific category names collide |
| `expense_categories` | `expense_categories_name_unique` | `name` | Same |
| `return_reasons` | `return_reasons_type_code_unique` | `type`, `code` | Company-specific reasons collide |
| `product_units` | `product_units_name_unique` | `name` | Fine if kept as a global registry |
| `product_packaging` | `packaging_unique_pair` | `product_id`, `container_unit_id`, `contains_unit_id` | Fine if products stay org-level |
| `prescription_items` | `rx_item_sale_item_unique` | `sale_item_id` | Fine; one Rx line per sale line |
| `backups` | `backups_uuid_unique` | `uuid` | Fine |
| `restore_runs` | `restore_runs_uuid_unique` | `uuid` | Fine |

**Note:** `products.sku` and `products.barcode` are **not** unique in the live database. The original unique indexes were dropped. Uniqueness is enforced in `ProductController::store()` by appending `-1`, `-2`, … globally. Multi-company SKUs therefore need either an org-wide SKU policy or `(organization_id, sku)` uniqueness plus app changes.

### 11.2 Structural constraints

| Constraint | Type | Impact | Mitigation |
| --- | --- | --- | --- |
| `settings` is one row; `SettingService` uses `first()`; cache key `app_settings` | **Schema + app + config** | All companies share one settings object | Add `company_id` to settings (or `company_settings`); cache key per company |
| `products.stock_quantity` is one scalar | **Schema** | Cannot represent per-company/per-warehouse stock | Add `stock_balances(warehouse_id, product_id, quantity, ...)`; keep product scalar as org aggregate or deprecate |
| `inventory_transactions` has no location | **Schema** | Movements cannot be attributed to a warehouse | Add `company_id`, `warehouse_id` (nullable during backfill) |
| `financial_transactions` has no company/cash account | **Schema** | One global cash balance | Add `company_id`, optional `cash_account_id` |
| `contacts.current_balance` is one scalar | **Schema** | A customer cannot owe different amounts to different companies | Either company-own contacts or add `contact_balances(contact_id, company_id, balance)` |
| No tenant global scopes except `Product::notArchived` | **App** | Every query returns all companies' rows | Add `BelongsToCompany` trait + global scope |
| No permission middleware | **App** | Any authenticated user can access any module | Add route middleware + policies |
| `SettingsController` user-management methods missing | **App** | Five routes are dead | Implement or remove the routes/pages |
| Public registration omits `username` | **App/schema** | Registration likely fails; role defaults to salesman | Fix or disable registration |
| Frontend permission/auth is a mock | **App (frontend)** | UI authorization is unrelated to backend | Hydrate from server or remove |
| Backups are whole-DB | **App** | Cannot export/restore one company | Add company-scoped exports or accept installation-level backups |
| `audit_logs` has no company | **Schema** | Cross-company audit visibility | Add `company_id`; filter by context |
| Report and export services have no company filter | **App** | Silent cross-company totals/leaks | Add company scope + explicit consolidated mode |
| Global `Cache` keys | **Config/app** | Settings/permission caches bleed | Key by company; clear on switch |
| `sessions` / `jobs` have no company context | **Schema** | Background jobs lose context | Store `company_id` in job payload / session context |

### 11.3 Security risks identified today

| Risk | Severity | Evidence |
| --- | --- | --- |
| Any authenticated user can update global settings | High | `SettingsController::update()` has no authorization; `UpdateSettingsRequest::authorize()` returns `true` |
| Any authenticated user can view/export all financial data | High | `routes/web.php` uses `auth` only; report services have no authorization |
| Frontend permission checks are cosmetic | High | `resources/js/data/users.ts` is an in-memory mock |
| Public registration route is exposed | Medium | `routes/auth.php`; `RegisteredUserController` creates users without `username` |
| Full user model is shared to Inertia | Low/Medium | `auth.user` is the Eloquent model; password is hidden, but all other attributes are exposed |
| Lifecycle deletion is admin-only, but archives/permanent deletes are not audited per company | Medium | `AuditLog` has no company dimension |
| Backup/restore is whole-installation | Medium | `DatabaseExporter` dumps every table |

---

## 12. Multi-Company Architecture Options

### Option A — Organization + Companies + Warehouses

- `organizations` owns `companies` and `warehouses`.
- Companies are operational retail businesses (POS, sales, purchases, expenses, reports).
- Warehouses are stock-holding units (receive, hold, dispatch, transfer, valuation).
- Transactions reference their company and (for stock) warehouse.
- Products can be shared at organization level.

**Advantages**
- Directly matches the stated business requirement.
- Explicit foreign keys; simple, index-friendly queries.
- Easy to understand and migrate from the single-business model.
- Capability differences (POS vs warehouse) are explicit, not polymorphic.
- Natural default backfill: one org → one company → one warehouse.

**Disadvantages**
- Two "location-like" concepts unless the design says stock lives in warehouses only.
- More tables than a generic business-unit model.
- If a company later needs multiple outlets, a branch layer may be added.

**Complexity:** Medium.  
**Migration:** Additive; one default chain; low risk if nullable columns are introduced first.  
**Compatibility:** High with the existing codebase, because products, contacts, sales, and inventory keep their current shapes.

### Option B — Organization + Generic Business Units (type: retail/warehouse/manufacturing)

- One `business_units` table with `type` and capabilities.
- Companies and warehouses are rows in the same table.
- Feature availability is driven by capabilities.

**Advantages**
- Maximum flexibility for future unit types.
- One membership model for all units.
- Shared settings/policies surface.

**Disadvantages**
- Polymorphic semantics leak into every FK (`business_unit_id` means different things).
- Reporting must always filter/join by type; accidental cross-type aggregation is easy.
- Permissions and UI must interpret capabilities everywhere.
- Harder to enforce invariants ("a warehouse cannot create a POS sale") without application-level checks.
- Over-engineered for the current client requirement.

**Complexity:** High.  
**Migration:** Medium–high; every operational table points at a generic unit.  
**Compatibility:** Medium; requires more upfront abstraction and more test surface.

### Option C — Company + Branch + Warehouse

- Company = legal/operational business.
- Branch = outlet/store.
- Warehouse = stock location under a branch or company.

**Advantages**
- Most granular for multi-outlet retail.
- Clear separation of legal entity, outlet, and stock location.
- Scales to franchises and regional operations.

**Disadvantages**
- Three layers and three membership concepts for a client that only asked for companies and warehouses.
- Existing single installation becomes Company → Branch → Warehouse; more backfill and UI complexity.
- If no branch requirement exists, this is premature.

**Complexity:** High.  
**Migration:** Highest; more tables, more FKs, more UI.  
**Compatibility:** Medium; the existing code would need a branch dimension it has never had.

### Comparison

| Criterion | A | B | C |
| --- | --- | --- | --- |
| Matches stated requirement | **Strong** | Strong | Over-scoped |
| Migration risk from current code | **Low–Medium** | Medium–High | High |
| Query simplicity | **High** | Medium | Medium |
| Reporting clarity | **High** | Medium | Medium |
| Future flexibility | Medium | **High** | High |
| Risk of accidental cross-type mixing | Low | **High** | Low |
| Overengineering risk | Low | **High** | High |

### Recommendation

**Adopt Option A with one refinement: the warehouse is the single stock location.**

```
Organization
  ├── Company (retail/POS business unit)
  │     └── default warehouse (where its stock lives)
  ├── Warehouse (organization-owned stock location)
  └── Shared product catalog
```

- A company may own one or more warehouses; an organization may own warehouses that serve multiple companies.
- Every stock balance and movement references a `warehouse_id`.
- Every commercial document (sale, purchase, expense, return, cash row) references a `company_id`.
- A company's POS sells from one or more warehouses; the default is its primary warehouse.
- This avoids a separate `stock_locations` table while still allowing company-owned and org-owned warehouses.
- Do **not** add a branch layer now. Add it later only if a company needs multiple retail outlets, and then treat a branch as a company-owned grouping of warehouses.

---

## 13. Recommended Architecture

### 13.1 Core entities [RECOMMENDED]

| Entity | Responsibility | Key fields |
| --- | --- | --- |
| `organizations` | Ownership/account boundary. Owns companies, warehouses, shared catalog, users. | `id`, `name`, `slug`, `currency`, `timezone`, `settings` (or relation), timestamps |
| `companies` | Operational retail business. Owns sales, purchases, expenses, returns, settings, memberships. | `id`, `organization_id`, `name`, `code`, `currency`, `timezone`, `tax_number`, `status`, timestamps |
| `warehouses` | Stock-holding unit. Owns stock balances and movements. | `id`, `organization_id`, `company_id` (nullable = org-owned), `name`, `code`, `type` (`retail|storage|transit`), `status` |
| `company_user` | Membership and company-scoped role. | `company_id`, `user_id`, `role` (`admin|manager|cashier`), `active`, timestamps |
| `warehouse_user` | Optional warehouse access. | `warehouse_id`, `user_id`, `role`, timestamps |
| `product_company` | Assortment/availability of an org product in a company. | `product_id`, `company_id`, `enabled`, `is_active` |
| `product_prices` | Company-specific price override. | `product_id`, `selling_unit_id` (nullable), `company_id`, `price`, `effective_from`, `effective_to` |
| `stock_balances` | Authoritative stock per warehouse. | `warehouse_id`, `product_id`, `quantity`, `reserved_quantity`, `average_cost`, `uncosted_qty`, unique `(warehouse_id, product_id)` |
| `stock_transfers` / `stock_transfer_items` | Inter-warehouse transfers. | `from_warehouse_id`, `to_warehouse_id`, `status`, `date`, lines with product/qty/cost |
| `cash_accounts` (optional) | Cash/bank accounts per company. | `company_id`, `name`, `type`, `opening_balance`, `active` |
| `document_sequences` | Per-company invoice/return/expense numbering. | `company_id`, `document_type`, `prefix`, `next_number`, `year` |

### 13.2 Ownership rules [RECOMMENDED]

- **Organization-owned:** users, roles/permissions (org-level), products, product categories, product units, product packaging, customer/supplier master data (decision needed), warehouses, companies.
- **Company-owned:** sales, sale items (via sale), purchase bills, purchase bill items (via bill), expenses, expense categories (or org-shared with overrides), returns, return items, financial transactions, cash accounts, company settings, price overrides, assortment.
- **Warehouse-owned:** stock balances, inventory transactions, transfers, warehouse settings.
- **Global reference data:** `product_units` (universal unit registry), `return_reasons` defaults (with company overrides), currencies/timezones if later added.

### 13.3 What remains unchanged

- The domain/service/controller layering (ADR-004/005).
- The ledger design (`CashLedgerService`, `PartyBalance`, `PartyLedgerService`) — only add a company dimension.
- The lifecycle service and audit pattern — only add company context.
- The product/packaging/unit model — keep products org-level; add company price/assortment layers.
- The existing IDs and foreign keys — preserve them by backfilling a default company/warehouse rather than renumbering.
- The Inertia/React shell — extend shared props; don't rewrite.

---

## 14. Proposed Entity Relationship Diagram

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ COMPANIES : owns
    ORGANIZATIONS ||--o{ WAREHOUSES : owns
    ORGANIZATIONS ||--o{ USERS : members
    ORGANIZATIONS ||--o{ PRODUCTS : catalog
    ORGANIZATIONS ||--o{ PRODUCT_CATEGORIES : catalog
    ORGANIZATIONS ||--o{ CONTACTS : parties

    COMPANIES ||--o{ WAREHOUSES : operates
    COMPANIES ||--o{ COMPANY_USER : memberships
    COMPANIES ||--o{ PRODUCT_COMPANY : assortment
    COMPANIES ||--o{ PRODUCT_PRICES : price_overrides
    COMPANIES ||--o{ SALES : sells
    COMPANIES ||--o{ PURCHASE_BILLS : buys
    COMPANIES ||--o{ EXPENSES : spends
    COMPANIES ||--o{ RETURNS : returns
    COMPANIES ||--o{ FINANCIAL_TRANSACTIONS : cash
    COMPANIES ||--o{ CASH_ACCOUNTS : accounts
    COMPANIES ||--o{ DOCUMENT_SEQUENCES : numbering
    COMPANIES ||--o{ COMPANY_SETTINGS : settings

    WAREHOUSES ||--o{ STOCK_BALANCES : holds
    WAREHOUSES ||--o{ INVENTORY_TRANSACTIONS : movements
    WAREHOUSES ||--o{ STOCK_TRANSFERS : from
    WAREHOUSES ||--o{ STOCK_TRANSFERS : to

    PRODUCTS ||--o{ SELLING_UNITS : sells_as
    PRODUCTS ||--o{ PRODUCT_PACKAGING : packaging
    PRODUCTS ||--o{ STOCK_BALANCES : stocked_in
    PRODUCTS ||--o{ INVENTORY_TRANSACTIONS : moved
    PRODUCTS ||--o{ PRODUCT_COMPANY : available_in
    PRODUCTS ||--o{ PRODUCT_PRICES : priced_in

    SALES ||--o{ SALE_ITEMS : lines
    PURCHASE_BILLS ||--o{ PURCHASE_BILL_ITEMS : lines
    RETURNS ||--o{ RETURN_ITEMS : lines
    STOCK_TRANSFERS ||--o{ STOCK_TRANSFER_ITEMS : lines

    CONTACTS ||--o{ SALES : customer
    CONTACTS ||--o{ PURCHASE_BILLS : supplier
    CONTACTS ||--o{ RETURNS : party
    CONTACTS ||--o{ FINANCIAL_TRANSACTIONS : party
    CONTACTS ||--o{ CONTACT_BALANCES : balances

    USERS ||--o{ COMPANY_USER : belongs_to
    USERS ||--o{ WAREHOUSE_USER : access
    USERS ||--o{ AUDIT_LOGS : acts
```

> The diagram is the target model. Nothing in this diagram beyond the existing tables is implemented today.

---

## 15. Proposed Data Ownership Model

| Data | Owner | Scope column(s) | Notes |
| --- | --- | --- | --- |
| Users | Organization | `organization_id` (optional if one org per install) | One identity can access multiple companies |
| Roles/permissions | Organization | via `company_user.role` for company scope | Keep Spatie for global abilities; add company-scoped roles |
| Products | Organization | `organization_id` | Shared catalog; no duplication |
| Categories | Organization (recommended) | `organization_id` or `company_id NULL` for shared | Allows company overrides if needed |
| Product units | Global | none | Universal reference data |
| Packaging | Product (org) | `product_id` | Unchanged |
| Selling units | Product (org) | `product_id` | Base price; company overrides in `product_prices` |
| Company assortment | Company | `company_id`, `product_id` | Enable/disable products per company |
| Company prices | Company | `company_id`, `product_id`, `selling_unit_id` | Effective-dated overrides |
| Stock balances | Warehouse | `warehouse_id`, `product_id` | Authoritative stock |
| Inventory movements | Warehouse | `warehouse_id`, `product_id` | Append-only ledger |
| Transfers | Organization | `from_warehouse_id`, `to_warehouse_id` | Moves stock between locations |
| Sales | Company | `company_id` (+ `warehouse_id` for stock source) | Invoice number per company |
| Purchase bills | Company | `company_id` (+ receiving `warehouse_id`) | Ref per company |
| Expenses | Company | `company_id` | Number per company |
| Returns | Company | `company_id` (+ `warehouse_id`) | Number per company |
| Financial transactions | Company | `company_id` (+ `cash_account_id`) | Event key per company |
| Contacts | Organization (recommended) | `organization_id` | Shared customers/suppliers/patients; per-company balances via `contact_balances` |
| Contact balances | Company | `contact_id`, `company_id` | Needed if contacts are shared |
| Settings | Company | `company_id` | Per-company business/POS/inventory/sales/purchases/receipt settings |
| Audit logs | Company + Organization | `organization_id`, `company_id` | Filter by context |
| Backups | Organization | `organization_id` | Keep installation-level backups; add scoped exports later |
| Sessions/jobs/cache | Context | `company_id` in payload/context | Prevent jobs from running in the wrong company |

---

## 16. Proposed Company/Warehouse Capability Model

Rather than a polymorphic `business_units` table, use **explicit capability flags** on companies and warehouses. This preserves simple queries and makes "warehouse has no POS" enforceable.

### 16.1 Company capabilities [RECOMMENDED]

| Capability | Meaning |
| --- | --- |
| `pos` | Can create POS sales, print invoices, use the sales module |
| `purchasing` | Can create purchase bills and supplier payments |
| `expenses` | Can record operating expenses |
| `inventory` | Can hold stock and adjust it |
| `clinic` | Can use patient/consultation/prescription features |
| `reporting` | Can view company reports |
| `consolidated_reporting` | Can view organization-wide reports (usually admin only) |

### 16.2 Warehouse capabilities [RECOMMENDED]

| Capability | Meaning |
| --- | --- |
| `receive_stock` | Can receive purchase receipts |
| `hold_stock` | Can hold balances |
| `dispatch_stock` | Can fulfil sales/transfers out |
| `transfer_stock` | Can send/receive transfers |
| `valuation` | Can participate in inventory valuation |
| `pos` | **Off by default**; a warehouse must not silently become a retail outlet |

### 16.3 Enforcement [RECOMMENDED]

- Route middleware checks the active company has the module capability.
- Policies check `company_user.role` plus capability.
- UI hides modules the active company cannot use (from shared `capabilities` props).
- Server-side validation rejects a sale from a company without `pos`, a purchase into a warehouse without `receive_stock`, etc.
- Consolidated reporting requires an explicit organization-level permission, never just an admin boolean.

---

## 17. Data Migration Strategy

**Do not execute during this audit.** This is the safe, additive path for the existing installation.

### 17.1 Preconditions

1. Create and verify a full backup (`php artisan backup:run`) and copy it off-box.
2. Put the app in maintenance mode or freeze writes during the final cut-over.
3. Record baseline counts and financial invariants:
   - product count, stock totals, inventory ledger sum per product.
   - sales totals, COGS, cash ledger totals.
   - no cross-table mismatches before migration.
4. Confirm the live DB is the intended source (`invenos_snapshot`) and that no other database is in use.

### 17.2 New tables (additive)

```
organizations
companies
warehouses
company_user
warehouse_user (optional in phase 1)
company_settings (or settings.company_id)
product_company
product_prices
stock_balances
stock_transfers
stock_transfer_items
cash_accounts (optional)
document_sequences
contact_balances (if contacts stay org-shared)
```

### 17.3 New columns (nullable first)

| Table | Column | Purpose |
| --- | --- | --- |
| `users` | `organization_id` (nullable) | Org membership; keep global identity |
| `company_user` | `company_id`, `user_id`, `role` | Per-company access |
| `products` | `organization_id` (nullable) | Shared catalog owner |
| `product_categories` | `organization_id` (nullable) | Shared categories |
| `contacts` | `organization_id` (nullable) | Shared parties |
| `sales` | `company_id`, `warehouse_id` (nullable) | Commercial + stock source |
| `sale_items` | `company_id` (denormalized, optional) | Fast scoping; can inherit via sale |
| `purchase_bills` | `company_id`, `warehouse_id` (nullable) | Commercial + receiving |
| `purchase_bill_items` | `company_id` (optional) | Fast scoping |
| `inventory_transactions` | `company_id`, `warehouse_id` (nullable) | Movement attribution |
| `financial_transactions` | `company_id`, `cash_account_id` (nullable) | Cash scope |
| `expenses` | `company_id` (nullable) | Expense scope |
| `expense_categories` | `company_id` (nullable; null = shared) | Optional company categories |
| `returns` | `company_id`, `warehouse_id` (nullable) | Return scope |
| `return_items` | `company_id` (optional) | Fast scoping |
| `return_reasons` | `company_id` (nullable; null = shared) | Optional company reasons |
| `consultations` | `company_id` (nullable) | Clinic scope |
| `prescriptions` | `company_id` (optional, inherits) | Clinic scope |
| `audit_logs` | `organization_id`, `company_id` (nullable) | Audit scope |
| `settings` | `company_id` (nullable; or move to `company_settings`) | Per-company settings |

### 17.4 Backfill

**Step 1 — Create the default chain**

```
Organization: "Invenos" (or the client's legal name)
Company:      "Invenos" (default retail company)
Warehouse:    "Main Warehouse" (belongs to the default company)
```

**Step 2 — Users**

- Assign every existing user to the default company via `company_user`.
- Preserve `users.role` as the org-level legacy role; map:
  - `admin` → company role `admin`.
  - `salesman` → company role `cashier` (or `salesman`, depending on the final role vocabulary).
- Keep `users.email`/`username` unique globally (recommended: one identity across companies).

**Step 3 — Products and catalog**

- Set `products.organization_id` to the default organization.
- Set `product_categories.organization_id` if the column is added.
- Enable all products for the default company in `product_company`.
- Leave `selling_units.sale_price` as the default price; create no overrides initially.

**Step 4 — Stock**

- For every product, create one `stock_balances` row:
  - `warehouse_id` = default warehouse.
  - `product_id` = product.
  - `quantity` = `products.stock_quantity`.
  - `average_cost` = `products.average_cost`.
  - `uncosted_qty` = `products.uncosted_qty`.
- Backfill `inventory_transactions.company_id` / `warehouse_id` to the default company/warehouse.
- Keep `products.stock_quantity` as an organization-level aggregate during the transition; later mark it deprecated or maintain it as the sum of balances.
- Validate: `SUM(stock_balances.quantity)` per product equals `products.stock_quantity`.

**Step 5 — Documents and ledger**

- Set `sales.company_id` / `purchase_bills.company_id` / `expenses.company_id` / `returns.company_id` = default company.
- Set `sales.warehouse_id` / `purchase_bills.warehouse_id` / `returns.warehouse_id` = default warehouse.
- Set `financial_transactions.company_id` = default company.
- Set `audit_logs.company_id` = default company (or derive from the auditable record).
- Set `consultations.company_id` = default company if clinic data exists.

**Step 6 — Settings**

- Copy the existing `settings.values` JSON to the default company's settings row.
- Keep a global/organization-level row for org-wide defaults (branding, currency, timezone) if desired.
- Change `SettingService` to resolve by `company_id` with a fallback to organization/global defaults.
- Change the cache key from `app_settings` to `app_settings:{company_id}`.

**Step 7 — Sequences**

- Seed `document_sequences` from the current maximum numbers:
  - Sales prefix `INV-`, next number = max existing + 1.
  - Return prefixes `SR-` / `PR-`.
  - Expense prefix `EXP-`.
  - Purchase prefix as used.
- Generate per-company numbers going forward.

### 17.5 Unique constraint changes

| Current | Target |
| --- | --- |
| `sales.invoice_number` unique | unique `(company_id, invoice_number)` |
| `purchase_bills.invoice_ref` unique | unique `(company_id, invoice_ref)` |
| `returns.return_number` unique | unique `(company_id, return_number)` |
| `expenses.expense_number` unique | unique `(company_id, expense_number)` |
| `financial_transactions.event_key` unique | unique `(company_id, event_key)` |
| `product_categories.name` unique | unique `(organization_id, name)` or keep global if shared |
| `expense_categories.name` unique | unique `(company_id, name)` or keep global if shared |
| `return_reasons (type, code)` unique | unique `(company_id, type, code)` or keep global defaults |
| `users.email` / `users.username` unique | keep global (org-level identity) |
| `products.sku` (app-level global) | app-level `(organization_id, sku)` or keep org-wide |

**Safest order:** add composite indexes while old unique indexes still exist, backfill, validate, then drop the old uniques in a later deployment. MySQL will not allow duplicate keys under the old unique while data is still single-company, so this is safe.

### 17.6 Rollback

- Keep all new columns nullable until the final phase.
- Keep old unique indexes until the composite indexes are validated.
- Revert application code first (old code ignores new columns).
- Down migrations drop new tables/columns in reverse dependency order.
- If data was modified, restore the pre-migration backup rather than attempting a partial reverse backfill.
- Preserve `products.stock_quantity` until `stock_balances` is verified, so the old code remains functional.

### 17.7 Historical records

Historical sales, purchases, inventory movements, returns, and cash rows are **assigned** to the default company/warehouse; they are **not** recomputed, renumbered, or rewritten. This preserves invoice numbers, audit trails, and report totals for the existing business. Future companies start with fresh sequences.

---

## 18. Security and Isolation Strategy

### 18.1 Core principle

**Never trust a client-supplied company ID.** The active company is resolved on the server from the authenticated user's memberships, and every business query is constrained by that server-resolved context.

### 18.2 Recommended controls [RECOMMENDED]

| Layer | Control |
| --- | --- |
| Context resolution | `ResolveCompanyContext` middleware after `auth`. Reads the session's `active_company_id`, validates it against `company_user` for the current user, falls back to the user's default/first company. |
| Context object | Replace `BusinessContext` with a request-scoped `CompanyContext` (bound as a singleton per request). Expose `id()`, `company()`, `warehouse()`, `organization()`, `capabilities()`. |
| Query scoping | `BelongsToCompany` trait + global scope on company-owned models (`Sale`, `PurchaseBill`, `Expense`, `FinancialTransaction`, `ReturnModel`, `InventoryTransaction`, `AuditLog`, etc.). Scope reads; set writes explicitly. |
| Writes | Services set `company_id` from `CompanyContext`, never from request input. Mass assignment must not include `company_id`. |
| Authorization | Policies per model (`viewAny`, `view`, `create`, `update`, `delete`) checking membership, company role, and capability. Add `can:` middleware to routes. |
| Route protection | Group routes by capability: `company.context`, `company.capability:pos`, `permission:sales.create`, etc. |
| Inertia sharing | Share only the user's accessible companies and the active company's capabilities/permissions. Never share another company's settings. |
| Reports | `ReportFilters` gains `companyId` (from context, not the request); a separate `consolidated` flag is allowed only with an org-level permission. |
| Exports | Same filters; file names include the company; share links are authorized by company. |
| Background jobs | Every job carries `company_id`; the job re-establishes context before querying. Never run a job with an implicit "all companies" scope. |
| Notifications | Include `company_id`; filter by context. |
| Audit logs | Add `company_id`; all lifecycle and financial events are attributed. |
| Cache | Key settings/permission caches by company; clear on company switch and settings update. |
| Backups | Keep installation-level backups; if company-level export is required, implement explicit scoped exports rather than ad-hoc SQL. |
| Tests | Every isolation test must attempt a cross-company read/write and assert 403/404 or empty results. |

### 18.3 Existing risks to fix before adding companies

1. Add server-side permission middleware and policies (currently absent).
2. Implement or remove the five missing `SettingsController` user-management methods.
3. Fix or disable public registration (`username` is NOT NULL).
4. Replace the mock frontend permission store with server-provided permissions, or clearly mark it as demo-only.
5. Add `company_id` to `audit_logs` and financial records.
6. Stop sharing the full Eloquent user; share a safe DTO.

### 18.4 Data isolation validation points

- Direct URL access to another company's sale/product/report.
- Crafted POST with a foreign `company_id`, `warehouse_id`, `customer_id`, or `product_id`.
- Report export with no company filter.
- Inertia page props containing another company's settings or lists.
- Background job triggered for company A writing to company B.
- Share/download links for report artifacts.
- Backup/restore exposing all companies.

---

## 19. Implementation Phases

### Phase 0 — Baseline and guardrails

- Full backup + off-box copy.
- Record financial/inventory invariants.
- Add isolation/compatibility tests that currently pass (documents the baseline).
- Do not change schema.

### Phase 1 — Organization / Company / Warehouse foundation

- Create `organizations`, `companies`, `warehouses`, `company_user`.
- Seed the default organization/company/warehouse for the existing installation.
- Introduce `CompanyContext` (request-scoped) and `ResolveCompanyContext` middleware.
- Add `organization_id`/`company_id`/`warehouse_id` as **nullable** columns (no reads/writes yet).
- Add capability flags to companies/warehouses.
- No behavior change; all existing queries still see one company.

### Phase 2 — Scoping layer (dual-read)

- Add `BelongsToCompany` global scope, disabled by default until backfill is complete.
- Backfill every business table with the default company/warehouse.
- Add `stock_balances` and backfill from `products.stock_quantity`.
- Change `SettingService` to resolve per company with a fallback; key cache by company.
- Add `document_sequences` and seed from current maxima.
- Run parity tests: old totals vs new scoped totals must match exactly.

### Phase 3 — Authorization and membership

- Implement company-scoped roles and policies.
- Add `can:` middleware to routes.
- Replace the mock frontend permission store with server-provided permissions.
- Fix the missing user-management methods (or remove the dead routes/pages).
- Fix/disable registration.
- Add company-scoped audit logging.

### Phase 4 — Company-aware operations

- `SaleService`, `PurchaseService`, `ReturnService`, `InventoryService`, `CashLedgerService`, `PartyBalance`: set company/warehouse from context; validate capabilities.
- Migrate legacy `SaleReturnService` / `PurchaseReturnService` writers to `InventoryService` or add warehouse-aware writes.
- Make stock mutations require a `warehouse_id`.
- Add stock transfers.
- Add company price overrides and assortment checks.

### Phase 5 — Company-aware reporting and exports

- `ReportFilters` gains `companyId` and `consolidated`.
- Scope every report service; add explicit consolidated modes with permission.
- Scope CSV/Excel/PDF exports and share artifacts.
- Scope dashboard and day book.

### Phase 6 — Frontend context

- Share `company`, `companies`, `capabilities`, `permissions` via Inertia.
- Add the company switcher to `Header` / mobile drawer.
- Hydrate `AuthContext` from server props.
- Hide modules by capability.
- Show active company name/branding.

### Phase 7 — Constraint hardening and rollout

- Make `company_id` NOT NULL on business-owned tables.
- Add composite unique indexes; drop old global uniques.
- Add compound indexes for `(company_id, date)`, `(warehouse_id, product_id)`, etc.
- Performance test with representative multi-company data.
- Roll out behind a feature flag / staged migration; keep the backup restore path ready.

---

## 20. Testing Requirements

### 20.1 Isolation tests

- User A (company A) cannot `GET /sales/{id}` for company B → 404/403.
- User A cannot create a sale with a company B product/customer.
- User A cannot view company B's reports, dashboard, contacts, products, or audit logs.
- User A cannot export company B's data.
- User A cannot switch to a company they are not a member of.
- A forged `company_id` in a POST body is ignored or rejected.
- A forged `warehouse_id` belonging to another company is rejected.
- Report share/download links enforce company ownership.

### 20.2 Authorization tests

- `salesman` cannot update settings.
- `cashier` cannot delete products/sales.
- Only org-level admins can view consolidated reports.
- Capability gates: warehouse cannot create a POS sale; company without `purchasing` cannot create a purchase.

### 20.3 Constraint tests

- Two companies can both create `INV-0001`.
- Same company cannot create duplicate invoice numbers.
- `event_key` is unique per company, not globally.
- Per-company document sequences increment independently.
- Composite unique indexes behave under concurrent inserts.

### 20.4 Migration/backfill tests

- Every existing row has a non-null default company/warehouse after backfill.
- `SUM(stock_balances.quantity)` equals the legacy `products.stock_quantity` per product.
- Sales totals, COGS, cash totals, and receivables are unchanged after scoping.
- No orphan rows (FK checks).
- Rollback restores the pre-migration state.

### 20.5 Inventory invariant tests

- Every stock mutation writes an `inventory_transactions` row with `warehouse_id`.
- `stock_balances` and `inventory_transactions.running_balance` agree per warehouse/product.
- Transfers preserve total organization stock.
- Returns restock only the originating company/warehouse.
- Negative-stock policy is evaluated per warehouse.

### 20.6 Report parity tests

- For the default company, every report equals the pre-migration baseline.
- Consolidated total equals the sum of company totals (for additive metrics).
- Date/category/search filters do not leak company data.

### 20.7 Background job tests

- Jobs carry and re-establish company context.
- A job for company A never touches company B.
- Scheduled backups/retention do not expose or delete another company's artifacts.

### 20.8 Performance tests

- Index usage for `(company_id, date)`, `(warehouse_id, product_id)`, `(company_id, invoice_number)`.
- Report query plans with multi-company volumes.
- Page loads with the company switcher and shared props.

---

## 21. Open Questions

1. **Shared vs company-owned master data:** Should customers/suppliers/patients be shared across companies, or can the same person exist separately per company? The answer determines whether `contacts` is org-owned or company-owned, and whether `contact_balances` is required.
2. **Warehouse ownership:** Are warehouses owned by the organization, by a company, or both? The recommendation allows both (`company_id` nullable), but the client must confirm.
3. **Company → warehouse relationship:** Can one company sell from multiple warehouses? Is there a default warehouse per company?
4. **Branches/outlets:** Is a "branch" concept required now, or can it be deferred? Option A assumes no branch layer.
5. **User roles:** Should a user have different roles per company? Should organization admins automatically have access to every company?
6. **Products:** Are products truly shared at organization level, or does each company need its own catalog? The audit strongly recommends org-level sharing.
7. **Pricing:** Can prices differ by company? By warehouse? Do you need effective-dated price lists?
8. **Categories:** Are product categories shared or company-specific?
9. **Tax/currency:** Can companies have different currencies, tax numbers, or fiscal years? This affects settings and reporting.
10. **Consolidated reporting:** Which reports must support organization-wide consolidation, and who may view them?
11. **Invoice numbering:** Per company, per warehouse, or per fiscal year? Does the existing numbering (`INV-YYMMDD-####`) need to be preserved?
12. **Historical data:** Should existing documents be assigned to the default company only, or split retroactively (not recommended)?
13. **Warehouse operations:** Do warehouses need purchasing/receiving workflows, or only stock holding and transfers?
14. **Transfers:** Do transfers require approval, in-transit status, and valuation at cost?
15. **Backups/exports:** Is installation-level backup acceptable, or is per-company export/restore a hard requirement?
16. **Identity:** Should one user account span companies (recommended), or should each company have isolated accounts?
17. **Data lifecycle:** On company deletion/archival, what happens to its products, stock, and historical documents?
18. **Clinic module:** Is the clinic a company capability, a separate company, or an organization-level service?

---

## 22. Exact Files and Tables Reviewed

### 22.1 Models

```
app/Models/AuditLog.php
app/Models/Backup.php
app/Models/Category.php
app/Models/Consultation.php
app/Models/Contact.php
app/Models/Expense.php
app/Models/ExpenseCategory.php
app/Models/FinancialTransaction.php
app/Models/InventoryTransaction.php
app/Models/Prescription.php
app/Models/PrescriptionImage.php
app/Models/PrescriptionItem.php
app/Models/Product.php
app/Models/ProductPackaging.php
app/Models/ProductUnit.php
app/Models/PurchaseBill.php
app/Models/PurchaseBillItem.php
app/Models/RestoreRun.php
app/Models/ReturnItem.php
app/Models/ReturnModel.php
app/Models/ReturnReason.php
app/Models/Sale.php
app/Models/SaleItem.php
app/Models/SellingUnit.php
app/Models/Setting.php
app/Models/User.php
```

### 22.2 Controllers and middleware

```
app/Http/Controllers/Auth/AuthenticatedSessionController.php
app/Http/Controllers/Auth/RegisteredUserController.php
app/Http/Controllers/ContactController.php
app/Http/Controllers/DashboardController.php
app/Http/Controllers/ExpenseController.php
app/Http/Controllers/InventoryController.php
app/Http/Controllers/ProductController.php
app/Http/Controllers/ProfileController.php
app/Http/Controllers/PurchaseController.php
app/Http/Controllers/ReportController.php
app/Http/Controllers/ReturnWorkflowController.php
app/Http/Controllers/SaleController.php
app/Http/Controllers/SettingsController.php
app/Http/Middleware/HandleInertiaRequests.php
bootstrap/app.php
```

### 22.3 Services and domain code

```
app/Services/BusinessContext.php
app/Services/Lifecycle/RecordLifecycleService.php
app/Domains/Backup/Services/BackupService.php
app/Domains/Backup/Services/DatabaseExporter.php
app/Domains/Clinic/Services/ClinicService.php
app/Domains/Contacts/Services/ContactService.php
app/Domains/Inventory/Services/CostResolver.php
app/Domains/Inventory/Services/InventoryService.php
app/Domains/Ledger/CashLedgerService.php
app/Domains/Ledger/PartyBalance.php
app/Domains/Ledger/PartyLedgerService.php
app/Domains/Payments/Services/PaymentService.php
app/Domains/Products/Services/ProductService.php
app/Domains/Purchasing/Services/PurchaseReturnService.php
app/Domains/Purchasing/Services/PurchaseService.php
app/Domains/Reports/DTOs/ReportFilters.php
app/Domains/Reports/Services/ContactReportService.php
app/Domains/Reports/Services/DashboardReportService.php
app/Domains/Reports/Services/DayBookReportService.php
app/Domains/Reports/Services/ExportService.php
app/Domains/Reports/Services/FinancialReportService.php
app/Domains/Reports/Services/InventoryReportService.php
app/Domains/Reports/Services/ProductReportService.php
app/Domains/Reports/Services/PurchaseReportService.php
app/Domains/Reports/Services/ReportService.php
app/Domains/Reports/Services/SalesReportService.php
app/Domains/Returns/Services/ReturnService.php
app/Domains/Sales/Services/SaleReturnService.php
app/Domains/Sales/Services/SaleService.php
app/Domains/Settings/DTOs/UpdateSettingsData.php
app/Domains/Settings/Services/SettingService.php
app/Domains/Users/Services/UserService.php
app/Policies/Lifecycle/PurchasePolicy.php
app/Policies/Lifecycle/SalePolicy.php
```

### 22.4 Routes, config, providers

```
routes/web.php
routes/auth.php
routes/console.php
config/permission.php
config/backup.php
app/Providers/AppServiceProvider.php
phpunit.xml
composer.json
package.json
vite.config.js
```

### 22.5 Frontend

```
resources/js/app.tsx
resources/js/data/dashboard.ts
resources/js/data/users.ts
resources/js/features/auth/AuthContext.tsx
resources/js/features/auth/PermissionGuard.tsx
resources/js/features/shared/use-flash-toasts.ts
resources/js/features/shared/use-lifecycle-action.ts
resources/js/layouts/AppLayout.tsx
resources/js/layouts/Sidebar.tsx
resources/js/layouts/Header.tsx
resources/js/layouts/BottomNav.tsx
resources/js/Pages/Auth/Login.tsx
resources/js/Pages/settings/Business.tsx
resources/js/Pages/settings/Permissions.tsx
resources/js/Pages/settings/UsersList.tsx
resources/js/types/index.d.ts
```

### 22.6 Migrations (all 51 read; key ones)

```
database/migrations/0001_01_01_000000_create_users_table.php
database/migrations/2026_07_25_194957_create_permission_tables.php
database/migrations/2026_07_25_204221_create_contacts_table.php
database/migrations/2026_07_25_204222_create_settings_table.php
database/migrations/2026_07_25_204224_create_product_categories_table.php
database/migrations/2026_07_25_204225_create_products_table.php
database/migrations/2026_07_25_204226_create_selling_units_table.php
database/migrations/2026_07_25_204227_create_sales_table.php
database/migrations/2026_07_25_204228_create_sale_items_table.php
database/migrations/2026_07_25_204229_create_purchase_bills_table.php
database/migrations/2026_07_25_204230_create_purchase_bill_items_table.php
database/migrations/2026_07_25_204231_create_expense_categories_table.php
database/migrations/2026_07_25_204232_create_expenses_table.php
database/migrations/2026_07_25_204233_create_inventory_transactions_table.php
database/migrations/2026_07_25_204234_create_financial_transactions_table.php
database/migrations/2026_07_25_212120_add_user_fields_to_users_table.php
database/migrations/2026_07_28_121124_create_product_units_table.php
database/migrations/2026_07_28_121131_create_product_packaging_table.php
database/migrations/2026_07_28_121132_add_packaging_id_to_selling_units_table.php
database/migrations/2026_07_28_141846_create_consultations_table.php
database/migrations/2026_07_28_141847_create_prescriptions_table.php
database/migrations/2026_07_28_141848_create_prescription_items_table.php
database/migrations/2026_07_28_141849_create_prescription_images_table.php
database/migrations/2026_07_29_155739_create_audit_logs_table.php
database/migrations/2026_07_30_180001_create_return_reasons_table.php
database/migrations/2026_07_30_180002_create_returns_table.php
database/migrations/2026_07_30_180003_create_return_items_table.php
database/migrations/2026_07_30_180004_add_return_fields_to_sales_and_purchases.php
database/migrations/2026_11_01_000001_add_cash_ledger_columns_to_financial_transactions.php
database/migrations/2026_11_01_000002_add_cost_columns_for_weighted_average.php
database/migrations/2026_11_01_000003_extend_inventory_transaction_types.php
database/migrations/2026_11_01_000004_add_return_lifecycle_columns.php
database/migrations/2026_11_01_000005_add_uncosted_qty_to_products.php
database/migrations/2026_11_01_000010_create_backups_table.php
database/migrations/2026_11_01_000011_create_restore_runs_table.php
```

### 22.7 Live tables inspected

```
audit_logs, backups, cache, cache_locks, consultations, contacts,
expense_categories, expenses, failed_jobs, financial_transactions,
inventory_transactions, job_batches, jobs, migrations, model_has_permissions,
model_has_roles, password_reset_tokens, permissions, prescription_images,
prescription_items, prescriptions, product_categories, product_packaging,
product_units, products, purchase_bill_items, purchase_bills, restore_runs,
return_items, return_reasons, returns, role_has_permissions, roles,
sale_items, sales, selling_units, sessions, settings, users
```

---

## Appendix A — Verification Notes and Limitations

### A.1 What was inspected

- All 51 migration files.
- All 26 models.
- Controllers, middleware, providers, routes, domain services, policies, seeders, factories, and tests listed above.
- Live `information_schema` for table names, columns, foreign keys, and unique indexes.
- Live row counts for the core tables.
- Inertia shared props and the React shell/auth context.

### A.2 Read-only guarantee

No application code, migrations, models, controllers, services, routes, permissions, frontend components, or database rows were modified. The only file created is this report.

### A.3 Limitations

- The repository working tree contains uncommitted changes (backup module, financial columns, render assets). The audit reflects the working tree as read, not the last commit.
- `graphify-out/graph.json` was built from commit `d0e397a`, which predates some current work; source files were used as ground truth where the graph was stale.
- The `grep` tool returned no matches in this environment; `findstr` and direct reads were used instead. No conclusions rely on the failed grep.
- The nested `Invenos/` directory is a separate Vite/React prototype repository (its own `.git` and `package.json`). It is **not** the served frontend; `vite.config.js` builds `resources/js/app.tsx`. It was excluded from the runtime analysis.
- The live database is a snapshot (`invenos_snapshot`) with 39 base tables. `php artisan db:show` reported a larger server-wide table count; the per-schema query confirmed 39 for this database.
- Some statements about registration failure are inferred: the controller omits `username`, and the live column is `NOT NULL UNIQUE` with no default. That combination is expected to fail, but the path was not executed (audit-only, and executing it would create data).

### A.4 Summary of evidence quality

| Area | Confidence | Basis |
| --- | --- | --- |
| No tenant model | **Certain** | Schema + models + code search |
| BusinessContext unused | **Certain** | Full-repo search |
| Global settings/cache | **Certain** | `SettingService` source + live row count |
| Stock is a single scalar | **Certain** | `products` schema + `InventoryService` |
| No location awareness | **Certain** | Schema + services |
| Global unique constraints | **Certain** | Live `information_schema.STATISTICS` |
| Permissions not enforced | **Certain** | Routes + controllers + middleware search |
| Missing SettingsController methods | **Certain** | Route definitions vs controller method list |
| Frontend auth is mock | **Certain** | `resources/js/data/users.ts` + `AuthContext.tsx` |
| Registration likely fails | **High (inferred)** | Controller + column constraints |
| Recommended target architecture | **Proposal** | Not implemented; based on the verified base |
