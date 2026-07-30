import { useMemo } from 'react'
import { usePage } from '@inertiajs/react'
import { AlertTriangle } from 'lucide-react'
import { ReportLayout } from './components/ReportLayout'
import { ReportToolbar } from './components/ReportToolbar'
import { SummaryCards } from './components/SummaryCards'
import { ReportTable, type ColumnDef } from './components/ReportTable'
import { StatusBadge } from './components/StatusBadge'
import { formatCurrency } from '@/lib/format'

interface LowStockRow {
  id: number
  name: string
  sku: string
  stock_quantity: number
  low_stock_threshold: number
  status: string
  category?: { id: number; name: string }
}

export default function LowStockReportPage() {
  const { props } = usePage()
  const report = (props as any).report || { products: [], meta: null }
  const products: LowStockRow[] = report.products || []

  const cards = useMemo(() => {
    const lowStock = products.filter(p => p.status === 'low-stock')
    const outOfStock = products.filter(p => p.status === 'out-of-stock')
    const totalShortfall = products.reduce((s, p) => s + Math.max(0, (p.low_stock_threshold || 0) - p.stock_quantity), 0)
    return [
      { label: 'Products to Reorder', value: String(products.length), negative: products.length > 0 },
      { label: 'Low Stock', value: String(lowStock.length), negative: lowStock.length > 0 },
      { label: 'Out of Stock', value: String(outOfStock.length), negative: outOfStock.length > 0 },
      { label: 'Total Shortfall', value: totalShortfall.toLocaleString(), negative: totalShortfall > 0 },
    ]
  }, [products])

  const columns: ColumnDef<LowStockRow>[] = [
    {
      key: 'name',
      header: 'Product',
      render: (r) => <span className="font-medium">{r.name}</span>,
      sortable: true,
      sortValue: (r) => r.name,
    },
    {
      key: 'sku',
      header: 'SKU',
      render: (r) => <code className="text-[11px] font-mono bg-muted px-1 py-0.5 rounded">{r.sku || '—'}</code>,
    },
    {
      key: 'category',
      header: 'Category',
      render: (r) => <span className="text-xs text-muted-foreground">{r.category?.name || '—'}</span>,
      sortable: true,
      sortValue: (r) => r.category?.name || '',
    },
    {
      key: 'stock_quantity',
      header: 'In Stock',
      render: (r) => (
        <span className={`text-sm font-semibold tabular-nums ${r.stock_quantity <= 0 ? 'text-red-500' : r.stock_quantity <= (r.low_stock_threshold || 0) ? 'text-amber-500' : 'text-foreground'}`}>
          {r.stock_quantity.toLocaleString()}
        </span>
      ),
      className: 'text-right',
      sortable: true,
    },
    {
      key: 'low_stock_threshold',
      header: 'Threshold',
      render: (r) => <span className="text-sm text-muted-foreground tabular-nums">{(r.low_stock_threshold || 0).toLocaleString()}</span>,
      className: 'text-right',
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} kind="stock" />,
      sortable: true,
    },
    {
      key: 'shortfall',
      header: 'Shortfall',
      render: (r) => {
        const shortfall = Math.max(0, (r.low_stock_threshold || 0) - r.stock_quantity)
        return shortfall > 0
          ? <span className="text-sm font-semibold text-red-500 tabular-nums">{shortfall.toLocaleString()}</span>
          : <span className="text-xs text-muted-foreground">—</span>
      },
      className: 'text-right',
    },
  ]

  return (
    <ReportLayout
      title="Low Stock Report"
      subtitle="Products that need reordering — below or at their minimum stock threshold"
      icon={<AlertTriangle className="size-5 text-primary" />}
      toolbar={<ReportToolbar csvExportUrl="/reports/stock/low-stock/export/csv" onPrint={() => window.print()} />}
    >
      <SummaryCards cards={cards} />
      <ReportTable
        columns={columns}
        data={products}
        keyExtractor={(r) => String(r.id)}
        pageSize={25}
        searchable
        searchPlaceholder="Search by product name or SKU..."
        onSearch={(data, q) =>
          data.filter((r) =>
            r.name.toLowerCase().includes(q) ||
            (r.sku || '').toLowerCase().includes(q)
          )
        }
        emptyMessage="All products are adequately stocked. No reorder alerts."
      />
    </ReportLayout>
  )
}
