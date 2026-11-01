import { ReactNode } from 'react'

interface PrintLayoutProps {
  children: ReactNode
  businessName?: string
}

/** A4 document container. Pagination is handled by print.css. */
export default function PrintLayout({ children, businessName }: PrintLayoutProps) {
  const printedAt = new Date().toLocaleString()

  return (
    <>
      <div className="print-paper">
        {children}
      </div>

      <div className="print-only print-running-footer">
        {businessName ? `${businessName} · ` : ''}Printed {printedAt}
      </div>
    </>
  )
}
