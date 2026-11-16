# Audit — "The selling unit for '24 number nuskha' is invalid."

**Date:** 2026-11-16
**Branch:** `feature/product-composition` · **HEAD:** `a8c3a6a` · **Tree:** clean
**Type:** read-only audit of a reported production failure. **No code or data was changed.**

---

## 1. Where the message comes from

Exactly one place emits it — `app/Domains/Sales/Services/SaleService.php:236`:

```php
if ($itemData->sellingUnitId) {
    $sellingUnit = SellingUnit::lockForUpdate()->find($itemData->sellingUnitId);

    if ($sellingUnit && $sellingUnit->product_id === $product->id) {
        $authoritativeBaseUnitQty = (float) $sellingUnit->quantity;
    } elseif ($consumptionComposition !== null) {          // the product is a formula
        throw ValidationException::withMessages([
            'items' => "The selling unit for '{$product->name}' is invalid.",
        ]);
    }
}
```

The request path is `CreateSaleRequest → CreateSaleData::fromRequest → SaleService::create`.
`selling_unit_id` is sent by the POS as `Number(i.sellingUnitId)`
(`resources/js/Pages/pos/SaleBill.tsx:823`), taken from the product payload's `selling_units[].id`.

**The message fires in two cases only, both for formulas:**

1. the id no longer exists, or
2. the id exists but belongs to a *different* product.

A correct selling unit never produces it, and a **null** selling unit never produces it.

---

## 2. Reproduction (verified, then removed)

Probe against the real service with a formula + consumption composition:

| Line sent | Result |
|---|---|
| the product's own selling unit | **OK** — sale created |
| another product's selling unit | **422** `The selling unit for '…' is invalid.` |
| an id that does not exist (deleted) | **422** same message |
| `selling_unit_id: null` | **OK** — sale created |

So the guard behaves as designed; the failure is entirely about *which id the cart carried*.

---

## 3. What the restored data actually contains

Read-only queries against `invenos_clinic` (1,206 products, 1,206 selling units, 4 compositions,
468 sales):

```
1205 '24 number nuskha'  created 16:14:19  archived 17:06:50   SU 1207 (product_id 1205, price 0)
1206 '24 number nuskha'  created 17:07:13  updated  17:11:19   SU 1208 (product_id 1206, price 1)
```

- **Two duplicate products** with the same name, distinct compositions (comp 3 vs comp 4). The older
  one was archived 23 seconds before the newer one was created.
- The **active** product (1206) has a **valid** selling unit: `1208`, `product_id = 1206`,
  `int === int` (verified), `is_default = 1`.
- **No sale_items exist for either product** — the sale never went through.
- No orphan selling units, no sale line referencing a missing or foreign selling unit, and no
  selling unit pointing at a deleted packaging row. At rest, the references are consistent.
- Meta-integrity worth knowing: 862 of 1,206 products have a **single selling unit not marked
  `is_default`**; 344 units use non-canonical unit ids (`Gram` ×276, `Box` ×2, alongside
  `piece`/`g`/`kg`/`bottle`/`packet`/`strip`); 154 units have `sale_price <= 0`; 480 of 3,375
  `sale_items` carry a null `selling_unit_id`; `product_packaging` is empty, so the packaged /
  multi-unit path has never run on this dataset.

---

## 4. Root cause

The database is internally consistent — **the id in the browser did not match it**. The POS loads
the whole product list once into page state and builds cart lines from `selling_units[].id`. A tab
opened **before** the restore (or before the 1205 → 1206 replacement) keeps those ids; selling from
it sends an id that either no longer exists or now belongs to the other product. Both are exactly the
two conditions above.

This is consistent with the sequence: restore → product replaced/archived → old POS tab still holding
the previous ids → sale rejected with a message that names the product but not the cause.

**Immediate recovery (proven by row 4 of §2):** hard-refresh the POS, or remove the line and add the
product again. The active record sells normally.

---

## 5. Foundational / integrity gaps found

None of these caused *this* message, but each one made it possible to happen and hard to diagnose.

