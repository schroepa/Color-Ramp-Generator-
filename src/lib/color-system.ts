import { formatHex, parse } from 'culori'
import {
  DEFAULT_GENERATION_SETTINGS,
  type GenerationSettings,
  matchGenerationPreset,
  stepKeysForPreset,
  totalSteps,
} from '@/lib/generation-settings'
import {
  generateFromPresetCached,
  migrateLegacyToPresetId,
  resolvePreset,
  settingsFromPreset,
  type Preset,
} from '@/lib/presets'
import type { ChromaMode } from '@/lib/presets/types'

export type ColorSystem = ChromaMode

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

/** Tailwind dense keys (19). Prefer `stepKeysForPresetId`. */
export const STEP_KEYS = [
  50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750,
  800, 850, 900, 950,
] as const

export type StepKey = (typeof STEP_KEYS)[number]

/** @deprecated Prefer baseIndexFor. */
export const BASE_STEP_INDEX = 9

export function stepKeysForPresetId(preset: Preset): string[] {
  return preset.steps.map((s) => s.label)
}

/**
 * Ordered step labels. Prefer passing an explicit preset.
 * Falls back to legacy GenerationSettings matching.
 */
export function stepKeysFor(
  settings: GenerationSettings,
  _baseIndex?: number,
  preset?: Preset | null,
): string[] {
  if (preset) return stepKeysForPresetId(preset)
  const presetId = matchGenerationPreset(settings)
  if (presetId) {
    return [...stepKeysForPreset(presetId)]
  }
  const count = totalSteps(settings)
  const k = Math.min(
    count - 1,
    Math.max(0, _baseIndex ?? Math.floor(count / 2)),
  )
  const keys: string[] = []
  for (let i = 0; i < k; i += 1) keys.push(`light${k - i}`)
  keys.push('base')
  for (let i = 1; i < count - k; i += 1) keys.push(`dark${i}`)
  return keys
}

export function baseStepIndex(settings: GenerationSettings): number {
  return settings.lightSteps
}

export function generateScaleColors(
  baseHex: string,
  system: ColorSystem,
  settings: GenerationSettings = DEFAULT_GENERATION_SETTINGS,
  options?: {
    preset?: Preset | null
    presetId?: string
    baseOverride?: string | null
    theme?: 'light' | 'dark'
  },
): string[] {
  const preset =
    options?.preset ??
    resolvePreset(
      options?.presetId ?? migrateLegacyToPresetId(settings),
    ) ??
    resolvePreset('fine-50')!

  const result = generateFromPresetCached({
    baseHex,
    preset,
    chromaMode: system,
    baseOverride: options?.baseOverride ?? null,
    theme: options?.theme ?? 'light',
  })
  return result.steps.map((s) => s.hex)
}

export function baseIndexFor(
  baseHex: string,
  settings: GenerationSettings,
  options?: {
    preset?: Preset | null
    presetId?: string
    baseOverride?: string | null
  },
): number {
  const preset =
    options?.preset ??
    resolvePreset(
      options?.presetId ?? migrateLegacyToPresetId(settings),
    ) ??
    resolvePreset('fine-50')!
  const result = generateFromPresetCached({
    baseHex,
    preset,
    chromaMode: 'saturated',
    baseOverride: options?.baseOverride ?? null,
    theme: 'light',
  })
  if (result.baseStepId) {
    const idx = preset.steps.findIndex((s) => s.id === result.baseStepId)
    if (idx >= 0) return idx
  }
  // Material (none): nearest by temporarily using auto
  const auto = generateFromPresetCached({
    baseHex,
    preset: { ...preset, baseRule: { mode: 'auto' } },
    chromaMode: 'saturated',
    baseOverride: null,
    theme: 'light',
  })
  if (auto.baseStepId) {
    const idx = preset.steps.findIndex((s) => s.id === auto.baseStepId)
    if (idx >= 0) return idx
  }
  return Math.floor(preset.steps.length / 2)
}

export { generateFromPresetCached as generateRamp, settingsFromPreset }

export function resolveBaseIndex(
  baseHex: string,
  settings: GenerationSettings,
  override?: number | null,
): number {
  if (override != null && override >= 0) return override
  return baseIndexFor(baseHex, settings)
}

export function scaleToStepRecord(
  colors: string[],
  settings: GenerationSettings = DEFAULT_GENERATION_SETTINGS,
  baseIndex?: number,
  preset?: Preset | null,
): Record<string, string> {
  const keys = stepKeysFor(settings, baseIndex, preset)
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
  preset?: Preset | null,
): string {
  const keys = stepKeysFor(settings, undefined, preset)
  return keys
    .map((step, i) => {
      const hex = colors[i] ?? '#000000'
      return `  --${prefix}-${step}: ${hex};`
    })
    .join('\n')
}

export function scaleToJson(
  colors: string[],
  settings: GenerationSettings = DEFAULT_GENERATION_SETTINGS,
  preset?: Preset | null,
): string {
  return JSON.stringify(scaleToStepRecord(colors, settings, undefined, preset), null, 2)
}

export function normalizeHex(input: string): string | null {
  const trimmed = input.trim()
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
  const parsed = parse(withHash)
  if (!parsed) return null
  return formatHex(parsed) ?? null
}

export { totalSteps }
export type { Preset }
