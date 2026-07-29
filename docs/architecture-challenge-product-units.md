# Challenging the Product Unit Architecture — A First-Principles Design Review

**Date:** 2026-07-28
**Status:** Design exploration — not an implementation plan

---

## Executive Summary

After challenging every assumption about how the current Product Unit architecture works, I've concluded that **"Base Unit" is a leaky abstraction** — it mixes database optimization with business terminology in a way that forces businesses to conform to the software instead of the software adapting to the business.

The architecture I recommend replaces "Base Unit" with a **User-Defined Stock-Keeping Unit (SKU Unit)** model where:

- The business chooses exactly what unit they count inventory in (no inference)
- Packaging is expressed as **conversions between units**, not a hierarchy anchored to a "base"
- Selling units and purchase units are **typed relationships** to the stock-keeping unit
- Measurement units are just units — no special treatment needed

This document challenges 12 fundamental assumptions, proposes 3 alternative architectures, stress-tests against 10 business types, and recommends the simplest model that scales.

---

## 1. Problems with the Current Thinking

### 1.1 The "Base Unit" Trap

The current architecture assumes every product has a fundamental atom — the base unit — and everything else is relative to it.

```
Box → 12 × Strip → 10 × Capsule
                      ↑
                    base unit = capsule
```

**Why this is wrong:**

| Assumption | Reality |
|-----------|---------|
| Every product has a single atomic unit | Many products are tracked at multiple levels (wholesale + retail) |
| The base unit is the smallest unit | Some businesses track at larger units (e.g., Rice in 50kg Bags) |
| The base unit is obvious | It's not — it depends on the business, not the product |
| Users think in base units | Users think in "what I count" — Strip or Box, not Capsule |

### 1.2 The Inference Fallacy

The architecture assumes the system can and should determine the "smallest unit."

**Why this is wrong:**

Two identical products, two different businesses:

```
Pharmacy A: Amoxil → inventory in Capsules (sells loose)
Pharmacy B: Amoxil → inventory in Strips (never breaks packs)
```

Both are correct. The system cannot infer which one a business uses. It should not try.

### 1.3 The Hierarchy Assumption

Packaging is modeled as a strict hierarchy:

```
Box → Strip → Capsule
```

**Why this is wrong:**

Not all packaging relationships are hierarchical:

- A "Combo Pack" contains 1 Shampoo + 1 Conditioner (different products)
- A "Sample Pack" contains 3 random flavours (different SKUs)
- A "Display Box" contains 12 mixed products (inventory of multiple items)

A strict hierarchy only works for same-product packaging.

### 1.4 The "Unit" Name Overload

The word "Unit" is used for:

| Concept | Where |
|---------|-------|
| Base Unit | `products.base_unit_id` |
| Selling Unit | `selling_units` table |
| Product Unit | `product_units` table (name registry) |
| Purchase Unit | Implied from purchase config |
| Measurement Unit | kg, g, L, ml — from `units.ts` |
| Stock Unit | Same as base unit |
| Inventory Unit | Same as base unit |
| Primary Unit | Same as base unit |
| Smallest Unit | Computed from packaging graph |

This overload guarantees confusion.

---

## 2. Challenged Assumptions

### Assumption 1: Products Need a Base Unit

**Challenge:** Remove it entirely.

**What replaces it:** The user defines exactly one **Stock-Keeping Unit** (SKU Unit) per product — the unit they physically count when doing inventory. This is a business decision, not a database requirement.

- Pharmacy A counts Capsules → SKU Unit = Capsule
- Pharmacy B counts Strips → SKU Unit = Strip
- Rice shop counts 50kg Bags → SKU Unit = 50kg Bag

**Trade-off:** The user must make one explicit decision. Benefit: inventory counts are always in units the business actually uses.

### Assumption 2: Inventory Must Be in the Smallest Unit

**Challenge:** Inventory can be in ANY unit the business chooses.

**Why:** If a pharmacy never sells loose capsules, tracking inventory in capsules creates unnecessary decimal noise (0.05 Strip). Track in Strips instead.

**When small units matter:** For businesses that open packs and sell individual units (pharmacy selling single capsules, fabric store selling by the meter), they should choose the smaller unit.

### Assumption 3: Packaging Is a Hierarchy

**Challenge:** Packaging is a **directed conversion graph**, sometimes hierarchical, sometimes not.

