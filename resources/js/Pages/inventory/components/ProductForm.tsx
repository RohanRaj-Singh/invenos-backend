import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { router, usePage } from '@inertiajs/react'
import { toast } from 'sonner'
import { Save, ChevronDown, ChevronUp, Search, Plus, Settings2, Beaker } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { getUnit, getBaseUnitOptions, getDefaultUnitForCategory } from '@/lib/units'
import { calculateMargin } from '@/lib/product-adapter'
import PackagingLevelsBuilder from './PackagingLevelsBuilder'
import type { SellingUnit, PackagingLevel, PackagingPreviewUnit } from '@/types'

interface ProductFormProps {
  mode: 'create' | 'edit'
  categories: any[]
  product?: Record<string, any> | null
  generatedSku?: string
}

// ── Helpers ──

const CATEGORY_PREFIX_MAP: Record<string, string> = {
  Medicine: 'MED', Groceries: 'GRO', Cosmetics: 'COS', Skincare: 'SKN',
  'Mobile Accessories': 'MOB', Electronics: 'ELE', 'Clinic Supplies': 'SUP',
}

function getCategoryPrefix(category: string): string {
  return CATEGORY_PREFIX_MAP[category] || 'PRD'
}

function generateSku(category: string, sequence: number): string {
  return getCategoryPrefix(category) + '-' + String(sequence).padStart(3, '0')
}

/** Check whether a unit ID represents a measurement type (weight/volume/length). */
function isMeasurementUnit(unitId: string): boolean {
  const unit = getUnit(unitId)
  return unit?.measurementType === 'weight' || unit?.measurementType === 'volume' || unit?.measurementType === 'length'
}

/** Check if a unit suggests packaging (count units that aren't Piece). */
function isPackagingUnit(unitId: string): boolean {
  const unit = getUnit(unitId)
  if (!unit || unit.measurementType !== 'count') return false
  const packagingUnits = ['box', 'carton', 'bottle', 'strip', 'packet', 'sachet', 'roll', 'tray']
  return packagingUnits.includes(unit.id)
}

// ── Main Component ──

