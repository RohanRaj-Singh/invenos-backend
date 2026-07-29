# Relationship Editor — Evolutionary Implementation

**Date:** 2026-07-28
**Context:** Response to architecture review feedback
**Principle:** Evolve the UX, preserve the backend investment

---

## The Core Insight

> A relationship **defines** a unit. It is not a unit itself.

```
1 Strip = 12 Capsules

  ↑ unit    ↑ relationship  ↑ unit
```

Units (`Strip`, `Capsule`) exist independently. The relationship (`= 12`) defines how Strip relates to Capsule. This distinction matters because:

- A unit can exist without a relationship (the Base Unit / Default Unit)
- A relationship always connects two existing units
- Removing a relationship should not remove the units themselves
- Units can participate in multiple relationships (e.g., Strip ↔ Box AND Strip ↔ Capsule)

---

## The Key Question

> Can the Relationship Editor UI be introduced while preserving the existing backend architecture?

**Answer: Yes.** With a thin transformation layer.

```
User-edited relationships (bidirectional, natural language)
         │
         ▼
    [ Transformation Layer ]
         │
         ▼
Existing backend: selling_units + product_packaging + derivation engine
         │
         ▼
    Purchase · Sale · Inventory · Clinic · Reports (unchanged)
```

Everything that currently reads `selling_units` continues to work unchanged. The transformation layer is the only addition.

---

## How It Works

### Step 1: User Defines Relationships (New UI)

```
┌──────────────────────────────────────────────┐
│  Default Unit: [Capsule ▼]                    │
│  Price: [Rs. 5 per Capsule]                   │
│                                                │
│  ── Other units ──                            │
│                                                │
│  1 [Strip ▼]  =  [10] [Capsule]  · [Rs. 50]  │
│  1 [Box ▼]    =  [12] [Strip]   · [Rs. 500]  │
│                                                │
│  [+ Add unit]                                  │
│                                                │
│  Purchase:                                     │
│  1 [Carton ▼] =  [10] [Box]  · [Rs. 4,500]    │
│                                                │
│  [Save]                                        │
└──────────────────────────────────────────────┘
```

The user never sees "level 1," "level 2," or "base unit." They see a flat list of "this unit = that many of that unit."

### Step 2: Transformation Layer Computes Derivation

On save, the transformation layer:

```typescript
function transformRelationshipsToBackend(
  defaultUnitId: string,
  relationships: Relationship[]
): BackendPayload {

  // Walk the graph to compute quantities relative to the default unit
  const graph = buildGraph(relationships, defaultUnitId)

  // For each unique unit in the graph, compute its quantity in default units
  const units = computeTransitiveQuantities(graph, defaultUnitId)

  return {
    // Product_packaging: container → contains pairs for the derivation engine
    packaging: relationships.map(r => ({
      container_unit_id: productUnitId(r.largerUnit),
      contains_unit_id: productUnitId(r.smallerUnit),
      quantity: r.quantity,
      level: inferLevel(r, relationships),
    })),

    // Selling_units: each unit with its price
    selling_units: Array.from(units.entries()).map(([name, qty]) => ({
      name,
      quantity: qty,           // → base units per selling unit
      sale_price: findPrice(name, relationships),
      is_default: name === defaultUnitName,
      product_unit_id: productUnitId(name),
    })),

    // Purchase unit: relationships with purchase_cost
    purchase_unit: relationships
      .filter(r => r.purchase_cost)
      .map(r => ({ name: r.largerUnit, quantity: r.quantity, cost: r.purchase_cost })),
  }
}
```

**This is the only new code** — a pure function that converts user-friendly relationships into the existing backend format.

### Step 3: Backend Processes Normally

`ProductService::create()` and `ProductService::update()` receive the same payload they already handle. The derivation engine runs. `selling_units` are created. Inventory, Purchase, Sale, Clinic, Reports — all unchanged.

---

## What Changes

### New
| Item | What | Lines |
|------|------|-------|
| `UnitRelationEditor` UI component | The relationship editor | ~250 |
| `transformRelationshipsToBackend()` | Pure function, flat → backend format | ~80 |
| Relationship validation | Cycle detection, duplicate detection | ~60 |

### Modified
| Item | Change | Lines |
|------|--------|-------|
| `ProductForm.tsx` | Replace 3 sections (inline conversion, packaging builder, selling sizes) with 1 relationship editor | ~200 changed |
| `buildPayload()` | Call transformer instead of building packaging + selling_units separately | ~10 |

