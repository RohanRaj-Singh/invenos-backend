import { ReactNode } from 'react'

interface BillResponsiveWrapperProps {
  /** Rendered on desktop (≥ 640px) */
  desktop: ReactNode
  /** Rendered on mobile (< 640px) */
  mobile: ReactNode
}

/**
 * Switches between desktop table and mobile card layouts.
 * Pure CSS — zero JS viewport detection.
 */
export default function BillResponsiveWrapper({ desktop, mobile }: BillResponsiveWrapperProps) {
  return (
    <>
      <div className="hidden sm:block">{desktop}</div>
      <div className="block sm:hidden">{mobile}</div>
    </>
  )
}
