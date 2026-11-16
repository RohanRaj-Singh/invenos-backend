# P10 — Formula UX Cleanup, Feature Removal & Scope Consolidation

**Date:** 2026-11-15
**Branch:** `feature/product-composition`
**HEAD:** `50be1bd911f8c0ad46a9232aac4396837f457843` (no commit)
**Status:** Implemented. UX/terminology/stock-illusion cleanup only; execution, costing, returns and
manufacturing backend unchanged.

---

## 1. Initial findings

Verified against the repository, not the P9 report alone.

| Area | Existing problem | Required cleanup | Risk | Done |
|---|---|---|---|---|
| Formula listing | Formula products appeared in the normal list with stock columns, "Consumed"/"Formula" badges and stock value | Explicit "Not stocked" state, ingredient count, no stock value | Medium | Yes |
| Product stock | Formula parent rows showed `stock_quantity = 0` as out-of-stock and counted in overview/valuation | Exclude formula-only records from stock surfaces | Medium | Yes |
| Low stock / alerts | Formula records appeared as `out-of-stock` alerts | Exclude formula-only records | Medium | Yes |
| Inventory reports | Stock report, ledger and valuation included zero-stock formulas | Exclude at the shared product query | Medium | Yes |
| Purchase picker | Formulas were purchasable, which would create phantom stock | Exclude formulas from the purchase picker | Medium | Yes |
| Ingredient picker | A formula could be chosen as an ingredient of another formula | Exclude formula-only products from component search | Medium | Yes |
| Product details | "Adjust Stock" and "Stock Movements" offered for formulas with no ledger | Disable adjust, hide movement tab, add "Not stocked" badge | Low | Yes |
| Formula builder | "Components", "Output quantity/unit", "Formula type" copy read like manufacturing | Ingredient/yield wording; keep kind fixed to consumption | Low | Yes |
| Formula version table | "Kind" column always read "Ingredient formula" | Removed; "Output" renamed "Yield" | Low | Yes |
| POS cart | Formula line did not state total formula count | Added "· N formulas" hint on the overview line | Low | Yes |
| Sales details | "Composition consumption", "Component" wording | "Formula ingredients consumed", ingredient wording | Low | Yes |
| Ingredient usage | Production page button still said "Component Usage" | Renamed to "Ingredient Usage" | Low | Yes |
| Manufacturing | Directly reachable with no context | Added an explanatory notice; navigation links remain removed | Low | Yes |

---

## 2. Root cause of the stock illusion

A formula is still a `products` row plus an active `product_compositions` row. Because it is a row
in `products`, every physical-inventory surface counted it: overview counts, low-stock alerts,
valuation, the stock report, and the purchase picker.

The cleanup introduces one authoritative predicate instead of scattering special cases:

```php
// app/Models/Product.php
Product::formulaOnly()            // has active consumption, no active assembly
Product::excludingFormulaOnly()   // physical inventory only
```

A product with **both** an active consumption and assembly formula is still treated as physical
inventory, because assembly output can be stocked. That preserves the retained manufacturing
capability and avoids misclassifying a genuinely stocked product.

---

## 3. Screens and components changed

**Backend**
- `app/Models/Product.php` — `formulaOnly()`, `excludingFormulaOnly()`, `isFormulaOnly()`.
- `app/Domains/Inventory/Services/InventoryService.php` — overview/low stock/valuation exclude
  formulas; `ingredient_count` and formula flags on list rows; `stock_value = null` for formulas.
- `app/Domains/Reports/Services/InventoryReportService.php` — shared `scopedProducts()` and
  `lowStock()`/`valuation()` exclude formula-only records.
- `app/Http/Controllers/CompositionController.php` — ingredient search excludes formula products.
- `app/Http/Controllers/PurchaseController.php` — purchase picker excludes formula products.

**Frontend**
- `resources/js/Pages/inventory/ProductList.tsx` — formula view title, count, ingredient-line
  summary, stock value excludes formulas.
- `resources/js/Pages/inventory/components/ProductTable.tsx` — "Not stocked" + ingredient count,
  no purchase price/value for formulas.
