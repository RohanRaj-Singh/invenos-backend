# Product Unit Architecture — Final Direction

**Date:** 2026-07-28
**Status:** Architecture Decision
**Principle:** Evolve the UX. Preserve the backend investment.

---

## Executive Summary

After multiple architecture reviews, we converged on a clear direction:

**The user-facing unit model changes to a relationship-based editor. The backend (`selling_units`, `product_packaging`, derivation engine) remains intact as the runtime engine.**

A thin transformation layer bridges the two:

```
User-edited relationships (bidirectional, flat, natural language)
         │
         ▼
    [ Transformation Layer ]    ← NEW — ~80 lines, pure function
         │
         ▼
    Existing Backend Runtime    ← UNCHANGED
    (selling_units + product_packaging + derivation engine)
         │
         ▼
    Purchase · Sale · Inventory · Clinic · Reports · POS · Printing
    (all unchanged)
```

This gives the 90% UX improvement for 30% of the risk of a full replacement.

---

## What We Agreed On

### 1. The Problem

The current Product Form asks the user to pick a "Base Unit" and then define packaging relative to it. This forces:

- **Fixed direction:** "X base units per Y" instead of "1 Y contains N X"
- **Fractions:** 0.001 kg/g for measurement products
- **Ambiguity:** "Is the base unit the smallest unit, the inventory unit, or just the default?"
- **Three overlapping sections:** Inline conversion + Packaging Levels + Selling Sizes, all doing similar things

### 2. The Root Cause

Not a hierarchy problem. Not a database problem. A **presentation problem** — the form exposes backend concepts (base unit, levels, derivation) instead of business concepts (what do you sell? how is it packaged?).

### 3. The Fix

Replace the three overlapping sections with a single **Relationship Editor**:

```
Current:                         Proposed:
┌──────────────────────┐         ┌──────────────────────────────┐
│ Unit: [Box ▾]        │         │ Default unit: [Box ▾]        │
│ Each Box = [12][Pack]│         │ Price: [Rs. 500 per Box]     │
│ ▶ More Options       │         │                              │
│   Packaging Levels   │         │ Other units:                 │
│   Selling Sizes      │         │ 1 Strip = [10] [Capsule]  Rs.50│
└──────────────────────┘         │ 1 Case  = [12] [Box]    Rs.0   │
                                  │ [+ Add unit]                 │
                                  │ ── Purchase ──               │
                                  │ 1 Carton = [10] [Case] Rs.4500│
                                  └──────────────────────────────┘
```

### 4. What We Kept

| Component | Why We Kept It |
|-----------|---------------|
| **`selling_units` table** | Already integrated with Purchase, Sale, Inventory, Clinic, Reports, POS |
| **`product_packaging` table** | Feeds the derivation engine |
| **PackagingDerivationEngine** | Correct one-way flow from structure → runtime units |
| **ProductService::create()** | Processes `packaging` + `selling_units` payload (unchanged shape) |
| **ProductService::update()** | Re-derives on packaging change (same logic) |
| **SaleService::create()** | Reads `selling_units` — no change needed |
| **PurchaseService::create()** | Reads purchase data — no change needed |
| **All existing products** | No migration — legacy data continues working |

### 5. What We Changed

| Component | Change | Why |
|-----------|--------|-----|
| **ProductForm.tsx** | Replace 3 sections with 1 relationship editor | Eliminates the UX confusion |
| **New: `UnitRelationEditor`** | Flat relationship entry with autocomplete | Single, consistent UX for defining units |
| **New: `transformRelationshipsToBackend()`** | Pure function: relationships → `packaging` + `selling_units` | Bridges the new UX to the existing backend |

### 6. What We Explicitly Rejected

| Idea | Why Rejected |
|------|-------------|
| **Replace `selling_units` with `product_relationships`** | Too much migration effort for existing integrations. No clear runtime benefit. |
| **Remove `product_packaging` table** | The derivation engine needs structured input. The transformer generates it. |
| **Remove derivation engine** | It's a correct one-way flow. Keeping it avoids revalidating inventory deduction paths. |
| **Infer the inventory unit** | The business must decide. The system should not guess. |
| **Make inventory calculate in a hidden unit** | Unnecessary indirection. The default unit IS the inventory unit — the user chooses it. |

---

## How It Works

### User Flow

```
1. Pick Default Unit
   ─────────────────
   "What do you count inventory in?"
   [Capsule ▼]

2. Set a Price
   ─────────────
   "Price per Capsule" = Rs. 5

3. Add Other Units (optional)
   ──────────────────────────
   1 [Strip ▼] = [10] [Capsule ▼]  @ Rs. 50
   1 [Box ▼]   = [12] [Strip ▼]     @ Rs. 500

4. Add Purchase Units (optional)
   ─────────────────────────────
   1 [Carton ▼] = [10] [Box ▼]  @ Rs. 4,500

5. Save
```

### Data Flow

