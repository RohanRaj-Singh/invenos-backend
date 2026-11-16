# P17 — POS Formula Profitability Preview: Implementation

**Date:** 2026-11-15 (system clock observed 2026-11-16)
**Branch:** `feature/product-composition`
**HEAD:** `54f444be4616e6dfe6f405db07215d951f69b012` (no commit)
**Status:** implemented — read-only profitability for customized POS formula lines.

> Companion audit: `P17-POS-PROFITABILITY-AUDIT.md`. Sections below separate **verified source
> behaviour**, **automated coverage**, and **manual QA**. **No browser interaction was performed.**

---

## 1. Initial audit findings (summary)

1. POS overrides are **per formula unit** in the ingredient's display unit; checkout multiplies them
   by `formulaUnits` exactly once, and the execution engine never re-scales overrides.
2. **Wastage is applied to template quantities only**, not to overridden ones.
3. Nested consumption compositions are **exploded to raw components**; pricing a nested component at
   its own unit cost would diverge from checkout.
4. Checkout revenue is `quantity × unit_price` minus a per-line discount, with the net stored in
   `total`; the cart-level discount is separate and not allocated per line.
5. The builder's `preview` endpoint takes a *save* payload, not runtime overrides — structurally
   unsuitable for POS.
6. `formulaUnitCount` / `absoluteFormulaOverrides` were private to `SaleService`, so any re-write
   risked divergence.

---

## 2. Actual POS customization payload

```ts
{ composition_item_id, quantity /* per formula unit */, unit_id /* display unit */ }
```

Submitted at checkout as `formula_overrides`, alongside `formula_composition_id` and
`formula_optional_item_ids`, with `quantity = packaging_quantity` and `selling_unit_id`.

---

## 3. Actual consumption semantics (unchanged)

```text
baseQty      = packagingQuantity × sellingUnit.quantity
formulaUnits = baseQty / convert(template.output_quantity, output_unit, product base)
override     = perFormula × formulaUnits            (absolute, applied once)
actual       = override                              (no wastage)
             = item.quantity_base × scale × (1+w%)   (template quantities)
```

---

## 4. Actual sale pricing semantics (unchanged)

```text
gross        = packagingQuantity × unitPrice        (unitPrice may be an authorised override)
lineDiscount = gross × pct/100                      (per line)
lineTotal    = max(0, gross − lineDiscount)         (client-computed, server-bounded)
subtotal     = Σ lineTotal;  grandTotal = subtotal − cartDiscount
```

---

## 5. Discount behaviour

| Level | Basis | Used by the preview |
|---|---|---|
| Line | percentage of that line's gross | **yes** (`discount_percent`) |
| Line | explicit flat amount | **yes** (`discount_amount`, takes precedence) |
| Cart | flat amount off the subtotal, not allocated per line | **no** — a line has no defensible share |

The preview therefore reports **line-level** profitability and says so in the UI. Cart-level
allocation is deferred (see §14).

---

## 6. Backend calculation architecture

```text
POST /inventory/product/{product}/composition/cost-preview
  ├─ authorize view + cost
  └─ PreviewProfitabilityRequest
       └─ PosFormulaProfitabilityService::preview()
            ├─ CompositionQuantityMath::formulaUnits()      ← shared with SaleService
            ├─ CompositionQuantityMath::absoluteOverrides() ← shared with SaleService
            ├─ CompositionExecutionService::previewRequirements()
            │     └─ prepareExecution() → explode() → aggregate() → applyCosts()
            │        (CostResolver resolution; nested expansion; wastage rules)
            └─ CompositionPricingService::recommendedPriceFor()
```

Reused, not duplicated:

- **ingredient costing** — the execution service's existing `applyCosts`/`CostResolver` path;
- **expansion** — the same `explode`/`aggregate` checkout uses, now reached through a shared
  `prepareExecution()` that both real execution and the preview call;
- **scaling** — a new `CompositionQuantityMath`, which `SaleService` now delegates to (its two
  private helpers became one-line delegations);
