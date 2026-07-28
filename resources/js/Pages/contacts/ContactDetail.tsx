import { useState, useMemo } from 'react'
import { router, usePage } from '@inertiajs/react'
import { ArrowLeft, User, Building2, Phone, Mail, CreditCard, MapPin, ShoppingCart, Package, Banknote, Activity, ClipboardList, BookOpen, Plus, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format'
import { RoleBadgeList } from './components/RoleBadge'
import { cn } from '@/lib/utils'

interface BackendContact {
  id: number
  type: string
  roles: string[]
  name: string
  company_name?: string
  contact_person?: string
  phone: string
  email?: string
  cnic?: string
  address?: string
  opening_balance: number
  balance_type: string
  current_balance: number
  notes?: string
  created_at: string
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'transactions', label: 'Transactions', icon: Activity },
] as const

export default function ContactDetailPage() {
  const { props } = usePage()
  const { contact, transactions } = props as unknown as { contact: BackendContact; transactions?: any[] }
  const txnList = transactions || []
  const [activeTab, setActiveTab] = useState('overview')

  if (!contact) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="flex flex-col items-center justify-center py-24 text-sm text-muted-foreground">
          <User className="size-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-1">Contact not found</h2>
          <Button variant="outline" onClick={() => router.visit('/contacts')}>Back to Contacts</Button>
        </div>
      </div>
    )
  }

  const isPerson = contact.type === 'person'
  const balance = contact.current_balance || 0
  const isPayable = contact.balance_type === 'payable'

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => router.visit('/contacts')} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" /> <span>Back to contacts</span>
        </button>
      </div>

      {/* Header */}
      <Card className="overflow-hidden">
        <div className="h-20 sm:h-24 bg-gradient-to-r from-primary/80 to-primary/40" />
        <CardContent className="p-0">
          <div className="px-5 pb-5">
            <div className="flex items-end gap-4 -mt-10 mb-4">
              <div className={cn('size-16 sm:size-20 rounded-xl ring-4 ring-background flex items-center justify-center text-xl sm:text-2xl font-bold shadow-sm',
                isPerson ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300'
              )}>
                {isPerson ? <User className="size-7" /> : <Building2 className="size-7" />}
              </div>
              <div className="pt-2">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">{contact.name}</h2>
                {contact.company_name && <p className="text-sm text-muted-foreground">{contact.company_name}</p>}
                {contact.contact_person && <p className="text-xs text-muted-foreground">Contact: {contact.contact_person}</p>}
                <div className="mt-1"><RoleBadgeList roles={contact.roles as any} /></div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <InfoItem icon={Phone} label="Phone" value={contact.phone} />
              <InfoItem icon={Mail} label="Email" value={contact.email || '—'} />
              <InfoItem icon={MapPin} label="Address" value={contact.address || '—'} />
              <div className="flex items-center gap-2.5 text-sm">
                <div className="flex items-center justify-center size-8 rounded-lg bg-muted shrink-0"><Banknote className="size-3.5 text-muted-foreground" /></div>
                <div>
                  <div className="text-xs text-muted-foreground">{isPayable ? 'Payable' : 'Receivable'}</div>
                  <div className={cn('font-semibold', balance > 0 ? (isPayable ? 'text-blue-600' : 'text-amber-600') : 'text-muted-foreground')}>{formatCurrency(Math.abs(balance))}</div>
                </div>
              </div>
            </div>
            {contact.cnic && <div className="mt-2 text-xs text-muted-foreground">CNIC: {contact.cnic}</div>}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex -mb-px overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon; const isActive = activeTab === tab.id
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn('flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors shrink-0 whitespace-nowrap',
                  isActive ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                )}>
                <Icon className="size-4" /> <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        {activeTab === 'overview' && (
          <Card>
            <CardContent className="text-center py-12 text-sm text-muted-foreground">
              <User className="size-8 mx-auto mb-2 text-muted-foreground/30" />
              {contact.notes && <p className="text-xs max-w-md mx-auto">{contact.notes}</p>}
              {!contact.notes && <p>No additional details.</p>}
              {contact.opening_balance > 0 && <p className="text-xs mt-2">Opening balance: {formatCurrency(contact.opening_balance)}</p>}
            </CardContent>
          </Card>
        )}

        {activeTab === 'transactions' && (
          <Card>
            <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
            <CardContent>
              {txnList.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  <Activity className="size-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p>No transactions yet.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {txnList.map((txn: any) => (
                    <div key={txn.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn('size-8 rounded-lg flex items-center justify-center',
                          txn.direction === 'in' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-red-50 text-red-600 dark:bg-red-500/10'
                        )}>
                          <Banknote className="size-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground capitalize">{txn.type.replace(/_/g, ' ')}</div>
                          <div className="text-xs text-muted-foreground">{txn.date} &middot; {txn.reference} &middot; {txn.description || ''}</div>
                        </div>
                      </div>
                      <span className={cn('text-sm font-semibold', txn.direction === 'in' ? 'text-emerald-600' : 'text-red-600')}>
                        {txn.direction === 'in' ? '+' : '-'}{formatCurrency(txn.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <div className="flex items-center justify-center size-8 rounded-lg bg-muted shrink-0"><Icon className="size-3.5 text-muted-foreground" /></div>
      <div className="min-w-0"><div className="text-xs text-muted-foreground">{label}</div><div className="font-medium truncate">{value}</div></div>
    </div>
  )
}
