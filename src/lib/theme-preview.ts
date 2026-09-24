import { converter } from 'culori'

const toOklch = converter('oklch')

/** Role → position on the ramp. 0 is the lightest step, 1 the darkest. */
const ROLE_STOPS: { token: string; t: number }[] = [
  { token: '--color-text', t: 0 },
  { token: '--color-primary', t: 0.04 },
  { token: '--color-ink-soft', t: 0.1 },
  { token: '--color-text-muted', t: 0.22 },
  { token: '--color-text-faint', t: 0.4 },
  { token: '--color-pill', t: 0.75 },
  { token: '--color-card', t: 0.86 },
  { token: '--color-stage', t: 0.93 },
  { token: '--color-bg', t: 1 },
  { token: '--color-primary-ink', t: 1 },
]

const APPLIED = ROLE_STOPS.map((stop) => stop.token).concat('--color-accent')

function stepAt(colors: string[], t: number) {
  if (colors.length === 0) return '#000000'
  const index = Math.round(Math.min(1, Math.max(0, t)) * (colors.length - 1))
  return colors[index] ?? colors[colors.length - 1]
}

/** Map a generated ramp onto the app's color tokens. */
export function applyThemePreview(colors: string[], baseIndex: number) {
  const root = document.documentElement
  for (const stop of ROLE_STOPS) {
    root.style.setProperty(stop.token, stepAt(colors, stop.t))
  }
  const base = colors[baseIndex] ?? colors[Math.floor(colors.length / 2)]
  if (base) root.style.setProperty('--color-accent', base)

  const bg = stepAt(colors, 1)
  const lightness = toOklch(bg)?.l ?? 0
  root.style.colorScheme = lightness > 0.55 ? 'light' : 'dark'
}

export function clearThemePreview() {
  const root = document.documentElement
  for (const token of APPLIED) root.style.removeProperty(token)
  root.style.colorScheme = ''
}
