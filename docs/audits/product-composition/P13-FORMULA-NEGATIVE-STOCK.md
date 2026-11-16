# P13 — Formula POS Negative Stock Policy Consistency

**Date:** 2026-11-15
**Branch:** `feature/product-composition`
**HEAD:** `50be1bd911f8c0ad46a9232aac4396837f457843` (no commit)
**Status:** Implemented. Formula ingredient consumption now honours the same
negative-stock policy as a directly sold product.

---

## 1. Root cause

Formula checkout had **two independent stock checks**, and only one consulted the policy:

| Layer | File | Behaviour before |
|---|---|---|
| Preflight | `CompositionExecutionService::preflight()` | Rejected whenever `available < required`, **unconditionally** |
| Movement | `InventoryService::applyMovement()` | Correctly consulted `allow_negative_stock` |

Because preflight ran first and never asked the policy, the movement layer's allowance was
unreachable for formulas. A traditional product hit only `applyMovement` and therefore obeyed the
policy; a formula hit the unconditional preflight and was always blocked, producing:

```
Insufficient stock for component 'P' (required: 15, available: 1).
```

The defect was **not** that validation existed — it was that validation ignored the policy.

---

## 2. Negative-stock policy source

There is one established policy, in this precedence order (unchanged, now shared):

1. `products.allow_negative_stock` — per-product override. `NULL` means "inherit".
2. `settings.values.inventory.allow_negative_stock` — business-wide setting.

Shipped defaults:
- `products.allow_negative_stock` model default = `true` (`Product::$attributes`).
- `SettingService::defaults()['inventory']['allow_negative_stock']` = `false`.

No formula-specific setting was introduced, and no new configuration was added.

**One resolver now owns it** — `InventoryService::allowsNegativeStock(Product)`:

```php
if ($product->allow_negative_stock !== null) {
    return (bool) $product->allow_negative_stock;
}

return (bool) (app(SettingService::class)->get()['inventory']['allow_negative_stock'] ?? true);
```

Both `applyMovement()` and `preflight()` call it, so they cannot drift apart again.

---

## 3. Backend implementation

**`app/Domains/Inventory/Services/InventoryService.php`**
- Added `allowsNegativeStock(Product): bool` as the single policy resolver.
- `applyMovement()` now calls the resolver instead of inlining the fallback chain. Behaviour is
  identical; the expression is just no longer duplicated.

**`app/Domains/Composition/Services/CompositionExecutionService.php`**
- `preflight()` still validates that a component exists, is active and tracks inventory.
- The quantity check is now conditional:

```php
if ($this->inventory->allowsNegativeStock($component)) {
    continue;
}
```

- Ordering is unchanged: locks → composition version re-check → preflight → movement. The
  allowance is not a bypass of locking or atomicity.

**Deliberately preserved**
- `InsufficientComponentStockException` with its exact message and `context()` payload, so the
  blocking path and any consumer of that message are untouched.
- Archival, `track_inventory`, cycle, depth and unit-conversion validation — none of these are
  policy-dependent and all still reject.
- The client `bypass_stock_check` flag still does **not** influence component validation; only the
  server policy does. `CompositionPosIntegrationTest::test_bypass_stock_check_does_not_bypass_component_validation`
  continues to pass unchanged.

**Presentation contract**
- `ProductCompositionItemResource` now returns `component.allows_negative_stock` (the resolved
  policy) and `display_stock_quantity` (stock converted into the same unit the cashier edits), so
  the POS can compare like with like instead of mixing base units with display units.

---

## 4. POS warning implementation

The existing **Insufficient Stock** dialog is reused; no second warning system was added.

- Formula detail lines now carry `available_stock` and `allows_negative_stock`.
- `SaleBill.handleRecordSale()` previously skipped formula lines entirely
  (`if (product?.hasConsumptionComposition) return false`), which is why a short ingredient
  produced no cashier-visible warning. It now appends ingredient shortfalls:

```ts
const required = line.actual_quantity * units   // units = commercial formula quantity
if (available >= required) return null          // no warning
```

- Only ingredients whose resolved policy **permits** negative stock produce a warning. Where the
  policy forbids it, the cashier is not invited to proceed — the server rejects, as required.
- The dialog copy now reads "Stock will go negative for these items, including formula
  ingredients." and keeps **Proceed with Sale** (this is a warning, not a block).
