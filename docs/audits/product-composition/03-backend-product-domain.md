# 03 — Backend Product & Domain Entities

## 1. Layering

**VERIFIED.** The backend follows a light domain-service pattern:

```
routes/web.php
  → Controller (thin)
    → FormRequest (validation)
      → DTO (readonly constructor)
        → Domain Service
          → Eloquent model
            → DB::transaction
```

There are **no repositories**, **no API Resources**, **no events/observers**, and **no Actions
classes in use** (`app/Domains/*/Actions` directories exist only to satisfy the architecture
test). Business logic is centralized in services, but several small rules are duplicated.

## 2. Product routes and controller methods

| Route | Controller method | Routed? | Notes |
|---|---|---|---|
| `GET /inventory` | `InventoryController@index` | yes | `ProductController@index` is **dead** (no route) |
| `GET /inventory/add` | `ProductController@create` | yes | props: categories, all products, generated SKU |
| `POST /inventory` | `ProductController@store` | yes | |
| `GET /inventory/product/{id}` | `ProductController@show` | yes | props: product, movements, purchases, sales, lifecycle |
| `GET /inventory/product/{id}/edit` | `ProductController@edit` | yes | |
| `PUT /inventory/product/{id}` | `ProductController@update` | yes | |
| `DELETE /inventory/product/{id}` | `ProductController@destroy` | yes | lifecycle, admin gate |
| `POST /inventory/product/{id}/archive` | `ProductController@archive` | yes | admin gate |
| `POST /inventory/product/{id}/unarchive` | `ProductController@unarchive` | yes | admin gate |
| `GET /inventory/generate-sku` | `ProductController@generateSku` | yes | UI uses a client-side generator instead |
| `GET /inventory/product-units` | `ProductController@productUnits` | **no** | `UnitRelationEditor` calls it → 404 |
| `GET /inventory/measurement-options` | `ProductController@measurementOptions` | **no** | dead |
| `GET /inventory/preview-packaging` | `ProductController@previewPackaging` | **no** | dead |

**Evidence:** `routes/web.php` lines 21–36; `app/Http/Controllers/ProductController.php`.

## 3. Controllers

### `ProductController`

- `create`, `store`, `show`, `edit`, `update` render/redirect and delegate to `ProductService`,
  `PackagingDerivationEngine`, `ProductUnitService`, `InventoryService` (read-only) and
  `ProductPolicy`.
- `store` performs SKU/barcode collision handling by rebuilding `CreateProductData`.
  **RISK:** both reconstructions omit `packaging`.
- `show` loads only the last 20 movements/purchases/sales and calls
  `ProductPolicy::deleteBlocker()`.
- `destroy`/`archive`/`unarchive` call `authorize('lifecycle.*')`, which is admin-only.
- No `authorize()` on `create/store/edit/update`.

### `InventoryController`

- `index` is the real product list. It uses `InventoryService::search`, allowlists page sizes,
  and supports `archived=active|archived|all`.
- `adjust` validates `product_id` exists and is not archived, then calls
  `InventoryService::recordTransaction`.
- `overview`, `movements`, `lowStock`, `valuation` are read surfaces.

## 4. Form requests

### `CreateProductRequest`

Required: `name`, `sku`, `base_unit_id`.

Validates but does not persist:
- `allow_negative_stock` (validated, absent from `CreateProductData`),
- `product_type` (not validated at all).

Packaging rules use `required_with:packaging`; selling-unit price uses
`required_with:selling_units`.

### `UpdateProductRequest`

Same shape, plus inline closures for SKU/barcode uniqueness that query the database directly
and ignore `deleted_at` only because they call `withTrashed()`.

**RISK:** `stock_quantity` is validated and passed to `ProductService::update`, which writes it
directly. This is the single most important pre-existing integrity defect for composition.

### Other requests

`CreateSaleRequest`, `CreatePurchaseRequest`, `CreateSaleReturnRequest`,
`CreateContactRequest`, `UpdateSettingsRequest` all return `authorize(): true`.

## 5. DTOs

### `CreateProductData`

Fixed-arity readonly constructor. Fields: name, sku, barcode, categoryId, description,
baseUnitId, trackInventory, lowStockThreshold, stockQuantity, defaultPurchaseCost,
supplierName, location, createdBy, sellingUnits, purchaseConfig, packaging.

- `fromRequest()` maps snake_case.
- `toArray()` persists only product columns; it does **not** include `product_type`,
  `allow_negative_stock`, or composition.
- Any new key must be threaded through:
  1. `fromRequest()`,
  2. `toArray()`,
  3. both collision reconstructions in `ProductController::store()`.

### Sale/purchase DTOs

`CreateSaleData`, `SaleItemData`, `CreatePurchaseData`, `PurchaseItemData` are readonly and
carry client-supplied prices/quantities. See documents 05 and 06.

## 6. Services

### `ProductService`

| Method | Behavior | Composition relevance |
|---|---|---|
| `search` | name/SKU/barcode, category, paginated, eager loads category + selling units | New component picker can reuse |
| `create` | DB transaction; product insert; opening `adjustment` ledger row written **directly**; status; packaging + derivation; selling units; default enforcement | Formula must **not** create stock; do not attach here |
| `update` | DB transaction; `update($data)` writes stock directly; packaging replace + re-derive; custom selling-unit sync; status | Do not add stock-affecting formula behavior here |
| `delete` | deletes packaging, soft-deletes product | Composition membership must block deletion |
| `restore` | restore product | Should formula survive independently |
| `get` | `withArchived()` + category + selling units + packaging units | Add composition relation here for detail props |
| `generateSku` | prefix from name + count | Unrelated |
| `allCategories` | category list | Reusable for component filters |

