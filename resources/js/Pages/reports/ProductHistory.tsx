import { useMemo } from 'react'
import { usePage } from '@inertiajs/react'
import { Package, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { ReportLayout } from './components/ReportLayout'
import { ReportToolbar } from './components/ReportToolbar'
import { SummaryCards } from './components/SummaryCards'
import { ReportTable, type ColumnDef } from './components/ReportTable'
import { formatCurrency, formatDate } from '@/lib/format'

interface MovementRow {
  id: number
  date: string
  type: string
  quantity: number
  running_balance: number
  reference: string
  notes: string
  user: string
}

export default function ProductHistoryPage() {
  const { props } = usePage()
  const report = (props as any).report || { product: null, movements: [], summary: {} }
  const filters = (props as any).filters || {}
  const product = report.product
  const summary = report.summary || {}
  const movements: MovementRow[] = report.movements || []

  const cards = useMemo(() => [
    { label: 'Current Stock', value: (summary.current_stock || 0).toLocaleString() },
    { label: 'Stock Value', value: formatCurrency(summary.stock_value || 0), positive: true },
    { label: 'Purchased', value: (summary.total_purchased || 0).toLocaleString(), positive: true },
    { label: 'Sold', value: (summary.total_sold || 0).toLocaleString(), negative: true },
    { label: 'Sale Returns', value: (summary.total_sale_returned || 0).toLocaleString(), positive: true },
    { label: 'Purchase Returns', value: (summary.total_purchase_returned || 0).toLocaleString(), negative: true },
  ], [summary])

  const columns: ColumnDef<MovementRow>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (r) => <span className="text-xs font-medium">{formatDate(r.date) || '—'}</span>,
      sortable: true,
    },
    {
      key: 'type',
      header: 'Type',
      render: (r) => {
        const config: Record<string, { label: string; icon: typeof TrendingUp; cls: string }> = {
          'purchase': { label: 'Purchase', icon: TrendingUp, cls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
          'sale': { label: 'Sale', icon: TrendingDown, cls: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' },
          'sale-return': { label: 'Sale Return', icon: TrendingUp, cls: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
          'purchase-return': { label: 'Purchase Return', icon: TrendingDown, cls: 'text-red-600 bg-red-50 dark:bg-red-950/30' },
          'adjustment': { label: 'Adjustment', icon: Minus, cls: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30' },
        }
        const cfg = config[r.type] || { label: r.type, icon: Minus, cls: 'text-muted-foreground bg-muted/50' }
        const Icon = cfg.icon
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${cfg.cls}`}>
            <Icon className="size-3" /> {cfg.label}
          </span>
        )
      },
    },
    {
      key: 'quantity',
      header: 'Qty',
      render: (r) => (
        <span className={`text-sm font-semibold tabular-nums ${r.quantity > 0 ? 'text-emerald-600' : r.quantity < 0 ? 'text-red-500' : ''}`}>
          {r.quantity > 0 ? '+' : ''}{r.quantity.toLocaleString()}
        </span>
      ),
      className: 'text-right',
      sortable: true,
    },
    {
      key: 'running_balance',
      header: 'Balance',
      render: (r) => <span className="text-sm font-semibold tabular-nums">{r.running_balance.toLocaleString()}</span>,
      className: 'text-right',
      sortable: true,
    },
    {
      key: 'reference',
      header: 'Ref',
      render: (r) => <code className="text-[10px] font-mono bg-muted px-1 py-0.5 rounded">{r.reference || '—'}</code>,
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (r) => <span className="text-xs text-muted-foreground">{r.notes || '—'}</span>,
    },
  ]

  if (!product) {
    return (
      <ReportLayout title="Product History" subtitle="Select a product to view its inventory timeline" icon={<Package className="size-5 text-primary" />}>
        <div className="text-center py-24 text-sm text-muted-foreground">
          <Package className="size-12 mx-auto mb-3 text-muted-foreground/20" />
          <p>No product selected. Use the product filter above or navigate from a product detail page.</p>
        </div>
      </ReportLayout>
    )
  }

  return (
    <ReportLayout
      title={product.name || `Product #${product.id}`}
      subtitle={`SKU: ${product.sku || '—'} · Category: ${product.category?.name || 'Uncategorized'} · Complete inventory timeline`}
      icon={<Package className="size-5 text-primary" />}
      toolbar={<ReportToolbar onPrint={() => window.print()} />}
    >
      <SummaryCards cards={cards} />

      {/* Mini visual timeline header */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
          <span>Opening →</span>
          <span className="flex items-center gap-1 text-emerald-600 font-medium"><TrendingUp className="size-3" /> +{summary.total_purchased || 0} Purchased</span>
          {summary.total_purchase_returned > 0 && (
            <span className="flex items-center gap-1 text-red-500 font-medium"><TrendingDown className="size-3" /> -{summary.total_purchase_returned} Purch Returns</span>
          )}
          <span className="flex items-center gap-1 text-blue-600 font-medium"><TrendingDown className="size-3" /> -{summary.total_sold || 0} Sold</span>
          {summary.total_sale_returned > 0 && (
            <span className="flex items-center gap-1 text-amber-600 font-medium"><TrendingUp className="size-3" /> +{summary.total_sale_returned} Sale Returns</span>
          )}
          {summary.total_adjusted !== 0 && (
            <span className="flex items-center gap-1 text-purple-600 font-medium"><Minus className="size-3" /> {summary.total_adjusted > 0 ? '+' : ''}{summary.total_adjusted} Adjusted</span>
          )}
          <span className="font-bold text-foreground">= {summary.current_stock || 0} Current</span>
        </div>
      </div>

      <ReportTable
        columns={columns}
        data={movements}
        keyExtractor={(r) => String(r.id)}
        pageSize={25}
        searchable
        searchPlaceholder="Search by reference or notes..."
        onSearch={(data, q) =>
          data.filter((r) =>
            (r.reference || '').toLowerCase().includes(q) ||
            (r.notes || '').toLowerCase().includes(q)
          )
        }
        emptyMessage="No inventory movements found for this product."
      />
    </ReportLayout>
  )
}
