# Product Unit & Packaging UX — Design Review

**Date:** 2026-07-28
**Author:** Design Review
**Status:** Draft for discussion

---

## Executive Summary

The current Product Form forces users to select a fixed "Base Unit" and define all packaging relative to it. This creates an unnatural mental model where shopkeepers must think in terms of database relationships instead of how their products actually exist on their shelves.

The proposed redesign replaces the "Base Unit" concept with a **Smallest Saleable Unit (SSU)** model: the user defines what they stock (the smallest unit they track inventory in) using natural language relationships, without fractions, without reverse conversions, and without database jargon.

---

## Part 1 — Current Problem Analysis

### Current Architecture: The "Base Unit" Trap

```
┌──────────────────────────────────────────────────┐
│  Product Form                                     │
│                                                   │
│  Product Name: [Amoxil 250mg                    ] │
│                                                   │
│  Unit: [Capsule ▾]         ← "Pick your base unit"│
│                                                   │
│  Selling Price: [______]   ← price per capsule     │
│                                                   │
│  ▶ More Options                                   │
│    Packaging Levels:                               │
│    Box contains [12] × [Strip ▾]                  │
│    Strip contains [10] × [Capsule ▾]              │
│                                                   │
│    Selling Sizes:                                  │
│    ☑ Box    @ Rs. 500  (generated)                │
│    ☑ Strip  @ Rs. 50   (generated)                │
│    ☑ Capsule@ Rs. 5    (generated)                │
└──────────────────────────────────────────────────┘
```

### Problem 1: The Base Unit Fixes Direction

Once the user selects "Capsule" as the base unit, _every_ packaging relationship must be expressed as "X capsules per Y":

```
12 Capsules = 1 Strip   ← natural
10 Capsules = 1 Box     ← wait, 10 what? Boxes? Capsules?
```

But what if the user thinks of it as "1 Box = 12 Strips"?

```
12 Strips = 1 Box
```

In the current system, this must be expressed as:

```
Box contains 12 × Strip  → Box.qty = 12 × Strip.qty
                        → Box.qty = 12 × 10 = 120 base units
```

The math works, but the language is backwards for the user's mental model. They think "I buy a Box, it has 12 Strips inside" — but the system wants to know "how many Capsules are in a Strip?" first.

### Problem 2: Fractions in Measurement Products

For a product tracked in kg:

```
Unit: [kg ▾]

Custom: Gram (g) = 0.001 × kg     ← fractional! 
```

The user thinks "1 kg = 1000 g" but the system expresses this as 0.001 kg/g because the base unit is kg. Fractions are error-prone and unintuitive for shopkeepers.

### Problem 3: The Unit Selector Does Triple Duty

The "Unit" selector in Quick Entry does three things at once:

1. **Sets the stock-keeping unit** (`products.base_unit_id`)
2. **Determines the form scenario** (simple vs measurement vs packaging)
3. **Names the default selling unit**

When the user selects "Box", the system doesn't know if:
- They sell boxes of individual items (Box of 12 x Pack of 10 Capsules)
- They sell boxes as single units (Buy a Box, sell a Box)
- The box contains measurement units (Box of 12 x 500g Pack)

This ambiguity is the root cause of the confusion.

### Problem 4: The "Unit" Is Not a Unit

For a medicine that comes in Box → Strip → Capsule:

The "base unit" is Capsule (what you count inventory in).

But the user selected "Strip" because they think of the product as a Strip.

The system then infers "Strip = 10 Capsules" but only if the user fills in the inline conversion. If they don't, the product has `base_unit_id = 'strip'` and the selling unit is "Strip = 1 strip" — which is wrong.

### From the Inventory Perspective

Inventory is always tracked in **one unit**: the base unit. This is correct and should not change.

The problem is that we ask the user to identify this unit upfront, before they've even told us anything about the product. It's like asking "how long is a piece of string?" — the user doesn't know the base unit until they know the packaging structure.

---

## Part 2 — Current UX Review

### What Works Well

| Feature | Why It Works |
|---------|-------------|
| **Quick Entry pattern** | Name + Price + Unit + Enter is fast for simple products |
| **Progressive disclosure** | "More Options" keeps the form clean initially |
| **Packaging Levels Builder** | Natural language "Box contains 12 Pack" |
| **Derived selling units** | Auto-creates units from packaging, no manual entry |
| **Custom measurement options** | Gram/kg, mL/L, cm/m work for most measurement products |

