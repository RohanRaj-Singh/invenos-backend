import { usePage } from '@inertiajs/react'
import { AlertTriangle, TrendingUp } from 'lucide-react'
import { ReportLayout } from './components/ReportLayout'
import { ReportToolbar } from './components/ReportToolbar'
import { SummaryCards } from './components/SummaryCards'
import { ReportRow } from './components/ReportRow'
import { ReportTable, type ColumnDef } from './components/ReportTable'
import { DateRangeFilter } from '@/features/reporting/components/DateRangeFilter'
import { useReportDateRange } from '@/features/reporting/hooks/useReportDateRange'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

interface BillWiseRow {
  id: number
  invoice_number: string
  date: string
  customer_name: string
  revenue: number
  cogs: number
  profit: number
  margin_pct: number
  returned: boolean
  cost_complete?: boolean
  uncosted_composition_lines?: number
  uncosted_simple_lines?: number
}

interface ProfitData {
  revenue: number
  sale_returns: number
  net_revenue: number
  cogs: number
  gross_profit: number
  gross_margin_pct: number
  total_expenses: number
  net_profit: number
  cost_complete?: boolean
  simple_cost_complete?: boolean
  uncosted_simple_items?: number
  uncosted_simple_lines?: number
  uncosted_composition_items?: number
  uncosted_composition_lines?: number
  composition_cost_basis?: string
  bill_wise: BillWiseRow[]
}

export default function PnLReport() {
  const { props } = usePage()
  const report: ProfitData = (props as any).report || { revenue: 0, sale_returns: 0, net_revenue: 0, cogs: 0, gross_profit: 0, gross_margin_pct: 0, total_expenses: 0, net_profit: 0, cost_complete: true, bill_wise: [] }
  const filters = (props as any).filters || {}
  const range = useReportDateRange('/reports/pnl', filters, { only: ['report', 'filters'] })

  const billColumns: ColumnDef<BillWiseRow>[] = [
    { key: 'invoice_number', header: 'Invoice', render: (r) => <span className="font-medium font-mono text-xs">{r.invoice_number}</span>, sortable: true, sortValue: (r) => r.invoice_number },
    { key: 'date', header: 'Date', render: (r) => formatDate(r.date), sortable: true },
    { key: 'customer_name', header: 'Customer', render: (r) => r.customer_name, sortable: true, sortValue: (r) => r.customer_name },
    { key: 'revenue', header: 'Revenue', render: (r) => formatCurrency(r.revenue), className: 'text-right', sortable: true, sortValue: (r) => r.revenue },
    { key: 'cogs', header: 'COGS', render: (r) => formatCurrency(r.cogs), className: 'text-right', sortable: true, sortValue: (r) => r.cogs },
    { key: 'profit', header: 'Profit', render: (r) => <span className={cn('font-semibold', r.profit >= 0 ? 'text-emerald-600' : 'text-red-600')}>{formatCurrency(r.profit)}</span>, className: 'text-right', sortable: true, sortValue: (r) => r.profit },
    { key: 'margin_pct', header: 'Margin', render: (r) => `${r.margin_pct}%`, className: 'text-right', sortable: true, sortValue: (r) => r.margin_pct },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <div className="flex flex-col gap-0.5">
          {r.returned && <span className="text-xs text-red-600 font-medium">Returned</span>}
          {r.cost_complete === false && <span className="text-[10px] text-amber-600 font-medium">Incomplete cost</span>}
        </div>
      ),
    },
  ]

  return (
    <ReportLayout title="Profit & Loss" subtitle="Revenue, costs and profitability analysis" icon={<TrendingUp className="size-5 text-primary" />} toolbar={<ReportToolbar onPrint={() => window.print()} />} pending={range.pending}>
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
        { label: 'Gross Revenue', value: formatCurrency(report.revenue), positive: true },
        { label: 'Net Revenue', value: formatCurrency(report.net_revenue), positive: report.net_revenue >= 0 },
        { label: 'Gross Profit', value: formatCurrency(report.gross_profit), positive: report.gross_profit >= 0, negative: report.gross_profit < 0 },
        { label: 'Net Profit', value: formatCurrency(report.net_profit), positive: report.net_profit >= 0, negative: report.net_profit < 0 },
      ]} />

      {report.cost_complete === false && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
          <AlertTriangle className="size-4 mt-0.5 shrink-0" />
          <p className="text-xs leading-relaxed">
            Cost is incomplete for {report.uncosted_composition_items ?? 0} composition sale item(s)
            ({report.uncosted_composition_lines ?? 0} component line(s)) and{' '}
            {report.uncosted_simple_items ?? 0} stock sale item(s)
            ({report.uncosted_simple_lines ?? 0} uncosted stock line(s)). COGS and profit use known
            costs only and may be overstated.
          </p>
        </div>
      )}

      {/* Bill-wise profit table */}
      <ReportTable
        columns={billColumns}
        data={report.bill_wise || []}
        keyExtractor={(r) => String(r.id)}
        pageSize={25}
        searchable
        searchPlaceholder="Search invoices..."
        onSearch={(data, q) => data.filter((r) => r.invoice_number.toLowerCase().includes(q.toLowerCase()) || r.customer_name.toLowerCase().includes(q.toLowerCase()))}
        emptyMessage="No sales in this period."
      />

      {/* Summary at the bottom */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            <ReportRow label="Gross Revenue" value={formatCurrency(report.revenue)} />
            <ReportRow label="Sale Returns" value={formatCurrency(report.sale_returns)} negative />
            <div className="border-t border-border pt-2"><ReportRow label="Net Revenue" value={formatCurrency(report.net_revenue)} bold positive={report.net_revenue >= 0} /></div>
            <ReportRow label="Cost of Goods Sold" value={formatCurrency(report.cogs)} negative />
            <div className="border-t border-border pt-2">
              <ReportRow label="Gross Profit" value={formatCurrency(report.gross_profit)} bold positive={report.gross_profit >= 0} />
              <ReportRow label="Gross Margin" value={`${report.gross_margin_pct}%`} />
            </div>
            <ReportRow label="Operating Expenses" value={formatCurrency(report.total_expenses)} negative />
            <div className="border-t-2 border-foreground pt-2"><ReportRow label="Net Profit / Loss" value={formatCurrency(report.net_profit)} bold positive={report.net_profit >= 0} negative={report.net_profit < 0} large /></div>
          </div>
        </CardContent>
      </Card>
    </ReportLayout>
  )
}