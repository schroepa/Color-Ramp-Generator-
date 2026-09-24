'use client'

import { useState, type FormEvent } from 'react'
import type { Copy } from '@/i18n/copy'

type Props = {
  copy: Copy['figma']
  privacyHref: string
  privacyLabel: string
  accent: string
  ink: string
}

export function FigmaWaitlist({
  copy,
  privacyHref,
  privacyLabel,
  accent,
  ink,
}: Props) {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) return
    setDone(true)
  }

  return (
    <section
      id="figma"
      className="mx-auto w-full max-w-5xl border-t border-[var(--line)] px-4 py-16 tablet:px-6 desktop:px-8"
    >
      <div className="rounded-[var(--radius-md)] bg-[var(--chip)] px-6 py-10 tablet:px-10">
        <p className="type-caption uppercase tracking-wide text-[var(--text-muted)]">
          {copy.label}
        </p>
        <h2 className="mt-2 type-title text-[var(--text)]">{copy.headline}</h2>
        <p className="mt-3 max-w-xl type-body text-[var(--text-muted)]">
          {copy.body}
        </p>

        {done ? (
          <p className="mt-6 type-body-sm text-[var(--text)]">{copy.confirm}</p>
        ) : (
          <form
            onSubmit={onSubmit}
            className="mt-6 flex max-w-md flex-col gap-3 tablet:flex-row tablet:items-center"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={copy.placeholder}
              className="h-12 min-h-11 min-w-0 flex-1 rounded-full bg-[var(--bg)] px-4 type-body outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              autoComplete="email"
            />
            <button
              type="submit"
              className="type-label h-12 min-h-11 rounded-full px-5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              style={{ backgroundColor: accent, color: ink }}
            >
              {copy.button}
            </button>
          </form>
        )}
        <p className="mt-3 type-caption text-[var(--text-muted)]">
          {copy.micro}{' '}
          <a
            href={privacyHref}
            className="underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            {privacyLabel}
          </a>
        </p>
      </div>
    </section>
  )
}
