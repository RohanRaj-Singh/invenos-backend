# Product & Inventory Domain Model

## Purpose

This document defines every relationship in the Product and Inventory domain. For each concept, it answers:

- Who owns this data?
- Where is it stored?
- Who updates it?
- Who reads it?
- Is it derived or persisted?
- Is it required or optional?

This ensures every schema decision is justified by business requirements, not frontend convenience.

---

## 1. Product

```
┌─────────────────────────────────────────────────┐
│                   Product                        │
├─────────────────────────────────────────────────┤
│ id, name, sku, barcode                          │
│ category_id, description, product_type           │
│ base_unit_id, track_inventory                    │
│ stock_quantity, low_stock_threshold, status      │
│ supplier_name, location                          │
│ created_by, created_at, updated_at, deleted_at   │
└──────────────────────┬──────────────────────────┘
        │               │               │
        ▼               ▼               ▼
  Category        SellingUnit     InventoryTransaction
  (belongs_to)    (has_many)      (has_many)
```

| Property | Owner | Storage | Updated By | Read By | Derived/Persisted | Required |
|---|---|---|---|---|---|---|
| `id` | System | `products.id` (auto-increment) | Never | All services | Persisted | Yes |
| `name` | User | `products.name` | ProductService | All UIs | Persisted | Yes |
| `sku` | User/System | `products.sku` | ProductService::create | All UIs | Persisted (auto-generated or manual) | Yes |
| `barcode` | User | `products.barcode` | ProductService | POS, Inventory | Persisted | No |
| `category_id` | User | `products.category_id` (FK → categories) | ProductService | List/Form/Reports | Persisted | No |
| `description` | User | `products.description` | ProductService | Detail | Persisted | No |
| `product_type` | User | `products.product_type` | ProductService | Form (composite toggle) | Persisted | Yes (default: 'simple') |
| `base_unit_id` | User/System | `products.base_unit_id` | ProductService | All inventory, Purchases, Sales | Persisted | Yes |
| `track_inventory` | User | `products.track_inventory` | ProductService | Inventory transactions | Persisted | Yes (default: true) |
| `stock_quantity` | System | `products.stock_quantity` | InventoryService (purchase/sale/return/adjustment) | Product list, detail, dashboard | **Derived** — running total of inventory transactions. Persisted for fast reads | Yes |
| `low_stock_threshold` | User | `products.low_stock_threshold` | ProductService | Stock badges, alerts | Persisted | Yes (default: 10) |
| `status` | System | `products.status` | InventoryService (auto on transaction) | List, badges, filters | **Derived** — computed from `stock_quantity` vs `low_stock_threshold` | Yes |
| `supplier_name` | User | `products.supplier_name` | ProductService | Product form, details | Persisted | No |
| `location` | User | `products.location` | ProductService | Inventory | Persisted | No |
| `default_purchase_config*` | User | `products.purchase_unit_id, purchase_unit_cost, purchase_unit_qty` (optional columns) | ProductService | Purchase Bill form | Persisted **only if business requires cross-session defaults** | No |

> **`*default_purchase_config`**: Currently the frontend normalization layer provides fallback values. Adding columns to `products` is deferred until a concrete business requirement for cross-session purchase defaults emerges.

### Key Design Decision: `stock_quantity` is derived

`stock_quantity` is updated whenever an inventory transaction occurs (purchase, sale, return, adjustment). It's persisted for fast read access (list pages, dashboard) but is conceptually derived from the sum of `inventory_transactions.quantity` for the product. This means:

- **Writes**: Every inventory transaction writes both the transaction record AND updates `stock_quantity`
- **Reads**: List pages and dashboard read `stock_quantity` directly (no SUM queries needed)
- **Consistency**: The two must stay in sync — atomic DB transactions ensure this

---

## 2. Category

```
┌─────────────────────────────────────┐
│            Category                  │
├─────────────────────────────────────┤
│ id, name, created_at, updated_at    │
└─────────────────────────────────────┘
```

| Property | Owner | Storage | Updated By | Read By | Derived/Persisted | Required |
|---|---|---|---|---|---|---|
| `id` | System | `categories.id` | Never | All services | Persisted | Yes |
| `name` | User | `categories.name` | ProductService (via product form "add new" flow) | Products, filters | Persisted | Yes |

