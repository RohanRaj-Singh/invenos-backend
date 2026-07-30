import { useState, useMemo } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Search, Trash2, RotateCcw, AlertTriangle, Package, Users, ShoppingCart, Store, Stethoscope, Pill } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface RecycleItem {
  id: number
  type: 'product' | 'contact' | 'sale' | 'purchase' | 'consultation' | 'prescription'
  name: string
  identifier: string
  deleted_at: string
  deleted_by: string
  reason: string | null
  impact: string
}

export default function RecycleBinPage() {
  const { props } = usePage()
  const items = (props as any).items || []
  const filters = (props as any).filters || {}
  const authUser = (props as any).auth?.user ?? null
  const isAdmin = authUser?.role === 'admin'

  const [typeFilter, setTypeFilter] = useState(filters.type || 'all')
  const [search, setSearch] = useState(filters.search || '')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState<RecycleItem | null>(null)
  const [confirmPermanent, setConfirmPermanent] = useState(false)

  const filtered = useMemo(() => {
    return items.filter((item: RecycleItem) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return item.name.toLowerCase().includes(q) || item.identifier.toLowerCase().includes(q)
      }
      return true
    })
  }, [items, typeFilter, search])

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length }
    for (const item of items) {
      counts[item.type] = (counts[item.type] || 0) + 1
    }
    return counts
  }, [items])

  const toggleSelect = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const restoreItem = (item: RecycleItem) => {
    router.post(`/utilities/recycle-bin/${item.type}/${item.id}/restore`, {}, {
      onSuccess: () => toast.success(`${item.name} restored`),
      onError: (err) => toast.error(Object.values(err).join(', ')),
    })
  }

  const permanentDelete = (item: RecycleItem) => {
    router.delete(`/utilities/recycle-bin/${item.type}/${item.id}`, {
      onSuccess: () => {
        toast.success(`${item.name} permanently deleted`)
        setConfirmPermanent(false)
        setConfirmDelete(null)
      },
      onError: (err) => toast.error(Object.values(err).join(', ')),
    })
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case 'product': return <Package className="size-4" />
      case 'contact': return <Users className="size-4" />
      case 'sale': return <ShoppingCart className="size-4" />
      case 'purchase': return <Store className="size-4" />
      case 'consultation': return <Stethoscope className="size-4" />
      case 'prescription': return <Pill className="size-4" />
      default: return null
    }
  }

  const typeLabel = (type: string) => {
    switch (type) {
      case 'product': return 'Product'
      case 'contact': return 'Contact'
      case 'sale': return 'Sale'
      case 'purchase': return 'Purchase'
      case 'consultation': return 'Visit'
      case 'prescription': return 'Prescription'
      default: return type
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Trash2 className="size-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">Utilities</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Recycle Bin</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {items.length} deleted {items.length === 1 ? 'record' : 'records'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input type="text" placeholder="Search deleted records..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring transition-colors" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring">
          <option value="all">All ({typeCounts.all || 0})</option>
          <option value="products">Products ({typeCounts.products || 0})</option>
          <option value="contacts">Contacts ({typeCounts.contacts || 0})</option>
          <option value="sales">Sales ({typeCounts.sales || 0})</option>
          <option value="purchases">Purchases ({typeCounts.purchases || 0})</option>
          <option value="consultations">Visits ({typeCounts.consultations || 0})</option>
          <option value="prescriptions">Prescriptions ({typeCounts.prescriptions || 0})</option>
        </select>
      </div>

      {/* Items */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-sm text-muted-foreground">
              <Trash2 className="size-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-medium text-foreground mb-1">Recycle Bin is empty</p>
              <p className="text-xs">Deleted records will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((item: RecycleItem) => {
                const key = `${item.type}-${item.id}`
                return (
                  <div key={key}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30',
                      selected.has(key) && 'bg-primary/5'
                    )}>
                    <input type="checkbox" checked={selected.has(key)}
                      onChange={() => toggleSelect(key)}
                      className="size-4 rounded border-gray-300 accent-primary shrink-0" />
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="size-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        {typeIcon(item.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{item.name}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal shrink-0">
                            {typeLabel(item.type)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                          <span>{item.identifier}</span>
                          <span>·</span>
                          <span>Deleted {item.deleted_by ? `by ${item.deleted_by}` : ''}</span>
                          {item.reason && <><span>·</span><span className="italic">"{item.reason}"</span></>}
                        </div>
                        <div className="text-[10px] text-muted-foreground/60 mt-0.5">{item.impact}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isAdmin && (
                        <button onClick={() => restoreItem(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
                          title="Restore">
                          <RotateCcw className="size-3.5" /> Restore
                        </button>
                      )}
                      {isAdmin && (
                        <button onClick={() => { setConfirmDelete(item); setConfirmPermanent(true) }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                          title="Permanently delete">
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permanent Delete Confirmation */}
      <Dialog open={confirmPermanent && confirmDelete !== null} onOpenChange={(v) => { if (!v) { setConfirmPermanent(false); setConfirmDelete(null) } }}>
        <DialogContent className="sm:max-w-md gap-0 p-0">
          <DialogHeader className="p-5 pb-0">
            <DialogTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-500" />
              Permanently Delete?
            </DialogTitle>
          </DialogHeader>
          <div className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              This action <strong>cannot be undone</strong>. The record will be permanently removed from the system.
            </p>
            {confirmDelete && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 text-sm">
                <strong>{confirmDelete.name}</strong> · {typeLabel(confirmDelete.type)}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setConfirmPermanent(false); setConfirmDelete(null) }} className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => confirmDelete && permanentDelete(confirmDelete)} className="flex-1 gap-1.5 bg-red-600 hover:bg-red-700">
                <Trash2 className="size-4" /> Permanently Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
