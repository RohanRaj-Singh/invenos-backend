import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Package, Search, ChevronLeft, ChevronRight, AlertTriangle, TrendingUp, Undo2, ClipboardList, Layers } from 'lucide-react'
import { ReportLayout } from './components/ReportLayout'
import { ReportToolbar } from './components/ReportToolbar'
import { SummaryCards } from './components/SummaryCards'
import { StatusBadge } from './components/StatusBadge'
import { formatCurrency, formatCurrencyShort } from '@/lib/format'
import { cn } from '@/lib/utils'

// ─── Shapes ────────────────────────────────────────────────────────────

interface Meta { current_page: number; last_page: number; per_page: number; total: number }

interface AttentionItem { id: number; name: string; sku: string; stock_quantity: number; unit: string; low_stock_threshold: number; status: string }
interface TopSellingItem { product_id: number; product_name: string; qty: number; revenue: number; invoice_count: number }
interface MostReturnedItem { product_id: number; product_name: string; qty: number; value: number; return_count: number }
interface ValuationRow { product: string; sku: string; unit: string; quantity: number; cost: number; value: number; status: string }
interface CategoryRow { category: string; products: number; value: number }

interface ProductRow {
  id: number
  name: string
  sku: string
  category?: string | null
  category_id?: number | null
  unit?: string | null
  stock_quantity: number
  low_stock_threshold: number
  status: string
  sold: number
  purchased: number
  returns: number
  cost: number
  value: number
}

interface BackendReport {
  summary?: { total_products: number; total_stock: number; total_value: number; low_stock: number; out_of_stock: number; negative_stock: number }
  attention?: { negative: AttentionItem[]; out_of_stock: AttentionItem[]; low_stock: AttentionItem[] }
  movement?: { opening_stock: number; purchased: number; sold: number; sale_returns: number; purchase_returns: number; adjustments: number; closing_stock: number; net: number }
  top_selling?: TopSellingItem[]
  most_returned?: MostReturnedItem[]
  valuation?: { method: string; total_value: number; rows: ValuationRow[] }
  by_category?: CategoryRow[]
  products?: ProductRow[]
  meta?: Meta | null
  period?: { from: string; to: string }
}

interface BackendFilters {
  search?: string | null
  category_id?: number | null
  status?: string | null
  date_from?: string | null
  date_to?: string | null
  per_page?: number
  page?: number | null
}

interface PageProps {
  report?: BackendReport
  categories?: Array<{ id: number; name: string }>
  filters?: BackendFilters
}

// ─── Helpers ───────────────────────────────────────────────────────────

const PAGE_SIZES = [10, 25, 50, 100, 250]
const fmt = (n: number | undefined | null) => Number(n ?? 0).toLocaleString()

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

// ─── Section wrappers ──────────────────────────────────────────────────

function Section({ title, icon, children, className }: { title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-xl border border-border bg-card p-4 sm:p-5', className)}>
      <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  )
}

