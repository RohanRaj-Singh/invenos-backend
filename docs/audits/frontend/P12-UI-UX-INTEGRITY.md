# P12 — Frontend UI/UX Integrity Audit & Remediation

**Date:** 2026-11-15
**Branch:** `feature/product-composition`
**HEAD:** `50be1bd911f8c0ad46a9232aac4396837f457843` (no commit)
**Status:** Implemented. Formula creation is now discoverable from four entry points; three routes that
returned HTTP 500 now resolve; navigation gaps closed.

---

## A. Executive summary

The backend was in good shape after P11; the frontend was not equally sound. Three classes of defect
were confirmed against the live routes, not by reading JSX:

1. **Formula creation was effectively hidden.** A "New Formula" button existed only *inside* the
   formula-filtered inventory view. The plain **Add Product** page offered no choice between a
   physical product and a formula, and no sidebar or dashboard entry point reached formula creation.
   This is the user-reported problem, and it was real.
2. **Three GET routes returned HTTP 500.** `/inventory/movements`, `/inventory/low-stock` and
   `/inventory/valuation` rendered page components that do not exist in `resources/js/Pages`.
   `/reports/product-ledger` threw `product_id is required` on a bare visit despite being a sidebar
   link. Two more report routes (`/reports/sales/by-customer`, `/reports/sales/top-products`)
   pointed at missing components.
3. **Reports and mobile navigation were incomplete.** The Reports landing page was unreachable from
   the sidebar, and eight implemented report pages had no link anywhere.

All confirmed defects are fixed. Backend financial and inventory behaviour was not touched.

---

## B. Feature inventory

| Feature | Backend | Route | Nav | Entry point | Functional | Status |
|---|---|---|---|---|---|---|
| Add physical product | Yes | `/inventory/add` | Yes (new) | Yes | Yes | Working |
| Add formula | Yes | `/inventory/add?formula=1` | Yes (new) | Yes | Yes | **Fixed** |
| Formula list | Yes | `/inventory?composition=formula` | Yes | Yes | Yes | Working |
| Product list / search / filters | Yes | `/inventory` | Yes | Yes | Yes | Working |
| Product detail + formula tab | Yes | `/inventory/product/{id}` | via list | Yes | Yes | Working |
| POS + formula customization | Yes | `/sales/pos` | Yes | Yes | Yes | Working |
| Sales list / detail / print | Yes | `/sales` | Yes | Yes | Yes | Working |
| Sale returns | Yes | `/sales/returns` | Yes | Yes | Yes | Working |
| Purchases | Yes | `/purchases` | Yes | Yes | Yes | Working |
| Reports landing | Yes | `/reports` | Yes (new) | Yes | Yes | **Fixed** |
| Stock ledger report | Yes | `/reports/stock/ledger` | Yes (new) | Yes | Yes | **Fixed** |
| Low stock report | Yes | `/reports/stock/low-stock` | Yes (new) | Yes | Yes | **Fixed** |
| Cash flow / balance sheet | Yes | `/reports/cash-flow`, `/balance-sheet` | Yes (new) | Yes | Yes | **Fixed** |
| Sales by customer | Yes | `/reports/sales/by-customer` | via reports | Yes | Yes | **Fixed (page created)** |
| Top products | Yes | `/reports/sales/top-products` | via reports | Yes | Yes | **Fixed (page created)** |
| Product ledger | Yes | `/reports/product-ledger` | Yes | Yes | Yes | **Fixed (crash + picker)** |
| Ingredient usage | Yes | `/reports/component-usage` | Yes | Yes | Yes | Working |
| Inventory movements page | Yes | `/inventory/movements` | — | legacy URL | Redirect | **Fixed (was 500)** |
| Inventory low stock page | Yes | `/inventory/low-stock` | — | legacy URL | Redirect | **Fixed (was 500)** |
| Inventory valuation page | Yes | `/inventory/valuation` | — | legacy URL | Redirect | **Fixed (was 500)** |
| Manufacturing | Yes | `/production` | intentionally hidden | — | Admin only | Intentionally hidden |
| `reports/financial` | Yes | **no route** | — | — | — | Dead code |

---

## C. Findings register

