# Phase 0 — Database Profile (W0, executed)

**Repository:** `invenos-backend` · **Branch:** `master` · **HEAD:** `0ee9592`
**Date:** 2026-11-01
**Dataset:** `.commandcode/khalsapansar_pos.sql` imported into a dedicated local database **`invenos_snapshot`** (MySQL 9.5.0). The configured dev database `invenos` was **not** modified.
**Code changes:** none. Only read-only queries and report services were executed against the imported copy.

Tag legend: **VERIFIED** · **ASSUMPTION** · **UNKNOWN** · **RECOMMENDATION**

---

## 1. Access and Method

| Item | Result |
|---|---|
| Production database accessible? | **No** — no production credentials in this environment. |
| Credentials exposed? | **No.** Only the configured DB user/password were read from `.env` at runtime to connect; nothing was printed. |
| Data used for verification | The repository snapshot, imported into **`invenos_snapshot`**. |
| Import result | Success: 842 products, 842 selling units, 54 sales, 525 sale items, 1,493 inventory movements, 2 users. |
| Snapshot age | Generated **2026-10-12 18:05** from MariaDB 10.11.16. |
| Pending migration found | `2026_10_12_181802_backfill_sale_items_cost_price` had **not** run in the snapshot (migration timestamp 18:18). It was applied **to the scratch copy only** so verification reflects current code. |

**Production profiling is still pending.** §11 contains the query pack; the results below are from the snapshot and must be re-confirmed against production.

---

## 2. Schema Confirmation (VERIFIED, imported DB)

| Check | Result |
|---|---|
| Money precision | `DECIMAL(12,2)` throughout — matches Laravel's default `$places = 2` |
| `financial_transactions.contact_id` | `NOT NULL` |
| `financial_transactions` columns | `linked_sale_id` only; **no** `linked_purchase_id`, no reversal/source columns |
| `financial_transactions.type` | `invoice, collection, advance, refund, adjustment, payout` |
| `inventory_transactions.type` | `purchase, sale, return, adjustment, damage, consumption` — **no** `sale-return` / `purchase-return` |
| `products.stock_quantity` / `inventory_transactions.quantity` | `DECIMAL(12,2)` |
| `sale_items.base_quantity` | `DECIMAL(12,4)` — inconsistent with the movement precision |
| Migrations | All 44 ran after applying the pending cost backfill to the scratch copy |

**Decimal-drift claim retracted:** no drift exists.

---

## 3. Entity Counts (imported snapshot)

| Table | Rows |
|---|---:|
| `products` | 842 (32 soft-deleted, 810 active) |
| `selling_units` | 842 |
| `product_units` | 26 |
| `product_packaging` | **0** |
| `sales` | 54 (1 soft-deleted, 53 active) |
| `sale_items` | 525 |
| `purchase_bills` | **0** |
| `purchase_bill_items` | **0** |
| `contacts` | **0** |
| `inventory_transactions` | 1,493 |
| `financial_transactions` | **0** |
| `expenses` | **0** |
| `returns` / `return_items` | **0 / 0** |
| `users` | 2 |

**This is a walk-in cash retail business.** No customer, supplier, purchase, expense or return has ever been recorded.

---

## 4. Financial Baseline (imported snapshot)

| Metric | Value |
|---|---:|
| Sales (active) | 53 |
| `SUM(grand_total)` | 144,715.00 |
| `SUM(amount_paid)` | **145,160.00** |
| `SUM(outstanding_balance)` | 300.00 |
| Sales with `amount_paid > grand_total` | 1 |
| Sale-item line revenue (`SUM(total)`) | 264,269.50 |
| `SUM(discount)` | 118,694.00 (45% of line revenue) |
| Sales with 100% discount and `grand_total = 0` but `payment_status='paid'` | 10 |
| Purchases | 0 |
| Expenses | 0 |
| Returns | 0 |

**VERIFIED anomalies:** payments exceed invoice value by 445.00; 53 sales report 145,160 paid while no cash row exists; 10 "paid" sales have zero value; a 45% aggregate discount.

