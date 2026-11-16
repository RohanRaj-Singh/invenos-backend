# P15 — Formula Cost Security & Workflow Implementation

**Date:** 2026-11-15 (system clock observed as 2026-11-16)
**Branch:** `feature/product-composition`
**Original HEAD:** `54f444be4616e6dfe6f405db07215d951f69b012` ("Composition final build")
**Status:** Implemented — P0 cost confidentiality, P0 historical-cost semantics, P1 atomic creation,
P1 formula detail drawer, P1 misleading purchase-cost field removed.

> **Verification honesty:** behaviour was verified by automated tests and TypeScript/Vite builds.
> **No browser or manual UI interaction was performed.** UI claims come from source and compile-time
> checks only; see §12.

---

## 1. Initial findings (P14 re-verified against code)

| # | Finding | Confirmed how |
|---|---|---|
| F1 | Composition API returned `unit_cost`, `line_cost`, `estimated_cost`, `cost_basis` to **salesmen**; only the UI hid them | `ProductCompositionPolicy::view` allows `['admin','salesman']`; resources emitted cost unconditionally; P14 probe returned `estimated_cost: 25` for a salesman |
| F3 | Version-history "Cost" recomputed with **current** ingredient prices, presented as history | `CompositionController::index` maps every version through `estimateComposition()` |
| F4 | Formula creation required save → redirect → builder | `ProductController::store` created only the product; composition was a second request |
| F5 | No formula detail view; ingredients truncated to 5 | `ProductCompositionPanel` `.slice(0, 5)`; no View action |
| F6 | "Your Cost (Rs.)" shown for formulas, writing `default_purchase_cost` | `ProductForm` rendered it unconditionally |

Permission conventions found: dotted snake (`products.composition.view`, `inventory.adjust_stock`),
`spatie/laravel-permission`, admin role receives `Permission::all()` at seed time, and
`ProductCompositionPolicy::allows()` falls back to a role list when no explicit permission exists.

Frontend note: `resources/js/features/auth/AuthContext.tsx` is backed by a **local mock**
(`@/data/users`), so it is not a reliable authorization source. Cost visibility is therefore driven
by a server-provided flag, not by that context.

---

## 2. Permission architecture used

New permission: **`products.composition.cost`** (follows the existing dotted convention).

```php
// ProductCompositionPolicy
public function cost(User $user): bool
{
    return $this->allows($user, 'products.composition.cost', ['admin']);
}
```

- Seeded in `DatabaseSeeder` alongside the two existing composition permissions.
- Admin is covered twice: `Permission::all()` at seed time, and the `['admin']` role fallback — so
  **existing databases do not need a re-seed for admins to keep seeing cost**.
- Salesmen do **not** get it by default. Granting it is a per-user/per-role decision.
- Inactive users are denied (`allows()` already returns false).

---

## 3. Cost confidentiality implementation

Cost is withheld **server-side**, in the resource, so no call site can forget it and no client can
recover it:

```php
$canViewCost = Gate::allows('cost', ProductComposition::class);
```

Withheld keys when unauthorised:

| Resource | Keys omitted |
|---|---|
| `ProductCompositionResource` | `estimated_cost`, `estimated_unit_cost`, `cost_basis`, `cost_complete`, `is_estimated` |
| `ProductCompositionItemResource` | `unit_cost`, `line_cost`, `cost_basis` |

Keys are **omitted, not nulled**, so an unauthorised client cannot distinguish "no cost recorded"
from "cost hidden". Derived metadata (cost basis) is withheld too, since it hints at pricing data.

Deliberately **kept**: quantities, units, wastage, `effective_quantity`, ingredient stock and the
negative-stock policy flag. Viewing and operating a formula never required cost.

`CompositionController::preview()` — whose entire payload is cost — now also authorizes `cost`, so a
viewer cannot bypass resource-level withholding through that endpoint (403).

---

## 4. API resource changes

| Endpoint | Behaviour |
|---|---|
| `GET .../compositions` (all versions) | Cost omitted for unauthorised |
| `GET .../composition?kind=` (active) | Cost omitted for unauthorised |
| `GET .../composition/{id}` | Cost omitted for unauthorised |
| `POST/PUT/DELETE .../composition` | Responses inherit the same resource withholding |
| `POST .../composition/preview` | **403** without the cost permission |
| `GET /inventory/product/{id}` (Inertia) | New `can_view_cost` prop, server-computed |

Frontend now consumes `can_view_cost` instead of `auth.user.role === 'admin'`. The mock permission
context was left untouched (out of scope) but is no longer the source of truth for cost.

TypeScript `ProductComposition`/`CompositionItem` cost fields were made optional to match reality;
`CompositionCostPreview` stayed required because that endpoint is gated entirely.

---

## 5. Formula creation workflow

