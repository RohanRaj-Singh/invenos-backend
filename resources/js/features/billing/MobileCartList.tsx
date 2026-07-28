import { useState, useRef, useEffect } from 'react'
import { Minus, Plus, Trash2, Package, ChevronDown } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface MobileCartItem {
  id: string
  /** Stable product ID used for price/unit change callbacks */
  productId?: string
  productName: string
  packName?: string
  baseUnitName?: string
  unitQty?: number
  quantity: number
  unitCost: number
  totalCost: number
  /** Selling units for the unit selector (optional) */
  sellingUnits?: { id: string; name: string }[]
  /** Custom measurement options (optional) */
  customUnits?: { id: string; label: string }[]
  /** Currently selected unit id (optional) */
  selectedUnitId?: string
}

interface MobileCartListProps {
  items: MobileCartItem[]
  costLabel?: string
  onUpdateQty: (itemId: string, delta: number) => void
  onRemove: (itemId: string) => void
  /** Called when user selects a different unit (optional) */
  onChangeUnit?: (itemId: string, unitId: string) => void
  /** Called when user changes the unit price (optional) */
  onPriceChange?: (itemId: string, newPrice: number) => void
  /** Step value for the editable quantity (default "1") */
  qtyStep?: string
}

/** Inline quantity editor (tap-to-edit, supports custom values like 0.2 for kg) */
function EditableQty({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState(String(value))
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) ref.current?.focus() }, [editing])
  useEffect(() => { if (!editing) setInput(String(value)) }, [value, editing])

  if (editing) {
    return (
      <input ref={ref} type="number" value={input} step="any"
        onChange={(e) => setInput(e.target.value)}
        onBlur={() => { const v = parseFloat(input); if (!isNaN(v) && v > 0) onSave(v); setEditing(false) }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { const v = parseFloat(input); if (!isNaN(v) && v > 0) onSave(v); setEditing(false) }
          if (e.key === 'Escape') setEditing(false)
        }}
        className="w-14 h-8 text-center text-sm font-bold rounded-lg border border-primary bg-background outline-none tabular-nums"
        autoFocus
      />
    )
  }

  return (
    <button onClick={() => { setEditing(true); setInput(String(value)) }}
      className="w-12 h-8 flex items-center justify-center text-sm font-semibold tabular-nums hover:bg-muted/50 rounded-lg transition-colors border border-dashed border-transparent hover:border-border"
    >
      {value}
    </button>
  )
}

/** Inline price editor (tap-to-edit) */
function EditablePrice({ value, onSave, label }: { value: number; onSave: (v: number) => void; label?: string }) {
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState(String(value))
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) ref.current?.focus() }, [editing])
  useEffect(() => { if (!editing) setInput(String(value)) }, [value, editing])

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
        <input
          ref={ref}
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onBlur={() => { const v = parseFloat(input); if (!isNaN(v) && v > 0) onSave(v); setEditing(false) }}
          onKeyDown={(e) => { if (e.key === 'Enter') { const v = parseFloat(input); if (!isNaN(v) && v > 0) onSave(v); setEditing(false) } if (e.key === 'Escape') setEditing(false) }}
          className="w-20 h-7 px-2 rounded border border-primary bg-background text-sm font-semibold text-right outline-none tabular-nums"
          autoFocus
        />
      </div>
    )
  }

  return (
    <button onClick={() => setEditing(true)}
      className="text-sm font-semibold tabular-nums hover:bg-muted/50 px-1.5 py-0.5 rounded transition-colors"
    >
      {formatCurrency(value)}
    </button>
  )
}

/**
 * Card-based cart items for mobile (< 640px).
 * Supports inline quantity stepper, unit selector, editable price, and delete.
 */
export default function MobileCartList({
  items, costLabel = 'Cost', onUpdateQty, onRemove, onChangeUnit, onPriceChange, qtyStep = '1',
}: MobileCartListProps) {
  if (items.length === 0) return null

  return (
    <div className="space-y-3 pb-4">
      {items.map((item, idx) => {
        const hasUnitOptions = item.sellingUnits && item.sellingUnits.length > 0

        return (
          <div key={item.id} className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Product header */}
            <div className="flex items-start justify-between p-3 pb-2">
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <Package className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground leading-snug break-words">{item.productName}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {item.packName || 'Unit'}
                    {item.baseUnitName && ` · ${item.baseUnitName}`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onRemove(item.id)}
                className="flex items-center justify-center size-7 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors shrink-0 ml-2"
                aria-label="Remove item"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>

            {/* Unit selector (only shown when selling units are provided) */}
            {hasUnitOptions && onChangeUnit && (
              <div className="px-3 pb-2">
                <select
                  value={item.selectedUnitId || ''}
                  onChange={(e) => onChangeUnit(item.productId || item.id, e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring"
                >
                  {item.sellingUnits!.map((su) => (
                    <option key={su.id} value={su.id}>{su.name}</option>
                  ))}
                  {item.customUnits && item.customUnits.length > 0 && (
                    <optgroup label="Custom amount">
                      {item.customUnits.map((cu) => (
                        <option key={cu.id} value={cu.id}>{cu.label}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            )}

            {/* Qty stepper + cost row */}
            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onUpdateQty(item.id, -1)}
                  className="flex items-center justify-center size-8 rounded-lg border border-input bg-background text-muted-foreground hover:text-foreground hover:border-ring transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="size-3.5" />
                </button>
                <EditableQty value={item.quantity} onSave={(v) => onUpdateQty(item.id, v - item.quantity)} />
                <button
                  onClick={() => onUpdateQty(item.id, 1)}
                  className="flex items-center justify-center size-8 rounded-lg border border-input bg-background text-muted-foreground hover:text-foreground hover:border-ring transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>

              {/* Price (tap-to-edit when onPriceChange provided) */}
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground">{costLabel}</div>
                {onPriceChange ? (
                  <EditablePrice value={item.unitCost} onSave={(v) => onPriceChange(item.productId || item.id, v)} />
                ) : (
                  <div className="text-sm font-semibold tabular-nums">{formatCurrency(item.unitCost)}</div>
                )}
              </div>
            </div>

            {/* Total row */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-muted/30 border-t border-border">
              <span className="text-xs text-muted-foreground font-medium">Line Total</span>
              <span className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(item.totalCost)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
