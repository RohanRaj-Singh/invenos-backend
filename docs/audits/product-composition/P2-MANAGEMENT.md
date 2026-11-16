# P2 — Product Composition Management

**Date:** 2026-11-15
**Branch:** `feature/product-composition`
**Status:** Implemented. Template management only; no consumption or manufacturing execution.

---

## 1. Scope

P2 adds:

- composition management API;
- server-enforced composition authorization;
- server-side component search;
- canonical unit options and display-to-base conversion;
- estimated cost preview;
- formula builder on the product detail page;
- version history and deactivation.

P2 does **not** deduct stock, expand POS cart lines, create sale items for components,
produce finished goods, or create returns/reports for consumed materials.

---

## 2. API endpoints

All endpoints are inside the authenticated web group and return JSON when the request expects JSON.

| Method | Path | Purpose |
|---|---|---|
| GET | `/inventory/product/{product}/compositions` | All composition versions with cost |
| GET | `/inventory/product/{product}/composition?kind=assembly\|consumption` | Active version for a kind, or `null` |
| GET | `/inventory/product/{product}/composition/{composition}` | Specific version |
| POST | `/inventory/product/{product}/composition` | Create a new version (201) |
| PUT | `/inventory/product/{product}/composition/{composition}` | Create a new active version from a prior one |
| DELETE | `/inventory/product/{product}/composition/{composition}` | Deactivate a version |
| POST | `/inventory/product/{product}/composition/preview` | Estimated cost preview; no writes |
| GET | `/inventory/composition/components?search=&exclude_product_id=&per_page=` | Server-side component search |
| GET | `/inventory/composition/units?component_product_id=` | Canonical compatible units and factors |

Route model binding is used for `{product}` and `{composition}`. Every nested composition
request verifies `composition.product_id === product.id` and returns 404 otherwise.

### Request payload (create/update/preview)

```json
{
  "kind": "consumption",
  "name": "Facial treatment",
  "output_quantity": 1,
  "output_unit_id": "piece",
  "notes": "Optional",
  "items": [
    {
      "component_product_id": 12,
      "quantity": 5,
      "unit_id": "ml",
      "wastage_pct": 0,
      "is_optional": false,
      "sort_order": 0
    }
  ]
}
```

`quantity` is in the submitted display unit. The server converts it to the component's base
unit; clients cannot submit `quantity_base` or costs.

### Composition response shape

```json
{
  "data": {
    "id": 1,
    "product_id": 10,
    "kind": "consumption",
    "version": 2,
    "is_active": true,
    "output_quantity": 1,
    "output_unit_id": "piece",
    "output_unit_name": "Piece",
    "component_count": 2,
    "items": [
      {
        "component_product_id": 12,
        "component": {
          "id": 12,
          "name": "Serum",
          "sku": "SER-1",
          "barcode": null,
          "base_unit_id": "ml",
          "base_unit_name": "Millilitre (ml)",
          "stock_quantity": 100,
          "status": "in-stock",
          "archived": false,
          "unit_options": [
            { "id": "ml", "label": "Millilitre (ml)", "factor": 1, "is_base": true },
            { "id": "liter", "label": "Litre (L)", "factor": 1000, "is_base": false }
          ]
        },
        "quantity_base": 5,
        "display_unit_id": "ml",
        "display_unit_name": "Millilitre (ml)",
        "display_quantity": 5,
        "wastage_pct": 0,
        "effective_quantity": 5,
        "unit_cost": 2.5,
        "line_cost": 12.5,
        "cost_basis": "exact",
        "nested": false
      }
    ],
    "estimated_cost": 12.5,
    "estimated_unit_cost": 12.5,
    "cost_basis": "exact",
    "cost_complete": true,
    "is_estimated": false
  }
}
```

---

## 3. Authorization

`ProductCompositionPolicy` is enforced at every endpoint:

| Action | Admin | Salesman | Inactive user |
|---|---|---|---|
| View compositions/search/units/preview | Yes | Yes | No |
| Create/update/deactivate | Yes | No | No |

- `view` and `manage` are checked in `CompositionController`.
- `ProductCompositionPolicy` is registered with `Gate::policy()`.
- Permissions `products.composition.view` and `products.composition.manage` are seeded.
- Requests that fail policy checks return 403.
- Guest JSON requests return 401 because `bootstrap/app.php` now renders JSON whenever
  `$request->expectsJson()` (not just `api/*`).
- The branch is single-tenant; no company isolation columns were added.

---

## 4. Versioning

- `CompositionService::save()` creates `max(version)+1` per `(product_id, kind)`.
- The previous active version is set `is_active=false`; it is never deleted.
- Historical items remain unchanged.
- `update()` delegates to versioned `save()` and rejects changing product/kind.
- The product row is locked inside the transaction.
- Unique `(product_id, kind, version)` is the final concurrent guard.
- Deactivation preserves all versions and any `composition_runs` that reference them.

---

## 5. Unit conversion

- API accepts `quantity` + `unit_id`.
- `ProductUnitService::convert()` reuses the existing measurement factors.
- Canonical ids are returned by `getCompositionUnitOptions()`:
  `g`, `kg`, `mg`, `ml`, `liter`, `cm`, `meter`, and count units.
- Legacy POS synthetic aliases (`__custom_gram`, `__custom_kg`, etc.) are mapped to canonical
  ids; persisted composition lines use canonical ids only.
