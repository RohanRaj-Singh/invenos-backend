import { useState, useMemo } from 'react'
import { router, Link, usePage } from '@inertiajs/react'
import { Wallet, Search, Plus, ArrowRight, Trash2, Pencil } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

const METHOD_COLORS: Record<string, string> = {
  cash: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400',
  card: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400',
  transfer: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400',
  easypaisa: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400',
  jazzcash: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400',
}

export default function ExpenseListPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const { props } = usePage()
  const allExpenses = (props as any).expenses || []
  const allCategories = (props as any).categories || []

  const filtered = useMemo(() => {
    return allExpenses.filter((e: any) => {
      if (search) {
        const q = search.toLowerCase()
        const numMatch = (e.expense_number || '').toLowerCase().includes(q)
        const paidToMatch = (e.paid_to || '').toLowerCase().includes(q)
        const catMatch = ((e.category?.name || e.category_name) || '').toLowerCase().includes(q)
        const refMatch = (e.notes || '').toLowerCase().includes(q)
        if (!numMatch && !paidToMatch && !catMatch && !refMatch) return false
      }
      if (categoryFilter !== 'all' && e.category_id != categoryFilter) return false
      if (methodFilter !== 'all' && e.payment_method !== methodFilter) return false
      return true
    }).sort((a: any, b: any) => b.date.localeCompare(a.date))
  }, [allExpenses, search, categoryFilter, methodFilter])

  const handleDelete = (expenseId: string) => {
    router.delete('/expenses/' + expenseId, {
      onSuccess: () => setConfirmDelete(null),
      onError: () => setConfirmDelete(null),
    })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <Wallet className="size-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Expenses</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">All Expenses</h1>
          <p className="text-sm text-muted-foreground mt-1">{allExpenses.length} expense{allExpenses.length !== 1 ? 's' : ''} recorded</p>
        </div>
        <button
          onClick={() => router.visit('/expenses/new')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Add Expense</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text" placeholder="Search by number, category, vendor..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 transition-colors"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring"
        >
          <option value="all">All Categories</option>
          {allCategories.filter((c: any) => c.active).map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring"
        >
          <option value="all">All Methods</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="transfer">Bank Transfer</option>
          <option value="easypaisa">Easypaisa</option>
          <option value="jazzcash">JazzCash</option>
        </select>
      </div>

      {/* Table (desktop) */}
      <div className="hidden sm:block">
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <Th>Expense #</Th>
                  <Th>Date</Th>
                  <Th>Category</Th>
                  <Th>Paid To</Th>
                  <Th>Method</Th>
                  <Th className="text-right">Amount</Th>
                  <Th className="w-24 text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-sm text-muted-foreground">
                      {allExpenses.length === 0 ? 'No expenses recorded yet. Click "Add Expense" to begin.' : 'No expenses match your filters.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((exp: any) => (
                    <tr key={exp.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <Td>
                        <Link href={`/expenses/${exp.expense_number}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                          {exp.expense_number}
                        </Link>
                      </Td>
                      <Td className="text-sm text-muted-foreground">{exp.date}</Td>
                      <Td>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">{exp.category?.name || exp.category_name}</Badge>
                      </Td>
                      <Td className="text-sm">{exp.paid_to}</Td>
                      <Td>
                        <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-5', METHOD_COLORS[exp.payment_method] || '')}>
                          {exp.payment_method}
                        </Badge>
                      </Td>
                      <Td className="text-sm font-semibold text-right text-red-600 dark:text-red-400">{formatCurrency(exp.amount)}</Td>
                      <Td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => router.visit(`/expenses/${exp.expense_number}`)} className="flex items-center justify-center size-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="View">
                            <ArrowRight className="size-3.5" />
                          </button>
                          <button onClick={() => router.visit(`/expenses/${exp.expense_number}/edit`)} className="flex items-center justify-center size-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                            <Pencil className="size-3.5" />
                          </button>
                          <button onClick={() => setConfirmDelete(exp.id)} className="flex items-center justify-center size-7 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors" title="Delete">
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Card list (mobile) */}
      <div className="sm:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground">
            {allExpenses.length === 0 ? 'No expenses recorded yet.' : 'No expenses match your filters.'}
          </div>
        ) : (
          filtered.map((exp: any) => (
            <button key={exp.id} onClick={() => router.visit(`/expenses/${exp.expense_number}`)} className="w-full text-left group">
              <Card size="sm" className="transition-all hover:shadow-sm active:scale-[0.99]">
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 px-4 py-3.5">
                    <div className="flex items-center justify-center size-9 rounded-lg bg-red-50 dark:bg-red-500/10 shrink-0">
                      <Wallet className="size-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{exp.expense_number}</span>
                        <Badge variant="outline" className="text-[10px]">{exp.category?.name || exp.category_name}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{exp.paid_to} &middot; {exp.date}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(exp.amount)}</div>
                      <div className="text-[10px] text-muted-foreground capitalize">{exp.payment_method}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))
        )}
      </div>

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirmDelete(null)}>
          <div className="bg-background rounded-xl p-6 max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-2">Delete Expense?</h3>
            <p className="text-sm text-muted-foreground mb-4">This action cannot be undone. Are you sure you want to delete this expense?</p>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn('px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider', className)}>{children}</th>
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn('px-4 py-3', className)}>{children}</td>
}