| # | Severity | Gap | Recommendation |
|---|---|---|---|
| G1 | **P1** | **The rejection is unactionable.** It blocks the whole sale and says "invalid", which reads like corrupt product data; nothing tells the user to refresh or re-add. | Reword: *"This line's unit is out of date — remove the line and add the product again."* Zero behaviour change. |
| G2 | **P1** | **Same input, two different rules.** An unresolvable `selling_unit_id` is fatal for formulas but silently ignored for physical products, where the server then falls back to the **client-supplied** `base_unit_quantity`. That is an untrusted conversion on one path and a hard failure on the other. | Resolve the unit server-side by `(id, product_id)` and apply one rule to both kinds. Today the physical path trusts the client. |
| G3 | P2 | **`selling_unit_id` is not validated at the boundary.** `CreateSaleRequest` does not check it exists or belongs to the product, so bad ids reach business logic instead of returning a field-level 422. | Add `exists:selling_units,id` (better: a rule scoped by product) and keep the service check as defence in depth. |
| G4 | P2 | **Strict comparison on an uncast attribute.** `$sellingUnit->product_id === $product->id` with no `int` cast in `SellingUnit::$casts`. It works on this DB (both `int`), but any driver/prepare change would turn *every* formula sale into this error — a data-validity message for a type mismatch. | Cast or compare `(int)`. |
| G5 | P2 | **Restored data quality** (§3): non-canonical unit ids (`Gram`, `Box`), single units with `is_default = 0`, zero-priced selling units, 6× `glecerin` and several other duplicate active names, plus the 1205/1206 pair. | Needs a reviewed data-cleanup pass (unit-id canonicalisation, default flags, duplicate merges). Not safe to automate without business input. |
| G6 | P3 | For consumption formulas the selling unit is assigned `1.0` and then **overwritten** by `selling_unit->quantity`, so its only real contribution is the pack multiplier. The surrounding comment ("no selling unit means base units") no longer describes the code. | Document the intended rule; decide whether a formula line's selling unit should scale consumption at all. |
| G7 | P3 | `SellingUnit::lockForUpdate()->find()` runs once per cart line inside the sale transaction; and `product_packaging` never being used means the multi-unit path is unexercised. | Batch-load units; exercise the packaged path in a test. |

---

## 6. What was not done

- No code, test, or production data was modified. The temporary reproduction test was deleted.
- I could not capture the failing request payload (no request log for that attempt), so the specific
  stale id is inferred from the guard's two trigger conditions plus the timeline, not observed.

## 7. Verdict

**Not a data-corruption or costing bug.** The sales guard is doing what it was written to do; the
failure came from a browser session holding ids from before the restore, and it self-heals on
refresh. The real weakness is that the app reports this as "invalid product data" with no recovery
hint, and that `selling_unit_id` is not validated or resolved consistently across product kinds.

G1 (message) and G4 (comparison) are one-line, zero-risk fixes. G2/G3 are the ones that matter if
stale clients are a recurring reality after restores.

---

## 8. Fixes applied (2026-11-16, after the audit)

| Gap | Status | Change |
|---|---|---|
| **G1** | **Fixed** | The message is now `"The price unit for '<product>' is out of date. Remove this line and add the product again."` — it names the recovery, not a data corruption. |
| **G2** | **Fixed** | One rule for both kinds: a supplied unit is resolved with `whereKey(id)->where('product_id', $product->id)`. Missing **or** foreign → rejected. Physical products no longer silently fall back to the client-supplied `base_unit_quantity`. |
| **G3** | **Fixed** | `items.*.selling_unit_id` is `nullable|integer|min:1` at the boundary; existence and ownership moved entirely into `SaleService`, so a stale id always gets the actionable message instead of a generic `items.0.selling_unit_id is invalid`. |
| **G4** | **Fixed** | The strict `product_id ===` comparison is gone (the query is scoped instead). The same fragile comparison in `CompositionController::ensureBelongs()` now casts to `int`. |
| **G6** | **Fixed (comments)** | The block comment now states the actual rule: the stored conversion factor wins; a formula line without a unit is expressed in base units and never takes conversion from the client. |
| **G5** | **Not applied** | Data cleanup on the restored database: canonicalising `Gram`→`g`, setting `is_default` on single-unit products, merging duplicate names. These change costing/stock history and need a business decision (e.g. merging 6× `glecerin` is not a mechanical fix). |
| **G7** | **Not applied** | Batching the per-line `lockForUpdate` would mean loading units for the whole cart up front. The gain is one query on a ≤20-line cart; the risk is changing lock ordering inside the transaction. Not worth it. |

**Behaviour change to be aware of:** a physical-product line whose `selling_unit_id` no longer exists
or belongs to another product used to sell using the client's base quantity. It is now rejected with
the same message. Covered by `test_physical_product_rejects_another_products_selling_unit`.

**Tests:** `tests/Feature/Sales/SaleSellingUnitIntegrityTest.php` — 7 cases (formula: own unit, foreign
unit, deleted unit, no unit; physical: foreign unit rejected, stored conversion factor applied, no
unit still sells).

```text
php artisan test tests/Feature/Sales/SaleSellingUnitIntegrityTest.php
→ 7 passed (12 assertions)

php artisan test
→ 483 passed, 5 failed (2,012 assertions)   # the 5 are the pre-existing ProfileTest 404s
```

**Files changed:** `app/Domains/Sales/Services/SaleService.php`,
`app/Http/Requests/Sales/CreateSaleRequest.php`,
`app/Http/Controllers/CompositionController.php`,
`tests/Feature/Sales/SaleSellingUnitIntegrityTest.php`.

**Recovery for the reported case is unchanged:** refresh the POS or re-add the line. The next attempt
now explains that instead of implying the product is broken.