**Note**: Categories are a **shared vocabulary**, not a product property. They exist independently of products. The product form's "add new category" inline flow creates a new category record.

---

## 3. SellingUnit

```
┌──────────────────────────────────────────────────┐
│                  SellingUnit                       │
├──────────────────────────────────────────────────┤
│ id, product_id, name, unit_id, quantity          │
│ sale_price, barcode, sku, is_default              │
│ created_at, updated_at                            │
└──────────────────────────────────────────────────┘
```

| Property | Owner | Storage | Updated By | Read By | Derived/Persisted | Required |
|---|---|---|---|---|---|---|
| `id` | System | `selling_units.id` | Never | POS, Sales, Inventory | Persisted | Yes |
| `product_id` | System | `selling_units.product_id` (FK → products) | ProductService::create | All | Persisted | Yes |
| `name` | User | `selling_units.name` | ProductService | POS, tables | Persisted | Yes |
| `unit_id` | User/System | `selling_units.unit_id` | ProductService | Unit conversion | Persisted | Yes |
| `quantity` | User | `selling_units.quantity` | ProductService | Pricing, inventory math | Persisted | Yes (how many base units this selling unit represents) |
| `sale_price` | User | `selling_units.sale_price` | ProductService | POS, Sales, Pricing | Persisted | Yes |
| `barcode` | User | `selling_units.barcode` | ProductService | POS barcode scan | Persisted | No |
| `sku` | User | `selling_units.sku` | ProductService | Inventory | Persisted | No |
| `is_default` | User | `selling_units.is_default` | ProductService | POS, sale creation | Persisted | Yes (default: false, exactly one per product should be true) |

### Relationship with Product

- **Ownership**: SellingUnit belongs_to Product. Cascade delete.
- **Cardinality**: One Product has 1–N SellingUnits. At least one required.
- **Purpose**: Defines how a product is sold to customers (e.g., "Strip of 10", "500ml Bottle", "Single").
- **Conversion**: `quantity` = number of base units. `sale_price` = price per this selling unit.

---

## 4. PurchaseBill

```
┌───────────────────────────────────────────────────────────┐
│                     PurchaseBill                            │
├───────────────────────────────────────────────────────────┤
│ id, invoice_ref, supplier_id, supplier_name, date         │
│ subtotal, discount, total_amount, amount_paid             │
│ outstanding_balance, payment_status, status, notes         │
│ created_by, created_at, updated_at                         │
└───────────────────────────┬───────────────────────────────┘
                            │
                    PurchaseBillItem
                    (has_many)
```

| Property | Owner | Storage | Updated By | Read By | Derived/Persisted | Required |
|---|---|---|---|---|---|---|
| `discount` | User | `purchase_bills.discount` | PurchaseService::create | Purchase detail, reports | Persisted | No (default: 0) |
| `total_amount` | System | `purchase_bills.total_amount` | PurchaseService::create | List, detail, reports | **Derived** — `subtotal - discount` | Yes |

---

## 5. PurchaseBillItem

```
┌──────────────────────────────────────────────────────────┐
│                   PurchaseBillItem                        │
├──────────────────────────────────────────────────────────┤
│ id, purchase_bill_id, product_id, product_name           │
│ base_unit_id, base_unit_name, purchase_pack_name         │
│ purchase_pack_qty, purchase_quantity, unit_cost          │
│ total_cost, created_at, updated_at                       │
└──────────────────────────────────────────────────────────┘
```

| Property | Owner | Storage | Updated By | Read By | Derived/Persisted | Required |
|---|---|---|---|---|---|---|
| `discount_pct`* | User | `purchase_bill_items.discount_pct` | PurchaseService::create | Purchase detail | Persisted | No |

> **`*discount_pct`**: Per-line discount percentage on purchase items. Only needed if the PurchaseBill UI requires line-level discount tracking. Deferred until the discount feature is fully implemented.

---

## 6. InventoryTransaction

