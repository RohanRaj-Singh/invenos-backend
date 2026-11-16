import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Calculator,
  Loader2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import ComponentPicker from './ComponentPicker'
import {
  compositionErrorMessage,
  createComposition,
  fetchComponentUnits,
  previewComposition,
  updateComposition,
} from './api'
import type {
  CompositionComponentSummary,
  CompositionCostPreview,
  CompositionKind,
  CompositionPayload,
  CompositionPayloadItem,
  CompositionUnitOption,
  ComponentSearchResult,
  ProductComposition,
} from './types'

interface ProductInfo {
  id: number
  name: string
  base_unit_id: string
  base_unit_name?: string
}

interface CompositionBuilderProps {
  open: boolean
  product: ProductInfo
  initial: ProductComposition | null
  onClose: () => void
  onSaved: (composition: ProductComposition) => void
  /** Only users who may see cost get the live estimate. */
  canViewCost?: boolean
}

interface BuilderRow {
  key: string
  component: CompositionComponentSummary
  quantity: string
  unitId: string
  unitOptions: CompositionUnitOption[]
  wastage: string
  isOptional: boolean
}

function rowKey(): string {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function baseQuantity(row: BuilderRow): number {
  const factor = row.unitOptions.find((unit) => unit.id === row.unitId)?.factor ?? 1
  const quantity = Number(row.quantity)
  return Number.isFinite(quantity) ? quantity * factor : 0
}

function componentToSummary(component: ComponentSearchResult): CompositionComponentSummary {
  return {
    id: component.id,
    name: component.name,
    sku: component.sku,
    barcode: component.barcode,
    base_unit_id: component.base_unit_id,
    base_unit_name: component.base_unit_name,
    stock_quantity: component.stock_quantity,
    status: component.status,
    unit_options: component.unit_options,
  }
}

export default function CompositionBuilder({
  open,
  product,
  initial,
  onClose,
  onSaved,
  canViewCost = true,
}: CompositionBuilderProps) {
  // Herbal formula templates are always ingredient-consumption formulas.
  // Assembly/manufacturing remains in the backend for other business types.
  const kind: CompositionKind = 'consumption'
  const [name, setName] = useState(initial?.name ?? '')
  const [outputQuantity, setOutputQuantity] = useState(String(initial?.output_quantity ?? 1))
  const [outputUnitId, setOutputUnitId] = useState(initial?.output_unit_id ?? product.base_unit_id)
  const [outputUnitOptions, setOutputUnitOptions] = useState<CompositionUnitOption[]>([])
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [rows, setRows] = useState<BuilderRow[]>(() => (initial?.items ?? []).map((item) => ({
    key: rowKey(),
    component: item.component ?? {
      id: item.component_product_id,
      name: 'Component',
      sku: '',
      barcode: null,
      base_unit_id: 'piece',
      base_unit_name: 'Piece',
    },
    quantity: String(item.display_quantity ?? item.quantity_base),
    unitId: item.display_unit_id,
    unitOptions: item.component?.unit_options ?? [{
      id: item.display_unit_id,
      label: item.display_unit_name,
      factor: item.quantity_base > 0 ? item.quantity_base / (item.display_quantity || item.quantity_base) : 1,
      is_base: true,
    }],
    wastage: String(item.wastage_pct ?? 0),
    isOptional: item.is_optional,
  })))
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [preview, setPreview] = useState<CompositionCostPreview | null>(null)
  const [error, setError] = useState<string | null>(null)

  const excludedIds = useMemo(() => rows.map((row) => row.component.id), [rows])
  const outputUnit = outputUnitOptions.find((unit) => unit.id === outputUnitId)

  const markDirty = () => {
    setDirty(true)
  }

  useEffect(() => {
    let active = true

    fetchComponentUnits(product.id)
      .then((response) => {
        if (!active) return
        setOutputUnitOptions(response.options)
        if (!response.options.some((option) => option.id === outputUnitId)) {
          setOutputUnitId(response.base_unit_id)
        }
      })
      .catch(() => {
        if (!active) return
        setOutputUnitOptions([{
          id: product.base_unit_id,
          label: product.base_unit_name ?? product.base_unit_id,
          factor: 1,
          is_base: true,
        }])
      })

    return () => {
      active = false
    }
  }, [product.id, product.base_unit_id, product.base_unit_name])

  useEffect(() => {
    if (!dirty) return

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  function addComponent(component: ComponentSearchResult) {
    const summary = componentToSummary(component)
    const unitOptions = summary.unit_options ?? [{
      id: summary.base_unit_id,
      label: summary.base_unit_name,
      factor: 1,
      is_base: true,
    }]

    setRows((current) => [
      ...current,
      {
        key: rowKey(),
        component: summary,
        quantity: '1',
        unitId: summary.base_unit_id,
        unitOptions,
        wastage: '0',
        isOptional: false,
      },
    ])
    markDirty()
  }

  function updateRow(key: string, patch: Partial<BuilderRow>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)))
    markDirty()
  }

  function removeRow(key: string) {
    setRows((current) => current.filter((row) => row.key !== key))
    markDirty()
  }

  function buildPayload(silent = false): CompositionPayload | null {
    const quantity = Number(outputQuantity)
    if (!Number.isFinite(quantity) || quantity <= 0) {
      if (!silent) setError('Output quantity must be greater than zero.')
      return null
    }

    if (rows.length === 0) {
      if (!silent) setError('Add at least one ingredient before saving.')
      return null
    }

    const items: CompositionPayloadItem[] = []
    for (const row of rows) {
      const rowQuantity = Number(row.quantity)
      if (!Number.isFinite(rowQuantity) || rowQuantity <= 0) {
        if (!silent) setError(`Enter a valid quantity for ${row.component.name}.`)
        return null
      }

      const wastage = Number(row.wastage)
      if (!Number.isFinite(wastage) || wastage < 0 || wastage > 100) {
        if (!silent) setError(`Wastage for ${row.component.name} must be between 0 and 100.`)
        return null
      }

      items.push({
        component_product_id: row.component.id,
        quantity: rowQuantity,
        unit_id: row.unitId,
        wastage_pct: wastage,
        is_optional: false,
        sort_order: items.length,
      })
    }

    return {
      kind,
      name: name.trim() || null,
      output_quantity: quantity,
      output_unit_id: outputUnitId || product.base_unit_id,
      notes: notes.trim() || null,
      items,
    }
  }

  // Live cost: refresh as soon as the formula changes. Ingredient lines show
  // their own cost, so making the user press "Preview cost" first only produced
  // a screen full of "Cost unavailable" for a formula that was perfectly costable.
  const previewSignature = useMemo(() => JSON.stringify({
    rows: rows.map((row) => [row.component.id, row.quantity, row.unitId, row.wastage]),
    quantity: outputQuantity,
    unit: outputUnitId,
  }), [rows, outputQuantity, outputUnitId])

  const previewRequestId = useRef(0)

  useEffect(() => {
    if (!canViewCost) {
      previewRequestId.current += 1
      setPreview(null)
      setPreviewing(false)

      return
    }

    const requestId = previewRequestId.current + 1
    previewRequestId.current = requestId

    const timer = setTimeout(() => {
      // Silent: a half-typed quantity must not surface a validation error.
      const payload = buildPayload(true)
      if (!payload) return

      setPreviewing(true)
      previewComposition(product.id, payload)
        .then((result) => {
          if (previewRequestId.current !== requestId) return
          setPreview(result)
        })
        .catch(() => {
          if (previewRequestId.current !== requestId) return
          setPreview(null)
        })
        .finally(() => {
          if (previewRequestId.current === requestId) setPreviewing(false)
        })
    }, 450)

    return () => clearTimeout(timer)
  }, [previewSignature, canViewCost, product.id])

  async function handleSave() {
    setError(null)
    const payload = buildPayload()
    if (!payload) return

    setSaving(true)
    try {
      const saved = initial
        ? await updateComposition(product.id, initial.id, payload)
        : await createComposition(product.id, payload)

      toast.success(initial ? `Formula version ${saved.version} saved` : 'Formula saved')
      setDirty(false)
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(compositionErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  function requestClose(next: boolean) {
    if (next) return
    if (dirty && !window.confirm('Discard unsaved formula changes?')) return
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={requestClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader className="border-b border-border">
          <SheetTitle>{initial ? 'Edit formula' : 'New formula'}</SheetTitle>
          <SheetDescription>
            {product.name} · define the ingredients and default quantities for one formula sale.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <span className="text-xs font-medium">Formula type</span>
              <div className="flex h-10 items-center rounded-lg border border-border bg-muted/30 px-3 text-sm text-muted-foreground">
                Ingredient formula
              </div>
              <p className="text-[10px] text-muted-foreground">
                Saving this formula does not create stock or a production order.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="composition-name" className="text-xs font-medium">Formula label (optional)</label>
              <Input
                id="composition-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  markDirty()
                }}
                placeholder="e.g. Signature treatment"
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="output-quantity" className="text-xs font-medium">Yield per formula</label>
              <Input
                id="output-quantity"
                type="number"
                min="0.000001"
                step="any"
                value={outputQuantity}
                onChange={(event) => {
                  setOutputQuantity(event.target.value)
                  markDirty()
                }}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="output-unit" className="text-xs font-medium">Yield unit</label>
              <select
                id="output-unit"
                value={outputUnitId}
                onChange={(event) => {
                  setOutputUnitId(event.target.value)
                  markDirty()
                }}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring"
              >
                {(outputUnitOptions.length > 0 ? outputUnitOptions : [{
                  id: product.base_unit_id,
                  label: product.base_unit_name ?? product.base_unit_id,
                  factor: 1,
                  is_base: true,
                }]).map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Ingredients</h3>
              <span className="text-xs text-muted-foreground">
                {rows.length} ingredient{rows.length === 1 ? '' : 's'}
              </span>
            </div>

            {rows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                <Plus className="mx-auto mb-2 size-5 opacity-50" />
                Add the first ingredient below.
              </div>
            ) : (
              <div className="space-y-2">
                {rows.map((row) => {
                  const cost = preview?.items.find(
                    (item) => item.component_product_id === row.component.id,
                  )
                  const base = baseQuantity(row)
                  const unit = row.unitOptions.find((option) => option.id === row.unitId)

                  return (
                    <div key={row.key} className="rounded-xl border border-border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="truncate text-sm font-medium">{row.component.name}</span>
                            {row.component.archived && <Badge variant="outline">Archived</Badge>}
                            {cost?.nested && <Badge variant="secondary">Nested</Badge>}
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                            {row.component.sku || 'No SKU'} · {row.component.base_unit_name}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeRow(row.key)}
                          aria-label={`Remove ${row.component.name}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-muted-foreground" htmlFor={`qty-${row.key}`}>Quantity</label>
                          <Input
                            id={`qty-${row.key}`}
                            type="number"
                            min="0.000001"
                            step="any"
                            value={row.quantity}
                            onChange={(event) => updateRow(row.key, { quantity: event.target.value })}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-muted-foreground" htmlFor={`unit-${row.key}`}>Unit</label>
                          <select
                            id={`unit-${row.key}`}
                            value={row.unitId}
                            onChange={(event) => updateRow(row.key, { unitId: event.target.value })}
                            className="h-9 w-full rounded-lg border border-input bg-background px-2 text-xs outline-none focus:border-ring"
                          >
                            {row.unitOptions.map((option) => (
                              <option key={option.id} value={option.id}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-muted-foreground" htmlFor={`waste-${row.key}`}>Wastage %</label>
                          <Input
                            id={`waste-${row.key}`}
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={row.wastage}
                            onChange={(event) => updateRow(row.key, { wastage: event.target.value })}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="block text-[11px] font-medium text-muted-foreground">Base quantity</span>
                          <div className="flex h-9 items-center rounded-lg border border-border bg-muted/30 px-2 text-xs tabular-nums">
                            {Number(base.toFixed(6))} {row.component.base_unit_name}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span className="text-muted-foreground">
                          {unit ? `${row.quantity || 0} ${unit.label} × ${unit.factor} = ${Number(base.toFixed(6))} ${row.component.base_unit_name}` : ''}
                        </span>
                        <span className={cn('font-medium', preview && cost?.line_cost != null ? 'text-foreground' : 'text-muted-foreground')}>
                          {preview == null
                            ? (previewing ? 'Calculating…' : '—')
                            : cost?.line_cost == null
                              ? 'Cost unavailable'
                              : `Estimated ${formatCurrency(cost.line_cost)}`}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <ComponentPicker
              excludeProductId={product.id}
              excludedComponentIds={excludedIds}
              onSelect={addComponent}
              disabled={saving}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="composition-notes" className="text-xs font-medium">Notes (optional)</label>
            <textarea
              id="composition-notes"
              rows={2}
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value)
                markDirty()
              }}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              placeholder="Preparation notes, yield assumptions, etc."
            />
          </div>

          {canViewCost && previewing && !preview && (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Calculating cost…
            </div>
          )}

          {canViewCost && preview && (
            <div className="rounded-xl border border-border bg-muted/20 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">Estimated cost</span>
                <Badge variant={preview.complete ? 'secondary' : 'destructive'}>
                  {preview.complete ? preview.cost_basis : 'Incomplete'}
                </Badge>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-muted-foreground">Per output unit</div>
                  <div className="text-base font-semibold tabular-nums">
                    {preview.unit_cost == null ? '—' : formatCurrency(preview.unit_cost)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total for {outputQuantity || 0} {outputUnit?.label ?? ''}</div>
                  <div className="text-base font-semibold tabular-nums">
                    {preview.total_cost == null ? '—' : formatCurrency(preview.total_cost)}
                  </div>
                </div>
              </div>
              {!preview.complete && (
                <p className="mt-2 text-[11px] text-amber-600">
                  Some components have no reliable cost yet. The estimate is incomplete.
                </p>
              )}

              {/* Pricing guidance — server-computed, never applied automatically */}
              {preview.pricing && (
                <div className="mt-3 space-y-1 border-t border-border pt-2.5 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Target margin</span>
                    <span className="tabular-nums font-medium">
                      {Number(preview.pricing.target_margin_percent.toFixed(2)).toLocaleString()}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Recommended price</span>
                    <span className="tabular-nums text-sm font-semibold">
                      {preview.pricing.recommended_price == null
                        ? 'Not available'
                        : formatCurrency(preview.pricing.recommended_price)}
                    </span>
                  </div>
                  {!preview.pricing.available && (
                    <p className="text-[11px] text-amber-600">
                      A recommendation needs a complete ingredient cost.
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Guidance only — the selling price is set on the product and is not changed here.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <SheetFooter className="border-t border-border">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              {previewing ? <Loader2 className="size-3.5 animate-spin" /> : <Calculator className="size-3.5" />}
              {canViewCost
                ? (previewing ? 'Calculating cost…' : 'Cost updates automatically')
                : 'Save the formula to continue'}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => requestClose(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {saving ? 'Saving...' : 'Save formula'}
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
