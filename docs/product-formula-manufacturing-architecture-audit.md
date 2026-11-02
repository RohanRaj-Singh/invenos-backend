# Invenos — Product Architecture & Formula Manufacturing Discovery Audit

**Status:** Read-only audit. No code, schema, or data was changed.
**Scope:** Product creation, product domain, inventory, units/packaging, POS, costing, reporting, tests.
**Repository:** `invenos-backend` (Laravel 13, Inertia + React 18, MySQL).
**Conventions:** **VERIFIED** = read directly in code/schema. **INFERRED** = follows from code but not directly observed at runtime. **PROPOSED** = recommendation, not implementation. **UNKNOWN** = requires product/business decision or production data.

---

## 1. Executive summary

**VERIFIED**

1. Products are a single flat entity. `products` is the inventory entity; there is no distinction between purchased, sellable, and manufacturable products in storage. `product_type` is an enum with values `simple` and `composite`, but **the backend never reads or writes it**. Every product in the database is `simple` because neither `CreateProductRequest`, `UpdateProductRequest`, `CreateProductData`, nor `ProductService` carries the field.
2. The product creation flow is genuinely fast: name → cost → price → Enter saves. There is no `useForm`; the form is hand-rolled state with a global Enter handler. Manufacturing UI exists only in a dead prototype (`_ProductFormPrototype.tsx`).
3. Inventory is one signed ledger (`inventory_transactions`) with a materialised `products.stock_quantity`. Sign convention is `+` in / `−` out. The enum already contains `consumption`, but there is **no production/assembly movement type**, and `applyMovement()` is `private`.
4. Units/packaging are a hierarchy graph (`product_packaging`) used to derive selling units, **not a bill of materials**. Quantity conversion exists (`ProductUnitService`, client-side graph validator), but the server does not validate purchase pack quantities and `ConversionGraphService` has zero callers.
5. POS sells by stock quantity only. It has no product-type gate, no buildability concept, and no ingredient explosion. A finished good produced into stock would sell normally with **no POS change**.
6. Costing is weighted average per base unit, with `average_cost → opening_cost → latest purchase line → legacy pack cost`, and `uncosted_qty` quarantining stock with no reliable cost. Manufacturing cost roll-up does not exist, but the pieces to transfer cost from ingredients to finished goods are present.
7. Reporting has **four different inventory valuation formulas** and three COGS variants, and COGS treats "unknown cost" as zero. Manufacturing would inherit those inconsistencies unless the cost-transfer step sets `average_cost` explicitly.

**Bottom line:** the existing architecture can support formula manufacturing **without a second inventory ledger and without new product types**, provided (a) formula data lives in related tables keyed by `product_id`, (b) production posts ingredient outflows and finished-good inflows through the existing inventory service, and (c) the production run computes and writes the finished good's unit cost instead of expensing ingredients.

---

## 2. Existing product architecture

### 2.1 Schema — `products` (VERIFIED)

Sources: `database/migrations/2026_07_25_204225_create_products_table.php`, `2026_07_27_122649_add_last_purchase_cost_to_products.php`, `2026_07_28_033719_add_allow_negative_stock_to_products.php`, `2026_07_28_043414_remove_barcode_unique_from_products.php`, `2026_07_29_155741_add_lifecycle_fields_to_products.php`, `2026_11_01_000002_add_cost_columns_for_weighted_average.php`, `2026_11_01_000005_add_uncosted_qty_to_products.php`.

| Column | Type | Notes |
|---|---|---|
| `id` | bigint PK | |
| `name` | varchar(255) | |
| `sku` | varchar(100) | unique constraint **dropped**; **no index remains** |
| `barcode` | varchar(100) null | unique constraint **dropped**; **no index remains** |
| `category_id` | FK `product_categories` | nullable, `nullOnDelete` |
| `description` | text null | |
| `product_type` | enum(`simple`,`composite`) | default `simple`; **never read/written by PHP** |
| `base_unit_id` | varchar(50) | default `piece`; **string, no FK** to `product_units` |
| `track_inventory` | boolean | default `true` |
| `allow_negative_stock` | boolean **nullable** | no DB default; model default `true`; global setting default `false` |
| `stock_quantity` | decimal(12,2) | materialised cache of the ledger |
| `low_stock_threshold` | decimal(12,2) | default 10 |
| `status` | enum(`in-stock`,`low-stock`,`out-of-stock`) | DB default `in-stock`; model `$attributes` default `out-of-stock` |
| `last_purchase_cost` | decimal(12,2) null | **per purchase pack** |
| `default_purchase_cost` | decimal(12,2) null | **per purchase pack** |
| `opening_cost` | decimal(14,6) null | per base unit |
| `average_cost` | decimal(14,6) null | weighted average, per base unit |
| `uncosted_qty` | decimal(14,4) | default 0; stock quarantined from costing |
| `supplier_name`, `location`, `created_by` | varchar | free text, no FKs |
| lifecycle | `deleted_at`, `archived_at`, `archive_reason`, `archived_by`, `delete_reason`, `deleted_by` | archive and soft delete are **independent axes** |

### 2.2 Model — `app/Models/Product.php` (VERIFIED)

- `use SoftDeletes`; global scope `notArchived` → `whereNull('products.archived_at')`.
- `$fillable` includes `product_type`, `stock_quantity`, `average_cost`, `opening_cost`, `uncosted_qty`, `allow_negative_stock`.
- Casts are float for all quantity/cost columns.
- Relationships: `category()`, `sellingUnits()`, `packaging()`, `inventoryTransactions()`, `deletedBy()`. **No `sales()`, `purchases()`, or component relations.**
- `getBaseUnitNameAttribute()` resolves through `ProductUnitService` (container lookup inside an accessor).
- **No observers, events, or listeners anywhere** — all side effects are explicit service calls.

### 2.3 Related tables (VERIFIED)

