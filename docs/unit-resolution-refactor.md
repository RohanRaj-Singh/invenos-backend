# Product Unit Resolution — Centralisation Plan

> Centralize all unit resolution, formatting, and display into a single source of truth.
> No component, service, or controller should implement its own unit resolution.
> No business logic should perform string comparisons on unit IDs or measurement types.

## Architectural Rule

> **The backend is the single source of truth for unit business logic.**
> The frontend only formats and renders what the backend provides.
> Frontend helpers are presentation utilities, not business-rule engines.

| Layer | Owns | Does Not Own |
|-------|------|-------------|
| **Backend** (`ProductUnitService`) | Unit resolution, measurement rules, selling/purchase unit resolution, conversion rules, display names, labels | — |
| **Frontend** (`product-unit-display.ts`) | Formatting, pluralization, joining quantity + unit, display presentation | Business rules, `measurementType` checks, string comparisons on unit IDs, unit resolution |
| **API Resources** | Expose `base_unit_name`, `selling_unit_name`, `display_unit` as resolved strings | React should not need to resolve unit IDs |

---

## Findings from Audit

**12 architectural problems** were identified across the full codebase (PHP + TypeScript).

### Backend (PHP)

| # | Problem | Files | Impact |
|---|---------|-------|--------|
| 1 | Two duplicate `resolveUnitName()` methods with slightly different mappings | `ProductService.php:240-255`, `PurchaseService.php:182-193` | ProductService shows `"Kilogram (kg)"` while PurchaseService shows `"Kilogram"` |
| 2 | No shared unit registry on the backend | None | Every service implements its own unit resolution |
| 3 | Hardcoded `'Unit'` fallbacks in services | `SaleService.php:117`, `SaleReturnService.php:57`, `PurchaseReturnService.php:57` | Silent fallback when packaging name is missing |
| 4 | `packaging_name` not validated in clinic controller (fixed but shows pattern) | `ClinicController.php` | Missing validation rules lead to `'Unit'` defaults |

### Frontend (TypeScript/React)

| # | Problem | Files | Impact |
|---|---------|-------|--------|
| 5 | Custom unit option logic **duplicated 6×** — same `measurementType` branching | `sale.ts`, `purchase.ts`, `purchase-return.ts`, `SaleBill.tsx`, `_SaleBillPrototype.tsx`, `AddMedicineDialog.tsx` | Bug fixes must be repeated in 6 places |
| 6 | Hardcoded `'Unit'` / `'unit'` / `'units'` fallbacks in 9 display locations | `SalePrint.tsx:23`, `PurchasePrint.tsx:23`, `VisitDetail.tsx:181`, `PrescriptionsList.tsx:123`, `MobileCartList.tsx:132`, `_ProductFormPrototype.tsx:667-670` | Same product shows "Unit" in one page and "Box" in another |
| 7 | `getStockDisplay` uses legacy `product.baseUnit` string instead of `getUnit()` | `inventory-engine.ts:99` | Bypasses the unit registry |
| 8 | Purchase strategies use raw `base_unit_id` as display name | `purchase.ts:114` | Shows `"piece"` instead of `"Piece"` |
| 9 | Three different fallback strings across components | `'Unit'` / `'unit'` / `'units'` | Inconsistent capitalization and pluralization |
| 10 | `getCustomMeasurementOptions` existed in 2 versions — one using `convert()` and one using hardcoded `=== 'kg'` | `SaleBill.tsx:371-406`, `AddMedicineDialog.tsx:57-75` | Fixed in clinic version but sale version still used hardcoded checks |
| 11 | `measurementType` branching duplicated across domain strategies | `sale.ts`, `purchase.ts`, `purchase-return.ts` | Same logic in three strategy files |
| 12 | No shared unit display component | Every page has inline `getUnit(id)?.name || id || 'Unit'` | Every page has its own fallback chain |

---

## Proposed Architecture

### Backend: `ProductUnitService` (Domain Service)

Located at `app/Domains/Products/Services/ProductUnitService.php` — inside the Product domain, not a global helper.

