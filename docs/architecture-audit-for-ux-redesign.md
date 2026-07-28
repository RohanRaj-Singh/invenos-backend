# Architecture Audit: Current Implementation vs Desired UX

---

## 1. How the Current Architecture Works

### Database Schema (Core Tables)

**`products`** — Source of truth for stock
| Column | Purpose | Type |
|--------|---------|------|
| `base_unit_id` | Canonical stock unit (e.g. 'piece', 'g', 'kg', 'L') | varchar(50) |
| `stock_quantity` | Current stock in **base units** | decimal(12,2) |
| `last_purchase_cost` | Cost per purchase pack from last purchase | decimal(12,2) |
| `default_purchase_cost` | Default cost when no purchase history exists | decimal(12,2) |
| `allow_negative_stock` | Whether negative stock is permitted | boolean |

**`selling_units`** — What the POS sells
| Column | Purpose |
|--------|---------|
| `name` | Display name (e.g. 'Strip', 'Box') |
| `quantity` | **Base units per selling unit** (e.g. 10 = 10 capsules per strip) |
| `sale_price` | Price per selling unit |
| `is_default` | Which unit is initially selected in POS |
| `unit_id` | Reference to the unit type (e.g. 'piece', 'capsule') |

**`purchase_bill_items`** — What was bought
| Column | Purpose |
|--------|---------|
| `purchase_pack_qty` | Base units per purchase pack (e.g. 10 = 10 capsules/strip) |
| `purchase_quantity` | Number of packs bought |
| `unit_cost` | Cost per pack |
| `purchase_pack_name` | Display name of the purchase pack |

**`sale_items`** — What was sold
| Column | Purpose |
|--------|---------|
| `packaging_quantity` | Number of selling units sold |
| `base_unit_quantity` | Base units per selling unit (from `selling_units.quantity`) |
| `base_quantity` | Server-calculated `packaging_quantity × base_unit_quantity` |
| `unit_price` | Price per selling unit |

**`inventory_transactions`** — Every stock movement
| Column | Purpose |
|--------|---------|
| `quantity` | Movement in **base units** (signed) |
| `running_balance` | New stock after this movement |
| `packaging_quantity` | Original packaging quantity (informational) |

### Frontend Unit Registry (`units.ts`)

- 21 built-in units across 4 measurement types: count, weight, volume, length
- Each unit has `baseFactor` for conversion (e.g. kg → mg × 1,000,000)
- `convert(value, from, to)` handles cross-unit conversion
- Count-based units all have `baseFactor: 1` (piece = base unit for count)

### The Three-Unit Model (Current)

```
Purchase Unit         Selling Unit
      │                      │
      │ purchase_pack_qty    │ selling_unit_id + quantity
      │ × purchase_quantity  │ × packaging_quantity
      ▼                      ▼
      ┌──────────────────────────────┐
      │     Stock / Base Unit        │
      │   products.stock_quantity    │
      │   inventory_transactions     │
      └──────────────────────────────┘
```

---

## 2. How Purchase & Sale Pages Consume This

### Purchase Bill

1. User searches product → selects pack name + pack qty
2. `PurchaseItem` created: `{ purchasePackQty, purchaseQuantity, unitCost }`
3. POST payload: `purchase_pack_qty`, `purchase_quantity`, `unit_cost`
4. Server: `baseQty = purchasePackQty × purchaseQuantity`
5. `recordPurchase(quantity: baseQty)` → stock increases

### Sale Bill

1. User searches product → `addToCart` with default selling unit
2. `CartItem` created: `{ packagingQuantity, baseUnitQuantity, unitPrice }`
3. User can change unit via `handleChangeUnit` → updates `baseUnitQuantity`
4. POST payload: `quantity`, `packaging_quantity`, `base_unit_quantity`, `unit_price`
5. Server: `$baseQty = packagingQuantity × baseUnitQuantity`
6. `recordSale(quantity: baseQty)` → stock decreases

---

## 3. What Already Works Well

| Feature | Status | File |
|---------|--------|------|
| **Three-Unit Model** | ✅ Implemented. Purchase → Stock → Sale conversion chain is clean. | Services, DTOs |
| **Stock in base units** | ✅ Single source of truth. All inventory is `stock_quantity` in `base_unit_id`. | Products table |
| **Server-side conversion** | ✅ Both purchase and sale recalculate baseQty server-side (sale fixed in recent audit). | `SaleService.php`, `PurchaseService.php` |
| **Custom measurement options** | ✅ `getCustomUnitOptions()` generates "Per Gram", "Per KG", "Per mL" etc. from `base_unit_id`. | `SaleBill.tsx` |
| **Unit registry** | ✅ `units.ts` has 21 units across 4 types with conversion factors. | `lib/units.ts` |
| **Selling units with quantity** | ✅ `selling_units.quantity` stores base units per selling unit. Correct model. | `SellingUnit` model |
| **Purchase pack dimensions** | ✅ `purchase_pack_qty` + `purchase_quantity` captured separately, allowing recalculation. | `purchase_bill_items` table |
| **Sale item dimensions** | ✅ `packaging_quantity` + `base_unit_quantity` preserved alongside `base_quantity`. | `sale_items` table |

