import {
  scaleToCssVars,
  scaleToStepRecord,
  stepKeysFor,
} from '@/lib/color-system'
import type { GenerationSettings } from '@/lib/generation-settings'
import type { ScaleLike } from '@/lib/palette-storage'
import { suggestScaleName } from '@/lib/scale-name'

export type SetExportFormat = 'json' | 'css' | 'tailwind' | 'dtcg' | 'scss' | 'svg'

function slugifyToken(input: string, fallback: string): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || fallback
}

function scaleDisplayName(scale: ScaleLike): string {
  const named = scale.name.trim()
  if (named) return named
  return suggestScaleName(scale.baseColor) || scale.baseColor
}

function scaleTokenName(scale: ScaleLike, index: number): string {
  return slugifyToken(scaleDisplayName(scale), `color-${index + 1}`)
}

function downloadText(filename: string, contents: string, mime: string): void {
  const blob = new Blob([contents], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function projectFileStem(name: string): string {
  return slugifyToken(name, 'untitled')
}

/** Flat Tintfield project JSON (existing format). */
export function setToProjectJson(
  name: string,
  scales: ScaleLike[],
  generation: GenerationSettings,
  projectToJson: (
    name: string,
    scales: ScaleLike[],
    generation: GenerationSettings,
  ) => string,
): string {
  return projectToJson(name, scales, generation)
}

/** CSS custom properties for every scale in the set. */
export function setToCss(
  scales: ScaleLike[],
  generation: GenerationSettings,
): string {
  if (scales.length === 0) return '/* No scales */\n'
  const blocks = scales.map((scale, index) => {
    const prefix = scaleTokenName(scale, index)
    return `/* ${scaleDisplayName(scale)} */\n:root {\n${scaleToCssVars(scale.colors, prefix, generation)}\n}`
  })
  return `${blocks.join('\n\n')}\n`
}

/**
 * Tailwind theme.extend.colors snippet (JS).
 * Keys follow the active generation preset (e.g. 50…950).
 */
export function setToTailwind(
  scales: ScaleLike[],
  generation: GenerationSettings,
): string {
  const colors: Record<string, Record<string, string>> = {}
  scales.forEach((scale, index) => {
    const name = scaleTokenName(scale, index)
    const steps = scaleToStepRecord(scale.colors, generation)
    colors[name] = Object.fromEntries(
      Object.entries(steps).map(([key, hex]) => [key, hex.toUpperCase()]),
    )
  })
  const body = JSON.stringify(colors, null, 2)
    .split('\n')
    .map((line, i) => (i === 0 ? line : `    ${line}`))
    .join('\n')
  return `/** Tintfield → paste into theme.extend.colors */\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: ${body},\n    },\n  },\n}\n`
}

/**
 * W3C Design Tokens (DTCG) — importable by Tokens Studio / Figma Variables pipelines.
 */
export function setToDtcg(
  scales: ScaleLike[],
  generation: GenerationSettings,
): string {
  const color: Record<
    string,
    Record<string, { $type: 'color'; $value: string }>
  > = {}
  scales.forEach((scale, index) => {
    const name = scaleTokenName(scale, index)
    const keys = stepKeysFor(generation)
    const group: Record<string, { $type: 'color'; $value: string }> = {}
    keys.forEach((key, i) => {
      group[key] = {
        $type: 'color',
        $value: (scale.colors[i] ?? '#000000').toUpperCase(),
      }
    })
    color[name] = group
  })
  return `${JSON.stringify({ color }, null, 2)}\n`
}

/** SCSS map variables per scale. */
export function setToScss(
  scales: ScaleLike[],
  generation: GenerationSettings,
): string {
  if (scales.length === 0) return '// No scales\n'
  const blocks = scales.map((scale, index) => {
    const name = scaleTokenName(scale, index)
    const steps = scaleToStepRecord(scale.colors, generation)
    const entries = Object.entries(steps)
      .map(([key, hex]) => `  '${key}': ${hex.toUpperCase()},`)
      .join('\n')
    return `$${name}: (\n${entries}\n);`
  })
  return `// Tintfield SCSS color maps\n\n${blocks.join('\n\n')}\n`
}

/** SVG palette strip — one row per scale. */
export function setToSvg(
  scales: ScaleLike[],
  generation: GenerationSettings,
): string {
  const swatch = 40
  const gap = 0
  const rowGap = 12
  const labelH = 18
  const maxSteps = Math.max(1, ...scales.map((s) => s.colors.length))
  const width = maxSteps * swatch
  const height =
    scales.length * (swatch + labelH + rowGap) - rowGap + (scales.length > 0 ? 0 : swatch)

  const rows = scales
    .map((scale, row) => {
      const y = row * (swatch + labelH + rowGap)
      const label = escapeXml(scaleDisplayName(scale))
      const keys = stepKeysFor(generation)
      const rects = scale.colors
        .map((hex, i) => {
          const x = i * (swatch + gap)
          const step = keys[i] ?? String(i)
          return `    <rect x="${x}" y="${y + labelH}" width="${swatch}" height="${swatch}" fill="${hex.toUpperCase()}"><title>${escapeXml(step)} · ${hex.toUpperCase()}</title></rect>`
        })
        .join('\n')
      return `  <text x="0" y="${y + 12}" font-family="system-ui,sans-serif" font-size="12" fill="#888">${label}</text>\n${rects}`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${Math.max(swatch, height)}" viewBox="0 0 ${width} ${Math.max(swatch, height)}">\n${rows}\n</svg>\n`
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function copySetExport(payload: string): Promise<void> {
  return navigator.clipboard.writeText(payload)
}

export function downloadSetExport(
  format: SetExportFormat,
  setName: string,
  payload: string,
): void {
  const stem = projectFileStem(setName)
  switch (format) {
    case 'json':
      downloadText(`tintfield-${stem}.json`, payload, 'application/json')
      break
    case 'css':
      downloadText(`tintfield-${stem}.css`, payload, 'text/css')
      break
    case 'scss':
      downloadText(`tintfield-${stem}.scss`, payload, 'text/x-scss')
      break
    case 'tailwind':
      downloadText(`tintfield-${stem}.tailwind.js`, payload, 'text/javascript')
      break
    case 'dtcg':
      downloadText(`tintfield-${stem}.tokens.json`, payload, 'application/json')
      break
    case 'svg':
      downloadText(`tintfield-${stem}.svg`, payload, 'image/svg+xml')
      break
  }
}
