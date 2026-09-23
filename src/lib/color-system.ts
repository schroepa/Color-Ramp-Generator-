import {
  clampChroma,
  converter,
  formatHex,
  parse,
  type Oklch,
} from 'culori'

export type ColorSystem = 'saturated' | 'fade' | 'pale'

export const COLOR_SYSTEMS: { value: ColorSystem; label: string; hint: string }[] = [
  { value: 'saturated', label: 'Saturated', hint: 'High chroma across the scale' },
  { value: 'fade', label: 'Fade', hint: 'Muted, dusty chroma' },
  { value: 'pale', label: 'Pale', hint: 'Pastel lightness, softer chroma' },
]

/** Tailwind-like step keys for 19 swatches (9 lighter + base + 9 darker). */
export const STEP_KEYS = [
  50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750,
  800, 850, 900, 950,
] as const

export type StepKey = (typeof STEP_KEYS)[number]

export const BASE_STEP_INDEX = 9

const toOklch = converter('oklch')

const LIGHTEST = 0.985
const DARKEST = 0.12

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

function lightnessAt(index: number, baseL: number): number {
  if (index === BASE_STEP_INDEX) return baseL
  if (index < BASE_STEP_INDEX) {
    const t = index / BASE_STEP_INDEX
    return LIGHTEST + (baseL - LIGHTEST) * t
  }
  const t = (index - BASE_STEP_INDEX) / (STEP_KEYS.length - 1 - BASE_STEP_INDEX)
  return baseL + (DARKEST - baseL) * t
}

function chromaAt(
  index: number,
  baseC: number,
  system: ColorSystem,
): number {
  const dist = Math.abs(index - BASE_STEP_INDEX) / BASE_STEP_INDEX
  const falloff =
    system === 'saturated' ? 0.12 : system === 'fade' ? 0.4 : 0.28
  return Math.max(0, baseC * (1 - dist * falloff))
}

/** HEX in → 19 HEX out via OKLCH (culori only). */
export function generateScaleColors(
  baseHex: string,
  system: ColorSystem,
): string[] {
  const parsed = parse(baseHex)
  if (!parsed) {
    return Array.from({ length: STEP_KEYS.length }, () => '#000000')
  }

  const oklch = toOklch(parsed)
  if (!oklch) {
    return Array.from({ length: STEP_KEYS.length }, () => '#000000')
  }

  const { l, c, h } = applySystem(oklch, system)

  return STEP_KEYS.map((_, index) => {
    const sample: Oklch = {
      mode: 'oklch',
      l: lightnessAt(index, l),
      c: chromaAt(index, c, system),
      h,
    }
    const gamutSafe = clampChroma(sample, 'oklch', 'rgb')
    return formatHex(gamutSafe) ?? '#000000'
  })
}

export function scaleToStepRecord(colors: string[]): Record<string, string> {
  const record: Record<string, string> = {}
  STEP_KEYS.forEach((step, i) => {
    record[`step-${step}`] = colors[i] ?? '#000000'
  })
  return record
}

export function scaleToCssVars(colors: string[], prefix = 'color'): string {
  return STEP_KEYS.map((step, i) => {
    const hex = colors[i] ?? '#000000'
    return `  --${prefix}-${step}: ${hex};`
  }).join('\n')
}

export function scaleToJson(colors: string[]): string {
  return JSON.stringify(scaleToStepRecord(colors), null, 2)
}

export function normalizeHex(input: string): string | null {
  const trimmed = input.trim()
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
  const parsed = parse(withHash)
  if (!parsed) return null
  return formatHex(parsed) ?? null
}
