import { useCallback, useEffect, useState } from 'react'
import { router } from '@inertiajs/react'

export type DatePreset =
  | 'today' | 'yesterday' | 'thisWeek' | 'lastWeek'
  | 'last7' | 'last30' | 'last90' | 'last365'
  | 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'lastQuarter'
  | 'thisYear' | 'custom'

export interface ReportFiltersProp {
  preset?: DatePreset
  date_from?: string | null
  date_to?: string | null
  [key: string]: unknown
}

interface Options {
  only?: string[]
  keep?: Record<string, string | number | undefined | null>
}

export function useReportDateRange(url: string, filters: ReportFiltersProp, { only, keep = {} }: Options = {}) {
  const [pending, setPending] = useState(false)
  const preset = (filters.preset ?? 'thisMonth') as DatePreset
  const [from, setFrom] = useState(filters.date_from ?? '')
  const [to, setTo] = useState(filters.date_to ?? '')

  useEffect(() => { setFrom(filters.date_from ?? '') }, [filters.date_from])
  useEffect(() => { setTo(filters.date_to ?? '') }, [filters.date_to])

  const apply = useCallback((next: DatePreset, nextFrom?: string, nextTo?: string) => {
    setPending(true)

    // Any date is selectable; normalise the order instead of blocking the picker.
    const rawFrom = nextFrom ?? from
    const rawTo = nextTo ?? to
    const start = rawFrom && rawTo && rawFrom > rawTo ? rawTo : rawFrom
    const end = rawFrom && rawTo && rawFrom > rawTo ? rawFrom : rawTo

    router.get(
      url,
      {
        ...keep,
        preset: next,
        ...(next === 'custom' ? { date_from: start, date_to: end } : {}),
      },
      {
        preserveState: true,
        preserveScroll: true,
        replace: true,
        ...(only ? { only } : {}),
        onFinish: () => setPending(false),
      },
    )
  }, [url, from, to, only, keep])

  return { preset, from, to, setFrom, setTo, apply, pending }
}
