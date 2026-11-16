# P1 — Product Composition Schema & Domain Foundation

**Date:** 2026-11-15
**Branch:** `feature/product-composition`
**Phase:** P1 only. No formula UI, POS consumption, cart expansion, manufacturing or reports.

---

## 1. Scope

P1 establishes the persisted composition model, its domain validation, its management service,
its authorization policy, and the execution-record schema needed by later phases.

Explicitly **not** implemented:

- formula builder UI or product-detail tab;
- HTTP composition endpoints (P2);
- POS consumption or cart expansion (P4);
- component stock deduction (P3/P4);
- manufacturing/production execution (P7);
- return/reversal of consumed components (P6);
- composition reports (P7).

---

## 2. Final schema

### 2.1 `product_compositions` — reusable template header

| Column | Type | Notes |
|---|---|---|
| `id` | bigint PK | |
| `product_id` | FK `products` | `restrictOnDelete`; composition owner |
| `kind` | enum(`assembly`,`consumption`) | |
| `version` | unsigned int | starts at 1; each save creates a new version |
| `name` | varchar(255) nullable | |
| `output_quantity` | decimal(14,6) | default 1 |
| `output_unit_id` | varchar(50) nullable | defaults to product base unit in the service |
| `is_active` | boolean | default true; deactivation is the archive mechanism |
| `notes` | text nullable | |
| `created_by` | varchar(255) nullable | |
| `created_at`, `updated_at` | timestamps | |

Indexes/constraints:

- unique `(product_id, kind, version)`;
- index `(product_id, is_active)`.

### 2.2 `product_composition_items` — template lines

| Column | Type | Notes |
|---|---|---|
| `id` | bigint PK | |
| `composition_id` | FK `product_compositions` | `cascadeOnDelete` |
| `component_product_id` | FK `products` | `restrictOnDelete` |
| `quantity_base` | decimal(14,6) | quantity in the component's base unit |
| `display_unit_id` | varchar(50) nullable | presentation/conversion unit |
| `wastage_pct` | decimal(6,3) | default 0; 0–100 |
| `is_optional` | boolean | default false |
| `sort_order` | unsigned int | default 0 |
| `created_at`, `updated_at` | timestamps | |

Indexes/constraints:

- unique `(composition_id, component_product_id)` named `pci_composition_component_unique`;
- index `component_product_id`.

### 2.3 `composition_runs` — execution header (schema only)

| Column | Type | Notes |
|---|---|---|
| `id` | bigint PK | |
| `run_number` | varchar(50) unique | |
| `composition_id` | FK `product_compositions` | `restrictOnDelete` |
| `product_id` | FK `products` | `restrictOnDelete` |
| `kind` | enum(`assembly`,`consumption`) | |
| `source_type`, `source_id` | varchar(50) nullable, bigint nullable | sale/consultation/manual link |
| `template_version` | unsigned int | version used |
| `template_snapshot` | json nullable | immutable recipe snapshot |
| `quantity` | decimal(14,6) | commercial quantity |
| `output_quantity` | decimal(14,6) nullable | produced quantity |
| `total_cost`, `unit_cost` | decimal(14,6) nullable | |
| `status` | enum(`pending`,`completed`,`reversed`) | default pending |
| `effects_applied_at` | timestamp nullable | |
| `created_by` | varchar(255) nullable | |
| timestamps | | |

Indexes: `(source_type, source_id)`, `product_id`.

No service creates runs in P1. Execution is P3.

### 2.4 `composition_run_items` — execution snapshot lines (schema only)

| Column | Type | Notes |
|---|---|---|
| `id` | bigint PK | |
| `composition_run_id` | FK `composition_runs` | `cascadeOnDelete` |
| `component_product_id` | FK `products` | `restrictOnDelete` |
| `unit` | varchar(50) | component base unit at execution |
| `template_quantity` | decimal(14,6) | |
| `actual_quantity` | decimal(14,6) | |
| `unit_cost`, `total_cost` | decimal(14,6) nullable | |
| `inventory_transaction_id` | FK `inventory_transactions` nullable | `restrictOnDelete`; filled in P3 |
| timestamps | | |

Indexes/constraints:

- unique `(composition_run_id, component_product_id)` named `cri_run_component_unique`;
- index `component_product_id`.

---

## 3. Entity relationships

