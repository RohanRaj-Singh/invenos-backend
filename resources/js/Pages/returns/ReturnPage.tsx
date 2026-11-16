import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { router, usePage } from '@inertiajs/react'
import { ArrowLeft, Search, RotateCcw, CheckCircle2, Package, X, ChevronDown, ChevronUp, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useTransactionRecorder } from '@/features/transactions/useTransactionRecorder'
import { ConfirmTransactionDialog } from '@/features/transactions/dialogs/ConfirmDialog'
import { getCurrentUserName } from '@/data/users'
import type { TransactionStrategy } from '@/domain/transactions/strategies/types'
import type { Sale, PurchaseBill } from '@/types'
import { toast } from 'sonner'

type ReturnReason = 'defective' | 'wrong_item' | 'changed_mind' | 'expired' | 'damaged' | 'quality' | 'other'
type ItemCondition = 'resellable' | 'damaged' | 'expired'

const RETURN_REASONS: { value: ReturnReason; label: string }[] = [
  { value: 'defective', label: 'Defective' },
  { value: 'wrong_item', label: 'Wrong Item' },
  { value: 'changed_mind', label: 'Changed Mind' },
  { value: 'expired', label: 'Expired' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'quality', label: 'Quality Issue' },
  { value: 'other', label: 'Other' },
]

const CONDITIONS: { value: ItemCondition; label: string }[] = [
  { value: 'resellable', label: 'Resellable' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'expired', label: 'Expired' },
]

interface ReturnItemState {
  originalLineId: string
  productId: string
  productName: string
  unitName: string
  sellingUnitId: string | null
  baseUnitQuantity: number
  originalQty: number
  originalPrice: number
  originalTotal: number
  maxReturnable: number
  returnQty: number
  selected: boolean
  reason: ReturnReason
  condition: ItemCondition
  restock: boolean
  /** Composition consumption context — absent for simple products. */
  composition: RecoveryContext | null
  /** Explicit recovered quantities keyed by composition_run_item_id. */
  recovered: Record<number, number>
}

interface RecoveryComponent {
  composition_run_item_id: number
  component_name: string | null
  unit: string
  per_unit_quantity: number
  restored_quantity: number
  wastage_quantity: number
  eligible_for_remaining: number
}

interface RecoveryContext {
  sale_item_id: number
  product_name: string
  sold_quantity: number
  previously_returned: number
  remaining_quantity: number
  components: RecoveryComponent[]
}

interface ReturnPageProps {
  strategy: TransactionStrategy
  backPath: string
  title: string
  isPurchase: boolean
  recoveryContext?: Record<string, RecoveryContext>
  canCreateReturn?: boolean
}