| Table | Purpose | Key columns |
|---|---|---|
| `product_categories` | categories | `name` unique |
| `product_units` | unit vocabulary (27 seeded names) | `id`, `name` unique |
| `product_packaging` | container→contains hierarchy | `product_id`, `container_unit_id`, `contains_unit_id`, `quantity`, `level`; unique triple |
| `selling_units` | sellable pack definitions | `product_id`, `unit_id` (legacy string), `product_unit_id`, `packaging_id`, `quantity` (factor to base), `sale_price`, `is_default` |
| `inventory_transactions` | single stock ledger | signed `quantity`, `type`, `unit_cost`, `document_date`, `(reference_type, reference_id)` |
| `sale_items`, `purchase_bill_items`, `return_items` | document lines | prices, `base_quantity`, `cost_price` / `unit_cost_base` |

### 2.4 What the two product types mean today

**VERIFIED:** nothing in the backend. `simple` and `composite` are only declared in the create-table migration and echoed in TypeScript (`resources/js/types/index.ts:125`, `resources/js/lib/product-types.ts`, where `simple` has `allowsBom:false` and `composite` has `allowsBom:true`). The live form hard-codes `product_type: 'simple'` (`resources/js/Pages/inventory/components/ProductForm.tsx:177`) and the field is absent from both Form Requests, so the value cannot change. **There is no composite behaviour, no BOM, and no manufacturing service anywhere in `app/`.**

**INFERRED:** the intended semantics were "simple = bought and sold; composite = assembled from ingredients." That intent lives only in a dead React prototype (`resources/js/Pages/inventory/components/_ProductFormPrototype.tsx:793-806, 935-1004`), in unused types (`Ingredient` at `resources/js/types/index.ts:215-220`), and in two transaction-kind strings (`manufacturing-consumption`, `manufacturing-production` in `resources/js/domain/transactions/types.ts:11-12`).

### 2.5 Dependencies that any formula feature would touch

| Dependency | Coupling |
|---|---|
| Inventory | every stock change must pass `InventoryService`; `applyMovement()` is private, and two return services bypass it |
| Purchasing | writes `average_cost` and `uncosted_qty`; trusts client pack quantities |
| Selling | snapshots `average_cost` into `sale_items.cost_price` via `CostResolver` |
| Reporting | reads `stock_quantity`, `average_cost`, `uncosted_qty`, `cost_price` directly — four valuation variants |
| POS | ships every non-archived product; no capability filter |
| Lifecycle | product deletion is blocked only by sale/purchase line counts, not by stock history |

**Critical pre-existing defects that a manufacturing feature would amplify**

| # | Defect | Location |
|---|---|---|
| 1 | `ProductService::update()` writes `stock_quantity` from the form with **no ledger row** and no lock | `ProductService.php:118-122`, `UpdateProductRequest.php:54`, `ProductForm.tsx:181` |
| 2 | `TransactionEngine::process()` calls the **private** `InventoryService::applyMovement()` — fatal if ever invoked | `TransactionEngine.php:141` vs `InventoryService.php:222` |
| 3 | Stock is clamped to 0 on the ledger but the movement row keeps the unclamped quantity → ledger drift | `InventoryService.php:254-284` |
| 4 | Any reference starting with `REV-` disables the negative-stock guard and clamping | `InventoryService.php:241, 246, 258` |
| 5 | Sale/purchase returns bypass `InventoryService` and write rows directly | `SaleReturnService.php:71-81`, `PurchaseReturnService.php:68-80` |
| 6 | Packaging silently dropped when SKU/barcode collide during create (DTO rebuilt without it) | `ProductController.php:70-86, 96-112` |
| 7 | COGS counts unknown-cost units: `uncosted_qty` is decremented but `cost_price` still holds `average_cost`; `COALESCE(cost_price,0)` prices unknown cost at zero | `SaleService.php:148-155`, `FinancialReportService.php:44-49` |

---

## 3. Product creation frontend flow

### 3.1 Routes and components (VERIFIED)

| Purpose | Route | Page |
|---|---|---|
| List | `GET /inventory` | `inventory/ProductList` |
| Create | `GET /inventory/add` → `ProductController@create` | `inventory/CreateProduct` → `Pages/inventory/CreateProduct.tsx` |
| Store | `POST /inventory` | redirect to show or back to create |
| Detail | `GET /inventory/product/{id}` | `inventory/ProductDetails` |
| Edit | `GET /inventory/product/{id}/edit` | `inventory/EditProduct` |
| Update | `PUT /inventory/product/{id}` | redirect to show |
| Lifecycle | `DELETE`, `POST …/archive`, `POST …/unarchive` | |
| SKU helper | `GET /inventory/generate-sku` | JSON, never called by the UI |

Live form: `resources/js/Pages/inventory/components/ProductForm.tsx` (696 lines). `ProductForm.tsx` (page-level) and `AddProduct.tsx` are dead wrappers.

### 3.2 Form structure (VERIFIED)

Single card, sticky save bar, **no tabs, no `<form>` element**:

1. **Name** — required marker; autofocused.
2. **Your Cost** / **Selling Price** — two-column; price shows an amber nudge at 0.
3. **Unit** + **Category** (autocomplete with create-on-type).
4. **Unit relationships** — `<UnitRelationEditor>` (the only packaging UI on the live path).
5. Collapsible **More Options** (`advancedOpen` defaults `false`): barcode, SKU, starting/current quantity, minimum stock, allow-negative-stock, description.
6. Sticky bar: Enter = *Save & Add Next*, Ctrl/Cmd+Enter = *Save & View*.

Defaults: `baseUnitId = 'piece'`, one selling unit "Piece" quantity 1 price 0, `allowNegativeStock = true`.

### 3.3 Submission and validation (VERIFIED)

