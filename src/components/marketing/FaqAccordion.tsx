'use client'

import { useState } from 'react'
import type { Copy } from '@/i18n/copy'

type Props = {
  faq: Copy['faq']
}

export function FaqAccordion({ faq }: Props) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section
      id="faq"
      className="mx-auto w-full max-w-3xl border-t border-[var(--line)] px-4 py-16 tablet:px-6"
    >
      <h2 className="type-title text-center text-[var(--text)]">{faq.title}</h2>
      <ul className="mt-8 divide-y divide-[var(--line)]">
        {faq.items.map((item, i) => {
          const isOpen = open === i
          return (
            <li key={item.q}>
              <button
                type="button"
                className="flex min-h-14 w-full items-center justify-between gap-4 py-3 text-left type-body outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                <span className="text-[var(--text)]">{item.q}</span>
                <span className="text-[var(--text-muted)]" aria-hidden>
                  {isOpen ? '−' : '+'}
                </span>
              </button>
              {isOpen ? (
                <p className="pb-4 type-body-sm text-[var(--text-muted)]">
                  {item.a}
                </p>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