export default function ReturnPage({ strategy, backPath, title, isPurchase, recoveryContext, canCreateReturn }: ReturnPageProps) {
  const { props: inertiaProps } = usePage()
  const { record } = useTransactionRecorder()

  // Composition returns go through the canonical server workflow. The key is
  // stable for one submission so a double click cannot create a second return.
  const idempotencyKey = useRef<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [searchRef, setSearchRef] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('ref') || ''
    }
    return ''
  })
  const [originalTx, setOriginalTx] = useState<Sale | PurchaseBill | null>(null)
  const [returnItems, setReturnItems] = useState<ReturnItemState[]>([])
  const [refundMethod, setRefundMethod] = useState('cash')
  const [showConfirm, setShowConfirm] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptRef, setReceiptRef] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const [mobileOpenItems, setMobileOpenItems] = useState<Set<number>>(new Set())

  const toggleMobileOpen = (idx: number) => {
    setMobileOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  // Transactions come from Inertia props (loaded from database by the route closure)
  const rawTransactions: any[] = (inertiaProps as any).transactions || []
  const transactions = useMemo(() => {
    const list = isPurchase
      ? rawTransactions.map((b: any) => ({
          id: b.id, ref: b.invoice_ref, date: b.date,
          party: b.supplier?.name || b.supplier_name, total: b.total_amount,
          items: (b.items || []).length, itemsList: b.items || [],
        }))
      : rawTransactions.map((s: any) => ({
          id: s.id, ref: s.invoice_number, date: s.date,
          party: s.customer?.name || s.customer_name || 'Walk-in Customer', total: s.grand_total,
          items: (s.items || []).length, itemsList: s.items || [],
        }))
    return list.sort((a: any, b: any) => b.date.localeCompare(a.date))
  }, [rawTransactions, isPurchase])

  const filteredTx = useMemo(() => {
    const q = searchRef.toLowerCase().trim()
    if (!q) return transactions.slice(0, 15)
    return transactions.filter((tx) =>
      tx.ref.toLowerCase().includes(q) ||
      tx.party.toLowerCase().includes(q) ||
      String(tx.total).includes(q) ||
      tx.itemsList.some((item: any) =>
        (item.productName || item.name || '').toLowerCase().includes(q)
      )
    ).slice(0, 15)
  }, [searchRef, transactions])

  // Auto-search when navigated from detail page with ref param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref && !loaded) {
      setSearchRef(ref)
    }
  }, [])

  const selectTransaction = useCallback((tx: typeof filteredTx[0]) => {
    // Find the full transaction from the raw props data
    const raw = rawTransactions.find((r: any) => r.id === tx.id)
    if (!raw) return
    const contexts = recoveryContext || {}
    setOriginalTx(raw)
    setReturnItems((raw.items || []).map((item: any) => {
      const recovery = contexts[String(item.id)] || null

      return {
      originalLineId: item.id, productId: String(item.product_id || ''),
      productName: item.product_name || item.name || 'Unknown',
      unitName: isPurchase ? (item.purchase_pack_name || 'Unit') : (item.packaging_name || 'Unit'),
      sellingUnitId: item.selling_unit_id ? String(item.selling_unit_id) : null,
      baseUnitQuantity: Number(item.base_unit_quantity ?? 1) || 1,
      originalQty: isPurchase ? (item.purchase_quantity || 0) : (item.packaging_quantity || 0),
      originalPrice: isPurchase ? (item.unit_cost || 0) : (item.unit_price || 0),
      originalTotal: isPurchase ? (item.total_cost || 0) : (item.total || 0),
      maxReturnable: isPurchase ? (item.purchase_quantity || 0) : (item.packaging_quantity || 0),
      returnQty: 0, selected: false,
      reason: 'other' as ReturnReason, condition: 'resellable' as ItemCondition,
      restock: !isPurchase && !recovery,
      composition: recovery,
      recovered: {},
      }
    }))
    setLoaded(true)
    setSearchRef('')
    setHighlighted(0)
  }, [rawTransactions, isPurchase, recoveryContext])

  // Auto-select when navigated from detail page with ref param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref && !loaded) {
      const match = transactions.find((tx) => tx.ref === ref)
      if (match) selectTransaction(match)
    }
  }, [loaded])

  const toggleItem = (idx: number) => {
    setReturnItems((prev) => prev.map((item, i) =>
      i === idx ? { ...item, selected: !item.selected, returnQty: !item.selected ? item.maxReturnable : 0 } : item
    ))
  }

  const setReturnQty = (idx: number, qty: number) => {
    setReturnItems((prev) => prev.map((item, i) =>
      i === idx ? { ...item, returnQty: Math.max(0, Math.min(qty, item.maxReturnable)) } : item
    ))
  }

  const setReason = (idx: number, reason: ReturnReason) => {
    setReturnItems((prev) => prev.map((item, i) =>
      i === idx ? { ...item, reason, condition: reason === 'defective' || reason === 'damaged' ? 'damaged' : item.condition } : item
    ))
  }

  const setCondition = (idx: number, condition: ItemCondition) => {
    setReturnItems((prev) => prev.map((item, i) =>
      i === idx ? { ...item, condition, restock: condition === 'resellable' && !item.composition } : item
    ))
  }

  const selectedItems = returnItems.filter((r) => r.selected && r.returnQty > 0)
  const refundTotal = selectedItems.reduce((sum, r) => sum + r.originalPrice * r.returnQty, 0)

  const compositionItems = selectedItems.filter((r) => r.composition)
  const hasCompositionLines = compositionItems.length > 0

  const maxRecoverable = (item: ReturnItemState, component: RecoveryComponent) =>
    Math.max(0, Number((component.per_unit_quantity * item.returnQty - component.restored_quantity).toFixed(6)))

  const setRecovered = (lineId: string, runItemId: number, qty: number) => {
    setReturnItems((prev) => prev.map((item) => {
      if (item.originalLineId !== lineId) return item
      const component = item.composition?.components.find((c) => c.composition_run_item_id === runItemId)
      const max = component ? maxRecoverable(item, component) : 0
      return { ...item, recovered: { ...item.recovered, [runItemId]: Math.max(0, Math.min(qty, max)) } }
    }))
  }

  /**
   * Composition returns are recorded through the canonical server workflow so
   * material recovery is validated, costed and idempotent server-side.
   */
  const submitCanonicalReturn = useCallback(() => {
    if (!originalTx) return
    const sale = originalTx as any

    if (!idempotencyKey.current) {
      idempotencyKey.current = `ret-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    }

    setSubmitting(true)
    setShowConfirm(false)

    router.post('/returns/sale', {
      idempotency_key: idempotencyKey.current,
      reference_id: sale.id,
      reference_type: 'sale',
      return_date: new Date().toISOString().split('T')[0],
      contact_id: sale.customer_id ?? sale.customer?.id ?? null,
      refund_method: refundMethod,
      subtotal: refundTotal,
      discount: 0,
      grand_total: refundTotal,
      refund_amount: refundTotal,
      items: selectedItems.map((r) => ({
        reference_item_id: Number(r.originalLineId),
        reference_item_type: 'sale_item',
        product_id: Number(r.productId),
        product_name: r.productName,
        selling_unit_id: r.sellingUnitId ? Number(r.sellingUnitId) : null,
        packaging_name: r.unitName,
        quantity: r.returnQty,
        base_quantity: Number((r.returnQty * r.baseUnitQuantity).toFixed(6)),
        unit_price: r.originalPrice,
        total: r.originalPrice * r.returnQty,
        restock: r.restock,
        material_recoveries: r.composition
          ? r.composition.components
              .filter((c) => (r.recovered[c.composition_run_item_id] ?? 0) > 0)
              .map((c) => ({
                composition_run_item_id: c.composition_run_item_id,
                quantity: r.recovered[c.composition_run_item_id],
              }))
          : [],
      })),
    }, {
      preserveScroll: true,
      onError: (errors) => {
        toast.error((Object.values(errors)[0] as string) || 'Could not record the return.')
      },
      onFinish: () => setSubmitting(false),
    })
  }, [originalTx, selectedItems, refundTotal, refundMethod])

  const handleProcessReturn = useCallback(() => {
    if (selectedItems.length === 0) return

    // Composition invoices always go through the server; simple invoices keep
    // the existing client-side recording path unchanged.
    if (hasCompositionLines) {
      submitCanonicalReturn()
      return
    }

    const result = record({
      strategy,
      items: selectedItems.map((r) => ({
        id: `ret-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: r.productId,
        name: r.productName,
        sellingUnitId: r.productId,
        packagingName: r.unitName,
        packagingQuantity: r.returnQty,
        baseUnitQuantity: 1,
        baseQuantity: r.returnQty,
        unitPrice: r.originalPrice,
        total: r.originalPrice * r.returnQty,
        category: '',
        restock: r.restock,
      })),
      partyId: originalTx && 'supplierId' in originalTx ? (originalTx as PurchaseBill).supplierId
        : originalTx && 'customerName' in originalTx ? null : null,
      partyName: originalTx && 'supplierName' in originalTx ? (originalTx as PurchaseBill).supplierName
        : originalTx && 'customerName' in originalTx ? (originalTx as Sale).customerName ?? '' : '',
      discount: 0,
      discountPct: 0,
      paymentMethod: refundMethod,
      amountPaid: String(refundTotal),
      subtotal: refundTotal,
      grandTotal: refundTotal,
      date: new Date().toISOString().split('T')[0],
      createdBy: getCurrentUserName(),
    })

    setReceiptRef(result.receipt.invoiceNumber)
    setShowReceipt(true)
    toast.success(`${title} recorded: ${result.receipt.invoiceNumber}`)
  }, [selectedItems, strategy, originalTx, refundTotal, refundMethod, record, title, hasCompositionLines, submitCanonicalReturn])

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-5 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => backPath ? router.visit(backPath) : window.history.back()} className="flex items-center justify-center size-10 rounded-lg hover:bg-muted transition-colors active:scale-95">
              <ArrowLeft className="size-5 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">{title}</h1>
              <p className="text-[11px] text-muted-foreground">
                {new Date().toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                {' · '}
                {new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction picker */}
      {!loaded && (
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-3 bg-card shrink-0 sticky top-0 z-10 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                value={searchRef}
                onChange={(e) => { setSearchRef(e.target.value); setHighlighted(0) }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setHighlighted((prev) => Math.min(prev + 1, filteredTx.length - 1))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setHighlighted((prev) => Math.max(prev - 1, 0))
                  } else if (e.key === 'Enter') {
                    e.preventDefault()
                    if (filteredTx[highlighted]) selectTransaction(filteredTx[highlighted])
                  }
                }}
                placeholder={`Search ${isPurchase ? 'purchase' : 'sale'} invoice by number, ${isPurchase ? 'supplier' : 'customer'}, product, or amount...`}
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring"
                autoFocus
              />
              {searchRef && (
                <button onClick={() => { setSearchRef(''); setHighlighted(0) }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center size-6 rounded-md hover:bg-muted text-muted-foreground">
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {searchRef ? `${filteredTx.length} match${filteredTx.length !== 1 ? 'es' : ''}` : `Recent ${isPurchase ? 'purchases' : 'sales'} — select one to return`}
            </p>
          </div>

          <div className="divide-y divide-border">
            {filteredTx.length === 0 ? (
              <div className="text-center py-16 text-sm text-muted-foreground">
                <Package className="size-10 text-muted-foreground/20 mx-auto mb-3" />
                <p>No {isPurchase ? 'purchase' : 'sale'} invoices found</p>
              </div>
            ) : (
              filteredTx.map((tx, idx) => (
                <button
                  key={tx.id}
                  onClick={() => selectTransaction(tx)}
                  className={cn(
                    'w-full flex items-center gap-3 px-5 py-3 text-left transition-colors',
                    idx === highlighted ? 'bg-muted' : 'hover:bg-muted/50'
                  )}
                >
                  <div className="flex items-center justify-center size-9 rounded-lg bg-muted shrink-0">
                    <Package className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{tx.ref}</span>
                      <span className="text-[10px] text-muted-foreground">{tx.date}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {tx.party} · {tx.items} item{tx.items !== 1 ? 's' : ''} · {formatCurrency(tx.total)}
                    </div>
                  </div>
                  {idx === highlighted && (
                    <kbd className="hidden sm:inline-flex items-center px-1 py-0.5 text-[9px] text-muted-foreground bg-muted rounded font-sans">⏎</kbd>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Return items */}
      {loaded && originalTx && (
        <>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <Badge variant="outline" className="text-xs shrink-0">
                {isPurchase ? (originalTx as PurchaseBill).invoiceRef : (originalTx as Sale).invoiceNumber}
              </Badge>
              <span className="text-muted-foreground text-xs sm:text-sm truncate max-w-[180px] sm:max-w-none">
                {isPurchase ? (originalTx as PurchaseBill).supplierName : (originalTx as Sale).customerName || 'Walk-in Customer'}
              </span>
              <span className="text-muted-foreground text-xs sm:text-sm">
                {(isPurchase ? (originalTx as PurchaseBill).date : (originalTx as Sale).date)}
              </span>
            </div>

            {returnItems.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">No items in this invoice.</div>
            ) : (
              <>
                {/* ── Desktop table ── */}
                <div className="hidden md:block rounded-xl border border-border overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <Th className="w-10">#</Th>
                        <Th>Item</Th>
                        <Th className="w-20 text-center">Orig Qty</Th>
                        <Th className="w-20 text-center">Return</Th>
                        <Th className="w-32">Reason</Th>
                        <Th className="w-28">Condition</Th>
                        <Th className="w-24 text-right">Refund</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {returnItems.map((item, idx) => (
                        <tr key={item.originalLineId} className={cn('border-b border-border', item.selected && 'bg-primary/5')}>
                          <Td className="w-10 text-center">
                            <input type="checkbox" checked={item.selected} onChange={() => toggleItem(idx)} className="size-4 rounded border-input" />
                          </Td>
                          <Td className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{item.productName}</span>
                              {item.composition && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 gap-0.5 border-amber-300 text-amber-700 dark:text-amber-400 shrink-0">
                                  <FlaskConical className="size-2.5" /> Formula
                                </Badge>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground">{item.unitName} · {formatCurrency(item.originalPrice)} each</div>
                          </Td>
                          <Td className="w-20 text-center"><span className="text-sm tabular-nums text-muted-foreground">{item.originalQty}</span></Td>
                          <Td className="w-20 text-center">
                            <input type="number" value={item.returnQty || ''} onChange={(e) => setReturnQty(idx, parseInt(e.target.value) || 0)} disabled={!item.selected}
                              className="w-16 h-7 px-1 rounded border border-input bg-background text-sm text-center outline-none focus:border-ring tabular-nums disabled:opacity-30" min={0} max={item.maxReturnable} />
                          </Td>
                          <Td>
                            <select value={item.reason} onChange={(e) => setReason(idx, e.target.value as ReturnReason)} disabled={!item.selected}
                              className="w-full h-8 px-2 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/20 disabled:opacity-30 cursor-pointer disabled:cursor-default">
                              {RETURN_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                          </Td>
                          <Td>
                            <select value={item.condition} onChange={(e) => setCondition(idx, e.target.value as ItemCondition)} disabled={!item.selected}
                              className="w-full h-8 px-2 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/20 disabled:opacity-30 cursor-pointer disabled:cursor-default">
                              {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                          </Td>
                          <Td className="w-24 text-right">
                            <span className={cn('text-sm font-semibold tabular-nums', item.selected && item.returnQty > 0 ? 'text-foreground' : 'text-muted-foreground')}>
                              {item.selected && item.returnQty > 0 ? formatCurrency(item.originalPrice * item.returnQty) : '—'}
                            </span>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ── Mobile cards ── */}
                <div className="md:hidden space-y-2">
                  {returnItems.map((item, idx) => {
                    const isOpen = mobileOpenItems.has(idx)
                    return (
                      <div key={item.originalLineId} className={cn('rounded-xl border border-border overflow-hidden transition-colors', item.selected && 'border-primary/30 bg-primary/[0.02]')}>
                        {/* Collapsed row */}
                        <div className="flex items-center gap-3 p-3">
                          <input type="checkbox" checked={item.selected} onChange={() => toggleItem(idx)} className="size-4 rounded border-input shrink-0" />
                          <div className="flex-1 min-w-0" onClick={() => item.selected && toggleMobileOpen(idx)}>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-foreground truncate">
                                {item.productName}
                                {item.composition && (
                                  <span className="ml-1.5 inline-flex items-center gap-0.5 align-middle text-[9px] font-medium text-amber-700 dark:text-amber-400">
                                    <FlaskConical className="size-2.5" /> Formula
                                  </span>
                                )}
                              </span>
                              <span className="text-xs font-semibold tabular-nums shrink-0">
                                {item.selected && item.returnQty > 0 ? formatCurrency(item.originalPrice * item.returnQty) : '—'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                              <span>{item.unitName} · Rs.{item.originalPrice}</span>
                              <span>·</span>
                              <span>Orig: {item.originalQty}</span>
                              {item.selected && (
                                <>
                                  <span>·</span>
                                  <span className="text-primary font-medium">Return: {item.returnQty}</span>
                                </>
                              )}
                            </div>
                          </div>
                          {item.selected && (
                            <button onClick={() => toggleMobileOpen(idx)} className="flex items-center justify-center size-6 rounded-md hover:bg-muted text-muted-foreground shrink-0">
                              {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                            </button>
                          )}
                        </div>

                        {/* Expanded fields */}
                        {isOpen && item.selected && (
                          <div className="px-3 pb-3 pt-1 border-t border-border space-y-2.5">
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1 block">Return Qty</label>
                                <input type="number" value={item.returnQty || ''} onChange={(e) => setReturnQty(idx, parseInt(e.target.value) || 0)}
                                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring tabular-nums" min={0} max={item.maxReturnable} />
                              </div>
                              <div className="flex-1">
                                <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1 block">Reason</label>
                                <select value={item.reason} onChange={(e) => setReason(idx, e.target.value as ReturnReason)}
                                  className="w-full h-9 px-2 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring">
                                  {RETURN_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1 block">Condition</label>
                                <select value={item.condition} onChange={(e) => setCondition(idx, e.target.value as ItemCondition)}
                                  className="w-full h-9 px-2 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring">
                                  {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                              </div>
                              <div className="flex-1 pt-5">
                                <div className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(item.originalPrice * item.returnQty)}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* Recovered materials — explicit, never automatic */}
            {compositionItems.length > 0 && (
              <div className="rounded-xl border border-amber-300/70 bg-amber-50/60 dark:bg-amber-500/5 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <FlaskConical className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">Recovered materials (optional)</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      A refund does not restore ingredients, and formula sale lines do not restock the
                      parent product. Enter only the components that were physically recovered and are
                      reusable. Wastage is never restored, and nothing is sent to inventory until the
                      return is completed.
                    </p>
                  </div>
                </div>

                {compositionItems.map((item) => (
                  <div key={item.originalLineId} className="rounded-lg bg-background/70 border border-border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-foreground truncate">{item.productName}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {item.returnQty} returned · {item.composition!.sold_quantity} sold
                        {item.composition!.previously_returned > 0 && ` · ${item.composition!.previously_returned} already returned`}
                      </span>
                    </div>

                    {item.composition!.components.map((component) => {
                      const max = maxRecoverable(item, component)
                      const value = item.recovered[component.composition_run_item_id] ?? 0

                      return (
                        <div key={component.composition_run_item_id} className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-foreground truncate">{component.component_name || 'Component'}</div>
                            <div className="text-[10px] text-muted-foreground">
                              up to {max} {component.unit}
                              {component.wastage_quantity > 0 && ` · ${component.wastage_quantity} ${component.unit} wastage not restorable`}
                              {component.restored_quantity > 0 && ` · ${component.restored_quantity} ${component.unit} already restored`}
                            </div>
                          </div>
                          <input
                            type="number"
                            min={0}
                            max={max}
                            step="0.000001"
                            disabled={max <= 0}
                            value={value || ''}
                            placeholder="0"
                            onChange={(e) => setRecovered(item.originalLineId, component.composition_run_item_id, parseFloat(e.target.value) || 0)}
                            className="w-24 h-8 px-2 rounded-lg border border-input bg-background text-sm text-right tabular-nums outline-none focus:border-ring disabled:opacity-40"
                          />
                          <span className="text-[10px] text-muted-foreground w-8 shrink-0">{component.unit}</span>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* Refund summary */}
            {selectedItems.length > 0 && (
              <div className="flex justify-end">
                <div className="w-full md:w-72 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Items returning</span>
                    <span className="font-semibold">{selectedItems.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total units</span>
                    <span className="font-semibold">{selectedItems.reduce((s, r) => s + r.returnQty, 0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm gap-3">
                    <span className="text-muted-foreground shrink-0">Refund method</span>
                    <select
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value)}
                      className="h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring flex-1 md:flex-none"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="transfer">Transfer</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-base font-bold text-foreground">Refund Total</span>
                    <span className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(refundTotal)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action bar */}
          {loaded && (
            <div className="border-t border-border bg-card px-5 py-3 shrink-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:justify-between">
                <Button variant="outline" size="sm" className="gap-1.5 justify-center sm:justify-start" onClick={() => { setLoaded(false); setOriginalTx(null); setSearchRef('') }}>
                  <RotateCcw className="size-3.5" /> Change Invoice
                </Button>
                <Button
                  size="default"
                  className="gap-1.5 shadow-sm"
                  disabled={selectedItems.length === 0 || submitting || (hasCompositionLines && canCreateReturn === false)}
                  onClick={() => setShowConfirm(true)}
                >
                  <CheckCircle2 className="size-3.5" /> {submitting ? 'Recording…' : 'Process Return'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirm dialog */}
      <ConfirmTransactionDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        itemCount={selectedItems.length}
        items={selectedItems.map((r) => ({
          name: r.productName,
          qty: r.returnQty,
          cost: r.originalPrice,
          total: r.originalPrice * r.returnQty,
          unitName: r.unitName,
        }))}
        subtotal={refundTotal}
        grandTotal={refundTotal}
        amountPaid={String(refundTotal)}
        partyName={isPurchase ? (originalTx as PurchaseBill)?.supplierName ?? null : (originalTx as Sale)?.customerName ?? null}
        showParty={true}
        paymentMethod={refundMethod}
        title={isPurchase ? 'Confirm Purchase Return' : 'Confirm Sale Return'}
        actionLabel="Process Return"
        onConfirm={handleProcessReturn}
      />

      {/* Receipt */}
      <Dialog open={showReceipt} onOpenChange={(v) => { if (!v) setShowReceipt(false) }}>
        <DialogContent className="sm:max-w-sm gap-0 p-0">
          <DialogHeader className="p-5 pb-0">
            <DialogTitle className="text-base">{title} Recorded</DialogTitle>
          </DialogHeader>
          <div className="p-5 space-y-4">
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 p-4 text-center">
              <CheckCircle2 className="size-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-foreground">{receiptRef}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} returned · {formatCurrency(refundTotal)} refund
              </p>
            </div>
            <Button className="w-full gap-1" onClick={() => { setShowReceipt(false); router.visit(backPath) }}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn('px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider', className)}>{children}</th>
}

function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn('px-3 py-2', className)}>{children}</td>
}
