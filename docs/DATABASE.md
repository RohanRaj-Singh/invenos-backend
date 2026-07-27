# Invenos POS — Database Reference

This is the **living data model reference**. It describes every table, its purpose, relationships, indexes, and business rules. Read this before writing or reviewing migrations.

---

## 1. `contacts`

**Purpose:** Unified CRM entity. A single contact can act as customer, supplier, patient, or any combination of roles.

| Column | Type | Required | Default | FK | Notes |
|--------|------|----------|---------|----|-------|
| id | bigInteger | ✓ | — | — | Primary key |
| type | enum | ✓ | 'person' | — | person, organization |
| roles | json | ✓ | [] | — | Array: customer, supplier, patient, etc. |
| name | string(255) | ✓ | — | — | Display name |
| company_name | string(255) | — | null | — | For organizations |
| contact_person | string(255) | — | null | — | For organizations |
| phone | string(50) | ✓ | — | — | |
| email | string(255) | — | null | — | |
| cnic | string(20) | — | null | — | National ID |
| address | text | — | null | — | |
| opening_balance | decimal(12) | ✓ | 0 | — | |
| balance_type | enum | ✓ | 'receivable' | — | receivable, payable |
| current_balance | decimal(12) | ✓ | 0 | — | Self-healing cached field |
| notes | text | — | null | — | |
| created_by | string(255) | — | null | — | |
| created_at | timestamp | ✓ | — | — | |
| updated_at | timestamp | ✓ | — | — | |
| deleted_at | timestamp | — | null | — | Soft delete |

**Indexes:** `name`, `phone`, `deleted_at`
**Business rules:**
- A contact can have multiple roles simultaneously
- `current_balance` is recomputed from all `financial_transactions` for that contact
- `opening_balance` is used once during initialization, never modified after
- Soft delete preserves transaction history

---

## 2. `settings`

**Purpose:** Singleton configuration row. Contains all application settings as a single JSON document.

| Column | Type | Required | Default | Notes |
|--------|------|----------|---------|-------|
| id | bigInteger | ✓ | — | Primary key (always 1) |
| values | json | ✓ | — | Full AppSettings object |
| created_at | timestamp | ✓ | — | |
| updated_at | timestamp | ✓ | — | |

**Access pattern:** Cached globally on boot. Flushed on update. Single row — no FK relationships.

---

## 3. `users`

**Purpose:** System users with role-based permissions.

| Column | Type | Required | Default | FK | Notes |
|--------|------|----------|---------|----|-------|
| id | bigInteger | ✓ | — | — | |
| name | string(255) | ✓ | — | — | |
| username | string(100) | ✓ | — | — | Unique |
| email | string(255) | — | null | — | Unique |
| password | string(255) | ✓ | — | — | Hashed via bcrypt |
| phone | string(50) | — | '' | — | |
| role | enum | ✓ | 'salesman' | — | admin, salesman |
| active | boolean | ✓ | true | — | |
| last_login | datetime | — | null | — | |
| remember_token | string(100) | — | null | — | Sanctum |
| created_at | timestamp | ✓ | — | — | |
| updated_at | timestamp | ✓ | — | — | |
| deleted_at | timestamp | — | null | — | Soft delete |

**Indexes:** Unique on `username`, unique on `email`
**Permissions:** Uses Spatie `permissions` and `roles` tables (separate migrations from Spatie package).

---

## 4. `product_categories`

**Purpose:** Product groupings. Creates the category hierarchy for product catalog filtering and reporting.

| Column | Type | Required | Default | Notes |
|--------|------|----------|---------|-------|
| id | bigInteger | ✓ | — | |
| name | string(100) | ✓ | — | Unique |
| description | text | — | '' | |
| industry | string(100) | — | '' | e.g. Pharmacy, Retail |
| created_at | timestamp | ✓ | — | |
| updated_at | timestamp | ✓ | — | |

**Indexes:** Unique on `name`

---

## 5. `products`

**Purpose:** Core product catalog. Every item that can be bought, sold, or tracked in inventory.

| Column | Type | Required | Default | FK | Notes |
|--------|------|----------|---------|----|-------|
| id | bigInteger | ✓ | — | — | |
| name | string(255) | ✓ | — | — | |
| sku | string(100) | ✓ | — | — | Unique |
| barcode | string(100) | — | '' | — | Unique |
| category_id | bigInteger | — | null | categories.id | |
| description | text | — | '' | — | |
| product_type | enum | ✓ | 'simple' | — | simple, composite |
| base_unit_id | string(50) | ✓ | 'piece' | — | References units domain |
| track_inventory | boolean | ✓ | true | — | |
| stock_quantity | decimal(12,2) | ✓ | 0 | — | In base units |
| low_stock_threshold | decimal(12,2) | ✓ | 10 | — | |
| status | enum | ✓ | 'in-stock' | — | in-stock, low-stock, out-of-stock |
| supplier_name | string(255) | — | null | — | Denormalized |
| location | string(100) | — | null | — | Shelf/warehouse |
| created_by | string(255) | — | null | — | |
| created_at | timestamp | ✓ | — | — | |
| updated_at | timestamp | ✓ | — | — | |
| deleted_at | timestamp | — | null | — | Soft delete |

