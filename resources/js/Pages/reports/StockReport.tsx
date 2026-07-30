import { useMemo } from 'react'
import { usePage } from '@inertiajs/react'
import { Package } from 'lucide-react'
import { ReportLayout } from './components/ReportLayout'
import { ReportToolbar } from './components/ReportToolbar'
import { SummaryCards } from './components/SummaryCards'
import { ReportTable, type ColumnDef } from './components/ReportTable'
import { StatusBadge } from './components/StatusBadge'
import { formatCurrency } from '@/lib/format'

interface ProductRow {
  id: number
  name: string
  sku: string
  category?: { id: number; name: string }
  stock_quantity: number
  low_stock_threshold: number
  status: string
}

interface BackendReport {
  products: ProductRow[]
  summary: {
    total_products: number
    total_stock: number
    low_stock: number
    out_of_stock: number
    total_value: number
  }
  by_category: { category: string; products: number; value: number }[]
}

export default function StockReportPage() {
  const { props } = usePage()
  const report = (props as any).report as BackendReport | undefined
  const products = report?.products || []
  const summary = report?.summary || { total_products: 0, total_stock: 0, low_stock: 0, out_of_stock: 0, total_value: 0 }
  const byCategory = report?.by_category || []

  const cards = useMemo(() => [
    { label: 'Total Products', value: String(summary.total_products) },
    { label: 'Total Stock', value: summary.total_stock.toLocaleString() },
    { label: 'Inventory Value', value: formatCurrency(summary.total_value), positive: true },
    { label: 'Low Stock', value: String(summary.low_stock), negative: summary.low_stock > 0 },
    { label: 'Out of Stock', value: String(summary.out_of_stock), negative: summary.out_of_stock > 0 },
  ], [summary])

  const columns: ColumnDef<ProductRow>[] = [
    { key: 'name', header: 'Product', render: (r) => <span className="font-medium">{r.name}</span>, sortable: true, sortValue: (r) => r.name },
    { key: 'sku', header: 'SKU', render: (r) => <code className="text-[11px] font-mono bg-muted px-1 py-0.5 rounded">{r.sku || '—'}</code> },
    { key: 'category', header: 'Category', render: (r) => <span className="text-xs text-muted-foreground">{r.category?.name || '—'}</span>, sortable: true, sortValue: (r) => r.category?.name || '' },
    { key: 'stock', header: 'Stock', render: (r) => r.stock_quantity.toLocaleString(), className: 'text-right font-semibold', sortable: true, sortValue: (r) => r.stock_quantity },
    { key: 'threshold', header: 'Threshold', render: (r) => (r.low_stock_threshold || 0).toLocaleString(), className: 'text-right text-muted-foreground' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} kind="stock" />, sortable: true, sortValue: (r) => r.status },
  ]

  return (
    <ReportLayout
      title="Stock Summary"
      subtitle="Current inventory levels and valuation by category"
      icon={<Package className="size-5 text-primary" />}
      toolbar={<ReportToolbar
        csvExportUrl="/reports/stock/export/csv"
        shareUrl="/reports/share/stock"
        reportTitle="Stock Report"
        onPrint={() => window.print()}
      />}
    >
      <SummaryCards cards={cards} />

      {byCategory.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {byCategory.map((cat) => (
            <div key={cat.category} className="rounded-xl border border-border bg-card p-3">
              <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{cat.category}</div>
              <div className="text-sm font-semibold text-foreground mt-1">{cat.products} products</div>
              <div className="text-xs text-muted-foreground mt-0.5">{formatCurrency(cat.value)}</div>
            </div>
          ))}
        </div>
      )}

      <ReportTable
        columns={columns}
        data={products}
        keyExtractor={(r) => String(r.id)}
        pageSize={25}
        searchable
        searchPlaceholder="Search by product name or SKU..."
        onSearch={(data, q) =>
          data.filter((r) =>
            r.name.toLowerCase().includes(q) || (r.sku || '').toLowerCase().includes(q)
          )
        }
        emptyMessage="No products found."
      />
    </ReportLayout>
  )
}
