import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { router, usePage } from '@inertiajs/react'
import { toast } from 'sonner'
import { Save, ChevronDown, ChevronUp, Search, Plus, Settings2, Beaker, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { getUnit, getBaseUnitOptions, getDefaultUnitForCategory } from '@/lib/units'
import { resolveUnitDisplay, formatStock } from '@/lib/product-unit-display'
import { calculateMargin } from '@/lib/product-adapter'
import UnitRelationEditor from '@/components/unit/UnitRelationEditor'
import ComponentPicker from '@/features/composition/ComponentPicker'
import { previewDraftCost } from '@/features/composition/api'
import type { ComponentSearchResult, DraftCostEstimate } from '@/features/composition/types'
import { formatCurrency } from '@/lib/format'
import { transformRelationships } from '@/lib/unit-relation-transformer'
import type { UnitRelation } from '@/lib/unit-relation-validator'
import type { SellingUnit } from '@/types'

interface ProductFormProps {
  mode: 'create' | 'edit'
  categories: any[]
  product?: Record<string, any> | null
  generatedSku?: string
  initialSetupFormula?: boolean
  /** Only users who may see cost get live formula costing. */
  canViewCost?: boolean
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

// ── Main Component ──

interface DraftIngredient {
  key: string
  componentId: number
  name: string
  unitId: string
  unitLabel: string
  quantity: string
  wastage: string
  unitOptions: { id: string; label: string }[]
}

let draftIngredientSeq = 0

function draftIngredientFrom(component: ComponentSearchResult): DraftIngredient {
  draftIngredientSeq += 1
  const options = (component.unit_options ?? []).map((unit) => ({ id: unit.id, label: unit.label }))

  return {
    key: `ing-${draftIngredientSeq}`,
    componentId: component.id,
    name: component.name,
    unitId: component.base_unit_id,
    unitLabel: component.base_unit_name,
    quantity: '1',
    wastage: '',
    unitOptions: options.length > 0
      ? options
      : [{ id: component.base_unit_id, label: component.base_unit_name }],
  }
}

export default function ProductForm({ mode, categories = [], product = null, generatedSku, initialSetupFormula = false, canViewCost = false }: ProductFormProps) {
  const isEditing = mode === 'edit'

  // ── Creation kind ──
  // Fixed by the screen that opened this form: "Add Product" creates a physical
  // product, "Add Formula" creates an ingredient template. There is no toggle,
  // so the two workflows never overlap.
  const formulaMode = initialSetupFormula

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
  const [lowStockThreshold, setLowStockThreshold] = useState<string>(
    product?.low_stock_threshold != null ? String(product.low_stock_threshold) : ''
  )
  const [allowNegativeStock, setAllowNegativeStock] = useState(product?.allow_negative_stock ?? true)
  const [description, setDescription] = useState(product?.description || '')

  // ── Inline formula (create only) ──
  // A composition needs a product id, so it can only be created in the same
  // request — never before the product exists. These rows are sent along with
  // the product and committed together.
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([])
  const [yieldQuantity, setYieldQuantity] = useState('1')
  const [formulaNotes, setFormulaNotes] = useState('')

  const addIngredient = useCallback((component: ComponentSearchResult) => {
    setIngredients((prev) => (
      prev.some((row) => row.componentId === component.id)
        ? prev
        : [...prev, draftIngredientFrom(component)]
    ))
  }, [])

  const removeIngredient = useCallback((key: string) => {
    setIngredients((prev) => prev.filter((row) => row.key !== key))
  }, [])

  const updateIngredient = useCallback((key: string, patch: Partial<DraftIngredient>) => {
    setIngredients((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }, [])

  // ── Live formula cost (create only) ──
  // Cost is resolved by the server so the create screen uses the same maths as
  // the saved formula; it is never derived from ingredient prices on the client.
  const [draftCost, setDraftCost] = useState<DraftCostEstimate | null>(null)
  const [costLoading, setCostLoading] = useState(false)
  const [costError, setCostError] = useState(false)
  const costRequestId = useRef(0)

  useEffect(() => {
    if (!formulaMode || isEditing || !canViewCost || ingredients.length === 0) {
      costRequestId.current += 1
      setDraftCost(null)
      setCostError(false)
      setCostLoading(false)

      return
    }

    const parsed = ingredients.map((row) => ({
      componentProductId: row.componentId,
      quantity: Number(row.quantity),
      unitId: row.unitId,
      wastagePct: Number(row.wastage || 0),
    }))

    if (parsed.some((item) => !Number.isFinite(item.quantity) || item.quantity <= 0)) {
      costRequestId.current += 1
      setDraftCost(null)

      return
    }

    const requestId = costRequestId.current + 1
    costRequestId.current = requestId

    const timer = setTimeout(() => {
      setCostLoading(true)
      previewDraftCost({
        baseUnitId,
        outputQuantity: Number(yieldQuantity) > 0 ? Number(yieldQuantity) : 1,
        items: parsed,
      })
        .then((estimate) => {
          if (costRequestId.current !== requestId) return
          setDraftCost(estimate)
          setCostError(false)
        })
        .catch(() => {
          if (costRequestId.current !== requestId) return
          setDraftCost(null)
          setCostError(true)
        })
        .finally(() => {
          if (costRequestId.current === requestId) setCostLoading(false)
        })
    }, 400)

    return () => clearTimeout(timer)
  }, [formulaMode, isEditing, canViewCost, ingredients, yieldQuantity, baseUnitId])

  // ── Unit relationships ──
  const [relationships, setRelationships] = useState<UnitRelation[]>([])

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

  // ── Unit relationships state ──
  // (replaces packaging levels + derived units + inline conversion)

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
  useEffect(() => {
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

  // ── Cost per base unit ──
  const costPerBaseUnit = parseFloat(purchaseCost) || 0

  // ── Build payload ──

  const buildPayload = useCallback(() => {
    // A formula is an ingredient template: it never starts with stock, holds no
    // opening quantity and is never replenished through a purchase.
    const stockQty = formulaMode ? 0 : (parseFloat(openingStock) || 0)
    const catId = categories.find((c: any) => c.name === category)?.id || null

    let packaging: any[] = []
    let sellingUnitsOut: any[] = []
    const unit = getUnit(baseUnitId)

    if (relationships.length > 0) {
      // Use the Relationship Transformer to generate packaging + selling_units
      const transformed = transformRelationships(
        unit?.name || baseUnitId || 'Unit',
        relationships
      )
      packaging = transformed.packaging
      sellingUnitsOut = transformed.selling_units
    } else {
      // Simple product — single selling unit
      sellingUnitsOut = [{
        name: unit?.name || 'Piece',
        quantity: 1,
        sale_price: sellingPrice,
        is_default: true,
        product_unit_id: null,
      }]
    }

    return {
      name: name.trim(),
      sku: sku || (category ? generateSku(category, skuSequence) : `PRD-${String(skuSequence).padStart(3, '0')}`),
      category_id: catId,
      barcode: barcode || '',
      description: description || '',
      base_unit_id: baseUnitId,
      selling_units: sellingUnitsOut,
      // Never send an empty packaging set on edit: relationships are not
      // hydrated into this form, and an empty array would delete existing
      // packaging and derived selling units. It becomes explicit only when
      // the user actually adds a relationship.
      ...((!isEditing || relationships.length > 0) ? { packaging } : {}),
      low_stock_threshold: lowStockThreshold.trim() !== '' && Number.isFinite(Number(lowStockThreshold))
        ? Number(lowStockThreshold)
        : (isEditing ? (product?.low_stock_threshold ?? 0) : 0),
      // A new formula has no purchase cost. On edit the existing value is
      // preserved untouched — this only stops a stale entry becoming a cost.
      default_purchase_cost: formulaMode && !isEditing
        ? null
        : (purchaseCost ? parseFloat(purchaseCost) : null),
      allow_negative_stock: allowNegativeStock,
      // Sent only when creating a formula with ingredients entered up front; the
      // server creates product and composition in one transaction.
      ...(!isEditing && formulaMode && ingredients.length > 0 ? {
        composition: {
          kind: 'consumption',
          name: name.trim() || null,
          output_quantity: Number(yieldQuantity) || 1,
          output_unit_id: baseUnitId,
          notes: formulaNotes.trim() || null,
          items: ingredients.map((row, index) => ({
            component_product_id: row.componentId,
            quantity: Number(row.quantity),
            unit_id: row.unitId,
            wastage_pct: row.wastage.trim() === '' ? 0 : Number(row.wastage),
            sort_order: index,
          })),
        },
      } : {}),
      ...(isEditing ? {} : {
        stock_quantity: stockQty,
        status: stockQty === 0 ? 'out-of-stock' : 'in-stock',
      }),
    }
  }, [
    name, sku, skuSequence, category, barcode, description, baseUnitId,
    relationships, sellingPrice,
    openingStock, lowStockThreshold, purchaseCost, allowNegativeStock,
    isEditing, product, categories, formulaMode,
    ingredients, yieldQuantity, formulaNotes,
  ])

  // ── Save handlers ──

  const validate = useCallback((): boolean => {
    if (!name.trim()) {
      toast.error(`${formulaMode ? 'Formula' : 'Product'} name is required`)
      nameInputRef.current?.focus()
      return false
    }

    // Only when ingredients are being entered now; empty is valid (add later).
    if (!isEditing && formulaMode) {
      for (const row of ingredients) {
        if (!Number.isFinite(Number(row.quantity)) || Number(row.quantity) <= 0) {
          toast.error(`Enter a quantity greater than zero for ${row.name}`)
          return false
        }
        if (row.wastage.trim() !== '') {
          const wastage = Number(row.wastage)
          if (!Number.isFinite(wastage) || wastage < 0 || wastage > 100) {
            toast.error(`Wastage for ${row.name} must be between 0 and 100`)
            return false
          }
        }
      }

      if (ingredients.length > 0 && (!Number.isFinite(Number(yieldQuantity)) || Number(yieldQuantity) <= 0)) {
        toast.error('Formula yield must be greater than zero')
        return false
      }
    }

    return true
  }, [name, formulaMode, isEditing, ingredients, yieldQuantity])

  const handleSave = useCallback((stay = false) => {
    if (!validate()) return

    setSaving(true)
    const payload = buildPayload()
    // "Save & Add Next" makes no sense when a formula is being created inline:
    // the user should land on the formula they just built.
    const effectiveStay = stay && !payload.composition
    const fullPayload: Record<string, any> = {
      ...payload,
      _stay: effectiveStay,
      ...(!isEditing && !effectiveStay && formulaMode && !payload.composition ? { _setup_formula: true } : {}),
    }
    if (product?.id) {
      fullPayload._product_id = product.id
    }

    const url = product?.id ? `/inventory/product/${product.id}` : '/inventory'
    const method = product?.id ? 'put' as const : 'post' as const

    router[method](url, fullPayload, {
      onSuccess: () => {
        toast.success(`${name.trim()} ${isEditing ? 'updated' : 'saved'} ✓`)
        if (effectiveStay && !isEditing) {
          setSkuSequence((s) => s + 1)
          setSessionCount((c) => c + 1)
          setName('')
          setOpeningStock('')
          setRelationships([])
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
  }, [name, isEditing, formulaMode, baseUnitId, validate, buildPayload, product?.id])

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
            {isEditing
              ? 'Edit Product'
              : formulaMode
                ? 'Add Formula'
                : 'Add Product'}
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

          {/* Cost Price + Selling Price. A formula has no purchase cost: its cost
              is derived from ingredient prices, so asking for one would imply it
              is bought at that price. */}
          <div className={cn('grid grid-cols-1 gap-4', !formulaMode && 'sm:grid-cols-2')}>
            {!formulaMode && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-foreground">Your Cost (Rs.)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">Rs.</span>
                  <input type="number" placeholder="0" value={purchaseCost}
                    onChange={(e) => setPurchaseCost(e.target.value)}
                    className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30" min="0" step="0.01" />
                </div>
              </div>
            )}
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

          {formulaMode && (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              A formula has no purchase cost — its cost is calculated from ingredient prices.
            </p>
          )}

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

          {/* ── Unit Relationships ── */}
          <div className="pt-2">
            <UnitRelationEditor
              defaultUnitId={baseUnitId}
              onDefaultUnitChange={setBaseUnitId}
              relationships={relationships}
              onRelationshipsChange={setRelationships}
            />
          </div>

          {/* The formula itself lives on the product page's Formula tab; this
              form only points there. New formulas are authored on the Add
              Formula screen instead. */}
          {isEditing && (
            <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-3.5">
              <div className="flex items-start gap-2.5">
                <Beaker className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Formula / composition</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                    The formula is managed separately from product details. Editing this form does not change ingredients or stock.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 gap-1.5"
                    onClick={() => router.visit(`/inventory/product/${product?.id}?tab=composition`)}
                  >
                    <Beaker className="size-3.5" /> Open Formula tab
                  </Button>
                </div>
              </div>
            </div>
          )}

          <SectionDivider />

          {/* ── Inline ingredients (create + formula only) ──
              Optional: leaving this empty keeps the previous "add later" flow,
              but when filled the product and formula are created together. */}
          {!isEditing && formulaMode && (
            <div className="space-y-3 rounded-xl border border-border p-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Ingredients</h3>
                <span className="text-xs text-muted-foreground">
                  {ingredients.length} added
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Optional — leave empty to add ingredients later on the Formula tab.
              </p>

              {ingredients.length > 0 && (
                <div className="space-y-2">
                  {ingredients.map((row) => (
                    <div key={row.key} className="space-y-2 rounded-lg border border-border p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-medium">{row.name}</span>
                        <button
                          type="button"
                          onClick={() => removeIngredient(row.key)}
                          aria-label={`Remove ${row.name}`}
                          className="text-muted-foreground transition-colors hover:text-red-500"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          min="0.000001"
                          step="any"
                          value={row.quantity}
                          onChange={(e) => updateIngredient(row.key, { quantity: e.target.value })}
                          aria-label={`${row.name} quantity`}
                          placeholder="Qty"
                          className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm tabular-nums outline-none focus:border-ring"
                        />
                        <select
                          value={row.unitId}
                          onChange={(e) => updateIngredient(row.key, { unitId: e.target.value })}
                          aria-label={`${row.name} unit`}
                          className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus:border-ring"
                        >
                          {row.unitOptions.map((option) => (
                            <option key={option.id} value={option.id}>{option.label}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          value={row.wastage}
                          onChange={(e) => updateIngredient(row.key, { wastage: e.target.value })}
                          aria-label={`${row.name} wastage percent`}
                          placeholder="Wastage %"
                          className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm tabular-nums outline-none focus:border-ring"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <ComponentPicker
                excludeProductId={0}
                excludedComponentIds={ingredients.map((row) => row.componentId)}
                onSelect={addIngredient}
                disabled={saving}
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-foreground">Yield quantity</label>
                  <input
                    type="number"
                    min="0.000001"
                    step="any"
                    value={yieldQuantity}
                    onChange={(e) => setYieldQuantity(e.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm tabular-nums outline-none focus:border-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-foreground">Yield unit</label>
                  <div className="h-10 rounded-lg border border-input bg-muted px-3 text-sm leading-10">
                    {resolveUnitDisplay(baseUnitId)}
                  </div>
                </div>
              </div>

              {/* Live cost: the server applies the same line maths as the saved
                  formula, so this cannot drift from the Formula tab. */}
              {canViewCost && ingredients.length > 0 && (
                <div className="rounded-lg border border-border bg-muted/30 p-3" aria-live="polite">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[11px] font-medium text-muted-foreground">Estimated cost</span>
                    <span className="text-sm font-semibold tabular-nums">
                      {costLoading && !draftCost
                        ? 'Calculating…'
                        : draftCost?.total_cost == null
                          ? '—'
                          : formatCurrency(draftCost.total_cost)}
                    </span>
                  </div>
                  {draftCost?.unit_cost != null && (
                    <div className="mt-1 flex items-baseline justify-between gap-3">
                      <span className="text-[11px] text-muted-foreground">Cost per {resolveUnitDisplay(baseUnitId)}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">{formatCurrency(draftCost.unit_cost)}</span>
                    </div>
                  )}
                  {draftCost && !draftCost.complete && (
                    <p className="mt-1.5 text-[11px] leading-relaxed text-amber-600 dark:text-amber-400">
                      Some ingredients have no recorded cost, so the total is incomplete.
                    </p>
                  )}
                  {draftCost?.is_estimated && (
                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                      Based on last known ingredient prices.
                    </p>
                  )}
                  {costError && (
                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                      Cost preview is unavailable right now — you can still save the formula.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-foreground">Formula notes</label>
                <textarea
                  rows={2}
                  value={formulaNotes}
                  onChange={(e) => setFormulaNotes(e.target.value)}
                  placeholder="Optional"
                  className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                />
              </div>
            </div>
          )}

          <SectionDivider />
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

                {/* ── Stock. A formula is not stocked, so these would imply a
                       balance that no sale or purchase ever moves. ── */}
                {!formulaMode && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-foreground">
                          {isEditing ? 'Current Stock' : 'Starting Quantity'}
                        </label>
                        {isEditing ? (
                          <div className="w-full h-10 px-3 rounded-lg border border-input bg-muted text-sm leading-10">
                            {formatStock(product?.stock_quantity ?? 0, resolveUnitDisplay(baseUnitId))}
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
                  </>
                )}

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
