# 17 — Testing & Regression Coverage

## 1. Test inventory

**VERIFIED.** 42 test files under `tests/`:

### Unit (4)
| File | Covers |
|---|---|
| `Unit/ExampleTest.php` | placeholder |
| `Unit/Backup/SqlSplitterTest.php` | SQL statement splitting |
| `Unit/Backup/SqlSanitizerTest.php` | GTID/session line removal |
| `Unit/Backup/BackupCipherTest.php` | encryption/decryption |

### Feature — products/lifecycle
| File | Asserts |
|---|---|
| `Feature/Products/ProductsTest.php` | service create, selling units, search, delete, HTTP create |
| `Feature/Products/ProductLifecycleTest.php` | delete blocked with transactions, delete/restore, blocker counts, Inertia lifecycle props |
| `Feature/Products/ArchivedProductTest.php` | archive hidden by default, archived filter, low-stock exclusion, detail/unarchive, sale/adjust guard, **legacy sale return on archived product** |

### Feature — inventory/costing
| File | Asserts |
|---|---|
| `Feature/Inventory/InventoryTest.php` | overview counts, status filter, movements, low stock, valuation keys |
| `Feature/Inventory/CostingTest.php` | pack→base conversion, weighted average, sale cost snapshot, uncosted quarantine/consumption, legacy pack fallback, null cost, opening cost precedence |

### Feature — sales/purchases/returns
| File | Asserts |
|---|---|
| `Feature/Sales/SalesTest.php` | sale create, stock decrement, insufficient stock, invalid customer, search |
| `Feature/Purchases/PurchasesTest.php` | purchase create, stock increase, invalid supplier, search, HTTP create |
| `Feature/Returns/ReturnServiceTest.php` | full/partial/credit-only refund, non-restock, double complete, reversal, over-return |
| `Feature/Returns/SaleReturnTest.php` | legacy sale return |
| `Feature/Returns/PurchaseReturnTest.php` | legacy purchase return |

### Feature — ledger/payments
| File | Asserts |
|---|---|
| `Feature/Ledger/PartyLedgerTest.php` | party statements |
| `Feature/Ledger/CashLedgerTest.php` | cash movement |
| `Feature/Payments/PaymentsTest.php` | payment recording |

### Feature — reports/dashboard
| File | Asserts |
|---|---|
| `Feature/Reports/ReportsTest.php` | sales summary, inventory counts, financial keys, profit metrics, soft-deleted sales excluded from COGS, dashboard keys |
| `Feature/Reports/FinancialReportsTest.php` | preset resolution, cash flow from receipts, balance sheet balancing |

### Feature — backup
| File | Asserts |
|---|---|
| `Feature/Backup/BackupServiceTest.php` | backup creation |
| `Feature/Backup/RestoreTest.php` | restore round trip |
| `Feature/Backup/RetentionTest.php` | retention |
| `Feature/Backup/BackupScheduleTest.php` | schedule |
| `Feature/Backup/BackupHttpTest.php` | HTTP endpoints |
| `Feature/Backup/BackupRecoverTest.php` | recovery |

### Feature — other
`Feature/Auth/*` (login, registration, password, email verification, confirmation),
`Feature/Settings/SettingsTest.php`, `Feature/Contacts/ContactsTest.php`,
`Feature/Branding/BrandingTest.php`, `Feature/Dashboard/DashboardTest.php`,
`Feature/Database/SalesTest.php`, `Feature/Database/ContactsTest.php`,
`Feature/Architecture/ArchitectureTest.php`, `Feature/ExampleTest.php`.

## 2. Test characteristics

- Every database test uses `RefreshDatabase`.
- `phpunit.xml` forces `APP_ENV=testing`, `DB_DATABASE=invenos_testing`, `BCRYPT_ROUNDS=4`.
- Tests call services directly in many cases (fast, no HTTP) and use Inertia assertions for
  page props.
- There are **no browser/E2E tests**, no frontend unit tests, and no CI workflow files in the
  repository root.

## 3. Known / likely pre-existing failures

The pre-existing untracked plan records 35 passed / 2 failed for
`tests/Feature/Products tests/Feature/Inventory tests/Feature/Sales`. This audit did **not**
re-run the suite, but the source supports both failures:

| Test | Why it likely fails |
|---|---|
| `ProductsTest::test_http_create` | posts to `/inventory` without `actingAs`; the route is behind `auth`, so it redirects to login and never sets `success` |
| `SalesTest::test_insufficient_stock_rejected` | expects `RuntimeException`, but `Product::$attributes` defaults `allow_negative_stock => true`, so the guard is bypassed and the sale succeeds |

**Regression note:** these must be resolved or explicitly quarantined before composition tests
are added, or the suite baseline is ambiguous.

## 4. Coverage gaps relevant to composition

**VERIFIED absent:**

- No tests for `PackagingDerivationEngine`, `ProductUnitService`, `ConversionGraphService`,
  `RelationshipGraphValidator`.
- No tests for `ProductService::update` (stock overwrite, packaging re-derive).
- No negative-stock matrix (`NULL`/true/false, `track_inventory=false`, `bypass`, `REV-`).
- No test for `TransactionEngine` (which would fail).
- No test for legacy writers' guard bypass.
- No COGS test with uncosted stock.
- No consistency test across the four valuation paths.
- No test for formula/consumption/production (nothing exists).
- No frontend tests for POS cart, product form or unit editor.
- No backup test that includes formula tables (they do not exist yet).

