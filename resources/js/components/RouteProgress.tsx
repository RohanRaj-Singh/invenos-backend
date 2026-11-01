import { useEffect, useRef, useState } from 'react'
import { router } from '@inertiajs/react'
import { cn } from '@/lib/utils'

/** Visible 2px progress bar for every Inertia visit. */
export function RouteProgress() {
  const [visible, setVisible] = useState(false)
  const [pct, setPct] = useState(0)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    const start = () => {
      setVisible(true)
      setPct(8)
      window.clearInterval(timer.current ?? undefined)
      timer.current = window.setInterval(() => {
        setPct((p) => (p >= 90 ? p : p + Math.max(1, (90 - p) * 0.08)))
      }, 120)
    }

    const finish = () => {
      window.clearInterval(timer.current ?? undefined)
      setPct(100)
      window.setTimeout(() => {
        setVisible(false)
        setPct(0)
      }, 220)
    }

    const off = [
      router.on('start', start),
      router.on('finish', finish),
      router.on('error', finish),
      router.on('invalid', finish),
    ]

    return () => {
      window.clearInterval(timer.current ?? undefined)
      off.forEach((unsubscribe) => unsubscribe())
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      data-print="hide"
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 transition-opacity duration-200',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div
        className="h-full bg-primary shadow-[0_0_8px_var(--primary)] transition-[width] duration-150 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
