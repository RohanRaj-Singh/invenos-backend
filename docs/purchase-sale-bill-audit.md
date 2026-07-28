# Audit: Purchase & Sale Bills — Packaging Architecture Compatibility

**Date:** 2026-07-28  
**Scope:** `PurchaseBill.tsx`, `SaleBill.tsx` (POS), `PurchaseService.php`, `SaleService.php`  
**Principle:** UI is frozen — no UX changes to the bills themselves. Only audit data flow readiness.

---

## 1. Purchase Bill — Data Flow

### Frontend → Backend

```
PurchaseBill.tsx → POST /purchases
  items[].product_id
  items[].purchase_pack_name
  items[].purchase_pack_qty      ← base units per purchase pack (from purchaseConfig or input)
  items[].purchase_quantity       ← how many packs bought
  items[].unit_cost               ← cost per pack
  items[].total_cost              ← computed frontend
```

### Backend Processing (`PurchaseService.php:88-113`)

```php
$baseQuantity = $itemData->purchasePackQty * $itemData->purchaseQuantity;
// Stores: purchase_pack_name, purchase_pack_qty, purchase_quantity, unit_cost, total_cost
// Inventory: $baseQuantity added in base units
```

### Verdict

| Aspect | Status | Note |
|--------|--------|------|
| **Three-Unit Model** | ✅ Correct | Purchase Pack ≠ Stock Unit (base) ≠ Selling Unit. Conversion at write time. |
| **Server authority** | ✅ Correct | `baseQuantity = purchasePackQty × purchaseQuantity` recalculated server-side. |
| **Historical snapshot** | ✅ Correct | `purchase_bill_items` stores `purchase_pack_qty`, `purchase_quantity`, `unit_cost`, `product_name`. Packaging changes don't retroactively affect this. |
| **Uses selling_units?** | ✅ Not needed | Purchase bill reads `purchaseConfig` / `default_purchase_cost`, not selling units. |
| **Uses packaging levels?** | ✅ Not needed | Supplier packaging is purchase-specific per ADR Invariant #6. `product_packaging` is for retail only. |
| **Product normalization** | ⚠️ Read-only | Maps `sellingUnits` from backend for the yield breakdown; doesn't send them back. No gap. |

### Yield Breakdown (Line 437-446)

```
getSellingUnitBreakdown() — projection only, shown in purchase bill for margin analysis.
  Reads: product.sellingUnits → costPerUnit, yieldQty, salePrice → margin%
  Impact: Shows correct data. Does NOT affect inventory or financial records.
```

**Verdict:** ✅ No changes needed. Purchase bill correctly uses supplier-specific pack data, which is the intended design per ADR-002.

---

## 2. Sale Bill (POS) — Data Flow

### Frontend → Backend

```
SaleBill.tsx → POST /sales
  items[].product_id
  items[].packaging_quantity        ← how many of the selected selling unit
  items[].base_unit_quantity        ← base units per selling unit (from sellingUnit.quantity)
  items[].unit_price                ← price per selling unit
  items[].total                     ← computed frontend
```

### Backend Processing (`SaleService.php:92-109`)

```php
// Server recalculates base quantity (never trusts client)
$baseQty = $itemData->packagingQuantity * $itemData->baseUnitQuantity;

// COGS from product's last/default purchase cost
$costPrice = $product->last_purchase_cost ?? $product->default_purchase_cost ?? 0;
$cogs = $costPrice * $baseQty;

// Stores: packaging_name, packaging_quantity, base_unit_quantity, base_quantity
// Inventory: $baseQty deducted in base units
```

### Verdict

| Aspect | Status | Note |
|--------|--------|------|
| **Server authority** | ✅ Correct | `baseQty = packagingQuantity × baseUnitQuantity` — server recalculates. |
| **Historical snapshot** | ✅ Correct | `sale_items` stores `packaging_name`, `packaging_quantity`, `base_unit_quantity`, `base_quantity`, `unit_price`. |
| **Packaging read** | ✅ Correct | Reads `sellingUnits` (materialized), not `product_packaging` directly. ADR Invariant #12. |
| **Uses derivation engine?** | ✅ Never | Write-time only. POS reads the materialized table. |
| **Default price risk** | ⚠️ Edge case | `getDefaultSellingUnit()` returns first selling unit regardless of price. If a derived unit has `salePrice=0` and the user hasn't set a price, POS adds a $0 item. This is a **product creation UX gap** (user must set prices), not a sale bill gap. |

### Selling Unit Selector (Line 856-880)

The POS unit dropdown shows:

```tsx
{product.sellingUnits.map((su) => (
  <option key={su.id} value={su.id}>{su.name}</option>
))}
```

