'use client'

import { useEffect, useMemo, useState } from 'react'
import { wcagContrast } from 'culori'
import { onColor } from '@/lib/contrast'
import { normalizeHex } from '@/lib/color-system'
import { getBuiltinPreset, BUILTIN_PRESETS } from '@/lib/presets'
import { generateFromPresetCached } from '@/lib/presets/generate'
import { assessRampQuality } from '@/lib/ramp-quality'
import { withBase, type Copy, type Locale } from '@/i18n/copy'
import { generateTypicalRamp, analyzeCompare } from '@/lib/typical-ramp'
import { CompareSection } from '@/components/marketing/CompareSection'
import { ExportPreview } from '@/components/marketing/ExportPreview'
import { CtaInput } from '@/components/marketing/CtaInput'
import { StickyCta } from '@/components/marketing/StickyCta'
import { ReasonsSection } from '@/components/marketing/ReasonsSection'
import { FigmaWaitlist } from '@/components/marketing/FigmaWaitlist'
import { FaqAccordion } from '@/components/marketing/FaqAccordion'

const EXAMPLES = [
  '#0d7377',
  '#c45c26',
  '#f5d547',
  '#1e2a5a',
  '#e5484d',
  '#6d5acd',
]

const PRESET_CHIPS = [
  'tailwind',
  'radix',
  'material3',
  'ant',
  'carbon',
  'open-color',
] as const

export type MarketingHomeProps = {
  locale: Locale
  copy: Copy
}

