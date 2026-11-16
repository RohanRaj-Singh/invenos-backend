import { usePage } from '@inertiajs/react'
import { Factory } from 'lucide-react'
import { ReportLayout } from '@/Pages/reports/components/ReportLayout'
import { ReportToolbar } from '@/Pages/reports/components/ReportToolbar'
import { SummaryCards } from '@/Pages/reports/components/SummaryCards'
import { DateRangeFilter } from '@/features/reporting/components/DateRangeFilter'
import { useReportDateRange } from '@/features/reporting/hooks/useReportDateRange'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

export default function ProductionHistoryReport() {
  const { props } = usePage()
  const report = (props as any).report || { orders: [], summary: {} }
  const filters = (props as any).filters || {}
  const range = useReportDateRange('/reports/production-history', filters, { only: ['report', 'filters'] })
  const summary = report.summary || {}
  const orders: any[] = report.orders || []

  return (
    <ReportLayout
      title="Production History"
      subtitle="Manufacturing output, cost and reversal history"
      icon={<Factory className="size-5 text-primary" />}
      toolbar={<ReportToolbar onPrint={() => window.print()} />}
      pending={range.pending}
    >
      <DateRangeFilter preset={range.preset} from={range.from} to={range.to} onPreset={(p) => range.apply(p)} onFromChange={range.setFrom} onToChange={range.setTo} onApplyCustom={() => range.apply('custom', range.from, range.to)} pending={range.pending} />

      <SummaryCards cards={[
        { label: 'Orders', value: String(summary.order_count || 0) },
        { label: 'Completed', value: String(summary.completed_count || 0), positive: true },
        { label: 'Reversed', value: String(summary.reversed_count || 0), negative: (summary.reversed_count || 0) > 0 },
        { label: 'Output', value: Number(summary.output_quantity || 0).toLocaleString() },
        { label: 'Production cost', value: summary.production_cost == null ? '—' : formatCurrency(summary.production_cost), positive: false },
      ]} />

      {summary.cost_complete === false && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800">
          One or more production orders have incomplete component cost. Known costs are shown; no complete unit cost was forced into inventory.
        </div>
      )}

      <div className="rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="bg-muted/40 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Order</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Product</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Output</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Cost</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Completed</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No production history in this period.</td></tr> : orders.map((order) => (
              <tr key={order.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3"><a href={`/production/${order.id}`} className="font-mono text-xs text-primary hover:underline">{order.production_number}</a></td>
                <td className="px-4 py-3">{order.product?.name || '—'}</td>
                <td className="px-4 py-3 text-right tabular-nums">{order.actual_output_quantity == null ? '—' : `${Number(order.actual_output_quantity).toLocaleString()} ${order.output_unit_id}`}</td>
                <td className="px-4 py-3 text-right tabular-nums">{order.total_cost == null ? '—' : formatCurrency(order.total_cost)}</td>
                <td className="px-4 py-3"><span className={cn('text-xs capitalize', order.status === 'reversed' ? 'text-amber-600' : order.status === 'completed' ? 'text-emerald-600' : 'text-muted-foreground')}>{String(order.status).replace('_', ' ')}</span></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{order.completed_at ? formatDate(order.completed_at) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ReportLayout>
  )
}