- `resources/js/Pages/inventory/components/ProductCardView.tsx` — same wording on mobile cards.
- `resources/js/Pages/inventory/components/ProductFilters.tsx` — stock-status chips hidden in the
  formula view.
- `resources/js/Pages/inventory/ProductDetails.tsx` — "Not stocked" badge, disabled Adjust Stock,
  Stock Movements tab hidden for formulas.
- `resources/js/features/composition/CompositionBuilder.tsx` — ingredient/yield wording, removed
  "Formula type"/kind control copy, "Add at least one ingredient".
- `resources/js/features/composition/ComponentPicker.tsx` — ingredient wording.
- `resources/js/features/composition/ProductCompositionPanel.tsx` — version table drops the always
  identical "Kind" column; "Output" → "Yield".
- `resources/js/features/composition/FormulaCustomizationDialog.tsx` — "Per formula" column,
  ingredient stock wording.
- `resources/js/Pages/pos/SaleBill.tsx` — cart hint includes total formula count.
- `resources/js/Pages/sales/SaleDetail.tsx` — "Formula ingredients consumed" and ingredient copy.
- `resources/js/Pages/production/ProductionList.tsx` — "Ingredient Usage" button and manufacturing
  scope notice.

**Tests**
- `tests/Feature/Composition/FormulaScopeCleanupTest.php` — **new**, 5 tests.

---

## 4. Features hidden vs removed

| Item | Action |
|---|---|
| Manufacturing sidebar link | Already removed in P9; still absent |
| Production History navigation | Already removed in P9; still absent |
| Production routes (`/production*`) | **Retained**, admin-gated (`production.view` / `production.manage`) |
| Production pages/components | **Retained**, with an explanatory notice |
| Production tables, records, services | **Retained**, untouched |
| Component Usage URL (`/reports/component-usage`) | **Retained**; user-facing label is "Ingredient Usage" |
| Formula kind selector in builder | **Removed from UI**; backend kind stays `consumption` for new formulas |
| Optional-component toggle | **Removed in P9**; backend optional support retained |
| Stock status/price/value columns for formulas | **Hidden** in formula rows |
| Purchase picker formula rows | **Removed from the selector** (data retained) |
| Ingredient picker formula rows | **Removed from the selector** (data retained) |
| Code deleted | Only the unused `formatStock` import in `ProductTable.tsx` and the redundant "Kind" table column |

No backend capability, table, route or record was deleted.

---

## 5. Formula workflow simplifications

- Create: Formulas list → **New Formula** → product form (formula hand-off preselected) → save →
  Formula tab.
- Builder: formula label, yield (defaults to 1 piece), ingredients with default quantity/unit,
  wastage, notes, cost preview (admin), save.
- Kind is fixed to ingredient consumption in the UI; the backend still validates and stores it.
- Editing creates a new version; existing runs keep their snapshots (unchanged from P9).
- No manufacturing step, production order or finished-stock configuration is required.

---

## 6. POS and sales UI changes

- Formula search results keep the Formula badge and name/SKU/barcode matching.
- Customization dialog: "Per formula" column, restore defaults, per-formula explanation, and an
  explicit "does not reserve stock" note.
- Cart line: formula badge, ingredient list "per formula", plus "· N formulas" when the commercial
  quantity exceeds 1.
- Sale detail: "Formula ingredients consumed", formula name/version, `×N` quantity, per-formula and
  total ingredient amounts; costs are not returned in the payload.
- Receipts were not changed: they remain commercial-only.

---

## 7. Ingredient usage report

- Title/subtitle: "Ingredient Usage" / actual consumption net of recovery.
- Rows exclude retained manufacturing usage from the herbalist view.
- Summary: formula ingredient use, recovered, net use, usage lines, incomplete-cost warning.
- Aggregate table by ingredient and unit.
- Data still comes from immutable execution snapshots (`composition_run_items`), never current
  templates.
- No COGS, inventory or accounting semantics were changed by the rename.

---

## 8. Tests executed

