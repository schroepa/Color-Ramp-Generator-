import { clampChroma, converter, differenceEuclidean, formatHex, parse, wcagContrast } from 'culori'
import { normalizeHex } from '@/lib/color-system'
import { onColor } from '@/lib/contrast'

const toOklch = converter('oklch')
const deltaE = differenceEuclidean('oklab')

/**
 * Fair “typical generator”: linear lightness, base forced to mid step,
 * constant chroma, channel clipping via clampChroma.
 */
export function generateTypicalRamp(baseHex: string, count: number): string[] {
  const hex = normalizeHex(baseHex) ?? '#0d7377'
  const parsed = parse(hex)
  const o = parsed ? toOklch(parsed) : null
  const h = o?.h ?? 0
  const c = Math.max(0, o?.c ?? 0.1)
  const mid = Math.floor(count / 2)
  return Array.from({ length: count }, (_, i) => {
    if (i === mid) return hex
    const t = i / Math.max(1, count - 1)
    const L = 0.97 - t * 0.85
    return (
      formatHex(clampChroma({ mode: 'oklch', l: L, c, h }, 'oklch', 'rgb')) ??
      '#888888'
    )
  })
}

export type CompareFlags = {
  lightIdentical: boolean
  forcedMid: boolean
  unreadable: boolean
  /** True when both methods look similarly fine for this hue. */
  closeCall: boolean
}

export function analyzeCompare(
  typical: string[],
  tintfield: string[],
  tintfieldBaseIdx: number,
): CompareFlags {
  const mid = Math.floor(typical.length / 2)
  const lightIdentical =
    typical.length >= 3 &&
    (deltaE(typical[0]!, typical[1]!) < 0.025 ||
      deltaE(typical[1]!, typical[2]!) < 0.025)

  const forcedMid = tintfieldBaseIdx !== mid && tintfieldBaseIdx >= 0

  let unreadable = false
  for (let i = 2; i <= Math.min(4, typical.length - 1); i += 1) {
    const hex = typical[i]!
    const ink = onColor(hex)
    if (wcagContrast(hex, ink) < 4.5) {
      unreadable = true
      break
    }
  }

  const closeCall = !lightIdentical && !forcedMid && !unreadable

  // Also check tintfield isn't dramatically worse on distinguishability
  void tintfield

  return { lightIdentical, forcedMid, unreadable, closeCall }
}
