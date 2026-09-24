'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SystemSwitch } from '@/components/SystemSwitch'
import { contrastAgainstWhiteAndBlack } from '@/lib/contrast'
import type { ColorSystem } from '@/lib/color-system'
import { normalizeHex } from '@/lib/color-system'
import { cn } from '@/lib/utils'

type MobileScaleDetailProps = {
  name: string
  baseColor: string
  system: ColorSystem
  colors: string[]
  stepKeys: string[]
  baseIndex: number
  onBack: () => void
  onChange: (patch: {
    name?: string
    baseColor?: string
    system?: ColorSystem
  }) => void
  onCopyHex: (hex: string) => void
  onInspect: (stepIndex: number) => void
  onDelete: () => void
}

/**
 * Full-screen mobile scale drill-down (concept §6.3).
 * Browser back works via history.pushState from the parent.
 */
export function MobileScaleDetail({
  name,
  baseColor,
  system,
  colors,
  stepKeys,
  baseIndex,
  onBack,
  onChange,
  onCopyHex,
  onInspect,
  onDelete,
}: MobileScaleDetailProps) {
  const [draftName, setDraftName] = useState(name)
  const [hex, setHex] = useState(baseColor)
  const listRef = useRef<HTMLUListElement>(null)
  const [visibleIndex, setVisibleIndex] = useState(baseIndex)

  useEffect(() => {
    setDraftName(name)
  }, [name])

  useEffect(() => {
    setHex(baseColor)
  }, [baseColor])

  useEffect(() => {
    const root = listRef.current
    if (!root) return
    const items = [...root.querySelectorAll<HTMLElement>('[data-step-index]')]
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!visible) return
        const idx = Number(visible.target.getAttribute('data-step-index'))
        if (Number.isFinite(idx)) setVisibleIndex(idx)
      },
      { root: null, threshold: [0.4, 0.6] },
    )
    items.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [colors.length])

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[var(--bg)] text-[var(--text)] tablet:hidden">
      <header className="sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--bg)] pt-[env(safe-area-inset-top)]">
        <div className="flex h-14 items-center gap-2 px-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Back"
            onClick={onBack}
          >
            <ArrowLeft />
          </Button>
          <input
            value={draftName}
            onChange={(event) => {
              setDraftName(event.target.value)
              onChange({ name: event.target.value })
            }}
            aria-label="Scale name"
            className="type-heading min-w-0 flex-1 bg-transparent outline-none"
            placeholder="Scale name"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="Scale actions">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={onDelete}
                className="text-[var(--text-muted)]"
              >
                Delete scale
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Sticky mini strip with position marker */}
        <div className="relative px-3 pb-3">
          <div
            className="flex h-4 w-full overflow-hidden rounded-full"
            role="group"
            aria-label="Scale overview"
          >
            {colors.map((color, index) => (
              <button
                key={stepKeys[index] ?? index}
                type="button"
                className="min-w-0 flex-1 border-0 p-0"
                style={{ backgroundColor: color }}
                aria-label={`Jump to ${stepKeys[index]}`}
                onClick={() => {
                  document
                    .getElementById(`mobile-step-${index}`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }}
              />
            ))}
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-1 text-center text-[10px] leading-none text-[var(--text)]"
            style={{
              left: `${((visibleIndex + 0.5) / Math.max(colors.length, 1)) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            ▲
          </div>
        </div>
      </header>

      <div className="flex items-center gap-2 border-b border-[var(--line)] px-4 py-3">
        <label className="relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-[var(--radius-sm)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]">
          <input
            type="color"
            value={baseColor}
            onChange={(event) => onChange({ baseColor: event.target.value })}
            aria-label="Base color"
            className="absolute inset-0 size-[160%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 p-0"
          />
        </label>
        <input
          value={hex}
          onChange={(event) => {
            setHex(event.target.value)
            if (normalizeHex(event.target.value)) {
              onChange({ baseColor: event.target.value })
            }
          }}
          aria-label="HEX"
          className="h-10 w-[7.5rem] rounded-full bg-[var(--chip)] px-3 type-mono uppercase outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        />
        <SystemSwitch
          value={system}
          baseColor={baseColor}
          onValueChange={(next) => onChange({ system: next })}
        />
      </div>

      <ul
        ref={listRef}
        className="scrollbar-quiet min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2 pb-[env(safe-area-inset-bottom)]"
      >
        {colors.map((color, index) => {
          const step = stepKeys[index] ?? String(index)
          const isBase = index === baseIndex
          const contrast = contrastAgainstWhiteAndBlack(color)
          return (
            <li
              key={step}
              id={`mobile-step-${index}`}
              data-step-index={index}
              className={cn(
                'flex min-h-14 items-center gap-2 rounded-[var(--radius-md)] px-2',
                isBase && 'bg-[var(--chip)]',
              )}
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                onClick={() => onCopyHex(color)}
                aria-label={`Copy ${color.toUpperCase()}, step ${step}`}
              >
                <span
                  className="size-10 shrink-0 rounded-[var(--radius-sm)]"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-baseline gap-2">
                    <span className="type-label">{isBase ? 'Base' : step}</span>
                    <span className="type-mono truncate uppercase">
                      {color.toUpperCase()}
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-flex h-5 min-w-5 items-center justify-center rounded-sm px-0.5 type-caption font-[650]"
                      style={{ backgroundColor: color, color: '#fff' }}
                      aria-hidden
                    >
                      Aa
                    </span>
                    <span className="type-caption text-[var(--text-muted)]">
                      {contrast.onWhite.mark}
                    </span>
                    <span
                      className="inline-flex h-5 min-w-5 items-center justify-center rounded-sm px-0.5 type-caption font-[650]"
                      style={{ backgroundColor: color, color: '#000' }}
                      aria-hidden
                    >
                      Aa
                    </span>
                    <span className="type-caption text-[var(--text-muted)]">
                      {contrast.onBlack.mark}
                    </span>
                  </span>
                </span>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Inspect ${step}`}
                onClick={() => onInspect(index)}
              >
                <ChevronRight />
              </Button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
