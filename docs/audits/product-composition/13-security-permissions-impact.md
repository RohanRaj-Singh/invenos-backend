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
