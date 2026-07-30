import { useMemo } from 'react'
import { usePage } from '@inertiajs/react'
import { ShoppingBag } from 'lucide-react'
import { ReportLayout } from './components/ReportLayout'
import { ReportToolbar } from './components/ReportToolbar'
import { SummaryCards } from './components/SummaryCards'
import { ReportTable, type ColumnDef } from './components/ReportTable'
import { StatusBadge } from './components/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/format'

interface BillRow {
  id: number
  invoice_ref: string
  date: string
  supplier?: { id: number; name: string }
  supplier_name: string
  total_amount: number
  amount_paid: number
  payment_status: string
}

export default function PurchaseReportPage() {
  const { props } = usePage()
  const report = (props as any).report || { bills: [], meta: null, summary: {} }
  const bills: BillRow[] = report.bills || []
  const summary = report.summary || {}

  const cards = useMemo(() => [
    { label: 'Total Purchases', value: String(summary.total_purchases || 0) },
    { label: 'Total Value', value: formatCurrency(summary.total_value || 0), negative: true },
    { label: 'Returns', value: formatCurrency(summary.total_returns || 0), positive: (summary.total_returns || 0) > 0 },
    { label: 'Net Purchases', value: formatCurrency(summary.net_purchases || 0), negative: true },
    { label: 'Avg Purchase', value: formatCurrency(summary.average_purchase || 0) },
    { label: 'Paid', value: formatCurrency(summary.total_paid || 0) },
  ], [summary])

  const columns: ColumnDef<BillRow>[] = [
    { key: 'invoice_ref', header: 'Reference', render: (r) => <span className="font-medium font-mono text-xs">{r.invoice_ref}</span>, sortable: true, sortValue: (r) => r.invoice_ref },
    { key: 'date', header: 'Date', render: (r) => formatDate(r.date), sortable: true },
    { key: 'supplier', header: 'Supplier', render: (r) => r.supplier?.name || r.supplier_name || '—', sortable: true, sortValue: (r) => r.supplier?.name || r.supplier_name || '' },
    { key: 'total_amount', header: 'Total', render: (r) => formatCurrency(r.total_amount), className: 'text-right font-semibold', sortable: true, sortValue: (r) => r.total_amount },
    { key: 'amount_paid', header: 'Paid', render: (r) => <span className="text-emerald-600">{formatCurrency(r.amount_paid)}</span>, className: 'text-right', sortable: true, sortValue: (r) => r.amount_paid },
    { key: 'payment_status', header: 'Status', render: (r) => <StatusBadge status={r.payment_status} /> },
  ]

  return (
    <ReportLayout
      title="Purchase Register"
      subtitle="All purchase bills with summaries"
      icon={<ShoppingBag className="size-5 text-primary" />}
      toolbar={<ReportToolbar
        csvExportUrl="/reports/purchases/export/csv"
        shareUrl="/reports/share/purchases"
        reportTitle="Purchase Report"
        onPrint={() => window.print()}
      />}
    >
      <SummaryCards cards={cards} />
      <ReportTable
        columns={columns}
        data={bills}
        keyExtractor={(r) => String(r.id)}
        pageSize={25}
        searchable
        searchPlaceholder="Search by reference or supplier..."
        onSearch={(data, q) =>
          data.filter((r) =>
            r.invoice_ref.toLowerCase().includes(q) ||
            (r.supplier?.name || r.supplier_name || '').toLowerCase().includes(q)
          )
        }
        emptyMessage="No purchases found in this date range."
      />
    </ReportLayout>
  )
}
