import { Beaker, Pencil, Power } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatCurrency } from '@/lib/format'
import type { ProductComposition } from './types'

interface FormulaDetailProduct {
  id: number
  name: string
  sku?: string | null
  status?: string | null
  base_unit_id: string
  base_unit_name?: string
  default_price?: number
}

interface FormulaDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  composition: ProductComposition | null
  product: FormulaDetailProduct
  canViewCost: boolean
  canManage: boolean
  onEdit: (composition: ProductComposition) => void
  onDeactivate: (composition: ProductComposition) => void
  deactivating?: boolean
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

function formatQuantity(value: number): string {
  return Number(value.toFixed(6)).toLocaleString()
}

/**
 * Read-only formula detail. Every value comes from the composition payload the
 * panel already loaded, so opening this never triggers another request and can
 * never show cost the server withheld.
 */
export default function FormulaDetailDrawer({
  open,
  onOpenChange,
  composition,
  product,
  canViewCost,
  canManage,
  onEdit,
  onDeactivate,
  deactivating = false,
}: FormulaDetailDrawerProps) {
  const items = composition?.items ?? []
  const pricing = composition?.pricing

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Beaker className="size-4 text-primary" />
            {composition?.name || product.name}
          </SheetTitle>
          <SheetDescription>
            Version {composition?.version ?? '—'} · {items.length} ingredient
            {items.length === 1 ? '' : 's'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-6">
          {/* Identity */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Detail label="Product" value={product.name} />
            <Detail label="SKU" value={product.sku || '—'} mono />
            <Detail label="Product status" value={product.status || '—'} />
            <Detail
              label="Selling price"
              value={product.default_price != null ? formatCurrency(product.default_price) : '—'}
            />
            <Detail
              label="Yield"
              value={
                composition
                  ? `${formatQuantity(composition.output_quantity)} ${composition.output_unit_name}`
                  : '—'
              }
            />
            <Detail label="State" value={composition?.is_active ? 'Active' : 'Inactive'} />
          </div>

          {/* Cost — only when the server granted cost permission */}
          {canViewCost && composition && (
            <div className="space-y-3">
              {/* Current pricing */}
              <div className="rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium">Current estimated cost</span>
                  <Badge variant={composition.cost_complete ? 'secondary' : 'outline'}>
                    {composition.cost_complete ? composition.cost_basis : 'incomplete'}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
                  <span className="tabular-nums">
                    <span className="text-muted-foreground">Total </span>
                    <span className="font-semibold">
                      {composition.estimated_cost == null ? '—' : formatCurrency(composition.estimated_cost)}
                    </span>
                  </span>
                  <span className="tabular-nums">
                    <span className="text-muted-foreground">Per unit </span>
                    <span className="font-semibold">
                      {composition.estimated_unit_cost == null
                        ? '—'
                        : formatCurrency(composition.estimated_unit_cost)}
                    </span>
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  Calculated from current ingredient prices. This is not the historical cost at the
                  time this version was created.
                </p>
              </div>

              {/* Current vs recommended pricing */}
              <div className="rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium">Pricing</span>
                  {pricing && (
                    <Badge variant="outline">
                      Target margin {formatPercent(pricing.target_margin_percent)}
                    </Badge>
                  )}
                </div>

                {!pricing ? (
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                    Pricing guidance is unavailable for this formula.
                  </p>
                ) : (
                  <>
                    <div className="mt-2 space-y-1.5">
                      <PricingRow
                        label="Cost per unit"
                        value={pricing.estimated_cost == null ? '—' : formatCurrency(pricing.estimated_cost)}
                      />
                      <PricingRow
                        label="Current selling price"
                        value={perUnit(pricing.selling_price, pricing.selling_unit_name)}
                      />
                      <PricingRow
                        label="Current profit"
                        value={pricing.profit == null ? '—' : formatCurrency(pricing.profit)}
                        tone={pricing.profit != null && pricing.profit < 0 ? 'negative' : 'default'}
                      />
                      <PricingRow
                        label="Current margin"
                        value={pricing.margin_percent == null ? '—' : formatPercent(pricing.margin_percent)}
                        tone={pricing.margin_percent != null && pricing.margin_percent < 0 ? 'negative' : 'default'}
                      />
                    </div>

                    <div className="mt-3 border-t border-border pt-2.5">
                      <PricingRow
                        label="Recommended selling price"
                        value={
                          pricing.recommended_price == null
                            ? 'Not available'
                            : perUnit(pricing.recommended_price, pricing.selling_unit_name)
                        }
                        emphasis
                      />
                      <PricingRow
                        label="Profit at recommended price"
                        value={
                          pricing.recommended_profit == null
                            ? '—'
                            : formatCurrency(pricing.recommended_profit)
                        }
                      />
                    </div>

                    {!pricing.available && (
                      <p className="mt-2 text-[11px] leading-relaxed text-amber-600 dark:text-amber-400">
                        {pricing.unavailable_reason === 'incomplete_cost'
                          ? 'A recommendation needs a complete ingredient cost. Some ingredients have no reliable cost yet.'
                          : 'A recommendation is unavailable because the target margin is not valid.'}
                      </p>
                    )}
                    <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                      Based on current estimated ingredient costs and your target margin. This is
                      guidance only — the selling price is not changed automatically.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Every ingredient, never truncated */}
          <div>
            <h3 className="mb-2 text-xs font-semibold">Ingredients</h3>
            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                This formula has no ingredients.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="grid grid-cols-12 gap-2 border-b border-border bg-muted/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span className="col-span-5">Ingredient</span>
                  <span className="col-span-3 text-right">Quantity</span>
                  <span className="col-span-2 text-right">Wastage</span>
                  {canViewCost && <span className="col-span-2 text-right">Cost</span>}
                </div>
                <div className="divide-y divide-border">
                  {items.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 items-center gap-2 px-3 py-2">
                      <div className="col-span-5 min-w-0">
                        <div className="truncate text-xs font-medium">
                          {item.component?.name ?? `Ingredient #${item.component_product_id}`}
                        </div>
                        {item.is_optional && (
                          <div className="text-[10px] text-muted-foreground">Optional</div>
                        )}
                      </div>
                      <div className="col-span-3 text-right text-xs tabular-nums">
                        {formatQuantity(Number(item.display_quantity))} {item.display_unit_name}
                      </div>
                      <div className="col-span-2 text-right text-xs tabular-nums text-muted-foreground">
                        {Number(item.wastage_pct) > 0 ? `${Number(item.wastage_pct)}%` : '—'}
                      </div>
                      {canViewCost && (
                        <div className="col-span-2 text-right text-xs tabular-nums">
                          {item.line_cost == null ? '—' : formatCurrency(item.line_cost)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {composition?.notes && (
            <div>
              <h3 className="mb-1.5 text-xs font-semibold">Notes</h3>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                {composition.notes}
              </p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Detail
              label="Created"
              value={`${formatDate(composition?.created_at ?? null)}${composition?.created_by ? ` · ${composition.created_by}` : ''}`}
            />
            <Detail label="Last updated" value={formatDate(composition?.updated_at ?? null)} />
          </div>

          {canManage && composition && (
            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <Button size="sm" variant="outline" onClick={() => onEdit(composition)} className="gap-1.5">
                <Pencil className="size-3.5" /> New version
              </Button>
              {composition.is_active && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDeactivate(composition)}
                  disabled={deactivating}
                  className="gap-1.5 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/20"
                >
                  <Power className="size-3.5" /> Deactivate
                </Button>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 truncate text-sm ${mono ? 'font-mono text-xs' : ''}`}>{value}</div>
    </div>
  )
}

function PricingRow({
  label,
  value,
  emphasis = false,
  tone = 'default',
}: {
  label: string
  value: string
  emphasis?: boolean
  tone?: 'default' | 'negative'
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`tabular-nums ${
          emphasis ? 'text-sm font-semibold text-foreground' : 'font-medium'
        } ${tone === 'negative' ? 'text-red-600 dark:text-red-400' : ''}`}
      >
        {value}
      </span>
    </div>
  )
}

function formatPercent(value: number): string {
  return `${Number(value.toFixed(2)).toLocaleString()}%`
}

/** "Rs. 500 per Formula" — the unit is what makes the price meaningful. */
function perUnit(value: number | null, unitName?: string | null): string {
  if (value == null) return '—'

  return unitName ? `${formatCurrency(value)} per ${unitName}` : formatCurrency(value)
}
