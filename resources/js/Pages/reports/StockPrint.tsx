import { usePage } from '@inertiajs/react'
import { X, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PrintLayout from '@/features/printing/components/PrintLayout'
import BusinessHeader from '@/features/printing/components/BusinessHeader'
import ReportDocumentTable, { type DocumentColumn } from '@/features/reporting/components/ReportDocumentTable'

interface SummaryShape {
  total_products?: number
  total_stock?: number
  total_value?: number
  low_stock?: number
  out_of_stock?: number
  negative_stock?: number
}

interface MovementShape {
  opening_stock?: number
  purchased?: number
  sold?: number
  sale_returns?: number
  purchase_returns?: number
  adjustments?: number
  closing_stock?: number
}

interface AttentionItem { id: number; name: string; sku: string; stock_quantity: number; unit: string; low_stock_threshold: number; status: string }
interface AttentionShape { negative: AttentionItem[]; out_of_stock: AttentionItem[]; low_stock: AttentionItem[] }
interface TopSellingShape { product_name: string; qty: number; revenue: number; invoice_count: number }
interface MostReturnedShape { product_name: string; qty: number; value: number; return_count: number }
interface ValuationShape { method: string; total_value: number; rows: Array<{ product: string; sku: string; unit: string; quantity: number; cost: number; value: number; status: string }> }

interface ProductRow {
  id: number
  name: string
  sku: string
  category?: string | null
  unit?: string | null
  stock_quantity: number
  low_stock_threshold: number
  status: string
  sold: number
  purchased: number
  returns: number
  value: number
}

interface ReportShape {
  summary?: SummaryShape
  movement?: MovementShape
  attention?: AttentionShape
  top_selling?: TopSellingShape[]
  most_returned?: MostReturnedShape[]
  valuation?: ValuationShape
  products?: ProductRow[]
  period?: { from: string; to: string }
}

const fmt = (n: number | undefined | null) => Number(n ?? 0).toLocaleString()
const Rs = (n: number | undefined | null) => `Rs ${fmt(n)}`

function StatusBadge({ status }: { status: string }) {
  const palette: Record<string, string> = {
    'in-stock': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'low-stock': 'bg-amber-50 text-amber-700 border-amber-200',
    'out-of-stock': 'bg-red-50 text-red-700 border-red-200',
  }
  const cls = palette[status] || 'bg-gray-50 text-gray-600 border-gray-200'
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-semibold uppercase border ${cls}`}>
      {status.replace('-', ' ')}
    </span>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold uppercase tracking-wide text-gray-700 mt-5 mb-1.5 pb-1 border-b border-gray-200">
      {children}
    </h3>
  )
}

export default function StockPrintPage() {
  const { props } = usePage<Record<string, any>>()
  const report = (props.report || {}) as ReportShape
  const settings = (props.settings || {}) as Record<string, any>
  const business = settings.business || {}
  const receipt = settings.receipt || {}

  const summary = report.summary || {}
  const movement = report.movement || {}
  const attention = report.attention || { negative: [], out_of_stock: [], low_stock: [] }
  const topSelling = report.top_selling || []
  const mostReturned = report.most_returned || []
  const valuation = report.valuation || { method: '', total_value: 0, rows: [] }
  const products = report.products || []
  const period = report.period || { from: '', to: '' }

  const summaryCards: Array<{ label: string; value: string; tone?: 'emerald' | 'red' }> = [
    { label: 'Total Products', value: fmt(summary.total_products) },
    { label: 'Total Stock', value: fmt(summary.total_stock) },
    { label: 'Inventory Value', value: Rs(summary.total_value), tone: 'emerald' },
    { label: 'Low Stock', value: fmt(summary.low_stock), tone: summary.low_stock ? 'red' : undefined },
    { label: 'Out of Stock', value: fmt(summary.out_of_stock), tone: summary.out_of_stock ? 'red' : undefined },
    { label: 'Negative Stock', value: fmt(summary.negative_stock), tone: summary.negative_stock ? 'red' : undefined },
  ]

  const movementRows = [
    ['Opening Stock', fmt(movement.opening_stock)],
    ['Purchased', `+${fmt(movement.purchased)}`],
    ['Sold', `−${fmt(movement.sold)}`],
    ['Sale Returns', `+${fmt(movement.sale_returns)}`],
    ['Purchase Returns', `−${fmt(movement.purchase_returns)}`],
    ['Adjustments', `${Number(movement.adjustments ?? 0) >= 0 ? '+' : '−'}${fmt(Math.abs(Number(movement.adjustments ?? 0)))}`],
    ['Closing Stock', fmt(movement.closing_stock)],
  ]

  const topSellingCols: DocumentColumn<TopSellingShape>[] = [
    { key: 'name', header: 'Product', render: (r) => r.product_name },
    { key: 'qty', header: 'Qty', width: '18%', align: 'right', render: (r) => fmt(r.qty) },
    { key: 'revenue', header: 'Revenue', width: '22%', align: 'right', render: (r) => Rs(r.revenue) },
    { key: 'inv', header: 'Invoices', width: '18%', align: 'right', render: (r) => fmt(r.invoice_count) },
  ]

  const mostReturnedCols: DocumentColumn<MostReturnedShape>[] = [
    { key: 'name', header: 'Product', render: (r) => r.product_name },
    { key: 'qty', header: 'Qty', width: '18%', align: 'right', render: (r) => fmt(r.qty) },
    { key: 'value', header: 'Value', width: '22%', align: 'right', render: (r) => Rs(r.value) },
    { key: 'count', header: 'Returns', width: '18%', align: 'right', render: (r) => fmt(r.return_count) },
  ]

  const valuationCols: DocumentColumn<ValuationShape['rows'][number]>[] = [
    { key: 'product', header: 'Product', width: '30%', render: (r) => r.product },
    { key: 'sku', header: 'SKU', width: '14%', render: (r) => r.sku || '—' },
    { key: 'qty', header: 'Qty', width: '12%', align: 'right', render: (r) => `${fmt(r.quantity)} ${r.unit || ''}`.trim() },
    { key: 'cost', header: 'Cost', width: '14%', align: 'right', render: (r) => Rs(r.cost) },
    { key: 'value', header: 'Value', width: '16%', align: 'right', render: (r) => Rs(r.value) },
  ]

  const productCols: DocumentColumn<ProductRow>[] = [
    { key: 'name', header: 'Product', width: '26%', render: (r) => r.name },
    { key: 'sku', header: 'SKU', width: '12%', render: (r) => r.sku || '—' },
    { key: 'category', header: 'Category', width: '16%', render: (r) => r.category || '—' },
    { key: 'stock', header: 'Stock', width: '9%', align: 'right', render: (r) => `${fmt(r.stock_quantity)} ${r.unit || ''}`.trim() },
    { key: 'sold', header: 'Sold', width: '9%', align: 'right', render: (r) => fmt(r.sold) },
    { key: 'purchased', header: 'Purchased', width: '10%', align: 'right', render: (r) => fmt(r.purchased) },
    { key: 'value', header: 'Value', width: '12%', align: 'right', render: (r) => Rs(r.value) },
    { key: 'status', header: 'Status', width: '9%', align: 'center', render: (r) => <StatusBadge status={r.status} /> },
  ]

  const subtitle = period.from && period.to
    ? `Inventory levels & movement — ${new Date(period.from).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} to ${new Date(period.to).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : 'Inventory levels & movement'

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* No-print toolbar */}
      <div className="no-print bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="gap-1.5 text-gray-600 hover:text-gray-900">
          <X className="size-4" />
          <span className="hidden sm:inline">Close</span>
        </Button>
        <Button onClick={() => window.print()} className="gap-2 shadow-sm">
          <Printer className="size-4" />
          <span className="hidden sm:inline">Print</span>
        </Button>
      </div>

      <PrintLayout>
        <BusinessHeader business={business} receipt={receipt} title="STOCK REPORT" />

        <p className="text-[10px] text-gray-500 mb-4">{subtitle} · Generated {new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {summaryCards.map((c) => (
            <div key={c.label} className="border border-gray-200 rounded-md px-3 py-2">
              <div className="text-[7.5px] uppercase tracking-wider text-gray-400 font-semibold">{c.label}</div>
              <div className={`text-[13px] font-bold mt-0.5 ${c.tone === 'emerald' ? 'text-emerald-600' : c.tone === 'red' ? 'text-red-600' : 'text-gray-900'}`}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Movement */}
        <SectionTitle>Inventory Movement</SectionTitle>
        <table className="doc-table w-full border-collapse" style={{ maxWidth: '360px' }}>
          <tbody>
            {movementRows.map(([label, value]) => (
              <tr key={label} style={{ pageBreakInside: 'avoid' }}>
                <td style={{ padding: '4px 6px', borderBottom: '1px solid #e5e7eb', fontSize: '9.5px' }}>{label}</td>
                <td className="tabular-nums" style={{ padding: '4px 6px', borderBottom: '1px solid #e5e7eb', fontSize: '9.5px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Attention */}
        {([['negative', 'Negative Stock'], ['out_of_stock', 'Out of Stock'], ['low_stock', 'Low Stock']] as const).some(([k]) => (attention[k] || []).length > 0) && (
          <>
            <SectionTitle>Needs Attention</SectionTitle>
            {([['negative', 'Negative Stock'], ['out_of_stock', 'Out of Stock'], ['low_stock', 'Low Stock']] as const).map(([key, label]) => {
              const rows = attention[key] || []
              if (rows.length === 0) return null
              return (
                <div key={key} className="mb-2">
                  <div className="text-[8px] font-semibold uppercase tracking-wide text-gray-500 mb-1">{label}</div>
                  <table className="doc-table w-full border-collapse">
                    <tbody>
                      {rows.map((a) => (
                        <tr key={a.id} style={{ pageBreakInside: 'avoid' }}>
                          <td style={{ padding: '3px 6px', borderBottom: '1px solid #e5e7eb', fontSize: '9.5px' }}>{a.name}</td>
                          <td className="tabular-nums" style={{ padding: '3px 6px', borderBottom: '1px solid #e5e7eb', fontSize: '9.5px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(a.stock_quantity)} {a.unit || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
          </>
        )}

        {/* Top selling */}
        {topSelling.length > 0 && (
          <>
            <SectionTitle>Top Selling Products</SectionTitle>
            <ReportDocumentTable<TopSellingShape> columns={topSellingCols} rows={topSelling} keyExtractor={(r) => r.product_name} />
          </>
        )}

        {/* Most returned */}
        {mostReturned.length > 0 && (
          <>
            <SectionTitle>Most Returned Products</SectionTitle>
            <ReportDocumentTable<MostReturnedShape> columns={mostReturnedCols} rows={mostReturned} keyExtractor={(r) => r.product_name} />
          </>
        )}

        {/* Valuation */}
        {valuation.rows.length > 0 && (
          <>
            <SectionTitle>Stock Valuation</SectionTitle>
            <p className="text-[8.5px] text-gray-500 mb-1">{valuation.method}</p>
            <ReportDocumentTable<ValuationShape['rows'][number]> columns={valuationCols} rows={valuation.rows} keyExtractor={(r) => `${r.product}-${r.sku}`} />
          </>
        )}

        {/* Products */}
        <SectionTitle>Products</SectionTitle>
        <ReportDocumentTable<ProductRow> columns={productCols} rows={products} keyExtractor={(r) => String(r.id)} emptyMessage="No products found." />

        {/* Footer */}
        <div className="mt-6 pt-2 border-t border-gray-200 text-center text-[8.5px] text-gray-400">
          {business.business_name || 'Invenos'} POS — Generated {new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </div>
      </PrintLayout>
    </div>
  )
}
