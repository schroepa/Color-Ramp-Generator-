/**
 * Hue correction for problematic base hues only (Befund 5).
 * Default 0°. Yellow → orange in darks; blue → cyan in lights.
 */

export type HueSide = 'light' | 'dark'

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

/** Soft cosine lobe around `center` (±halfWidth degrees). */
function lobeWeight(hue: number, center: number, halfWidth: number): number {
  const h = ((hue % 360) + 360) % 360
  let d = Math.abs(h - center)
  if (d > 180) d = 360 - d
  if (d >= halfWidth) return 0
  const t = d / halfWidth
  return 0.5 + 0.5 * Math.cos(Math.PI * t)
}

/**
 * Hue delta (degrees) at relative distance `t` from base (0 at base, 1 at end).
 */
export function hueShiftAt(
  baseHue: number | undefined,
  baseChroma: number,
  t: number,
  side: HueSide,
): number {
  if (baseHue == null || !Number.isFinite(baseHue)) return 0
  if (baseChroma < 0.02) return 0
  const tt = clamp01(t)
  const chromaW = clamp01((baseChroma - 0.02) / 0.08)

  const yellow = lobeWeight(baseHue, 100, 15)
  const yg = lobeWeight(baseHue, 125, 10)
  const blue = lobeWeight(baseHue, 260, 15)

  let maxShift = 0
  if (side === 'dark') {
    maxShift = -25 * yellow - 10 * yg
  } else {
    maxShift = -10 * blue
  }

  return maxShift * chromaW * tt
}

export function hueShiftPeaks(
  baseHue: number | undefined,
  baseChroma: number,
): { light: number; dark: number } {
  return {
    light: hueShiftAt(baseHue, baseChroma, 1, 'light'),
    dark: hueShiftAt(baseHue, baseChroma, 1, 'dark'),
  }
}
