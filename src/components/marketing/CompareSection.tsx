'use client'

import type { CompareFlags } from '@/lib/typical-ramp'
import type { Copy } from '@/i18n/copy'
import { onColor } from '@/lib/contrast'

type Props = {
  copy: Copy['compare']
  typical: string[]
  tintfield: string[]
  baseIdx: number
  typicalMid: number
  flags: CompareFlags
  compareMode: 'typical' | 'tintfield'
  setCompareMode: (m: 'typical' | 'tintfield') => void
  onTry: () => void
  onExample: (hex: string) => void
  accent: string
  ink: string
}

function RampStrip({
  colors,
  highlightIdx,
}: {
  colors: string[]
  highlightIdx: number
}) {
  return (
    <div className="flex h-10 overflow-hidden rounded-[var(--radius-md)] tablet:h-12">
      {colors.map((c, i) => (
        <div
          key={i}
          className="min-w-0 flex-1"
          style={{
            backgroundColor: c,
            boxShadow:
              i === highlightIdx
                ? `inset 0 0 0 2px ${onColor(c)}`
                : undefined,
          }}
        />
      ))}
    </div>
  )
}

function AaRow({ colors }: { colors: string[] }) {
  return (
    <div
      className="mt-2 grid gap-0.5"
      style={{
        gridTemplateColumns: `repeat(${colors.length}, minmax(0,1fr))`,
      }}
    >
      {colors.map((c, i) => {
        const ink = onColor(c)
        return (
          <span
            key={i}
            className="type-caption text-center"
            style={{ color: ink, backgroundColor: c }}
          >
            Aa
          </span>
        )
      })}
    </div>
  )
}

export function CompareSection({
  copy,
  typical,
  tintfield,
  baseIdx,
  typicalMid,
  flags,
  compareMode,
  setCompareMode,
  onTry,
  onExample,
  accent,
  ink,
}: Props) {
  const showFallback = flags.closeCall

  return (
    <section
      id="compare"
      className="mx-auto w-full max-w-5xl border-t border-[var(--line)] px-4 py-16 tablet:px-6 desktop:px-8"
    >
      <h2 className="type-title text-center text-[var(--text)]">
        {copy.headline}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-center type-body text-[var(--text-muted)]">
        {copy.subline}
      </p>

      {/* Mobile segmented */}
      <div
        className="mt-8 flex rounded-full bg-[var(--chip)] p-1 tablet:hidden"
        role="tablist"
      >
        {(['typical', 'tintfield'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={compareMode === mode}
            onClick={() => setCompareMode(mode)}
            className="type-label min-h-11 flex-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            style={
              compareMode === mode
                ? { backgroundColor: accent, color: ink }
                : { color: 'var(--text-muted)' }
            }
          >
            {mode === 'typical' ? copy.typical : copy.tintfield}
          </button>
        ))}
      </div>

      <div className="mt-8 tablet:hidden">
        <RampStrip
          colors={compareMode === 'typical' ? typical : tintfield}
          highlightIdx={
            compareMode === 'typical' ? typicalMid : baseIdx
          }
        />
        <AaRow
          colors={compareMode === 'typical' ? typical : tintfield}
        />
        {!showFallback ? (
          <ul className="mt-4 flex flex-col gap-1 type-body-sm text-[var(--text)]">
            {compareMode === 'typical' ? (
              <>
                {flags.lightIdentical ? <li>↑ {copy.m1}</li> : null}
                {flags.forcedMid ? <li>↑ {copy.m2}</li> : null}
                {flags.unreadable ? <li>↑ {copy.m3}</li> : null}
              </>
            ) : (
              <>
                <li>✓ {copy.g1}</li>
                <li>✓ {copy.g2}</li>
                <li>✓ {copy.g3}</li>
              </>
            )}
          </ul>
        ) : null}
      </div>

      {/* Desktop / tablet side by side or stacked */}
      <div className="mt-8 hidden gap-8 tablet:grid tablet:grid-cols-1 desktop:grid-cols-2">
        <div>
          <p className="type-label mb-3 text-[var(--text-muted)]">
            {copy.typical}
          </p>
          <RampStrip colors={typical} highlightIdx={typicalMid} />
          <AaRow colors={typical} />
          {!showFallback ? (
            <ul className="mt-3 flex flex-col gap-1 type-body-sm text-[var(--text)]">
              {flags.lightIdentical ? <li>↑ {copy.m1}</li> : null}
              {flags.forcedMid ? <li>↑ {copy.m2}</li> : null}
              {flags.unreadable ? <li>↑ {copy.m3}</li> : null}
            </ul>
          ) : null}
        </div>
        <div>
          <p className="type-label mb-3 text-[var(--text-muted)]">
            {copy.tintfield}
          </p>
          <RampStrip colors={tintfield} highlightIdx={baseIdx} />
          <AaRow colors={tintfield} />
          {!showFallback ? (
            <ul className="mt-3 flex flex-col gap-1 type-body-sm text-[var(--text)]">
              <li>✓ {copy.g1}</li>
              <li>✓ {copy.g2}</li>
              <li>✓ {copy.g3}</li>
            </ul>
          ) : null}
        </div>
      </div>

      {showFallback ? (
        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="type-body-sm text-center text-[var(--text-muted)]">
            {copy.fallback}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="#f5d547"
              onClick={() => onExample('#f5d547')}
              className="hit-target size-11 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              style={{ backgroundColor: '#f5d547' }}
            />
            <button
              type="button"
              aria-label="#1e2a5a"
              onClick={() => onExample('#1e2a5a')}
              className="hit-target size-11 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              style={{ backgroundColor: '#1e2a5a' }}
            />
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={onTry}
          className="type-label min-h-11 rounded-full px-5 text-[var(--text-muted)] outline-none hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          ↑ {copy.tryBtn}
        </button>
      </div>
    </section>
  )
}
