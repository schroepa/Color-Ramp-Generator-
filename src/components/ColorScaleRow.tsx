import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import {
  contrastAgainstWhiteAndBlack,
  needsEdgeContour,
  onColor,
} from '@/lib/contrast'
import type { RampDensity } from '@/lib/ramp-density'
import { cn } from '@/lib/utils'

type ContrastChipProps = {
  /** Swatch color — probe "Aa" is painted in white or black on this fill. */
  fill: string
  surface: 'white' | 'black'
  mark: string
  ratioText: string
  detail: string
}

/**
 * Probe (Aa on swatch) + judgment (mark on neutral chrome) — review v2 A1.
 */
function ContrastChip({
  fill,
  surface,
  mark,
  ratioText,
  detail,
}: ContrastChipProps) {
  const probeInk = surface === 'white' ? '#ffffff' : '#000000'
  const failed = mark === '✕' || mark === '–'
  return (
    <span
      className="inline-flex items-center gap-0.5"
      title={`${detail} (${ratioText}:1)`}
    >
      <span
        className={cn(
          'inline-flex h-5 min-w-5 items-center justify-center rounded-sm px-0.5 type-caption font-[650] leading-none',
          failed && 'shadow-[inset_0_0_0_1px_dashed_rgba(128,128,128,0.7)]',
        )}
        style={{ backgroundColor: fill, color: probeInk }}
        aria-hidden
      >
        Aa
      </span>
      <span className="type-caption leading-none text-[var(--text-muted)]">
        {mark}
      </span>
    </span>
  )
}

type ColorScaleRowProps = {
  colors: string[]
  stepKeys: string[]
  baseIndex: number
  density?: RampDensity
  selectedIndex?: number | null
  /** Chrome behind the strip — for edge contours. */
  surfaceCss?: string
  onSelectStep?: (index: number) => void
  className?: string
  onCopiedHex?: () => void
  onCopyFailed?: () => void
}

/**
 * Continuous ramp strip. Compact = strip + key labels; Detail = + hex + chips.
 */
export function ColorScaleRow({
  colors,
  stepKeys,
  baseIndex,
  density = 'compact',
  selectedIndex = null,
  surfaceCss = '#121212',
  onSelectStep,
  className,
  onCopiedHex,
  onCopyFailed,
}: ColorScaleRowProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const showDetail = density === 'detail'
  const count = Math.max(colors.length, 1)

  useEffect(() => {
    if (copiedIndex == null) return
    const id = window.setTimeout(() => setCopiedIndex(null), 900)
    return () => window.clearTimeout(id)
  }, [copiedIndex])

  const copyHex = async (hex: string, index: number) => {
    setCopiedIndex(index)
    try {
      await navigator.clipboard.writeText(hex.toUpperCase())
      navigator.vibrate?.(40)
      onCopiedHex?.()
    } catch {
      onCopyFailed?.()
    }
  }

  const handleStepActivate = (index: number, hex: string) => {
    if (onSelectStep) {
      onSelectStep(index)
      return
    }
    void copyHex(hex, index)
  }

  const isKeyLabel = (index: number) => {
    if (index === baseIndex) return true
    if (index === 0 || index === count - 1) return true
    if (selectedIndex === index) return true
    // Mid key for long ramps
    if (count > 11 && index === Math.floor(count / 2) && index !== baseIndex) {
      return false
    }
    return false
  }

  return (
    <div className={cn('@container flex min-w-0 flex-col gap-2', className)}>
      <div
        className="grid w-full"
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
        aria-hidden
      >
        {colors.map((_, index) => (
          <div key={`cap-${stepKeys[index] ?? index}`} className="min-w-0 text-center">
            {index === baseIndex ? (
              <span className="type-caption text-[var(--text-muted)]">Base</span>
            ) : (
              <span className="type-caption invisible">Base</span>
            )}
          </div>
        ))}
      </div>

      <div
        role="list"
        aria-label="Color ramp"
        className={cn(
          'flex w-full min-w-0 overflow-hidden rounded-[var(--radius-md)]',
          'h-10 tablet:h-14 desktop:h-16',
        )}
      >
        {colors.map((hex, index) => {
          const step = stepKeys[index] ?? String(index)
          const isBase = index === baseIndex
          const isSelected = selectedIndex === index
          const contour = needsEdgeContour(hex, surfaceCss)
          return (
            <button
              key={step}
              type="button"
              role="listitem"
              onClick={() => handleStepActivate(index, hex)}
              onDoubleClick={(event) => {
                event.preventDefault()
                void copyHex(hex, index)
              }}
              aria-label={`${step}${isBase ? ', base' : ''}. ${hex.toUpperCase()}.`}
              aria-current={isSelected ? 'true' : undefined}
              className={cn(
                'relative min-w-0 flex-1 border-0 p-0',
                'focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]',
                isBase && 'z-[1]',
                isSelected && 'z-[2] shadow-[inset_0_0_0_2px_var(--accent)]',
              )}
              style={{
                backgroundColor: hex,
                boxShadow: isBase
                  ? `inset 0 0 0 2px ${onColor(hex)}`
                  : contour
                    ? 'inset 0 0 0 1px rgba(128,128,128,0.45)'
                    : undefined,
              }}
            >
              {copiedIndex === index ? (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
                  <Check className="size-3.5 text-white" strokeWidth={2.5} />
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      <div
        className="grid w-full gap-y-1"
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
      >
        {colors.map((hex, index) => {
          const step = stepKeys[index] ?? String(index)
          const isBase = index === baseIndex
          const showLabel = showDetail || isKeyLabel(index)
          const contrast = showDetail
            ? contrastAgainstWhiteAndBlack(hex)
            : null

          return (
            <div
              key={`meta-${step}`}
              className="flex min-w-0 flex-col items-center gap-0.5 text-center"
            >
              {showLabel ? (
                <span
                  className={cn(
                    'type-caption w-full truncate',
                    isBase ? 'text-[var(--text)]' : 'text-[var(--text-muted)]',
                  )}
                >
                  {isBase ? 'Base' : step}
                </span>
              ) : (
                <span className="type-caption invisible">·</span>
              )}
              {showDetail && contrast ? (
                <>
                  <span className="type-mono w-full truncate uppercase text-[var(--text)] [@container(max-width:40rem)]:hidden">
                    {hex.toUpperCase()}
                  </span>
                  <span className="mt-0.5 flex flex-col items-center gap-0.5 [@container(max-width:28rem)]:hidden">
                    <ContrastChip
                      surface="white"
                      fill={hex}
                      mark={contrast.onWhite.mark}
                      ratioText={contrast.onWhite.ratioText}
                      detail={contrast.onWhite.detail}
                    />
                    <ContrastChip
                      surface="black"
                      fill={hex}
                      mark={contrast.onBlack.mark}
                      ratioText={contrast.onBlack.ratioText}
                      detail={contrast.onBlack.detail}
                    />
                  </span>
                </>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
