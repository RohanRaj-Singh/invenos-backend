# Bill Page Responsive Redesign — Purchase & Sale

Both the **New Purchase** (PurchaseBill.tsx) and **Create Sale** (SaleBill.tsx) pages share the same layout pattern. Desktop works well. Mobile overflows and scrolls.

---

## Current Layout (Desktop)

```
┌──────────────────────────────────────────────────────┐
│ [Icon] New Purchase            [Supplier Combobox]   │  ← header row
│ Mon, 27 Jul 2026 · 12:07 am                         │
├──────────────────────────────────────────────────────┤
│ 🔍 Search product by name or SKU... (Enter to add)   │  ← search
├──────────────────────────────────────────────────────┤
│ # │ Product   │ Pack  │ Qty  │ Cost  │ Total  │ [×] │  ← table header
│───│───────────│───────│──────│───────│────────│─────│
│ 1 │ Amoxil    │ Strip │  5   │ 425   │  425   │  ✕  │  ← row
│ 2 │ Panadol   │ Box   │  3   │ 525   │  525   │  ✕  │
├──────────────────────────────────────────────────────┤
│                                      Subtotal 1,025  │
│                                      Discount    0   │
│                                      Total   1,025   │
├──────────────────────────────────────────────────────┤
│ [Payment Panel: method / paid / change]              │
│                [Hold] [Clear] [Confirm Sale]         │
└──────────────────────────────────────────────────────┘
```

### What overflows on mobile

| Section | Problem |
|---------|---------|
| **Header** | Title + supplier combobox side-by-side — combobox gets squashed to 0 width on < 480px |
| **Table** | 7 columns on 375px viewport → each column gets ~50px → text clips, table overflows container |
| **Product name** | `truncate` keeps it in one line but at 50px column width only ~5 chars show |
| **Payment panel** | Multiple controls in a single row force wrapping, some controls get pushed off-screen |
| **Bottom bar** | Hold / Clear / Confirm buttons stack awkwardly |

---

## Proposed Mobile-First Redesign

**Strategy**: Keep the desktop layout untouched. Add a **separate mobile cart component** that renders as a stacked card list instead of a table when the viewport is < 640px.

```
Desktop (> 640px):     table as-is
Mobile (< 640px):      card list + simplified header + bottom drawer
```

### Mobile Layout (640px breakpoint)

```
┌───────────────────────────┐
│ [←] New Purchase          │  ← compact header, supplier moved into a
│     Supplier: Acme Corp   │     touch-friendly dropdown button
├───────────────────────────┤
│ 🔍 Search products...     │  ← same search, full width
├───────────────────────────┤
│ ┌───────────────────────┐ │  ← card list replaces table
│ │ Amoxil 250mg Capsules │ │
│ │ Strip · 10 capsules   │ │
│ │ ────────── │ ─────── │ │
│ │ Qty: [-] 5 [+]        │ │
│ │ Cost: Rs. 425         │ │
│ │ Total: Rs. 425   [✕]  │ │
│ └───────────────────────┘ │
│ ┌───────────────────────┐ │
│ │ Panadol 500mg Tablets │ │
│ │ Box · 100 tablets     │ │
│ │ ────────── │ ─────── │ │
│ │ Qty: [-] 3 [+]        │ │
│ │ Cost: Rs. 525         │ │
│ │ Total: Rs. 525   [✕]  │ │
│ └───────────────────────┘ │
├───────────────────────────┤
│ Subtotal: Rs. 950         │  ← footer summary
│                    [Next] │  → opens payment drawer
└───────────────────────────┘
```

### Payment Drawer (mobile)

```
┌───────────────────────────┐
│ Payment                  │  ← slide-up drawer
├───────────────────────────┤
│ Method: [Cash ▾]          │
│ Amount: [950        ]     │
│ Change: Rs. 0             │
├───────────────────────────┤
│ [Hold]     [Clear]        │
│ [✓ Confirm Sale]          │
└───────────────────────────┘
```

---

## Component Architecture

