# P16 — Formula Target Margin & Recommended Pricing

**Date:** 2026-11-15 (system clock observed 2026-11-16)
**Branch:** `feature/product-composition`
**Original HEAD:** `54f444be4616e6dfe6f405db07215d951f69b012`
**Status:** Implemented — configurable target gross margin, server-computed recommended selling
price, pricing guidance in the formula detail drawer, builder preview and formula cards.

> **Verification honesty:** behaviour is covered by automated tests plus TypeScript/Vite builds.
> **No browser interaction was performed.** UI claims come from source and compilation only; see §12.

---

## 1. Initial findings

| Area | Finding |
|---|---|
| Settings storage | One JSON row (`settings.values`) via `SettingService`; groups are `business, pos, inventory, sales, purchases, receipt, backup`. App-wide, no company/organisation dimension on this branch. |
| Settings persistence | `Business` and `Receipt` pages persist via `router.put('/settings', { group: draft })`. **`Sales` and `Inventory` pages use an in-memory mock (`@/data/settings`)** — a pre-existing inconsistency, unchanged here. |
| Settings validation | `UpdateSettingsRequest` validates each group explicitly; `UpdateSettingsData` whitelists groups. Both are lists that must be extended. |
| Costing | `CompositionCostCalculator` + `CostResolver` already produce `total_cost`, `unit_cost` (per **base** unit), `cost_basis` and `complete`. Nothing new was needed. |
| Selling price | `selling_units.sale_price` on the product's default selling unit; `quantity` = base units per selling unit. |
| Permissions | `products.composition.cost` (added in P15) gates all cost data server-side. |
| Existing margin reporting | P&L computes per-bill margin **after the fact**; there was no prospective margin or recommendation. |
| Currency | `formatCurrency` renders PKR with **0 decimal places**. |

---

## 2. Settings architecture

Settings live in a single row:

```php
Setting::first()->values = ['business' => [...], 'pos' => [...], 'inventory' => [...], 'sales' => [...], ...]
```

`SettingService::get()` reads defaults when no row exists and caches the array under `app_settings`.
`update()` merges the incoming groups into the stored values and clears the cache.

**New group:** `composition`, holding `target_margin_percent`.

**Scope:** application-wide, matching every existing setting on this branch. There is no
company/organisation settings dimension here, so no isolation work was possible or claimed. This is
stated again in §13.

---

## 3. Target margin configuration

| Item | Value |
|---|---|
| Key | `composition.target_margin_percent` |
| Storage | existing `settings.values` JSON — **no new table, no migration** |
| Default | **30%** (`SettingService::defaults()`); matched P14's suggested value and the reference example |
| Validation | `nullable\|numeric\|min:0\|lt:100` — server-authoritative |
| Decimals | supported (e.g. `12.75`) |
| Authorisation | `settings.update` gate (admin only), unchanged |

`lt:100` (strictly less than) is deliberate: at 100% the recommended price would be infinite.

Reading is defensive as well as validated: `CompositionPricingService::targetMarginPercent()` clamps
a stored value to `[0, 99.9999]`, so a hand-edited or legacy value cannot cause a division by zero.

**UI:** new page `settings/Composition.tsx` ("Formula Pricing"), reachable from Settings → Formula
Pricing, the Settings index, and the sidebar. It follows the **server-persisting** pattern
(Business/Receipt) rather than the mock one, so edits survive a reload. It explains margin vs markup
and shows the default.

---

## 4. Pricing formulas

Gross margin, never markup:

```text
margin (%) = (price − cost) / price × 100
price      = cost / (1 − margin / 100)
```

Reference example (implemented and tested): cost 700, target 30% → **1000**, profit 300, margin 30%.
Markup would have produced 910; there is an explicit regression test asserting we do **not** produce
that.

Cost basis used:

```text
cost per selling unit = estimated_unit_cost × selling_unit.quantity
```

This mirrors inventory consumption exactly: checkout scales a run by
`sellingUnit.quantity / template_output_base`, which is algebraically the same figure. So the
recommendation is comparable to what the sale will actually consume.

---

## 5. Cost completeness behaviour

