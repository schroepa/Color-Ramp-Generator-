'use client'

type Props = {
  headline: string
  openLabel: string
  placeholder: string
  hexInput: string
  setHexInput: (v: string) => void
  appHref: string
  accent: string
  ink: string
}

export function CtaInput({
  headline,
  openLabel,
  placeholder,
  hexInput,
  setHexInput,
  appHref,
  accent,
  ink,
}: Props) {
  return (
    <section
      id="cta"
      className="mx-auto w-full max-w-3xl border-t border-[var(--line)] px-4 py-16 text-center tablet:px-6"
    >
      <h2 className="type-title text-[var(--text)]">{headline}</h2>
      <div className="mx-auto mt-8 flex max-w-md items-center gap-2">
        <label className="relative size-11 shrink-0 cursor-pointer overflow-hidden rounded-[var(--radius-md)] shadow-[inset_0_0_0_1px_rgba(128,128,128,0.35)]">
          <input
            type="color"
            value={hexInput.startsWith('#') ? hexInput.slice(0, 7) : '#0d7377'}
            onChange={(e) => setHexInput(e.target.value)}
            className="absolute inset-0 size-[160%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 p-0"
            aria-label="Pick color"
          />
        </label>
        <input
          value={hexInput}
          onChange={(e) => setHexInput(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          className="h-12 min-h-11 min-w-0 flex-1 rounded-full bg-[var(--chip)] px-4 type-mono text-[var(--text)] uppercase outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        />
        <a
          href={appHref}
          className="type-label inline-flex size-12 min-h-11 min-w-11 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          style={{ backgroundColor: accent, color: ink }}
          aria-label={openLabel}
        >
          →
        </a>
      </div>
    </section>
  )
}