### What Creates Confusion

| Issue | Root Cause |
|-------|-----------|
| **"Base Unit" choice determines everything** | Single dropdown controls stock unit, selling unit name, scenario, and packaging direction |
| **Inline conversion is redundant** | Same concept as Packaging Levels Builder but without creating packaging rows |
| **Fractions for measurement** | Base = kg → Gram = 0.001 kg. Unnatural. |
| **Direction is fixed** | Must express "X base units per selling unit" not "1 selling unit = X base units" |
| **Three names for the same thing** | "Unit", "Base Unit", "Inventory Unit" used interchangeably |
| **Selling units appear in two places** | Quick Entry shows one, More Options shows all |

### Is "Base Unit" the Correct Mental Model?

**No, not for initial product creation.**

A shopkeeper thinks:

> "I buy a Strip of Amoxil. It has 12 capsules inside. I sell them individually."

They do NOT think:

> "My base unit is capsule. 1 Strip = 12 base units. 1 Box = 120 base units."

The base unit is an _implementation detail_ of the inventory system. The shopkeeper should not need to care about it until they're setting up inventory rules (stock alerts, reorder points, etc.).

### What an Ordinary Shopkeeper Actually Knows

| They Know | They Don't Know |
|----------|-----------------|
| "I sell this in Boxes" | "What's the base unit?" |
| "A Box has 12 Strips" | "How many base units per selling unit?" |
| "A Strip has 10 Capsules" | "What's the conversion factor?" |
| "I buy a Carton of 12 Boxes" | "Is this a count or measurement product?" |
| "I sell rice by the kg" | "Should I track inventory in grams?" |

The system should answer "what do you sell and how is it packaged?" not "what base unit should I use?"

---

## Part 3 — Proposed UX: Smallest Saleable Unit (SSU)

### Core Concept

Replace "Base Unit" with **Smallest Saleable Unit (SSU)** — the smallest unit a customer can purchase.

The system:
1. Asks "What do you sell?" → user names their product
2. Asks "What's the smallest amount someone can buy?" → SSU
3. Optionally: "What contains what?" → packaging hierarchy
4. Inventory is automatically tracked in the SSU

### The New Flow

```
Step 1: Product Name
┌──────────────────────────────────────────┐
│ Product Name: [Amoxil 250mg            ] │
│                                          │
│ What's the smallest amount customers buy? │
│ [Capsule ▾]                               │
│                                          │
│ Sale Price: [Rs. 5 per Capsule]           │
│                                          │
│ [Save & Continue]  ← one-click save      │
└──────────────────────────────────────────┘
```

This is the default flow for 90% of products. The user is done.

For products with packaging:

```
┌──────────────────────────────────────────┐
│ Product Name: [Amoxil 250mg            ] │
│                                          │
│ Smallest unit: [Capsule ▾]               │
│ Price: [Rs. 5 per Capsule]               │
│                                          │
│ ── How is it packaged? (optional) ──     │
│                                          │
│  1 × [Strip ▾] contains [10] [Capsule]  │
│  1 × [Box ▾]   contains [12] [Strips]   │
│                                          │
│ [+ Add packaging level]                  │
│                                          │
│ Selling prices:                          │
│ ☑ Capsule @ Rs. 5   (default selling u.) │
│ ☐ Strip   @ Rs. 50  (auto-calculated)    │
│ ☐ Box     @ Rs. 500 (auto-calculated)    │
│                                          │
│ [Save]                                    │
└──────────────────────────────────────────┘
```

### Key Differences from Current Design

| Aspect | Current | Proposed |
|--------|---------|----------|
| **First question** | "What's the base unit?" | "What's the smallest amount customers buy?" |
| **Direction** | "X base units per selling unit" (upside-down) | "1 Strip contains 10 Capsules" (natural language) |
| **Fractions** | Gram = 0.001 kg | "1 kg = 1000 g" (natural) |
| **Measurement** | "Unit = kg → auto units" | Unit Type selector: Count / Weight / Volume |
| **Packaging** | "Base unit → derived units" | "Smallest unit → contains chain" |
| **Inventory tracking** | Products.base_unit_id (user sees) | Always SSU (user never needs to see it) |

### The "Contains" Hierarchy