```php
namespace App\Domains\Products\Services;

class ProductUnitService
{
    /**
     * Resolve any unit ID to its display name.
     * E.g. 'kg' → 'Kilogram (kg)', 'piece' → 'Piece', 'capsule' → 'Capsule'
     * This is the only place in the backend that maps unit IDs to display strings.
     */
    public function resolveDisplayUnit(?string $unitId): string

    /**
     * Resolve a selling unit for display.
     * Returns: { name, unit_id, display_name, base_unit_name, quantity }
     * Every page that shows a selling unit calls this.
     */
    public function resolveSellingUnit(SellingUnit $su): array

    /**
     * Resolve the purchase unit for a product.
     * Returns: { name, unit_id, display_name }
     */
    public function resolvePurchaseUnit(Product $product): array

    /**
     * Format a quantity with its unit for display.
     * E.g. formatQuantity(2.5, 'kg') → "2.5 Kilogram (kg)"
     * Every page that shows a quantity + unit calls this.
     */
    public function formatQuantity(float $quantity, ?string $unitId): string

    /**
     * Format stock quantity for display.
     * E.g. formatStock(150, 'capsule') → "150 Capsules"
     * Every inventory/stock display calls this.
     */
    public function formatStock(float $quantity, ?string $unitId): string

    /**
     * Get custom measurement options for a base unit.
     * SINGLE source — replaces the 6× duplicated branching logic.
     * No frontend code ever checks measurementType.
     */
    public function getMeasurementOptions(string $baseUnitId): array

    /**
     * Get all unit definitions (for dropdowns, settings).
     */
    public function getUnitOptions(): array
}
```

**No string comparisons.** The service encapsulates all `if (unit === 'kg')` logic internally. Callers never check `measurementType` or compare unit ID strings.

This replaces `ProductService::resolveUnitName()` and `PurchaseService::resolveUnitName()`.

### API Resources: Include Resolved Unit Info

Every API response that includes unit information should expose resolved display names so the frontend can render directly:

```json
{
  "id": 1,
  "name": "Amoxil 250mg",
  "base_unit_id": "capsule",
  "base_unit_name": "Capsule",
  "selling_units": [
    {
      "id": 1,
      "name": "Strip",
      "quantity": 10,
      "sale_price": 150,
      "display_name": "Strip",
      "base_unit_name": "Capsule"
    }
  ]
}
```

This is done by:
1. `ProductResource` — calls `$this->productUnitService->resolveDisplayUnit($this->base_unit_id)` for `base_unit_name`
2. `SellingUnitResource` — calls `resolveSellingUnit($this)` for `display_name`, `base_unit_name`
3. All DTOs include resolved unit names where applicable

### Frontend: Presentation-Only Helpers

`resources/js/lib/product-unit-display.ts` — **No business logic.** Only formatting and presentation.

```typescript
/**
 * Format a quantity + unit for display.
 * E.g. formatWithUnit(2.5, 'Kilogram (kg)') → "2.5 Kilogram (kg)"
 * Pure formatting — doesn't resolve anything.
 */
export function formatWithUnit(quantity: number, unitName: string | null | undefined): string

/**
 * Format stock quantity.
 * E.g. formatStock(150, 'Capsule') → "150 Capsules"
 * Handles pluralization only.
 */
export function formatStock(quantity: number, unitName: string | null | undefined): string

/**
 * Plurale a unit name.
 * E.g. pluralize(2, 'Capsule') → 'Capsules'
 */
export function pluralize(quantity: number, unitName: string): string
```

**What the frontend does NOT do:**
- ❌ No `getUnit(id)` calls (units are already resolved by API)
- ❌ No `measurementType` checks
- ❌ No `=== 'kg'` or `=== 'piece'` string comparisons
- ❌ No custom measurement option generation (comes from backend API)
- ❌ No unit resolution logic whatsoever

React components become **completely dumb** — they receive `base_unit_name`, `selling_unit_name`, `display_name` from the API response and simply render them via `formatWithUnit()` / `formatStock()`.

---

## Implementation Phases

### Phase 1: Backend `ProductUnitService`

