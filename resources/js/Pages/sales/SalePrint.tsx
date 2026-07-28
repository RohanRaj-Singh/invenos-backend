import { usePage } from '@inertiajs/react'
import PrintLayout from '@/features/printing/components/PrintLayout'
import BusinessHeader from '@/features/printing/components/BusinessHeader'
import InvoiceItemsTable from '@/features/printing/components/InvoiceItemsTable'
import InvoiceTotals from '@/features/printing/components/InvoiceTotals'
import InvoiceFooter from '@/features/printing/components/InvoiceFooter'
import DocumentActions from '@/features/printing/components/DocumentActions'
import InvoiceMeta, { formatDisplayDate, PaymentBadge } from '@/features/printing/components/InvoiceMeta'
import type { PrintItem } from '@/features/printing/components/InvoiceItemsTable'

export default function SalePrintPage() {
  const { props } = usePage()
  const { sale, settings } = props as Record<string, any>
  const biz = settings?.business || {}
  const receipt = settings?.receipt || {}
  const s = sale || {}

  if (!sale) return <div className="p-8 text-center text-gray-500">Sale not found.</div>

  const items: PrintItem[] = (s.items || []).map((item: any, i: number) => ({
    sr: i + 1,
    name: item.product_name,
    unit: item.packaging_name || 'Unit',
    quantity: item.base_quantity,
    unitPrice: item.unit_price,
    discount: item.discount_pct || 0,
    total: item.total || item.unit_price * item.base_quantity,
  }))

  const customer = s.customer || {}

  return (
    <div className="bg-gray-100 pb-6">
      <DocumentActions
        title={receipt.sale_title || 'SALE INVOICE'}
        invoiceNumber={s.invoice_number}
        partyName={customer.name || s.customer_name}
        total={s.grand_total || 0}
        outstanding={s.outstanding_balance || 0}
      />

      <PrintLayout>
        <BusinessHeader business={biz} receipt={receipt} title={receipt.sale_title || 'SALE INVOICE'} />

        {/* Party + Invoice metadata */}
        <div className="flex items-start justify-between mb-5">
          <div>
            {receipt.show_party_name !== false && (
              <>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Customer</p>
                <p className="text-base font-bold text-gray-900">{customer.name || s.customer_name}</p>
              </>
            )}
            {receipt.show_party_phone !== false && customer.phone && <p className="text-sm text-gray-600">{customer.phone}</p>}
            {receipt.show_party_address !== false && customer.address && <p className="text-sm text-gray-600">{customer.address}</p>}
          </div>
          <div className="text-right space-y-1">
            {receipt.show_invoice_number !== false && <InvoiceMeta label="Invoice" value={s.invoice_number} highlight />}
            {receipt.show_date !== false && <InvoiceMeta label="Date" value={formatDisplayDate(s.date)} />}
            {receipt.show_payment_status !== false && (
              <div className="flex items-center justify-end gap-2 mt-2">
                <PaymentBadge status={s.payment_status} />
              </div>
            )}
          </div>
        </div>

        <InvoiceItemsTable items={items} receipt={receipt} />

        <InvoiceTotals
          subtotal={s.subtotal || 0}
          discount={s.discount || 0}
          grandTotal={s.grand_total || 0}
          amountPaid={s.amount_paid || 0}
          outstanding={s.outstanding_balance || 0}
          paymentStatus={s.payment_status || 'unknown'}
          receipt={receipt}
        />

        <InvoiceFooter
          notes={s.notes}
          receipt={receipt}
        />
      </PrintLayout>
    </div>
  )
}
