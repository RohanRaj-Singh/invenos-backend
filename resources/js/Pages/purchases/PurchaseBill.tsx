import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
  Plus, Trash2, X, CheckCircle2, RotateCcw, Minus,
  Store, Building2, ChevronDown, Search, Phone, ChevronRight, ChevronDown as ChevronDownIcon, Printer, ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import { router, usePage } from '@inertiajs/react'
import { calculateSellingUnitCost, calculateMargin } from '@/lib/product-adapter'
import { getUnit } from '@/lib/units'
import { purchaseStrategy } from '@/domain/transactions/strategies/purchase'
import { TransactionSearchBar } from '@/features/transactions/search/SearchBar'
import { PaymentPanel } from '@/features/transactions/payment/PaymentPanel'
import { ConfirmTransactionDialog } from '@/features/transactions/dialogs/ConfirmDialog'
import { ConfirmClearDialog } from '@/features/transactions/dialogs/ClearConfirmDialog'
import { toast } from 'sonner'
import type { Contact, PaymentMethod } from '@/types'
import BillResponsiveWrapper from '@/features/billing/BillResponsiveWrapper'
import MobileCartList from '@/features/billing/MobileCartList'
import MobilePaymentDrawer from '@/features/billing/MobilePaymentDrawer'

// ─── Purchase CartItem ───────────────────────────────────────

interface PurchaseItem {
  id: string
  productId: string
  productName: string
  purchasePackName: string
  purchasePackQty: number
  purchaseQuantity: number
  baseUnitId: string
  baseUnitName: string
  unitCost: number
  totalCost: number
  discPct?: number
}

// ─── Supplier Combobox ───────────────────────────────────────

