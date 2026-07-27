import { router } from '@inertiajs/react'
import { cn } from '@/lib/utils'

export type CompletionStatus = 'complete' | 'needs-pricing' | 'needs-packaging' | 'missing-details'

interface CompletionBadgeProduct {
  id: number
  name: string
  sku: string
  category_id?: number | null
  category?: { id: number; name: string } | string | null
  selling_units?: any[]
  cost_price?: number
  selling_price?: number
}

const completionConfig: Record<CompletionStatus, { label: string; color: string; dot: string }> = {
  complete: {
    label: 'Complete',
    color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  'needs-pricing': {
    label: 'Needs Pricing',
    color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  'needs-packaging': {
    label: 'Needs Packaging',
    color: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    dot: 'bg-orange-500',
  },
  'missing-details': {
    label: 'Missing Details',
    color: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
  },
}

export function computeCompletionStatus(product: CompletionBadgeProduct): CompletionStatus {
  if (!product.name || !product.sku || (!product.category && !product.category_id)) {
    return 'missing-details'
  }
  const hasSellingUnits = product.selling_units && product.selling_units.length > 0
  if (!hasSellingUnits) {
    return 'needs-packaging'
  }
  const hasSalePrice = product.selling_units!.some((u: any) => (u.sale_price || 0) > 0) || (product.selling_price || 0) > 0
  if (!hasSalePrice) {
    return 'needs-pricing'
  }
  return 'complete'
}

interface CompletionBadgeProps {
  product: CompletionBadgeProduct
  size?: 'sm' | 'md'
}

export default function CompletionBadge({ product, size = 'md' }: CompletionBadgeProps) {
  const status = computeCompletionStatus(product)
  const config = completionConfig[status]

  return (
    <span
      onClick={(e) => {
        e.stopPropagation()
        router.visit(`/inventory/product/${product.id}`)
      }}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium whitespace-nowrap transition-colors hover:opacity-80 cursor-pointer',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]',
        config.color
      )}
    >
      <span className={cn('rounded-full', size === 'sm' ? 'size-1' : 'size-1.5', config.dot)} />
      {config.label}
    </span>
  )
}
