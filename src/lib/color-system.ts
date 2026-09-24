import { formatHex, parse } from 'culori'
import {
  customStepKeys,
  DEFAULT_GENERATION_SETTINGS,
  type GenerationSettings,
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
import { assessRampQuality } from '@/lib/ramp-quality'

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

export const STEP_KEYS = [
  50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750,
  800, 850, 900, 950,
] as const

export type StepKey = (typeof STEP_KEYS)[number]

export const BASE_STEP_INDEX = 9

export function stepKeysForPresetId(preset: Preset): string[] {
  return preset.steps.map((s) => s.label)
}

/**
 * Stable step labels — depend only on preset / count, never on base color (Befund 4).
 */
export function stepKeysFor(
  settings: GenerationSettings,
  preset?: Preset | null,
): string[] {
  if (preset) return stepKeysForPresetId(preset)
  const id = settings.presetId || migrateLegacyToPresetId(settings)
  if (id === 'custom') {
    return customStepKeys(totalSteps(settings))
  }
  if (id === 'compact') {
    return [...stepKeysForPreset('compact')]
  }
  const resolved = resolvePreset(id)
  if (resolved) return stepKeysForPresetId(resolved)
  return customStepKeys(totalSteps(settings))
}

export function baseStepIndex(settings: GenerationSettings): number {
  return settings.lightSteps
}

export type GenerateScaleOptions = {
  preset?: Preset | null
  presetId?: string
  /** Step id override, e.g. "600" (Befund 7). */
  baseStepOverride?: string | null
  /** @deprecated use baseStepOverride */
  baseOverride?: string | null
  theme?: 'light' | 'dark'
}

export function generateScaleColors(
  baseHex: string,
  system: ColorSystem,
  settings: GenerationSettings = DEFAULT_GENERATION_SETTINGS,
  options: GenerateScaleOptions = {},
): string[] {
  const preset =
    options.preset ??
    resolvePreset(
      options.presetId ?? migrateLegacyToPresetId(settings, settings.presetId),
    ) ??
    resolvePreset('tailwind')!

  const override =
    options.baseStepOverride ?? options.baseOverride ?? null

  const result = generateFromPresetCached({
    baseHex,
    preset,
    chromaMode: system,
    baseOverride: override,
    theme: options.theme ?? 'light',
  })
  return result.steps.map((s) => s.hex)
}

export function baseIndexFor(
  baseHex: string,
  settings: GenerationSettings,
  options: GenerateScaleOptions = {},
): number {
  const preset =
    options.preset ??
    resolvePreset(
      options.presetId ?? migrateLegacyToPresetId(settings, settings.presetId),
    ) ??
    resolvePreset('tailwind')!
  const override =
    options.baseStepOverride ?? options.baseOverride ?? null
  const result = generateFromPresetCached({
    baseHex,
    preset,
    chromaMode: 'saturated',
    baseOverride: override,
    theme: 'light',
  })
  if (result.baseStepId) {
    const idx = preset.steps.findIndex((s) => s.id === result.baseStepId)
    if (idx >= 0) return idx
  }
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

export { generateFromPresetCached as generateRamp, settingsFromPreset, assessRampQuality }

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
  preset?: Preset | null,
): Record<string, string> {
  const keys = stepKeysFor(settings, preset)
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
  baseStepId?: string | null,
): string {
  const keys = stepKeysFor(settings, preset)
  const lines = keys.map((step, i) => {
    const hex = colors[i] ?? '#000000'
    return `  --${prefix}-${step}: ${hex};`
  })
  if (baseStepId && keys.includes(baseStepId)) {
    lines.push(`  --${prefix}-base: var(--${prefix}-${baseStepId});`)
  }
  return lines.join('\n')
}

export function scaleToJson(
  colors: string[],
  settings: GenerationSettings = DEFAULT_GENERATION_SETTINGS,
  preset?: Preset | null,
  baseStepId?: string | null,
): string {
  const record = scaleToStepRecord(colors, settings, preset)
  if (baseStepId && record[baseStepId]) {
    return JSON.stringify({ ...record, base: `{${baseStepId}}` }, null, 2)
  }
  return JSON.stringify(record, null, 2)
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
