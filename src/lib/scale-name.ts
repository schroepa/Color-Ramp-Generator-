import { converter, parse } from 'culori'

const toOklch = converter('oklch')

/** Rough hue → English token name for default scale titles. */
const HUE_NAMES: { max: number; name: string }[] = [
  { max: 20, name: 'red' },
  { max: 45, name: 'orange' },
  { max: 70, name: 'yellow' },
  { max: 150, name: 'green' },
  { max: 190, name: 'teal' },
  { max: 250, name: 'blue' },
  { max: 290, name: 'purple' },
  { max: 330, name: 'pink' },
  { max: 360, name: 'red' },
]

/**
 * Suggest a scale name from base HEX (OKLCH hue).
 * Low chroma → "gray". Invalid → empty string.
 */
export function suggestScaleName(baseHex: string): string {
  const parsed = parse(baseHex)
  if (!parsed) return ''
  const oklch = toOklch(parsed)
  if (!oklch) return ''
  const chroma = oklch.c ?? 0
  if (chroma < 0.04) return 'gray'
  const hue = ((oklch.h ?? 0) % 360 + 360) % 360
  const match = HUE_NAMES.find((entry) => hue <= entry.max)
  return match?.name ?? 'color'
}
