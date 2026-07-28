import { formatCurrency } from '@/lib/format'

export interface PrintItem {
  sr: number
  name: string
  unit: string
  quantity: number
  unitPrice: number
  discount?: number
  total: number
}

interface InvoiceItemsTableProps {
  items: PrintItem[]
  receipt?: Record<string, any>
}

/** Items table with column visibility controlled by receipt toggles */
export default function InvoiceItemsTable({ items, receipt }: InvoiceItemsTableProps) {
  if (items.length === 0) return null

  const r = receipt || {}
  const showUnit = r.show_item_unit !== false
  const showDisc = r.show_item_discount !== false

  return (
    <table className="w-full border-collapse text-sm mb-2">
      <thead>
        <tr className="border-b-2 border-gray-800">
          <th className="py-2 pr-1 text-left text-xs font-semibold uppercase text-gray-500 w-8">#</th>
          <th className="py-2 pr-2 text-left text-xs font-semibold uppercase text-gray-500" style={{width: showDisc ? '34%' : '44%'}}>Product</th>
          {showUnit && <th className="py-2 pr-2 text-left text-xs font-semibold uppercase text-gray-500 w-14">Unit</th>}
          <th className="py-2 pr-2 text-right text-xs font-semibold uppercase text-gray-500 w-16">Qty</th>
          <th className="py-2 pr-2 text-right text-xs font-semibold uppercase text-gray-500 w-20">Price</th>
          {showDisc && <th className="py-2 pr-2 text-right text-xs font-semibold uppercase text-gray-500 w-14">Disc</th>}
          <th className="py-2 text-right text-xs font-semibold uppercase text-gray-500 w-22">Total</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.sr} className="border-b border-gray-200">
            <td className="py-2 pr-1 text-gray-500 align-top">{item.sr}</td>
            <td className="py-2 pr-2 text-gray-900 align-top" style={{wordBreak:'break-word'}}>{item.name}</td>
            {showUnit && <td className="py-2 pr-2 text-gray-600 align-top">{item.unit}</td>}
            <td className="py-2 pr-2 text-right text-gray-900 align-top tabular-nums">{item.quantity}</td>
            <td className="py-2 pr-2 text-right text-gray-900 align-top tabular-nums">{formatCurrency(item.unitPrice)}</td>
            {showDisc && (
              <td className="py-2 pr-2 text-right text-gray-500 align-top tabular-nums">
                {item.discount ? `${item.discount}%` : '—'}
              </td>
            )}
            <td className={`py-2 text-right text-gray-900 font-semibold align-top tabular-nums ${showDisc ? '' : 'w-24'}`}>
              {formatCurrency(item.total)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
