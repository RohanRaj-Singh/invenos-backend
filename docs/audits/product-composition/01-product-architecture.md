# 01 — Existing Product Architecture

## 1. Product identity

**VERIFIED.** `App\Models\Product` (`app/Models/Product.php`) is the single Sku/pricing/stock
entity. It uses `SoftDeletes` and an independent archive axis.

| Column | Type | Default / constraint | Notes |
|---|---|---|---|
| `id` | bigint PK | auto | |
| `name` | varchar(255) | required | |
| `sku` | varchar(100) | unique constraint **dropped** | no index remains |
| `barcode` | varchar(100) nullable | unique constraint **dropped** | no index remains |
| `category_id` | FK `product_categories` | nullable, `nullOnDelete` | |
| `description` | text nullable | | |
| `product_type` | enum(`simple`,`composite`) | `simple` | **dead: never read or written by PHP** |
| `base_unit_id` | varchar(50) | `piece` | string, **no FK** to `product_units` |
| `track_inventory` | boolean | `true` | used by the stock guard only |
| `allow_negative_stock` | boolean nullable | no DB default; model default `true` | global setting default `false` |
| `stock_quantity` | decimal(12,2) | `0` | materialised cache of the ledger |
| `low_stock_threshold` | decimal(12,2) | `10` | |
| `status` | enum(`in-stock`,`low-stock`,`out-of-stock`) | DB `in-stock`, model `out-of-stock` | recomputed on movement |
| `last_purchase_cost` | decimal(12,2) nullable | | **per purchase pack**, not base unit |
| `default_purchase_cost` | decimal(12,2) nullable | | per purchase pack |
| `opening_cost` | decimal(14,6) nullable | | per base unit |
| `average_cost` | decimal(14,6) nullable | | weighted average per base unit |
| `uncosted_qty` | decimal(14,4) | `0` | stock quarantined from valuation |
| `supplier_name`, `location`, `created_by` | varchar | | free text, no FKs |
| `deleted_at` | timestamp nullable | SoftDeletes | |
| `archived_at`, `archive_reason`, `archived_by`, `delete_reason`, `deleted_by` | mixed | | archive and delete are independent |

Sources: `2026_07_25_204225_create_products_table.php`,
`2026_07_27_122649_add_last_purchase_cost_to_products.php`,
`2026_07_28_033719_add_allow_negative_stock_to_products.php`,
`2026_07_29_155741_add_lifecycle_fields_to_products.php`,
`2026_11_01_000002_add_cost_columns_for_weighted_average.php`,
`2026_11_01_000005_add_uncosted_qty_to_products.php`.

## 2. Model behavior

**VERIFIED.**

- `$attributes = ['stock_quantity' => 0, 'status' => 'out-of-stock', 'allow_negative_stock' => true]`.
  The model default for negative stock contradicts the global setting default.
- `$fillable` includes `product_type`, `stock_quantity`, `average_cost`, `opening_cost`,
  `uncosted_qty`, `allow_negative_stock`, `archived_at` is **not** fillable (set directly by
  the lifecycle service).
- Global scope `notArchived` → `whereNull('products.archived_at')`. `withArchived()` opts out.
- Relationships: `category()`, `sellingUnits()`, `packaging()`, `inventoryTransactions()`,
  `deletedBy()`. **No `sales()`, `purchases()`, `components()`, `formula()` relations.**
- `baseUnitName` accessor resolves display names through `ProductUnitService`.
- **No observers, events, listeners, jobs or policies on the model.**

## 3. Units and packaging

### 3.1 Canonical unit registry

`product_units` is seeded by `2026_07_28_121124_create_product_units_table.php` with 27 display
names (count/weight/volume/length). It has **no measurement-type column**. The type mapping and
conversion factors live in `ProductUnitService::MEASUREMENT_TYPES` and in the mirrored
`resources/js/lib/units.ts`.

| Unit family | Canonical base | Factors |
|---|---|---|
| count | `piece` | all count units factor 1 |
| weight | `mg` | `g` = 1000, `kg` = 1,000,000 |
| volume | `ml` | `litre` = 1000 |
| length | `cm` | `meter` = 100 |

`products.base_unit_id` is a **string**, not an FK. A formula line that stores
`product_units.id` and a ledger row that stores `products.base_unit_id` speak different
vocabularies; bridging must go through `ProductUnitService::resolveDisplayUnit()`.

### 3.2 Packaging is a unit hierarchy, not a recipe

`product_packaging` (`2026_07_28_121131_create_product_packaging_table.php`) is a directed
container→contains graph:

- `product_id`, `container_unit_id`, `contains_unit_id`, `quantity`, `level`;
- unique triple `(product_id, container_unit_id, contains_unit_id)`.

`PackagingDerivationEngine::derive($productId)` computes transitive factors at write time and
creates/updates `selling_units` (`quantity` = factor to base unit). `ConversionGraphService`,
`RelationshipTransformer` and `RelationshipGraphValidator` exist but have **zero callers** in
this branch.

**RISK:** packaging is sometimes mistaken for a bill of materials. It is not. It expresses
"1 Box = 12 Packs = 120 Capsules" for one product; a formula expresses "1 Burger = 1 Bun + 1
Patty + 1 Cheese + 20 ml Sauce" across products. Reusing `product_packaging` for formulas would
corrupt the derivation engine and mix two different graphs.

## 4. Selling units

`selling_units` (`2026_07_25_204226_create_selling_units_table.php`, extended by
`2026_07_28_121132_add_packaging_id_to_selling_units_table.php`):

