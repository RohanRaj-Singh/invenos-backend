import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'

interface TrendBadgeProps {
  current: number
  previous: number
  label?: string
  format?: 'currency' | 'number'
  className?: string
}

export function TrendBadge({ current, previous, label, format = 'currency', className }: TrendBadgeProps) {
  const change = current - previous
  const changePct = previous !== 0 ? Math.round((change / previous) * 1000) / 10 : (current > 0 ? 100 : 0)
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'flat'

  const formatVal = (v: number) => format === 'currency' ? formatCurrency(v) : v.toLocaleString()

  return (
    <div className={cn('space-y-1', className)}>
      {label && <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</div>}
      <div className="text-xl font-bold tracking-tight">{formatVal(current)}</div>
      <div className={cn(
        'inline-flex items-center gap-1 text-xs font-medium rounded-md px-1.5 py-0.5',
        direction === 'up' ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400' :
        direction === 'down' ? 'text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400' :
        'text-muted-foreground bg-muted/50',
      )}>
        {direction === 'up' ? <TrendingUp className="size-3" /> :
         direction === 'down' ? <TrendingDown className="size-3" /> :
         <Minus className="size-3" />}
        <span>
          {direction === 'flat' ? 'No change' :
           `${changePct > 0 ? '+' : ''}${changePct}% vs previous`}
        </span>
      </div>
    </div>
  )
}

export function TrendIndicator({ current, previous, format = 'currency' }: { current: number; previous: number; format?: 'currency' | 'number' }) {
  const change = current - previous
  const changePct = previous !== 0 ? Math.round((change / previous) * 1000) / 10 : 0
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'flat'

  if (previous === 0 && current === 0) return null

  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-xs font-medium',
      direction === 'up' ? 'text-emerald-600' :
      direction === 'down' ? 'text-red-500' :
      'text-muted-foreground',
    )}>
      {direction === 'up' ? <TrendingUp className="size-3" /> :
       direction === 'down' ? <TrendingDown className="size-3" /> : null}
      {changePct !== 0 && `${changePct > 0 ? '+' : ''}${changePct}%`}
    </span>
  )
}