| Situation | Behaviour |
|---|---|
| Complete cost | `available: true`, recommended price and profit computed |
| Incomplete / missing ingredient cost | `available: false`, `recommended_price: null`, reason `incomplete_cost` — no recommendation is shown |
| Zero cost | Treated as a **real** cost: recommended price 0, profit = full price, margin 100% |
| Selling price 0 or absent | `margin_percent: null` (no division by zero); profit still computed when cost is known |
| Missing selling unit | `selling_price`, `profit`, `margin_percent` null; recommendation still computed from cost |
| Invalid/clamped target margin | clamped; if it can never be valid, reason `invalid_target_margin` |
| Non-finite result | guarded by `is_finite()`; never emits `NaN`/`Infinity` |

Rounding: internal maths keeps full precision; money is rounded to 2 decimals (the minor unit) and
displayed through `formatCurrency`. Percentages round to 2 decimals.

---

## 6. API changes

No new endpoints. The `pricing` block rides on existing composition responses:

- `GET /inventory/product/{id}/compositions` — per-version `pricing`
- `GET /inventory/product/{id}/composition?kind=` — `pricing`
- `GET /inventory/product/{id}/composition/{id}` — `pricing`
- `POST/PUT/DELETE …/composition` — responses include `pricing`
- `POST …/composition/preview` — `data.pricing` added alongside the existing cost estimate

Payload:

```json
"pricing": {
  "target_margin_percent": 30,
  "estimated_cost": 700,
  "cost_complete": true,
  "cost_basis": "exact",
  "selling_price": 850,
  "profit": 150,
  "margin_percent": 17.65,
  "recommended_price": 1000,
  "recommended_profit": 300,
  "available": true,
  "unavailable_reason": null
}
```

`sellingUnits` is eager-loaded with the composition (`product.sellingUnits`) so a version list does
not issue one query per row.

---

## 7. Authorisation behaviour

`pricing` is cost-derived, so it is emitted **inside** the existing `$canViewCost` block in
`ProductCompositionResource`. Consequences:

- No new permission was introduced — `products.composition.cost` remains authoritative.
- Unauthorised users receive no `pricing` key at all (omitted, not nulled), and no cost keys.
- `preview` remains 403 without the cost permission (P15 behaviour), so pricing cannot be obtained
  through it either.
- Tests assert that the substrings `pricing`, `recommended_price`, `margin_percent`,
  `target_margin_percent` and `estimated_cost` appear nowhere in a salesman's payload.

P15 confidentiality is intact and extended rather than bypassed.

---

## 8. Formula detail UX

`FormulaDetailDrawer` gained a **Pricing** panel (cost permission only), stacked under the existing
"Current estimated cost" block:

- **Current:** cost per unit, current selling price, current profit, current margin (negative values
  in red).
- **Recommended:** target margin badge, recommended selling price (or "Not available"), profit at the
  recommended price.
- Copy states the recommendation uses current ingredient costs, that it is guidance only, and that
  the price is **not** changed automatically.
- Incomplete cost shows an amber explanation instead of a number.

The existing identity, ingredient table, cost and actions are untouched.

---

## 9. Product pricing UX

**Builder (`CompositionBuilder`):** after "Preview cost" it now also shows target margin and
recommended price, taken from the server-computed preview. No client-side pricing maths.

**Formula cards (`ProductCompositionPanel`):** each active formula card shows a single compact line —
`Margin X% · Target Y% · Recommended Rs Z` — using the `pricing` already present in the payload, so
there are no extra queries and no new columns in the product table.

**Applying a recommendation is deliberately not implemented.** The builder does not own the selling
price (that lives on the product form), and adding an "apply" action would need an explicit,
separately validated write path. Recorded as deferred in §13 rather than half-built.

---

## 10. Files changed

**Backend**
- `app/Domains/Composition/Services/CompositionPricingService.php` — **new**. Margin maths, target
  margin resolution, cost completeness handling.
- `app/Domains/Settings/Services/SettingService.php` — `composition.target_margin_percent` default.
- `app/Domains/Settings/DTOs/UpdateSettingsData.php` — `composition` group.
- `app/Http/Requests/Settings/UpdateSettingsRequest.php` — margin validation.
- `app/Http/Controllers/SettingsController.php` — `composition` in the allowed groups.
- `app/Http/Controllers/CompositionController.php` — eager-load `product.sellingUnits`; pricing in
  `preview`.
- `app/Http/Resources/ProductCompositionResource.php` — `pricing` block behind the cost permission.
- `routes/web.php` — `/settings/composition`.

