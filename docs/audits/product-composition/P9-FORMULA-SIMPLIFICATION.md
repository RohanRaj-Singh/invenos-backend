# P9 — Herbal Formula Simplification, Runtime Customization & POS Integration

**Date:** 2026-11-15
**Branch:** `feature/product-composition`
**HEAD:** `50be1bd911f8c0ad46a9232aac4396837f457843` (no commit)
**Status:** Implemented on the source branch. Manufacturing backend retained; manufacturing formula UX hidden.

---

## 1. Actual business requirement

The herbalist maintains inventory ingredients and reusable formulas.

A formula is:

- a reusable ingredient template;
- a commercial product/line;
- **not** a manufactured item;
- **not** a production order;
- **not** physical parent stock.

At POS, one formula is one commercial line. The cashier may change ingredient quantities for
that sale, but cannot add, remove or replace ingredient identities. Actual runtime quantities are
deducted from inventory, not the template defaults. Historical sales retain their own actual
quantities.

Example:

```text
Joint Pain Formula (Rs.500)
  Ashwagandha   default 10g, actual 20g
  Turmeric      default 50g, actual 100g
  Ginger        default 30g, actual 30g
  Black Pepper  default 5g,  actual 10g
```

The saved template remains 10/50/30/5.

---

## 2. Existing architecture audit

### Reused

- `product_compositions` / `product_composition_items`: versioned formula template;
- `CompositionExecutionService`: recursive explosion, unit conversion, stock preflight, atomic
  consumption, immutable run snapshots, runtime overrides, idempotency;
- `SaleService`: one sale line + one consumption run per formula line;
- `CogsCalculator`: actual run-item cost snapshots;
- `ReturnService` + `CompositionReturnRecoveryService`: commercial refund vs. explicit recovery;
- `ProductionReportService`: existing POS/recovery usage rows (manufacturing rows retained);
- Product selling units: default formula selling price.

### Unnecessarily complicated for the herbalist

- Assembly/manufacturing was exposed alongside ingredient formulas in the formula tab and builder.
- Production order/start/complete/reverse/report navigation was visible although not needed to sell
  a formula.
- The formula builder exposed optional-component and kind controls that do not match the fixed
  ingredient identity requirement.
- Product type (`products.product_type`) was displayed as if it drove composition behavior, while
  composition is actually derived from the active `product_compositions` row.
- No POS runtime ingredient editor; sale overrides existed in the execution engine but were not
  exposed through the sale request/cart.
- No formula details on the sales detail page.
- The usage report mixed manufacturing, POS and recovery under a "Component Usage" label.

---

## 3. Corrected domain model

```text
Product (formula product)
  └─ active consumption ProductComposition (versioned template)
       └─ ProductCompositionItems: ingredient product + default base quantity + display unit
```

- Formula = product + active ingredient composition.
- One formula commercial sale line.
- Runtime customization is an execution-time override, never a template mutation.
- Manufacturing/assembly is retained as a separate backend capability but is not part of the
  formula workflow.

### Quantity semantics

Runtime quantities are **per formula unit**.

```text
absolute ingredient consumption = runtime quantity per formula × commercial formula quantity
```

Example: 2 formulas × 20g Ashwagandha = 40g actual consumption.

The frontend displays and edits per-formula-unit amounts. `SaleService` converts them to absolute
quantities before calling the P3 execution engine, because P3 overrides are absolute totals by
contract.

---

## 4. Formula template UX

### Create/edit

- Formulas are created from a product, then the Formula tab.
- The Formulas navigation opens `/inventory?composition=formula`.
- “New Formula” opens the product form with the formula hand-off preselected.
- Builder is ingredient-only:
  - formula label/name;
  - ingredients;
  - default quantity and unit;
  - wastage;
  - notes;
  - save.
- Assembly/manufacturing kind and optional-component controls are removed from the formula UI.
- Saving/editing never moves stock and never creates a production order.
- Product edit opens the Formula tab and never submits an empty packaging payload that could
  delete existing packaging.
- Product description is loaded on edit (previously it was initialized empty and could be cleared).

### Defaults and history

- Composition editing creates a new version; existing runs keep their snapshots.
- The customer-facing formula name comes from the product name; the optional composition name is
  a label.
- Default selling price is the product’s selling-unit price, shown read-only in the Formula tab.
- Cost preview remains admin-only in the UI.

---

## 5. POS workflow