```
PurchaseBill (existing)                    SaleBill (existing)
       │                                         │
       │ wraps                                    │ wraps
       ▼                                         ▼
┌──────────────────────────────────────┐
│        BillResponsiveWrapper         │  ← new shared component
│  (reads viewport width, picks mode)  │
└──────────────────────────────────────┘
       │                     │
       ▼                     ▼
┌──────────────┐    ┌──────────────────┐
│ BillTable    │    │  MobileCartList  │  ← new component
│ (existing)   │    │  (card-based)    │
│ desktop >640 │    │  mobile <640     │
└──────────────┘    └──────────────────┘
```

### Shared sub-components

| Component | Desktop | Mobile |
|-----------|---------|--------|
| `BillHeader` | Full header with combobox | Compact header with supplier dropdown button and modal selector |
| `BillSearchBar` | Existing `TransactionSearchBar` | Same — already full width |
| `BillItems` | `<table>` with fixed columns | `<MobileCartCard>` list with inline qty/cost/total |
| `BillPaymentPanel` | Sidebar panel | Bottom drawer opened by "Proceed to Payment" button |
| `BillFooter` | Hold / Clear / Confirm row | Sticky bottom bar with count + "Next" button |

---

## Implementation Plan

### 1. Create `BillResponsiveWrapper.tsx`

Detects viewport via a `useWindowWidth` hook or CSS-based show/hide.

```tsx
// Simple CSS approach — render both, show/hide via Tailwind
// The extra DOM is negligible (one extra div + table vs cards)
export default function BillResponsiveWrapper({ table, cards }: Props) {
  return (
    <>
      <div className="hidden sm:block">{table}</div>
      <div className="block sm:hidden">{cards}</div>
    </>
  )
}
```

### 2. Create `MobileCartList.tsx`

Renders cart items as stacked cards (shared between Purchase and Sale).

Each card shows:
- Product name (wraps naturally, no truncation)
- Pack/unit info
- Quantity stepper (inline - / +)
- Unit cost (label: "Cost" for purchase, "Price" for sale)
- Total cost
- Delete button

```tsx
interface MobileCartCardProps {
  item: CartItem
  index: number
  costLabel?: string   // "Cost" or "Price"
  onUpdateQty: (id: string, delta: number) => void
  onDelete: (id: string) => void
}
```

### 3. Create `MobilePaymentDrawer.tsx`

Slide-up drawer with payment method, amount input, and action buttons.

Shared between Purchase and Sale with configurable props.

### 4. Refactor existing headers

Extract `SupplierCombobox` / `CustomerSelect` behind a responsive wrapper that renders a modal selector on mobile instead of an inline dropdown.

### 5. Shared state

Both pages already use `useState` for cart, payment, etc. The mobile variants consume the same state — no new state management needed.

---

## CSS Strategy

No separate CSS file. Use Tailwind responsive prefixes:

| Pattern | Purpose |
|---------|---------|
| `hidden sm:block` | Desktop-only content |
| `block sm:hidden` | Mobile-only content |
| `sm:table` | Table only on desktop |
| `text-sm sm:text-base` | Scaled text |
| `w-full sm:w-auto` | Width adaptation |

---

## File Changes

| File | Change |
|------|--------|
| `features/billing/BillResponsiveWrapper.tsx` | **New** — viewport-aware container |
| `features/billing/MobileCartList.tsx` | **New** — card-based cart items |
| `features/billing/MobilePaymentDrawer.tsx` | **New** — bottom payment drawer |
| `features/billing/BillHeader.tsx` | **New** — responsive header wrapping existing SupplierCombobox / CustomerSelect |
| `Pages/purchases/PurchaseBill.tsx` | Extract cart items into MobileCartList; wrap in BillResponsiveWrapper |
| `Pages/pos/SaleBill.tsx` | Same changes |

---

## Desktop Preservation

- All existing HTML/React code stays in place
- The `sm:block` / `hidden` pattern ensures desktop sees the current table layout
- Only the `sm:hidden` mobile blocks are new
- No existing CSS or component names change
- No desktop behaviour, layout, or interaction changes
