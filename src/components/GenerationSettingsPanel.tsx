import { useId } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import ExposureSlider from '@/components/ui/smoothui/exposure-slider'
import {
  type GenerationSettings,
  STEPS_MAX,
  STEPS_MIN,
  totalSteps,
} from '@/lib/generation-settings'
import { cn } from '@/lib/utils'
type GenerationSettingsPanelProps = {
  settings: GenerationSettings
  onChange: (patch: Partial<GenerationSettings>) => void
  className?: string
}

const LIGHTNESS_STEP = 0.005

function snapToStep(value: number, step: number, min: number, max: number): number {
  const snapped = Math.round(value / step) * step
  const clamped = Math.min(max, Math.max(min, snapped))
  // Avoid float noise (e.g. 0.9850000001) in the display / storage path.
  const decimals = String(step).includes('.') ? String(step).split('.')[1]!.length : 0
  return Number(clamped.toFixed(decimals))
}

function SettingsControl({
  id,
  label,
  value,
  min,
  max,
  step,
  display,
  decreaseLabel,
  increaseLabel,
  onChange,
}: {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  decreaseLabel: string
  increaseLabel: string
  onChange: (value: number) => void
}) {
  const atMin = value <= min + step * 1e-9
  const atMax = value >= max - step * 1e-9

  const nudge = (direction: -1 | 1) => {
    onChange(snapToStep(value + direction * step, step, min, max))
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>

      <div className="flex min-w-0 items-center gap-2">
        <ExposureSlider
          id={id}
          label={label}
          value={value}
          min={min}
          max={max}
          step={step}
          display={display}
          onChange={onChange}
        />

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            aria-label={decreaseLabel}
            disabled={atMin}
            onClick={() => nudge(-1)}
          >
            <Minus />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            aria-label={increaseLabel}
            disabled={atMax}
            onClick={() => nudge(1)}
          >
            <Plus />
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Global knobs that reshape every generated scale (preview + saved). */
export function GenerationSettingsPanel({
  settings,
  onChange,
  className,
}: GenerationSettingsPanelProps) {
  const lightId = useId()
  const darkId = useId()
  const lightestId = useId()
  const darkestId = useId()
  const count = totalSteps(settings)

  return (
    <section aria-label="Generation settings" className={cn('min-w-0', className)}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="type-heading">Generation</h2>
        <p className="type-caption text-[var(--text-faint)]">
          {settings.lightSteps} + base + {settings.darkSteps} = {count} colors
        </p>
      </div>

      <div className="grid gap-4">
        <SettingsControl
          id={lightId}
          label="Light steps"
          value={settings.lightSteps}
          min={STEPS_MIN}
          max={STEPS_MAX}
          step={1}
          display={String(settings.lightSteps)}
          decreaseLabel="Decrease light steps"
          increaseLabel="Increase light steps"
          onChange={(lightSteps) => onChange({ lightSteps })}
        />
        <SettingsControl
          id={darkId}
          label="Dark steps"
          value={settings.darkSteps}
          min={STEPS_MIN}
          max={STEPS_MAX}
          step={1}
          display={String(settings.darkSteps)}
          decreaseLabel="Decrease dark steps"
          increaseLabel="Increase dark steps"
          onChange={(darkSteps) => onChange({ darkSteps })}
        />
        <SettingsControl
          id={lightestId}
          label="Lightest lightness"
          value={settings.lightestLightness}
          min={0.5}
          max={1}
          step={LIGHTNESS_STEP}
          display={settings.lightestLightness.toFixed(3)}
          decreaseLabel="Decrease lightest lightness"
          increaseLabel="Increase lightest lightness"
          onChange={(lightestLightness) => onChange({ lightestLightness })}
        />
        <SettingsControl
          id={darkestId}
          label="Darkest lightness"
          value={settings.darkestLightness}
          min={0}
          max={0.5}
          step={LIGHTNESS_STEP}
          display={settings.darkestLightness.toFixed(3)}
          decreaseLabel="Decrease darkest lightness"
          increaseLabel="Increase darkest lightness"
          onChange={(darkestLightness) => onChange({ darkestLightness })}
        />
      </div>
    </section>
  )
}
