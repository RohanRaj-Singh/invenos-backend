# Negative Stock Architecture Audit — Refined

---

## 1. Current Architecture Analysis

### The Only Gate

**`InventoryService::applyMovement()`:209**

```php
if ($quantity < 0 && $product->stock_quantity + $quantity < 0 && !($product->track_inventory === false)) {
    throw new \InvalidArgumentException("Insufficient stock...");
}
```

Also in the same method:

```php
if ($newStock <= 0) {
    $product->status = 'out-of-stock';
    $product->stock_quantity = max(0, $newStock);  // ← Silently clamps to 0
}
```

These are the **only two lines** that enforce non-negative stock. Both are in `applyMovement()`, which is the single chokepoint for ALL inventory movements.

### Where Negative Already Works

| Operation | Current | Negative Safe? |
|-----------|---------|----------------|
| Purchase (+qty) | Adds to stock | ✅ Yes |
| Sale (-qty) | Check prevents net < 0 | ❌ Blocked |
| Sale Return (+qty) | Adds to stock | ✅ Yes |
| Purchase Return (-qty) | Check prevents net < 0 | ❌ Blocked |
| Adjustment (+/-) | Check prevents negative | ❌ Blocked |
| Delete Sale (+qty reversal) | Adds to stock | ✅ Yes |
| Delete Purchase (-qty reversal) | Can fail if stock < qty | ❌ Blocked |
| Damage / Consumption (-) | Check prevents negative | ❌ Blocked |

---

## 2. Refined COGS Strategy (HIGHEST PRIORITY)

### Rejected: COGS = 0

The original audit proposed COGS = 0 for negative-stock sales. This produces misleading profit reports and is **not acceptable** for a production POS.

### Accepted: Best-Available Cost

Use a fallback chain at the time of the **sale**:

```
1. Current average cost (stock_quantity > 0 ? total_value / stock_qty)
2. Last purchase cost (product.last_purchase_cost)
3. Default purchase cost (product.default_purchase_cost)
4. 0 (only when no cost data exists at all)
```

### How It Works

**Sale Item Creation** (`SaleService::create()`):

```php
// Calculate COGS for each sale item
$costPrice = $product->last_purchase_cost ?? $product->default_purchase_cost ?? 0;
if ($product->stock_quantity > 0) {
    // Use simple average: total stock value / total stock qty
    $stockValue = $product->stock_quantity * $costPrice;
    $averageCost = $stockValue / $product->stock_quantity;
    $cogs = $averageCost * $baseQuantity;
} else {
    // Negative or zero stock: use last purchase cost
    $cogs = $costPrice * $baseQuantity;
}
```

### Financial Impact

```
Scenario:
  Stock: 0
  Sell: 5 kg @ Rs. 200/kg → Revenue: Rs. 1,000
  Last purchase cost: Rs. 180/kg (from previous batch)

  COGS: 5 × 180 = Rs. 900
  Profit: Rs. 1,000 - Rs. 900 = Rs. 100  ← Realistic
```

Without this fix (COGS = 0):

```
  Profit: Rs. 1,000  ← Misleading, dangerously overstated
```

### When Purchase Arrives Later

```
  After sale: stock = -5 kg, COGS recorded = Rs. 900
  Purchase: 20 kg @ Rs. 160/kg
  New stock: 15 kg
  Average cost: (20 × 160) / 20 = Rs. 160/kg (fresh average)
  COGS from the earlier sale: unchanged at Rs. 900
```

**Historical COGS never changes.** The purchase cost is applied prospectively. This is consistent with how most POS systems handle the scenario.

### Recommendation: ACCEPTED with fallback chain

This is the single most important refinement. The `COGS = 0` proposal from the original audit is **rejected**. The best-available-cost fallback chain is implemented instead.

---

## 3. Product Restrictions — Refined

### Rejected: Option E (restrict by product type)

The original audit proposed restricting negative stock to only certain product types. This is **rejected** for the following reasons:

