# Product Entry UX — Final Redesign

## Philosophy

> Adding products should be incredibly fast.  
> Advanced configuration should never slow down common products.

The form adapts to the product, not the other way around.

---

## Scenario 1: Simple Product (90% of use)

### What the user sees

```
┌────────────────────────────────┐
│ Product Name  [___________]   │
│ Cost Price    [___________]   │
│ Selling Price [___________]   │
│                                │
│                    [Save ▸]    │
│   (Enter to save)             │
└────────────────────────────────┘
```

- Default unit: **Piece**
- Default purchase: Piece
- Default sell: Piece
- **No packaging UI**
- **No selling sizes**
- **No conversions**
- Press Enter → saved

### Mobile view

```
┌──────────────────┐
│ Product Name     │
│ [___________]    │
│ Cost Price       │
│ [___________]    │
│ Selling Price    │
│ [___________]    │
│                  │
│     [Save ▸]     │
└──────────────────┘
```

Single-column, full-width inputs. Large touch targets (≥ 44px).

---

## Scenario 2: Standard Measurement

### What triggers this

User changes the **Unit** selector from `Piece` to `kg`, `g`, `L`, `ml`, `m`, or `cm`.

### What the user sees

```
┌────────────────────────────────┐
│ Product Name  [___________]   │
│ Unit          [kg ▾]          │  ← changed from Piece
│ Cost Price    [___________]   │
│ Selling Price [___________]   │
│                                │
│ ⚡ Selling in kg and g         │
│   (automatic)                 │
│                                │
│                    [Save ▸]    │
└────────────────────────────────┘
```

- No packaging UI
- No conversion builder
- System knows 1 kg = 1000 g
- Selling in kg and g works automatically
- POS will offer `kg` and `g` as selling units

### What changed internally

| Before (user sees) | After (user sees) |
|--------------------|-------------------|
| Unit = Piece | Unit = kg |
| — | Selling units auto-created: kg, g |
| — | Conversions predefined by unit type |

### Mobile view

```
┌──────────────────┐
│ Product Name     │
│ [___________]    │
│ Unit [kg ▾]     │
│ Cost Price       │
│ [___________]    │
│ Selling Price    │
│ [___________]    │
│                  │
│ kg + g — auto    │
│                  │
│     [Save ▸]     │
└──────────────────┘
```

---

## Scenario 3: Single Packaging Unit

### What triggers this

User changes the **Unit** selector to a non-measurement unit such as `Box`, `Bottle`, `Carton`, `Strip`, `Packet`, `Tray`, etc.

### What the user sees

```
┌────────────────────────────────┐
│ Product Name  [___________]   │
│ Unit          [Box ▾]         │  ← changed from Piece
│ Cost Price    [___________]   │
│ Selling Price [___________]   │
│                                │
│ Buy in Box · Sell in Box      │
│                                │
│ ▶ Add Selling Sizes (optional) │  ← collapsed
│                                │
│                    [Save ▸]    │
└────────────────────────────────┘
```

- No packaging builder shown
- No conversion required
- Buy in Box, Sell in Box — simple
- "▶ Add Selling Sizes" is **collapsed by default**
- Most single-pack products stop here

### When user taps "Add Selling Sizes"

```
┌────────────────────────────────┐
│ Selling Sizes                  │
│                                │
│ ☑ Box                         │
│ ☐ Pack    [+ Add Size]        │
│ ☐ Capsule                     │
│                                │
│ ── Packaging Structure ──      │
│                                │
│ Box contains [12] [Pack ▾]  ✕ │
│ Pack contains [10] [Capsule] ✕│
│ [+ Add Level]                  │
│                                │
│ (conversions auto-calculated)  │
└────────────────────────────────┘
```

### Mobile view (expanded)

```
┌──────────────────┐
│ Selling Sizes    │
│ ☑ Box           │
│ ☐ Pack [+ Add] │
│ ☐ Capsule       │
│                  │
│ Packaging Levels│
│ Box contains    │
│ [12] [Pack]  ✕ │
│ Pack contains   │
│ [10] [Capsule] ✕│
│ [+ Add Level]   │
└──────────────────┘
```