---

## 5. Cash Profile

| Check | Value |
|---|---:|
| `financial_transactions` rows | **0** |
| Invoice-type rows | 0 |
| Linked collections | 0 |
| Unlinked collections | 0 |
| Payouts | 0 |
| Opening adjustments | 0 |
| Sales with `amount_paid > 0` and **no** collection row | **43 of 53** |

**Empirical proof:** `FinancialReportService::overview()` for Aug–Oct 2026 returns

```
total_sales       144,715
cash_balance            0
cash_flow.in            0
cash_flow.out           0
```

and `DayBookReportService` returns `cash_received = cash_paid = closing_balance = 0` for the same period with 1,021 events.

**Conclusion:** cash reporting is not merely inaccurate — it reports **zero** for a business that collected Rs 145,160. This is the single strongest justification for W1.

---

## 6. Payment Linkage

| Record | Linkage | Classification |
|---|---|---|
| Sale initial payment | No row exists; amount survived only in `sales.amount_paid` | **Reliable to create** (43 documents) with the guard in §6.3 |
| Additional collection via `PaymentService` | `linked_sale_id` set (`PaymentService.php:83-91`) | Reliable |
| Additional collection via generic `PaymentController::store` | Contact-only | Ambiguous |
| Purchase initial payment | No row, no purchase column | **Unrecoverable per bill** |
| Supplier payout | No purchase column anywhere | **Unrecoverable per bill** |
| Expense payment | No row; one row per expense derivable | Reliable (derived) |

Backfill guard (no row unless all hold): document exists and is active; `amount_paid > Σ linked cash rows`; no unlinked generic payment from the same contact with a matching amount within the date window; row tagged for reversal.

---

## 7. Party Reconciliation

`contacts` is empty in this dataset, so reconciliation cannot be exercised. The query in §11 is ready for production.

**Code-level defect [VERIFIED]:** `SaleService.php:173-177` adds `grand_total` to `current_balance` without subtracting the initial `amount_paid`; `PurchaseService.php:150-151` does the same. On this dataset it is latent (no contacts); on a party-based install it overstates every partially paid invoice.

---

## 8. Inventory Reconciliation

| Check | Value |
|---|---:|
| Products with `stock_quantity ≠ SUM(movements)` | **1** (`gluta skin polish`: stored 6, ledger 7) |
| Negative-stock products | **7** |
| Products with stock but **no `INITIAL` movement** | **297** |
| Products with stock but **no purchase movement** | **698** |
| Movement types present | `adjustment` 968 rows (+490,239.75); `sale` 525 rows (−46,196.91) |
| `purchase` / `return` movements | **0** |
| Base units | `g` 424, `piece` 302, `bottle` 58, `kg` 31, `packet` 26, `box` 1 |
| kg products with fractional stock | 7 |
| Fractional movements | 12 |

Negative-stock products (unreliable valuation): `maghaz kdoo` −290 g, `roghan amla` −100 g, `phool mkhana` −10 g, `sarso cooking oil` −9 bottles, `arq gulab` −2, `apple sirka` −1, `pholl mkhana 50 gram` −1.

**Sign convention confirmed:** purchases +, sales −, adjustments caller-signed, opening stock + (`INITIAL`). The single mismatch is a broken ledger chain, not a sign error.

---

## 9. Costing Assessment (the critical finding)

### 9.1 The legacy columns

| Column | Basis | Evidence |
|---|---|---|
| `last_purchase_cost` | **Per purchase pack** | `PurchaseService.php:85,108,132`; `PurchaseBill.tsx:186,209,277` |
| `default_purchase_cost` | Per pack (purchase) / user-entered (product form) | `CreateProductData.php:41,53` |
| `purchase_bill_items.unit_cost` | Per pack | `PurchaseService.php:127-128` |

### 9.2 What the data shows