| Step | File | Change |
|------|------|--------|
| 1.1 | `app/Domains/Products/Services/ProductUnitService.php` | **New** — `resolveDisplayUnit()`, `resolveSellingUnit()`, `resolvePurchaseUnit()`, `formatQuantity()`, `formatStock()`, `getMeasurementOptions()`, `getUnitOptions()` |
| 1.2 | `app/Domains/Products/Services/ProductService.php` | Replace `resolveUnitName()` with `$this->productUnitService->resolveDisplayUnit()` |
| 1.3 | `app/Domains/Purchasing/Services/PurchaseService.php` | Replace `resolveUnitName()` with `$this->productUnitService->resolveDisplayUnit()` |
| 1.4 | `app/Domains/Sales/Services/SaleService.php` | Replace `?? 'Unit'` with `$this->productUnitService->resolveDisplayUnit($product->base_unit_id)` |
| 1.5 | `app/Domains/Sales/Services/SaleReturnService.php` | Replace hardcoded `'Unit'` with `resolveDisplayUnit()` |
| 1.6 | `app/Domains/Purchasing/Services/PurchaseReturnService.php` | Replace hardcoded `'Unit'` with `resolveDisplayUnit()` |
| 1.7 | Run existing tests | Verify no regression |

### Phase 2: API Resources + Resolved Names

| Step | File | Change |
|------|------|--------|
| 2.1 | `app/Http/Resources/ProductResource.php` | **New** — includes `base_unit_name` resolved via `ProductUnitService` |
| 2.2 | `app/Http/Resources/SellingUnitResource.php` | **New** — includes `display_name`, `base_unit_name` |
| 2.3 | Update controllers to use resources | Where applicable |

### Phase 3: Frontend Presentation Helpers

| Step | File | Change |
|------|------|--------|
| 3.1 | `resources/js/lib/product-unit-display.ts` | **New** — `formatWithUnit(quantity, unitName)`, `formatStock(quantity, unitName)`, `pluralize(quantity, unitName)` |
| 3.2 | `resources/js/lib/inventory-engine.ts` | Replace `getStockDisplay()` with `formatStock()` from new helper |
| 3.3 | `resources/js/lib/product-adapter.ts` | Remove inline unit resolution — rely on API-provided names |

### Phase 4: Refactor Backend Consumers

| File | Current | After |
|------|---------|-------|
| `ProductService.php:240-255` | Own `resolveUnitName()` | `$this->productUnitService->resolveDisplayUnit()` |
| `PurchaseService.php:182-193` | Own `resolveUnitName()` | `$this->productUnitService->resolveDisplayUnit()` |
| `SaleService.php:117` | `?? 'Unit'` | `$this->productUnitService->resolveDisplayUnit($product->base_unit_id)` |
| `SaleReturnService.php:57` | Hardcoded `'Unit'` | `resolveDisplayUnit()` |
| `PurchaseReturnService.php:57` | Hardcoded `'Unit'` | `resolveDisplayUnit()` |
| `InventoryService.php` | `unit => $product->base_unit_id` | Use `resolveDisplayUnit()` for labels |

### Phase 5: Refactor Frontend Consumers — Remove Duplicated Custom Options

6 files that each duplicate `measurementType` branching → all remove their local `getCustomUnitOptions`:

Custom measurement options are now served by the backend (API or static config). The frontend simply renders what the backend provides.

| File | Current | After |
|------|---------|-------|
| `SaleBill.tsx:371-406` | Own `getCustomUnitOptions` | Remove; options come from backend API |
| `_SaleBillPrototype.tsx:342-389` | Own custom options | Remove |
| `sale.ts:35-53` | Own custom options | Remove |
| `purchase.ts:117-137` | Own custom options | Remove |
| `purchase-return.ts:98-119` | Own custom options | Remove |
| `AddMedicineDialog.tsx:57-87` | Own `getCustomMeasurementOptions` | Remove; backend API provides options |

### Phase 6: Refactor Frontend Consumers — Fallback Chains

