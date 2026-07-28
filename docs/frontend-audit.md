# Frontend Audit: Create/Edit Product Forms vs ADR-002 Architecture

**Date:** 2026-07-28  
**Scope:** `CreateProduct.tsx`, `EditProduct.tsx`, `components/ProductForm.tsx`, `_ProductFormPrototype.tsx`, `types/index.ts`, `lib/units.ts`

---

## Audit Rating Key

| Icon | Meaning |
|------|---------|
| ✅ | Already aligned with ADR-002 |
| ⚠️ | Gap — needs change but low effort |
| 🔴 | Gap — needs significant rework |
| ➕ | Missing — doesn't exist yet |
| 🔲 | Not applicable at this phase |

---

## 1. Type System Gaps

### `SellingUnit` interface (`types/index.ts:162-176`)

```typescript
// CURRENT — missing fields
export interface SellingUnit {
  id: string
  name: string
  unitId: string              // OK, maps to product_units via name
  quantity: number
  salePrice: number
  barcode?: string
  sku?: string
  isDefault: boolean
}
```

| Field | Status | Issue |
|-------|--------|-------|
| `id` | ✅ | OK for frontend use |
| `name` | ✅ | OK — display name |
| `unitId` | ⚠️ | Currently a free-text string from `units.ts`. Needs to also carry `productUnitId` (the integer ID from `product_units` table) for backend matching. |
| `quantity` | ✅ | OK — conversion factor |
| `salePrice` | ✅ | OK |
| `barcode` | ✅ | OK |
| `sku` | ✅ | OK |
| `isDefault` | ✅ | OK |
| `productUnitId` | ➕ **Missing** | Backend now expects `product_unit_id` (FK to `product_units.id`). The derivation engine matches by this ID, not by name string. Frontend must send this when creating derived units. |
| `packagingId` | ➕ **Missing** | Backend `packaging_id` tracks which packaging level generated this unit. Frontend needs to read this to know which units are derived vs custom. |

**Fix:** Add optional `productUnitId?: number` and `packagingId?: number | null` to the interface.

### `Product` interface (`types/index.ts:187-209`)

| Concern | Status | Issue |
|---------|--------|-------|
| `packaging` field | ➕ **Missing** | No packaging levels array in the Product interface. Backend now returns and accepts `packaging` data. |
| `sellingUnits` | ✅ | Present |

---

## 2. Selling Unit Row UX

### Current: Flat `×` Syntax

```
[Strip] × [10] [Capsules]   Rs. [___]   [X]
```

**Problem (🔴):** This is exactly the UX that `product-form-redesign.md` and `product-entry-ux-final.md` identified as confusing. The ADR specifies:

> "Strip contains 10 capsules" — natural language

The bidirectional `UnitCombobox` in `components/ProductForm.tsx` (lines 274-320) tries to solve this by showing `[UnitA] 1 = [N] [UnitB]`, but this creates the reverse confusion: users don't know which side is the selling pack and which is the base unit.

**ADR solution:** Replace with hierarchical packaging builder:

```
┌── Packaging Levels ──────────────────────┐
│                                           │
│ Level 1  [Box]   contains [12]  [Pack] ✕ │
│ Level 2  [Pack]  contains [10]  [Cap]  ✕ │
│                                           │
│ [+ Add Level]                             │
│                                           │
│ Selling Units (auto-generated)            │
│ ☑  Box      @ Rs. ______  (generated)  ⚙ │
│ ☐  Pack     @ Rs. ______  (generated)  ⚙ │
│ ☑  Capsule  @ Rs. ______  (generated)  ⚙ │
│                                           │
│ [+ Custom Pack]                           │
└───────────────────────────────────────────┘
```

### Current: Default unit reset is destructive

In `components/ProductForm.tsx` (lines 479-490) and `EditProduct.tsx` (not present but should be):

```typescript
useEffect(() => {
  const unit = getUnit(baseUnitId)
  if (unit) {
    setSellingUnits((prev) => {
      const defaultUnit = prev.find((su) => su.isDefault)
      return [{
        id: 'default', name: unit.name, unitId: baseUnitId,
        quantity: 1, salePrice: defaultUnit?.salePrice ?? 0, isDefault: true,
      }]
    })
  }
}, [baseUnitId])
```

**Problem (⚠️):** Changing the base unit **destroys all existing selling units** and replaces them with a single default. If a user has entered 3 selling units and realizes they picked the wrong base unit, all their work is lost.

**Better:** When base unit changes, recalculate quantities but preserve the structure. Or just show a warning: "Changing the base unit will recalculate your selling unit quantities."

