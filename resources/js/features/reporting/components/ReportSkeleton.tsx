export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4 animate-pulse">
          <div className="h-3 w-20 bg-muted rounded mb-2" />
          <div className="h-6 w-28 bg-muted rounded" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden animate-pulse">
      <div className="bg-muted/30 px-4 py-3 border-b border-border flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 flex-1 bg-muted rounded" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="px-4 py-3 border-b border-border flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-3 flex-1 bg-muted/60 rounded" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ReportSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="space-y-5">
      <div className="h-9 w-full max-w-xl bg-muted/40 rounded-lg animate-pulse" />
      <SkeletonCards count={cards} />
      <SkeletonTable />
    </div>
  )
}
