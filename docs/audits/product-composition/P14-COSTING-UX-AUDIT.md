# P14 — Formula Costing & UX Integrity Audit

**Date:** 2026-11-15
**Branch:** `feature/product-composition`
**HEAD:** `54f444be4616e6dfe6f405db07215d951f69b012` ("Composition final build")
**Working tree:** clean at audit time
**Status:** **Audit only. No implementation was performed.**

> **Scope of verification:** every finding below comes from reading the repository (routes,
> controllers, form requests, services, models, resources, React components, migrations, tests).
> No browser automation is available in this environment, so **no on-screen behaviour was manually
> clicked through**. Where a claim depends on runtime rendering, it is labelled as inferred from
> source and listed again in §12.

---

## 1. Executive summary

The formula engine is in much better shape than the UX suggests.

A complete costing engine already exists — `CompositionCostCalculator` — and it does the hard parts
correctly: per-formula-unit cost, unit conversion, wastage, nested compositions, cost-basis
confidence, and "unavailable rather than invented" costs. `CostResolver` resolves ingredient cost
with a documented precedence. Execution snapshots capture real costs, and P&L derives COGS from those
snapshots, so historical profit is stable.

The problem is **exposure, not capability**:

1. **Formula creation is a two-screen dance.** You must save a product, wait for a redirect, then
   land on the Formula tab. The data model forces a product first, but a single request could do
   both; today it is two.
2. **There is no way to view a formula.** The list is a filtered product list; the panel truncates
   ingredients at five; there is no detail surface even though the API already returns everything.
3. **Cost is visible only to admins, in only two places** (builder preview, Formula tab badge), and
   never alongside price, profit or margin.
4. **No pricing guidance exists at all.** No target margin, no recommended price, no margin figure
   anywhere in the product or formula UI. `sales.allow_price_override` is a dead setting.
5. **The POS is cost-blind.** The dialog shows quantities only. Notably, the composition API
   response *already contains* per-ingredient `unit_cost`/`line_cost` for salesmen — so cost data is
   being delivered to cashiers today without being shown or permission-gated.

Two findings are financial/confidentiality issues rather than UX polish, and are prioritised
accordingly in §10.

---

## 2. Current workflow

### 2.1 Creating a formula

```text
Salesman/Admin
  └─ Sidebar → Add Formula  (or Dashboard → New Formula, or Formulas list → New Formula)
       └─ GET /inventory/add?formula=1
            └─ CreateProduct → ProductForm (formulaMode preselected)
                 ├─ Name, Selling Price, Unit, Category
                 ├─ [More Options] Barcode, SKU, Description   (stock fields hidden)
                 └─ Save → POST /inventory  (payload + _setup_formula: true)
                      └─ ProductController::store
                           ├─ ProductService::create(...)         ← product committed
                           └─ redirect → /inventory/product/{id}?tab=composition
                                └─ ProductDetails (Formula tab open)
                                     └─ ProductCompositionPanel → "Create formula"
                                          └─ CompositionBuilder (side sheet)
                                               ├─ Formula label, Yield qty/unit
                                               ├─ Ingredients × (qty, unit, wastage)
                                               ├─ Preview cost  → POST .../composition/preview
                                               └─ Save → POST .../composition
```

Verified in: `ProductController::create/store`, `CreateProduct.tsx`, `ProductForm.tsx`,
`ProductDetails.tsx`, `ProductCompositionPanel.tsx`, `CompositionBuilder.tsx`,
`CompositionController::preview/store`, `routes/web.php`.

**Two commits, two screens, three interactions minimum** to reach a sellable formula.

### 2.2 Selling a formula at POS

```text
POS search → formula hit (Formula badge) → FormulaCustomizationDialog
  ├─ shows: ingredient name, Default qty, Per-formula qty, Unit, current stock (P13)
  └─ NO cost, NO price, NO profit, NO margin
→ add to cart (one commercial line)
→ Record Sale → POST /sales
     └─ SaleService → CompositionExecutionService
          ├─ preflight (policy-aware since P13)
          ├─ consumption + run snapshot (unit_cost, total_cost, template version)
          └─ sale_items.cost_price / cost_complete
```