`POST /inventory` now accepts an optional `composition` object. When present:

1. `products.create` is authorized (as before).
2. `manage` on `ProductComposition` is additionally authorized.
3. Inside **one** `DB::transaction`:
   - the product is created via `ProductService::create`;
   - the composition is mapped with the existing `CompositionPayloadMapper`;
   - `CompositionService::save` validates and stores version 1 (it opens its own nested
     transaction, which is a savepoint — correct and intentional).
4. Any composition failure rolls the product back. Verified by tests.
5. On success the user lands on the product's Formula tab.

Validation reuses `SaveCompositionRequest`'s rules, mirrored under `composition.*`:
`kind`, `name`, `output_quantity`, `output_unit_id`, `notes`, and `items.*` (component, quantity,
unit, wastage, optional, sort_order). All authoritative validation — duplicate components, cycles,
archived components, non-inventory components, unit compatibility — still runs in
`CompositionValidator`; nothing was weakened.

Backward compatibility preserved: `_stay`, `_setup_formula`, product-only creation, and all existing
composition endpoints behave as before. `POST /inventory` without `composition` is unchanged.

**UI**: the Add Formula screen now has an optional *Ingredients* section (existing `ComponentPicker`
+ quantity/unit/wastage rows, yield, notes). Leaving it empty preserves the old "build it on the
Formula tab" flow. `Save & Add Next` is suppressed when an inline formula is present, because the
user should land on the formula they just created.

---

## 6. Formula detail interface

New `resources/js/features/composition/FormulaDetailDrawer.tsx` — a read-only `Sheet` (the project's
established pattern, already used by the builder and picker).

It receives the composition the panel **already loaded**, so opening it issues no request and can
never display cost the server withheld.

Shows: formula name, product name/SKU/status, selling price, yield, version, active state, created
date + author, last updated, notes, and **every** ingredient (quantity, unit, wastage, optional flag,
per-line cost when permitted), plus total and per-unit estimated cost with a basis badge.

Actions: **View** (all users), **New version** and **Deactivate** (manage permission only). No
invented actions.

Entry points: a `View` button on each active formula card, and a `View` action on every version row
in the version history — so historical versions are inspectable without leaving the product page.

---

## 7. Formula purchase-cost field

`ProductForm` no longer renders "Your Cost (Rs.)" in formula mode; the selling price keeps the full
row. In its place: *"A formula has no purchase cost to enter — its cost is calculated from ingredient
prices and shown on the Formula tab."*

Data safety:
- On **create**, a formula sends `default_purchase_cost: null`, so a value typed before switching
  modes cannot become a formula cost.
- On **edit**, the existing value is preserved untouched — legacy data is never silently cleared.
- Physical-product behaviour is unchanged; the field is still rendered and submitted as before.

---

## 8. Files changed

**Backend**
- `app/Policies/ProductCompositionPolicy.php` — added `cost()`.
- `database/seeders/DatabaseSeeder.php` — seeds `products.composition.cost`.
- `app/Http/Resources/ProductCompositionResource.php` — withholds composition cost keys.
- `app/Http/Resources/ProductCompositionItemResource.php` — withholds item cost keys.
- `app/Http/Controllers/CompositionController.php` — `preview()` requires `cost`.
- `app/Http/Controllers/ProductController.php` — injects `CompositionPayloadMapper` +
  `CompositionService`; atomic create; `can_view_cost` prop.
- `app/Http/Requests/Products/CreateProductRequest.php` — optional `composition` validation.

**Frontend**
- `resources/js/features/composition/FormulaDetailDrawer.tsx` — **new**.
- `resources/js/features/composition/ProductCompositionPanel.tsx` — View actions, drawer wiring,
  "Current est. cost" column + explanation, product sku/status passthrough.
- `resources/js/features/composition/types.ts` — cost keys optional.
- `resources/js/Pages/inventory/ProductDetails.tsx` — uses server `can_view_cost`.
- `resources/js/Pages/inventory/components/ProductForm.tsx` — inline ingredients, formula cost field
  removal, payload composition, validation.

**Tests**
- `tests/Feature/Composition/CompositionCostConfidentialityTest.php` — **new**, 8 tests.
- `tests/Feature/Products/ProductFormulaCreationTest.php` — **new**, 8 tests.
- `tests/Feature/Composition/CompositionApiAuthorizationTest.php` — salesman preview now expected
  403 (intentional behaviour change).
- `tests/Feature/Composition/CompositionManufacturingTest.php` — removed a hardcoded date (see §10).

---

## 9. Tests executed

```text
php artisan test tests/Feature/Composition/CompositionCostConfidentialityTest.php
→ 8 passed (53 assertions)

php artisan test tests/Feature/Products/ProductFormulaCreationTest.php
→ 8 passed (23 assertions)

php artisan test tests/Feature/Composition/CompositionManufacturingTest.php
→ 16 passed (146 assertions)

php artisan test
→ 414 passed, 5 failed (1,748 assertions)

npm run build (tsc && vite)
→ passed

vendor/bin/pint --test <changed PHP files>
→ passed (after one auto-fix: import ordering in the new test)
```