- Payload built by `buildPayload()` (`ProductForm.tsx:144-194`), which hard-codes `product_type: 'simple'`.
- Client validation is only `name.trim()` (`:198-205`); all other errors arrive as one joined toast.
- `POST /inventory` or `PUT /inventory/product/{id}`; `_stay` re-renders the create page with name/stock/relationships cleared (category, SKU, cost and unit persist).
- Server validation: required = `name`, `sku`, `base_unit_id`. `packaging.*.container_unit_id`, `contains_unit_id`, `quantity`, `level` are `required_with:packaging`; `selling_units.*.sale_price` is `required_with:selling_units`.
- **Known 422 traps:** the client transformer emits `container_unit_id: null` and `contains_unit_id: null` for relationships ("resolved server-side", but the server requires them), and `sale_price: null` for unpriced units. Any product saved with a relationship can fail.
- **Unit autocomplete is dead:** `UnitRelationEditor` calls `axios.get('/inventory/product-units')`, but `ProductController::productUnits()` has no route. Suggestions never appear, and Enter on the unit field bubbles to the global save handler.
- No dirty-state guard, no field-level errors, two competing SKU generators (client `generateSku`, server `ProductService::generateSku`).

### 3.4 Where manufacturing could attach without slowing the default path (PROPOSED)

| Option | Cost to the basic flow | Assessment |
|---|---|---|
| **Recipe tab on the product detail page** | Zero — created only when opened | **Recommended.** `ProductDetails.tsx:197-221` builds tabs from an inline array; add `{ id:'recipe' }` and one conditional block. Create/edit payload is untouched. |
| Collapsed disclosure inside **More Options** | One extra collapsed row | Good secondary entry point for first setup. Because `buildPayload` is an object literal, an untouched section simply omits the key. |
| Type toggle ("I Buy & Sell / I Make It") on the create form | Adds a decision to the fast path and requires a validated `product_type` write path | **Not recommended.** It is the one change that would slow ordinary creation, and `product_type` currently has no validated write path. |
| Separate "Manufactured" product type | Breaks the 95% path and duplicates capability logic | Rejected — see §7. |

**Constraint satisfied:** an optional recipe section that is only rendered after an explicit action leaves the default payload byte-identical. `CreateProductRequest` would only need a nullable `ingredients`/`components` key, in the same style as the already-nullable `packaging`.

---

## 4. Backend, DTO and service dependency map

### 4.1 Controller — `app/Http/Controllers/ProductController.php` (VERIFIED)

| Method | Routed? | Notes |
|---|---|---|
| `index()` | **No** | `inventory.index` is bound to `InventoryController@index` |
| `create/ store/ show/ edit/ update` | Yes | |
| `destroy/ archive/ unarchive` | Yes | delegate to `RecordLifecycleService` |
| `generateSku()` | Yes | unused by UI |
| `previewPackaging()`, `productUnits()`, `measurementOptions()` | **No** | dead endpoints |

`store()` performs barcode and SKU collision loops that rebuild `CreateProductData` **without the `packaging` argument**, silently dropping packaging levels.

### 4.2 Requests and DTOs (VERIFIED)

- `CreateProductRequest` / `UpdateProductRequest`: `product_type` is **not validated**, `allow_negative_stock` is validated (create) but **not persisted** (`CreateProductData::toArray()` omits it), `stock_quantity` is validated on update and written directly.
- `CreateProductData` (`app/Domains/Products/DTOs/CreateProductData.php`) is fixed-arity readonly. Any new manufacturing key must be threaded through `fromRequest()`, `toArray()`, and **both** collision-branch reconstructions in `ProductController::store`.
- `UpdateProductRequest` uses inline closures for SKU/barcode uniqueness instead of `Rule::unique`, so it ignores `whereNull('deleted_at')`.

### 4.3 Services (VERIFIED)

`ProductService`: `search`, `create`, `update`, `delete`, `restore`, `get`, `generateSku`, `allCategories`; private `savePackaging`, `ensureSingleDefault`, `syncSellingUnits`. No repository, no cache.

`PackagingDerivationEngine`: `derive(productId)`, `preview(array)`; computes transitive factors, deletes un-customised derived selling units, detaches customised ones.

`ProductUnitService`: presentation/conversion only (measure-type aware). `ConversionGraphService`, `RelationshipTransformer`, `RelationshipGraphValidator` are **orphan classes with zero callers**.

### 4.4 Serialization (VERIFIED)

No API Resources. Models are passed raw through Inertia, including `deleted_at`, `archived_by`, `archive_reason`, `product_type`.

### 4.5 Transaction boundaries (VERIFIED)

- `ProductService::create/update` run inside `DB::transaction`.
- `RecordLifecycleService::archive()` runs **outside** a transaction; unarchive/delete/restore are wrapped.
- `InventoryService::applyMovement()` locks the product row but does **not** open a transaction; atomicity depends on the caller.

---

## 5. Inventory lifecycle and transaction conventions

### 5.1 The ledger (VERIFIED)

`inventory_transactions`: `product_id` (FK cascade), `type` enum, **signed** `quantity` decimal(12,2), `unit_cost` decimal(14,6) null, `unit` varchar(50) (base-unit *string*), `packaging_name`, `packaging_quantity`, `date` (always `now()`), `document_date` null, `reference` varchar(100) not null, `notes`, `user` (name string), `running_balance`, `reference_type`/`reference_id` (untyped), timestamps.

Final enum: `purchase`, `sale`, `return`, `sale-return`, `purchase-return`, `adjustment`, `damage`, `consumption`. **No transfer, no production type.**

Linkage to documents is by a free-string `reference` (`INV-…`, `PUR-…`, `SR-…`) plus untyped `(reference_type, reference_id)`. `InventoryTransaction` has **no relation to sales/purchases/returns**.

### 5.2 Sign convention (VERIFIED)

| Movement | Type | Sign |
|---|---|---|
| Purchase | `purchase` | `+` |
| Sale | `sale` | `−` |
| Sale return (restock) | `sale-return` | `+` |
| Purchase return | `purchase-return` | `−` |
| Adjustment/damage/consumption | caller | caller-supplied |
| Opening stock | `adjustment` (`reference='INITIAL'`) | `+` |
| Reversals | same type, negated | `REV-…` prefix |

