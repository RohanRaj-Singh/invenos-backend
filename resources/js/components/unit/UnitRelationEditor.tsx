import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Plus, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getUnit, getBaseUnitOptions } from '@/lib/units'
import { UnitRelation, validateRelationships } from '@/lib/unit-relation-validator'
import { transformRelationships } from '@/lib/unit-relation-transformer'
import axios from 'axios'

interface UnitRelationEditorProps {
  /** The Default Unit ID (e.g. 'capsule', 'piece', 'kg') */
  defaultUnitId: string
  /** Called when the Default Unit changes */
  onDefaultUnitChange: (unitId: string) => void
  /** Current relationships */
  relationships: UnitRelation[]
  /** Called when relationships change */
  onRelationshipsChange: (rels: UnitRelation[]) => void
  /** Preview of derived selling units (from transformer) */
  preview?: any[]
  /** Disable editing */
  disabled?: boolean
  /** Error message from parent validation */
  error?: string | null
}

let nextKey = 1
function genKey(): string {
  return `rel-${nextKey++}`
}

export default function UnitRelationEditor({
  defaultUnitId,
  onDefaultUnitChange,
  relationships,
  onRelationshipsChange,
  preview,
  disabled = false,
  error,
}: UnitRelationEditorProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const defaultUnitName = getUnit(defaultUnitId)?.name || defaultUnitId || 'Unit'

  // Validate relationships on change
  useEffect(() => {
    const result = validateRelationships(defaultUnitName, relationships)
    setValidationErrors(result.errors)
  }, [relationships, defaultUnitName])

  // Compute preview
  const computedPreview = useMemo(() => {
    if (relationships.length === 0) return []
    const transformed = transformRelationships(defaultUnitName, relationships)
    return transformed.selling_units.map(su => ({
      name: su.name,
      quantity: su.quantity,
      sale_price: su.sale_price || 0,
      is_default: su.is_default,
    }))
  }, [relationships, defaultUnitName])

  const displayErrors = error ? [error] : validationErrors

  const addRelation = useCallback(() => {
    const unit = getUnit(defaultUnitId)
    onRelationshipsChange([
      ...relationships,
      {
        _key: genKey(),
        unitName: unit?.name || defaultUnitId || 'Unit',
        relatedUnitName: '',
        quantity: 1,
        salePrice: null,
        purchaseCost: null,
      },
    ])
  }, [relationships, defaultUnitId, onRelationshipsChange])

  const removeRelation = useCallback((key: string) => {
    onRelationshipsChange(relationships.filter(r => r._key !== key))
  }, [relationships, onRelationshipsChange])

  const updateRelation = useCallback(
    (key: string, patch: Partial<UnitRelation>) => {
      onRelationshipsChange(
        relationships.map(r => (r._key === key ? { ...r, ...patch } : r))
      )
    },
    [relationships, onRelationshipsChange]
  )

  return (
    <div className="space-y-4">
      {/* Default Unit field */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">
          I count inventory in
        </label>
        <DefaultUnitSelect value={defaultUnitId} onChange={onDefaultUnitChange} disabled={disabled} />
        <p className="text-[11px] text-muted-foreground">
          Used for inventory tracking and preselected in transactions.
          You may still purchase and sell using any supported unit.
        </p>
      </div>

      {/* Relationships */}
      {relationships.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">Other units</label>
          <div className="space-y-2">
            {relationships.map((rel) => (
              <UnitRelationRow
                key={rel._key}
                relation={rel}
                onChange={(patch) => updateRelation(rel._key, patch)}
                onRemove={() => removeRelation(rel._key)}
                disabled={disabled}
                defaultUnitName={defaultUnitName}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add button */}
      <button
        type="button"
        onClick={addRelation}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
      >
        <Plus className="size-3.5" />
        Add unit
      </button>

      {/* Validation errors */}
      {displayErrors.length > 0 && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 space-y-1">
          {displayErrors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      {/* Preview */}
      {computedPreview.length > 0 && (
        <div className="rounded-lg bg-muted/30 border border-border/60 p-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Selling units (auto-generated)
          </p>
          <div className="space-y-1">
            {computedPreview.map((su, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{su.name}</span>
                <span className="text-muted-foreground">
                  {su.quantity > 0 ? `${su.quantity} ${defaultUnitName}${su.quantity > 1 ? 's' : ''}` : '—'}
                  {su.sale_price > 0 && ` · Rs. ${su.sale_price}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Default Unit Select ──────────────────────────────

function DefaultUnitSelect({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const allOptions = getBaseUnitOptions().flatMap((g: any) =>
    g.options.map((o: any) => ({ id: o.value, label: o.label }))
  )
  const filtered = useMemo(() => {
    if (!search) return allOptions.filter(o => o.id !== value)
    return allOptions.filter(o => o.label.toLowerCase().includes(search.toLowerCase()) && o.id !== value)
  }, [search, allOptions, value])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={open ? search : (allOptions.find(o => o.id === value)?.label || value)}
        placeholder="Search unit..."
        onChange={(e) => { setSearch(e.target.value); if (!open) setOpen(true) }}
        onFocus={() => { setOpen(true); setSearch('') }}
        disabled={disabled}
        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 disabled:opacity-50"
      />
      {open && (
        <div
          ref={panelRef}
          className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {filtered.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => { onChange(o.id); setOpen(false); setSearch('') }}
              className={cn(
                'w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors',
                o.id === value && 'bg-primary/5 text-primary font-medium'
              )}
            >
              {o.label}
            </button>
          ))}
          {!search && filtered.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">No units found</div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Single Relationship Row ──────────────────────────

interface UnitRelationRowProps {
  relation: UnitRelation
  onChange: (patch: Partial<UnitRelation>) => void
  onRemove: () => void
  disabled?: boolean
  defaultUnitName: string
}

function UnitRelationRow({
  relation,
  onChange,
  onRemove,
  disabled,
  defaultUnitName,
}: UnitRelationRowProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        {/* Left side: 1 [Unit] = */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-xs text-muted-foreground shrink-0">1</span>
          <div className="flex-1 min-w-0">
            <UnitAutocomplete
              value={relation.unitName}
              onChange={(name) => onChange({ unitName: name })}
              placeholder="Unit name"
              disabled={disabled}
            />
          </div>
          <span className="text-xs text-muted-foreground shrink-0">=</span>
        </div>

        {/* Middle: Quantity + Related Unit */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <input
            type="number"
            value={relation.quantity || ''}
            onChange={(e) => onChange({ quantity: parseFloat(e.target.value) || 0 })}
            placeholder="Qty"
            min="0.001"
            step="any"
            disabled={disabled}
            className="w-16 h-9 px-2 rounded-lg border border-input bg-background text-xs text-center outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
          />
          <div className="flex-1 min-w-0">
            <UnitAutocomplete
              value={relation.relatedUnitName}
              onChange={(name) => onChange({ relatedUnitName: name })}
              placeholder="Unit"
              disabled={disabled}
            />
          </div>
        </div>

        {/* Right side: Price + Purchase Cost + Remove */}
        <div className="flex items-center gap-1.5">
          <div className="relative w-24">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground">Rs.</span>
            <input
              type="number"
              value={relation.salePrice ?? ''}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                onChange({ salePrice: isNaN(v) ? null : v })
              }}
              placeholder="Price"
              title="Sale price per unit (leave empty if not sold in this unit)"
              min="0"
              step="0.01"
              disabled={disabled}
              className="w-full h-9 pl-7 pr-2 rounded-lg border border-input bg-background text-xs text-right outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
            />
          </div>
          <div className="relative w-24 hidden sm:block">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground">Rs.</span>
            <input
              type="number"
              value={relation.purchaseCost ?? ''}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                onChange({ purchaseCost: isNaN(v) ? null : v })
              }}
              placeholder="Cost"
              title="Purchase cost per unit (leave empty if not purchased in this unit)"
              min="0"
              step="0.01"
              disabled={disabled}
              className="w-full h-9 pl-7 pr-2 rounded-lg border border-input bg-background text-xs text-right outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
            />
          </div>
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Helper text showing computed conversion */}
      {relation.unitName && relation.relatedUnitName && relation.quantity > 0 && (
        <p className="text-[10px] text-muted-foreground mt-2">
          1 {relation.unitName} = {relation.quantity} × {relation.relatedUnitName}
          {relation.salePrice != null && relation.salePrice > 0 && (
            <span> · Rs. {relation.salePrice}/{relation.unitName}</span>
          )}
          {relation.purchaseCost != null && relation.purchaseCost > 0 && (
            <span> · Cost: Rs. {relation.purchaseCost}/{relation.unitName}</span>
          )}
        </p>
      )}
    </div>
  )
}

// ─── Unit Autocomplete ────────────────────────────────

function UnitAutocomplete({
  value,
  onChange,
  placeholder = 'Search unit...',
  disabled = false,
}: {
  value: string
  onChange: (name: string) => void
  placeholder?: string
  disabled?: boolean
}) {
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
        setResults(res.data?.data ?? [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 200)
  }, [search, open])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
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
        onChange={(e) => { setSearch(e.target.value); if (!open) setOpen(true) }}
        onFocus={() => { setOpen(true); setSearch('') }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { setOpen(false) }
          if (e.key === 'Enter' && open && results.length > 0) {
            e.preventDefault()
            onChange(results[0].name)
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
          className="absolute z-50 mt-1 w-full min-w-[140px] bg-popover border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto"
        >
          {loading && (
            <div className="px-3 py-2 text-xs text-muted-foreground">Searching...</div>
          )}
          {!loading && results.length > 0 && (
            <div className="py-1">
              {results.map((unit) => (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => { onChange(unit.name); setOpen(false); setSearch('') }}
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
            <div className="px-3 py-2 text-xs text-muted-foreground">Type to search units...</div>
          )}
        </div>
      )}
    </div>
  )
}
