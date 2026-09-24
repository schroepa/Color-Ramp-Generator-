'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { PresetPicker } from '@/components/PresetPicker'
import { Button } from '@/components/ui/button'
import { normalizeHex } from '@/lib/color-system'
import { DEFAULT_PRESET_ID, loadLastPresetId } from '@/lib/presets'
import { cn } from '@/lib/utils'

const EXAMPLES: { label: string; hex: string }[] = [
  { label: 'Teal', hex: '#0d7377' },
  { label: 'Orange', hex: '#c45c26' },
  { label: 'Violet', hex: '#6d5acd' },
  { label: 'Rose', hex: '#c23a6b' },
  { label: 'Forest', hex: '#2f6b3a' },
  { label: 'Slate', hex: '#4a5568' },
]

type EntryStateProps = {
  onStart: (baseColor: string, presetId: string) => void
  className?: string
}

/**
 * First-run entry: color → schema question → scale (§6.1).
 */
export function EntryState({ onStart, className }: EntryStateProps) {
  const [hex, setHex] = useState('')
  const [phase, setPhase] = useState<'color' | 'preset'>('color')
  const [presetId, setPresetId] = useState(() => loadLastPresetId())
  const normalized = normalizeHex(hex)

  const goPreset = (value: string) => {
    const next = normalizeHex(value)
    if (!next) return
    setHex(next)
    setPhase('preset')
  }

  const finish = (id: string) => {
    const next = normalizeHex(hex)
    if (!next) return
    onStart(next, id)
  }

  return (
    <section
      className={cn(
        'mx-auto flex w-full max-w-2xl flex-col gap-8 py-10 tablet:py-16',
        className,
      )}
      aria-label="Get started"
    >
      {phase === 'color' ? (
        <>
          <div className="flex flex-col gap-3">
            <h1 className="type-title text-[var(--text)]">
              From one color to a complete, accessible scale.
            </h1>
            <p className="type-body text-[var(--text-muted)]">
              Paste a hex, pick a color, or try an example.
            </p>
          </div>

          <div className="flex min-w-0 flex-col gap-3">
            <label className="type-label text-[var(--text-muted)]" htmlFor="entry-hex">
              Choose a color
            </label>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <label className="relative size-12 min-h-12 min-w-12 shrink-0 cursor-pointer overflow-hidden rounded-[var(--radius-md)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--ring)]">
                <input
                  type="color"
                  value={normalized ?? '#0d7377'}
                  onChange={(event) => setHex(event.target.value)}
                  aria-label="Pick base color"
                  className="absolute inset-0 size-[160%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 p-0"
                />
              </label>
              <input
                id="entry-hex"
                value={hex}
                onChange={(event) => setHex(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && normalized) {
                    event.preventDefault()
                    goPreset(normalized)
                  }
                }}
                placeholder="Paste hex or pick a color"
                spellCheck={false}
                className="h-12 min-w-0 flex-1 rounded-full bg-[var(--chip)] px-4 type-mono text-[var(--text)] uppercase outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] placeholder:normal-case placeholder:type-body placeholder:text-[var(--text-faint)]"
              />
              <Button
                type="button"
                size="default"
                disabled={!normalized}
                onClick={() => normalized && goPreset(normalized)}
              >
                Continue
                <ArrowRight />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="type-caption text-[var(--text-muted)]">Or try</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <button
                  key={example.hex}
                  type="button"
                  onClick={() => goPreset(example.hex)}
                  className="type-label inline-flex h-11 items-center gap-2 rounded-full bg-[var(--chip)] px-3 text-[var(--text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                >
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: example.hex }}
                    aria-hidden
                  />
                  {example.label}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              className="type-caption w-fit text-[var(--text-muted)] outline-none hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              onClick={() => setPhase('color')}
            >
              ← Color {normalized?.toUpperCase()}
            </button>
            <h1 className="type-title text-[var(--text)]">For which system?</h1>
            <p className="type-body text-[var(--text-muted)]">
              Presets set step names, lightness ladder, and export token patterns.
            </p>
          </div>
          <PresetPicker
            value={presetId}
            previewHex={normalized ?? '#0d7377'}
            onChange={(id) => {
              setPresetId(id)
              finish(id)
            }}
            showDecideLater
            onDecideLater={() => finish(DEFAULT_PRESET_ID)}
          />
        </>
      )}
    </section>
  )
}