Replace every inline `getUnit(id)?.name || id || 'Unit'` pattern. Since the API now provides `base_unit_name` and `selling_unit_name`, most of these are no longer needed. Where fallbacks remain, use `formatWithUnit(quantity, unitName)`:

| File | Line | Current | After |
|------|------|---------|-------|
| `SalePrint.tsx` | 23 | `item.packaging_name \|\| 'Unit'` | Use API-provided `packaging_name` |
| `PurchasePrint.tsx` | 23 | `\|\| 'Unit'` | Use API-provided names |
| `VisitDetail.tsx` | 181 | `\|\| 'Unit'` | Use API-provided names |
| `PrescriptionsList.tsx` | 123 | `\|\| 'unit'` | Use API-provided names |
| `MobileCartList.tsx` | 132 | `\|\| 'Unit'` | Use API-provided names |
| `ProductDetails.tsx` | 53 | `getUnit()?.name \|\| id \|\| 'units'` | Use API-provided `base_unit_name` |
| `ProductForm.tsx` | multiple | `getUnit(id)?.name \|\| id` | Use API-provided names |
| `_ProductFormPrototype.tsx` | multiple | `unit?.name \|\| 'Unit'` | Use API-provided names |

### Phase 7: Eliminate String Comparisons

Search for and eliminate every `=== 'kg'`, `=== 'piece'`, `measurementType === 'weight'` pattern. These belong inside `ProductUnitService`:

| File | Pattern | Fix |
|------|---------|-----|
| `sale.ts:41` | `unit.measurementType === 'weight'` | Move to `ProductUnitService.getMeasurementOptions()` |
| `purchase.ts:123` | `unit.measurementType === 'weight'` | Move to backend |
| `purchase-return.ts:104` | `unit.measurementType === 'weight'` | Move to backend |
| `SaleBill.tsx:379` | `unit.measurementType === 'weight'` | Move to backend API |
| `AddMedicineDialog.tsx:62` | `unit.measurementType === 'weight'` | Move to backend API |
| `ProductForm.tsx:37-48` | `isMeasurementUnit()`, `isPackagingUnit()` | Move to `ProductUnitService` |
| `purchase.ts:114` | `product.baseUnitId` as display name | Use API-provided `base_unit_name` |

### Phase 8: Standardize Printing + Reports

| File | Fix | Why |
|------|-----|-----|
| `SalePrint.tsx` | Must use API-provided `base_unit_name` | Printing is where "Unit" bugs appear most |
| `PurchasePrint.tsx` | Must use API-provided names | Same |
| All print-related | Must go through `formatQuantity()` or API-provided names | Enforce consistency |

### Phase 9: Verify

| Step | Action |
|------|--------|
| 9.1 | `php artisan test` — all tests pass |
| 9.2 | Visual review: same product shows same unit on all pages |
| 9.3 | Grep for `=== 'kg'` or `measurementType ===` — 0 results outside `ProductUnitService` |
| 9.4 | Grep for `\|\| 'Unit'` or `\|\| 'unit'` or `\|\| 'units'` — 0 results |
| 9.5 | Grep for `getUnit(id)?.name` — 0 results outside `product-unit-display.ts` |

---

## Success Criteria

After the refactor:

