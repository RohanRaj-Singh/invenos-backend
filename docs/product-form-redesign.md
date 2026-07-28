# Product Form & Packaging UX Redesign — Refined

---

## Current State Review

| Problem | Detail |
|---------|--------|
| **Lost quick entry** | "Save &amp; Add Next" flow is buried. User must fill 6+ fields before reaching the first product. |
| **Selling unit row is confusing** | `[Strip] × 10 [capsules]` — users don't understand which side is the selling pack and which is the base unit. |
| **Category selector blocks keyboard flow** | Enter key submission is inconsistent with other fields. |
| **No autocomplete for unit names** | "Capsule", "Capsules", "Cap", "Capsul" become separate entries. No suggestions. |
| **Selling units not grouped** | `Box → 12 Pack → 10 Capsule` shown as three unrelated flat rows. |
| **Opening stock / base unit coupling** | Opening stock is tied to abstract base unit, not to selling packs users think in. |

---

## Design Principles

1. **Default to fast** — name + price + Enter saves a product. Everything else is progressive disclosure.
2. **Packaging Levels** — relationships are explicit `Container → Contains → Item`, not flat conversion factors.
3. **Measurements stay standard** — kg → g, L → ml use predefined factors. No levels needed.
4. **Unit names are normalised** — autocomplete from a shared `product_units` table prevents duplicates. Packaging relationships stay product-specific.
5. **Conversion is derived** — if Box contains 12 Packs and Pack contains 10 Capsules, the system infers Box contains 120 Capsules. Never ask for redundant data.

---

## Refinements (per user review)

| Feedback | Change |
|----------|--------|
| Normalise unit names, not relationships | `product_units` table shared across all products. `product_packaging` rows remain product-specific. |
| Rename "Packaging Hierarchy" | → **"Packaging Levels"** — clearer, less technical. |
| Natural language relationships | `[Box] contains [12] [Packs]` instead of `[Box] × [12] [Pack]`. |
| Hide "Derived Selling Units" | The derivation is an internal detail. Show only the actual selling units with prices, plus a "Generated from packaging" indicator. |
| Explicit level column | Each `product_packaging` row gets a `level` integer (1, 2, 3…) so ordering, editing, and future extension is deterministic. |

---

## UX Workflow

### Quick Entry (default — always visible)

```
┌───────────────────────────────────────────────┐
│ [Product Name _______________]             [+] │
│                                                │
│ [Selling Price _____]  [Unit: Piece ▾]         │
│                                                │
│ ▶ More Details (optional)                       │
└──────────────────────────────────────────────────┘
```

Pressing Enter saves with sensible defaults (Piece, Rs. 0, category uncategorised). This is the primary flow for entering hundreds of products fast.

### Expanded: Packaging Levels

When "More Details" is expanded:

```
┌─── Packaging Levels ─────────────────────────┐
│                                                │
│ Level 1  [Box]   contains [12]  [Pack]     ✕  │
│ Level 2  [Pack]  contains [10]  [Capsule]  ✕  │
│                                                │
│ [+ Add Level]                                  │
│                                                │
│ ── Selling Units ──                            │
│                                                │
│ ☑  Box       @ Rs. ______  (12 Packs)    ⚙    │
│ ☑  Pack      @ Rs. ______  (10 Capsules) ⚙    │
│ ☑  Capsule   @ Rs. ______  (1)           ⚙    │
│                                                │
│ [+ Custom Pack]                                 │
└──────────────────────────────────────────────────┘
```

Each Packaging Level row:
- **Level indicator**: 1, 2, 3 (auto-numbered, clickable to reorder)
- **Container field**: "Box" — autocomplete from existing unit names
- **Quantity**: "12" — how many contained units
- **Contains field**: "Pack" — autocomplete
- **Remove button**: X