`SUM(quantity)` is the correct on-hand calculation; `products.stock_quantity` is the cache.

### 5.3 Who changes stock (VERIFIED)

| Path | Mechanism | Ledger? |
|---|---|---|
| Product create with opening stock | direct `InventoryTransaction::create`, type `adjustment`, ref `INITIAL` | Yes (bypasses service) |
| **Product edit** | `$product->update(['stock_quantity' => …])` | **No** |
| Purchase | `InventoryService::recordPurchase` | Yes |
| Sale | `InventoryService::recordSale` | Yes |
| Sale/purchase return (canonical) | `ReturnService::applyStock` → `recordReturn` | Yes |
| Return reversal | `recordAdjustment` with negated qty | Yes |
| Manual adjustment | `recordAdjustment` | Yes |
| Sale/purchase delete & restore | lifecycle policies → `recordAdjustment` | Yes |
| Legacy return services | direct `InventoryTransaction::create` + `increment/decrement` | Yes, bypassing the guard |
| Archive/delete product | none (stock retained) | n/a |

Three independent writers mutate `stock_quantity`, so `products.stock_quantity == SUM(inventory_transactions.quantity)` is not structurally enforced. `stock:reconcile` reports drift but never fixes it.

### 5.4 Negative stock (VERIFIED)

Guard throws when `quantity < 0 && stock + quantity < 0 && !isReversal && !productAllowsNegative && track_inventory && !bypass`. `$productAllowsNegative = product.allow_negative_stock ?? setting('inventory.allow_negative_stock') ?? true`. DB default is NULL → global setting (`false` in `SettingService`), while the model default is `true`.

### 5.5 Can one ledger express manufacturing? (VERIFIED structure / PROPOSED use)

**Yes, with caveats.**

Already possible today: a `consumption` row per ingredient (`−`) and a positive row for the finished good, grouped by `reference_type='production'`, `reference_id=<run id>`, via `InventoryService::recordAdjustment()`.

Missing / risky:
1. **No `production` movement type**, so finished-goods receipts would be reported as *adjustments* in `stockMovement()` (`InventoryReportService.php:366-369`) and inflated in every stock report.
2. **No run table** to link inputs to output; `(reference_type, reference_id)` is an untyped string+int pair.
3. **No cost roll-up**: `InventoryService` stores `unit_cost` verbatim and never touches `average_cost`/`uncosted_qty` except in `PurchaseService`.
4. **The guard applies to ingredients**: production consumption is a negative movement, so a run with insufficient stock fails at the first ingredient unless pre-validated.
5. **Valuation blind spot**: produced stock gets `average_cost = null` unless written, and `uncosted_qty` is consumed only by sales.

**Recommendation:** extend the enum with `production-consumption` and `production-output` (or reuse `consumption` for inputs and add `production` for outputs), and add a nullable `production_run_id` column to `inventory_transactions`. Keep everything in the same table and the same `SUM(quantity)` invariant. **Do not** add a second stock table.

---

## 6. Unit and packaging architecture

### 6.1 Infrastructure (VERIFIED)

- `product_units`: display vocabulary only, no measurement-type column. Type mapping lives in `ProductUnitService::MEASUREMENT_TYPES` (`count`, `weight`, `volume`, `length`) with base units `piece`, `mg`, `ml`, `cm` and factors.
- `product_packaging`: directed container→contains graph (`Box → 12 × Pack → 10 × Capsule`), unique triple, custom `level`.
- `selling_units`: derived from packaging (`packaging_id`) or custom; `quantity` = factor to base unit; `is_default`; optional price/barcode/SKU.
- `PackagingDerivationEngine::derive()` computes transitive quantities at write time; no read-time derivation.
- `ConversionGraphService` can walk packaging graphs, **but has zero call sites**.
- Client mirrors: `resources/js/lib/unit-relation-validator.ts` (cycle/connectivity checks) and `unit-relation-transformer.ts`. Server counterparts exist but are never called.

### 6.2 Quantity authority (VERIFIED)

- **Sales**: server re-reads `selling_units.quantity` when `selling_unit_id` is provided; otherwise trusts the client's `base_unit_quantity` (`SaleService.php:134-146`).
- **Purchases**: `baseQuantity = purchase_pack_qty × purchase_quantity` with **no server-side unit validation** (`PurchaseService.php:76,108`); `unit_cost_base = unit_cost / pack_qty` (`:121`).
- **Returns**: `return_items.base_quantity` is accepted from the client (`ReturnWorkflowController.php:44`).
- `base_quantity` is **not** sent by the POS; the server derives it.

### 6.3 Fit for formulas (VERIFIED)

Formulas can specify quantities in **base units** trivially today (the ledger stores `unit = products.base_unit_id` and `unit_cost` per base unit).

Formulas in display units (e.g. "10 g" for a product whose base is kg) need conversion at the formula boundary. Two safe options:
1. Store formula quantities **in the ingredient's base unit** and convert in the UI using `ProductUnitService`/`units.ts` before saving. No new system, no ambiguity.
2. Store `(quantity, unit_id)` on the formula line and convert at production time with `ProductUnitService::getConversionFactor`.

**PROPOSED:** option 1 for the first implementation — the base unit is already the ledger's unit, so cost and stock math stay exact. Store the display unit only for presentation. Do **not** build a second conversion engine; `ConversionGraphService` can be revived for packaging→base, but formula→base needs only measurement conversion.

**Missing capabilities (VERIFIED):**
- No server-side packaging cycle/connectivity validation.
- `base_unit_id` is a string with no FK, so a formula line referencing `product_units.id` and a ledger row referencing `products.base_unit_id` speak different vocabularies. Bridging must go through `ProductUnitService::resolveDisplayUnit()`.
- No batch/lot concept anywhere, so there is no place to store "which ingredient lots were consumed".

---

## 7. POS integration analysis

### 7.1 Flow (VERIFIED)

