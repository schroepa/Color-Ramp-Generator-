import { useEffect, useState } from 'react'
import { Liquid } from 'liquid-gooey'
import { useReducedMotion } from 'motion/react'
import { Check } from 'lucide-react'
import { contrastAgainstWhiteAndBlack } from '@/lib/contrast'
import { solidSwatchUrl } from '@/lib/swatch'
import { cn } from '@/lib/utils'

/**
 * Shared column width: circle buttons use horizontal margin so their flex
 * item width matches this label cell (Liquid.Item is display:contents).
 * size-10 (2.5rem) + mx-5 (1.25rem × 2) = 5rem, so HEX and contrast stay on one line.
 */
const CELL = 'w-20 shrink-0'

type ColorSwatchProps = {
  hex: string
  step: string
  isBase: boolean
  lifted: boolean
  onLift: (lifted: boolean) => void
  onCopied?: () => void
  onCopyFailed?: () => void
}

function ColorSwatch({
  hex,
  step,
  isBase,
  lifted,
  onLift,
  onCopied,
  onCopyFailed,
}: ColorSwatchProps) {
  const [copied, setCopied] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  const contrast = contrastAgainstWhiteAndBlack(hex)

  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 900)
    return () => window.clearTimeout(id)
  }, [copied])

  const handleCopy = async () => {
    setCopied(true)
    try {
      await navigator.clipboard.writeText(hex.toUpperCase())
      navigator.vibrate?.(40)
      onCopied?.()
    } catch {
      onCopyFailed?.()
    }
  }

  return (
    <Liquid.Item y={lifted && !shouldReduceMotion ? -6 : 0} transition="bouncy">
      <button
        type="button"
        onClick={handleCopy}
        onPointerEnter={() => onLift(true)}
        onPointerLeave={() => onLift(false)}
        onFocus={() => onLift(true)}
        onBlur={() => onLift(false)}
        aria-label={`Copy ${hex.toUpperCase()}, step ${step}. ${contrast.onWhite.detail} ${contrast.onBlack.detail}`}
        className={cn(
          'relative z-10 mx-5 size-10 min-h-8 min-w-8 cursor-pointer overflow-hidden rounded-full bg-transparent',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
          isBase && 'shadow-[0_0_0_2px_rgba(255,255,255,0.4)]',
        )}
      >
        <img
          src={solidSwatchUrl(hex)}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 size-full object-cover"
        />
        {isBase && (
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white mix-blend-difference"
          />
        )}
        {copied && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/25"
          >
            <Check className="size-3.5 text-white" strokeWidth={2.5} />
          </span>
        )}
      </button>
    </Liquid.Item>
  )
}

function ContrastLine({
  surface,
  ratioText,
  mark,
  detail,
}: {
  surface: 'white' | 'black'
  ratioText: string
  mark: string
  detail: string
}) {
  return (
    <span className="grid grid-cols-[0.375rem_2.4rem_1.6rem] items-center gap-1" title={detail}>
      <span
        aria-hidden
        className={cn(
          'size-1.5 rounded-full',
          surface === 'white'
            ? 'bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.45)]'
            : 'bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45)]',
        )}
      />
      <span className="type-caption tabular-nums text-[var(--text)]">{ratioText}</span>
      <span className="type-caption text-left text-[var(--text-muted)]">{mark}</span>
    </span>
  )
}

type ColorScaleRowProps = {
  colors: string[]
  /** Ordered labels from `stepKeysFor(settings)`. */
  stepKeys: string[]
  /** Index of the base swatch (`baseStepIndex(settings)`). */
  baseIndex: number
  className?: string
  onCopiedHex?: () => void
  onCopyFailed?: () => void
}

export function ColorScaleRow({
  colors,
  stepKeys,
  baseIndex,
  className,
  onCopiedHex,
  onCopyFailed,
}: ColorScaleRowProps) {
  const [lifted, setLifted] = useState<number | null>(null)

  return (
    <div
      className={cn(
        'scrollbar-quiet min-w-0 overflow-x-auto overscroll-x-contain pb-1',
        className,
      )}
    >
      {/*
        Circles in Liquid (subtle Morph bridge). Labels stay outside the
        filtered silhouette in a twin flex row — same cell width + gap — so
        step/HEX stay crisp under each circle while both rows scroll together.
      */}
      <div className="mx-auto flex w-max flex-col gap-1.5">
        <Liquid
          blur={18}
          contrast={18}
          fill="var(--card)"
          shadow="0 4px 14px rgba(0,0,0,.28)"
          className="relative z-0 flex gap-1 [&_[data-gooey-svg]]:pointer-events-none"
        >
          {colors.map((hex, index) => {
            const step = stepKeys[index] ?? String(index)
            return (
              <ColorSwatch
                key={step}
                hex={hex}
                step={step}
                isBase={index === baseIndex}
                lifted={lifted === index}
                onLift={(next) => setLifted(next ? index : null)}
                onCopied={onCopiedHex}
                onCopyFailed={onCopyFailed}
              />
            )
          })}
        </Liquid>

        <div className="flex gap-1">
          {colors.map((hex, index) => {
            const step = stepKeys[index] ?? String(index)
            const isBase = index === baseIndex
            const contrast = contrastAgainstWhiteAndBlack(hex)
            return (
              <div
                key={step}
                className={cn(CELL, 'flex flex-col items-center gap-0.5 text-center')}
              >
                <span
                  className={cn(
                    'type-caption',
                    isBase ? 'text-[var(--text)]' : 'text-[var(--text-muted)]',
                  )}
                >
                  {step}
                </span>
                <span className="type-mono uppercase text-[var(--text)]">
                  {hex.toUpperCase()}
                </span>
                <span className="mt-1 flex flex-col items-center gap-0.5">
                  <ContrastLine
                    surface="white"
                    ratioText={contrast.onWhite.ratioText}
                    mark={contrast.onWhite.mark}
                    detail={contrast.onWhite.detail}
                  />
                  <ContrastLine
                    surface="black"
                    ratioText={contrast.onBlack.ratioText}
                    mark={contrast.onBlack.mark}
                    detail={contrast.onBlack.detail}
                  />
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
