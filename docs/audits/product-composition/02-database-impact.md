# 02 — Database & Data Integrity Impact

## 1. Schema at a glance

**VERIFIED from `database/migrations/` (51 migrations).** Tables relevant to composition:

`products`, `product_categories`, `product_units`, `product_packaging`, `selling_units`,
`inventory_transactions`, `sales`, `sale_items`, `purchase_bills`, `purchase_bill_items`,
`returns`, `return_items`, `return_reasons`, `financial_transactions`, `contacts`,
`expenses`, `expense_categories`, `audit_logs`, `backups`, `restore_runs`,
`settings`, `users`, `roles`, `permissions`.

**ABSENT:** `companies`, `organizations`, `warehouses`, `stock_transfers`,
`product_formulas`, `product_compositions`, `production_runs`, `product_batches`,
`company_product_stock`, `company_selling_unit_prices`.

## 2. Table-by-table audit

### 2.1 `products`

| Attribute | Details |
|---|---|
| Purpose | Product identity, pricing anchor, materialised stock cache |
| PK | `id` bigint |
| FKs | `category_id → product_categories.id` (`nullOnDelete`) |
| Relationships (model) | category, sellingUnits, packaging, inventoryTransactions, deletedBy |
| Important columns | `name`, `sku`, `barcode`, `product_type`, `base_unit_id`, `track_inventory`, `stock_quantity`, `average_cost`, `opening_cost`, `uncosted_qty`, `allow_negative_stock`, lifecycle columns |
| Constraints | PK; `category_id` FK; **no unique index on SKU/barcode** (dropped); status index |
| Lifecycle | create / update / archive / soft delete / permanent delete |
| Composition impact | Must remain the identity for both simple and composite products. Formula tables reference it. Do not add composition columns here. |

**Precision:** `stock_quantity` decimal(12,2); `uncosted_qty` decimal(14,4); `average_cost` /
`opening_cost` decimal(14,6). Formula component quantities should not be constrained by the
products table precision; use decimal(14,6) or higher on formula rows.

**RISK:** `products.stock_quantity` can be written by product edit without a ledger row.

### 2.2 `product_categories`

| Attribute | Details |
|---|---|
| Purpose | Categories, optional industry label |
| PK | `id` |
| Constraints | `name` unique |
| Composition impact | None. A composite product uses the same category vocabulary. |

### 2.3 `product_units`