- **0 purchase lines** exist, so no cost can be derived arithmetically from purchases.
- **358 products** have neither `last_purchase_cost` nor `default_purchase_cost`.
- **484 products** carry a legacy cost; all of it is **user-entered**, not purchase-derived.
- The unit basis is **inconsistent with `base_unit_id`**: e.g. product 165 (`g` base) has `default_purchase_cost = 36.00`; whether that means per gram or per kg cannot be determined from the data.
- Implied legacy valuation: `Σ stock × legacy cost = 2,468,601.85`.
- The app simultaneously reports two inventory values:
  - `InventoryReportService` (cost basis): **2,463,382**
  - `InventoryService::getOverview` (selling-price basis): **3,272,272**

### 9.3 Sale-item cost column

The snapshot **predates** `2026_10_12_181802_backfill_sale_items_cost_price`, which divides `sale_items.cost_price` by `base_quantity`. Before it, COGS was squared by quantity:

| State | COGS | Gross profit | Margin |
|---|---:|---:|---:|
| Snapshot as dumped (pre-migration) | 16,782,417 | −16,592,971 | −11,466% |
| After applying the pending migration | 109,649 | 35,066 | 24.2% |

**This is a migration-ordering finding, not just a data one:** any deployment that runs the app against a database where that backfill has not run will report a catastrophic loss. Production must be checked for this migration explicitly.

### 9.4 Cost-source hierarchy (RECOMMENDATION)

```
1. products.average_cost                          exact      (post cut-over)
2. products.opening_cost                          exact      (business-declared, per base unit)
3. latest purchase line: total_cost / base_qty    estimated
4. last_purchase_cost / pack_qty (pack_qty > 1)   estimated
5. default_purchase_cost / pack_qty (pack_qty>1)  estimated
6. otherwise                                      unavailable  ← never invented
```

For **this dataset**, step 3 is impossible (no purchases) and steps 4-5 are ambiguous (unit basis unproven). Every product is therefore **estimated or unavailable**; none is exact.

### 9.5 Opening stock

698 products have stock with no purchase. Opening cost is unknown for all of them.

| State | Representation | Quality |
|---|---|---|
| Business supplies cost | `products.opening_cost` (per base unit) | exact |
| Approximation | same column, UI marks it estimated | estimated |
| No cost | `NULL` | unavailable |

Weighted average covers **costed quantity only**; uncosted quantity is disclosed separately (`"750 exact + 100 units uncosted"`), never blended into 7.50.

### 9.6 Precision

| Column | Type | Risk |
|---|---|---|
| `products.stock_quantity` | `DECIMAL(12,2)` | 7 kg products already carry fractional stock; 1 g = 0.001 kg cannot be represented |
| `inventory_transactions.quantity` | `DECIMAL(12,2)` | same rounding per movement |
| `sale_items.base_quantity` | `DECIMAL(12,4)` | inconsistent |
| cost columns | `DECIMAL(12,2)` / proposed `(12,4)` | insufficient for mg-level |

Recommendation: cost `DECIMAL(14,6)`; quantities `DECIMAL(14,4)` after confirming live data (widening is non-destructive). Until then, disclose `quantity_precision: 2dp`.

---

## 10. Returns

| Check | Value |
|---|---:|
| `returns` / `return_items` | 0 / 0 |
| `RET-` sales / `PRET-` purchases | 0 / 0 |
| Return inventory movements | 0 |
| `sale-return` / `purchase-return` movements | impossible (enum) |

The code paths remain broken regardless of data: `ReturnService::completeReturn()` has no caller, `TransactionEngine` calls a private method, and the enum rejects the return types. Nothing in this dataset exercises returns; W2 must be tested with a purpose-built fixture.

---

## 11. Production Query Pack (unchanged, read-only)