`GET /sales/pos` → `SaleController::create` ships **all non-archived products** with `sellingUnits`. Client normalises, filters by name/SKU (barcode not searched despite the placeholder), adds one cart line per `productId`, computes line totals and discounts client-side, checks `products.stockQuantity`, then posts to `/sales`.

Backend `SaleService::create` revalidates the product and selling unit, decrements stock via `recordSale`, snapshots cost via `CostResolver`, and writes the cash/party entries.

### 7.2 Assumptions that manufacturing would touch (VERIFIED)

| Assumption | Consequence |
|---|---|
| Every product in the picker is sellable | A manufactured product with zero finished stock is still sellable, subject to the negative-stock policy |
| Stock availability = `products.stock_quantity` | Correct for finished goods; POS has no way to show "buildable" quantity |
| No product-type gate | A `composite` product would appear and sell exactly like a simple one |
| One cart line per product | Irrelevant for finished goods |
| Cost = `CostResolver` | A produced good with no `average_cost` and no purchases yields `cost_price = null` → COGS 0 |

### 7.3 Required POS changes (VERIFIED answer)

**None**, if manufacturing writes finished goods into `products.stock_quantity` and sets `average_cost`.

Changes would only be required if the business wants:
- to hide non-buildable products (needs a server-side filter in `SaleController::create` and a client filter next to the archived check at `SaleBill.tsx:169`),
- to show buildable quantity (new read model; nothing today),
- to explode formulas at sale time (**explicitly not wanted** — production must be the only consumption point),
- correct composite COGS (costing fix, not POS).

### 7.4 Existing POS risks worth fixing independently (VERIFIED)

- `total` and `discount` are client-supplied; the server never checks `total ≈ quantity × unit_price`.
- `discount_pct` is never posted; line discounts are baked into `total`.
- Receipt is fabricated client-side (`saleId = Date.now()`), so the printed invoice number does not match the database.
- Products with no selling unit are silently unaddable.
- POS search ignores `barcode`.

---

## 8. Costing and reporting analysis

### 8.1 Cost sources (VERIFIED)

`CostResolver::unitCost(Product)` order: `average_cost` → `opening_cost` → latest purchase line `unit_cost_base` → latest `unit_cost / purchase_pack_qty` → `last_purchase_cost ÷ pack` → `default_purchase_cost ÷ pack` → `null`. `costBasis()` returns `exact`, `estimated`, or `unavailable`.

`PurchaseService::create` updates, per line:
```
costPerBase = unit_cost / purchase_pack_qty
if oldAvg === null:
    if qtyOnHand > 0: uncosted_qty += qtyOnHand      // quarantine prior stock
    average_cost = costPerBase
else:
    costedQty = max(0, qtyOnHand - uncosted_qty)
    average_cost = (costedQty*oldAvg + inQty*costPerBase) / (costedQty + inQty)
```

`SaleService::create` decrements `uncosted_qty` by the sold base quantity, then snapshots `CostResolver::unitCost()` into `sale_items.cost_price`.

### 8.2 Report formulas (VERIFIED)

| Report | Formula | Known issue |
|---|---|---|
| Financial overview COGS | `Σ sale_items.base_quantity × COALESCE(cost_price,0)` for **all** sales in range | does not exclude returned sales; unknown cost = 0 |
| P&L COGS (`SalesReportService::profit`) | same, **excluding returned sales** | different number from overview |
| Stock report summary | `Σ max(0, stock − uncosted) × cost` | per-row `products[].value` uses `stock × cost` |
| Stock summary/valuation | `Σ stock × cost` or `stock × min(sale_price)` | no uncosted subtraction; retail basis in `InventoryService` |
| Product ledger stock value | `stock × last_purchase_cost` | ignores `average_cost`; per-pack column |

`productCost()` in `InventoryReportService` uses legacy **per-pack** costs without dividing by pack factor — divergent from `CostResolver`.

### 8.3 How manufacturing must flow financially (PROPOSED)

1. On production completion, compute `runCost = Σ(consumed base qty × ingredient current unit cost) + overhead`.
2. Write ingredient rows: `type='production-consumption'`, `quantity=-qty`, `unit_cost=ingredient cost`, `reference_type='production'`, `reference_id=run.id`.
3. Write finished row: `type='production-output'`, `quantity=+output qty`, `unit_cost = runCost / output qty`, same reference.
4. Update `products.average_cost` for the finished good using the same weighted-average rule as purchases, over its **costed** quantity. Do **not** change ingredient `average_cost` — consumption does not change the average, only the quantity.
5. Do **not** write an expense. Cost moves from raw-material inventory to finished-goods inventory. The P&L sees COGS only when the finished good is sold.
6. Never double count: ingredient cost appears once in the run, and is recovered through the finished good's `cost_price` at sale.

**Can the current architecture support this?** **Yes**, with one addition: a production run table and a cost-writing step. The ledger already supports signed movements and per-row `unit_cost`; `average_cost` already exists; `CostResolver` already reads it first. What is missing is the transaction boundary that performs steps 2–4 together and an immutability record of the formula used.

### 8.4 Risks (VERIFIED)

- If the finished good has no `average_cost`, sales produce `cost_price = null` → COGS 0 → overstated profit. Manufacturing **must** write `average_cost`, not `opening_cost`.
- If ingredients are costed from legacy pack columns, the run cost inherits the pack/base division bug. Use `CostResolver`, which divides correctly.
- If `uncosted_qty` exists on an ingredient, consuming it reduces quantity but not the uncosted bucket (sales already have this bug). A production run should consume uncosted first, like sales do, or explicitly mark the run cost as estimated.

---

## 9. Relevant database schema (current + proposed, not implemented)

### 9.1 Current (VERIFIED)

Products, packaging, selling units, ledger and document lines as described in §2 and §5.

### 9.2 Proposed additive schema (PROPOSED — no migrations created)

