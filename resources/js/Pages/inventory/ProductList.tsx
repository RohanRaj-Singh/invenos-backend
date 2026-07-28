import { useState, useMemo } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Plus, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ProductFilters from './components/ProductFilters'
import ProductTable from './components/ProductTable'
import ProductCardView from './components/ProductCardView'
import { formatCurrency } from '@/lib/format'

interface Category {
  id: number
  name: string
}

interface BackendProduct {
  id: number
  name: string
  sku: string
  barcode: string | null
  category_id: number | null
  description: string | null
  base_unit_id: number | null
  stock_quantity: number
  low_stock_threshold: number
  status: string
  product_type: string
  track_inventory: boolean
  selling_price: number
  last_purchase_cost?: number
  default_purchase_cost?: number
  category: Category | null
  selling_units: any[]
  created_at: string
}

interface ProductsPageProps {
  products: BackendProduct[]
  categories: Category[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  filters: {
    search: string
    category_id: number | null
  }
}

function computeCompletionStatus(p: BackendProduct): 'complete' | 'incomplete' {
  if (!p.name) return 'incomplete'
  if (!p.sku) return 'incomplete'
  if (!p.category_id) return 'incomplete'
  if (!p.selling_units || p.selling_units.length === 0) return 'incomplete'
  return 'complete'
}

export default function ProductListPage() {
  const { props } = usePage<ProductsPageProps>()
  const { products, categories, meta, filters } = props

  const [search, setSearch] = useState(filters?.search || '')
  const [category, setCategory] = useState<string>(filters?.category_id ? String(filters.category_id) : 'all')
  const [stockStatus, setStockStatus] = useState<string>('all')
  const [completionStatus, setCompletionStatus] = useState<'all' | 'complete' | 'incomplete'>('all')

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (search) {
        const q = search.toLowerCase()
        if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false
      }
      if (category !== 'all' && String(p.category_id) !== category) return false
      if (stockStatus !== 'all' && p.status !== stockStatus) return false
      if (completionStatus !== 'all') {
        const status = computeCompletionStatus(p)
        if (completionStatus === 'complete' && status !== 'complete') return false
        if (completionStatus === 'incomplete' && status === 'complete') return false
      }
      return true
    })
  }, [products, search, category, stockStatus, completionStatus])

  const totalStockValue = useMemo(() => {
    return products.reduce((sum, p) => {
      const cost = (p as any).last_purchase_cost ?? (p as any).default_purchase_cost ?? 0
      return sum + p.stock_quantity * cost
    }, 0)
  }, [products])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Package className="size-5" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Inventory
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {meta?.total ?? products.length} products · Stock value: {formatCurrency(totalStockValue)}
          </p>
        </div>
        <Button
          onClick={() => router.visit('/inventory/add')}
          size="sm"
          className="gap-1.5 shadow-sm h-9"
        >
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">Add Product</span>
        </Button>
      </div>

      {/* Filters */}
      <ProductFilters
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        stockStatus={stockStatus}
        onStockStatusChange={setStockStatus}
        completionStatus={completionStatus}
        onCompletionStatusChange={setCompletionStatus}
        categories={categories}
      />

      {/* Results count */}
      <div className="text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{filtered.length}</span> of{' '}
        {meta?.total ?? products.length} products
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <ProductTable products={filtered} />
      </div>

      {/* Mobile cards */}
      <div className="md:hidden">
        <ProductCardView products={filtered} />
      </div>
    </div>
  )
}
