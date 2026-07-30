import { useState, useMemo, useEffect } from 'react'
import { Search, Plus, Minus, X, Pill, Clock, CalendarDays, FileText, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { getMeasurementOptions } from '@/lib/measurement-options'
import { resolveUnitDisplay, formatWithUnit } from '@/lib/product-unit-display'

export interface MedicineDosage {
  productId: string
  dosage: string
  frequency: string
  duration: string
  notes: string
}

export interface MedicineEntry {
  id: string
  productId: string
  name: string
  packagingName: string
  packagingQuantity: number
  baseUnitQuantity: number
  baseQuantity: number
  unitPrice: number
  total: number
  category: string
  dosage: string
  frequency: string
  duration: string
  notes: string
  sellingUnitId?: number | null
}

interface AddMedicineDialogProps {
  open: boolean
  onClose: () => void
  onAdd: (entry: MedicineEntry) => void
  selectedIds: string[]
  editEntry?: MedicineEntry | null
  products?: any[]
}

// Backend selling units structure
interface BackendSellingUnit {
  id: number
  name: string
  quantity: number
  sale_price: number
  is_default: boolean
  unit_id: string
  product_unit_id?: number | null
  packaging_id?: number | null
}

export default function AddMedicineDialog({ open, onClose, onAdd, selectedIds, editEntry, products: serverProducts }: AddMedicineDialogProps) {
  const allProducts = serverProducts || []

  const [search, setSearch] = useState('')
  const [working, setWorking] = useState<any>(null)
  const [qtyInput, setQtyInput] = useState('1')

  // Get smallest selling unit (lowest quantity = base unit)
  const getSmallestUnit = (product: any) => {
    const sus = product.selling_units || product.sellingUnits || []
    return sus.length > 0
      ? sus.reduce((a: any, b: any) => (a.quantity || 1) < (b.quantity || 1) ? a : b)
      : null
  }

  // When editEntry changes, pre-fill
  useEffect(() => {
    if (open && editEntry) {
      const product = (serverProducts || []).find((p: any) => String(p.id) === String(editEntry.productId))
      if (product) {
        const sus = product.selling_units || product.sellingUnits || []
        const su = sus.find((u: any) => u.name === editEntry.packagingName) || getSmallestUnit(product)
        if (su) {
          setWorking({
            product,
            sellingUnit: su,
            packagingName: su.name,
            packagingQuantity: editEntry.packagingQuantity,
            baseUnitQuantity: su.quantity || 1,
            baseQuantity: editEntry.baseQuantity,
            unitPrice: editEntry.unitPrice,
            total: editEntry.total,
            dosage: editEntry.dosage,
            frequency: editEntry.frequency,
            duration: editEntry.duration,
            notes: editEntry.notes,
          })
        }
      }
    }
  }, [open, editEntry])

  const filtered = useMemo(() => {
    if (!search.trim()) return serverProducts
    const q = search.toLowerCase()
    return (serverProducts || []).filter((p: any) =>
      p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q)
    )
  }, [search, serverProducts])

  const handleSelectProduct = (product: any) => {
    const su = getSmallestUnit(product)
    if (!su) return
    setWorking({
      product,
      sellingUnit: su,
      packagingName: su.name,
      packagingQuantity: 1,
      baseUnitQuantity: su.quantity || 1,
      baseQuantity: su.quantity || 1,
      unitPrice: su.sale_price || 0,
      total: su.sale_price || 0,
      dosage: '1',
      frequency: 'Once daily',
      duration: '7 days',
      notes: '',
    })
  }

  const handleChangeUnit = (product: any, su: any) => {
    setWorking((prev: any) => {
      if (!prev) return null
      return {
        ...prev,
        sellingUnit: su,
        packagingName: su.name,
        packagingQuantity: 1,
        baseUnitQuantity: su.quantity || 1,
        baseQuantity: su.quantity || 1,
        unitPrice: su.sale_price || 0,
        total: su.sale_price || 0,
      }
    })
  }

  const handleQtyChange = (delta: number) => {
    setWorking((prev: any) => {
      if (!prev) return null
      // Smart increment: 0.1 for measurement products, 1 for count products
      const increment = prev.baseUnitQuantity < 1 ? 0.1 : 1
      const current = prev.packagingQuantity || 1
      const newQty = Math.max(0.001, Math.round((current + delta * increment) * 1000) / 1000)
      return {
        ...prev,
        packagingQuantity: newQty,
        baseQuantity: newQty * prev.baseUnitQuantity,
        total: newQty * prev.unitPrice,
      }
    })
  }

  const handleAdd = () => {
    if (!working) return
    onAdd({
      id: editEntry ? editEntry.id : `med-${Date.now()}`,
      productId: String(working.product.id),
      name: working.product.name,
      packagingName: working.packagingName,
      packagingQuantity: working.packagingQuantity,
      baseUnitQuantity: working.baseUnitQuantity,
      baseQuantity: working.baseQuantity,
      unitPrice: working.unitPrice,
      total: working.total,
      category: working.product.category?.name || working.product.category || '',
      dosage: working.dosage,
      frequency: working.frequency,
      duration: working.duration,
      notes: working.notes,
      sellingUnitId: working.sellingUnit?.id || null,
    })
    if (editEntry) {
      handleClose()
    } else {
      setWorking(null)
      setSearch('')
    }
  }

  const handleClose = () => {
    setWorking(null)
    setSearch('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-lg gap-0 p-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="p-5 pb-3 shrink-0">
          <DialogTitle className="text-base">Add Medicine / Service</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="px-5 pb-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input type="text" placeholder="Search products..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30" autoFocus />
          </div>
        </div>

        {working ? (
          /* ─── Configuring a product ─── */
          <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold">{working.product.name}</h4>
                <p className="text-xs text-muted-foreground">{working.product.sku} · {working.product.category?.name || working.product.category}</p>
              </div>
              <button onClick={() => setWorking(null)} className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>

            {/* Selling Units selector — dropdown like SaleBill, with custom measurement options */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Selling Unit</label>
              {(() => {
                // Compute the correct select value: for regular selling units it's the name,
                // for custom measurement options it's the option ID
                const sus = working.product.selling_units || working.product.sellingUnits || []
                const isRegular = sus.some((u: any) => u.name === working.packagingName)
                const customOpts = getMeasurementOptions(working.product.base_unit_id)
                const isCustom = customOpts.some((o: any) => o.label === working.packagingName)
                const selectValue = isCustom
                  ? customOpts.find((o: any) => o.label === working.packagingName)?.id || working.packagingName
                  : isRegular ? working.packagingName : working.packagingName
                return (
              <select
                value={selectValue}
                onChange={(e) => {
                  const val = e.target.value
                  const product = working.product
                  const sus = product.selling_units || product.sellingUnits || []
                  // Check if it's a regular selling unit
                  const su = sus.find((u: any) => u.name === val)
                  if (su) {
                    handleChangeUnit(product, su)
                    return
                  }
                  // Custom measurement option
                  if (val.startsWith('__custom_')) {
                    const customOpts = getMeasurementOptions(product.base_unit_id)
                    const opt = customOpts.find((o: any) => o.id === val)
                    if (!opt) return
                    const pricePerBase = working.unitPrice > 0
                      ? working.unitPrice / working.baseUnitQuantity
                      : 0
                    const newUnitPrice = Math.round(pricePerBase * opt.factor * 100) / 100
                    setWorking((prev: any) => {
                      if (!prev) return null
                      return {
                        ...prev,
                        packagingName: opt.label,
                        packagingQuantity: 1,
                        baseUnitQuantity: opt.factor,
                        baseQuantity: opt.factor,
                        unitPrice: newUnitPrice,
                        total: newUnitPrice,
                        sellingUnit: null,
                      }
                    })
                  }
                }}
                className="w-full h-9 px-2.5 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 appearance-none cursor-pointer"
              >
                <optgroup label="Selling Units">
                  {(working.product.selling_units || working.product.sellingUnits || []).map((su: BackendSellingUnit) => (
                    <option key={su.id} value={su.name}>
                      {su.name} — {formatCurrency(su.sale_price || 0)}/each
                    </option>
                  ))}
                </optgroup>
                {(() => {
                  const customOpts = getMeasurementOptions(working.product.base_unit_id)
                  return customOpts.length > 0 ? (
                    <optgroup label="Custom amount">
                      {customOpts.map((opt: { id: string; label: string }) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </optgroup>
                  ) : null
                })()}
              </select>
            )
          })()}
            </div>

            {/* Quantity — custom typed input + increment/decrement */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Quantity</label>
              <div className="flex items-center gap-3">
                <button onClick={() => handleQtyChange(-1)} disabled={working.packagingQuantity <= 0.001}
                  className="flex items-center justify-center size-9 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed">
                  <Minus className="size-4" />
                </button>
                <input type="number" value={qtyInput}
                  onChange={(e) => {
                    const raw = e.target.value
                    // Allow clearing the field entirely
                    if (raw === '') {
                      setQtyInput('')
                      return
                    }
                    const v = parseFloat(raw)
                    if (!isNaN(v) && v > 0) {
                      setQtyInput(raw)
                      setWorking((prev: any) => {
                        if (!prev) return null
                        return {
                          ...prev,
                          packagingQuantity: v,
                          baseQuantity: v * prev.baseUnitQuantity,
                          total: v * prev.unitPrice,
                        }
                      })
                    }
                  }}
                  onBlur={() => {
                    // If empty or invalid on blur, reset to 1
                    if (qtyInput === '' || isNaN(parseFloat(qtyInput)) || parseFloat(qtyInput) <= 0) {
                      setQtyInput('1')
                      setWorking((prev: any) => {
                        if (!prev) return null
                        return { ...prev, packagingQuantity: 1, baseQuantity: 1 * prev.baseUnitQuantity, total: 1 * prev.unitPrice }
                      })
                    }
                  }}
                  step={working.baseUnitQuantity < 1 ? '0.001' : '1'}
                  min="0.001"
                  className="w-20 h-9 px-2 rounded-lg border border-input bg-background text-sm font-bold text-center outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 tabular-nums"
                />
                <button onClick={() => handleQtyChange(1)}
                  className="flex items-center justify-center size-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="size-4" />
                </button>
                <span className="text-xs text-muted-foreground">
                  × {working.packagingName} = {formatWithUnit(working.baseQuantity, resolveUnitDisplay(working.product.base_unit_id))}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground/70">
                ({formatCurrency(working.unitPrice || 0)} × {qtyInput || 0} = {formatCurrency(working.total || 0)})
                · {formatWithUnit(working.baseQuantity, resolveUnitDisplay(working.product.base_unit_id))} deducted from stock
              </p>
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Prescription Info</p>
            </div>

            {/* Dosage, Frequency, Duration */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-xs font-medium text-foreground"><Pill className="size-3" /> Dosage</label>
                <input type="text" value={working.dosage} placeholder="1 tablet"
                  onChange={(e) => setWorking({ ...working, dosage: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30" />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-xs font-medium text-foreground"><Clock className="size-3" /> Frequency</label>
                <input type="text" value={working.frequency} placeholder="Twice daily"
                  onChange={(e) => setWorking({ ...working, frequency: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30" />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-xs font-medium text-foreground"><CalendarDays className="size-3" /> Duration</label>
                <input type="text" value={working.duration} placeholder="7 days"
                  onChange={(e) => setWorking({ ...working, duration: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-xs font-medium text-foreground"><FileText className="size-3" /> Instructions</label>
              <input type="text" value={working.notes} placeholder="e.g. Take with food"
                onChange={(e) => setWorking({ ...working, notes: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30" />
            </div>

            {/* Total */}
            <div className="flex items-center justify-between py-2 px-4 rounded-xl bg-muted/50">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-bold">{formatCurrency(working.total)}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setWorking(null)} className="flex-1 h-10">Back to List</Button>
              <Button onClick={handleAdd} className="flex-1 h-10 gap-1.5 shadow-sm">
                <Plus className="size-4" /> Add to Prescription
              </Button>
            </div>
          </div>
        ) : (
          /* ─── Product list ─── */
          <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-1">
            {(filtered || []).length === 0 && (
              <div className="text-center py-12 text-sm text-muted-foreground">
                <Package className="size-8 mx-auto mb-2 text-muted-foreground/30" />
                No products found.
              </div>
            )}
            {(filtered || []).map((product: any) => {
              const sus = product.selling_units || product.sellingUnits || []
              const alreadySelected = selectedIds.includes(String(product.id))
              return (
                <button key={product.id} onClick={() => !alreadySelected && handleSelectProduct(product)}
                  disabled={alreadySelected}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-lg transition-colors',
                    alreadySelected ? 'bg-primary/5 opacity-60 cursor-not-allowed' : 'hover:bg-muted/50 active:bg-muted/80'
                  )}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{product.name}</span>
                        {alreadySelected && <span className="size-3.5 text-primary shrink-0">✓</span>}
                      </div>
                      {/* Selling units row */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {sus.length > 0 ? sus.map((u: BackendSellingUnit) => (
                          <span key={u.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-muted/60 text-muted-foreground">
                            {u.name} @ {formatCurrency(u.sale_price || 0)}
                          </span>
                        )) : (
                          <span className="text-[10px] text-muted-foreground/60">No selling units</span>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal shrink-0 ml-2">
                      {product.category?.name || product.category || ''}
                    </Badge>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
