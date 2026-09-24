'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Liquid } from 'liquid-gooey'
import { cn } from '@/lib/utils'

/**
 * SmoothButton (SmoothUI) — restyled with Tintfield design tokens and
 * liquid-gooey surface morph for hover / press / focus-visible / disabled.
 *
 * Brand tokens from SmoothUI registry (`--color-brand`, smooth ramp) are
 * intentionally not used; fills come from `--primary` / `--pill`.
 */
const smoothButtonVariants = cva(
  'type-label relative z-10 inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0',
  {
    defaultVariants: {
      shape: 'pill',
      size: 'default',
      variant: 'default',
    },
    variants: {
      shape: {
        default: 'rounded-[var(--radius-md)]',
        pill: 'rounded-full',
        square: 'rounded-none',
      },
      size: {
        default: 'h-9 min-h-8 px-4',
        sm: 'h-8 min-h-8 min-w-8 px-3',
        lg: 'h-10 px-5',
        icon: 'size-8 min-h-8 min-w-8',
        xs: 'h-7 min-h-7 px-2.5',
        'icon-sm': 'size-8 min-h-8 min-w-8',
        'icon-lg': 'size-10 min-h-10 min-w-10',
      },
      variant: {
        default: 'text-[var(--primary-ink)]',
        secondary: 'text-[var(--text)] hover:text-[var(--text)]',
        ghost: 'text-[var(--text-muted)] hover:text-[var(--text)]',
        outline: 'text-[var(--text-muted)] hover:text-[var(--text)]',
        soft: 'text-[var(--text)] hover:text-[var(--text)]',
        solid: 'text-[var(--primary-ink)]',
        link: 'text-[var(--text-muted)] underline-offset-4 hover:underline',
        candy: 'text-[var(--primary-ink)]',
        destructive: 'text-[var(--text-muted)] hover:text-[var(--text)]',
      },
    },
  },
)

type ButtonVariant = NonNullable<VariantProps<typeof smoothButtonVariants>['variant']>

/**
 * Opaque fills for the liquid silhouette (goo needs solid color).
 * Quiet variants use a chip-faint mix — still animates, never matches
 * primary / pill weight used by Export, Add, Copy.
 */
const liquidFill: Record<ButtonVariant, string> = {
  default: 'var(--primary)',
  secondary: 'var(--pill)',
  ghost: 'color-mix(in oklab, var(--text) 8%, var(--bg))',
  outline: 'var(--pill)',
  soft: 'var(--pill)',
  solid: 'var(--primary)',
  link: 'transparent',
  candy: 'var(--primary)',
  destructive: 'color-mix(in oklab, var(--text) 8%, var(--bg))',
}

type LiquidMotion = {
  scale: number
  transition: 'snappy' | 'bouncy'
  bind: {
    onPointerEnter: React.PointerEventHandler
    onPointerLeave: React.PointerEventHandler
    onPointerDown: React.PointerEventHandler
    onPointerUp: React.PointerEventHandler
    onPointerCancel: React.PointerEventHandler
    onKeyDown: React.KeyboardEventHandler
    onKeyUp: React.KeyboardEventHandler
    onFocus: React.FocusEventHandler
    onBlur: React.FocusEventHandler
  }
}

function useLiquidMotion(disabled?: boolean): LiquidMotion {
  const [hovered, setHovered] = React.useState(false)
  const [pressed, setPressed] = React.useState(false)
  const [focused, setFocused] = React.useState(false)

  React.useEffect(() => {
    if (!disabled) return
    setHovered(false)
    setPressed(false)
    setFocused(false)
  }, [disabled])

  const scale = disabled ? 1 : pressed ? 0.97 : hovered || focused ? 1.04 : 1
  const transition = pressed ? 'snappy' : 'bouncy'

  return {
    scale,
    transition,
    bind: {
      onPointerEnter: () => {
        if (!disabled) setHovered(true)
      },
      onPointerLeave: () => {
        setHovered(false)
        setPressed(false)
      },
      onPointerDown: (event) => {
        if (!disabled && event.button === 0) setPressed(true)
      },
      onPointerUp: () => setPressed(false),
      onPointerCancel: () => setPressed(false),
      onKeyDown: (event) => {
        if (disabled) return
        if (event.key === 'Enter' || event.key === ' ') setPressed(true)
      },
      onKeyUp: (event) => {
        if (event.key === 'Enter' || event.key === ' ') setPressed(false)
      },
      onFocus: (event) => {
        if (!disabled && event.currentTarget.matches(':focus-visible')) {
          setFocused(true)
        }
      },
      onBlur: () => {
        setPressed(false)
        setFocused(false)
      },
    },
  }
}

