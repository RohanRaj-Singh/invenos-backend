import { useState, useMemo } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Search, Plus, Users, ArrowRight, Phone, Building2, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format'
import { RoleBadgeList } from './components/RoleBadge'
import { cn } from '@/lib/utils'
import type { ContactRole } from '@/types'

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
  updated_at: string
}

interface ContactsPageProps {
  contacts: BackendContact[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
  filters: { search: string; role: string }
}

const roleFilters: { label: string; value: ContactRole | 'all' }[] = [
  { label: 'All Contacts', value: 'all' },
  { label: 'Customers', value: 'customer' },
  { label: 'Suppliers', value: 'supplier' },
  { label: 'Patients', value: 'patient' },
]

export default function ContactsListPage() {
  const { props } = usePage()
  const { contacts, meta, filters } = props as unknown as ContactsPageProps
  const [search, setSearch] = useState(filters?.search || '')
  const [roleFilter, setRoleFilter] = useState<ContactRole | 'all'>((filters?.role as ContactRole) || 'all')

  const handleSearch = (q: string) => {
    setSearch(q)
    router.get('/contacts', { search: q, role: roleFilter }, { preserveState: true, replace: true })
  }

  const handleRoleFilter = (role: ContactRole | 'all') => {
    setRoleFilter(role)
    router.get('/contacts', { search, role: role === 'all' ? undefined : role }, { preserveState: true, replace: true })
  }

  const displayContacts = contacts || []

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Users className="size-5" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Contacts</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">All Contacts</h1>
          <p className="text-sm text-muted-foreground mt-1">{meta?.total || displayContacts.length} contact{(meta?.total || displayContacts.length) !== 1 ? 's' : ''} across your business</p>
        </div>
        <Button onClick={() => router.visit('/contacts/add')} size="sm" className="gap-1.5 shadow-sm h-9">
          <Plus className="size-4" />
          <span className="hidden sm:inline">Add Contact</span>
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input type="text" placeholder="Search by name, phone, or company..." value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30" />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {roleFilters.map((f) => (
            <button key={f.value} onClick={() => handleRoleFilter(f.value)}
              className={cn('text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap',
                roleFilter === f.value ? 'bg-foreground text-background border-foreground' : 'bg-background text-muted-foreground border-border hover:text-foreground'
              )}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <Th>Name</Th>
              <Th>Type</Th>
              <Th>Roles</Th>
              <Th>Phone</Th>
              <Th>Balance</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {displayContacts.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-16 text-sm text-muted-foreground"><Users className="size-8 mx-auto mb-2 text-muted-foreground/30" /><span>No contacts found.</span></td></tr>
            ) : (
              displayContacts.map((contact: BackendContact) => {
                const balance = contact.current_balance || 0
                const isPerson = contact.type === 'person'
                return (
                  <tr key={contact.id} onClick={() => router.visit(`/contacts/${contact.id}`)}
                    className="border-b border-border last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors group">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={cn('size-9 rounded-lg flex items-center justify-center shrink-0', isPerson ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10' : 'bg-blue-50 text-blue-600 dark:bg-blue-500/10')}>
                          {isPerson ? <User className="size-4" /> : <Building2 className="size-4" />}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{contact.name}</div>
                          {contact.company_name && <div className="text-[11px] text-muted-foreground">{contact.company_name}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm capitalize text-muted-foreground">{contact.type}</td>
                    <td className="px-4 py-3.5"><RoleBadgeList roles={contact.roles as ContactRole[]} size="xs" /></td>
                    <td className="px-4 py-3.5"><div className="flex items-center gap-1.5 text-sm text-muted-foreground"><Phone className="size-3" />{contact.phone}</div></td>
                    <td className="px-4 py-3.5">
                      <span className={cn('text-sm font-semibold', balance > 0 ? (contact.balance_type === 'receivable' ? 'text-amber-600' : 'text-blue-600') : 'text-muted-foreground')}>
                        {balance > 0 ? (contact.balance_type === 'receivable' ? 'Owes ' : 'Owe ') : ''}{formatCurrency(Math.abs(balance))}
                      </span>
                    </td>
                    <td className="px-4 py-3.5"><ArrowRight className="size-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" /></td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {displayContacts.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground"><Users className="size-10 mx-auto mb-2 text-muted-foreground/30" /><span>No contacts found.</span></div>
        ) : (
          displayContacts.map((contact: BackendContact) => {
            const balance = contact.current_balance || 0
            const isPerson = contact.type === 'person'
            return (
              <button key={contact.id} onClick={() => router.visit(`/contacts/${contact.id}`)} className="w-full text-left group">
                <Card size="sm" className="transition-all hover:shadow-sm active:scale-[0.99]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn('size-10 rounded-xl flex items-center justify-center shrink-0', isPerson ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10' : 'bg-blue-50 text-blue-600 dark:bg-blue-500/10')}>
                          {isPerson ? <User className="size-5" /> : <Building2 className="size-5" />}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{contact.name}</h3>
                          {contact.company_name && <p className="text-xs text-muted-foreground">{contact.company_name}</p>}
                        </div>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                    </div>
                    <div className="flex items-center gap-2 mb-2"><RoleBadgeList roles={contact.roles as ContactRole[]} size="xs" /></div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground"><Phone className="size-3" />{contact.phone}</div>
                      <span className={cn('text-xs font-semibold', balance > 0 ? (contact.balance_type === 'receivable' ? 'text-amber-600' : 'text-blue-600') : 'text-muted-foreground')}>
                        {balance > 0 ? (contact.balance_type === 'receivable' ? 'Owes ' : 'Owe ') : ''}{formatCurrency(Math.abs(balance))}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn('px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider', className)}>{children}</th>
}