```
┌──────────────────────────────────────────────────────────────┐
│                   InventoryTransaction                        │
├──────────────────────────────────────────────────────────────┤
│ id, product_id, type, quantity, unit                         │
│ packaging_name, packaging_quantity, date, reference, notes   │
│ user, running_balance, created_at, updated_at                │
└──────────────────────────────────────────────────────────────┘
```

| Property | Owner | Storage | Updated By | Read By | Derived/Persisted | Required |
|---|---|---|---|---|---|---|
| `type` | System | `inventory_transactions.type` | PurchaseService, SaleService, InventoryService | Inventory timeline, reports | Persisted | Yes (enum: purchase, sale, return, adjustment, damage, consumption) |
| `quantity` | System | `inventory_transactions.quantity` | Services above | All inventory | Persisted (positive = add, negative = remove) | Yes |
| `packaging_name` | System | `inventory_transactions.packaging_name` | Services above | Inventory timeline display | Persisted | No |
| `packaging_quantity` | System | `inventory_transactions.packaging_quantity` | Services above | Inventory timeline display | Persisted | No |
| `running_balance` | System | `inventory_transactions.running_balance` | Services above | Inventory timeline | **Derived** — computed at transaction time | Yes |

### Transaction types and their effects

| Type | Quantity Direction | Source | Updates `stock_quantity`? |
|---|---|---|---|
| `purchase` | + | PurchaseService::create | Yes |
| `sale` | - | SaleService::create | Yes |
| `sale-return` | + | SaleReturnService::create | Yes |
| `purchase-return` | - | PurchaseReturnService::create | Yes |
| `adjustment` | ± | InventoryService::recordTransaction | Yes |
| `damage` | - | InventoryService::recordTransaction | Yes |
| `consumption` | - | InventoryService::recordTransaction | Yes |

---

## 7. Sale

```
┌────────────────────────────────────────────────────────────┐
│                        Sale                                │
├────────────────────────────────────────────────────────────┤
│ id, invoice_number, source, date                           │
│ customer_id, customer_name, subtotal, discount             │
│ grand_total, amount_paid, outstanding_balance              │
│ payment_status, notes, created_by                          │
│ created_at, updated_at                                     │
└────────────────────────┬───────────────────────────────────┘
                         │
                     SaleItem
                     (has_many)
```

No changes needed to the `sales` table. Current schema covers all prototype requirements.

---

## 8. SaleItem

```
┌──────────────────────────────────────────────────────────────┐
│                        SaleItem                               │
├──────────────────────────────────────────────────────────────┤
│ id, sale_id, product_id, product_name, selling_unit_id       │
│ packaging_name, packaging_quantity, base_unit_quantity       │
│ base_quantity, unit_price, total, discount_pct               │
│ category, restock, created_at, updated_at                    │
└──────────────────────────────────────────────────────────────┘
```

No changes needed. Current schema covers all prototype requirements including packaging info.

---

## 9. Contact (Customer / Supplier)

```
┌──────────────────────────────────────────────────────────────┐
│                       Contact                                 │
├──────────────────────────────────────────────────────────────┤
│ id, type (person|organization), roles (JSON array)           │
│ name, company_name, contact_person, phone, email, cnic      │
│ address, opening_balance, balance_type                       │
│ current_balance, notes, created_by                           │
│ created_at, updated_at, deleted_at                           │
└──────────────────────────────────────────────────────────────┘
```

| Property | Owner | Storage | Updated By | Read By | Derived/Persisted | Required |
|---|---|---|---|---|---|---|
| `roles` | User | `contacts.roles` (JSON: ['customer', 'supplier']) | ContactService | POS (customer picker), Purchase (supplier picker) | Persisted | Yes |

Single-entity model. A contact is a customer, supplier, or both depending on `roles`. No separate customer/supplier tables needed.

---

## Data Flow Summary

```
User action
    ↓
UI (React/Inertia)
    ↓
router.post('/purchases')
    ↓
FormRequest (validation)
    ↓
DTO (data transfer)
    ↓
Service (business logic + DB writes)
    ↓
── Product.stock_quantity updated ──
── InventoryTransaction created ──
── PurchaseBill (+ items) created ──
    ↓
Response (redirect + flash message)
    ↓
UI shows result
```

No entity should be created purely because a React component has a matching interface. Every persisted field must trace back to a business requirement.