export default function ProductForm({ mode, categories = [], product = null, generatedSku }: ProductFormProps) {
  const isEditing = mode === 'edit'

  // ── Quick Entry state ──
  const [name, setName] = useState(product?.name || '')
  const [purchaseCost, setPurchaseCost] = useState(String(product?.default_purchase_cost ?? product?.last_purchase_cost ?? ''))
  const [sellingPrice, setSellingPrice] = useState(product?.selling_units?.[0]?.sale_price ?? 0)
  const [baseUnitId, setBaseUnitId] = useState(product?.base_unit_id || 'piece')

  // ── Extended state (collapsed by default in Quick Entry mode) ──
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [category, setCategory] = useState('')
  const [barcode, setBarcode] = useState(product?.barcode || '')
  const [sku, setSku] = useState(product?.sku || generatedSku || '')
  const [openingStock, setOpeningStock] = useState(isEditing ? String(product?.stock_quantity ?? '') : '')
  const [lowStockThreshold, setLowStockThreshold] = useState(String(product?.low_stock_threshold ?? '100'))
  const [allowNegativeStock, setAllowNegativeStock] = useState(product?.allow_negative_stock ?? true)
  const [description, setDescription] = useState('')

  // ── Packaging conversion (inline in Quick Entry for packaging-type units) ──
  // When user selects a packaging unit (Box, Strip, etc.), this captures
  // what the unit CONTAINS in base units. E.g. "Strip = 12 Capsules".
  const [pkgConversionQty, setPkgConversionQty] = useState(1)
  const [pkgConversionUnitId, setPkgConversionUnitId] = useState('')

  // ── Selling units ──
  const [sellingUnits, setSellingUnits] = useState<SellingUnit[]>(() => {
    if (product?.selling_units?.length) {
      return product.selling_units.map((su: any, i: number) => ({
        id: su.id || `su-${i}`,
        name: su.name || 'Unit',
        unitId: su.unit_id || su.unitId || product.base_unit_id || 'piece',
        quantity: su.quantity || 1,
        salePrice: su.sale_price ?? su.salePrice ?? 0,
        isDefault: su.is_default ?? su.isDefault ?? i === 0,
        productUnitId: su.product_unit_id ?? null,
        packagingId: su.packaging_id ?? null,
      }))
    }
    // Default: one Piece unit
    const unit = getUnit('piece')
    return [{
      id: 'default',
      name: unit?.name || 'Piece',
      unitId: 'piece',
      quantity: 1,
      salePrice: 0,
      isDefault: true,
      productUnitId: null,
      packagingId: null,
    }]
  })

  // ── Packaging state ──
  const [packagingLevels, setPackagingLevels] = useState<PackagingLevel[]>(() => {
    if (product?.packaging?.length) {
      return product.packaging.map((p: any, i: number) => ({
        _key: `pl-${p.id || i}`,
        containerUnitId: p.container_unit_id ?? p.containerUnitId ?? null,
        containerName: p.container_unit?.name || p.containerName || '',
        containsUnitId: p.contains_unit_id ?? p.containsUnitId ?? null,
        containsName: p.contains_unit?.name || p.containsName || '',
        quantity: p.quantity ?? 1,
        level: p.level ?? (i + 1),
      }))
    }
    return []
  })
  const [previewUnits, setPreviewUnits] = useState<PackagingPreviewUnit[]>([])

  // Reconcile preview units with sale prices
  const derivedUnits = useMemo(() => {
    return previewUnits.map((pu) => {
      const existing = sellingUnits.find((su) => su.productUnitId === pu.product_unit_id)
      return {
        ...pu,
        salePrice: existing?.salePrice ?? pu.sale_price,
        packagingId: existing?.packagingId ?? null,
        productUnitId: pu.product_unit_id,
      }
    })
  }, [previewUnits, sellingUnits])

  // ── Session ──
  const [sessionCount, setSessionCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const [skuSequence, setSkuSequence] = useState<number>(() => (product?.sku ? 0 : (window as any).__inertia_props?.products?.length ?? 0) + 1)

  // Auto-focus on mount
  useEffect(() => {
    nameInputRef.current?.focus()
  }, [sessionCount])

  // Sync category from product on edit
  useEffect(() => {
    if (product && categories.length > 0) {
      const catId = product.category_id ?? product.category?.id
      const cat = categories.find((c: any) => c.id === catId || c.name === product.category?.name)
      if (cat) setCategory(cat.name)
    }
  }, [])

  // Auto-generate SKU when category changes (only for create)
  useEffect(() => {
    if (!isEditing && category) {
      setSku(generateSku(category, skuSequence))
    }
  }, [category, skuSequence, isEditing])

  // When base unit changes: update the default selling unit name.
  // For packaging-type units, we wait for the inline conversion row instead.
  useEffect(() => {
    if (isPackagingUnit(baseUnitId)) return

    const unit = getUnit(baseUnitId)
    if (unit) {
      setSellingUnits((prev) => {
        const def = prev.find((su) => su.isDefault)
        if (def) {
          return prev.map((su) =>
            su.isDefault ? { ...su, name: unit.name, unitId: baseUnitId, quantity: 1 } : su
          )
        }
        return prev
      })
    }
  }, [baseUnitId])

  // When packaging conversion row is filled, sync it into the default selling unit.
  // E.g., user selects Strip as unit, then says "= 12 Capsules" → selling unit
  // becomes "Strip (qty: 12, unit: capsule)". Also updates baseUnitId to the
  // selected base unit so stock is tracked correctly.
  useEffect(() => {
    if (!isPackagingUnit(baseUnitId) || !pkgConversionUnitId || pkgConversionQty <= 0) return

    const unit = getUnit(baseUnitId)
    const baseUnit = getUnit(pkgConversionUnitId)
    if (!unit || !baseUnit) return

    setSellingUnits((prev) => {
      const def = prev.find((su) => su.isDefault)
      if (def) {
        return prev.map((su) =>
          su.isDefault ? {
            ...su,
            name: unit.name,
            unitId: pkgConversionUnitId,
            quantity: pkgConversionQty,
          } : su
        )
      }
      return prev
    })
  }, [pkgConversionQty, pkgConversionUnitId, baseUnitId])

  // ── Cost per base unit ──
  const costPerBaseUnit = parseFloat(purchaseCost) || 0

  // ── Detect product scenario ──
  const productScenario = useMemo<'simple' | 'measurement' | 'packaging'>(() => {
    if (isMeasurementUnit(baseUnitId)) return 'measurement'
    if (isPackagingUnit(baseUnitId)) return 'packaging'
    return 'simple'
  }, [baseUnitId])

  // ── Build payload ──

  const buildPayload = useCallback(() => {
    const stockQty = parseFloat(openingStock) || 0
    const catId = categories.find((c: any) => c.name === category)?.id || null

    // Merge derived preview units + custom selling units
    const mergedSellingUnits = [
      ...derivedUnits.map((du) => ({
        name: du.name,
        quantity: du.quantity,
        sale_price: du.salePrice ?? 0,
        is_default: false,
        product_unit_id: du.productUnitId,
      })),
      ...sellingUnits
        .filter((su) => !su.packagingId && !derivedUnits.some((du) => du.productUnitId === su.productUnitId))
        .map((su) => ({
          name: su.name,
          quantity: su.quantity,
          sale_price: su.salePrice,
          is_default: su.isDefault,
          product_unit_id: su.productUnitId ?? null,
        })),
    ]

    // Ensure at least one default
    if (mergedSellingUnits.length === 0 || !mergedSellingUnits.some((su) => su.is_default)) {
      if (mergedSellingUnits.length > 0) mergedSellingUnits[0].is_default = true
      else {
        const unit = getUnit(baseUnitId)
        mergedSellingUnits.push({
          name: unit?.name || 'Piece',
          quantity: 1,
          sale_price: sellingPrice,
          is_default: true,
          product_unit_id: null,
        })
      }
    }

    return {
      name: name.trim(),
      sku: sku || (category ? generateSku(category, skuSequence) : `PRD-${String(skuSequence).padStart(3, '0')}`),
      category_id: catId,
      barcode: barcode || '',
      description: description || '',
      product_type: 'simple',
      base_unit_id: baseUnitId,
      selling_units: mergedSellingUnits,
      packaging: packagingLevels
        .filter((pl) => pl.containerUnitId && pl.containsUnitId && pl.quantity > 0)
        .map((pl) => ({
          container_unit_id: pl.containerUnitId,
          contains_unit_id: pl.containsUnitId,
          quantity: pl.quantity,
          level: pl.level,
        })),
      stock_quantity: stockQty,
      low_stock_threshold: parseInt(lowStockThreshold) || 100,
      default_purchase_cost: purchaseCost ? parseFloat(purchaseCost) : null,
      allow_negative_stock: allowNegativeStock,
      status: stockQty === 0 ? 'out-of-stock' : 'in-stock',
    }
  }, [
    name, sku, skuSequence, category, barcode, description, baseUnitId,
    sellingUnits, packagingLevels, derivedUnits, sellingPrice,
    openingStock, lowStockThreshold, purchaseCost, allowNegativeStock, categories,
  ])

  // ── Save handlers ──

  const validate = useCallback((): boolean => {
    if (!name.trim()) {
      toast.error('Product name is required')
      nameInputRef.current?.focus()
      return false
    }
    return true
  }, [name])

  const handleSave = useCallback((stay = false) => {
    if (!validate()) return

    setSaving(true)
    const payload = buildPayload()
    const fullPayload: Record<string, any> = { ...payload, _stay: stay }
    if (product?.id) {
      fullPayload._product_id = product.id
    }

    const url = product?.id ? `/inventory/product/${product.id}` : '/inventory'
    const method = product?.id ? 'put' as const : 'post' as const

    router[method](url, fullPayload, {
      onSuccess: () => {
        toast.success(`${name.trim()} ${isEditing ? 'updated' : 'saved'} ✓`)
        if (stay && !isEditing) {
          setSkuSequence((s) => s + 1)
          setSessionCount((c) => c + 1)
          setName('')
          setOpeningStock('')
          setPackagingLevels([])
          setPreviewUnits([])
          setSellingUnits([{
            id: 'default', name: getUnit(baseUnitId)?.name || 'Piece', unitId: baseUnitId,
            quantity: 1, salePrice: 0, isDefault: true, productUnitId: null, packagingId: null,
          }])
          setTimeout(() => nameInputRef.current?.focus(), 0)
        }
        setSaving(false)
      },
      onError: (errs) => {
        const msg = Object.values(errs).join(', ') || 'Failed to save product'
        toast.error(msg)
        setSaving(false)
      },
    })
  }, [name, isEditing, baseUnitId, validate, buildPayload, product?.id])

  // ── Keyboard ──
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault()
      handleSave(true)
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSave(false)
    }
  }, [handleSave])

  // ── Render ──

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          {isEditing && product && (
            <p className="text-xs text-muted-foreground mb-0.5">
              Editing: {product.name} · SKU: {product.sku}
            </p>
          )}
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            {isEditing ? 'Edit Product' : 'Add Product'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => handleSave(true)} disabled={saving} className="gap-1.5 hidden sm:inline-flex">
            <Save className="size-3.5" /> Save &amp; Add Next
          </Button>
          <Button size="sm" onClick={() => handleSave(false)} disabled={saving} className="gap-1.5 shadow-sm">
            <Save className="size-3.5" /> {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* ── Form ── */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-5" onKeyDown={handleKeyDown}>
          {/* ════════════════════════════════════════════════ */}
          {/* QUICK ENTRY — always visible, 90% of use case */}
          {/* ════════════════════════════════════════════════ */}

          {/* Product Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              placeholder="e.g. Enter product name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 px-4 rounded-lg border border-input bg-background text-base outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 transition-shadow"
            />
          </div>

          {/* Cost Price + Selling Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground">Your Cost (Rs.)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">Rs.</span>
                <input type="number" placeholder="0" value={purchaseCost}
                  onChange={(e) => setPurchaseCost(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30" min="0" step="0.01" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground">
                Selling Price (Rs.) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">Rs.</span>
                <input type="number" placeholder="0" value={sellingPrice}
                  onChange={(e) => {
                    setSellingPrice(parseFloat(e.target.value) || 0)
                    setSellingUnits((prev) => prev.map((su, i) =>
                      i === 0 ? { ...su, salePrice: parseFloat(e.target.value) || 0 } : su
                    ))
                  }}
                  className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30" min="0" step="0.01" />
              </div>
              {sellingPrice <= 0 && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400">Set your selling price</p>
              )}
            </div>
          </div>

          {/* Unit + Category (Unit always visible, Category is full-width in quick entry) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground">Unit</label>
              <UnitSelect value={baseUnitId} onChange={setBaseUnitId} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground">Category</label>
              <CategorySelector categories={categories} value={category} onChange={setCategory} />
            </div>
          </div>

          {/* Scenario: packaging-type unit (Box, Strip, Carton…) */}
          {productScenario === 'packaging' && (
            <div className="space-y-2 px-3 py-3 rounded-lg bg-primary/[0.04]">
              <div className="text-xs font-medium text-foreground">
                Selling in <span className="font-semibold">{getUnit(baseUnitId)?.name || baseUnitId}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Each {getUnit(baseUnitId)?.name || baseUnitId}</span>
                <span className="text-muted-foreground">=</span>
                <input
                  type="number"
                  value={pkgConversionQty || ''}
                  onChange={(e) => setPkgConversionQty(parseFloat(e.target.value) || 0)}
                  placeholder="Qty"
                  min="0.01"
                  step="any"
                  className="w-16 h-8 px-2 rounded border border-input bg-background text-xs text-center outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
                />
                <span className="text-xs text-muted-foreground">×</span>
                <InlineUnitSelect
                  value={pkgConversionUnitId}
                  onChange={(id) => {
                    setPkgConversionUnitId(id)
                    // Also update the product base_unit_id so stock is tracked correctly
                    if (id) {
                      // This is handled by the useEffect above which syncs into sellingUnits
                    }
                  }}
                  placeholder="unit"
                  excludeId={baseUnitId}
                />
              </div>
              <div className="flex items-center gap-3 text-xs">
                {pkgConversionUnitId && pkgConversionQty > 0 ? (
                  <span className="text-muted-foreground">
                    ✓ {getUnit(baseUnitId)?.name || baseUnitId} × {pkgConversionQty} {getUnit(pkgConversionUnitId)?.name || pkgConversionUnitId} per unit
                  </span>
                ) : (
                  <span className="text-muted-foreground/60">Define what each {getUnit(baseUnitId)?.name || baseUnitId} contains</span>
                )}
                <button type="button" onClick={() => setAdvancedOpen(true)}
                  className="text-primary underline ml-auto">
                  Multi-level packaging
                </button>
              </div>
            </div>
          )}
          {productScenario === 'measurement' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/[0.04] text-xs text-muted-foreground">
              <span>⚙️</span>
              <span>Measurement product — selling in {baseUnitId} and sub-units is automatic</span>
            </div>
          )}

          {productScenario === 'simple' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 text-xs text-muted-foreground">
              <span>•</span>
              <span>Selling as {getUnit(baseUnitId)?.name || baseUnitId}</span>
            </div>
          )}

          <SectionDivider />

          {/* ════════════════════════════════════════════════ */}
          {/* MORE OPTIONS (collapsed) */}
          {/* ════════════════════════════════════════════════ */}
          <section>
            <button type="button" onClick={() => setAdvancedOpen(!advancedOpen)}
              className="w-full flex items-center justify-between py-1 group">
              <div className="flex items-center gap-2">
                <Settings2 className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="text-sm font-medium text-foreground">More Options</span>
              </div>
              {advancedOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
            </button>

            {advancedOpen && (
              <div className="mt-4 space-y-5 pt-4 border-t border-border">

                {/* ── Barcode + SKU ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-foreground">Barcode</label>
                    <input type="text" placeholder="Optional" value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-foreground">SKU</label>
                    <input type="text" placeholder="Auto-generated" value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 font-mono text-xs" />
                  </div>
                </div>

                {/* ── Stock ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-foreground">
                      {isEditing ? 'Current Stock' : 'Starting Quantity'}
                    </label>
                    {isEditing ? (
                      <div className="w-full h-10 px-3 rounded-lg border border-input bg-muted text-sm leading-10">
                        {product?.stock_quantity ?? 0} {getUnit(baseUnitId)?.name || baseUnitId}
                      </div>
                    ) : (
                      <input type="number" placeholder="0" value={openingStock}
                        onChange={(e) => setOpeningStock(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30" min="0" />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-foreground">Minimum Stock</label>
                    <input type="number" placeholder="10" value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30" min="0" />
                  </div>
                </div>

                {/* ── Packaging Levels (only for packaging-type units) ── */}
                {(productScenario === 'packaging' || packagingLevels.length > 0) && (
                  <div className="pt-1">
                    <PackagingLevelsBuilder
                      levels={packagingLevels}
                      onChange={setPackagingLevels}
                      baseUnitId={baseUnitId}
                      onPreview={setPreviewUnits}
                      disabled={false}
                    />
                  </div>
                )}

                {/* ── Selling Sizes (manual custom units) ── */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Selling Sizes
                  </h4>

                  {derivedUnits.length > 0 && (
                    <div className="mb-3 space-y-1">
                      <p className="text-[10px] text-muted-foreground">Auto-generated from packaging:</p>
                      {derivedUnits.map((du) => (
                        <DerivedUnitRow
                          key={du.product_unit_id}
                          unit={du}
                          sellingUnit={sellingUnits.find((su) => su.productUnitId === du.product_unit_id)}
                          onPriceChange={(price) => {
                            setSellingUnits((prev) => {
                              const existing = prev.find((su) => su.productUnitId === du.product_unit_id)
                              if (existing) {
                                return prev.map((su) =>
                                  su.productUnitId === du.product_unit_id ? { ...su, salePrice: price } : su
                                )
                              }
                              const unit = getUnit(baseUnitId)
                              return [...prev, {
                                id: `su-${du.product_unit_id}`,
                                name: du.name,
                                unitId: baseUnitId,
                                quantity: du.quantity,
                                salePrice: price,
                                isDefault: prev.length === 0,
                                productUnitId: du.product_unit_id,
                                packagingId: du.packagingId ?? null,
                              }]
                            })
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Manual custom selling units */}
                  {sellingUnits
                    .filter((su) => !su.packagingId && !derivedUnits.some((du) => du.productUnitId === su.productUnitId))
                    .map((su, idx) => (
                      <SellingUnitRow
                        key={su.id}
                        unit={su}
                        isDefault={idx === 0 && derivedUnits.length === 0}
                        costPerBaseUnit={costPerBaseUnit}
                        baseUnitId={baseUnitId}
                        onChange={(updated) => setSellingUnits((prev) =>
                          prev.map((s) => (s.id === updated.id ? updated : s))
                        )}
                        onRemove={idx > 0 || derivedUnits.length > 0 ? () => {
                          setSellingUnits((prev) => prev.filter((s) => s.id !== su.id))
                        } : undefined}
                        defaultSalePrice={sellingPrice}
                      />
                    ))}

                  <button type="button" onClick={() => {
                    const unit = getUnit(baseUnitId)
                    setSellingUnits((prev) => [...prev, {
                      id: `su-${Date.now()}`,
                      name: unit?.name || 'Piece',
                      unitId: baseUnitId,
                      quantity: 1,
                      salePrice: 0,
                      isDefault: prev.length === 0 && derivedUnits.length === 0,
                      productUnitId: null,
                      packagingId: null,
                    }])
                  }} className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                    <Plus className="size-3.5" /> Add Custom Size
                  </button>
                </div>

                {/* ── Negative Stock ── */}
                <SectionDivider />
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={allowNegativeStock}
                    onChange={(e) => setAllowNegativeStock(e.target.checked)}
                    className="size-4 rounded border-gray-300 accent-primary focus:ring-primary/30" />
                  <div>
                    <span className="text-sm font-medium text-foreground">Allow Negative Stock</span>
                    <p className="text-[11px] text-muted-foreground">Permit sales when stock is insufficient.</p>
                  </div>
                </label>

                {/* ── Description ── */}
                <SectionDivider />
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-foreground">Description</label>
                  <textarea placeholder="Optional product description..." value={description}
                    onChange={(e) => setDescription(e.target.value)} rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 resize-none" />
                </div>
              </div>
            )}
          </section>

          {/* ── Sticky Save Bar ── */}
          <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-card border-t border-border mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:justify-between z-10">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <kbd className="inline-flex items-center justify-center size-5 rounded bg-muted text-[10px] font-mono">↵</kbd>
              <span>Save &amp; Add Next</span>
              <span className="mx-1.5">·</span>
              <kbd className="inline-flex items-center justify-center size-5 rounded bg-muted text-[10px] font-mono">⌘↵</kbd>
              <span>Save &amp; View</span>
            </div>
            <div className="flex items-stretch sm:items-center gap-2">
              <Button variant="outline" size="lg" onClick={() => handleSave(false)} disabled={saving} className="gap-1.5 flex-1 sm:flex-initial">
                <Save className="size-4" /> Save &amp; View
              </Button>
              <Button size="lg" onClick={() => handleSave(true)} disabled={saving} className="gap-1.5 shadow-sm flex-1 sm:flex-initial">
                <Save className="size-4" /> Save &amp; Add Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Sub-components ──

function UnitSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const allOptions = getBaseUnitOptions().flatMap((g: any) => g.options.map((o: any) => ({ id: o.value, label: o.label })))
  const filtered = useMemo(() => {
    if (!search) return allOptions.filter(o => o.id !== value)
    return allOptions.filter(o => o.label.toLowerCase().includes(search.toLowerCase()) && o.id !== value)
  }, [search, allOptions, value])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setOpen(false); setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative">
      <input ref={inputRef} type="text" value={open ? search : (allOptions.find(o => o.id === value)?.label || value)}
        placeholder="Unit" onChange={e => { setSearch(e.target.value); if (!open) setOpen(true) }}
        onFocus={() => { setOpen(true); setSearch('') }}
        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30" />
      {open && (
        <div ref={panelRef} className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {filtered.map((o) => (
            <button key={o.id} type="button" onClick={() => { onChange(o.id); setOpen(false); setSearch('') }}
              className={cn('w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors', o.id === value && 'bg-primary/5 text-primary font-medium')}>
              {o.label}
            </button>
          ))}
          {!search && filtered.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">No units</div>
          )}
        </div>
      )}
    </div>
  )
}

function CategorySelector({ categories, value, onChange }: { categories: any[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const filtered = useMemo(() => !search ? categories : categories.filter((c: any) => c.name.toLowerCase().includes(search.toLowerCase())), [search, categories])
  const showCreate = search.trim().length > 0 && !categories.some((c: any) => c.name.toLowerCase() === search.trim().toLowerCase())

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && inputRef.current && !inputRef.current.contains(e.target as Node)) { setOpen(false) }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative">
      <input ref={inputRef} type="text" placeholder="Search category..." value={open ? search : value}
        onChange={e => { setSearch(e.target.value); if (!open) setOpen(true) }}
        onFocus={() => { setOpen(true); setSearch('') }}
        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring" />
      {open && (
        <div ref={panelRef} className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filtered.map((c: any) => (
            <button key={c.id} type="button" onClick={() => { onChange(c.name); setOpen(false); setSearch('') }}
              className={cn('w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted transition-colors', value === c.name && 'bg-primary/5 text-primary')}>
              <span>{c.name}</span>
              <span className="text-[10px] text-muted-foreground">{c.productCount || 0}</span>
            </button>
          ))}
          {showCreate && (
            <button type="button" onClick={() => { onChange(search.trim()); setOpen(false); setSearch('') }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary/5 border-t border-border">
              <Plus className="size-3.5" /> Create "{search.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  )
}

interface SellingUnitRowProps {
  unit: SellingUnit
  isDefault: boolean
  costPerBaseUnit: number
  baseUnitId: string
  onChange: (u: SellingUnit) => void
  onRemove?: () => void
  defaultSalePrice: number
}

function SellingUnitRow({ unit, isDefault, costPerBaseUnit, baseUnitId, onChange, onRemove, defaultSalePrice }: SellingUnitRowProps) {
  const baseName = getUnit(baseUnitId)?.name || baseUnitId || 'unit'
  const cost = costPerBaseUnit * (unit.quantity || 1)
  const margin = unit.salePrice > 0 ? calculateMargin(unit.salePrice, cost) : null

  return (
    <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors min-h-[40px]', isDefault ? 'bg-primary/[0.04]' : 'bg-card hover:bg-muted/20')}>
      {/* Pack name */}
      <input type="text" value={unit.name} onChange={e => onChange({ ...unit, name: e.target.value })}
        className="w-20 h-8 px-2 rounded border border-input bg-background text-xs outline-none focus:border-ring shrink-0" placeholder="Name" />

      <span className="text-[11px] text-muted-foreground shrink-0">×</span>

      {/* Quantity */}
      <input type="number" value={unit.quantity || 1} onChange={e => onChange({ ...unit, quantity: parseFloat(e.target.value) || 1 })}
        className="w-16 h-8 px-2 rounded border border-input bg-background text-xs text-right outline-none focus:border-ring"
        min="0.001" step="any" />

      <span className="text-[11px] text-muted-foreground whitespace-nowrap truncate">{baseName}</span>

      {/* Price */}
      <div className="w-24 shrink-0 relative ml-auto">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">Rs.</span>
        <input type="number" value={unit.salePrice || ''}
          onChange={e => onChange({ ...unit, salePrice: parseFloat(e.target.value) || 0 })}
          className="w-full h-8 pl-7 pr-2 rounded border border-input bg-background text-xs tabular-nums outline-none focus:border-ring" min="0" step="0.01" />
      </div>

      <div className="flex-1 min-w-0 text-xs">
        {!costPerBaseUnit ? (
          <span className="text-muted-foreground/60">—</span>
        ) : !unit.salePrice ? (
          <span className="text-amber-600 tabular-nums">≈ Rs. {Math.round(cost * 1.3)}</span>
        ) : margin ? (
          <span className={cn('tabular-nums', margin.profit >= 0 ? 'text-emerald-600' : 'text-red-500')}>
            {Math.round(margin.marginPercent)}%
          </span>
        ) : null}
      </div>

      {onRemove && (
        <button type="button" onClick={onRemove} className="size-7 flex items-center justify-center rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
          <span className="text-lg leading-none">×</span>
        </button>
      )}
    </div>
  )
}

function DerivedUnitRow({
  unit,
  sellingUnit,
  onPriceChange,
}: {
  unit: { name: string; quantity: number; salePrice: number; product_unit_id: number }
  sellingUnit?: SellingUnit
  onPriceChange: (price: number) => void
}) {
  const currentPrice = sellingUnit?.salePrice ?? unit.salePrice ?? 0

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/[0.03] text-sm">
      <span className="font-medium text-foreground text-xs min-w-[60px]">{unit.name}</span>
      <span className="text-[11px] text-muted-foreground">= {unit.quantity} base units</span>
      <div className="w-24 shrink-0 relative ml-auto">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">Rs.</span>
        <input type="number" value={currentPrice || ''}
          onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
          className="w-full h-8 pl-7 pr-2 rounded border border-input bg-background text-xs tabular-nums outline-none focus:border-ring" min="0" step="0.01"
          placeholder="Set price" />
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0">(generated)</span>
    </div>
  )
}

function InlineUnitSelect({
  value,
  onChange,
  placeholder = 'unit',
  excludeId,
}: {
  value: string
  onChange: (id: string) => void
  placeholder?: string
  excludeId?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const allOptions = getBaseUnitOptions().flatMap((g: any) => g.options.map((o: any) => ({ id: o.value, label: o.label })))
  const filtered = useMemo(() => {
    if (!search) return allOptions.filter(o => o.id !== value && o.id !== excludeId)
    return allOptions.filter(o => o.label.toLowerCase().includes(search.toLowerCase()) && o.id !== value && o.id !== excludeId)
  }, [search, allOptions, value, excludeId])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setOpen(false); setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative">
      <input ref={inputRef} type="text" value={open ? search : (allOptions.find(o => o.id === value)?.label || value)}
        placeholder={placeholder} onChange={e => { setSearch(e.target.value); if (!open) setOpen(true) }}
        onFocus={() => { setOpen(true); setSearch('') }}
        className="w-24 h-8 px-2 rounded border border-input bg-background text-xs outline-none focus:border-ring" />
      {open && (
        <div ref={panelRef} className="absolute z-50 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto w-36">
          {filtered.map((o) => (
            <button key={o.id} type="button" onClick={() => { onChange(o.id); setOpen(false); setSearch('') }}
              className={cn('w-full px-2.5 py-1.5 text-xs text-left hover:bg-muted transition-colors', o.id === value && 'bg-primary/5 text-primary')}>
              {o.label}
            </button>
          ))}
          {filtered.length === 0 && !search && (
            <div className="px-2.5 py-1.5 text-xs text-muted-foreground">Type to search</div>
          )}
        </div>
      )}
    </div>
  )
}

function SectionDivider() {
  return <div className="border-t border-border/60" />
}