---

## 3. Missing: Packaging Levels Builder

**Severity: 🔴**

The entire `product_packaging` table has no frontend UI. The backend now supports:

- `POST /inventory` — accepts `packaging` array
- `PUT /inventory/product/{id}` — accepts `packaging` array  
- `POST /inventory/preview-packaging` — preview derivation
- `GET /inventory/product-units` — autocomplete

But the frontend:
1. Does not send `packaging` in the payload
2. Has no "Packaging Levels" section
3. Has no "Unit Autocomplete" component that queries `product_units`
4. Does not call the preview endpoint

The current forms treat all selling units as manually entered. For products with multi-level packaging, the user would need to manually compute conversion factors — which is exactly what the derivation engine should automate.

**What's needed (Phase 2):**
- `PackagingLevelsBuilder` React component
- Each level row: `[Container ▾] contains [Qty] [Contains ▾]`
- Unit autocomplete using `GET /inventory/product-units`
- Real-time preview via `POST /inventory/preview-packaging`
- Selling units section below, showing derived units with prices
- "+ Custom Pack" button for standalone units

---

## 4. Missing: Quick Entry Mode

**Severity: 🔴**

The UX spec (`product-entry-ux-final.md`) defines three scenarios:

| Scenario | Fields shown | Clicks to save |
|----------|-------------|----------------|
| Simple (Piece) | Name, Cost, Price | 1 (Enter) |
| Measurement (kg/L) | Name, Unit, Cost, Price | 2 |
| Packaging (Box) | Name, Unit, Cost, Price + collapsed "Selling Sizes" | 2-5 |

**Current form:** Always shows ALL fields — Category, SKU, Barcode, Opening Stock, Unit, Min Stock, Selling Units section, Purchase Cost. That's 7+ field groups for every product, even for a simple Piece product that just needs Name + Price + Enter.

| What ADR-002 expects | What currently happens |
|----------------------|----------------------|
| Name + Price = Enter to save | Shows 7 sections, user must scroll |
| Unit defaults to Piece | Piece is selected but unit selector is still visible |
| Category, SKU, etc. are "More Options" | Category and SKU are shown at top |
| Selling Sizes are collapsed | Selling units section is always visible |
| Packaging Levels for multi-pack | No packaging UI at all |

---

## 5. Unit Autocomplete

**Severity: ⚠️**

Current `UnitSelect` and `UnitCombobox` use `getBaseUnitOptions()` from `lib/units.ts` — a hardcoded client-side registry. The ADR-002 created `product_units` database table (26 seeded units) and `GET /inventory/product-units` endpoint for autocomplete.

**Gap:** The frontend unit selector doesn't use the backend `product_units` registry. This means:
- New unit types added via API are not reflected in the frontend
- The frontend and backend unit lists can diverge
- The `product_unit_id` field (needed by derivation engine) is never set

**Fix needed (Phase 2):** Replace `getBaseUnitOptions()` usage in product forms with async autocomplete from `GET /inventory/product-units`. This also enables the "create new unit" flow (if user types a name not in the list, they can add it to `product_units`).

---

## 6. Measurement Intelligence

**Severity: ⚠️**

The `_ProductFormPrototype.tsx` has selling unit templates for weight/volume/length (lines 634-672), but:
- **Not used in the production forms** (`CreateProduct.tsx`, `EditProduct.tsx`, `ProductForm.tsx`)
- Templates are client-side and static
- Not integrated with the derivation engine

The ADR specifies that when a measurement unit (kg, g, L, ml) is selected, the system should auto-create selling units (kg + g, or L + ml) without requiring any packaging UI. The prototype has this logic but it's disconnected from the backend.

---

## 7. Progressive Disclosure

**Severity: ⚠️**

Current state vs ADR spec:

| Element | Current form | ADR spec |
|---------|-------------|----------|
| Product Name | Always visible | Always visible ✅ |
| Cost Price | Always visible | Always visible ✅ |
| Selling Price | Always visible | Always visible ✅ |
| Category | Always visible | "More Options" |
| SKU | Always visible | "More Options" |
| Barcode | Always visible | "More Options" |
| Opening Stock | Always visible | "More Options" |
| Unit | Always visible | Always visible (but simplified) |
| Selling Units | Always visible | Collapsed under "Add Selling Sizes" |
| Packaging Levels | **Doesn't exist** | Collapsed under "Add Selling Sizes" |
| Allow Negative Stock | In "More Options" ✅ | ✅ |
| Manufacturing | In "More Options" ✅ | ✅ |

