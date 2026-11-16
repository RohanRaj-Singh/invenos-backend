# 09 — Reports & Analytics Impact

## 1. Report surface inventory

**VERIFIED.** All report routes are in `routes/web.php` under `/reports`, served by
`ReportController`, which delegates to `app/Domains/Reports/Services/*`.

| Route | Page | Service method | Primary sources |
|---|---|---|---|
| `/reports` | `reports/ReportsLanding` | – | – |
| `/reports/sales` | `reports/SalesReport` | `SalesReportService::register` + `topProducts` + `byCustomer` | `sales`, `sale_items`, `returns` |
| `/reports/sales/by-customer` | `reports/CustomerSales` | `byCustomer` | `sales` |
| `/reports/sales/top-products` | `reports/TopProducts` | `topProducts` | `sale_items`, `sales` |
| `/reports/purchases` | `reports/PurchaseReport` | `PurchaseReportService::register` | `purchase_bills`, `returns` |
| `/reports/stock` | `reports/StockReport` | `InventoryReportService::stockReport` | `products`, `inventory_transactions`, `return_items` |
| `/reports/stock/print` | `reports/StockPrint` | `stockReport` (all rows) | same |
| `/reports/stock/ledger` | `reports/StockLedger` | `stockLedger` | `inventory_transactions` |
| `/reports/stock/low-stock` | `reports/LowStockReport` | `lowStock` | `products` |
| `/reports/customers/ledger` | `reports/CustomerLedger` | `ContactReportService::customerLedger` | party ledger |
| `/reports/suppliers/ledger` | `reports/SupplierLedger` | `supplierLedger` | party ledger |
| `/reports/day-book` | `reports/DayBookReport` | `DayBookReportService::generate` | all documents + ledger |
| `/reports/financial-overview` | `reports/FinancialOverview` | `FinancialReportService::overview` | sales, returns, purchases, expenses, `sale_items`, products |
| `/reports/product-ledger` | `reports/ProductLedger` | `ProductReportService::timeline` | `inventory_transactions` |
| `/reports/cash-flow` | `reports/CashFlowReport` | `FinancialReportService::cashFlow` | cash ledger |
| `/reports/pnl` | `reports/PnLReport` | `SalesReportService::profit` | sales, returns, `sale_items`, expenses |
| `/reports/balance-sheet` | `reports/BalanceSheetReport` | `FinancialReportService::balanceSheet` | cash, products, sales, purchases, expenses |
| `/reports/party` | `reports/PartyReport` | `PartyLedgerService::statement` | ledger |
| `/reports/sales/export/csv` | stream | `ExportService::csv` | sales |
| `/reports/purchases/export/csv` | stream | `ExportService::csv` | purchases |
| `/reports/stock/export/csv` | stream | `ExportService::csv` | stock report |
| `/reports/stock/export/excel` | download | `ExportService::excel` | stock report |
| `/reports/stock/ledger/export/csv` | stream | `ExportService::csv` | ledger |
| `/reports/stock/low-stock/export/csv` | stream | `ExportService::csv` | low stock |
| `/reports/day-book/export/csv` | stream | `ExportService::csv` | day book |
| `/reports/share/{report}` | `ReportShareController` | PDF/temp share | varies |

Dashboard (`DashboardController` + `DashboardReportService`) shows today's sales, returns,
purchases, expenses, low stock, receivables and recent sales.

## 2. Current formulas

### 2.1 Revenue

| Report | Formula |
|---|---|
| Sales register | `sales.grand_total` per invoice; returns subtracted separately |
| Financial overview | `Σ sales.grand_total` − completed sale returns |
| P&L | `net revenue = gross sales − completed returns` |
| Day book | same plus payments/expenses |

### 2.2 COGS

| Report | Formula | Difference |
|---|---|---|
| Financial overview | `Σ sale_items.base_quantity × COALESCE(cost_price,0)` for **all** sales in range | does not exclude returned sales; unknown cost = 0 |
| P&L (`SalesReportService::profit`) | same, **excluding** sales with completed returns | different number from overview |
| Day book | same as financial overview | |
| Balance sheet | `Σ sale_items.base_quantity × cost_price` up to date | |

### 2.3 Inventory valuation

| Surface | Formula |
|---|---|
| `InventoryService::getOverview` | `stock × MIN(sale_price)` |
| `InventoryService::getValuation` | `stock × MIN(sale_price)` |
| `InventoryReportService::stockReport` summary | `max(0, stock − uncosted) × productCost()` where `productCost` = average → opening → last purchase → default |
| `InventoryReportService::stockReport` per-row `value` | `stock × productCost()` (does **not** subtract uncosted) |
| `FinancialReportService` / balance sheet | SQL `GREATEST(stock − uncosted,0) × COALESCE(average, opening, last, default)` |
| `ProductReportService::timeline` | `stock × last_purchase_cost` |
| `ProductList.tsx` / `ProductTable.tsx` | `last_purchase_cost ?? default_purchase_cost` |

**RISK:** these are four different valuation bases (sale price, cost with uncosted subtraction,
cost without subtraction, legacy pack cost). A composed product will inherit all of them.

