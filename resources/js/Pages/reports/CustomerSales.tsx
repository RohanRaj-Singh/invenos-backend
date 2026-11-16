import { useMemo } from 'react'
import { usePage } from '@inertiajs/react'
import { Users } from 'lucide-react'
import { ReportLayout } from './components/ReportLayout'
import { ReportToolbar } from './components/ReportToolbar'
import { ReportTable, type ColumnDef } from './components/ReportTable'
import { SummaryCards } from './components/SummaryCards'
import { formatCurrency } from '@/lib/format'

interface CustomerSalesRow {
  customer_id: number
  customer_name: string
  invoice_count: number
  total_revenue: number
  total_paid: number
  total_discount: number
}

export default function CustomerSalesPage() {
  const { props } = usePage()
  const report = (props as any).report || {}
  const rows: CustomerSalesRow[] = report.rows || []

  const cards = useMemo(() => {
    const revenue = rows.reduce((s, r) => s + Number(r.total_revenue || 0), 0)
    const paid = rows.reduce((s, r) => s + Number(r.total_paid || 0), 0)
    const invoices = rows.reduce((s, r) => s + Number(r.invoice_count || 0), 0)
    return [
      { label: 'Customers', value: String(rows.length) },
      { label: 'Invoices', value: String(invoices) },
      { label: 'Revenue', value: formatCurrency(revenue), positive: revenue > 0 },
      { label: 'Outstanding', value: formatCurrency(Math.max(0, revenue - paid)), negative: revenue - paid > 0.01 },
    ]
  }, [rows])

  const columns: ColumnDef<CustomerSalesRow>[] = [
    {
      key: 'customer_name',
      header: 'Customer',
      render: (r) => <span className="font-medium">{r.customer_name || 'Walk-in Customer'}</span>,
      sortable: true,
      sortValue: (r) => r.customer_name || '',
    },
    {
      key: 'invoice_count',
      header: 'Invoices',
      render: (r) => <span className="tabular-nums">{Number(r.invoice_count).toLocaleString()}</span>,
      className: 'text-right',
      sortable: true,
      sortValue: (r) => Number(r.invoice_count),
    },
    {
      key: 'total_discount',
      header: 'Discount',
      render: (r) => <span className="tabular-nums text-muted-foreground">{formatCurrency(Number(r.total_discount || 0))}</span>,
      className: 'text-right',
      sortable: true,
      sortValue: (r) => Number(r.total_discount || 0),
    },
    {
      key: 'total_revenue',
      header: 'Revenue',
      render: (r) => <span className="font-semibold tabular-nums">{formatCurrency(Number(r.total_revenue || 0))}</span>,
      className: 'text-right',
      sortable: true,
      sortValue: (r) => Number(r.total_revenue || 0),
    },
    {
      key: 'total_paid',
      header: 'Paid',
      render: (r) => <span className="tabular-nums">{formatCurrency(Number(r.total_paid || 0))}</span>,
      className: 'text-right',
      sortable: true,
      sortValue: (r) => Number(r.total_paid || 0),
    },
    {
      key: 'balance',
      header: 'Balance',
      render: (r) => {
        const balance = Number(r.total_revenue || 0) - Number(r.total_paid || 0)
        return (
          <span className={`tabular-nums ${balance > 0.01 ? 'font-semibold text-red-500' : 'text-muted-foreground'}`}>
            {formatCurrency(balance)}
          </span>
        )
      },
      className: 'text-right',
    },
  ]

  return (
    <ReportLayout
      title="Sales by Customer"
      subtitle="Revenue and settlement grouped by customer"
      icon={<Users className="size-5 text-primary" />}
      toolbar={<ReportToolbar onPrint={() => window.print()} />}
    >
      <SummaryCards cards={cards} />
      <ReportTable
        columns={columns}
        data={rows}
        keyExtractor={(r) => String(r.customer_id)}
        pageSize={25}
        searchable
        searchPlaceholder="Search by customer..."
        onSearch={(data, q) => data.filter((r) => (r.customer_name || '').toLowerCase().includes(q))}
        emptyMessage="No customer sales found for the selected filters."
      />
    </ReportLayout>
  )
}