Verified in: `SaleBill.tsx`, `FormulaCustomizationDialog.tsx`, `SaleService.php`,
`CompositionExecutionService.php`.

### 2.3 Where cost appears today

| Surface | Shows cost? | Gate | Evidence |
|---|---|---|---|
| Composition builder | Yes — per-line, unit, total, basis | `products.composition.view` | `CompositionBuilder` "Preview cost" |
| Formula tab (product page) | Aggregate badge only | `canViewCost = isAdmin` | `ProductCompositionPanel` |
| Formula tab version history | Aggregate, **recomputed live** | `canViewCost` | `fetchCompositions` → `estimateComposition` |
| Formula list | No | — | `ProductTable` shows selling price only |
| POS customization dialog | **No** | — | zero cost references in the file |
| P&L / reports | Yes, from snapshots | — | `SalesReportService::profit()` |

---

## 3. Findings

| ID | Area | Finding | Priority |
|---|---|---|---|
| F1 | POS | Composition API returns `unit_cost`/`line_cost`/`estimated_cost` to any user with `view`, which includes **salesmen**, while the UI hides cost from them. Cost data is in the browser payload today. | **P0** |
| F2 | POS | No cost/price/profit/margin in the customization dialog. Cashier can sell below cost unknowingly. | **P2** |
| F3 | Costing | Version-history "Cost" is recomputed with **current** ingredient costs, so old versions silently change value. Presented in a history table without qualification. | **P0/P2** |
| F4 | Creation | Formula requires save → redirect → open builder. Two commits; no combined request. | **P1** |
| F5 | Viewing | No formula detail surface. Ingredients truncated to 5 on the card; no per-ingredient cost, wastage or notes view outside the edit sheet. | **P1** |
| F6 | Creation | "Your Cost (Rs.)" is shown for formulas and writes `default_purchase_cost`, which is meaningless for a recipe and unrelated to its real cost. | **P1** |
| F7 | Pricing | No target margin, no recommended price, no margin figure anywhere. | **P2** |
| F8 | Pricing | `sales.allow_price_override` is seeded and displayed but **never read** — overrides are always allowed. | **P3** |
| F9 | Product list | Formula rows show selling price but not cost or margin, so pricing decisions need the product page. | **P3** |
| F10 | Reports | No per-formula profitability view; P&L is bill-wise only. Ingredient Usage covers consumption, not margin. | **P3** |

### F1 — ingredient cost reaches cashiers (confidentiality)

`ProductCompositionPolicy::view` allows `admin` **and** `salesman`. `ProductCompositionItemResource`
returns `unit_cost` and `line_cost`; `ProductCompositionResource` returns `estimated_cost`,
`estimated_unit_cost` and `cost_basis`. The POS dialog calls
`fetchActiveComposition()` on open, so this payload reaches the cashier's browser.

The UI hides cost (`canViewCost={isAdmin}`), but hiding is not gating. **The API is the boundary and
it currently permits it.**

**Empirically confirmed** with a temporary probe (since removed): an authenticated `salesman`
calling `GET /inventory/product/{id}/composition?kind=consumption` received HTTP 200 with:

```text
estimated_cost        = 25
estimated_unit_cost   = 2.5
cost_basis            = exact
items[0].unit_cost    = 2.5
items[0].line_cost    = 25
```

Not a P14 regression — but P14 is the phase that proposes putting cost *into* the POS, so this must
be settled first, not accidentally widened.

### F3 — historical version cost is recomputed

`CompositionController::index` maps every version through
`(new ProductCompositionResource($c, $this->costs->estimateComposition($c)))`. `estimateComposition`
resolves `CostResolver::unitCost()` **now**. So the "Cost" column in Version history shows what the
old recipe would cost *at today's ingredient prices*. This is a legitimate "current replacement
cost", but it is displayed as if it were that version's cost. Nothing is stored.

Execution runs do snapshot real costs (`composition_run_items.unit_cost/total_cost`), so **sales are
historically accurate**; only the template-level version view is live-recomputed.

