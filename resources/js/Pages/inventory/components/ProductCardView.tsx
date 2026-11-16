import type { StockStatus } from '@/types'
import { router } from '@inertiajs/react'
import { Beaker, Package, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import StockBadge from './StockBadge'
import ArchivedBadge from './ArchivedBadge'
import CompletionBadge from './CompletionBadge'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

interface BackendProduct {
  id: number
  name: string
  sku: string
  category: { id: number; name: string } | null
  stock_quantity: number
  status: string
  selling_units: any[]
  last_purchase_cost?: number | null
  default_purchase_cost?: number | null
  base_unit_id?: string
  has_consumption_composition?: boolean
  has_assembly_composition?: boolean
  archived_at?: string | null
}

function isConsumptionOnly(product: BackendProduct): boolean {
  return Boolean(product.has_consumption_composition && !product.has_assembly_composition)
}

function compositionLabel(product: BackendProduct): string | null {
  if (product.has_consumption_composition && product.has_assembly_composition) return 'Formula + assembly'
  if (product.has_consumption_composition) return 'Formula'
  if (product.has_assembly_composition) return 'Assembly'
  return null
}

interface ProductCardViewProps {
  products: BackendProduct[]
}

function getSalePrice(p: BackendProduct): number {
  if (p.selling_units && p.selling_units.length > 0) {
    return Math.min(...p.selling_units.map((u: any) => u.sale_price || 0))
  }
  return 0
}

export default function ProductCardView({ products }: ProductCardViewProps) {

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-sm text-muted-foreground">
        <Package className="size-10 text-muted-foreground/50 mb-3" />
        <span>No products found matching your filters.</span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => router.visit(`/inventory/product/${product.id}`)}
          className="group text-left"
        >
          <Card size="sm" className="transition-all hover:shadow-md active:scale-[0.99]">
            <CardContent className="p-0">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Package className="size-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <code className="text-[11px] font-mono text-muted-foreground">
                          {product.sku}
                        </code>
                        {compositionLabel(product) && (
                          <Badge variant="outline" className="gap-1 border-primary/30 px-1.5 py-0 text-[9px] text-primary">
                            <Beaker className="size-2.5" /> {compositionLabel(product)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 mt-1">
                    <CompletionBadge product={product} size="sm" />
                    <ArrowRight className="size-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="rounded-lg bg-muted/50 px-2.5 py-2">
                    <div className="text-[10px] text-muted-foreground">Category</div>
                    <div className="text-xs font-medium mt-0.5 truncate">{product.category?.name || '—'}</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-2.5 py-2">
                    <div className="text-[10px] text-muted-foreground">Stock</div>
                    <div className={cn(
                      'text-xs font-medium mt-0.5',
                      !isConsumptionOnly(product) && product.stock_quantity === 0 && 'text-red-500',
                      !isConsumptionOnly(product) && product.stock_quantity > 0 && product.status === 'low-stock' && 'text-amber-500'
                    )}>
                      {isConsumptionOnly(product)
                        ? 'Not stocked'
                        : `${product.stock_quantity} ${((product as any).base_unit_name || product.base_unit_id || 'Unit')}`}
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-2.5 py-2">
                    <div className="text-[10px] text-muted-foreground">Sale Price</div>
                    <div className="text-xs font-semibold mt-0.5">{formatCurrency(getSalePrice(product))}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Cost: {formatCurrency(product.last_purchase_cost ?? product.default_purchase_cost ?? 0)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {product.archived_at && <ArchivedBadge size="xs" />}
                    {isConsumptionOnly(product)
                      ? <Badge variant="secondary" className="text-[10px]">Not stocked</Badge>
                      : <StockBadge status={product.status as StockStatus} size="xs" />}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  )
}
