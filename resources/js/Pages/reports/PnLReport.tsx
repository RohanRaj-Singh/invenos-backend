import { router, usePage } from '@inertiajs/react'
import { TrendingUp } from 'lucide-react'
import { ReportLayout } from './components/ReportLayout'
import { ReportToolbar } from './components/ReportToolbar'
import { DateFilter, type DatePreset, getDateRange } from './components/DateFilter'
import { SummaryCards } from './components/SummaryCards'
import { ReportRow } from './components/ReportRow'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'

interface ProfitData {
  revenue: number
  sale_returns: number
  net_revenue: number
  cogs: number
  gross_profit: number
  gross_margin_pct: number
  total_expenses: number
  net_profit: number
}

export default function PnLReport() {
  const { props } = usePage()
  const report: ProfitData = (props as any).report || { revenue: 0, sale_returns: 0, net_revenue: 0, cogs: 0, gross_profit: 0, gross_margin_pct: 0, total_expenses: 0, net_profit: 0 }
  const filters = (props as any).filters || {}

  const currentPreset: DatePreset = 'thisMonth'

  const handleDateChange = (_preset: DatePreset, from: string, to: string) => {
    router.get('/reports/pnl', { date_from: from, date_to: to }, { preserveState: true })
  }

  return (
    <ReportLayout title="Profit & Loss" subtitle="Revenue, costs and profitability analysis" icon={<TrendingUp className="size-5 text-primary" />} toolbar={<ReportToolbar onPrint={() => window.print()} />}>
      <DateFilter value={currentPreset} onChange={handleDateChange} />
      <SummaryCards cards={[
        { label: 'Gross Revenue', value: formatCurrency(report.revenue), positive: true },
        { label: 'Net Revenue', value: formatCurrency(report.net_revenue), positive: report.net_revenue >= 0 },
        { label: 'Gross Profit', value: formatCurrency(report.gross_profit), positive: report.gross_profit >= 0, negative: report.gross_profit < 0 },
        { label: 'Net Profit', value: formatCurrency(report.net_profit), positive: report.net_profit >= 0, negative: report.net_profit < 0 },
      ]} />
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