```sql
-- 0. Schema
SHOW CREATE TABLE financial_transactions;
SHOW CREATE TABLE inventory_transactions;
SHOW COLUMNS FROM products;
SHOW COLUMNS FROM contacts;
SELECT migration FROM migrations ORDER BY id DESC LIMIT 10;
SELECT migration FROM migrations WHERE migration LIKE '%backfill_sale_items_cost_price%';

-- 1. Counts
SELECT 'products' t, COUNT(*) n FROM products
UNION ALL SELECT 'selling_units', COUNT(*) FROM selling_units
UNION ALL SELECT 'product_packaging', COUNT(*) FROM product_packaging
UNION ALL SELECT 'sales', COUNT(*) FROM sales
UNION ALL SELECT 'sale_items', COUNT(*) FROM sale_items
UNION ALL SELECT 'purchase_bills', COUNT(*) FROM purchase_bills
UNION ALL SELECT 'purchase_bill_items', COUNT(*) FROM purchase_bill_items
UNION ALL SELECT 'contacts', COUNT(*) FROM contacts
UNION ALL SELECT 'inventory_transactions', COUNT(*) FROM inventory_transactions
UNION ALL SELECT 'financial_transactions', COUNT(*) FROM financial_transactions
UNION ALL SELECT 'expenses', COUNT(*) FROM expenses
UNION ALL SELECT 'returns', COUNT(*) FROM returns
UNION ALL SELECT 'return_items', COUNT(*) FROM return_items;

-- 2. Totals
SELECT COUNT(*) n, COALESCE(SUM(grand_total),0) total, COALESCE(SUM(amount_paid),0) paid,
       COALESCE(SUM(outstanding_balance),0) outstanding FROM sales WHERE deleted_at IS NULL;
SELECT COUNT(*) n, COALESCE(SUM(total_amount),0) total, COALESCE(SUM(amount_paid),0) paid,
       COALESCE(SUM(outstanding_balance),0) outstanding FROM purchase_bills WHERE deleted_at IS NULL;
SELECT COUNT(*) n, COALESCE(SUM(amount),0) total FROM expenses;

-- 3. Cash (invoice rows excluded)
SELECT type, direction, COUNT(*) n, COALESCE(SUM(amount),0) total
  FROM financial_transactions GROUP BY type, direction ORDER BY type;
SELECT COUNT(*) invoice_rows FROM financial_transactions WHERE type='invoice';
SELECT COUNT(*) opening_rows FROM financial_transactions WHERE reference='OPENING';
SELECT COUNT(*) null_contact FROM financial_transactions WHERE contact_id IS NULL;
SELECT COUNT(*) linked_collections FROM financial_transactions
 WHERE type='collection' AND linked_sale_id IS NOT NULL;
SELECT COUNT(*) unlinked_collections FROM financial_transactions
 WHERE type='collection' AND linked_sale_id IS NULL;
SELECT COUNT(*) payouts FROM financial_transactions WHERE type='payout';

-- 4. Payment linkage
SELECT COUNT(*) sales_paid_without_collection FROM sales s
 WHERE s.amount_paid > 0 AND s.deleted_at IS NULL
   AND NOT EXISTS (SELECT 1 FROM financial_transactions ft
                    WHERE ft.linked_sale_id=s.id AND ft.type='collection');
SELECT s.id, s.invoice_number, s.amount_paid,
       COALESCE((SELECT SUM(ft.amount) FROM financial_transactions ft
                  WHERE ft.linked_sale_id=s.id AND ft.type='collection'),0) collected,
       s.amount_paid - COALESCE((SELECT SUM(ft.amount) FROM financial_transactions ft
                  WHERE ft.linked_sale_id=s.id AND ft.type='collection'),0) missing
  FROM sales s
 WHERE s.deleted_at IS NULL AND s.amount_paid > 0
HAVING missing > 0 ORDER BY missing DESC LIMIT 100;

-- 5. Parties
SELECT SUM(JSON_CONTAINS(roles,'"customer"')) customers,
       SUM(JSON_CONTAINS(roles,'"supplier"')) suppliers,
       SUM(opening_balance <> 0) opening_nonzero,
       SUM(current_balance <> 0) balance_nonzero,
       SUM(current_balance < 0) negative_balance
  FROM contacts WHERE deleted_at IS NULL;

SELECT c.id, c.name, c.opening_balance, c.current_balance,
       c.opening_balance
     + COALESCE((SELECT SUM(s.grand_total) FROM sales s
                  WHERE s.customer_id=c.id AND s.deleted_at IS NULL
                    AND s.invoice_number NOT LIKE 'RET-%'),0)
     - COALESCE((SELECT SUM(ft.amount) FROM financial_transactions ft
                  WHERE ft.contact_id=c.id AND ft.direction='in'
                    AND ft.type IN ('collection','advance','adjustment')
                    AND ft.reference <> 'OPENING'),0)
     - COALESCE((SELECT SUM(r.grand_total) FROM returns r
                  WHERE r.contact_id=c.id AND r.type='SALE' AND r.status='completed'),0) derived
  FROM contacts c
HAVING ABS(derived - c.current_balance) > 1 LIMIT 100;

-- 6. Inventory (signed)
SELECT COUNT(*) mismatched FROM (
  SELECT p.id, p.stock_quantity, COALESCE(SUM(it.quantity),0) ledger_qty
    FROM products p LEFT JOIN inventory_transactions it ON it.product_id=p.id
   GROUP BY p.id, p.stock_quantity
  HAVING ABS(p.stock_quantity - COALESCE(SUM(it.quantity),0)) > 0.005
) t;
SELECT id, name, base_unit_id, stock_quantity FROM products WHERE stock_quantity < 0;
SELECT COUNT(*) no_initial FROM products p WHERE p.stock_quantity <> 0
   AND NOT EXISTS (SELECT 1 FROM inventory_transactions it
                    WHERE it.product_id=p.id AND it.reference='INITIAL');

-- 7. Costing
SELECT COUNT(*) missing_both FROM products
 WHERE last_purchase_cost IS NULL AND default_purchase_cost IS NULL;
SELECT COUNT(*) pack_gt_1 FROM purchase_bill_items WHERE purchase_pack_qty > 1;
SELECT p.id, p.name, p.base_unit_id, p.stock_quantity, p.last_purchase_cost,
       p.default_purchase_cost, pbi.purchase_pack_qty, pbi.purchase_quantity,
       pbi.unit_cost, pbi.total_cost,
       (pbi.total_cost / NULLIF(pbi.purchase_pack_qty*pbi.purchase_quantity,0)) cost_per_base
  FROM products p JOIN purchase_bill_items pbi ON pbi.product_id=p.id
 ORDER BY pbi.id DESC LIMIT 50;
SELECT SUM(stock_quantity * COALESCE(last_purchase_cost, default_purchase_cost, 0)) legacy_value
  FROM products WHERE track_inventory = 1;

-- 8. Precision
SELECT COUNT(*) kg_fractional FROM products
 WHERE base_unit_id IN ('kg','kilogram') AND stock_quantity <> ROUND(stock_quantity,0);
SELECT COUNT(*) fractional_movements FROM inventory_transactions WHERE quantity <> ROUND(quantity,0);

-- 9. Returns
SELECT status, type, COUNT(*) n, COALESCE(SUM(grand_total),0), COALESCE(SUM(refund_amount),0)
  FROM returns GROUP BY status, type;
SELECT COUNT(*) ret_sales FROM sales WHERE invoice_number LIKE 'RET-%';
SELECT COUNT(*) pret_purchases FROM purchase_bills WHERE invoice_ref LIKE 'PRET-%';
```

