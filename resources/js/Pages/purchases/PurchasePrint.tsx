import { usePage } from '@inertiajs/react'
import PrintLayout from '@/features/printing/components/PrintLayout'
import BusinessHeader from '@/features/printing/components/BusinessHeader'
import InvoiceItemsTable from '@/features/printing/components/InvoiceItemsTable'
import InvoiceTotals from '@/features/printing/components/InvoiceTotals'
import InvoiceFooter from '@/features/printing/components/InvoiceFooter'
import DocumentActions from '@/features/printing/components/DocumentActions'
import InvoiceMeta, { formatDisplayDate, PaymentBadge } from '@/features/printing/components/InvoiceMeta'
import type { PrintItem } from '@/features/printing/components/InvoiceItemsTable'

export default function PurchasePrintPage() {
  const { props } = usePage()
  const { purchase, settings } = props as Record<string, any>
  const biz = settings?.business || {}
  const receipt = settings?.receipt || {}
  const p = purchase || {}

  if (!purchase) return <div className="p-8 text-center text-gray-500">Purchase not found.</div>

  const items: PrintItem[] = (p.items || []).map((item: any, i: number) => ({
    sr: i + 1,
    name: item.product_name,
    unit: item.base_unit_name || item.purchase_pack_name || 'Unit',
    quantity: item.purchase_pack_qty * item.purchase_quantity,
    unitPrice: item.unit_cost,
    discount: item.discount_pct || 0,
    total: item.total_cost || item.unit_cost * item.purchase_quantity,
  }))

  const supplier = p.supplier || {}

  return (
    <div className="bg-gray-100 pb-6">
      <DocumentActions
        title={receipt.purchase_title || 'PURCHASE BILL'}
        invoiceNumber={p.invoice_ref}
        partyName={supplier.name || p.supplier_name}
        total={p.total_amount || 0}
        outstanding={p.outstanding_balance || 0}
      />

      <PrintLayout>
        <BusinessHeader business={biz} receipt={receipt} title={receipt.purchase_title || 'PURCHASE BILL'} />

        {/* Party + Invoice metadata */}
        <div className="flex items-start justify-between mb-5">
          <div>
            {receipt.show_party_name !== false && (
              <>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Supplier</p>
                <p className="text-base font-bold text-gray-900">{supplier.name || p.supplier_name}</p>
              </>
            )}
            {receipt.show_party_phone !== false && supplier.phone && <p className="text-sm text-gray-600">{supplier.phone}</p>}
            {receipt.show_party_address !== false && supplier.address && <p className="text-sm text-gray-600">{supplier.address}</p>}
          </div>
          <div className="text-right space-y-1">
            {receipt.show_invoice_number !== false && <InvoiceMeta label="Invoice" value={p.invoice_ref} highlight />}
            {receipt.show_date !== false && <InvoiceMeta label="Date" value={formatDisplayDate(p.date)} />}
            {receipt.show_payment_status !== false && (
              <div className="flex items-center justify-end gap-2 mt-2">
                <PaymentBadge status={p.payment_status} />
              </div>
            )}
          </div>
        </div>

        <InvoiceItemsTable items={items} receipt={receipt} />

        <InvoiceTotals
          subtotal={p.subtotal || 0}
          discount={p.discount || 0}
          grandTotal={p.total_amount || 0}
          amountPaid={p.amount_paid || 0}
          outstanding={p.outstanding_balance || 0}
          paymentStatus={p.payment_status || 'unknown'}
          receipt={receipt}
        />

        <InvoiceFooter
          notes={p.notes}
          receipt={receipt}
        />
      </PrintLayout>
    </div>
  )
}
