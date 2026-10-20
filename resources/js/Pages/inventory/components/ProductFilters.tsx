import { useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CategoryItem {
  id: number
  name: string
}

export type ArchivedFilter = 'active' | 'archived' | 'all'

export interface ProductFiltersProps {
  search: string
  onSearchChange: (v: string) => void
  category: string
  onCategoryChange: (v: string) => void
  stockStatus: string
  onStockStatusChange: (v: string) => void
  completionStatus?: 'all' | 'complete' | 'incomplete'
  onCompletionStatusChange?: (v: 'all' | 'complete' | 'incomplete') => void
  archived?: ArchivedFilter
  onArchivedChange?: (v: ArchivedFilter) => void
  categories?: CategoryItem[]
}

export default function ProductFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  stockStatus,
  onStockStatusChange,
  completionStatus = 'all',
  onCompletionStatusChange,
  archived = 'active',
  onArchivedChange,
  categories = [],
}: ProductFiltersProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const hasFilters =
    !!search ||
    category !== 'all' ||
    stockStatus !== 'all' ||
    completionStatus !== 'all' ||
    archived !== 'active'

  const clearAll = () => {
    onSearchChange('')
    onCategoryChange('all')
    onStockStatusChange('all')
    onCompletionStatusChange?.('all')
    onArchivedChange?.('active')
  }

  return (
    <div className="space-y-3">
      {/* Search row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 transition-colors"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        {/* Toggles the chip row below on small screens, where it is hidden by default. */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0 md:hidden"
          onClick={() => setMobileFiltersOpen((v) => !v)}
          aria-expanded={mobileFiltersOpen}
        >
          <SlidersHorizontal className="size-3.5" />
          Filters
        </Button>
      </div>

      {/* Filter chips — always visible on desktop, behind the Filters button on mobile */}
      <div className={cn('items-center gap-2 flex-wrap', mobileFiltersOpen ? 'flex' : 'hidden md:flex')}>
        <CategoryChip
          label="All Categories"
          active={category === 'all'}
          onClick={() => onCategoryChange('all')}
        />
        {categories.map((cat) => (
          <CategoryChip
            key={cat.id}
            label={cat.name}
            active={category === String(cat.id)}
            onClick={() => onCategoryChange(String(cat.id))}
          />
        ))}

        <div className="w-px h-5 bg-border mx-1" />

        <StockChip label="All" active={stockStatus === 'all'} onClick={() => onStockStatusChange('all')} />
        <StockChip label="In Stock" active={stockStatus === 'in-stock'} onClick={() => onStockStatusChange('in-stock')} />
        <StockChip label="Low Stock" active={stockStatus === 'low-stock'} onClick={() => onStockStatusChange('low-stock')} />
        <StockChip label="Out of Stock" active={stockStatus === 'out-of-stock'} onClick={() => onStockStatusChange('out-of-stock')} />

        {onCompletionStatusChange && (
          <>
            <div className="w-px h-5 bg-border mx-1" />
            <StockChip label="All" active={completionStatus === 'all'} onClick={() => onCompletionStatusChange('all')} />
            <StockChip label="Complete" active={completionStatus === 'complete'} onClick={() => onCompletionStatusChange('complete')} />
            <StockChip label="Needs Attention" active={completionStatus === 'incomplete'} onClick={() => onCompletionStatusChange('incomplete')} />
          </>
        )}

        {/* Archived products are hidden from the list by default — this is how you see them. */}
        <div className="w-px h-5 bg-border mx-1" />
        <StockChip label="Active" active={archived === 'active'} onClick={() => onArchivedChange?.('active')} />
        <StockChip label="Archived" active={archived === 'archived'} onClick={() => onArchivedChange?.('archived')} />
        <StockChip label="Active + Archived" active={archived === 'all'} onClick={() => onArchivedChange?.('all')} />

        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-foreground ml-2 underline underline-offset-2"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Quick chips (mobile) */}
      <div className="flex md:hidden items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        <MobileFilterChip
          label="All"
          active={category === 'all' && stockStatus === 'all' && archived === 'active'}
          onClick={() => {
            onCategoryChange('all')
            onStockStatusChange('all')
            onArchivedChange?.('active')
          }}
        />
        {categories.slice(0, 5).map((cat) => (
          <MobileFilterChip
            key={cat.id}
            label={cat.name}
            active={category === String(cat.id)}
            onClick={() => onCategoryChange(String(cat.id))}
          />
        ))}
        <span className="w-px h-5 bg-border mx-1 shrink-0" />
        <MobileFilterChip
          label="Archived"
          active={archived === 'archived'}
          onClick={() => onArchivedChange?.('archived')}
        />
      </div>
    </div>
  )
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background text-muted-foreground border-border hover:text-foreground hover:border-ring'
      )}
    >
      {label}
    </button>
  )
}

function StockChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap',
        active
          ? 'bg-foreground text-background border-foreground'
          : 'bg-background text-muted-foreground border-border hover:text-foreground'
      )}
    >
      {label}
    </button>
  )
}

function MobileFilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'text-xs font-medium px-3 py-1.5 rounded-lg border whitespace-nowrap shrink-0',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background text-muted-foreground border-border'
      )}
    >
      {label}
    </button>
  )
}
