import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { PaymentMethod } from '@/types'

interface MobilePaymentDrawerProps {
  open: boolean
  onClose: () => void
  /** Called when the user taps "Confirm" */
  onConfirm: () => void
  grandTotal: number
  amountPaid: string
  onAmountChange: (val: string) => void
  paymentMethod: PaymentMethod
  onMethodChange: (method: PaymentMethod) => void
  paymentMethods: { value: PaymentMethod; label: string }[]
  /** Label for the confirm button */
  confirmLabel?: string
  /** Additional footer content (Hold / Clear buttons) */
  footer?: React.ReactNode
}

const METHOD_COLORS: Record<string, string> = {
  cash: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400',
  card: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400',
  transfer: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400',
  easypaisa: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400',
  jazzcash: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400',
}

/**
 * Slide-up payment drawer for mobile (< 640px).
 * Opens when user taps "Proceed to Payment".
 */
export default function MobilePaymentDrawer({
  open, onClose, onConfirm, grandTotal, amountPaid, onAmountChange,
  paymentMethod, onMethodChange, paymentMethods, confirmLabel = 'Confirm Sale', footer,
}: MobilePaymentDrawerProps) {
  const paid = parseFloat(amountPaid) || 0
  const change = Math.max(0, paid - grandTotal)
  const outstanding = Math.max(0, grandTotal - paid)
  const canConfirm = paid > 0 || grandTotal === 0

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className={cn(
        'fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl shadow-2xl',
        'transition-transform duration-300 ease-out',
        'max-h-[85vh] overflow-y-auto',
      )}>
        {/* Handle */}
        <div className="flex items-center justify-between sticky top-0 bg-background z-10 px-5 pt-3 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 rounded-full bg-muted-foreground/20 mx-auto shrink-0" />
            <span className="text-sm font-semibold">Payment</span>
          </div>
          <button onClick={onClose} className="flex items-center justify-center size-7 rounded-md hover:bg-muted transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Grand total */}
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Amount Due</div>
            <div className="text-2xl font-bold text-foreground tabular-nums">{formatCurrency(grandTotal)}</div>
          </div>

          {/* Payment method grid */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((pm) => {
                const selected = paymentMethod === pm.value
                return (
                  <button
                    key={pm.value}
                    onClick={() => onMethodChange(pm.value)}
                    className={cn(
                      'px-2 py-2.5 rounded-xl border text-xs font-medium transition-all text-center',
                      selected
                        ? `${METHOD_COLORS[pm.value] || 'bg-primary/10 text-primary border-primary'} ring-1 ring-inset`
                        : 'border-input text-muted-foreground hover:text-foreground hover:border-ring'
                    )}
                  >
                    {pm.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Amount Paid</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">Rs.</span>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => onAmountChange(e.target.value)}
                placeholder="0"
                className="w-full h-11 pl-9 pr-3 rounded-xl border border-input bg-background text-lg font-bold text-right outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 tabular-nums"
                inputMode="decimal"
              />
            </div>
          </div>

          {/* Change / Outstanding */}
          {(change > 0 || outstanding > 0) && (
            <div className={cn(
              'rounded-xl px-4 py-3 text-sm flex items-center justify-between',
              change > 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10',
            )}>
              <span className="font-medium">{change > 0 ? 'Change' : 'Outstanding'}</span>
              <span className="font-bold tabular-nums">{formatCurrency(change > 0 ? change : outstanding)}</span>
            </div>
          )}

          {/* Confirm + Footer */}
          <Button
            onClick={onConfirm}
            disabled={!canConfirm}
            className="w-full h-12 text-base font-semibold shadow-sm rounded-xl"
          >
            {confirmLabel}
          </Button>

          {footer && <div className="flex gap-2">{footer}</div>}
        </div>
      </div>
    </>
  )
}
