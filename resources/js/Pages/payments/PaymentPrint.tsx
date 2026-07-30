import { usePage, router } from '@inertiajs/react'
import PrintLayout from '@/features/printing/components/PrintLayout'
import BusinessHeader from '@/features/printing/components/BusinessHeader'
import InvoiceMeta, { formatDisplayDate } from '@/features/printing/components/InvoiceMeta'
import InvoiceFooter from '@/features/printing/components/InvoiceFooter'
import DocumentActions from '@/features/printing/components/DocumentActions'
import { formatCurrency } from '@/lib/format'

interface BackendTransaction {
  id: number
  contact_id: number | null
  direction: 'in' | 'out'
  type: string
  date: string
  amount: number
  method: string
  reference: string
  description: string | null
  contact: { id: number; name: string } | null
  created_by: string | null
}

const methodLabels: Record<string, string> = {
  cash: 'Cash', easypaisa: 'Easypaisa', jazzcash: 'JazzCash',
  card: 'Card', transfer: 'Bank Transfer',
}

export default function PaymentPrintPage() {
  const { props } = usePage()
  const { payment, settings } = props as Record<string, any>
  const biz = settings?.business || {}
  const receipt = settings?.receipt || {}
  const p = payment || {}

  if (!payment) return <div className="p-8 text-center text-gray-500">Payment not found.</div>

  const title = p.direction === 'in' ? 'PAYMENT RECEIPT' : 'PAYMENT VOUCHER'
  const label = p.direction === 'in' ? 'Payment Received' : 'Payment Sent'

  return (
    <div className="bg-gray-100 pb-6">
      <DocumentActions
        title={title}
        invoiceNumber={p.reference}
        partyName={p.contact?.name || '—'}
        total={p.amount || 0}
        outstanding={0}
      />

      <PrintLayout>
        <BusinessHeader business={biz} receipt={receipt} title={title} />

        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Party</p>
            <p className="text-base font-bold text-gray-900">{p.contact?.name || '—'}</p>
          </div>
          <div className="text-right space-y-1">
            <InvoiceMeta label="Reference" value={p.reference} highlight />
            <InvoiceMeta label="Date" value={formatDisplayDate(p.date)} />
          </div>
        </div>

        {/* Amount hero */}
        <div className="text-center py-6 mb-5 border-y border-gray-200">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(p.amount)}</p>
          <p className="text-sm text-gray-500 mt-1">{methodLabels[p.method] || p.method}</p>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Method</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">{methodLabels[p.method] || p.method}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Date</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">{formatDisplayDate(p.date)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Recorded by</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">{p.created_by || '—'}</p>
          </div>
        </div>

        {/* Note section */}
        {p.description && (
          <div className="mb-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Note</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded px-3 py-2">{p.description}</p>
          </div>
        )}

        <InvoiceFooter notes={null} receipt={receipt} />
      </PrintLayout>
    </div>
  )
}
