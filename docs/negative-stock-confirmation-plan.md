# Negative Stock — Confirmation Dialog Plan

**Problem:** When a sale is recorded for a product with 0 stock, `InventoryService::applyMovement()` throws an `InvalidArgumentException` which shows as a Laravel error page instead of a user-friendly message.

**Goal:** Replace the exception with a confirmation dialog that lets the user proceed.

---

## Design

### Frontend: Pre-submit stock check

Before the sale/purchase/clinic transaction is submitted, check each item's stock level. If any item would go below 0, show a confirmation dialog:

```
┌──────────────────────────────────────────────┐
│  ⚠️ Low Stock Warning                         │
│                                              │
│  The following items have insufficient stock: │
│                                              │
│  • Amoxil 250mg — 2 Strip requested,         │
│    0 in stock                                │
│                                              │
│  Do you want to proceed with this sale?       │
│  Stock will go negative for these items.      │
│                                              │
│  [Cancel]              [Proceed with Sale]    │
└──────────────────────────────────────────────┘
```

This already exists in `SaleBill.tsx` as `ConfirmTransactionDialog` — I can reuse/extend it.

### Backend: Accept confirmation flag

Add a `force_negative_stock` flag to the sale/purchase/clinic requests:

- `SaleController::store()` — check `$request->input('force_negative_stock')`
- `ClinicController::storeVisit()` — same flag
- `PurchaseService::create()` — purchases add stock, not deduct, so no check needed
- `InventoryController::adjust()` — adjustments can already go negative if `allow_negative_stock` is set per-product

When the flag is true, temporarily bypass the negative stock check in `InventoryService::applyMovement()`.

---

## Files Changed

| File | Change | Lines |
|------|--------|-------|
| `SaleBill.tsx` | Add pre-submit stock check + confirmation dialog | ~30 |
| `SaleService.php` | Pass `force_negative_stock` flag | ~5 |
| `InventoryService.php` | Accept optional `bypassStockCheck` parameter | ~5 |
| `ClinicController.php` | Pass flag from clinic visits | ~3 |
| `PurchaseBill.tsx` | Apply same pattern for purchase returns | ~15 |

---

## Implementation

### Step 1: Update `InventoryService::applyMovement()`

```php
public function applyMovement(
    ...,
    bool $bypassStockCheck = false,  // NEW
): InventoryTransaction {
    ...
    if ($quantity < 0 && $product->stock_quantity + $quantity < 0 
        && !$isReversal && !$productAllowsNegative 
        && !($product->track_inventory === false)
        && !$bypassStockCheck  // NEW: skip if confirmed
    ) {
        throw new \InvalidArgumentException(...);
    }
    ...
}
```

### Step 2: Add frontend stock check in `SaleBill.tsx`

Before `router.post()`, check each item:

```typescript
const hasInsufficientStock = computedCart.some(item => {
  const product = posProducts.find((p: any) => p.id === item.productId)
  if (!product || !product.track_inventory) return false
  const required = item.packagingQuantity * item.baseUnitQuantity
  return product.stockQuantity < required
})
```

If true, show a `ConfirmTransactionDialog` with a warning variant. On confirm, set `force_negative_stock: true` in the payload.

### Step 3: Propagate flag in `SaleService::create()`

```php
public function create(CreateSaleData $data, bool $forceNegativeStock = false): Sale
```

Pass it through to `InventoryService::recordSale()`.