| ID | Severity | Area | Problem | Root cause | Fix | Status |
|---|---|---|---|---|---|---|
| P12-01 | High | Product Add | No way to choose Formula when creating; only a buried checkbox | `ProductForm` accepted `initialSetupFormula` but rendered no selector | Explicit Physical Product / Formula selector; heading changes to "Add Formula" | Fixed |
| P12-02 | High | Navigation | Formula creation absent from sidebar and dashboard | Only reachable via the formula view's own button | Sidebar Add Product/Add Formula submenu; dashboard New Formula action; list header button | Fixed |
| P12-03 | High | Inventory routes | `/inventory/movements` returned 500 | Controller rendered `inventory/Movements`, which does not exist | Redirect to the working Stock Ledger report | Fixed |
| P12-04 | High | Inventory routes | `/inventory/low-stock` returned 500 | Rendered missing `inventory/LowStock` | Redirect to `/reports/stock/low-stock` | Fixed |
| P12-05 | High | Inventory routes | `/inventory/valuation` returned 500 | Rendered missing `inventory/Valuation` | Redirect to `/reports/stock` | Fixed |
| P12-06 | High | Reports | `/reports/sales/by-customer` returned 500 | Rendered missing `reports/CustomerSales` | Created the page | Fixed |
| P12-07 | High | Reports | `/reports/sales/top-products` returned 500 | Rendered missing `reports/TopProducts` | Created the page | Fixed |
| P12-08 | High | Reports | `/reports/product-ledger` threw without `product_id` | Service threw before the page's own empty state could render | Controller renders empty state when no product; added a product picker | Fixed |
| P12-09 | Medium | Navigation | Reports landing unreachable; 8 report pages unlinked | Sidebar listed only 8 of 16 reports | Added "All Reports" plus every implemented report | Fixed |
| P12-10 | Medium | Mobile nav | No formula entry point on mobile | `moreItems` omitted it | Added Formulas to the mobile More sheet | Fixed |
| P12-11 | Medium | Formula form | Formula creation offered "Starting Quantity" and "Minimum Stock" | Stock block rendered unconditionally | Hidden in formula mode; payload forces `stock_quantity: 0` | Fixed |
| P12-12 | Low | Formula panel | Empty state said "consumable or assemblable" | P10 left manufacturing wording | Reworded to formula language | Fixed |
| P12-13 | Low | Code | `InventoryController::overview()` rendered a missing page | Unrouted leftover | Removed | Fixed |
| P12-14 | Low | Code | `reports/financial` renders missing `reports/FinancialReport` | Unrouted legacy method | Documented; left in place (unreachable) | Documented |

---

## D. Product creation

**Add Product** (`/inventory/add`) now opens with an explicit choice:

```text
What are you creating?
[ Physical Product ]  Bought, stocked and sold from inventory.
[ Formula ]           A recipe of ingredients, sold as one line.
```

Choosing **Formula**:

- retitles the page **Add Formula**;
- hides Starting Quantity, Minimum Stock and Allow Negative Stock;
- submits `stock_quantity: 0` regardless of leftover state;
- shows "You will be taken to the Formula tab right after saving";
- sends `_setup_formula`, so the existing `store()` redirect lands on the product's Formula tab.

Physical product creation is unchanged: same fields, same defaults, same validation.

The formula's ingredients cannot be authored before save because a composition needs a saved
product id. The hand-off keeps that constraint while making the intent explicit.

---

## E. Formula workflow

Entry points to formula creation, all first-class:

1. Sidebar → **Add Formula**
2. Sidebar → **Formulas** list → **New Formula**
3. Inventory list header → **New Formula** (always visible, even in the product view)
4. Dashboard → **New Formula** quick action

Management:
- **Formulas** lists only formula records (`/inventory?composition=formula`).
- Product detail → **Formula** tab → **New formula** / **Create formula**.
- Existing version history, editing and the single `CompositionBuilder` are reused; no second
  builder was introduced.

---

## F. POS UX

No changes were required — the flow was already complete and verified:

- search matches name, SKU and barcode, with a Formula badge;
- selecting a formula opens `FormulaCustomizationDialog` instead of adding a line;
- the dialog fixes ingredient identities, shows Default vs Per-formula, supports restore-defaults
  and cancel;
- the cart keeps one commercial line, lists ingredients "per formula" and shows "· N formulas";
- checkout sends `formula_composition_id`, overrides and optional ids, and resets state on success.

---

## G. Navigation

Added:
- Sidebar: **Add Product**, **Add Formula** under Inventory/Formulas.
- Sidebar: **All Reports** plus Stock Ledger, Low Stock, Cash Flow, Balance Sheet, Party Statement.
- Mobile More sheet: **Formulas**.
- Dashboard: **New Formula** quick action.
- Inventory list header: contextual **New Formula** / **View Products**.
- Reports landing: Stock Ledger, Low Stock, Product Ledger, Ingredient Usage, Sales by Customer,
  Top Products.

Deliberately **not** added:
- Manufacturing/Production (retained backend, intentionally hidden per P10).
- `/reports/financial` (no route).
- Duplicate links: each destination appears once per surface.

---

## H. Forms and dialogs

- `ProductForm` now derives its mode from one `formulaMode` flag instead of a second `setupFormula`
  state, removing a stale-state risk where the checkbox and payload could disagree.
- Validation message says "Formula name is required" when creating a formula.
- Formula mode sends `stock_quantity: 0` explicitly, so a value typed before switching modes cannot
  create stock for a template.
