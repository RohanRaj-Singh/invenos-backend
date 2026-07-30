import { useState, useMemo } from 'react'
import { router, usePage, Link } from '@inertiajs/react'
import {
  BookOpen, TrendingUp, TrendingDown, DollarSign, ShoppingCart, ShoppingBag,
  Wallet, RotateCcw, ArrowLeftRight, AlertTriangle, CheckCircle2,
  Info, ChevronRight, Clock, Sparkles,
} from 'lucide-react'
import { ReportLayout } from './components/ReportLayout'
import { ReportToolbar } from './components/ReportToolbar'
import { DateFilter, type DatePreset } from './components/DateFilter'
import { SummaryCards, type SummaryCardDef } from './components/SummaryCards'
import { ReportTable, type ColumnDef } from './components/ReportTable'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

// ─── Types ──────────────────────────────────────────────────

interface DayBookEvent {
  date: string; time: string; type: string; ref: string
  description: string; party: string; amount: number
  user: string; category: string; is_financial: boolean; route: string | null
}

interface HealthInsight {
  type: 'positive' | 'warning' | 'danger'
  icon: string
  message: string
}

type EventTypeFilter = 'all' | 'sales' | 'purchases' | 'returns' | 'expenses' | 'payments' | 'adjustments'

const EVENT_FILTERS: { key: EventTypeFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'sales', label: 'Sales' },
  { key: 'purchases', label: 'Purchases' },
  { key: 'returns', label: 'Returns' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'payments', label: 'Payments' },
  { key: 'adjustments', label: 'Adjustments' },
]

function filterEvents(events: DayBookEvent[], filter: EventTypeFilter): DayBookEvent[] {
  switch (filter) {
    case 'sales': return events.filter(e => e.category === 'Sale')
    case 'purchases': return events.filter(e => e.category === 'Purchase')
    case 'returns': return events.filter(e => e.category === 'SaleReturn' || e.category === 'PurchaseReturn')
    case 'expenses': return events.filter(e => e.category === 'Expense')
    case 'payments': return events.filter(e => e.category === 'Payment')
    case 'adjustments': return events.filter(e => e.category === 'Adjustment')
    default: return events
  }
}

// ���── Component ──────────────────────────────────────────────

