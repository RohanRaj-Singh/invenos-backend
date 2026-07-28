interface InvoiceMetaProps {
  label: string
  value: string
  highlight?: boolean
}

export default function InvoiceMeta({ label, value, highlight }: InvoiceMetaProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}:</span>
      <span className={`text-sm ${highlight ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
        {value}
      </span>
    </div>
  )
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const day = d.getDate().toString().padStart(2, '0')
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`
  } catch {
    return dateStr
  }
}

export function PaymentBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    paid:     { label: 'Paid',     cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    partial:  { label: 'Partial',  cls: 'text-amber-700 bg-amber-50 border-amber-200' },
    unpaid:   { label: 'Unpaid',   cls: 'text-red-700 bg-red-50 border-red-200' },
    pending:  { label: 'Pending',  cls: 'text-gray-700 bg-gray-50 border-gray-200' },
    received: { label: 'Received', cls: 'text-blue-700 bg-blue-50 border-blue-200' },
  }
  const c = cfg[status] || { label: status, cls: 'text-gray-700 bg-gray-50 border-gray-200' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.cls}`}>
      {c.label}
    </span>
  )
}
