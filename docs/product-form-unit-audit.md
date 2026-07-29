# Product Form — Unit & Selling Size Audit

**Date:** 2026-07-28
**Audit Scope:** `ProductForm.tsx`, `PackagingLevelsBuilder.tsx`, `PackagingDerivationEngine.php`, `ProductService.php`
**Status:** Two critical bugs found — duplicate selling units + ignored update payload

---

## 1. Current Architecture (The Problem)

The Product Form has **three separate mechanisms** that all define "how many base units are in what the customer buys":

```
┌───────────────────────────────────────────────────────────────┐
│ Quick Entry (always visible)                                   │
│                                                                │
│  Unit: [Box ▾]                                                 │
│  Each Box = [12] × [Pack ▾]     ← inline conversion            │
│  Selling price: [____]                                         │
│  ─────────────────────────────────                             │
│  ▶ More Options (collapsed)                                    │
│    ├── Packaging Levels Builder   ← multi-level hierarchy       │
│    └── Selling Sizes              ← derived + custom units      │
└───────────────────────────────────────────────────────────────┘
```

### Mechanism 1: Inline Conversion (Quick Entry)

- Shows when a packaging-type unit (Box, Strip) is selected
- Sets `baseUnitId`, `pkgConversionQty`, `pkgConversionUnitId`
- Creates **one default selling unit** with `productUnitId: null`
- **Does NOT** create `product_packaging` rows
- **Does NOT** invoke the derivation engine

### Mechanism 2: Packaging Levels Builder (More Options)

- Defines structured hierarchy: "Box contains 12 Pack"
- Creates `product_packaging` rows (containerUnitId, containsUnitId, quantity, level)
- Calls derivation engine → creates selling units with `product_unit_id` set
- Uses integer FK references to `product_units` table

### Mechanism 3: Selling Sizes (More Options)

- Shows derived units from packaging with price inputs
- Allows "Add Custom Size" for standalone selling units
- User-set prices override the derivation defaults

### How They Conflict

When a user fills BOTH the inline conversion AND the Packaging Levels Builder, the payload sent to the backend contains:

```
packaging: [
  { container_unit_id: 2, contains_unit_id: 3, quantity: 12 },  // Box→Pack
  { container_unit_id: 3, contains_unit_id: 4, quantity: 10 },  // Pack→Capsule
]

selling_units: [
  // Derived units (from preview):
  { name: 'Capsule', qty: 1,   product_unit_id: 4 },
  { name: 'Pack',    qty: 10,  product_unit_id: 3 },
  { name: 'Box',     qty: 120, product_unit_id: 2 },
  // Inline conversion unit (NOT filtered — productUnitId is null):
  { name: 'Box',     qty: 12,  product_unit_id: null },  ← DUPLICATE
]
```

### Critical Bug 1: Duplicate Selling Units on Create

**File:** `ProductService.php::create()` (lines 63-106)

The backend does BOTH:
1. Derivation engine creates 3 selling units (Capsule, Pack, Box)
2. Payload `selling_units` loop creates 4 more units (3 duplicates + 1 inline)

Result: **7 selling units** instead of 3, with 2× "Box" entries.

### Critical Bug 2: Update Ignores Selling Units Payload

**File:** `ProductService.php::update()` (lines 118-155)

The update method only processes `packaging` and re-derives. The `$data['selling_units']` array is **completely ignored**. Any price overrides set in Selling Sizes are silently lost.

### Root Cause

The `buildPayload()` filter (line 234-236) tries to exclude derived units from the selling_units array, but the inline conversion's `productUnitId: null` slips through:

```typescript
// This filter only catches units with matching productUnitId
// The inline conversion has productUnitId = null → NOT caught
sellingUnits.filter((su) =>
  !su.packagingId
  && !derivedUnits.some((du) => du.productUnitId === su.productUnitId)
)
```

---

## 2. Recommended Fix

### Principle

> **Packaging defines quantities. Selling Sizes defines prices. The inline conversion is removed.**

When packaging is present, selling units are derived from packaging (quantities are read-only, prices are editable). When packaging is not present, the user sees a single editable selling unit.

### What Changes

#### A. Remove the Inline Conversion

Delete the `pkgConversionQty`, `pkgConversionUnitId` state, and the "Each Box = [12] × [Pack ▾]" UI section from `ProductForm.tsx`.

When a packaging-type unit is selected, show a hint: "**Configure selling sizes below**" that scrolls to or opens the Selling Sizes section.

