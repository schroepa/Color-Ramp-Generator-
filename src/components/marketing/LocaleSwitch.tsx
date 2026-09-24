'use client'

import { useEffect, useState } from 'react'
import type { Locale } from '@/i18n/copy'
import { withBase } from '@/i18n/copy'

const LOCALE_KEY = 'tintfield.locale.v1'

type Props = {
  locale: Locale
  pathEn: string
  pathDe: string
}

export function LocaleSwitch({ locale, pathEn, pathDe }: Props) {
  function go(next: Locale) {
    try {
      localStorage.setItem(LOCALE_KEY, next)
    } catch {
      /* ignore */
    }
    window.location.href = withBase(next === 'de' ? pathDe : pathEn)
  }

  return (
    <div
      className="flex items-center gap-1 type-label text-[var(--text-muted)]"
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        className={`min-h-11 min-w-11 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
          locale === 'en' ? 'text-[var(--text)]' : ''
        }`}
        aria-current={locale === 'en' ? 'true' : undefined}
        onClick={() => go('en')}
      >
        EN
      </button>
      <span aria-hidden>|</span>
      <button
        type="button"
        className={`min-h-11 min-w-11 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
          locale === 'de' ? 'text-[var(--text)]' : ''
        }`}
        aria-current={locale === 'de' ? 'true' : undefined}
        onClick={() => go('de')}
      >
        DE
      </button>
    </div>
  )
}

export function DeHint({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!show) return
    try {
      if (localStorage.getItem('tintfield.de-hint.v1')) return
      const lang = navigator.language?.toLowerCase() ?? ''
      if (lang.startsWith('de')) {
        setVisible(true)
      }
    } catch {
      /* ignore */
    }
  }, [show])

  if (!visible) return null

  return (
    <div className="border-b border-[var(--line)] bg-[var(--chip)] px-4 py-2 text-center type-caption text-[var(--text)]">
      <a
        href={withBase('/de/')}
        className="underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        onClick={() => {
          try {
            localStorage.setItem('tintfield.de-hint.v1', '1')
            localStorage.setItem(LOCALE_KEY, 'de')
          } catch {
            /* ignore */
          }
        }}
      >
        Diese Seite gibt es auch auf Deutsch.
      </a>
      <button
        type="button"
        className="ml-3 min-h-8 text-[var(--text-muted)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        aria-label="Dismiss"
        onClick={() => {
          setVisible(false)
          try {
            localStorage.setItem('tintfield.de-hint.v1', '1')
          } catch {
            /* ignore */
          }
        }}
      >
        ×
      </button>
    </div>
  )
}