| Attribute | Details |
|---|---|
| Purpose | Unit display-name registry |
| PK | `id` |
| Constraints | `name` unique |
| Lifecycle | Inserted once; no UI management |
| Composition impact | Formula percentages/quantities need a unit identity. The registry has no measurement type, so conversion rules live in `ProductUnitService`. A formula row should store the unit **string used by the ledger** (the component's `base_unit_id`) or a `product_unit_id` plus a conversion snapshot. Storing both avoids later ambiguity. |

### 2.4 `product_packaging`

| Attribute | Details |
|---|---|
| Purpose | Container→contains unit hierarchy per product |
| PK | `id` |
| FKs | `product_id` cascade; `container_unit_id`/`contains_unit_id → product_units.id` |
| Constraints | unique `(product_id, container_unit_id, contains_unit_id)` |
| Composition impact | **Do not reuse.** It is a unit graph, not a multi-product recipe. |

### 2.5 `selling_units`

| Attribute | Details |
|---|---|
| Purpose | Sellable pack definitions and price |
| PK | `id` |
| FKs | `product_id` cascade; `packaging_id` nullable |
| Constraints | index `product_id`; service enforces one default |
| Important columns | `quantity` = base units per sale unit; `sale_price`; `is_default` |
| Composition impact | A composite is sold through a selling unit exactly like a simple product. The formula does not change the selling unit; it changes the stock effect. |

### 2.6 `inventory_transactions`

| Attribute | Details |
|---|---|
| Purpose | The only stock ledger; signed quantity |
| PK | `id` |
| FKs | `product_id → products.id` cascade |
| Important columns | `type`, signed `quantity` decimal(12,2), `unit_cost` decimal(14,6), `unit` varchar(50), `packaging_name`, `packaging_quantity`, `date`, `document_date`, `reference` varchar(100), `reference_type`, `reference_id`, `running_balance`, `user` |
| Constraints | indexes on product/type/date; **type enum** |
| Type values | `purchase`, `sale`, `return`, `sale-return`, `purchase-return`, `adjustment`, `damage`, `consumption` |
| Composition impact | `consumption` already exists. It is the natural type for component outflow. There is **no `production` / `production-output` type**, and no FK to a run. |

**RISK:** `reference_type`/`reference_id` are untyped (varchar/bigint) and there is no model
relation from the ledger back to sales, purchases or returns. A formula execution record must
use its own reference pair and should add an explicit FK if foreign-key integrity is required.
Adding a nullable `composition_run_id` to the ledger is the smallest safe change.

**Precision:** component quantities can be fractional (`20 ml`, `0.25 g`). The ledger stores
decimal(12,2) for quantity. That is **two decimal places**, which cannot represent `0.125 g`
exactly. This is a genuine precision risk for formula execution. A migration widening
`quantity` (and `running_balance`) to decimal(14,4) or (14,6) should be evaluated in P0/P1.

### 2.7 `sales` / `sale_items`

| Table | Constraints | Composition impact |
|---|---|---|
| `sales` | `invoice_number` unique; `customer_id` FK nullOnDelete; soft deletes; return fields | Revenue header for both simple and composite sales |
| `sale_items` | `sale_id` FK cascade; `product_id` FK restrict; `selling_unit_id` bigint nullable (no FK); `packaging_quantity`, `base_unit_quantity`, `base_quantity`, `unit_price`, `cost_price`, `total`, `discount_pct`, `restock` | A composite sale produces **one sale item** (the commercial product). Consumed components must not become sale items or revenue will double. |

**RISK:** `sale_items.cost_price` is the only COGS input. A composite's cost must be rolled up
and written here (or joined through a run) or profit reports will treat the whole unit price as
margin.

### 2.8 `purchase_bills` / `purchase_bill_items`

| Table | Constraints | Composition impact |
|---|---|---|
| `purchase_bills` | `invoice_ref` unique; `supplier_id` FK; soft deletes; return fields | Components are purchased as ordinary products; no change |
| `purchase_bill_items` | `purchase_bill_id` cascade; `product_id` restrict; `unit_cost_base` decimal(14,6) | Component purchase updates `products.average_cost`, which formula costing consumes |

### 2.9 `returns` / `return_items`

| Attribute | Details |
|---|---|
| Purpose | Canonical return header/line |
| PK | `id` |
| FKs | `reference_id` untyped; `contact_id` nullOnDelete; `reference_item_id` untyped; `product_id` nullOnDelete; `selling_unit_id` nullOnDelete |
| Constraints | unique `return_number`; indexes on reference/date/status/type |
| Lifecycle | `pending → completed → reversed`; `pending → cancelled` |
| Composition impact | Only the commercial product's line exists. A return must not try to restore components unless an explicit business decision says so. |

**RISK:** `return_items.reference_item_id` points to a `sale_items.id`. If a composite sale's
components are not sale items, there is nothing for a component return to reference. This is
acceptable only if components are never returned individually.

### 2.10 `financial_transactions`

| Attribute | Details |
|---|---|
| Purpose | Party invoice memos and cash movements |
| PK | `id` |
| FKs | `contact_id → contacts.id` (nullable after `2026_11_01_000001`); `linked_sale_id`, `linked_purchase_id`, `linked_return_id` nullable |
| Important columns | `event_key` unique (idempotent cash posting), `reversal_of_id`, `reversed_at`, `source_type`, `source_id` |
| Composition impact | None if consumption is an inventory-only event. No financial row should be created for component consumption. |

The original migration required `contact_id`; `2026_11_01_000001_add_cash_ledger_columns...`
changes it to nullable so walk-in sales and expenses can post cash. The same migration adds
`event_key`, which `CashLedgerService::record()` uses to make cash posting idempotent. Formula
execution should not write here at all.

### 2.11 `contacts`

Roles are JSON (`customer`, `supplier`, `patient`, …), balances are scalars. No composition
impact. Cross-company component references are impossible because there is no company concept.

### 2.12 `settings`

Single JSON row (`values`) with business/POS/inventory/sales/purchases/backup/receipt groups.
`inventory.allow_negative_stock` defaults to `false`, `stock_valuation_method` says `fifo`
but no FIFO engine exists. Composition policy (e.g. block short components) may belong here.

### 2.13 `audit_logs`

Morph `auditable_type`/`auditable_id`, event, reason, user, IP. Only lifecycle actions write
it today. Formula create/edit/execute/reverse should write there.

### 2.14 `backups` / `restore_runs`

Metadata only. New composition tables are automatically included in dumps (see document 14).

## 3. Referential integrity and lifecycle risks

| Concern | Current behavior | Composition risk |
|---|---|---|
| FK on component product | none (no formula table) | Must be `products.id`; decide `restrict` vs `nullOnDelete`. `restrict` protects history; `nullOnDelete` loses it. |
| Soft delete / archive | `products` archives and soft-deletes independently | A deleted/archived component must be rejected for new formulas and new executions, but historical runs must still render. Use `withArchived()`/`withTrashed()` in history reads. |
| Product permanent delete | blocked only by sale/purchase line counts | Must also be blocked by composition membership. |
| Cascade on formula delete | none | If a formula is deleted, runs must survive. Use soft delete on the template or restrict. |
| Case/rounding | decimal(12,2) ledger quantity | Fractional ml/g quantities need more precision. |
| Company isolation | **ABSENT** | No `company_id`; all products/components are global. |
| Historical integrity | sale/return snapshots store product name, price, cost | Formula runs must snapshot the template they used. |

## 4. Should template and execution be separated?

**PROPOSED: yes.** The two requirements conflict if merged:

- a saved formula must be editable and reusable;
- a past transaction must retain exactly what it consumed, even after the formula changes.

Therefore:

```
product_compositions          -- reusable template (versionable)
product_composition_items     -- template lines

composition_runs              -- one execution (sale, service, production)
composition_run_items         -- actual consumption snapshot per component
```

The run stores `template_quantity`, `actual_quantity`, `unit`, `unit_cost`, `total_cost` and a
nullable `inventory_transaction_id`. The template is never rewritten by an execution.

**Alternative considered:** one `product_components` table only. Rejected because editing the
formula would rewrite history and because per-transaction overrides are explicitly required.

**Versioning:** a `version` column on `product_compositions` plus `is_active`, or immutable
template rows. Recommended: `version` + `is_active`, and every run stores `formula_version`
and a JSON snapshot.

## 5. Proposed additive schema (not implemented)

```text
product_compositions
  id
  product_id            FK products (restrict)
  kind                  enum('assembly','consumption')
  version               unsigned int default 1
  name                  varchar nullable
  output_quantity       decimal(14,6) default 1
  output_unit_id        varchar(50) nullable
  is_active             boolean default true
  notes                 text nullable
  created_by            varchar nullable
  timestamps
  unique (product_id, kind, version)
  index (product_id, is_active)

product_composition_items
  id
  composition_id        FK product_compositions cascade
  component_product_id  FK products restrict
  quantity_base         decimal(14,6)       -- in component base unit
  display_unit_id       varchar(50) nullable
  wastage_pct           decimal(6,3) default 0
  is_optional           boolean default false
  sort_order            int default 0
  timestamps
  unique (composition_id, component_product_id)

composition_runs
  id
  run_number            varchar(50) unique
  composition_id        FK product_compositions restrict
  product_id            FK products restrict
  kind                  enum('assembly','consumption')
  source_type           varchar(50) nullable   -- sale, consultation, manual
  source_id             bigint nullable
  template_version      int
  template_snapshot     json
  quantity              decimal(14,6)          -- commercial qty sold/produced
  output_quantity       decimal(14,6) nullable
  total_cost            decimal(14,6) nullable
  unit_cost             decimal(14,6) nullable
  status                enum('pending','completed','reversed')
  effects_applied_at    timestamp nullable
  created_by            varchar nullable
  timestamps
  index (source_type, source_id)

composition_run_items
  id
  composition_run_id        FK cascade
  component_product_id      FK products restrict
  unit                      varchar(50)
  template_quantity         decimal(14,6)
  actual_quantity           decimal(14,6)
  unit_cost                 decimal(14,6) nullable
  total_cost                decimal(14,6) nullable
  inventory_transaction_id  FK inventory_transactions nullable (restrict)
  timestamps

inventory_transactions (additive, optional)
  + composition_run_id bigint nullable indexed
```

**Design notes**

- Quantities are decimal(14,6) to support grams/ml fractions.
- `template_snapshot` is the historical guarantee; `composition_run_items` is the queryable
  record.
- Do **not** add `company_id`; this branch is single-tenant. If it is ever needed, add a
  separate fashion-only migration.
- Do **not** add a `product_type` value. Composition is derived from an active
  `product_compositions` row.

## 6. Migration compatibility

| Concern | Assessment |
|---|---|
| Existing rows | Additive tables only; no backfill required |
| Existing simple products | Unchanged; they have no composition row |
| Existing reports | Unchanged until new movement types/joins are added |
| Migration order | Composition tables reference `products` only; safe on both branches |
| Down migrations | Drop new tables first; the ledger's nullable column last |
| Backup restore | New tables are discovered automatically; older backups restore to a schema that then runs `migrate` |

## 7. Data-integrity decisions still open

1. Should component lines be `restrict` on delete (recommended) or cascade?
2. Should a formula be soft-deleted, versioned, or both?
3. Is `output_quantity` fixed per template or per run?
4. Should the ledger quantity precision be widened before or during P1?
5. Should composition runs be reversible, and what does reversal do to `average_cost`?
