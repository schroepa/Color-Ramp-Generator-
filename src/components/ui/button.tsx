import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Liquid } from 'liquid-gooey'
import { useReducedMotion } from 'motion/react'
import { composeHandler, useLiquidMotion } from '@/lib/liquid-motion'
import { cn } from '@/lib/utils'

/**
 * shadcn Button + Tintfield tokens + liquid-gooey surface morph.
 * Transparent control; silhouette fill comes from liquidFill.
 */
const buttonVariants = cva(
  'type-label relative z-10 inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0',
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: 'h-9 min-h-8 px-4',
        sm: 'h-8 min-h-8 min-w-8 px-3',
        lg: 'h-10 px-5',
        icon: 'size-8 min-h-8 min-w-8',
        'icon-sm': 'size-8 min-h-8 min-w-8',
        'icon-lg': 'size-10 min-h-10 min-w-10',
      },
      variant: {
        default: 'text-[var(--primary-ink)]',
        secondary: 'text-[var(--text)] hover:text-[var(--text)]',
        ghost: 'text-[var(--text-muted)] hover:text-[var(--text)]',
        outline: 'text-[var(--text-muted)] hover:text-[var(--text)]',
        destructive: 'text-[var(--text-muted)] hover:text-[var(--text)]',
        link: 'text-[var(--text-muted)] underline-offset-4 hover:underline',
      },
    },
  },
)

type ButtonVariant = NonVariantDefault<VariantProps<typeof buttonVariants>['variant']>

type NonVariantDefault<T> = Exclude<T, null | undefined>

/** Opaque fills for the liquid silhouette (goo needs solid color). */
const liquidFill: Record<ButtonVariant, string> = {
  default: 'var(--primary)',
  secondary: 'var(--pill)',
  ghost: 'color-mix(in oklab, var(--text) 8%, var(--bg))',
  outline: 'var(--pill)',
  destructive: 'color-mix(in oklab, var(--text) 8%, var(--bg))',
  link: 'transparent',
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      asChild = false,
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
    const isDisabled = Boolean(disabled)
    const { scale, transition, bind } = useLiquidMotion(isDisabled)
    const skipLiquid = resolvedVariant === 'link' || asChild
    const liquidScale = shouldReduceMotion || isDisabled ? 1 : scale

    const control = (
      <Comp
        className={cn(buttonVariants({ variant: resolvedVariant, size, className }))}
        ref={ref}
        disabled={asChild ? undefined : isDisabled}
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
        {children}
      </Comp>
    )

    if (skipLiquid) return control

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
Button.displayName = 'Button'

export { Button, buttonVariants }
