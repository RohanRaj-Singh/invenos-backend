import { useState } from 'react'
import { router } from '@inertiajs/react'
import { toast } from 'sonner'

type Method = 'delete' | 'post' | 'put' | 'patch'

interface RunOptions {
  url: string
  method: Method
  data?: Record<string, any>
  /**
   * Runs when the request completed without validation errors, for closing dialogs
   * or navigating. The success message itself comes from the server flash.
   */
  onDone?: () => void
}

/**
 * Shared runner for lifecycle actions (delete / archive / restore).
 *
 * Deliberately raises no success toast. The server flash owns the outcome, and
 * `useFlashToasts` is the only thing that turns it into a toast. A local success
 * toast here would fire even when the server refused the action, because Inertia
 * runs `onSuccess` for the redirect a refusal is returned as.
 *
 * Only real validation errors (a 422 with `props.errors`) are surfaced here.
 */
export function useLifecycleAction() {
  const [processing, setProcessing] = useState(false)

  const run = ({ url, method, data, onDone }: RunOptions) => {
    setProcessing(true)

    const payload = data ?? {}
    const callbacks = {
      onError: (errors: Record<string, string>) => {
        const first = Object.values(errors)[0]
        if (first) toast.error(String(first))
      },
      onSuccess: () => onDone?.(),
      onFinish: () => setProcessing(false),
    }

    // `delete` takes its payload inside the options object; the others take it second.
    if (method === 'delete') {
      router.delete(url, { data: payload, ...callbacks })
    } else if (method === 'post') {
      router.post(url, payload, callbacks)
    } else if (method === 'put') {
      router.put(url, payload, callbacks)
    } else {
      router.patch(url, payload, callbacks)
    }
  }

  return { run, processing }
}
