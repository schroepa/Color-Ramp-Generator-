import {
  clampChroma,
  converter,
  differenceEuclidean,
  formatHex,
  parse,
  wcagContrast,
  type Oklch,
} from 'culori'
import type {
  CheckResult,
  ChromaMode,
  GenerateInput,
  GenerateResult,
  GenerateStep,
  Preset,
  StepRef,
} from '@/lib/presets/types'
import { onColor } from '@/lib/contrast'

const toOklch = converter('oklch')
const toLab = converter('lab')
const WHITE = '#ffffff'
const BLACK = '#000000'
const deltaE = differenceEuclidean('oklab')

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

function normalizeHue(h: number): number {
  const wrapped = h % 360
  return wrapped < 0 ? wrapped + 360 : wrapped
}

function chromaShape(L: number, mode: ChromaMode): number {
  const peak = 0.58
  const width = mode === 'fade' ? 0.18 : mode === 'pale' ? 0.32 : 0.26
  const height = mode === 'pale' ? 0.5 : mode === 'fade' ? 0.85 : 1
  const x = (L - peak) / width
  return height * Math.exp(-(x * x))
}

function hueShiftFor(mode: ChromaMode, enabled: boolean) {
  if (!enabled) return { light: 0, dark: 0 }
  if (mode === 'fade') return { light: -5, dark: 7 }
  if (mode === 'pale') return { light: -4, dark: 6 }
  return { light: -8, dark: 12 }
}

