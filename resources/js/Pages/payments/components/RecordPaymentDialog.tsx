import { useState, useMemo, useEffect, useRef } from 'react'
import { Receipt, Banknote, CreditCard, Building2, Smartphone, Wallet, Search, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/format'
import { router, usePage } from '@inertiajs/react'
import { cn } from '@/lib/utils'
import type { PaymentMethod } from '@/types'
import { toast } from 'sonner'

interface Contact {
  id: number
  name: string
  phone: string
  current_balance: number
}

const methods: { id: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'easypaisa', label: 'Easypaisa', icon: Smartphone },
  { id: 'jazzcash', label: 'JazzCash', icon: Wallet },
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'transfer', label: 'Bank Transfer', icon: Building2 },
]

interface RecordPaymentDialogProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  contacts: Contact[]
}

export default function RecordPaymentDialog({ open, onClose, onSuccess, contacts: contactList }: RecordPaymentDialogProps) {
  const { props } = usePage()
  const authUser = (props as any).auth?.user ?? null
  const createdBy = authUser?.name || 'System'
  const contacts: Contact[] = contactList?.length ? contactList : (props as any).contacts || []
  const searchRef = useRef<HTMLInputElement>(null)

  const [direction, setDirection] = useState<'in' | 'out'>('in')
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [processing, setProcessing] = useState(false)

  const [contactSearch, setContactSearch] = useState('')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showContactDropdown, setShowContactDropdown] = useState(false)

  useEffect(() => {
    if (showContactDropdown) searchRef.current?.focus()
  }, [showContactDropdown])

  const filteredContacts = useMemo(() => {
    if (!contactSearch.trim()) return contacts.slice(0, 10)
    const q = contactSearch.toLowerCase()
    return contacts.filter((c) =>
      c.name.toLowerCase().includes(q) || c.phone.includes(q)
    ).slice(0, 8)
  }, [contacts, contactSearch])

  const amountValue = parseFloat(amount) || 0
  const isValid = selectedContact && selectedMethod && amountValue > 0

  const handleSubmit = () => {
    if (!isValid || !selectedContact || !selectedMethod) return
    setProcessing(true)
    router.post('/payments', {
      direction, contact_id: selectedContact.id, amount: amountValue,
      method: selectedMethod, reference: reference || `PMT-${Date.now().toString().slice(-6)}`,
      description: note || `${direction === 'in' ? 'Payment received from' : 'Payment to'} ${selectedContact.name}`,
      date: paymentDate, created_by: createdBy,
    }, {
      onSuccess: () => {
        toast.success(`${formatCurrency(amountValue)} recorded`)
        setProcessing(false); resetForm(); onSuccess?.(); onClose()
      },
      onError: (errs) => { toast.error(Object.values(errs)[0] as string || 'Failed'); setProcessing(false) },
    })
  }

  const resetForm = () => {
    setDirection('in'); setSelectedContact(null); setContactSearch('')
    setSelectedMethod(null); setAmount(''); setReference(''); setNote('')
    setPaymentDate(new Date().toISOString().split('T')[0]); setShowContactDropdown(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !processing) { resetForm(); onClose() } }}>
      <DialogContent className="sm:max-w-lg gap-0 p-0 rounded-2xl sm:rounded-xl" showCloseButton>
        {/* Title */}
        <div className="flex items-center justify-between px-5 pt-5 pb-0">
          <h2 className="text-lg font-semibold">Record Payment</h2>
        </div>

        <div className="px-5 py-4 max-h-[75dvh] overflow-y-auto space-y-4">
          {/* Direction toggle */}
          <div className="flex items-center gap-2 bg-muted rounded-xl p-1">
            {['Money In', 'Money Out'].map((label, i) => {
              const val = i === 0 ? 'in' : 'out'
              return (
                <button key={val} onClick={() => setDirection(val as 'in' | 'out')}
                  className={cn('flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all', direction === val ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                  {label}
                </button>
              )
            })}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Amount</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">Rs.</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="w-full h-12 sm:h-14 pl-10 pr-3 rounded-xl border border-input bg-background text-xl sm:text-2xl font-bold outline-none focus:border-ring transition-colors tabular-nums" min="1" autoFocus />
            </div>
          </div>

          {/* Contact + Method — stack on mobile, side by side on sm+ */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Contact */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Contact</label>
              {selectedContact ? (
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 sm:py-3 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-500/5 dark:border-emerald-800">
                  <div className="size-9 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Building2 className="size-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{selectedContact.name}</p>
                    <p className={cn('text-xs font-medium', selectedContact.current_balance > 0 ? 'text-amber-600' : 'text-emerald-600')}>
                      {selectedContact.current_balance > 0
                        ? `Receivable ${formatCurrency(selectedContact.current_balance)}`
                        : selectedContact.current_balance < 0
                          ? `Payable ${formatCurrency(Math.abs(selectedContact.current_balance))}`
                          : 'Settled'}
                    </p>
                  </div>
                  <button onClick={() => { setSelectedContact(null); setContactSearch('') }}
                    className="flex items-center justify-center size-7 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500 shrink-0">
                    <span className="size-3.5 block leading-none">&times;</span>
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className={cn('flex items-center gap-2 px-3.5 h-12 sm:h-10 rounded-xl border transition-colors cursor-pointer', showContactDropdown ? 'border-ring ring-1 ring-ring/20' : 'border-input hover:border-ring')}
                    onClick={() => setShowContactDropdown(!showContactDropdown)}>
                    <Search className="size-4 text-muted-foreground shrink-0" />
                    <input ref={searchRef} type="text" placeholder="Search contact..." value={contactSearch}
                      onChange={(e) => { setContactSearch(e.target.value); setShowContactDropdown(true) }}
                      onFocus={() => setShowContactDropdown(true)}
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                  </div>
                  {showContactDropdown && (
                    <div className="mt-1 rounded-xl border border-border bg-popover shadow-lg overflow-hidden absolute left-0 right-0 z-50">
                      <div className="max-h-56 overflow-y-auto divide-y divide-border">
                        {filteredContacts.length === 0 ? (
                          <div className="px-4 py-6 text-xs text-muted-foreground text-center">No contacts found</div>
                        ) : (
                          filteredContacts.map((c) => (
                            <button key={c.id} type="button"
                              onClick={() => { setSelectedContact(c); setContactSearch(''); setShowContactDropdown(false) }}
                              className="flex items-center gap-3 w-full px-3.5 py-3 text-left hover:bg-muted/50 transition-colors">
                              <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <Building2 className="size-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                                {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                              </div>
                              <span className={cn('text-xs font-medium shrink-0', c.current_balance > 0 ? 'text-amber-600' : c.current_balance < 0 ? 'text-red-500' : 'text-muted-foreground')}>
                                {c.current_balance > 0 ? `+${formatCurrency(c.current_balance)}` : c.current_balance < 0 ? `-${formatCurrency(Math.abs(c.current_balance))}` : '—'}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Method */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Method</label>
              <div className="flex flex-wrap gap-2">
                {methods.map((m) => {
                  const Icon = m.icon; const isSel = selectedMethod === m.id
                  return (
                    <button key={m.id} onClick={() => setSelectedMethod(m.id)}
                      className={cn(
                        'flex items-center gap-2 px-3.5 py-2.5 sm:py-2 rounded-xl border-2 transition-all',
                        isSel ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border hover:border-muted-foreground/30'
                      )}>
                      <Icon className={cn('size-4', isSel ? 'text-primary' : 'text-muted-foreground')} />
                      <span className={cn('text-xs sm:text-sm font-medium', isSel ? 'text-foreground' : 'text-muted-foreground')}>{m.label}</span>
                      {isSel && <Check className="size-3.5 text-primary" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Reference + Date — side by side */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Reference</label>
              <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. INV-001"
                className="w-full h-12 sm:h-10 px-3.5 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Date</label>
              <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full h-12 sm:h-10 px-3.5 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring transition-colors" />
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Note <span className="text-muted-foreground font-normal">(optional)</span></label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Payment for..."
              rows={2}
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-ring transition-colors resize-none" />
          </div>

          {/* Submit */}
          <Button size="lg" className="w-full h-12 sm:h-11 gap-2 text-base sm:text-sm shadow-sm rounded-xl" disabled={!isValid || processing} onClick={handleSubmit}>
            {processing ? (
              <span className="flex items-center gap-2"><span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Processing...</span>
            ) : (
              <><Receipt className="size-4" />{direction === 'in' ? 'Record Payment' : 'Record Payout'}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