### F6 — misleading cost field on formula creation

`ProductForm` shows "Your Cost (Rs.)" for both modes and posts `default_purchase_cost`. For a formula
the real cost is derived from ingredients; this field suggests a meaningless purchase price and can
later surface through `CostResolver` if the product is used as an ingredient.

---

## 4. Root causes

| Finding | Root cause |
|---|---|
| F1 | Cost is embedded in the composition presentation resource, and `view` was scoped to "who can see formulas" rather than "who can see cost". Cost was never separated from structure. |
| F2 | POS was built for quantity customization; pricing feedback was never in scope. The data needed is already present (F1), which is why this is cheap to add — once F1 is fixed. |
| F3 | Costing is deliberately dynamic (no stored template cost). That is good for the *current* estimate and bad for anything labelled "history". The version table reused the same live estimate without relabelling. |
| F4 | `product_compositions.product_id` is a real FK, and `CompositionService::save()` needs a product id. The frontend expresses that as two screens instead of one transaction. |
| F5 | The Formula tab was designed as a management panel, not a read view; the API's `show` endpoint already returns a full description, but no UI consumes it. |
| F7 | No pricing domain exists. Margin appears only *after the fact* in P&L (`margin_pct` per bill). |
| F8 | Setting added to the schema and Settings UI, never wired to POS or `SaleService`. |

---

## 5. Cost calculation analysis

### 5.1 What exists (and is correct)

`CompositionCostCalculator::estimateItems()`:

```text
for each ingredient:
    unitCost   = CostResolver::unitCost(ingredient)      // avg → opening → latest purchase/base → legacy/base
    effective  = quantityBase × (1 + wastagePct/100)     // wastage IS included
    lineCost   = effective × unitCost                    // null if cost unknown
total        = Σ lineCost        (null if ANY line is null)
unitCost     = total / output_quantity_base             // per formula unit, in base units
cost_basis   = worst of exact | estimated | unavailable
```

- **Unit conversion**: yes — output quantity is converted into the product's base unit; component
  quantities are stored in the component's base unit, and `unit_cost` is per base unit. Display
  quantities are converted for presentation only.
- **Wastage**: included, at both estimate and execution time.
- **Nested compositions**: recursed with cycle protection; a nested template's unit cost is used when
  the child product has no direct cost.
- **Missing cost**: `null`, never `0`. `complete` and `cost_basis` expose confidence.

### 5.2 Answers to Part 3 questions

| # | Question | Answer |
|---|---|---|
| 1 | Auto-calculated anywhere? | Yes — `CompositionCostCalculator`, used by three endpoints. |
| 2 | Ingredient cost per formula unit? | Yes — `unit_cost`, with `total_cost` for the whole yield. |
| 3 | Unit conversion? | Yes, in both directions. |
| 4 | Wastage in cost? | Yes (`effective_quantity`). |
| 5 | Updates when ingredient cost changes? | Yes, automatically — it is computed on read. |
| 6 | Stored or dynamic? | **Dynamic.** `product_compositions` has no cost columns (verified in the migration). |
| 7 | Can product cost go stale? | The *product's* `average_cost`/`last_purchase_cost` can be stale or absent; the formula estimate reflects whatever `CostResolver` can find, and says "unavailable" otherwise. |
| 8 | Are the four notions distinguished? | **Yes, structurally**: current estimate (dynamic), template default ingredient cost (same dynamic result), actual adjusted cost at checkout (`composition_run_items` snapshot), historical sale COGS (`sale_items.cost_price` + snapshot). The UI only surfaces the first. |
| 9 | Reflected in reports? | Yes for sales: P&L uses snapshots, with completeness flags. No per-formula profitability report. |

### 5.3 Recommendation

**Do not add a second costing path.** Reuse `CompositionCostCalculator` everywhere cost is needed.

- Keep the **current estimate dynamic** — it is the correct semantic for "what would this cost now".
- Do **not** store a template cost unless a historical template-cost view is wanted; if it is, store
  it as an explicit *snapshot at version creation* and label it as such. Never present a live
  recomputation as history.
