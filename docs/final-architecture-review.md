# Final Architecture Review — Packaging, Units & Product Entry

---

## 1. Packaging Model: Three Approaches Compared

| Dimension | Option A: Extend `selling_units` | Option B: Fully Derived `selling_units` | **Option C: Hybrid (`product_packaging` + `selling_units`)** |
|-----------|----------------------------------|------------------------------------------|--------------------------------------------------------------|
| **Complexity** | Low (add 2 columns) | Medium (derivation service + cache) | Medium (new table + derivation service) |
| **Maintainability** | Fragile — mixing hierarchy with pricing | Good — single source of derivation | **Best** — clear domain separation |
| **Migration effort** | Low (add columns, no backfill) | Medium (must regenerate all products) | **Low** (new table, no existing data migration) |
| **Editing experience** | Re-parenting is risky (circular) | Delete + regenerate = loses custom prices | **Clean** — regenerate derived units, preserve custom overrides |
| **Custom prices/barcodes** | Stays on the selling_unit row | LOST on regeneration | **Preserved** — derivation never overwrites custom data |
| **POS dependency** | `selling_unit.id` stable | `selling_unit.id` changes daily | **Stable** — ids only change when user explicitly adds/removes |
| **Future BOM/manufacturing** | Poor — can't represent different hierarchies | Poor — tightly coupled | **Good** — separate table can represent ingredient structures |
| **Architectural cleanliness** | Muddy — 2 concerns in 1 table | Clean but rigid | **Cleanest** — structure in one place, runtime config in another |

### Recommendation: 🟢 Option C — Hybrid

However, the table schema must be corrected to avoid circular dependencies (see §1a below).

---

## 1a. Correcting the Circular Dependency

**Problem with the previous schema:**

```
product_packaging
  │
  ├── parent_selling_unit_id  REFERENCES selling_units(id)  ← CIRCULAR
  └── child_selling_unit_id   REFERENCES selling_units(id)  ← CIRCULAR
```

This creates a circular dependency:
- `selling_units` is derived FROM `product_packaging`
- BUT `product_packaging` REFERENCES `selling_units`

On creation: neither can exist without the other → deadlock.

**Root cause:** Using `selling_units.id` as the FK target. The packaging structure should be defined in terms of unit NAMES, not runtime IDs.

**Solution:** `product_packaging` stores unit names as normalised strings. No FK to `selling_units`.

```sql
CREATE TABLE product_packaging (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id        BIGINT UNSIGNED NOT NULL,
  container_name    VARCHAR(100) NOT NULL,         -- e.g. "Box"
  contains_name     VARCHAR(100) NOT NULL,         -- e.g. "Pack"
  quantity          DECIMAL(12,4) NOT NULL,         -- e.g. 12
  level             TINYINT UNSIGNED NOT NULL,      -- 1, 2, 3…
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

**Why this works:**

| Concern | Mechanism |
|---------|-----------|
| **Packaging structure defined** | `product_packaging` rows with `container_name`, `contains_name`, `quantity` |
| **Unit names normalised** | Frontend autocomplete ensures names match existing `selling_units.name` values |
| **Derivation** | `PackagingService` reads `product_packaging`, walks the graph, finds-or-creates `selling_units` rows WHERE `name = container_name (or contains_name)` AND `product_id = X` |
| **No circular dependency** | `product_packaging` has NO FK to `selling_units`. The link is via matching name strings at the application layer. |
| **No `product_units` table needed** | Names are strings, normalised by the frontend autocomplete. The existing `selling_units.name` column serves as the de facto unit registry. |

**Derivation engine logic:**

```
For each product_packaging row (ordered by level):
  1. Find or create selling_units row WHERE product_id = X AND name = container_name
  2. Find or create selling_units row WHERE product_id = X AND name = contains_name
  3. Set the "contains" unit's quantity to its direct parent quantity × child's quantity
     (recursively computed through the graph)