function composeHandler<E>(
  ours: ((event: E) => void) | undefined,
  theirs: ((event: E) => void) | undefined,
) {
  return (event: E) => {
    ours?.(event)
    theirs?.(event)
  }
}

export type SmoothButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'prefix' | 'color'
> &
  VariantProps<typeof smoothButtonVariants> & {
    asChild?: boolean
    /** Show a spinner that morphs the button width without layout jump. */
    loading?: boolean
    /** Content before the label (icon, Kbd…). */
    prefix?: React.ReactNode
    /** Content after the label. */
    suffix?: React.ReactNode
  }

const Spinner = () => (
  <svg
    aria-hidden="true"
    className="size-[1em] animate-spin"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="3"
    />
    <path
      className="opacity-90"
      d="M12 2a10 10 0 0 1 10 10"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="3"
    />
  </svg>
)

const SmoothButton = React.forwardRef<HTMLButtonElement, SmoothButtonProps>(
  (
    {
      className,
      variant = 'default',
      size,
      shape = 'pill',
      asChild = false,
      loading = false,
      prefix,
      suffix,
      disabled,
      children,
      onPointerEnter,
      onPointerLeave,
      onPointerDown,
      onPointerUp,
      onPointerCancel,
      onKeyDown,
      onKeyUp,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const shouldReduceMotion = useReducedMotion()
    const Comp = asChild ? Slot : 'button'
    const resolvedVariant = (variant ?? 'default') as ButtonVariant
    const isDisabled = Boolean(disabled || loading)
    const { scale, transition, bind } = useLiquidMotion(isDisabled)
    const skipLiquid = resolvedVariant === 'link' || asChild
    /** Idle scale when reduced-motion or disabled — no hover swell / press squash. */
    const liquidScale = shouldReduceMotion || isDisabled ? 1 : scale

    const classes = cn(
      smoothButtonVariants({
        className,
        shape,
        size,
        variant: resolvedVariant,
      }),
    )

    const control = (
      <Comp
        className={classes}
        ref={ref}
        disabled={asChild ? undefined : isDisabled}
        aria-busy={loading || undefined}
        type={asChild ? undefined : (props.type ?? 'button')}
        onPointerEnter={composeHandler(bind.onPointerEnter, onPointerEnter)}
        onPointerLeave={composeHandler(bind.onPointerLeave, onPointerLeave)}
        onPointerDown={composeHandler(bind.onPointerDown, onPointerDown)}
        onPointerUp={composeHandler(bind.onPointerUp, onPointerUp)}
        onPointerCancel={composeHandler(bind.onPointerCancel, onPointerCancel)}
        onKeyDown={composeHandler(bind.onKeyDown, onKeyDown)}
        onKeyUp={composeHandler(bind.onKeyUp, onKeyUp)}
        onFocus={composeHandler(bind.onFocus, onFocus)}
        onBlur={composeHandler(bind.onBlur, onBlur)}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            <AnimatePresence initial={false}>
              {loading ? (
                <motion.span
                  animate={{ marginRight: '0.5rem', opacity: 1, width: '1em' }}
                  className="inline-flex shrink-0 items-center justify-center overflow-hidden"
                  exit={{ marginRight: 0, opacity: 0, width: 0 }}
                  initial={
                    shouldReduceMotion
                      ? { marginRight: '0.5rem', opacity: 1, width: '1em' }
                      : { marginRight: 0, opacity: 0, width: 0 }
                  }
                  key="spinner"
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { bounce: 0.1, duration: 0.25, type: 'spring' }
                  }
                >
                  <Spinner />
                </motion.span>
              ) : null}
            </AnimatePresence>
            {prefix}
            {children}
            {suffix}
          </>
        )}
      </Comp>
    )

    if (skipLiquid) {
      return control
    }

    return (
      <Liquid
        blur={6}
        contrast={18}
        fill={liquidFill[resolvedVariant]}
        filterPadding={16}
        className={cn(
          'relative inline-flex shrink-0 [&_[data-gooey-svg]]:pointer-events-none',
          isDisabled && 'pointer-events-none opacity-40',
        )}
      >
        <Liquid.Item
          scale={liquidScale}
          transition={shouldReduceMotion ? 'snappy' : transition}
          morph={
            shouldReduceMotion
              ? { shape: false, contentBlur: 0, bounce: 0 }
              : { shape: true, contentBlur: 0, bounce: 0.35 }
          }
        >
          {control}
        </Liquid.Item>
      </Liquid>
    )
  },
)
SmoothButton.displayName = 'SmoothButton'

export default SmoothButton
export { SmoothButton, smoothButtonVariants, useLiquidMotion }
