'use client'

import { useCallback, useId } from 'react'
import { Liquid } from 'liquid-gooey'
import { useReducedMotion } from 'motion/react'
import { COLOR_SYSTEMS, type ColorSystem } from '@/lib/color-system'
import { useLiquidMotion } from '@/components/ui/smoothui/smooth-button'
import { cn } from '@/lib/utils'

type SystemSwitchProps = {
  value: ColorSystem
  onValueChange: (value: ColorSystem) => void
  label?: string
  className?: string
}

type SystemTabProps = {
  id: string
  label: string
  selected: boolean
  index: number
  onSelect: () => void
  onKeyDown: (event: React.KeyboardEvent, index: number) => void
}

/** Individual system tab — liquid hover swell / press squash like SmoothButton. */
function SystemTab({
  id,
  label,
  selected,
  index,
  onSelect,
  onKeyDown,
}: SystemTabProps) {
  const shouldReduceMotion = useReducedMotion()
  const { scale, transition, bind } = useLiquidMotion()
  const liquidScale = shouldReduceMotion ? 1 : scale

  return (
    <Liquid
      blur={6}
      contrast={18}
      fill="transparent"
      filterPadding={12}
      className="relative z-10 min-w-0 [&_[data-gooey-svg]]:pointer-events-none"
    >
      <Liquid.Item
        scale={liquidScale}
        transition={shouldReduceMotion ? 'snappy' : transition}
        morph={
          shouldReduceMotion
            ? { shape: false, contentBlur: 0, bounce: 0 }
            : { shape: true, contentBlur: 0, bounce: 0.3 }
        }
      >
        <button
          id={id}
          type="button"
          role="tab"
          aria-selected={selected}
          aria-label={label}
          tabIndex={selected ? 0 : -1}
          onClick={onSelect}
          onKeyDown={(event) => onKeyDown(event, index)}
          onPointerEnter={bind.onPointerEnter}
          onPointerLeave={bind.onPointerLeave}
          onPointerDown={bind.onPointerDown}
          onPointerUp={bind.onPointerUp}
          onPointerCancel={bind.onPointerCancel}
          onFocus={bind.onFocus}
          onBlur={bind.onBlur}
          className={cn(
            'type-label relative z-10 flex h-full min-h-8 w-full items-center justify-center rounded-full bg-transparent',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--card)]',
            selected ? 'text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]',
          )}
        >
          {label}
        </button>
      </Liquid.Item>
    </Liquid>
  )
}

/**
 * Segmented system control — SmoothUI Animated Tabs patterns (tablist + keyboard)
 * with Tintfield liquid-gooey Move trail on the selection pill and per-tab press/hover.
 */
export function SystemSwitch({
  value,
  onValueChange,
  label = 'Color system',
  className,
}: SystemSwitchProps) {
  const layoutId = useId()
  const index = Math.max(
    0,
    COLOR_SYSTEMS.findIndex((system) => system.value === value),
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, currentIndex: number) => {
      let next = currentIndex
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        next = (currentIndex + 1) % COLOR_SYSTEMS.length
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        next = (currentIndex - 1 + COLOR_SYSTEMS.length) % COLOR_SYSTEMS.length
      } else if (event.key === 'Home') {
        event.preventDefault()
        next = 0
      } else if (event.key === 'End') {
        event.preventDefault()
        next = COLOR_SYSTEMS.length - 1
      } else {
        return
      }
      const system = COLOR_SYSTEMS[next]
      if (!system) return
      onValueChange(system.value)
      document.getElementById(`${layoutId}-tab-${system.value}`)?.focus()
    },
    [layoutId, onValueChange],
  )

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        'relative grid h-9 w-full min-w-0 grid-cols-3 rounded-full bg-[var(--chip)] p-1',
        className,
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-1">
        <Liquid
          blur={6}
          contrast={18}
          fill="var(--pill)"
          shadow="0 2px 8px rgba(0,0,0,.22)"
          className="h-full w-full [&_[data-gooey-svg]]:pointer-events-none"
        >
          <Liquid.Item effect="move" move={{ springiness: 0.55, trail: 0.55, wobble: 0.4 }}>
            <div
              className="h-full rounded-full bg-transparent"
              style={{
                width: '33.333%',
                transform: `translateX(${index * 100}%)`,
              }}
            />
          </Liquid.Item>
        </Liquid>
      </div>
      {COLOR_SYSTEMS.map((system, i) => {
        const selected = system.value === value
        return (
          <SystemTab
            key={system.value}
            id={`${layoutId}-tab-${system.value}`}
            label={system.label}
            selected={selected}
            index={i}
            onSelect={() => onValueChange(system.value)}
            onKeyDown={handleKeyDown}
          />
        )
      })}
    </div>
  )
}
