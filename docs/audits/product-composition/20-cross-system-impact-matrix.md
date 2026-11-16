# 20 — Cross-System Impact Matrix

Risk: **Critical** = can corrupt stock/money/history; **High** = wrong totals or access;
**Medium** = localized change; **Low** = cosmetic or unaffected.
Phase: implementation phase from document 18.

| # | Subsystem | Existing files | Database | Backend | Frontend | Reports | Tests | Required change | Dependency | Risk | Phase |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Product list | `Pages/inventory/ProductList.tsx`, `ProductTable.tsx`, `ProductFilters.tsx`, `InventoryController@index` | `products` | `InventoryService::search` | list/filters/cards | stock value on page | `InventoryTest` | optional formula badge; no filter change required | P1 read model | Medium | P2 |
| 2 | Product create | `ProductForm.tsx`, `ProductController@store`, `CreateProductRequest`, `CreateProductData` | `products`, `inventory_transactions`, `selling_units`, `product_packaging` | `ProductService::create` | fast form | – | `ProductsTest` | keep payload unchanged; do not add formula fields | – | High | P0/P2 |
| 3 | Product edit | `ProductForm.tsx`, `UpdateProductRequest`, `ProductService::update` | `products` | writes stock directly | edit form | – | none | remove stock write; formula editing elsewhere | P0 | **Critical** | P0 |
| 4 | Product detail | `ProductDetails.tsx`, `ProductController@show` | `products` | read | tabs/cards | – | `ProductLifecycleTest`, `ArchivedProductTest` | add Formula tab + composition prop | P1 | Medium | P2 |
| 5 | Product lifecycle | `RecordLifecycleService`, `ProductPolicy`, `LifecycleServiceProvider` | `products` | archive/delete/restore | detail dialogs | – | `ProductLifecycleTest`, `ArchivedProductTest` | block delete/archive if component used; historical runs survive | P1 | High | P1/P6 |
| 6 | Units / packaging | `ProductUnitService`, `PackagingDerivationEngine`, `UnitRelationEditor`, `lib/units.ts` | `product_units`, `product_packaging`, `selling_units` | derivation | relation editor | – | none | reuse conversion; do not reuse packaging as BOM | P1 | High | P1 |
| 7 | Selling units / pricing | `SellingUnit`, `ProductService`, POS | `selling_units` | factor resolution | unit selector | top products | `CostingTest` | no change; formula does not alter price | – | Medium | P4 |
| 8 | Inventory ledger | `InventoryService`, `InventoryTransaction`, `StockReconcileCommand` | `inventory_transactions` | all movements | timeline | stock ledger | `InventoryTest` | public consumption method; new buckets; optional run FK | P0 | **Critical** | P0/P3 |
| 9 | Manual stock adjustment | `InventoryController@adjust`, `AdjustStockDialog` | ledger, products | `recordTransaction` | dialog | stock report | `ArchivedProductTest` | none | – | Medium | – |
| 10 | Purchases | `PurchaseController`, `PurchaseService`, `PurchaseBill.tsx` | `purchase_bills`, `purchase_bill_items`, products | cost averaging, stock | purchase form | purchase report | `PurchasesTest`, `CostingTest` | decide if composites purchasable; validate pack qty | P1 decision | High | P1/P6 |
| 11 | Purchase returns | `ReturnService`, `PurchaseReturnService`, `PurchaseReturnController` | `returns`, `return_items`, ledger | reversal | return UI | purchase report | `PurchaseReturnTest`, `ReturnServiceTest` | do not restore components on composite purchase return | P3 | High | P6 |
| 12 | POS page | `SaleBill.tsx`, search/cart/payment components | products, selling_units | `SaleController@create` | one page, session cart | – | none | cap badge, consumption editor, availability | P3 | **Critical** | P4 |
| 13 | Sale creation | `SaleService`, `CreateSaleRequest`, `SaleItem` | `sales`, `sale_items`, ledger | transactional | POS | sales/COGS | `SalesTest`, `CostingTest` | accept consumption; one sale line; no component lines | P3 | **Critical** | P4 |
| 14 | Sale deletion/restore | `SalePolicy`, `RecordLifecycleService` | ledger, sales | compensating adjustments | detail | – | lifecycle tests | handle runs explicitly | P3 | **Critical** | P6 |
| 15 | Sale returns/refunds | `ReturnService`, `ReturnWorkflowController`, return pages | `returns`, `return_items`, ledger | stock/party/cash | return UI | returns/COGS | `ReturnServiceTest` | service refunds do not restore components | P4 | **Critical** | P6 |
| 16 | Legacy return writers | `SaleReturnService`, `PurchaseReturnService` | ledger | direct writes | – | – | `SaleReturnTest`, `ArchivedProductTest` | fence; do not use for composition | P0 | High | P0 |
| 17 | Costing | `CostResolver`, `PurchaseService`, `SaleService` | cost columns | weighted avg + snapshot | price/margin | all cost reports | `CostingTest` | roll-up + snapshots | P3 | High | P5 |
| 18 | Sales reports | `SalesReportService`, `reports/*` | sales, sale_items | aggregates | report pages | revenue/top products | `ReportsTest` | exclude component lines (never exist) | P4 | High | P7 |
| 19 | Inventory reports | `InventoryReportService` | ledger, products, returns | movement/valuation | StockReport/Print | stock, valuation | `InventoryTest`, `ReportsTest` | separate consumed/produced buckets | P3 | High | P7 |
| 20 | Financial reports | `FinancialReportService` | sales, sale_items, products | COGS/valuation SQL | FinancialOverview, P&L, balance sheet | COGS, profit | `FinancialReportsTest` | rolled cost; consistent returns; no double count | P5 | High | P5/P7 |
| 21 | Dashboard | `DashboardController`, `DashboardReportService` | products, sales, returns | metrics | Dashboard | KPIs | `DashboardTest` | formula availability warning (optional) | P4 | Medium | P7 |
| 22 | Exports | `ExportService`, `ReportController` export methods | same as reports | CSV/XLSX/PDF | export buttons | all exports | none | add composition columns if wanted | P7 | Low | P7 |
| 23 | Backup/restore | `BackupService`, `DatabaseExporter`, `RestoreService` | all tables | dump/import | settings UI | – | 6 backup tests | include new tables automatically; add round-trip test | P1 | Medium | P7 |
| 24 | AuthN/AuthZ | `routes/auth.php`, gates in `AppServiceProvider`, requests | users, roles, permissions | session + gates | mock `AuthContext` | – | auth tests | add composition permissions; enforce CRUD | P0 | **Critical** | P0/P1 |
| 25 | Settings | `SettingsController`, `SettingService`, settings pages | `settings` JSON | read/write | settings pages | – | `SettingsTest` | add composition policy flags if needed; fix missing user methods | – | Medium | P1 |
| 26 | Audit log | `AuditService`, `audit_logs`, `AuditLogController` | `audit_logs` | lifecycle only | audit page | – | none | log formula/run events | P3 | Medium | P3 |
| 27 | Product search/pickers | `ProductService::search`, POS props, component picker | products | query | search UI | – | none | server-side search endpoint; exclude self/archived | P1 | Medium | P2 |
| 28 | Barcode | `products.barcode`, POS search | products | none | not wired | – | none | no change; optionally scan opens editor | – | Low | P8 |
| 29 | Product import/export | **ABSENT** | – | – | – | – | – | none; define later if needed | – | Low | – |
| 30 | Companies/organizations | **ABSENT** on clinic; fashion only | – | – | – | – | – | do not add `company_id` here | – | High (port) | P8 |
| 31 | Warehouses/transfers | **ABSENT** | – | – | – | – | – | out of scope; no schema | – | Medium | – |
| 32 | Manufacturing/production | **ABSENT** | – | – | – | – | – | optional P7; distinct from consumption | P3 | High | P7 |
| 33 | Events/jobs/notifications | **ABSENT** | jobs tables | none | – | – | – | keep execution synchronous; audit only | – | Low | P3 |
| 34 | Clinic module | `ConsultationService`, `ClinicController`, prescription models | consultations, prescriptions, sale link | creates sales | clinic pages | clinic reports | clinic tests (if any) | consumption services can reuse the sale link | P4 | Medium | P4 |
| 35 | Shared UI | `components/ui`, `features/*` | – | – | dialogs/sheets/tables | – | – | reuse; add a11y labels | P2 | Low | P2 |
| 36 | Tests/CI | `tests/**`, `phpunit.xml` | testing DB | – | – | – | – | add composition suite; fix baseline failures | P0 | High | all |
| 37 | Decimal precision | ledger/product migrations | `inventory_transactions.quantity` decimal(12,2) | rounding | inputs | valuation | none | widen to 14,6 if fractional recipes | P1 | High | P1 |
| 38 | Performance/large catalogs | POS sends all products; create sends 999 | – | queries | payload size | reports | none | component search must paginate | P2 | Medium | P2 |
| 39 | Seeders/demo data | `DatabaseSeeder` | users/settings/expense categories | – | – | – | – | add demo formula only in test/dev, not production | – | Low | P8 |
| 40 | Deployment | `DEPLOY.md` | – | migrations | assets | – | – | document new migrations and cron unchanged | – | Low | P8 |

## Crossing summary

| Risk | Subsystems |
|---|---|
| **Critical** | product edit stock write, inventory ledger, sale creation, sale deletion, returns, authorization |
| **High** | purchasing cost/units, lifecycle blockers, costing, reports, units, precision, tenant port |
| **Medium** | product detail/list, audit, settings, search, clinic, performance |
| **Low** | barcode, exports, seeders, deployment, shared UI |

## Reconciliation statement

This matrix was reconciled against the repository-wide searches performed for:

- `company_id`, `organization_id`, `warehouse`, `transfer`, `production`, `manufactur`,
  `formula`, `composite`, `consumption`;
- `product_type`, `track_inventory`;
- every `inventory_transactions` writer;
- every controller `authorize()` call and every FormRequest `authorize()`;
- every report service and route;
- every test file.

Areas marked **ABSENT** were searched and not found. They must not be described as existing
integration points in any implementation plan.
