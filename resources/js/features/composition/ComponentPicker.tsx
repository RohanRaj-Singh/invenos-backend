import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Package, Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatStock } from '@/lib/product-unit-display'
import { searchComponents } from './api'
import type { ComponentSearchResult } from './types'

interface ComponentPickerProps {
  /** Omit or pass 0 when there is no product to exclude (e.g. before save). */
  excludeProductId?: number | null
  excludedComponentIds: number[]
  onSelect: (component: ComponentSearchResult) => void
  disabled?: boolean
}

export default function ComponentPicker({
  excludeProductId,
  excludedComponentIds,
  onSelect,
  disabled = false,
}: ComponentPickerProps) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<ComponentSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  const excluded = useMemo(() => new Set(excludedComponentIds), [excludedComponentIds])

  useEffect(() => {
    const query = search.trim()
    if (query === '') {
      setResults([])
      setError(null)
      setLoading(false)
      return
    }

    const current = ++requestId.current
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await searchComponents({
          search: query,
          excludeProductId,
          perPage: 12,
        })
        if (current === requestId.current) {
          setResults(response.data)
        }
      } catch {
        if (current === requestId.current) {
          setError('Could not search ingredients. Try again.')
          setResults([])
        }
      } finally {
        if (current === requestId.current) setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [search, excludeProductId])

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search ingredients by name, SKU, or barcode..."
          className="h-10 pl-9"
          disabled={disabled}
          aria-label="Search inventory ingredients"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {search.trim() !== '' && !loading && results.length === 0 && !error && (
        <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
          No inventory-tracked ingredient matches “{search.trim()}”.
        </div>
      )}

      {results.length > 0 && (
        <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-popover">
          {results.map((component) => {
            const alreadyAdded = excluded.has(component.id)
            return (
              <button
                key={component.id}
                type="button"
                disabled={disabled || alreadyAdded}
                onClick={() => {
                  onSelect(component)
                  setSearch('')
                  setResults([])
                }}
                className={cn(
                  'flex w-full items-center gap-3 border-b border-border px-3 py-2.5 text-left last:border-b-0 transition-colors',
                  alreadyAdded ? 'opacity-40 cursor-not-allowed' : 'hover:bg-muted/60',
                )}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Package className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{component.name}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {component.sku} · {formatStock(component.stock_quantity, component.base_unit_name)}
                  </span>
                </span>
                {alreadyAdded ? (
                  <Badge variant="outline">Added</Badge>
                ) : (
                  <Plus className="size-4 shrink-0 text-muted-foreground" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
