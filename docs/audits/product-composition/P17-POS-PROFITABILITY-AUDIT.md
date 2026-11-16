# P17 — POS Formula Profitability Preview: Audit

**Date:** 2026-11-15 (system clock observed 2026-11-16)
**Branch:** `feature/product-composition`
**HEAD at audit:** `54f444be4616e6dfe6f405db07215d951f69b012`
**Status:** audit complete; implementation follows in the same phase (see P17-POS-PROFITABILITY-PREVIEW.md).

> Everything below was read from source and, where noted, confirmed by existing tests. **No browser
> interaction was performed.**

---

## 1. Current POS customization architecture

```text
POS search → formula hit
  └─ handleSelectProduct → hasConsumptionComposition → openFormulaCustomization(product)
       └─ FormulaCustomizationDialog
            ├─ GET /inventory/product/{id}/composition?kind=consumption   (active version + items)
            ├─ cashier edits per-formula quantities (identities fixed)
            └─ onConfirm(FormulaCustomizationResult)
                 └─ cart line gets: formulaCompositionId, formulaVersion,
                    formulaOverrides, formulaOptionalItemIds, formulaDetails
```

Batch checkout then sends `formula_composition_id`, `formula_overrides`, `formula_optional_item_ids`
per item. `SaleService` pins the composition id, rejects a stale version, and defers the composition
line until every commercial line exists, then executes it inside the same transaction.

---

## 2. Exact customization payload

`FormulaCustomizationDialog` builds, per ingredient row:

```ts
overrides.push({
  composition_item_id: row.compositionItemId,
  quantity: Number(quantity.toFixed(6)),   // PER FORMULA UNIT, in row.unit
  unit_id: row.unit,
})
```

`row.unit` is `item.display_unit_id || component.base_unit_id` and `row.actual` is seeded from
`item.display_quantity`. So **override quantities are per-formula-unit amounts in the ingredient's
display unit** — not absolute consumption.

Cart line (`types/index.ts`): `formulaCompositionId?`, `formulaVersion?`, `formulaOverrides?`,
`formulaOptionalItemIds?`, `formulaDetails?`.

Checkout request item (verified in `SaleBill.doSubmitSale`):
`product_id, quantity, packaging_quantity, packaging_name, selling_unit_id, base_unit_quantity,
unit_price, total, formula_composition_id, formula_overrides, formula_optional_item_ids`.

---

## 3. Actual consumption calculation (authoritative)

`SaleService::create`:

```php
$authoritativeBaseUnitQty = 1.0;                       // composition lines
if ($sellingUnit) $authoritativeBaseUnitQty = (float) $sellingUnit->quantity;

$baseQty = $itemData->packagingQuantity * $authoritativeBaseUnitQty;

$formulaUnits = $this->formulaUnitCount($composition, $product, $baseQty);
// = baseQty / convert(composition.output_quantity, output_unit, product base)

$overrides = $this->absoluteFormulaOverrides($itemData->formulaOverrides, $formulaUnits);
// = each per-formula quantity × formulaUnits
```

Then `CompositionExecutionService::executeWithinTransaction(quantity: $baseQty,
quantityUnitId: product base)`:

```php
$executionBaseQuantity = $baseQty;
$templateOutputBase     = convert(composition.output_quantity, output_unit, parent base);
$scale                  = $executionBaseQuantity / $templateOutputBase;   // == formulaUnits

// per ingredient (explode):
$templateQuantity = item.quantity_base * $scale;
if (override) {
    $actual = convert(override.quantity, override.unit, component base);  // NO scale, NO wastage
} else {
    $actual = $templateQuantity * (1 + wastage_pct/100);
}
```

### Verified rules that the preview must reproduce

1. **Overrides are absolute after the POS multiply.** The engine does **not** re-scale them.
2. **Wastage is skipped for overridden ingredients** and applied only to template quantities.
3. **Nested consumption compositions are exploded to raw components** (recursively), and a nested
   component's own overrides/wastage apply at its level.
4. Optional components are omitted unless listed in `optional_item_ids`; overriding an omitted
   optional is rejected.
5. `formulaUnits = baseQty / templateOutputBase`.

**Consequence:** a preview built from `CompositionCostCalculator::estimate()` alone would diverge for
nested compositions (it prices a nested component at its own unit cost instead of exploding it), and
naively multiplying a per-formula override by quantity again would double-scale. The preview must go
through the execution engine's own expansion.

---

## 4. Actual sale pricing semantics

Client-computed and server-validated (P11):

```ts
grossTotal  = packagingQuantity × price        // computeLineGrossTotal
lineDiscount = round(grossTotal × pct/100)     // per-line percentage
total        = max(0, grossTotal − lineDiscount)
subtotal     = Σ line totals
grandTotal   = subtotal − cartDiscount         // cart-level flat discount
```

Server (`SaleService`): rejects `total < 0` or `total > packagingQuantity × unit_price + 0.01`;
cart discount must be `0 ≤ discount ≤ subtotal`. `unit_price` is an authorised override (cashier
price edit); the server does not re-derive it from the catalogue.

