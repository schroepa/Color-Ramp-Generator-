export const RAMP_SURFACE_STORAGE_KEY = 'tintfield.ramp-surface.v1'

export type RampSurface = 'dark' | 'neutral' | 'light'

export const RAMP_SURFACES: {
  value: RampSurface
  label: string
  /** Background behind ramps for judgment. */
  css: string
  ink: string
}[] = [
  { value: 'dark', label: 'Dark', css: '#121212', ink: '#ffffff' },
  { value: 'neutral', label: 'Neutral', css: '#8a8a8a', ink: '#111111' },
  { value: 'light', label: 'Light', css: '#f2f2f2', ink: '#111111' },
]

export function loadRampSurface(): RampSurface {
  try {
    const raw = localStorage.getItem(RAMP_SURFACE_STORAGE_KEY)
    if (raw === 'dark' || raw === 'neutral' || raw === 'light') return raw
  } catch {
    /* ignore */
  }
  return 'dark'
}

export function saveRampSurface(surface: RampSurface): void {
  localStorage.setItem(RAMP_SURFACE_STORAGE_KEY, surface)
}

export function rampSurfaceMeta(surface: RampSurface) {
  return RAMP_SURFACES.find((item) => item.value === surface) ?? RAMP_SURFACES[0]!
}