export default function DayBookReportPage() {
  const { props } = usePage()
  const report = (props as any).report || { events: [], summary: {}, cash_summary: {}, highlights: {}, health: {}, closing_summary: {}, trends: {} }
  const filters = (props as any).filters || {}

  const events: DayBookEvent[] = report.events || []
  const summary: any = report.summary || {}
  const cash: any = report.cash_summary || {}
  const highlights: any = report.highlights || {}
  const health: any = report.health || {}
  const closing: any = report.closing_summary || {}
  const trends: Record<string, { current: number; previous: number }> = report.trends || {}

  const [eventFilter, setEventFilter] = useState<EventTypeFilter>('all')
  const [showCashBreakdown, setShowCashBreakdown] = useState(false)

  const filteredEvents = useMemo(() => filterEvents(events, eventFilter), [events, eventFilter])

  const cardDefs: SummaryCardDef[] = useMemo(() => [
    { label: 'Net Sales', value: formatCurrency(summary.net_sales || 0), positive: (summary.net_sales || 0) >= 0, trend: trends.net_sales },
    { label: 'Net Purchases', value: formatCurrency(summary.net_purchases || 0), negative: true, trend: trends.total_purchases },
    { label: 'Expenses', value: formatCurrency(summary.total_expenses || 0), negative: (summary.total_expenses || 0) > 0, trend: trends.total_expenses },
    { label: 'Gross Profit', value: formatCurrency(summary.gross_profit || 0), positive: (summary.gross_profit || 0) >= 0, negative: (summary.gross_profit || 0) < 0 },
    { label: 'Net Profit', value: formatCurrency(summary.net_profit || 0), positive: (summary.net_profit || 0) >= 0, negative: (summary.net_profit || 0) < 0 },
    { label: 'Transactions', value: String(summary.transaction_count || 0) },
  ], [summary, trends])

  // ─── Helpers ──────────────────────────────────────────────

  const typeIcon = (type: string, size = 'size-3.5') => {
    const s = size as any
    switch (type) {
      case 'Sale': return <ShoppingCart className={s} />
      case 'Sale Return': return <RotateCcw className={s} />
      case 'Purchase': return <ShoppingBag className={s} />
      case 'Purchase Return': return <RotateCcw className={s} />
      case 'Expense': return <Wallet className={s} />
      case 'Payment Received': return <TrendingUp className={s} />
      case 'Payment Made': return <TrendingDown className={s} />
      case 'Stock Adjustment': return <ArrowLeftRight className={s} />
      default: return <DollarSign className={s} />
    }
  }

  const typeColor = (type: string) => {
    const m: Record<string, string> = {
      'Sale': 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
      'Sale Return': 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
      'Purchase': 'text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
      'Purchase Return': 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
      'Expense': 'text-orange-600 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
      'Payment Received': 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
      'Payment Made': 'text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
      'Stock Adjustment': 'text-purple-600 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
    }
    return m[type] || 'text-muted-foreground bg-muted/50'
  }

  const columns: ColumnDef<DayBookEvent>[] = [
    { key: 'time', header: 'Time', render: (r) => <span className="text-xs font-mono text-muted-foreground">{r.time || '—'}</span> },
    {
      key: 'type', header: 'Type',
      render: (r) => (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${typeColor(r.type)}`}>
          {typeIcon(r.type)} {r.type}
        </span>
      ),
      sortable: true, sortValue: (r) => r.type,
    },
    {
      key: 'ref', header: 'Reference',
      render: (r) => r.route
        ? <Link href={r.route} className="text-[10px] font-mono bg-muted px-1 py-0.5 rounded text-primary hover:underline">{r.ref}</Link>
        : <code className="text-[10px] font-mono bg-muted px-1 py-0.5 rounded">{r.ref}</code>,
    },
    { key: 'description', header: 'Description', render: (r) => <span className="text-xs text-foreground">{r.description}</span> },
    { key: 'party', header: 'Party', render: (r) => <span className="text-xs text-muted-foreground">{r.party || '—'}</span> },
    {
      key: 'amount', header: 'Amount',
      render: (r) => {
        if (!r.is_financial) return <span className="text-[10px] text-muted-foreground italic">Operational</span>
        return (
          <span className={cn('text-sm font-semibold tabular-nums',
            r.amount > 0 ? 'text-emerald-600' : 'text-red-500'
          )}>
            {r.amount > 0 ? formatCurrency(r.amount) : '—'}
          </span>
        )
      },
      className: 'text-right', sortable: true, sortValue: (r) => r.amount,
    },
    { key: 'user', header: 'User', render: (r) => <span className="text-[10px] text-muted-foreground">{r.user}</span> },
  ]

  return (
    <ReportLayout
      title="Day Book"
      subtitle="Complete daily business performance report"
      icon={<BookOpen className="size-5 text-primary" />}
      toolbar={<ReportToolbar
        csvExportUrl="/reports/day-book/export/csv"
        shareUrl="/reports/share/day-book"
        reportTitle="Day Book"
        currentFilters={{ preset: (filters as any).preset || 'today' }}
        onPrint={() => window.print()}
      />}
    >
      {/* ─── Date preset filters ─── */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {[
          { value: 'today', label: 'Today' },
          { value: 'yesterday', label: 'Yesterday' },
          { value: 'thisWeek', label: 'This Week' },
          { value: 'lastWeek', label: 'Last Week' },
          { value: 'thisMonth', label: 'This Month' },
          { value: 'lastMonth', label: 'Last Month' },
          { value: 'quarter', label: 'This Quarter' },
          { value: 'year', label: 'This Year' },
        ].map((p) => (
          <button
            key={p.value}
            onClick={() => router.get('/reports/day-book', { preset: p.value }, { preserveState: true })}
            className={cn(
              'text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors',
              (filters.preset || 'thisMonth') === p.value
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-muted-foreground border-border hover:text-foreground',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ══��═════════════════════════════════════════════════════
         Section 2: Today's Performance
      ════════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground tracking-tight">Today's Performance</h2>
        </div>
        <SummaryCards cards={cardDefs} />
      </div>

      {/* ════════════════════════════════════════════════════════
         Section 3: Cash Summary
      ════════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground tracking-tight">Cash Summary</h2>
        </div>
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  Opening Balance
                  <button onClick={() => setShowCashBreakdown(!showCashBreakdown)} className="text-muted-foreground/50 hover:text-muted-foreground">
                    <Info className="size-3" />
                  </button>
                </div>
                <div className={cn('text-lg font-bold mt-0.5 tabular-nums', (cash.opening_balance || 0) >= 0 ? 'text-foreground' : 'text-red-500')}>
                  {formatCurrency(cash.opening_balance || 0)}
                </div>
                {showCashBreakdown && (
                  <div className="mt-2 text-[10px] text-muted-foreground bg-muted/50 rounded-lg p-2.5 space-y-1">
                    <p>{cash.opening_explanation || 'Based on total cash activity before the selected period.'}</p>
                    <div className="flex justify-between pt-1 border-t border-border/40">
                      <span>Total Cash In (prior)</span>
                      <span className="text-emerald-600 font-medium">+{formatCurrency(cash.cash_in_before || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Cash Out (prior)</span>
                      <span className="text-red-500 font-medium">-{formatCurrency(cash.cash_out_before || 0)}</span>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Cash Received</div>
                <div className="text-lg font-bold text-emerald-600 mt-0.5 tabular-nums">+{formatCurrency(cash.cash_received || 0)}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Cash Paid</div>
                <div className="text-lg font-bold text-red-500 mt-0.5 tabular-nums">-{formatCurrency(cash.cash_paid || 0)}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Closing Balance</div>
                <div className={cn('text-lg font-bold mt-0.5 tabular-nums', (cash.closing_balance || 0) >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                  {formatCurrency(cash.closing_balance || 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ════════════════════════════════════════════════════════
         Section 4: Today's Highlights
      ════════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground tracking-tight">Today's Highlights</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {highlights.largest_sale && (
            <Card>
              <CardContent className="p-3.5">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">
                  <ShoppingCart className="size-3" /> Largest Sale
                </div>
                <div className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(highlights.largest_sale.amount)}</div>
                <div className="text-[10px] text-muted-foreground truncate mt-0.5">{highlights.largest_sale.party}</div>
                {highlights.largest_sale.route && (
                  <Link href={highlights.largest_sale.route} className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5 mt-1">
                    View <ChevronRight className="size-2.5" />
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
          {highlights.largest_purchase && (
            <Card>
              <CardContent className="p-3.5">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">
                  <ShoppingBag className="size-3" /> Largest Purchase
                </div>
                <div className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(highlights.largest_purchase.amount)}</div>
                <div className="text-[10px] text-muted-foreground truncate mt-0.5">{highlights.largest_purchase.party}</div>
                {highlights.largest_purchase.route && (
                  <Link href={highlights.largest_purchase.route} className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5 mt-1">
                    View <ChevronRight className="size-2.5" />
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
          {highlights.highest_expense && (
            <Card>
              <CardContent className="p-3.5">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">
                  <Wallet className="size-3" /> Highest Expense
                </div>
                <div className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(highlights.highest_expense.amount)}</div>
                <div className="text-[10px] text-muted-foreground truncate mt-0.5">{highlights.highest_expense.party}</div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="p-3.5">
              <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Period Activity</div>
              <div className="space-y-0.5 text-xs text-foreground">
                {highlights.return_count > 0 && <p>{highlights.return_count} return(s)</p>}
                {highlights.payment_count > 0 && <p>{highlights.payment_count} payment(s)</p>}
                {highlights.adjustment_count > 0 && <p>{highlights.adjustment_count} adjustment(s)</p>}
                {highlights.new_customers > 0 && <p>{highlights.new_customers} new customer(s)</p>}
                {!highlights.return_count && !highlights.payment_count && !highlights.adjustment_count && <p className="text-muted-foreground">No notable activity</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
         Section 5: Business Health
      ═���══════════════════════════════════════════════════════ */}
      {(health.insights?.length > 0 || health.warnings?.length > 0) && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            {health.warnings?.length > 0
              ? <AlertTriangle className="size-4 text-amber-500" />
              : <CheckCircle2 className="size-4 text-emerald-500" />
            }
            <h2 className="text-sm font-semibold text-foreground tracking-tight">Business Health</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Insights (positive) */}
            {health.insights?.map((i: HealthInsight, idx: number) => (
              <div key={`insight-${idx}`} className="flex items-start gap-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 p-3">
                <CheckCircle2 className="size-4 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">{i.message}</p>
              </div>
            ))}
            {/* Warnings */}
            {health.warnings?.map((w: HealthInsight, idx: number) => (
              <div key={`warn-${idx}`} className={cn(
                'flex items-start gap-2.5 rounded-lg p-3',
                w.type === 'danger'
                  ? 'bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50'
                  : 'bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50',
              )}>
                {w.type === 'danger'
                  ? <AlertTriangle className="size-4 text-red-500 mt-0.5 shrink-0" />
                  : <AlertTriangle className="size-4 text-amber-500 mt-0.5 shrink-0" />
                }
                <p className={cn('text-xs leading-relaxed',
                  w.type === 'danger' ? 'text-red-800 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'
                )}>{w.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
         Section 6: Chronological Timeline
      ════════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground tracking-tight">Event Timeline</h2>
        </div>

        {/* Event type quick filters */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {EVENT_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setEventFilter(f.key)}
              className={cn(
                'text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-colors',
                eventFilter === f.key
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-background text-muted-foreground border-border hover:text-foreground',
              )}
            >
              {f.label} ({filterEvents(events, f.key).length})
            </button>
          ))}
        </div>

        <ReportTable
          columns={columns}
          data={filteredEvents}
          keyExtractor={(r) => `${r.date}-${r.ref}-${r.type}`}
          pageSize={25}
          searchable
          searchPlaceholder="Search by reference, type, party..."
          onSearch={(data, q) =>
            data.filter((r) =>
              r.ref.toLowerCase().includes(q) ||
              r.type.toLowerCase().includes(q) ||
              r.party.toLowerCase().includes(q) ||
              r.description.toLowerCase().includes(q)
            )
          }
          emptyMessage="No events found for this filter and date range."
        />
      </div>

      {/* ════════════════════════════════════════════════════════
         Closing Summary
      ════════════════════════════════════════════════════════ */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{closing.total_transactions || 0} total events</span>
              <span className="text-emerald-600">{closing.financial_events || 0} financial</span>
              <span className="text-muted-foreground/60">{closing.operational_events || 0} operational</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span>Money In: <span className="font-semibold text-emerald-600">{formatCurrency(closing.total_money_in || 0)}</span></span>
              <span>Money Out: <span className="font-semibold text-red-500">{formatCurrency(closing.total_money_out || 0)}</span></span>
              <span>Closing: <span className={cn('font-bold', (closing.closing_balance || 0) >= 0 ? 'text-emerald-600' : 'text-red-500')}>{formatCurrency(closing.closing_balance || 0)}</span></span>
            </div>
          </div>
          {closing.generated_at && (
            <div className="text-[10px] text-muted-foreground/50 mt-2">
              Generated at {closing.generated_at}
            </div>
          )}
        </CardContent>
      </Card>
    </ReportLayout>
  )
}
