export const GENERATION_STORAGE_KEY = 'tintfield.generation.v1'

export const STEPS_MIN = 1
export const STEPS_MAX = 16

/** Matches the previous hardcoded OKLCH endpoints in color-system. */
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

export const DEFAULT_GENERATION_SETTINGS: GenerationSettings = {
  lightSteps: 9,
  darkSteps: 9,
  lightestLightness: DEFAULT_LIGHTEST_LIGHTNESS,
  darkestLightness: DEFAULT_DARKEST_LIGHTNESS,
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

/** True when step count matches the classic Tailwind 50–950 ramp. */
export function usesTailwindStepKeys(settings: GenerationSettings): boolean {
  return settings.lightSteps === 9 && settings.darkSteps === 9
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
