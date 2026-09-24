'use client'

import { useMemo, useState } from 'react'
import type { Preset } from '@/lib/presets/types'
import type { Copy } from '@/i18n/copy'
import {
  setToCss,
  setToDtcg,
  setToTailwind,
  setToTailwindV4,
} from '@/lib/export-formats'
import { DEFAULT_GENERATION_SETTINGS } from '@/lib/generation-settings'

type FormatId = 'tailwind-v4' | 'css' | 'dtcg' | 'tailwind'

const TABS: { id: FormatId; label: string }[] = [
  { id: 'tailwind-v4', label: 'Tailwind v4' },
  { id: 'css', label: 'CSS' },
  { id: 'dtcg', label: 'Design Tokens' },
  { id: 'tailwind', label: 'Tailwind v3' },
]

type Props = {
  copy: Copy['export']
  hex: string
  colors: string[]
  preset: Preset
  accent: string
  ink: string
}

export function ExportPreview({
  copy,
  hex,
  colors,
  preset,
  accent,
  ink,
}: Props) {
  const [format, setFormat] = useState<FormatId>('tailwind-v4')
  const [copied, setCopied] = useState(false)

  const generation = {
    ...DEFAULT_GENERATION_SETTINGS,
    presetId: preset.id,
  }

  const scale = {
    id: 'demo',
    name: 'teal',
    baseColor: hex,
    system: 'saturated' as const,
    colors,
  }

  const code = useMemo(() => {
    switch (format) {
      case 'tailwind-v4':
        return setToTailwindV4([scale], generation, preset)
      case 'css':
        return setToCss([scale], generation, preset)
      case 'dtcg':
        return setToDtcg([scale], generation, preset)
      case 'tailwind':
        return setToTailwind([scale], generation, preset)
      default:
        return ''
    }
  }, [format, scale, generation, preset])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <section
      id="export"
      className="mx-auto w-full max-w-5xl border-t border-[var(--line)] px-4 py-16 tablet:px-6 desktop:px-8"
    >
      <h2 className="type-title text-center text-[var(--text)]">
        {copy.headline}
      </h2>

      <div className="mt-8 hidden flex-wrap gap-2 tablet:flex" role="tablist">
        {TABS.map((tab) => {
          const selected = format === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setFormat(tab.id)}
              className={`type-label min-h-11 rounded-full px-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                selected
                  ? ''
                  : 'bg-[var(--chip)] text-[var(--text-muted)]'
              }`}
              style={
                selected
                  ? { backgroundColor: accent, color: ink }
                  : undefined
              }
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <select
        className="type-label mt-6 h-12 min-h-11 w-full rounded-full bg-[var(--chip)] px-4 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] tablet:hidden"
        value={format}
        onChange={(e) => setFormat(e.target.value as FormatId)}
        aria-label="Export format"
      >
        {TABS.map((tab) => (
          <option key={tab.id} value={tab.id}>
            {tab.label}
          </option>
        ))}
      </select>

      <div className="relative mt-4 overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)]">
        <button
          type="button"
          onClick={handleCopy}
          className="type-label absolute right-2 top-2 z-10 min-h-11 rounded-full bg-[var(--chip)] px-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          {copied ? '✓' : copy.copy}
        </button>
        <pre className="max-h-64 overflow-auto p-4 type-mono text-[var(--text)]">
          {code}
        </pre>
      </div>
      <p className="mt-3 type-caption text-[var(--text-muted)]">
        {copy.guides}
      </p>
    </section>
  )
}
