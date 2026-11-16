import { Link, router, usePage } from '@inertiajs/react'
import { Factory, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  reversed: 'bg-amber-50 text-amber-700 border-amber-200',
}

export default function ProductionList() {
  const { props } = usePage()
  const orders = (props as any).orders || []
  const meta = (props as any).meta || {}
  const filters = (props as any).filters || {}

  function applyFilters(next: Record<string, string>) {
    router.get('/production', { ...filters, ...next }, { preserveState: true, replace: true })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Factory className="size-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">Manufacturing</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Production orders, component consumption and finished-goods receipts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.visit('/reports/component-usage')}>Ingredient Usage</Button>
          <Button onClick={() => router.visit('/production/create')} className="gap-1.5"><Plus className="size-4" /> New Production Order</Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
        Manufacturing is a separate, admin-only capability retained for businesses that assemble
        physical goods. Selling a formula from POS does <span className="font-medium text-foreground">not</span> require
        a production order. Formulas are managed from the Formula tab on a product.
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            defaultValue={filters.search || ''}
            placeholder="Search production number or reference..."
            className="h-9 w-72 rounded-lg border border-input bg-background pl-8 pr-3 text-sm outline-none focus:border-ring"
            onKeyDown={(event) => {
              if (event.key === 'Enter') applyFilters({ search: (event.target as HTMLInputElement).value })
            }}
          />
        </div>
        <select
          value={filters.status || ''}
          onChange={(event) => applyFilters({ status: event.target.value })}
          className="h-9 rounded-lg border border-input bg-background px-2 text-sm outline-none focus:border-ring"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="reversed">Reversed</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Order</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Product</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Planned</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Produced</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Cost</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No production orders yet.</td></tr>
              ) : orders.map((order: any) => (
                <tr key={order.id} className="border-b border-border/60 last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <Link href={`/production/${order.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">{order.production_number}</Link>
                    {order.reference && <div className="text-[10px] text-muted-foreground mt-0.5">{order.reference}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{order.product?.name || '—'}</div>
                    <div className="text-[10px] text-muted-foreground">v{order.composition_version} formula</div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{Number(order.planned_quantity).toLocaleString()} {order.output_unit_id}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{order.actual_output_quantity == null ? '—' : `${Number(order.actual_output_quantity).toLocaleString()} ${order.output_unit_id}`}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {order.total_cost == null ? '—' : formatCurrency(order.total_cost)}
                    {order.status === 'completed' && order.cost_complete === false && <div className="text-[10px] text-amber-600">incomplete</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize', STATUS_STYLE[order.status] || STATUS_STYLE.draft)}>
                      {String(order.status).replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(order.completed_at || order.planned_date || order.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {meta.last_page > 1 && (
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          Page {meta.current_page} of {meta.last_page}
        </div>
      )}
    </div>
  )
}