```text
php artisan test tests/Feature/Composition/FormulaScopeCleanupTest.php
→ 5 passed (20 assertions)

php artisan test tests/Feature/Composition tests/Feature/Inventory tests/Feature/Products \
  tests/Feature/Purchases tests/Feature/Reports tests/Feature/Sales tests/Feature/Returns \
  tests/Feature/Security
→ 262 passed (1,231 assertions)

php artisan test
→ 369 passed, 9 failed (1,557 assertions)

npm run build
→ passed (tsc + vite)

vendor/bin/pint --test <changed PHP files>
→ passed (6 files)
```

The 9 failures are the same pre-existing missing Auth/Profile Inertia pages documented in
`P0.1-FINALIZATION.md`. P9 baseline was 364 passed; P10 adds 5 passing tests.

---

## 9. Known limitations

- **Formula list is a filtered inventory view**, not a separate module. It reuses `/inventory`
  with `composition=formula`.
- **Stock is hidden, not restructured.** `products.stock_quantity` still exists for formulas and
  remains `0`. Reports and pickers exclude it, but a raw query could still read it.
- **Mixed products stay physical.** A product with both an active consumption and an active
  assembly formula is treated as stocked. This is deliberate for retained manufacturing, but it
  means the "Not stocked" label does not appear for that case.
- **Manual stock adjustment API is not blocked for formulas.** The UI disables Adjust Stock, but
  `POST /inventory/adjust` still accepts any non-archived product id. P11 should verify whether
  that needs a server-side guard.
- **Ingredient search exclusion is by formula-only, not by "has any formula".** An assembly product
  can still be an ingredient, which is correct for manufacturing but worth confirming in P11.
- **Manufacturing routes stay directly reachable** for admins. They are gated by existing gates and
  now carry a scope notice.
- **No frontend test runner** exists; frontend verification is TypeScript + Vite plus HTTP contract
  tests.
- **Component-level naming** remains in the backend and database (`composition_run_items`,
  `component_product_id`). Renaming those is out of scope and unsafe without a migration.

---

## 10. Manual QA checklist

### Formula management
- [ ] Formula list opens and shows only ingredient formulas.
- [ ] Header shows formula count and ingredient-line count, not stock value.
- [ ] Stock-status chips are absent in the formula view.
- [ ] Formula rows show "Not stocked" and an ingredient count.
- [ ] Formula rows show no purchase price or stock value.
- [ ] Product detail shows "Not stocked", no Stock Movements tab, disabled Adjust Stock.
- [ ] Editing a formula creates a new version; version table has no "Kind" column.
- [ ] Ingredient picker says "ingredients" and does not list another formula.

### POS
- [ ] Search finds a formula by name, SKU and barcode, with the Formula badge.
- [ ] Selecting a formula opens customization instead of adding directly.
- [ ] Dialog shows Default and Per formula columns.
- [ ] Restore defaults, cancel, and confirm behave correctly.
- [ ] Cart shows one line, ingredient list "per formula", and "· N formulas" when N > 1.
- [ ] Checkout scales ingredient consumption by N.

### Sales
- [ ] Receipt shows one formula line and no ingredient breakdown.
- [ ] Sale detail shows "Formula ingredients consumed" with per-formula and total amounts.
- [ ] Historical sale shows its own snapshot after the formula is edited.

### Reporting
- [ ] Ingredient Usage shows actual consumption, recovery and net use.
- [ ] Ingredient aggregate row matches the sale lines.
- [ ] Stock report and valuation exclude formulas.
- [ ] Low-stock list and dashboard alerts exclude formulas.

### Regression
- [ ] Ordinary product sale, stock deduction and low-stock alert unchanged.
- [ ] Purchase picker lists normal ingredients but no formulas.
- [ ] Manufacturing pages still load for an admin and show the scope notice.

---

## 11. Remaining issues for P11

- Decide whether `POST /inventory/adjust` must reject formula-only products server-side.
- Verify that no report or export reads `products.stock_quantity` for formulas through a raw query.
- Confirm assembly products that are also consumption products behave correctly in POS and
  manufacturing after the "physical inventory" classification.
- Audit stock reconciliation across formula sales, including runtime overrides.
- Re-verify COGS/return integrity after the report-query exclusion change.
- Confirm backup/restore includes the unchanged composition and production tables.
