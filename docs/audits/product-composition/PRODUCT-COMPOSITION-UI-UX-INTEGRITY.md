# Product Composition — UI/UX Integrity, Cleanup & Finalization

**Date:** 2026-11-15 (system clock observed 2026-11-16)
**Branch:** `feature/product-composition`
**HEAD:** `54f444be4616e6dfe6f405db07215d951f69b012` (no commit)
**Scope:** frontend integrity across the whole Product Composition / Formula lifecycle, with the
smallest backend corrections where a frontend defect was actually an API-contract defect.

> **Verification honesty.** Findings come from reading routes, controllers, requests, resources,
> services and React components, and from HTTP-level tests. **No browser interaction was performed**
> — no visual, responsive or keyboard behaviour was clicked through. Items that would need a browser
> are listed as pending in §9 and §13.

---

## 1. Original audit findings

### P0 / P1 — verified defects (fixed)

| # | Severity | Finding | Evidence | Resolution |
|---|---|---|---|---|
| F1 | **P1** | **Ingredient search was completely broken on the Add Formula screen.** The form passes `excludeProductId={0}` (it has no product id yet); the picker forwarded `exclude_product_id=0`, which failed the `exists:products,id` rule, so every search returned 422 and the UI showed "Could not search ingredients. Try again." | Probe: `?exclude_product_id=0` → **422**, omitted → 200 | Normalise non-positive values to `null` in `ComponentSearchRequest::prepareForValidation()`; the picker now omits the parameter unless it is a real id |
| F2 | **P1** | **Sale detail and print exposed internal cost** to every authenticated user. `saleForDisplay()` returned `$sale->toArray()`, which includes `sale_items.cost_price`, `cost_complete` and `uncosted_quantity`. P15 gated the *composition* endpoints but not this one. | Probe as salesman: payload contained `cost_price: 40.0` | Strip those three fields for viewers without `products.composition.cost`; also gate the per-run `cost_basis` |
| F3 | **P1** | **Return detail exposed recovery and ingredient cost** to every authenticated user. `component_recoveries.unit_cost` / `total_cost`, the `inventoryTransaction.unit_cost`, and the loaded `component` product's `average_cost` / `opening_cost` / `last_purchase_cost` / `default_purchase_cost` all reached the browser. | Source: `ReturnWorkflowController::show` loaded `componentRecoveries.component` and returned the model | Recursive cost-key strip for viewers without the permission, plus a server `can_view_cost` prop and a conditional cost column in the page |

### P2 — usability improvement (implemented)

| # | Finding | Resolution |
|---|---|---|
| F4 | The formula detail pricing section showed a bare amount ("Rs. 500"), with no indication of *what* the price is per. | `CompositionPricingService` now returns `selling_unit_name`; the drawer reads "Rs. 500 per Formula" for both current and recommended price |

### Verified as already correct (no change)

| Area | Check |
|---|---|
| Formula stock illusion | `ProductTable`/`ProductCardView` show "Not stocked"; `ProductDetails` hides the stock-movement tab and disables Adjust Stock for consumption-only products |
| Composition cost gating | `estimated_cost`, `estimated_unit_cost`, `cost_basis`, `cost_complete`, `is_estimated`, `unit_cost`, `line_cost` are omitted server-side without `products.composition.cost`; `pricing` rides inside that same block |
| Cost-only endpoints | `composition/preview` and `composition/cost-preview` authorise `cost` (403 otherwise) |
| POS capability gating | `SaleController::create` shares a server-computed `can_view_cost`; the dialog only requests a preview when true; the cart sends no cost for unauthorised users |
| Cart profitability | Computed from the stored per-formula cost × quantity vs the line's net total — **no per-row requests** |
| Ingredient Usage | Titled "Ingredient Usage", subtitled as actual consumption net of recovery |
| Formula builder | Rendered only with `products.composition.manage`; per-line and total cost come from the server preview |
| Pricing terminology | Margin vs markup is stated explicitly in the settings page and the dialog copy; recommendation is advisory and never auto-applied |

### P3 — noted, not changed

