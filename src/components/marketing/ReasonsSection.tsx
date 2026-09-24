'use client'

import { useMemo, useState } from 'react'
import { getBuiltinPreset, BUILTIN_PRESETS } from '@/lib/presets'
import { generateFromPresetCached } from '@/lib/presets/generate'
import type { Copy } from '@/i18n/copy'

type Props = {
  copy: Copy['reasons']
  hex: string
}

export function ReasonsSection({ copy, hex }: Props) {
  const [demoHex, setDemoHex] = useState(hex)
  const [presetId, setPresetId] = useState('tailwind')

  const easier = useMemo(() => {
    const preset = getBuiltinPreset('tailwind')!
    return generateFromPresetCached({
      baseHex: demoHex,
      preset,
      chromaMode: 'saturated',
      baseOverride: null,
      theme: 'light',
    }).steps.map((s) => s.hex)
  }, [demoHex])

  const better = useMemo(() => {
    const preset = getBuiltinPreset('tailwind')!
    return ['#0d7377', '#c45c26', '#e5484d', '#6d5acd', '#3b82f6'].map(
      (h) => {
        const r = generateFromPresetCached({
          baseHex: h,
          preset,
          chromaMode: 'saturated',
          baseOverride: null,
          theme: 'light',
        })
        const base = r.steps.find((s) => s.isBase) ?? r.steps[6]
        return { hex: base?.hex ?? h, label: base?.stepId ?? '600' }
      },
    )
  }, [])

  const fits = useMemo(() => {
    const preset = getBuiltinPreset(presetId) ?? getBuiltinPreset('tailwind')!
    const r = generateFromPresetCached({
      baseHex: hex,
      preset,
      chromaMode: 'saturated',
      baseOverride: null,
      theme: 'light',
    })
    return {
      colors: r.steps.map((s) => s.hex),
      labels: preset.steps.map((s) => s.label),
    }
  }, [hex, presetId])

  return (
    <section
      id="reasons"
      className="mx-auto w-full max-w-5xl border-t border-[var(--line)] px-4 py-16 tablet:px-6 desktop:px-8"
    >
      <div className="grid gap-12 desktop:grid-cols-3">
        <div>
          <h3 className="type-heading text-[var(--text)]">{copy.easierTitle}</h3>
          <p className="mt-2 type-body-sm text-[var(--text-muted)]">
            {copy.easierBody}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <input
              type="color"
              value={demoHex}
              onChange={(e) => setDemoHex(e.target.value)}
              className="size-11 cursor-pointer rounded-[var(--radius-md)] border-0 bg-transparent"
              aria-label="Demo color"
            />
            <div className="flex h-8 min-w-0 flex-1 overflow-hidden rounded-[var(--radius-sm)]">
              {easier.map((c, i) => (
                <div
                  key={i}
                  className="min-w-0 flex-1"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <h3 className="type-heading text-[var(--text)]">{copy.betterTitle}</h3>
          <p className="mt-2 type-body-sm text-[var(--text-muted)]">
            {copy.betterBody}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {better.map((b) => (
              <div
                key={b.hex}
                className="flex size-12 flex-col items-center justify-center rounded-[var(--radius-md)] type-caption"
                style={{
                  backgroundColor: b.hex,
                  color: b.hex === '#f5d547' ? '#111' : '#fff',
                }}
              >
                {b.label}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="type-heading text-[var(--text)]">{copy.fitsTitle}</h3>
          <p className="mt-2 type-body-sm text-[var(--text-muted)]">
            {copy.fitsBody}
          </p>
          <select
            className="type-label mt-4 h-11 w-full rounded-full bg-[var(--chip)] px-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            value={presetId}
            onChange={(e) => setPresetId(e.target.value)}
          >
            {['tailwind', 'radix', 'material3'].map((id) => {
              const p = BUILTIN_PRESETS.find((x) => x.id === id)
              return (
                <option key={id} value={id}>
                  {p?.label ?? id}
                </option>
              )
            })}
          </select>
          <div className="mt-3 flex h-8 overflow-hidden rounded-[var(--radius-sm)]">
            {fits.colors.map((c, i) => (
              <div
                key={i}
                className="min-w-0 flex-1"
                style={{ backgroundColor: c }}
                title={fits.labels[i]}
              />
            ))}
          </div>
          <p className="mt-1 type-caption text-[var(--text-muted)]">
            {fits.labels.filter((_, i) => i === 0 || i === fits.labels.length - 1 || i === Math.floor(fits.labels.length / 2)).join(' · ')}
          </p>
        </div>
      </div>
    </section>
  )
}