**Frontend**
- `resources/js/Pages/settings/Composition.tsx` — **new** settings page (server-persisted).
- `resources/js/Pages/settings/components/SettingsComponents.tsx` — settings tab.
- `resources/js/Pages/settings/Index.tsx` — settings card.
- `resources/js/layouts/Sidebar.tsx` — sidebar entry.
- `resources/js/features/composition/types.ts` — `CompositionPricing`, `pricing?` on composition and
  preview.
- `resources/js/features/composition/FormulaDetailDrawer.tsx` — pricing panel.
- `resources/js/features/composition/CompositionBuilder.tsx` — target margin + recommended price.
- `resources/js/features/composition/ProductCompositionPanel.tsx` — card pricing line.

**Tests**
- `tests/Feature/Composition/CompositionPricingTest.php` — **new**, 25 tests.

---

## 11. Tests executed

```text
php artisan test tests/Feature/Composition/CompositionPricingTest.php
→ 25 passed (96 assertions)

php artisan test
→ 439 passed, 5 failed (1,844 assertions)

npm run build   (tsc && vite)
→ passed

vendor/bin/pint --test <changed PHP files>
→ passed (after auto-fixing style in 3 files, including 4 lines of pre-existing formatting
   in SettingsController)

git diff --check
→ clean
```

Coverage added: default/configured/decimal margin, `≥100` and negative rejection, admin-only update,
application scope, the 30% reference example, markup-vs-margin guard, 50%, 0%, rounding to the minor
unit, selling-unit quantity scaling, incomplete cost, zero cost, zero selling price, missing selling
unit, clamped stored margin, authorised vs unauthorised payloads, version history, preview, price
immutability, detail page and settings page rendering.

### Existing failures

**None introduced.** The 5 failures are the unchanged pre-existing `ProfileTest` cases: `/profile`
returns 404 because that route was never implemented. P15 baseline was 414 passed; P16 adds 25.

---

## 12. Manual QA checklist

**Not performed — no browser available.** For a human:

- [ ] Settings → Formula Pricing: page loads, shows 30% by default, saves a decimal value.
- [ ] Reload after saving: the value persists (server-backed, not the mock store).
- [ ] Enter `100` or `-5`: rejected with a clear message.
- [ ] Sign in as salesman: `/settings/composition` is not reachable / save is forbidden.
- [ ] Formula tab → View: pricing panel shows current and recommended figures.
- [ ] With an incomplete-cost formula: "Not available" plus the amber explanation, never a number.
- [ ] Builder → Preview cost: target margin and recommended price appear.
- [ ] Formula card: margin/target/recommended line renders and stays readable on mobile.
- [ ] Confirm the selling price on the product is unchanged after viewing recommendations.
- [ ] Sign in as salesman: no pricing section, no cost line on cards.

---

## 13. Deferred items

1. **Apply recommended price** — no button and no write path. Would need explicit action, server
   validation and product-update authorisation; deliberately left out of this phase.
2. **Product list columns** — the main product table shows no margin column. Doing so would need
   cost/pricing for every row, which is a per-row cost query; deferred to avoid a performance
   regression, per the phase instructions.
3. **Per-formula or per-category target margins** — the target is business-wide only; the settings
   architecture could hold more but it was not asked for.
4. **Historical cost snapshots** — recommendations always use current ingredient prices; version
   history remains clearly labelled "current estimated cost".
5. **Sales/Inventory settings pages remain mock-backed** — pre-existing inconsistency, unchanged. The
   new Formula Pricing page uses the server, which is why its edits persist while those pages' edits
   do not. Worth fixing in a later phase.
6. **No browser verification** of drawer layout, mobile wrapping or the settings page.
7. **Company/organisation scoping** — not implemented on this branch, so the margin is application-wide.

---

## 14. Git safety

- **Original branch:** `feature/product-composition` (confirmed before any edit)
- **Original HEAD:** `54f444be4616e6dfe6f405db07215d951f69b012`
- **Final HEAD:** `54f444be4616e6dfe6f405db07215d951f69b012` (no commit)
- No branch switch, reset, clean, stash, merge, rebase, cherry-pick or history rewrite.
- Pre-existing P14/P15 changes and documents preserved.
- `fashion` worktree untouched (`variation/clothing-erp` @ `d0ff43e`).
- `public/build` restored to its tracked state after the build check.