**Indexes:** Unique on `sku`, unique on `barcode`, on `category_id`, on `status`, on `deleted_at`
**Business rules:**
- `stock_quantity` is always in base units
- `status` is recalculated whenever stock changes: > threshold → in-stock, ≤ threshold → low-stock, ≤ 0 → out-of-stock

---

## 6. `selling_units`

**Purpose:** How customers buy a product. A product may have multiple selling units (strip, box, carton).

| Column | Type | Required | Default | FK | Notes |
|--------|------|----------|---------|----|-------|
| id | bigInteger | ✓ | — | — | |
| product_id | bigInteger | ✓ | — | products.id | Cascade delete |
| name | string(100) | ✓ | — | — | e.g. Strip, Box |
| unit_id | string(50) | ✓ | — | — | e.g. tablet, g, ml |
| quantity | decimal(12,4) | ✓ | — | — | Base units per selling unit |
| sale_price | decimal(12) | ✓ | — | — | |
| barcode | string(100) | — | null | — | |
| sku | string(100) | — | null | — | |
| is_default | boolean | ✓ | false | — | Default selection in POS |

**Indexes:** on `product_id`

---

## 7. `sales`

**Purpose:** Sale transactions. Includes both regular sales (INV- prefix) and sale returns (RET- prefix).

| Column | Type | Required | Default | FK | Notes |
|--------|------|----------|---------|----|-------|
| id | bigInteger | ✓ | — | — | |
| invoice_number | string(50) | ✓ | — | — | Unique, INV- or RET- prefix |
| source | enum | ✓ | 'pos' | — | pos, clinic, manual |
| date | date | ✓ | — | — | |
| customer_id | bigInteger | — | null | contacts.id | Role: customer |
| customer_name | string(255) | — | null | — | Denormalized |
| subtotal | decimal(12) | ✓ | 0 | — | |
| discount | decimal(12) | ✓ | 0 | — | |
| grand_total | decimal(12) | ✓ | 0 | — | |
| amount_paid | decimal(12) | ✓ | 0 | — | |
| outstanding_balance | decimal(12) | ✓ | 0 | — | |
| payment_status | enum | ✓ | 'unpaid' | — | paid, partial, unpaid |
| notes | text | — | null | — | |
| created_by | string(255) | ✓ | — | — | |
| created_at | timestamp | ✓ | — | — | |
| updated_at | timestamp | ✓ | — | — | |

**Indexes:** Unique on `invoice_number`, on `customer_id`, on `date`, on `payment_status`

---

## 8. `sale_items`

**Purpose:** Individual line items on a sale.

| Column | Type | Required | Default | FK | Notes |
|--------|------|----------|---------|----|-------|
| id | bigInteger | ✓ | — | — | |
| sale_id | bigInteger | ✓ | — | sales.id | Cascade delete |
| product_id | bigInteger | ✓ | — | products.id | |
| product_name | string(255) | — | null | — | Denormalized |
| selling_unit_id | bigInteger | — | null | — | |
| packaging_name | string(100) | — | '' | — | |
| packaging_quantity | decimal(12,4) | ✓ | — | | Units sold |
| base_unit_quantity | decimal(12,4) | ✓ | — | | Base units per unit |
| base_quantity | decimal(12,4) | ✓ | — | | Total base units |
| unit_price | decimal(12) | ✓ | — | | Per selling unit |
| total | decimal(12) | ✓ | — | | |
| discount_pct | decimal(5,2) | — | 0 | | |
| category | string(100) | — | '' | | Denormalized |
| restock | boolean | ✓ | true | | For returns |

---

## 9. `purchase_bills`

**Purpose:** Purchase transactions. Includes both purchases (PUR- prefix) and purchase returns (PRET- prefix).

| Column | Type | Required | Default | FK | Notes |
|--------|------|----------|---------|----|-------|
| id | bigInteger | ✓ | — | — | |
| invoice_ref | string(50) | ✓ | — | — | Unique, PUR- or PRET- prefix |
| supplier_id | bigInteger | ✓ | — | contacts.id | Role: supplier |
| supplier_name | string(255) | ✓ | — | — | Denormalized |
| date | date | ✓ | — | — | |
| subtotal | decimal(12) | ✓ | 0 | — | |
| total_amount | decimal(12) | ✓ | 0 | — | |
| amount_paid | decimal(12) | ✓ | 0 | — | |
| outstanding_balance | decimal(12) | ✓ | 0 | — | |
| payment_status | enum | ✓ | 'unpaid' | — | paid, partial, unpaid |
| status | enum | ✓ | 'received' | — | received, pending |
| notes | text | — | null | — | |
| created_by | string(255) | ✓ | — | — | |
| created_at | timestamp | ✓ | — | — | |
| updated_at | timestamp | ✓ | — | — | |

**Indexes:** Unique on `invoice_ref`, on `supplier_id`, on `date`

---

## 10. `purchase_bill_items`