- Real businesses sell rice, flour, sugar, oil BEFORE recording purchases
- These are cost-tracked, high-value products
- Restricting them would make the feature unusable for the target market
- The COGS fallback chain already handles costing correctly regardless of product type

### Accepted: Business Policy Configuration

Negative stock is a **business policy**, not a product-type filter:

| Level | Setting | Default | Purpose |
|-------|---------|---------|---------|
| System | `allow_negative_stock` in Settings → Inventory | `false` | Master switch |
| Product | `allow_negative_stock` on Product model | `null` (inherit) | Per-product override |

This allows:
- A pharmacy to disable negative stock for controlled substances
- A grocery store to enable it for all commodities
- A hardware store to enable it for cement but disable for specialty items

### Why This Over Product-Type Restrictions

- Product types (`track_inventory` boolean) are too coarse
- The COGS strategy works correctly regardless of product type
- Business owners should decide their own policy
- The configuration is simple enough for non-technical users

---

## 4. Product Status

### Accepted: No New Status

| Status | Current condition | Negative stock condition |
|--------|------------------|------------------------|
| `in-stock` | `stock > low_threshold` | N/A (stock would be negative) |
| `low-stock` | `0 < stock <= low_threshold` | N/A |
| `out-of-stock` | `stock <= 0` | `stock <= 0` ← **Still correct** |

The sign of the quantity (-5) already communicates the oversold state. Adding a 'negative-stock' status would:
- Add UI complexity for no additional information
- Require frontend colour coding and badge changes
- Not change any business logic

**Recommendation**: Keep 'out-of-stock' for stock ≤ 0. Display quantity in red when negative.

---

## 5. Reversal Validation

### Scenario A: Delete Purchase After Negative Stock

```
Stock: -5 (oversold)
Purchase: 20 → Stock: 15
Delete Purchase → should reverse: -20
Result: Stock: -5  ✅
```

**Current reversal logic**: `recordAdjustment(quantity: -$baseQuantity)` — applies -20 movement from stock of 15 → stock becomes -5. The check in `applyMovement` would need to allow this. With negative stock enabled, the gate is bypassed → **correct**.

### Scenario B: Sale Return When Negative

```
Stock: -5
Sale Return: +2 → Stock should become: -3
```

**Current return logic**: `recordReturn(quantity: +2)` → `recordPurchase(2)` → `applyMovement(+2)` → stock = -5 + 2 = -3. ✅ This already works because positive movements don't trigger the gate.

### Scenario C: Delete Purchase When Already Negative (Without Negative Stock Enabled)

```
Stock: -5 (somehow, manually adjusted)
Purchase: 20 → Stock: 15
Delete Purchase → reversing -20 from stock 15
Result: Stock: -5
```

The reversal (-20) passes through `recordAdjustment(-20)` → `applyMovement(-20)`. If negative stock is NOT enabled, this would fail because `15 + (-20) = -5 < 0` → throws. **Issue identified**.

**Fix**: Reversal transactions (delete) should bypass the negative stock gate, since they're reversing a previously-valid transaction. This is the correct behaviour regardless of the negative stock setting.

### Recommendation

Reversal transactions should **always** be allowed, even without negative stock enabled. The reversal is correcting a historical state, not creating new business risk.

---

## 6. Inventory Valuation

### Display Strategy

| Stock | Cost | Valuation | Display |
|-------|------|-----------|---------|
| 10 kg | Rs. 100/kg | Rs. 1,000 | Normal, black |
| -5 kg | Rs. 100/kg | -Rs. 500 | Red, negative sign |
| 0 kg | — | Rs. 0 | Normal, grey |

### Formula

```
Valuation = stock_quantity × average_cost
```

Where `average_cost = total_value_of_stock / stock_quantity` (when stock > 0), else use `last_purchase_cost`.

For negative stock:
```
Valuation = stock_quantity × last_purchase_cost
         = (-5) × 100
         = -500 (negative asset = liability)
```