- **margin maths** — the existing `CompositionPricingService`.

`previewRequirements()` performs **no locking, no writes and no stock preflight**. It cannot reserve
or deduct inventory, and a shortage does not block it.

### Response

```json
{ "data": {
  "quantity": 2, "formula_units": 2,
  "cost_complete": true, "cost_basis": "exact",
  "cost_per_formula_unit": 90, "total_ingredient_cost": 180,
  "selling_unit_price": 1000, "gross_subtotal": 2000,
  "discount_amount": 100, "net_revenue": 1900,
  "gross_profit": 1720, "gross_margin_percent": 90.53,
  "target_margin_percent": 30, "recommended_price": 128.57,
  "recommended_profit": 38.57, "available": true, "unavailable_reason": null,
  "lines": [ { "component_product_id": 3, "component_name": "...", "unit": "g",
               "actual_quantity": 40, "unit_cost": 4.5, "total_cost": 180, "cost_basis": "exact" } ]
} }
```

---

## 7. API changes

One new endpoint (the builder's save-shaped `preview` was left untouched):

`POST /inventory/product/{product}/composition/cost-preview` → `inventory.composition.cost_preview`

Request: `composition_id?`, `quantity` (required, > 0), `selling_unit_id?`, `unit_price?`,
`discount_percent?` (0–100), `discount_amount?`, `overrides[]`, `optional_item_ids[]`.

**No cost, profit or margin field is accepted.** Anything a client sends under those names is
ignored — asserted by a test that posts fabricated values and checks the server's numbers win.

---

## 8. Authorization behaviour

- Endpoint requires `view` **and** `cost` → `403` without `products.composition.cost`.
- The whole payload is cost-derived, so there is no partially-redacted variant.
- `SaleController::create` now shares `can_view_cost` (server `Gate` check); the POS only requests a
  preview when true, so unauthorised users generate **no** cost traffic and see no panel.
- **Preview never gates checkout**: a salesman gets 403 from the preview yet can still sell the
  formula — covered by a dedicated test asserting the sale succeeds and stock is consumed.

---

## 9. Frontend changes

**Formula customization dialog** (`FormulaCustomizationDialog`):
- new props `canViewCost`, `quantity`, `sellingUnitId`, `unitPrice`, `discountPercent`;
- 350 ms debounce; a monotonic request id discards out-of-order replies; cleanup cancels the timer;
- loading spinner, non-blocking error text ("You can still customize and sell this formula"), and a
  compact metric list: formula quantity, estimated ingredient cost, gross subtotal, discount, net
  revenue, **Estimated gross profit**, **Estimated gross margin**, plus a recommended price line at
  the configured target margin;
- incomplete cost hides profit/margin and explains why rather than showing a number;
- the confirmed customization carries `estimatedCostPerFormulaUnit` for the cart.

**POS cart** (`SaleBill`, desktop table and `MobileCartList`):
- one compact line per formula item — `Est. cost … · profit … · 12.3%` — computed from the stored
  cost-per-formula × quantity versus the line's net total. **No per-row requests.**
- the value is only propagated when `can_view_cost` is true.

---

## 10. Checkout integrity guarantees

- The preview is a **separate read-only endpoint**; checkout never reads its output.
- No new fields flow into `SaleService`, `CompositionExecutionService`, inventory, COGS, returns or
  ledger code.
- The execution-service change is a **pure extraction** (`prepareExecution`) plus a new read method;
  ordering, locking, idempotency, preflight and snapshot fields are untouched. The pre-existing
  composition/sales suites (227 tests) passed immediately after the refactor, before any UI work.
- Ingredient identity, template defaults and version snapshots are unaffected.

---

## 11. Files changed

**Backend**
- `app/Domains/Composition/Services/CompositionQuantityMath.php` — **new**; shared scaling rules.
- `app/Domains/Composition/Services/PosFormulaProfitabilityService.php` — **new**; profitability.
- `app/Domains/Composition/Services/CompositionExecutionService.php` — extracted `prepareExecution`;
  added read-only `previewRequirements()`.
- `app/Domains/Composition/Services/CompositionPricingService.php` — public `recommendedPriceFor()`.
- `app/Domains/Sales/Services/SaleService.php` — delegates to `CompositionQuantityMath`.
- `app/Http/Requests/Composition/PreviewProfitabilityRequest.php` — **new**.
- `app/Http/Controllers/CompositionController.php` — `costPreview()`.
- `app/Http/Controllers/SaleController.php` — `can_view_cost` prop.
- `routes/web.php` — one route.

**Frontend**
- `resources/js/features/composition/FormulaCustomizationDialog.tsx` — live preview panel.
- `resources/js/features/composition/api.ts` — `fetchProfitabilityPreview()`.
- `resources/js/features/composition/types.ts` — input/result types.
- `resources/js/Pages/pos/SaleBill.tsx` — capability prop, dialog context, cart summary.
- `resources/js/features/billing/MobileCartList.tsx` — mobile summary.
- `resources/js/types/index.ts` — `formulaCostPerFormulaUnit`.

**Tests**
- `tests/Feature/Composition/PosFormulaProfitabilityTest.php` — **new**, 25 tests.

---

## 12. Tests executed

```text
php artisan test tests/Feature/Composition/PosFormulaProfitabilityTest.php
→ 25 passed (114 assertions)

php artisan test
→ 464 passed, 5 failed (1,958 assertions)

npm run build (tsc && vite)
→ passed

vendor/bin/pint --test <changed PHP files>
→ passed

git diff --check
→ clean
```

Coverage: template quantities; increased/decreased overrides; multiple units; selling-unit factor;
non-unit yield (incl. half-yield); wastage on template vs override; the brief's reference example
(90.53% margin); percentage and flat discounts; price override; zero revenue; zero cost; incomplete
cost; quantity validation; foreign ingredient and foreign composition rejection; no runs/movements;
preview works when stock is short; client-injected cost/profit ignored; 403 for salesmen; 401 for
guests; POS capability per role; salesman can still check out; **preview cost equals the recorded
checkout snapshot** for the same inputs.

**Pre-existing failures (5):** `ProfileTest` — `/profile` 404, route never implemented. Unchanged;
P16 baseline was 439 passed and P17 adds 25.

**Frontend tests:** this project has **no JS test runner**, so the dialog/cart rendering is not
automatically tested. Their server contract (payload shape, capability prop, 403 behaviour) is
covered by the HTTP tests above.

---

## 13. Manual QA checklist

**Not performed — no browser available.** For a human:

- [ ] Admin: open a formula at POS → profitability panel appears after ~½ s and updates while
      editing ingredient quantities.
- [ ] Change cart quantity, then reopen → panel reflects the new quantity.
- [ ] Set a price override and a line discount → net revenue/profit/margin change accordingly.
- [ ] Wastage ingredient: increasing it raises the estimate; overriding its quantity removes wastage.
- [ ] Formula with an uncosted ingredient → "profit and margin are hidden" note, no numbers.
- [ ] Disconnect the network / force an endpoint failure → amber message, dialog still confirmable.
- [ ] Salesman: no panel in the dialog, no est. cost/profit in the cart, checkout still succeeds.
- [ ] Desktop and mobile carts both show the compact estimate.
- [ ] Confirm no inventory changes from opening the dialog repeatedly.
- [ ] Confirm a real sale records the expected stock deduction and COGS.

---

## 14. Deferred items

1. **Cart-level (order) discount allocation** — the preview reports the line's own economics; a
   per-line share of a cart-wide discount is not defined anywhere in the system.
2. **Overhead / net profit** — deliberately absent; the feature is gross profit on ingredient cost.
3. **Recommended-price application** — unchanged from P16 (guidance only).
4. **Automated frontend tests** — no runner in this project.
5. **Browser verification** of panel layout, debounce feel, mobile wrapping and error states.
6. **Per-line preview from the cart** (recompute on quantity/price change via API) — avoided on
   purpose; the cart uses the stored cost-per-formula and local arithmetic instead.
