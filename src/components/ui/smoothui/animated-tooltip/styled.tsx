'use client'

import type { ReactNode } from 'react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

export type AnimatedTooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

const SPRING = {
  bounce: 0.1,
  duration: 0.25,
  type: 'spring' as const,
}

const placementStyles: Record<AnimatedTooltipPlacement, string> = {
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
}

const arrowStyles: Record<AnimatedTooltipPlacement, string> = {
  bottom:
    'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--pill)] border-x-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-[var(--pill)] border-y-transparent border-r-transparent',
  right:
    'right-full top-1/2 -translate-y-1/2 border-r-[var(--pill)] border-y-transparent border-l-transparent',
  top: 'top-full left-1/2 -translate-x-1/2 border-t-[var(--pill)] border-x-transparent border-b-transparent',
}

function getInitialTransform(placement: AnimatedTooltipPlacement) {
  const base = { opacity: 0, scale: 0.95, x: 0, y: 0 }
  switch (placement) {
    case 'top':
      return { ...base, y: 4 }
    case 'bottom':
      return { ...base, y: -4 }
    case 'left':
      return { ...base, x: 4 }
    case 'right':
      return { ...base, x: -4 }
  }
}

export type StyledAnimatedTooltipProps = {
  children: ReactNode
  content: ReactNode
  delay?: number
  placement?: AnimatedTooltipPlacement
  className?: string
}

/** SmoothUI Animated Tooltip restyled with Tintfield design tokens. */
export function StyledAnimatedTooltip({
  content,
  placement = 'bottom',
  delay = 280,
  children,
  className,
}: StyledAnimatedTooltipProps) {
  const shouldReduceMotion = useReducedMotion()
  const [isVisible, setIsVisible] = useState(false)
  const [isHoverDevice, setIsHoverDevice] = useState(false)
  const tooltipId = useId()
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
    setIsHoverDevice(mediaQuery.matches)
    const handleChange = (e: MediaQueryListEvent) => setIsHoverDevice(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(
    () => () => {
      if (delayTimerRef.current != null) clearTimeout(delayTimerRef.current)
    },
    [],
  )

  const show = useCallback(() => {
    if (delay > 0) {
      delayTimerRef.current = setTimeout(() => setIsVisible(true), delay)
    } else {
      setIsVisible(true)
    }
  }, [delay])

  const hide = useCallback(() => {
    if (delayTimerRef.current != null) {
      clearTimeout(delayTimerRef.current)
      delayTimerRef.current = null
    }
    setIsVisible(false)
  }, [])

  const initialTransform = getInitialTransform(placement)

  return (
    <span
      className="relative inline-flex"
      onBlur={hide}
      onFocus={show}
      onKeyDown={(event) => {
        if (event.key === 'Escape') hide()
      }}
      onMouseEnter={isHoverDevice ? show : undefined}
      onMouseLeave={isHoverDevice ? hide : undefined}
    >
      <span className="flex w-full min-w-0" aria-describedby={isVisible ? tooltipId : undefined}>
        {children}
      </span>
      <AnimatePresence>
        {isVisible ? (
          <motion.span
            id={tooltipId}
            role="tooltip"
            animate={
              shouldReduceMotion
                ? { opacity: 1 }
                : { opacity: 1, scale: 1, x: 0, y: 0 }
            }
            className={cn(
              'type-caption absolute z-50 w-max max-w-[min(100vw-1.5rem,16rem)] rounded-[var(--radius-md)] bg-[var(--pill)] px-2.5 py-1.5 text-[var(--text)] shadow-[var(--material-shadow)]',
              placementStyles[placement],
              className,
            )}
            exit={
              shouldReduceMotion
                ? { opacity: 0, transition: { duration: 0 } }
                : { ...initialTransform, transition: { duration: 0.15 } }
            }
            initial={shouldReduceMotion ? { opacity: 0 } : initialTransform}
            transition={shouldReduceMotion ? { duration: 0 } : SPRING}
          >
            {content}
            <span
              aria-hidden
              className={cn('absolute block h-0 w-0 border-4', arrowStyles[placement])}
            />
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  )
}