- Any new preview (POS adjusted cost, pricing guidance) must be **server-side**, reusing the same
  calculator with the runtime quantities, so POS preview and checkout COGS cannot diverge.

---

## 6. Pricing analysis

### 6.1 Today

- A formula's selling price is `selling_units.sale_price`, edited in the product form
  ("Selling Price"). `ProductCompositionPanel` reads it back as
  `product.default_price` and says "change it from Edit Product".
- Nothing ties price to cost. There is no margin, markup, or recommended price anywhere in
  application code (the only `margin` matches in the repo are CSS).
- `margin_pct` **is** computed per bill in P&L — so margin is observable retrospectively, never
  prospectively.
- `sales.allow_price_override` is dead (F8).

### 6.2 Recommended model

Use **gross margin**, not markup, and state it explicitly in the UI so the two are never conflated.

```text
gross margin  m = (price − cost) / price
markup        k = (price − cost) / cost

recommended price = cost / (1 − m)        // m < 1
```

Worked example (matches the brief): cost 300, target 40% → 300 / 0.6 = **500**.
The same 500 at markup would be cost × 1.4 = 420 — so the distinction is material.

**Minimum configuration:** one optional setting, e.g. `sales.target_margin_pct` (0–95, default unset).
Defaulting it to a number without a business decision would be inventing policy, so it should ship
**unset**, with the UI prompting for a margin per-session or per-formula until configured.

Where to put it: `SettingService::defaults()['sales']` alongside `default_discount`, surfaced in
`settings/Sales.tsx` using the existing `SettingsRow` pattern. No new table.

### 6.3 Distinguish clearly in UI

- **Product cost** (`average_cost`/purchase costs) is a *manual/observed* inventory input.
- **Formula cost** is a *derived* value. It must be visually read-only and labelled "calculated
  from ingredients", never editable.

---

## 7. POS cost-preview feasibility

| # | Question | Answer |
|---|---|---|
| 1 | Adjusted cost calculable before checkout? | Yes — same calculator, runtime quantities. Needs a small server endpoint; the existing `preview` takes a *template* payload (save shape), not runtime overrides. |
| 2 | Can the frontend get ingredient cost safely? | It already does (F1) — but that is a leak, not a design. Should be permission-gated. |
| 3 | Server-side calculation? | **Yes, mandatory.** Never trust client cost/profit. |
| 4 | Reuse existing costing service? | Yes — `CompositionCostCalculator`, no duplication. |
| 5 | Accurate across units? | Yes, if the endpoint converts display units to base before costing (the calculator already does). |
| 6 | Does wastage affect it? | Yes, via `effective_quantity`. |
| 7 | Quantity scaling? | Yes — multiply runtime per-formula quantity by commercial quantity (already the P9/P13 semantics). |
| 8 | Does preview equal checkout COGS? | Only if the same calculator runs on the same inputs at the same moment. Prices can move between preview and checkout; the preview must be presented as an estimate, and checkout remains authoritative. |
| 9 | Below-cost warning? | Possible once adjusted cost and selling price are both known client-side (price is already in the cart; cost would come from the new endpoint). |
| 10 | Recommended price without changing defaults? | Yes — a pure calculation; it never writes to the template. |

**Constraints honoured:** identities fixed, template defaults untouched, no inventory mutation, no
pre-checkout deduction, checkout authoritative, snapshots immutable, no client-trusted money.

### Blocking prerequisite

F1 must be resolved **before or with** this feature. Today a salesman can already read ingredient
costs from the network tab. Shipping a visible cost panel to cashiers without a decision would make
that intentional by accident.

Recommended: a dedicated permission, e.g. `products.composition.cost` (admin by default), enforced
in the resource (omit cost keys) rather than only in the UI.

---

## 8. Proposed UX

### 8.1 Creation — one screen, one decision

Keep the P12 Physical/Formula selector, then make the formula step optional-inline:

