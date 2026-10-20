import { cn } from '@/lib/utils'

/**
 * Marks a product that is archived — hidden from new transactions, pickers,
 * valuation and alerts. Amber matches the Archive action it comes from.
 */
export default function ArchivedBadge({ size = 'sm' }: { size?: 'sm' | 'xs' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium whitespace-nowrap',
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-800',
        size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-1.5 py-0 text-[10px]'
      )}
    >
      <span className={cn('rounded-full bg-amber-500', size === 'sm' ? 'size-1.5' : 'size-1')} />
      Archived
    </span>
  )
}
