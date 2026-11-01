import { usePage } from '@inertiajs/react'
import { cn } from '@/lib/utils'

interface ReportLayoutProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  children: React.ReactNode
  toolbar?: React.ReactNode
  pending?: boolean
}

export function ReportLayout({ title, subtitle, icon, children, toolbar, pending }: ReportLayoutProps) {
  const { props } = usePage()
  const biz = ((props as any).settings?.business) || {}
  const businessName = biz.business_name || 'Invenos'
  const contactLine = [biz.address, biz.phone, biz.email, biz.website].filter(Boolean).join(' · ')
  const printedAt = new Date().toLocaleString()

  return (
    <div className="report-print p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
      {/* Print-only document header, fed by the shared settings prop */}
      <div className="print-only mb-4">
        <div className="flex items-start justify-between border-b border-gray-300 pb-2">
          <div>
            <p className="text-lg font-bold text-gray-900">{businessName}</p>
            {contactLine && <p className="text-[10px] text-gray-500 mt-0.5">{contactLine}</p>}
            <p className="text-sm text-gray-800 mt-1">{title}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
          <div className="text-right text-[10px] text-gray-500">
            <p>Printed {printedAt}</p>
          </div>
        </div>
      </div>

      <div className="flex items-start justify-between" data-print="hide">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="size-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 mt-0.5">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">{toolbar}</div>
      </div>

      <div
        aria-busy={pending}
        className={cn('space-y-5 transition-opacity duration-200', pending && 'opacity-60 pointer-events-none')}
      >
        {children}
      </div>

      <div className="text-[10px] text-muted-foreground border-t border-border pt-3 flex items-center justify-between">
        <span>Generated: {printedAt}</span>
        <span>
          {businessName}
          {biz.phone ? ` · ${biz.phone}` : ''}
        </span>
      </div>
    </div>
  )
}
