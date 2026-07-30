import { useMemo } from 'react'
import { usePage } from '@inertiajs/react'
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Building2, Package } from 'lucide-react'
import { ReportLayout } from './components/ReportLayout'
import { ReportToolbar } from './components/ReportToolbar'
import { SummaryCards, type SummaryCardDef } from './components/SummaryCards'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

interface FinancialSummary {
  total_sales: number
  total_purchases: number
  total_expenses: number
  sale_returns: number
  purchase_returns: number
  cash_balance: number
  receivables: number
  payables: number
  inventory_value: number
  gross_profit: number
  net_profit: number
  gross_margin_pct: number
}

export default function FinancialOverviewPage() {
  const { props } = usePage()
  const report = (props as any).report || { summary: {}, income: {}, expenses: {}, cash_flow: {}, outstanding: {} }
  const s: FinancialSummary = report.summary || {}
  const income = report.income || {}
  const expenses = report.expenses || {}
  const cashFlow = report.cash_flow || {}
  const outstanding = report.outstanding || {}

  const cards: SummaryCardDef[] = useMemo(() => [
    { label: 'Gross Profit', value: formatCurrency(s.gross_profit || 0), positive: (s.gross_profit || 0) >= 0, negative: (s.gross_profit || 0) < 0 },
    { label: 'Net Profit', value: formatCurrency(s.net_profit || 0), positive: (s.net_profit || 0) >= 0, negative: (s.net_profit || 0) < 0 },
    { label: 'Cash Balance', value: formatCurrency(s.cash_balance || 0), positive: (s.cash_balance || 0) >= 0, negative: (s.cash_balance || 0) < 0 },
    { label: 'Inventory Value', value: formatCurrency(s.inventory_value || 0), positive: true },
    { label: 'Receivables', value: formatCurrency(s.receivables || 0), positive: (s.receivables || 0) > 0 },
    { label: 'Payables', value: formatCurrency(s.payables || 0), negative: (s.payables || 0) > 0 },
  ], [s])

  return (
    <ReportLayout
      title="Financial Overview"
      subtitle="Where your money is — income, expenses, cash, and outstanding"
      icon={<BarChart3 className="size-5 text-primary" />}
      toolbar={<ReportToolbar onPrint={() => window.print()} />}
    >
      <SummaryCards cards={cards} />

      {/* Profit Section */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500/10 to-transparent px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <TrendingUp className="size-4 text-emerald-500" /> Profit & Loss Summary
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Income</div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Sales</span><span className="font-semibold">{formatCurrency(income.sales || 0)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sale Returns</span><span className="font-semibold text-red-500">-{formatCurrency(income.sale_returns || 0)}</span></div>
            <div className="flex justify-between text-sm font-bold border-t border-border/40 pt-1"><span>Net Sales</span><span className="text-emerald-600">{formatCurrency(income.net_sales || 0)}</span></div>
          </div>
          <div className="space-y-2">
            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Costs</div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Purchases</span><span className="font-semibold">{formatCurrency(expenses.purchases || 0)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Operating Expenses</span><span className="font-semibold text-red-500">{formatCurrency(expenses.operating_expenses || 0)}</span></div>
            <div className="flex justify-between text-sm font-bold border-t border-border/40 pt-1"><span>Total Costs</span><span className="text-red-500">{formatCurrency(expenses.total_expenses || 0)}</span></div>
          </div>
          <div className="space-y-2">
            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Summary</div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Gross Profit</span><span className={cn('font-semibold', (s.gross_profit || 0) >= 0 ? 'text-emerald-600' : 'text-red-500')}>{formatCurrency(s.gross_profit || 0)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Gross Margin</span><span className="font-semibold">{(s.gross_margin_pct || 0)}%</span></div>
            <div className="flex justify-between text-sm font-bold border-t border-border/40 pt-1"><span>Net Profit</span><span className={(s.net_profit || 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}>{formatCurrency(s.net_profit || 0)}</span></div>
          </div>
        </div>
      </div>

      {/* Cash Flow + Outstanding + Inventory */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Cash Flow */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500/10 to-transparent px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <DollarSign className="size-4 text-blue-500" /> Cash Flow
            </div>
          </div>
          <div className="p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Cash In</span><span className="font-semibold text-emerald-600">{formatCurrency(cashFlow.cash_in || 0)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Cash Out</span><span className="font-semibold text-red-500">{formatCurrency(cashFlow.cash_out || 0)}</span></div>
            <div className="flex justify-between text-sm font-bold border-t border-border/40 pt-1"><span>Net Cash</span><span className={(cashFlow.net_cash || 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}>{formatCurrency(cashFlow.net_cash || 0)}</span></div>
            <div className="mt-3 pt-3 border-t border-border/40">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Package className="size-3.5" /> Inventory Value
              </div>
              <div className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(s.inventory_value || 0)}</div>
            </div>
          </div>
        </div>

        {/* Outstanding */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500/10 to-transparent px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Users className="size-4 text-amber-500" /> Outstanding
            </div>
          </div>
          <div className="p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground flex items-center gap-1.5"><Users className="size-3.5" /> Customer Receivables</span><span className="font-semibold text-emerald-600">{formatCurrency(outstanding.receivables || 0)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground flex items-center gap-1.5"><Building2 className="size-3.5" /> Supplier Payables</span><span className="font-semibold text-red-500">{formatCurrency(outstanding.payables || 0)}</span></div>
            <div className="flex justify-between text-sm font-bold border-t border-border/40 pt-1"><span>Net Position</span><span className={(outstanding.net_position || 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}>{formatCurrency(outstanding.net_position || 0)}</span></div>
            {(s.cash_balance || 0) > 0 && (
              <div className="mt-3 pt-3 border-t border-border/40">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <DollarSign className="size-3.5" /> Current Cash Balance
                </div>
                <div className={cn('text-lg font-bold tabular-nums', (s.cash_balance || 0) >= 0 ? 'text-emerald-600' : 'text-red-500')}>{formatCurrency(s.cash_balance || 0)}</div>
              </div>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500/10 to-transparent px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <BarChart3 className="size-4 text-purple-500" /> Key Metrics
            </div>
          </div>
          <div className="p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Gross Margin</span><span className="font-semibold">{(s.gross_margin_pct || 0)}%</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Sales</span><span className="font-semibold">{formatCurrency(s.total_sales || 0)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Purchases</span><span className="font-semibold">{formatCurrency(s.total_purchases || 0)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Expenses</span><span className="font-semibold text-red-500">{formatCurrency(s.total_expenses || 0)}</span></div>
            <div className="flex justify-between text-sm border-t border-border/40 pt-1"><span className="text-muted-foreground">Sale Returns</span><span className="font-semibold text-amber-500">{formatCurrency(s.sale_returns || 0)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Purchase Returns</span><span className="font-semibold text-emerald-600">{formatCurrency(s.purchase_returns || 0)}</span></div>
          </div>
        </div>
      </div>
    </ReportLayout>
  )
}
