# 12 — API, Serialization & Integrations

## 1. Transport reality

**VERIFIED.**

- There is **no `routes/api.php`**.
- The UI is server-rendered through **Inertia**; pages receive raw Eloquent arrays.
- A small number of JSON endpoints exist inside `routes/web.php`.
- There are **no API Resources**, no transformers, no versioning, no OpenAPI schema, no webhooks
  and no external integrations.

## 2. JSON endpoints

| Endpoint | Auth | Route exists? | Behavior |
|---|---|---|---|
| `GET /inventory/generate-sku` | yes | yes | `{sku}`; UI never calls it |
| `GET /api/dashboard/metrics` | **no** | yes (outside the auth group) | today's sales/returns/purchases/expenses/low stock/receivables/recent sales |
| `POST /api/prescriptions/{id}/images` | yes | yes | upload |
| `GET /api/prescriptions/{id}/images` | yes | yes | list |
| `DELETE /api/prescription-images/{id}` | yes | yes | delete |
| `GET /api/prescription-images/{id}/download` | yes | yes | download |
| `GET /inventory/product-units` | – | **no** | dead; called by `UnitRelationEditor` |
| `GET /inventory/measurement-options` | – | **no** | dead |
| `GET /inventory/preview-packaging` | – | **no** | dead |

**RISK:** `/api/dashboard/metrics` is unauthenticated and exposes business totals.

## 3. Inertia payload shapes that matter

| Page | Props | Notes |
|---|---|---|
| `inventory/ProductList` | `products[]`, `categories[]`, `meta`, `filters` | raw product arrays incl. cost fields, selling units, `product_type` |
| `inventory/CreateProduct` | `categories`, `products`, `generated_sku` | sends up to 999 products to the browser |
| `inventory/ProductDetails` | `product`, `movements`, `purchases`, `sales`, `lifecycle` | last 20 of each; `product` raw |
| `inventory/EditProduct` | `product`, `categories`, `products` | raw |
| `sales/SaleBill` | `products[]`, `customers[]` | all non-archived products with selling units |
| `sales/SaleDetail` | `sale` with items/customer | |
| `returns/ReturnPage` | `transactions`, `type`, `strategy`, `title`, `isPurchase`, `backPath` | raw sales/purchases with items |
| reports | service output arrays | server-computed |

### Serialization risks

1. **Over-exposure:** raw models expose `deleted_at`, `archived_by`, `archive_reason`, costs and
   `product_type`. A formula relation added to the model would be serialized everywhere unless
   explicitly eager-loaded/shaped.
2. **Payload size:** `CreateProduct`/`EditProduct` send `search(perPage: 999)`; the POS sends all
   products. A formula builder must **not** reuse "send everything".
3. **No stable contract:** field names are snake_case in props, camelCase in the TS domain
   adapters, and some pages normalize manually. A formula payload should be explicit and typed.

## 4. Recommended formula representation

**PROPOSED.** Use a dedicated prop only where needed:

```json
{
  "composition": {
    "id": 12,
    "kind": "consumption",
    "version": 3,
    "is_active": true,
    "output_quantity": 1,
    "output_unit": "piece",
    "items": [
      {
        "id": 40,
        "component_product_id": 11,
        "component_name": "Serum",
        "base_unit": "ml",
        "quantity": 2,
        "display_unit": "ml",
        "is_optional": false,
        "estimated_unit_cost": 12.5
      }
    ],
    "estimated_cost": 25.0,
    "cost_basis": "estimated"
  }
}
```

Rules:

- Do not attach `composition` to every product payload; only the detail page and the POS product
  capability summary.
- Do not expose `composition_runs` internals to the POS.
- Expose a minimal capability flag to POS: `has_composition`, `composition_kind`,
  `max_sellable_estimate` (optional).
- Expose permissions separately (`can_edit_composition`, `can_override_consumption`).
- Keep calculation details server-side; never trust client-submitted component costs.

## 5. Barcode interfaces

**VERIFIED:** barcode is a string column with no unique constraint and no index. POS search
ignores it. No scanner integration exists. `settings.pos.barcode_scanner_enabled` and
`auto_focus_barcode` are stored but unused.

**Composition relevance:** a composite can have a barcode for the commercial product. Component
barcodes are independent. No change is needed unless a scan should open the consumption editor.

## 6. Import / export

**VERIFIED ABSENT:** product import, product export, inventory import, company migration and data
portability tools do not exist. The only exports are report CSV/XLSX/PDF through
`ExportService`.

**Composition consequence:** there is no import format to extend. If product export is added
later, include composition as nested rows with a stable schema version.

## 7. External integrations

**VERIFIED ABSENT:** no webhooks, queues to external services, payment gateways, accounting
integrations, e-commerce sync or barcode hardware SDKs.

## 8. API versioning and compatibility

- No versioning exists.
- Inertia props are effectively an internal, unversioned contract; React pages and controllers
  must change together.
- A future JSON API for composition should be additive and versioned (`/api/v1/...`) rather than
  bolted onto the Inertia endpoints.

## 9. Findings summary

1. **VERIFIED:** Inertia + a handful of JSON endpoints; no API layer.
2. **VERIFIED:** raw models are serialized; no Resources.
3. **VERIFIED:** one dashboard metrics endpoint is unauthenticated.
4. **ABSENT:** product import/export, webhooks, barcode integration, versioning.
5. **PROPOSED:** a narrowly scoped `composition` prop plus capability flags, never raw run data.