- `quantity_base` remains authoritative in storage.
- Incompatible dimensions and unknown units are rejected before persistence.
- No rounding is applied to stored base quantities; display quantities are derived.

Factor semantics: `factor` is the number of base units per display unit. For a `kg` base,
`g` has factor `0.001` and `kg` has factor `1`.

---

## 6. Cost preview

`CompositionCostCalculator`:

- uses `CostResolver` for component unit cost/basis;
- applies wastage to the effective quantity;
- converts output quantity to the product base unit;
- recurses into an active nested composition only when the component has no reliable cost;
- guards against cost cycles;
- returns per-line and total/unit cost, `cost_basis`, `complete`, and `is_estimated`;
- never writes inventory, purchase, sale, run, or composition rows.

The preview is explicitly an estimate. Actual execution cost belongs to P5.

---

## 7. Frontend

### Integration

- `ProductDetails.tsx` adds a **Formula** tab.
- The tab renders `ProductCompositionPanel`.
- Admin sees create/edit/deactivate actions; salesman sees read-only data.
- Archived products are read-only.

### Panel

- Active composition cards show kind, version, output, component count, estimated cost,
  cost basis, component preview, and active status.
- A version history table shows all versions and their active/inactive state.
- Deactivation requires confirmation and reloads the composition list.
- Empty/loading/error states and a retry action are implemented.

### Builder

- Right-side `Sheet`, full-width on mobile.
- Header: kind, optional name, output quantity/unit, notes.
- Component rows: product, SKU, quantity, compatible unit, base quantity, wastage, estimated line
  cost, remove action.
- `ComponentPicker` performs debounced server-side search and excludes the parent and already
  selected components.
- `Preview cost` calls the server preview; the result is displayed per row and as a total.
- Save creates or versions the composition.
- Unsaved changes are protected with `beforeunload` and a close confirmation.
- Errors are surfaced from server validation.

No stock quantity, cost, or inventory movement is submitted by the client.

---

## 8. Validation

`SaveCompositionRequest` enforces shape, types, positive quantities, unit ids and wastage range.
`CompositionValidator` remains authoritative and additionally enforces:

- valid kind and active parent product;
- at least one component;
- valid/active/inventory-tracked components;
- no self-reference or duplicate components;
- unit compatibility;
- positive output/component quantities;
- wastage 0–100;
- no cycles and maximum depth 20;
- output unit compatibility.

Invalid requests return 422 JSON.

---

## 9. Tests

Commands and results:

```text
php artisan test tests/Feature/Composition tests/Feature/Security/CompositionAuthorizationTest.php
```

```text
58 passed (201 assertions)
```

P2 API subset:

```text
php artisan test tests/Feature/Composition/CompositionApiTest.php \
  tests/Feature/Composition/CompositionApiAuthorizationTest.php \
  tests/Feature/Composition/CompositionComponentApiTest.php
```

```text
13 passed (91 assertions)
```

Full suite:

```text
250 passed, 9 failed (834 assertions)
```

The 9 failures are the pre-existing missing Auth/Profile UI tests documented in
`P0.1-FINALIZATION.md`.

Frontend:

```text
npm run build
```

Passed (TypeScript + Vite). Generated `public/build` artifacts were reverted after verification
to avoid committing a large hash churn; rebuild before deployment.

---

## 10. Known limitations

- The builder exposes wastage and quantity, but not a dedicated optional-component toggle.
- Version history is read-only; there is no "restore historical version" action.
- Cost preview uses current costs; it is not a historical execution cost.
- Nested cost preview is best-effort and reports `unavailable` when any line cannot be costed.
- Composition API is mounted under `/inventory` and relies on JSON `Accept` headers; it is not a
  versioned public API.
- No browser E2E test suite exists; frontend verification is TypeScript/Vite build plus API
  contract tests.
- `SettingsController` user-management methods remain incomplete from P0.1.
- Ledger precision and consumption execution remain P3 concerns.
- Archived components remain visible in history but cannot be selected for new formulas.

---

## 11. Deferred work

| Item | Phase |
|---|---|
| POS consumption editor, cart expansion, sale-time inventory deduction | P4 |
| Component stock deduction / run execution | P3 |
| Production/manufacturing runs and stock output | P7 |
| Cost roll-up into finished goods / sale COGS | P5 |
| Returns/reversal of consumed materials | P6 |
| Composition usage and manufacturing reports | P7 |
| Company/organization scoping | P8 |
| Optional-component UI toggle and historical version restore | later P2 extension |

---

## 12. Deviations from FULL-AUDIT.md

| Item | Deviation | Justification |
|---|---|---|
| API placement | Under `/inventory`, returns JSON when `expectsJson()` | Keeps the existing product route surface; no `/api` route layer exists in this app |
| `bootstrap/app.php` | JSON rendering now respects `$request->expectsJson()` in addition to `api/*` | Required for 422/401 JSON responses on the composition API; Inertia requests remain non-JSON |
| Unit option IDs | Canonical ids instead of POS `__custom_*` aliases | P1 validation persists canonical units; aliases are POS presentation ids |
| Run execution | Schema/model only | P3 scope |
| Company scoping | No columns | Clinic branch is intentionally single-tenant |
| Optional toggle | Not exposed in P2 UI | Optional stored by API/domain; UI toggle deferred |
