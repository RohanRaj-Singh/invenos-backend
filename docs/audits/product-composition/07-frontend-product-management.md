# 07 — Frontend Product Management

## 1. Pages and routes

**VERIFIED.**

| Route | Page component | Wrapper |
|---|---|---|
| `GET /inventory` | `Pages/inventory/ProductList.tsx` | direct |
| `GET /inventory/add` | `Pages/inventory/CreateProduct.tsx` | renders `components/ProductForm.tsx` |
| `GET /inventory/product/{id}` | `Pages/inventory/ProductDetails.tsx` | direct |
| `GET /inventory/product/{id}/edit` | `Pages/inventory/EditProduct.tsx` (wrapper) | renders `components/ProductForm.tsx` |

Dead/duplicate page files exist (`ProductForm.tsx` at page level, `AddProduct.tsx`) and are not
routed.

## 2. Product list

`ProductList.tsx`:

- reads `products`, `categories`, `meta`, `filters` from Inertia props;
- **server-side** search/category/stock/archived/per-page via `router.get('/inventory', ...,
  { only: ['products','meta','filters'], preserveState: true, replace: true })`;
- completion status is computed **client-side** on the loaded page only;
- renders `ProductTable` on desktop and `ProductCardView` on mobile;
- total stock value is computed with `last_purchase_cost ?? default_purchase_cost`, i.e. a
  different basis from the reports.

`ProductTable.tsx` columns: product, SKU, category, stock, purchase price, sale price, value,
status, chevron. `ProductFilters.tsx`: search, category chips, stock chips, completion chips,
active/archived chips, mobile filter drawer.

**Composition relevance:** this list has no product-type column and no composition badge. A
formula product will look identical to a simple product. If the business needs to distinguish
them, add a read-only badge/prop rather than a filter that changes queries.

## 3. Add/Edit form

`components/ProductForm.tsx` is the only live form (hand-rolled state, no `<form>`, no
`useForm`).

### Structure

1. Product name (required, autofocus).
2. Your Cost / Selling Price.
3. Unit + Category (autocomplete; category "create on type" only writes the name into local
   state — it does not create a category).
4. **Unit relationships** — `components/unit/UnitRelationEditor.tsx`.
5. Collapsible **More Options**: barcode, SKU, starting/current stock, minimum stock, allow
   negative stock, description.
6. Sticky save bar: Enter = Save & Add Next, Ctrl/Cmd+Enter = Save & View.

### Payload

`buildPayload()` returns:

```ts
{
  name, sku, category_id, barcode, description,
  product_type: 'simple',       // hard-coded
  base_unit_id, selling_units, packaging,
  stock_quantity: stockQty,     // posted on BOTH create and edit
  low_stock_threshold,
  default_purchase_cost,
  allow_negative_stock,
  status
}
```

**VERIFIED:** `product_type` is hard-coded to `'simple'` (`ProductForm.tsx:177`). There is no UI
to choose a type, and the backend ignores it.

**RISK:** on edit, the form renders current stock as read-only text but still includes
`stock_quantity` in the payload from state (`openingStock` initialized to
`product.stock_quantity`). `ProductService::update` therefore writes stock directly. The UI does
not look like it changes stock, but the request does.

**RISK:** the unit autocomplete in `UnitRelationEditor` calls
`GET /inventory/product-units`, which has **no route**. Suggestions never appear; Enter on the
field bubbles to the global save handler.

**RISK:** the client relationship transformer can emit `container_unit_id: null` /
`contains_unit_id: null` for unfinished rows, while the server requires them
(`required_with:packaging`). A product with an incomplete relationship can fail with a 422.

**Validation:** only `name.trim()` is checked client-side. All server errors are joined into one
toast via `onError`. There are no field-level errors, no dirty-state guard, and no unsaved-change
confirmation.

## 4. Product detail

`ProductDetails.tsx`:

- header with stock badge, completion badge, archived badge;
- actions: Adjust Stock, Edit, Archive/Unarchive, Delete (admin-gated, disabled by server
  `deleteBlocker`);
