import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DatePreset } from '../hooks/useReportDateRange'

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
]

interface Props {
  preset: DatePreset
  from: string
  to: string
  onPreset: (preset: DatePreset) => void
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  onApplyCustom: () => void
  pending?: boolean
}

export function DateRangeFilter({
  preset, from, to, onPreset, onFromChange, onToChange, onApplyCustom, pending,
}: Props) {
  const pill = (active: boolean) => cn(
    'inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors',
    active
      ? 'bg-foreground text-background border-foreground'
      : 'bg-background text-muted-foreground border-border hover:text-foreground',
    pending && 'opacity-60 cursor-not-allowed',
  )

  return (
    <div className="space-y-2" aria-busy={pending} data-print="hide">
      <div className="flex items-center gap-1.5 flex-wrap">
        {PRESETS.map((p) => {
          const active = preset === p.value
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => onPreset(p.value)}
              disabled={pending}
              aria-pressed={active}
              className={pill(active)}
            >
              {active && pending && <Loader2 className="size-3 animate-spin" />}
              {p.label}
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => onPreset('custom')}
          disabled={pending}
          aria-pressed={preset === 'custom'}
          className={pill(preset === 'custom')}
        >
          Custom
        </button>
      </div>

      {preset === 'custom' && (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
            aria-label="From date"
            className="h-9 px-2.5 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            aria-label="To date"
            className="h-9 px-2.5 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring"
          />
          <button
            type="button"
            onClick={onApplyCustom}
            disabled={pending || !from || !to}
            className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : 'Apply'}
          </button>
        </div>
      )}
    </div>
  )
}
