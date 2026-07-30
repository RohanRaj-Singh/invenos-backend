# Reporting Module — Codebase Audit & Implementation Plan

**Date:** 2026-07-30
**Revision:** 2 — incorporating architectural review feedback
**Status:** Architecture Lock — Ready for Phased Implementation

---

## Guiding Principles

> Reports should never create business logic. Reports aggregate existing data. They never become another source of truth.

This is the **Read Model** principle. Every report:
1. Reads from canonical transaction tables (`inventory_transactions`, `sales`, `purchases`, `returns`, `financial_transactions`)
2. Aggregates (SUM, COUNT, GROUP BY)
3. Returns formatted data for display

Reports never:
- Calculate inventory (that's `InventoryService`)
- Determine balances (that's on the `Contact` model)
- Create or modify records
- Duplicate business rules already in services

---

## Executive Summary

### Current State

The codebase has a **hybrid reporting state**:

| Layer | Status | What Exists |
|-------|--------|-------------|
| **Backend ReportService** | ✅ Working but becoming a god class | `getSalesReport()`, `getPurchaseReport()`, `getInventoryReport()`, `getFinancialReport()`, `getProfitReport()`, `getDashboardMetrics()` — all in one file |
| **Backend ReportController** | ✅ Exists but **unused** | Controller methods wired to `ReportService`, but **no routes point to it** |
| **Frontend Routes** | ❌ Closures | All `/reports/*` routes use closures that render pages consuming **mock data** from `reports-data.ts` |
| **Report frontend pages** | ✅ Built | `SalesReport`, `PurchaseReport`, `StockReport`, `DayBookReport`, `CashFlowReport`, `PnLReport`, `BalanceSheetReport`, `PartyReport` |
| **Reusable report components** | ✅ Well-designed | `ReportTable`, `ReportFilters`, `ReportToolbar`, `SummaryCards`, `ReportLayout`, `ReportRow`, `StatusBadge` |
| **Dashboard** | ✅ Live | `DashboardController::index()` passes live data from `ReportService` |

### The Key Gap

The **ReportController exists but is disconnected from the routes**. All `/reports/*` routes render Inertia pages directly with mock data instead of going through the controller.

### Recommended Approach

**Not a rewrite.** The work is:

1. **Split `ReportService` now** — one service per domain before adding any new reports
2. **Wire routes to `ReportController`** — replace mock data closures with real controller methods
3. **Introduce `ReportFilters` DTO** — every report receives the same filter object
4. **Add Query Objects** — reusable queries that controllers, export, and API can all share
5. **Build shared `ExportService`** — one service handles CSV, Excel, PDF for all reports
6. **Fix two data quality issues** — legacy return detection and COGS calculation

---

## 1. Complete Codebase Audit

### 1.1 Products Module

| Field | Type | Source | Report Use |
|-------|------|--------|------------|
| `id` | BIGINT PK | DB | Key |
| `name` | VARCHAR(255) | DB | Display |
| `sku` | VARCHAR(50) | DB | Identifier |
| `barcode` | VARCHAR(50) | DB | Optional |
| `category_id` | FK → categories | DB | Filter/group |
| `description` | TEXT | DB | — |
| `product_type` | VARCHAR(50) | DB | Filter (good/service) |
| `base_unit_id` | FK → product_units | DB | Unit resolution |
| `stock_quantity` | DECIMAL(12,3) | **Stored, updated by InventoryService** | Stock value, low stock |
| `low_stock_threshold` | DECIMAL(12,3) | DB | Low stock flag |
| `last_purchase_cost` | DECIMAL(12,3) | DB | COGS proxy |
| `default_purchase_cost` | DECIMAL(12,3) | DB | Default cost |
| `allow_negative_stock` | BOOLEAN | DB | Constraint |
| `status` | ENUM | Computed by InventoryService | Stock status |
| `track_inventory` | BOOLEAN | DB | Filter |

**Relationships:**
- `belongsTo(Category)` — category grouping
- `hasMany(SellingUnit)` — pricing data (`sale_price`, `purchase_price`)
- `hasMany(InventoryTransaction)` — stock movements
- `hasMany(ProductPackaging)` — packaging relationships

**Key findings:**
- `stock_quantity` is maintained by `InventoryService::applyMovement()` �� it's a **running balance**, not computed from transactions
- `last_purchase_cost` is the best available COGS data point — set during purchase creation
- `sellingUnits.sale_price` is used as a valuation proxy (not actual cost tracking)
- `status` is recomputed after every inventory movement (in-stock / low-stock / out-of-stock)

### 1.2 Categories Module

| Field | Type | Notes |
|-------|------|-------|
| `id` | BIGINT PK | Key |
| `name` | VARCHAR(255) | Display |
| `description` | TEXT | Optional |
| `color` | VARCHAR(7) | UI hex color |

**Findings:** Simple flat structure (no parent/child hierarchy). Used for product grouping in reports.

### 1.3 Inventory Transactions Module

| Field | Type | Notes |
|-------|------|-------|
| `product_id` | FK → products | Product |
| `type` | VARCHAR(50) | Transaction type |
| `quantity` | DECIMAL(12,3) | Signed (+/-) |
| `unit` | FK → product_units | Base unit |
| `packaging_name` | VARCHAR | Display |
| `packaging_quantity` | DECIMAL(12,3) | Visual |
| `date` | DATE | Transaction date |
| `reference` | VARCHAR(100) | Document number |
| `running_balance` | DECIMAL(12,3) | **Snapshot at time of transaction** |
| `reference_type` | VARCHAR(100) | Polymorphic type |
| `reference_id` | BIGINT | Polymorphic ID |

**Transaction types currently used:**
| Type | Direction | Source |
|------|-----------|--------|
| `purchase` | +quantity | `InventoryService::recordPurchase()` |
| `sale` | -quantity | `InventoryService::recordSale()` |
| `sale-return` | +quantity | `InventoryService::recordReturn()` |
| `purchase-return` | -quantity | `InventoryService::recordReturn()` |
| `adjustment` | ±quantity | `InventoryService::recordAdjustment()` |

**Key findings:**
- `running_balance` is a **snapshot** — perfect for stock ledger reports without calculation
- `reference` stores the invoice/return number for cross-referencing
- `reference_type`/`reference_id` enables polymorphic lookup
- **This is the single source of truth for all inventory reports**

### 1.4 Sales Module

| Field | Type | Notes |
|-------|------|-------|
| `invoice_number` | VARCHAR(50) | Unique, prefix INV- |
| `source` | ENUM | pos, clinic, manual |
| `date` | DATE | Sale date |
| `customer_id` | FK → contacts | Nullable (walk-in) |
| `customer_name` | VARCHAR(255) | Denormalized |
| `subtotal` | DECIMAL(12,0) | Sum of item totals |
| `discount` | DECIMAL(12,0) | Global discount |
| `grand_total` | DECIMAL(12,0) | subtotal - discount |
| `amount_paid` | DECIMAL(12,0) | Amount collected |
| `outstanding_balance` | DECIMAL(12,0) | grand_total - amount_paid |
| `return_total` | DECIMAL(12,0) | Total returned amount |
| `return_status` | ENUM | none, partial, full |
| `payment_status` | ENUM | paid, partial, unpaid |
| `notes` | TEXT | Optional |
| `created_by` | VARCHAR(255) | User name |

**SaleItem fields:**
| Field | Type | Notes |
|-------|------|-------|
| `product_id` | FK → products | Nullable |
| `product_name` | VARCHAR(255) | Denormalized |
| `selling_unit_id` | FK → selling_units | The unit sold |
| `packaging_name` | VARCHAR(100) | Display |
| `packaging_quantity` | DECIMAL(12,3) | How many units |
| `base_unit_quantity` | DECIMAL(12,3) | Conversion factor |
| `base_quantity` | DECIMAL(12,3) | **packaging_quantity × base_unit_quantity** |
| `unit_price` | DECIMAL(12,0) | Price per selling unit |
| `cost_price` | DECIMAL(12,0) | **COGS per unit** |
| `total` | DECIMAL(12,0) | Quantity × unit_price |
| `discount_pct` | DECIMAL(12,3) | Line discount |
| `category` | VARCHAR(255) | Denormalized |

**Key findings:**
- **Legacy return detection**: Old code uses `invoice_number like 'RET-%'` for returns — this predates the new polymorphic `Return` model
- The new `returns` table has `return_total` and `return_status` fields on Sale (added by our migration)
- `cost_price` on SaleItem stores COGS per unit — **this is the true cost data** for profit reports
- `base_quantity` stores the total base-unit quantity — needed for inventory impact
- No `sales` table issue: `customer_id` is nullable for walk-in customers

### 1.5 Purchases Module

| Field | Type | Notes |
|-------|------|-------|
| `invoice_ref` | VARCHAR(50) | Unique |
| `supplier_id` | FK → contacts | Nullable |
| `supplier_name` | VARCHAR(255) | Denormalized |
| `date` | DATE | Bill date |
| `subtotal` | DECIMAL(12,0) | Symmetric with Sale |
| `discount` | DECIMAL(12,0) | Symmetric |
| `total_amount` | DECIMAL(12,0) | Note: asymmetric name vs Sale's `grand_total` |
| `amount_paid` | DECIMAL(12,0) | Symmetric |
| `outstanding_balance` | DECIMAL(12,0) | Symmetric |
| `return_total` | DECIMAL(12,0) | Added by our migration |
| `return_status` | ENUM | Added by our migration |
| `payment_status` | ENUM | Symmetric |

**Key findings:**
- **Asymmetric naming**: `PurchaseBill.total_amount` vs `Sale.grand_total` — report services must handle both
- PurchaseBillItem has `unit_cost`, `total_cost` (symmetric with SaleItem's `unit_price`, `total`)
- No `cost_price` field on PurchaseBillItem (the cost IS the price for purchases)
- Legacy return detection uses `invoice_ref like 'PRET-%'`

### 1.6 Returns Module (New polymorphic model)

| Field | Type | Notes |
|-------|------|-------|
| `return_number` | VARCHAR(50) | Unique (SR- or PR- prefix) |
| `type` | ENUM | SALE or PURCHASE |
| `reference_type` | VARCHAR(100) | Polymorphic: 'sale' or 'purchase_bill' |
| `reference_id` | BIGINT | Original document ID |
| `contact_id` | FK → contacts | Customer or supplier |
| `status` | ENUM | pending, completed, cancelled |
| `subtotal` | DECIMAL(12,0) | Symmetric |
| `discount` | DECIMAL(12,0) | Symmetric |
| `grand_total` | DECIMAL(12,0) | Symmetric |
| SoftDeletes | TIMESTAMP | Lifecycle support |

**Current state:** Tables exist, models exist, `ReturnService` exists — but NOT yet wired into reports. The legacy `RET-%` / `PRET-%` pattern is still used in `ReportService`.

### 1.7 Contacts Module

| Field | Type | Notes |
|-------|------|-------|
| `name` | VARCHAR(255) | Display |
| `phone` | VARCHAR(50) | Contact |
| `email` | VARCHAR(255) | Contact |
| `roles` | JSON | [customer, supplier, patient] |
| `current_balance` | DECIMAL(12,0) | Running balance |
| `opening_balance` | DECIMAL(12,0) | Starting balance |
| `credit_limit` | DECIMAL(12,0) | Optional cap |

**Relationships:**
- `hasMany(Sale, customer_id)` — customer sales
- `hasMany(PurchaseBill, supplier_id)` — supplier purchases
- `hasMany(FinancialTransaction)` — money movements
- `hasMany(ReturnModel, contact_id)` — returns for this contact

**Key findings:**
- `current_balance` is a manually-updated running balance — no self-healing
- `roles` is a JSON array enabling multi-role contacts (a contact can be both customer AND supplier)
- Opening balance + all transactions should theoretically equal current_balance

### 1.8 Financial Transactions Module

| Field | Type | Notes |
|-------|------|-------|
| `contact_id` | FK → contacts | Who |
| `direction` | ENUM | in or out |
| `type` | VARCHAR(50) | invoice, payment, refund, payout, collection |
| `amount` | DECIMAL(12,0) | Always positive |
| `method` | VARCHAR(50) | cash, card, transfer, etc. |
| `linked_sale_id` | FK → sales | Nullable |
| `description` | TEXT | Context |

**Key findings:**
- No `linked_purchase_id` — supplier payments can't be traced back (identified in earlier audit)
- All money movements are recorded here — source of truth for cash flow, day book
- `direction: 'in'` = money received, `direction: 'out'` = money paid

### 1.9 Expenses Module

| Field | Type | Notes |
|-------|------|-------|
| `expense_number` | VARCHAR(50) | Sequential |
| `category_id` | FK → expense_categories | Grouping |
| `amount` | DECIMAL(12,0) | Always positive |
| `paid_to` | VARCHAR(255) | Payee |
| `payment_method` | VARCHAR(50) | cash, card, etc. |
| `notes` | TEXT | Context |

**Key findings:** Simple module. No SoftDeletes, no lifecycle. Used in P&L and cash flow reports.

### 1.10 Existing ReportService — Detailed Audit

```php
// Currently implements:
getSalesReport($from, $to, $customerId)     → summary + top products
getPurchaseReport($from, $to, $supplierId)   → summary only
getInventoryReport()                          → stock + category breakdown
getFinancialReport()                          → outstanding + cash flow
getProfitReport($from, $to)                  → revenue, COGS, gross margin
getDashboardMetrics()                         → today's stats + alerts
```

**Issues found:**
1. **Legacy return detection**: Uses `invoice_number like 'RET-%'` — ignores the new `returns` table
2. **COGS proxy**: Uses `selling_units.sale_price` instead of `sale_items.cost_price` which already stores the actual COGS
3. **No stock ledger**: No per-product movement timeline query
4. **No contact ledger**: No customer/supplier statement query
5. **No contact report**: No outstanding per contact, no payment history
6. **No export**: No CSV/Excel/PDF export support
7. **No pagination**: Returns all data unfiltered within date range
8. **Single ReportService**: One service handling ALL report domains — violates single responsibility

---

## 2. Existing Data Sources Summary

| Data Source | Table | Purpose | Report Use |
|-------------|-------|---------|------------|
| Products | `products` | Stock, value, status | Inventory reports |
| Categories | `categories` | Product grouping | Inventory reports |
| Selling Units | `selling_units` | Pricing data | Valuation |
| Inventory Transactions | `inventory_transactions` | Stock movements | Stock ledger, movement |
| Sales | `sales` + `sale_items` | Revenue, customer | Sales reports |
| Purchases | `purchase_bills` + `purchase_bill_items` | Cost, supplier | Purchase reports |
| Returns | `returns` + `return_items` | Reversals | Net calculations |
| Contacts | `contacts` | Customer/supplier | Contact reports |
| Financial Transactions | `financial_transactions` | Money movement | Cash flow, day book |
| Expenses | `expenses` | Costs | P&L, cash flow |
| Return Reasons | `return_reasons` | Reason analytics | Return analysis (future) |

---

## 3. Report Opportunities

### 3.1 Currently Implementable (data exists, query needed)

| Report | Data Source | Complexity | Business Value |
|--------|-------------|------------|----------------|
| Sales Register | Sale + Return | 🟢 Low | ���� High |
| Daily/Monthly Sales | Sale (aggregated) | 🟢 Low | 🔴 High |
| Sales by Customer | Sale grouped | 🟢 Low | 🔴 High |
| Sales by Product | SaleItem grouped | 🟡 Medium | 🔴 High |
| Top Selling Products | SaleItem aggregated | 🟢 Low | 🔴 High |
| Net Sales | Sale - Return(SALE) | ��� Low | 🔴 High |
| Sale Returns | Return(SALE) | �� Low | 🟡 Medium |
| Purchase Register | PurchaseBill + Return | ���� Low | 🔴 High |
| Purchases by Supplier | PurchaseBill grouped | 🟢 Low | 🟡 Medium |
| Purchase Returns | Return(PURCHASE) | 🟢 Low | 🟡 Medium |
| Net Purchases | PurchaseBill - Return | 🟢 Low | 🟡 Medium |
| Stock Summary | Products | 🟢 Low | 🔴 High |
| Stock Ledger | InventoryTransaction | 🟢 Low | 🔴 High |
| Stock Movement | InventoryTransaction | 🟢 Low | 🟡 Medium |
| Low Stock | Products (filtered) | �� Low | 🔴 High |
| Stock Valuation | Products × cost | 🟡 Medium | 🟡 Medium |
| Product History | InventoryTransaction(product) | 🟢 Low | 🟡 Medium |
| Customer Ledger | Sale + Return + FinTrans | 🟡 Medium | 🔴 High |
| Supplier Ledger | Purchase + Return + FinTrans | 🟡 Medium | 🔴 High |
| Customer Outstanding | Sale (unpaid) | ���� Low | 🔴 High |
| Supplier Outstanding | PurchaseBill (unpaid) | 🟢 Low | 🔴 High |
| Day Book | All transactions | 🟡 Medium | 🟡 Medium |
| Cash Flow | FinancialTransaction | 🟡 Medium | 🟡 Medium |
| Dashboard Today | All aggregated | 🟡 Medium | 🔴 High |
| Expenses by Category | Expense grouped | 🟢 Low | 🟡 Medium |

### 3.2 Requires Additional Data (future)

| Report | What's Missing | Blocks On |
|--------|---------------|-----------|
| Gross Profit | Accurate cost tracking per item | `cost_price` on SaleItem exists, but COGS averaging not implemented |
| Net Profit | All income - all expenses | Gross Profit + all expense categories |
| Dead Stock | Time-based query | None — can query InventoryTransaction date |
| ABC Analysis | Revenue contribution calculation | None — data exists |
| Return Rate | Returns as % of sales | Returns data exists |
| Customer LTV | Historical customer data | Long-term data accumulation |

---

## 4. Recommended MVP Reports

### Priority Matrix (Effort vs Value)

```
                    Value
              Low     Medium     High
    ┌──────────────────────────────────┐
    │                    Stock Ledger  │  Low Effort
    │                    Sales Register│
    │                    Stock Summary │
    │                    Low Stock     │
 E  │                    Top Products  │
 f  │                    Net Sales     │
 f  ├──────────────────────────────────┤
 o  │       Expenses    Customer Ledger│  Medium Effort
 r  │       By Category Supplier Ledger│
 t  │                    Day Book      │
    │                    Cash Flow     │
    ├──────────────────────────────────┤
    │                    Product       │  Higher Effort
    │                    History       │
    └──────────────────────────────────┘
```

### Recommended MVP (Phase A — 8 reports)

| # | Report | Why MVP | Backend Status | Frontend Status |
|---|--------|---------|----------------|-----------------|
| 1 | **Stock Summary** | Daily ops — what's in stock, what needs reordering | ✅ Exists in ReportService | ✅ StockReport page exists |
| 2 | **Stock Ledger** | Every stock movement per product | ❌ Missing | ❌ Missing |
| 3 | **Low Stock** | Quick reorder trigger | ⚠️ Partially in Dashboard | ❌ Dedicated page |
| 4 | **Sales Register** | Daily revenue tracking | ✅ Exists (needs return fix) | ✅ SalesReport exists |
| 5 | **Customer Sales** | Top customers, revenue | ⚠️ Aggregate exists, per-customer missing | ❌ Missing |
| 6 | **Purchase Register** | Spend tracking | ✅ Exists (needs return fix) | ✅ PurchaseReport exists |
| 7 | **Customer Ledger** | Financial statement per customer | ❌ Missing | ✅ PartyReport exists |
| 8 | **Supplier Ledger** | Financial statement per supplier | ❌ Missing | ✅ PartyReport exists |

### Why These 8

These are the **operational reports** a small business owner needs every day to answer:
- "What stock do I need to reorder?" (Stock Summary, Low Stock)
- "How much did I sell today?" (Sales Register)
- "Who owes me money?" (Customer Ledger, Customer Sales)
- "Who do I owe money to?" (Supplier Ledger)
- "What did I spend on purchases?" (Purchase Register)
- "Where did my stock go?" (Stock Ledger)

Every other report is Phase B.

---

## 5. Reporting Architecture

### 5.1 Current Architecture (to preserve)

```
Frontend Pages (Inertia React)          ← reusable components: ReportTable, ReportToolbar,
    │                                       SummaryCards, ReportFilters, ReportLayout
    ▼
ReportController (thin)                 ← passes filters, returns Inertia responses
    │
    ▼
ReportService (domain logic)            ← single service, should be split
    │
    ▼
Eloquent Queries (DB)                   ← direct queries, no duplicate calculations
```

### 5.2 Recommended Architecture

```
Frontend Pages (Inertia React)
    │
    ▼
ReportController (thin)                 ← only: receive filters → call service → return
    │
    ├── SalesReportService
    │   ├── register()                  ← Sales + Returns
    │   ├── byCustomer()                ← grouped by contact
    │   └── topProducts()               ← aggregated SaleItems
    │
    ├── PurchaseReportService
    │   ├── register()                  ← PurchaseBills + Returns
    │   └── bySupplier()                ← grouped by contact
    │
    ├── InventoryReportService
    │   ├── stockSummary()              ← Products + categories
    │   ├── stockLedger()               ← InventoryTransaction
    │   ├���─ lowStock()                  ← Products filtered
    │   └── valuation()                 ← Products × cost
    │
    ├── ContactReportService
    │   ├── customerLedger()            ← Sales + Returns + FinTrans
    │   ├── supplierLedger()            ← Purchases + Returns + FinTrans
    │   └── outstanding()               ← Unpaid documents
    │
    ├── DashboardService
    │   ├── today()                     ← Aggregated today stats
    │   └── alerts()                    ← Low stock, outstanding
    │
    ├── ProductHistoryService
    │   └── timeline()                  ← InventoryTransaction per product
    │
    └── ExportService (shared)
        ├── csv()
        ├── excel()
        └── pdf()
```

### 5.3 Shared ReportFilters DTO

```php
class ReportFilters
{
    public ?string $dateFrom;
    public ?string $dateTo;
    public ?int $contactId;
    public ?int $productId;
    public ?int $categoryId;
    public ?string $type;        // Transaction type filter
    public ?string $status;      // Payment status
    public ?string $search;
    public int $perPage = 25;
    public string $sortBy = 'date';
    public string $sortDir = 'desc';
}
```

---

## 6. Shared Report Infrastructure

### 6.1 Reusable Components (Already Built — Frontend)

| Component | Purpose | Status |
|-----------|---------|--------|
| `ReportTable.tsx` | Generic table with sort, search, pagination | ✅ Ready |
| `ReportToolbar.tsx` | Filter bar (date range, dropdowns) | ✅ Ready |
| `ReportFilters.tsx` | Sidebar filter panel | ✅ Ready |
| `SummaryCards.tsx` | KPI cards (total, count, average) | ✅ Ready |
| `ReportLayout.tsx` | Consistent report page layout | ✅ Ready |
| `ReportRow.tsx` | Table row with conditional styling | ✅ Ready |
| `StatusBadge.tsx` | Color-coded status indicators | ✅ Ready |

### 6.2 What's Missing (Backend Infrastructure)

| Component | Priority | Why |
|-----------|----------|-----|
| `ReportFilters` DTO | P0 | Shared filter validation across all reports |
| `ExportService` | P0 | CSV + Excel + Print — every report needs this |
| Split `ReportService` | P1 | One service violates SRP, but not blocking MVP |

### 6.3 Common Filter Architecture

Every report should accept a standardized set of filters:

```
GET /reports/sales?date_from=2026-07-01&date_to=2026-07-30
                    &customer_id=5
                    &status=paid
                    &search=INV-001
                    &per_page=25
                    &sort_by=date&sort_dir=desc
```

The frontend `ReportToolbar` component already provides date range, dropdowns, and search — these just need to be sent as query parameters to the backend.

---

## 7. Query Strategy

### 7.1 Correct Source of Truth Per Report

| Report | Query From | Why |
|--------|-----------|-----|
| Stock Summary | `Product` with `stock_quantity` | Running balance already maintained |
| Stock Ledger | `InventoryTransaction` | Canonical history — `running_balance` is a snapshot |
| Stock Movement | `InventoryTransaction` grouped by type | Type filter + aggregation |
| Low Stock | `Product` where `status` in `[low-stock, out-of-stock]` | Status already recomputed |
| Stock Valuation | `Product` × best cost | Cost from `selling_units.sale_price` or `last_purchase_cost` |
| Sales Register | `Sale` + `Return(type=SALE, status=completed)` | Returns are separate documents, not invoice prefix tricks |
| Customer Sales | `Sale` grouped by `customer_id` | Simple GROUP BY |
| Top Products | `SaleItem` aggregated | SUM of quantities + revenue |
| Net Sales | `Sale.grand_total - SUM(Return.grand_total)` | Two queries, simple subtraction |
| Purchase Register | `PurchaseBill` + `Return(type=PURCHASE)` | Same pattern as sales |
| Customer Ledger | `Sale` + `Return(SALE)` + `FinancialTransaction` | Complete money flow for a contact |
| Supplier Ledger | `PurchaseBill` + `Return(PURCHASE)` + `FinancialTransaction` | Complete money flow for a contact |
| Day Book | `Sale` + `PurchaseBill` + `Return` + `Expense` + `FinancialTransaction` | UNION of all dated transactions |
| Cash Flow | `FinancialTransaction` | Direction = in/out determines flow |
| Product History | `InventoryTransaction` where `product_id = X` | Single product, all movements |

### 7.2 Critical Fix: Replace Legacy Return Detection

```php
// OLD (broken — relies on invoice prefix hack):
Sale::where('invoice_number', 'like', 'RET-%')->sum('grand_total');

// NEW (correct — uses proper Return model):
ReturnModel::where('type', 'SALE')
    ->where('status', 'completed')
    ->whereBetween('return_date', [$from, $to])
    ->sum('grand_total');
```

### 7.3 Critical Fix: COGS From SaleItem

```php
// OLD (proxy — uses selling unit sale price):
$cogs = DB::table('sale_items')
    ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
    ->join('products', 'sale_items.product_id', '=', 'products.id')
    ->select(DB::raw('SUM(sale_items.base_quantity * COALESCE(
        (SELECT MIN(sale_price) FROM selling_units WHERE product_id = products.id), 0
    )) as cogs'))
    ->value('cogs');

// NEW (correct — uses actual cost stored on line item):
$cogs = SaleItem::join('sales', 'sale_items.sale_id', '=', 'sales.id')
    ->whereBetween('sales.date', [$from, $to])
    ->where('sales.invoice_number', 'not like', 'RET-%')
    ->select(DB::raw('SUM(sale_items.base_quantity * sale_items.cost_price) as cogs'))
    ->value('cogs');
```

---

## 8. Performance Recommendations

### 8.1 Indexes

| Table | Missing Index | Why |
|-------|---------------|-----|
| `inventory_transactions` | `(product_id, created_at)` | Stock ledger per product — most common report query |
| `inventory_transactions` | `(type, created_at)` | Movement summary by type |
| `sale_items` | `(sale_id, product_id)` | Product sales aggregation |
| `returns` | `(type, status, return_date)` | Return reports, net calculations |
| `returns` | `(reference_type, reference_id, status)` | Returns for a specific document |
| `return_items` | `(product_id, return_id)` | Product return quantity aggregation |
| `financial_transactions` | `(contact_id, created_at)` | Contact ledger queries |
| `financial_transactions` | `(direction, created_at)` | Cash flow queries |

### 8.2 Query Optimizations

| Issue | Fix |
|-------|-----|
| `ProfitReport` joins through 3 tables for COGS | Use `sale_items.cost_price` directly — single table |
| `InventoryReport` loads all products + selling units | Eager load only needed fields: `select('id','name','sku','stock_quantity','status','category_id')` |
| `DashboardService` queries 5 separate tables for today | Combine into 1-2 aggregated queries |
| Day Book builds UNION in PHP | Use SQL UNION for database-side sorting |

### 8.3 Pagination

All report services should paginate results. The `ReportTable` frontend component already supports pagination — just pass `meta` (current_page, last_page, per_page, total) alongside `data`.

---

## 9. UX Recommendations

### 9.1 Navigation

The existing sidebar already has a "Reports" section. The recommended structure:

```
Reports
├── Dashboard              ← landing page
├── Inventory
│   ├── Stock Summary      ← current stock levels
│   ├── Stock Ledger       ← movement history
│   └── Low Stock          ← reorder alerts
���── Sales
│   ├── Sales Register     ← all invoices
│   └── Customer Sales     ← by customer
├── Purchases
│   └── Purchase Register  ← all purchase bills
├── Financial
│   ├── Customer Ledger    ← per-customer statement
│   ├── Supplier Ledger    ← per-supplier statement
│   ├── Day Book           ← all transactions
│   └── Cash Flow          ← money in/out
└── Analytics (Phase B)
    ├── Profit & Loss
    └── Product Analytics
```

### 9.2 Report Layout (All Reports Share This)

```
���─────────────────────────────────────────────────────────┐
│  Report Title                    Date Range [From] [To] │
│  [Summary Cards: Total | Count | Avg | vs Last Period] │
├─────────────────────────────────────────────────────────┤
│  [Filters: Customer | Status | Search...]               │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐    │
│  │ ReportTable (sortable, paginated)               │    │
│  │ ┌───────┬────────┬──────┬────��──┬──────┬─────┐  │    │
│  │ │ Date  │ Ref    │ Party│ Items │ Total│ Paid│  │    │
│  │ ├───────┼────────┼──────┼───────┼──────┼─────┤  │    │
│  │ │ ...   │ ...    │ ...  │ ...   │ ...  │ ... │  │    │
│  │ └───────┴────────┴──────┴───────┴──────┴─────┘  │    │
│  │                                     Page 1 of 5  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          ��
│  [Export: CSV │ Excel │ Print]                           │
└��────────────────────────────────────────────────────────┘
```

### 9.3 Summary Cards (Every Report Should Show)

| Card | Example | Source |
|------|---------|--------|
| Total | "Rs. 245,000" | SUM of main metric |
| Count | "42 invoices" | COUNT of records |
| Average | "Rs. 5,833 / order" | Total ÷ Count |
| Compared | "+12% vs last month" | Previous period comparison |

### 9.4 Empty States

Every report should handle:
- **No data for filters**: "No sales found for this date range" with CTA to adjust filters
- **No records exist**: "No sales have been recorded yet" with CTA to create one
- **Error loading**: Clear error message with retry option
- **Loading**: Skeleton state matching the report layout

---

## 10. Permission Strategy

### 10.1 Gates

| Permission | Cashier | Salesman | Manager | Admin |
|-----------|---------|----------|---------|-------|
| `reports.view.operational` | ✅ | ✅ | ✅ | ✅ |
| `reports.view.financial` | ❌ | ❌ | ✅ | ✅ |
| `reports.export` | ❌ | ✅ | ✅ | ✅ |
| `reports.view.dashboard` | ✅ | ✅ | ✅ | ✅ |

### 10.2 Report Access by Role

| Report | Cashier | Salesman | Manager | Admin |
|--------|---------|----------|---------|-------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Stock Summary | ✅ | ✅ | ✅ | ✅ |
| Stock Ledger | ✅ | ✅ | ✅ | ✅ |
| Low Stock | ✅ | ✅ | ✅ | ✅ |
| Sales Register | ✅ | ✅ | ✅ | ✅ |
| Customer Sales | ❌ | ✅ | ✅ | ✅ |
| Purchase Register | ❌ | ✅ | ✅ | ✅ |
| Customer Ledger | ❌ | ❌ | ✅ | ✅ |
| Supplier Ledger | ❌ | ❌ | ✅ | ✅ |
| Day Book | ❌ | ❌ | ✅ | ✅ |
| Cash Flow | ❌ | ❌ | ✅ | ✅ |

---

## 11. Future Compatibility

### 11.1 Current Architecture Supports

| Future Module | How It Integrates |
|---------------|-------------------|
| **Expenses** | Already exists as `Expense` model — just add expense reports |
| **Payments** | Already exists as `FinancialTransaction` — used in cash flow/ledger |
| **Warehouses** | Add `warehouse_id` to `InventoryTransaction` → filter by warehouse in reports |
| **Manufacturing** | Add `manufacturing` transaction type → `InventoryTransaction.type` already supports it |
| **Transfers** | Add `transfer-out` / `transfer-in` types → same pattern |
| **Multi-Branch** | Add `branch_id` to Sales, Purchases, Inventory → report filter |
| **CRM** | Contact module already has the data — just new report views |

### 11.2 Extensibility Points

| Extension Point | How Reports Handle It |
|----------------|----------------------|
| New transaction types | Add to `InventoryTransaction.type` — existing reports filter by type |
| New contact roles | `Contact.roles` JSON — already queryable |
| New document types | Add polymorphic reference — existing ledger queries extend |
| New currencies | Add `currency` field — reports format accordingly |

---

## 12. Risks & Technical Debt

| Risk | Impact | Mitigation |
|------|--------|------------|
| Legacy `RET-%` return detection in ReportService | Wrong net calculations | Fix to use `returns` table — clear before-after comparison |
| COGS uses sale price as proxy | Incorrect profit reports | Fix to use `sale_items.cost_price` — already stored correctly |
| ReportService is a single god class | Hard to maintain | Split into domain-specific services after MVP |
| No pagination on report queries | Slow on large datasets | Add pagination with per_page default |
| No indexes on report-heavy columns | Slow queries | Add indexes before launch |
| Frontend report pages use mock data | Wrong data shown | Connect to backend — wire routes to ReportController |
| `linked_purchase_id` missing on FinancialTransaction | Supplier payments not traceable | Add in future migration |

---

## 13. Phased Implementation Plan

The implementation is split into **Operational Reports (Phase A)** and **Financial Reports (Phase B)**. Phase A is built on existing transaction data. Phase B depends on Payments, Expenses, and accounting rules that may still evolve.

### Phase A — Operational Reports

### Phase A1 — Infrastructure (1 session)

**Objective:** Fix data quality, split services, introduce ReportFilters, wire routes.

| Step | Task | Files |
|------|------|-------|
| A1.1 | Fix return detection: replace `invoice_number like 'RET-%'` with `ReturnModel::where('type', 'SALE')` | `ReportService.php` |
| A1.2 | Fix COGS calculation: use `sale_items.cost_price` instead of `selling_units.sale_price` | `ReportService.php`, `getProfitReport()` |
| A1.3 | Add missing indexes (product_id + date on inventory_transactions) | New migration |
| A1.4 | Create `ReportFilters` DTO | `app/Domains/Reports/DTOs/ReportFilters.php` |
| A1.5 | Create `ExportService` (CSV + Excel + PDF) | `app/Domains/Reports/Services/ExportService.php` |
| A1.6 | Split `ReportService` into domain services | 6 new service files |
| A1.7 | Replace route closures with `ReportController` methods | `routes/web.php` |
| A1.8 | Wire frontend report pages to backend props | Frontend pages |
| A1.9 | Verify: existing reports display live data correctly | Manual test |

**▶️ Go/No-Go:** Existing reports display live data. Data quality fixes verified against manual calculations.

---

### Phase A2 — Inventory Reports (1 session)

**Objective:** Stock Summary, Stock Ledger, Product History, Low Stock.

| Step | Task | Files |
|------|------|-------|
| A2.1 | Add `stockSummary()` to `InventoryReportService` | Service |
| A2.2 | Add `stockLedger()` to `InventoryReportService` | Service + Query Object |
| A2.3 | Add `productTimeline()` to `ProductReportService` | Service + Query Object |
| A2.4 | Add `lowStock()` to `InventoryReportService` | Service |
| A2.5 | Create `StockLedger.tsx` frontend page | Frontend |
| A2.6 | Create `ProductHistory.tsx` frontend page | Frontend |
| A2.7 | Add routes + sidebar navigation | Routes + Sidebar |

**▶️ Go/No-Go:** Stock ledger shows all movement types with correct running balance. Product history matches InventoryTransaction records.

---

### Phase A3 — Sales & Purchase Reports (1 session)

**Objective:** Sales Register, Purchase Register, with return integration.

| Step | Task | Files |
|------|------|-------|
| A3.1 | Add `register()` to `SalesReportService` | Service + Query Object |
| A3.2 | Add `byCustomer()` to `SalesReportService` | Service |
| A3.3 | Add `topProducts()` to `SalesReportService` | Service |
| A3.4 | Add `register()` to `PurchaseReportService` | Service + Query Object |
| A3.5 | Add `bySupplier()` to `PurchaseReportService` | Service |
| A3.6 | Verify totals reconcile with transactional data | Manual test |

**▶️ Go/No-Go:** Sales Register totals = sum of completed sales. Net Sales = gross - returns. Purchase Register matches purchase bills.

---

### Phase A4 — Contact Reports (1 session)

**Objective:** Customer Ledger, Supplier Ledger, Outstanding.

| Step | Task | Files |
|------|------|-------|
| A4.1 | Add `customerLedger()` to `ContactReportService` | Service + Query Object |
| A4.2 | Add `supplierLedger()` to `ContactReportService` | Service + Query Object |
| A4.3 | Add `outstanding()` to `ContactReportService` | Service |
| A4.4 | Create `CustomerLedger.tsx` frontend page | Frontend |
| A4.5 | Create `SupplierLedger.tsx` frontend page | Frontend |
| A4.6 | Add routes + sidebar | Routes + Sidebar |

**▶️ Go/No-Go:** Customer ledger balances match contact current_balance. Outstanding report shows correct unpaid invoices.

---

### Phase A5 — Dashboard & Exports (1 session)

**Objective:** Live dashboard KPIs, export buttons on all reports.

| Step | Task | Files |
|------|------|-------|
| A5.1 | Create `DashboardReportService` with `today()` + `alerts()` | Service |
| A5.2 | Wire DashboardController to use DashboardReportService | Controller |
| A5.3 | Add export buttons to all report pages | Frontend |
| A5.4 | Add export endpoints to each report controller | Controllers |
| A5.5 | Add print CSS for all report pages | CSS |
| A5.6 | Verify exports produce valid CSV and Excel files | Manual test |

**▶️ Go/No-Go:** Dashboard KPIs match manual counts. All reports can export to CSV/Excel/Print.

---

### Phase B — Financial Reports (future)

Only proceed once Payments, Expenses, and financial logic are fully validated.

| Step | Task | Depends On |
|------|------|------------|
| B.1 | Profit & Loss Report | Accurate COGS, all expense categories |
| B.2 | Cash Flow Statement | All financial transaction types stable |
| B.3 | Balance Sheet | Full accounting cycle validated |
| B.4 | Return Rate Analysis | Returns data matured |
| B.5 | Dead Stock Detection | Time-based InventoryTransaction queries |
| B.6 | ABC Analysis | Revenue contribution per product |

**▶️ Go/No-Go:** All 8 reports export to valid CSV and Excel files.

---

### Phase 5 — Product History + Day Book (1 session)

**Objective:** Single-product timeline and all-transactions view.

| Step | Task | Files |
|------|------|-------|
| 5.1 | Add `timeline()` to `ProductHistoryService` | Service |
| 5.2 | Fix Day Book to use UNION of all transaction sources | Service |
| 5.3 | Fix Cash Flow to use `FinancialTransaction` as source of truth | Service |

---

### Phase 6 — Permissions + Polish (1 session)

| Step | Task |
|------|------|
| 6.1 | Add Spatie permissions for report access |
| 6.2 | Gate report controllers |
| 6.3 | Gate frontend navigation links |
| 6.4 | Verify dark mode on all report pages |
| 6.5 | Verify mobile responsive on all report tables |

---

## 14. File Change Summary

### New Files

```
app/Domains/Reports/DTOs/ReportFilters.php
app/Domains/Reports/Services/SalesReportService.php
app/Domains/Reports/Services/PurchaseReportService.php
app/Domains/Reports/Services/InventoryReportService.php
app/Domains/Reports/Services/ContactReportService.php
app/Domains/Reports/Services/DashboardService.php
app/Domains/Reports/Services/ProductHistoryService.php
app/Domains/Reports/Services/ExportService.php
resources/js/Pages/reports/StockLedger.tsx
resources/js/Pages/reports/LowStockReport.tsx
resources/js/Pages/reports/CustomerLedger.tsx
resources/js/Pages/reports/SupplierLedger.tsx
resources/js/Pages/reports/ProductHistory.tsx
```

### Modified Files

```
app/Domains/Reports/Services/ReportService.php   ← Fix return detection + COGS (Phase 0)
app/Http/Controllers/ReportController.php         ← Add missing endpoints
routes/web.php                                    ← Wire routes to controller
app/Http/Controllers/DashboardController.php      ← Use DashboardService
resources/js/Pages/reports/SalesReport.tsx         ← Accept backend props
resources/js/Pages/reports/PurchaseReport.tsx      ← Accept backend props
resources/js/Pages/reports/StockReport.tsx         ← Accept backend props
resources/js/Pages/reports/PartyReport.tsx         ← Accept backend props
resources/js/layouts/Sidebar.tsx                   ← Add report navigation
```

---

## 15. Architecture Compliance Checklist

| Principle | Status | How |
|-----------|--------|-----|
| ✅ Reports consume transactions | Compliant | Every report queries from canonical data sources |
| ✅ No duplicate business logic | Compliant | Reuses existing `cost_price`, `running_balance`, `current_balance` |
| ✅ Inventory reports use `InventoryTransaction` | Compliant | Stock Ledger, Movement, Product History all from one table |
| ✅ Returns use polymorphic `Return` model | Needs fix | Legacy `RET-%` pattern must be replaced with `ReturnModel` |
| ✅ COGS uses actual cost data | Needs fix | `sale_items.cost_price` exists — report must use it instead of `selling_units.sale_price` |
| ✅ Thin controllers | Designed | Controllers only pass filters + return Inertia responses |
| ✅ Shared filtering architecture | Designed | `ReportFilters` DTO + frontend `ReportToolbar` |
| ✅ Reports support future modules | Designed | New transaction types = new filter option, not new architecture |
| ✅ Export is a shared capability | Designed | One `ExportService` for all reports |
| ✅ MVP prioritises operational value | Designed | 8 reports chosen for daily business decisions |