**Discount semantics:**
- Per-line discount is a **percentage** applied to the line's gross, before it reaches the server;
  the server stores the resulting net `total` and `discount_pct` (0 over HTTP today — the percentage
  is not sent, so it is folded into `total`).
- Cart-level discount is a separate flat amount, applied to the **subtotal**, not allocated per line.

For a *per-line* profitability preview, the meaningful revenue is the line's net total, i.e.
`gross × (1 − lineDiscountPct/100)`.

---

## 5. Existing preview API

`POST /inventory/product/{product}/composition/preview` → `CompositionController::preview`
(authorises `view` + `cost`, added in P15/P16).

- Request: `SaveCompositionRequest` — the **builder's save shape** (`kind`, `output_quantity`,
  `output_unit_id`, `notes`, `items[]` with component ids and base quantities).
- Response: `data` = `CompositionCostCalculator::estimate()` plus a `pricing` block (P16).
- It does **not** accept runtime overrides, a selling unit, a commercial quantity, a price or a
  discount, and it is not tied to an existing composition id.

**Conclusion:** the contract is structurally different from POS customization (template items vs
composition-item overrides). Extending it would blur the builder contract and force optional
parameters into a validated save request. A dedicated endpoint is the smaller, clearer change.

---

## 6. Frontend architecture and integration point

- `FormulaCustomizationDialog` owns the per-ingredient edits and is already the place where a cashier
  reasons about ingredient quantities → **primary preview location**.
- The dialog does **not** own quantity/price/discount; those live on the cart line, edited while the
  dialog is closed. So the dialog must receive them as context.
- The cart is the only place that reacts to quantity/price/discount changes → **compact cart summary**
  is the natural second location.
- `SaleBill` already has `posProducts`, `priceOverrides`, `discountPcts`, `computedCart`.
- Existing patterns: `api.ts` axios wrappers, `toast` errors, per-dialog loading flags,
  `requestId`-style stale guarding already used in `ComponentPicker`.

---

## 7. Gaps identified

| # | Gap |
|---|---|
| G1 | No way to compute ingredient cost for **runtime-customized** quantities; P16 pricing uses template defaults only. |
| G2 | No profitability (revenue − cost) anywhere in POS. |
| G3 | The POS page does not expose whether the cashier may see cost, so the UI cannot gate a preview. |
| G4 | `formulaUnitCount` / absolute-override conversion are private to `SaleService`; a preview that re-implements them risks divergence. |
| G5 | The cost calculator alone cannot reproduce nested expansion, so it cannot be the preview's source of truth. |

---

## 8. Proposed implementation architecture

```text
POST /inventory/product/{product}/composition/cost-preview
  ├─ authorise view + cost            (403 otherwise; never blocks customization)
  └─ PreviewProfitabilityRequest       (quantity, selling_unit_id, unit_price,
                                       discount_percent|discount_amount, overrides, optional ids)
       └─ PosFormulaProfitabilityService
            ├─ CompositionQuantityMath::formulaUnits()  ← shared with SaleService
            ├─ CompositionQuantityMath::absoluteOverrides() ← shared with SaleService
            ├─ CompositionExecutionService::previewRequirements()  ← same explode/aggregate/applyCosts
            └─ CompositionPricingService::recommendedPriceFor()    ← same margin maths
```

Reuse, not duplication:
- costing: existing `CostResolver` via `applyCosts` inside the execution service;
- expansion: the execution service's own `explode`/`aggregate`;
- margin: the existing `CompositionPricingService`;
- scaling: a small shared `CompositionQuantityMath` that `SaleService` delegates to.

The preview performs **no locks, no writes and no stock preflight** — it is informational, so it must
not fail merely because stock is short.

---

## 9. Proposed tests

- Cost matches the actual run snapshot for default quantities, overrides (up/down), multiple units,
  selling-unit factors, yield ≠ 1, wastage, and a nested formula.
- Profit/margin arithmetic incl. the brief's reference example, zero revenue, zero cost, incomplete
  cost.
- Authorization: admin sees values; salesman gets 403 from the endpoint and no `pricing` anywhere.
- Client-supplied cost/profit/margin fields are ignored.
- Checkout unaffected; preview failure does not block checkout.

---

## 10. Risks and compatibility

| Risk | Mitigation |
|---|---|
| Preview diverges from checkout | Both go through the execution service's expansion and the shared quantity math; tests assert preview cost == run snapshot cost. |
| Double-scaling overrides | Overrides are converted once (per-formula × units) and never re-scaled — mirrors checkout exactly. |
| Cost leakage | Endpoint requires `products.composition.cost`; POS only requests when the server says the user may see cost. |
| Stale async responses | Monotonic request id, debounce, ignore out-of-order replies. |
| Performance | One request per debounced edit; no per-cart-row requests; no per-ingredient queries beyond the bulk product fetch the engine already does. |
| Checkout coupling | Preview is a separate read-only endpoint; checkout never reads preview output. |
