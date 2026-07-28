# Validated Architecture Audit

---

## 1. Current Unit Lifecycle — Traced

### Product Creation

```
CreateProduct.tsx               SellingUnit model
      │                              │
      │  name: "Amoxil"               │
      │  base_unit_id: "capsule"      │
      │  selling_units: [             │
      │    { name:"Strip",            │  quantity = 10 ↓
      │      quantity: 10,            │  (10 capsules per strip)
      │      sale_price: 150 }        │
      │  ]                            │
      ▼                              ▼
ProductService::create()
  ├── creates Product { base_unit_id, stock_quantity, ... }
  └── creates SellingUnit for each entry
       → INSERT: { product_id, name, quantity: 10, sale_price: 150, unit_id, is_default }
```

**Source of truth:** `selling_units.quantity` is the number of base units per selling unit. It is explicit, user-defined, and persisted.

### Purchase

```
PurchaseBill.tsx                         PurchaseService::create()
      │                                        │
      │  purchasePackQty: 10                   │  ← base units per pack
      │  purchaseQuantity: 5                   │  ← number of packs
      │  unitCost: 85                           │
      ▼                                        ▼
      │  INSERT purchase_bill_items
      │    { purchase_pack_qty: 10, purchase_quantity: 5, unit_cost: 85 }
      │
      │  $baseQty = 10 × 5 = 50
      │  recordPurchase(quantity: 50)
      │    → stock_quantity += 50 (base units)
      │    → InventoryTransaction { quantity: 50, running_balance: 50 }
```

**Source of truth:** `purchase_pack_qty` × `purchase_quantity`. Server-calculated.

### Sale

```
SaleBill.tsx                              SaleService::create()
      │                                        │
      │  packagingQuantity: 2                   │  ← number of strips sold
      │  baseUnitQuantity: 10                   │  ← from selling_unit.quantity
      │  unitPrice: 150                         │
      ▼                                        ▼
      │  INSERT sale_items
      │    { packaging_quantity: 2,
      │      base_unit_quantity: 10,
      │      base_quantity: 20,            ← 2 × 10 (server recalculated)
      │      unit_price: 150 }
      │
      │  $baseQty = 2 × 10 = 20
      │  recordSale(quantity: 20)
      │    → stock_quantity -= 20 (base units)
```

**Source of truth:** `packaging_quantity` × `base_unit_quantity`. Server-recalculated (P1 fix from previous audit).

### Inventory Transactions

```
InventoryTransaction {
  quantity: ±50        (base units)
  unit: "capsule"      (from product.base_unit_id)
  running_balance: 50  (after movement)
  packaging_quantity: 10 (informational)
}
```

---

## 2. SellingUnits — Dependency Map

### Backend (6 files reference `selling_units`)

| File | Dependency | Purpose |
|------|-----------|---------|
| `app/Models/SellingUnit.php` | Eloquent model | CRUD, casts, relationships |
| `app/Models/Product.php` | `hasMany('sellingUnits')` | Loading units for a product |
| `app/Domains/Products/Services/ProductService.php` | Creates + queries selling units | Create, retrieve with product |
| `app/Http/Controllers/ProductController.php` | `->toArray()` includes selling_units | Serializes selling units in API responses |
| `resources/js/lib/product-adapter.ts` | `derivePackaging(product.sellingUnits)` | Derives legacy PackagingConfig from SellingUnit[] |
| `resources/js/features/transactions/search/SearchBar.tsx` | `product.sellingUnits[0]` | Shows default selling unit + price in search results |

### Frontend (10+ files reference `sellingUnits`)

These include:
- `SaleBill.tsx` — `getSellingUnits(productId)` → returns `SellingUnit[]`
- `PurchaseBill.tsx` — similar
- `MobileCartList.tsx` — unit dropdown options
- `product-adapter.ts` — bridges to legacy `PackagingConfig`
- Strategy files (`purchase.ts`, `sale.ts`, `sale-return.ts`, `purchase-return.ts`) — consume selling units for transactions

### Verdict