| # | Item | Reason |
|---|---|---|
| F5 | Formula-view empty state says "No products found matching your filters" | Cosmetic wording; changing it needs a prop threaded through a shared table component |
| F6 | `sales.allow_price_override` remains a dead setting (P16 finding) | Outside this task's composition scope |
| F7 | `ReturnWorkflowController::show` has no per-record authorisation | Pre-existing; every authenticated user can open any return. Recorded rather than changed, since altering return access policy is a business decision |

---

## 2. Implemented corrections

### F1 — ingredient search

```php
// ComponentSearchRequest::prepareForValidation()
$exclude = $this->input('exclude_product_id');
if ($exclude !== null && (! is_numeric($exclude) || (int) $exclude <= 0)) {
    $this->merge(['exclude_product_id' => null]);
}
```

The rule was also tightened to `min:1` so a malformed value fails with a clear message instead of an
`exists` error. The client (`api.ts`) now only sends `exclude_product_id` when it is greater than 0,
and `ComponentPicker`'s prop became optional.

### F2 — sale cost redaction

```php
$canViewCost = Gate::allows('cost', ProductComposition::class);

if (! $canViewCost) {
    $data['items'] = array_map(function (array $item) {
        unset($item['cost_price'], $item['cost_complete'], $item['uncosted_quantity']);
        return $item;
    }, $data['items'] ?? []);
}
// per-run item 'cost_basis' emitted only when $canViewCost
```

Applies to both `sales.show` and `sales.print` (shared helper).

### F3 — return cost redaction

`ReturnWorkflowController` strips a listed set of cost keys **recursively** across the whole return
payload (items, recoveries, nested component and inventory transaction) and shares `can_view_cost`.
`SaleReturnDetail` hides the entire Cost column when false and uses loose null checks so an omitted
key renders as "—" rather than a fabricated value.

### F4 — selling unit in pricing

`selling_unit_name` added to the pricing payload (additive); the drawer renders
"Rs. 500 per Formula" / "Rs. 1,000 per Formula".

---

## 3. Remaining issues

- **Browser QA not performed** (§9). Nothing in this report claims rendered behaviour.
- **No frontend test runner** exists in the project, so component behaviour is covered only through
  its server contract.
- **Report-level cost visibility** follows `reports.view` rather than the composition cost
  permission. A salesman able to open reports can see cost there. Out of this task's scope, but it is
  the same class of issue as F2/F3 and should be decided deliberately.
- **Return detail has no record-level authorisation** (F7).

---

## 4. Deferred improvements

1. Formula-view empty state wording (F5).
2. Per-record authorisation on `returns.show` (F7) — needs a policy decision.
3. Aligning report cost visibility with `products.composition.cost`.
4. Replacing the mock settings/permission frontend contexts (pre-existing; P15 already bypassed them
   for cost).
5. Browser verification of the whole flow.

---

## 5. Files / components changed

**Backend**
- `app/Http/Requests/Composition/ComponentSearchRequest.php` — treat non-positive filters as absent;
  `min:1` on `exclude_product_id`.
- `app/Http/Controllers/SaleController.php` — strip line cost for unauthorised viewers; gate run
  `cost_basis`.
- `app/Http/Controllers/ReturnWorkflowController.php` — recursive cost-key strip; `can_view_cost`
  prop.
- `app/Domains/Composition/Services/CompositionPricingService.php` — `selling_unit_name`.

**Frontend**
- `resources/js/features/composition/api.ts` — omit `exclude_product_id` unless positive.
- `resources/js/features/composition/ComponentPicker.tsx` — optional `excludeProductId`.
- `resources/js/features/composition/FormulaDetailDrawer.tsx` — price shown per selling unit.
- `resources/js/features/composition/types.ts` — `selling_unit_name` on pricing.
- `resources/js/Pages/returns/SaleReturnDetail.tsx` — conditional cost column, loose null guards.

**Tests**
- `tests/Feature/Composition/CompositionComponentApiTest.php` — +2 tests (zero-exclusion, real
  exclusion still applied).
- `tests/Feature/Composition/CompositionCostUiSurfacesTest.php` — **new**, 5 tests (sale detail,
  sale print, return detail ×2).
- `tests/Feature/Composition/CompositionDraftCostTest.php` — **new**, 5 tests (see §12).

---

## 6. API contracts affected