The proposed model is a **contains** graph, not a **converts-to** graph:

```
Box
  └── contains 12 × Strip
                    └── contains 10 × Capsule  ← SSU
```

Each relationship reads as "1 larger unit **contains** N smaller units." No fractions. No reverse directions. The SSU is always the leaf of the graph.

### Measurement Products

Measurement products (weight, volume, length) get a different path:

```
┌──────────────────────────────────────────┐
│ Product: [Basmati Rice                 ] │
│                                          │
│ Type: ● Count  ○ Weight  ○ Volume  ○ Len │
│                                          │
│ Smallest unit: [Gram ▾]                  │
│ Price: [Rs. 0.28 per Gram]               │
│                                          │
│ ── Common selling sizes ──               │
│ ☐ 100g Pack  (auto-calculated)           │
│ ☑ 500g Pack  (auto-calculated)           │
│ ☑ 1kg Pack   (auto-calculated)           │
│ ☐ 5kg Bag    (auto-calculated)           │
│ [+ Custom size]                          │
│                                          │
│ ── Purchase ──                           │
│ Buy in: [25kg Bag ▾]                     │
│ Cost: [Rs. 3,600 per 25kg Bag]           │
│                                          │
│ [Save]                                    │
└──────────────────────────────────────────┘
```

The system automatically generates standard selling sizes based on the unit type. For weight: multiples and fractions of the base unit. For volume: mL and L. For count: none.

---

## Part 4 — Stress Test: Real-World Scenarios

### Scenario 1: Tea (Simple Count)

**User flow:**
1. Name: "Tea"
2. Smallest unit: "Piece"
3. Price: Rs. 5
4. Save

**Result:** 1 selling unit (Piece, qty=1, price=5). Inventory in Pieces.

### Scenario 2: Medicine (Box → Strip → Capsule)

**User flow:**
1. Name: "Amoxil 250mg"
2. Smallest unit: "Capsule"
3. Price: Rs. 5 per Capsule
4. Packaging: 1 Strip contains 10 Capsules
5. Packaging: 1 Box contains 12 Strips
6. Set Strip price: Rs. 50
7. Set Box price: Rs. 500
8. Save

**Result:** 3 selling units, inventory in Capsules. No fractions, no base unit decisions.

### Scenario 3: Rice (Weight)

**User flow:**
1. Name: "Basmati Rice Premium"
2. Type: Weight
3. Smallest unit: "Gram"
4. Price: Rs. 0.28 per Gram
5. Check: "1kg Pack", "5kg Bag"
6. Buy in: "25kg Bag", Cost: Rs. 3,600
7. Save

**Result:** Selling units: 1kg (qty=1000), 5kg (qty=5000). Inventory in grams. Purchase unit: 25kg bag (qty=25000).

### Scenario 4: Water Bottle (Simple Volume)

**User flow:**
1. Name: "Mineral Water 500ml"
2. Type: Volume
3. Smallest unit: "Millilitre"
4. Price: Rs. 30 per 500ml... wait.

Here's a challenge: the user sells by the BOTTLE (500ml), not by the ml. The SSU should be what they actually sell.

**Refinement:** The "Smallest Saleable Unit" can also be a **packaged unit**:

1. Name: "Mineral Water 500ml"
2. Type: Volume
3. Smallest sellable unit: "Bottle (500ml)"
4. Price: Rs. 30 per bottle
5. Packaging: 1 Carton contains 12 Bottles
6. Carton price: Rs. 330
7. Save

**Result:** Selling units: Bottle (qty=500ml, price=30), Carton (qty=6000ml, price=330). Inventory in ml.

### Scenario 5: Carton of Soft Drinks

**User flow:**
1. Name: "Cola Next 250ml"
2. Smallest sellable unit: "Can (250ml)"
3. Price: Rs. 50 per Can
4. Packaging: 1 Carton contains 24 Cans
5. Carton price: Rs. 1,100
6. Save

**Result:** Inventory in ml. Selling units: Can (qty=250, price=50), Carton (qty=6000, price=1100).

### Scenario 6: Bakery (Single Loaf)

**User flow:**
1. Name: "Whole Wheat Bread"
2. Smallest unit: "Loaf"
3. Price: Rs. 120
4. Save

**Result:** 1 selling unit (Loaf, qty=1, price=120). No packaging.

