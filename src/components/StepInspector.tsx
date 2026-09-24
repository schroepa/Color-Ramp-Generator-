'use client'

import { converter, parse } from 'culori'
import { ChevronLeft, ChevronRight, Copy, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  contrastAgainstWhiteAndBlack,
  onColor,
} from '@/lib/contrast'
import { cn } from '@/lib/utils'

const toOklch = converter('oklch')
const toRgb = converter('rgb')
const toHsl = converter('hsl')

type StepInspectorProps = {
  hex: string
  step: string
  isBase: boolean
  neighbors?: string[]
  stepIndex?: number
  stepCount?: number
  onStepChange?: (index: number) => void
  onClose?: () => void
  onCopy?: (text: string, label: string) => void
  className?: string
}

function FormatRow({
  label,
  value,
  onCopy,
}: {
  label: string
  value: string
  onCopy?: (text: string, label: string) => void
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="type-caption w-12 shrink-0 text-[var(--text-muted)]">
        {label}
      </span>
      <code className="type-mono min-w-0 flex-1 truncate text-[var(--text)]">
        {value}
      </code>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Copy ${label}`}
        onClick={() => onCopy?.(value, label)}
      >
        <Copy className="size-3.5" />
      </Button>
    </div>
  )
}

function round(n: number, digits: number): string {
  const f = 10 ** digits
  return String(Math.round(n * f) / f)
}

/**
 * Right-hand / sheet inspector for a selected step (concept 4.6 · review v2).
 */
export function StepInspector({
  hex,
  step,
  isBase,
  neighbors = [],
  stepIndex = 0,
  stepCount = 1,
  onStepChange,
  onClose,
  onCopy,
  className,
}: StepInspectorProps) {
  const parsed = parse(hex)
  const oklch = parsed ? toOklch(parsed) : null
  const rgb = parsed ? toRgb(parsed) : null
  const hsl = parsed ? toHsl(parsed) : null
  const contrast = contrastAgainstWhiteAndBlack(hex)
  const ink = onColor(hex)

  const oklchText = oklch
    ? `oklch(${round(oklch.l, 3)} ${round(oklch.c ?? 0, 3)} ${round(oklch.h ?? 0, 1)})`
    : hex
  const rgbText =
    rgb && rgb.r != null
      ? `rgb(${Math.round(rgb.r * 255)} ${Math.round(rgb.g! * 255)} ${Math.round(rgb.b! * 255)})`
      : hex
  const hslText =
    hsl && hsl.h != null
      ? `hsl(${Math.round(hsl.h)} ${Math.round((hsl.s ?? 0) * 100)}% ${Math.round((hsl.l ?? 0) * 100)}%)`
      : hex
  const hexText = hex.toUpperCase()

  const useHint =
    contrast.onWhite.ratio >= 4.5
      ? 'Suitable for text on white'
      : contrast.onWhite.ratio >= 3
        ? 'Large text / surfaces on white only'
        : 'Avoid as text on white — surfaces only'

  const canNav = Boolean(onStepChange) && stepCount > 1

  return (
    <aside
      className={cn(
        'flex min-w-0 flex-col gap-4 border-[var(--line)]',
        className,
      )}
      aria-label={`Inspector ${step}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            {canNav ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Previous step"
                disabled={stepIndex <= 0}
                onClick={() => onStepChange?.(stepIndex - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
            ) : null}
            <p className="type-heading text-[var(--text)]">
              {step}
              {isBase ? ' · Base' : ''}
            </p>
            {canNav ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Next step"
                disabled={stepIndex >= stepCount - 1}
                onClick={() => onStepChange?.(stepIndex + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            ) : null}
          </div>
          <p className="type-caption text-[var(--text-muted)]">{useHint}</p>
        </div>
        {onClose ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close inspector"
            onClick={onClose}
          >
            <X />
          </Button>
        ) : null}
      </div>

      {neighbors.length > 0 ? (
        <div className="flex h-5 overflow-hidden rounded-[var(--radius-sm)]">
          {neighbors.map((n, i) => (
            <button
              key={`${n}-${i}`}
              type="button"
              aria-label={`Go to step ${i + 1}`}
              aria-current={i === stepIndex ? 'true' : undefined}
              className={cn(
                'min-w-0 flex-1 border-0 p-0',
                i === stepIndex && 'ring-2 ring-inset ring-[var(--accent)]',
              )}
              style={{ backgroundColor: n }}
              onClick={() => onStepChange?.(i)}
            />
          ))}
        </div>
      ) : null}

      <div
        className="flex h-12 w-full items-center justify-center overflow-hidden rounded-[var(--radius-md)]"
        style={{ backgroundColor: hex, color: ink }}
      >
        <span className="type-label" aria-hidden>
          Aa
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <FormatRow label="HEX" value={hexText} onCopy={onCopy} />
        <FormatRow label="OKLCH" value={oklchText} onCopy={onCopy} />
        <FormatRow label="RGB" value={rgbText} onCopy={onCopy} />
        <FormatRow label="HSL" value={hslText} onCopy={onCopy} />
      </div>

      <div className="flex flex-col gap-2 border-t border-[var(--line)] pt-4">
        <p className="type-label text-[var(--text-muted)]">Contrast</p>
        <div className="flex flex-col gap-2">
          {/* Probe on swatch + judgment on chrome */}
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-8 min-w-10 items-center justify-center rounded-[var(--radius-sm)] px-2 type-label"
              style={{ backgroundColor: hex, color: '#ffffff' }}
              title={contrast.onWhite.detail}
            >
              Aa
            </span>
            <span className="type-body-sm text-[var(--text)]">on white</span>
            <span className="ml-auto type-mono text-[var(--text-muted)]">
              {contrast.onWhite.ratioText}
            </span>
            <span className="type-label text-[var(--text)]">
              {contrast.onWhite.mark}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-8 min-w-10 items-center justify-center rounded-[var(--radius-sm)] px-2 type-label"
              style={{ backgroundColor: hex, color: '#000000' }}
              title={contrast.onBlack.detail}
            >
              Aa
            </span>
            <span className="type-body-sm text-[var(--text)]">on black</span>
            <span className="ml-auto type-mono text-[var(--text-muted)]">
              {contrast.onBlack.ratioText}
            </span>
            <span className="type-label text-[var(--text)]">
              {contrast.onBlack.mark}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