```text
Add Formula
  Name, Selling Price, Unit, Category
  [ ] Add ingredients now            ← default on
       ├─ ingredient rows (search, qty, unit, wastage)   ← reuses ComponentPicker + builder rows
       └─ live "Estimated cost: Rs. X · Margin at this price: Y%"
  Save  → one request → product + composition created atomically
```

`POST /inventory` gains an optional `composition` payload; `ProductController::store` wraps product
creation **and** `CompositionService::save()` in one `DB::transaction`. Any validation failure in the
composition rolls the product back, so there is never a half-created formula. The existing two-step
path stays available (`Add formula later`).

Effort is moderate but contained: one request class change, one controller transaction, reuse the
builder's row component. **No new tables.**

### 8.2 Viewing — read-only drawer

Add a **View** action on each formula card and on formula rows in the list, opening a right-side
`Sheet` (the project's established pattern — `CompositionBuilder` and `ComponentPicker` already use
`Sheet`).

Contents: name, version, active state, yield, created/updated/by, notes, full ingredient table
(quantity, unit, wastage, per-line cost), total + per-formula-unit cost with basis badge, and the
current selling price with derived margin. Actions: **New version** (existing builder), **Deactivate**.
Reuses `GET /inventory/product/{product}/composition/{composition}` — already returns all of it.

Why a drawer rather than a page: the data is already fetched into the panel, no new route, no
duplicated management UI, and it matches how composition editing already opens.

Also remove the 5-ingredient truncation inside the drawer (keep it on the card, where it saves space).

### 8.3 Pricing panel (formula-level)

Inside the builder and the detail drawer:

```text
Estimated cost            Rs. 300        [exact | estimated | incomplete]
Target margin             [ 40 ] %       (remembered per business if configured)
Recommended price         Rs. 500
Selling price             Rs. 500  →     Margin 40.0% · Profit Rs. 200
```

Selling price stays the single source of truth (`selling_units.sale_price`); "recommended" is
advisory and never auto-applied without an explicit click.

### 8.4 POS — adjusted cost (gated)

Inside `FormulaCustomizationDialog`, when the user has cost permission:

```text
                     Default      Per formula     This sale
Ingredient          10 g         20 g            40 g (×2)
--------------------------------------------------------------
Estimated cost      Rs. 300      Rs. 420         Rs. 840
Selling price                                    Rs. 1,000
Estimated profit                                 Rs. 160
Estimated margin                                 16.0%
[ ⚠ Selling below cost ]        ← only when profit < 0
```

Values come from a new server endpoint; the client renders, never computes money.

---

## 9. Architecture recommendations

| # | Proposal | Reuse | New surface |
|---|---|---|---|
| 1 | Combined product+formula creation | `ProductService`, `CompositionService` | Optional `composition` key on `POST /inventory`, one transaction |
| 2 | Formula detail drawer | `ProductCompositionResource`, `show` endpoint | Frontend only |
| 3 | Central costing | **Already exists** `CompositionCostCalculator` | None — do not duplicate |
| 4 | Runtime cost preview | `CompositionCostCalculator` + `CostResolver` | `GET .../composition/cost-preview?quantity&overrides[]` |
| 5 | Target margin | `SettingService` defaults + `settings/Sales.tsx` | `sales.target_margin_pct` (nullable) |
| 6 | Recommended price | Pure server function `cost/(1−m)` | Expose via #4 payload; no storage |
| 7 | POS adjusted cost | #4 | Dialog panel, permission-gated |
| 8 | Below-cost warning | #4 + cart price | Dialog badge |
| 9 | Cost permission | `ProductCompositionPolicy` | `products.composition.cost`, omit cost keys server-side |
| 10 | Version-cost honesty | — | Relabel live figure as "current cost"; optionally snapshot at version creation |

**No new database tables are required.** The only schema-level options are:
- `sales.target_margin_pct` → belongs in the existing JSON `settings.values`, not a new column.
- a stored template cost → only if a true historical template cost is required (recommended: not yet).

---

## 10. Prioritized roadmap

### P0 — financial correctness & confidentiality

