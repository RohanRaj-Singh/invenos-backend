import { useState } from 'react'
import { router, Link, usePage } from '@inertiajs/react'
import { ArrowLeft, ShoppingBag, Banknote, RotateCcw, Printer, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/format'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface BackendPurchaseItem {
  id: number
  product_id: number
  product_name: string
  purchase_pack_name: string
  purchase_pack_qty: number
  purchase_quantity: number
  unit_cost: number
  total_cost: number
  base_unit_name?: string
}

interface BackendPurchase {
  id: number
  invoice_ref: string
  supplier_id: number
  supplier_name: string
  date: string
  subtotal: number
  total_amount: number
  amount_paid: number
  outstanding_balance: number
  payment_status: string
  status: string
  notes: string | null
  items: BackendPurchaseItem[]
  supplier: { id: number; name: string } | null
  created_by: string | null
  created_at: string
}

interface BackendReturn {
  id: number
  return_number: string
  total: number
  date: string
  items_count?: number
  original_purchase_id?: number
}

const paymentColors: Record<string, { label: string; cls: string }> = {
  paid: { label: 'Paid', cls: 'text-emerald-600 dark:text-emerald-400' },
  partial: { label: 'Partially Paid', cls: 'text-amber-600 dark:text-amber-400' },
  unpaid: { label: 'Unpaid', cls: 'text-red-600 dark:text-red-400' },
}