| Column | Type | Notes |
|---|---|---|
| `product_id` | FK cascade | |
| `name` | varchar(100) | display |
| `unit_id` | varchar(50) | legacy string |
| `product_unit_id` | bigint nullable | current FK |
| `quantity` | decimal(12,4) | **base units per selling unit** |
| `sale_price` | decimal(12) | per selling unit |
| `barcode`, `sku` | varchar nullable | |
| `is_default` | boolean | service ensures exactly one |
| `packaging_id` | FK nullable | set when derived from packaging |

The POS and sale service treat `selling_units.quantity` as the conversion factor. The sale
service re-reads it server-side when `selling_unit_id` is supplied, which is the correct
authority; it trusts the client factor only when no selling unit id is sent.

## 5. Product lifecycle

**VERIFIED.**

```
create ──> active ──> archived ──> unarchived ──> active
                 └──> soft-deleted ──> restored ──> active
                 └──> soft-deleted ──> permanently deleted (admin)
```

- `archive` sets `archived_at` / reason / user, writes an audit log, and has **no stock effect**.
- `unarchive` clears those fields; `ProductPolicy::executeUnarchive` does nothing else.
- `delete` is blocked by `ProductPolicy::deleteBlocker()` when the product appears in any
  `sale_items` or `purchase_bill_items`. Archived products with stock can be deleted only if
  they have no document lines; stock is **not** reconciled by deletion.
- `restore` clears `deleted_at`; no stock effect.

**RISK:** product deletion is blocked only by sales/purchase line counts. A product that is
used only in a future composition table would not be protected unless the policy is extended.
Conversely, a composite that is a component of another formula must be added to the blocker.

## 6. Create workflow

```
GET /inventory/add  → ProductController@create
  props: categories, products (search 999), generated_sku
POST /inventory     → ProductController@store (CreateProductRequest)
  → CreateProductData::fromRequest()
  → ProductService::create() in DB::transaction
```

`ProductService::create()`:

1. inserts `products`;
2. if `stock_quantity > 0`, inserts an `inventory_transactions` row directly
   (`type=adjustment`, `reference=INITIAL`) — **bypasses `InventoryService`**;
3. recomputes `status`;
4. saves packaging levels and runs the derivation engine;
5. saves explicit selling units;
6. ensures at least one default selling unit;
7. ensures exactly one default.

**RISK:** `CreateProductData` has no `product_type`, `track_inventory` is passed, and
`allow_negative_stock` is validated but **not persisted** because the DTO does not carry it.
Any composition key added to the request must be threaded through `fromRequest()`, `toArray()`,
and both collision-branch reconstructions in `ProductController::store()`.

**RISK (verified defect):** on a SKU or barcode collision, `ProductController::store()`
reconstructs `CreateProductData` without the `packaging` argument, silently dropping packaging
levels.

## 7. Edit workflow

```
GET  /inventory/product/{id}/edit → ProductController@edit
PUT  /inventory/product/{id}      → ProductController@update (UpdateProductRequest)
```

`ProductService::update()`:

- `$product->update($data)` — **this writes `stock_quantity` directly from the form** with no
  inventory movement and no row lock;
- replaces packaging and re-derives if `packaging` is present;
- syncs custom selling units positionally;
- recomputes status.

**RISK (critical):** editing a product can silently change stock, diverging
`products.stock_quantity` from `SUM(inventory_transactions.quantity)`. This must be fixed in P0
before any feature that depends on stock integrity.

## 8. Deletion / restore

`ProductService::delete()` deletes packaging rows and soft-deletes the product. It does not
touch inventory or ledger rows. `ProductPolicy` blocks deletion when sale/purchase lines exist.
`ProductService::restore()` restores the model; no packaging is recreated.

## 9. Serialization

**VERIFIED.** There are **no API Resources**. Controllers pass models or `toArray()` directly
to Inertia. This means:

- `product_type`, `deleted_at`, `archived_by`, `archive_reason`, cost fields and all selling
  units are exposed to the browser;
- component/formula data added later would be exposed by default unless explicitly shaped.

## 10. Validation and authorization

| Request | Rules that matter | Authorization |
|---|---|---|
| `CreateProductRequest` | name, sku, base_unit_id required; packaging `required_with`; selling unit price `required_with` | `authorize(): true` |
| `UpdateProductRequest` | same + inline SKU/barcode closures | `authorize(): true` |
| `ProductController` | – | only `destroy/archive/unarchive` call `authorize('lifecycle.*')`; create/update are open to any authenticated user |

`product_type` is not validated anywhere. A crafted request cannot set it because the DTO drops
it; this is accidental safety, not policy.

## 11. Product-related JSON endpoints

| Endpoint | Route? | Reality |
|---|---|---|
| `GET /inventory/generate-sku` | yes | JSON; **the UI never calls it** (client has its own generator) |
| `GET /inventory/product-units` | **no** | `UnitRelationEditor` calls it, gets 404; unit autocomplete is dead |
| `GET /inventory/measurement-options` | **no** | dead |
| `GET /inventory/preview-packaging` | **no** | dead |
| `ProductController@index` | **no** | `inventory.index` is bound to `InventoryController@index` |

## 12. Introducing composition without breaking simple products

**PROPOSED.** The safe shape, given the code above:

1. Leave `products` table and `product_type` untouched.
2. Add `product_compositions` and `product_composition_items` keyed by `product_id`.
3. Read composition only on the product detail page / a dedicated tab; do not change the create
   payload.
4. Keep all existing simple-product queries valid by using `whereDoesntHave('composition')` only
   where a surface must distinguish the two.
5. Never infer "composite" from `product_type`; infer it from the presence of an active
   composition row.
6. Add a nullable `composition` key to the product detail props, not to the product table.

This preserves the current fast create path byte-for-byte, which is the explicit requirement.