1. **F1** Gate cost in the API behind `products.composition.cost`. Omit `unit_cost`/`line_cost`/
   `estimated_*`/`cost_basis` from resources when the viewer lacks it; stop relying on `canViewCost`.
2. **F3** Stop presenting recomputed cost as historical. Either label the column "current cost" or
   compute nothing for inactive versions. Do not ship a "history" table that changes over time.
3. Any cost/profit the POS displays must be **server-computed**; reject client-submitted cost fields.

### P1 — critical workflow

4. **F4** Combined product+formula creation in one transaction (optional composition payload).
5. **F5** Formula detail drawer with full ingredients, cost and price.
6. **F6** Hide "Your Cost" in formula mode (or relabel to "ingredient cost is calculated").

### P2 — pricing / costing UX

7. **F7** `sales.target_margin_pct` (nullable) + recommended-price panel in builder/drawer.
8. **F2** POS adjusted-cost panel (after P0 item 1).
9. Below-cost warning in the POS dialog.

### P3 — polish

10. **F9** Cost/margin indicators on formula rows in the list.
11. **F8** Either wire `allow_price_override` to the POS and `SaleService`, or remove it.
12. **F10** Per-formula profitability view (extend P&L with a formula grouping) — only if wanted.

---

## 11. Regression test requirements

Any implementation must add tests for:

**Costing correctness**
- Estimated cost equals Σ(effective qty × ingredient unit cost) including wastage.
- Unit conversion: a formula yielding 250 g with a 5 g ingredient costs the same per gram as one
  yielding 1000 g with 20 g.
- Missing ingredient cost → `total_cost` null and `complete: false`, never `0`.
- Nested composition cost recursion and cycle rejection.
- Cost estimate changes when an ingredient's purchase cost changes.

**Preview vs checkout**
- Server-computed preview matches the run snapshot for identical inputs.
- Preview never writes inventory, never creates a run, never mutates the template.
- Runtime override scaling: 2 formulas × 20 g previews and charges 40 g.

**Authorization**
- A salesman without `products.composition.cost` receives **no** cost keys from
  `composition`, `compositions` and the cost-preview endpoint.
- An admin does.

**Atomicity (if P1 #4 ships)**
- Invalid composition → product is not persisted (full rollback).
- Valid product+formula → both persist; formula is active v1.

**Pricing**
- `cost/(1−m)` boundary behaviour: `m = 0` → cost; `m → 1` → guard against divide-by-zero.
- Margin vs markup are not interchanged in the payload naming.

**Historical stability**
- Editing ingredient costs after a sale does not change that sale's COGS or margin (already covered
  by `CogsConsistencyTest`; must remain green).

---

## 12. Remaining uncertainties

1. **No browser testing.** Dialog layout, drawer ergonomics, mobile behaviour and keyboard flow were
   not exercised. All UI claims are from source.
2. **Business intent for margin.** Whether a target margin should be global, per-category or
   per-formula is a product decision. This audit proposes global-with-per-formula-override but does
   not assume a number.
3. **Whether template cost should be snapshotted.** If the business wants "what did this recipe cost
   when we created version 2", that requires storing it. Not recommended until asked.
4. **Whether cashiers should see cost at all.** This is a policy decision; the audit assumes the
   safer default (deny) and makes it configurable via permission.
5. **`allow_price_override`.** Unknown whether it is dead by oversight or by design; recommend
   confirming before wiring or deleting.
6. **Nested-formula ingredients.** Formula-only products are excluded from the ingredient picker
   (P10), so nesting is currently reachable only via pre-existing data. Cost recursion handles it;
   the UI path is intentionally unavailable.

---

## Files modified

**None.** This phase is audit-only.

## Git status at completion

- Branch: `feature/product-composition` (confirmed correct)
- Original HEAD: `54f444be4616e6dfe6f405db07215d951f69b012`
- Working tree: clean before and after (`git status --short --branch` shows no entries beyond the
  branch line)
- No commit, reset, clean, stash, merge, rebase, branch switch or history rewrite was performed.
- `fashion` worktree untouched (`variation/clothing-erp` @ `d0ff43e`).