**`selling_units` is the source of truth** for sale-able unit configurations. It is:
- Explicitly defined per product
- Persisted in the database
- Loaded eagerly with every product (`ProductService::get()` uses `->with('sellingUnits')`)
- Consumed by Purchase, Sale, Return flows
- Referenced by the frontend product adapter for backward compatibility

**If it became fully derived** (from `product_packaging`), the derivation engine would need to:
1. Run on every product load
2. Overwrite existing `selling_units` rows (destructive)
3. Or create a separate read path for derived vs explicit units
4. The existing dependency on `selling_unit.id` (used in SaleBill cart items) would break

**If it stayed source of truth** (current model), the `product_packaging` table would:
1. Write to `selling_units` after deriving
2. Existing POS code continues unchanged
3. `selling_unit.id` remains stable
4. No migration of existing data needed

**Recommendation:** Keep `selling_units` as source of truth. Make the packaging builder **write to** `selling_units` after deriving. This is the non-destructive path.

---

## 3. `base_unit_id` — Usage Audit

### Every place it's used

| File | Usage | Field Role |
|------|-------|------------|
| `InventoryService::applyMovement()` | `'unit' => $product->base_unit_id` | Label for inventory transactions |
| `ProductService::create()` | `'unit_id' => $data->baseUnitId` | Sold to selling_unit | SellingUnit.unit_id reference |
| `PurchaseService::create()` | `$this->resolveUnitName($product->base_unit_id)` | Human-readable name for purchase bill item |
| `CreateProductData` | `baseUnitId: $data['base_unit_id']` | DTO — passed through from request |
| `CreateProductRequest` | `'base_unit_id' => 'required|string|max:50'` | Validation |
| `Product model` | `$fillable` | Persisted column |
| `InventoryTransaction` | `'unit' => ...` | Informational label on movements |

### What `base_unit_id` actually IS

It is the **canonical stock-keeping unit**. It tells the system:
1. "What unit is stock stored in?" (the denominator for all conversions)
2. "What label should inventory transactions show?" (e.g. "capsule", "g", "kg")
3. "What measurement type are we dealing with?" (derived via `getMeasurementType(base_unit_id)`)

### Does it need renaming?

**No.** It does three jobs and does them well. Renaming to `default_unit_id` would require changing 15+ files for zero business value. The name `base_unit_id` is accurate — it IS the base unit for stock.

### Can the desired UX be achieved without changing it?

**Yes.** The Quick Entry form just needs to set `base_unit_id` to 'piece' by default (which it already does). When the user changes `base_unit_id` to 'kg', the measurement intelligence detects this via `getUnit(base_unit_id).measurementType === 'weight'` and auto-generates selling units. Zero DB changes needed.

---

## 4. Unit Management — Comparing Approaches

### Current state

| Property | Current Implementation |
|----------|----------------------|
| **Where defined** | `resources/js/lib/units.ts` — hardcoded JS object |
| **How resolved** | `getUnit(id)` → `UNITS[id]` |
| **Conversions** | `convert(value, from, to)` — pure function |
| **Measurement types** | count, weight, volume, length |
| **Number of units** | 21 (built-in) |
| **Frontend access** | Direct import — fast, no network |
| **Backend access** | `DB::select('SHOW COLUMNS')` not used; `base_unit_id` stored as string, resolved only for display |
| **Duplicate prevention** | None — user can type any string in selling unit name |
| **Multilingual** | Not supported (English only) |
| **Extensibility** | Users can't add custom unit types |

### Option A: Keep current + Autocomplete component

| Dimension | Assessment |
|-----------|------------|
| **Complexity** | Low. Add a `UnitAutocomplete.tsx` component that reads from `units.ts` + existing selling unit names in the DB. |
| **Migration** | None. Add component, integrate into form. |
| **Performance** | Excellent — local JS object, no DB query. |
| **Maintainability** | Adding new units requires code change. Admin users cannot add custom units. |
| **Future extensibility** | Good for single-language, single-region. Weak for multi-language. |
| **Multilingual support** | Need to refactor `units.ts` for translations. Doable but complex. |
| **Typo prevention** | ✅ Autocomplete prevents typos. `findUnitByName()` mildly normalises. |

