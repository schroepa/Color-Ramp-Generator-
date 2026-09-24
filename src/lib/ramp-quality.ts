import {
  converter,
  differenceEuclidean,
  parse,
  wcagContrast,
} from 'culori'

const toOklch = converter('oklch')
const deltaE = differenceEuclidean('oklab')
const WHITE = '#ffffff'
const BLACK = '#000000'

/** Neighbors must be distinguishable in OKLab (Befund 6). */
export const MIN_NEIGHBOR_DELTA_E = 0.012
/** No single gap > 2.5× average. */
export const MAX_GAP_FACTOR = 2.5
/** Absolute gap ceiling. */
export const MAX_GAP_ABS = 0.12
/** Base must not pop out vs neighbors. */
export const BASE_EMBED_MAX_DELTA_E = 0.2

export type RampQuality = {
  ok: boolean
  monotone: boolean
  minDeltaE: boolean
  maxGap: boolean
  usable: boolean
  baseEmbedded: boolean
  label: string
  deltas: number[]
  avgDelta: number
  worstIndex: number
}

function neighborDelta(a: string, b: string): number {
  const d = deltaE(a, b)
  return Number.isFinite(d) ? d : 0
}

/** Post-generation quality gate — OKLab ΔE (Befund 6). */
export function assessRampQuality(
  colors: string[],
  baseIndex: number,
): RampQuality {
  const luminances = colors.map((hex) => {
    const o = toOklch(parse(hex) ?? hex)
    return o?.l ?? 0
  })
  let monotone = true
  for (let i = 1; i < luminances.length; i += 1) {
    if ((luminances[i] ?? 0) > (luminances[i - 1] ?? 0) + 0.002) {
      monotone = false
      break
    }
  }

  const deltas: number[] = []
  for (let i = 1; i < colors.length; i += 1) {
    deltas.push(neighborDelta(colors[i - 1]!, colors[i]!))
  }
  const avgDelta =
    deltas.length > 0
      ? deltas.reduce((s, d) => s + d, 0) / deltas.length
      : 0
  const minDeltaE = deltas.every((d) => d >= MIN_NEIGHBOR_DELTA_E)
  const maxGap = deltas.every(
    (d) => d <= Math.max(avgDelta * MAX_GAP_FACTOR, MAX_GAP_ABS),
  )
  let worstIndex = -1
  let worstVal = -1
  deltas.forEach((d, i) => {
    if (d > worstVal) {
      worstVal = d
      worstIndex = i
    }
  })

  const usable =
    colors.some((hex) => wcagContrast(hex, WHITE) >= 4.5) &&
    colors.some((hex) => wcagContrast(hex, BLACK) >= 4.5)

  let baseEmbedded = true
  if (baseIndex > 0 && baseIndex < colors.length - 1) {
    const d1 = neighborDelta(colors[baseIndex - 1]!, colors[baseIndex]!)
    const d2 = neighborDelta(colors[baseIndex]!, colors[baseIndex + 1]!)
    baseEmbedded =
      d1 <= BASE_EMBED_MAX_DELTA_E * 2 && d2 <= BASE_EMBED_MAX_DELTA_E * 2
  }

  const ok = monotone && minDeltaE && maxGap && usable && baseEmbedded
  let label = 'Scale even ✓'
  if (!ok) {
    if (!minDeltaE) label = 'Neighbors too similar'
    else if (!maxGap && worstIndex >= 0)
      label = `Jump between steps ${worstIndex} → ${worstIndex + 1}`
    else if (!baseEmbedded) label = 'Base stands out from neighbors'
    else if (!monotone) label = 'Lightness not monotone'
    else if (!usable) label = 'No AA text step on white/black'
    else label = 'Scale needs review'
  }

  return {
    ok,
    monotone,
    minDeltaE,
    maxGap,
    usable,
    baseEmbedded,
    label,
    deltas,
    avgDelta,
    worstIndex,
  }
}
