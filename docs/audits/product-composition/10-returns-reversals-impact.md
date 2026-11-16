# 10 — Returns, Refunds & Reversals

## 1. Canonical return lifecycle

**VERIFIED.** `App\Domains\Returns\Services\ReturnService` is the routed implementation
(`ReturnWorkflowController`).

```
createReturn (pending)
   → completeReturn (completed, effects applied once)
        → reverseReturn (reversed, compensating records)
   → cancelReturn (cancelled, no effects)
```

Guards:

- cannot complete twice (`effects_applied_at` check);
- cannot complete a non-pending return;
- cannot reverse a non-completed return;
- over-return is rejected using `ReturnModel::returnedQuantityForItem()`.

## 2. Effects applied on completion

**VERIFIED.**

1. **Stock**
   - Sale return + `restock=true`: `recordReturn(returnType: 'sale')` → `sale-return` positive.
   - Sale return + `restock=false`: `damage` +qty then `damage` −qty (net zero, visible as
     returned-then-written-off).
   - Purchase return + `restock=true`: `recordReturn(returnType: 'purchase')` →
     `purchase-return` negative.
   - Purchase return + `restock=false`: no stock effect.
   - Cost: sale return uses the original `sale_items.cost_price`; purchase return uses current
     `CostResolver`.
2. **Party balance:** credit note reduces the contact balance by `grand_total`.
3. **Cash:** only the refund amount moves, through `CashLedgerService` with
   `event_key = refund:{id}:{return_number}`.
4. **Original document:** `return_total` / `return_status` updated.

## 3. Reversal

`reverseReturn`:

- finds ledger rows by `reference = return_number` and types
  `sale-return|purchase-return|damage`;
- writes negated adjustments with `REV-{return_number}` (which **bypasses the negative-stock
  guard by design**);
- reverses refunds via `CashLedgerService::reverse`;
- undoes the credit note;
- restores the original document's return tracking;
- marks `reversed`.

## 4. Legacy return services

**VERIFIED (dead via HTTP, still callable):**

| Service | Behavior | Routed? |
|---|---|---|
| `SaleReturnService::create` | creates a `RET-…` sale, creates sale items, writes `inventory_transactions` directly and `increment`s stock | `SaleReturnController@store` has no route |
| `PurchaseReturnService::create` | creates a `PRET-…` bill, writes a negative ledger row and `decrement`s stock | no controller at all |

They bypass `InventoryService`, the negative guard, and the run/return lifecycle. **Do not use
them for composition.**

## 5. Sale deletion as a reversal

`SalePolicy::executeDelete`:

- adds back each `sale_items.base_quantity` via `recordAdjustment` with `REV-…`;
- decrements customer balance;
- reverses cash rows;
- deletes the invoice memo.

`canDelete` blocks only when a `sale-return` ledger row references the invoice.

**RISK:** if a sale consumed components, deleting the sale restores the commercial product but
does nothing about the components. If the composite is not stocked, the sale item's
`base_quantity` may be unrelated to the component usage.

## 6. Formula / composite return semantics

### 6.1 Assembled composite (produced into stock)

- The finished good is a normal stocked product, so a normal sale return can restock it when
  `restock=true`.
- The components consumed during **production** are not returned by a sale return. They were not
  consumed by the sale.
- Reversing the **production run** is a separate operation and must be explicit.

**Recommended:** sale return restocks the finished good only. Production reversal is a separate
manufacturing action.

### 6.2 Consumption-based service

- The service product is not stocked (or has no meaningful stock).
- The ingredients have already been consumed and generally cannot be restored.
- A refund should reverse revenue/cash, not inventory.
- **Recommended:** no automatic component restoration. Optionally allow an explicit
  "recovered quantity" input if some components are physically recoverable, but that should
  create a new adjustment with a reason, not silently restore the formula.

### 6.3 Composite sold without production (assembly at sale)

This model should be avoided, but if used:

- components were consumed at sale, so a return must decide whether to restore them;
- restoring all components can create stock that no longer exists physically;
- restoring none overstates cost.

**Decision required.** The safest default is: do not restore components automatically; require
an explicit restock decision per component (or treat the whole return as a service refund).

## 7. Return quantities and snapshots

- `return_items` references the original `sale_items`/`purchase_bill_items` by id and stores
  `quantity`, `base_quantity`, `unit_price`, `total`, `restock`.
- There is no reference to a composition run. If a component-level return is ever needed, the
  schema must add `composition_run_item_id`.
- Over-return is computed from the original item quantity, not from the composition run.

## 8. Failure and partial-processing behavior

- All effects are inside `DB::transaction`; a failure rolls back the whole completion.
- Reversal is also transactional and writes compensating rows rather than deleting history.
- A sale delete is transactional.
- Legacy services are transactional but bypass the guard.

**Composition consequence:** component consumption must share the same transaction as the sale
so a failed sale leaves no consumption. Return completion must likewise wrap any restock
decision.

## 9. Business decisions required

1. Does a returned consumption-based service restore any component? (Recommendation: no by
   default.)
2. Does a returned assembled composite restock the finished good? (Recommendation: yes if
   `restock=true`.)
3. Can a production run be reversed independently of a sale? (Recommendation: yes, explicit
   action.)
4. If a component is restocked on return, at what cost? (Recommendation: original run cost
   snapshot, not current average.)
5. Should deleting a sale with a consumption run be blocked, or should it reverse the
   consumption? (Recommendation: block until the run is explicitly reversed, or reverse with a
   clear audit event.)
6. Are partial returns of a service allowed? (Revenue refund can be partial; component
   restoration should not be proportional automatically.)

## 10. Required changes

| Change | Phase | Notes |
|---|---|---|
| Decide component restoration policy | P1 decision | Document it |
| Add `composition_run_id` linkage to return flow if needed | P6 | Optional |
| Block or handle sale deletion with runs | P6 | `SalePolicy` |
| Never use legacy return services for new paths | P0 | Fence or remove |
| Record return cost from run snapshot | P6 | Preserve historical cost |
| Add regression tests for service refunds | P6 | No stock change expected |

## 11. Findings summary

1. **VERIFIED:** canonical returns are idempotent, transactional and reversal-based.
2. **VERIFIED:** legacy return services bypass the inventory gateway.
3. **RISK:** sale deletion has no concept of component consumption.
4. **UNKNOWN:** whether consumed components can be recovered.
5. **PROPOSED:** refund money without restoring ingredients; restock only the commercial
   finished good when explicitly requested.
