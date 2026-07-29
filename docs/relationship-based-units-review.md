# Architecture Review: Relationship-Based Unit Model

**Date:** 2026-07-28
**Context:** Evaluation of a proposed "Relationship-Based Unit Model" for Invenos POS
**Status:** Architecture review — not an implementation plan

---

## Executive Summary

The proposed Relationship-Based Unit Model is a **significant improvement** over the current Base Unit + Packaging Hierarchy model. It eliminates the single biggest UX problem — forced direction — and replaces it with a natural, bidirectional relationship definition.

**However**, there are five architectural issues that must be addressed before this can work with the existing Invenos codebase:

1. **Inventory needs a canonical unit** — the "Base Unit" as "default operating unit" is insufficient for stock tracking
2. **Bidirectional relationships must be normalised internally** — the DB needs a consistent direction for calculations
3. **The current database schema (`selling_units`, `product_packaging`) cannot support this cleanly** — changes are needed
4. **The Derivation Engine assumes a hierarchy** — it must be replaced with a conversion graph walker
5. **Purchase and Sale flows need a single authoritative conversion** — bidirectional relationships must resolve to one direction for inventory math

**Verdict:** The model is sound, but needs one modification: keep the Base Unit as the **Inventory Anchor** (the single unit all stock math normalises to), while allowing relationships to be defined in any direction. This is a **moderate refactoring** — the backend changes are manageable, the frontend needs a new relationship editor, and the database needs a new `product_relationships` table.

---

## 1. Review of the Proposed UX

### What Works Well

| Aspect | Why It Works |
|--------|-------------|
| **Base Unit as default, not smallest** | Eliminates the "what's the base unit?" confusion. If you only sell in Cartons, Base = Carton. Done. |
| **Bidirectional relationships** | "1 Strip = 12 Capsules" OR "12 Capsules = 1 Strip" — both valid, user chooses |
| **Flat relationship list** | No hierarchy to maintain, no levels to reorder |
| **Minimal default form** | Name + Base Unit + Price = Save for simple products |
| **No inference** | Business decides everything explicitly |

### UX Issues to Address

| Issue | Why It's a Problem | Fix |
|-------|-------------------|-----|
| **"Base Unit" still implies primacy** | Users may think "Base = smallest" even if stated otherwise | Rename to **"Default Unit"** in the UI |
| **Price field is ambiguous** | "Price" of what? Per Base Unit? Per some other unit? | Label as "Price per [Default Unit]" |
| **Relationship direction creates a `quantity` field with no context** | "1 [Carton] = [20] [Piece]" — which side is the quantity for? | Auto-compute: if left is 1, then right = 20. If right is 1, then left = 20. Always normalise to "1 X = N Y" internally. |
| **Duplicate detection isn't obvious** | User might create "Carton = 20 Pieces" AND "Pieces per Carton = 20" — same fact, different direction | Normalise both to `1 Carton = 20 Pieces` on save |
| **No way to define purchase-only or sale-only relationships** | A wholesaler may buy in Pallets but sell in Boxes — not all units need prices on both sides | Add "sale price" and "purchase cost" columns to each relationship row |

### UX Recommendation

Combine the relationship editor with prices:

```
┌──────────────────────────────────────────────┐
│  Default Unit: [Capsule ▼]                    │
│  Price: [Rs. 5 per Capsule]                   │
│                                                │
│  ── Other units ──                            │
│                                                │
│  +── 1 [Strip ▼]  =  [10] [Capsule]  ──────+ │
│  │  Sale price: [Rs. 50 per Strip]          │ │
│  │  Barcode: [89012345678]                  │ │
│  +──────────────────────────────────────────+ │
│                                                │
│  +── 1 [Box ▼]  =  [120] [Capsule]  ────────+ │
│  │  Sale price: [Rs. 500 per Box]            │ │
│  │  Barcode: [89012345679]                  │ │
│  +──────────────────────────────────────────+ │
│                                                │
│  [+ Add unit]                                  │
│                                                │
│  ── Purchase (optional) ──                    │
│  +── 1 [Carton ▼]  =  [1200] [Capsule]  ────+ │
│  │  Cost: [Rs. 4,500 per Carton]             │ │
│  +──────────────────────────────────────────+ │
│                                                │
│  [Save]                                        │
└──────────────────────────────────────────────┘
```