- Product ledger's empty state is now actionable (product picker) instead of a dead instruction.

---

## I. Responsive UI

- Mode selector uses a 1-column grid on mobile, 2 columns from `sm`.
- List header actions keep their labels hidden below `sm` but keep the icons and hit area (44px).
- Product picker on the ledger is capped at `max-w-sm` and centred.
- Sidebar sublinks indent under their parent without extra nesting on narrow widths.
- No horizontal overflow was introduced; existing tables retain their wrappers.

---

## J. Frontend/backend contracts

| Contract | Finding |
|---|---|
| `setup_formula` prop | Matches `request()->boolean('formula')`; verified both ways by test |
| `_setup_formula` payload | Handled by `ProductController::store`, redirects with `tab=composition` |
| `/reports/sales/by-customer` payload | `report.rows` (array) — page consumes it correctly |
| `/reports/sales/top-products` payload | `report.products` (array) — page consumes it correctly |
| `/reports/product-ledger` payload | `report.product` nullable — page previously assumed the controller guaranteed it |
| `products` prop on ledger | New; `{id, name, sku}` only, no costs |
| Stock mutation on formula create | Server has no formula check on `stock_quantity`, so the client now sends `0`; backend classification stays authoritative |

No backend validation was weakened.

---

## K. Tests

```text
php artisan test tests/Feature/Frontend
→ 5 passed (69 assertions)

php artisan test
→ 382 passed, 9 failed (1,644 assertions)

npm run build   (tsc && vite)
→ passed

vendor/bin/pint --test <changed PHP files>
→ passed
```

The 9 failures are the unchanged pre-existing missing Auth/Profile Inertia pages. P11 baseline was
377 passed; P12 adds 5.

Notable: the first version of my missing-component test used reflection over controller source and
**passed while three routes were still returning 500** — it did not resolve `Inertia::render` targets
the way the runtime does. I replaced it with a real HTTP probe, which then caught the defects
immediately. That is why the route list is explicit rather than inferred.

No browser automation is available in this environment; all verification is HTTP-level plus
TypeScript/Vite compilation. Visual and interactive behaviour is unverified — see L.

---

## L. Manual QA checklist

- [ ] Open **Add Product**; the Physical Product / Formula choice is visible and preselected to product.
- [ ] Choose **Formula**; title becomes "Add Formula", stock fields disappear.
- [ ] Save a formula; you land on the product page with the Formula tab open.
- [ ] Add ingredients; defaults, units, wastage and save work.
- [ ] Reopen the product; the formula and its version history are intact.
- [ ] From sidebar **Add Formula**, the same flow starts preselected.
- [ ] Dashboard **New Formula** opens the same flow.
- [ ] Inventory header **New Formula** works from the product list.
- [ ] **Formulas** list shows only formulas with ingredient counts and no stock value.
- [ ] Mobile: the More sheet lists Formulas and it navigates correctly.
- [ ] Visit `/inventory/movements`, `/inventory/low-stock`, `/inventory/valuation`; each lands on a
      working report instead of an error page.
- [ ] Sidebar → Reports → **All Reports** opens the landing page.
- [ ] Each report card opens its page without error.
- [ ] `/reports/sales/by-customer` and `/reports/sales/top-products` render with data.
- [ ] `/reports/product-ledger` shows the picker, and selecting a product loads its ledger.
- [ ] POS: search a formula, customize quantities, cancel, re-add, checkout.
- [ ] Sale detail shows the formula snapshot.
- [ ] Ordinary product create/edit still works, including stock fields.

---

## M. Remaining limitations

- **No browser automation.** Responsive behaviour, focus management and visual polish were reasoned
  from code and compiled, not clicked through.
- **`reports/FinancialReport` is still missing** and `ReportController::financial()` still renders it,
  but no route reaches that method, so it cannot 500. Left as dead code rather than deleting an
  unrouted legacy API.
- **Formula ingredients cannot be entered before the first save.** This is a data-model constraint
  (composition rows need a product id), worked around with the hand-off, not removed.
- **`inventory/*` legacy URLs now redirect** rather than render dedicated pages. Nothing linked to
  them, so no functionality was lost; the Stock Ledger and Low Stock reports are the canonical views.
- **No ESLint script** exists in this project, so linting was limited to `tsc` and Pint.
- The `Appearance`/Auth gap (9 failures) is unrelated and untouched.

---

## N. Git safety

- **Original branch:** `feature/product-composition`
- **Original HEAD:** `50be1bd911f8c0ad46a9232aac4396837f457843`
- **Final branch:** `feature/product-composition`
- **Final HEAD:** `50be1bd911f8c0ad46a9232aac4396837f457843`

Confirmed:
- No commits created.
- No Git history operations performed.
- No unrelated changes discarded; all pre-existing working-tree entries preserved.
- The `fashion` worktree was not touched (`variation/clothing-erp` @ `d0ff43e`).