#### B. Make Selling Sizes Always Visible

Move Selling Sizes out of "More Options" and show it directly when a packaging-type unit is selected.

| Scenario | What User Sees |
|----------|---------------|
| **Simple** (Piece) | Name + Price + Unit + Save |
| **Measurement** (kg/L/m) | Name + Price + Unit + Save (auto-units) |
| **Single pack** (Box, no levels) | Name + Price + Unit + Save + "Define what Box contains" inline |
| **Multi-pack** (Box→Pack→Capsule) | Name + Price + Unit + Save + Packaging Levels Builder |

#### C. Fix `buildPayload()` — Never Send Both

```typescript
// If packaging levels are defined, let the derivation engine handle selling units:
if (packagingLevels.length > 0) {
  return {
    ...basePayload,
    packaging: packagingLevels,   // ← sends ONLY packaging
    // selling_units: NOT SENT     // ← derivation engine creates these
  }
}

// If no packaging, send the single custom selling unit:
return {
  ...basePayload,
  selling_units: [...],           // ← single unit, user-specified
}
```

#### D. Fix `ProductService::create()` — Remove Dual Write

```php
// Create packaging levels
if (!empty($data->packaging)) {
    $this->savePackaging($product->id, $data->packaging);
    $derived = $this->derivationEngine->derive($product->id);
}

// Only create selling_units from payload if NO packaging was provided
if (empty($data->packaging) && !empty($data->sellingUnits)) {
    foreach ($data->sellingUnits as $unit) {
        $product->sellingUnits()->create([...]);
    }
}
```

#### E. Fix `ProductService::update()` — Process Selling Units

```php
// After handling packaging + re-derivation:
if (array_key_exists('selling_units', $data)) {
    // Update prices on matching selling units
    foreach ($data['selling_units'] as $suData) {
        if (!empty($suData['product_unit_id'])) {
            SellingUnit::where('product_id', $product->id)
                ->where('product_unit_id', $suData['product_unit_id'])
                ->update(['sale_price' => $suData['sale_price']]);
        }
    }
}
```

---

## 3. Detailed DB Behavior After Fix

| Scenario | User Action | Database Result |
|----------|-------------|-----------------|
| **Simple** | Name: "Tea", Price: 50, Save | `products.base_unit_id = 'piece'` → 1 selling unit (Piece, qty=1, price=50) |
| **Measurement** | Unit: "kg", Price: 700, Save | `base_unit_id = 'kg'` → 1 selling unit (KG, qty=1, price=700) |
| **Single pack** | Unit: "Box", Price: 500, "Each Box = 12 × Pack", Save | `base_unit_id = 'box'` → 1 `product_packaging` row (Box→12→Pack) → 2 derived selling units (Box qty=12, price=500; Pack qty=1, price=0) |
| **Multi-pack** | Box→12×Pack→10×Capsule, Box=Rs.500, Pack=Rs.50 | 2 `product_packaging` rows → 3 derived selling units (all with prices) |
| **Custom size** | "Add Custom Size" → "250g Pack" = 250g | 1 custom selling unit (name="250g Pack", qty=250, productUnitId=null) |

---

## 4. Migration Path

| Step | Change | Files | Risk |
|------|--------|-------|------|
| 1 | Remove inline conversion state + UI | `ProductForm.tsx` | Low — UI removal |
| 2 | Fix `buildPayload()` — conditional selling_units | `ProductForm.tsx` | Medium — changes payload shape |
| 3 | Fix `ProductService::create()` — conditional loop | `ProductService.php` | Medium — existing products rely on current behavior |
| 4 | Fix `ProductService::update()` — process selling_units | `ProductService.php` | Medium — new behavior for update path |
| 5 | Make Selling Sizes always visible | `ProductForm.tsx` | Low — CSS/structural change |
| 6 | Clean up existing duplicate selling units in DB | SQL migration | Low — remove rows where `product_unit_id IS NULL` AND matching derived unit exists |

---

## 5. Verification

After the fix:

| Check | Method |
|-------|--------|
| No duplicate selling units | Create a product with packaging → verify only 3 selling units (not 7) |
| Price overrides persist | Create → set price → edit → verify price unchanged |
| Update path preserves prices | Edit a derived unit's price → save → verify DB has the new price |
| Simple product unaffected | Create a product without packaging → verify 1 selling unit as before |
| Custom sizes still work | Add custom unit alongside packaging → verify it's created separately |
