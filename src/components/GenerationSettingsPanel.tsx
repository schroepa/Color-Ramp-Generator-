import { useId, useState } from 'react'
import { PresetPicker, PresetSummaryCard } from '@/components/PresetPicker'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  cloneAsCustom,
  getBuiltinPreset,
  presetStepSummary,
  type Preset,
} from '@/lib/presets'
import {
  RAMP_DENSITIES,
  type RampDensity,
} from '@/lib/ramp-density'
import { cn } from '@/lib/utils'

type GenerationSettingsPanelProps = {
  preset: Preset
  onPresetChange: (preset: Preset) => void
  density: RampDensity
  onDensityChange: (density: RampDensity) => void
  showDensity?: boolean
  hideTitle?: boolean
  rampPreviews?: { id: string; name: string; colors: string[] }[]
  className?: string
}

/** Adjust panel — preset-first (§6.2–6.3). */
export function GenerationSettingsPanel({
  preset,
  onPresetChange,
  density,
  onDensityChange,
  showDensity = true,
  hideTitle = false,
  rampPreviews,
  className,
}: GenerationSettingsPanelProps) {
  const densityId = useId()
  const [pickerOpen, setPickerOpen] = useState(false)

  const forkCustom = () => {
    const custom = cloneAsCustom(preset)
    onPresetChange(custom)
  }

  return (
    <section aria-label="Adjust" className={cn('min-w-0', className)}>
      {!hideTitle ? (
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="type-heading">Adjust</h2>
        </div>
      ) : null}

      {rampPreviews && rampPreviews.length > 0 ? (
        <div className="mb-5 flex flex-col gap-1.5" aria-label="Ramp preview">
          {rampPreviews.map((ramp) => (
            <div key={ramp.id} className="flex items-center gap-2">
              <span className="type-caption w-16 shrink-0 truncate text-[var(--text-muted)]">
                {ramp.name || 'Scale'}
              </span>
              <div className="flex h-3 min-w-0 flex-1 overflow-hidden rounded-sm">
                {ramp.colors.map((hex, i) => (
                  <span
                    key={`${ramp.id}-${i}`}
                    className="min-w-0 flex-1"
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-5">
        <div className="flex min-w-0 flex-col gap-2">
          <Label>Schema</Label>
          <PresetSummaryCard
            preset={preset}
            onClick={() => setPickerOpen((v) => !v)}
          />
          {pickerOpen ? (
            <PresetPicker
              value={preset.builtIn ? preset.id : ''}
              onChange={(id) => {
                const next = getBuiltinPreset(id)
                if (next) {
                  onPresetChange(next)
                  setPickerOpen(false)
                }
              }}
              variant="cards"
            />
          ) : null}
          <p className="type-caption text-[var(--text-faint)]">
            {presetStepSummary(preset)} · set by {preset.label}
            {preset.locks.stepCount ? (
              <>
                {' '}
                ·{' '}
                <button
                  type="button"
                  className="underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  onClick={forkCustom}
                >
                  Edit as custom preset
                </button>
              </>
            ) : null}
          </p>
          <p className="type-caption text-[var(--text-faint)]">
            Generates original colors in this structure — not official brand
            palettes.
          </p>
        </div>

        {showDensity ? (
          <div className="flex min-w-0 flex-col gap-2">
            <Label htmlFor={densityId}>Ramp view</Label>
            <Select
              value={density}
              onValueChange={(next) => onDensityChange(next as RampDensity)}
            >
              <SelectTrigger id={densityId} size="sm" aria-label="Ramp view density">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {RAMP_DENSITIES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {!preset.locks.stepCount ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="justify-start px-0 text-[var(--text-muted)]"
            onClick={() => {
              const tw = getBuiltinPreset('tailwind')
              if (tw) onPresetChange(tw)
            }}
          >
            Reset to Tailwind-Schema
          </Button>
        ) : null}
      </div>
    </section>
  )
}
