import { useState } from 'react'
import { router, usePage, Link } from '@inertiajs/react'
import { Search, ListOrdered, Filter, ChevronLeft, ChevronRight, Clock, User, Globe, Tag, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface AuditEntry {
  id: number
  user: string
  event: string
  auditable_type: string
  auditable_id: number
  description: string
  reason: string | null
  ip_address: string | null
  created_at: string
}

interface PageMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

const eventColors: Record<string, string> = {
  'Sale.deleted': 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  'Sale.restored': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  'Product.archived': 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  'Contact.archived': 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
}

function eventBadge(event: string) {
  const cls = eventColors[event] || 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400'
  return <span className={cn('inline-block text-[10px] font-medium px-1.5 py-0.5 rounded', cls)}>{event}</span>
}

export default function AuditLogPage() {
  const { props } = usePage()
  const logs = (props as any).logs as AuditEntry[]
  const meta = (props as any).meta as PageMeta
  const filters = (props as any).filters || {}
  const events = (props as any).events as string[] || []
  const users = (props as any).users as { id: number; name: string }[] || []

  const [search, setSearch] = useState(filters.search || '')
  const [eventFilter, setEventFilter] = useState(filters.event || '')
  const [userId, setUserId] = useState(filters.user_id || '')
  const [auditableType, setAuditableType] = useState(filters.auditable_type || '')
  const [dateFrom, setDateFrom] = useState(filters.date_from || '')
  const [dateTo, setDateTo] = useState(filters.date_to || '')
  const [showFilters, setShowFilters] = useState(false)

  function applyFilters() {
    router.get('/utilities/audit-log', {
      search,
      event: eventFilter,
      user_id: userId,
      auditable_type: auditableType,
      date_from: dateFrom,
      date_to: dateTo,
    }, { preserveState: true, replace: true })
  }

  function goToPage(page: number) {
    router.get('/utilities/audit-log', {
      search,
      event: eventFilter,
      user_id: userId,
      auditable_type: auditableType,
      date_from: dateFrom,
      date_to: dateTo,
      page,
    }, { preserveState: true, replace: true })
  }

  function resetFilters() {
    setSearch('')
    setEventFilter('')
    setUserId('')
    setAuditableType('')
    setDateFrom('')
    setDateTo('')
    router.get('/utilities/audit-log', {}, { preserveState: true, replace: true })
  }

  const hasActiveFilters = search || eventFilter || userId || auditableType || dateFrom || dateTo

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-5 pb-24">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <ListOrdered className="size-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">Utilities</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Audit Log</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {meta.total} {meta.total === 1 ? 'event' : 'events'} recorded
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn('gap-1.5', showFilters && 'bg-muted')}
          >
            <Filter className="size-3.5" />
            Filters
            {hasActiveFilters && (
              <span className="size-1.5 rounded-full bg-primary" />
            )}
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Search</label>
                <input
                  type="text" placeholder="Description, reason, IP..."
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Event Type</label>
                <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring">
                  <option value="">All events</option>
                  {events.map((evt) => (
                    <option key={evt} value={evt}>{evt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">User</label>
                <select value={userId} onChange={(e) => setUserId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring">
                  <option value="">All users</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Date From</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Date To</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring" />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={applyFilters}>Apply Filters</Button>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={resetFilters}>Reset</Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="text-center py-16 text-sm text-muted-foreground">
              <ListOrdered className="size-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-medium text-foreground mb-1">No audit events found</p>
              <p className="text-xs">Lifecycle actions will appear here as they occur.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <Th>Timestamp</Th>
                    <Th>User</Th>
                    <Th>Event</Th>
                    <Th>Entity</Th>
                    <Th className="w-[30%]">Description</Th>
                    <Th>Reason</Th>
                    <Th>IP</Th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <Td>
                        <span className="text-xs text-muted-foreground font-mono tabular-nums">
                          {log.created_at}
                        </span>
                      </Td>
                      <Td>
                        <span className="text-sm font-medium">{log.user}</span>
                      </Td>
                      <Td>{eventBadge(log.event)}</Td>
                      <Td>
                        <span className="text-xs text-muted-foreground">
                          {log.auditable_type} #{log.auditable_id}
                        </span>
                      </Td>
                      <Td>
                        <p className="text-sm">{log.description}</p>
                      </Td>
                      <Td>
                        {log.reason ? (
                          <span className="text-xs text-muted-foreground italic">&ldquo;{log.reason}&rdquo;</span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </Td>
                      <Td>
                        <span className="text-xs text-muted-foreground font-mono">{log.ip_address || '—'}</span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {meta.current_page} of {meta.last_page}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={meta.current_page <= 1}
              onClick={() => goToPage(meta.current_page - 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-input bg-background text-sm disabled:opacity-30 hover:bg-muted transition-colors"
            >
              <ChevronLeft className="size-3.5" /> Previous
            </button>
            <button
              disabled={meta.current_page >= meta.last_page}
              onClick={() => goToPage(meta.current_page + 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-input bg-background text-sm disabled:opacity-30 hover:bg-muted transition-colors"
            >
              Next <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Table Helpers ───
function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn('px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap', className)}>
      {children}
    </th>
  )
}

function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn('px-4 py-3', className)}>{children}</td>
}