```text
Product
  ├── hasMany ProductComposition
  ├── hasMany ProductCompositionItem (as component)
  ├── hasMany CompositionRun
  └── hasMany CompositionRunItem (as component)

ProductComposition
  ├── belongsTo Product
  ├── hasMany ProductCompositionItem
  └── hasMany CompositionRun

CompositionRun
  ├── belongsTo ProductComposition
  ├── belongsTo Product
  └── hasMany CompositionRunItem

CompositionRunItem
  ├── belongsTo CompositionRun
  ├── belongsTo Product (component)
  └── belongsTo InventoryTransaction (optional, P3)
```

Composition presence is derived from an active `product_compositions` row. `products.product_type`
was not changed and still has no behavior.

---

## 4. Migration decisions

| Decision | Implementation |
|---|---|
| Additive only | Four new tables; no existing table altered |
| Fresh database | Migrations run in order after the P0 idempotency migration |
| Existing database | No backfill; existing products remain simple |
| Company scoping | None; this branch is single-tenant (`BusinessContext` is hardcoded) |
| Product type | Not changed; no `product_type` writer |
| Template deletion | `is_active=false` (deactivate); rows are retained |
| Component deletion | `restrictOnDelete`; product lifecycle policy blocks deletion when used |
| History | Run tables store `template_version` and `template_snapshot`; templates are versioned |
| Precision | `decimal(14,6)` for quantities and costs; `decimal(6,3)` for wastage |
| Index names | Explicitly shortened for MySQL's 64-character identifier limit |

The first migration attempt failed on the auto-generated `product_composition_items` unique index
name. The empty partial table was dropped locally, explicit index names were added, and the
migrations then completed cleanly.

---

## 5. Organization / company isolation

The clinic branch has no companies or organizations. `App\Services\BusinessContext` hardcodes a
single business, and no `company_id`/`organization_id` column exists in the composition tables.
Cross-company references are therefore impossible by construction on this branch.

This is deliberate and audit-supported. Composition tables are kept product-only so they remain
portable to the fashion branch, where company scoping is applied separately.

---

## 6. Validation rules

Server-authoritative, implemented in `CompositionValidator`:

1. `kind` must be `assembly` or `consumption`.
2. Parent product must exist, not archived, not soft-deleted.
3. `output_quantity` must be > 0.
4. A composition must contain at least one component.
5. `output_unit_id`, when supplied, must be a known unit compatible with the parent product base unit.
6. Each component must exist, not archived, not soft-deleted.
7. A component must have `track_inventory = true`.
8. A component cannot be the parent product.
9. Duplicate component rows are rejected.
10. `quantity_base` must be > 0.
11. `wastage_pct` must be between 0 and 100.
12. `sort_order` cannot be negative when supplied.
13. `display_unit_id`, when supplied, must be known and compatible with the component base unit.
14. Cycles are rejected by traversing active compositions plus the proposed edges.
15. Nesting deeper than 20 levels is rejected.
16. Nested (acyclic) compositions are allowed.

Validation runs before any database write. Invalid input therefore cannot leave a partial
composition, items, or version change.

---

## 7. Domain service architecture

### `CompositionService`

| Method | Behavior |
|---|---|
| `getActive(productId, kind)` | Active version with items/components |
| `getForProduct(productId)` | All active definitions (both kinds) |
| `find(id)` | Any version with items/components |
| `save(SaveCompositionData, createdBy)` | Validates, versions, deactivates previous active, creates header + items |
| `update(ProductComposition, SaveCompositionData, createdBy)` | Rejects product/kind changes; delegates to `save()` |
| `deactivate(id)` | Sets `is_active=false`; no stock effect |

`save()` uses a database transaction and locks the parent product row. Version numbers are
monotonic per `(product_id, kind)`. The previous active version remains queryable but inactive.

### `CompositionValidator`

- Field/relationship validation.
- Unit compatibility through `ProductUnitService`.
- Cycle and depth detection through active composition edges.
- Throws `ValidationException` with a field-specific message.

### DTOs

- `CompositionItemData`
- `SaveCompositionData`

The DTOs are typed inputs; no client-controlled composition id is accepted on create.

---

## 8. Transaction boundaries

| Operation | Transaction | Inventory effect |
|---|---|---|
| `CompositionService::save` | Yes | None |
| `CompositionService::update` | Yes (via `save`) | None |
| `CompositionService::deactivate` | Yes | None |
| `CompositionService::get*`/`find` | Read-only | None |

No `InventoryService` call is made by any P1 service. No ledger rows or product stock changes
occur when templates are created, updated or deactivated.

---

## 9. Authorization

Added `ProductCompositionPolicy`:

| Ability | Admin | Salesman | Permission fallback |
|---|---|---|---|
| `view` | Yes | Yes | `products.composition.view` |
| `manage` | Yes | No | `products.composition.manage` |

