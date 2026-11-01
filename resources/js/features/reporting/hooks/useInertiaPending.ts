import { useEffect, useState } from 'react'
import { router } from '@inertiajs/react'

/** True while any Inertia visit is in flight. */
export function useInertiaPending(): boolean {
  const [pending, setPending] = useState(false)

  useEffect(() => {
    const start = () => setPending(true)
    const finish = () => setPending(false)
    const off = [
      router.on('start', start),
      router.on('finish', finish),
      router.on('error', finish),
      router.on('invalid', finish),
    ]

    return () => off.forEach((unsubscribe) => unsubscribe())
  }, [])

  return pending
}
