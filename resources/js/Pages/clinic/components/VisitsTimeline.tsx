import { router } from '@inertiajs/react'
import { Calendar, FileText, Clock, CheckCircle2, ChevronRight, Pill } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/lib/format'

// ─── Status config ────────────────────────────────────────────
const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; class: string; bgClass: string }> = {
  completed: { label: 'Completed', icon: CheckCircle2, class: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-50 dark:bg-emerald-950/30' },
  'follow-up': { label: 'Follow-up', icon: Clock, class: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-50 dark:bg-amber-950/30' },
  scheduled:  { label: 'Scheduled', icon: Calendar, class: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-50 dark:bg-blue-950/30' },
}

const payStatusBadge: Record<string, { label: string; cls: string }> = {
  paid:    { label: 'Paid',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' },
  partial: { label: 'Partial', cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' },
  unpaid:  { label: 'Unpaid',  cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800' },
}

// ─── Relative time helper ─────────────────────────────────────
function relativeTime(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 0) return formatDate(dateStr)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return formatDate(dateStr)
}

// ─── Month grouping ────────────────────────────────────────────
function groupByMonth(items: any[], dateField: string) {
  const g: Record<string, any[]> = {}
  for (const v of items) {
    const d = v[dateField] || ''
    const parts = d.split('-')
    if (parts.length >= 2) {
      const monthIdx = parseInt(parts[1]) - 1
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      const key = `${months[monthIdx] || ''} ${parts[0]}`
      if (!g[key]) g[key] = []
      g[key].push(v)
    }
  }
  return g
}

// ─── Props ────────────────────────────────────────────────────
interface VisitsTimelineProps {
  consultations?: any[]
  visits?: any[]
  salesMap?: Map<string, any>
}

// ─── Component ────────────────────────────────────────────────
export default function VisitsTimeline({ consultations, visits, salesMap }: VisitsTimelineProps) {
  const items = consultations || visits || []
  const dateField = consultations ? 'visit_date' : 'visitDate'
  const grouped = groupByMonth(items, dateField)

  const hasItems = Object.keys(grouped).length > 0

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([monthYear, monthItems]) => (
        <section key={monthYear}>
          {/* ── Month header ── */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center size-8 rounded-xl bg-primary/10 text-primary shrink-0">
              <Calendar className="size-4" />
            </div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">{monthYear}</h3>
            <div className="h-px flex-1 bg-border/60" />
            <span className="text-[11px] text-muted-foreground tabular-nums">{monthItems.length} visit{monthItems.length !== 1 ? 's' : ''}</span>
          </div>

          {/* ── Visit cards ── */}
          <div className="space-y-3">
            {monthItems.map((item: any) => {
              const cfg = statusConfig[item.status] || statusConfig.completed
              const StatusIcon = cfg.icon
              const sale = item.sale || (item.saleId && salesMap?.get(item.saleId)) || null
              const payStatus = sale ? payStatusBadge[sale.payment_status || sale.paymentStatus] : null
              const visitDate = item.visit_date || item.visitDate || ''
              const consultationFee = item.consultation_fee ?? item.consultationFee ?? 0
              const saleItems = sale?.items || []
              const medicinesTotal = saleItems.reduce((sum: number, si: any) => sum + (si.total || 0), 0)
              // Full total = consultation fee + medicines from sale
              const grandTotal = consultationFee + (sale?.grand_total ?? sale?.grandTotal ?? 0)
              const paidAmount = sale?.amount_paid ?? sale?.amountPaid ?? 0
              const outstandingAmount = Math.max(0, grandTotal - paidAmount)

              return (
                <div
                  key={item.id}
                  onClick={() => router.visit(`/clinic/visit/${item.id}`)}
                  className={cn(
                    'group relative rounded-2xl border border-border/80 bg-card',
                    'hover:border-primary/30 hover:shadow-sm hover:bg-muted/20',
                    'transition-all duration-200 cursor-pointer overflow-hidden',
                  )}
                >
                  {/* Top accent bar based on status */}
                  <div className={cn(
                    'h-1 w-full',
                    item.status === 'completed' && 'bg-emerald-500/50',
                    item.status === 'follow-up' && 'bg-amber-500/50',
                    item.status === 'scheduled' && 'bg-blue-500/50',
                  )} />

                  <div className="p-4 sm:p-5">
                    {/* ── Row 1: Date · Status · Cost ── */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn(
                          'flex items-center justify-center size-9 rounded-xl shrink-0 ring-1 ring-border/50',
                          cfg.bgClass
                        )}>
                          <StatusIcon className={cn('size-[18px]', cfg.class)} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {formatDate(visitDate)}
                            </span>
                            <span className="text-[11px] text-muted-foreground/70 hidden sm:inline">
                              {relativeTime(visitDate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="outline" className={cn(
                              'text-[10px] px-1.5 py-0 h-4 font-medium',
                              item.status === 'completed' && 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
                              item.status === 'follow-up' && 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
                              item.status === 'scheduled' && 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
                            )}>
                              {cfg.label}
                            </Badge>
                            {item.type && item.type !== 'General Consultation' && (
                              <span className="text-[10px] text-muted-foreground/60 truncate max-w-[120px]">{item.type}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Cost summary — prominent on the right */}
                      <div className="text-right shrink-0">
                        <div className="text-base font-bold text-foreground tabular-nums leading-none">
                          {formatCurrency(grandTotal)}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {paidAmount > 0
                            ? `${formatCurrency(paidAmount)} paid`
                            : 'Not paid'}
                        </div>
                      </div>
                    </div>

                    {/* ── Row 2: Diagnosis + Doctor ── */}
                    <div className="flex items-start gap-2 mb-3">
                      <FileText className="size-3.5 text-muted-foreground/70 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground leading-snug">{item.diagnosis || 'No diagnosis recorded'}</p>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{item.notes}</p>
                        )}
                      </div>
                    </div>

                    {/* Row 3: Financial snapshot */}
                    {sale && (
                      <div className="rounded-xl bg-muted/50 border border-border/50 p-3 sm:p-3.5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                          {/* Consultation fee */}
                          <div className="rounded-lg bg-background/60 px-2.5 py-2 border border-border/30">
                            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Consultation</div>
                            <div className="text-sm font-semibold text-foreground mt-0.5 tabular-nums">{formatCurrency(consultationFee)}</div>
                          </div>
                          {/* Medicines */}
                          <div className="rounded-lg bg-background/60 px-2.5 py-2 border border-border/30">
                            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Medicines</div>
                            <div className="text-sm font-semibold text-foreground mt-0.5 tabular-nums">{formatCurrency(medicinesTotal)}</div>
                          </div>
                          {/* Items count */}
                          <div className="rounded-lg bg-background/60 px-2.5 py-2 border border-border/30">
                            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Items</div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Pill className="size-3.5 text-muted-foreground/70 shrink-0" />
                              <span className="text-sm font-semibold text-foreground tabular-nums">{saleItems.length}</span>
                              {sale.invoice_number && (
                                <span className="text-[10px] text-muted-foreground/60 ml-1 font-mono">{sale.invoice_number}</span>
                              )}
                            </div>
                          </div>
                          {/* Payment status */}
                          <div className="rounded-lg bg-background/60 px-2.5 py-2 border border-border/30">
                            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Payment</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {payStatus ? (
                                <span className={cn(
                                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border',
                                  payStatus.cls,
                                )}>
                                  {payStatus.label}
                                </span>
                              ) : (
                                <span className="text-[11px] text-muted-foreground/60">—</span>
                              )}
                              {outstandingAmount > 0 && (
                                <span className="text-[11px] font-medium text-red-500 tabular-nums">
                                  {formatCurrency(outstandingAmount)} due
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Total breakdown row */}
                        <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{formatCurrency(consultationFee)} fee + {formatCurrency(medicinesTotal)} medicines</span>
                          <span className="font-bold text-foreground text-sm tabular-nums">Total {formatCurrency(grandTotal)}</span>
                        </div>
                      </div>
                    )}

                    {/* ── Row 4: Action ── */}
                    <div className="flex items-center justify-end mt-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary/80 group-hover:text-primary transition-colors">
                        View visit details
                        <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}

      {/* ── Empty state ── */}
      {!hasItems && (
        <div className="text-center py-16">
          <div className="flex items-center justify-center size-14 rounded-2xl bg-muted mx-auto mb-4">
            <Calendar className="size-6 text-muted-foreground/50" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">No visits yet</h3>
          <p className="text-xs text-muted-foreground/70 max-w-[200px] mx-auto leading-relaxed">
            Visit records will appear here once the patient has been seen.
          </p>
        </div>
      )}
    </div>
  )
}