---

## 2. Frontend Impact

### Assessment: Moderate refactoring

| Component | Change Required | Effort |
|-----------|----------------|--------|
| **ProductForm.tsx** | Replace inline conversion + packaging builder + selling sizes with flat relationship editor | Large — but simplifies the component overall |
| **New: UnitRelationEditor** | New component for the "1 X = N Y" rows with autocomplete | Medium |
| **UnitAutocomplete** | Already exists (in PackagingLevelsBuilder) — reuse | Small |
| **SaleBill.tsx** | Reads selling units from product data — needs to read from relationships instead | Small |
| **PurchaseBill.tsx** | Same — reads purchase units from product data | Small |
| **Clinic AddMedicineDialog** | Reads selling units from product data | Small |

### Frontend Benefits

- **Simpler form** — no more "is it measurement or packaging?" branching
- **Clearer data model** — one relationship editor instead of three overlapping concepts
- **Reusable component** — `UnitRelationEditor` can be used in Purchase and Sale too
- **Removes the inline conversion** — no more duplicate path

### Frontend Risks

- **Relationship editor is more flexible but also more open-ended** — user might create confusing relationships (e.g., "1 Capsule = 1000 Strips")
- **Autocomplete must be fast** — if it lags, the UX degrades
- **Legacy products** (with `selling_units` + `product_packaging`) need frontend migration logic

---

## 3. Backend Impact

### Assessment: Moderate refactoring

| Service | Current | After |
|---------|---------|-------|
| **ProductService::create()** | Writes to 3 tables (packaging, selling_units, product) | Writes to 2 tables (product, relationships) |
| **ProductService::update()** | Deletes+re-creates packaging, ignores selling_units | Upserts relationships, validates no cycles |
| **PackagingDerivationEngine** | Walks hierarchy, derives selling units | **Removed** — replaced by conversion graph |
| **SaleService::create()** | Reads `selling_units` table | Reads `product_relationships` table |
| **PurchaseService::create()** | Uses `purchase_pack_qty` directly | Same — but can get purchase unit from relationships |
| **InventoryService** | Tracks in `base_unit_id` | Tracks in `default_unit_id` (same concept, new name) |

### New: ConversionGraphService

```php
class ConversionGraphService
{
    /**
     * Get how many default units are in a given unit.
     * E.g. getConversion(productId: 1, unitName: 'Box') → 120
     */
    public function getConversion(int $productId, string $unitName): float

    /**
     * Convert a quantity from any unit to the default unit.
     * E.g. convert(productId: 1, qty: 2, fromUnit: 'Box') → 240
     */
    public function convert(int $productId, float $quantity, string $fromUnit): float

    /**
     * Validate that relationships are consistent (no cycles, no conflicts).
     */
    public function validate(array $relationships): ValidationResult
}
```

This replaces the Derivation Engine entirely. The graph walk is simpler (no hierarchy, just flat conversion pairs).

### Backend Risks

- **Circular relationships:** 1 Box = 12 Strips AND 1 Strip = 1/12 Box — must detect circular references
- **Multiple paths:** If Box → Capsule is defined as 120 directly AND also via Box → Strip → Capsule, they must match
- **Performance:** For products with 10+ relationships, graph traversal must be efficient

---

## 4. Database Impact

### Assessment: New table needed

**Current schema** (messy):

```
selling_units           → id, product_id, name, unit_id, quantity, sale_price, is_default, packaging_id
product_packaging       → id, product_id, container_unit_id, contains_unit_id, quantity, level
products.base_unit_id   → VARCHAR(50)
```

**Proposed schema** (clean):