---

## UX State Machine

```
                  ┌─────────────────────┐
                  │ Unit = Piece        │
                  │ (default)           │
                  │ → Show: Name, Cost, │
                  │   Selling Price     │
                  └─────────┬───────────┘
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                   │
          ▼                 ▼                   ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│ Unit = kg/L/m    │ │ Unit = Box/  │ │ Unit = Strip/   │
│ (measurement)    │ │ Bottle/etc   │ │ Tablet/etc      │
│                  │ │ (packaging)  │ │ (count)         │
│ → Auto: kg+g    │ │ → Single     │ │ → Single        │
│ → Auto: L+ml    │ │   pack mode  │ │   pack mode     │
│ → No packaging  │ │              │ │                 │
│   UI            │ │ [+ Selling  │ │ [+ Selling     │
│                  │ │   Sizes]    │ │   Sizes]        │
└──────────────────┘ └──────┬───────┘ └────────┬─────────┘
                            │                  │
                            │ [+ Selling       │ [+ Selling
                            │   Sizes]         │   Sizes]
                            ▼                  ▼
                    ┌──────────────────────────────┐
                    │ Packaging Structure Builder   │
                    │ "Box contains 12 Pack"        │
                    │ "Pack contains 10 Capsule"    │
                    │                               │
                    │ → Selling units derived       │
                    │ → Conversions auto-calculated │
                    │ → POS shows available units   │
                    └──────────────────────────────┘
```

---

## Data Model Changes

### New: `product_units` table (Unit Name Registry)

```sql
CREATE TABLE product_units (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100) NOT NULL UNIQUE,  -- Normalised, singular, Title Case
  measurement_type ENUM('count','weight','volume','length') DEFAULT 'count',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seeded default units
INSERT INTO product_units (name, measurement_type) VALUES
  ('Piece', 'count'),
  ('Capsule', 'count'),
  ('Tablet', 'count'),
  ('Bottle', 'count'),
  ('Box', 'count'),
  ('Carton', 'count'),
  ('Strip', 'count'),
  ('Sachet', 'count'),
  ('Packet', 'count'),
  ('Roll', 'count'),
  ('Sheet', 'count'),
  ('Gram', 'weight'), ('g', 'weight'),
  ('Kilogram', 'weight'), ('kg', 'weight'),
  ('Milligram', 'weight'), ('mg', 'weight'),
  ('Millilitre', 'volume'), ('ml', 'volume'),
  ('Litre', 'volume'), ('L', 'volume'),
  ('Centimetre', 'length'), ('cm', 'length'),
  ('Meter', 'length');
```

### New: `product_packaging` table

```sql
CREATE TABLE product_packaging (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id        BIGINT UNSIGNED NOT NULL,
  container_unit_id BIGINT UNSIGNED NOT NULL,   -- e.g. Box
  contains_unit_id  BIGINT UNSIGNED NOT NULL,   -- e.g. Pack
  quantity          DECIMAL(12,4) NOT NULL,      -- e.g. 12
  level             TINYINT UNSIGNED NOT NULL,    -- 1, 2, 3…
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (container_unit_id) REFERENCES product_units(id),
  FOREIGN KEY (contains_unit_id) REFERENCES product_units(id)
);
```

### Modified: `products` table (add `default_unit_id`)

```sql
ALTER TABLE products ADD COLUMN default_unit_id BIGINT UNSIGNED AFTER base_unit_id;
-- base_unit_id is replaced functionally by default_unit_id
-- base_unit_id kept for backward compatibility during migration
```

### Existing: `selling_units` table (unchanged)

```sql
-- selling_units continues to exist but is now treated as a DERIVED table
-- for multi-packaging products (auto-populated from packaging structure)
-- Custom selling units manually added by the user are stored here too
```

---

## Purchase & Sale Page Integration

### How POS consumes the new model

When a product is selected in a Sale:

```
1. Check if product has product_packaging rows
   YES → derive selling units from packaging graph
   NO  → check if product has explicit selling_units
          YES → use those
          NO  → create a single default unit ("Piece" / "Box")
```