| # | Criterion | How to Verify |
|---|-----------|---------------|
| 1 | The same product displays the same unit everywhere | Visit product in Create, Edit, Detail, List, Print, Reports, Inventory, Purchase, Sale, and Clinic — all show identical unit labels |
| 2 | No component, service, or controller implements its own unit resolution | Grep for `getUnit\(id\)\?.name` — should be 0 results outside `product-unit-display.ts` |
| 3 | All unit-related decisions originate from \`ProductUnitService\` or \`product-unit-display.ts\` | Every unit resolution flows through one of the two entry points |
| 4 | No business logic performs string comparisons on unit IDs or measurement types | Grep for `=== 'kg'`, `=== 'piece'`, `measurementType ===` — 0 results outside helpers |
| 5 | No `\|\| 'Unit'`, `\|\| 'unit'`, or `\|\| 'units'` fallbacks exist | Grep for `'Unit'` — 0 results outside service/helper defaults |
| 6 | Adding a new unit or changing a display format requires changes in only one place | Update `ProductUnitService::resolveDisplayUnit()` and the \`UNITS\` map in \`units.ts\` — all pages pick it up |

---

## Files Changed

### New Files

```
app/Domains/Products/Services/ProductUnitService.php   ← Backend unit resolver (domain service)
app/Http/Resources/ProductResource.php                  ← API resource with resolved names
app/Http/Resources/SellingUnitResource.php              ← API resource with resolved names
resources/js/lib/product-unit-display.ts                ← Frontend formatting helpers (no business logic)
tests/Unit/ProductUnitServiceTest.php                   ← Unit tests for backend resolver
```

### Modified Files

```
# Backend
app/Domains/Products/Services/ProductService.php        ← Use ProductUnitService
app/Domains/Purchasing/Services/PurchaseService.php     ← Use ProductUnitService
app/Domains/Sales/Services/SaleService.php              ← ProductUnitService for fallback
app/Domains/Sales/Services/SaleReturnService.php        ← ProductUnitService for fallback
app/Domains/Purchasing/Services/PurchaseReturnService.php ← ProductUnitService for fallback

# Frontend helpers (remove own resolution, use API names)
resources/js/lib/inventory-engine.ts                    ← Replace getStockDisplay()
resources/js/lib/product-adapter.ts                     ← Remove inline unit resolution

# Frontend pages — remove duplicated custom options (now from backend API)
resources/js/Pages/pos/SaleBill.tsx
resources/js/Pages/pos/_SaleBillPrototype.tsx
resources/js/Pages/purchases/PurchaseBill.tsx
resources/js/Pages/clinic/components/AddMedicineDialog.tsx
resources/js/domain/transactions/strategies/sale.ts
resources/js/domain/transactions/strategies/purchase.ts
resources/js/domain/transactions/strategies/purchase-return.ts

# Frontend pages — remove fallback chains, use API names
resources/js/Pages/sales/SalePrint.tsx
resources/js/Pages/purchases/PurchasePrint.tsx
resources/js/Pages/clinic/VisitDetail.tsx
resources/js/Pages/clinic/components/PrescriptionsList.tsx
resources/js/features/billing/MobileCartList.tsx
resources/js/Pages/inventory/ProductDetails.tsx
resources/js/Pages/inventory/components/ProductForm.tsx
resources/js/Pages/inventory/components/_ProductFormPrototype.tsx
```

**Total:** ~30 files touched, ~20 of which are removing fallback chains.

---

## Effort Estimate

| Phase | Files | Complexity | Risk |
|-------|-------|-----------|------|
| **P1** — Backend `ProductUnitService` | 1 PHP | Low | Low — new service |
| **P2** — API Resources | 2 PHP | Low | Low — new resource classes |
| **P3** — Frontend helpers | 2 TS | Low | Low — pure formatting, no business logic |
| **P4** — PHP consumers | 5 PHP | Low | Low — find-and-replace |
| **P5** — Remove frontend custom options | 6 TS | Medium | Medium — removing code + routing to API |
| **P6** — Remove frontend fallback chains | 8 TSX | Low | Low — use API-provided names |
| **P7** — Eliminate string comparisons | 7 files | Medium | Medium — logic migration to backend |
| **P8** — Standardize printing | 2 files | Low | Low — use API names |
| **P9** — Verify | — | Review | Low — grep-based checks |

**Total estimated effort:** 1-2 focused sessions.

---

## Verification

After implementation:
- `php artisan test` — all existing tests pass
- Every selling unit shows the same name on all pages (via API-provided `display_name`)
- Every product's base unit shows consistently as `"kg"`, `"Piece"`, etc. (via `base_unit_name`)
- No component falls back to `'Unit'` when a real unit is available
- No `=== 'kg'`, `measurementType === 'weight'` exists outside `ProductUnitService`
- No `getUnit(id)?.name` exists outside `product-unit-display.ts`
- Custom measurement options (Gram/kg, mL/L, cm/m) served by backend API, not computed in frontend
- Print pages use the same resolved names as all other pages
