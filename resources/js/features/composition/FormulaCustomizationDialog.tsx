import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, FlaskConical, Loader2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { fetchActiveComposition, fetchProfitabilityPreview } from './api'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import type { FormulaProfitability } from './types'
import type { FormulaDetailLine, FormulaOverride } from '@/types'

interface FormulaProductInfo {
  id: number
  name: string
}

interface FormulaInitialCustomization {
  compositionId?: number
  version?: number
  overrides?: FormulaOverride[]
  optionalItemIds?: number[]
  details?: FormulaDetailLine[]
}

export interface FormulaCustomizationResult {
  compositionId: number
  version: number
  overrides: FormulaOverride[]
  optionalItemIds: number[]
  details: FormulaDetailLine[]
  /** Cost of one formula at the confirmed quantities, when known. */
  estimatedCostPerFormulaUnit?: number | null
}

interface FormulaCustomizationDialogProps {
  open: boolean
  product: FormulaProductInfo
  initial?: FormulaInitialCustomization | null
  onClose: () => void
  onConfirm: (customization: FormulaCustomizationResult) => void
  /** Server-decided cost permission; the preview is skipped entirely without it. */
  canViewCost?: boolean
  /** Commercial context, used only for the profitability preview. */
  quantity?: number
  sellingUnitId?: number | null
  unitPrice?: number | null
  discountPercent?: number
}

interface FormulaRow {
  compositionItemId: number
  componentProductId: number | null
  name: string
  unit: string
  defaultQuantity: number
  actual: string
  optional: boolean
  /** Current stock on hand for this ingredient, in `unit`. */
  availableStock: number | null
  /** Whether this ingredient may go negative, per the server policy. */
  allowsNegativeStock: boolean
}