1. Search formula by name, SKU or barcode.
2. Formula results display a **Formula** badge.
3. Selecting a formula opens the runtime customization dialog instead of adding immediately.
4. Dialog loads the active template and all ingredients.
5. Default quantities are read-only; actual quantities are editable per formula unit.
6. Ingredient identities cannot be added, removed or replaced.
7. “Restore defaults” resets actual quantities.
8. Cancel changes nothing.
9. Confirm adds/updates one commercial cart line and stores runtime quantities.
10. Cart shows Formula · edit; clicking it reopens the dialog with the current actual quantities.
11. Formula quantity changes keep per-formula quantities fixed and scale consumption at checkout.
12. Checkout sends `formula_composition_id`, `formula_overrides` and
   `formula_optional_item_ids` for the line.

The cart never creates ingredient sale lines, charges ingredient prices, or deducts parent stock.

---

## 6. Backend contract

### Sale request

```json
{
  "items": [{
    "product_id": 10,
    "formula_composition_id": 3,
    "formula_overrides": [
      { "composition_item_id": 41, "quantity": 20, "unit_id": "g" },
      { "composition_item_id": 42, "quantity": 10, "unit_id": "g" }
    ],
    "formula_optional_item_ids": []
  }]
}
```

- `formula_composition_id` pins the cart to the active formula; if the formula changed after the
  cart was created, the sale is rejected for review.
- `formula_overrides` are per formula unit and are converted to absolute quantities by
  `SaleService`.
- `formula_optional_item_ids` only selects optional template items; P3 rejects mandatory or foreign
  ids.
- Costs, component identities, stock movements and COGS are never accepted from the client.

### Sale detail

`sale.composition_runs` contains immutable run/run-item snapshots for staff. It includes formula
name, template version, commercial quantity, actual ingredient quantities and cost basis, but
never exposes internal unit/total costs. Customer receipts remain commercial-only.

---

## 7. Inventory consumption and reporting

- P3 consumes actual absolute quantities from the component ledger.
- Repeated ingredient products are aggregated into one movement per run.
- Missing stock rejects the whole sale atomically.
- No second inventory engine.
- Ingredient Usage (`/reports/component-usage`) now:
  - shows formula sale and recovery rows;
  - hides retained manufacturing rows from the herbalist view;
  - aggregates consumption by ingredient and unit;
  - shows net use after recoveries;
  - uses actual execution snapshots, never current templates.

Sales reports already list the formula product as the commercial item; ingredients are not sale
items. COGS uses actual run-item costs from the immutable snapshot.

---

## 8. Returns and recovery

- Commercial refund remains separate from material recovery.
- Parent formula is never restocked as physical stock.
- Recovery eligibility now uses:
  - **actual runtime quantity** for overridden ingredient lines;
  - `min(template, actual)` for non-overridden lines, preserving the wastage exclusion.
- This fixes the case where a 100g runtime override was incorrectly capped at the 50g default.
- Duplicate recovery constraints and compensating reversal behavior are unchanged.

---

## 9. Manufacturing UX decisions

| Area | Decision |
|---|---|
| Production order UI | **Hidden from navigation**; files/routes retained in the backend |
| Production history report | **Hidden from navigation** |
| Assembly formula kind in builder | **Removed from formula UX** |
| Assembly formula kind in backend | **Retained** for other business types |
| Production tables/movements | **Retained**; not required for formula sale |
| Component usage manufacturing rows | **Retained in backend; hidden in ingredient report** |
| Production routes | **Retained directly accessible** until a separate deprecation decision |
| Assembly existing records | **Preserved**, not deleted |

No manufacturing tables, records or services were removed.

---

## 10. API changes

| Change | Purpose |
|---|---|
| `items.*.formula_composition_id` | Pin cart formula version |
| `items.*.formula_overrides` | Per-formula runtime ingredient quantities |
| `items.*.formula_optional_item_ids` | Include optional template ingredients if present |
| `SaleItemData` runtime arrays | Carry overrides into P3 |
| `SaleService` formula-unit conversion | Convert per-unit values to P3 absolute overrides |
| Product list/detail composition flags | Badges, stock semantics, formula filter |
| `/inventory?composition=formula` | Formula list view |
| `sale.composition_runs` safe snapshot | Sales detail formula visibility |
| Ingredient usage UI aggregate | Ingredient-level roll-up |

---

## 11. Database migrations

