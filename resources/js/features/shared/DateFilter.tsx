import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DateFilterValue {
  dateFrom: string
  dateTo: string
  quick: string
}

interface DateFilterProps {
  value: DateFilterValue
  onChange: (value: DateFilterValue) => void
}

const QUICK_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7days', label: '7 days' },
  { value: '30days', label: '30 days' },
  { value: 'month', label: 'This month' },
  { value: 'custom', label: 'Custom' },
]

function getDateRange(key: string): { dateFrom: string; dateTo: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()
  const fmt = (dt: Date) => dt.toISOString().split('T')[0]

  switch (key) {
    case 'today':
      return { dateFrom: fmt(now), dateTo: fmt(now) }
    case 'yesterday': {
      const yest = new Date(now)
      yest.setDate(d - 1)
      return { dateFrom: fmt(yest), dateTo: fmt(yest) }
    }
    case '7days': {
      const start = new Date(now)
      start.setDate(d - 6)
      return { dateFrom: fmt(start), dateTo: fmt(now) }
    }
    case '30days': {
      const start = new Date(now)
      start.setDate(d - 29)
      return { dateFrom: fmt(start), dateTo: fmt(now) }
    }
    case 'month':
      return { dateFrom: fmt(new Date(y, m, 1)), dateTo: fmt(now) }
    default:
      return { dateFrom: '', dateTo: '' }
  }
}

export default function DateFilter({ value, onChange }: DateFilterProps) {
  const [showCustom, setShowCustom] = useState(value.quick === 'custom')

  const select = (key: string) => {
    if (key === 'custom') {
      setShowCustom(!showCustom)
      if (showCustom) {
        // closing custom — reset if no dates set
        if (!value.dateFrom && !value.dateTo) {
          onChange({ dateFrom: '', dateTo: '', quick: '' })
        }
      } else {
        onChange({ ...value, quick: 'custom' })
      }
      return
    }
    setShowCustom(false)
    const range = getDateRange(key)
    onChange({ ...range, quick: key })
  }

  return (
    <div className="w-full">
      {/* Quick option chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <Calendar className="size-3.5 text-muted-foreground shrink-0" />
        {QUICK_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => select(opt.value)}
            className={cn(
              'text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors shrink-0 whitespace-nowrap',
              value.quick === opt.value && opt.value !== ''
                ? 'bg-foreground text-background border-foreground'
                : !value.quick && opt.value === ''
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-background text-muted-foreground border-border hover:text-foreground'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Custom date range inputs (expandable) */}
      {showCustom && (
        <div className="flex items-center gap-2 mt-2 pl-5">
          <input
            type="date"
            value={value.dateFrom}
            onChange={(e) => onChange({ ...value, dateFrom: e.target.value, quick: 'custom' })}
            className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring transition-colors"
            placeholder="From"
          />
          <span className="text-xs text-muted-foreground">→</span>
          <input
            type="date"
            value={value.dateTo}
            onChange={(e) => onChange({ ...value, dateTo: e.target.value, quick: 'custom' })}
            className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring transition-colors"
            placeholder="To"
          />
        </div>
      )}
    </div>
  )
}
