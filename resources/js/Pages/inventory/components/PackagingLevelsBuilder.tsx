import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Plus, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PackagingLevel, PackagingPreviewUnit } from '@/types'
import axios from 'axios'

// ── Props ──

interface PackagingLevelsBuilderProps {
  levels: PackagingLevel[]
  onChange: (levels: PackagingLevel[]) => void
  /** The current base unit ID — passed so autocomplete can suggest base unit as leaf. */
  baseUnitId?: string
  /** Callback when preview results change — lets parent show derived units. */
  onPreview?: (units: PackagingPreviewUnit[]) => void
  /** Whether the component is in a loading state. */
  disabled?: boolean
}

// ── Main Component ──

export default function PackagingLevelsBuilder({
  levels,
  onChange,
  baseUnitId,
  onPreview,
  disabled = false,
}: PackagingLevelsBuilderProps) {
  const [preview, setPreview] = useState<PackagingPreviewUnit[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Debounced preview ──
  const triggerPreview = useCallback((currentLevels: PackagingLevel[]) => {
    const valid = currentLevels.filter(
      (l) => l.containerUnitId && l.containsUnitId && l.quantity > 0
    )
    if (valid.length === 0) {
      setPreview([])
      onPreview?.([])
      return
    }

    if (previewTimerRef.current) clearTimeout(previewTimerRef.current)

    previewTimerRef.current = setTimeout(async () => {
      setPreviewLoading(true)
      try {
        const payload = {
          packaging: valid.map((l) => ({
            container_unit_id: l.containerUnitId,
            contains_unit_id: l.containsUnitId,
            quantity: l.quantity,
            level: l.level,
          })),
        }
        const res = await axios.post('/inventory/preview-packaging', payload)
        const units: PackagingPreviewUnit[] = res.data?.data ?? []
        setPreview(units)
        onPreview?.(units)
      } catch {
        // Silently fail — preview is non-critical
        setPreview([])
        onPreview?.([])
      } finally {
        setPreviewLoading(false)
      }
    }, 400) // 400ms debounce
  }, [onPreview])

  // Trigger preview on levels change
  useEffect(() => {
    triggerPreview(levels)
  }, [levels, triggerPreview])

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
    }
  }, [])

  // ── Level management ──

  const addLevel = useCallback(() => {
    const nextLevel = levels.length + 1
    const newLevel: PackagingLevel = {
      _key: `pl-${Date.now()}`,
      containerUnitId: null,
      containerName: '',
      containsUnitId: null,
      containsName: '',
      quantity: 1,
      level: nextLevel,
    }
    onChange([...levels, newLevel])
  }, [levels, onChange])

  const removeLevel = useCallback((key: string) => {
    const updated = levels
      .filter((l) => l._key !== key)
      .map((l, i) => ({ ...l, level: i + 1 }))
    onChange(updated)
  }, [levels, onChange])

  const updateLevel = useCallback(
    (key: string, patch: Partial<PackagingLevel>) => {
      onChange(levels.map((l) => (l._key === key ? { ...l, ...patch } : l)))
    },
    [levels, onChange]
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Packaging Levels
        </h4>
        {previewLoading && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Define how your product is packaged. Each level describes how many smaller units fit into one larger unit.
      </p>

      {/* Level rows */}
      <div className="space-y-2">
        {levels.map((level) => (
          <PackagingLevelRow
            key={level._key}
            level={level}
            onChange={(patch) => updateLevel(level._key, patch)}
            onRemove={() => removeLevel(level._key)}
            disabled={disabled}
            baseUnitId={baseUnitId}
          />
        ))}
      </div>

      {/* Add level button */}
      <button
        type="button"
        onClick={addLevel}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
      >
        <Plus className="size-3.5" />
        Add Level
      </button>

      {/* Preview — derived units */}
      {preview.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border/60">
          <h5 className="text-[11px] font-medium text-muted-foreground mb-2">
            Auto-generated selling units
          </h5>
          <div className="space-y-1">
            {preview.map((unit) => (
              <div
                key={unit.product_unit_id}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-primary/[0.03] text-xs"
              >
                <span className="font-medium text-foreground">{unit.name}</span>
                <span className="text-muted-foreground">
                  = {unit.quantity} base units
                </span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  (generated)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Single Level Row ──

function PackagingLevelRow({
  level,
  onChange,
  onRemove,
  disabled,
  baseUnitId,
}: {
  level: PackagingLevel
  onChange: (patch: Partial<PackagingLevel>) => void
  onRemove: () => void
  disabled: boolean
  baseUnitId?: string
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Level header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="inline-flex items-center justify-center size-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
          {level.level}
        </span>
        {level.containerName && level.containsName ? (
          <span className="flex-1 text-left text-foreground">
            {level.containerName} contains {level.quantity}× {level.containsName}
          </span>
        ) : (
          <span className="flex-1 text-left text-muted-foreground/60 italic">
            Define packaging level {level.level}
          </span>
        )}
        <ChevronDown className={cn('size-3.5 transition-transform', expanded && 'rotate-180')} />
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-2.5 border-t border-border/60">
          {/* Natural language: "Box contains 12 Pack" */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Container unit (left side — larger unit) */}
            <div className="flex-1 min-w-[100px]">
              <label className="block text-[10px] text-muted-foreground mb-0.5">Container</label>
              <UnitAutocomplete
                value={level.containerName}
                onChange={(id, name) => onChange({ containerUnitId: id, containerName: name })}
                placeholder="e.g. Box"
                disabled={disabled}
                excludeId={level.containsUnitId ?? undefined}
              />
            </div>

            {/* Quantity */}
            <div className="w-20">
              <label className="block text-[10px] text-muted-foreground mb-0.5">Qty</label>
              <input
                type="number"
                value={level.quantity || ''}
                onChange={(e) => onChange({ quantity: parseFloat(e.target.value) || 0 })}
                placeholder="12"
                min="0.01"
                step="any"
                disabled={disabled}
                className="w-full h-9 px-2 rounded-lg border border-input bg-background text-xs text-center outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
              />
            </div>

            {/* Contains unit (right side — smaller unit) */}
            <div className="flex-1 min-w-[100px]">
              <label className="block text-[10px] text-muted-foreground mb-0.5">Contains</label>
              <UnitAutocomplete
                value={level.containsName}
                onChange={(id, name) => onChange({ containsUnitId: id, containsName: name })}
                placeholder="e.g. Pack"
                disabled={disabled}
                excludeId={level.containerUnitId ?? undefined}
              />
            </div>

            {/* Remove */}
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              className="self-end size-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              title="Remove level"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Unit Autocomplete ──

interface UnitAutocompleteProps {
  value: string
  onChange: (id: number, name: string) => void
  placeholder?: string
  disabled?: boolean
  /** Optional unit ID to exclude from results (to prevent container == contains). */
  excludeId?: number
}

function UnitAutocomplete({
  value,
  onChange,
  placeholder = 'Search unit...',
  disabled = false,
  excludeId,
}: UnitAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced search
  useEffect(() => {
    if (!open || !search.trim()) {
      setResults([])
      return
    }

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)

    searchTimerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await axios.get('/inventory/product-units', {
          params: { search: search.trim() },
        })
        let items: { id: number; name: string }[] = res.data?.data ?? []
        if (excludeId) {
          items = items.filter((u) => u.id !== excludeId)
        }
        setResults(items)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 200)
  }, [search, open, excludeId])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const displayValue = open ? search : value

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={(e) => {
          setSearch(e.target.value)
          if (!open) setOpen(true)
        }}
        onFocus={() => {
          setOpen(true)
          setSearch('')
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false)
          }
          if (e.key === 'Enter' && open && results.length > 0) {
            e.preventDefault()
            const first = results[0]
            onChange(first.id, first.name)
            setOpen(false)
            setSearch('')
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full h-9 px-2.5 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 disabled:opacity-50"
      />

      {open && (
        <div
          ref={panelRef}
          className="absolute z-50 mt-1 w-full min-w-[180px] bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {loading && (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && results.length > 0 && (
            <div className="py-1">
              {results.map((unit) => (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => {
                    onChange(unit.id, unit.name)
                    setOpen(false)
                    setSearch('')
                  }}
                  className={cn(
                    'w-full px-3 py-2 text-xs text-left hover:bg-muted transition-colors',
                    value === unit.name && 'bg-primary/5 text-primary font-medium'
                  )}
                >
                  {unit.name}
                </button>
              ))}
            </div>
          )}
          {!loading && search.trim() && results.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">No units found</div>
          )}
          {!loading && !search.trim() && results.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">Type to search units...</div>
          )}
        </div>
      )}
    </div>
  )
}