### Option B: `product_units` DB table

| Dimension | Assessment |
|-----------|------------|
| **Complexity** | Medium. New migration, model, seeder, API endpoint, cache layer, admin UI. |
| **Migration** | Medium. Must seed existing 21 units + migrate existing `base_unit_id` strings. |
| **Performance** | Good (cached query). Slightly slower than local JS but negligible. |
| **Maintainability** | Admin can add/rename units without a code deploy. Better for multi-region. |
| **Future extensibility** | Strong. Admin UI for custom unit types, multilingual via DB rows. |
| **Multilingual support** | Natural fit — name column + locale column or JSON translations. |
| **Typo prevention** | ✅ Autocomplete + DB unique constraint. Strongest guarantee. |

### Recommendation

**Option A for now.** The cost/benefit of Option B doesn't justify it for MVP. A frontend autocomplete component solves the duplicate-unit-name problem immediately, with zero infrastructure changes. If the product expands to multi-language or multi-tenant, revisit Option B then.

**Implementation:** A `<UnitAutocomplete>` component that:
1. Reads from `UNITS` in `units.ts`
2. Also queries existing `selling_units.name` from the loaded product list
3. Shows suggestions as user types
4. Falls back to free-text if no match

---

## 5. Packaging Hierarchy — Options Comparison

### Option A: Extend `selling_units` model

Add `parent_id` and `level` columns to `selling_units`:

```php
$table->foreignId('parent_id')->nullable()->constrained('selling_units');
$table->tinyInteger('level')->nullable();
```

Then derive: Box → parent=NULL, level=1; Pack → parent=Box, level=2; Capsule → parent=Pack, level=3.

**Pros:**
- No new table
- Existing dependency on `selling_units` unchanged
- Derivation walks parent chain

**Cons:**
- Circular reference risk (A→B→A)
- `selling_units` currently has `product_id` FK — parent must be same product
- Editing re-parenting is fragile
- Mixes packaging structure with pricing/sale config
- Level column needs manual ordering management

### Option B: Introduce `product_packaging` table (recommended)

Clean separation of concerns:

```
product_packaging { container_unit_id, contains_unit_id, quantity, level }
     │
     ▼ Derivation Engine
     │
     ▼ selling_units { product_id, name, quantity, sale_price, ... }
                         ↑ derived or explicit
```

**Pros:**
- Clear domain boundary: packaging structure is independent of selling config
- No circular reference risk (FKs to `product_units` or use existing `selling_units` as unit references)
- Level column is explicit and editable
- Derivation engine is a single service — no scattered logic
- Selling units remain stable in format consumed by POS

**Cons:**
- New table + migration
- New service class
- Existing products without packaging get no benefit (but also no harm)

### Recommendation: **Option B**

The `selling_units` table should NOT be burdened with hierarchy logic. It already serves as:
- Pricing source (sale_price)
- Default indicator (is_default)
- Barcode/SKU per unit
- POS dropdown data source

Adding parent/child/level to `selling_units` would blur its purpose and risk destabilising the 10+ files that depend on it. A new `product_packaging` table keeps the packaging concern isolated.

---

## 6. Return Flows — Verified

Both `PurchaseReturnService` and `SaleReturnService` reference `base_unit_id` in inventory transactions. They do NOT use `selling_units` directly — they reverse the original bill items.

This is important because it confirms that **returns bypass the selling unit layer entirely** and work directly with base units from the original transaction. Any packaging hierarchy change would NOT affect return logic.

---

## 7. Migration Cost Analysis

| Proposal | Effort | Files Changed | Regression Risk | Backend | Frontend | Schema |
|----------|--------|---------------|-----------------|---------|----------|--------|
| **Quick Entry** (frontend restructure) | 2-3h | 2 | 🟢 Low | 0 files | 2 files | None |
| **Measurement intelligence** (auto selling units) | 1h | 2 | 🟢 Low | 0 files | 2 files | None |
| **Single-pack default name** | 0.5h | 2 | 🟢 Low | 0 files | 2 files | None |
| **Unit autocomplete** (Option A) | 1-2h | 2 (+1 new) | 🟢 Low | 0 files | 2 + 1 new | None |
| **product_units table** (Option B) | 4-6h | 8+ | 🟡 Medium | 4 files | 2 files | New table |
| **product_packaging table** | 3-5h | 6 (+2 new) | 🟡 Medium | 3 files | 2 + 1 new | New table |
| **Derivation engine** | 2-3h | 2 (+1 new) | 🟢 Low | 1 new service | 0 files | None (uses existing) |