### Graph Walk Derivation Engine

```
Input:  product_id = 42
Output: [
  { unit: "Box",     baseQty: 120, children: ["Pack(12)→Capsule(10)"] },
  { unit: "Pack",    baseQty: 10,  children: ["Capsule(10)"] },
  { unit: "Capsule", baseQty: 1,   children: [] }
]
```

This is computed at query time (cached per product). No storage needed.

### Sale Bill Unit Selector

```
┌────────────────────┐
│ Unit: [Capsule ▾] │  ← dropdown showing Box, Pack, Capsule
│ Qty: [5       ]   │
│ Price: Rs. 15     │
└────────────────────┘

Backend receives: productId=42, packagingUnit="Capsule", qty=5
Backend looks up: Capsule → baseQty = 1
Backend calculates: 5 × 1 = 5 base units deducted
```

No conversion logic in the frontend. The backend handles all unit resolution using the packaging graph.

---

## Autocomplete Implementation

### UnitAutocomplete Component

```
Props: value, onChange, measurementType?
Behavior on input:
1. Debounce 200ms
2. Query product_units WHERE name LIKE '%input%'
3. If measurementType provided, filter by measurement_type
4. Show up to 6 results in a dropdown
5. User can select existing or press Enter to create new
6. On create: normalise name (Title Case, singular), INSERT into product_units

Position: absolute below input, z-50
Mobile: Full-width dropdown with touch-friendly rows (≥ 44px)
```

---

## Migration Plan

### Phase 1 (Backend — no UI changes)

1. Create `product_units` table + seeder
2. Create `product_packaging` table
3. Add `default_unit_id` to `products`
4. Build derivation engine service
5. Run migration: migrate existing `selling_units` to populate `product_units` with any missing unit names
6. Test everything — no frontend changes yet

### Phase 2 (Frontend — Quick Entry)

1. Replace `CreateProduct.tsx` with new Quick Entry form
2. Only show Name + Cost + Selling Price + Unit selector by default
3. "▶ Add Selling Sizes" toggle to reveal packaging builder
4. Unit selector triggers measurement/packaging mode detection
5. Selling units auto-generated from packaging structure OR measurement type
6. Test all three scenarios

### Phase 3 (Purchase + Sale Integration)

1. Update SaleBill to consume derived selling units
2. Backend returns available units from derivation engine
3. Frontend shows unit dropdown from derived data
4. Remove client-side conversion calculation
5. Test purchase/sale flows

### Phase 4 (Deprecation)

1. Archive old `ProductForm.tsx` and `EditProduct.tsx` code paths
2. Remove `base_unit_id` from product form (keep in DB for backward compat)
3. Update reports to use new unit system
4. Full regression test

---

## Mobile-First Design Rules

| Rule | Implementation |
|------|----------------|
| Touch targets ≥ 44px | All inputs, buttons, dropdown items min-height: 44px |
| Single column ≤ 640px | `grid-cols-1` on mobile, `sm:grid-cols-2` on tablet |
| Full-width inputs | `w-full` on all form inputs |
| Sticky save button | "Save" button fixed at bottom on mobile (shrink-0 in flex container) |
| Collapsible sections | "▶ Add Selling Sizes" collapsed by default — saves vertical space |
| Autocomplete dropdown | Full-width on mobile, positioned above if near bottom of viewport |
| No hover-dependent UI | All interactions must work with tap, not just hover |
| Large text | 16px base font-size on mobile to prevent iOS zoom |

---

## Summary

| Scenario | Fields shown | Clicks to save | Packaging UI |
|----------|-------------|----------------|--------------|
| Simple product (Piece) | Name, Cost, Price | 1 (Enter) | Hidden |
| Measurement (kg/L/m) | Name, Unit, Cost, Price | 2 (Unit + Enter) | Auto-generated |
| Single pack (Box) | Name, Unit, Cost, Price | 2 (Unit + Enter) | Collapsed (optional) |
| Multi-pack (Box→Pack→Capsule) | Same + Selling Sizes expanded | 3-5 | Explicit, natural language |

The form never asks for more than what is needed for that specific product type.