```sql
-- Single relationship table replaces selling_units + product_packaging
CREATE TABLE product_relationships (
    id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id        BIGINT UNSIGNED NOT NULL,
    unit_name         VARCHAR(100) NOT NULL,       -- "Strip", "Box", "Carton"
    unit_id           VARCHAR(50) NOT NULL,         -- underlying measurement unit
    quantity          DECIMAL(12,4) NOT NULL,        -- how many DEFAULT units in 1 of this
    sale_price        DECIMAL(12,0) DEFAULT NULL,
    purchase_cost     DECIMAL(12,0) DEFAULT NULL,
    barcode           VARCHAR(100) DEFAULT NULL,
    is_default_sale   BOOLEAN DEFAULT FALSE,
    is_default_purchase BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX (product_id)
);

-- The default unit itself is a relationship with quantity=1
-- products.default_unit_id → VARCHAR(50)

-- All prices live on relationships, not on a separate "selling units" concept
```

**Migration path:**
1. Create `product_relationships` table
2. Migrate existing `selling_units` rows → `product_relationships` (with sale_price)
3. Migrate existing `product_packaging` rows → compute transitive quantity, create relationship
4. Migrate `products.base_unit_id` → `products.default_unit_id`
5. Keep old tables for backward compatibility during transition
6. Drop old tables after full migration

---

## 5. Inventory Impact

### Assessment: Needs clarification

**Critical question:** What unit is inventory tracked in?

The proposed model says Base Unit is the "default operating unit." But if inventory is tracked in Base Unit, and Base Units can be Cartons, Boxes, OR Capsules depending on the business — then the inventory system needs to handle all three.

**Current:** Inventory is always in `base_unit_id`. Stock math (`stock_quantity ± quantity`) operates on this unit.

**Proposed:** Same, but `default_unit_id` replaces `base_unit_id`. Stock math is unchanged.

**The real question:** When a Sale is created for 2 Boxes, how does inventory know to deduct 240 Capsules?

**Answer:** The `ConversionGraphService::convert()` computes the quantity in default units:

```php
$defaultQty = $conversionGraph->convert(
    productId: $product->id,
    quantity: $item->packagingQuantity,  // 2
    fromUnit: $item->unitName           // "Box"
);
// → 240 (if default unit is Capsule, Box = 120)
```

This is what the current `SaleService::create()` already does, but it reads from `selling_units.quantity` instead.

**No architectural change to inventory.** Same math, different source table.

---

## 6. Purchase & Sale Impact

### Assessment: Low impact — reads change source, math unchanged

| Flow | Current | After | Change |
|------|---------|-------|--------|
| **Sale item added** | `baseQty = qty × sellingUnit.quantity` | `baseQty = qty × relationship.quantity` | Same math, different source |
| **Purchase item added** | `baseQty = packQty × purchaseQty` | `baseQty = packQty × purchaseRelationship.quantity` | Same math, different source |
| **Inventory deduction** | `stock_quantity -= baseQty` | `stock_quantity -= baseQty` | Unchanged |
| **Sale item display** | Reads `packaging_name` from `sale_items` | Same — `sale_items` snapshots are unchanged | None |
| **Purchase item display** | Reads `purchase_pack_name` from `purchase_bill_items` | Same | None |
| **Reports** | Reads snapshotted data | Same | None |

**Everything that matters is unchanged.** The relationship model only changes how conversions are *stored*, not how they're *used* at transaction time. Historical data is unaffected.

**What becomes easier:**
- Adding a new unit to a product (just add one relationship row)
- Changing a conversion factor (update one row)
- The derivation engine goes away (replaced by simple lookup)

**What becomes slightly harder:**
- The POS dropdown now reads from relationships instead of selling_units (one query change)
- The purchase bill unit selector also reads from relationships

---

## 7. Risks & Edge Cases

### Risk 1: Circular Relationships (HIGH)

User creates:
- 1 Carton = 10 Boxes
- 1 Box = 1/10 Carton

These are equivalent. The system should normalise to one representation.

**Mitigation:** Normalise all relationships to "1 X = N Y" where Y is the default unit, X is the new unit, and N > 0. Detect and reject cycles.

### Risk 2: Transitive Inconsistency (MEDIUM)

User creates:
- 1 Box = 120 Capsules
- 1 Strip = 10 Capsules
- 1 Box = 10 Strips

If the user then changes "1 Strip = 15 Capsules," the system must detect that "1 Box = 10 Strips" is now inconsistent with "1 Box = 120 Capsules" (10 × 15 = 150, not 120).

