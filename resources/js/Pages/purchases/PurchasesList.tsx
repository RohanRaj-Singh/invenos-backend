import { useState, useMemo } from 'react'
import { router, usePage } from '@inertiajs/react'
import { ShoppingBag, Search, Plus, ArrowRight, RotateCcw, ChevronRight, Store } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { usePermission } from '@/features/auth/PermissionGuard'
import DateFilter, { type DateFilterValue } from '@/features/shared/DateFilter'

const payBadge: Record<string, string> = {
  paid: 'text-emerald-600 dark:text-emerald-400',
  partial: 'text-amber-600 dark:text-amber-400',
  unpaid: 'text-red-600 dark:text-red-400',
}

const statusBadge: Record<string, string> = {
  received: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  pending: 'bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400',
}

export default function PurchasesListPage() {
  const { props } = usePage()
  const { purchases, meta } = props as any

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'received' | 'pending'>('all')
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({ dateFrom: '', dateTo: '', quick: '' })
  const canCreate = usePermission('purchases', 'create')

  const handleDateChange = (val: DateFilterValue) => {
    setDateFilter(val)
    router.get('/purchases', { date_from: val.dateFrom, date_to: val.dateTo, quick: val.quick, search, status: filterStatus }, { preserveState: true, replace: true })
  }

  const list: any[] = purchases || []

  const filtered = useMemo(() => {
    return list.filter((bill: any) => {
      if (search) {
        const q = search.toLowerCase()
        const nameMatch = (bill.supplier_name || '').toLowerCase().includes(q)
        const refMatch = (bill.invoice_ref || '').toLowerCase().includes(q)
        if (!nameMatch && !refMatch) return false
      }
      if (filterStatus !== 'all' && bill.status !== filterStatus) return false
      return true
    })
  }, [list, search, filterStatus])

  const totalAmount = useMemo(() => filtered.reduce((s: number, x: any) => s + (x.total_amount || 0), 0), [filtered])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <ShoppingBag className="size-5" />
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Purchases</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">All Purchases</h1>
          <p className="text-sm text-muted-foreground mt-1">{meta?.total ?? list.length} transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.visit('/returns/purchase')} className="gap-1.5">
            <RotateCcw className="size-3.5" />
            <span className="hidden sm:inline">Return</span>
          </Button>
          {canCreate && (
            <Button size="sm" onClick={() => router.visit('/purchases/new')} className="gap-1.5 shadow-sm h-9">
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">New Purchase</span>
            </Button>
          )}
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text" placeholder="Search by invoice or supplier..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 no-scrollbar">
          {(['all', 'received', 'pending'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                'text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors shrink-0',
                filterStatus === s
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-background text-muted-foreground border-border hover:text-foreground'
              )}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
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
              <Th>Supplier</Th>
              <Th>Invoice</Th>
              <Th>Status</Th>
              <Th className="text-right">Total</Th>
              <Th className="text-right">Paid</Th>
              <Th>Payment</Th>
              <Th>Date</Th>
              <Th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-16 text-sm text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <ShoppingBag className="size-8 text-muted-foreground/50" />
                    <span>No purchases found.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((bill: any) => {
                const sCls = statusBadge[bill.status] || statusBadge.received
                const pCls = payBadge[bill.payment_status] || payBadge.paid
                return (
                  <tr key={bill.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors group cursor-pointer"
                    onClick={() => router.visit(`/purchases/${bill.id}`)}
                  >
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-medium text-foreground">{bill.supplier_name}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <code className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {bill.invoice_ref}
                      </code>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded', sCls)}>
                        {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm font-semibold tabular-nums">{formatCurrency(bill.total_amount)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm text-muted-foreground tabular-nums">{formatCurrency(bill.amount_paid)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn('text-xs font-medium', pCls)}>
                        {bill.payment_status.charAt(0).toUpperCase() + bill.payment_status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground">{formatDate(bill.date)}</td>
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
                  {filtered.length} purchase{filtered.length !== 1 ? 's' : ''}
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
            <ShoppingBag className="size-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No purchases found.</p>
          </div>
        ) : (
          filtered.map((bill: any) => {
            const sCls = statusBadge[bill.status] || statusBadge.received
            const pCls = payBadge[bill.payment_status] || payBadge.paid
            return (
              <button key={bill.id} onClick={() => router.visit(`/purchases/${bill.id}`)} className="w-full text-left group">
                <Card className="transition-all hover:shadow-md active:scale-[0.99]">
                  <CardContent className="p-0">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                            <Store className="size-5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-foreground leading-snug truncate">
                              {bill.supplier_name}
                            </h3>
                            <code className="text-[11px] font-mono text-muted-foreground">
                              {bill.invoice_ref}
                            </code>
                          </div>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground/30 mt-1 shrink-0" />
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="rounded-lg bg-muted/50 px-2.5 py-2">
                          <div className="text-[10px] text-muted-foreground">Status</div>
                          <div className={cn('text-xs font-medium mt-0.5', sCls)}>
                            {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                          </div>
                        </div>
                        <div className="rounded-lg bg-muted/50 px-2.5 py-2">
                          <div className="text-[10px] text-muted-foreground">Total</div>
                          <div className="text-xs font-semibold mt-0.5 tabular-nums">{formatCurrency(bill.total_amount)}</div>
                        </div>
                        <div className="rounded-lg bg-muted/50 px-2.5 py-2">
                          <div className="text-[10px] text-muted-foreground">Payment</div>
                          <div className={cn('text-xs font-medium mt-0.5', pCls)}>
                            {bill.payment_status.charAt(0).toUpperCase() + bill.payment_status.slice(1)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatDate(bill.date)}</span>
                        <span>{formatCurrency(bill.amount_paid)} paid</span>
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
