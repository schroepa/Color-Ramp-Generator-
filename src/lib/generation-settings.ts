import {
  DEFAULT_PRESET_ID,
  getBuiltinPreset,
  migrateLegacyToPresetId,
  settingsFromPreset,
} from '@/lib/presets'

export const GENERATION_STORAGE_KEY = 'tintfield.generation.v1'

export const STEPS_MIN = 1
export const STEPS_MAX = 16

export const DEFAULT_LIGHTEST_LIGHTNESS = 0.97
export const DEFAULT_DARKEST_LIGHTNESS = 0.12

export type GenerationSettings = {
  lightSteps: number
  darkSteps: number
  lightestLightness: number
  darkestLightness: number
  /** Active design-system preset id (set-level). */
  presetId?: string
}

/** @deprecated Use Preset ids from `@/lib/presets`. Kept for migration. */
export type GenerationPresetId =
  | 'tailwind'
  | 'tailwind-dense'
  | 'fine-50'
  | 'material'
  | 'material3'
  | 'compact'
  | 'radix'
  | 'ant'
  | 'carbon'
  | 'open-color'

export type GenerationPreset = {
  id: GenerationPresetId
  label: string
  hint: string
  settings: GenerationSettings
  stepKeys: readonly string[]
}

/** Legacy list — UI should prefer BUILTIN_PRESETS. */
export const GENERATION_PRESETS: GenerationPreset[] = [
  {
    id: 'tailwind',
    label: 'Tailwind-Schema',
    hint: '11 steps 50–950',
    settings: { ...settingsFromPreset(getBuiltinPreset('tailwind')!), presetId: 'tailwind' },
    stepKeys: getBuiltinPreset('tailwind')!.steps.map((s) => s.id),
  },
  {
    id: 'fine-50',
    label: 'Fein (50er)',
    hint: '19 half-steps',
    settings: { ...settingsFromPreset(getBuiltinPreset('fine-50')!), presetId: 'fine-50' },
    stepKeys: getBuiltinPreset('fine-50')!.steps.map((s) => s.id),
  },
  {
    id: 'radix',
    label: 'Radix-Schema',
    hint: '12 role steps',
    settings: { ...settingsFromPreset(getBuiltinPreset('radix')!), presetId: 'radix' },
    stepKeys: getBuiltinPreset('radix')!.steps.map((s) => s.id),
  },
  {
    id: 'material3',
    label: 'Material-3-Schema',
    hint: '13 L* tones',
    settings: { ...settingsFromPreset(getBuiltinPreset('material3')!), presetId: 'material3' },
    stepKeys: getBuiltinPreset('material3')!.steps.map((s) => s.id),
  },
  {
    id: 'ant',
    label: 'Ant-Design-Schema',
    hint: '10 steps, base 6',
    settings: { ...settingsFromPreset(getBuiltinPreset('ant')!), presetId: 'ant' },
    stepKeys: getBuiltinPreset('ant')!.steps.map((s) => s.id),
  },
  {
    id: 'carbon',
    label: 'Carbon-Schema',
    hint: '10–100',
    settings: { ...settingsFromPreset(getBuiltinPreset('carbon')!), presetId: 'carbon' },
    stepKeys: getBuiltinPreset('carbon')!.steps.map((s) => s.id),
  },
  {
    id: 'open-color',
    label: 'Open-Color-Schema',
    hint: '0–9',
    settings: { ...settingsFromPreset(getBuiltinPreset('open-color')!), presetId: 'open-color' },
    stepKeys: getBuiltinPreset('open-color')!.steps.map((s) => s.id),
  },
]

export const DEFAULT_GENERATION_SETTINGS: GenerationSettings = {
  ...settingsFromPreset(getBuiltinPreset(DEFAULT_PRESET_ID)!),
  presetId: DEFAULT_PRESET_ID,
}

type StoredPayload = {
  version: 1
  settings: GenerationSettings
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

function clampFloat(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

export function normalizeGenerationSettings(
  input: Partial<GenerationSettings> | null | undefined,
): GenerationSettings {
  const lightSteps = clampInt(
    input?.lightSteps,
    STEPS_MIN,
    STEPS_MAX,
    DEFAULT_GENERATION_SETTINGS.lightSteps,
  )
  const darkSteps = clampInt(
    input?.darkSteps,
    STEPS_MIN,
    STEPS_MAX,
    DEFAULT_GENERATION_SETTINGS.darkSteps,
  )
  let lightestLightness = clampFloat(
    input?.lightestLightness,
    0,
    1,
    DEFAULT_GENERATION_SETTINGS.lightestLightness,
  )
  let darkestLightness = clampFloat(
    input?.darkestLightness,
    0,
    1,
    DEFAULT_GENERATION_SETTINGS.darkestLightness,
  )
  if (lightestLightness <= darkestLightness) {
    lightestLightness = DEFAULT_GENERATION_SETTINGS.lightestLightness
    darkestLightness = DEFAULT_GENERATION_SETTINGS.darkestLightness
  }
  const presetId = migrateLegacyToPresetId(
    { lightSteps, darkSteps, lightestLightness, darkestLightness },
    input?.presetId,
  )
  const preset = getBuiltinPreset(presetId)
  if (preset) {
    return { ...settingsFromPreset(preset), presetId }
  }
  return { lightSteps, darkSteps, lightestLightness, darkestLightness, presetId }
}

export function totalSteps(settings: GenerationSettings): number {
  return settings.lightSteps + 1 + settings.darkSteps
}

export function matchGenerationPreset(
  settings: GenerationSettings,
): GenerationPresetId | null {
  const id = settings.presetId ?? migrateLegacyToPresetId(settings)
  const found = GENERATION_PRESETS.find((p) => p.id === id)
  return (found?.id as GenerationPresetId) ?? null
}

export function settingsForPreset(id: GenerationPresetId): GenerationSettings {
  const alias =
    id === 'tailwind-dense'
      ? 'fine-50'
      : id === 'material'
        ? 'material3'
        : id === 'compact'
          ? 'open-color'
          : id
  const preset = getBuiltinPreset(alias) ?? getBuiltinPreset(DEFAULT_PRESET_ID)!
  return { ...settingsFromPreset(preset), presetId: preset.id }
}

export function stepKeysForPreset(id: GenerationPresetId): readonly string[] {
  const settings = settingsForPreset(id)
  const preset = getBuiltinPreset(settings.presetId ?? DEFAULT_PRESET_ID)
  return preset?.steps.map((s) => s.id) ?? GENERATION_PRESETS[0]!.stepKeys
}

export function usesTailwindStepKeys(settings: GenerationSettings): boolean {
  return (settings.presetId ?? matchGenerationPreset(settings)) === 'fine-50'
}

export function loadGenerationSettings(): GenerationSettings {
  try {
    const raw = localStorage.getItem(GENERATION_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_GENERATION_SETTINGS }
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_GENERATION_SETTINGS }
    const payload = parsed as Partial<StoredPayload>
    if (payload.version !== 1 || !payload.settings) {
      return { ...DEFAULT_GENERATION_SETTINGS }
    }
    return normalizeGenerationSettings(payload.settings)
  } catch {
    return { ...DEFAULT_GENERATION_SETTINGS }
  }
}

export function saveGenerationSettings(settings: GenerationSettings): void {
  const payload: StoredPayload = {
    version: 1,
    settings: normalizeGenerationSettings(settings),
  }
  localStorage.setItem(GENERATION_STORAGE_KEY, JSON.stringify(payload))
}