Each Selling Unit row:
- Checkbox to enable/disable in POS
- Unit name (read-only, from packaging levels)
- Price input
- Subtitle showing parent relationship (e.g. "12 Packs")
- ⚙ for custom price override options
- "Custom Pack" for units not in the levels (e.g. "Blister Pack = 2 Capsules")

---

## Unit Autocomplete & Normalisation

### How It Works

When the user types in any unit field (container, contains, or custom pack):

```
Ca  →  [Capsule]  [Carton]  [Case]  [Create "Capsul" as new]
Bo  →  [Box]      [Bottle]  [Bowl]
St  →  [Strip]    [Straw]
```

**Rules:**
1. Query `product_units` table for LIKE matches (case-insensitive)
2. Show up to 6 existing matches in a dropdown
3. If the user selects an existing unit, reuse its `id`
4. If the user types a name not in the list and presses Enter, create a new `product_units` row with normalised name (Title Case, singular)
5. Reject duplicates: if "Capsule" exists, "Capsules" → auto-correct to "Capsule"

### Database Table

```sql
CREATE TABLE product_units (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100) NOT NULL UNIQUE,   -- Normalised, singular, Title Case
  measurement_type ENUM('count','weight','volume','length') DEFAULT 'count',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Seeded defaults:** Piece, Capsule, Tablet, Bottle, Box, Carton, Strip, Sachet, Packet, Roll, Sheet, Gram (g), Kilogram (kg), Milligram (mg), Millilitre (ml), Litre (L), Meter, Centimetre (cm)

This is purely a **unit name registry** — it normalises names across all products. It does NOT define conversion factors. Conversions are defined product-specifically in `product_packaging`.

---

## Packaging Levels Model

### Database Table

```sql
CREATE TABLE product_packaging (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id      BIGINT UNSIGNED NOT NULL REFERENCES products(id),
  container_unit_id BIGINT UNSIGNED NOT NULL REFERENCES product_units(id),  -- e.g. Box
  contains_unit_id  BIGINT UNSIGNED NOT NULL REFERENCES product_units(id),  -- e.g. Pack
  quantity        DECIMAL(12,4) NOT NULL,         -- e.g. 12
  level           TINYINT UNSIGNED NOT NULL,       -- 1, 2, 3… for ordering
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key decisions:**
- All unit names reference `product_units.id` — normalised globally
- `product_packaging` rows are **product-specific** — no cross-product sharing of packaging
- `level` column makes ordering explicit (no relying on insertion order)
- `container_unit_id` is always the larger unit, `contains_unit_id` the smaller unit

### Example Data

| product_id | container | contains | qty | level |
|------------|-----------|----------|-----|-------|
| 42 | Box (id:5) | Pack (id:8) | 12 | 1 |
| 42 | Pack (id:8) | Capsule (id:3) | 10 | 2 |

From this:
- Level 1: Box contains 12 Packs → derived selling unit "Box"
- Level 2: Pack contains 10 Capsules → derived selling unit "Pack"
- Implicit: Box contains 120 Capsules (12 × 10) — derived at query time
- Base unit: Capsule (the leaf in the graph)
- Derived selling unit "Capsule" = 1 base unit

---

## Selling Unit Derivation (Internal Detail — Not Shown in UI)

The derivation engine walks the packaging graph at query time:

```
Graph: Box →(12)→ Pack →(10)→ Capsule

Derivations:
  Box      = 12 × 10 = 120  (through chain)
  Pack     = 10              (direct child)
  Capsule  = 1               (leaf)
```

The UI does **not** show "Derived Selling Units" as a concept. It shows only:

```
┌── Selling Units ───────────────────────────┐
│ ☑ Box       @ Rs. ______                   │
│ ☑ Pack      @ Rs. ______                   │
│ ☑ Capsule   @ Rs. ______                   │
│ [+ Custom Pack]                             │
└─────────────────────────────────────────────┘
```

A subtle tooltip "(generated from packaging)" appears next to auto-created units. Custom units show "(custom)" instead.

---

## Standard Measurements

For products with `measurement_type = 'weight' | 'volume' | 'length'`:

- **No** `product_packaging` rows
- **No** Packaging Levels UI
- The traditional **Unit Select** (kg/g, L/ml) + **Selling Units** grid is used instead
- Selling units are explicit (e.g. "250g", "500g", "1kg")
- Conversion comes from the unit's `base_factor` (predefined: 1 kg = 1000 g)

The system detects measurement products automatically based on the selected base unit.

---

## UX Flow Diagram (Revised)

### Quick Entry (default state)

```
┌─── Quick Entry ──────────────────────────────────┐
│ [Name __________________]              [Add ▸]   │
│ [Price ____]  [Piece ▾]                          │
│ ─────────────────────────────────────────────────│
│ ▶ More Details (category, barcode, packaging…)   │
└──────────────────────────────────────────────────┘
```

### Expanded: Packaging Levels

```
┌─── More Details ─────────────────────────────────┐
│ Category: [________]  SKU: [________]            │
│ Barcode:  [________]                             │
│                                                  │
│ ┌── Packaging Levels ─────────────────────────┐  │
│ │                                                │  │
│ │ 1. [Box]    contains [12]  [Pack]         ✕  │  │
│ │ 2. [Pack]   contains [10]  [Capsule]     ✕  │  │
│ │ [+ Add Level]                                  │  │
│ │                                                │  │
│ │ ── Selling Units ──                            │  │
│ │ ☑  Box      @ Rs. _____  (generated)     ⚙   │  │
│ │ ☑  Pack     @ Rs. _____  (generated)     ⚙   │  │
│ │ ☑  Capsule  @ Rs. _____  (generated)     ⚙   │  │
│ │ [+ Custom Pack]                                │  │
│ └────────────────────────────────────────────────┘  │
│                                                  │
│ Allow Negative Stock  ☐                           │
│ Opening Stock [0]                                 │
│ Minimum Stock [10]                                │
│                                                  │
│ [Save]                                            │
└──────────────────────────────────────────────────┘
```

---

## Comparison

| Before | After Refined |
|--------|---------------|
| Flat `SellingUnit[]` with manual `quantity` | Hierarchical `product_packaging` with automatic derivation |
| `[Strip] × 10 [capsules]` — ambiguous | `Strip contains 10 capsules` — natural language |
| "Packaging Hierarchy" — technical name | "Packaging Levels" — user-friendly |
| "Derived Selling Units" shown prominently | Derivation is internal; only prices + toggle shown |
| No ordering — rows appear arbitrarily | Explicit `level` column for deterministic ordering |
| Unit names free-text, duplicates common | `product_units` table normalises names globally |
| Relationships coupled to base unit | Relationships are product-specific, base unit is derived from graph leaf |
| Converting `packagingToBase()` scattered | Single graph-walk entry point |

---

## Backward Compatibility

- Existing `selling_units` rows remain valid (standalone `quantity` in base units)
- Products without `product_packaging` work unchanged
- Products can have both `product_packaging` AND explicit `selling_units`
- Custom selling units (added via "+ Custom Pack") create `selling_units` rows as before
- The `product_units` table is new — existing code referencing unit names as strings continues to work (no breaking change)

---

## Implementation Phases (design only — not for implementation yet)

| Phase | Scope | Key Files |
|-------|-------|-----------|
| 1 | `product_units` table + seeder + autocomplete component | Migration, Seeder, `UnitAutocomplete.tsx` |
| 2 | `product_packaging` table + Packaging Levels builder UI | Migration, `PackagingLevelsBuilder.tsx` |
| 3 | Derivation engine (graph walk) | `PackagingDerivation.php` + `packagingDerivation.ts` |
| 4 | Selling unit auto-generation + price grid | `DerivedSellingUnits.tsx` |
| 5 | Quick Entry mode + progressive disclosure refactor | `CreateProduct.tsx`, `EditProduct.tsx` |
| 6 | Legacy migration + compatibility testing | Migration script for existing data |
