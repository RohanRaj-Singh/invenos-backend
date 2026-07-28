import { formatCurrency } from '@/lib/format'

interface InvoiceTotalsProps {
  subtotal: number
  discount: number
  grandTotal: number
  amountPaid: number
  outstanding: number
  paymentStatus: string
  paymentMethod?: string
  receipt?: Record<string, any>
}

/** Totals section — line visibility controlled by receipt toggles */
export default function InvoiceTotals({
  subtotal, discount, grandTotal, amountPaid, outstanding, paymentStatus, paymentMethod, receipt,
}: InvoiceTotalsProps) {
  const r = receipt || {}

  return (
    <div className="mt-6">
      <table className="w-72 ml-auto border-collapse text-sm">
        <tbody>
          {r.show_subtotal !== false && (
            <tr>
              <td className="py-1 pr-4 text-gray-600 text-right">Subtotal</td>
              <td className="py-1 text-right font-medium text-gray-900 w-28 tabular-nums">{formatCurrency(subtotal)}</td>
            </tr>
          )}
          {r.show_discount !== false && discount > 0 && (
            <tr>
              <td className="py-1 pr-4 text-gray-600 text-right">Discount</td>
              <td className="py-1 text-right font-medium text-red-600 tabular-nums">-{formatCurrency(discount)}</td>
            </tr>
          )}
          {r.show_grand_total !== false && (
            <tr className="border-t-2 border-gray-800">
              <td className="py-2 pr-4 text-gray-800 font-bold text-right">Grand Total</td>
              <td className="py-2 text-right font-bold text-gray-900 tabular-nums">{formatCurrency(grandTotal)}</td>
            </tr>
          )}
          {r.show_paid !== false && (
            <tr>
              <td className="py-1 pr-4 text-gray-600 text-right">Paid</td>
              <td className="py-1 text-right font-medium text-gray-900 tabular-nums">{formatCurrency(amountPaid)}</td>
            </tr>
          )}
          {r.show_remaining !== false && outstanding > 0 && (
            <tr>
              <td className="py-1 pr-4 text-gray-600 text-right">Outstanding</td>
              <td className="py-1 text-right font-semibold text-amber-700 tabular-nums">{formatCurrency(outstanding)}</td>
            </tr>
          )}
          {(r.show_payment_status !== false || r.show_payment_method !== false) && (
            <tr className="border-t border-gray-300">
              <td colSpan={2} className="py-1 text-right">
                <div className="space-x-2">
                  {r.show_payment_status !== false && (
                    <span className="text-xs font-medium text-gray-600 capitalize">{paymentStatus}</span>
                  )}
                  {r.show_payment_method !== false && paymentMethod && (
                    <span className="text-xs text-gray-400">via {paymentMethod}</span>
                  )}
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
