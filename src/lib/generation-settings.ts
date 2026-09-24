export const GENERATION_STORAGE_KEY = 'tintfield.generation.v1'

export const STEPS_MIN = 1
export const STEPS_MAX = 16

/** Matches ColorBox-style OKLCH endpoints (light soft / dark deep). */
export const DEFAULT_LIGHTEST_LIGHTNESS = 0.985
export const DEFAULT_DARKEST_LIGHTNESS = 0.12

export type GenerationSettings = {
  /** Colors lighter than the base (independent of darkSteps). */
  lightSteps: number
  /** Colors darker than the base (independent of lightSteps). */
  darkSteps: number
  /** OKLCH lightness of the lightest swatch (0–1). */
  lightestLightness: number
  /** OKLCH lightness of the darkest swatch (0–1). */
  darkestLightness: number
}

export type GenerationPresetId =
  | 'tailwind'
  | 'tailwind-dense'
  | 'material'
  | 'compact'

export type GenerationPreset = {
  id: GenerationPresetId
  label: string
  hint: string
  settings: GenerationSettings
  /** Export / CSS step keys (length = lightSteps + 1 + darkSteps). */
  stepKeys: readonly string[]
}

export const GENERATION_PRESETS: GenerationPreset[] = [
  {
    id: 'tailwind',
    label: 'Tailwind',
    hint: '11 steps — drop-in for theme.colors',
    settings: {
      lightSteps: 5,
      darkSteps: 5,
      lightestLightness: DEFAULT_LIGHTEST_LIGHTNESS,
      darkestLightness: DEFAULT_DARKEST_LIGHTNESS,
    },
    stepKeys: [
      '50',
      '100',
      '200',
      '300',
      '400',
      '500',
      '600',
      '700',
      '800',
      '900',
      '950',
    ],
  },
  {
    id: 'tailwind-dense',
    label: 'Tailwind dense',
    hint: '19 steps — half-stops 50…950',
    settings: {
      lightSteps: 9,
      darkSteps: 9,
      lightestLightness: DEFAULT_LIGHTEST_LIGHTNESS,
      darkestLightness: DEFAULT_DARKEST_LIGHTNESS,
    },
    stepKeys: [
      '50',
      '100',
      '150',
      '200',
      '250',
      '300',
      '350',
      '400',
      '450',
      '500',
      '550',
      '600',
      '650',
      '700',
      '750',
      '800',
      '850',
      '900',
      '950',
    ],
  },
  {
    id: 'material',
    label: 'Material',
    hint: '10 steps — Material 50…900',
    settings: {
      lightSteps: 4,
      darkSteps: 5,
      lightestLightness: DEFAULT_LIGHTEST_LIGHTNESS,
      darkestLightness: DEFAULT_DARKEST_LIGHTNESS,
    },
    stepKeys: [
      '50',
      '100',
      '200',
      '300',
      '400',
      '500',
      '600',
      '700',
      '800',
      '900',
    ],
  },
  {
    id: 'compact',
    label: 'Compact',
    hint: '5 steps — quick UI tokens',
    settings: {
      lightSteps: 2,
      darkSteps: 2,
      lightestLightness: DEFAULT_LIGHTEST_LIGHTNESS,
      darkestLightness: DEFAULT_DARKEST_LIGHTNESS,
    },
    stepKeys: ['100', '300', '500', '700', '900'],
  },
]

/** Default matches Tailwind dense (previous product default). */
export const DEFAULT_GENERATION_SETTINGS: GenerationSettings = {
  ...GENERATION_PRESETS.find((p) => p.id === 'tailwind-dense')!.settings,
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
  return { lightSteps, darkSteps, lightestLightness, darkestLightness }
}

export function totalSteps(settings: GenerationSettings): number {
  return settings.lightSteps + 1 + settings.darkSteps
}

/** Match a named preset by step counts only (lightness can still be custom). */
export function matchGenerationPreset(
  settings: GenerationSettings,
): GenerationPresetId | null {
  const found = GENERATION_PRESETS.find(
    (preset) =>
      preset.settings.lightSteps === settings.lightSteps &&
      preset.settings.darkSteps === settings.darkSteps,
  )
  return found?.id ?? null
}

export function settingsForPreset(id: GenerationPresetId): GenerationSettings {
  const preset = GENERATION_PRESETS.find((item) => item.id === id)
  return { ...(preset ?? GENERATION_PRESETS[1]!).settings }
}

export function stepKeysForPreset(id: GenerationPresetId): readonly string[] {
  const preset = GENERATION_PRESETS.find((item) => item.id === id)
  return preset?.stepKeys ?? GENERATION_PRESETS[1]!.stepKeys
}

/** @deprecated Prefer matchGenerationPreset — true for dense 19-step Tailwind keys. */
export function usesTailwindStepKeys(settings: GenerationSettings): boolean {
  return matchGenerationPreset(settings) === 'tailwind-dense'
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