Name matching is case-insensitive, trimmed.
New rows are created with is_derived = true, sale_price = 0, barcode = null.
Existing rows with is_derived = true have their quantity updated but prices/barcodes preserved.
Existing rows with is_derived = false are never touched.
```

### Data Flow

```
product_packaging (strings)      selling_units (runtime)
      │                               │
      │  "Box"   → 12 → "Pack"        │  "Box"    qty: 120, price: 500, is_derived: true
      │  "Pack"  → 10 → "Capsule"     │  "Pack"   qty: 10,  price: 50,  is_derived: true
      │                               │  "Capsule" qty: 1,   price: 5,   is_derived: true
      │                               │
      ▼  no FK ─── name match ────►  ▲
  Derivation Engine                  │
  (PackagingService) ────────────────┘
```

---

## 2. Editing Workflow — With Explicit Override Rules

### Base Case: Change packaging quantity (12 Pack → 24 Pack per Box)

| Action | Rule |
|--------|------|
| **Quantity changes** | Recalculate all derived `selling_units.quantity` values downward through the graph |
| **Custom sale_price** | **Preserved** — matched by `name` on the derived row |
| **Custom barcode** | **Preserved** — matched by `name` |
| **Custom SKU** | **Preserved** — matched by `name` |
| **is_default** | **Preserved** — never overwritten by derivation |

### Deletion: Pack removed from packaging graph

```
Before: Box → Pack → Capsule
After:  Box → Capsule (Pack removed)
```

| What | Rule |
|------|------|
| **Derived "Pack" selling unit** | Deleted (no longer in packaging graph, `is_derived = true`) |
| **Custom "Pack" selling unit** | **Kept** — user explicitly created or modified it. `is_derived = false`. Becomes a standalone custom selling unit with its current price/barcode. |
| **"Pack" had barcode labels printed** | The unit remains in `selling_units`. Labels stay valid. It's just no longer "derived" from packaging. |
| **Sales using "Pack" in the past** | Unchanged — `sale_items` has its own snapshot. |

### Replacement: Pack → Strip

```
Before: Box → Pack → Capsule
After:  Box → Strip → Capsule
```

| What | Rule |
|------|------|
| **Old "Pack" selling unit** | Deleted (no longer in graph) UNLESS it has custom data → kept as standalone |
| **New "Strip" selling unit** | Created with `qty = derived`, `price = 0` (blank) |
| **Does Strip inherit Pack's price?** | **No.** Pack ≠ Strip. Name-based matching means no inheritance between different names. |
| **Pack's barcode labels** | Still valid if Pack was kept as a custom unit. If Pack was deleted, labels are invalid — user must reprint. |

### Summary

| Change | Rule |
|--------|------|
| **Same name, different qty** | Preserve price/barcode/SKU. Update qty. |
| **Name removed from graph** | Delete if derived; keep if custom. |
| **New name in graph** | Create new derived row with qty=derived, price=0. |
| **Name changed (Pack→Strip)** | Old name: same as "removed". New name: same as "new". No inheritance. |

---

## 3. Supplier Packaging vs Selling Packaging

**Decision: Supplier packaging remains entirely purchase-specific.**

### Justification

| Argument | Detail |
|----------|--------|
| **Different domains** | Supplier packaging is about procurement. Selling packaging is about retail. They serve different purposes. |
| **Already handled** | The purchase bill already captures supplier-specific packs via `purchase_pack_qty`, `purchase_pack_name`, and `unit_cost`. No additional model needed. |
| **Supplier can change** | A product can be purchased from Supplier A in cartons and Supplier B in boxes. `product_packaging` shouldn't encode a single source-of-truth for procurement. |
| **Supplier doesn't define retail** | If a supplier sells 1 Carton = 24 Box, but the store sells 1 Box = 12 Pack = 10 Capsules, the supplier's packaging is irrelevant to the POS. The store's packaging is what matters for sales. |
| **Future supplier-specific pricing** | If needed, a `supplier_products` table can link supplier-specific pack sizes without touching `product_packaging`. |

**Verdict:** Supplier packaging belongs in the purchase transaction, not in `product_packaging`.

---

## 4. Implementation Order (Time Estimates Removed)

| Phase | Tasks | Files | Risk | Dependencies |
|-------|-------|-------|------|-------------|
| **P1** | `product_packaging` migration + `PackagingService` derivation engine + `is_derived` column | 3 backend | 🟢 | None |
| **P2** | `PackagingLevelsBuilder` React component | 1 frontend | 🟢 | P1 (needs the table) |
| **P3** | Quick Entry restructure + measurement intelligence + unit autocomplete | 2 frontend | 🟢 | None |
| **P4** | Integrate packaging builder into CreateProduct + EditProduct forms | 2 frontend | 🟡 | P2 (component ready) |
| **P5** | Testing: all 4 UX scenarios + editing lifecycle + 5 stress test scenarios | — | 🟡 | P1–P4 complete |

**P3 is independent of P1/P2** — Quick Entry and measurement intelligence are frontend-only and can be built first for the fastest user-facing improvement.

---

## 5. Architecture Stress Test

### Scenario 1 — Medicine (Box→Pack→Capsule → change to Box→24 Pack)

```
Initial:
  product_packaging: Box→12→Pack, Pack→10→Capsule
  selling_units: Box(120), Pack(10), Capsule(1)  [all derived]

