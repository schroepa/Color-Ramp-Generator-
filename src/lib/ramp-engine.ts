import {
  clampChroma,
  converter,
  formatHex,
  parse,
  wcagContrast,
  type Oklch,
} from 'culori'
import type { ColorSystem } from '@/lib/color-system'
import type { GenerationSettings } from '@/lib/generation-settings'
import { matchGenerationPreset, totalSteps } from '@/lib/generation-settings'

const toOklch = converter('oklch')
const WHITE = '#ffffff'

/**
 * Reference contrast-against-white ladder (Tailwind-ish, 11 stops).
 * Densified logarithmically for other step counts.
 */
const TAILWIND_CONTRAST_LADDER = [
  1.05, 1.15, 1.35, 1.7, 2.4, 3.3, 4.6, 6.5, 9, 12.5, 16,
]

const MATERIAL_CONTRAST_LADDER = [
  1.05, 1.2, 1.45, 1.9, 2.8, 3.8, 5.2, 7.5, 11, 15,
]

const COMPACT_CONTRAST_LADDER = [1.15, 1.9, 3.5, 6.5, 12]

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

function normalizeHue(h: number): number {
  const wrapped = h % 360
  return wrapped < 0 ? wrapped + 360 : wrapped
}

/** Log-interpolate a reference ladder to `count` stops. */
export function densifyLadder(reference: number[], count: number): number[] {
  if (count <= 1) return [reference[0] ?? 1.05]
  if (count === reference.length) return [...reference]
  const out: number[] = []
  const last = reference.length - 1
  for (let i = 0; i < count; i += 1) {
    const t = i / (count - 1)
    const pos = t * last
    const lo = Math.floor(pos)
    const hi = Math.min(last, lo + 1)
    const f = pos - lo
    const a = Math.log(reference[lo]!)
    const b = Math.log(reference[hi]!)
    out.push(Math.exp(a + (b - a) * f))
  }
  return out
}

function ladderForSettings(settings: GenerationSettings): number[] {
  const count = totalSteps(settings)
  const preset = matchGenerationPreset(settings)
  switch (preset) {
    case 'material':
      return densifyLadder(MATERIAL_CONTRAST_LADDER, count)
    case 'compact':
      return densifyLadder(COMPACT_CONTRAST_LADDER, count)
    case 'tailwind':
    case 'tailwind-dense':
    default:
      return densifyLadder(TAILWIND_CONTRAST_LADDER, count)
  }
}

/** Warp ladder so index `k` matches `cBase` exactly; ends stay fixed. */
export function warpLadderAroundBase(
  targets: number[],
  k: number,
  cBase: number,
): number[] {
  const tK = targets[k]
  if (tK == null || tK <= 0 || cBase <= 0) return [...targets]
  const shift = Math.log(cBase / tK)
  const last = targets.length - 1
  return targets.map((ti, i) => {
    if (last === 0) return cBase
    const w =
      i === k
        ? 1
        : i < k
          ? k === 0
            ? 0
            : i / k
          : last === k
            ? 0
            : (last - i) / (last - k)
    return ti * Math.exp(shift * w)
  })
}

/** Pick ladder index whose log-contrast is nearest to the base. */
export function nearestLadderIndex(targets: number[], cBase: number): number {
  let best = 0
  let bestDist = Infinity
  const logBase = Math.log(Math.max(cBase, 1.01))
  targets.forEach((t, i) => {
    const d = Math.abs(Math.log(t) - logBase)
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  })
  return best
}

/** Chroma bell over lightness — modes reshape width / height. */
function chromaShape(L: number, system: ColorSystem): number {
  const peak = 0.58
  const width =
    system === 'fade' ? 0.18 : system === 'pale' ? 0.32 : 0.26
  const height = system === 'pale' ? 0.5 : system === 'fade' ? 0.85 : 1
  const x = (L - peak) / width
  return height * Math.exp(-(x * x))
}

function hueShiftFor(
  system: ColorSystem,
): { light: number; dark: number } {
  if (system === 'fade') return { light: -5, dark: 7 }
  if (system === 'pale') return { light: -4, dark: 6 }
  return { light: -8, dark: 12 }
}

/**
 * Bisection: find OKLCH L such that contrast(color, white) ≈ target,
 * at given chroma/hue (chroma re-clamped each step).
 */
function lightnessForContrast(
  targetContrast: number,
  c: number,
  h: number,
  lo = 0.02,
  hi = 0.99,
): number {
  let a = lo
  let b = hi
  for (let i = 0; i < 18; i += 1) {
    const mid = (a + b) / 2
    const sample: Oklch = {
      mode: 'oklch',
      l: mid,
      c: Math.max(0, c),
      h: normalizeHue(h),
    }
    const hex = formatHex(clampChroma(sample, 'oklch', 'rgb'))
    if (!hex) {
      b = mid
      continue
    }
    const ratio = wcagContrast(hex, WHITE)
    // Higher L → lower contrast on white
    if (ratio > targetContrast) a = mid
    else b = mid
  }
  return (a + b) / 2
}

export type RampEngineResult = {
  colors: string[]
  baseIndex: number
  /** Target contrasts after warp (debug / UI). */
  contrasts: number[]
}

export type RampEngineOptions = {
  /** Lock base hex exactly at its resolved index (default true). */
  lockBaseExact?: boolean
  /** Force base index; skip auto placement. */
  baseIndexOverride?: number | null
}

/**
 * Contrast-ladder ramp engine (review v2 · Teil B).
 * - Fixed WCAG-contrast targets densified to step count
 * - Base placed at nearest step (or override)
 * - Ladder warped so base contrast is exact
 * - Chroma curve passes through base
 * - Gamut via clampChroma (no channel clip)
 */