```
product_formulas            (optional if one formula per product; recommended for versions)
  id, product_id FK, version int, name, output_quantity decimal(14,4),
  output_unit_id (nullable, string base unit), notes, is_active bool,
  effective_from date, created_by, timestamps
  unique(product_id, version)

product_formula_items
  id, formula_id FK cascade, component_product_id FK products,
  quantity_base decimal(14,6), display_unit_id nullable, wastage_pct decimal(6,3) default 0,
  sort_order, timestamps
  unique(formula_id, component_product_id)

production_runs
  id, run_number unique, formula_id FK (nullable for ad-hoc),
  product_id FK (finished good), formula_version int, formula_snapshot json,
  planned_quantity decimal(14,4), actual_quantity decimal(14,4) null,
  status enum(draft, completed, cancelled, reversed),
  total_cost decimal(14,6) null, unit_cost decimal(14,6) null,
  started_at, completed_at, cancelled_at, reversal_of_id, effects_applied_at,
  notes, created_by, timestamps

production_run_items
  id, production_run_id FK cascade, component_product_id FK,
  planned_quantity decimal(14,4), actual_quantity decimal(14,4),
  unit_cost decimal(14,6), total_cost decimal(14,6), wastage_quantity decimal(14,4) default 0

inventory_transactions (additive)
  + production_run_id bigint null (indexed)
  + enum values: production-consumption, production-output (or `production` + sign)
```

Design notes:
- `formula_snapshot` (JSON) on the run preserves the exact recipe at execution time, satisfying historical immutability even if the formula is later edited.
- No product capability columns are required. If explicit flags are wanted later, `products.can_be_sold`, `products.can_be_purchased`, `products.can_be_ingredient`, `products.is_manufacturable` are additive booleans — **but the initial design should not add them**; "used as an ingredient" is derivable from `product_formula_items`, and "manufacturable" from `product_formulas`.
- `is_active` on the formula plus immutable runs covers versioning without touching historical documents.

---

## 10. Existing tests and missing coverage

### 10.1 Present (VERIFIED)

| File | Covers |
|---|---|
| `tests/Feature/Inventory/CostingTest.php` | pack→base conversion, weighted average, sale cost snapshot, uncosted quarantine/consumption, legacy fallback, null cost, `opening_cost` precedence |
| `tests/Feature/Inventory/InventoryTest.php` | overview counts, movements, low stock, valuation keys |
| `tests/Feature/Returns/ReturnServiceTest.php` | full/partial refund, credit-only, non-restock, double-complete, reversal, over-return |
| `tests/Feature/Revenues…` / `Reports/FinancialReportsTest.php` | cash flow from receipts, balance sheet balancing |
| `tests/Feature/Products/ArchivedProductTest.php` | archive visibility, sale of archived product rejected, return on archived product allowed |
| `tests/Feature/Products/ProductLifecycleTest.php` | delete blockers, restore, Inertia props |
| `tests/Feature/Sales/SalesTest.php` | sale creation, stock decrement, insufficient stock |
| `tests/Feature/Purchases/PurchasesTest.php` | purchase creation, stock increase |

### 10.2 Missing (VERIFIED gaps)

- No tests for `PackagingDerivationEngine` (`derive`, `preview`, orphan cleanup), `ProductUnitService`, `ConversionGraphService`, `RelationshipGraphValidator`.
- No test for `ProductService::update()` packaging re-derive or the `stock_quantity` overwrite.
- No test for the negative-stock matrix (`NULL` / true / false, `track_inventory=false`, `bypass`, `REV-`).
- No test for return reversal ledger compensation.
- No test that COGS is correct when part of a sale comes from uncosted stock.
- No test for inventory valuation consistency across the four report paths.
- No manufacturing/BOM tests (nothing exists to test).

### 10.3 Tests a manufacturing feature would require (PROPOSED)

1. Formula creation/versioning immutability after a run.
2. Production consumes exactly the formula quantities and credits the finished good.
3. Production with insufficient ingredient stock is rejected before any movement (all-or-nothing).
4. Run cost = ingredient cost + overhead; finished `average_cost` equals run cost ÷ output.
5. Selling the produced quantity yields `sale_items.cost_price = finished average_cost`.
6. Reversing a run restores ingredient stock, removes finished stock, and does not double-expense.
7. Nested manufacturing (finished good used as an ingredient) resolves exactly one level per run.
8. `SUM(inventory_transactions.quantity) == products.stock_quantity` after a run.

---

## 11. Compatibility risks

| Risk | Severity | Why it matters for manufacturing | Mitigation |
|---|---|---|---|
| `stock_quantity` writable outside the ledger | High | A production run plus a product edit can silently diverge | Fix the update path before adding production |
| Private `applyMovement` / dead `TransactionEngine` | High | Any new code reusing the engine fatals | Use the public `record*` wrappers; do not revive the engine |
| No server-side packaging validation | Medium | Formula inputs may use pack units the server cannot verify | Validate formulas against `products.base_unit_id` + `ProductUnitService` |
| Three COGS/valuation variants | Medium | Manufacturing cost would be reported differently per page | Write `average_cost` on production; later unify valuation |
| Returns never recompute `average_cost`/`uncosted_qty` | Medium | Manufacturing + returns can drift costing | Do not rely on returns to adjust cost; snapshot at run time |
| Uncosted stock is consumed at full average | Medium | Run cost overstates ingredient cost | Consume uncosted first and mark run cost `estimated` |
| `product_type` is unvalidated but fillable | Low | A future writer could set `composite` with no behaviour | Ignore `product_type`; add no new semantics to it |
| Negative stock allowed by default | Medium | Production can consume below zero if no pre-check | Validate the whole run, then apply movements |
| Archive/delete have no stock side effects | Low | Archived ingredient stays in BOM | Block formula use of archived products at validation |
| No batch/lot data | Low now, high later | Cannot trace which lot was consumed | Defer; `production_run_items` gives run-level traceability |

---

## 12. Recommended architecture

**Core principle:** `Product` stays the central inventory entity. Capabilities are **relationships**, not types.

### 12.1 Model

