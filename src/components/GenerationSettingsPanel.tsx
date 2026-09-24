import { useId } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import {
  DEFAULT_GENERATION_SETTINGS,
  GENERATION_PRESETS,
  type GenerationPresetId,
  type GenerationSettings,
  matchGenerationPreset,
  settingsForPreset,
  STEPS_MAX,
  STEPS_MIN,
  totalSteps,
} from '@/lib/generation-settings'
import {
  RAMP_DENSITIES,
  type RampDensity,
} from '@/lib/ramp-density'
import { cn } from '@/lib/utils'

type GenerationSettingsPanelProps = {
  settings: GenerationSettings
  onChange: (patch: Partial<GenerationSettings>) => void
  density: RampDensity
  onDensityChange: (density: RampDensity) => void
  /** Hide density control when it lives in the main toolbar. */
  showDensity?: boolean
  /** Hide the section heading (e.g. when the sheet already titles “Adjust”). */
  hideTitle?: boolean
  /** Mini ramp previews above controls (mobile sheet). */
  rampPreviews?: { id: string; name: string; colors: string[] }[]
  className?: string
}

const CUSTOM_PRESET_VALUE = 'custom'
/** Odd totals keep a clear mid; clamp to valid light+dark range. */
const TOTAL_MIN = STEPS_MIN * 2 + 1
const TOTAL_MAX = STEPS_MAX * 2 + 1

function snapToStep(value: number, step: number, min: number, max: number): number {
  const snapped = Math.round(value / step) * step
  const clamped = Math.min(max, Math.max(min, snapped))
  const decimals = String(step).includes('.') ? String(step).split('.')[1]!.length : 0
  return Number(clamped.toFixed(decimals))
}

/** Split total into light / dark (base in the middle of the count). */
function splitTotal(total: number): { lightSteps: number; darkSteps: number } {
  const clamped = Math.min(TOTAL_MAX, Math.max(TOTAL_MIN, Math.round(total)))
  const side = Math.floor((clamped - 1) / 2)
  const lightSteps = side
  const darkSteps = clamped - 1 - lightSteps
  return {
    lightSteps: Math.min(STEPS_MAX, Math.max(STEPS_MIN, lightSteps)),
    darkSteps: Math.min(STEPS_MAX, Math.max(STEPS_MIN, darkSteps)),
  }
}

function SettingsControl({
  id,
  label,
  hint,
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
  hint?: string
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
      <div className="flex min-w-0 items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {hint ? (
          <span className="type-caption text-[var(--text-faint)]">{hint}</span>
        ) : null}
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <Slider
          id={id}
          aria-label={label}
          aria-valuetext={display}
          value={[value]}
          min={min}
          max={max}
          step={step}
          display={display}
          onValueChange={(next) => {
            const raw = next[0]
            if (raw == null) return
            onChange(snapToStep(raw, step, min, max))
          }}
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

/** Global knobs — concept “Adjust” panel (review v2 B4). */
export function GenerationSettingsPanel({
  settings,
  onChange,
  density,
  onDensityChange,
  showDensity = true,
  hideTitle = false,
  rampPreviews,
  className,
}: GenerationSettingsPanelProps) {
  const presetId = useId()
  const densityId = useId()
  const stepsId = useId()
  const count = totalSteps(settings)
  const activePreset = matchGenerationPreset(settings)
  const presetValue = activePreset ?? CUSTOM_PRESET_VALUE

  return (
    <section aria-label="Adjust" className={cn('min-w-0', className)}>
      {!hideTitle ? (
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="type-heading">Adjust</h2>
          <p className="type-caption text-[var(--text-faint)]">
            {count} colors · base auto-placed
          </p>
        </div>
      ) : (
        <p className="mb-4 type-caption text-[var(--text-faint)]">
          {count} colors · base auto-placed
        </p>
      )}

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
          <Label htmlFor={presetId}>Preset</Label>
          <Select
            value={presetValue}
            onValueChange={(next) => {
              if (next === CUSTOM_PRESET_VALUE) return
              onChange(settingsForPreset(next as GenerationPresetId))
            }}
          >
            <SelectTrigger id={presetId} size="sm" aria-label="Generation preset">
              <SelectValue placeholder="Custom" />
            </SelectTrigger>
            <SelectContent align="start">
              {GENERATION_PRESETS.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.label}
                </SelectItem>
              ))}
              <SelectItem value={CUSTOM_PRESET_VALUE} disabled={Boolean(activePreset)}>
                Custom
              </SelectItem>
            </SelectContent>
          </Select>
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

        <SettingsControl
          id={stepsId}
          label="Steps"
          hint="Contrast ladder length"
          value={count}
          min={TOTAL_MIN}
          max={TOTAL_MAX}
          step={1}
          display={String(count)}
          decreaseLabel="Fewer steps"
          increaseLabel="More steps"
          onChange={(total) => onChange(splitTotal(total))}
        />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="justify-start px-0 text-[var(--text-muted)]"
          onClick={() => onChange({ ...DEFAULT_GENERATION_SETTINGS })}
        >
          Reset to defaults
        </Button>
      </div>
    </section>
  )
}
