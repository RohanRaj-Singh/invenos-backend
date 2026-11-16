import { useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import { ArrowLeft, Factory, Play, RotateCcw, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  reversed: 'bg-amber-50 text-amber-700 border-amber-200',
}

function uuid() {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export default function ProductionDetail() {
  const { props } = usePage()
  const order: any = (props as any).order
  const canManage = Boolean((props as any).canManage)
  const run = order?.composition_run
  const items = run?.items || order?.composition?.items || []
  const [actualQuantity, setActualQuantity] = useState(String(order?.planned_quantity ?? ''))
  const [draftQuantity, setDraftQuantity] = useState(String(order?.planned_quantity ?? ''))
  const [draftLocation, setDraftLocation] = useState(order?.location || '')
  const [draftNotes, setDraftNotes] = useState(order?.notes || '')
  const [pending, setPending] = useState(false)

  if (!order) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Production order not found.</div>
  }

  function action(path: string, data: Record<string, any> = {}) {
    setPending(true)
    router.post(path, data, { onFinish: () => setPending(false), preserveScroll: true })
  }

  function execute() {
    const quantity = Number(actualQuantity)
    if (!Number.isFinite(quantity) || quantity <= 0) return
    action(`/production/${order.id}/execute`, {
      actual_output_quantity: quantity,
      output_unit_id: order.output_unit_id,
      location: order.location,
      idempotency_key: uuid(),
    })
  }

  function reverse() {
    if (!window.confirm('Reverse this production? Finished goods will be removed from stock. Components are not restored automatically.')) return
    action(`/production/${order.id}/reverse`, { idempotency_key: uuid() })
  }

  function updateDraft() {
    setPending(true)
    router.put(`/production/${order.id}`, {
      planned_quantity: Number(draftQuantity),
      location: draftLocation || null,
      notes: draftNotes || null,
    }, { onFinish: () => setPending(false), preserveScroll: true })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => router.visit('/production')} className="gap-1.5 -ml-2"><ArrowLeft className="size-4" /> Manufacturing</Button>
        <div className="flex items-center gap-2">
          <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize', STATUS_STYLE[order.status] || STATUS_STYLE.draft)}>{String(order.status).replace('_', ' ')}</span>
          {canManage && order.status === 'draft' && <Button size="sm" onClick={() => action(`/production/${order.id}/start`)} disabled={pending} className="gap-1.5"><Play className="size-3.5" /> Start</Button>}
          {canManage && (order.status === 'draft' || order.status === 'in_progress') && <Button size="sm" variant="outline" onClick={() => action(`/production/${order.id}/cancel`)} disabled={pending} className="gap-1.5"><XCircle className="size-3.5" /> Cancel</Button>}
          {canManage && order.status === 'completed' && <Button size="sm" variant="outline" onClick={reverse} disabled={pending} className="gap-1.5"><RotateCcw className="size-3.5" /> Reverse</Button>}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2"><Factory className="size-5 text-primary" /><h1 className="text-xl font-bold tracking-tight">{order.production_number}</h1></div>
        <p className="text-sm text-muted-foreground mt-1">{order.product?.name} · formula v{order.composition_version} · {order.location || 'No location'}</p>
      </div>

      {!order.cost_complete && (order.status === 'completed' || order.status === 'reversed') && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800">
          Production cost is incomplete. Finished goods were received as uncosted stock; the known cost is shown for reference but no complete unit cost was forced into inventory value.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Planned', `${Number(order.planned_quantity).toLocaleString()} ${order.output_unit_id}`],
          ['Produced', order.actual_output_quantity == null ? '—' : `${Number(order.actual_output_quantity).toLocaleString()} ${order.output_unit_id}`],
          ['Production cost', order.total_cost == null ? '—' : formatCurrency(order.total_cost)],
          ['Finished unit cost', order.unit_cost == null ? '—' : formatCurrency(order.unit_cost)],
        ].map(([label, value]) => (
          <Card key={label}><CardContent className="p-4"><div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div><div className="text-lg font-bold mt-1 tabular-nums">{value}</div></CardContent></Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader><CardTitle className="text-sm">Components</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Component</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">Consumed</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">Wastage</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">Cost</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Basis</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No components.</td></tr> : items.map((item: any) => {
                    const actual = Number(item.actual_quantity ?? item.quantity_base ?? 0)
                    const template = Number(item.template_quantity ?? item.quantity_base ?? 0)
                    return (
                      <tr key={item.id} className="border-b border-border/60 last:border-0">
                        <td className="px-4 py-2.5"><div className="font-medium">{item.component_name || item.component?.name || 'Component'}</div><div className="text-[10px] text-muted-foreground">{item.component_sku || item.component?.sku || '—'}</div></td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{actual.toLocaleString()} {item.unit || item.component?.base_unit_id || ''}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{Math.max(0, actual - template).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{item.total_cost == null ? 'Incomplete' : formatCurrency(item.total_cost)}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{item.cost_basis || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Execution</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{formatDateTime(order.created_at)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Started</span><span>{order.started_at ? formatDateTime(order.started_at) : '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Completed</span><span>{order.completed_at ? formatDateTime(order.completed_at) : '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Run</span><span className="font-mono text-xs">{run?.run_number || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Finished movement</span><span className="font-mono text-xs">{order.finished_inventory_transaction_id || '—'}</span></div>
            {order.reversal_inventory_transaction_id && <div className="flex justify-between"><span className="text-muted-foreground">Reversal movement</span><span className="font-mono text-xs">{order.reversal_inventory_transaction_id}</span></div>}

            {canManage && (order.status === 'draft' || order.status === 'in_progress') && (
              <div className="space-y-2 rounded-lg border border-border p-3">
                <label className="block text-xs font-medium">Actual output quantity
                  <input type="number" min="0.000001" step="any" value={actualQuantity} onChange={(e) => setActualQuantity(e.target.value)} className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-2 text-sm" />
                </label>
                <Button onClick={execute} disabled={pending} className="w-full">Complete production</Button>
                <p className="text-[10px] text-muted-foreground">Components are consumed at the actual output scale and finished goods are received in stock.</p>
              </div>
            )}

            {canManage && order.status === 'draft' && (
              <div className="space-y-2 rounded-lg border border-border p-3">
                <div className="text-xs font-semibold">Update draft</div>
                <input type="number" min="0.000001" step="any" value={draftQuantity} onChange={(e) => setDraftQuantity(e.target.value)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs" />
                <input value={draftLocation} onChange={(e) => setDraftLocation(e.target.value)} placeholder="Location" className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs" />
                <textarea value={draftNotes} onChange={(e) => setDraftNotes(e.target.value)} rows={2} placeholder="Notes" className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-xs resize-none" />
                <Button size="sm" variant="outline" onClick={updateDraft} disabled={pending} className="w-full">Save draft</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {order.finished_inventory_transaction && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Finished-Goods Receipt</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {Number(order.finished_inventory_transaction.quantity).toLocaleString()} base units received at {order.finished_inventory_transaction.unit_cost == null ? 'incomplete cost' : formatCurrency(order.finished_inventory_transaction.unit_cost)} per unit.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