export default function FormulaCustomizationDialog({
  open,
  product,
  initial,
  onClose,
  onConfirm,
  canViewCost = false,
  quantity = 1,
  sellingUnitId = null,
  unitPrice = null,
  discountPercent = 0,
}: FormulaCustomizationDialogProps) {
  const [rows, setRows] = useState<FormulaRow[]>([])
  const [compositionId, setCompositionId] = useState<number | null>(initial?.compositionId ?? null)
  const [version, setVersion] = useState<number>(initial?.version ?? 0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formulaName, setFormulaName] = useState(product.name)

  // ── Profitability preview (informational, cost permission only) ──
  const [profitability, setProfitability] = useState<FormulaProfitability | null>(null)
  const [profitLoading, setProfitLoading] = useState(false)
  const [profitError, setProfitError] = useState<string | null>(null)
  const previewRequest = useRef(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const composition = await fetchActiveComposition(product.id, 'consumption')

      if (!composition || composition.items.length === 0) {
        setRows([])
        setError('This product has no active formula. Add ingredients on the product page first.')
        return
      }

      setCompositionId(composition.id)
      setVersion(composition.version)
      setFormulaName(composition.name || product.name)

      const previous = new Map((initial?.overrides ?? []).map((override) => [
        override.composition_item_id,
        override.quantity,
      ]))

      setRows(composition.items.map((item) => {
        const unit = item.display_unit_id || item.component?.base_unit_id || 'piece'
        const defaultQuantity = Number(item.display_quantity || item.quantity_base || 0)
        const prior = previous.get(item.id)

        return {
          compositionItemId: item.id,
          componentProductId: item.component_product_id ?? null,
          name: item.component?.name || `Ingredient #${item.component_product_id}`,
          unit,
          defaultQuantity,
          actual: String(prior ?? defaultQuantity),
          optional: item.is_optional,
          availableStock: item.display_stock_quantity ?? item.component?.stock_quantity ?? null,
          allowsNegativeStock: Boolean(item.component?.allows_negative_stock),
        }
      }))
    } catch {
      setError('Could not load the formula. Check the connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [product.id, product.name, initial?.overrides])

  useEffect(() => {
    if (open) void load()
  }, [open, load])

  // Key the request on the actual quantities so re-renders do not refetch.
  const previewKey = useMemo(() => rows
    .map((row) => `${row.compositionItemId}:${row.actual}`)
    .join('|'), [rows])

  useEffect(() => {
    if (!open || !canViewCost || !compositionId || rows.length === 0) {
      setProfitability(null)
      setProfitLoading(false)
      return
    }

    const overrides = rows
      .map((row) => ({ composition_item_id: row.compositionItemId, quantity: Number(row.actual), unit_id: row.unit }))

    // An invalid row is already reported by the form; do not fire a doomed request.
    if (overrides.some((row) => !Number.isFinite(row.quantity) || row.quantity <= 0)) {
      setProfitability(null)
      return
    }

    const requestId = ++previewRequest.current

    const timer = setTimeout(async () => {
      setProfitLoading(true)
      try {
        const result = await fetchProfitabilityPreview(product.id, {
          composition_id: compositionId,
          quantity,
          selling_unit_id: sellingUnitId,
          unit_price: unitPrice,
          discount_percent: discountPercent,
          overrides,
          optional_item_ids: rows.filter((row) => row.optional).map((row) => row.compositionItemId),
        })

        // Ignore replies that lost the race.
        if (previewRequest.current !== requestId) return
        setProfitability(result)
        setProfitError(null)
      } catch {
        if (previewRequest.current !== requestId) return
        setProfitability(null)
        setProfitError('Profitability preview unavailable.')
      } finally {
        if (previewRequest.current === requestId) setProfitLoading(false)
      }
    }, 350)

    return () => clearTimeout(timer)
    // previewKey stands in for rows so typing does not refetch on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, canViewCost, compositionId, previewKey, quantity, sellingUnitId, unitPrice, discountPercent, product.id])

  const totalLines = useMemo(
    () => rows.filter((row) => Number(row.actual) > 0).length,
    [rows],
  )

  function restoreDefaults() {
    setRows((current) => current.map((row) => ({ ...row, actual: String(row.defaultQuantity) })))
    setError(null)
  }

  function confirm() {
    if (!compositionId) {
      setError('No active formula is available.')
      return
    }

    if (rows.length === 0) {
      setError('This formula has no ingredients.')
      return
    }

    const overrides: FormulaOverride[] = []
    const details: FormulaDetailLine[] = []

    for (const row of rows) {
      const quantity = Number(row.actual)
      if (!Number.isFinite(quantity) || quantity <= 0) {
        setError(`Enter a quantity greater than zero for ${row.name}.`)
        return
      }

      overrides.push({
        composition_item_id: row.compositionItemId,
        quantity: Number(quantity.toFixed(6)),
        unit_id: row.unit,
      })

      details.push({
        composition_item_id: row.compositionItemId,
        name: row.name,
        unit: row.unit,
        default_quantity: row.defaultQuantity,
        actual_quantity: Number(quantity.toFixed(6)),
        optional: row.optional,
        available_stock: row.availableStock,
        allows_negative_stock: row.allowsNegativeStock,
      })
    }

    onConfirm({
      compositionId,
      version,
      overrides,
      optionalItemIds: rows.filter((row) => row.optional).map((row) => row.compositionItemId),
      details,
      // Reused by the cart summary; null when the preview is unavailable.
      estimatedCostPerFormulaUnit: profitability?.cost_per_formula_unit ?? null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent className="sm:max-w-lg gap-0 p-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="p-5 pb-3 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="size-4 text-primary" /> Customize {formulaName}
          </DialogTitle>
          <DialogDescription>
            Ingredient identities come from the saved formula. Adjust the quantity per formula;
            the saved template is never changed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading formula...
            </div>
          ) : error ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => void load()}>
                Retry
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {totalLines} of {rows.length} ingredients have a quantity.
                </p>
                <Button type="button" variant="ghost" size="sm" onClick={restoreDefaults} className="gap-1.5">
                  <RotateCcw className="size-3.5" /> Restore defaults
                </Button>
              </div>

              <div className="overflow-hidden rounded-xl border border-border">
                <div className="grid grid-cols-12 gap-2 border-b border-border bg-muted/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span className="col-span-5">Ingredient</span>
                  <span className="col-span-2 text-right">Default</span>
                  <span className="col-span-3 text-right">Per formula</span>
                  <span className="col-span-2 text-right">Unit</span>
                </div>
                <div className="divide-y divide-border">
                  {rows.map((row) => (
                    <div key={row.compositionItemId} className="grid grid-cols-12 items-center gap-2 px-3 py-2">
                      <div className="col-span-5 min-w-0">
                        <div className="truncate text-xs font-medium">{row.name}</div>
                        {row.optional && <div className="text-[10px] text-muted-foreground">Optional in template</div>}
                        {row.availableStock !== null && (
                          <div className={cn(
                            'text-[10px] tabular-nums',
                            row.availableStock <= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
                          )}>
                            {Number(row.availableStock.toFixed(6)).toLocaleString()} {row.unit} in stock
                          </div>
                        )}
                      </div>
                      <div className="col-span-2 text-right text-xs tabular-nums text-muted-foreground">
                        {Number(row.defaultQuantity.toFixed(6)).toLocaleString()}
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min="0.000001"
                          step="0.000001"
                          value={row.actual}
                          onChange={(event) => {
                            const value = event.target.value
                            setRows((current) => current.map((entry) =>
                              entry.compositionItemId === row.compositionItemId ? { ...entry, actual: value } : entry))
                            setError(null)
                          }}
                          className="h-8 w-full rounded-lg border border-input bg-background px-2 text-right text-xs tabular-nums outline-none focus:border-ring"
                          aria-label={`${row.name} quantity per formula`}
                        />
                      </div>
                      <div className="col-span-2 text-right text-xs text-muted-foreground">{row.unit}</div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Quantities are per formula. Selling 5 formulas consumes 5× these amounts. Ingredient
                stock is checked by the server at checkout; this dialog does not reserve stock.
              </p>

              {/* Profitability — estimated, informational, cost permission only */}
              {canViewCost && (
                <div className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium">Formula profitability</span>
                    {profitLoading && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
                  </div>

                  {profitError ? (
                    <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                      {profitError} You can still customize and sell this formula.
                    </p>
                  ) : !profitability ? (
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Adjust a quantity to see an estimate.
                    </p>
                  ) : (
                    <div className="mt-2 space-y-1">
                      <ProfitRow label="Formula quantity" value={String(profitability.quantity)} />
                      <ProfitRow
                        label="Estimated ingredient cost"
                        value={formatMoney(profitability.total_ingredient_cost)}
                      />
                      <ProfitRow label="Gross subtotal" value={formatMoney(profitability.gross_subtotal)} />
                      <ProfitRow label="Discount" value={formatMoney(profitability.discount_amount)} />
                      <ProfitRow label="Net revenue" value={formatMoney(profitability.net_revenue)} />
                      <ProfitRow
                        label="Estimated gross profit"
                        value={formatMoney(profitability.gross_profit)}
                        emphasis
                        negative={(profitability.gross_profit ?? 0) < 0}
                      />
                      <ProfitRow
                        label="Estimated gross margin"
                        value={profitability.gross_margin_percent == null
                          ? '—'
                          : `${Number(profitability.gross_margin_percent.toFixed(2)).toLocaleString()}%`}
                        emphasis
                        negative={(profitability.gross_margin_percent ?? 0) < 0}
                      />

                      <div className="mt-2 border-t border-border pt-1.5">
                        <ProfitRow
                          label={`Recommended @ ${Number(profitability.target_margin_percent.toFixed(2)).toLocaleString()}% margin`}
                          value={profitability.recommended_price == null
                            ? 'Not available'
                            : formatMoney(profitability.recommended_price)}
                        />
                      </div>

                      {!profitability.cost_complete && (
                        <p className="pt-1 text-[10px] leading-relaxed text-amber-600 dark:text-amber-400">
                          Some ingredients have no reliable cost yet, so profit and margin are hidden
                          rather than guessed.
                        </p>
                      )}
                      <p className="pt-1 text-[10px] leading-relaxed text-muted-foreground">
                        Estimated from current ingredient prices; excludes overhead. Checkout
                        recalculates its own authoritative figures.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="border-t border-border p-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={confirm} disabled={loading || rows.length === 0}>
            Use this formula
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function formatMoney(value: number | null): string {
  return value == null ? '—' : formatCurrency(value)
}

function ProfitRow({
  label,
  value,
  emphasis = false,
  negative = false,
}: {
  label: string
  value: string
  emphasis?: boolean
  negative?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-[11px]">
      <span className="min-w-0 truncate text-muted-foreground">{label}</span>
      <span
        className={cn(
          'shrink-0 tabular-nums',
          emphasis ? 'text-xs font-semibold' : 'font-medium',
          negative ? 'text-red-600 dark:text-red-400' : 'text-foreground',
        )}
      >
        {value}
      </span>
    </div>
  )
}
