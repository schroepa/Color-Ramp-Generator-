import * as React from 'react'

export type LiquidMotion = {
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

/**
 * Hover swell (~1.04) / press squash (~0.97) for liquid-gooey hosts.
 * Respect disabled; focus only via :focus-visible.
 */
export function useLiquidMotion(disabled?: boolean): LiquidMotion {
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

export function composeHandler<E>(
  ours: ((event: E) => void) | undefined,
  theirs: ((event: E) => void) | undefined,
) {
  return (event: E) => {
    ours?.(event)
    theirs?.(event)
  }
}