## 5. Tests that may fail when product serialization/schema changes

| Change | At-risk tests |
|---|---|
| Add composition relation to `Product` | tests using `toArray()`/Inertia product props (Archive, Lifecycle, Products) |
| Add columns to `products` | factory-less `Product::create` tests are tolerant unless columns are required |
| Change `sale_items.cost_price` behavior | `CostingTest`, `FinancialReportsTest`, `ReportsTest` |
| Add consumption movements | `InventoryTest` (movement counts), `ReportsTest` (stock summary) |
| Change return behavior | `ReturnServiceTest`, `SaleReturnTest`, `ArchivedProductTest` |
| Change `ProductPolicy` blockers | `ProductLifecycleTest` |
| Add permissions | auth/HTTP tests (if they start asserting 403) |

## 6. Required new tests

### P0 — integrity
1. Product update cannot change `stock_quantity` (or must create an adjustment).
2. `InventoryService::recordConsumption` applies one negative ledger row and updates status.
3. Negative-stock matrix: NULL / true / false, `track_inventory=false`, `bypass`,
   `REV-` prefix.
4. `stock:reconcile` reports zero mismatches after a sale/purchase/return.
5. Unauthorized roles cannot create/edit/delete products (once enforced).

### P1 — schema/domain
6. Composition create/update validation: self-reference, duplicate component, archived
   component, zero/negative quantity, incompatible unit.
7. Cycle detection (A→B→A) and depth cap.
8. Saving a formula creates no inventory movement.
9. Formula versioning: editing creates a new version or increments; old runs keep their snapshot.

### P3 — execution
10. Consumption of N components writes N `consumption` movements and one run + items.
11. Insufficient component rejects the whole run with **zero** movements.
12. Actual override changes run item quantities but not template.
13. Component cost snapshot equals `CostResolver` at execution.
14. Reversal restores components and marks the run reversed.
15. `SUM(ledger) == products.stock_quantity` after every run.

### P4 — POS
16. Selling a consumption product without an override uses the template × quantity.
17. Selling with overrides consumes the overridden quantities.
18. A shortage blocks the sale; no sale row, no sale items, no movements.
19. A composite sale creates one sale item and no component sale items.
20. Duplicate submit with the same idempotency key creates one sale/run.

### P5 — costing
21. Composite COGS equals rolled component cost.
22. Changing a component cost after the sale does not change the historical COGS.
23. Unknown component cost is disclosed, not treated as zero.

### P6 — returns
24. Returning a service refunds cash and does not restock components.
25. Returning an assembled composite restocks the finished good only.
26. Reversing a return compensates consumption if the business allows it.

### P7 — reports
27. Stock report separates purchased/sold/consumed/produced.
28. Valuation includes produced stock at its rolled cost.
29. Top products lists commercial products only.

### P8 — portability
30. Backup/restore round trip includes composition tables and run history.
31. Restoring a pre-composition backup into the new app succeeds and leaves empty tables.

## 7. Regression matrix

| Area | Existing tests | Add before change | Add after change | Pass criterion |
|---|---|---|---|---|
| Product CRUD | ProductsTest, LifecycleTest, ArchivedTest | serialization snapshot | composition props | all existing pass |
| Product edit stock | none | test that stock can't be overwritten | – | no direct stock write |
| Units/packaging | none | derivation tests | formula unit compatibility | existing behavior unchanged |
| Purchase create | PurchasesTest, CostingTest | pack validation | component purchase | stock/average correct |
| Purchase return | PurchaseReturnTest | – | composite purchase rule | existing pass |
| Sale create | SalesTest, CostingTest | price/total validation | consumption | existing pass + no component sale lines |
| POS HTTP | none | – | consumption payload | one sale, one run |
| Sale delete | LifecycleTest (sales) | – | run handling | stock ledger consistent |
| Sale return | ReturnServiceTest, SaleReturnTest | – | service refund | no component restoration |
| Inventory | InventoryTest, CostingTest | negative matrix | consumption bucket | no drift |
| Reports | ReportsTest, FinancialReportsTest | valuation consistency | consumption/production | no misleading totals |
| Dashboard | DashboardTest | – | formula availability | existing pass |
| Backup | 6 backup tests | – | composition tables | round trip |
| Auth/permissions | Auth tests | composition permissions | – | 403 for unauthorized |
| Architecture | ArchitectureTest | – | new domain directories | pass |

## 8. Test execution notes

- Run with `php artisan test` or `vendor/bin/phpunit`.
- Ensure `invenos_testing` exists (it does on this machine).
- `phpunit.xml` forcibly overrides DB env, so the shell's `DB_DATABASE` does not leak.
- A full run was not part of this audit; no tests were executed.

## 9. Findings summary

1. **VERIFIED:** 42 test files; strong coverage of costing, returns, lifecycle, reports, backup.
2. **VERIFIED:** no frontend/E2E tests and no composition coverage.
3. **VERIFIED:** two pre-existing tests are inconsistent with current code.
4. **PROPOSED:** the 31 tests above as the acceptance backbone for each phase.
