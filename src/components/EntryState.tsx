'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { normalizeHex } from '@/lib/color-system'
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
  onStart: (baseColor: string) => void
  className?: string
}

/**
 * First-run entry: one color in → accessible scale out (concept §3).
 */
export function EntryState({ onStart, className }: EntryStateProps) {
  const [hex, setHex] = useState('')
  const normalized = normalizeHex(hex)
  const canStart = Boolean(normalized)

  const start = (value: string) => {
    const next = normalizeHex(value)
    if (!next) return
    onStart(next)
  }

  return (
    <section
      className={cn(
        'mx-auto flex w-full max-w-xl flex-col gap-8 py-10 tablet:py-16',
        className,
      )}
      aria-label="Get started"
    >
      <div className="flex flex-col gap-3">
        <h1 className="type-title text-[var(--text)]">
          From one color to a complete, accessible scale.
        </h1>
        <p className="type-body text-[var(--text-muted)]">
          Paste a hex, pick a color, or try an example — then adjust and export.
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
              if (event.key === 'Enter') {
                event.preventDefault()
                if (normalized) start(normalized)
              }
            }}
            placeholder="Paste hex or pick a color"
            spellCheck={false}
            className="h-12 min-w-0 flex-1 rounded-full bg-[var(--chip)] px-4 type-mono text-[var(--text)] uppercase outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] placeholder:normal-case placeholder:type-body placeholder:text-[var(--text-faint)]"
          />
          <Button
            type="button"
            size="default"
            disabled={!canStart}
            onClick={() => normalized && start(normalized)}
          >
            Create scale
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
              onClick={() => start(example.hex)}
              className="type-label inline-flex h-9 items-center gap-2 rounded-full bg-[var(--chip)] px-3 text-[var(--text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
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

      <ol className="type-caption flex flex-wrap gap-x-4 gap-y-2 text-[var(--text-faint)]">
        <li>1. Choose a color</li>
        <li>2. Adjust the scale</li>
        <li>3. Export</li>
      </ol>
    </section>
  )
}
