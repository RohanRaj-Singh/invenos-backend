import { router, Link, usePage } from '@inertiajs/react'
import { ArrowLeft, RotateCcw, ExternalLink, Receipt, Printer } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getSaleReturnByNumber } from '@/data/returns'
import { getSaleById } from '@/data/sales'
import { formatCurrency } from '@/data/dashboard'
import { cn } from '@/lib/utils'

const CONDITION_LABELS: Record<string, { label: string; cls: string }> = {
  resellable: { label: 'Resellable', cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
  damaged: { label: 'Damaged', cls: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' },
  expired: { label: 'Expired', cls: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
}

export default function SaleReturnDetailPage() {
  const { url, props } = usePage();
  const serverReturn = (props as { return?: ServerReturn }).return;

  // Rendered by ReturnWorkflowController@show for canonical (server) returns.
  if (serverReturn) {
    return <ServerReturnDetail ret={serverReturn} canProcess={Boolean((props as { canProcess?: boolean }).canProcess)} canViewCost={Boolean((props as { can_view_cost?: boolean }).can_view_cost)} />
  }

  const id = url.split('/').pop() || '';
  const returnData = getSaleReturnByNumber(id || '')

  if (!returnData) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="flex flex-col items-center justify-center py-24 text-sm text-muted-foreground">
          <RotateCcw className="size-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-1">Return Not Found</h2>
          <p className="mb-4">This return transaction doesn't exist.</p>
          <Link href="/sales/returns" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Back to Sale Returns</Link>
        </div>
      </div>
    )
  }

  const originalSale = returnData.originalSaleId ? getSaleById(returnData.originalSaleId) : null

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.visit('/sales/returns')} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          <span>Back to Sale Returns</span>
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
            <Printer className="size-3.5" />
            Print
          </button>
          {originalSale && (
            <Link href={`/sales/${returnData.originalSaleId}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
              <ExternalLink className="size-3.5" />
              View Original Sale
            </Link>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="size-12 sm:size-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center shrink-0">
          <RotateCcw className="size-6 sm:size-7 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{returnData.returnNumber}</h1>
            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 px-2 py-0 h-5 font-medium">Sale Return</Badge>
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
            <span className="font-medium text-foreground">{returnData.customerName}</span>
            <span>·</span>
            <span>{returnData.date}</span>
            <span>·</span>
            <span>{returnData.createdBy}</span>
          </div>
          {originalSale && (
            <div className="mt-1">
              <Link href={`/sales/${returnData.originalSaleId}`} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                <ExternalLink className="size-3" />
                Original: {returnData.originalInvoice}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Items Returned" value={`${returnData.items.length}`} />
        <StatCard label="Total Units" value={`${returnData.items.reduce((s, i) => s + i.returnedQty, 0)}`} />
        <StatCard label="Total Refund" value={formatCurrency(returnData.totalRefund)} bold />
        <StatCard label="Refund Method" value={returnData.refundMethod} positive />
      </div>

      {/* Original Invoice Card */}
      {originalSale && (
        <Card size="sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Receipt className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Original Sale:</span>
                <span className="font-medium">{returnData.originalInvoice}</span>
                <span className="text-muted-foreground">·</span>
                <span>{originalSale.date}</span>
                <span className="text-muted-foreground">·</span>
                <span>{formatCurrency(originalSale.grandTotal)}</span>
              </div>
              <Link
                href={`/sales/${returnData.originalSaleId}`}
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                View Sale <ExternalLink className="size-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Returned Items */}
      <Card>
        <CardHeader>
          <CardTitle>Returned Items ({returnData.items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="grid grid-cols-12 gap-3 px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-4">Product</div>
              <div className="col-span-2 text-center">Returned</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right">Refund</div>
              <div className="col-span-2 text-right">Condition</div>
            </div>
            {returnData.items.map((item) => (
              <div key={item.originalLineId} className="grid grid-cols-12 gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-sm">
                <div className="col-span-4 font-medium text-foreground truncate">{item.productName}</div>
                <div className="col-span-2 text-center text-muted-foreground">{item.returnedQty} {item.unitName}</div>
                <div className="col-span-2 text-right text-muted-foreground">{formatCurrency(item.refundAmount / Math.max(1, item.returnedQty))}</div>
                <div className="col-span-2 text-right font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(item.refundAmount)}</div>
                <div className="col-span-2 text-right">
                  <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-5', CONDITION_LABELS[item.condition]?.cls)}>
                    {CONDITION_LABELS[item.condition]?.label || item.condition}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex justify-between text-sm font-semibold px-3">
              <span>Total Refund</span>
              <span className="text-amber-600 dark:text-amber-400">{formatCurrency(returnData.totalRefund)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {originalSale && (
              <TimelineEntry
                icon={<Receipt className="size-4" />}
                title="Original Sale Created"
                description={`${returnData.originalInvoice} — ${formatCurrency(originalSale.grandTotal)}`}
                date={originalSale.date}
                active
              />
            )}
            <TimelineEntry
              icon={<RotateCcw className="size-4" />}
              title="Return Processed"
              description={`${returnData.returnNumber} — ${returnData.items.length} item${returnData.items.length !== 1 ? 's' : ''} returned · Refund ${formatCurrency(returnData.totalRefund)}`}
              date={returnData.date}
              active
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ label, value, bold, positive, negative }: { label: string; value: string; bold?: boolean; positive?: boolean; negative?: boolean }) {
  return (
    <Card size="sm">
      <CardContent className="p-4">
        <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
        <div className={cn(
          'text-lg tracking-tight',
          bold ? 'font-bold' : 'font-semibold',
          positive && 'text-emerald-600 dark:text-emerald-400',
          negative && 'text-red-600 dark:text-red-400',
        )}>
          {value}
        </div>
      </CardContent>
    </Card>
  )
}

function TimelineEntry({ icon, title, description, date, active }: {
  icon: React.ReactNode; title: string; description: string; date: string; active?: boolean
}) {
  return (
    <div className="flex gap-3">
      <div className={cn(
        'flex items-center justify-center size-8 rounded-lg shrink-0 mt-0.5',
        active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <div className="text-xs text-muted-foreground shrink-0">{date}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Canonical (server) sale return — commercial return and material
// restoration are displayed as separate facts.
// ─────────────────────────────────────────────────────────────

interface ServerReturnItem {
  id: number
  product_name: string | null
  packaging_name: string | null
  quantity: number
  base_quantity: number
  unit_price: number
  total: number
  restock: boolean
}

interface ServerRecovery {
  id: number
  component_name: string | null
  unit: string
  recovered_quantity: number
  wastage_quantity?: number | null
  unit_cost: number | null
  total_cost: number | null
  restored_at: string | null
  composition_run_id: number
}

interface ServerReturn {
  id: number
  return_number: string
  type: string
  status: string
  return_date: string
  subtotal: number
  grand_total: number
  refund_amount: number
  refund_method: string | null
  notes: string | null
  created_by: string | null
  reason_note: string | null
  reference_id: number
  items?: ServerReturnItem[]
  component_recoveries?: ServerRecovery[]
  contact?: { id: number; name: string } | null
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400',
  cancelled: 'bg-muted text-muted-foreground',
  reversed: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400',
}

function ServerReturnDetail({ ret, canProcess, canViewCost }: { ret: ServerReturn; canProcess: boolean; canViewCost: boolean }) {
  const items = ret.items ?? []
  const recoveries = ret.component_recoveries ?? []
  const restored = recoveries.filter((r) => r.restored_at !== null)
  const totalUnits = items.reduce((sum, i) => sum + (i.quantity ?? 0), 0)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={() => router.visit('/sales/returns')} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          <span>Back to Sale Returns</span>
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
            <Printer className="size-3.5" />
            Print
          </button>
          <Link href={`/sales/${ret.reference_id}`} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
            <ExternalLink className="size-3.5" />
            View Original Sale
          </Link>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="size-12 sm:size-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center shrink-0">
          <RotateCcw className="size-6 sm:size-7 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{ret.return_number}</h1>
            <Badge variant="outline" className={cn('text-[10px] px-2 py-0 h-5 font-medium capitalize', STATUS_STYLES[ret.status])}>
              {ret.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
            <span className="font-medium text-foreground">{ret.contact?.name ?? 'Walk-in Customer'}</span>
            <span>·</span>
            <span>{ret.return_date}</span>
            {ret.created_by && (<><span>·</span><span>{ret.created_by}</span></>)}
          </div>
          {ret.reason_note && <p className="text-xs text-muted-foreground mt-1">{ret.reason_note}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Items Returned" value={`${items.length}`} />
        <StatCard label="Total Units" value={`${totalUnits}`} />
        <StatCard label="Refund" value={formatCurrency(ret.refund_amount)} bold />
        <StatCard label="Materials Restored" value={`${restored.length}`} positive={restored.length > 0} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Returned Items ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="grid grid-cols-12 gap-3 px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-5">Product</div>
              <div className="col-span-2 text-center">Returned</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-3 text-right">Refund</div>
            </div>
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-sm">
                <div className="col-span-5 font-medium text-foreground truncate">{item.product_name}</div>
                <div className="col-span-2 text-center text-muted-foreground">{item.quantity} {item.packaging_name ?? 'units'}</div>
                <div className="col-span-2 text-right text-muted-foreground">{formatCurrency(item.unit_price)}</div>
                <div className="col-span-3 text-right font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(item.total)}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border space-y-1">
            <div className="flex justify-between text-sm px-3">
              <span className="text-muted-foreground">Credit note</span>
              <span>{formatCurrency(ret.grand_total)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold px-3">
              <span>Refund ({ret.refund_method ?? 'cash'})</span>
              <span className="text-amber-600 dark:text-amber-400">{formatCurrency(ret.refund_amount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Material Restoration</CardTitle>
        </CardHeader>
        <CardContent>
          {recoveries.length === 0 ? (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              No material was restored. A commercial refund never returns ingredients to inventory.
            </div>
          ) : (
            <div className="space-y-1">
              <div className="grid grid-cols-12 gap-3 px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <div className={canViewCost ? 'col-span-5' : 'col-span-7'}>Component</div>
                <div className="col-span-2 text-center">Recovered</div>
                {canViewCost && <div className="col-span-2 text-right">Cost</div>}
                <div className="col-span-3 text-right">Status</div>
              </div>
              {recoveries.map((recovery) => (
                <div key={recovery.id} className="grid grid-cols-12 gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-sm">
                  <div className={`${canViewCost ? 'col-span-5' : 'col-span-7'} font-medium text-foreground truncate`}>{recovery.component_name ?? 'Component'}</div>
                  <div className="col-span-2 text-center text-muted-foreground">{recovery.recovered_quantity} {recovery.unit}</div>
                  {canViewCost && (
                    <div className="col-span-2 text-right text-muted-foreground">
                      {recovery.total_cost == null ? '—' : formatCurrency(recovery.total_cost)}
                    </div>
                  )}
                  <div className="col-span-3 text-right">
                    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-5', recovery.restored_at ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-muted text-muted-foreground')}>
                      {recovery.restored_at ? 'Restored' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {canProcess && (
        <div className="flex items-center gap-2 justify-end">
          {ret.status === 'pending' && (
            <>
              <Button variant="outline" size="sm" onClick={() => router.post(`/returns/${ret.id}/cancel`)}>Cancel</Button>
              <Button size="sm" onClick={() => router.post(`/returns/${ret.id}/complete`)}>Complete Return</Button>
            </>
          )}
          {ret.status === 'completed' && (
            <Button variant="outline" size="sm" onClick={() => router.post(`/returns/${ret.id}/reverse`)}>Reverse Return</Button>
          )}
        </div>
      )}
    </div>
  )
}