| Column | Type | Required | Default | FK | Notes |
|--------|------|----------|---------|----|-------|
| id | bigInteger | ✓ | — | — | |
| purchase_bill_id | bigInteger | ✓ | — | purchase_bills.id | Cascade delete |
| product_id | bigInteger | ✓ | — | products.id | |
| product_name | string(255) | — | null | — | Denormalized |
| base_unit_id | string(50) | — | '' | — | |
| base_unit_name | string(50) | — | '' | — | |
| purchase_pack_name | string(100) | — | '' | — | |
| purchase_pack_qty | decimal(12,4) | ✓ | — | | Base units per pack |
| purchase_quantity | decimal(12,4) | ✓ | — | | How many packs |
| unit_cost | decimal(12) | ✓ | — | | Cost per pack |
| total_cost | decimal(12) | ✓ | — | | |

---

## 11. `expense_categories`

| Column | Type | Required | Default | Notes |
|--------|------|----------|---------|-------|
| id | bigInteger | ✓ | — | |
| name | string(100) | ✓ | — | Unique |
| description | text | — | '' | |
| color | string(7) | — | '#78716c' | Hex |
| icon | string(50) | — | 'Wallet' | |
| active | boolean | ✓ | true | |
| created_at | timestamp | ✓ | — | |
| updated_at | timestamp | ✓ | — | |

**Note:** `expense_count`, `total_spent`, and `last_used` are computed on read — not stored.

---

## 12. `expenses`

| Column | Type | Required | Default | FK | Notes |
|--------|------|----------|---------|----|-------|
| id | bigInteger | ✓ | — | — | |
| expense_number | string(50) | ✓ | — | — | Unique, EXP- prefix |
| date | date | ✓ | — | — | |
| category_id | bigInteger | ✓ | — | expense_categories.id | |
| amount | decimal(12) | ✓ | — | — | |
| paid_to | string(255) | — | '' | — | |
| payment_method | enum | ✓ | 'cash' | — | cash, card, transfer, easypaisa, jazzcash |
| notes | text | — | '' | — | |
| created_by | string(255) | ✓ | — | — | |
| created_at | timestamp | ✓ | — | — | |
| updated_at | timestamp | — | null | — | |

**Indexes:** Unique on `expense_number`, on `category_id`, on `date`

---

## 13. `inventory_transactions`

**Purpose:** Stock movement ledger. Every stock change creates a row — purchases, sales, returns, adjustments, damages, consumption.

| Column | Type | Required | Default | FK | Notes |
|--------|------|----------|---------|----|-------|
| id | bigInteger | ✓ | — | — | |
| product_id | bigInteger | ✓ | — | products.id | Cascade |
| type | enum | ✓ | — | — | purchase, sale, return, adjustment, damage, consumption |
| quantity | decimal(12,2) | ✓ | — | — | Signed (+ for inflow, − for outflow) |
| unit | string(50) | ✓ | — | — | Base unit name |
| packaging_name | string(100) | — | '' | — | |
| packaging_quantity | decimal(12,4) | — | null | — | |
| date | date | ✓ | — | — | |
| reference | string(100) | ✓ | — | — | Invoice or reference number |
| notes | text | — | null | — | |
| user | string(255) | — | '' | — | |
| running_balance | decimal(12,2) | ✓ | — | — | Computed on write |
| created_at | timestamp | ✓ | — | — | |

**Indexes:** on `product_id`, on `type`, on `date`

---

## 14. `financial_transactions`

**Purpose:** Single source of truth for all money movement. Every payment, collection, refund, and adjustment creates a row.

| Column | Type | Required | Default | FK | Notes |
|--------|------|----------|---------|----|-------|
| id | bigInteger | ✓ | — | — | |
| contact_id | bigInteger | ✓ | — | contacts.id | |
| direction | enum | ✓ | — | — | in, out |
| type | enum | ✓ | — | — | invoice, collection, advance, refund, adjustment, payout |
| date | date | ✓ | — | — | |
| amount | decimal(12) | ✓ | — | — | |
| method | enum | ✓ | 'cash' | — | cash, card, transfer, easypaisa, jazzcash |
| reference | string(100) | ✓ | — | — | |
| description | text | — | null | — | |
| linked_sale_id | bigInteger | — | null | sales.id | |
| created_by | string(255) | ✓ | — | — | |
| created_at | timestamp | ✓ | — | — | |

**Indexes:** on `contact_id`, on `type`, on `date`
**Business rules:**
- Contact `current_balance` is recomputed from all rows with this contact_id
- `direction + type` determine balance impact: invoice/in → +, collection/in → −, refund/out → −, payout/out → +

---

## ER Summary

```
contacts ─┬─ sales (customer_id)
           └─ purchase_bills (supplier_id)

products ─┬─ selling_units
          └─ inventory_transactions

sales ─┬─ sale_items
       └─ financial_transactions (linked_sale_id)

purchase_bills ─┬─ purchase_bill_items

expense_categories ─── expenses

financial_transactions ─── contacts (contact_id)
inventory_transactions ─── products (product_id)
```