const statusCfg: Record<string, { label: string; cls: string }> = {
  received: { label: 'Received', cls: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
  pending: { label: 'Pending', cls: 'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400' },
}

export default function PurchaseDetailPage() {
  const { props } = usePage()
  const { purchase, returns } = props as { purchase: BackendPurchase; returns?: BackendReturn[] }
  const authUser = (props as any).auth?.user ?? null
  const isAdmin = authUser?.role === 'admin'
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  if (!purchase) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="flex flex-col items-center justify-center py-24 text-sm text-muted-foreground">
          <ShoppingBag className="size-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-1">Purchase not found</h2>
          <p className="mb-4">This transaction doesn't exist.</p>
          <Button variant="outline" onClick={() => router.visit('/purchases')}>Back to Purchases</Button>
        </div>
      </div>
    )
  }

  const pCfg = paymentColors[purchase.payment_status] || paymentColors.paid
  const sCfg = statusCfg[purchase.status] || statusCfg.received
  const toggleItems = (id: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <>
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => router.visit('/purchases')} className="gap-1.5 -ml-2">
        <ArrowLeft className="size-3.5" />
        Back to Purchases
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-amber-600" />
            <h1 className="text-xl font-semibold tracking-tight">{purchase.supplier_name}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{purchase.invoice_ref}</code>
            {' · '}{formatDate(purchase.date)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.visit(`/purchases/${purchase.id}/print`)} className="gap-1.5">
            <Printer className="size-3.5" /> Print
          </Button>
          <span className={cn('text-xs font-medium px-2 py-1 rounded-lg', sCfg.cls)}>{sCfg.label}</span>
          <span className={cn('text-xs font-medium', pCfg.cls)}>{pCfg.label}</span>
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(true)} className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-800">
              <Trash2 className="size-3.5" /> Delete
            </Button>
          )}
        </div>
      </div>

      {/* Supplier info + Payment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Supplier</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{purchase.supplier_name}</p>
            {purchase.supplier && (
              <Link href={`/contacts/${purchase.supplier_id}`} className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1">
                View Contact <ArrowLeft className="size-3 rotate-180" />
              </Link>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Payment</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{formatCurrency(purchase.amount_paid)} paid</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {purchase.outstanding_balance > 0 ? `Outstanding: ${formatCurrency(purchase.outstanding_balance)}` : 'Fully paid'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Totals</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm font-bold">{formatCurrency(purchase.total_amount)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Subtotal: {formatCurrency(purchase.subtotal)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-sm">Items ({purchase.items?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {(!purchase.items || purchase.items.length === 0) ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No items in this purchase.</p>
          ) : (
            <div className="divide-y divide-border">
              {purchase.items.map((item) => {
                const totalQty = item.purchase_pack_qty * item.purchase_quantity
                const unitName = item.purchase_pack_name || item.base_unit_name || 'units'
                return (
                  <div key={item.id} className="py-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <span className="tabular-nums">{item.purchase_quantity}</span>
                          <span className="mx-1">×</span>
                          <span className="font-medium">{unitName}</span>
                          <span className="mx-1.5 text-muted-foreground/30">@</span>
                          <span className="tabular-nums">{formatCurrency(item.unit_cost)}</span>
                          {item.purchase_pack_qty > 1 && (
                            <span className="text-muted-foreground/50 ml-1">({item.purchase_pack_qty} base/{unitName})</span>
                          )}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-sm font-semibold tabular-nums">{formatCurrency(item.total_cost)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
              {/* Totals row */}
              <div className="py-3 flex items-center justify-between font-medium">
                <span>Subtotal</span>
                <span>{formatCurrency(purchase.subtotal)}</span>
              </div>
              <div className="py-3 flex items-center justify-between font-bold text-base">
                <span>Total</span>
                <span>{formatCurrency(purchase.total_amount)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Returns */}
      {returns && returns.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <RotateCcw className="size-4 text-orange-500" />
              Returns ({returns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {returns.map((ret) => (
                <div key={ret.id} className="flex items-center justify-between py-2">
                  <Link href={`/purchases/returns/${ret.id}`} className="text-sm font-medium text-primary hover:underline">
                    {ret.return_number}
                  </Link>
                  <span className="text-sm">{formatCurrency(ret.total)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {purchase.notes && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm">{purchase.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>

    {/* ── Delete Purchase Dialog ── */}
    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <DialogContent className="sm:max-w-md gap-0 p-0">
        <DialogHeader className="p-5 pb-0">
          <DialogTitle className="text-base text-red-600 flex items-center gap-2">
            <Trash2 className="size-4" />
            Delete Purchase
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-1">
            This will reverse inventory, adjust supplier balance, and move the bill to the Recycle Bin. This action can be undone by restoring from the Recycle Bin.
          </DialogDescription>
        </DialogHeader>
        <div className="p-5 space-y-4">
          <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 text-sm">
            <p className="font-medium text-red-700 dark:text-red-400">Impact preview:</p>
            <ul className="mt-1.5 text-xs text-red-600 dark:text-red-300 space-y-0.5">
              <li>• Inventory reduced ({purchase.items?.length || 0} items)</li>
              <li>• Supplier balance reduced by {formatCurrency(purchase.total_amount)}</li>
              <li>• Bill {purchase.invoice_ref} moved to Recycle Bin</li>
            </ul>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Reason for deletion</label>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="e.g. Supplier returned, duplicate entry..."
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring resize-none"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => { setShowDeleteDialog(false); setDeleteReason('') }}
              className="flex-1"
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleting(true)
                const reason = deleteReason.trim() || 'No reason provided'
                router.delete(`/purchases/${purchase.id}`, {
                  data: { reason },
                  onSuccess: () => {
                    toast.success(`Purchase ${purchase.invoice_ref} deleted. Inventory reversed.`)
                    router.visit('/purchases', { preserveState: false })
                  },
                  onError: (errs) => {
                    const first = Object.values(errs)[0]
                    toast.error(String(first || 'Failed to delete purchase'))
                    setDeleting(false)
                    setShowDeleteDialog(false)
                  },
                  onFinish: () => {
                    setDeleting(false)
                  },
                })
              }}
              className="flex-1 gap-1.5"
              disabled={deleting}
            >
              <Trash2 className="size-3.5" />
              {deleting ? 'Deleting...' : 'Delete Purchase'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
