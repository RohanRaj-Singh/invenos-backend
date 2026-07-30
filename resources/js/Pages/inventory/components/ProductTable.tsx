import type { StockStatus } from '@/types'
import { router } from '@inertiajs/react'
import { ArrowRight, Package } from 'lucide-react'
import StockBadge from './StockBadge'
import { formatCurrency } from '@/lib/format'
import { formatStock } from '@/lib/product-unit-display'
import { cn } from '@/lib/utils'

interface SellingUnit {
  id: number
  name: string
  quantity: number
  sale_price: number
  is_default: boolean
}

interface BackendProduct {
  id: number
  name: string
  sku: string
  barcode: string | null
  category: { id: number; name: string } | null
  base_unit_id: string | null
  stock_quantity: number
  last_purchase_cost: number | null
  default_purchase_cost: number | null
  status: string
  selling_units: SellingUnit[]
}

interface ProductTableProps {
  products: BackendProduct[]
}

function getSalePrice(p: BackendProduct): number {
  const def = p.selling_units?.find((u) => u.is_default)
  return def?.sale_price || p.selling_units?.[0]?.sale_price || 0
}

function getCostPrice(p: BackendProduct): number {
  return p.last_purchase_cost ?? p.default_purchase_cost ?? 0
}

export default function ProductTable({ products }: ProductTableProps) {
  const totalValue = products.reduce((sum, p) => sum + p.stock_quantity * getCostPrice(p), 0)

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <Th>Product</Th>
            <Th>SKU</Th>
            <Th>Category</Th>
            <Th className="text-right">Stock</Th>
            <Th className="text-right">Purchase Price</Th>
            <Th className="text-right">Sale Price</Th>
            <Th className="text-right">Value</Th>
            <Th>Status</Th>
            <Th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-center py-16 text-sm text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Package className="size-8 text-muted-foreground/50" />
                  <span>No products found matching your filters.</span>
                </div>
              </td>
            </tr>
          ) : (
            products.map((product) => {
              const costPrice = getCostPrice(product)
              const salePrice = getSalePrice(product)
              return (
                <tr
                  key={product.id}
                  className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors group"
                >
                  <td
                    className="px-4 py-3.5 cursor-pointer"
                    onClick={() => router.visit(`/inventory/product/${product.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Package className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{product.name}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{product.barcode}</div>
                      </div>
                    </div>
                  </td>
                  <td
                    className="px-4 py-3.5 cursor-pointer"
                    onClick={() => router.visit(`/inventory/product/${product.id}`)}
                  >
                    <code className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {product.sku}
                    </code>
                  </td>
                  <td
                    className="px-4 py-3.5 text-sm text-muted-foreground cursor-pointer"
                    onClick={() => router.visit(`/inventory/product/${product.id}`)}
                  >
                    {product.category?.name || '—'}
                  </td>
                  <td
                    className="px-4 py-3.5 text-right cursor-pointer"
                    onClick={() => router.visit(`/inventory/product/${product.id}`)}
                  >
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={cn(
                          'text-sm font-semibold tabular-nums',
                          product.stock_quantity === 0 && 'text-red-500',
                          product.stock_quantity > 0 && product.status === 'low-stock' && 'text-amber-500'
                        )}
                      >
                        {product.stock_quantity.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{((product as any).base_unit_name || product.base_unit_id || 'Unit')}</span>
                    </div>
                  </td>
                  <td
                    className="px-4 py-3.5 text-right cursor-pointer"
                    onClick={() => router.visit(`/inventory/product/${product.id}`)}
                  >
                    <span className="text-sm tabular-nums">{costPrice > 0 ? formatCurrency(costPrice) : '—'}</span>
                  </td>
                  <td
                    className="px-4 py-3.5 text-right cursor-pointer"
                    onClick={() => router.visit(`/inventory/product/${product.id}`)}
                  >
                    <span className="text-sm font-semibold tabular-nums">{salePrice > 0 ? formatCurrency(salePrice) : '—'}</span>
                  </td>
                  <td
                    className="px-4 py-3.5 text-right cursor-pointer"
                    onClick={() => router.visit(`/inventory/product/${product.id}`)}
                  >
                    <span className="text-sm text-muted-foreground tabular-nums">{formatCurrency(product.stock_quantity * costPrice)}</span>
                  </td>
                  <td
                    className="px-4 py-3.5 cursor-pointer"
                    onClick={() => router.visit(`/inventory/product/${product.id}`)}
                  >
                    <StockBadge status={product.status as StockStatus} />
                  </td>
                  <td
                    className="px-4 py-3.5 cursor-pointer"
                    onClick={() => router.visit(`/inventory/product/${product.id}`)}
                  >
                    <ArrowRight className="size-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border bg-muted/20">
            <td colSpan={3} className="px-4 py-3 text-sm font-medium text-foreground">
              {products.length} product{products.length !== 1 ? 's' : ''}
            </td>
            <td className="px-4 py-3 text-right text-sm text-muted-foreground">—</td>
            <td colSpan={2} />
            <td className="px-4 py-3 text-right">
              <span className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(totalValue)}</span>
            </td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider',
        className
      )}
    >
      {children}
    </th>
  )
}
