import { useEffect, useRef } from 'react'
import { usePage } from '@inertiajs/react'
import { toast } from 'sonner'

type Flash = {
  success?: string
  error?: string
  warning?: string
  info?: string
}

/**
 * The single place server flash messages become toasts.
 *
 * Controllers respond with a redirect carrying a `success` or `error` flash, which
 * `HandleInertiaRequests` shares on every page. Lifecycle actions must therefore not
 * raise their own toast — doing so produced two contradictory messages, because
 * Inertia fires `onSuccess` for redirects (including refusals).
 *
 * Deduped so a message is announced once per occurrence rather than on every render.
 * The marker resets when the flash clears, so repeating an action still notifies.
 */
export function useFlashToasts() {
  const { props } = usePage()
  const flash = ((props as any)?.flash ?? {}) as Flash
  const seen = useRef<string | null>(null)

  useEffect(() => {
    const key = [flash.success, flash.error, flash.warning, flash.info].filter(Boolean).join('|')

    if (!key) {
      seen.current = null
      return
    }
    if (key === seen.current) {
      return
    }
    seen.current = key

    if (flash.success) toast.success(flash.success)
    if (flash.error) toast.error(flash.error)
    if (flash.warning) toast.warning(flash.warning)
    if (flash.info) toast.info(flash.info)
  }, [flash.success, flash.error, flash.warning, flash.info])
}
