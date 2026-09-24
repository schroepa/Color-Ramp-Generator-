'use client'

import { BUILTIN_PRESETS, presetStepSummary } from '@/lib/presets'
import { generateFromPresetCached } from '@/lib/presets/generate'
import type { Preset } from '@/lib/presets/types'
import { cn } from '@/lib/utils'

type PresetPickerProps = {
  value: string
  onChange: (presetId: string) => void
  /** Hex for mini ramp previews on cards. */
  previewHex?: string
  /** Compact chip vs full cards. */
  variant?: 'cards' | 'chip-list'
  className?: string
  /** Include “Decide later” that selects default without fanfare. */
  showDecideLater?: boolean
  onDecideLater?: () => void
}

/**
 * Radiogroup of design-system presets (§6.1 / 6.2 / 6.8).
 */
export function PresetPicker({
  value,
  onChange,
  previewHex = '#0d7377',
  variant = 'cards',
  className,
  showDecideLater,
  onDecideLater,
}: PresetPickerProps) {
  const presets = BUILTIN_PRESETS

  if (variant === 'chip-list') {
    return (
      <div
        role="radiogroup"
        aria-label="Design-system schema"
        className={cn('flex flex-wrap gap-2', className)}
      >
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            role="radio"
            aria-checked={value === preset.id}
            onClick={() => onChange(preset.id)}
            className={cn(
              'type-label min-h-11 rounded-full px-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
              value === preset.id
                ? 'bg-[var(--primary)] text-[var(--primary-ink)]'
                : 'bg-[var(--chip)] text-[var(--text-muted)] hover:text-[var(--text)]',
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div
        role="radiogroup"
        aria-label="For which system?"
        className="grid gap-2 tablet:grid-cols-2"
      >
        {presets.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            selected={value === preset.id}
            previewHex={previewHex}
            onSelect={() => onChange(preset.id)}
          />
        ))}
      </div>
      {showDecideLater ? (
        <button
          type="button"
          className="type-label min-h-11 text-left text-[var(--text-muted)] outline-none hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          onClick={onDecideLater}
        >
          Decide later (Tailwind-Schema)
        </button>
      ) : null}
    </div>
  )
}

function PresetCard({
  preset,
  selected,
  previewHex,
  onSelect,
}: {
  preset: Preset
  selected: boolean
  previewHex: string
  onSelect: () => void
}) {
  const colors = generateFromPresetCached({
    baseHex: previewHex,
    preset,
    chromaMode: preset.chroma.mode,
    baseOverride: null,
    theme: 'light',
  }).steps.map((s) => s.hex)

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex min-h-11 min-w-0 flex-col gap-2 rounded-[var(--radius-md)] border px-3 py-3 text-left outline-none',
        'focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
        selected
          ? 'border-[var(--accent)] bg-[var(--chip)]'
          : 'border-[var(--line)] hover:border-[var(--text-faint)]',
      )}
    >
      <span className="type-label text-[var(--text)]">{preset.label}</span>
      <span className="type-caption text-[var(--text-muted)]">
        {presetStepSummary(preset)}
      </span>
      <span className="flex h-2.5 w-full overflow-hidden rounded-sm">
        {colors.map((hex, i) => (
          <span
            key={`${preset.id}-${i}`}
            className="min-w-0 flex-1"
            style={{ backgroundColor: hex }}
          />
        ))}
      </span>
      <span className="type-caption text-[var(--text-faint)] line-clamp-2">
        {preset.description}
      </span>
    </button>
  )
}

type PresetSummaryCardProps = {
  preset: Preset
  onClick?: () => void
  className?: string
}

/** Compact active-preset card for Adjust panel. */
export function PresetSummaryCard({
  preset,
  onClick,
  className,
}: PresetSummaryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full min-h-11 flex-col gap-0.5 rounded-[var(--radius-md)] border border-[var(--line)] px-3 py-2.5 text-left outline-none',
        'hover:border-[var(--text-faint)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
        className,
      )}
    >
      <span className="type-label text-[var(--text)]">{preset.label}</span>
      <span className="type-caption text-[var(--text-muted)]">
        {presetStepSummary(preset)}
      </span>
    </button>
  )
}
