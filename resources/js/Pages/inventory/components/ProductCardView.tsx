import { router } from '@inertiajs/react'
import { Package, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import StockBadge from './StockBadge'
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
  cost_price: number
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
                      <code className="text-[11px] font-mono text-muted-foreground">
                        {product.sku}
                      </code>
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
                      product.stock_quantity === 0 && 'text-red-500',
                      product.stock_quantity > 0 && product.status === 'low-stock' && 'text-amber-500'
                    )}>
                      {product.stock_quantity} units
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-2.5 py-2">
                    <div className="text-[10px] text-muted-foreground">Sale Price</div>
                    <div className="text-xs font-semibold mt-0.5">{formatCurrency(getSalePrice(product))}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Cost: {formatCurrency(product.cost_price || 0)}</span>
                  </div>
                  <StockBadge status={product.status} size="xs" />
                </div>
              </div>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  )
}