Inactive users are denied. The policy is registered with `Gate::policy()` in
`AppServiceProvider`. Permissions were added to `DatabaseSeeder`.

P1 has no HTTP routes. P2 will call `$this->authorize('view'|'manage', ProductComposition::class)`
in the composition controller. The policy is tested at the gate level now so P2 cannot rely on
frontend visibility.

---

## 10. Inventory isolation

Verified by tests:

- creating, updating and deactivating a composition leaves `products.stock_quantity` unchanged;
- no `inventory_transactions` rows are created;
- no `consumption` movements are created;
- no `composition_runs` are created by template management;
- product deletion is blocked when the product owns a composition or is used as a component.

`InventoryService::recordConsumption()` remains the P3 execution path; P1 does not call it.

---

## 11. Tests

| File | Coverage |
|---|---|
| `CompositionSchemaTest` | tables/columns, existing data, single-tenant schema, unique component, FK, precision, run snapshot relationships |
| `CompositionServiceTest` | create/version/update, deactivate, inventory isolation, product deletion blocker, active lookups |
| `CompositionValidationTest` | unknown/self/duplicate component, quantity, units, archived/deleted/non-inventory component, cycle, nested, empty, output quantity/unit, wastage, archived parent |
| `CompositionAuthorizationTest` | admin/salesman/inactive policy decisions |
| `ProductLifecycleTest` | updated blocker includes composition usage |

Result: **38 passed (118 assertions)** for the P1-focused run.

---

## 12. Deferred functionality

| Item | Deferred to |
|---|---|
| Composition HTTP controller/routes, product-detail props | P2 |
| Formula builder UI | P2 |
| Component search endpoint | P2 |
| Consumption execution and run creation | P3 |
| Cost roll-up and COGS | P5 |
| POS consumption editor | P4 |
| Returns/reversal of consumed materials | P6 |
| Composition/manufacturing reports | P7 |
| Company scoping / fashion port | P8 |
| Ledger precision widening | P3, if fractional consumption requires it |
| `inventory_transactions.composition_run_id` | P3, if traceability requires it |

---

## 13. Known risks

- `ProductPolicy::deleteBlocker()` now queries composition and run tables; production must run
  migrations before serving requests.
- Version creation locks the parent product row but not a unique gap; concurrent first saves for
  the same product are serialized by the product lock. The unique `(product, kind, version)`
  constraint remains the final guard.
- Cycle detection traverses all active kinds for a product; this is intentionally conservative.
- `display_unit_id` is validated for compatibility but `quantity_base` is still authoritative.
  API/UI conversion is P2's responsibility.
- No HTTP layer means authorization is policy-tested but not yet request-enforced.
- No run executor exists; run tables are empty until P3.
- The branch remains single-tenant; fashion company scoping is not applied here.

---

## 14. Deviations from the audit

| Audit item | Deviation | Reason |
|---|---|---|
| Auto-generated index names | Explicit short names (`pci_composition_component_unique`, `cri_run_component_unique`) | MySQL 64-character identifier limit |
| `company_id` | Not added | Clinic branch is single-tenant; audit explicitly says not to add it |
| `inventory_transactions.composition_run_id` | Not added yet | P3 execution concern; P1 avoids altering the ledger |
| Composition HTTP API | Not implemented | P2 scope |
| Run execution service | Not implemented | P3 scope; run tables exist as schema foundation |
| Product `product_type` | Untouched | Audit recommends deriving composition from table presence |

---

## 15. Definition of done

- Four additive tables created and migrated successfully.
- Models and relationships implemented.
- Validated, versioned template management implemented.
- No inventory movements from template management.
- Cycles, units, archived components and duplicate lines rejected server-side.
- Policy and permission foundation implemented and tested.
- Full P1 test suite passes.
- No P2+ functionality implemented.

---

## 16. Final verification

| Check | Result |
|---|---|
| P1-focused tests | 38 passed (118 assertions) |
| Full suite | 225 passed, 9 failed (715 assertions) |
| Remaining failures | The 9 pre-existing missing Auth/Profile UI tests documented in `P0.1-FINALIZATION.md` |
| Pint (`--test`, 28 P0.1/P1 files) | Pass |
| `php -l` changed PHP files | Pass |
| `git diff --check` | Pass |
| Fresh migrations | Exercised by `RefreshDatabase` in the composition tests |
| Local database migration | Applied (`product_compositions`, `product_composition_items`, `composition_runs`, `composition_run_items`) |
| Inventory isolation | Verified by `CompositionServiceTest` and `CompositionSchemaTest` |
| P2+ scope | Not implemented |