**No new migration was required for runtime overrides.** Existing P3 schema supports them:

- `composition_run_items.template_quantity` — scaled default;
- `composition_run_items.actual_quantity` — actual override total;
- `composition_run_items.source_breakdown` — per-source override flag and quantities;
- `composition_run_items.unit_cost` / `total_cost` — execution cost snapshot;
- `composition_runs.sale_item_id` — sale linkage;
- `composition_runs.template_snapshot` — historical template.

---

## 12. Tests

New `tests/Feature/Composition/FormulaRuntimeTest.php` — **7 passed**:

- runtime quantities are per formula unit and do not mutate defaults;
- default quantities used when no customization;
- historical runtime snapshot survives formula edit;
- ingredient usage report uses actual quantities;
- return recovery uses actual customized quantity;
- HTTP checkout accepts runtime overrides;
- forged foreign ingredient override rolls back with no stock movement.

Updated `CompositionFrontendContractTest` — product flags, formula filter, formula handoff, sale
detail safe snapshot.

Updated `CompositionReturnsTest` remains green after the actual-consumption basis change.

Verified results:

```text
php artisan test tests/Feature/Composition/FormulaRuntimeTest.php
→ 7 passed (30 assertions)

php artisan test tests/Feature/Composition/FormulaRuntimeTest.php \
  tests/Feature/Composition/CompositionFrontendContractTest.php \
  tests/Feature/Composition/CompositionReturnsTest.php
→ 40 passed (181 assertions)

npm run build
→ passed (tsc + vite)

php artisan test
→ 364 passed, 9 failed (1,537 assertions)
```

The 9 failures are the same pre-existing missing Auth/Profile Inertia pages. P8 baseline was
354 passed / 9 failed; P9 adds 10 passing tests (7 runtime + 3 frontend-contract). `vendor/bin/pint`
is clean on the changed PHP files. Generated `public/build` assets were restored after
verification.

---

## 13. Remaining limitations

- Formula is still represented as a Product row; there is no separate formula-only table. This is
  intentional to preserve POS/sale/cost/return architecture.
- Formula products still have a nominal parent stock column, but the UI hides it for
  consumption-only formulas and POS never deducts it.
- The formula list is a filtered inventory view, not a separate report module.
- There is no pre-checkout component availability endpoint; availability is authoritative at
  checkout. The customization dialog explicitly says it does not reserve stock.
- Optional components are hidden from the formula builder and treated as included when present
  in an existing template.
- Manufacturing backend/pages are retained and directly accessible, but not linked in the
  herbalist navigation.
- No frontend unit/E2E test runner exists in this repository; frontend validation is TypeScript +
  Vite build plus backend HTTP contract tests.
- Multi-unit cart identity remains keyed by product id (pre-existing); a formula has one cart line.
- Formula edit after cart insertion is rejected at checkout by composition id; the cashier must
  reopen/review the cart line.

---

## 14. Manual QA

1. Open **Formulas**; confirm formula list filters to active consumption formulas.
2. Click **New Formula**; create product, save, land on Formula tab.
3. Add Ashwagandha (10g), Turmeric (50g), Ginger (30g); save. Confirm no stock movement.
4. Edit formula quantities; confirm a new version is saved and old versions remain.
5. Open POS; search formula by name/SKU/barcode; confirm Formula badge.
6. Select formula; confirm customization dialog shows defaults.
7. Change Ashwagandha to 20g; confirm cancel does not change cart.
8. Reopen, set 20/100/30; confirm; cart has one formula line and details.
9. Change cart quantity to 2; confirm ingredient total is 2× per-formula values at checkout.
10. Complete sale; verify sale detail shows formula, quantity and per-formula actual ingredients.
11. Verify ingredient stocks decreased by actual totals and parent formula stock did not move.
12. Verify Ingredient Usage shows actual quantities and ingredient aggregate.
13. Return one formula with actual 100g Turmeric; verify recoverable ceiling is 100g, not 50g.
14. Verify receipt shows only the formula commercial line.
15. Verify ordinary simple-product checkout is unchanged.
16. Verify no Manufacturing link appears in the herbalist navigation.

---

## 15. Git safety

- Branch before/after: `feature/product-composition`
- HEAD before/after: `50be1bd911f8c0ad46a9232aac4396837f457843`
- No commit, branch switch, merge, rebase, reset, clean, stash or cherry-pick.
- Fashion worktree not modified.
