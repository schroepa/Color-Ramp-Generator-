import {
  DEFAULT_PRESET_ID,
  getBuiltinPreset,
  migrateLegacyToPresetId,
  settingsFromPreset,
} from '@/lib/presets'

export const GENERATION_STORAGE_KEY = 'tintfield.generation.v2'

export const STEPS_MIN = 1
export const STEPS_MAX = 16

export type GenerationSettings = {
  lightSteps: number
  darkSteps: number
  /** Explicit preset id — never inferred from step counts at runtime (Befund 2). */
  presetId: string
}

/** @deprecated Prefer `@/lib/presets` ids. */
export type GenerationPresetId =
  | 'tailwind'
  | 'tailwind-dense'
  | 'fine-50'
  | 'material'
  | 'material-2014'
  | 'material3'
  | 'compact'
  | 'radix'
  | 'ant'
  | 'carbon'
  | 'open-color'
  | 'custom'

export type GenerationPreset = {
  id: GenerationPresetId
  label: string
  hint: string
  settings: GenerationSettings
  stepKeys: readonly string[]
}

export const GENERATION_PRESETS: GenerationPreset[] = [
  {
    id: 'tailwind',
    label: 'Tailwind',
    hint: '11 Stufen · 50–950',
    settings: { ...settingsFromPreset(getBuiltinPreset('tailwind')!), presetId: 'tailwind' },
    stepKeys: getBuiltinPreset('tailwind')!.steps.map((s) => s.id),
  },
  {
    id: 'fine-50',
    label: 'Fein (50er-Schritte)',
    hint: '19 Stufen · 50–950 in 50er-Schritten, kein Tailwind-Standard',
    settings: { ...settingsFromPreset(getBuiltinPreset('fine-50')!), presetId: 'fine-50' },
    stepKeys: getBuiltinPreset('fine-50')!.steps.map((s) => s.id),
  },
  {
    id: 'radix',
    label: 'Radix-Schema',
    hint: '12 Stufen mit Rollen',
    settings: { ...settingsFromPreset(getBuiltinPreset('radix')!), presetId: 'radix' },
    stepKeys: getBuiltinPreset('radix')!.steps.map((s) => s.id),
  },
  {
    id: 'material3',
    label: 'Material-3-Schema',
    hint: '13 L*-Tones',
    settings: { ...settingsFromPreset(getBuiltinPreset('material3')!), presetId: 'material3' },
    stepKeys: getBuiltinPreset('material3')!.steps.map((s) => s.id),
  },
  {
    id: 'ant',
    label: 'Ant-Design-Schema',
    hint: '10 Stufen, Basis 6',
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
  {
    id: 'compact',
    label: 'Kompakt',
    hint: '5 Stufen · 100–900',
    settings: { lightSteps: 2, darkSteps: 2, presetId: 'compact' },
    stepKeys: ['100', '300', '500', '700', '900'],
  },
]

export const DEFAULT_GENERATION_SETTINGS: GenerationSettings = {
  ...settingsFromPreset(getBuiltinPreset(DEFAULT_PRESET_ID)!),
  presetId: DEFAULT_PRESET_ID,
}

type StoredPayload = {
  version: 1 | 2
  settings: GenerationSettings & {
    lightestLightness?: number
    darkestLightness?: number
  }
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

export function normalizeGenerationSettings(
  input: Partial<GenerationSettings> & {
    lightestLightness?: number
    darkestLightness?: number
  } | null | undefined,
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
  // lightestLightness / darkestLightness ignored (Befund 3)
  const presetId = migrateLegacyToPresetId(
    { lightSteps, darkSteps, presetId: input?.presetId ?? 'custom' },
    input?.presetId,
  )
  if (presetId === 'custom') {
    return { lightSteps, darkSteps, presetId: 'custom' }
  }
  const preset = getBuiltinPreset(presetId)
  if (preset) {
    return { ...settingsFromPreset(preset), presetId }
  }
  if (presetId === 'compact') {
    return { lightSteps: 2, darkSteps: 2, presetId: 'compact' }
  }
  return { lightSteps, darkSteps, presetId: 'custom' }
}

export function totalSteps(settings: GenerationSettings): number {
  return settings.lightSteps + 1 + settings.darkSteps
}

/** @deprecated Migration only — do not use for naming at runtime. */
export function matchGenerationPreset(
  settings: GenerationSettings,
): GenerationPresetId | null {
  if (settings.presetId && settings.presetId !== 'custom') {
    return settings.presetId as GenerationPresetId
  }
  return null
}

export function settingsForPreset(id: GenerationPresetId): GenerationSettings {
  const alias =
    id === 'tailwind-dense'
      ? 'fine-50'
      : id === 'material' || id === 'material-2014'
        ? 'material3'
        : id === 'compact'
          ? 'compact'
          : id
  if (alias === 'compact') {
    return { lightSteps: 2, darkSteps: 2, presetId: 'compact' }
  }
  if (alias === 'custom') {
    return { ...DEFAULT_GENERATION_SETTINGS, presetId: 'custom' }
  }
  const preset = getBuiltinPreset(alias) ?? getBuiltinPreset(DEFAULT_PRESET_ID)!
  return { ...settingsFromPreset(preset), presetId: preset.id }
}

export function stepKeysForPreset(id: GenerationPresetId): readonly string[] {
  const found = GENERATION_PRESETS.find((p) => p.id === id)
  if (found) return found.stepKeys
  const settings = settingsForPreset(id)
  const preset = getBuiltinPreset(settings.presetId)
  return preset?.steps.map((s) => s.id) ?? ['100', '200', '300']
}

/** Numeric custom keys: 100, 200, … n×100 (Befund 4). */
export function customStepKeys(count: number): string[] {
  return Array.from({ length: count }, (_, i) => String((i + 1) * 100))
}

export function usesTailwindStepKeys(settings: GenerationSettings): boolean {
  return settings.presetId === 'fine-50'
}

export function loadGenerationSettings(): GenerationSettings {
  try {
    const raw =
      localStorage.getItem(GENERATION_STORAGE_KEY) ??
      localStorage.getItem('tintfield.generation.v1')
    if (!raw) return { ...DEFAULT_GENERATION_SETTINGS }
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_GENERATION_SETTINGS }
    const payload = parsed as Partial<StoredPayload>
    if (
      (payload.version !== 1 && payload.version !== 2) ||
      !payload.settings
    ) {
      return { ...DEFAULT_GENERATION_SETTINGS }
    }
    return normalizeGenerationSettings(payload.settings)
  } catch {
    return { ...DEFAULT_GENERATION_SETTINGS }
  }
}

export function saveGenerationSettings(settings: GenerationSettings): void {
  const payload: StoredPayload = {
    version: 2,
    settings: normalizeGenerationSettings(settings),
  }
  localStorage.setItem(GENERATION_STORAGE_KEY, JSON.stringify(payload))
}
