import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Plus, Package, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ProductFilters from './components/ProductFilters'
import ProductTable from './components/ProductTable'
import ProductCardView from './components/ProductCardView'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

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

interface Meta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

interface PageProps {
  products: BackendProduct[]
  categories: Category[]
  meta: Meta
  filters: {
    search: string
    status: string
    category_id: number | null
    per_page: number
  }
}

/** Page sizes offered by the per-page selector (must match the backend allowlist). */
const PAGE_SIZES = [10, 25, 50, 100, 250]

function computeCompletionStatus(p: BackendProduct): 'complete' | 'incomplete' {
  if (!p.name) return 'incomplete'
  if (!p.sku) return 'incomplete'
  if (!p.category_id) return 'incomplete'
  if (!p.selling_units || p.selling_units.length === 0) return 'incomplete'
  return 'complete'
}

/** Windowed page list, e.g. [1, '…', 4, 5, 6, '…', 12] — keeps long lists short. */
function pageWindow(current: number, last: number): (number | '…')[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  const lo = Math.max(2, current - 1)
  const hi = Math.min(last - 1, current + 1)
  if (lo > 2) pages.push('…')
  for (let i = lo; i <= hi; i++) pages.push(i)
  if (hi < last - 1) pages.push('…')
  pages.push(last)
  return pages
}

export default function ProductListPage() {
  const { props } = usePage<Record<string, any>>()
  const products: BackendProduct[] = (props as any).products || []
  const categories: Category[] = (props as any).categories || []
  const meta = (props as any).meta || {}
  const filters = (props as any).filters || {}

  const [search, setSearch] = useState(filters?.search || '')
  const [category, setCategory] = useState<string>(filters?.category_id ? String(filters.category_id) : 'all')
  const [stockStatus, setStockStatus] = useState<string>(filters?.status || 'all')
  const [completionStatus, setCompletionStatus] = useState<'all' | 'complete' | 'incomplete'>('all')
  const [perPage, setPerPage] = useState<number>(filters?.per_page || 25)

  const isFirstRender = useRef(true)

  // Server-side query against ALL products (not just the current page).
  const fetchPage = useCallback((page: number) => {
    router.get('/inventory', {
      search,
      status: stockStatus,
      category_id: category === 'all' ? '' : category,
      per_page: perPage,
      page,
    }, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      only: ['products', 'meta', 'filters'],
    })
  }, [search, stockStatus, category, perPage])

  // Debounced fetch on filter/search/per-page change; always start at page 1.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const t = setTimeout(() => fetchPage(1), 300)
    return () => clearTimeout(t)
  }, [search, stockStatus, category, perPage, fetchPage])

  // Completion status is derived from the loaded page, so it stays client-side.
  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (completionStatus !== 'all') {
        const status = computeCompletionStatus(p)
        if (completionStatus === 'complete' && status !== 'complete') return false
        if (completionStatus === 'incomplete' && status === 'complete') return false
      }
      return true
    })
  }, [products, completionStatus])

  const totalStockValue = useMemo(() => {
    return products.reduce((sum, p) => {
      const cost = (p as any).last_purchase_cost ?? (p as any).default_purchase_cost ?? 0
      return sum + p.stock_quantity * cost
    }, 0)
  }, [products])

  const from = meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1
  const to = Math.min(meta.current_page * meta.per_page, meta.total)

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
        Showing <span className="font-medium text-foreground">
          {meta?.total === 0 ? '0' : `${from}–${to}`}
        </span> of {meta?.total ?? products.length} products
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <ProductTable products={filtered as any} />
      </div>

      {/* Mobile cards */}
      <div className="md:hidden">
        <ProductCardView products={filtered as any} />
      </div>

      {/* Pagination */}
      {meta?.last_page > 1 && (
        <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
          {/* Per-page selector */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="whitespace-nowrap">Rows / page:</span>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="h-8 rounded-lg border border-input bg-background px-2 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Prev / pages / next */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.current_page <= 1}
              onClick={() => fetchPage(meta.current_page - 1)}
            >
              <ChevronLeft className="size-4" /> Prev
            </Button>
            {pageWindow(meta.current_page, meta.last_page).map((p, i) =>
              p === '…' ? (
                <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-muted-foreground">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => fetchPage(p)}
                  className={cn(
                    'min-w-8 h-8 px-2 rounded-lg text-xs font-medium transition-colors',
                    p === meta.current_page
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {p}
                </button>
              )
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => fetchPage(meta.current_page + 1)}
            >
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}