This correctly reads the materialized `selling_units` table, which includes both derived units (from packaging) and custom units. The derivation engine's work is already done by this point — the POS never needs to know about `product_packaging`.

**Verdict:** ✅ Correct. The POS consumes what the derivation engine produced.

---

## 3. Key Differences: Purchase vs Sale Data Model

| Concern | Purchase Bill | Sale Bill (POS) |
|---------|---------------|-----------------|
| **Unit source** | Supplier-specific (from purchase transaction) | Selling units (from product) |
| **Conversion** | `purchasePackQty × purchaseQuantity` | `packagingQuantity × baseUnitQuantity` |
| **Packaging levels** | Not used (correct per ADR) | Not needed (materialized in selling_units) |
| **Inventory effect** | Adds stock | Deducts stock |
| **Server recalculation** | ✅ `baseQuantity` recalculated | ✅ `baseQty` recalculated |
| **Historical data** | ✅ Snapshots at transaction time | ✅ Snapshots at transaction time |

---

## 4. Gaps Found

| # | Gap | Location | Severity | Explanation | Needs Fix? |
|---|-----|----------|----------|-------------|------------|
| 1 | **Default selling unit price=0 reaches POS** | `SaleBill.tsx:309-311` `addToCart` uses `defaultSU.salePrice` | **Low** | If a derived unit was created with price=0 and user never set one, the POS item price is 0. But this is a product creation workflow issue (user should set prices), not a sale bill bug. The sale bill correctly uses whatever price is on the selling unit. | 🔲 No — product form UX handles this |
| 2 | **Purchase bill unit selector uses `purchaseConfig` + legacy `purchaseStrategy.getCustomUnitOptions`** | `PurchaseBill.tsx:562-580` | **Low** | The custom unit options are computed client-side using measurement type heuristics. These are fallback/preference values — the actual purchase captures whatever the user enters. ADR explicitly rejected persisting PurchaseConfig (it's a preference, not product identity). Correct behaviour. | 🔲 No — by design |
| 3 | **Product normalization drops `product_unit_id` and `packaging_id`** | `PurchaseBill.tsx:176-180`, `SaleBill.tsx:170-184` | **Low** | The normalization maps backend snake_case → frontend camelCase. The new `product_unit_id` and `packaging_id` fields are not explicitly mapped — they fall through from the backend response as extra props. Since both bills only READ these values (via sellingUnits consumption), and the normalization spreads `...p` first then `...u`, the fields are preserved on the objects. | 🔲 No — spread preserves them |
| 4 | **Sale bill `handleChangeUnit` only handles selling unit ID and custom measurement units** | `SaleBill.tsx:420-483` | **None** | When a user switches units in POS, it looks up the selling unit by ID. This works regardless of whether the selling unit was derived from packaging or created manually. The derivation is invisible at this layer. | 🔲 Correct by design |

---

## 5. Invariant Compliance

ADR-002 defines 13 architectural invariants. Here's how the purchase and sale bills comply:

| # | Invariant | Purchase Bill | Sale Bill |
|---|-----------|---------------|-----------|
| 3 | Derivation engine runs on write operations only | ✅ Never called from purchase | ✅ Never called from sale |
| 4 | Inventory tracked in base units only | ✅ `baseQuantity` in base units | ✅ `baseQty` in base units |
| 5 | Historical data uses snapshots | ✅ `purchase_bill_items` snapshots | ✅ `sale_items` snapshots |
| 6 | Supplier packaging is purchase-specific | ✅ Purchase bill captures its own pack data | N/A |
| 12 | POS/Purchase/Reports never invoke derivation engine | ✅ Never called | ✅ Never called |

---

## 6. Summary

| Module | Compatibility | Action Needed |
|--------|---------------|---------------|
| **Purchase Bill** | ✅ Full | None. Correctly uses supplier-specific pack data. |
| **Sale Bill (POS)** | ✅ Full | None. Correctly reads materialized selling units. |
| **PurchaseService** | ✅ Full | Server-authoritative conversion already implemented. |
| **SaleService** | ✅ Full | Server-authoritative conversion already implemented (P1 fix from unit-conversion-audit). |

**Both bills are fully compatible with ADR-002.** The separation of concerns holds:

- **Purchase Bill** never touches `product_packaging` — it works with supplier-specific pack data per ADR Invariant #6
- **Sale Bill** never touches `product_packaging` or the derivation engine — it reads materialized `selling_units` per ADR Invariant #12
- Both recalculate base quantities server-side per ADR Invariant #4
- Both snapshot historical data per ADR Invariant #5

The only UX concern (derived units appearing with $0 price in POS) is a **product creation workflow issue**, not a sale bill issue. The user must set prices on derived units during product creation, which the ProductForm's derived unit price inputs address.
