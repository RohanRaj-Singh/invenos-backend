# Invenos POS — Backend Implementation Order

Implement in this order. Each phase depends on the previous one. Authentication comes last because the domain must exist before permissions can be designed.

---

## Phase 1: Database Schema

All migrations, foreign keys, indexes, and constraints. No business logic, no UI wiring.

1. `users` — Base user table
2. `settings` — Singleton configuration, JSON values
3. `contacts` — Unified CRM (roles as JSON)
4. `product_categories` — Product groupings
5. `products` — Core product model with base unit
6. `selling_units` — How customers buy
7. `sales` — Sale headers (with customer_id FK to contacts)
8. `sale_items` — Sale line items
9. `purchase_bills` — Purchase headers (with supplier_id FK to contacts)
10. `purchase_bill_items` — Purchase line items
11. `expense_categories` — Expense groupings
12. `expenses` — Expense records
13. `inventory_transactions` — Stock movement ledger
14. `financial_transactions` — Money movement ledger
15. `permission_tables` — Spatie permissions

---

## Phase 2: Core Models & Services

Eloquent models with relationships only. No business logic yet.

1. `Contact` — With roles cast, customer/supplier scopes
2. `Product` — With selling units relationship
3. `Category` — Product categories
4. `User` — With Spatie permission traits
5. `Setting` — Singleton, cached

---

## Phase 3: Settings Module

First working module. Establishes the service → controller → Inertia pattern.

1. `SettingService` — CRUD with cache
2. `SettingsController` — Inertia-backed
3. Replace settings mock store

---

## Phase 4: Contacts Module

Perfect first full CRUD — teaches the architecture that every module follows.

1. `ContactService` — CRUD with role management, balance tracking
2. `ContactController` — Inertia-backed
3. Replace contacts mock store
4. Verify: unified listing, role filtering, statements, balance sync

---

## Phase 5: Products & Categories

1. `CategoryService` + `CategoryController`
2. `ProductService` + `ProductController`
3. Replace product/category mock stores
4. Verify: CRUD, selling units, purchase config, stock display

---

## Phase 6: Inventory

1. `InventoryService` — Stock ledger, adjustments, status recalculation
2. `InventoryController` — Adjustment endpoint
3. Replace inventory mock store
4. Verify: purchase increases stock, sale decreases stock, manual adjustments work

---

## Phase 7: Purchases

1. `PurchaseService` — Create purchase, process payments, update inventory, record financials
2. `PurchaseController` — Inertia-backed
3. Replace purchases mock store
4. Verify: full purchase flow, supplier payable tracking, inventory increase

---

## Phase 8: Purchases Returns

1. Extend `PurchaseService` — Return processing with inventory reversal
2. `PurchaseReturnController`
3. Replace returns mock store (purchase side)
4. Verify: inventory decreases, refund recorded, supplier balance updated

---

## Phase 9: Sales

1. `SaleService` — Create sale, process payments, deduct inventory, record financials
2. `POSController` — Inertia-backed
3. Replace sales + POS mock stores
4. Verify: full sale flow with discounts, customer payments, inventory deduction

---

## Phase 10: Sale Returns

1. Extend `SaleService` — Return processing with inventory restoration
2. `SaleReturnController`
3. Replace returns mock store (sale side)
4. Verify: inventory restored, refund recorded, customer balance updated

---

## Phase 11: Expenses

1. `ExpenseService` + `ExpenseCategoryService`
2. `ExpenseController` + `ExpenseCategoryController`
3. Replace expense mock stores
4. Verify: full expense CRUD, category stats, dashboard integration

---

## Phase 12: Reports

1. `ReportService` — Day book, cash flow, P&L, stock, sales, purchase, party statement
2. Report controllers (one per report, or grouped)
3. Replace reports-data.ts mock
4. Verify: all 8 reports match prototype output

---

## Phase 13: Dashboard

1. `DashboardService` — Stats aggregation, activity feed
2. `DashboardController`
3. Replace dashboard mock stats
4. Verify: all widgets live, stats match operations

---

## Phase 14: Authentication & Permissions

Now that every module exists, permissions are obvious.

1. Sanctum token login/logout
2. Spatie permission seeder (mirroring frontend PERMISSION_GROUPS)
3. Middleware on all routes
4. Policies for every domain
5. Permission-based UI visibility via Inertia props
6. Replace auth mock store
7. Verify: login, logout, route protection, action authorization

---

## Dependency Map

```
Database Schema (all migrations)
    ↓
Core Models (relationships only)
    ↓
Settings → Contacts → Products → Inventory → Purchases → Sales → Returns
    │                                           ↓            ↓
    │                                      Expenses → Reports → Dashboard
    ↓                                                  ↓
Contacts → Auth (last — after every permission need is known)
```
