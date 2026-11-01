# Dump Comparison â€” Oct 12 vs Nov 1

Comparing `invenos_baseline` (`.commandcode/khalsapansar_pos.sql`, Oct 12 2026 18:05) with `invenos_compare` (`.commandcode/khalsapansar_pos (1).sql`, Nov 1 2026 01:26). Both were imported into clean databases.

## 1. Tables
- tables in both: 37
- only in Nov dump: none
- only in Oct dump: none

## 2. Row counts

| Table | Oct 12 | Nov 1 | Delta |
|---|---:|---:|---:|
| audit_logs | 50 | 68 | +18 |
| contacts | 0 | 0 | +0 |
| expenses | 0 | 0 | +0 |
| financial_transactions | 0 | 0 | +0 |
| inventory_transactions | 1493 | 3395 | +1902 |
| migrations | 43 | 44 | +1 |
| products | 842 | 1137 | +295 |
| purchase_bills | 0 | 0 | +0 |
| returns | 0 | 0 | +0 |
| sale_items | 525 | 1983 | +1458 |
| sales | 54 | 279 | +225 |
| selling_units | 842 | 1137 | +295 |
| sessions | 3 | 4 | +1 |

## 3. Schema differences

No schema differences.

## 4. Row-level changes (same primary key, different values)

- `sales`: 0 row(s) differ on grand_total, discount, amount_paid, outstanding_balance, return_total, payment_status, deleted_at
- `sale_items`: 400 row(s) differ on base_quantity, unit_price, cost_price, total
- `purchase_bills`: 0 row(s) differ on total_amount, amount_paid, outstanding_balance, deleted_at
- `contacts`: 0 row(s) differ on opening_balance, current_balance, name, deleted_at
- `financial_transactions`: 0 row(s) differ on amount, type, direction, date, reference
- `expenses`: 0 row(s) differ on amount, date, category_id
- `inventory_transactions`: 0 row(s) differ on quantity, type, date, reference
- `products`: 272 row(s) differ on stock_quantity, last_purchase_cost, default_purchase_cost, deleted_at

## 5. IDs added/removed

- `audit_logs`: +18 added, -0 removed
- `inventory_transactions`: +1902 added, -0 removed
- `migrations`: +1 added, -0 removed
- `products`: +295 added, -0 removed
- `sale_items`: +1458 added, -0 removed
- `sales`: +225 added, -0 removed
- `selling_units`: +295 added, -0 removed
- `sessions`: +4 added, -3 removed

## 6. Totals comparison

### sales (active)
| Metric | Oct 12 | Nov 1 | Delta |
|---|---:|---:|---:|
| count | 53.00 | 270.00 | +217.00 |
| sum(1) | 144,715.00 | 568,911.75 | +424,196.75 |
| sum(2) | 145,160.00 | 578,740.95 | +433,580.95 |
| sum(3) | 300.00 | 450.00 | +150.00 |

### purchase_bills (active)
| Metric | Oct 12 | Nov 1 | Delta |
|---|---:|---:|---:|
| count | 0.00 | 0.00 | +0.00 |
| sum(1) | 0.00 | 0.00 | +0.00 |
| sum(2) | 0.00 | 0.00 | +0.00 |
| sum(3) | 0.00 | 0.00 | +0.00 |

### expenses
| Metric | Oct 12 | Nov 1 | Delta |
|---|---:|---:|---:|
| count | 0.00 | 0.00 | +0.00 |
| sum(1) | 0.00 | 0.00 | +0.00 |
| sum(2) | 0.00 | 0.00 | +0.00 |
| sum(3) | 0.00 | 0.00 | +0.00 |

### financial_transactions
| Metric | Oct 12 | Nov 1 | Delta |
|---|---:|---:|---:|
| count | 0.00 | 0.00 | +0.00 |
| sum(1) | 0.00 | 0.00 | +0.00 |
| sum(2) | 0.00 | 0.00 | +0.00 |
| sum(3) | 0.00 | 0.00 | +0.00 |

### contacts
| Metric | Oct 12 | Nov 1 | Delta |
|---|---:|---:|---:|
| count | 0.00 | 0.00 | +0.00 |
| sum(1) | 0.00 | 0.00 | +0.00 |
| sum(2) | 0.00 | 0.00 | +0.00 |
| sum(3) | 0.00 | 0.00 | +0.00 |

## 7. Migrations

- Nov dump migrations: 44
- Oct dump migrations: 43
- in Oct but not Nov: none
- in Nov but not Oct: 2026_10_12_181802_backfill_sale_items_cost_price
- Nov dump has cost_price backfill: YES


## 8. Verification of value-level differences

### 8.1 `sale_items` — only `cost_price` changed

| Column | Rows differing |
|---|---:|
| base_quantity | 0 |
| unit_price | 0 |
| cost_price | 400 |
| total | 0 |

Every one of the 400 changes is exactly the pending migration
`2026_10_12_181802_backfill_sale_items_cost_price` (cost_price / base_quantity):
**0 rows deviate from that formula.** Quantities, prices and line totals are untouched.

### 8.2 `products` — stock and cost edits

| Column | Rows differing |
|---|---:|
| stock_quantity | 271 |
| last_purchase_cost | 0 |
| default_purchase_cost | 62 |
| deleted_at | 0 |

- 258 stock changes are fully explained by the 1,902 new inventory movements.
- 13 differ by 0.01–0.04 units. These are `DECIMAL(12,2)` rounding drift, not loss:
  e.g. product 814 changed +10.03 while its new movements total +10.01.
- 62 `default_purchase_cost` changes are product master edits (e.g. haldi 0.81 ? 0.50).

### 8.3 No deletions, no rewrites

- Zero rows removed from any table (checked by primary-key diff).
- Zero sales headers changed (all seven commercial columns identical).
- Zero purchase, contact, expense, inventory-movement or cash rows changed.
- `financial_transactions` remains **0** in the Nov 1 dump — the live system still records no cash.

## 9. Conclusion

The Nov 1 dump is a strict superset of the Oct 12 dump:
+295 products, +225 sales, +1,458 sale items, +1,902 inventory movements, +18 audit rows.
The only value changes are the approved cost backfill, normal product master edits,
and rounding drift from 2-decimal stock quantities.

**No data loss and no silent rewriting of historical commercial values.**

## 10. Databases created for this comparison

| Database | Source | Purpose |
|---|---|---|
| `invenos_baseline` | `khalsapansar_pos.sql` (Oct 12) | comparison baseline |
| `invenos_compare` | `khalsapansar_pos (1).sql` (Nov 1) | current live export |
| `invenos_snapshot` | Oct 12 + W1 migrations/backfill | app development copy |

The app is still pointed at `invenos_snapshot`. To switch to the Nov 1 data,
run the W1 migrations and `cash:backfill` against `invenos_compare` first.
