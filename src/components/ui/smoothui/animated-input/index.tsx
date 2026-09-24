'use client'

import { motion, useReducedMotion } from 'motion/react'
import { useId, useRef, useState, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const LABEL_TRANSITION = {
  duration: 0.22,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
}

export type AnimatedInputProps = {
  className?: string
  defaultValue?: string
  disabled?: boolean
  id?: string
  inputClassName?: string
  label: string
  labelClassName?: string
  onChange?: (value: string) => void
  placeholder?: string
  spellCheck?: boolean
  value?: string
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value' | 'defaultValue' | 'id' | 'disabled' | 'placeholder'
>

/**
 * SmoothUI Animated Input — restyled with Tintfield tokens for HEX / form fields.
 */
export default function AnimatedInput({
  value,
  defaultValue = '',
  onChange,
  label,
  placeholder = '',
  disabled = false,
  className = '',
  inputClassName = '',
  labelClassName = '',
  id,
  spellCheck = false,
  ...rest
}: AnimatedInputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const isControlled = value !== undefined
  const val = isControlled ? value : internalValue
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const isFloating = Boolean(val) || isFocused
  const shouldReduceMotion = useReducedMotion()
  const reactId = useId()
  const inputId = id ?? `animated-input-${reactId.replace(/:/g, '')}`

  return (
    <div className={cn('relative flex min-w-0 items-center pt-3', className)}>
      <input
        {...rest}
        id={inputId}
        ref={inputRef}
        aria-label={label}
        disabled={disabled}
        spellCheck={spellCheck}
        value={val}
        placeholder={isFloating ? placeholder : ''}
        onBlur={() => setIsFocused(false)}
        onFocus={() => setIsFocused(true)}
        onChange={(event) => {
          if (!isControlled) setInternalValue(event.target.value)
          onChange?.(event.target.value)
        }}
        className={cn(
          'type-mono peer h-9 min-h-8 w-full rounded-full bg-[var(--chip)] px-3.5 text-[var(--text)] uppercase outline-none',
          'focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
          'disabled:cursor-not-allowed disabled:opacity-40',
          inputClassName,
        )}
      />
      <motion.label
        htmlFor={inputId}
        animate={
          shouldReduceMotion
            ? undefined
            : isFloating
              ? { color: 'var(--text-muted)', scale: 0.92, y: -26 }
              : { color: 'var(--text-faint)', scale: 1, y: 0 }
        }
        className={cn(
          'type-label pointer-events-none absolute left-3.5 top-1/2 origin-left -translate-y-1/2',
          labelClassName,
        )}
        style={
          shouldReduceMotion
            ? {
                color: isFloating ? 'var(--text-muted)' : 'var(--text-faint)',
                transform: isFloating
                  ? 'translateY(-26px) scale(0.92)'
                  : 'translateY(0) scale(1)',
              }
            : undefined
        }
        transition={shouldReduceMotion ? { duration: 0 } : LABEL_TRANSITION}
      >
        {label}
      </motion.label>
    </div>
  )
}