### Coverage added

Cost confidentiality: admin receives cost; salesman receives none on active/composition/version
endpoints; nested item cost absent; no cost-looking key anywhere in the payload; preview 403;
server-driven `can_view_cost` prop; inactive user denied.

Atomic creation: product-only unchanged; product+formula created with version 1 active; yield/notes
persisted; invalid ingredient, empty items, archived ingredient and duplicate ingredient each roll
the product back; salesman denied.

---

## 10. Existing failures vs newly introduced

**Newly introduced by P15:** none. The full suite went from 9 failures to **5**, and the 5 remaining
are pre-existing.

**Remaining failures (5, all pre-existing):** `Tests\Feature\ProfileTest` — `/profile` returns 404
because that route/view was never implemented. Untouched.

**Two pre-existing issues surfaced during this phase:**

1. **Four Auth tests** (`verify-email`, `confirm-password`, 2 × `reset-password`) failed earlier in
   the phase because `public/build` did not contain those page bundles. After building and restoring
   the tracked `public/build`, they pass. Their pass/fail depends on build artifacts, not code — they
   are not P15 regressions.
2. **`CompositionManufacturingTest::test_component_usage_report_uses_production_snapshots`** began
   failing because it filters on a hardcoded `2026-11-15` while `production_orders.completed_at` is
   set from `now()` (the machine clock is now 2026-11-16). This was a time-bomb from an earlier
   phase, not caused by P15. Fixed minimally by deriving the window from `now()`; no behavioural
   assertion changed.

---

## 11. Manual QA checklist

**Not performed — no browser available.** Items for a human:

### Cost confidentiality
- [ ] Sign in as salesman; open a product's Formula tab — no cost badge, no cost column, no cost row.
- [ ] In the browser devtools, open the composition response — confirm the cost keys are absent.
- [ ] Confirm the salesman's formula still lists ingredients, quantities and wastage.
- [ ] Sign in as admin — cost badge, per-ingredient cost and version costs reappear.
- [ ] Grant a salesman `products.composition.cost`; confirm cost appears without other changes.

### Creation
- [ ] Add Formula → add two ingredients → Save: lands on the Formula tab with both ingredients.
- [ ] Add Formula → save with no ingredients: lands on the Formula tab with the empty state.
- [ ] Force a bad ingredient (archived) → Save: error shown, and the product does not exist.
- [ ] Create a physical product: "Your Cost" present and saved as before.

### Detail drawer
- [ ] View on an active formula: all ingredients listed (test with more than five).
- [ ] View on a historical version from the version table.
- [ ] Confirm the drawer shows the "current prices" explanation under cost.
- [ ] Non-manager sees View only; manager also sees New version / Deactivate.

### Formula cost field
- [ ] Add Formula: no "Your Cost" field, explanation visible.
- [ ] Edit an existing formula: its stored purchase cost is unchanged after saving.

---

## 12. Remaining limitations

1. **No browser verification.** Drawer ergonomics, mobile layout and focus behaviour are unverified.
2. **The frontend permission context is still a local mock.** Cost no longer depends on it, but other
   UI gates still do; replacing it wholesale was out of scope.
3. **Existing databases** keep admin access through the policy's role fallback; the new permission
   row appears only after re-seeding. Non-admin grants require the permission to exist first.
4. **Inline ingredients are create-only.** Editing an existing formula still uses the builder,
   deliberately (versioning lives there).
5. **Inline creation validation errors** surface as generic messages. `CompositionPayloadMapper`
   emits `items.N.*` keys, which are not re-prefixed to `composition.items.N.*`. Behaviour is correct
   (the request still fails and rolls back); only error-key precision is imperfect.
6. **No stored template cost.** Version rows show *current* cost, now labelled as such. Historical
   template snapshots remain unimplemented by design (explicitly out of scope).
7. **POS cost preview** (P14 P2) was not implemented — this phase stayed within P0/P1.

---

## 13. Git safety

- **Original branch:** `feature/product-composition` (confirmed before any edit)
- **Original HEAD:** `54f444be4616e6dfe6f405db07215d951f69b012`
- **Final HEAD:** `54f444be4616e6dfe6f405db07215d951f69b012` (no commit)
- No branch switch, reset, clean, stash, merge, rebase, cherry-pick or history rewrite.
- No pre-existing work discarded. Two P14 documentation files were present before this phase and are
  preserved unchanged.
- `fashion` worktree untouched (`variation/clothing-erp` @ `d0ff43e`).
- `public/build` restored to its tracked state after the build check.