---

## 12. Classification

| Data | Reliable | Estimated | Ambiguous | Unrecoverable |
|---|---|---|---|---|
| Sale documents, items, IDs, invoice refs | ✅ | | | |
| Sale initial payment (existence + amount) | ✅ | | | |
| Sale initial payment cash row | ✅ to create (43 rows) | | | |
| Purchase initial payment | | | | ✅ |
| Additional collection (linked) | ✅ | | | |
| Additional collection (generic) | | | ✅ | |
| Supplier payout | | | | ✅ |
| Expense payment | ✅ (derived) | | | |
| Product legacy cost | | | ✅ (unit basis unproven) | |
| Historical COGS | | ✅ (after backfill) | | |
| `RET-`/`PRET-` | n/a (none) | | | |
| `contacts.current_balance` | | | ✅ (empty dataset) | |
| `stock_quantity` | ✅ 809 products | | ✅ 1 product | |

---

## 13. Cut-Over Date

**RECOMMENDATION:** end of the month preceding W1 activation, stored in settings and disclosed on every report. Before it: no cash rows for walk-ins, no movement-level cost, no purchase cost history → **estimated**. After it: exact.

---

## 14. Business Decisions Required

| # | Decision | Recommendation |
|---|---|---|
| B-1 | `products.opening_cost` (nullable, per base unit) | Approve |
| B-2 | Widen quantity columns to `DECIMAL(14,4)` | Approve (7 kg products already fractional) |
| B-3 | Cost columns at `DECIMAL(14,6)` | Approve |
| B-4 | Cut-over date | End of preceding month |
| B-5 | Supplier payment history labelled unrecoverable | Approve |
| B-6 | Historical cash labelled partial before cut-over | Approve |
| B-7 | Are 10 zero-value "paid" sales legitimate? | Investigate |
| B-8 | Legacy cost: require the business to re-enter costs, or accept estimated? | Recommend re-entry for stocked products |
| B-9 | Correct balances/stock after reconciliation, or report only? | Report first |
| B-10 | Confirm production has run `2026_10_12_181802_backfill_sale_items_cost_price` | Mandatory before any COGS report |

