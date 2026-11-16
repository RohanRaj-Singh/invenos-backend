# P5 - Composition Costing and Sale Profitability

**Date:** 2026-11-15
**Branch:** `feature/product-composition`
**Status:** Implemented. Composition run snapshots now drive sale COGS and profitability. No component inventory movements are created, no revenue changes, and no return reversal is implemented.

---

## 1. Scope

P5 connects P3 execution cost snapshots to P4 commercial sales:

- sale-item unit cost for completed consumption sales is rolled from actual run items;
- canonical COGS reads immutable component run items;
- simple and assembly products keep the existing `base_quantity * cost_price` rule;
- unknown component costs remain incomplete, never fabricated as complete zero cost;
- sales profit, bill-wise profit, financial overview, day book, and financial position use the same canonical calculation;
- cost completeness is exposed to the existing report payloads and UI.

P5 does **not**:

- create component inventory movements or repeat consumption;
- change revenue, sale prices, discounts, or payments;
- implement composition returns/reversals (P6);
- implement manufacturing/finished-goods costs (P7);
- add a separate composition reporting module.

---

## 2. Sale-item cost semantics

`sale_items.cost_price` is the existing **unit cost per base unit**:

```text
line COGS = sale_items.base_quantity * sale_items.cost_price
```

P5 preserves that semantics:

- simple/assembly lines continue to snapshot `CostResolver::unitCost(product)`;
- completed consumption lines store:

```text
composition unit cost = sum(composition_run_items.total_cost) / sale_item.base_quantity
```

- a partially or fully uncosted consumption line stores `cost_price = null`;
- migration `2026_11_15_000010` widens `sale_items.cost_price` to `decimal(14,6)` so the rolled cost is not rounded to two decimals.

The sale-item cost is a compatibility snapshot. Report COGS does **not** trust it for consumption lines; the canonical calculator reads the immutable run items so completeness and partial known costs survive.

Composition changes, component cost changes, product renames, archival, and deactivation do not rewrite existing sale-item costs or runs.

---

## 3. Canonical COGS source

`App\Domains\Reports\Services\CogsCalculator`

For a sale item:

- if completed composition runs exist, COGS is the sum of the final `composition_run_items.total_cost` snapshots;
- otherwise, COGS is `base_quantity * cost_price` (existing simple/assembly rule).

Why run items rather than `composition_runs.total_cost`:

- P3 sets a run total to `null` when any component cost is unavailable;
- run items preserve the known component subtotal and the exact uncosted line count;
- nested compositions are already flattened into final component run items, so summing them counts each consumed component once;
- multiple runs linked to one sale item are summed, not double-counted.

The calculator never reads current product costs or current composition definitions for historical sales.

---

## 4. Cost completeness model

`CogsCalculator::summary()` returns:

```php
[
    'cogs' => known subtotal,
    'simple_cogs' => known simple/assembly subtotal,
    'composition_cogs' => known composition subtotal,
    'cost_complete' => bool,
    'uncosted_composition_items' => int,
    'uncosted_composition_lines' => int,
    'composition_cost_basis' => 'none|exact|estimated|partial|unavailable',
    'composition_item_count' => int,
]
```

Basis rules:

- `none`: no consumption composition sale items;
- `exact`: all component lines have exact known cost;
- `estimated`: all component lines are known but at least one is estimated;
- `partial`: some component costs are known and some are unavailable;
- `unavailable`: all component costs are unavailable.

`cost_complete` is false for `partial` and `unavailable`. The numeric `cogs` remains the **known-cost subtotal** so known costs are not discarded. The report payloads and UI explicitly mark incomplete cost so profit is not silently presented as complete.

Unknown costs are never written as zero:

- `composition_run_items.unit_cost` / `total_cost` stay `null`;
- `sale_items.cost_price` stays `null`;
- report `cost_complete` is false.

---

## 5. Line-cost API

`CogsCalculator::lineCostsForSaleItemIds()` returns per sale item:

```php
[
    'is_composition' => bool,
    'base_quantity' => float,
    'unit_cost' => float|null,
    'total_cost' => known total,
    'cost_complete' => bool,
    'cost_basis' => string|null,
    'uncosted_lines' => int,
    'component_lines' => int,
]
```