- **Product** = identity + inventory + pricing. No manufacturing columns.
- **`product_formulas`** = one recipe definition per product/version (+ optional multiple formulas).
- **`product_formula_items`** = ingredient lines, quantities in the ingredient's base unit, optional wastage.
- **`production_runs`** = the actual operation, with formula snapshot, planned/actual output, cost, status.
- **`production_run_items`** = actual consumption per ingredient, with unit cost at execution time.
- **`inventory_transactions`** = the only stock ledger; production rows join it via `production_run_id` and a new movement type.

### 12.2 Capability semantics (PROPOSED)

| Capability | How it is known | Does it need a column? |
|---|---|---|
| Purchasable | has purchase history or is selected in purchasing | No |
| Sellable | has ≥1 selling unit | No |
| Usable as ingredient | appears in `product_formula_items` | No |
| Manufacturable | has an active `product_formulas` row | No |

If the UI later needs explicit toggles, add nullable booleans, never a new `product_type` value.

### 12.3 Why this avoids the over-engineering trap

- **No second inventory ledger.** Production is just signed rows.
- **No FIFO/cost layers.** Weighted average already exists; the run writes one cost.
- **No event sourcing.** One run row + items is enough.
- **No MRP/scheduling.** Runs are manual, created by a user.
- **No new product types.** `product_type` stays as-is and unused.

### 12.4 Execution algorithm (PROPOSED)

```
BEGIN
  lock formula + ingredient products
  validate: all active, not archived, track_inventory, stock >= required (or negatives allowed)
  compute line costs with CostResolver; total = Σ qty × cost + overhead
  create production_run (status=draft)
  for each ingredient:
      recordAdjustment(type: production-consumption, quantity: -qty, unit_cost: cost,
                       reference_type: production, reference_id: run.id)
  recordAdjustment(type: production-output, quantity: +output_qty,
                   unit_cost: total / output_qty, reference_id: run.id)
  finished.average_cost = weighted average over costed qty (reuse purchase rule)
  mark run completed, effects_applied_at = now
COMMIT
```

Reversal mirrors the return lifecycle: post negated rows under `REV-{run_number}`, restore ingredient `uncosted_qty` as appropriate, remove the finished-good cost contribution by reversing the average if no other stock remains (or leave the average unchanged and document it — see open questions), and mark `reversed`.

---

## 13. Alternatives considered and rejected

| Alternative | Why rejected |
|---|---|
| New product type `manufactured` in `products.product_type` | Manufacturing is a capability, not an identity. It would force a type decision on the fast create path and fragment queries (`product_type = simple` is already meaningless). |
| Separate `manufactured_products` table | Duplicates name/SKU/pricing/inventory and breaks every existing relation. |
| Second inventory ledger for manufacturing | Violates the single-ledger invariant and doubles every reconciliation. |
| Auto-explode formula at sale time | Ingredient cost would be expensed at sale, and selling finished stock without production would consume ingredients twice. Production must be the only consumption point. |
| FIFO / cost layers | Weighted average already exists and is tested. Layers are not required to transfer cost correctly. |
| Full MRP / production planning | No demand planning or capacity requirement exists; manual runs are sufficient. |
| Reusing `product_packaging` for formulas | Packaging is a unit hierarchy, not a quantity recipe; mixing them would corrupt the derivation engine. |
| Storing components in JSON on `products` | No referential integrity, no cost per line, no reporting, no immutability. |
| Reusing `TransactionEngine` | It calls a private method and is unreachable; repairing it is more work than using `recordAdjustment`. |

---

## 14. Proposed implementation phases

**P0 — prerequisites (fix existing defects; no manufacturing yet)**
1. Remove `stock_quantity` from `UpdateProductRequest`/`ProductForm` payload (must go through an adjustment).
2. Make `InventoryService` the only stock writer; deprecate direct `increment/decrement` in legacy return services.
3. Add a public, intention-revealing movement method (do not expose `applyMovement`).
4. Add indexes on `products.sku`/`barcode`.

**P1 — formula definition (no stock effects)**
5. Additive migrations: `product_formulas`, `product_formula_items`.
6. Validation: component exists, not archived, trackable, quantity > 0, no self-reference, no cycles (one level only in P1).
7. Read endpoints/props for the product detail **Recipe** tab; optional creation via More Options.
8. Tests for schema, validation, immutability of a saved formula.

**P2 — production execution**
9. `production_runs`, `production_run_items`, `inventory_transactions.production_run_id`, enum values.
10. Run service: validate all lines → post ingredient outflows → post finished inflow → write `average_cost`.
11. UI: production screen (select product → formula → quantity → preview cost/availability → complete).
12. Tests: happy path, insufficient stock, all-or-nothing, reversal.

**P3 — costing and reporting**
13. Run cost breakdown (ingredient cost, wastage, overhead).
14. Finished-good cost written to `average_cost`; sale COGS verified.
15. Reports: production history, ingredient usage, cost per batch; ensure stock reports classify the new movement types (not as "adjustment").
16. Unify the valuation formulas touched by these new types.

**P4 — optional extensions**
17. Nested manufacturing (a produced good used as an ingredient) — works if P2 resolves one level per run; add a guard against cycles.
18. Batch/lot traceability, expiry, QC status.
19. Multiple formulas per product / cost comparison.

**Out of scope for all phases:** MRP, capacity planning, multi-warehouse transfers, FIFO, standard costing variance.

---

## 15. Files likely to be affected

**Schema**
- `database/migrations/*_create_product_formulas*`, `*_create_product_formula_items*`, `*_create_production_runs*`, `*_create_production_run_items*`, `*_add_production_run_id_to_inventory_transactions*`

**Backend**
- `app/Models/ProductFormula.php`, `ProductFormulaItem.php`, `ProductionRun.php`, `ProductionRunItem.php`
- `app/Domains/Manufacturing/Services/FormulaService.php`, `ProductionService.php`
- `app/Domains/Inventory/Services/InventoryService.php` (new movement types; public method)
- `app/Domains/Inventory/Services/CostResolver.php` (unchanged, consumed)
- `app/Domains/Products/Services/ProductService.php` (recipe props only; no stock changes)
- `app/Http/Controllers/ProductController.php` (detail props for recipe tab)
- `app/Http/Controllers/ProductionController.php` (new)
- `app/Http/Requests/Manufacturing/*` (new)
- `app/Policies/Lifecycle/ProductionRunPolicy.php` (cancel/reverse permissions)
- `routes/web.php`