**Alternative models:**
- **Hierarchy** (current): Box → Strip → Capsule. Simple but rigid.
- **Conversion table**: Box = 120 Capsules, Strip = 10 Capsules. Flat, flexible.
- **Relationship pairs**: 1 Box ↔ 12 Strips, 1 Strip ↔ 10 Capsules. Bidirectional.
- **Container model**: Box contains 12 Strips, Strip contains 10 Capsules. Natural language but assumes hierarchy.

**Recommendation:** **Relationship pairs** — each pair is a standalone "X contains Y × Z" statement. The system detects cycles and validates consistency, but the user doesn't need to think about levels.

### Assumption 4: Selling Units Are a Separate Concept

**Challenge:** Selling units are just **units with a price**. They should not be a separate table from packaging definitions.

**Alternative:** A selling unit IS a packaging relationship with a price:

```json
{
  "unit_name": "Strip",
  "contains": { "unit_name": "Capsule", "quantity": 10 },
  "sale_price": 50,
  "barcode": null
}
```

The "base unit" (Capsule) is just a selling unit with `"contains": null`.

### Assumption 5: Measurement Units Need Special Treatment

**Challenge:** Measurement units (kg, g, L, mL) are not special — they're just units with standard conversion factors.

**Alternative:** Let the user define ANY unit and ANY conversion. The system suggests standard conversions (1 kg = 1000 g) but doesn't enforce them. The user can override if their business uses non-standard measures (e.g., "1 kg = 1200 g" for shrinkage, or "1 Dozen = 13" for baker's dozen).

### Assumption 6: The Software Should Infer Units

**Challenge:** The software should **never** decide what units a business uses. It should only **suggest** defaults and let the business confirm.

**What the software CAN do:**
- Suggest relationships based on unit names ("kg" and "g" → suggest 1 kg = 1000 g)
- Auto-generate selling units from packaging definitions
- Validate that conversions are consistent

**What the software should NOT do:**
- Decide what the "smallest unit" is
- Decide what unit inventory is tracked in
- Decide what the "base unit" should be

### Assumption 7: All Products Have Packaging

**Challenge:** Many products have only one unit. The form should not show packaging UI for these.

**Solution:** "Do you sell this in multiple sizes?" — if No → 1 unit, 1 price, done. If Yes → show packaging/conversion UI.

### Assumption 8: The Current Database Schema Is Correct

**Challenge:** `products.base_unit_id` is a VARCHAR(50) with no FK constraint. This is the right level of flexibility — it allows any unit string. But it should be hidden from the UX.

**Recommendation:** Keep `base_unit_id` as the **internal stock-keeping unit** (always set, always user-chosen). Remove it from the creation form. Let it be edited in a separate "Inventory Settings" section.

---

## 3. Alternative Mental Models

### Model A: The "Flat Conversion" Model

```
Product: Amoxil 250mg
────────────────────────────────────
Stock Unit (what I count): Capsule

Conversions:
  1 Strip  =   10 Capsules   [edit] [delete]
  1 Box    =  120 Capsules   [edit] [delete]  (derived: 12 × 10)
  1 Carton = 1200 Capsules   [edit] [delete]  (derived: 10 × 120)

[+ Add conversion]

Selling prices:
  Capsule @ Rs. 5   [edit]
  Strip   @ Rs. 50  [edit]
  Box     @ Rs. 500 [edit]
```

**All relationships are flat — no hierarchy.** Each row is "1 Unit = N Stock Units." The system derives transitive conversions (Box = 12 × 10 = 120) but stores only direct relationships.

**Pros:** Simple, no hierarchy confusion, easy to add/remove levels.
**Cons:** Cannot represent mixed packaging (Combo Packs), transitive derivation adds complexity.

### Model B: The "Container" Model

```
Product: Amoxil 250mg
────────────────────────────────────
I count inventory in: [Capsule ▾]

Containers:
  Level 1: [Box ▾]   contains [12] × [Strip ▾]   [edit] [delete]
  Level 2: [Strip ▾] contains [10] × [Capsule ▾] [edit] [delete]

[+ Add container level]
```

**Each container is a named unit that contains N smaller units.** The smallest container (leaf) is the stock unit. Containers can have prices.

**Pros:** Natural language ("Box contains 12 Strips"), intuitive hierarchy, easy to visualize.
**Cons:** Strict hierarchy — can't represent non-hierarchical packaging.

### Model C: The "Unit with Conversions" Model (Recommended)