---

## 4. What Needs to Change (Verified Against UX Goals)

### Goal 1 — Quick Product Entry

**Desired:** Name + Cost Price + Selling Price → Enter → Save

**Current state:** The `CreateProduct.tsx` form requires:
1. Category (combobox search)
2. Product Name
3. SKU (auto-generated)
4. Barcode (optional)
5. Opening Stock
6. Base Unit
7. Minimum Stock
8. Selling Units (default row always shown)
9. Purchase Cost
10. Advanced Options toggle

**Assessment:** The form is unnecessarily complex for simple products. The default selling unit row ("Piece × 1 at Rs. 0") is always visible, and opening stock/base unit/minimum stock are always shown.

**Change required:** Small. Extract a **Quick Entry mode** that shows only Name + Price fields by default. Hide stock/selling unit configuration behind a "More Details" toggle.

**Can the current backend support it?** ✅ Yes. The backend already handles products with zero stock, a single default selling unit, and missing optional fields.

**Effort:** Small (frontend restructuring of existing `CreateProduct.tsx`)

### Goal 2 — Intelligent Measurement Units

**Desired:** Selecting kg/L/m auto-enables correct selling units. No packaging builder needed.

**Current state:** 
- `getCustomUnitOptions()` in `SaleBill.tsx` already generates gram/kg/mL/L options based on `base_unit_id`
- `units.ts` already has conversion factors for all measurement types
- The product form already has a base unit selector
- `getUnitsByType()` can list all units of a given type

**Assessment:** The logic exists but isn't surfaced during product creation. When a user selects `kg` as base unit, the system should auto-create "kg" and "g" selling units.

**Change required:** In `CreateProduct.tsx`/`EditProduct.tsx`: when `base_unit_id` changes to a measurement type (`weight`, `volume`, `length`), auto-generate the appropriate selling units from `getUnitsByType()`. No database changes needed.

**Can the current backend support it?** ✅ Yes. `selling_units` already handles the data. The frontend just needs to auto-populate based on `measurementType`.

**Effort:** Small (frontend auto-generation logic + toggle UI)

### Goal 3 — Simple Packaging Products

**Desired:** Selecting Box/Bottle/Tray defaults to "Buy in Box, Sell in Box". No packaging builder.

**Current state:** 
- When creating a product, the default selling unit is "Piece" regardless of the unit selected
- Changing the base unit doesn't change the default selling unit name
- ProductForm always shows the selling units grid

**Assessment:** When a user selects "Box" as the base unit, the default selling unit should auto-rename from "Piece" to "Box" with quantity=1 (meaning 1 Box = 1 base unit). No packaging builder needed.

**Change required:** Frontend: when `base_unit_id` changes to a count-based unit that isn't 'piece', update the default selling unit name to match. Keep selling unit grid hidden behind "Add Selling Sizes" toggle.

**Can the current backend support it?** ✅ Yes. The `selling_units` table already supports any unit name.

**Effort:** Trivial (frontend default name sync)

### Goal 4 — Advanced Packaging (Box → Pack → Capsule)

**Desired:** "Add Selling Sizes" → "Box contains 12 Pack", "Pack contains 10 Capsule". Conversions auto-inferred.

**Current state:** 
- No `product_packaging` table exists
- Selling units are a flat list — no hierarchy
- Users must manually calculate "Box = 120 Capsule" and enter it as quantity

**Assessment:** This is the **one area** where a new table (`product_packaging`) and a derivation engine are truly justified. The current flat model cannot represent Box→Pack→Capsule without the user manually computing 12×10 = 120.

**Change required:** 
- NEW: `product_packaging` table (container_unit_id, contains_unit_id, quantity, level)
- NEW: Derivation engine (graph walk)
- The derivation engine produces selling units that flow into the existing `selling_units` model
- Existing POS/Purchase/Sale code consumes `selling_units` unchanged

**Can the current backend support it?** ✅ Yes. The derivation engine outputs data that already works with the existing `selling_units` table. No changes needed to PurchaseBill or SaleBill for consumption.

**Effort:** Medium (new table + derivation service + packaging UI component)

---

## 5. Evaluation of Previous Proposal's Specific Ideas

| Proposal | Compatible? | Assessment |
|----------|-------------|------------|
| **`product_units` table** | ❌ **Over-engineered** | The existing `units.ts` with 21 units works fine. Creating a DB table adds migration, sync, and cache invalidation complexity. A simple autocomplete component can query `units.ts` directly for the frontend. The backend doesn't need to know about unit name suggestions. |
| **`product_packaging` table** | ✅ **Justified** | This is the one genuinely missing piece. The current flat `selling_units` cannot represent hierarchical packaging. A dedicated table with `container_unit_id`, `contains_unit_id`, `quantity`, `level` is the cleanest solution. |
| **`default_unit_id` on products** | ❌ **Redundant** | `base_unit_id` already serves this purpose. Renaming it adds migration overhead for zero business value. Keep `base_unit_id` as-is. |
| **Derived selling units** | ✅ **Partial** | For packaging-structured products, derive from `product_packaging`. For all other products (measurement, single-pack), the current explicit `selling_units` remains the source of truth. No need to generate on-the-fly for simple products. |
| **Packaging levels** | ✅ **Good idea** | The `level` column on `product_packaging` is simple, explicit, and solves ordering/editing cleanly. Add it. |

