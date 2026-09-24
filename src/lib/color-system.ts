import {
  clampChroma,
  converter,
  formatHex,
  parse,
  type Oklch,
} from 'culori'
import {
  DEFAULT_GENERATION_SETTINGS,
  type GenerationSettings,
  totalSteps,
  usesTailwindStepKeys,
} from '@/lib/generation-settings'

export type ColorSystem = 'saturated' | 'fade' | 'pale'

export const COLOR_SYSTEMS: { value: ColorSystem; label: string; hint: string }[] = [
  { value: 'saturated', label: 'Saturated', hint: 'High chroma across the scale' },
  { value: 'fade', label: 'Fade', hint: 'Muted, dusty chroma' },
  { value: 'pale', label: 'Pale', hint: 'Pastel lightness, softer chroma' },
]

/** Tailwind-like step keys for the default 19 swatches (9 lighter + base + 9 darker). */
export const STEP_KEYS = [
  50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750,
  800, 850, 900, 950,
] as const

export type StepKey = (typeof STEP_KEYS)[number]

/** Base index for the default 9+1+9 ramp. Prefer `baseStepIndex(settings)`. */
export const BASE_STEP_INDEX = 9

const toOklch = converter('oklch')

/**
 * Ordered step labels for a scale.
 * - When lightSteps=9 and darkSteps=9: classic Tailwind keys `"50"`…`"950"` (base = `"500"`).
 * - Otherwise: `light{N}`…`light1`, `base`, `dark1`…`dark{M}` where N=lightSteps, M=darkSteps
 *   (`lightN` = lightest, `darkM` = darkest, `base` = middle reference).
 */
export function stepKeysFor(settings: GenerationSettings): string[] {
  if (usesTailwindStepKeys(settings)) {
    return STEP_KEYS.map(String)
  }
  const keys: string[] = []
  for (let i = settings.lightSteps; i >= 1; i -= 1) {
    keys.push(`light${i}`)
  }
  keys.push('base')
  for (let i = 1; i <= settings.darkSteps; i += 1) {
    keys.push(`dark${i}`)
  }
  return keys
}

export function baseStepIndex(settings: GenerationSettings): number {
  return settings.lightSteps
}

function applySystem(
  color: Oklch,
  system: ColorSystem,
): { l: number; c: number; h: number } {
  const h = color.h ?? 0
  let l = color.l
  let c = color.c ?? 0

  switch (system) {
    case 'fade':
      c *= 0.5
      break
    case 'pale':
      l = Math.min(0.9, l + 0.14)
      c *= 0.7
      break
    case 'saturated':
    default:
      c = Math.min(0.4, c * 1.08)
      break
  }

  return { l, c, h }
}

function lightnessAt(
  index: number,
  baseL: number,
  settings: GenerationSettings,
): number {
  const baseIndex = baseStepIndex(settings)
  if (index === baseIndex) return baseL
  if (index < baseIndex) {
    const t = index / baseIndex
    return settings.lightestLightness + (baseL - settings.lightestLightness) * t
  }
  const t = (index - baseIndex) / settings.darkSteps
  return baseL + (settings.darkestLightness - baseL) * t
}

function chromaAt(
  index: number,
  baseC: number,
  system: ColorSystem,
  settings: GenerationSettings,
): number {
  const baseIndex = baseStepIndex(settings)
  let dist = 0
  if (index < baseIndex) {
    dist = (baseIndex - index) / settings.lightSteps
  } else if (index > baseIndex) {
    dist = (index - baseIndex) / settings.darkSteps
  }
  const falloff =
    system === 'saturated' ? 0.12 : system === 'fade' ? 0.4 : 0.28
  return Math.max(0, baseC * (1 - dist * falloff))
}

/** HEX in → lightSteps + base + darkSteps HEX out via OKLCH (culori only). */
export function generateScaleColors(
  baseHex: string,
  system: ColorSystem,
  settings: GenerationSettings = DEFAULT_GENERATION_SETTINGS,
): string[] {
  const count = totalSteps(settings)
  const parsed = parse(baseHex)
  if (!parsed) {
    return Array.from({ length: count }, () => '#000000')
  }

  const oklch = toOklch(parsed)
  if (!oklch) {
    return Array.from({ length: count }, () => '#000000')
  }

  const { l, c, h } = applySystem(oklch, system)

  return Array.from({ length: count }, (_, index) => {
    const sample: Oklch = {
      mode: 'oklch',
      l: lightnessAt(index, l, settings),
      c: chromaAt(index, c, system, settings),
      h,
    }
    const gamutSafe = clampChroma(sample, 'oklch', 'rgb')
    return formatHex(gamutSafe) ?? '#000000'
  })
}

/** Step key → HEX. Keys follow `stepKeysFor(settings)`. */
export function scaleToStepRecord(
  colors: string[],
  settings: GenerationSettings = DEFAULT_GENERATION_SETTINGS,
): Record<string, string> {
  const keys = stepKeysFor(settings)
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
