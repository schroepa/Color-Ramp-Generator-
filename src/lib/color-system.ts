import { converter, formatHex, parse } from 'culori'
import {
  DEFAULT_GENERATION_SETTINGS,
  type GenerationSettings,
  matchGenerationPreset,
  stepKeysForPreset,
  totalSteps,
} from '@/lib/generation-settings'
import { generateRamp, resolveBaseIndex, assessRampQuality } from '@/lib/ramp-engine'

export type ColorSystem = 'saturated' | 'fade' | 'pale'

export const COLOR_SYSTEMS: { value: ColorSystem; label: string; hint: string }[] = [
  {
    value: 'saturated',
    label: 'Saturated',
    hint: 'Chroma stays strong across the whole scale',
  },
  {
    value: 'fade',
    label: 'Fade',
    hint: 'Chroma softens toward the ends',
  },
  {
    value: 'pale',
    label: 'Pale',
    hint: 'Muted throughout',
  },
]

/** Tailwind dense keys (19). Prefer `stepKeysFor(settings)`. */
export const STEP_KEYS = [
  50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750,
  800, 850, 900, 950,
] as const

export type StepKey = (typeof STEP_KEYS)[number]

/** @deprecated Prefer baseIndexFor(baseHex, settings). */
export const BASE_STEP_INDEX = 9

/**
 * Ordered step labels for a scale.
 * - Known presets: framework keys (base may sit on any key via auto-placement).
 * - Custom: lightN…base…darkM relative to `baseIndex` (defaults to mid).
 */
export function stepKeysFor(
  settings: GenerationSettings,
  baseIndex?: number,
): string[] {
  const presetId = matchGenerationPreset(settings)
  if (presetId) {
    return [...stepKeysForPreset(presetId)]
  }
  const count = totalSteps(settings)
  const k = Math.min(
    count - 1,
    Math.max(0, baseIndex ?? Math.floor(count / 2)),
  )
  const keys: string[] = []
  for (let i = 0; i < k; i += 1) {
    keys.push(`light${k - i}`)
  }
  keys.push('base')
  for (let i = 1; i < count - k; i += 1) {
    keys.push(`dark${i}`)
  }
  return keys
}

/** Midpoint fallback when hex is unknown. Prefer `baseIndexFor`. */
export function baseStepIndex(settings: GenerationSettings): number {
  return settings.lightSteps
}

/** Where the locked base sits for this hex + settings. */
export function baseIndexFor(
  baseHex: string,
  settings: GenerationSettings,
): number {
  return resolveBaseIndex(baseHex, settings)
}

/**
 * Contrast-ladder scale (review v2 · Teil B).
 * Base hex locks at its auto-resolved step.
 */
export function generateScaleColors(
  baseHex: string,
  system: ColorSystem,
  settings: GenerationSettings = DEFAULT_GENERATION_SETTINGS,
): string[] {
  return generateRamp(baseHex, system, settings).colors
}

export { generateRamp, resolveBaseIndex, assessRampQuality, totalSteps }

/** Step key → HEX. Keys follow `stepKeysFor(settings, baseIndex)`. */
export function scaleToStepRecord(
  colors: string[],
  settings: GenerationSettings = DEFAULT_GENERATION_SETTINGS,
  baseIndex?: number,
): Record<string, string> {
  const keys = stepKeysFor(settings, baseIndex)
  const record: Record<string, string> = {}
  keys.forEach((step, i) => {
    record[step] = colors[i] ?? '#000000'
  })
  return record
}

export function scaleToCssVars(
  colors: string[],
  prefix = 'color',
  settings: GenerationSettings = DEFAULT_GENERATION_SETTINGS,
): string {
  return stepKeysFor(settings)
    .map((step, i) => {
      const hex = colors[i] ?? '#000000'
      return `  --${prefix}-${step}: ${hex};`
    })
    .join('\n')
}

export function scaleToJson(
  colors: string[],
  settings: GenerationSettings = DEFAULT_GENERATION_SETTINGS,
): string {
  return JSON.stringify(scaleToStepRecord(colors, settings), null, 2)
}

export function normalizeHex(input: string): string | null {
  const trimmed = input.trim()
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
  const parsed = parse(withHash)
  if (!parsed) return null
  return formatHex(parsed) ?? null
}

export const toOklch = converter('oklch')