export function generateRamp(
  baseHex: string,
  system: ColorSystem,
  settings: GenerationSettings,
  options: RampEngineOptions = {},
): RampEngineResult {
  const count = totalSteps(settings)
  const lockBaseExact = options.lockBaseExact !== false
  const parsed = parse(baseHex)
  if (!parsed) {
    return {
      colors: Array.from({ length: count }, () => '#000000'),
      baseIndex: Math.floor(count / 2),
      contrasts: [],
    }
  }

  const oklch = toOklch(parsed)
  if (!oklch) {
    return {
      colors: Array.from({ length: count }, () => '#000000'),
      baseIndex: Math.floor(count / 2),
      contrasts: [],
    }
  }

  const lockedHex = formatHex(parsed) ?? baseHex
  const baseL = clamp01(oklch.l)
  const baseC = Math.max(0, oklch.c ?? 0)
  const baseH = oklch.h ?? 0
  const cBase = Math.max(wcagContrast(lockedHex, WHITE), 1.02)

  const targets = ladderForSettings(settings)
  // Soften lightest default: never below ~1.08 when settings ask for very high L ends
  if (targets[0] != null && targets[0] < 1.08) targets[0] = 1.08

  let baseIndex =
    options.baseIndexOverride != null &&
    options.baseIndexOverride >= 0 &&
    options.baseIndexOverride < count
      ? options.baseIndexOverride
      : nearestLadderIndex(targets, cBase)

  // Keep at least one step on each side when possible
  if (count >= 3) {
    baseIndex = Math.min(count - 2, Math.max(1, baseIndex))
  }

  const warped = warpLadderAroundBase(targets, baseIndex, cBase)
  const shifts = hueShiftFor(system)
  const shapeBase = Math.max(chromaShape(baseL, system), 1e-6)

  const colors = Array.from({ length: count }, (_, index) => {
    if (index === baseIndex && lockBaseExact) return lockedHex

    const target = warped[index] ?? cBase
    const t =
      index < baseIndex
        ? (baseIndex - index) / Math.max(baseIndex, 1)
        : (index - baseIndex) / Math.max(count - 1 - baseIndex, 1)
    const hue =
      index < baseIndex
        ? baseH + shifts.light * t
        : baseH + shifts.dark * t

    // Seed L from contrast, then set chroma from curve at that L
    let L = lightnessForContrast(target, baseC, hue)
    const cCurve = baseC * (chromaShape(L, system) / shapeBase)
    L = lightnessForContrast(target, cCurve, hue)

    const sample: Oklch = {
      mode: 'oklch',
      l: clamp01(L),
      c: Math.max(0, cCurve),
      h: normalizeHue(hue),
    }
    return formatHex(clampChroma(sample, 'oklch', 'rgb')) ?? '#000000'
  })

  return { colors, baseIndex, contrasts: warped }
}

/** Resolve where the base swatch sits for a given hex + settings. */
export function resolveBaseIndex(
  baseHex: string,
  settings: GenerationSettings,
  override?: number | null,
): number {
  if (override != null && override >= 0) return override
  const count = totalSteps(settings)
  const parsed = parse(baseHex)
  if (!parsed) return Math.floor(count / 2)
  const hex = formatHex(parsed) ?? baseHex
  const cBase = Math.max(wcagContrast(hex, WHITE), 1.02)
  const targets = ladderForSettings(settings)
  let idx = nearestLadderIndex(targets, cBase)
  if (count >= 3) idx = Math.min(count - 2, Math.max(1, idx))
  return idx
}

export type RampQuality = {
  ok: boolean
  monotone: boolean
  minDeltaE: boolean
  maxGap: boolean
  usable: boolean
  baseEmbedded: boolean
  label: string
}

/** Quick post-generation quality gate (review v2 · B3). */
export function assessRampQuality(
  colors: string[],
  baseIndex: number,
): RampQuality {
  const BLACK = '#000000'
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
    const a = toOklch(parse(colors[i - 1]!) ?? colors[i - 1]!)
    const b = toOklch(parse(colors[i]!) ?? colors[i]!)
    if (!a || !b) continue
    const dL = (a.l ?? 0) - (b.l ?? 0)
    const dC = (a.c ?? 0) - (b.c ?? 0)
    const dH = ((a.h ?? 0) - (b.h ?? 0)) * 0.01
    deltas.push(Math.sqrt(dL * dL + dC * dC + dH * dH))
  }
  const avg =
    deltas.length > 0
      ? deltas.reduce((s, d) => s + d, 0) / deltas.length
      : 0
  const minDeltaE = deltas.every((d) => d >= 0.015)
  const maxGap = deltas.every((d) => d <= Math.max(avg * 2.5, 0.08))

  const usable =
    colors.some((hex) => wcagContrast(hex, WHITE) >= 4.5) &&
    colors.some((hex) => wcagContrast(hex, BLACK) >= 4.5)

  let baseEmbedded = true
  if (baseIndex > 0 && baseIndex < colors.length - 1) {
    const a = toOklch(parse(colors[baseIndex - 1]!) ?? '')
    const b = toOklch(parse(colors[baseIndex]!) ?? '')
    const c = toOklch(parse(colors[baseIndex + 1]!) ?? '')
    if (a && b && c) {
      const d1 = Math.abs((a.l ?? 0) - (b.l ?? 0))
      const d2 = Math.abs((b.l ?? 0) - (c.l ?? 0))
      baseEmbedded = Math.max(d1, d2) < 0.22
    }
  }

  const ok = monotone && minDeltaE && maxGap && usable && baseEmbedded
  return {
    ok,
    monotone,
    minDeltaE,
    maxGap,
    usable,
    baseEmbedded,
    label: ok ? 'Scale even ✓' : 'Scale needs review',
  }
}
