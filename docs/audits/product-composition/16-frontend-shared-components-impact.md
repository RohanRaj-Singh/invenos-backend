# 16 — Frontend Shared Components & UX

## 1. Component inventory

**VERIFIED.**

| Layer | Components |
|---|---|
| UI primitives (`components/ui`) | `button`, `card`, `input`, `table`, `badge`, `dialog`, `sheet` |
| Layout (`layouts`) | `AppLayout`, `Header`, `Sidebar`, `BottomNav` |
| Product | `ProductForm`, `ProductTable`, `ProductCardView`, `ProductFilters`, `StockBadge`, `ArchivedBadge`, `CompletionBadge`, `InventoryTimeline`, `AdjustStockDialog`, `UnitRelationEditor` |
| POS | `SaleBill`, `EditableQuantity`, `SearchBar`, `CartSummary`, `PaymentPanel`, `ConfirmDialog`, `ClearConfirmDialog`, `ReceiptDialog`, `CustomerSelect`, `MobileCartList`, `MobilePaymentDrawer`, `BillResponsiveWrapper` |
| Reports | `ReportDocumentTable`, `ReportSkeleton`, `DateRangeFilter`, `DateFilter`, report hooks |
| Shared | `use-flash-toasts`, `use-lifecycle-action`, `DateFilter`, `formatCurrency`, `ns` |
| Auth | `LoginPage`, `PermissionGuard`, `AccessDenied`, `AuthContext` |

## 2. Reusable for a Formula Builder

### Directly reusable

| Need | Component / utility |
|---|---|
| Modal | `components/ui/dialog` (Radix-based) |
| Side panel / mobile | `components/ui/sheet` |
| Table of components | `components/ui/table` (or the plain table pattern used in `ProductTable`) |
| Inputs | `components/ui/input` |
| Buttons | `components/ui/button` |
| Status chips | `components/ui/badge`, `StockChip` pattern in `ProductFilters` |
| Product search UI | `features/transactions/search/SearchBar` (add a mode without "add to cart") |
| Row add/remove | `UnitRelationEditor` row pattern |
| Quantity stepping | `domain/products/unit-stepping.ts`, `EditableQuantity` |
| Unit display | `lib/product-unit-display.ts`, `lib/units.ts` |
| Currency | `lib/format.ts` |
| Toasts | `sonner` (`toast`) |
| Empty state | `ProductTable` empty row, `ReportSkeleton` |
| Dirty guard | `beforeunload` pattern in `SaleBill.tsx` |

### Not reusable as-is

| Component | Why |
|---|---|
| `UnitRelationEditor` | It models one product's unit hierarchy, not multi-product components. Reuse the **row layout**, not the semantics. |
| `ProductForm` | It is the simple-product fast path; embedding a formula builder would slow it and complicate payloads. |
| `PermissionGuard` | Uses the in-memory mock auth store; not a real control. |
| `AuthContext` | Mock/demo data; not the server session. |
| `inventory-engine.ts` | Legacy client engine with a hardcoded date and deprecated packaging model; do not build on it. |

## 3. Formula Builder UX design

**PROPOSED.** A dedicated `features/composition/` folder:

```
FormulaBuilder.tsx        // container
ComponentPicker.tsx       // search + select product
ComponentRow.tsx          // unit, qty, optional/wastage, remove
ConsumptionEditor.tsx     // per-sale override dialog
CompositionSummary.tsx    // cost/availability preview
```

### Layout

- Header: product name, kind (`assembly` / `consumption`), active/version.
- Component list: product, unit, quantity per output unit, optional flag, wastage, line cost.
- Add component: searchable picker, only non-archived products, excludes self.
- Footer: total estimated cost, cost basis, save/cancel.
- Read-only mode for historical runs; editable only for the active template.

### States

| State | Treatment |
|---|---|
| Loading | skeleton rows (reuse `ReportSkeleton` style) |
| Empty | "No components yet — add the first component" |
| Error | inline row error + toast; keep user input |
| Large list | server-side search, paginate or cap at ~50 rows |
| Unsaved | `beforeunload` guard and a "discard changes?" dialog |
| Archived component | show a warning chip; block new saves |
| Cycle | block save with a clear message |

### Unit UX

- Default to the component's `base_unit_id`.
- If the user selects another compatible unit, convert on the client for display and send the
  base quantity plus the display unit.
- Reject incompatible units (weight vs volume vs count).
- Never allow a quantity of 0 or a negative number.

### Cost UX

- Show "estimated" when any component cost is `null`/legacy.
- Do not show cost to roles without cost visibility.
- Recalculate on quantity/unit change; do not save the preview cost.

## 4. POS consumption editor UX

- A modal/sheet triggered from a cart line labelled "Consumption".
- Rows: component name, default quantity × sold quantity, actual quantity input, unit.
- A "reset to default" action.
- A "remaining stock" indicator if the server supplies it.
- Save is local until the sale submit; the sale request carries overrides.
- Server errors (shortage) must keep the editor open with the offending rows highlighted.

## 5. Accessibility and interaction

**VERIFIED gaps:**

- Many icon-only buttons rely on `title` rather than `aria-label`.
- Form labels are not consistently linked with `htmlFor`/`id` (e.g. `ProductForm`).
- Dialog focus trapping is provided by Radix, but custom drawers may need review.
- Keyboard support exists in POS search and confirm (`Ctrl/Cmd+Enter`), but not in product forms
  beyond the global Enter handler.

**PROPOSED requirements for the builder:**

- labelled inputs;
- keyboard add/remove rows;
- focus the first field on open;
- Escape closes without saving (with confirmation if dirty);
- visible focus rings;
- touch targets >= 40px (existing POS uses 36–40px);
- do not rely on color alone for "archived"/"unavailable".

## 6. Mobile and responsive

- Layout already switches tables to cards at `sm`/`md`.
- `Sheet` is available for mobile.
- The builder should use a full-width sheet on mobile and a two-column layout on desktop.
- Long component lists need `overflow-y-auto` with a max height.

## 7. Findings summary

1. **VERIFIED:** the UI kit and interaction patterns are sufficient for a formula builder.
2. **VERIFIED:** `UnitRelationEditor` is the closest row pattern but not semantically reusable.
3. **VERIFIED:** several accessibility gaps exist (labels, icon-button names).
4. **PROPOSED:** new `features/composition` with `Dialog`/`Sheet`, server-side product search,
   and no changes to the simple product form.
