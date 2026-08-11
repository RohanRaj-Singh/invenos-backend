import type { ReactNode } from 'react'

export interface DocumentColumn<T> {
  key: string
  header: string
  /** Explicit column width — required so long names wrap instead of squeezing neighbours. */
  width?: string
  /** Right-align numeric/currency cells. */
  align?: 'left' | 'right' | 'center'
  render: (row: T) => ReactNode
}

interface ReportDocumentTableProps<T> {
  columns: DocumentColumn<T>[]
  rows: T[]
  keyExtractor: (row: T) => string
  emptyMessage?: string
}

/**
 * Print-tuned table for report documents.
 *
 * - `thead { display: table-header-group }` (set by PrintLayout) repeats the
 *   header on every page for page-spanning tables.
 * - `tr { page-break-inside: avoid }` (set by PrintLayout) keeps rows intact.
 * - Explicit column widths stop long names/values from pushing siblings around.
 * - `tabular-nums` keeps currency columns from jittering.
 */
export default function ReportDocumentTable<T>({
  columns, rows, keyExtractor, emptyMessage = 'No records.',
}: ReportDocumentTableProps<T>) {
  return (
    <table className="doc-table w-full border-collapse">
      <style>{`
        .doc-table thead th {
          border-bottom: 2px solid #111827;
          padding: 5px 6px;
          text-align: left;
          font-size: 8.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          color: #6b7280;
        }
        .doc-table tbody td {
          padding: 4px 6px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 9.5px;
          vertical-align: top;
          overflow-wrap: anywhere;
          word-break: break-word;
        }
        .doc-table tbody tr:last-child td { border-bottom: none; }
      `}</style>
      <thead>
        <tr>
          {columns.map((c) => (
            <th
              key={c.key}
              style={{
                width: c.width,
                textAlign: c.align === 'right' ? 'right' : c.align === 'center' ? 'center' : 'left',
              }}
            >
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={columns.length} style={{ padding: '10px 6px', color: '#9ca3af' }}>{emptyMessage}</td></tr>
        ) : rows.map((row) => (
          <tr key={keyExtractor(row)} style={{ pageBreakInside: 'avoid' }}>
            {columns.map((c) => (
              <td
                key={c.key}
                className={c.align === 'right' || c.align === 'center' ? 'tabular-nums' : undefined}
                style={{
                  textAlign: c.align === 'right' ? 'right' : c.align === 'center' ? 'center' : 'left',
                  fontVariantNumeric: c.align === 'right' || c.align === 'center' ? 'tabular-nums' : undefined,
                }}
              >
                {c.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
