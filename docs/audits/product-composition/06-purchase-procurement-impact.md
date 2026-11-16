# 06 — Backend Purchase & Procurement Impact

## 1. Purchase routes

**VERIFIED.** `routes/web.php`:

| Route | Method | Purpose |
|---|---|---|
| `GET /purchases` | `PurchaseController@index` | list |
| `GET /purchases/new` | `PurchaseController@create` | form |
| `POST /purchases` | `PurchaseController@store` | create |
| `GET /purchases/{id}` | `PurchaseController@show` | detail |
| `GET /purchases/{id}/print` | `PurchaseController@printBill` | print |
| `DELETE /purchases/{id}` | `PurchaseController@destroy` | soft delete + reversal |
| `GET /purchases/returns` | `PurchaseReturnController@index` | list |
| `GET /purchases/returns/{id}` | `PurchaseReturnController@show` | detail |

**ABSENT:** purchase edit/update, partial receiving workflow, purchase-order → bill
conversion, purchase import/export.

## 2. Purchase creation

**VERIFIED.** `PurchaseService::create(CreatePurchaseData)` inside `DB::transaction`:

1. requires a supplier contact with the `supplier` role;
2. for each line, locks the product, rejects archived products, computes
   `baseQuantity = purchase_pack_qty × purchase_quantity`, validates positive quantity and
   non-negative cost;
3. computes subtotal, discount, total, outstanding;
4. creates `purchase_bills`;
5. per line:
   - resolves the pack display name through `ProductUnitService`;
   - computes `costPerBase = unit_cost / purchase_pack_qty`;
   - creates `purchase_bill_items` with `unit_cost_base`;
   - updates `last_purchase_cost`, `default_purchase_cost`;
   - updates `average_cost` / `uncosted_qty` using the weighted-average rule;
   - calls `InventoryService::recordPurchase`;
6. updates supplier balance; records initial payout and invoice memo in the cash ledger.

### Weighted-average rule (verified)

```
costPerBase = unit_cost / purchase_pack_qty
if oldAvg === null:
    if qtyOnHand > 0: uncosted_qty += qtyOnHand
    average_cost = costPerBase
else:
    costedQty = max(0, qtyOnHand - uncosted_qty)
    average_cost = (costedQty*oldAvg + inQty*costPerBase) / (costedQty + inQty)
```

This is the cost that `CostResolver` will use to price component consumption.

## 3. Purchase validation gaps

| Gap | Evidence | Consequence for composition |
|---|---|---|
| No server-side pack/unit validation | `PurchaseService` uses `purchase_pack_qty` as supplied | A component's base-unit cost can be wrong, which propagates into formula cost |
| `purchase_quantity`/`purchase_pack_qty` client-supplied | `CreatePurchaseRequest` | Same |
| No `unit_cost_base` validation beyond numeric | request | Cost roll-up can inherit a bad cost |
| `status` is `received|pending` only | migration | No partial receiving; a purchase is either on stock or not |

These are pre-existing issues. They matter because formula cost and margin are only as correct
as the component's `average_cost`.

## 4. Purchasing components

**VERIFIED:** components are ordinary products. Buying them requires **no change**:

- the purchase form lists all non-archived products;
- purchasing a component updates its stock and `average_cost`;
- the next formula execution reads the updated `CostResolver` value.

**PROPOSED:** no automatic procurement, no MRP, no suggested purchase orders. The existing
system has no demand planning and the brief explicitly discourages introducing it without a
business requirement.

## 5. Purchasing a composite product

**RISK.** The purchase picker currently lists every non-archived product, including a future
composite. Buying a composite would increment its `stock_quantity` **without consuming its
components**, creating finished stock out of nothing.

Options:

| Option | Behavior | Assessment |
|---|---|---|
| Allow and treat as purchased finished goods | Stock in, no component consumption | Legitimate if the business buys the finished item instead of making it |
| Hide composites from purchasing | No way to buy a finished good | Safer default if the business never buys them |
| Allow but label "purchased finished good" | Clear intent | Recommended if both are possible |

**Decision required.** The system cannot infer intent. At minimum, the purchase UI should
indicate whether a product has a formula, and the backend should not silently accept it without
a documented rule.

## 6. Purchase returns

Two implementations exist:

1. **Canonical `ReturnService`** (`type=PURCHASE`) via `/returns/purchase`:
   - `createReturn` (pending) → `completeReturn` (applies effects once) → optional
     `reverseReturn`;
   - stock effect: `recordReturn(returnType: 'purchase')` = negative quantity, only when
     `restock` is true;
   - cost: current weighted average via `CostResolver`;
   - updates `purchase_bills.return_total` / `return_status`.
2. **Legacy `PurchaseReturnService`**:
   - creates a negative `purchase_bills` "PRET-…" document;
   - writes `inventory_transactions` directly and `decrement`s stock;
   - **no route consumes it** (verified: no controller references it).

**Composition consequence:** returning a component is normal. Returning a **composite** purchase
(if allowed) must not restore components; it should only reverse the finished-good stock that
the purchase added.

## 7. Supplier balances and cash

Purchases raise payables; payments settle them. Component consumption is an internal inventory
movement with **no supplier and no cash effect**. Do not create financial transactions for
formula execution.

## 8. Purchase reports

`PurchaseReportService` (delegated through `ReportService`, plus `/reports/purchases` and CSV
export) aggregates purchase bills and items. It has no concept of formula or component. No report
change is required merely because a product has a formula, except:

- if composites are purchasable, purchase reports should distinguish "finished good purchase"
  from "component purchase";
- component purchase cost is the input to formula costing, so a cost report that ignores
  `unit_cost_base` will mislead.

## 9. Required purchase changes

| Change | Phase | Notes |
|---|---|---|
| Decide whether composites are purchasable | P1 decision | Document the rule |
| Optionally filter/label composites in the purchase picker | P2/P7 | UI only |
| Validate pack quantity server-side | P0 (independent) | Protects formula cost |
| Extend `ProductPolicy` / picker for archived components | P1 | Already rejects archived on create |
| No procurement automation | – | Explicit non-goal |

## 10. Findings summary

1. **VERIFIED:** purchase creation is transactional and updates weighted average cost.
2. **VERIFIED:** no purchase edit, partial receiving or import/export exists.
3. **VERIFIED:** two purchase-return implementations exist; only the canonical one is routed.
4. **RISK:** purchase pack quantities are client-trusted, so component cost can be wrong.
5. **RISK:** purchasing a composite without a rule would create stock without consumption.
6. **PROPOSED:** no procurement automation; treat components as ordinary purchased products.