function MovementTable({ movement }: { movement: NonNullable<BackendReport['movement']> }) {
  const rows: Array<[string, number, boolean]> = [
    ['Opening Stock', movement.opening_stock, false],
    ['Purchased', movement.purchased, false],
    ['Sold', movement.sold, true],
    ['Sale Returns', movement.sale_returns, false],
    ['Purchase Returns', movement.purchase_returns, true],
    ['Adjustments', movement.adjustments, movement.adjustments < 0],
    ['Closing Stock', movement.closing_stock, false],
  ]
  return (
    <div className="max-w-md">
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([label, value, subtract]) => (
            <tr key={label} className="border-b border-border last:border-0">
              <td className="py-1.5 text-muted-foreground">{label}</td>
              <td className="py-1.5 text-right font-medium tabular-nums">
                {label === 'Adjustments'
                  ? `${value >= 0 ? '+' : '−'}${fmt(Math.abs(value))}`
                  : `${subtract ? '−' : value >= 0 && label !== 'Opening Stock' ? '+' : ''}${fmt(value)}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────

export default function StockReportPage() {
  const { props } = usePage<Record<string, any>>()
  const page = props as PageProps
  const report = page.report || {}
  const categories = page.categories || []
  const filters = page.filters || {}
  const meta = report.meta || null

  const summary = report.summary || { total_products: 0, total_stock: 0, total_value: 0, low_stock: 0, out_of_stock: 0, negative_stock: 0 }
  const attention = report.attention || { negative: [], out_of_stock: [], low_stock: [] }
  const movement = report.movement || null
  const topSelling = report.top_selling || []
  const mostReturned = report.most_returned || []
  const valuation = report.valuation || { method: '', total_value: 0, rows: [] }
  const byCategory = report.by_category || []
  const products = report.products || []

  const [search, setSearch] = useState(filters.search || '')
  const [category, setCategory] = useState(filters.category_id ? String(filters.category_id) : 'all')
  const [status, setStatus] = useState(filters.status || 'all')
  const [dateFrom, setDateFrom] = useState(filters.date_from || '')
  const [dateTo, setDateTo] = useState(filters.date_to || '')
  const [perPage, setPerPage] = useState(filters.per_page || 25)

  const isFirstRender = useRef(true)

  const buildParams = useCallback((page?: number, overrides?: Record<string, string>) => ({
    search,
    category_id: category === 'all' ? '' : category,
    status: status === 'all' ? '' : status,
    date_from: dateFrom,
    date_to: dateTo,
    per_page: String(perPage),
    page: page ? String(page) : '',
    ...overrides,
  }), [search, category, status, dateFrom, dateTo, perPage])

  const fetchPage = useCallback((page: number) => {
    router.get('/reports/stock', buildParams(page), {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      only: ['report', 'categories', 'filters'],
    })
  }, [buildParams])

  // Debounced refetch on filter change — always back to page 1.
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    const t = setTimeout(() => fetchPage(1), 300)
    return () => clearTimeout(t)
  }, [search, category, status, dateFrom, dateTo, perPage, fetchPage])

  const filterUrl = useCallback((base: string, extra?: Record<string, string>) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (category !== 'all') params.set('category_id', category)
    if (status !== 'all') params.set('status', status)
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    if (extra) for (const [k, v] of Object.entries(extra)) params.set(k, v)
    const qs = params.toString()
    return qs ? `${base}?${qs}` : base
  }, [search, category, status, dateFrom, dateTo])

  const handlePrint = useCallback(() => {
    window.open(filterUrl('/reports/stock/print'), '_blank')
  }, [filterUrl])

  const handleRefresh = useCallback(() => {
    fetchPage(meta?.current_page || 1)
  }, [fetchPage, meta])

  const cards = useMemo(() => [
    { label: 'Total Products', value: fmt(summary.total_products) },
    { label: 'Total Stock', value: fmt(summary.total_stock) },
    { label: 'Inventory Value', value: formatCurrency(summary.total_value), positive: true },
    { label: 'Low Stock', value: fmt(summary.low_stock), negative: summary.low_stock > 0 },
    { label: 'Out of Stock', value: fmt(summary.out_of_stock), negative: summary.out_of_stock > 0 },
    { label: 'Negative Stock', value: fmt(summary.negative_stock), negative: summary.negative_stock > 0 },
  ], [summary])

  const from = !meta || meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1
  const to = meta ? Math.min(meta.current_page * meta.per_page, meta.total) : products.length

  const attentionGroups: Array<[keyof typeof attention, string]> = [
    ['negative', 'Negative Stock'],
    ['out_of_stock', 'Out of Stock'],
    ['low_stock', 'Low Stock'],
  ]

  return (
    <ReportLayout
      title="Stock Report"
      subtitle="Inventory intelligence — levels, movement, valuation & attention"
      icon={<Package className="size-5 text-primary" />}
      toolbar={
        <ReportToolbar
          onPrint={handlePrint}
          onRefresh={handleRefresh}
          csvExportUrl={filterUrl('/reports/stock/export/csv')}
          excelExportUrl={filterUrl('/reports/stock/export/excel')}
          pdfExportUrl={filterUrl('/reports/share/stock', { format: 'pdf' })}
          shareUrl="/reports/share/stock"
          reportTitle="Stock Report"
          currentFilters={{
            search,
            category_id: category === 'all' ? '' : category,
            status: status === 'all' ? '' : status,
            date_from: dateFrom,
            date_to: dateTo,
          }}
        />
      }
    >
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product, SKU or barcode..."
            className="w-full h-9 pl-8 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30">
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30">
          <option value="all">All statuses</option>
          <option value="in-stock">In Stock</option>
          <option value="low-stock">Low Stock</option>
          <option value="out-of-stock">Out of Stock</option>
          <option value="negative">Negative Stock</option>
        </select>
        <div className="flex items-center gap-1">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 flex-1 min-w-0 rounded-lg border border-input bg-background px-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30" title="From date" />
          <span className="text-muted-foreground text-xs">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="h-9 flex-1 min-w-0 rounded-lg border border-input bg-background px-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30" title="To date" />
        </div>
      </div>

      {/* Results count */}
      <div className="text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{meta ? `${from}–${to}` : products.length}</span> of {meta?.total ?? products.length} products
        {report.period && (
          <span className="ml-2">
            · Movement period: {new Date(report.period.from).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} — {new Date(report.period.to).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>

      {/* Summary cards */}
      <SummaryCards cards={cards} columns={6} />

      {/* Attention */}
      {attentionGroups.some(([k]) => attention[k].length > 0) && (
        <Section title="Needs Attention" icon={<AlertTriangle className="size-4 text-amber-500" />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {attentionGroups.map(([key, label]) => {
              const rows = attention[key]
              if (rows.length === 0) return null
              return (
                <div key={key}>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{label}</div>
                  <ul className="space-y-1.5">
                    {rows.map((a) => (
                      <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate" title={a.name}>{a.name}</span>
                        <span className={cn('tabular-nums shrink-0', a.stock_quantity < 0 ? 'text-red-600 font-medium' : 'text-muted-foreground')}>
                          {fmt(a.stock_quantity)} {a.unit || ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* Movement + valuation side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {movement && (
          <Section title="Stock Movement" icon={<Layers className="size-4 text-primary" />}>
            <MovementTable movement={movement} />
          </Section>
        )}
        {valuation.rows.length > 0 && (
          <Section title="Stock Valuation" icon={<ClipboardList className="size-4 text-primary" />}>
            <p className="text-xs text-muted-foreground mb-3">{valuation.method}</p>
            <div className="text-2xl font-bold text-foreground mb-4">{formatCurrency(valuation.total_value)}</div>
            <div className="space-y-2">
              {valuation.rows.map((v) => (
                <div key={`${v.product}-${v.sku}`} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate" title={v.product}>{v.product}</span>
                  <span className="text-muted-foreground shrink-0">{fmt(v.quantity)} {v.unit || ''} × {formatCurrencyShort(v.cost)}</span>
                  <span className="tabular-nums font-medium shrink-0">{formatCurrency(v.value)}</span>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Top selling + most returned */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {topSelling.length > 0 && (
          <Section title="Top Selling Products" icon={<TrendingUp className="size-4 text-emerald-600" />}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-muted-foreground uppercase tracking-wider border-b border-border">
                  <th className="text-left font-medium pb-2">Product</th>
                  <th className="text-right font-medium pb-2">Qty</th>
                  <th className="text-right font-medium pb-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topSelling.map((t) => (
                  <tr key={t.product_id} className="border-b border-border last:border-0">
                    <td className="py-2 truncate max-w-[220px]" title={t.product_name}>{t.product_name}</td>
                    <td className="py-2 text-right tabular-nums">{fmt(t.qty)}</td>
                    <td className="py-2 text-right tabular-nums font-medium">{formatCurrency(t.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}
        {mostReturned.length > 0 && (
          <Section title="Most Returned Products" icon={<Undo2 className="size-4 text-amber-600" />}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-muted-foreground uppercase tracking-wider border-b border-border">
                  <th className="text-left font-medium pb-2">Product</th>
                  <th className="text-right font-medium pb-2">Qty</th>
                  <th className="text-right font-medium pb-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {mostReturned.map((m) => (
                  <tr key={m.product_id} className="border-b border-border last:border-0">
                    <td className="py-2 truncate max-w-[220px]" title={m.product_name}>{m.product_name}</td>
                    <td className="py-2 text-right tabular-nums">{fmt(m.qty)}</td>
                    <td className="py-2 text-right tabular-nums font-medium">{formatCurrency(m.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}
      </div>

      {/* By category */}
      {byCategory.length > 0 && (
        <Section title="Inventory by Category" icon={<Layers className="size-4 text-primary" />}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {byCategory.map((cat) => (
              <div key={cat.category} className="rounded-lg border border-border bg-muted/40 p-3">
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider truncate" title={cat.category}>{cat.category}</div>
                <div className="text-sm font-semibold text-foreground mt-1">{cat.products} products</div>
                <div className="text-xs text-muted-foreground mt-0.5">{formatCurrency(cat.value)}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Product table */}
      <Section title="Products" icon={<Package className="size-4 text-primary" />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-[11px] text-muted-foreground uppercase tracking-wider border-b-2 border-foreground/80">
                <th className="text-left font-semibold py-2 w-[24%]">Product</th>
                <th className="text-left font-semibold py-2 w-[12%]">SKU</th>
                <th className="text-left font-semibold py-2 w-[14%]">Category</th>
                <th className="text-right font-semibold py-2 w-[9%]">Stock</th>
                <th className="text-right font-semibold py-2 w-[9%]">Sold</th>
                <th className="text-right font-semibold py-2 w-[10%]">Purchased</th>
                <th className="text-right font-semibold py-2 w-[13%]">Value</th>
                <th className="text-center font-semibold py-2 w-[9%]">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">No products found.</td></tr>
              ) : products.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                  <td className="py-2 pr-2">
                    <div className="font-medium truncate" title={p.name}>{p.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{p.category || '—'}</div>
                  </td>
                  <td className="py-2"><code className="text-[11px] font-mono bg-muted px-1 py-0.5 rounded">{p.sku || '—'}</code></td>
                  <td className="py-2 text-xs text-muted-foreground truncate max-w-[120px]" title={p.category || ''}>{p.category || '—'}</td>
                  <td className="py-2 text-right tabular-nums font-semibold">{fmt(p.stock_quantity)}</td>
                  <td className="py-2 text-right tabular-nums text-muted-foreground">{fmt(p.sold)}</td>
                  <td className="py-2 text-right tabular-nums text-muted-foreground">{fmt(p.purchased)}</td>
                  <td className="py-2 text-right tabular-nums">{formatCurrency(p.value)}</td>
                  <td className="py-2 text-center"><StatusBadge status={p.status} kind="stock" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="whitespace-nowrap">Rows / page:</span>
            <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}
              className="h-8 rounded-lg border border-input bg-background px-2 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/30">
              {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => fetchPage(meta.current_page - 1)} disabled={meta.current_page <= 1}
              className="inline-flex items-center gap-1 px-2.5 h-8 rounded-lg border border-input text-xs font-medium hover:bg-muted transition-colors disabled:opacity-40 cursor-pointer">
              <ChevronLeft className="size-4" /> Prev
            </button>
            {pageWindow(meta.current_page, meta.last_page).map((p, i) =>
              p === '…' ? (
                <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-muted-foreground">…</span>
              ) : (
                <button key={p} onClick={() => fetchPage(p)}
                  className={cn('min-w-8 h-8 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                    p === meta.current_page ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}>
                  {p}
                </button>
              )
            )}
            <button onClick={() => fetchPage(meta.current_page + 1)} disabled={meta.current_page >= meta.last_page}
              className="inline-flex items-center gap-1 px-2.5 h-8 rounded-lg border border-input text-xs font-medium hover:bg-muted transition-colors disabled:opacity-40 cursor-pointer">
              Next <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </ReportLayout>
  )
}
