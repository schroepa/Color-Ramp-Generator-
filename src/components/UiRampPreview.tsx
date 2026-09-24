import {
  firstReadableOn,
  onColor,
} from '@/lib/contrast'
import { cn } from '@/lib/utils'

type UiRampPreviewProps = {
  colors: string[]
  baseIndex: number
  className?: string
}

/**
 * Live UI samples — text colors computed for contrast (review v2 A1).
 */
export function UiRampPreview({
  colors,
  baseIndex,
  className,
}: UiRampPreviewProps) {
  const base = colors[baseIndex] ?? '#888888'
  const lightest = colors[0] ?? base
  const darkest = colors[colors.length - 1] ?? base
  const lightSurface =
    colors[Math.max(0, Math.min(baseIndex, 2))] ?? lightest
  const darkSurface =
    colors[
      Math.min(colors.length - 1, Math.max(baseIndex, colors.length - 3))
    ] ?? darkest

  const lightOk = firstReadableOn(lightSurface, [...colors].reverse(), 4.5)
  const darkOk = firstReadableOn(darkSurface, colors, 4.5)
  const textOnLight = lightOk ?? onColor(lightSurface)
  const textOnDark = darkOk ?? onColor(darkSurface)
  const onPrimary = onColor(base)

  return (
    <div
      className={cn(
        className ??
          'mt-8 flex min-w-0 flex-col gap-3 border-t border-[var(--line)] pt-5',
      )}
      aria-label="UI preview"
    >
      <p className="type-caption text-[var(--text-muted)]">UI preview</p>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="type-label h-9 rounded-full px-4"
          style={{ backgroundColor: base, color: onPrimary }}
        >
          Primary button
        </button>
        <button
          type="button"
          className="type-label h-9 rounded-full border bg-transparent px-4"
          style={{ borderColor: base, color: base }}
        >
          Secondary
        </button>
        <div
          className="rounded-[var(--radius-md)] p-3"
          style={{ backgroundColor: lightSurface }}
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