---

## 15. W1 Readiness

1. **Architecture still valid?** Yes. Verified empirically: no new tables needed; one nullable `opening_cost`, additive cash-ledger columns, enum extension.
2. **Five concerns resolved?** Yes, and the dataset confirmed each: pack/unreliable costs, purchase-linkage unrecoverable, reversal order, signed quantities, precision.
3. **Safe to backfill?** 43 sale receipts (guarded), expense payouts (none here), `unit_cost_base` only where purchase lines exist (none here).
4. **Untouched:** all documents, `sale_items.cost_price` (except the already-approved migration), `last_purchase_cost`, `stock_quantity`, `current_balance`, references, legacy return rows.
5. **Decisions:** B-1…B-10.
6. **Can W1 start?** On the **scratch database**, yes — the dataset is now available and reproducible. On **production**, only after §11 is run there and B-1…B-4 are answered.
7. **W1 surface:** migrations (FT nullable + source/event/reversal columns, `products.opening_cost`, inventory enum), models (`FinancialTransaction`, `Product`, `InventoryTransaction`), services (`SaleService`, `PurchaseService`, `PaymentService`, `ContactService`, `InventoryService`, new `CashLedgerService`, `PartyBalance`), controllers (`PaymentController`, `ExpenseController`), policies (`SalePolicy`, `PurchasePolicy`), requests, commands (`cash:backfill --dry-run`, `parties:reconcile`, `stock:reconcile`).
8. **Tests:** sale paid/partial/credit/walk-in; purchase paid/partial; collection/payout linkage + date; payment deletion reversal; expense payout; §3.2 invariants; backfill dry-run and idempotent second run; reconcile zero unexplained deltas on this dataset.

---

## 16. Reproducibility

```
Database: invenos_snapshot (MySQL 9.5.0)
Source:   .commandcode/khalsapansar_pos.sql (MariaDB 10.11 dump, 2026-10-12 18:05)
Import:   CREATE DATABASE invenos_snapshot; \n
          mysql -u <user> -D invenos_snapshot < khalsapansar_pos.sql
Pending:  php artisan migrate --force   (applies 2026_10_12_181802 only)
Config:   DB_DATABASE=invenos_snapshot (process env; .env untouched)
```

The `invenos` dev database remains unchanged (empty). The scratch database contains only imported data and is safe to drop.

---

**W0 status: executed against the imported snapshot; production profiling still pending.** No source, migration, schema or controller file was modified. The only database write was the approved pending migration applied to the scratch copy `invenos_snapshot`, plus the import itself.
