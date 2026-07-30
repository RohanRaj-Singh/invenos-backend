import { useState, useMemo } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Search, CreditCard, Banknote, Smartphone, Wallet, Building2, Trash2, Plus, ArrowUpRight, ArrowDownRight, Filter, Printer, Share2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import DateFilter, { type DateFilterValue } from '@/features/shared/DateFilter'
import RecordPaymentDialog from './components/RecordPaymentDialog'

interface ContactInfo {
  id: number
  name: string
  phone: string
  current_balance: number
}

interface BackendTransaction {
  id: number
  contact_id: number | null
  direction: 'in' | 'out'
  type: string
  date: string
  amount: number
  method: string
  reference: string
  description: string | null
  linked_sale_id: number | null
  created_by: string | null
  contact: { id: number; name: string } | null
}

const methodCfg: Record<string, { label: string; icon: typeof Banknote; color: string; bg: string }> = {
  cash: { label: 'Cash', icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  easypaisa: { label: 'Easypaisa', icon: Smartphone, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-500/10' },
  jazzcash: { label: 'JazzCash', icon: Wallet, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-500/10' },
  card: { label: 'Card', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  transfer: { label: 'Bank Transfer', icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-500/10' },
}

const METHODS = ['all', 'cash', 'card', 'transfer', 'easypaisa', 'jazzcash'] as const

export default function PaymentsListPage() {
  const { props } = usePage()
  const { payments, meta } = props as any
  const txns: BackendTransaction[] = payments || []
  const contactOptions: ContactInfo[] = (props as any).contacts || []

  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [selectedFT, setSelectedFT] = useState<BackendTransaction | null>(null)
  const [showRecordPayment, setShowRecordPayment] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({ dateFrom: '', dateTo: '', quick: '' })

  const handleDateChange = (val: DateFilterValue) => {
    setDateFilter(val)
    router.get('/payments', { date_from: val.dateFrom, date_to: val.dateTo, quick: val.quick, search, method: methodFilter }, { preserveState: true, replace: true })
  }

  const totalIn = useMemo(() => txns.reduce((s, t) => s + (t.direction === 'in' ? (t.amount || 0) : 0), 0), [txns])
  const totalOut = useMemo(() => txns.reduce((s, t) => s + (t.direction === 'out' ? (t.amount || 0) : 0), 0), [txns])

  const filtered = useMemo(() => {
    return txns.filter((t) => {
      if (methodFilter !== 'all' && t.method !== methodFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (t.contact?.name?.toLowerCase().includes(q)) return true
        if (t.reference?.toLowerCase().includes(q)) return true
        if (t.description?.toLowerCase().includes(q)) return true
        return false
      }
      return true
    })
  }, [txns, search, methodFilter])

  const hasFilters = search !== '' || methodFilter !== 'all'

  const doDelete = (id: number) => {
    router.delete(`/payments/${id}`, {
      onSuccess: () => { toast.success('Payment deleted.'); router.reload({ only: ['payments'] }) },
      onError: () => toast.error('Failed to delete payment'),
    })
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-28 sm:pb-8">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14 sm:h-16 max-w-7xl mx-auto">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-primary mb-0.5">
              <CreditCard className="size-4 sm:size-5" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Payments</span>
            </div>
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight">Recorded Payments</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowMobileFilters(!showMobileFilters)} className={cn('sm:hidden gap-1.5', showMobileFilters && 'bg-muted')}>
              <Filter className="size-3.5" />
            </Button>
            <Button size="sm" className="gap-1.5 shadow-sm" onClick={() => setShowRecordPayment(true)}>
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">Record Payment</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Summary + filters row (desktop) ── */}
        <div className="hidden sm:flex sm:items-center sm:justify-between sm:mt-4 sm:mb-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input type="text" placeholder="Search by contact, reference, or note..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring transition-colors" />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {METHODS.map((m) => (
                <button key={m} onClick={() => setMethodFilter(m)}
                  className={cn('text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors shrink-0 whitespace-nowrap',
                    methodFilter === m
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background text-muted-foreground border-border hover:text-foreground')}>
                  {m === 'all' ? 'All' : methodCfg[m]?.label || m}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm ml-6">
            <span className="text-muted-foreground">{meta?.total ?? txns.length} payments</span>
            <span className="text-emerald-600 font-semibold tabular-nums">+{formatCurrency(totalIn)}</span>
            <span className="text-red-600 font-semibold tabular-nums">-{formatCurrency(totalOut)}</span>
          </div>
        </div>

        {/* ── Mobile search + filter (collapsible) ── */}
        <div className="sm:hidden mt-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring transition-colors" />
          </div>
          {showMobileFilters && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {METHODS.map((m) => (
                <button key={m} onClick={() => setMethodFilter(m)}
                  className={cn('text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors shrink-0 whitespace-nowrap',
                    methodFilter === m ? 'bg-foreground text-background border-foreground' : 'bg-background text-muted-foreground border-border hover:text-foreground')}>
                  {m === 'all' ? 'All' : methodCfg[m]?.label || m}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date filter row */}
        <div className="border-t border-border pt-3 mt-3 flex items-center gap-2">
          <DateFilter value={dateFilter} onChange={handleDateChange} />
          {(dateFilter.dateFrom || dateFilter.dateTo) && (
            <button onClick={() => handleDateChange({ dateFrom: '', dateTo: '', quick: '' })}
              className="text-xs text-muted-foreground hover:text-foreground underline transition-colors">
              Clear
            </button>
          )}
        </div>

        {/* ── Desktop table ── */}
        <div className="hidden sm:block mt-4 rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <Th>Date</Th>
                <Th>Ref / Note</Th>
                <Th>Contact</Th>
                <Th>Method</Th>
                <Th className="text-right">Amount</Th>
                <Th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                      <CreditCard className="size-10 text-muted-foreground/30" />
                      <span className="font-medium text-foreground">No payments recorded</span>
                      <span>{hasFilters ? 'Try adjusting your filters.' : 'Click "Record Payment" to add one.'}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((ft) => {
                  const cfg = methodCfg[ft.method] || methodCfg.cash
                  const Icon = cfg.icon
                  return (
                    <tr key={ft.id}
                      className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors group cursor-pointer"
                      onClick={() => setSelectedFT(ft)}>
                      <td className="px-4 sm:px-5 py-3.5 text-sm text-muted-foreground">{formatDate(ft.date)}</td>
                      <td className="px-4 sm:px-5 py-3.5">
                        <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{ft.reference}</code>
                        {ft.description && <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-1">{ft.description}</p>}
                      </td>
                      <td className="px-4 sm:px-5 py-3.5">
                        <span className="text-sm font-medium">{ft.contact?.name || '—'}</span>
                      </td>
                      <td className="px-4 sm:px-5 py-3.5">
                        <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full', cfg.bg, cfg.color)}>
                          <Icon className="size-3.5" />{cfg.label}
                        </span>
                      </td>
                      <td className={cn('px-4 sm:px-5 py-3.5 text-base font-bold text-right tabular-nums', ft.direction === 'in' ? 'text-emerald-600' : 'text-red-600')}>
                        <span className="text-xs font-medium opacity-60">{ft.direction === 'in' ? '+' : '-'}</span>
                        {formatCurrency(ft.amount)}
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 text-center">
                        <button onClick={(e) => { e.stopPropagation(); doDelete(ft.id) }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all" title="Delete">
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Mobile card list ── */}
        <div className="sm:hidden mt-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CreditCard className="size-12 text-muted-foreground/20 mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No payments recorded</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                {hasFilters ? 'Try adjusting your search or filters.' : 'Record your first payment to get started.'}
              </p>
            </div>
          ) : (
            filtered.map((ft) => {
              const cfg = methodCfg[ft.method] || methodCfg.cash
              const Icon = cfg.icon
              return (
                <button key={ft.id} onClick={() => setSelectedFT(ft)} className="w-full text-left group">
                  <Card className="transition-all hover:shadow-sm active:scale-[0.99]">
                    <CardContent className="p-0">
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={cn('size-10 rounded-xl flex items-center justify-center shrink-0', cfg.bg)}>
                              <Icon className={cn('size-5', cfg.color)} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold truncate">{ft.contact?.name || '—'}</span>
                                <span className={cn('inline-flex items-center gap-0.5 text-[11px] font-medium', ft.direction === 'in' ? 'text-emerald-600' : 'text-red-600')}>
                                  {ft.direction === 'in' ? <ArrowDownRight className="size-3" /> : <ArrowUpRight className="size-3" />}
                                  {ft.direction === 'in' ? 'In' : 'Out'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <span className="font-mono bg-muted px-1 py-0.5 rounded text-[11px]">{ft.reference}</span>
                                <span>·</span>
                                <span>{formatDate(ft.date)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <div className={cn('text-base font-bold tabular-nums', ft.direction === 'in' ? 'text-emerald-600' : 'text-red-600')}>
                                {ft.direction === 'in' ? '+' : '-'}{formatCurrency(ft.amount)}
                              </div>
                              <div className="text-[11px] text-muted-foreground">{cfg.label}</div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); doDelete(ft.id) }}
                              className="flex items-center justify-center size-8 rounded-lg text-muted-foreground/30 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors -mr-1" title="Delete">
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                        {ft.description && (
                          <p className="text-xs text-muted-foreground mt-2 ml-[52px] line-clamp-2">{ft.description}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── Mobile FAB ── */}
      <button onClick={() => setShowRecordPayment(true)}
        className="fixed bottom-6 right-4 sm:hidden flex items-center justify-center size-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-all z-20">
        <Plus className="size-6" />
      </button>

      <RecordPaymentDialog contacts={contactOptions} open={showRecordPayment} onClose={() => setShowRecordPayment(false)} onSuccess={() => router.reload({ only: ['payments'] })} />
      <PaymentDetailModal ft={selectedFT} onClose={() => setSelectedFT(null)} />
    </div>
  )
}

// ─── Payment Detail Modal ─────────────────────────────────

function PaymentDetailModal({ ft, onClose }: { ft: BackendTransaction | null; onClose: () => void }) {
  const [deleting, setDeleting] = useState(false)
  if (!ft) return null
  const cfg = methodCfg[ft.method] || methodCfg.cash

  const handlePrint = () => {
    router.visit(`/payments/${ft.id}/print`)
  }

  const handleShare = async () => {
    const text = [
      `Payment ${ft.direction === 'in' ? 'Received' : 'Sent'}`,
      `Amount: ${formatCurrency(ft.amount)}`,
      `Reference: ${ft.reference}`,
      `Date: ${formatDate(ft.date)}`,
      `Contact: ${ft.contact?.name || '—'}`,
      `Method: ${cfg.label}`,
      ft.description ? `Note: ${ft.description}` : '',
    ].filter(Boolean).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Payment details copied')
    } catch {
      toast.error('Could not copy')
    }
  }

  return (
    <Dialog open={!!ft} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md gap-0 p-0 rounded-2xl sm:rounded-xl">
        {/* Amount hero */}
        <div className="px-5 sm:px-6 pt-8 sm:pt-10 pb-6 text-center border-b border-border bg-gradient-to-b from-primary/[0.03] to-transparent">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-primary/5 mb-4">
            <CreditCard className="size-7 text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">{formatCurrency(ft.amount)}</div>
          <div className={cn('text-sm font-medium mt-1.5', ft.direction === 'in' ? 'text-emerald-600' : 'text-red-600')}>
            {ft.direction === 'in' ? 'Payment Received' : 'Payment Sent'}
          </div>
          <div className="text-xs text-muted-foreground mt-1 font-mono">{ft.reference}</div>
        </div>

        {/* Details */}
        <div className="px-5 sm:px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date</div>
              <div className="text-sm font-semibold mt-1">{formatDate(ft.date)}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Contact</div>
              <div className="text-sm font-semibold mt-1 truncate">{ft.contact?.name || '—'}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Method</div>
              <div className="text-sm font-semibold mt-1">{cfg.label}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Recorded by</div>
              <div className="text-sm font-semibold mt-1">{ft.created_by || '—'}</div>
            </div>
          </div>

          {ft.description && (
            <div className="border-t border-border pt-4">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Note</div>
              <p className="text-sm text-foreground">{ft.description}</p>
            </div>
          )}

          {/* Print + Share actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1 gap-1.5 h-10">
              <Printer className="size-3.5" /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare} className="flex-1 gap-1.5 h-10">
              <Share2 className="size-3.5" /> Share
            </Button>
          </div>

          <div className="border-t border-border pt-4">
            <Button variant="outline" size="sm" onClick={() => {
              if (!confirm('Delete this payment?')) return
              router.delete(`/payments/${ft.id}`, {
                onSuccess: () => { toast.success('Payment deleted.'); onClose(); router.reload({ only: ['payments'] }) },
                onError: () => toast.error('Failed to delete'),
              })
            }} disabled={deleting} className="w-full gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-950/20 h-10">
              <Trash2 className="size-3.5" /> Delete Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn('px-4 sm:px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider', className)}>{children}</th>
}
