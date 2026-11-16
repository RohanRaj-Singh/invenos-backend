import { useMemo, useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import { ArrowLeft, Factory } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface CompositionItem {
  id: number
  quantity_base: number
  display_unit_id: string | null
  wastage_pct: number
  component?: { name?: string; sku?: string; stock_quantity?: number; base_unit_id?: string }
}

interface Composition {
  id: number
  version: number
  output_unit_id: string
  output_quantity: number
  items: CompositionItem[]
}

interface ProductProp {
  id: number
  name: string
  sku: string
  base_unit_id: string
  location: string | null
  compositions: Composition[]
}

export default function ProductionCreate() {
  const { props } = usePage()
  const products: ProductProp[] = (props as any).products || []
  const locations: string[] = (props as any).locations || []
  const defaultDate = (props as any).default_date || new Date().toISOString().slice(0, 10)

  const [productId, setProductId] = useState(String(products[0]?.id || ''))
  const [compositionId, setCompositionId] = useState(String(products[0]?.compositions?.[0]?.id || ''))
  const [plannedQuantity, setPlannedQuantity] = useState('1')
  const [location, setLocation] = useState(products[0]?.location || '')
  const [plannedDate, setPlannedDate] = useState(defaultDate)
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const selectedProduct = products.find((p) => String(p.id) === productId)
  const selectedComposition = selectedProduct?.compositions.find((c) => String(c.id) === compositionId) || selectedProduct?.compositions?.[0]

  const items = useMemo(() => selectedComposition?.items || [], [selectedComposition])
  const plannedScale = useMemo(() => {
    const planned = Number(plannedQuantity)
    const output = Number(selectedComposition?.output_quantity ?? 1)
    if (!Number.isFinite(planned) || planned <= 0 || !Number.isFinite(output) || output <= 0) return 0

    return planned / output
  }, [plannedQuantity, selectedComposition])

  function chooseProduct(id: string) {
    setProductId(id)
    const product = products.find((p) => String(p.id) === id)
    setCompositionId(String(product?.compositions?.[0]?.id || ''))
    setLocation(product?.location || '')
  }

  function submit() {
    if (!selectedProduct || !selectedComposition) return
    setSaving(true)
    router.post('/production', {
      product_id: selectedProduct.id,
      composition_id: selectedComposition.id,
      planned_quantity: Number(plannedQuantity),
      output_unit_id: selectedComposition.output_unit_id,
      location: location || null,
      planned_date: plannedDate || null,
      reference: reference || null,
      notes: notes || null,
    }, {
      onError: () => setSaving(false),
      onFinish: () => setSaving(false),
    })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.visit('/production')} className="gap-1.5 -ml-2"><ArrowLeft className="size-4" /> Back</Button>
      </div>

      <div>
        <div className="flex items-center gap-2"><Factory className="size-5 text-primary" /><h1 className="text-xl font-bold tracking-tight">New Production Order</h1></div>
        <p className="text-sm text-muted-foreground mt-1">Draft orders do not move inventory. Materials are consumed only when production is executed.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader><CardTitle className="text-sm">Production Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <label className="block text-xs font-medium">Finished product
              <select value={productId} onChange={(e) => chooseProduct(e.target.value)} className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-2 text-sm">
                {products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.sku})</option>)}
              </select>
            </label>

            <label className="block text-xs font-medium">Assembly formula
              <select value={compositionId} onChange={(e) => setCompositionId(e.target.value)} className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-2 text-sm">
                {(selectedProduct?.compositions || []).map((composition) => (
                  <option key={composition.id} value={composition.id}>v{composition.version} · output {composition.output_quantity} {composition.output_unit_id}</option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-medium">Planned quantity
                <input type="number" min="0.000001" step="any" value={plannedQuantity} onChange={(e) => setPlannedQuantity(e.target.value)} className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-2 text-sm" />
              </label>
              <label className="block text-xs font-medium">Output unit
                <input value={selectedComposition?.output_unit_id || ''} readOnly className="mt-1 w-full h-9 rounded-lg border border-input bg-muted/40 px-2 text-sm" />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-medium">Planned date
                <input type="date" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-2 text-sm" />
              </label>
              <label className="block text-xs font-medium">Location
                <input list="production-locations" value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-2 text-sm" />
                <datalist id="production-locations">{locations.map((l) => <option key={l} value={l} />)}</datalist>
              </label>
            </div>

            <label className="block text-xs font-medium">Reference
              <input value={reference} onChange={(e) => setReference(e.target.value)} className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-2 text-sm" />
            </label>
            <label className="block text-xs font-medium">Notes
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-2 text-sm resize-none" />
            </label>

            <Button onClick={submit} disabled={saving || !selectedComposition} className="w-full">{saving ? 'Creating...' : 'Create draft order'}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Formula Preview</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {items.length === 0 ? <p className="text-sm text-muted-foreground">No components in this formula.</p> : items.map((item) => {
              const required = Number(item.quantity_base) * plannedScale * (1 + Number(item.wastage_pct || 0) / 100)
              const available = Number(item.component?.stock_quantity || 0)
              const unit = item.display_unit_id || item.component?.base_unit_id || ''
              const shortage = plannedScale > 0 && required > available

              return (
                <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-2.5">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{item.component?.name || 'Component'}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {item.component?.sku || '—'} · stock {available.toLocaleString()} {item.component?.base_unit_id || ''}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={cn('text-sm font-semibold tabular-nums', shortage && 'text-red-600')}>
                      {Number(required.toFixed(6)).toLocaleString()} {unit}
                    </div>
                    {item.wastage_pct > 0 && <div className="text-[10px] text-amber-600">+{item.wastage_pct}% wastage</div>}
                    {shortage && <div className="text-[10px] font-medium text-red-600">Short by {Number((required - available).toFixed(6))}</div>}
                  </div>
                </div>
              )
            })}
            <div className={cn('rounded-lg p-3 text-[11px] leading-relaxed', items.length ? 'bg-muted/40 text-muted-foreground' : 'bg-amber-50 text-amber-700')}>
              Quantities are estimated from the saved template, planned output and wastage. This is not a reservation; the server rechecks stock atomically at execution.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