### `PackagingDerivationEngine`

Write-time only; one-way `product_packaging → selling_units`. Computes transitive factors,
updates existing units without overwriting business fields, cleans up orphans. **No callers on
read paths.** Do not reuse for formulas.

### `ProductUnitService`

Single backend source for unit display and conversion (`resolveDisplayUnit`,
`resolveSellingUnit`, `resolvePurchaseUnit`, `getMeasurementType`, `getMeasurementOptions`,
`getConversionFactor` private). It is the correct service for formula unit conversion.

### `CostResolver`

`unitCost()` order: `average_cost` → `opening_cost` → latest purchase line `unit_cost_base` →
latest `unit_cost / pack_qty` → `last_purchase_cost / pack` → `default_purchase_cost / pack` →
`null`. `costBasis()` returns `exact`, `estimated`, `unavailable`. Use this for component cost
at execution.

## 7. Duplicated rules (verified)

| Rule | Implementations |
|---|---|
| Status recalculation | `InventoryService::applyMovement`, `ProductService::create`, `ProductService::update`, `SaleReturnService::recalculateStatus`, `PurchaseReturnService::create` |
| Base-unit conversion | `ProductUnitService`, `SaleService` (selling unit re-read), `PurchaseService` (pack × qty), frontend `units.ts` |
| Cost resolution | `CostResolver`, `InventoryService::getValuation` (sale price), `InventoryReportService::productCost` (legacy per-pack), `FinancialReportService` SQL, `ProductReportService` (last purchase cost), `PurchaseService` averaging |
| Stock writes | `InventoryService`, `ProductService::create`, `ProductService::update`, `SaleReturnService`, `PurchaseReturnService` |

This duplication is the main reason a new formula path must not invent another stock or cost
implementation.

## 8. Transaction boundaries

| Operation | Transaction? | Verified |
|---|---|---|
| `ProductService::create` | yes (`DB::transaction`) | yes |
| `ProductService::update` | yes | yes |
| `ProductService::delete` | yes | yes |
| `InventoryService::applyMovement` | **no** | yes; relies on caller |
| `SaleService::create` | yes | yes |
| `PurchaseService::create` | yes | yes |
| `ReturnService::createReturn` | yes | yes |
| `ReturnService::completeReturn` | yes | yes |
| `ReturnService::reverseReturn` | yes | yes |
| `RecordLifecycleService::archive` | **no** | yes (unarchive/delete/restore are wrapped) |
| `TransactionEngine::process` | yes | yes, but unreachable |

## 9. Events, observers and jobs

**ABSENT.** No model observers, no events/listeners, no queued domain jobs. The only listener-
like code is Laravel's auth email verification notification. Side effects are explicit service
calls, which is good for deterministic composition execution but means nothing happens
automatically on product/formula change.

## 10. Dead / unreachable code that composition must not reuse

| Item | Evidence | Decision |
|---|---|---|
| `TransactionEngine` | `app/Domains/Transactions/Services/TransactionEngine.php`; registered in `TransactionServiceProvider`, no consumer | Do not revive; it calls `InventoryService::applyMovement()` which is **private** |
| `SaleType`/`ReturnType` registry | only used by the engine | Unused |
| `SaleReturnService::create`/`PurchaseReturnService::create` | legacy direct ledger writers; `SaleReturnService` is injected into `SaleReturnController`, whose `store()` has no route but is still exercised by `ArchivedProductTest`; `PurchaseReturnService` has no consumer | Do not use for composition; do not remove without updating tests |
| `ConversionGraphService`, `RelationshipTransformer`, `RelationshipGraphValidator` | zero callers | Do not build on them |
| `ProductController` JSON endpoints | no routes | Do not expose without adding routes |
| `product_type` | no writer/reader | Do not add semantics |

## 11. How formula definitions fit

**PROPOSED**, following existing conventions:

| Concern | Implementation |
|---|---|
| Model | `App\Models\ProductComposition`, `ProductCompositionItem`, `CompositionRun`, `CompositionRunItem` |
| Service | `App\Domains\Composition\Services\CompositionService` (CRUD), `CompositionResolver`, `CompositionValidator`, `ConsumptionExecutor`, `CompositionCostCalculator` |
| Controller | `ProductCompositionController` (nested under product) or props on `ProductController@show` |
| Request | `SaveCompositionRequest` with `components.*` rules |
| Validation | component exists, not archived, `track_inventory`, quantity > 0, no self-reference, cycle detection, unit compatibility |
| Reads | product detail props `composition` (only for the detail page) |
| Writes | additive tables only; no product-table change |
| Versioning | `version` + `is_active`; runs store `template_version` + `template_snapshot` |

The existing service style (readonly DTO, `DB::transaction`, controller delegation) should be
followed. Do not put formula logic in `ProductService` beyond a read relation, to avoid touching
the most-used create/update path.

## 12. Authorization in the product domain

Only lifecycle actions are gated. There is no `products.create` / `products.edit` enforcement
even though those permissions are seeded. A formula permission set must be enforced in
controllers/requests, not only in React.

## 13. Findings summary

1. **VERIFIED:** product logic is centralized in `ProductService`, but stock/status/cost rules
   are duplicated across five services.
2. **VERIFIED DEFECT:** product update writes stock without a ledger row.
3. **VERIFIED DEFECT:** `TransactionEngine` calls a private method.
4. **VERIFIED DEFECT:** SKU/barcode collision drops packaging.
5. **RISK:** `product_type` is fillable but unvalidated and never written; any future writer
   could create a meaningless `composite` label.
6. **ABSENT:** composition relations, formula validation, formula permissions.