**Frontend**
- `resources/js/Pages/inventory/ProductDetails.tsx` (new Recipe tab)
- `resources/js/Pages/inventory/components/ProductForm.tsx` (optional collapsed recipe entry — only if chosen)
- `resources/js/Pages/manufacturing/ProductionList.tsx`, `ProductionForm.tsx`, `ProductionDetail.tsx` (new)
- `resources/js/types/index.ts` (formula/run types)

**Reports**
- `app/Domains/Reports/Services/InventoryReportService.php` (`stockMovement` classification)
- `app/Domains/Reports/Services/FinancialReportService.php` (only if new movement types affect cash — they should not)
- `app/Domains/Reports/Services/ProductReportService.php` (production rows in timeline)

**Tests**
- `tests/Feature/Manufacturing/FormulaTest.php`, `ProductionRunTest.php`, `ProductionCostingTest.php`
- `tests/Feature/Inventory/CostingTest.php` (extend for produced goods)

---

## 16. Open business and architectural questions

1. **Formula quantity unit.** Should users enter ingredient quantities in grams while the product base is kg? (Recommendation: store base units, display the chosen unit.)
2. **Output yield.** Is `output_quantity` fixed per formula, or variable per run (e.g., 1 kg batch yields 980 g after drying)? Is the difference wastage, evaporation, or a by-product?
3. **Wastage policy.** Per-ingredient wastage %, or actual vs planned consumption recorded separately?
4. **Overhead allocation.** Should labour/packaging/utilities be added to run cost, and if so, per run or per unit?
5. **Substitution.** Can an ingredient be substituted at production time? If yes, the run must record the substitute, not the formula.
6. **Negative stock.** Should a production run be blocked when any ingredient is short, even if the product allows negative stock? (Recommendation: block by default; require an explicit override.)
7. **Who may produce.** Permission model: separate `manufacturing.create`, `manufacturing.complete`, `manufacturing.reverse`?
8. **Cancellation vs reversal.** Can a completed run be deleted, or only reversed? (Recommendation: reverse only, mirroring returns.)
9. **Cost on reversal.** If finished stock is partially sold, should reversal leave `average_cost` unchanged and record a cost note, or recompute from remaining stock? (Recommendation: leave unchanged, record the reversal value.)
10. **Nested manufacturing.** Must a produced good be usable as an ingredient in v1? (Recommendation: design for it, disable in v1.)
11. **Batch tracking.** Does the business need lot numbers/expiry for Majoon? This changes the schema materially and should be decided before P2.
12. **Existing `product_type='composite'`.** Leave it unused, or map it to "has active formula" for display only?
13. **Unit vocabulary.** Should `products.base_unit_id` be migrated to a FK `product_units.id`? (Recommendation: later, separate migration; manufacturing can work with the current string.)
14. **Historical data.** For products already sold with `cost_price = null`, should a backfill be attempted? (Recommendation: no silent recomputation; flag as estimated.)

---

## Appendix A — Verified file reference index

| Area | File |
|---|---|
| Product model | `app/Models/Product.php` |
| Product schema | `database/migrations/2026_07_25_204225_create_products_table.php` |
| Product controller | `app/Http/Controllers/ProductController.php` |
| Create request | `app/Http/Requests/Products/CreateProductRequest.php` |
| Update request | `app/Http/Requests/Products/UpdateProductRequest.php` |
| Product service | `app/Domains/Products/Services/ProductService.php` |
| Product DTO | `app/Domains/Products/DTOs/CreateProductData.php` |
| Packaging engine | `app/Domains/Products/Services/PackagingDerivationEngine.php` |
| Units | `app/Domains/Products/Services/ProductUnitService.php`, `ConversionGraphService.php` |
| Inventory service | `app/Domains/Inventory/Services/InventoryService.php` |
| Cost resolver | `app/Domains/Inventory/Services/CostResolver.php` |
| Ledger schema | `database/migrations/2026_07_25_204233_create_inventory_transactions_table.php`, `2026_11_01_000002_*`, `2026_11_01_000003_*` |
| Sale service | `app/Domains/Sales/Services/SaleService.php` |
| Sale DTOs | `app/Domains/Sales/DTOs/CreateSaleData.php`, `SaleItemData.php` |
| Purchase service | `app/Domains/Purchasing/Services/PurchaseService.php` |
| Returns | `app/Domains/Returns/Services/ReturnService.php` |
| Lifecycle policies | `app/Policies/Lifecycle/{ProductPolicy,SalePolicy,PurchasePolicy}.php` |
| Financial reports | `app/Domains/Reports/Services/FinancialReportService.php` |
| Sales reports | `app/Domains/Reports/Services/SalesReportService.php` |
| Inventory reports | `app/Domains/Reports/Services/InventoryReportService.php` |
| Product reports | `app/Domains/Reports/Services/ProductReportService.php` |
| Product form | `resources/js/Pages/inventory/components/ProductForm.tsx` |
| Product details | `resources/js/Pages/inventory/ProductDetails.tsx` |
| Dead prototype | `resources/js/Pages/inventory/components/_ProductFormPrototype.tsx` |
| POS | `resources/js/Pages/pos/SaleBill.tsx` |
| Types | `resources/js/types/index.ts`, `resources/js/lib/product-types.ts` |
| Costing tests | `tests/Feature/Inventory/CostingTest.php` |
| Return tests | `tests/Feature/Returns/ReturnServiceTest.php` |
| Report tests | `tests/Feature/Reports/FinancialReportsTest.php` |

---

*End of audit. No implementation was performed. Architectural decisions await review.*
