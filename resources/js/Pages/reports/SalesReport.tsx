import { useMemo, useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import { ShoppingCart, TrendingUp, Package, Users } from 'lucide-react'
import { ReportLayout } from './components/ReportLayout'
import { ReportToolbar } from './components/ReportToolbar'
import { DateFilter, type DatePreset, getDateRange } from './components/DateFilter'
import { SummaryCards, type SummaryCardDef } from './components/SummaryCards'
import { ReportTable, type ColumnDef } from './components/ReportTable'
import { StatusBadge } from './components/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

interface SaleRow {
  id: number
  invoice_number: string
  date: string
  customer?: { id: number; name: string }
  customer_name: string
  items_count?: number
  grand_total: number
  amount_paid: number
  payment_status: string
}

interface TopProduct {
  product_name: string
  total_qty: number
  total_revenue: number
  invoice_count: number
}

interface CustomerRow {
  customer_name: string
  invoice_count: number
  total_revenue: number
  total_paid: number
}

export default function SalesReportPage() {
  const { props } = usePage()
  const report = (props as any).report || { sales: [], meta: null, summary: {} }
  const sales: SaleRow[] = report.sales || []
  const summary = report.summary || {}
  const filters = (props as any).filters || {}

  const [showBreakdown, setShowBreakdown] = useState(false)
  const [topProductsData, setTopProductsData] = useState<TopProduct[]>([])
  const [customerData, setCustomerData] = useState<CustomerRow[]>([])
  const [loadingBreakdown, setLoadingBreakdown] = useState(false)

  const handleDateChange = (preset: string, from: string, to: string) => {
    router.get('/reports/sales', { preset, date_from: from, date_to: to }, { preserveState: true })
  }

  const toggleBreakdown = () => {
    if (showBreakdown) {
      setShowBreakdown(false)
      return
    }
    setShowBreakdown(true)
    setLoadingBreakdown(true)

    // Fetch top products and by-customer data in parallel
    Promise.all([
      fetch(`/reports/sales/top-products?${new URLSearchParams({ date_from: filters.date_from || '', date_to: filters.date_to || '' })}`).then(r => r.json()),
      fetch(`/reports/sales/by-customer?${new URLSearchParams({ date_from: filters.date_from || '', date_to: filters.date_to || '' })}`).then(r => r.json()),
    ]).then(([productsRes, customersRes]) => {
      setTopProductsData(productsRes.report?.products || [])
      setCustomerData(customersRes.report?.rows || [])
    }).finally(() => setLoadingBreakdown(false))
  }

  const cards: SummaryCardDef[] = useMemo(() => [
    { label: 'Total Sales', value: String(summary.total_sales || 0) },
    { label: 'Revenue', value: formatCurrency(summary.total_revenue || 0), positive: true },
    { label: 'Returns', value: formatCurrency(summary.total_returns || 0), negative: (summary.total_returns || 0) > 0 },
    { label: 'Net Revenue', value: formatCurrency(summary.net_revenue || 0), positive: true },
    { label: 'Avg Order', value: formatCurrency(summary.average_order || 0) },
    { label: 'Collected', value: formatCurrency(summary.total_paid || 0), positive: true },
  ], [summary])

  const columns: ColumnDef<SaleRow>[] = [
    { key: 'invoice_number', header: 'Invoice', render: (r) => <span className="font-medium font-mono text-xs">{r.invoice_number}</span>, sortable: true, sortValue: (r) => r.invoice_number },
    { key: 'date', header: 'Date', render: (r) => formatDate(r.date), sortable: true },
    { key: 'customer', header: 'Customer', render: (r) => r.customer?.name || r.customer_name || 'Walk-in', sortable: true, sortValue: (r) => r.customer?.name || r.customer_name || '' },
    { key: 'grand_total', header: 'Total', render: (r) => formatCurrency(r.grand_total), className: 'text-right font-semibold', sortable: true, sortValue: (r) => r.grand_total },
    { key: 'amount_paid', header: 'Paid', render: (r) => <span className="text-emerald-600">{formatCurrency(r.amount_paid)}</span>, className: 'text-right', sortable: true, sortValue: (r) => r.amount_paid },
    { key: 'payment_status', header: 'Status', render: (r) => <StatusBadge status={r.payment_status} /> },
  ]

  const productColumns: ColumnDef<TopProduct>[] = [
    { key: 'product_name', header: 'Product', render: (r) => <span className="font-medium">{r.product_name}</span>, sortable: true, sortValue: (r) => r.product_name },
    { key: 'total_qty', header: 'Qty Sold', render: (r) => r.total_qty.toLocaleString(), className: 'text-right', sortable: true, sortValue: (r) => r.total_qty },
    { key: 'invoice_count', header: 'Invoices', render: (r) => String(r.invoice_count), className: 'text-center' },
    { key: 'total_revenue', header: 'Revenue', render: (r) => formatCurrency(r.total_revenue), className: 'text-right font-semibold', sortable: true, sortValue: (r) => r.total_revenue },
  ]

  const customerColumns: ColumnDef<CustomerRow>[] = [
    { key: 'customer_name', header: 'Customer', render: (r) => <span className="font-medium">{r.customer_name}</span>, sortable: true, sortValue: (r) => r.customer_name },
    { key: 'invoice_count', header: 'Invoices', render: (r) => String(r.invoice_count), className: 'text-center' },
    { key: 'total_revenue', header: 'Revenue', render: (r) => formatCurrency(r.total_revenue), className: 'text-right font-semibold', sortable: true, sortValue: (r) => r.total_revenue },
    { key: 'total_paid', header: 'Collected', render: (r) => formatCurrency(r.total_paid), className: 'text-right', sortable: true, sortValue: (r) => r.total_paid },
  ]

  return (
    <ReportLayout
      title="Sales Register"
      subtitle="All sales transactions with summaries"
      icon={<ShoppingCart className="size-5 text-primary" />}
      toolbar={<ReportToolbar
        csvExportUrl="/reports/sales/export/csv"
        shareUrl="/reports/share/sales"
        reportTitle="Sales Report"
        currentFilters={{ preset: (filters as any).preset || 'thisMonth', date_from: filters.date_from || '', date_to: filters.date_to || '' }}
        onPrint={() => window.print()}
      />}
    >
      {/* Date presets */}
      <DateFilter
        value={(filters as any).preset || 'thisMonth'}
        onChange={handleDateChange}
      />

      <SummaryCards cards={cards} />

      {/* Breakdown toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
            showBreakdown ? 'bg-foreground text-background border-foreground' : 'bg-background text-muted-foreground border-border hover:text-foreground',
          )}
        >
          <TrendingUp className="size-3.5" />
          {showBreakdown ? 'Hide Breakdown' : 'Show Breakdown'}
        </button>
      </div>

      {/* Breakdown sections */}
      {showBreakdown && (
        <div className="space-y-5">
          {/* Top Products */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package className="size-4 text-muted-foreground" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top Products</h3>
            </div>
            {false ? (
              <div className="text-sm text-muted-foreground py-4 text-center">Loading...</div>
            ) : topProductsData.length > 0 ? (
              <ReportTable
                columns={productColumns}
                data={topProductsData}
                keyExtractor={(r) => r.product_name}
                pageSize={10}
                emptyMessage="No product data available."
              />
            ) : (
              <div className="text-sm text-muted-foreground py-4 text-center">No data — try a wider date range.</div>
            )}
          </div>

          {/* By Customer */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="size-4 text-muted-foreground" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">By Customer</h3>
            </div>
            {false ? (
              <div className="text-sm text-muted-foreground py-4 text-center">Loading...</div>
            ) : customerData.length > 0 ? (
              <ReportTable
                columns={customerColumns}
                data={customerData}
                keyExtractor={(r) => r.customer_name}
                pageSize={10}
                emptyMessage="No customer data available."
              />
            ) : (
              <div className="text-sm text-muted-foreground py-4 text-center">No data — try a wider date range.</div>
            )}
          </div>
        </div>
      )}

      <ReportTable
        columns={columns}
        data={sales}
        keyExtractor={(r) => String(r.id)}
        pageSize={25}
        searchable
        searchPlaceholder="Search by invoice or customer..."
        onSearch={(data, q) =>
          data.filter((r) =>
            r.invoice_number.toLowerCase().includes(q) ||
            (r.customer?.name || r.customer_name || '').toLowerCase().includes(q)
          )
        }
        emptyMessage="No sales found in this date range."
      />
    </ReportLayout>
  )
}