**Mitigation:** Store each relationship independently. Do NOT derive transitive quantities. Validate on save: "This change would make 1 Box inconsistent with existing relationships. Do you want to update Box as well?" Let the user decide.

### Risk 3: Unit Name Collisions (LOW)

User creates "Strip" and "strip" and "Strips" as different units.

**Mitigation:** The `product_relationships.unit_name` column is a normalised string (Title Case, singular). Use autocomplete + validation to enforce consistency. The `product_units` table already serves as the name registry.

### Risk 4: Relationship Without Price (LOW)

A user creates "1 Box = 12 Strips" but doesn't set a price for Box. The POS shows Box in the dropdown with price 0.

**Mitigation:** The relationship editor should require a price for at least one unit (the default unit's price). Additional units can have price = 0 — they show as available but cost 0 until configured.

### Risk 5: Mixed Measurement Types (MEDIUM)

User creates:
- Base Unit: kg
- Relationship: "1 Box = 12 Pieces"

This mixes weight and count. The system shouldn't prevent it — a shop CAN sell a Box containing 12 items each weighing 1kg. But the conversion math needs the user to specify which measurement type applies.

**Mitigation:** Each relationship has a `unit_id` (the underlying measurement unit). "1 Box = 12 Pieces" → unit_id = 'piece', quantity = 12. The system tracks stock in the default unit's measurement type, not the relationship's type. Each relationship is independently converted.

### Risk 6: Existing Data Migration (MEDIUM)

Existing products have `selling_units` with `packaging_id` references. These must be migrated to `product_relationships`.

**Mitigation:** Write a one-time migration script that:
1. Reads all `selling_units` → creates relationships with sale prices
2. Reads all `product_packaging` → computes transitive quantities → creates relationships
3. Deduplicates: if a relationship already exists for "Strip" with the same quantity, skip
4. Verifies: all existing `sale_items` and `purchase_bill_items` still resolve correctly

---

## 8. Recommended Changes to the Proposal

### Change 1: Keep a Default Unit with Inventory Anchor

The proposal says Base Unit = "default operating unit" with no special meaning. This is insufficient for inventory tracking:

```php
// When a sale deducts stock, it needs to know what unit to convert *to*
$defaultUnit = $product->default_unit_id;  // "capsule"
$convertedQty = $qty * $relationship->quantity;  // 2 Box × 120 = 240
$product->stock_quantity -= $convertedQty;  // deduct 240 capsules
```

**Recommendation:** Keep `default_unit_id` but explicitly document it as the **Inventory Unit** (the unit stock is tracked in). This is the unit all conversions normalise to. Users choose it. The system does not infer it.

### Change 2: Normalise Direction on Save

The UI shows "1 Strip = 12 Capsules" but the backend stores it as:

```json
{
  "unit_name": "Strip",
  "unit_id": "capsule",
  "quantity": 12,
  "sale_price": 50
}
```

This normalises **every** relationship to "1 NewUnit = N DefaultUnits." The direction is always the same internally, regardless of how the user typed it.

**If the user types "12 Capsules = 1 Strip" → normalise to "1 Strip = 12 Capsules" on save.**

### Change 3: Remove the Derivation Engine

The current `PackagingDerivationEngine` walks a hierarchy and creates selling units. In the relationship model, there's no hierarchy and no derivation — relationships ARE the units.

**Replace with `ConversionGraphService`:** Given a product ID and a unit name, returns the quantity in default units. Pure function, no side effects, no materialised selling units.

### Change 4: Merge Purchase and Sale into One Relationship Table

The proposal already does this implicitly. Make it explicit:

```
product_relationships:
  unit_name         → display name
  quantity          → how many default units
  sale_price        → NULL if not sold in this unit
  purchase_cost     → NULL if not purchased in this unit
  barcode, sku      → per-unit identifiers
  is_default_sale   → shown first at POS
  is_default_purchase → default purchase unit
```

**A relationship is a unit.** It may be:

| Type | sale_price | purchase_cost | Example |
|------|-----------|--------------|---------|
| Sell-only | 50 | NULL | Strip (pharmacy sells but doesn't buy in Strips) |
| Buy-only | NULL | 4500 | Carton (warehouse buys but doesn't sell in Cartons) |
| Both | 50 | 4500 | Box (wholesaler buys and sells in Boxes) |
| Reference | NULL | NULL | Pallet (used internally but not transacted) |

---

## 9. Alternative Solutions

### Alternative A: Keep Current Schema, Fix the UX Only

**What:** Don't change the database. Just fix the ProductForm to use the relationship editor UI, but map it to the existing `selling_units` and `product_packaging` tables behind the scenes.

**Pros:** Zero database migration, no backend refactoring, works immediately with existing data.
**Cons:** You're still maintaining three table with overlapping semantics. The backend Derivation Engine still exists. The UX fix is cosmetic, not architectural.

**Verdict:** Treat this as a short-term fix. Still plan for the full migration.

### Alternative B: Full Migration to `product_relationships`

**What:** The proposal as described, with the changes above.

**Pros:** One table, clean semantics, removes three concepts (packaging, selling_units, derivation).
**Cons:** Migration effort, must support legacy data during transition.

**Verdict:** This is the recommended approach.

### Alternative C: Hybrid — Add `product_relationships`, Keep Old Tables Read-Only

**What:** Create `product_relationships` as the new source of truth. Write to it. Read from it. Keep old tables as historical snapshots that new code ignores.

**Pros:** Clean break, no migration required for existing data (old products still work through legacy code paths), new code is clean.
**Cons:** Two systems in parallel during transition — technical debt until old tables are dropped.

**Verdict:** Best for a gradual rollout. New products use relationships. Old products continue using the legacy tables until they're edited (at which point they migrate).

---

## 10. Final Recommendation

**Adopt the Relationship-Based Unit Model** with the following modifications:

| Proposal | Our Version | Why |
|----------|-------------|-----|
| Base Unit = "default operating" | **Default Unit = Inventory Anchor** | Stock math needs a canonical unit |
| Bidirectional normalisation | **Always normalise to "1 X = N DefaultUnits"** | Consistent internal representation |
| Derivation Engine | **Replace with ConversionGraphService** | Simpler, no side effects |
| Separate selling/purchase | **Single `product_relationships` table with sale_price + purchase_cost** | One concept, two price columns |

### Effort Estimate

| Layer | Change | Effort |
|-------|--------|--------|
| Database | New `product_relationships` table + migration scripts | Low (2 files) |
| Backend | New `ConversionGraphService` + deprecate `PackagingDerivationEngine` | Medium (~200 lines) |
| Backend | Update `SaleService::create()` | Small (~5 lines) |
| Backend | Update `ProductService::create/update` | Medium (~50 lines) |
| Frontend | New `UnitRelationEditor` component | Medium (~300 lines) |
| Frontend | Update `ProductForm.tsx` — replace 3 sections with 1 | Medium (~150 lines changed) |
| Frontend | Update `SaleBill.tsx` to read from relationships | Small (~10 lines) |
| Frontend | Update `PurchaseBill.tsx` | Small (~10 lines) |
| Migration | Script to migrate existing data | Medium (~100 lines) |

**Total:** ~800 new/changed lines, ~2 dedicated sessions.

### Timeline

| Phase | What | When |
|-------|------|------|
| **P1** | `product_relationships` table + `ConversionGraphService` | Session 1 |
| **P2** | `UnitRelationEditor` component + update ProductForm | Session 2 |
| **P3** | Update SaleBill, PurchaseBill, Clinic to read from relationships | Session 2 |
| **P4** | Migration script + legacy compatibility layer | Session 3 |
| **P5** | Testing + cleanup + deprecate old tables | Session 3 |

### Risks of NOT Doing This

- The current 3-table model continues to cause UX confusion with every new feature
- The Derivation Engine is a constant source of bugs (duplicate selling units, orphan cleanup, price override loss)
- Purchase and Sale units remain disconnected concepts (separate tables, separate UIs)
- Every new module (Manufacturing, BOM, Multi-warehouse) would need to work around the hierarchy assumption
