import { router } from '@inertiajs/react'
import { Calendar, FileText, Clock, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; class: string; bgClass: string }> = {
  completed: { label:'Completed', icon: CheckCircle2, class:'text-emerald-600 dark:text-emerald-400', bgClass:'bg-emerald-50 dark:bg-emerald-950/30' },
  'follow-up': { label:'Follow-up', icon: Clock, class:'text-amber-600 dark:text-amber-400', bgClass:'bg-amber-50 dark:bg-amber-950/30' },
  scheduled: { label:'Scheduled', icon: Calendar, class:'text-blue-600 dark:text-blue-400', bgClass:'bg-blue-50 dark:bg-blue-950/30' },
}

const payStatusCfg: Record<string, { label: string; cls: string }> = {
  paid: { label:'Paid', cls:'text-emerald-600 dark:text-emerald-400' },
  partial: { label:'Partial', cls:'text-amber-600 dark:text-amber-400' },
  unpaid: { label:'Unpaid', cls:'text-red-600 dark:text-red-400' },
}

interface VisitsTimelineProps {
  /** Backend consultations (preferred) */
  consultations?: any[]
  /** Legacy mock visits (fallback) */
  visits?: any[]
  /** Legacy sales map (fallback) */
  salesMap?: Map<string, any>
}

function groupByMonth(items: any[], dateField: string) {
  const g: Record<string, any[]> = {}
  for (const v of items) {
    const d = v[dateField] || ''
    const parts = d.split('-') // YYYY-MM-DD
    const key = parts.length >= 2 ? `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(parts[1]) - 1] || ''} ${parts[0]}` : d
    if (!g[key]) g[key] = []
    g[key].push(v)
  }
  return g
}

export default function VisitsTimeline({ consultations, visits, salesMap }: VisitsTimelineProps) {
  // Prefer backend consultations, fall back to legacy mock visits
  const items = consultations || visits || []
  const dateField = consultations ? 'visit_date' : 'visitDate'
  const grouped = groupByMonth(items, dateField)

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([monthYear, monthItems]) => (
        <div key={monthYear}>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">{monthYear}</h4>
          <div className="space-y-2">
            {monthItems.map((item: any, idx: number) => {
              const cfg = statusConfig[item.status] || statusConfig.completed
              const StatusIcon = cfg.icon
              const isLast = idx === monthItems.length - 1

              // Backend: sale is eager-loaded; Legacy: sale from salesMap
              const sale = item.sale || (item.saleId && salesMap?.get(item.saleId)) || null
              const ps = sale ? payStatusCfg[sale.payment_status || sale.paymentStatus] : null
              const visitDate = item.visit_date || item.visitDate || ''
              const fee = item.consultation_fee ?? item.consultationFee ?? 0

              return (
                <div key={item.id} className="relative flex gap-3 group">
                  {!isLast && <div className="absolute left-[15px] top-8 bottom-[-8px] w-px bg-border" />}
                  <div className={cn('relative z-10 flex items-center justify-center size-8 rounded-full shrink-0 mt-0.5 ring-1 ring-border', cfg.bgClass)}>
                    <StatusIcon className={cn('size-4', cfg.class)} />
                  </div>
                  <div className="flex-1 min-w-0 pb-2">
                    <div className="rounded-xl border border-border bg-card p-3.5 transition-colors hover:bg-muted/30 cursor-pointer" onClick={() => router.visit(`/clinic/visit/${item.id}`)}>
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">{visitDate}</span>
                          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4 font-medium', cfg.class)}>{cfg.label}</Badge>
                        </div>
                        <span className="text-xs font-semibold shrink-0">Rs. {fee.toLocaleString()}</span>
                      </div>
                      <h5 className="text-sm font-semibold text-foreground">{item.type || 'General Consultation'}</h5>
                      {item.doctor && <p className="text-xs text-muted-foreground mt-0.5">{item.doctor}</p>}
                      <div className="mt-2 pt-2 border-t border-border">
                        <div className="flex items-start gap-1.5">
                          <FileText className="size-3 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-foreground">{item.diagnosis}</p>
                            {item.notes && <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{item.notes}</p>}
                          </div>
                        </div>
                      </div>
                      {sale && (
                        <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs">
                            <span className="font-medium text-foreground">{sale.invoice_number || sale.invoiceNumber}</span>
                            <span className={cn('font-medium', ps?.cls || '')}>{ps?.label || sale.payment_status || sale.paymentStatus}</span>
                            <span className="text-muted-foreground">{(sale.items?.length || sale.itemCount || 0)} items</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{formatCurrency(sale.grand_total ?? sale.grandTotal ?? 0)}</span>
                            <button onClick={(e) => { e.stopPropagation(); router.visit(`/sales/${sale.id}`) }} className="text-[11px] text-primary hover:underline shrink-0">Sale →</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
      {items.length === 0 && <div className="text-center py-12 text-sm text-muted-foreground">No visit records found.</div>}
    </div>
  )
}
