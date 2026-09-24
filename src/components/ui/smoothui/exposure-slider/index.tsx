'use client'

import { cn } from '@/lib/utils'
import {
  type MotionValue,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react'
import { useCallback, useRef } from 'react'

export interface ExposureSliderProps {
  id?: string
  label?: string
  className?: string
  value: number
  min?: number
  max?: number
  step?: number
  /** Shown beside the ticker. */
  display: string
  onChange?: (value: number) => void
}

const NOTCH_WIDTH = 13
const SPRING_CONFIG = { damping: 30, mass: 0.5, stiffness: 300 }

function decimalsFor(step: number): number {
  const text = String(step)
  return text.includes('.') ? text.split('.')[1]!.length : 0
}

function snap(value: number, min: number, max: number, step: number): number {
  const index = Math.round((value - min) / step)
  const count = Math.floor((max - min) / step) + 1
  const clamped = Math.min(count - 1, Math.max(0, index))
  return Number((min + clamped * step).toFixed(decimalsFor(step)))
}

/**
 * SmoothUI Exposure Slider, restyled for Tintfield.
 * The readout sits beside the ticker, not in a ring above it.
 */
export default function ExposureSlider({
  id,
  label,
  className,
  value,
  min = 0,
  max = 1,
  step = 1,
  display,
  onChange,
}: ExposureSliderProps) {
  const shouldReduceMotion = useReducedMotion()
  const isDragging = useRef(false)
  const rawX = useMotionValue(0)
  const springX = useSpring(rawX, SPRING_CONFIG)
  const x = shouldReduceMotion ? rawX : springX

  const count = Math.floor((max - min) / step) + 1
  const centerIndex = Math.round((value - min) / step)

  const valueFromOffset = useCallback(
    (offset: number) => {
      const indexOffset = Math.round(-offset / NOTCH_WIDTH)
      const index = Math.min(count - 1, Math.max(0, centerIndex + indexOffset))
      return snap(min + index * step, min, max, step)
    },
    [centerIndex, count, min, max, step],
  )

  const snapToNearest = useCallback(() => {
    rawX.set(Math.round(rawX.get() / NOTCH_WIDTH) * NOTCH_WIDTH)
  }, [rawX])

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      isDragging.current = true
      const startX = event.clientX
      const startOffset = rawX.get()
      const maxOffset = (count - 1 - centerIndex) * NOTCH_WIDTH
      const minOffset = -centerIndex * NOTCH_WIDTH

      const handleMove = (moveEvent: PointerEvent) => {
        const next = startOffset + (moveEvent.clientX - startX)
        rawX.set(Math.max(-maxOffset, Math.min(-minOffset, next)))
      }

      const handleUp = () => {
        isDragging.current = false
        snapToNearest()
        onChange?.(valueFromOffset(rawX.get()))
        rawX.set(0)
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', handleUp)
      }

      window.addEventListener('pointermove', handleMove)
      window.addEventListener('pointerup', handleUp)
    },
    [rawX, centerIndex, count, onChange, snapToNearest, valueFromOffset],
  )

  const nudge = (direction: -1 | 1) => {
    onChange?.(snap(value + direction * step, min, max, step))
  }

  return (
    <div className={cn('flex w-full min-w-0 flex-1 items-center gap-2 tablet:gap-3', className)}>
      <div
        id={id}
        role="slider"
        tabIndex={0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
        aria-valuetext={display}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
            event.preventDefault()
            nudge(1)
          } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
            event.preventDefault()
            nudge(-1)
          }
        }}
        className="relative h-8 min-w-0 flex-1 cursor-grab overflow-hidden rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:cursor-grabbing"
        style={{
          maskImage:
            'linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)',
          color: 'var(--text-muted)',
          ['--es-accent' as string]: 'var(--text)',
        }}
        onPointerDown={handlePointerDown}
      >
        <div className="absolute inset-0 select-none" style={{ touchAction: 'pan-y' }}>
          <motion.ul
            className="absolute top-0 m-0 flex h-full list-none items-center p-0"
            style={{ left: '50%', marginLeft: -(centerIndex * NOTCH_WIDTH + NOTCH_WIDTH / 2), x }}
          >
            {Array.from({ length: count }, (_, index) => (
              <Notch key={index} centerIndex={centerIndex} index={index} x={x} />
            ))}
          </motion.ul>
        </div>
      </div>
      <span className="type-mono w-12 shrink-0 text-right text-[var(--text)] tabular-nums">
        {display}
      </span>
    </div>
  )
}

function Notch({
  index,
  centerIndex,
  x,
}: {
  index: number
  centerIndex: number
  x: MotionValue<number>
}) {
  const distance = useTransform(x, (latest) => {
    const currentCenter = centerIndex + -latest / NOTCH_WIDTH
    return Math.abs(index - currentCenter)
  })
  const opacity = useTransform(distance, [0, 1, 3], [1, 0.55, 0.28])
  const clipTop = useTransform(distance, [0, 1, 2], [0, 28, 48])
  const clipPath = useTransform(clipTop, (amount) => `inset(${amount}% 0px 0px)`)
  const isCenter = useTransform(distance, (amount) => amount < 0.5)
  const backgroundColor = useTransform(isCenter, (center) =>
    center ? 'var(--es-accent)' : 'currentColor',
  )

  return (
    <li className="relative shrink-0 grow-0" style={{ height: 'fit-content' }}>
      <div style={{ padding: '0 5px' }}>
        <motion.div
          className="rounded-sm"
          style={{
            backgroundColor,
            clipPath,
            height: 22,
            opacity,
            width: 3,
          }}
        />
      </div>
    </li>
  )
}
