import { wcagContrast } from 'culori'

/** WCAG 2.2 reference surfaces. https://www.w3.org/TR/WCAG22/#contrast-minimum */
const WHITE = '#ffffff'
const BLACK = '#000000'

export type WcagPair = {
  /** Contrast ratio against this surface. */
  ratio: number
  /** Short mark: AAA, AA, Lg, or empty when below 3:1. */
  mark: string
  /** Ratio only, e.g. "5.64" or "12.6". */
  ratioText: string
  /** One-line readout, e.g. "W 5.64 AA". */
  label: string
  /** Full W3C wording for tooltips and accessible names. */
  detail: string
}

function markFor(ratio: number): string {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'Lg'
  return ''
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