### Scenario 7: Hardware (Nails by Weight)

**User flow:**
1. Name: "Steel Nails 2-inch"
2. Type: Weight
3. Smallest sellable unit: "Packet (500g)"
4. Price: Rs. 80 per Packet
5. Packaging: 1 Box contains 20 Packets
6. Save

**Result:** Inventory in grams. Selling: Packet (qty=500, price=80), Box (qty=10000, price=1600).

### Stress Test Verdict

| Scenario | Works? | Notes |
|----------|--------|-------|
| Tea (simple count) | ✅ | 1-click save |
| Medicine (3-level) | ✅ | Natural "contains" language |
| Rice (weight) | ✅ | Auto-generates standard sizes |
| Water bottle | ✅ | SSU = 500ml bottle, not ml |
| Soft drinks (carton) | ✅ | Same pattern as water |
| Bakery (single item) | ✅ | 1-click save |
| Hardware (nails) | ✅ | SSU = packet with weight |

---

## Part 5 — Critique of Proposed Design

### Weakness 1: "Smallest Saleable Unit" Is Not Always Clear

For some products, the "smallest" unit is ambiguous:
- Toothpaste: sold as a tube (80ml), but the SSU is the tube, not the ml
- Eggs: sold as a tray of 30, but the SSU is the tray, not the individual egg

**Fix:** The SSU can be a **packaged unit** (Bottle of 500ml, Tray of 30 Eggs). The inventory unit underneath is the measurement unit (ml, pieces). The SSU is what the customer walks out with.

### Weakness 2: Measurement Product Requires Type Selection

Adding "Type: Count / Weight / Volume / Length" is an extra click. Some users might not know which type to pick.

**Fix:** Infer the type from the unit name. If the user types "Gram" or "kg" → Weight. If "mL" or "Liter" → Volume. Only show the type selector when the unit name is ambiguous.

### Weakness 3: Purchase Unit is an Afterthought

The current proposal puts purchase unit at the bottom. For many businesses, the purchase unit (what you buy from the supplier) is the most important relationship.

**Fix:** Add a "Purchase" section alongside packaging:

```
┌── How do you buy it? ────────────────────┐
│                                          │
│ I buy in: [Carton of 12 Boxes ▾]          │
│ Cost: [Rs. 6,000 per Carton]             │
│                                          │
│ Supplier: [Al-Rashid Pharma ▾]            │
└──────────────────────────────────────────┘
```

### Weakness 4: Existing Products Need Migration

All existing products have `base_unit_id` as a string. Moving to SSU model would require either:
- A migration that converts existing data
- Or running both systems in parallel during a transition period

### Weakness 5: Edge Cases with Mixed Packaging

What if:
- A product is sold both as loose (per piece) AND packaged (per box)?
- A weight product has both count-based AND weight-based selling units?

**Answer:** The SSU is the leaf. If sold both as loose and packaged, the SSU is the smallest (the loose unit). The package becomes a selling unit with a higher quantity.

### Weakness 6: Performance

The current derivation engine does a graph walk for each product. With the SSU model, the graph walk is the same complexity — the leaf is always the SSU. No performance regression.

### Weakness 7: Database Impact

The `products.base_unit_id` column remains but becomes **internal** (hidden from the user). It's always set to the SSU's underlying unit. No schema change needed.

---

## Part 6 — Alternative: The "Unitless" Approach

### Second Proposal: Don't Ask for Any Unit

What if we don't ask for a unit at all?

```
┌──────────────────────────────────────────┐
│ Product Name: [Amoxil 250mg            ] │
│                                          │
│ Sale Price: [Rs. 50                     ] │
│                                          │
│ ─── How do you sell it? ───              │
│                                          │
│  I sell [Capsule ▾] @ Rs. [5 each]       │
│  I also sell [Strip ▾] of [10 Capsules]  │
│              @ Rs. [50 per Strip]        │
│  I also sell [Box ▾] of [12 Strips]      │
│              @ Rs. [500 per Box]         │
│                                          │
│ [+ Add another size]                     │
│                                          │
│ ─── Stock Keeping ───                    │
│                                          │
│ Track stock in: [Capsule ▾] (recommended)│
│ Opening stock: [500]                     │
│ Low stock alert: [100]                   │
│                                          │
│ [Save]                                    │
└──────────────────────────────────────────┘
```

