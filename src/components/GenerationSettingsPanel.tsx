import { useId } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Surface } from '@/components/ui/surface'
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
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>

      <div className="flex items-center gap-2">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) =>
            onChange(snapToStep(Number(event.target.value), step, min, max))
          }
          aria-valuetext={display}
          className={cn(
            'h-8 min-w-0 flex-1 cursor-pointer appearance-none bg-transparent',
            '[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[var(--chip)]',
            '[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-[var(--chip)]',
            '[&::-webkit-slider-thumb]:mt-[-5px] [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--text)]',
            '[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[var(--text)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
          )}
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
          <span
            className="type-mono min-w-10 text-center text-[var(--text-muted)] tabular-nums"
            aria-hidden
          >
            {display}
          </span>
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
    <Surface aria-label="Generation settings" className={className}>
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
    </Surface>
  )
}