```
User input:
  1 Box = 12 Strips
  1 Strip = 10 Capsules
  Default: Capsule
  Prices: Box=500, Strip=50, Capsule=5
         │
         ▼
  Transaction Layer (transformRelationshipsToBackend):
  ┌──────────────────────────────────────────────────────┐
  │ 1. Build graph: Capsule(leaf) ← Strip ← Box(root)   │
  │ 2. Compute transitive qty: Capsule=1, Strip=10,      │
  │    Box=120                                            │
  │ 3. Generate packaging rows:                           │
  │    [{container:'Box', contains:'Strip', qty:12},      │
  │     {container:'Strip', contains:'Capsule', qty:10}]  │
  │ 4. Generate selling_units:                            │
  │    [{name:'Capsule', qty:1, price:5, is_default:true},│
  │     {name:'Strip', qty:10, price:50},                 │
  │     {name:'Box', qty:120, price:500}]                 │
  └──────────────────────────────────────────────────────┘
         │
         ▼
  ProductService::create() / update()
  (unchanged — receives packaging + selling_units payload)
         │
         ▼
  Derivation Engine runs (unchanged)
         │
         ▼
  selling_units table populated (unchanged)
         │
         ▼
  SaleBill, PurchaseBill, POS read selling_units
  (unchanged)
```

---

## Files Changed

### New Files

| File | Description | Lines |
|------|-------------|-------|
| `resources/js/components/unit/UnitRelationEditor.tsx` | Flat relationship editor with autocomplete, validation, prices | ~250 |
| `resources/js/lib/unit-relation-transformer.ts` | Pure function: relationships → `packaging` + `selling_units` payload | ~80 |
| `resources/js/lib/unit-relation-validator.ts` | Cycle detection, duplicate detection, consistency checks | ~60 |

### Modified Files

| File | Change | Lines Changed |
|------|--------|--------------|
| `resources/js/Pages/inventory/components/ProductForm.tsx` | Replace inline conversion + Packaging Levels Builder + Selling Sizes with `UnitRelationEditor` | ~200 |
| `resources/js/Pages/inventory/AddProduct.tsx` | Props may shift slightly | ~5 |
| `resources/js/Pages/inventory/EditProduct.tsx` | Same | ~5 |

### Unchanged Files (Deliberately)

| File | Why Unchanged |
|------|--------------|
| `app/Domains/Products/Services/ProductService.php` | Receives same payload |
| `app/Domains/Products/Services/PackagingDerivationEngine.php` | Processes same packaging structure |
| `app/Domains/Sales/Services/SaleService.php` | Reads `selling_units` — unchanged |
| `app/Domains/Purchasing/Services/PurchaseService.php` | Handles purchase data — unchanged |
| `app/Domains/Inventory/Services/InventoryService.php` | Tracks stock in default unit — unchanged |
| `resources/js/Pages/pos/SaleBill.tsx` | Reads `selling_units` — unchanged |
| `resources/js/Pages/purchases/PurchaseBill.tsx` | Reads purchase data — unchanged |
| `resources/js/Pages/clinic/*` | Reads products + selling units — unchanged |
| `resources/js/Pages/sales/*` | Reads snapshotted data — unchanged |
| `resources/js/Pages/reports/*` | Reads snapshotted data — unchanged |
| All tests | Existing tests continue to pass with same payload shape |

---

## What This Unlocks

| Future Feature | Why It's Easier Now |
|---------------|-------------------|
| **Manufacturing / BOM** | A BOM is just a relationship with `type: 'ingredient'` instead of `type: 'packaging'` — the editor already handles it |
| **Multi-warehouse** | Each warehouse can have its own default unit for stock counting — the relationship editor per-warehouse |
| **Barcode scanning at receiving** | Scan a Carton barcode → system knows 1 Carton = 10 Boxes = 120 Strips → adds correct stock |
| **Returns in any unit** | Customer returns 2 Strips — system converts to default unit, deducts, prints receipt |
| **Buy one get one free** | Relationship with `quantity: 2, sale_price: price_of_1` — unit editor handles it |
| **Tiered pricing** | "Box of 12: Rs. 500, Box of 24: Rs. 900" — two relationship rows for the same unit name, different quantities |

---

## Verification

| Check | Method |
|-------|--------|
| Simple product saves in 1 click | Create product with only Name + Default Unit + Price → saves, 1 selling unit created |
| Packaging products work | Create Box→12 Strips→10 Capsules → 3 selling units, prices editable inline |
| Measurement products work | Create kg product → auto-suggest g, 500g, 2kg as additional units |
| Purchase units work | Add Carton with purchase_cost → PurchaseBill pre-selects Carton |
| Edit preserves existing data | Edit product created with old UI → legacy product_packaging + selling_units preserved |
| Edit via new UI migrates on save | Edit old product → transformer generates new packaging + selling_units, old data replaced |
| SaleBill unchanged | POS shows same selling units as before |
| PurchaseBill unchanged | PurchaseBill reads same purchase data |
| Reports unchanged | All report queries unchanged |
| NoUnitRelationEditor for simple products | Simple products (1 unit, no packaging) never show the relationship editor |
