import { useState, useMemo } from 'react'
import { router, usePage } from '@inertiajs/react'
import { ArrowRight, RotateCcw, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/format'

interface ReturnItem {
  id: number
  return_number: string
  type: string
  reference_type?: string
  grand_total: number
  return_date: string
  status: string
  contact?: { id: number; name: string }
  items_count?: number
}

export default function ReturnListPage() {
  const { props } = usePage()
  const returns: ReturnItem[] = (props as any).returns || []
  const meta = (props as any).meta || {}
  const source: string = (props as any).source || 'sale'
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return returns
    const q = search.toLowerCase()
    return returns.filter((r) =>
      r.return_number.toLowerCase().includes(q) ||
      (r.contact?.name || '').toLowerCase().includes(q)
    )
  }, [returns, search])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <RotateCcw className="size-5" />
        <span className="text-xs font-semibold uppercase tracking-wider">Returns</span>
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
          {source === 'sale' ? 'Sale Returns' : 'Purchase Returns'}
        </h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by number or party..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground">
          <RotateCcw className="size-10 mx-auto mb-3 text-muted-foreground/20" />
          <p>No returns found.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((ret) => (
            <Card key={ret.id} size="sm" className="cursor-pointer hover:bg-muted/20 transition-colors"
              onClick={() => router.visit(`/returns/${source}/${ret.id}`)}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{ret.return_number}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-medium">
                      {ret.type || source}
                    </Badge>
                    <span className={[
                      'text-[10px] px-1.5 py-0.5 rounded font-medium',
                      ret.status === 'completed' ? 'text-emerald-600 bg-emerald-50' : '',
                      ret.status === 'pending' ? 'text-amber-600 bg-amber-50' : '',
                      ret.status === 'cancelled' ? 'text-red-600 bg-red-50' : '',
                    ].join(' ')}>
                      {ret.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {ret.contact?.name || '—'} · {formatDate(ret.return_date)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(ret.grand_total)}</p>
                  <ArrowRight className="size-3.5 text-muted-foreground ml-auto mt-0.5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {meta?.total > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Showing {filtered.length} of {meta.total} records
        </p>
      )}
    </div>
  )
}
