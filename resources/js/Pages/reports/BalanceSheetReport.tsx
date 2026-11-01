import { usePage } from '@inertiajs/react'
import { Scale } from 'lucide-react'
import { ReportLayout } from './components/ReportLayout'
import { ReportToolbar } from './components/ReportToolbar'
import { SummaryCards } from './components/SummaryCards'
import { ReportRow } from './components/ReportRow'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { DateRangeFilter } from '@/features/reporting/components/DateRangeFilter'
import { useReportDateRange } from '@/features/reporting/hooks/useReportDateRange'

export default function BalanceSheetReport() {
  const { props } = usePage()
  const report = (props as any).report || {}
  const filters = (props as any).filters || {}
  const range = useReportDateRange('/reports/balance-sheet', filters, { only: ['report', 'filters'] })
  const assets = report.assets || {}
  const liabilities = report.liabilities || {}
  const equity = report.equity || {}
  const totals = report.totals || {}
  const balanced = totals.balanced !== false

  return (
    <ReportLayout
      title="Financial Position"
      subtitle={`Management view${report.period?.to ? ` — as of ${report.period.to}` : ''}`}
      icon={<Scale className="size-5 text-primary" />}
      toolbar={<ReportToolbar onPrint={() => window.print()} />}
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
        { label: 'Total Assets', value: formatCurrency(assets.total_assets ?? 0), positive: true },
        { label: 'Total Liabilities', value: formatCurrency(liabilities.total_liabilities ?? 0), negative: (liabilities.total_liabilities ?? 0) > 0 },
        { label: 'Total Equity', value: formatCurrency(equity.total_equity ?? 0) },
        { label: 'Difference', value: formatCurrency(Math.abs(totals.difference ?? 0)), negative: !balanced },
      ]} />

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Assets</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <ReportRow label="Cash & Bank" value={formatCurrency(assets.cash_and_bank ?? 0)} />
            <ReportRow label="Inventory (at cost)" value={formatCurrency(assets.inventory ?? 0)} />
            <ReportRow label="Accounts Receivable" value={formatCurrency(assets.accounts_receivable ?? 0)} />
            <div className="border-t border-border pt-2">
              <ReportRow label="Total Assets" value={formatCurrency(assets.total_assets ?? 0)} bold />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Liabilities & Equity</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <ReportRow label="Accounts Payable" value={formatCurrency(liabilities.accounts_payable ?? 0)} />
            <ReportRow label="Owner Capital (derived)" value={formatCurrency(equity.owner_capital ?? 0)} />
            <ReportRow label="Retained Earnings (estimated)" value={formatCurrency(equity.retained_earnings ?? 0)} />
            <div className="border-t border-border pt-2">
              <ReportRow label="Total Liabilities + Equity" value={formatCurrency(totals.liabilities_plus_equity ?? 0)} bold />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={cn(
        'rounded-lg border p-3 text-xs leading-relaxed',
        balanced
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300'
          : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300',
      )}>
        {balanced
          ? 'Assets equal liabilities plus equity.'
          : `Unreconciled difference: ${formatCurrency(Math.abs(totals.difference ?? 0))}. This is a management view — capital contributions, drawings and loans are not recorded.`}
      </div>
    </ReportLayout>
  )
}