- tabs built from an inline array: `Overview`, `Stock Movements`, `Purchase History`,
  `Sales History`;
- Overview cards: details (category, **product type**, track inventory, status, description),
  stock, pricing (cost, selling, margin);
- `AdjustStockDialog` posts `/inventory/adjust` with type `adjustment|damage|consumption` and a
  signed quantity (the dialog forces damage/consumption negative).

**Composition relevance:** the tab array at `ProductDetails.tsx` is the natural insertion point
for a `Formula` / `Recipe` tab. It adds zero cost to the create flow because it is only fetched
for the detail page.

## 5. Where a Formula Builder should live

**PROPOSED.**

| Option | Cost to simple-product flow | Assessment |
|---|---|---|
| **Formula tab on product detail** | Zero; loaded only when the page/tab is opened | **Recommended** |
| Collapsed section in More Options | One extra collapsed row; payload can omit the key when untouched | Good secondary entry |
| Type toggle on create ("I buy / I make") | Slows the fast create path; requires a real `product_type` write path | **Not recommended** |
| Separate "Formula Product" create page | Duplicates product creation and splits the catalog | Rejected |

Recommended behavior:

1. Product create/edit payload remains unchanged.
2. Product detail adds `composition` prop (null for simple products).
3. The Formula tab loads lazily (server prop or a JSON endpoint) and lets the user add, edit,
   reorder and remove components.
4. Saving a formula never touches `products.stock_quantity` and never creates an inventory row.

## 6. Formula builder UX requirements

| Requirement | Existing pattern to reuse |
|---|---|
| Component search | `ProductList` server search or a new JSON product search; do not send all products |
| Unit selection | `ProductUnitService` conventions; display the component's base unit and allow measurement conversion |
| Quantity input | `EditableQuantity` or a plain numeric input with `step` |
| Add/remove rows | `UnitRelationEditor` row pattern (plus icon, delete icon, inline validation) |
| Scaling preview | Show "per 1 unit × N" totals |
| Cost preview | Use component `average_cost`/`CostResolver`, display estimated only |
| Loading state | `ReportSkeleton` pattern or a simple skeleton |
| Empty state | `ProductTable` empty state pattern |
| Server errors | `onError` toast; add field-level errors if the builder is large |
| Large component lists | Server-side search/pagination; cap visible rows or virtualize |
| Unsaved changes | Add `beforeunload` guard (POS already does this) |
| Mobile | Use `Sheet`/drawer for the picker; keep the list scrollable |

### Invalid composition guards to surface

- a product cannot contain itself;
- duplicate component rows should merge or be rejected;
- quantity must be > 0;
- incompatible units must be rejected (count vs weight vs volume vs length);
- archived/deleted components cannot be added;
- a component that tracks no inventory needs an explicit decision;
- cycles (composite within composite) must be rejected server-side, even if the UI hides them.

## 7. Product type / capability display

`ProductDetails.tsx:238` prints `product.product_type || 'Simple'`. If composition is implemented
without changing `product_type`, this line will continue to say "Simple" for a formula product.
**PROPOSED:** derive the display from composition presence ("Formula" badge) and leave
`product_type` untouched. Do not backfill `product_type='composite'` unless a migration and all
readers are updated.

## 8. Frontend state and API integration

- Inertia `router` for navigation and mutations; `axios` only in the unit autocomplete (dead).
- No global state library: page-level `useState`.
- No optimistic updates; a successful save triggers an Inertia redirect/reload.
- No client-side pagination for products; the server paginates.
- No form schema validation library.

A formula builder can follow the same local-state + `router.post/put` pattern. If the builder is
large, a single form submit is still preferable to per-row requests, to keep the formula
transactional.

## 9. Findings summary

1. **VERIFIED:** the live product form is a single hand-rolled component; add/edit share it.
2. **VERIFIED:** `product_type` is hard-coded and inert.
3. **VERIFIED:** the product edit request can overwrite stock.
4. **VERIFIED:** the unit autocomplete endpoint is missing.
5. **PROPOSED:** attach formula management to the detail page, not the create path.
