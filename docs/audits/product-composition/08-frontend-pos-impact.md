# 08 — Frontend POS / Sales

## 1. Page and component map

**VERIFIED.** `Pages/pos/SaleBill.tsx` is the POS page. It composes:

| Component | Path | Responsibility |
|---|---|---|
| `TransactionSearchBar` | `features/transactions/search/SearchBar.tsx` | search, arrow/Enter selection |
| Cart table (inline) | `SaleBill.tsx` | desktop rows, unit select, qty, price, discount, total |
| `MobileCartList` | `features/billing/MobileCartList.tsx` | mobile cart |
| `TransactionSummary` | `features/transactions/cart/CartSummary.tsx` | subtotal, discount, grand total |
| `PaymentPanel` | `features/transactions/payment/PaymentPanel.tsx` | method, amount, hold, clear, record |
| `ConfirmTransactionDialog` | `features/transactions/dialogs/ConfirmDialog.tsx` | confirmation |
| `ConfirmClearDialog` | `features/transactions/dialogs/ClearConfirmDialog.tsx` | clear cart |
| `ReceiptDialog` | `features/pos/components/ReceiptDialog.tsx` | success receipt |
| `MobilePaymentDrawer` | `features/billing/MobilePaymentDrawer.tsx` | mobile payment |
| `CustomerSelect` | `features/pos/components/CustomerSelect.tsx` | customer |
| `EditableQuantity` | `Pages/pos/components/EditableQuantity.tsx` | qty editing |
| `BillResponsiveWrapper` | `features/billing/BillResponsiveWrapper.tsx` | layout |

There is **no** separate cart state store: all state is local `useState` in `SaleBill.tsx`.

## 2. State and persistence

| State | Persistence |
|---|---|
| `cart`, `discount`, `customer` | `sessionStorage` keys `invenos-pos-cart`, `invenos-pos-discount`, `invenos-pos-customer` (restored on mount, saved on change) |
| `priceOverrides`, `discountPcts` | memory only |
| held sales | `sessionStorage` key `invenos-pos-held` |
| payment method / amount | memory only |

A `beforeunload` guard is installed while the cart is non-empty. There is no server-side draft.

## 3. Cart model

`CartItem`:

```ts
{
  id, productId, name, sellingUnitId?, packagingName,
  packagingQuantity, baseUnitQuantity, baseQuantity,
  unitPrice, total, category
}
```

- **One cart line per product.** `addToCart` finds an existing `productId` and increments
  `packagingQuantity` instead of adding a second line.
- `baseQuantity = packagingQuantity × baseUnitQuantity`.
- Changing the selling unit recomputes `baseUnitQuantity` and `unitPrice`.
- Custom measurement units (`__custom_gram`, `__custom_ml`, …) are client-side options with a
  factor computed from `lib/units.ts`; the server re-derives only when a real `selling_unit_id`
  is posted, otherwise it trusts `base_unit_quantity`.
- Price override and discount % are maps keyed by `productId`, not by line id.

**Composition consequence:** because one line per product is enforced, a composite product's
consumption editor should be attached to the cart line/product, not to a sale-item id. If the
same composite is added twice, quantities merge; the consumption editor must reflect the merged
quantity or allow a per-line override model.

## 4. Search and barcode

- Search filters `name` and `sku` only (`filterPOSProducts`).
- The placeholder says "name, SKU, or barcode", but **barcode is not searched**.
- `settings.pos.barcode_scanner_enabled` and `auto_focus_barcode` exist but are not wired into
  this page.
- Arrow keys/Enter are handled in `TransactionSearchBar`.
- Products with no selling unit cannot be added (silently returns).

**ABSENT:** barcode scan buffer, hardware scanner integration, quantity scan multiplier.

## 5. Stock checks

- `handleRecordSale` performs a client-side check for each cart line where
  `product.track_inventory !== false`.
- If insufficient, a dialog shows the shortage and offers **Proceed with Sale**, which posts
  `bypass_stock_check: true`.
- The server guard is the real check, but `bypass_stock_check` disables it.
- There is no check for component availability because components are not in the cart.

