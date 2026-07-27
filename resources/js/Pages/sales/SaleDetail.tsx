import { useState } from 'react'
import { usePermission } from '@/features/auth/PermissionGuard'
import { router, Link, usePage } from '@inertiajs/react'
import { ArrowLeft, Receipt, ExternalLink, Banknote, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

interface BackendSaleItem {
  id: number
  product_id: number
  product_name: string
  packaging_name: string
  packaging_quantity: number
  quantity: number
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

const sourceConfig: Record<string, { label: string; cls: string }> = {
  pos: { label: 'POS', cls: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
  clinic: { label: 'Clinic', cls: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' },
  manual: { label: 'Manual', cls: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
}

const payCfg: Record<string, { label: string; cls: string }> = {
  paid: { label: 'Paid', cls: 'text-emerald-600 dark:text-emerald-400' },
  partial: { label: 'Partially Paid', cls: 'text-amber-600 dark:text-amber-400' },
  unpaid: { label: 'Unpaid', cls: 'text-red-600 dark:text-red-400' },
}

export default function SaleDetailPage() {
  const { props } = usePage()
  const { sale } = props as { sale: BackendSale | null }
  const [showPayment, setShowPayment] = useState(false)
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

  const sCfg = sourceConfig[sale.source] || sourceConfig.pos
  const pCfg = payCfg[sale.payment_status] || payCfg.paid

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => router.visit('/sales')} className="gap-1.5 -ml-2">
        <ArrowLeft className="size-3.5" />
        Back to Sales
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="size-5 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight">{sale.customer_name || 'Walk-in Customer'}</h1>
            <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', sCfg.cls)}>{sCfg.label}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{sale.invoice_number}</code>
            {' · '}{sale.date}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canProcessReturn && (
            <Button variant="outline" size="sm" onClick={() => router.visit(`/returns/sale?ref=${sale.invoice_number}`)} className="gap-1.5">
              <RotateCcw className="size-3.5" />
              Return
            </Button>
          )}
        </div>
      </div>

      {/* Customer + Payment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Customer</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{sale.customer_name || 'Walk-in Customer'}</p>
            {sale.customer && (
              <Link href={`/contacts/${sale.customer_id}`} className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1">
                View Contact <ArrowLeft className="size-3 rotate-180" />
              </Link>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Payment</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className={cn('text-sm font-medium', pCfg.cls)}>{pCfg.label}</span>
              <Button variant="ghost" size="xs" onClick={() => setShowPayment(true)} className="text-xs gap-1">
                <Banknote className="size-3" />
                Record Payment
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(sale.amount_paid)} paid · {sale.outstanding_balance > 0 ? `Outstanding: ${formatCurrency(sale.outstanding_balance)}` : 'Settled'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Total</CardTitle></CardHeader>
          <CardContent>
            <p className="text-base font-bold">{formatCurrency(sale.grand_total)}</p>
            {sale.discount > 0 && <p className="text-xs text-muted-foreground">Discount: {formatCurrency(sale.discount)}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-sm">Items ({sale.items?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="divide-y divide-border">
            {sale.items?.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} × {item.packaging_name} ({item.packaging_quantity} units) @ {formatCurrency(item.unit_price)} each
                  </p>
                </div>
                <p className="text-sm font-semibold">{formatCurrency(item.total)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3 mt-3 space-y-1">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Discount</span>
                <span className="text-red-500">-{formatCurrency(sale.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-1 border-t border-border">
              <span>Total</span>
              <span>{formatCurrency(sale.grand_total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {sale.notes && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm">{sale.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
