import { useState } from 'react'
import { usePermission } from '@/features/auth/PermissionGuard'
import { router, Link, usePage } from '@inertiajs/react'
import { ArrowLeft, Receipt, ExternalLink, Banknote, RotateCcw, Printer, Trash2, ChevronRight, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface BackendSaleItem {
  id: number
  product_id: number
  product_name: string
  packaging_name: string
  packaging_quantity: number
  base_quantity: number
  unit_price: number
  total: number
}

interface BackendSale {
  id: number
  invoice_number: string
  customer_id: number | null
  customer_name: string | null
  source: string
  date: string
  subtotal: number
  discount: number
  grand_total: number
  amount_paid: number
  outstanding_balance: number
  payment_status: string
  notes: string | null
  items: BackendSaleItem[]
  customer: { id: number; name: string } | null
  created_by: string | null
  created_at: string
}

const statusStyles: Record<string, { label: string; indicator: string }> = {
  paid: { label: 'Paid', indicator: 'bg-emerald-500' },
  partial: { label: 'Partial', indicator: 'bg-amber-500' },
  unpaid: { label: 'Unpaid', indicator: 'bg-red-500' },
}

const sourceStyles: Record<string, string> = {
  pos: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
  clinic: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
  manual: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
}

export default function SaleDetailPage() {
  const { props } = usePage()
  const { sale } = props as unknown as { sale: BackendSale | null }
  const authUser = (props as any).auth?.user ?? null
  const isAdmin = authUser?.role === 'admin'
  const [showPayment, setShowPayment] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')
  const [deleting, setDeleting] = useState(false)
  const canProcessReturn = usePermission('sales', 'processReturn')

  if (!sale) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="flex flex-col items-center justify-center py-24 text-sm text-muted-foreground">
          <Receipt className="size-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-1">Sale not found</h2>
          <p className="mb-4">This transaction doesn't exist.</p>
          <Button variant="outline" onClick={() => router.visit('/sales')}>Back to Sales</Button>
        </div>
      </div>
    )
  }

  const sCfg = sourceStyles[sale.source] || sourceStyles.pos
  const pStatus = statusStyles[sale.payment_status] || statusStyles.paid
  const outstanding = Math.max(0, sale.outstanding_balance)

  return (
    <div className="min-h-screen bg-muted/30 pb-24 sm:pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Sticky top bar */}
        <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14">
            <button
              onClick={() => router.visit('/sales')}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <Button variant="outline" size="sm" onClick={() => router.visit(`/sales/${sale.id}/print`)} className="gap-1.5 shrink-0">
                <Printer className="size-3.5" /> Print
              </Button>
              {canProcessReturn && (
                <Button variant="outline" size="sm" onClick={() => router.visit(`/returns/sale?ref=${sale.invoice_number}`)} className="gap-1.5 shrink-0">
                  <RotateCcw className="size-3.5" /> Return
                </Button>
              )}
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="gap-1.5 shrink-0 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="size-3.5" /> Delete
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Invoice header card */}
        <div className="px-4 sm:px-6 pt-5">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="size-4 text-muted-foreground shrink-0" />
                      <code className="text-sm font-mono font-semibold text-foreground">{sale.invoice_number}</code>
                    </div>
                    <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">
                      {sale.customer_name || 'Walk-in Customer'}
                    </h1>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{formatDate(sale.date)}</span>
                      <span className="text-muted-foreground/40">|</span>
                      {sale.customer && (
                        <Link href={`/contacts/${sale.customer_id}`} className="text-primary hover:underline inline-flex items-center gap-0.5">
                          View Contact <ChevronRight className="size-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border', sCfg)}>
                      <span className="size-1.5 rounded-full bg-current" />
                      {sale.source.charAt(0).toUpperCase() + sale.source.slice(1)}
                    </span>
                    <Badge variant="outline" className={cn(
                      'text-xs font-medium gap-1.5',
                      sale.payment_status === 'paid' ? 'text-emerald-600 border-emerald-200 dark:border-emerald-800' : '',
                      sale.payment_status === 'partial' ? 'text-amber-600 border-amber-200 dark:border-amber-800' : '',
                      sale.payment_status === 'unpaid' ? 'text-red-600 border-red-200 dark:border-red-800' : '',
                    )}>
                      <span className={cn('size-1.5 rounded-full', pStatus.indicator)} />
                      {pStatus.label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Financial summary row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border border-t border-border">
                <div className="px-4 py-3 sm:px-5 sm:py-3.5">
                  <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Subtotal</div>
                  <div className="text-sm font-semibold mt-0.5">{formatCurrency(sale.subtotal)}</div>
                </div>
                <div className="px-4 py-3 sm:px-5 sm:py-3.5">
                  <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Discount</div>
                  <div className={cn('text-sm font-semibold mt-0.5', sale.discount > 0 ? 'text-red-500' : '')}>
                    {sale.discount > 0 ? `-${formatCurrency(sale.discount)}` : '—'}
                  </div>
                </div>
                <div className="px-4 py-3 sm:px-5 sm:py-3.5">
                  <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Paid</div>
                  <div className="text-sm font-semibold mt-0.5 text-emerald-600">{formatCurrency(sale.amount_paid)}</div>
                </div>
                <div className="px-4 py-3 sm:px-5 sm:py-3.5">
                  <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total</div>
                  <div className="text-base font-bold mt-0.5">{formatCurrency(sale.grand_total)}</div>
                </div>
              </div>

              {/* Outstanding banner */}
              {outstanding > 0 && (
                <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 bg-amber-50/70 dark:bg-amber-950/20 border-t border-border">
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Outstanding Balance</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{formatCurrency(outstanding)}</span>
                    <Button variant="ghost" size="xs" onClick={() => setShowPayment(true)} className="text-xs gap-1">
                      <Banknote className="size-3" />
                      Pay
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Items section */}
        <div className="px-4 sm:px-6 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Items ({sale.items?.length || 0})</h2>
          </div>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {sale.items?.map((item, idx) => (
                <div key={item.id} className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono tabular-nums w-5 shrink-0">{idx + 1}.</span>
                      <p className="text-sm font-medium text-foreground truncate">{item.product_name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 ml-7">
                      <span className="tabular-nums">{item.packaging_quantity}</span>
                      <span className="mx-1">×</span>
                      <span className="font-medium">{item.packaging_name}</span>
                      <span className="mx-1.5 text-muted-foreground/30">@</span>
                      <span className="tabular-nums">{formatCurrency(item.unit_price)}</span>
                      {item.base_quantity > 0 && item.base_quantity !== item.packaging_quantity && (
                        <span className="text-muted-foreground/50 ml-1">({item.base_quantity} base units)</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-sm font-semibold tabular-nums">{formatCurrency(item.total)}</p>
                  </div>
                </div>
              ))}
              {(!sale.items || sale.items.length === 0) && (
                <div className="px-4 sm:px-5 py-8 text-center text-sm text-muted-foreground">No items recorded.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        {sale.notes && (
          <div className="px-4 sm:px-6 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{sale.notes}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer meta */}
        <div className="px-4 sm:px-6 mt-4">
          <p className="text-xs text-muted-foreground/60">
            Created {sale.created_by ? `by ${sale.created_by}` : ''} · {formatDateTime(sale.created_at)}
          </p>
        </div>
      </div>

      {/* ── Delete Sale Dialog ── */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md gap-0 p-0">
          <DialogHeader className="p-5 pb-0">
            <DialogTitle className="text-base text-red-600 flex items-center gap-2">
              <Trash2 className="size-4" />
              Delete Sale
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-1">
              This will reverse inventory, adjust customer balance, and move the invoice to the Recycle Bin. This action can be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="p-5 space-y-4">
            <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 text-sm">
              <p className="font-medium text-red-700 dark:text-red-400">Impact preview:</p>
              <ul className="mt-1.5 text-xs text-red-600 dark:text-red-300 space-y-0.5">
                <li>• Inventory added back ({sale.items?.length || 0} items)</li>
                <li>• Customer balance reduced by {formatCurrency(sale.grand_total)}</li>
                <li>• Invoice {sale.invoice_number} moved to Recycle Bin</li>
              </ul>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Reason for deletion</label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="e.g. Duplicate entry, customer cancelled..."
                rows={3}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setDeleteReason('') }} className="flex-1" disabled={deleting}>Cancel</Button>
              <Button variant="destructive" onClick={() => {
                setDeleting(true)
                const reason = deleteReason.trim() || 'No reason provided'
                router.delete(`/sales/${sale.id}`, {
                  data: { reason },
                  onSuccess: () => {
                    toast.success(`Sale ${sale.invoice_number} deleted. Inventory reversed.`)
                    router.visit('/sales', { preserveState: false })
                  },
                  onError: (errs) => {
                    toast.error(Object.values(errs)[0] as string || 'Failed to delete sale')
                    setDeleting(false)
                    setShowDeleteDialog(false)
                  },
                  onFinish: () => setDeleting(false),
                })
              }} className="flex-1 gap-1.5" disabled={deleting}>
                <Trash2 className="size-3.5" />
                {deleting ? 'Deleting...' : 'Delete Sale'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