---

## 8. Corrected Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                       PRODUCT FORM                               │
│  ┌─ Quick Entry ─────────────────────────────┐                   │
│  │ Name, Price, Unit (Piece/kg/Box…)         │ ← Minimal fields  │
│  │ → Auto selling unit from measurement type │                   │
│  │ → Single-pack default name                │                   │
│  └───────────────────────────────────────────┘                   │
│  ┌─ More Details (optional) ─────────────────┐                   │
│  │ Category, SKU, Barcode, Stock              │                   │
│  │ ┌─ Add Selling Sizes ──────────────────┐  │                   │
│  │ │ Packaging Levels Builder             │  │  NEW               │
│  │ │ "Box contains 12 Pack"              │  │                   │
│  │ │ "Pack contains 10 Capsule"          │  │                   │
│  │ │ → Derivation Engine → selling_units  │  │                   │
│  │ └─────────────────────────────────────┘  │                   │
│  └───────────────────────────────────────────┘                   │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                      PRODUCTS TABLE                              │
│  id, name, sku, base_unit_id, stock_quantity, ...                 │
│                                                                  │
│  ┌──────────────────┐   ┌──────────────────┐  (NEW, optional)   │
│  │  SELLING_UNITS   │   │product_packaging │                     │
│  │ (persistent,     │   │(if multi-level)  │                     │
│  │  source of truth)│   │                  │                     │
│  │ id, product_id,  │   │ container_id     │                     │
│  │ name, quantity,  │   │ contains_id      │                     │
│  │ sale_price, ...  │   │ quantity, level  │                     │
│  └──────────────────┘   └──────────────────┘                     │
│                              │                                    │
│                              ▼                                    │
│                     Derivation Engine                             │
│                     (PackagingService)                            │
│                              │                                    │
│                              ▼                                    │
│                     SELLING_UNITS (populated)                     │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│   PURCHASE BILL    │     SALE BILL       │  INVENTORY SERVICE   │
│   purchase_pack_qty│  selling_unit dropdown│ recordSale(quantity)│
│   purchase_qty     │  packaging_qty      │  +InventoryTransaction│
│   → baseQty (server)│ base_unit_qty       │  running_balance    │
│   → recordPurchase │  → baseQty (server) │                     │
│                    │  → recordSale        │                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 9. Final Recommendations

### Do First (2-3 days total)

| Priority | Task | Scope | Risk |
|----------|------|-------|------|
| P1 | Restructure `CreateProduct.tsx` for Quick Entry | Frontend only | 🟢 |
| P2 | Auto-selling-units for measurement/packaging units | Frontend only | 🟢 |
| P3 | Single-pack default selling unit name | Frontend only | 🟢 |
| P4 | `UnitAutocomplete` component (Option A) | Frontend only | 🟢 |

### Do Second (after P1-P4)

| Priority | Task | Scope | Risk |
|----------|------|-------|------|
| P5 | `product_packaging` table + model + migration | Backend | 🟡 |
| P6 | `PackagingService` derivation engine | Backend | 🟢 |
| P7 | `PackagingLevelsBuilder` UI component | Frontend | 🟡 |
| P8 | Integrate builder into CreateProduct + EditProduct | Both | 🟡 |

### Do NOT Do

| Proposal | Reason |
|----------|--------|
| `product_units` table | Over-engineered for current needs. `units.ts` + autocomplete suffices. |
| Rename `base_unit_id` → `default_unit_id` | 15+ file changes for zero business value. |
| Make `selling_units` fully derived | Would break 10+ dependents. Stable as source of truth. |
| Rewrite return services | Already work in base units. No packaging change affects them. |