---

## 6. Files That Would Change

### Backend — New

| File | Purpose |
|------|---------|
| `database/migrations/xxxx_create_product_packaging_table.php` | New table with FK to `products` and `selling_units` |
| `app/Domains/Products/Services/PackagingService.php` | Derivation engine: graph walk → flat selling units |
| `app/Models/ProductPackaging.php` | Eloquent model |

### Backend — Modified

| File | Change |
|------|--------|
| `app/Models/Product.php` | Add `packaging()` relationship (hasMany) |
| `app/Http/Controllers/ProductController.php` | Handle `product_packaging` rows in store/update |
| `app/Domains/Products/Services/ProductService.php` | Create/update packaging levels |

### Frontend — New

| File | Purpose |
|------|---------|
| `features/products/components/PackagingLevelsBuilder.tsx` | "Box contains 12 Pack" UI |
| `features/products/components/UnitAutocomplete.tsx` | Autocomplete from `units.ts` |

### Frontend — Modified

| File | Change |
|------|--------|
| `Pages/inventory/CreateProduct.tsx` | Quick Entry mode (Name + Price + Unit → Enter). Hide stock/selling behind "More Details". Auto-selling-units for measurement/packaging. Integrate PackagingLevelsBuilder. |
| `Pages/inventory/EditProduct.tsx` | Same Quick Entry structure, prefilled from product. Integrate PackagingLevelsBuilder. |
| `Pages/pos/SaleBill.tsx` | Unit resolution via backend derivation (packaging-aware). Minimal change — backend returns selling units from derivation. |

---

## 7. Files That Would NOT Change

| File | Reason |
|------|--------|
| `app/Domains/Sales/Services/SaleService.php` | Already recalculates baseQty. Consumes selling units as-is. |
| `app/Domains/Purchasing/Services/PurchaseService.php` | Same — unchanged. |
| `app/Domains/Inventory/Services/InventoryService.php` | Works in base units. Unchanged. |
| `database/migrations/xxxx_create_selling_units_table.php` | Selling units table stays. Derivation engine populates it. |
| `resources/js/lib/units.ts` | Unit registry stays as frontend source of truth. |
| `app/Models/SellingUnit.php` | Stays unchanged. |
| `app/Domains/Sales/DTOs/SaleItemData.php` | Stays unchanged. |
| `app/Domains/Purchasing/DTOs/PurchaseItemData.php` | Stays unchanged. |
| `app/Http/Requests/Products/CreateProductRequest.php` | Only minor additions for packaging data. |
| `app/Http/Requests/Products/UpdateProductRequest.php` | Same. |

---

## 8. Migration Strategy

### Phase 1 (2-3 hours — No new tables)

1. Restructure `CreateProduct.tsx` → Quick Entry mode
2. Auto-selling-units when measurement or packaging unit selected
3. Move stock/selling unit fields behind "More Details" toggle
4. No database changes
5. Result: 90% UX improvement with 0 schema changes

### Phase 2 (2-3 hours)

1. Create `product_packaging` migration + model
2. Build `PackagingService` derivation engine
3. Build `PackagingLevelsBuilder` UI component
4. Integrate into CreateProduct.tsx and EditProduct.tsx behind "Add Selling Sizes" toggle

### Phase 3 (1-2 hours)

1. Wire derivation engine into product show/sale endpoints
2. SaleBill unit resolution falls back to derivation for products with packaging levels
3. Verify all scenarios: simple, measurement, single-pack, multi-pack

---

## 9. Conclusion

| Statement | Verdict |
|-----------|---------|
| The current architecture supports the desired UX with minimal changes | ✅ **Yes** |
| The Three-Unit Model remains correct | ✅ **Yes** |
| A `product_packaging` table is needed | ✅ **Yes** |
| A `product_units` table is NOT needed | ✅ **Confirmed — existing `units.ts` suffices** |
| Quick Entry is a frontend-only change | ✅ **Yes** |
| Intelligent measurements use existing `base_unit_id` + `units.ts` | ✅ **Yes** |
| Derivation engine outputs to existing `selling_units` format | ✅ **Yes** |
| Purchase/Sale services need NO changes | ✅ **Confirmed** |
| The previous proposal's product_units table would be over-engineering | ✅ **Rejected — minor autocomplete component suffices** |
| The previous proposal's default_unit_id rename is unnecessary | ✅ **Rejected — base_unit_id stays** |