function SupplierCombobox({
  supplier, onSelect, onClear,
}: {
  supplier: Contact | null
  onSelect: (c: Contact) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const contacts = ((usePage().props as any).suppliers || []).map((s: any) => ({
    ...s,
    currentBalance: s.current_balance ?? s.opening_balance ?? 0,
  })) as Contact[]

  const suppliers = useMemo(() => contacts, [contacts])

  const filtered = useMemo(() => {
    if (!query) return suppliers
    const q = query.toLowerCase()
    return suppliers.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      (s.phone || '').includes(q) ||
      (s.contactPerson || '').toLowerCase().includes(q)
    )
  }, [query, suppliers])

  return (
    <div className="relative">
      {supplier ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-800">
          <Building2 className="size-4 text-emerald-600" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{supplier.name}</div>
            {supplier.phone && <div className="text-[10px] text-muted-foreground">{supplier.phone}</div>}
          </div>
          <button onClick={onClear} className="flex items-center justify-center size-6 rounded-md hover:bg-red-100 text-muted-foreground hover:text-red-500">
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-muted-foreground hover:border-ring transition-colors"
        >
          <Building2 className="size-4" />
          <span>Select supplier</span>
          <ChevronDown className="size-4 ml-auto" />
        </button>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-border bg-popover shadow-lg overflow-hidden">
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <input
                  type="text" placeholder="Search suppliers..." value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 rounded-lg bg-muted text-xs outline-none" autoFocus
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { onSelect(s); setOpen(false); setQuery('') }}
                  className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-center size-7 rounded-full bg-muted text-muted-foreground">
                    <Building2 className="size-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{s.name}</div>
                    {s.phone && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Phone className="size-2.5" />{s.phone}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────

export default function PurchaseBillPage() {
  const [supplier, setSupplier] = useState<Contact | null>(null)
  const [cart, setCart] = useState<PurchaseItem[]>([])
  const [search, setSearch] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [amountPaid, setAmountPaid] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [showConfirm, setShowConfirm] = useState(false)
  const [showMobilePayment, setShowMobilePayment] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [receiptRef, setReceiptRef] = useState('')
  const [receiptId, setReceiptId] = useState('')
  const [receiptCount, setReceiptCount] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [discountInput, setDiscountInput] = useState('')
  const [discountMode, setDiscountMode] = useState<'flat' | 'pct'>('flat')
  const [costOverrides, setCostOverrides] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [editingCost, setEditingCost] = useState<string | null>(null)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const editInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const { props: inertiaProps } = usePage()
  const rawProducts = (inertiaProps as any).products || []
  // Normalize backend snake_case → prototype camelCase
  const mockProducts = rawProducts.map((p: any) => ({
    ...p,
    id: p.id,
    name: p.name, sku: p.sku, barcode: p.barcode,
    category: p.category || p.category_id,
    baseUnitId: String(p.base_unit_id || 'piece'),
    baseUnit: p.base_unit_id,
    stockQuantity: p.stock_quantity || 0,
    lowStockThreshold: p.low_stock_threshold || 10,
    trackInventory: p.track_inventory !== false,
    sellingUnits: (p.selling_units || []).map((u: any) => ({
      ...u, id: u.id, name: u.name, quantity: u.quantity || 1,
      salePrice: u.sale_price || 0, isDefault: u.is_default || false,
      unitId: String(u.unit_id || ''),
      purchaseCost: u.purchase_cost ?? null,
    })),
    purchaseConfig: {
      name: 'Pack',
      quantity: 1,
      cost: p.default_purchase_cost || p.last_purchase_cost || 0,
    },
  }))
  const mockContacts = ((inertiaProps as any).suppliers || []).map((s: any) => ({
    ...s,
    currentBalance: s.current_balance ?? s.opening_balance ?? 0,
  }))
  const purchaseBills = [] as any[]

  // ── Filtered products ──
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return mockProducts
      .filter((p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        ((p.category?.name || p.category || '') + '').toLowerCase().includes(q)
      )
      .slice(0, 8)
  }, [search])

  // ── Totals ──
  const subtotal = useMemo(() => cart.reduce((s, c) => s + (costOverrides[c.productId] ?? c.unitCost) * c.purchaseQuantity, 0), [cart, costOverrides])
  const grandTotal = useMemo(() => Math.max(0, subtotal - discount), [subtotal, discount])

  // ── Intelligence: last cost + stock ──
  const { lastCosts, getStockLabel } = useMemo(() => {
    const lc: Record<string, { cost: number; date: string } | null> = {}
    const sl: Record<string, { qty: number; lowStock: number }> = {}
    for (const p of mockProducts) {
      sl[p.id] = { qty: p.stockQuantity, lowStock: p.lowStockThreshold }
    }
    for (const item of cart) {
      for (const bill of purchaseBills) {
        const found = bill.items.find((bi: any) => bi.productId === item.productId)
        if (found && !lc[item.productId]) {
          lc[item.productId] = { cost: found.unitCost, date: bill.date }
        }
      }
    }
    const getStockLabel = (productId: string) => sl[productId] || { qty: 0, lowStock: 10 }
    return { lastCosts: lc, getStockLabel }
  }, [cart])

  const toggleExpand = useCallback((itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }, [])

  // ── Cost editing ──
  const startEditCost = useCallback((itemId: string, productId: string, currentCost: number) => {
    setEditingCost(itemId)
    setEditingProductId(productId)
    setEditValue(String(costOverrides[productId] ?? currentCost))
  }, [costOverrides])

  const commitCost = useCallback(() => {
    if (editingProductId) {
      const val = parseFloat(editValue)
      if (!isNaN(val) && val > 0) {
        setCostOverrides((prev) => ({ ...prev, [editingProductId]: val }))
      }
    }
    setEditingCost(null)
    setEditingProductId(null)
    setEditValue('')
  }, [editingProductId, editValue])

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitCost()
    if (e.key === 'Escape') { setEditingCost(null); setEditValue('') }
  }

  useEffect(() => { if (editingCost) editInputRef.current?.focus() }, [editingCost])

  // ── Unit change ──
  const handleChangeUnit = useCallback((itemId: string, unitId: string) => {
    const item = cart.find((c) => c.id === itemId)
    if (!item) return
    const product = mockProducts.find((p) => p.id === item.productId)
    if (!product) return

    if (unitId === product.baseUnitId) {
      const costPerBase = product.purchaseConfig ? product.purchaseConfig.cost / product.purchaseConfig.quantity : item.unitCost / item.purchasePackQty
      setCart((prev) => prev.map((c) => c.id !== itemId ? c : {
        ...c,
        purchasePackName: product.baseUnitId,
        purchasePackQty: 1,
        unitCost: Math.round(costPerBase * 100) / 100,
        totalCost: c.purchaseQuantity * (Math.round(costPerBase * 100) / 100),
      }))
      setCostOverrides((prev) => { const r = { ...prev }; delete r[product.id]; return r })
    } else if (unitId.startsWith('__custom_')) {
      const opts = purchaseStrategy.getCustomUnitOptions({ id: product.id, name: product.name, sku: product.sku, category: product.category, baseUnitId: product.baseUnitId, sellingUnits: [] })
      const opt = opts.find((o: any) => o.id === unitId)
      if (!opt) return
      const costPerBase = product.purchaseConfig ? product.purchaseConfig.cost / product.purchaseConfig.quantity : item.unitCost / item.purchasePackQty
      const newCost = Math.round(costPerBase * opt.factor * 10000) / 10000
      setCart((prev) => prev.map((c) => c.id !== itemId ? c : {
        ...c,
        purchasePackName: opt.label,
        purchasePackQty: opt.factor,
        unitCost: newCost,
        totalCost: c.purchaseQuantity * newCost,
      }))
      setCostOverrides((prev) => { const r = { ...prev }; delete r[item.productId]; return r })
    } else {
      const pc = product.purchaseConfig
      if (!pc) return
      setCart((prev) => prev.map((c) => c.id !== itemId ? c : {
        ...c,
        purchasePackName: pc.name || 'Purchase Pack',
        purchasePackQty: pc.quantity,
        unitCost: pc.cost,
        totalCost: c.purchaseQuantity * pc.cost,
      }))
      setCostOverrides((prev) => { const r = { ...prev }; delete r[product.id]; return r })
    }
  }, [cart])

  // ── Add to cart ──
  const addToCart = useCallback((product: { id: string; name: string; sku: string; category: string; baseUnitId: string; purchaseConfig?: any }) => {
    const raw = mockProducts.find((p: any) => String(p.id) === String(product.id))
    if (!raw) return

    const pc = raw.purchaseConfig || { name: 'Pack', quantity: 1, cost: 0 }
    const unitId = raw.baseUnitId || 'piece'
    const baseUnitDef = getUnit(unitId) || { id: 'piece', name: 'Piece', measurementType: 'count' as const, baseFactor: 1, baseUnitId: 'piece' }
    const packName = pc.name || `${pc.quantity} ${baseUnitDef.name}`

    setCart((prev) => {
      const existing = prev.find((c) => c.productId === product.id)
      if (existing) {
        return prev.map((c) =>
          c.productId === product.id
            ? { ...c, purchaseQuantity: c.purchaseQuantity + 1, totalCost: (c.purchaseQuantity + 1) * c.unitCost }
            : c
        )
      }
      const item: PurchaseItem = {
        id: `pbi-${Date.now()}`,
        productId: raw.id,
        productName: raw.name,
        purchasePackName: packName,
        purchasePackQty: pc.quantity,
        purchaseQuantity: 1,
        baseUnitId: raw.baseUnitId,
        baseUnitName: baseUnitDef.name,
        unitCost: pc.cost,
        totalCost: pc.cost,
      }
      return [...prev, item]
    })
    setSearch('')
    setShowResults(false)
    searchInputRef.current?.focus()
  }, [])

  const updateQuantity = useCallback((itemId: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.id !== itemId) return c
        const n = c.purchaseQuantity + delta
        if (n <= 0) return null
        return { ...c, purchaseQuantity: n, totalCost: n * c.unitCost }
      }).filter(Boolean) as PurchaseItem[]
    )
  }, [])

  const removeItem = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((c) => c.id !== itemId))
  }, [])

  // ── Payment quick fill ──
  const handleQuickPay = useCallback(
    (type: 'full' | 'half' | 'none') => {
      if (type === 'full') setAmountPaid(String(subtotal))
      else if (type === 'half') setAmountPaid(String(Math.ceil(subtotal / 2)))
      else setAmountPaid('0')
    },
    [subtotal],
  )

  // ── Reset ──
  const resetPurchase = useCallback(() => {
    setCart([])
    setAmountPaid('')
    setDiscount(0)
    setDiscountInput('')
    setCostOverrides({})
    setExpandedItems(new Set())
    setTimeout(() => searchInputRef.current?.focus(), 100)
  }, [])

  // ── Record Purchase ──
  const handleRecordPurchase = useCallback(() => {
    if (!supplier) { toast.error('Please select a supplier'); return }
    if (cart.length === 0) { toast.error('Cart is empty'); return }

    const today = date
    setSaving(true)

    router.post('/purchases', {
      invoice_ref: `PUR-${Date.now().toString().slice(-6)}`,
      supplier_id: supplier.id,
      date,
      items: cart.map((c) => ({
        product_id: c.productId,
        purchase_pack_name: c.purchasePackName,
        purchase_pack_qty: c.purchasePackQty,
        purchase_quantity: c.purchaseQuantity,
        unit_cost: costOverrides[c.productId] ?? c.unitCost,
        total_cost: (costOverrides[c.productId] ?? c.unitCost) * c.purchaseQuantity,
        discount_pct: c.discPct ?? null,
      })),
      amount_paid: parseFloat(amountPaid) || 0,
      payment_method: paymentMethod,
      payment_status: parseFloat(amountPaid) >= subtotal ? 'paid' : parseFloat(amountPaid) > 0 ? 'partial' : 'unpaid',
      status: 'received',
      discount,
    }, {
      onSuccess: () => {
        setReceiptRef(`PUR-${Date.now().toString().slice(-6)}`)
        setReceiptId(`pur-${Date.now()}`)
        setReceiptCount(cart.length)
        setShowReceipt(true)
        setCart([])
        setAmountPaid('')
        setDiscount(0)
        setDiscountInput('')
        setCostOverrides({})
        setExpandedItems(new Set())
        setSaving(false)
        toast.success('Purchase recorded successfully')
        setTimeout(() => searchInputRef.current?.focus(), 100)
      },
      onError: (errs) => {
        const first = Object.values(errs)[0]
        toast.error(String(first || 'Failed to record purchase'))
        setSaving(false)
      },
    })
  }, [supplier, cart, subtotal, discount, paymentMethod, amountPaid, date, costOverrides])

  // ── Selling-unit yield breakdown per item ──
  const getSellingUnitBreakdown = useCallback((item: PurchaseItem) => {
    const product = mockProducts.find((p) => p.id === item.productId)
    if (!product) return []
    return product.sellingUnits.map((su) => {
      const costPerUnit = calculateSellingUnitCost(product, su.id)
      const yieldQty = item.purchaseQuantity * (item.purchasePackQty / su.quantity)
      const revenue = yieldQty * su.salePrice
      const { profit, marginPercent } = calculateMargin(su.salePrice, costPerUnit)
      return { name: su.name, costPerUnit, yieldQty, revenue, profit, marginPercent, salePrice: su.salePrice }
    })
  }, [])

  const itemCount = cart.reduce((sum, c) => sum + c.purchaseQuantity, 0)

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className="px-5 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-amber-500/10 text-amber-600">
              <Store className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-foreground leading-tight">New Purchase</h1>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {new Date(date).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <div className="w-64">
            <SupplierCombobox supplier={supplier} onSelect={setSupplier} onClear={() => setSupplier(null)} />
            {supplier && (
              <div className={cn('mt-1.5 text-[10px]', supplier.currentBalance > 0 ? 'text-amber-600 font-medium' : supplier.currentBalance < 0 ? 'text-emerald-600 font-medium' : 'text-muted-foreground')}>
                {supplier.currentBalance > 0
                  ? `You owe: ${formatCurrency(supplier.currentBalance)}`
                  : supplier.currentBalance < 0
                    ? `Credit: ${formatCurrency(Math.abs(supplier.currentBalance))}`
                    : 'Balance: Rs. 0'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <TransactionSearchBar
        search={search}
        onSearchChange={setSearch}
        showResults={showResults}
        onShowResultsChange={setShowResults}
        results={filteredProducts.map((p) => ({
          id: p.id, name: p.name, sku: p.sku,
          sellingUnits: [{ name: p.purchaseConfig?.name || 'Pack', salePrice: p.purchaseConfig?.cost }],
        }))}
        onAddProduct={addToCart as any}
        placeholder="Search product by name or SKU... (Enter to add)"
      />

      {/* ── Table (desktop) ── */}
      <div className="hidden sm:flex sm:flex-col sm:flex-1 sm:min-h-0">
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full" style={{tableLayout: 'fixed'}}>
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <Th className="w-8">#</Th>
                <Th className="w-[32%]">Product</Th>
                <Th className="w-28">Pack</Th>
                <Th className="w-20 text-center">Qty</Th>
                <Th className="w-28 text-right">Cost</Th>
                <Th className="w-28 text-right">Total</Th>
                <Th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {cart.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-sm text-muted-foreground">
                    <Store className="size-10 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="font-medium text-foreground">No items yet</p>
                    <p className="text-xs mt-1">Search for a product above, press Enter to add</p>
                  </td>
                </tr>
              ) : (
                cart.map((item, idx) => {
                  const breakdown = getSellingUnitBreakdown(item)
                  const stock = getStockLabel(item.productId)
                  const lc = lastCosts[item.productId]
                  const effectiveCost = costOverrides[item.productId] ?? item.unitCost
                  const priceChange = lc && lc.cost > 0 ? ((effectiveCost - lc.cost) / lc.cost) * 100 : 0
                  const showPriceAlert = lc && Math.abs(priceChange) >= 5
                  const isExpanded = expandedItems.has(item.id)
                  const stockRatio = stock.lowStock > 0 ? stock.qty / stock.lowStock : 0

                  return (
                    <tr key={item.id} className="border-b border-border hover:bg-muted/20 transition-colors group">
                      <Td className="w-10 text-center text-xs text-muted-foreground">{idx + 1}</Td>
                      <Td className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{item.productName}</div>
                        <div className="text-[10px] text-muted-foreground">{item.baseUnitName}</div>
                        {/* ── Yield breakdown in product cell ── */}
                        {breakdown.length > 0 && (
                          <div className="mt-0.5">
                            <button onClick={() => toggleExpand(item.id)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                              {isExpanded ? <ChevronDownIcon className="size-3" /> : <ChevronRight className="size-3" />}
                              Sell as:
                            </button>
                            {isExpanded && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {breakdown.map((su) => (
                                  <div key={su.name} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 inline-flex items-center gap-1">
                                    <span className="font-medium text-foreground">{su.name}</span>
                                    <span className="text-muted-foreground">@{formatCurrency(su.costPerUnit)} → {formatCurrency(su.salePrice)}</span>
                                    <span className={cn('font-medium', su.marginPercent > 0 ? 'text-emerald-600' : 'text-red-500')}>{su.marginPercent.toFixed(0)}%</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </Td>
                      <Td>
                        <select
                          value={item.purchasePackName === item.baseUnitId ? item.baseUnitId : 'purchase-pack'}
                          onChange={(e) => handleChangeUnit(item.id, e.target.value)}
                          className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs outline-none focus:border-ring"
                        >
                          <option value="purchase-pack">{item.purchasePackName}</option>
                          <option value={item.baseUnitId}>Per {item.baseUnitName}</option>
                          {(() => {
                            const product = mockProducts.find((p) => p.id === item.productId)
                            if (!product) return null
                            const customOpts = purchaseStrategy.getCustomUnitOptions({ id: product.id, name: product.name, sku: product.sku, category: product.category, baseUnitId: product.baseUnitId, sellingUnits: [] })
                            if (customOpts.length === 0) return null
                            return (
                              <optgroup label="Custom amount">
                                {customOpts.map((opt: any) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                              </optgroup>
                            )
                          })()}
                        </select>
                        <div className="text-[10px] text-muted-foreground">× {item.purchasePackQty} {item.baseUnitName}</div>
                      </Td>
                      <Td className="w-20 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <button onClick={() => updateQuantity(item.id, -1)} className="flex items-center justify-center size-6 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0">
                            <Minus className="size-3" />
                          </button>
                          <input
                            type="number"
                            defaultValue={item.purchaseQuantity}
                            onBlur={(e) => {
                              const v = parseFloat(e.target.value)
                              const target = e.currentTarget
                              if (!isNaN(v) && v > 0 && v !== item.purchaseQuantity) {
                                updateQuantity(item.id, v - item.purchaseQuantity)
                              } else if (isNaN(v) || v <= 0) {
                                target.value = String(item.purchaseQuantity)
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur()
                              }
                            }}
                            className="w-12 h-7 px-1 rounded border border-input bg-background text-sm font-semibold text-center outline-none focus:border-ring tabular-nums"
                            min="0"
                            step={item.purchasePackQty < 1 ? '0.1' : '1'}
                          />
                          <span className="text-[10px] text-muted-foreground w-8 text-left">{item.purchasePackName}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="flex items-center justify-center size-6 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0">
                            <Plus className="size-3" />
                          </button>
                        </div>
                      </Td>
                      <Td className="w-28 text-right">
                        <div>
                          {editingCost === item.id ? (
                            <input
                              ref={editInputRef} type="number" value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={commitCost} onKeyDown={handleEditKeyDown}
                              className="w-24 h-7 px-2 rounded border border-primary bg-background text-sm font-semibold text-right outline-none tabular-nums" autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => startEditCost(item.id, item.productId, effectiveCost)}
                              className={cn('text-sm font-semibold tabular-nums hover:bg-muted/50 px-1.5 py-0.5 rounded transition-colors', costOverrides[item.productId] ? 'text-amber-600' : '')}
                            >
                              {formatCurrency(effectiveCost)}
                            </button>
                          )}
                          {lc && (
                            <div className={cn('text-[10px] tabular-nums', Math.abs(priceChange) >= 5 ? 'text-amber-600 font-medium' : 'text-muted-foreground')}>
                              was {formatCurrency(lc.cost)}
                            </div>
                          )}
                        </div>
                      </Td>
                      <Td className="w-28 text-right">
                        <span className="text-sm font-bold tabular-nums">{formatCurrency(effectiveCost * item.purchaseQuantity)}</span>
                      </Td>
                      <Td className="w-10 text-center">
                        <button onClick={() => removeItem(item.id)} className="flex items-center justify-center size-7 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors" title="Remove">
                          <Trash2 className="size-3.5" />
                        </button>
                      </Td>

                      {/* ── Price alert row ── */}
                      {showPriceAlert && (
                        <tr className="border-b border-border">
                          <td colSpan={7} className="px-3 py-1.5 text-[10px]">
                            <span className={cn('inline-flex items-center gap-1 font-medium', priceChange > 0 ? 'text-amber-600' : 'text-emerald-600')}>
                              <span className="inline-block size-1 rounded-full bg-current" />
                              {priceChange > 0
                                ? `Cost is ${priceChange.toFixed(1)}% above last purchase (${formatCurrency(lc!.cost)}${lc!.date ? `, ${lc!.date}` : ''})`
                                : `Cost is ${Math.abs(priceChange).toFixed(1)}% below last purchase (${formatCurrency(lc!.cost)})`}
                            </span>
                          </td>
                        </tr>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Summary ── */}
        {cart.length > 0 && (
          <div className="flex justify-end mt-4">
            <div className="w-72 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm gap-3">
                <span className="text-muted-foreground shrink-0">Discount</span>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center rounded-lg border border-input bg-muted/30 p-0.5">
                    <button
                      onClick={() => { setDiscountMode('flat'); setDiscountInput('') }}
                      className={cn('px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors', discountMode === 'flat' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
                    >Rs.</button>
                    <button
                      onClick={() => { setDiscountMode('pct'); setDiscount(0) }}
                      className={cn('px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors', discountMode === 'pct' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
                    >%</button>
                  </div>
                  <input
                    type="number"
                    value={discountMode === 'flat' ? (discount || '') : discountInput}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0
                      if (discountMode === 'flat') { setDiscount(v); setDiscountInput('') }
                      else { setDiscountInput(e.target.value); setDiscount(Math.round(subtotal * (Math.min(v, 100) / 100))) }
                    }}
                    placeholder="0"
                    className="w-20 h-8 px-2 rounded-md border border-input bg-background text-sm text-right outline-none focus:border-ring tabular-nums"
                    min="0"
                    max={discountMode === 'pct' ? 100 : undefined}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-base font-bold text-foreground">Grand Total</span>
                <span className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        )}
      </div>)

    </div> {/* end desktop hidden sm:block */}

      {/* ── Cart (mobile) ── */}
      <div className="block sm:hidden" style={{height: 'calc(100vh - 250px)', overflowY: 'auto'}}>
        <div className="px-4 py-3 space-y-3">
          <MobileCartList
            items={cart.map((c) => {
              const prod = mockProducts.find((p: any) => p.id === c.productId)
              const customOpts = prod ? purchaseStrategy.getCustomUnitOptions({ id: prod.id, name: prod.name, sku: prod.sku, category: prod.category, baseUnitId: prod.baseUnitId, sellingUnits: [] } as any) : []
              return {
                id: c.id,
                productId: c.productId,
                productName: c.productName,
                packName: c.purchasePackName,
                baseUnitName: c.baseUnitName,
                quantity: c.purchaseQuantity,
                unitCost: costOverrides[c.productId] ?? c.unitCost,
                totalCost: (costOverrides[c.productId] ?? c.unitCost) * c.purchaseQuantity,
                sellingUnits: [
                  { id: 'purchase-pack', name: c.purchasePackName },
                  { id: c.baseUnitId, name: 'Per ' + c.baseUnitName },
                ],
                customUnits: customOpts.length > 0 ? customOpts.map((o: any) => ({ id: o.id, label: o.label })) : undefined,
                selectedUnitId: c.purchasePackName === c.baseUnitId ? c.baseUnitId : 'purchase-pack',
              }
            })}
            costLabel="Cost"
            onUpdateQty={(id, delta) => updateQuantity(id, delta)}
            onRemove={(id) => removeItem(id)}
            onPriceChange={(productId, newPrice) => {
              setCostOverrides((prev: any) => ({ ...prev, [productId]: newPrice }))
            }}
            onChangeUnit={(id, unitId) => {
              const item = cart.find((c) => c.productId === id || c.id === id)
              if (item) handleChangeUnit(item.id, unitId)
            }}
          />
          {cart.length > 0 && (
            <div className="flex items-center justify-between px-1 py-3 border-t border-border">
              <div>
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="text-lg font-bold tabular-nums">{formatCurrency(grandTotal)}</div>
              </div>
              <button
                onClick={() => {
                  if (!supplier) { toast.error('Please select a supplier first'); return }
                  setShowMobilePayment(true)
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm"
              >
                Proceed to Payment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Payment Bar (desktop) ── */}
      <div className="hidden sm:block sm:shrink-0">
        <PaymentPanel
        paymentMethod={paymentMethod}
        onMethodChange={setPaymentMethod}
        amountPaid={amountPaid}
        onAmountChange={setAmountPaid}
        grandTotal={grandTotal}
        cartEmpty={cart.length === 0}
        onClear={() => cart.length > 0 ? setShowClearConfirm(true) : resetPurchase()}
        onRecord={() => {
          if (!supplier) { toast.error('Please select a supplier first'); return }
          if (cart.length === 0) { toast.error('Cart is empty'); return }
          setShowConfirm(true)
        }}
        onQuickPay={handleQuickPay}
        holdLabel="Save Draft"
        recordLabel="Record Purchase"
        showHold={false}
      />

      {/* ── Confirm Purchase Dialog ── */}
      <ConfirmTransactionDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        itemCount={cart.length}
        items={cart.map((c) => ({
          name: c.productName,
          qty: c.purchaseQuantity,
          cost: costOverrides[c.productId] ?? c.unitCost,
          total: (costOverrides[c.productId] ?? c.unitCost) * c.purchaseQuantity,
          unitName: c.purchasePackName,
        }))}
        subtotal={subtotal}
        discount={discount}
        grandTotal={grandTotal}
        amountPaid={amountPaid}
        partyName={supplier?.name ?? null}
        showParty={!!supplier}
        paymentMethod={paymentMethod}
        title="Confirm Purchase"
        actionLabel="Record Purchase"
        onConfirm={handleRecordPurchase}
      />

      {/* ── Clear Cart Dialog ── */}
      <ConfirmClearDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        itemCount={cart.length}
        onConfirm={() => { resetPurchase(); toast.success('Cart cleared') }}
      />
      </div> {/* end hidden sm:block (PaymentPanel desktop) */}

      {/* ── Mobile Payment Drawer ── */}
      <MobilePaymentDrawer
        open={showMobilePayment}
        onClose={() => setShowMobilePayment(false)}
        onConfirm={handleRecordPurchase}
        grandTotal={grandTotal}
        amountPaid={amountPaid}
        onAmountChange={setAmountPaid}
        paymentMethod={paymentMethod}
        onMethodChange={setPaymentMethod}
        paymentMethods={[
          { value: 'cash', label: 'Cash' },
          { value: 'card', label: 'Card' },
          { value: 'transfer', label: 'Transfer' },
          { value: 'easypaisa', label: 'Easypaisa' },
          { value: 'jazzcash', label: 'JazzCash' },
        ]}
        confirmLabel="Record Purchase"
        footer={
          <div className="flex gap-2">
            <button
              onClick={() => { setShowMobilePayment(false); resetPurchase() }}
              className="flex-1 h-11 rounded-xl border border-input text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear Cart
            </button>
          </div>
        }
      />

      {/* ── Success Dialog ── */}
      <Dialog open={showReceipt} onOpenChange={(v) => { if (!v) setShowReceipt(false) }}>
        <DialogContent className="sm:max-w-sm gap-0 p-0">
          <DialogHeader className="p-5 pb-0">
            <DialogTitle className="text-base">Purchase Recorded</DialogTitle>
          </DialogHeader>
          <div className="p-5 space-y-4">
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 p-4 text-center">
              <CheckCircle2 className="size-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-foreground">{receiptRef}</p>
              <p className="text-sm text-muted-foreground mt-1">{receiptCount} item{receiptCount > 1 ? 's' : ''} · {formatCurrency(grandTotal)}</p>
              {supplier && <p className="text-xs text-muted-foreground mt-0.5">{supplier.name}</p>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => { toast.success('Printing...'); window.print() }}>
                <Printer className="size-3.5" /> Print
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => { setShowReceipt(false); router.visit(`/purchases/${receiptId}`) }}>
                View <ArrowRight className="size-3.5" />
              </Button>
            </div>
            <Button className="w-full gap-1" onClick={() => { setShowReceipt(false); resetPurchase() }}>
              <Plus className="size-3.5" /> New Purchase
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Table Cell Helpers ───

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn('px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider', className)}>{children}</th>
}

function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn('px-3 py-2', className)}>{children}</td>
}