Change to:
  product_packaging: Box→24→Pack, Pack→10→Capsule

Derivation:
  Box qty recalculated: 24 × 10 = 240
  Pack qty unchanged: 10
  Capsule qty unchanged: 1
  Prices preserved by name match.
  Result: ✅

Historical transactions:
  purchase_bill_items: { product: Amoxil, pack: Box, qty: 12, cost: 240 }
  sale_items: { product: Amoxil, unit: Pack, qty: 2, baseQty: 20 }
  → Both unchanged. ✅
```

### Scenario 2 — Rice (kg, no packaging hierarchy)

```
product_packaging: (empty — measurement product)
base_unit_id: 'kg'
selling_units:
  "kg" (default, derived from measurement intelligence)
  "500g" (custom — user added)
  "250g" (custom)
  "100g" (custom)

Sale:
  Cashier selects "250g"
  → baseUnitQuantity = 250 (from selling_units.qty = 250g)
  → packagingQuantity × 250 = baseQty deducted from stock
  → Works ✅

Purchase:
  Purchase in kg (5 kg @ Rs. 200/kg)
  → purchase_pack_qty = 1, purchase_quantity = 5
  → baseQty = 5 kg added to stock
  → Works ✅
```

### Scenario 3 — Soft Drinks (Carton → Bottle)

```
product_packaging:
  Carton → 24 → Bottle

selling_units:
  Carton (derived, qty: 24)
  Bottle (derived, qty: 1)

POS: Cashier can select Carton or Bottle.
Purchase: Buy in Carton from supplier.
  → purchase_pack_qty = 24, purchase_quantity = 3
  → baseQty = 72 Bottles added to stock.
  → Works ✅
```

### Scenario 4 — Eggs (Tray → Piece)

```
product_packaging:
  Tray → 30 → Piece

selling_units:
  Tray (derived, qty: 30)
  Piece (derived, qty: 1)

POS: Cashier sells 2 Pieces of Eggs.
  → Works ✅
```

### Scenario 5 — Supplier Differs From Store

```
Supplier sells: Carton → 24 Box (at Rs. 480/carton)
Store sells:    Box → 12 Pack → 10 Capsule

Purchase:
  User buys 1 Carton from supplier
  → purchase_pack_qty = 24, purchase_quantity = 1, unit_cost = 480
  → baseQty = 24 Boxes added to stock
  → This is correct: 24 Boxes worth of stock (at the Box level)

Sale:
  Cashier sells 1 Pack
  → 1 Pack = 10 Capsules deducted from stock
  → Works ✅

The supplier's "Carton → 24 Box" is captured ONLY in the purchase transaction.
The store's "Box → 12 Pack → 10 Capsule" is captured in product_packaging.
They never conflict because they operate at different layers.
  ✅