| Endpoint | Change |
|---|---|
| `GET /inventory/composition/components` | Accepts `exclude_product_id=0` as "no exclusion" |
| `GET /sales/{id}`, `GET /sales/{id}/print` | `items[].cost_price`, `cost_complete`, `uncosted_quantity` and run `cost_basis` omitted without `products.composition.cost` |
| `GET /returns/{id}` | Cost keys omitted without the permission; new `can_view_cost` prop |
| Composition `pricing` payload | Additive `selling_unit_name` |

All are additive or restrictive-for-unauthorised; no existing consumer depended on the removed
values (the UIs never rendered them).

---

## 7. Security considerations

- Cost redaction is enforced **server-side** in all three corrected surfaces; the UI gating is only
  presentation.
- Keys are **omitted, not nulled**, so "no cost recorded" and "cost hidden" stay indistinguishable.
- The permission remains `products.composition.cost`; no new permission was introduced.
- Verified by probes before fixing, and by regression tests after.

**Residual:** report pages and `returns.show` record access, per §3.

---

## 8. Performance considerations

- No new per-row or per-render requests were introduced.
- The cart summary reuses the server-provided per-formula cost (no N+1).
- The position of the recursive strip is on one page load, over a small payload.
- Ingredient search retains its 250 ms client debounce; the `exclude` fix removes a guaranteed
  failing request rather than adding one.

---

## 9. Test commands and actual results

```text
php artisan test tests/Feature/Composition/CompositionComponentApiTest.php \
                 tests/Feature/Composition/CompositionCostUiSurfacesTest.php
→ 8 passed (39 assertions)

php artisan test
→ 476 passed, 5 failed (2,000 assertions)

npx tsc --noEmit
→ passed

npm run build  (tsc && vite)
→ passed

vendor/bin/pint --test <changed PHP files>
→ passed

git diff --check
→ clean
```

**Pre-existing failures (5):** `Tests\Feature\ProfileTest` — `/profile` returns 404 because that
route was never implemented. Unchanged by this task; the P17 baseline was 464 passed and this task
adds 7.

**Not executed:** no frontend unit/E2E suite exists; no browser automation is available.

---

## 10. Browser QA

**Not performed.** No browser tooling is available in this environment, so the following are
explicitly pending human verification:

- Add Formula → ingredient search returns results (the reported failure) and selection adds a row.
- Builder ingredient search still excludes the parent product.
- Sale detail as a salesman: no cost anywhere in the rendered page or the network response.
- Sale detail as an admin: cost values present as before.
- Return detail as a salesman: Material Restoration has no Cost column; as an admin it does.
- Formula detail drawer reads "Rs. 500 per Formula".
- POS formula flow unchanged: search → customize → preview → cart → checkout.
- Mobile cart layout with the profitability line.

---

## 11. Final UI/UX readiness assessment

The composition frontend now matches the backend's P9–P17 capabilities in the areas audited:
formula creation (inline or via the builder), a complete read-only formula view, permission-safe cost
and pricing guidance, and a POS flow with a live profitability preview that is clearly labelled as
estimated.

Two of the three defects fixed here were **security-adjacent** (cost reaching unauthorised users
through sale and return pages) and one was a **hard functional break** (ingredient search on the Add
Formula screen). All three were reproducible before the fix and are covered by regression tests.

Readiness: **functional and permission-consistent by automated verification; visual/responsive
polish unverified.** Treat browser QA as the remaining gate before calling the frontend
production-ready.

---

## 12. Follow-up: create-screen separation + live formula costing

A user report after the audit produced two further changes on the Add Product / Add Formula screens.

### F8 — the create form carried a second, conflicting way to switch workflow (P2)

`ProductForm` rendered a "What are you creating?" toggle (Physical Product / Formula) on top of a
screen that is already reached from a dedicated entry point (`/inventory/add` versus
`/inventory/add?formula=1`). Two controls for one decision, and the toggle could put the user in a
formula flow they did not choose.

**Resolution:** the mode is now derived from the route (`initialSetupFormula`), and the toggle is
gone. `Add Product` shows only physical-product fields; `Add Formula` shows only formula fields.
The "Formula / composition" hand-off card is now edit-only, since a new formula is authored inline.
The empty-formula save path still redirects to the Formula tab (`_setup_formula`) unchanged.

