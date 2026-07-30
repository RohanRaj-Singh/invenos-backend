import { useMemo } from 'react'
import { usePage } from '@inertiajs/react'
import { Building2 } from 'lucide-react'
import { ReportLayout } from './components/ReportLayout'
import { ReportToolbar } from './components/ReportToolbar'
import { ReportTable, type ColumnDef } from './components/ReportTable'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

interface LedgerRow {
  date: string
  type: string
  ref: string
  description: string
  debit: number
  credit: number
  balance: number
}

export default function SupplierLedgerPage() {
  const { props } = usePage()
  const report = (props as any).report || { contact: null, rows: [] }
  const contact = report.contact
  const rows: LedgerRow[] = report.rows || []

  const closingBalance = rows.length > 0 ? rows[rows.length - 1].balance : 0

  const totals = useMemo(() => {
    const totalDebit = rows.reduce((s, r) => s + r.debit, 0)
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0)
    return { totalDebit, totalCredit }
  }, [rows])

  const columns: ColumnDef<LedgerRow>[] = [
    { key: 'date', header: 'Date', render: (r) => <span className="text-xs font-medium">{formatDate(r.date)}</span>, sortable: true },
    { key: 'type', header: 'Type', render: (r) => {
      const colors: Record<string, string> = {
        'Purchase': 'text-red-600 bg-red-50 dark:bg-red-950/30',
        'Purchase Return': 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30',
        'Payment': 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
      }
      return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${colors[r.type] || 'text-muted-foreground bg-muted/50'}`}>{r.type}</span>
    }},
    { key: 'ref', header: 'Ref', render: (r) => <code className="text-[10px] font-mono bg-muted px-1 py-0.5 rounded">{r.ref}</code> },
    { key: 'description', header: 'Description', render: (r) => <span className="text-xs text-muted-foreground">{r.description}</span> },
    { key: 'debit', header: 'Debit', render: (r) => r.debit > 0 ? <span className="text-sm font-semibold text-red-500 tabular-nums">{formatCurrency(r.debit)}</span> : <span className="text-xs text-muted-foreground">—</span>, className: 'text-right' },
    { key: 'credit', header: 'Credit', render: (r) => r.credit > 0 ? <span className="text-sm font-semibold text-emerald-600 tabular-nums">{formatCurrency(r.credit)}</span> : <span className="text-xs text-muted-foreground">—</span>, className: 'text-right' },
    { key: 'balance', header: 'Balance', render: (r) => (
      <span className={cn('text-sm font-bold tabular-nums', r.balance > 0 ? 'text-red-500' : 'text-emerald-600')}>{formatCurrency(Math.abs(r.balance))}</span>
    ), className: 'text-right', sortable: true, sortValue: (r) => r.balance },
  ]

  if (!contact) {
    return (
      <ReportLayout title="Supplier Ledger" subtitle="Select a supplier to view their financial statement" icon={<Building2 className="size-5 text-primary" />}>
        <div className="text-center py-24 text-sm text-muted-foreground">
          <Building2 className="size-12 mx-auto mb-3 text-muted-foreground/20" />
          <p>No supplier selected. Navigate from a supplier profile or use the contact filter.</p>
        </div>
      </ReportLayout>
    )
  }

  return (
    <ReportLayout
      title={contact.name}
      subtitle={`Phone: ${contact.phone || '—'} · Supplier Ledger — All financial activity`}
      icon={<Building2 className="size-5 text-primary" />}
      toolbar={<ReportToolbar onPrint={() => window.print()} />}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Opening Balance</div>
          <div className="text-lg font-bold text-foreground mt-1 tabular-nums">Rs. 0</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Total Purchases</div>
          <div className="text-lg font-bold text-red-500 mt-1 tabular-nums">{formatCurrency(totals.totalDebit)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Total Payments</div>
          <div className="text-lg font-bold text-emerald-600 mt-1 tabular-nums">{formatCurrency(totals.totalCredit)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Closing Balance</div>
          <div className={cn('text-lg font-bold mt-1 tabular-nums', closingBalance > 0 ? 'text-red-500' : 'text-emerald-600')}>
            {formatCurrency(Math.abs(closingBalance))}
            {closingBalance > 0 ? ' (Payable)' : closingBalance < 0 ? ' (Credit)' : ''}
          </div>
        </div>
      </div>

      <ReportTable
        columns={columns}
        data={rows}
        keyExtractor={(r) => `${r.date}-${r.ref}`}
        pageSize={30}
        searchable
        searchPlaceholder="Search by reference or description..."
        onSearch={(data, q) =>
          data.filter((r) =>
            r.ref.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q) ||
            r.type.toLowerCase().includes(q)
          )
        }
        emptyMessage="No transactions found for this supplier in the selected period."
      />
    </ReportLayout>
  )
}
