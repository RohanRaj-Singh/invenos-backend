import { usePage } from '@inertiajs/react'
import { Beaker } from 'lucide-react'
import { ReportLayout } from '@/Pages/reports/components/ReportLayout'
import { ReportToolbar } from '@/Pages/reports/components/ReportToolbar'
import { SummaryCards } from '@/Pages/reports/components/SummaryCards'
import { ReportTable, type ColumnDef } from '@/Pages/reports/components/ReportTable'
import { DateRangeFilter } from '@/features/reporting/components/DateRangeFilter'
import { useReportDateRange } from '@/features/reporting/hooks/useReportDateRange'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

interface UsageRow {
  source: 'manufacturing' | 'pos' | 'recovery'
  production_id: number | null
  document_number: string
  date: string
  finished_product_name: string | null
  component_name: string
  unit: string
  actual_quantity: number
  wastage_quantity: number
  unit_cost: number | null
  total_cost: number | null
  cost_basis: string | null
  production_output_quantity: number | null
  production_total_cost: number | null
  production_cost_complete: boolean
  location: string | null
  status: string
}

export default function ComponentUsageReport() {
  const { props } = usePage()
  const report = (props as any).report || { rows: [], summary: {}, by_component: [] }
  const filters = (props as any).filters || {}
  const range = useReportDateRange('/reports/component-usage', filters, { only: ['report', 'filters'] })
  const rows: UsageRow[] = report.rows || []
  const formulaRows = rows.filter((row) => row.source !== 'manufacturing')
  const posRows = formulaRows.filter((row) => row.source === 'pos')
  const recoveryRows = formulaRows.filter((row) => row.source === 'recovery')
  const posQuantity = posRows.reduce((sum, row) => sum + Number(row.actual_quantity || 0), 0)
  const recoveredQuantity = recoveryRows.reduce((sum, row) => sum + Number(row.actual_quantity || 0), 0)
  const netQuantity = posQuantity - recoveredQuantity
  const uncostedLines = formulaRows.filter((row) => row.total_cost == null).length

  const byIngredient = Object.values(formulaRows.reduce<Record<string, {
    key: string
    ingredient: string
    unit: string
    used: number
    recovered: number
    cost: number
    costComplete: boolean
  }>>((groups, row) => {
    const key = `${row.component_name}:${row.unit}`
    const group = groups[key] ?? {
      key,
      ingredient: row.component_name,
      unit: row.unit,
      used: 0,
      recovered: 0,
      cost: 0,
      costComplete: true,
    }

    if (row.source === 'recovery') group.recovered += Number(row.actual_quantity || 0)
    else group.used += Number(row.actual_quantity || 0)

    group.cost += Number(row.total_cost || 0)
    if (row.total_cost == null) group.costComplete = false
    groups[key] = group

    return groups
  }, {})).sort((a, b) => b.used - a.used)

  const aggregateColumns: ColumnDef<(typeof byIngredient)[number]>[] = [
    { key: 'ingredient', header: 'Ingredient', render: (r) => <span className="font-medium">{r.ingredient}</span> },
    { key: 'used', header: 'Formula use', render: (r) => <span className="tabular-nums">{Number(r.used.toFixed(6)).toLocaleString()} {r.unit}</span>, className: 'text-right' },
    { key: 'recovered', header: 'Recovered', render: (r) => <span className="tabular-nums">{Number(r.recovered.toFixed(6)).toLocaleString()} {r.unit}</span>, className: 'text-right' },
    { key: 'net', header: 'Net', render: (r) => <span className="tabular-nums">{Number((r.used - r.recovered).toFixed(6)).toLocaleString()} {r.unit}</span>, className: 'text-right' },
    { key: 'cost', header: 'Cost', render: (r) => r.costComplete ? formatCurrency(r.cost) : <span className="text-amber-600">Incomplete</span>, className: 'text-right' },
  ]

  const columns: ColumnDef<UsageRow>[] = [
    { key: 'date', header: 'Date', render: (r) => formatDate(r.date), sortable: true },
    { key: 'finished_product_name', header: 'Formula', render: (r) => <span className="font-medium">{r.finished_product_name || '—'}</span> },
    { key: 'document_number', header: 'Invoice / Return', render: (r) => <span className="font-mono text-xs">{r.document_number}</span> },
    { key: 'component_name', header: 'Ingredient', render: (r) => <span>{r.component_name}</span> },
    { key: 'actual_quantity', header: 'Actual', render: (r) => <span className="tabular-nums">{Number(r.actual_quantity).toLocaleString()} {r.unit}</span>, className: 'text-right', sortable: true, sortValue: (r) => r.actual_quantity },
    { key: 'wastage_quantity', header: 'Wastage', render: (r) => <span className="tabular-nums">{Number(r.wastage_quantity).toLocaleString()}</span>, className: 'text-right' },
    { key: 'total_cost', header: 'Cost', render: (r) => r.total_cost == null ? <span className="text-amber-600">Incomplete</span> : formatCurrency(r.total_cost), className: 'text-right' },
    { key: 'cost_basis', header: 'Basis', render: (r) => r.cost_basis || '—' },
    { key: 'source', header: 'Source', render: (r) => <span className="text-xs capitalize">{r.source === 'pos' ? 'Formula sale' : 'Recovery'}</span> },
    { key: 'status', header: 'Status', render: (r) => <span className={cn('text-xs', r.source === 'recovery' ? 'text-emerald-600' : 'text-muted-foreground')}>{r.source === 'recovery' ? 'Recovered' : 'Consumed'}</span> },
  ]

  return (
    <ReportLayout
      title="Ingredient Usage"
      subtitle="Actual ingredient consumption from formula sales, net of recovered ingredients"
      icon={<Beaker className="size-5 text-primary" />}
      toolbar={<ReportToolbar onPrint={() => window.print()} />}
      pending={range.pending}
    >
      <DateRangeFilter preset={range.preset} from={range.from} to={range.to} onPreset={(p) => range.apply(p)} onFromChange={range.setFrom} onToChange={range.setTo} onApplyCustom={() => range.apply('custom', range.from, range.to)} pending={range.pending} />

      <SummaryCards cards={[
        { label: 'Formula ingredient use', value: Number(posQuantity.toFixed(6)).toLocaleString(), positive: false },
        { label: 'Recovered', value: Number(recoveredQuantity.toFixed(6)).toLocaleString(), positive: recoveredQuantity > 0 },
        { label: 'Net ingredient use', value: Number(netQuantity.toFixed(6)).toLocaleString(), positive: false },
        { label: 'Usage lines', value: `${formulaRows.length}`, positive: true },
      ]} />

      {uncostedLines > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800">
          Ingredient cost is incomplete for {uncostedLines} line(s). Costs shown are known execution snapshots only.
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Consumption by ingredient</h2>
        <ReportTable
          columns={aggregateColumns}
          data={byIngredient}
          keyExtractor={(r) => r.key}
          pageSize={50}
          emptyMessage="No ingredient consumption in this period."
        />
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Formula sale lines</h2>
        <ReportTable columns={columns} data={formulaRows} keyExtractor={(r) => `${r.source}-${r.document_number}-${r.component_name}-${r.actual_quantity}`} pageSize={50} searchable searchPlaceholder="Search formula, invoice or ingredient..." onSearch={(data, q) => data.filter((r) => `${r.document_number} ${r.component_name} ${r.finished_product_name || ''}`.toLowerCase().includes(q.toLowerCase()))} emptyMessage="No formula ingredient usage in this period." />
      </div>
    </ReportLayout>
  )
}
