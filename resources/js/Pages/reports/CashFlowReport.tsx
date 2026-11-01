import { usePage } from '@inertiajs/react'
import { Banknote } from 'lucide-react'
import { ReportLayout } from './components/ReportLayout'
import { ReportToolbar } from './components/ReportToolbar'
import { SummaryCards } from './components/SummaryCards'
import { ReportTable, type ColumnDef } from './components/ReportTable'
import { formatCurrency, formatDate } from '@/lib/format'
import { DateRangeFilter } from '@/features/reporting/components/DateRangeFilter'
import { useReportDateRange } from '@/features/reporting/hooks/useReportDateRange'

interface CashRow {
  id: number
  date: string
  type: string
  description: string
  reference: string
  inflow: number
  outflow: number
}

export default function CashFlowReport() {
  const { props } = usePage()
  const report = (props as any).report || { summary: {}, rows: [], period: {} }
  const filters = (props as any).filters || {}
  const summary = report.summary || {}
  const range = useReportDateRange('/reports/cash-flow', filters, { only: ['report', 'filters'] })

  const columns: ColumnDef<CashRow>[] = [
    { key: 'date', header: 'Date', render: (r) => formatDate(r.date), sortable: true, sortValue: (r) => r.date },
    { key: 'type', header: 'Type', render: (r) => <span className="font-medium">{r.type}</span>, sortable: true, sortValue: (r) => r.type },
    { key: 'description', header: 'Description', render: (r) => <span className="text-xs">{r.description}</span> },
    { key: 'reference', header: 'Reference', render: (r) => <code className="text-[10px] font-mono bg-muted px-1 py-0.5 rounded">{r.reference}</code> },
    {
      key: 'inflow', header: 'In', className: 'text-right', sortable: true,
      sortValue: (r) => r.inflow,
      render: (r) => r.inflow ? <span className="text-emerald-600 tabular-nums">{formatCurrency(r.inflow)}</span> : <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'outflow', header: 'Out', className: 'text-right', sortable: true,
      sortValue: (r) => r.outflow,
      render: (r) => r.outflow ? <span className="text-red-500 tabular-nums">{formatCurrency(r.outflow)}</span> : <span className="text-muted-foreground">—</span>,
    },
  ]

  return (
    <ReportLayout
      title="Cash Flow"
      subtitle={`Actual cash movements${report.period?.from ? ` — ${report.period.from} to ${report.period.to}` : ''}`}
      icon={<Banknote className="size-5 text-primary" />}
      toolbar={<ReportToolbar reportTitle="Cash Flow" onPrint={() => window.print()} />}
      pending={range.pending}
    >
      <DateRangeFilter
        preset={range.preset}
        from={range.from}
        to={range.to}
        onPreset={(p) => range.apply(p)}
        onFromChange={range.setFrom}
        onToChange={range.setTo}
        onApplyCustom={() => range.apply('custom', range.from, range.to)}
        pending={range.pending}
      />

      <SummaryCards cards={[
        { label: 'Opening Balance', value: formatCurrency(summary.opening_balance ?? 0), positive: (summary.opening_balance ?? 0) >= 0, negative: (summary.opening_balance ?? 0) < 0 },
        { label: 'Cash In', value: formatCurrency(summary.total_in ?? 0), positive: true },
        { label: 'Cash Out', value: formatCurrency(summary.total_out ?? 0), negative: (summary.total_out ?? 0) > 0 },
        { label: 'Closing Balance', value: formatCurrency(summary.closing_balance ?? 0), positive: (summary.closing_balance ?? 0) >= 0, negative: (summary.closing_balance ?? 0) < 0 },
      ]} />

      <ReportTable
        columns={columns}
        data={report.rows || []}
        keyExtractor={(r) => String(r.id)}
        pageSize={25}
        searchable
        searchPlaceholder="Search reference or description..."
        emptyMessage="No cash movements in this period."
      />
    </ReportLayout>
  )
}