export function warpLadderAroundBase(
  targets: number[],
  k: number,
  cBase: number,
  metric: Preset['ladder']['metric'],
): { warped: number[]; warpFactor: number } {
  const tK = targets[k]
  if (tK == null || tK <= 0 || cBase <= 0) {
    return { warped: [...targets], warpFactor: 1 }
  }
  if (metric === 'lstar' || metric === 'oklch-l') {
    // Linear warp in L space
    const shift = cBase - tK
    const last = targets.length - 1
    const warped = targets.map((ti, i) => {
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
      return ti + shift * w
    })
    const factor = tK === 0 ? 1 : Math.abs(cBase / tK)
    return { warped, warpFactor: factor }
  }
  const shift = Math.log(cBase / tK)
  const last = targets.length - 1
  const warped = targets.map((ti, i) => {
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
  return { warped, warpFactor: Math.exp(Math.abs(shift)) }
}

export function nearestLadderIndex(
  targets: number[],
  value: number,
  metric: Preset['ladder']['metric'],
): number {
  let best = 0
  let bestDist = Infinity
  targets.forEach((t, i) => {
    const d =
      metric === 'contrast-white'
        ? Math.abs(Math.log(Math.max(t, 1.01)) - Math.log(Math.max(value, 1.01)))
        : Math.abs(t - value)
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  })
  return best
}

function lightnessForContrast(
  targetContrast: number,
  c: number,
  h: number,
): number {
  let a = 0.02
  let b = 0.99
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
    if (ratio > targetContrast) a = mid
    else b = mid
  }
  return (a + b) / 2
}

/** Bisection on CIELAB L* at fixed OKLCH hue/chroma seed. */
function lightnessForLstar(targetLstar: number, c: number, h: number): number {
  let a = 0.02
  let b = 0.99
  for (let i = 0; i < 20; i += 1) {
    const mid = (a + b) / 2
    const sample: Oklch = {
      mode: 'oklch',
      l: mid,
      c: Math.max(0, c),
      h: normalizeHue(h),
    }
    const clamped = clampChroma(sample, 'oklch', 'rgb')
    const lab = toLab(clamped)
    const L = lab?.l ?? mid * 100
    if (L > targetLstar) b = mid
    else a = mid
  }
  return (a + b) / 2
}

function resolveHex(ref: StepRef, byId: Map<string, string>): string {
  if ('fixed' in ref) return ref.fixed === 'white' ? WHITE : BLACK
  return byId.get(ref.step) ?? BLACK
}

function runRoleChecks(
  preset: Preset,
  byId: Map<string, string>,
): CheckResult[] {
  const results: CheckResult[] = []
  for (const role of preset.roles) {
    for (const check of role.checks) {
      let fg = resolveHex(check.fg, byId)
      let bg = resolveHex(check.bg, byId)
      // Solid-on-9: use better of white/black when fg is fixed white — special case
      if (
        'fixed' in check.fg &&
        check.fg.fixed === 'white' &&
        'step' in check.bg
      ) {
        const solid = resolveHex(check.bg, byId)
        fg = onColor(solid)
        bg = solid
      }
      const ratio = wcagContrast(fg, bg)
      const ok = ratio >= check.min
      results.push({
        id: `${role.id}-${check.min}`,
        roleId: role.id,
        level: check.level,
        ok,
        message: ok
          ? `${role.label}: ${ratio.toFixed(2)}:1 (≥ ${check.min})`
          : `${role.label}: ${ratio.toFixed(2)}:1, needs ${check.min}:1`,
        recommendation: ok
          ? undefined
          : 'Try Fade chroma or move the base step',
      })
    }
  }
  return results
}

function ladderTargets(preset: Preset, theme: 'light' | 'dark'): number[] {
  if (
    theme === 'dark' &&
    preset.dark.mode === 'separate-ladder'
  ) {
    return [...preset.dark.targets]
  }
  return [...preset.ladder.targets]
}

/**
 * Preset-driven ramp generation (§5).
 */
export function generateFromPreset(input: GenerateInput): GenerateResult {
  const { baseHex, preset, chromaMode, baseOverride, theme } = input
  const count = preset.steps.length
  const metric = preset.ladder.metric
  const parsed = parse(baseHex)

  if (!parsed || count === 0) {
    return {
      steps: [],
      baseStepId: null,
      baseDeltaE: 0,
      warpFactor: 1,
      checks: [],
    }
  }

  const lockedHex = formatHex(parsed) ?? baseHex
  const oklch = toOklch(parsed)!
  const baseL = clamp01(oklch.l)
  const baseC = Math.max(0, oklch.c ?? 0)
  const baseH = oklch.h ?? 0
  const labBase = toLab(parsed)
  const baseLstar = labBase?.l ?? baseL * 100
  const cBaseContrast = Math.max(wcagContrast(lockedHex, WHITE), 1.02)

  let targets = ladderTargets(preset, theme)
  if (targets.length !== count) {
    targets = densifyTo(targets, count)
  }

  const measure =
    metric === 'lstar'
      ? baseLstar
      : metric === 'oklch-l'
        ? baseL
        : cBaseContrast

  const autoIndex = nearestLadderIndex(targets, measure, metric)
  const autoStepId = preset.steps[autoIndex]?.id ?? null

  let baseIndex: number | null = null
  let lockExact = true

  if (preset.baseRule.mode === 'none') {
    baseIndex = null
    lockExact = false
  } else if (baseOverride) {
    const idx = preset.steps.findIndex((s) => s.id === baseOverride)
    baseIndex = idx >= 0 ? idx : autoIndex
  } else if (preset.baseRule.mode === 'fixed') {
    const fixedId = preset.baseRule.stepId
    const idx = preset.steps.findIndex((s) => s.id === fixedId)
    baseIndex = idx >= 0 ? idx : autoIndex
  } else {
    baseIndex = autoIndex
  }

  let warped = targets
  let warpFactor = 1
  if (
    baseIndex != null &&
    metric !== 'lstar' &&
    preset.baseRule.mode !== 'none'
  ) {
    const result = warpLadderAroundBase(
      targets,
      baseIndex,
      measure,
      metric,
    )
    warped = result.warped
    warpFactor = result.warpFactor
  }

  const shifts = hueShiftFor(chromaMode, preset.chroma.hueShift)
  const shapeBase = Math.max(chromaShape(baseL, chromaMode), 1e-6)
  const anchorIndex = baseIndex ?? autoIndex

  const colors: string[] = Array.from({ length: count }, (_, index) => {
    if (index === baseIndex && lockExact) return lockedHex

    const target = warped[index] ?? measure
    const t =
      index < anchorIndex
        ? (anchorIndex - index) / Math.max(anchorIndex, 1)
        : (index - anchorIndex) / Math.max(count - 1 - anchorIndex, 1)
    const hue =
      index < anchorIndex
        ? baseH + shifts.light * t
        : baseH + shifts.dark * t

    let L: number
    if (metric === 'lstar') {
      L = lightnessForLstar(target, baseC, hue)
    } else if (metric === 'oklch-l') {
      L = clamp01(target)
    } else {
      L = lightnessForContrast(target, baseC, hue)
    }
    const cCurve = baseC * (chromaShape(L, chromaMode) / shapeBase)
    if (metric === 'contrast-white') {
      L = lightnessForContrast(target, cCurve, hue)
    } else if (metric === 'lstar') {
      L = lightnessForLstar(target, cCurve, hue)
    }

    const sample: Oklch = {
      mode: 'oklch',
      l: clamp01(L),
      c: Math.max(0, cCurve),
      h: normalizeHue(hue),
    }
    return formatHex(clampChroma(sample, 'oklch', 'rgb')) ?? '#000000'
  })

  const steps: GenerateStep[] = colors.map((hex, i) => {
    const o = toOklch(parse(hex) ?? hex)
    return {
      stepId: preset.steps[i]!.id,
      hex,
      oklch: [o?.l ?? 0, o?.c ?? 0, o?.h ?? 0],
      isBase: i === baseIndex,
    }
  })

  let baseDeltaE = 0
  if (baseIndex == null) {
    const nearest = colors[autoIndex]!
    baseDeltaE = deltaE(lockedHex, nearest) ?? 0
  }

  const byId = new Map(steps.map((s) => [s.stepId, s.hex]))
  const checks = runRoleChecks(preset, byId)

  let suggestedBaseStepId: string | undefined
  if (
    preset.baseRule.mode === 'fixed' &&
    warpFactor > preset.baseRule.maxWarp &&
    autoStepId
  ) {
    suggestedBaseStepId = autoStepId
    checks.push({
      id: 'warp-limit',
      level: 'warning',
      ok: false,
      message: `Your color is extreme for step ${preset.baseRule.stepId}. The scale may look uneven.`,
      recommendation: `Set base to step ${autoStepId}`,
      applyRecommendation: { baseOverride: autoStepId },
    })
  }

  // Solid contrast token: ensure warning uses onColor
  if (preset.id === 'radix' && byId.has('9')) {
    const solid = byId.get('9')!
    const ink = onColor(solid)
    byId.set('contrast', ink)
  }

  return {
    steps,
    baseStepId: baseIndex != null ? preset.steps[baseIndex]?.id ?? null : null,
    baseDeltaE,
    warpFactor,
    checks,
    suggestedBaseStepId,
  }
}

function densifyTo(ref: number[], count: number): number[] {
  if (count <= 1) return [ref[0] ?? 1]
  if (count === ref.length) return [...ref]
  const out: number[] = []
  const last = ref.length - 1
  for (let i = 0; i < count; i += 1) {
    const t = i / (count - 1)
    const pos = t * last
    const lo = Math.floor(pos)
    const hi = Math.min(last, lo + 1)
    const f = pos - lo
    const a = ref[lo]!
    const b = ref[hi]!
    // geometric for contrast-like positive values
    if (a > 0 && b > 0) out.push(Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * f))
    else out.push(a + (b - a) * f)
  }
  return out
}

/** Memo cache for hot paths. */
const cache = new Map<string, GenerateResult>()

export function generateFromPresetCached(input: GenerateInput): GenerateResult {
  const key = JSON.stringify({
    h: input.baseHex,
    p: input.preset.id,
    v: input.preset.version,
    c: input.chromaMode,
    o: input.baseOverride,
    t: input.theme,
    e: input.endpoints,
  })
  const hit = cache.get(key)
  if (hit) return hit
  const result = generateFromPreset(input)
  if (cache.size > 200) cache.clear()
  cache.set(key, result)
  return result
}
