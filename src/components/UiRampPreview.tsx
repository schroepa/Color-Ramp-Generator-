import {
  firstReadableOn,
  onColor,
} from '@/lib/contrast'
import type { Preset } from '@/lib/presets/types'
import { cn } from '@/lib/utils'

type UiRampPreviewProps = {
  colors: string[]
  baseIndex: number
  className?: string
  preset?: Preset | null
  darkColors?: string[]
}

function stepById(colors: string[], preset: Preset | null | undefined, id: string) {
  if (!preset) return null
  const idx = preset.steps.findIndex((s) => s.id === id)
  return idx >= 0 ? colors[idx] ?? null : null
}

/**
 * Live UI samples — roles when preset has them (§6.7).
 */
export function UiRampPreview({
  colors,
  baseIndex,
  className,
  preset,
  darkColors,
}: UiRampPreviewProps) {
  const hasRoles = Boolean(preset && preset.roles.length > 0)
  const isRadix = preset?.id === 'radix'

  let primary: string
  let onPrimary: string
  let lightSurface: string
  let darkSurface: string
  let textOnLight: string
  let textOnDark: string
  let border: string | null = null
  let lightOk = true
  let darkOk = true

  if (isRadix && preset) {
    primary = stepById(colors, preset, '9') ?? colors[baseIndex] ?? '#888'
    onPrimary = onColor(primary)
    lightSurface = stepById(colors, preset, '2') ?? colors[0] ?? primary
    textOnLight = stepById(colors, preset, '12') ?? onColor(lightSurface)
    border = stepById(colors, preset, '6')
    const darkSrc = darkColors ?? colors
    darkSurface = stepById(darkSrc, preset, '2') ?? darkSrc[darkSrc.length - 1] ?? primary
    textOnDark = stepById(darkSrc, preset, '12') ?? onColor(darkSurface)
    lightOk = true
    darkOk = true
  } else {
    const base = colors[baseIndex] ?? '#888888'
    const lightest = colors[0] ?? base
    const darkest = colors[colors.length - 1] ?? base
    primary = base
    onPrimary = onColor(base)
    lightSurface = colors[Math.max(0, Math.min(baseIndex, 2))] ?? lightest
    darkSurface =
      colors[
        Math.min(colors.length - 1, Math.max(baseIndex, colors.length - 3))
      ] ?? darkest
    const lo = firstReadableOn(lightSurface, [...colors].reverse(), 4.5)
    const doOk = firstReadableOn(darkSurface, colors, 4.5)
    lightOk = Boolean(lo)
    darkOk = Boolean(doOk)
    textOnLight = lo ?? onColor(lightSurface)
    textOnDark = doOk ?? onColor(darkSurface)
  }

  return (
    <div
      className={cn(
        className ??
          'mt-8 flex min-w-0 flex-col gap-3 border-t border-[var(--line)] pt-5',
      )}
      aria-label="UI preview"
    >
      <p className="type-caption text-[var(--text-muted)]">
        UI preview{hasRoles ? ' · roles' : ''}
      </p>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="type-label h-9 rounded-full px-4"
          style={{ backgroundColor: primary, color: onPrimary }}
        >
          Primary button
        </button>
        <button
          type="button"
          className="type-label h-9 rounded-full border bg-transparent px-4"
          style={{
            borderColor: border ?? primary,
            color: primary,
          }}
        >
          Secondary
        </button>
        <div
          className="rounded-[var(--radius-md)] p-3"
          style={{
            backgroundColor: lightSurface,
            boxShadow: border
              ? `inset 0 0 0 1px ${border}`
              : undefined,
          }}
        >
          {lightOk ? (
            <p className="type-body-sm" style={{ color: textOnLight }}>
              Text on light surface
            </p>
          ) : (
            <p className="type-caption" style={{ color: onColor(lightSurface) }}>
              No AA text color in this ramp for this surface
            </p>
          )}
        </div>
        <div
          className="rounded-[var(--radius-md)] p-3"
          style={{ backgroundColor: darkSurface }}
        >
          {darkOk ? (
            <p className="type-body-sm" style={{ color: textOnDark }}>
              Text on dark surface
            </p>
          ) : (
            <p className="type-caption" style={{ color: onColor(darkSurface) }}>
              No AA text color in this ramp for this surface
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
