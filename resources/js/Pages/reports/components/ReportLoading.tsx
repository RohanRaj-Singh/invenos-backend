import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReportLoadingProps {
  message?: string
  className?: string
}

export function ReportLoading({ message = 'Loading report...', className }: ReportLoadingProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-24 text-sm text-muted-foreground', className)}>
      <Loader2 className="size-8 animate-spin mb-3 text-primary/60" />
      <p className="font-medium">{message}</p>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 animate-pulse">
      <div className="h-3 w-20 bg-muted rounded mb-2" />
      <div className="h-6 w-28 bg-muted rounded" />
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden animate-pulse">
      <div className="bg-muted/30 px-4 py-3 border-b border-border flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 w-24 bg-muted rounded" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="px-4 py-3 border-b border-border flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-3 w-24 bg-muted/60 rounded" style={{ width: c === 0 ? '120px' : c === 1 ? '80px' : '100px' }} />
          ))}
        </div>
      ))}
    </div>
  )
}
