import { router, usePage } from '@inertiajs/react'
import { useState } from 'react'
import {
  ArrowLeft,
  Package,
  BarChart3,
  ShoppingCart,
  PackagePlus,
  ClipboardList,
  Plus,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import StockBadge from './components/StockBadge'
import CompletionBadge, { computeCompletionStatus } from './components/CompletionBadge'
import InventoryTimeline from './components/InventoryTimeline'
import AdjustStockDialog from './components/AdjustStockDialog'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

interface BackendProduct {
  id: number
  name: string
  sku: string
  barcode: string | null
  category: { id: number; name: string } | null
  description: string | null
  base_unit_id: string | null
  stock_quantity: number
  low_stock_threshold: number
  status: string
  product_type: string
  track_inventory: boolean
  last_purchase_cost: number | null
  default_purchase_cost: number | null
  selling_units: any[]
  created_at: string
}

export default function ProductDetailsPage() {
  const { props, url } = usePage()
  const { product, movements, purchases, sales } = props as {
    product: BackendProduct | null; movements?: any[]; purchases?: any[]; sales?: any[]
  }
  const id = url.split('/').pop() || ''
  const [activeSection, setActiveSection] = useState('overview')
  const [showAdjust, setShowAdjust] = useState(false)

  const costPrice = product ? (product.last_purchase_cost ?? product.default_purchase_cost ?? 0) : 0
  const sellingPrice = product && product.selling_units?.length > 0
    ? Math.min(...product.selling_units.map((u: any) => u.sale_price || 0))
    : 0

  // Normalize movements from backend snake_case to frontend camelCase
  const normalizedMovements = (movements || []).map((m: any) => ({
    id: String(m.id),
    productId: m.product_id,
    type: m.type,
    quantity: m.quantity,
    unit: m.unit || '',
    packagingName: m.packaging_name,
    packagingQuantity: m.packaging_quantity,
    date: m.date,
    reference: m.reference || '',
    notes: m.notes,
    user: m.user || '',
    runningBalance: m.running_balance ?? 0,
  }))

  if (!product) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="flex flex-col items-center justify-center py-24 text-sm text-muted-foreground">
          <Package className="size-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-1">Product not found</h2>
          <p className="mb-4">The product you're looking for doesn't exist.</p>
          <Button variant="outline" onClick={() => router.visit('/inventory')}>Back to Inventory</Button>
        </div>
      </div>
    )
  }

  const completionStatus = computeCompletionStatus(product as any)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5">
      {/* Back + Actions */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.visit('/inventory')} className="gap-1.5 mb-1 -ml-2">
            <ArrowLeft className="size-3.5" />
            Back to Inventory
          </Button>
          <div className="flex items-center gap-2">
            <Package className="size-5 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight">{product.name}</h1>
            <StockBadge status={product.status} />
            <CompletionBadge product={product as any} size="sm" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            SKU: <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{product.sku}</code>
            {product.barcode && (
              <> · Barcode: <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{product.barcode}</code></>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAdjust(true)} className="gap-1.5">
            <Plus className="size-3.5" />
            Adjust Stock
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.visit(`/inventory/product/${product.id}/edit`)} className="gap-1.5">
            <PackagePlus className="size-3.5" />
            Edit
          </Button>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex items-center gap-0.5 border-b border-border overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: Package },
          { id: 'transactions', label: 'Stock Movements', icon: BarChart3 },
          { id: 'purchases', label: 'Purchase History', icon: ShoppingCart },
          { id: 'sales', label: 'Sales History', icon: ClipboardList },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors shrink-0',
                activeSection === tab.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="size-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Overview tab */}
      {activeSection === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Basic info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium">{product.category?.name || '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Product Type</span>
                <span className="font-medium capitalize">{product.product_type || 'Simple'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Track Inventory</span>
                <span className="font-medium">{product.track_inventory ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <StockBadge status={product.status} />
              </div>
              <div className="text-sm pt-2 border-t border-border">
                <span className="text-muted-foreground block mb-1">Description</span>
                <span className="font-medium">{product.description || 'No description'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Stock info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Stock</span>
                <span className={cn(
                  'font-bold text-lg',
                  product.stock_quantity === 0 ? 'text-red-500' :
                  product.status === 'low-stock' ? 'text-amber-500' : 'text-emerald-600'
                )}>
                  {product.stock_quantity}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Low Stock Threshold</span>
                <span className="font-medium">{product.low_stock_threshold}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Stock Value</span>
                <span className="font-semibold">{formatCurrency(product.stock_quantity * (costPrice || 0))}</span>
              </div>
            </CardContent>
          </Card>

          {/* Pricing info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cost Price</span>
                <span className="font-medium">{formatCurrency(costPrice || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Selling Price</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(sellingPrice || 0)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span className="text-muted-foreground">Margin</span>
                <span className="font-semibold">
                  {costPrice > 0
                    ? `${Math.round(((sellingPrice - costPrice) / costPrice) * 100)}%`
                    : '—'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stock Movements tab */}
      {activeSection === 'transactions' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Stock Movements</CardTitle>
          </CardHeader>
          <CardContent>
            <InventoryTimeline transactions={normalizedMovements} />
          </CardContent>
        </Card>
      )}

      {/* Purchase History tab */}
      {activeSection === 'purchases' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Purchase History</CardTitle>
          </CardHeader>
          <CardContent>
            {(!purchases || purchases.length === 0) ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No purchase history found.</p>
            ) : (
              <div className="space-y-1">
                {purchases.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 flex items-center justify-center">
                        <ShoppingCart className="size-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{p.purchase_bill?.invoice_ref || p.purchase_bill_id}</div>
                        <div className="text-xs text-muted-foreground">
                          {p.purchase_bill?.supplier?.name || p.supplier_name || ''} &middot; {p.purchase_bill?.date || p.date}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">×{p.purchase_quantity} @ {formatCurrency(p.unit_cost)}</div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(p.total_cost)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sales History tab */}
      {activeSection === 'sales' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sales History</CardTitle>
          </CardHeader>
          <CardContent>
            {(!sales || sales.length === 0) ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No sales history found.</p>
            ) : (
              <div className="space-y-1">
                {sales.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 flex items-center justify-center">
                        <ClipboardList className="size-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{s.sale?.invoice_number || s.sale_id}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.sale?.customer?.name || s.customer_name || ''} &middot; {s.sale?.date || s.date}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">×{s.base_quantity} @ {formatCurrency(s.unit_price)}</div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(s.total)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Adjust Stock Dialog */}
      <AdjustStockDialog
        open={showAdjust}
        onOpenChange={setShowAdjust}
        productId={product.id}
        productName={product.name}
        currentStock={product.stock_quantity}
      />
    </div>
  )
}