### 2.4 Stock movement

`InventoryReportService::stockMovement`:

```
purchased      = Σ quantity where type=purchase
sold           = |Σ quantity where type=sale|
sale_returns   = return_items (completed SALE)
purchase_returns = return_items (completed PURCHASE)
adjustments    = Σ quantity where type IN ('adjustment','damage','consumption')
                 and reference <> 'INITIAL'
net            = purchased − sold + sale_returns − purchase_returns + adjustments
opening        = closing − net
```

**VERIFIED:** `consumption` is folded into `adjustments` (line ~368). It is not separately
visible.

### 2.5 Top selling

`SalesReportService::topProducts` and `InventoryReportService::topSelling` aggregate
`sale_items` by product. Components are invisible unless they have sale items.

## 3. Impact of composition

### 3.1 Revenue

- A composite sold as one commercial line produces one revenue line. **Correct.**
- If components are expanded into sale items, revenue is multiplied and reports become wrong.
  **Do not do this.**
- A consumption-based service produces revenue for the service product only. Its consumed
  components must not appear as revenue.

### 3.2 COGS

- Current COGS reads `sale_items.cost_price`. If a composite's cost is not rolled up into that
  field, COGS = 0 and gross profit = full revenue (overstated).
- If components are added as sale items with cost but zero price, revenue is unchanged but
  top-product/quantity reports count components as sold. **Not recommended.**
- Recommended: write the rolled component cost into the composite's `sale_items.cost_price` and
  retain the breakdown in `composition_run_items`.

### 3.3 Inventory valuation

- Consumed components reduce their own stock and value. That is correct.
- A finished composite produced into stock must have its `average_cost` written from the run, or
  its stock value will be zero/legacy.
- A consumption-based service product should not hold stock; if it has `track_inventory = false`
  or zero stock, valuation is unaffected.

### 3.4 Stock movement

- Component consumption appears as `consumption`. Today it is lumped into "adjustments". This
  makes the stock report show a large unexplained adjustment line.
- **Required change:** add a distinct `consumed` bucket to `stockMovement`, and decide whether it
  is shown separately or netted into a "component usage" section.
- Production output needs a positive movement type that is not `purchase`; otherwise purchased
  stock is overstated.

### 3.5 Top products / product profitability

- Top products by quantity and revenue should list commercial products, not components.
- A "component usage" report is a **new** report; do not overload top-selling.

### 3.6 Returns

- Revenue reports subtract completed returns.
- Stock reports use `return_items` for sale/purchase returns. Component consumption reversals
  (if any) are not return items and would not be counted.

## 4. Distinguishing the four product roles

| Role | Revenue | COGS | Stock effect | Report treatment |
|---|---|---|---|---|
| **Commercial product sold** | yes | yes | sale movement | sales, top products, P&L |
| **Component consumed** | no | part of parent cost | consumption movement | inventory usage report (new) |
| **Finished product manufactured** | no (until sold) | cost transferred in | positive production movement | inventory/valuation |
| **Finished product sold** | yes | finished cost | sale movement | sales, top products |

Reports must not collapse roles 1 and 3 merely because both are rows in `products`.

## 5. Reports that become misleading if unchanged

| Report | Why it misleads |
|---|---|
| Stock Report movement | consumption hidden inside "adjustments" |
| Stock valuation | produced goods have no cost unless written; components consumed reduce value correctly but the reason is invisible |
| Financial Overview COGS | unknown/rolled cost = 0; returns not excluded |
| P&L | COGS excludes returned sales but overview does not; two different answers |
| Top Products | components omitted or, if expanded, falsely counted as sold |
| Product Ledger | only shows movements for the selected product; no link to the parent formula |
| Day Book | no composition events; consumption is invisible operationally |
| Dashboard | low stock is component-aware automatically, but no "formula product unavailable" signal |

## 6. Required report changes by phase

| Change | Phase | Report |
|---|---|---|
| Add `consumed` bucket to stock movement | P7 | `InventoryReportService::stockMovement` |
| Classify new production movement type | P7 | same |
| Roll cost into sale item cost (or join runs) | P5 | COGS paths |
| Do not create component sale items | P4 | sales/top products |
| Add component usage report | P7 | new |
| Add formula availability/stock warning | P4 | POS/dashboard |
| Keep valuation basis consistent | P7 (or P0) | all valuation paths |
| Exclude returned sales consistently | P0 (independent) | overview vs P&L |

## 7. Export impact

`ExportService` is generic; CSV/Excel/PDF column maps live in `ReportController`. New
composition columns must be added explicitly to those maps. There is no product import/export,
so no format migration is required.

## 8. Findings summary

1. **VERIFIED:** report formulas are inconsistent across surfaces (4 valuation, 3 COGS).
2. **VERIFIED:** consumption is currently invisible, folded into adjustments.
3. **RISK:** composite COGS will be zero unless cost is rolled up.
4. **RISK:** expanding components into sale items corrupts revenue and top-product reports.
5. **PROPOSED:** keep one commercial sale line, add a consumption breakdown, and add a separate
   component usage report.
