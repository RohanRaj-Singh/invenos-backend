import { useMemo } from 'react'
import { usePage } from '@inertiajs/react'
import { ClipboardList } from 'lucide-react'
import { ReportLayout } from './components/ReportLayout'
import { ReportToolbar } from './components/ReportToolbar'
import { SummaryCards } from './components/SummaryCards'
import { ReportTable, type ColumnDef } from './components/ReportTable'
import { formatCurrency, formatDate } from '@/lib/format'

interface StockLedgerRow {
  id: number
  date: string
  type: string
  product_name: string
  quantity: number
  running_balance: number
  reference: string
  user: string
  notes: string
}

export default function StockLedgerPage() {
  const { props } = usePage()
  const report = (props as any).report || { movements: [], meta: null }
  const filters = (props as any).filters || {}
  const movements: StockLedgerRow[] = report.movements || []

  const cards = useMemo(() => {
    const totalIn = movements.filter(m => m.quantity > 0).reduce((s, m) => s + m.quantity, 0)
    const totalOut = movements.filter(m => m.quantity < 0).reduce((s, m) => s + Math.abs(m.quantity), 0)
    const types = new Set(movements.map(m => m.type))
    return [
      { label: 'Total Movements', value: String(movements.length) },
      { label: 'Stock In', value: totalIn.toLocaleString(), positive: true },
      { label: 'Stock Out', value: totalOut.toLocaleString(), negative: totalOut > 0 },
      { label: 'Transaction Types', value: String(types.size) },
    ]
  }, [movements])

  const columns: ColumnDef<StockLedgerRow>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (r) => <span className="text-xs font-medium">{formatDate(r.date) || '—'}</span>,
      sortable: true,
      sortValue: (r) => r.date,
    },
    {
      key: 'product_name',
      header: 'Product',
      render: (r) => <span className="font-medium">{r.product_name || '—'}</span>,
      sortable: true,
      sortValue: (r) => r.product_name,
    },
    {
      key: 'type',
      header: 'Type',
      render: (r) => {
        const colors: Record<string, string> = {
          'purchase': 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30',
          'sale': 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
          'sale-return': 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
          'purchase-return': 'text-red-600 bg-red-50 dark:bg-red-950/30',
          'adjustment': 'text-purple-600 bg-purple-50 dark:bg-purple-950/30',
        }
        const cls = colors[r.type] || 'text-muted-foreground bg-muted/50'
        return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${cls}`}>{r.type}</span>
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
      sortValue: (r) => r.quantity,
    },
    {
      key: 'running_balance',
      header: 'Balance',
      render: (r) => <span className="text-sm font-semibold tabular-nums">{r.running_balance.toLocaleString()}</span>,
      className: 'text-right',
      sortable: true,
      sortValue: (r) => r.running_balance,
    },
    {
      key: 'reference',
      header: 'Reference',
      render: (r) => <code className="text-[10px] font-mono bg-muted px-1 py-0.5 rounded">{r.reference || '—'}</code>,
    },
  ]

  return (
    <ReportLayout
      title="Stock Ledger"
      subtitle="All inventory movements in chronological order"
      icon={<ClipboardList className="size-5 text-primary" />}
      toolbar={<ReportToolbar csvExportUrl="/reports/stock/ledger/export/csv" onPrint={() => window.print()} />}
    >
      <SummaryCards cards={cards} />
      <ReportTable
        columns={columns}
        data={movements}
        keyExtractor={(r) => String(r.id)}
        pageSize={25}
        searchable
        searchPlaceholder="Search by product or reference..."
        onSearch={(data, q) =>
          data.filter((r) =>
            (r.product_name || '').toLowerCase().includes(q) ||
            (r.reference || '').toLowerCase().includes(q)
          )
        }
        emptyMessage="No stock movements found for the selected filters."
      />
    </ReportLayout>
  )
}
