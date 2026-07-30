import { getSettings } from '@/data/settings'

export function formatCurrency(amount: number): string {
  const settings = getSettings()
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: settings.business.currency || 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCurrencyShort(amount: number): string {
  const settings = getSettings()
  return `${settings.business.currencySymbol || 'Rs.'} ${amount.toLocaleString()}`
}

/**
 * Format a date string (YYYY-MM-DD or ISO) for display.
 * E.g. "2026-07-29" → "29 Jul 2026"
 */
export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return date
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return date
  }
}

/**
 * Format a datetime string for display with time.
 * E.g. "2026-07-29T14:30:00.000Z" → "29 Jul 2026, 2:30 PM"
 */
export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return date
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return date
  }
}