### F9 — no live cost while entering ingredients (P1, capability gap)

The Add Formula screen let the user type ingredients with no indication of what they cost, even
though the saved formula shows cost on its Formula tab.

Server-side costing is mandatory here: computing it on the client would duplicate the line maths
(unit conversion, wastage, nested compositions, cost-basis confidence) that
`CompositionCostCalculator` already owns, and would require shipping ingredient unit costs to the
browser. The existing `composition/preview` endpoint could not be reused because it is scoped to a
saved product and a new formula has no id yet.

**Resolution:**

- `CompositionCostCalculator::estimateDraft()` — same line loop and nested handling, but the base
  unit comes from the form instead of a product row. `estimateItems()` was split into
  `estimateItems()` (product lookup) + `estimateItemsForBaseUnit()` (the maths); no behaviour change
  for saved formulas.
- `POST /inventory/composition/draft-preview` (`CompositionController::draftPreview`), gated by
  `products.composition.cost`, validated by `DraftCompositionPreviewRequest`. Nothing is persisted.
- `ProductController::create` shares `can_view_cost`; the form only renders the panel and only
  calls the endpoint when that is true.
- The form debounces 400 ms, discards stale replies with a monotonic request id, and shows
  "Cost preview is unavailable right now — you can still save the formula" on failure, so a costing
  error never blocks saving.

Displayed: estimated total cost for the yield, cost per base unit, an explicit "total is incomplete"
warning when an ingredient has no recorded cost, and "based on last known ingredient prices" when
the basis is estimated. No margin or recommended price is shown here — that stays on the Formula
tab, where the selling unit is known.

**Tests:** `CompositionDraftCostTest` (5) — line summation and per-unit cost, wastage, incomplete
cost, 403 without the permission, and positive-output validation.

**Not changed:** editing a formula product still shows the "Your Cost (Rs.)" field, because the edit
payload (`$product->toArray()`) carries no formula marker; hiding it needs a new prop. Recorded here
as P2 rather than silently changed.

Browser QA for the create screen remains **pending** (§10).

---

## 13. Follow-up: the formula builder no longer needs a Preview click

### F10 — every ingredient read "Cost unavailable" until "Preview cost" was pressed (P1)

`CompositionBuilder` showed "Cost unavailable" beside every ingredient and rendered no cost card
until the user clicked **Preview cost**. Worse, any edit called `markDirty`, which cleared the
preview — so the button had to be pressed again after each change, and the numbers were stale for as
long as the user did not think to press it.

**Resolution:** the button is gone; the estimate follows the form.

- A 450 ms debounced effect previews the draft whenever ingredient rows, quantities, units, wastage
  or output quantity change, guarded by a monotonic request id so a slow reply cannot overwrite a
  newer one. Same shape as the Add Formula screen (F9), so the two surfaces behave identically.
- `buildPayload(silent)` lets the auto-preview fail quietly — a half-typed quantity no longer
  surfaces a validation error. Save keeps the loud validation.
- `markDirty` keeps the previous estimate instead of blanking it, so numbers stay on screen while
  the refresh is in flight; the footer reads "Calculating cost…" meanwhile.
- Line text is now `Calculating…` → `Estimated Rs. X`, and only says "Cost unavailable" when the
  server genuinely returned no cost for that line.
- The estimate card and per-line costs are gated by a new `canViewCost` prop (fed from
  `ProductCompositionPanel`), so no request is made for users who may not see cost.
- Save is no longer disabled while previewing; that guard only existed because preview was manual.

**Files:** `CompositionBuilder.tsx`, `ProductCompositionPanel.tsx` (prop pass-through).

### Verification (this follow-up)

```text
php artisan test tests/Feature/Composition/CompositionDraftCostTest.php
→ 5 passed (16 assertions)

php artisan test
→ 476 passed, 5 failed (2,000 assertions)   # same pre-existing ProfileTest failures

npx tsc --noEmit      → passed
npm run build         → passed
vendor/bin/pint ...   → passed
git diff --check      → clean
```

Browser QA for the create screen remains **pending** (§10).
