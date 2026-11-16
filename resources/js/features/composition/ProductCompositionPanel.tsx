import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  Beaker,
  Eye,
  History,
  Loader2,
  Pencil,
  Plus,
  Power,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import CompositionBuilder from './CompositionBuilder'
import FormulaDetailDrawer from './FormulaDetailDrawer'
import {
  compositionErrorMessage,
  deactivateComposition,
  fetchCompositions,
} from './api'
import type { ProductComposition } from './types'

interface ProductInfo {
  id: number
  name: string
  base_unit_id: string
  base_unit_name?: string
  default_price?: number
  sku?: string | null
  status?: string | null
}

interface ProductCompositionPanelProps {
  product: ProductInfo
  canManage: boolean
  canViewCost?: boolean
}

const KIND_LABELS: Record<ProductComposition['kind'], string> = {
  consumption: 'Ingredient formula',
  assembly: 'Assembly',
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

function CostBadge({ composition }: { composition: ProductComposition }) {
  if (composition.estimated_cost == null) {
    return <Badge variant="destructive">Cost unavailable</Badge>
  }

  return (
    <Badge variant={composition.cost_complete ? 'secondary' : 'outline'}>
      {composition.cost_complete ? composition.cost_basis : 'incomplete'} ·{' '}
      {formatCurrency(composition.estimated_cost)}
    </Badge>
  )
}

export default function ProductCompositionPanel({ product, canManage, canViewCost = false }: ProductCompositionPanelProps) {
  const [compositions, setCompositions] = useState<ProductComposition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [detailComposition, setDetailComposition] = useState<ProductComposition | null>(null)
  const [editing, setEditing] = useState<ProductComposition | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [deactivating, setDeactivating] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setCompositions(await fetchCompositions(product.id))
    } catch (err) {
      setError(compositionErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [product.id])

  useEffect(() => {
    void load()
  }, [load])

  // Formula templates are ingredient-consumption definitions. Assembly
  // compositions remain available in the backend for other business types but
  // are intentionally hidden from the herbalist formula workflow.
  const formulaCompositions = compositions.filter((composition) => composition.kind === 'consumption')
  const active = formulaCompositions.filter((composition) => composition.is_active)

  function openNew() {
    setEditing(null)
    setBuilderOpen(true)
  }

  function openEdit(composition: ProductComposition) {
    setEditing(composition)
    setBuilderOpen(true)
  }

  async function handleDeactivate(composition: ProductComposition) {
    if (!window.confirm(`Deactivate version ${composition.version}? Historical versions and transactions are preserved.`)) {
      return
    }

    setDeactivating(composition.id)
    try {
      await deactivateComposition(product.id, composition.id)
      toast.success(`Version ${composition.version} deactivated`)
      await load()
    } catch (err) {
      toast.error(compositionErrorMessage(err))
    } finally {
      setDeactivating(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading composition...
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="space-y-3 py-10 text-center">
          <AlertTriangle className="mx-auto size-6 text-red-500" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={() => void load()} className="gap-1.5">
            <RefreshCw className="size-3.5" /> Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Beaker className="size-4 text-primary" /> Formula template
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Define the ingredients and default quantities for this formula. Editing never moves stock
            or creates a production order.
          </p>
          {product.default_price !== undefined && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Default selling price: <span className="font-medium text-foreground">{formatCurrency(product.default_price)}</span>
              {' '}· change it from Edit Product.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {formulaCompositions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory((value) => !value)}
              className="gap-1.5"
            >
              <History className="size-3.5" /> {showHistory ? 'Hide history' : 'Version history'}
            </Button>
          )}
          {canManage && (
            <Button size="sm" onClick={openNew} className="gap-1.5">
              <Plus className="size-3.5" /> New formula
            </Button>
          )}
        </div>
      </div>

      {active.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Beaker className="mx-auto mb-3 size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">No formula yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {canManage
                ? 'Add the ingredients and default quantities to sell this as a formula.'
                : 'A manager has not defined a formula for this product yet.'}
            </p>
            {canManage && (
              <Button size="sm" onClick={openNew} className="mt-4 gap-1.5">
                <Plus className="size-3.5" /> Create formula
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {active.map((composition) => (
            <Card key={composition.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm">{KIND_LABELS[composition.kind]}</CardTitle>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Version {composition.version} · {composition.component_count} ingredient
                      {composition.component_count === 1 ? '' : 's'}
                    </p>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline">
                    {Number(composition.output_quantity)} {composition.output_unit_name}
                  </Badge>
                  {canViewCost && <CostBadge composition={composition} />}
                  {canViewCost && composition.is_estimated && <Badge variant="outline">Estimated</Badge>}
                </div>

                {/* Pricing guidance, already computed server-side for this row. */}
                {canViewCost && composition.pricing && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span>
                      Margin{' '}
                      <span
                        className={cn(
                          'font-medium tabular-nums',
                          composition.pricing.margin_percent != null && composition.pricing.margin_percent < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-foreground',
                        )}
                      >
                        {composition.pricing.margin_percent == null
                          ? '—'
                          : `${Number(composition.pricing.margin_percent.toFixed(2)).toLocaleString()}%`}
                      </span>
                    </span>
                    <span>
                      Target{' '}
                      <span className="font-medium tabular-nums text-foreground">
                        {Number(composition.pricing.target_margin_percent.toFixed(2)).toLocaleString()}%
                      </span>
                    </span>
                    <span>
                      Recommended{' '}
                      <span className="font-medium tabular-nums text-foreground">
                        {composition.pricing.recommended_price == null
                          ? '—'
                          : formatCurrency(composition.pricing.recommended_price)}
                      </span>
                    </span>
                  </div>
                )}

                <div className="space-y-1">
                  {composition.items.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                        <span className="truncate">
                          {item.component?.name ?? `Ingredient #${item.component_product_id}`}
                        </span>
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {Number(item.display_quantity)} {item.display_unit_name}
                        {item.wastage_pct > 0 && ` +${Number(item.wastage_pct)}%`}
                      </span>
                    </div>
                  ))}
                  {composition.items.length > 5 && (
                    <p className="text-[11px] text-muted-foreground">
                      +{composition.items.length - 5} more ingredient(s)
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                  <Button variant="outline" size="sm" onClick={() => setDetailComposition(composition)} className="gap-1.5">
                    <Eye className="size-3.5" /> View
                  </Button>
                  {canManage && (
                    <Button variant="outline" size="sm" onClick={() => openEdit(composition)} className="gap-1.5">
                      <Pencil className="size-3.5" /> New version
                    </Button>
                  )}
                  {canManage && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleDeactivate(composition)}
                      disabled={deactivating === composition.id}
                      className="gap-1.5 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/20"
                    >
                      {deactivating === composition.id
                        ? <Loader2 className="size-3.5 animate-spin" />
                        : <Power className="size-3.5" />}
                      Deactivate
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showHistory && formulaCompositions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Version history</CardTitle>
            {canViewCost && (
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Costs in this table are calculated using <span className="font-medium text-foreground">current</span>{' '}
                ingredient prices, so they show what each version would cost today — not what it
                cost when it was created.
              </p>
            )}
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Version</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Yield</th>
                  <th className="py-2 pr-3 font-medium">Ingredients</th>
                  {canViewCost && <th className="py-2 pr-3 font-medium">Current est. cost</th>}
                  <th className="py-2 pr-3 font-medium">Created</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {formulaCompositions.map((composition) => (
                  <tr key={composition.id} className="border-b border-border/60 last:border-b-0">
                    <td className="py-2 pr-3 font-medium">v{composition.version}</td>
                    <td className="py-2 pr-3">
                      <Badge variant={composition.is_active ? 'secondary' : 'outline'}>
                        {composition.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3 tabular-nums">
                      {Number(composition.output_quantity)} {composition.output_unit_name}
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{composition.component_count}</td>
                    {canViewCost && (
                      <td className="py-2 pr-3 tabular-nums">
                        {composition.estimated_cost == null ? '—' : formatCurrency(composition.estimated_cost)}
                      </td>
                    )}
                    <td className="py-2 text-muted-foreground">{formatDate(composition.created_at)}</td>
                    <td className="py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetailComposition(composition)}
                        className="h-7 gap-1 px-2 text-[11px]"
                      >
                        <Eye className="size-3" /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {builderOpen && (
        <CompositionBuilder
          key={editing?.id ?? 'new'}
          open={builderOpen}
          product={product}
          initial={editing}
          canViewCost={canViewCost}
          onClose={() => setBuilderOpen(false)}
          onSaved={() => {
            void load()
          }}
        />
      )}

      <FormulaDetailDrawer
        open={detailComposition !== null}
        onOpenChange={(next) => { if (!next) setDetailComposition(null) }}
        composition={detailComposition}
        product={product}
        canViewCost={canViewCost}
        canManage={canManage}
        onEdit={(composition) => {
          setDetailComposition(null)
          openEdit(composition)
        }}
        onDeactivate={(composition) => {
          setDetailComposition(null)
          void handleDeactivate(composition)
        }}
        deactivating={deactivating === detailComposition?.id}
      />
    </div>
  )
}
