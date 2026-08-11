import { usePage } from '@inertiajs/react'
import { getBusinessSettings } from '@/data/settings'

/**
 * Business + receipt settings for the current session.
 *
 * Prefers the globally-shared `settings` Inertia prop (injected by
 * HandleInertiaRequests from the real SettingService), and falls back to
 * the in-memory default store for local development.
 */
export function useBusinessSettings() {
  const { props } = usePage<Record<string, any>>()
  const shared = (props as any)?.settings
  const business = shared?.business || getBusinessSettings()
  const receipt = shared?.receipt || {}

  return { business, receipt }
}

export type BusinessSettingsShape = Record<string, any>
