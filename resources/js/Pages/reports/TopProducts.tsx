import { useMemo } from 'react'
import { usePage } from '@inertiajs/react'
import { TrendingUp } from 'lucide-react'
import { ReportLayout } from './components/ReportLayout'
import { ReportToolbar } from './components/ReportToolbar'
import { ReportTable, type ColumnDef } from './components/ReportTable'
import { SummaryCards } from './components/SummaryCards'
import { formatCurrency } from '@/lib/format'

interface TopProductRow {
  product_id: number
  product_name: string
  total_qty: number
  total_revenue: number
  invoice_count: number
}

export default function TopProductsPage() {
  const { props } = usePage()
  const report = (props as any).report || {}
  const rows: TopProductRow[] = report.products || []

  const cards = useMemo(() => {
    const revenue = rows.reduce((s, r) => s + Number(r.total_revenue || 0), 0)
    const qty = rows.reduce((s, r) => s + Number(r.total_qty || 0), 0)
    return [
      { label: 'Products', value: String(rows.length) },
      { label: 'Units Sold', value: qty.toLocaleString() },
      { label: 'Revenue', value: formatCurrency(revenue), positive: revenue > 0 },
      {
        label: 'Best Seller',
        value: rows.length > 0 ? rows[0].product_name : '—',
      },
    ]
  }, [rows])

  const columns: ColumnDef<TopProductRow>[] = [
    {
      key: 'product_name',
      header: 'Product',
      render: (r) => <span className="font-medium">{r.product_name || '—'}</span>,
      sortable: true,
      sortValue: (r) => r.product_name || '',
    },
    {
      key: 'total_qty',
      header: 'Qty Sold',
      render: (r) => <span className="tabular-nums">{Number(r.total_qty || 0).toLocaleString()}</span>,
      className: 'text-right',
      sortable: true,
      sortValue: (r) => Number(r.total_qty || 0),
    },
    {
      key: 'invoice_count',
      header: 'Invoices',
      render: (r) => <span className="tabular-nums text-muted-foreground">{Number(r.invoice_count || 0).toLocaleString()}</span>,
      className: 'text-right',
      sortable: true,
      sortValue: (r) => Number(r.invoice_count || 0),
    },
    {
      key: 'total_revenue',
      header: 'Revenue',
      render: (r) => <span className="font-semibold tabular-nums">{formatCurrency(Number(r.total_revenue || 0))}</span>,
      className: 'text-right',
      sortable: true,
      sortValue: (r) => Number(r.total_revenue || 0),
    },
  ]

  return (
    <ReportLayout
      title="Top Products"
      subtitle="Best selling products by revenue in the selected period"
      icon={<TrendingUp className="size-5 text-primary" />}
      toolbar={<ReportToolbar onPrint={() => window.print()} />}
    >
      <SummaryCards cards={cards} />
      <ReportTable
        columns={columns}
        data={rows}
        keyExtractor={(r) => String(r.product_id)}
        pageSize={25}
        searchable
        searchPlaceholder="Search by product..."
        onSearch={(data, q) => data.filter((r) => (r.product_name || '').toLowerCase().includes(q))}
        emptyMessage="No product sales found for the selected filters."
      />
    </ReportLayout>
  )
}