The form shows too many fields by default. Every extra field is a cognitive load for the 90% use case (simple Piece products).

---

## 8. Edit Product Form Gaps

**Severity: 🔴**

The `EditProduct.tsx` has additional issues:

| Issue | Detail |
|-------|--------|
| **No packaging edit** | Cannot add/remove/edit packaging levels on existing products |
| **Selling unit identity** | Uses `id` from backend but doesn't preserve `packaging_id` or `product_unit_id`. When the form saves, it resends selling_units as a flat array without identity — the backend may recreate instead of updating. |
| **Derivation on save** | The `update()` method calls `$this->derivationEngine->derive()`, but the frontend never sends packaging data, so the engine recalculates from an empty set — potentially deleting derived units. |
| **Stock display** | Shows current stock as read-only, but doesn't support stock adjustments from edit form. Separate dialog needed. |

---

## 9. Three Forms, One Purpose

**Severity: ⚠️**

There are three active product form implementations:

| File | Purpose | Status |
|------|---------|--------|
| `CreateProduct.tsx` | Standalone create page | Used by route |
| `EditProduct.tsx` | Standalone edit page | Used by route |
| `components/ProductForm.tsx` | Shared form component | Used by `ProductForm.tsx` (wrapper) |
| `components/_ProductFormPrototype.tsx` | Prototype with measurement intelligence | **Unused** — has features the other forms lack |

The prototype (`_ProductFormPrototype.tsx`) has measurement templates, unit autocomplete, and keyboard shortcuts that the production forms don't have. This represents duplicated effort — the prototype's ideas should be merged into the main form rather than living separately.

---

## 10. Keyboard Shortcuts

**Severity: 🟢 (Low)**

The `components/ProductForm.tsx` and `_ProductFormPrototype.tsx` have enter-to-save and ⌘⏎ shortcuts, but `CreateProduct.tsx` and `EditProduct.tsx` do not.

**Fix:** Standardise keyboard handling across all forms.

---

## Summary: What to Build (Phase 2 Order)

| Priority | Change | Files | Effort |
|----------|--------|-------|--------|
| **P0** | Add `packaging` payload to form submission | `CreateProduct.tsx`, `EditProduct.tsx`, `components/ProductForm.tsx` | Small |
| **P0** | Add `productUnitId` to `SellingUnit` interface; send it in payload | `types/index.ts`, build payload functions | Small |
| **P1** | Quick Entry mode: collapse non-essential fields by default | `components/ProductForm.tsx` | Medium |
| **P1** | Replace flat selling unit rows with Packaging Levels Builder | New `PackagingLevelsBuilder.tsx` component | Large |
| **P1** | Unit autocomplete from `GET /inventory/product-units` endpoint | `UnitSelect` component refactor | Medium |
| **P2** | Measurement intelligence: auto-create selling units for kg/L/m | `components/ProductForm.tsx` | Medium |
| **P2** | Preview endpoint integration (`POST /inventory/preview-packaging`) | `PackagingLevelsBuilder.tsx` + debounced API call | Small |
| **P2** | Preserve selling unit identity on edit | `EditProduct.tsx` — send `product_unit_id`, `packaging_id` | Medium |
| **P3** | Merge `_ProductFormPrototype.tsx` features into main form | Archive prototype, merge templates + keyboard | Medium |
| **P3** | Standardise keyboard shortcuts across all forms | `CreateProduct.tsx`, `EditProduct.tsx` | Small |
| **P3** | Base unit change warning instead of destructive reset | `components/ProductForm.tsx` + `EditProduct.tsx` | Small |

---

## Recommendations Before Implementation

1. **Consolidate first.** Pick one form component (`components/ProductForm.tsx` is the best candidate — it already has Inertia routing and keyboard shortcuts) and build all Phase 2 changes into it. Archive the standalone `CreateProduct.tsx` and `EditProduct.tsx` after ensuring the shared form works for both modes.

2. **Quick Entry is the highest-impact UX change.** Name + Cost + Price + Enter should save a product. This alone justifies Phase 2 for users who enter hundreds of products.

3. **Packaging Levels Builder is the highest-impact architecture change.** Without it, the `product_packaging` table exists with no way to populate it. The derivation engine runs but has nothing to derive from.

4. **Don't build the autocomplete from scratch.** The `GET /inventory/product-units` endpoint already exists. The `UnitCombobox` in `components/ProductForm.tsx` just needs its data source switched from `getBaseUnitOptions()` to the API endpoint, with a debounced search.