The user never selects a "base unit." They just describe what they sell. The system infers:

- The **inventory unit** is the smallest unit across all selling sizes
- The **selling units** are whatever the user defined
- The **conversions** are derived from the quantities

### Comparison

| Aspect | SSU Model | "Unitless" Model |
|--------|-----------|-----------------|
| **User decisions** | User picks SSU | User describes sizes, system infers |
| **Cognitive load** | Low — one decision | Lowest — just describe |
| **Flexibility** | SSU must be defined | Works without defining any "unit" |
| **Measurement products** | Type selector needed | Implicit from units (kg/g = weight) |
| **Edge cases** | Ambiguous SSU needs refinement | Pure description avoids ambiguity |
| **Inventory accuracy** | Always tracked in SSU | System must compute the smallest unit |

### Recommendation

The **Unitless approach** is simpler for the user but adds complexity for the system (it must infer the inventory unit). The **SSU approach** is slightly more structured but gives clearer inventory semantics.

**Final recommendation: Hybrid approach.**

1. **First-time flow:** Ask "What's the smallest amount customers buy?" (SSU) — this sets inventory tracking
2. **Then ask:** "What other sizes do you sell?" — these become additional selling units
3. **Automatically:** Infer measurement type from the SSU name
4. **Purchase unit:** Separate section, optional

This gives the clarity of SSU with the flexibility of the unitless approach.

---

## Architecture Considerations

### Database (Minimal Changes Needed)

```
products
  base_unit_id         ← kept, now always set to SSU unit
  base_unit_name       ← computed accessor (already added)

selling_units
  name                 ← display name (e.g., "Box", "Strip", "1kg Pack")
  unit_id              ← references the underlying measurement unit
  quantity             ← how many base units per selling unit
  base_quantity        ← NOT NEEDED ANYMORE (it's just quantity)
  product_unit_id      ← FK to product_units for derivation matching
  packaging_id         ← FK to product_packaging if derived

product_packaging
  container_name       ← "Box"
  contains_name        ← "Strip"
  quantity             ← 12
  level                ← 1, 2, 3
```

### No New Tables

The SSU model **does not require new database tables**. It only changes the **user-facing concept** and **some UI labels**.

### Frontend Changes

| Component | Change |
|-----------|--------|
| Unit selector | "Smallest unit customers buy" instead of "Base Unit" |
| Inline conversion | Remove entirely |
| Packaging Levels Builder | Keep — already uses natural language |
| Selling Sizes | Make always visible, not under "More Options" |
| Measurement type | Show only when needed (infer from unit name) |
| Purchase unit | Add as optional section |

---

## Final Recommendation

### What to Change

| # | Change | Priority | Effort |
|---|--------|----------|--------|
| 1 | Remove inline conversion from Quick Entry | P0 | Small |
| 2 | Make Selling Sizes always visible for packaging products | P0 | Small |
| 3 | Relabel "Unit" → "Smallest unit customers buy" | P0 | Tiny |
| 4 | Remove the `buildPayload()` dual-write (don't send selling_units when packaging exists) | P0 | Small |
| 5 | Fix `ProductService::create()` — skip selling_units loop when packaging present | P0 | Small |
| 6 | Fix `ProductService::update()` — process selling_units for price overrides | P0 | Small |
| 7 | Infer measurement type from unit name instead of requiring type selector | P1 | Medium |
| 8 | Add purchase unit section to form | P2 | Medium |
| 9 | Clean up existing duplicate selling units in DB | P1 | Small |

### What NOT to Change

| Non-change | Why |
|-----------|-----|
| `products.base_unit_id` column | Still needed internally; just hidden from UX |
| `product_packaging` table | Already correct — natural language model |
| `selling_units` table | Already correct — just fix the duplication |
| Derivation engine | Already correct — one-way flow from packaging |
| Inventory tracking | Always in base units — correct |

### Summary

The current UX asks the user to pick a "Base Unit" before they've described their product. This is backwards.

The proposed model asks: **"What do you sell?"** first, then **"What's the smallest amount someone can buy?"** (SSU), then **"What contains what?"** (packaging). The base unit becomes an internal implementation detail that the user never needs to think about.

This matches how shopkeepers naturally think about their products: they know what they sell, they know how it's packaged, and they know the smallest unit they're willing to part with. They don't know — and shouldn't need to know — what a "base unit" is.