```
Product: Amoxil 250mg
────────────────────────────────────
WHAT I COUNT: [Capsule ▾]
(Inventory is tracked in this unit)

WHAT I SELL (one or more):
  ☑ Capsule @ Rs. 5   (same as count unit)
  ☑ Strip   @ Rs. 50  (1 Strip = 10 Capsules)
  ☑ Box     @ Rs. 500 (1 Box = 12 Strips = 120 Capsules)
  ☐ Carton  @ Rs. 0   (1 Carton = 10 Boxes)

[+ Add selling unit]

WHAT I BUY (optional):
  I buy in: [Carton ▾] at [Rs. 4,500 per Carton]
  (1 Carton = 10 Boxes = 120 Strips = 1200 Capsules)
```

**Key insight:** Selling units and Purchase units are the SAME concept — they're just units with different purposes (sell vs buy) and different prices. The conversion to the count unit is always explicit.

**This model:**
- Does NOT have a "base unit" concept (it has "what I count")
- Does NOT infer anything (user explicitly chooses the count unit)
- Does NOT force hierarchy (each conversion is independent)
- Does NOT split selling/purchase units (they're the same conversion table, just different price columns)
- DOES derive transitive conversions for convenience (1 Box = 120 Capsules)
- DOES allow non-hierarchical relationships (1 Combo Pack = 1 Shampoo + 1 Conditioner, tracked separately)

---

## 4. Alternative UI/UX Design

### The One-Question Form

```
┌──────────────────────────────────────────────┐
│  ADD PRODUCT                                   │
│                                                 │
│  Name: [Amoxil 250mg                        ]  │
│                                                 │
│  ── How do you count this? ──                  │
│                                                 │
│  I count inventory in: [Capsule ▾]              │
│                                                 │
│  ── How do you sell it? ──                     │
│                                                 │
│  Selling units (at least 1):                    │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ ☑ Capsule @ Rs. [5    ] each    ✓ set    │  │
│  │ ☐ Strip   @ Rs. [50   ] each             │  │
│  │   (1 Strip = [10] [Capsule ▾])           │  │
│  │ ☐ Box     @ Rs. [500  ] each             │  │
│  │   (1 Box = [12] [Strip ▾] )              │  │
│  │ [+ Add another selling size]             │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ── How do you buy it? (optional) ──           │
│                                                 │
│  Purchase unit: [Carton ▾]                      │
│  (1 Carton = [10] [Box ▾] )                    │
│  Cost: [Rs. 4,500 per Carton]                  │
│                                                 │
│  [Save]                                         │
└──────────────────────────────────────────────┘
```

**What the user does:**
1. Names the product
2. Picks what they count inventory in (one decision)
3. Lists what they sell (with conversions)
4. Optionally adds what they buy

**What the system does:**
- Validates conversions are consistent
- Auto-derives chain conversions (1 Box = 12 × 10 = 120 Capsules)
- Stores all units in a single `product_conversions` table
- Sets `products.count_unit_id` to the "I count in" unit

### What This Changes From Current

| Current | Proposed |
|---------|----------|
| "Base Unit" selector | "I count inventory in" selector |
| Separate "Selling Units" section | Selling units = conversions with prices |
| Separate "Purchase Config" section | Purchase unit = conversion with cost |
| "Packaging Levels" hierarchy | Flat conversion list |
| Inline conversion (Quick Entry) | Removed — redundant |
| Selling sizes under "More Options" | Always visible |
| `base_unit_id` shown in form | `count_unit_id` internal, editable in settings |
| Three separate data concepts | One unified "conversion" concept |

---

## 5. Comparison of Approaches

| Dimension | Current (Base Unit) | Flat Conversion | Container | Unit w/ Conversions (Recommended) |
|-----------|--------------------|----------------|-----------|-------------------------------|
| **User decisions** | Pick base unit + packaging + selling units | Pick count unit + conversions | Pick smallest unit + containers | Pick count unit + conversions |
| **Cognitive load** | High — must understand base unit concept | Medium — count unit + flat list | Medium — natural language | Low — count unit + flat list with prices |
| **Flexibility** | Low — hierarchy required | High — flat, any conversion | Medium — hierarchy required | High — flat, any conversion |
| **Measurement products** | Fractions needed | Whole numbers always | Fractions if hierarchy | Whole numbers always |
| **Mixed packaging** | Not supported | Supported | Not supported | Supported |
| **Future: BOM/Manufacturing** | Poor fit | Good (conversions = ingredients) | Poor fit | Good (conversions = components) |
| **Future: Multi-warehouse** | OK (base unit per product) | OK (count unit per product) | OK | OK |
| **Future: Batch/Expiry** | OK — tracked in base unit | OK — tracked in count unit | OK | OK |
| **Database complexity** | 3 tables (packaging, selling_units, product_units) | 1 table (conversions) + count_unit_id | 1 table (containers) | 1 table (conversions) + count_unit_id |
| **Migration effort** | None (current) | Medium | Medium | Medium |
| **Shopkeeper test** | Fail — "what's a base unit?" | Pass — "what do you count?" | Pass — "Box contains 12 Strips" | Pass — "what do you count? what do you sell?" |

---

## 6. Real-World Examples with Recommended Model

### Pharmacy: Amoxil

```
Count in: Capsule
Sell:
  Capsule @ Rs. 5   (1 = 1 Capsule)
  Strip   @ Rs. 50  (1 = 10 Capsules)
  Box     @ Rs. 500 (1 = 12 Strips = 120 Capsules)
Buy:
  Carton  @ Rs. 4,500 (1 = 10 Boxes = 1200 Capsules)
```

### Grocery: Rice

```
Count in: Kilogram
Sell:
  Kilogram @ Rs. 280   (1 = 1 kg)
  500g Pack @ Rs. 150  (1 = 0.5 kg)
  Bag 25kg @ Rs. 6,000 (1 = 25 kg) — also used wholesale
Buy:
  Bag 50kg @ Rs. 10,000 (1 = 50 kg)
```

### Beverage Distributor: Cola Cans

```
Count in: Case (24 Cans)
Sell:
  Can  @ Rs. 50  (1 = 1/24 Case)
  Case @ Rs. 1,100 (1 = 1 Case)
  Pallet @ Rs. 26,400 (1 = 24 Cases)
Buy:
  Pallet @ Rs. 22,000 (1 = 24 Cases)
```

### Bakery: Bread

```
Count in: Loaf
Sell:
  Loaf @ Rs. 120 (1 = 1 Loaf)
Buy:
  Tray @ Rs. 1,200 (1 = 12 Loaves)
```

### Hardware: Nails

```
Count in: Packet (500g)
Sell:
  Packet @ Rs. 80 (1 = 1 Packet)
  Box @ Rs. 1,600 (1 = 20 Packets)
Buy:
  Carton @ Rs. 14,000 (1 = 10 Boxes = 200 Packets)
```

### Clinic: Consultation

```
Count in: Piece
Sell:
  Consultation @ Rs. 2,000 (1 = 1 Piece)
Buy:
  N/A (service, not purchased)
```

### Wholesaler: Cooking Oil

```
Count in: Carton (12 Bottles × 5L = 60L)
Sell:
  Bottle 5L @ Rs. 2,000 (1 = 1/12 Carton)
  Carton @ Rs. 22,000 (1 = 1 Carton)
  Pallet @ Rs. 528,000 (1 = 24 Cartons)
Buy:
  Container @ Rs. 1,500,000 (1 = 72 Cartons)
```

### Verification

All 7 business types work with the same model:
| Business | Count Unit | Selling Units | Purchase Unit |
|----------|-----------|--------------|--------------|
| Pharmacy (loose) | Capsule | Capsule, Strip, Box | Carton |
| Pharmacy (no loose) | Strip | Strip, Box | Carton |
| Grocery | Kilogram | kg, 500g, 25kg Bag | 50kg Bag |
| Beverage | Case (24) | Can, Case, Pallet | Pallet |
| Bakery | Loaf | Loaf | Tray |
| Hardware | Packet | Packet, Box | Carton |
| Clinic | Piece | Consultation | — |
| Wholesaler | Carton (60L) | Bottle, Carton, Pallet | Container |

**No base unit decisions. No smallest-unit inference. Every business chooses what works for them.**

---

## 7. Recommended Architecture

### Database

```sql
-- products table (simplified)
CREATE TABLE products (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    sku             VARCHAR(100) NOT NULL UNIQUE,
    count_unit_id   VARCHAR(50) NOT NULL,        -- user-chosen stock-keeping unit
    track_inventory BOOLEAN DEFAULT TRUE,
    stock_quantity  DECIMAL(12,2) DEFAULT 0,     -- always in count_unit
    created_at      TIMESTAMP,
    updated_at      TIMESTAMP
);

-- product_conversions (replaces packaging + selling_units + purchase_config)
CREATE TABLE product_conversions (
    id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id        BIGINT UNSIGNED NOT NULL,
    unit_name         VARCHAR(100) NOT NULL,         -- display name: "Strip", "Box"
    unit_id           VARCHAR(50) NOT NULL,           -- underlying unit: "capsule", "piece"
    quantity          DECIMAL(12,4) NOT NULL,         -- how many count_units in 1 of this
    sale_price        DECIMAL(12,0) DEFAULT NULL,     -- NULL = not sold in this unit
    purchase_cost     DECIMAL(12,0) DEFAULT NULL,     -- NULL = not purchased in this unit
    barcode           VARCHAR(100) DEFAULT NULL,
    sku               VARCHAR(100) DEFAULT NULL,
    is_default_sale   BOOLEAN DEFAULT FALSE,          -- shown first at POS
    is_default_purchase BOOLEAN DEFAULT FALSE,        -- default purchase unit
    created_at        TIMESTAMP,

    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX (product_id)
);

-- Count unit itself is always a conversion with quantity=1
-- (inserted automatically on creation)
```

**This single table replaces:**
- `selling_units` (was separate table)
- `product_packaging` (was separate table)
- `purchase_config` (was JSON on product or implied)

### API

```json
// GET /api/products/1
{
  "id": 1,
  "name": "Amoxil 250mg",
  "count_unit": { "id": "capsule", "name": "Capsule" },
  "conversions": [
    { "unit_name": "Capsule", "quantity": 1, "sale_price": 5, "is_default_sale": true },
    { "unit_name": "Strip",   "quantity": 10, "sale_price": 50 },
    { "unit_name": "Box",     "quantity": 120, "sale_price": 500 },
    { "unit_name": "Carton",  "quantity": 1200, "purchase_cost": 4500, "is_default_purchase": true }
  ],
  "stock_quantity": 5000
}
```

### Backend

- `ProductConversionService` — CRUD, validation (no circular conversions)
- `ConversionEngine` — walks the graph, computes transitive quantities, generates inventory transactions on stock movement
- `ProductUnitResolver` — resolves display names from unit IDs (same as current `ProductUnitService`)

### Frontend

- Single form with "I count in" + "conversions" list
- Each conversion row: `[name] [quantity] [unit] [sale price?] [purchase cost?]`
- Price/cost columns are optional — leave blank if the unit is not sold/purchased
- The count unit is always a conversion with quantity=1

---

## 8. Migration Strategy (If Applicable)

| Step | Change | Risk |
|------|--------|------|
| 1 | Create `product_conversions` table | None (new table) |
| 2 | Write migration to populate conversions from existing `selling_units` + `product_packaging` | Medium (must handle duplicate units correctly) |
| 3 | Add `count_unit_id` to `products` and populate from existing `base_unit_id` | Low |
| 4 | Update ProductService create/update to use conversions | Medium |
| 5 | Update POS and Purchase Bill to read from conversions instead of selling_units | Medium |
| 6 | Update Clinic module to read from conversions | Medium |
| 7 | Drop old `selling_units`, `product_packaging`, `purchase_units` tables | High (only after full verification) |

---

## 9. Final Recommendation

### What to Do

1. **Adopt the "Unit with Conversions" model**
   - One `product_conversions` table replaces packaging + selling units + purchase config
   - `count_unit_id` replaces `base_unit_id` (user-chosen, not system-inferred)
   - Conversions are flat, not hierarchical

2. **Remove "Base Unit" from the UX entirely**
   - Replace with "I count inventory in" (one explicit decision)
   - No smallest-unit inference
   - No base-unit concept visible to the user

3. **Keep the current database schema as-is for now**
   - The `products.base_unit_id` column becomes `count_unit_id` (rename or alias)
   - The `selling_units` table is deprecated but not removed — mapped through during transition
   - `product_packaging` table is deprecated but not removed

4. **Restructure the Product Form**
   - One question: "What do you count inventory in?"
   - Then: "What do you sell?" (list of units with prices)
   - Then: "What do you buy?" (optional, units with costs)
   - All in one flat, scrollable list

### What Not to Do

- ❌ Don't add a "Smallest Unit" concept (system should not infer)
- ❌ Don't keep the inline conversion (redundant with explicit conversions)
- ❌ Don't split selling/purchase units into separate sections
- ❌ Don't force hierarchy (allow flat conversions)

### Why This Model Wins

| Criterion | Current | Recommended |
|-----------|---------|-------------|
| **User clarity** | "What's a base unit?" | "What do you count?" |
| **Business fit** | Forces atomic tracking | Adapts to any business |
| **Flexibility** | Rigid hierarchy | Flat, any relationship |
| **Measurement products** | Fractions required | Whole numbers |
| **Future: BOM** | Poor | Good (conversions = ingredients) |
| **Future: Multi-warehouse** | OK | OK |
| **Database tables** | 3 (packaging + selling_units + product_units) | 1 (product_conversions) |
| **API surface** | Multiple endpoints | Single conversion array |
| **Learning curve** | Moderate | Low |
