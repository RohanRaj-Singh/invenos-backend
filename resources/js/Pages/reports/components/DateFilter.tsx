import { useState, useMemo } from 'react'
import { router } from '@inertiajs/react'
import { cn } from '@/lib/utils'

export type DatePreset =
  | 'today' | 'yesterday'
  | 'thisWeek' | 'lastWeek'
  | 'last7' | 'last30' | 'last90' | 'last365'
  | 'thisMonth' | 'lastMonth'
  | 'thisQuarter' | 'lastQuarter'
  | 'thisYear'
  | 'custom'

export function getDateRange(preset: DatePreset): { from: string; to: string } {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const d = (days: number) => new Date(now.getTime() - days * 86400000).toISOString().split('T')[0]

  switch (preset) {
    case 'today': return { from: today, to: today }
    case 'yesterday': return { from: d(1), to: d(1) }
    case 'thisWeek': {
      const start = new Date(now); start.setDate(now.getDate() - now.getDay())
      return { from: start.toISOString().split('T')[0], to: today }
    }
    case 'lastWeek': {
      const end = new Date(now); end.setDate(now.getDate() - now.getDay() - 1)
      const start = new Date(end); start.setDate(end.getDate() - 6)
      return { from: start.toISOString().split('T')[0], to: end.toISOString().split('T')[0] }
    }
    case 'last7': return { from: d(6), to: today }
    case 'last30': return { from: d(29), to: today }
    case 'last90': return { from: d(89), to: today }
    case 'last365': return { from: d(364), to: today }
    case 'thisMonth': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: start.toISOString().split('T')[0], to: today }
    }
    case 'lastMonth': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      return { from: start.toISOString().split('T')[0], to: end.toISOString().split('T')[0] }
    }
    case 'thisQuarter': {
      const q = Math.floor(now.getMonth() / 3)
      const start = new Date(now.getFullYear(), q * 3, 1)
      return { from: start.toISOString().split('T')[0], to: today }
    }
    case 'lastQuarter': {
      const q = Math.floor(now.getMonth() / 3) - 1
      const start = new Date(now.getFullYear(), q * 3, 1)
      const end = new Date(now.getFullYear(), q * 3 + 3, 0)
      return { from: start.toISOString().split('T')[0], to: end.toISOString().split('T')[0] }
    }
    case 'thisYear': {
      const start = new Date(now.getFullYear(), 0, 1)
      return { from: start.toISOString().split('T')[0], to: today }
    }
    default: return { from: today, to: today }
  }
}

export function getPreviousPeriod(preset: DatePreset): { from: string; to: string } | null {
  const current = getDateRange(preset)
  const days = Math.round(
    (new Date(current.to).getTime() - new Date(current.from).getTime()) / 86400000
  ) + 1

  if (days <= 0) return null

  const to = new Date(new Date(current.from).getTime() - 86400000)
  const from = new Date(to.getTime() - (days - 1) * 86400000)

  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  }
}

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'lastWeek', label: 'Last Week' },
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'last90', label: 'Last 90 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisQuarter', label: 'This Quarter' },
  { value: 'lastQuarter', label: 'Last Quarter' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'custom', label: 'Custom' },
]

export interface TrendComparison {
  current: number
  previous: number
  change: number
  changePct: number
  direction: 'up' | 'down' | 'flat'
}

export function computeTrend(current: number, previous: number): TrendComparison {
  const change = current - previous
  const changePct = previous !== 0 ? Math.round((change / previous) * 1000) / 10 : (current > 0 ? 100 : 0)
  return {
    current,
    previous,
    change,
    changePct,
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
  }
}

interface DateFilterProps {
  /** Current preset value */
  value: DatePreset
  /** Called when user selects a preset or custom date */
  onChange: (preset: DatePreset, from: string, to: string) => void
  /** Show secondary row of less-common presets */
  extended?: boolean
}

export function DateFilter({ value, onChange, extended }: DateFilterProps) {
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const handlePreset = (preset: DatePreset) => {
    if (preset === 'custom') {
      if (customFrom && customTo) onChange('custom', customFrom, customTo)
      return
    }
    const range = getDateRange(preset)
    onChange(preset, range.from, range.to)
  }

  // Show first 6 common presets + extended ones when asked
  const visiblePresets = extended ? PRESETS : PRESETS.slice(0, 6)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 flex-wrap">
        {visiblePresets.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePreset(p.value)}
            className={cn(
              'text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap',
              value === p.value
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-muted-foreground border-border hover:text-foreground',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {value === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date" value={customFrom}
            onChange={(e) => { setCustomFrom(e.target.value); onChange('custom', e.target.value, customTo || e.target.value) }}
            className="h-9 px-2.5 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date" value={customTo}
            onChange={(e) => { setCustomTo(e.target.value); onChange('custom', customFrom || e.target.value, e.target.value) }}
            className="h-9 px-2.5 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring"
          />
        </div>
      )}
    </div>
  )
}