**Composition consequence:** the client cannot compute component availability from the current
props. It must either receive a server-computed `available`/`max_sellable` value per composite or
rely on the server to reject and display a structured error.

## 6. Checkout and API request

`doSubmitSale(bypassStockCheck)` posts:

```json
{
  "items": [{
    "product_id", "quantity", "packaging_quantity", "packaging_name",
    "selling_unit_id", "base_unit_quantity", "unit_price", "total"
  }],
  "customer_id", "discount", "amount_paid", "payment_method",
  "payment_status", "source": "pos", "date", "bypass_stock_check": true
}
```

- `payment_status` is derived on the client.
- No idempotency key.
- On success, the receipt is built **client-side** with fake `saleId`/`invoiceNumber`.
- On error, the first error value is toasted as a string.

## 7. Receipt

`ReceiptDialog` shows a success card, item summary, totals and payment. "Print Receipt" and
"Share Receipt" are prototype toasts. "View Sale" navigates to `/sales/${saleData.saleId}`, where
`saleData.saleId` is `sale-${Date.now()}` — **not** a valid sale id. The real sale is accessible
only from the Sales list.

**Composition consequence:** a consumption summary would be useful on the receipt if the
business wants transparency ("used 5 ml serum"), but it must not look like sold line items.

## 8. Keyboard, touch and mobile

- `Ctrl/Cmd+Enter` opens the confirm dialog.
- `TransactionSearchBar` supports ArrowUp/Down/Enter/Escape.
- Desktop table and mobile card list are separate render paths (`hidden sm:flex` vs
  `block sm:hidden`).
- Mobile uses `MobilePaymentDrawer` and `MobileCartList`.
- No explicit `aria-label` on most icon buttons; several rely on `title`.

**Composition consequence:** a consumption editor must work in both desktop and mobile paths.
The existing `Dialog`/`Sheet` components are responsive enough; do not build a new modal system.

## 9. Where the consumption editor belongs

**PROPOSED.**

| Placement | Pros | Cons |
|---|---|---|
| **On add-to-cart for a consumption product** | Operator decides at capture time; clear intent | Interrupts fast scanning |
| **A "Consumption" button on the cart line** | Non-blocking; default template is used if never opened | Easy to forget |
| **Checkout review step** | One place to confirm all components | Too late for a long cart |

Recommended hybrid:

1. Adding a consumption product uses the saved template automatically (fast path).
2. The cart line shows a badge and a small "Consumption" action.
3. Opening it shows a modal/sheet with component rows, default quantities × sold quantity,
   and an override input.
4. Checkout shows a compact "will consume N components" review; shortages are surfaced there
   and the sale is blocked server-side.

The editor must never modify the saved template. It sends only the per-sale overrides.

## 10. Representation of formula products

| Surface | Recommendation |
|---|---|
| Search result | Small badge ("Formula"/"Service") next to the name |
| Cart line | Badge + "Consumption" action; quantity remains the commercial unit |
| Confirm dialog | Show sold commercial line; optionally a collapsible consumption summary |
| Receipt | Optional "Materials used" section, visually separate from items |
| Product picker | No filtering by default; a chip filter if catalogs grow |

Do **not** explode components into cart lines. That would:
- show ingredient quantities as sold items;
- multiply revenue lines;
- make returns ambiguous;
- break the "one line per product" invariant.

## 11. Error and loading states

- Sale submission uses Inertia `onError` and a single toast.
- There is no per-field error display.
- There is no optimistic cart persistence on the server.
- A server rejection of a component shortage must map to a readable message; recommended shape:
  `{ items: "Insufficient Serum: need 10 ml, available 4 ml" }`.

## 12. Findings summary

1. **VERIFIED:** POS is a single page with local state and sessionStorage cart.
2. **VERIFIED:** one cart line per product; selling-unit changes recompute base quantity.
3. **VERIFIED:** barcode is not searched despite the placeholder.
4. **VERIFIED:** the client can bypass the stock guard and the receipt is fabricated.
5. **RISK:** the client cannot compute component availability; server must be authoritative.
6. **PROPOSED:** default-template consumption with an optional per-line override editor.