- The customization dialog also shows each ingredient's current stock, highlighted when it is at
  or below zero.

The warning is advisory only: the server remains the authority, and `bypass_stock_check` is sent on
proceed exactly as it already was for traditional products.

---

## 5. Tests and results

New: `tests/Feature/Composition/FormulaNegativeStockTest.php` — **12 tests, 27 assertions**.

| # | Scenario | Assertion |
|---|---|---|
| 1 | Negative stock enabled, short ingredient | Sale succeeds |
| 2 | …same | Ingredient `1 - 15 = -14` |
| 3 | Negative stock enabled, three ingredients (2 short) | All three deducted correctly |
| 4 | Negative stock disabled | Rejected with required/available, no movement, no run |
| 5 | Business setting enabled via product override absent | Sale succeeds |
| 6 | Business setting disabled via product override absent | Rejected |
| 7 | Sufficient stock | Normal deduction |
| 8 | Formula parent | Stock stays `0`, zero movements on the parent |
| 9 | Quantity scaling | 4 × 10g = 40g consumed |
| 10 | Ledger | Stores `-15`, balance reconciles with signed total |
| 11 | Traditional product | Allowed → negative; blocked → rejected (unchanged) |
| 12 | Snapshot | Records actual `15`, not available `1` |
| 13 | Policy resolver | Explicit on/off wins; `NULL` inherits the business default |

Commands and results:

```text
php artisan test tests/Feature/Composition/FormulaNegativeStockTest.php
→ 12 passed (27 assertions)

php artisan test tests/Feature/Composition
→ 174 passed (918 assertions)   [before P13 test file]

php artisan test
→ 394 passed, 9 failed (1,671 assertions)

npm run build   (tsc && vite)
→ passed

vendor/bin/pint --test <changed PHP files>
→ passed
```

**Pre-existing failures (unrelated, unchanged):** the 9 Auth/Profile Inertia page gaps
(`verify-email`, `confirm-password`, `reset-password` ×2, `profile` ×5). P12 baseline was 382
passed; P13 adds 12.

### A fixture correction worth flagging

Three existing composition tests began failing after the fix. Their fixtures never set
`allow_negative_stock`, so they inherited the **product model default of `true`** — meaning they had
silently been asserting rejection while negative stock was permitted. The sibling suites
(`CompositionManufacturingTest`, `SalesTest`) already set the flag explicitly.

Rather than weaken the new guard, I made those fixtures state their policy explicitly
(`allow_negative_stock: false`), matching the existing convention. No assertion about the *behaviour*
was changed — only the previously implicit precondition. This is the honest reading: under the
shipped policy those tests were testing the wrong thing.

---

## 6. Documentation

`docs/audits/product-composition/P13-FORMULA-NEGATIVE-STOCK.md` (this file), plus a roadmap entry.

---

## 7. Remaining risks

1. **Negative stock is now reachable for ingredients.** With the shipped product default (`true`),
   an ingredient can go negative without the business explicitly opting in. That is pre-existing
   behaviour for ordinary products, not something P13 introduced, but it means "negative stock" is
   the effective default at product level while the business setting says `false`. The precedence
   is deliberate and documented; changing the shipped defaults would be a product decision, not an
   audit fix.
2. **The POS warning is advisory.** Ingredient stock can change between the dialog opening and
   checkout, so the displayed `available_stock` may be stale. The server remains authoritative and
   the warning is only a hint.
3. **No browser automation.** Dialog behaviour was verified by compilation and HTTP tests, not by
   clicking through the POS.
4. **Concurrency** relies on the existing `lockForUpdate` ordering, unchanged by P13 and still
   untested under real parallel MySQL load.
5. **Manufacturing** keeps its own explicit policy fixtures; no behaviour change was intended or
   observed there.

---

## 8. Git safety

- **Original branch:** `feature/product-composition`
- **Original HEAD:** `50be1bd911f8c0ad46a9232aac4396837f457843`
- **Final branch:** `feature/product-composition`
- **Final HEAD:** `50be1bd911f8c0ad46a9232aac4396837f457843`

Confirmed: no commits, no branch switch/merge/rebase/reset/clean/stash/cherry-pick, no pre-existing
modification discarded, and the `fashion` worktree untouched (`variation/clothing-erp` @ `d0ff43e`).