```

### Scenario 6 — Historical Transaction After Packaging Change

```
Day 1:
  Box → 12 Pack → 10 Capsule
  Sale: 2 Packs → 20 Capsules deducted

Day 90:
  Change to: Box → 10 Pack → 10 Capsule

Day 91:
  View historical sale from Day 1.
  sale_items: { product: Amoxil, packaging_name: "Pack", packaging_qty: 2,
                base_unit_qty: 10, base_qty: 20, unit_price: 50 }
  → Packaging change does NOT retroactively change this record.
  → Inventory valuation at time of sale: correct.
  → Reports from Day 1: correct.
  ✅
```

### Stress Test Verdict

| Scenario | Supported? | Edge cases? |
|----------|-----------|-------------|
| Medicine: Box→Pack→Capsule | ✅ | Editing rules defined in §2 |
| Rice: measurement + custom packs | ✅ | No packaging table needed |
| Soft Drinks: Carton→Bottle | ✅ | Simple hierarchy |
| Eggs: Tray→Piece | ✅ | Count-based, works naturally |
| Supplier differs from store | ✅ | Separate concerns |
| Historical integrity | ✅ | Snapshot-based, no retroactive changes |

---

## 6. Historical Integrity

**Already correct.** No change needed.

The current architecture stores transactional snapshots:

| Table | Snapshots | Not retroactively affected by packaging changes |
|-------|-----------|-------------------------------------------------|
| `purchase_bill_items` | `purchase_pack_qty`, `purchase_quantity`, `unit_cost`, `product_name` | ✅ |
| `sale_items` | `packaging_quantity`, `base_unit_quantity`, `base_quantity`, `unit_price`, `product_name` | ✅ |
| `inventory_transactions` | `quantity` (base units), `running_balance` | ✅ |

This is the same pattern used for product names and prices — immutable at transaction time.

---

## 7. Migration Strategy

1. Create `product_packaging` table (no FK to `selling_units`)
2. Add `selling_units.is_derived` column (default `false`)
3. Existing products: **untouched**
4. New products: can optionally use packaging builder
5. No backfill needed
6. Rollback: drop `product_packaging` table, delete `is_derived` column
7. All existing code continues to work unchanged

---

## 8. Final Recommendations

| Decision | Verdict | Why |
|----------|---------|-----|
| **Hybrid packaging** (`product_packaging` + `selling_units`) | 🟢 Adopt | Clean separation, stable POS dependency |
| **`product_packaging` uses string names, not FK to selling_units** | 🟢 **Adopt** | Eliminates circular dependency. Derivation matches by name. |
| **Three-Unit Model** | 🟢 Adopt unchanged | Verified against purchase/sale/inventory code. No changes needed. |
| **Quick Entry restructure** | 🟢 Adopt | Frontend-only. 90% UX improvement, 0 DB changes. |
| **Measurement intelligence** | 🟢 Adopt | Auto-selling-units via `units.ts`. Already works conceptually. |
| **Supplier packaging → purchase-specific** | 🟢 Adopt | Purchase bill already captures this. `product_packaging` is for retail. |
| **`is_derived` flag** | 🟢 Adopt | Lets derivation engine distinguish derived vs custom units. |
| **`product_units` table** | 🔴 Reject | `units.ts` + autocomplete suffices for MVP. |
| **`base_unit_id` rename** | 🔴 Reject | 15+ file changes for zero business value. |
| **Editing rules** | 🟢 Adopt as defined in §2 | Name-based matching preserves custom overrides. No inheritance across different names. |

### What should be built first (fastest user-facing impact)

1. **Quick Entry restructure** (P3) — standalone, no new tables, frontend only
2. **Measurement intelligence** (P3) — frontend only, builds on Quick Entry
3. **`product_packaging` + derivation** (P1) — backend foundation
4. **Packaging builder UI** (P2 + P4) — frontend, depends on P1

This order delivers the most value fastest while the backend work proceeds in parallel.

### What should NOT be done

- `product_units` table
- `base_unit_id` rename
- Making `selling_units` fully derived
- Supplier packaging in `product_packaging`