export function MarketingHome({ locale, copy }: MarketingHomeProps) {
  const [hexInput, setHexInput] = useState('#0D7377')
  const [lastValid, setLastValid] = useState('#0d7377')
  const [presetId, setPresetId] = useState('tailwind')
  const [hint, setHint] = useState<string | null>(null)
  const [compareMode, setCompareMode] = useState<'typical' | 'tintfield'>(
    'tintfield',
  )

  useEffect(() => {
    const id = window.setTimeout(() => {
      const n = normalizeHex(hexInput)
      if (!hexInput.trim()) return
      if (!n) {
        setHint(copy.hero.invalid)
        return
      }
      setHint(null)
      setLastValid(n)
    }, 300)
    return () => window.clearTimeout(id)
  }, [hexInput, copy.hero.invalid])

  const hex = lastValid
  const preset = getBuiltinPreset(presetId) ?? getBuiltinPreset('tailwind')!

  const result = useMemo(
    () =>
      generateFromPresetCached({
        baseHex: hex,
        preset,
        chromaMode: 'saturated',
        baseOverride: null,
        theme: 'light',
      }),
    [hex, preset],
  )

  const colors = result.steps.map((s) => s.hex)
  const baseIdx = result.steps.findIndex((s) => s.isBase)
  const baseStep = result.baseStepId ?? preset.steps[baseIdx]?.label ?? '—'
  const quality = assessRampQuality(colors, baseIdx >= 0 ? baseIdx : 0)
  const accent =
    colors[baseIdx >= 0 ? baseIdx : Math.floor(colors.length / 2)] ?? hex
  const ink = onColor(accent)

  const aaFrom = colors.findIndex((c) => wcagContrast(c, '#ffffff') >= 4.5)
  const aaStep =
    aaFrom >= 0 ? (preset.steps[aaFrom]?.label ?? String(aaFrom)) : '—'

  const typical = useMemo(
    () => generateTypicalRamp(hex, colors.length),
    [hex, colors.length],
  )
  const flags = useMemo(
    () => analyzeCompare(typical, colors, baseIdx),
    [typical, colors, baseIdx],
  )

  const appHref = withBase(
    `${locale === 'de' ? '/de' : ''}/app?hex=${encodeURIComponent(hex)}&preset=${presetId}`,
  )

  useEffect(() => {
    document.documentElement.style.setProperty('--landing-accent', accent)
    document.documentElement.style.setProperty('--landing-ink', ink)
  }, [accent, ink])

  const keyLabels = (i: number) => {
    if (i === 0 || i === colors.length - 1 || i === baseIdx) {
      return preset.steps[i]?.label ?? ''
    }
    return ''
  }

  const privacyHref = 'https://ptrckschrdtr.de/privacy'
  const how = copy.how

  return (
    <>
      <section
        id="hero"
        className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 pb-16 pt-10 text-center tablet:px-6 tablet:pt-16"
      >
        <h1 className="type-display text-[var(--text)]">{copy.hero.headline}</h1>
        <p className="max-w-xl type-body text-[var(--text-muted)]">
          {copy.hero.subline}
        </p>

        <div
          className="flex w-full flex-col gap-6 text-left"
          id="hero-demo"
        >
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative size-12 min-h-11 min-w-11 shrink-0 cursor-pointer overflow-hidden rounded-[var(--radius-md)] shadow-[inset_0_0_0_1px_rgba(128,128,128,0.35)]">
              <input
                type="color"
                value={hex}
                onChange={(e) => setHexInput(e.target.value)}
                className="absolute inset-0 size-[160%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 p-0"
                aria-label="Pick color"
              />
            </label>
            <input
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value)}
              placeholder={copy.hero.placeholder}
              spellCheck={false}
              className="h-12 min-h-11 min-w-0 flex-1 rounded-full bg-[var(--chip)] px-4 type-mono text-[var(--text)] uppercase outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] placeholder:normal-case placeholder:type-body placeholder:text-[var(--text-faint)]"
            />
          </div>
          {hint ? (
            <p className="type-caption text-[var(--text-muted)]">{hint}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <span className="type-caption text-[var(--text-muted)]">
              {copy.hero.try}
            </span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                aria-label={ex}
                onClick={() => setHexInput(ex)}
                className="hit-target size-11 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                style={{ backgroundColor: ex }}
              />
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <span className="type-caption text-[var(--text-muted)]">
              {copy.hero.for}
            </span>
            <div
              className="hidden flex-wrap gap-2 tablet:flex"
              role="radiogroup"
              aria-label="Preset"
            >
              {PRESET_CHIPS.map((id) => {
                const p = BUILTIN_PRESETS.find((x) => x.id === id)
                if (!p) return null
                const selected = presetId === id
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setPresetId(id)}
                    className={`type-label min-h-11 rounded-full px-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                      selected
                        ? ''
                        : 'bg-[var(--chip)] text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                    style={
                      selected
                        ? { backgroundColor: accent, color: ink }
                        : undefined
                    }
                  >
                    {p.label.replace(/-Schema$/, '')}
                  </button>
                )
              })}
            </div>
            <select
              className="type-label h-12 min-h-11 w-full rounded-full bg-[var(--chip)] px-4 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] tablet:hidden"
              value={presetId}
              onChange={(e) => setPresetId(e.target.value)}
              aria-label={copy.hero.for}
            >
              {PRESET_CHIPS.map((id) => {
                const p = BUILTIN_PRESETS.find((x) => x.id === id)
                return (
                  <option key={id} value={id}>
                    {p?.label ?? id}
                  </option>
                )
              })}
            </select>
          </div>

          <div className="flex h-12 overflow-hidden rounded-[var(--radius-md)] tablet:h-14">
            {colors.map((c, i) => (
              <div
                key={preset.steps[i]?.id ?? i}
                className="min-w-0 flex-1"
                style={{
                  backgroundColor: c,
                  boxShadow:
                    i === baseIdx
                      ? `inset 0 0 0 2px ${onColor(c)}`
                      : undefined,
                }}
              />
            ))}
          </div>
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${colors.length}, minmax(0,1fr))`,
            }}
          >
            {colors.map((_, i) => (
              <span
                key={`l-${i}`}
                className="type-caption truncate text-center text-[var(--text-muted)]"
              >
                {keyLabels(i)}
              </span>
            ))}
          </div>

          <ul className="flex flex-col gap-1 type-body-sm text-[var(--text)]">
            <li>✓ {copy.hero.checkSit.replace('{step}', baseStep)}</li>
            <li className="hidden tablet:list-item">
              ✓ {copy.hero.checkText.replace('{step}', aaStep)}
            </li>
            <li>✓ {quality.ok ? copy.hero.checkEven : quality.label}</li>
          </ul>

          <div className="flex flex-col items-start gap-2" id="hero-open">
            <a
              href={appHref}
              className="type-label inline-flex h-[52px] min-h-11 w-full items-center justify-center rounded-full px-6 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] tablet:w-auto"
              style={{ backgroundColor: accent, color: ink }}
            >
              {copy.hero.open}
            </a>
            <p className="type-caption text-[var(--text-muted)]">
              {copy.hero.micro}
            </p>
          </div>
        </div>
      </section>

      <CompareSection
        copy={copy.compare}
        typical={typical}
        tintfield={colors}
        baseIdx={baseIdx}
        typicalMid={Math.floor(typical.length / 2)}
        flags={flags}
        compareMode={compareMode}
        setCompareMode={setCompareMode}
        onTry={() => {
          document
            .getElementById('hero-demo')
            ?.scrollIntoView({ behavior: 'smooth' })
        }}
        onExample={(ex) => setHexInput(ex)}
        accent={accent}
        ink={ink}
      />

      <ReasonsSection copy={copy.reasons} hex={hex} />

      <section
        id="how"
        className="mx-auto w-full max-w-5xl border-t border-[var(--line)] px-4 py-16 tablet:px-6 desktop:px-8"
      >
        <h2 className="type-title text-center text-[var(--text)]">
          {how.headline}
        </h2>
        <ol className="mt-10 grid gap-8 tablet:grid-cols-3">
          <li>
            <p className="type-caption text-[var(--text-muted)]">1</p>
            <h3 className="mt-1 type-heading text-[var(--text)]">
              {how.s1Title}
            </h3>
            <p className="mt-2 type-body-sm text-[var(--text-muted)]">
              {how.s1Body}
            </p>
          </li>
          <li>
            <p className="type-caption text-[var(--text-muted)]">2</p>
            <h3 className="mt-1 type-heading text-[var(--text)]">
              {how.s2Title}
            </h3>
            <p className="mt-2 type-body-sm text-[var(--text-muted)]">
              {how.s2Body}
            </p>
          </li>
          <li>
            <p className="type-caption text-[var(--text-muted)]">3</p>
            <h3 className="mt-1 type-heading text-[var(--text)]">
              {how.s3Title}
            </h3>
            <p className="mt-2 type-body-sm text-[var(--text-muted)]">
              {how.s3Body}
            </p>
          </li>
        </ol>
      </section>

      <ExportPreview
        copy={copy.export}
        hex={hex}
        colors={colors}
        preset={preset}
        accent={accent}
        ink={ink}
      />

      <FigmaWaitlist
        copy={copy.figma}
        privacyHref={privacyHref}
        privacyLabel={copy.footer.privacy}
        accent={accent}
        ink={ink}
      />

      <FaqAccordion faq={copy.faq} />

      <CtaInput
        headline={copy.cta.headline}
        openLabel={copy.hero.open}
        placeholder={copy.hero.placeholder}
        hexInput={hexInput}
        setHexInput={setHexInput}
        appHref={appHref}
        accent={accent}
        ink={ink}
      />

      <StickyCta
        label={copy.hero.open}
        href={appHref}
        accent={accent}
        ink={ink}
      />
    </>
  )
}
