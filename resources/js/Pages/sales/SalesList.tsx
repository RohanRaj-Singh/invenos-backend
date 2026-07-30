import { useState, useMemo } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Receipt, Search, ArrowRight, RotateCcw, Plus, ChevronRight, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { usePermission } from '@/features/auth/PermissionGuard'
import DateFilter, { type DateFilterValue } from '@/features/shared/DateFilter'

const sourceBadge: Record<string, string> = {
  pos: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  clinic: 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
  manual: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
}

const payCls: Record<string, string> = {
  paid: 'text-emerald-600 dark:text-emerald-400',
  partial: 'text-amber-600 dark:text-amber-400',
  unpaid: 'text-red-600 dark:text-red-400',
}

export default function SalesListPage() {
  const { props } = usePage()
  const { sales, meta } = props as any
  const navigate = (path: string) => router.visit(path)
  const [search, setSearch] = useState('')
  const [filterSource, setFilterSource] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({ dateFrom: '', dateTo: '', quick: '' })
  const canCreate = usePermission('sales', 'create')
  const canProcessReturn = usePermission('sales', 'processReturn')

  const handleDateChange = (val: DateFilterValue) => {
    setDateFilter(val)
    router.get('/sales', { date_from: val.dateFrom, date_to: val.dateTo, quick: val.quick, search, source: filterSource }, { preserveState: true, replace: true })
  }

  const list: any[] = sales || []

  const filtered = useMemo(() => {
    return list.filter((s) => {
      if (s.invoice_number?.startsWith('RET-')) return false
      if (search) {
        const q = search.toLowerCase()
        const nameMatch = (s.customer_name || '').toLowerCase().includes(q)
        const invMatch = s.invoice_number.toLowerCase().includes(q)
        if (!nameMatch && !invMatch) return false
      }
      if (filterSource !== 'all' && s.source !== filterSource) return false
      return true
    })
  }, [list, search, filterSource])

  const totalAmount = useMemo(() => filtered.reduce((s: number, x: any) => s + (x.grand_total || 0), 0), [filtered])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Receipt className="size-5" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Sales</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">All Sales</h1>
          <p className="text-sm text-muted-foreground mt-1">{meta?.total ?? list.length} transactions</p>
        </div>
        <div className="flex items-center gap-2">
          {canProcessReturn && (
            <Button variant="outline" size="sm" onClick={() => navigate('/returns/sale')} className="gap-1.5">
              <RotateCcw className="size-3.5" />
              <span className="hidden sm:inline">Return</span>
            </Button>
          )}
          {canCreate && (
            <Button size="sm" onClick={() => navigate('/sales/pos')} className="gap-1.5 shadow-sm h-9">
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">New Sale</span>
            </Button>
          )}
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text" placeholder="Search by invoice or customer..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 no-scrollbar">
          {(['all', 'pos', 'clinic', 'manual'] as const).map((src) => (
            <button
              key={src}
              onClick={() => setFilterSource(src)}
              className={cn(
                'text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors shrink-0',
                filterSource === src
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-background text-muted-foreground border-border hover:text-foreground'
              )}
            >
              {src === 'all' ? 'All' : src.charAt(0).toUpperCase() + src.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Date filter row */}
      <div className="border-t border-border pt-3 flex items-center gap-2">
        <DateFilter value={dateFilter} onChange={handleDateChange} />
        {(dateFilter.dateFrom || dateFilter.dateTo) && (
          <button onClick={() => handleDateChange({ dateFrom: '', dateTo: '', quick: '' })}
            className="text-xs text-muted-foreground hover:text-foreground underline transition-colors">
            Clear
          </button>
        )}
      </div>

      {/* ── Desktop Table ── */}
      <div className="hidden md:block rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <Th>Customer</Th>
              <Th>Invoice</Th>
              <Th>Source</Th>
              <Th className="text-right">Total</Th>
              <Th className="text-right">Paid</Th>
              <Th>Status</Th>
              <Th>Date</Th>
              <Th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-16 text-sm text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Receipt className="size-8 text-muted-foreground/50" />
                    <span>No sales found.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((s: any) => {
                const srcCls = sourceBadge[s.source] || sourceBadge.pos
                const pCls = payCls[s.payment_status] || payCls.paid
                return (
                  <tr key={s.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/sales/${s.id}`)}
                  >
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-medium text-foreground">{s.customer_name || 'Walk-in Customer'}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <code className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {s.invoice_number}
                      </code>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded', srcCls)}>
                        {s.source.charAt(0).toUpperCase() + s.source.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm font-semibold tabular-nums">{formatCurrency(s.grand_total)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm text-muted-foreground tabular-nums">{formatCurrency(s.amount_paid)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn('text-xs font-medium', pCls)}>{s.payment_status.charAt(0).toUpperCase() + s.payment_status.slice(1)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground">{formatDate(s.date)}</td>
                    <td className="px-4 py-3.5">
                      <ArrowRight className="size-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/20">
                <td colSpan={3} className="px-4 py-3 text-sm font-medium text-foreground">
                  {filtered.length} sale{filtered.length !== 1 ? 's' : ''}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(totalAmount)}</span>
                </td>
                <td colSpan={4} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ── Mobile Cards ── */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Receipt className="size-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No sales found.</p>
          </div>
        ) : (
          filtered.map((s: any) => {
            const srcCls = sourceBadge[s.source] || sourceBadge.pos
            const pCls = payCls[s.payment_status] || payCls.paid
            return (
              <button key={s.id} onClick={() => navigate(`/sales/${s.id}`)} className="w-full text-left group">
                <Card className="transition-all hover:shadow-md active:scale-[0.99]">
                  <CardContent className="p-0">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                            <FileText className="size-5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-foreground leading-snug truncate">
                              {s.customer_name || 'Walk-in Customer'}
                            </h3>
                            <code className="text-[11px] font-mono text-muted-foreground">
                              {s.invoice_number}
                            </code>
                          </div>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground/30 mt-1 shrink-0" />
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="rounded-lg bg-muted/50 px-2.5 py-2">
                          <div className="text-[10px] text-muted-foreground">Source</div>
                          <div className={cn('text-xs font-medium mt-0.5', srcCls)}>
                            {s.source.charAt(0).toUpperCase() + s.source.slice(1)}
                          </div>
                        </div>
                        <div className="rounded-lg bg-muted/50 px-2.5 py-2">
                          <div className="text-[10px] text-muted-foreground">Total</div>
                          <div className="text-xs font-semibold mt-0.5 tabular-nums">{formatCurrency(s.grand_total)}</div>
                        </div>
                        <div className="rounded-lg bg-muted/50 px-2.5 py-2">
                          <div className="text-[10px] text-muted-foreground">Status</div>
                          <div className={cn('text-xs font-medium mt-0.5', pCls)}>
                            {s.payment_status.charAt(0).toUpperCase() + s.payment_status.slice(1)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatDate(s.date)}</span>
                        <span>{formatCurrency(s.amount_paid)} paid</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn('px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider', className)}>
      {children}
    </th>
  )
}
