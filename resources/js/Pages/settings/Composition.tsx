import { useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Beaker } from 'lucide-react'
import { SettingsLayout, SettingsSection, SettingsCard, SettingsRow, SettingsSaveBar } from '../components/SettingsComponents'
import { toast } from 'sonner'

const DEFAULT_MARGIN = 30

export default function CompositionSettingsPage() {
  const { props } = usePage()
  const settings = (props as any).settings || {}
  const composition = (settings.composition || {}) as Record<string, any>

  const initial = composition.target_margin_percent ?? DEFAULT_MARGIN
  const [margin, setMargin] = useState(String(initial))

  const hasChanges = margin !== String(initial)

  const parsed = Number(margin)
  const isValid = margin.trim() !== '' && Number.isFinite(parsed) && parsed >= 0 && parsed < 100

  const save = () => {
    if (!isValid) {
      toast.error('Target margin must be between 0 and 99.99')
      return
    }

    router.put('/settings', { composition: { target_margin_percent: parsed } }, {
      onSuccess: () => toast.success('Formula pricing settings saved'),
      onError: () => toast.error('Failed to save settings'),
    })
  }

  return (
    <SettingsLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-teal-600/20 to-teal-600/5 flex items-center justify-center shrink-0">
            <Beaker className="size-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Formula Pricing</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              The target profit margin used to recommend selling prices for formulas.
            </p>
          </div>
        </div>

        <SettingsSection
          title="Target Margin"
          description="Applied to every formula as pricing guidance. It never changes a price automatically."
        >
          <SettingsCard>
            <SettingsRow
              label="Target Gross Margin (%)"
              description="Share of the selling price that should remain as profit after ingredient cost."
            >
              <input
                type="number"
                min="0"
                max="99.99"
                step="0.01"
                value={margin}
                onChange={(event) => setMargin(event.target.value)}
                aria-label="Target gross margin percent"
                className="w-full sm:w-32 h-9 px-3 rounded-lg border border-input bg-background text-xs tabular-nums outline-none focus:border-ring"
              />
            </SettingsRow>
            <div className="px-3 pb-3">
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Default is {DEFAULT_MARGIN}%. Recommended price = ingredient cost ÷ (1 − margin ÷ 100).
                For example, a cost of Rs. 700 at {DEFAULT_MARGIN}% recommends Rs. 1,000.
              </p>
              {!isValid && (
                <p className="mt-1.5 text-[11px] font-medium text-red-600">
                  Enter a margin from 0 up to 99.99. A gross margin cannot reach 100%.
                </p>
              )}
            </div>
          </SettingsCard>
        </SettingsSection>

        <div className="rounded-xl border border-border bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
          This is a <span className="font-medium text-foreground">gross margin</span>, not a markup.
          A 30% margin means 30% of the price is profit; a 30% markup on Rs. 700 would be Rs. 910, not
          Rs. 1,000.
        </div>

        <SettingsSaveBar onSave={save} hasChanges={hasChanges} />
      </div>
    </SettingsLayout>
  )
}
