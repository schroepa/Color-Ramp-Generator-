export const RAMP_DENSITY_STORAGE_KEY = 'tintfield.ramp-density.v1'

export type RampDensity = 'compact' | 'detail'

export const RAMP_DENSITIES: {
  value: RampDensity
  label: string
  hint: string
}[] = [
  {
    value: 'compact',
    label: 'Compact',
    hint: 'Color and step only — full ramp fits the viewport',
  },
  {
    value: 'detail',
    label: 'Detail',
    hint: 'Hex and contrast under each swatch',
  },
]

export function loadRampDensity(): RampDensity {
  try {
    const raw = localStorage.getItem(RAMP_DENSITY_STORAGE_KEY)
    if (raw === 'compact' || raw === 'detail') return raw
  } catch {
    /* ignore */
  }
  return 'compact'
}

export function saveRampDensity(density: RampDensity): void {
  localStorage.setItem(RAMP_DENSITY_STORAGE_KEY, density)
}
