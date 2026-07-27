import { useState } from 'react'
import { Link, usePage, router } from '@inertiajs/react'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  CreditCard,
  Users,
  BarChart3,
  Stethoscope,
  ShoppingBag,
  ChevronDown,
  ChevronRight,
  Box,
  Wallet,
  Settings2,
  LogOut,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { modules } from '@/data/dashboard'
import { cn } from '@/lib/utils'

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Package,
  ShoppingCart,
  CreditCard,
  Users,
  BarChart3,
  Stethoscope,
  ShoppingBag,
}

interface SidebarProps {
  mobile?: boolean
  onClose?: () => void
}

export default function Sidebar({ mobile, onClose }: SidebarProps) {
  const { url } = usePage()
  const [modulesOpen, setModulesOpen] = useState(false)
  const [salesOpen, setSalesOpen] = useState(url.startsWith('/sales'))
  const [purchasesOpen, setPurchasesOpen] = useState(url.startsWith('/purchases'))
  const [expensesOpen, setExpensesOpen] = useState(url.startsWith('/expenses'))
  const [reportsOpen, setReportsOpen] = useState(url.startsWith('/reports'))
  const [settingsOpen, setSettingsOpen] = useState(url.startsWith('/settings'))

  const isActive = (href: string) => {
    if (href === '/') return url === '/'
    return url.startsWith(href)
  }

  const isModuleActive = modules.some((m) => url === m.href)

  const navLinkClass = (href: string) =>
    cn(
      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
      isActive(href)
        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
        : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
    )

  const subLinkClass = (href: string) =>
    cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] transition-colors',
      isActive(href)
        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
        : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/30'
    )

  const sectionToggleClass = (open: boolean, isSectionActive: boolean) =>
    cn(
      'flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors',
      open || isSectionActive
        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
        : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
    )

  const handleNav = (href: string) => {
    if (onClose) onClose()
    router.visit(href)
  }

  return (
    <aside
      className={cn(
        mobile ? 'flex flex-col w-64' : 'hidden md:flex md:flex-col md:w-60 lg:w-64',
        'h-screen border-r border-border bg-sidebar shrink-0'
      )}
    >
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-border">
        <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground">
          <Box className="size-4" />
        </div>
        <span className="text-base font-semibold tracking-tight">Invenos</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <Link href="/" onClick={onClose} className={navLinkClass('/')}>
          <LayoutDashboard className="size-4 shrink-0" />
          <span>Home</span>
        </Link>

        <Link href="/inventory" onClick={onClose} className={navLinkClass('/inventory')}>
          <Package className="size-4 shrink-0" />
          <span>Inventory</span>
        </Link>

        {/* Sales */}
        <div>
          <button
            onClick={() => setSalesOpen(!salesOpen)}
            className={sectionToggleClass(salesOpen, url.startsWith('/sales'))}
          >
            <span className="flex items-center gap-3">
              <ShoppingCart className="size-4 shrink-0" />
              <span>Sales</span>
            </span>
            {salesOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </button>
          {salesOpen && (
            <div className="ml-4 space-y-0.5 pt-0.5">
              <button onClick={() => handleNav('/sales')} className={subLinkClass('/sales')}>Sales List</button>
              <button onClick={() => handleNav('/sales/pos')} className={subLinkClass('/sales/pos')}>Create Sale</button>
              <button onClick={() => handleNav('/sales/returns')} className={subLinkClass('/sales/returns')}>Sale Returns</button>
            </div>
          )}
        </div>

        {/* Purchases */}
        <div>
          <button
            onClick={() => setPurchasesOpen(!purchasesOpen)}
            className={sectionToggleClass(purchasesOpen, url.startsWith('/purchases'))}
          >
            <span className="flex items-center gap-3">
              <ShoppingBag className="size-4 shrink-0" />
              <span>Purchases</span>
            </span>
            {purchasesOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </button>
          {purchasesOpen && (
            <div className="ml-4 space-y-0.5 pt-0.5">
              <button onClick={() => handleNav('/purchases')} className={subLinkClass('/purchases')}>Purchase List</button>
              <button onClick={() => handleNav('/purchases/new')} className={subLinkClass('/purchases/new')}>Create Purchase</button>
              <button onClick={() => handleNav('/purchases/returns')} className={subLinkClass('/purchases/returns')}>Purchase Returns</button>
            </div>
          )}
        </div>

        <Link href="/payments" onClick={onClose} className={navLinkClass('/payments')}>
          <CreditCard className="size-4 shrink-0" />
          <span>Payments</span>
        </Link>

        {/* Expenses */}
        <div>
          <button
            onClick={() => setExpensesOpen(!expensesOpen)}
            className={sectionToggleClass(expensesOpen, url.startsWith('/expenses'))}
          >
            <span className="flex items-center gap-3">
              <Wallet className="size-4 shrink-0" />
              <span>Expenses</span>
            </span>
            {expensesOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </button>
          {expensesOpen && (
            <div className="ml-4 space-y-0.5 pt-0.5">
              <button onClick={() => handleNav('/expenses')} className={subLinkClass('/expenses')}>Expense List</button>
              <button onClick={() => handleNav('/expenses/new')} className={subLinkClass('/expenses/new')}>Add Expense</button>
              <button onClick={() => handleNav('/expenses/categories')} className={subLinkClass('/expenses/categories')}>Expense Categories</button>
            </div>
          )}
        </div>

        <Link href="/contacts" onClick={onClose} className={navLinkClass('/contacts')}>
          <Users className="size-4 shrink-0" />
          <span>Contacts</span>
        </Link>

        {/* Reports */}
        <div>
          <button
            onClick={() => setReportsOpen(!reportsOpen)}
            className={sectionToggleClass(reportsOpen, url.startsWith('/reports'))}
          >
            <span className="flex items-center gap-3">
              <BarChart3 className="size-4 shrink-0" />
              <span>Reports</span>
            </span>
            {reportsOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </button>
          {reportsOpen && (
            <div className="ml-4 space-y-0.5 pt-0.5">
              <button onClick={() => handleNav('/reports')} className={subLinkClass('/reports')}>Report Dashboard</button>
              <button onClick={() => handleNav('/reports/day-book')} className={subLinkClass('/reports/day-book')}>Day Book</button>
              <button onClick={() => handleNav('/reports/cash-flow')} className={subLinkClass('/reports/cash-flow')}>Cash Flow</button>
              <button onClick={() => handleNav('/reports/pnl')} className={subLinkClass('/reports/pnl')}>Profit & Loss</button>
              <button onClick={() => handleNav('/reports/balance-sheet')} className={subLinkClass('/reports/balance-sheet')}>Balance Sheet</button>
              <button onClick={() => handleNav('/reports/sales')} className={subLinkClass('/reports/sales')}>Sales Report</button>
              <button onClick={() => handleNav('/reports/purchases')} className={subLinkClass('/reports/purchases')}>Purchase Report</button>
              <button onClick={() => handleNav('/reports/stock')} className={subLinkClass('/reports/stock')}>Stock Report</button>
              <button onClick={() => handleNav('/reports/party')} className={subLinkClass('/reports/party')}>Party Statement</button>
            </div>
          )}
        </div>

        {/* Settings */}
        <div>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={sectionToggleClass(settingsOpen, url.startsWith('/settings'))}
          >
            <span className="flex items-center gap-3">
              <Settings2 className="size-4 shrink-0" />
              <span>Settings</span>
            </span>
            {settingsOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </button>
          {settingsOpen && (
            <div className="ml-4 space-y-0.5 pt-0.5">
              <button onClick={() => handleNav('/settings')} className={subLinkClass('/settings')}>General</button>
              <button onClick={() => handleNav('/settings/business')} className={subLinkClass('/settings/business')}>Business</button>
              <button onClick={() => handleNav('/settings/pos')} className={subLinkClass('/settings/pos')}>POS</button>
              <button onClick={() => handleNav('/settings/inventory')} className={subLinkClass('/settings/inventory')}>Inventory</button>
              <button onClick={() => handleNav('/settings/sales')} className={subLinkClass('/settings/sales')}>Sales</button>
              <button onClick={() => handleNav('/settings/purchases')} className={subLinkClass('/settings/purchases')}>Purchases</button>
              <button onClick={() => handleNav('/settings/receipt')} className={subLinkClass('/settings/receipt')}>Receipt</button>
              <button onClick={() => handleNav('/settings/users')} className={subLinkClass('/settings/users')}>Users & Permissions</button>
              <button onClick={() => handleNav('/settings/backup')} className={subLinkClass('/settings/backup')}>Backup</button>
              <button onClick={() => handleNav('/settings/about')} className={subLinkClass('/settings/about')}>About</button>
            </div>
          )}
        </div>

        <div className="my-3 border-t border-border" />

        <button
          onClick={() => setModulesOpen(!modulesOpen)}
          className={cn(
            'flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            modulesOpen || isModuleActive
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
          )}
        >
          <span className="flex items-center gap-3">
            <div className="size-4 shrink-0" />
            <span>Modules</span>
          </span>
          {modulesOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>

        {modulesOpen && (
          <div className="ml-2 space-y-0.5 pt-0.5">
            {modules.map((mod) => {
              const Icon = iconMap[mod.icon]
              const active = url === mod.href
              return (
                <button
                  key={mod.href}
                  onClick={() => handleNav(mod.href)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left',
                    active
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )}
                >
                  {Icon && <Icon className="size-4 shrink-0" />}
                  <div className="flex flex-col">
                    <span>{mod.label}</span>
                    <span className="text-[11px] font-normal text-sidebar-foreground/50">{mod.description}</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </nav>

      <div className="px-3 py-3 border-t border-border">
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg group">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
              {'?'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">Not logged in</span>
              <span className="text-xs text-muted-foreground capitalize" />
            </div>
          </div>
          <button
            onClick={() => router.visit('/login')}
            className="flex items-center justify-center size-7 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground hover:text-foreground transition-all shrink-0"
            title="Logout"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
