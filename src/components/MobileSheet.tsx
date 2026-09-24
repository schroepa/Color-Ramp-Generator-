'use client'

import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type MobileSheetProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  className?: string
  /** Cap sheet height (e.g. 55svh so ramps stay visible). */
  maxHeightClass?: string
}

/**
 * Lightweight bottom sheet for mobile generation controls.
 * Focus trap is minimal — Escape + backdrop close; body scroll locked while open.
 */
export function MobileSheet({
  open,
  title,
  onClose,
  children,
  className,
  maxHeightClass = 'max-h-[min(85svh,40rem)]',
}: MobileSheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div>
      <button
        type="button"
        aria-label="Close generation settings"
        className="fixed inset-0 z-50 bg-black/55"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 flex flex-col',
          maxHeightClass,
          'rounded-t-[var(--radius-lg)] border border-[var(--line)] border-b-0',
          'bg-[var(--bg)] shadow-[var(--material-shadow)]',
          'pb-[env(safe-area-inset-bottom)]',
          'desktop:inset-x-auto desktop:bottom-auto desktop:left-4 desktop:top-[4.5rem]',
          'desktop:max-h-[min(80svh,36rem)] desktop:w-[min(22rem,calc(100vw-2rem))]',
          'desktop:rounded-[var(--radius-lg)] desktop:border',
          className,
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3">
          <p className="type-heading text-[var(--text)]">{title}</p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close"
            onClick={onClose}
          >
            <X />
          </Button>
        </div>
        <div className="scrollbar-quiet min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}