This is mathematically correct and accounting-compatible. A negative inventory valuation represents a **liability** — the business owes inventory to its customers.

### Reporting Integration

- **Stock Valuation report**: Show negative values as-is, with a "Negative stock" subsection
- **Dashboard total value**: Include negative values (they reduce total asset value)
- **Low stock report**: Negative stock products are the lowest priority — include in red

---

## 7. Updated Risk Assessment

| Risk | Severity | Likelihood | Mitigation | Status |
|------|----------|------------|------------|--------|
| ~~COGS = 0 → inflated profit~~ | — | — | Best-available-cost fallback chain | ✅ RESOLVED |
| Cashier accidentally creates massive negative | MEDIUM | Low | Confirmation dialog + system default off | ✅ |
| Negative stock persists uncorrected | LOW | Low | Dashboard alert for oversold products | ✅ |
| Valuation shows negative assets | LOW | Medium | Display in red + tooltip explanation | ✅ |
| Reversal fails when stock is negative | **HIGH** | Medium | Bypass negative stock gate for reversals | ☑️ IDENTIFIED |

### New Risk: Reversal Transaction Blocked

**If negative stock is NOT enabled**, deleting a purchase that would temporarily make stock negative will throw an error. Example: Stock = 5, Delete Purchase that was for 10 → reversal is -10 → stock = -5 → blocked.

**Fix**: Reversals (`reference_type` = 'sale'/'purchase' in the original transaction) should bypass the gate. The gate should apply to NEW sales, not to reversals.

---

## 8. Final Implementation Recommendations

### What Changes (Updated)

| Component | Change | Priority |
|-----------|--------|----------|
| `InventoryService::applyMovement()` | Gate: check `allow_negative_stock` + bypass for reversals | P1 |
| `InventoryService::applyMovement()` | Clamp: don't `max(0,)` when negative allowed | P1 |
| `products` table | Add `allow_negative_stock` nullable boolean | P1 |
| `SettingService` defaults | Add `allow_negative_stock => false` | P1 |
| `SaleService::create()` | Calculate COGS using best-available-cost fallback chain | P1 |
| Settings → Inventory page | Add Allow Negative Stock toggle | P2 |
| ProductForm (create/edit) | Add per-product override | P2 |
| SaleBill pre-submit | Confirm dialog when stock would go negative | P2 |
| Product list/card | Red highlighting for negative stock | P3 |
| Dashboard | Oversold products alert | P3 |

### What Does NOT Change

- ✅ Three-Unit Model
- ✅ Conversion engine
- ✅ Reversal transaction architecture (already correct)
- ✅ Historical data immutability
- ✅ Purchase/Sale flow
- ✅ API contracts
- ✅ Reporting structure

### Compatibility Check

| Future Module | Compatible? | Notes |
|--------------|-------------|-------|
| Stock Transfers | ✅ | Negative stock would transfer as negative — same logic |
| Physical Counts | ✅ | Count reconciliation would correct negatives |
| Batch / Lot Tracking | ⚠️ | Negative batches need discussion (out of scope) |
| Manufacturing | ✅ | Assemblies consuming negative stock → valid |
| Multi-store | ✅ | Each store has independent stock — negatives per-store |
| Barcode Scanning | ✅ | Scan → sell → stock goes negative — no change needed |

---

## 9. Conclusion

The original audit's core recommendation (gate + clamp change in `applyMovement()`) is correct. Three refinements are applied:

| Finding | Original | Refined |
|---------|----------|---------|
| **COGS** | Use 0 | Use best-available-cost fallback (last → default → 0) |
| **Product restrictions** | Restrict by type (Option E) | No restrictions — business policy only |
| **Reversal gate** | Allow all with negative stock enabled | Bypass gate for ALL reversals regardless of setting |
| **Status** | No new status needed | ✅ Accepted unchanged |

The refined architecture is production-ready for MVP implementation.
