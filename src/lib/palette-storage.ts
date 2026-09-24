import {
  type ColorSystem,
  generateScaleColors,
  normalizeHex,
  scaleToStepRecord,
} from '@/lib/color-system'
import {
  DEFAULT_GENERATION_SETTINGS,
  type GenerationSettings,
} from '@/lib/generation-settings'

export const PALETTE_STORAGE_KEY = 'tintfield.palettes.v1'

const VALID_SYSTEMS = new Set<ColorSystem>(['saturated', 'fade', 'pale'])

export type PersistedPalette = {
  id: string
  /** User-facing scale name. Empty until named. */
  name?: string
  baseColor: string
  system: ColorSystem
}

export type PaletteExport = PersistedPalette & {
  steps: Record<string, string>
}

export type ScaleLike = PersistedPalette & {
  name: string
  colors: string[]
}

type StoredPayload = {
  version: 1
  scales: PersistedPalette[]
}

function isPersistedPalette(value: unknown): value is PersistedPalette {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.baseColor === 'string' &&
    typeof item.system === 'string' &&
    VALID_SYSTEMS.has(item.system as ColorSystem)
  )
}

export function hydrateScale(
  palette: PersistedPalette,
  settings: GenerationSettings = DEFAULT_GENERATION_SETTINGS,
): ScaleLike {
  const baseColor = normalizeHex(palette.baseColor) ?? '#0d7377'
  const system = VALID_SYSTEMS.has(palette.system) ? palette.system : 'saturated'
  return {
    id: palette.id,
    name: typeof palette.name === 'string' ? palette.name : '',
    baseColor,
    system,
    colors: generateScaleColors(baseColor, system, settings),
  }
}

/** Load persisted palettes. Returns null when nothing valid is stored. */
export function loadScales(
  settings: GenerationSettings = DEFAULT_GENERATION_SETTINGS,
): ScaleLike[] | null {
  try {
    const raw = localStorage.getItem(PALETTE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null

    const payload = parsed as Partial<StoredPayload>
    if (payload.version !== 1 || !Array.isArray(payload.scales)) return null

    const scales = payload.scales
      .filter(isPersistedPalette)
      .map((palette) => hydrateScale(palette, settings))
    return scales.length > 0 ? scales : null
  } catch {
    return null
  }
}

/** Persist palette identity only — colors are regenerated on load. */
export function saveScales(scales: PersistedPalette[]): void {
  const payload: StoredPayload = {
    version: 1,
    scales: scales.map(({ id, name, baseColor, system }) => ({
      id,
      name: name ?? '',
      baseColor,
      system,
    })),
  }
  localStorage.setItem(PALETTE_STORAGE_KEY, JSON.stringify(payload))
}

export function toPaletteExport(
  scale: ScaleLike,
  settings: GenerationSettings = DEFAULT_GENERATION_SETTINGS,
): PaletteExport {
  return {
    id: scale.id,
    name: scale.name ?? '',
    baseColor: scale.baseColor,
    system: scale.system,
    steps: scaleToStepRecord(scale.colors, settings),
  }
}

export function palettesToJson(
  scales: ScaleLike[],
  settings: GenerationSettings = DEFAULT_GENERATION_SETTINGS,
): string {
  return JSON.stringify(
    scales.map((scale) => toPaletteExport(scale, settings)),
    null,
    2,
  )
}

/** Trigger a real .json file download of the current palettes. */
export function downloadPalettesJson(
  scales: ScaleLike[],
  filename = 'tintfield-palettes.json',
  settings: GenerationSettings = DEFAULT_GENERATION_SETTINGS,
): void {
  const blob = new Blob([palettesToJson(scales, settings)], {
    type: 'application/json;charset=utf-8',
  })
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