### Unchanged
| Item | Why |
|------|-----|
| `ProductService::create()` | Receives same payload |
| `ProductService::update()` | Receives same payload |
| `SaleService::create()` | Reads `selling_units` — unchanged |
| `PurchaseService::create()` | Uses purchase data — unchanged |
| `InventoryService` | Tracks stock — unchanged |
| `SaleBill.tsx` | Reads `selling_units` — unchanged |
| `PurchaseBill.tsx` | Reads purchase data — unchanged |
| All Clinic code | Reads products + selling_units — unchanged |
| All Reports | Reads snapshotted data — unchanged |
| All Printing | Reads snapshotted data — unchanged |
| All existing products | Still use legacy `selling_units` and `packaging` — unchanged |

**Zero changes to historical data. Zero changes to runtime flows. Zero changes to existing products.**

---

## How Existing Products Behave

| Scenario | Current | After |
|----------|---------|-------|
| **Old product, no edit** | Uses `selling_units` + `product_packaging` as before | **Unchanged** — no migration needed |
| **Old product, edited via new UI** | User defines relationships → transformer generates `packaging` + `selling_units` | Backend receives same format as always |
| **New product, new UI** | User defines relationships → transformer generates payload | Backend processes normally |
| **Old product, never edited** | Legacy data still works | Works forever — no migration required |

---

## Answering the Specific Challenge

### "Inventory needs a canonical calculation, not a canonical unit."

Agreed. The default unit is the unit the user counts in. The calculation (`quantity × relationship.quantity`) normalises to default units internally. The user never needs to know.

### "Can selling_units remain the runtime model?"

Yes. The transformer materialises relationships into `selling_units`. Nothing about SaleBill, PurchaseBill, or POS needs to change.

### "Can the derivation engine be adapted instead of removed?"

Yes. The transformer generates `product_packaging` rows, which the derivation engine processes normally. The engine doesn't need to know that the input came from a relationship editor instead of the current packaging builder.

### "Can Purchase and Sale continue working without modification?"

Yes. Both read `selling_units` and `purchase_config` — both of which the transformer generates.

### "Can we minimise database changes?"

**Zero database changes.** The transformer targets the existing `product_packaging` and `selling_units` tables. No new tables. No migrations.

---

## Implementation Plan

### Session 1: `UnitRelationEditor` component

```
resources/js/components/unit/UnitRelationEditor.tsx
resources/js/lib/unit-relation-transformer.ts
resources/js/lib/unit-relation-validator.ts
```

### Session 2: Integrate into ProductForm

```
resources/js/Pages/inventory/components/ProductForm.tsx
  → Replace inline conversion section
  → Replace Packaging Levels Builder
  → Replace Selling Sizes
  → Call transformer in buildPayload()
```

### Session 3: Testing

```
- Create simple product (Piece) → 1-click save
- Create measurement product (kg) → auto-suggest sizes
- Create packaging product (Box→Strip→Capsule) → flat relationship entry
- Edit existing product → preserves legacy data
- Edit old product with new UI → transforms on save
- Purchase bill reads selling units → unchanged
- Sale bill reads selling units → unchanged
- Clinic prescribes medicine → unchanged
```

---

## Comparison

| Approach | Risk | Effort | Changes Backend | Changes DB | Changes Frontend |
|----------|------|--------|----------------|-----------|-----------------|
| **Full replacement** (`product_relationships`) | HIGH | 3 sessions | Yes | Yes | Yes |
| **Evolutionary (proposed)** | LOW | 2 sessions | No | No | Yes |
| **UX-only (cosmetic)** | LOW | <1 session | No | No | Partial |

The evolutionary approach gives 90% of the UX benefit for 30% of the risk.

---

## Summary

| Item | Verdict |
|------|---------|
| **Keep `selling_units` as runtime model?** | ✅ Yes — it works, stable, integrated everywhere |
| **Keep `product_packaging` table?** | ✅ Yes — the derivation engine needs it |
| **Keep `PackagingDerivationEngine`?** | ✅ Yes — it processes what the transformer generates |
| **Keep `SaleService::create()`?** | ✅ Yes — unchanged |
| **Keep `PurchaseService::create()`?** | ✅ Yes — unchanged |
| **New `UnitRelationEditor`?** | ✅ Yes — replaces the confusing 3-section form |
| **New transformer?** | ✅ Yes — bridges the new UX to the existing backend |
| **Database migration?** | ❌ No — zero changes needed |
| **New database table?** | ❌ No — not needed |
