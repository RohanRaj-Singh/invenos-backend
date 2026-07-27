import { useState, useMemo } from 'react'
import { router, Link, usePage } from '@inertiajs/react'
import { ArrowLeft, ShoppingBag, Banknote, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

interface BackendPurchaseItem {
  id: number
  product_id: number
  product_name: string
  purchase_pack_name: string
  purchase_pack_qty: number
  purchase_quantity: number
  unit_cost: number
  total_cost: number
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
            {' · '}{purchase.date}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-medium px-2 py-1 rounded-lg', sCfg.cls)}>{sCfg.label}</span>
          <span className={cn('text-xs font-medium', pCfg.cls)}>{pCfg.label}</span>
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
                return (
                  <div key={item.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.purchase_quantity} × {item.purchase_pack_name} ({item.purchase_pack_qty} units each) = {totalQty} units
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(item.total_cost)}</p>
                        <p className="text-[11px] text-muted-foreground">@{formatCurrency(item.unit_cost)}/{item.purchase_pack_name}</p>
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
  )
}
