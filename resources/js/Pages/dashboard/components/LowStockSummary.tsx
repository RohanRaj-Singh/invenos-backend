import { useMemo } from 'react'
import { router } from '@inertiajs/react'
import { Package, AlertTriangle, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface LowStockItem {
  id: number
  name: string
  sku: string
  stock_quantity: number
  base_unit?: string
  status?: string
}

interface LowStockSummaryProps {
  lowStock?: LowStockItem[]
}

export default function LowStockSummary({ lowStock = [] }: LowStockSummaryProps) {
  const items = useMemo(() => {
    return lowStock
      .filter((p) => p.status === 'low-stock' || p.status === 'out-of-stock' || p.stock_quantity <= 10)
      .sort((a, b) => a.stock_quantity - b.stock_quantity)
      .slice(0, 5)
  }, [lowStock])

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="size-4 text-emerald-600" />
            Stock Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-sm text-muted-foreground">
            <Package className="size-8 text-emerald-500/30 mb-2" />
            <p className="font-medium text-emerald-600">All items in stock</p>
            <p className="text-xs mt-0.5">No low stock alerts</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-600" />
          Low Stock
        </CardTitle>
        <button
          onClick={() => router.visit('/inventory')}
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          View All <ArrowRight className="size-3" />
        </button>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {items.map((product) => {
            const isOut = product.status === 'out-of-stock' || product.stock_quantity === 0
            return (
              <button
                key={product.id}
                onClick={() => router.visit(`/inventory/product/${product.id}`)}
                className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    'size-8 rounded-lg flex items-center justify-center shrink-0',
                    isOut ? 'bg-red-50 dark:bg-red-500/10' : 'bg-amber-50 dark:bg-amber-500/10',
                  )}>
                    <Package className={cn('size-4', isOut ? 'text-red-600' : 'text-amber-600')} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{product.name}</div>
                    <div className="text-xs text-muted-foreground">{product.sku}</div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div className={cn('text-sm font-bold', isOut ? 'text-red-600' : 'text-amber-600')}>
                    {product.stock_quantity}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {product.base_unit || 'units'}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
