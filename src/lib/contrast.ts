import { wcagContrast } from 'culori'

const WHITE = '#ffffff'
const BLACK = '#000000'

export type WcagPair = {
  ratio: number
  mark: string
  ratioText: string
  label: string
  detail: string
}

/** WCAG 2.x relative luminance (sRGB hex). */
export function relativeLuminance(hex: string): number {
  const raw = hex.replace('#', '')
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw
  if (full.length < 6) return 0
  const channels = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!
}

/** Contrast ratio between two hex colors. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  )
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * Most readable text color on `bg` — Rule 1 from review v2.
 * Prefer ramp ends when provided (light/dark), else pure white/black.
 */
export function onColor(
  bg: string,
  light = WHITE,
  dark = BLACK,
): string {
  return contrastRatio(bg, light) >= contrastRatio(bg, dark) ? light : dark
}

/** First ramp step that reaches ≥ minRatio on the given surface, or null. */
export function firstReadableOn(
  surface: string,
  candidates: string[],
  minRatio = 4.5,
): string | null {
  for (const hex of candidates) {
    if (contrastRatio(surface, hex) >= minRatio) return hex
  }
  return null
}

/** True when swatch needs a hairline against the app chrome. */
export function needsEdgeContour(
  hex: string,
  background: string,
  threshold = 1.3,
): boolean {
  return contrastRatio(hex, background) < threshold
}

function markFor(ratio: number): string {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA18'
  return '✕'
}

function formatRatio(ratio: number): string {
  return ratio >= 10 ? ratio.toFixed(1) : ratio.toFixed(2)
}

function detailFor(surface: 'white' | 'black', ratio: number): string {
  const formatted = `${formatRatio(ratio)}:1`
  if (ratio >= 7) {
    return `${formatted} on ${surface}. WCAG 2.2 AAA for normal text.`
  }
  if (ratio >= 4.5) {
    return `${formatted} on ${surface}. WCAG 2.2 AA for normal text.`
  }
  if (ratio >= 3) {
    return `${formatted} on ${surface}. WCAG 2.2 AA for large text and UI components.`
  }
  return `${formatted} on ${surface}. Below WCAG 2.2 (3:1).`
}

function pair(hex: string, surface: 'white' | 'black', prefix: 'W' | 'B'): WcagPair {
  const ratio = wcagContrast(hex, surface === 'white' ? WHITE : BLACK)
  const mark = markFor(ratio)
  return {
    ratio,
    mark,
    ratioText: formatRatio(ratio),
    label: [prefix, formatRatio(ratio), mark].filter(Boolean).join(' '),
    detail: detailFor(surface, ratio),
  }
}

/** Contrast of `hex` against white and black, per WCAG 2.2. */
export function contrastAgainstWhiteAndBlack(hex: string): {
  onWhite: WcagPair
  onBlack: WcagPair
} {
  return {
    onWhite: pair(hex, 'white', 'W'),
    onBlack: pair(hex, 'black', 'B'),
  }
}

export { WHITE as CONTRAST_WHITE, BLACK as CONTRAST_BLACK }
