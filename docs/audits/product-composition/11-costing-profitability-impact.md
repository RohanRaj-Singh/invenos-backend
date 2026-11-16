# 11 — Product Costing & Profitability

## 1. Existing cost sources

**VERIFIED.**

| Field | Meaning | Precision |
|---|---|---|
| `products.average_cost` | weighted average per base unit | decimal(14,6) |
| `products.opening_cost` | declared cost of opening stock per base unit | decimal(14,6) |
| `products.last_purchase_cost` | **per purchase pack** | decimal(12,2) |
| `products.default_purchase_cost` | **per purchase pack** | decimal(12,2) |
| `products.uncosted_qty` | stock with no reliable cost | decimal(14,4) |
| `purchase_bill_items.unit_cost` | per purchase pack | decimal(12) |
| `purchase_bill_items.unit_cost_base` | true cost per base unit | decimal(14,6) |
| `sale_items.cost_price` | cost snapshot per base unit at sale | decimal(12) |
| `inventory_transactions.unit_cost` | cost per base unit at movement | decimal(14,6) |

## 2. `CostResolver`

`app/Domains/Inventory/Services/CostResolver.php`:

```
average_cost
  ?? opening_cost
  ?? latest purchase line unit_cost_base
  ?? latest purchase line unit_cost / purchase_pack_qty
  ?? last_purchase_cost / default pack qty
  ?? default_purchase_cost / default pack qty
  ?? null
```

`costBasis()`: `exact` (average/opening), `estimated` (purchase line or legacy pack),
`unavailable` (null). This is the correct service for formula component cost.

## 3. Purchase cost update

`PurchaseService::create` per line:

```
costPerBase = unit_cost / purchase_pack_qty
if oldAvg === null:
    if qtyOnHand > 0: uncosted_qty += qtyOnHand
    average_cost = costPerBase
else:
    costedQty = max(0, qtyOnHand - uncosted_qty)
    average_cost = (costedQty*oldAvg + inQty*costPerBase) / (costedQty + inQty)
```

It also stores `last_purchase_cost` and `default_purchase_cost` per **pack**, which is why every
consumer must divide by the pack factor. `CostResolver` does; some reports do not.

## 4. Sale cost snapshot

`SaleService::create`:

1. consumes `uncosted_qty` first (`max(0, uncosted − baseQty)`);
2. `cost_price = CostResolver::unitCost($product)`;
3. writes `sale_items.cost_price`;
4. passes `unit_cost` to `recordSale`.

**RISK:** if `uncosted_qty > 0`, the sale still writes the full average as `cost_price` for the
whole quantity, so COGS prices uncosted units at the average. The quarantine is in quantity and
valuation, not in the sale cost snapshot. This is a pre-existing inconsistency.

## 5. Report cost formulas

### COGS

| Report | Formula |
|---|---|
| Financial overview | `Σ base_quantity × COALESCE(cost_price,0)` all sales in range |
| P&L | same, excluding sales with completed returns |
| Day book | same as overview |
| Balance sheet | same up to date |

Unknown cost is treated as **zero**, which overstates profit.

### Inventory value

See document 09 §2.3 for the four variants. In summary:

- `InventoryService` uses **sale price**;
- `InventoryReportService::stockReport` uses average/opening/legacy cost and subtracts
  `uncosted` in summary but not per row;
- `FinancialReportService` uses SQL with `GREATEST(stock−uncosted,0)`;
- `ProductReportService` uses `last_purchase_cost` only.

## 6. Formula costing model

**PROPOSED.**

### 6.1 Component cost

For each component line:

```
component_cost_per_base = CostResolver::unitCost(component)
line_cost               = actual_quantity_in_base_unit × component_cost_per_base
```

If `unitCost` is null, mark the line `estimated`/`unavailable`; never silently use zero for
valuation of a produced good.

### 6.2 Run cost

```
run_cost  = Σ line_cost + overhead (if configured)
unit_cost = run_cost / output_quantity
```

Store the result in:

- `composition_runs.total_cost`, `unit_cost`;
- `composition_run_items.unit_cost`, `total_cost`;
- the finished-good `inventory_transactions.unit_cost` for the output row;
- `products.average_cost` for the finished good when producing into stock (same weighted-average
  rule as purchases, over costed quantity);
- `sale_items.cost_price` when selling a consumption-based service (rolled cost per commercial
  unit), so existing COGS reports stay correct.

### 6.3 Overrides and wastage

- Actual consumption overrides change `actual_quantity`, therefore `line_cost` and `run_cost`.
  The template is untouched.
- Wastage can be stored as a percentage or as a separate actual-vs-planned delta. Decide whether
  wastage is costed (recommended: yes, if material was consumed).
- Rounding: store 6 decimals; round only for display.

### 6.4 Historical integrity

- `composition_runs.template_snapshot` preserves the exact recipe.
- `composition_run_items` preserves actual quantities and unit costs at execution.
- A later component price change must not rewrite a past run.
- Sale COGS remains the snapshot in `sale_items.cost_price`.

### 6.5 Manufactured vs consumption-based

| Model | Cost behavior |
|---|---|
| **Assembly** (produce into stock) | Component cost moves into finished `average_cost`; no expense at production; COGS when the finished good is sold |
| **Consumption at sale** | Component cost is part of the sale's COGS immediately; the service product has no inventory value |
| **Assembly at sale** (not recommended) | Component cost is COGS at sale; no finished stock; revenue allocation still needed |

Do not expense components at production **and** again at sale. That is double counting.

## 7. Reverse costing

On reversal:

- ingredient quantities are restored;
- finished-good quantity is removed;
- the finished `average_cost` should either be recomputed from remaining stock or left unchanged
  with a documented note;
- the run records a reversal value, not a deleted history.

**Recommendation:** leave `average_cost` unchanged on reversal unless the remaining stock is
zero, and record the reversal value in the run. Recomputing from partial remaining stock can
produce a misleading average.

## 8. Existing duplication to avoid

| Cost logic | Location |
|---|---|
| `CostResolver` | canonical |
| Purchase weighted average | `PurchaseService` |
| Sale snapshot | `SaleService` |
| Inventory overview/valuation | `InventoryService` (sale price) |
| Stock report cost | `InventoryReportService::productCost` (legacy per-pack, no division) |
| Financial inventory value | `FinancialReportService` SQL |
| Product timeline value | `ProductReportService` |
| Product list value | React `last_purchase_cost ?? default_purchase_cost` |

**VERIFIED:** `InventoryReportService::productCost()` uses legacy per-pack columns without
dividing by the pack factor, so it diverges from `CostResolver`.

## 9. Required costing changes

| Change | Phase | Notes |
|---|---|---|
| Use `CostResolver` for every formula line | P3 | Never read legacy pack cost directly |
| Write run cost + item cost | P3 | Snapshot |
| Write finished `average_cost` on production | P7 | Avoid zero-cost stock |
| Roll cost into `sale_items.cost_price` for services | P5 | Keeps COGS correct |
| Decide wastage/overhead | P1 | Business |
| Keep past runs immutable | P3 | Snapshot |
| Unify valuation (optional but recommended) | P7 | Four variants today |
| Mark uncosted components | P3 | Disclose separately |

## 10. Findings summary

1. **VERIFIED:** `CostResolver` is a correct, centralized cost source.
2. **VERIFIED:** valuation and COGS are inconsistent across reports.
3. **RISK:** a composite with no rolled cost shows 100% margin.
4. **RISK:** consuming uncosted stock still snapshots the average cost.
5. **PROPOSED:** cost snapshot per run item; rolled cost into sale/finished cost; no expense at
   production.