This is used by bill-wise profit and by returned-cost allocation. It avoids a second competing line-level formula.

`CogsCalculator::returned()` now allocates the applicable line unit cost against completed returned base quantities. Simple returns therefore keep their previous proportional COGS. Composition returns are still blocked by P4 until P6.

---

## 6. Profit and report integration

All existing profitability paths now use the atomic canonical calculator:

### Sales Profit / P&L

`SalesReportService::profit()` returns, in addition to existing fields:

- `cost_complete`
- `uncosted_composition_items`
- `uncosted_composition_lines`
- `composition_cost_basis`
- bill-wise `cost_complete` and `uncosted_composition_lines`

Revenue and discounts are unchanged.

### Financial Overview

`FinancialReportService::overview()` uses the same summary and exposes the same completeness fields. Gross/net profit keeps the known-cost subtotal while visibly flagged as incomplete.

### Day Book

`DayBookReportService` now injects `CogsCalculator`, uses the canonical summary, and adds a business-health warning when composition cost is incomplete. Its summary includes the same completeness fields.

### Financial Position

`FinancialReportService::balanceSheet()` uses the canonical COGS up to the report date instead of raw `sale_items.cost_price`. Retained earnings therefore include composition cost. Completeness fields are returned under `totals`.

### Dashboard

The dashboard receives the same `SalesReportService::profit()` payload, so its profit source is composition-aware without a separate dashboard formula.

---

## 7. UI completeness indicators

- `PnLReport`: warning banner when cost is incomplete; bill-wise rows show “Incomplete cost”.
- `FinancialOverview`: warning banner when cost is incomplete.
- `DayBookReport`: backend health warning for incomplete composition cost.
- `BalanceSheetReport`: warning that retained earnings/equity use known component costs only.

Simple-product displays are unchanged.

---

## 8. Historical integrity

- Component cost changes do not alter past run items.
- Composition edits/version changes do not alter past run items.
- Product renaming/archival does not affect COGS; the calculator uses sale-item IDs and run snapshots.
- Unit conversion changes do not affect historical actual quantities.
- Sale retries do not create a second run or a second COGS snapshot.
- Multiple historical runs for one sale item are summed from immutable run items.

---

## 9. Schema changes

Migration `2026_11_15_000010_widen_sale_items_cost_price_precision`:

- `sale_items.cost_price` from `decimal(12,2)` to `decimal(14,6)`, nullable.

Existing values are preserved by scale-up. The rollback would truncate fractional cost values and is documented as data-lossy.

No new cost table or parallel ledger was introduced.

---

## 10. Tests

New `tests/Feature/Composition/CompositionCostingTest.php` covers:

- rolled sale-item unit cost from component run snapshots;
- canonical COGS and bill-wise COGS;
- simple product COGS unchanged;
- multiple composition lines and parent-cost non-double-counting;
- nested composition cost without double counting;
- partial and unavailable costs with completeness flags;
- estimated cost basis;
- historical stability after component cost, template and archive changes;
- sale retry without duplicate COGS/runs;
- multiple runs per sale item aggregation;
- no inventory movements created by reporting;
- six-decimal rolled unit cost.

Verified P5 result: **12 passed (77 assertions)**.

Full suite: **308 passed, 9 failed (1,210 assertions)**. The 9 failures are the same
pre-existing missing Auth/Profile Inertia pages; the baseline remains 296 passed / 9 failed.
`npm run build` (including `tsc`) passed. Generated `public/build` artifacts were restored
to their tracked state; rebuild before deployment.

---

## 11. Known limitations

- Numeric COGS/profit for an incomplete composition uses known costs only and is accompanied by a completeness flag/warning; it is not a complete costed profit figure.
- Simple products with `cost_price = null` retain the pre-existing zero-cost behavior; P5 does not change simple-product semantics.
- Composition sale returns/deletion remain blocked until P6.
- P5 does not change client-trusted commercial price/total behavior.
- No manufacturing/finished-goods cost transfer.
- No separate component usage or product profitability report.

## 12. P6 / P7 prerequisites

- **P6:** implement deliberate return/deletion reversal and decide how consumed component cost is reversed or retained; keep the run snapshot and sale-item linkage.
- **P7:** production/assembly costing, finished-goods valuation, and manufacturing reversal.
