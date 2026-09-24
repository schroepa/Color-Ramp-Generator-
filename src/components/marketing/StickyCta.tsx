'use client'

import { useEffect, useState } from 'react'

type Props = {
  label: string
  href: string
  accent: string
  ink: string
}

export function StickyCta({ label, href, accent, ink }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const hero = document.getElementById('hero-open')
    const footer = document.getElementById('site-footer')
    if (!hero) return

    const io = new IntersectionObserver(
      (entries) => {
        const heroEntry = entries.find((e) => e.target === hero)
        const footerEntry = entries.find((e) => e.target === footer)
        const heroOut = heroEntry ? !heroEntry.isIntersecting : false
        const footerIn = footerEntry?.isIntersecting ?? false
        setVisible(heroOut && !footerIn)
      },
      { threshold: 0 },
    )
    io.observe(hero)
    if (footer) io.observe(footer)
    return () => io.disconnect()
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--bg)] p-3 tablet:hidden">
      <a
        href={href}
        className="type-label flex h-[52px] min-h-11 w-full items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        style={{ backgroundColor: accent, color: ink }}
      >
        {label}
      </a>
    </div>
  )
}
