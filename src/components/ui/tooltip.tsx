'use client'

import type { ReactNode } from 'react'
import {
  StyledAnimatedTooltip,
  type AnimatedTooltipPlacement,
} from '@/components/ui/smoothui/animated-tooltip/styled'

type AppTooltipProps = {
  children: ReactNode
  content: ReactNode
  delay?: number
  placement?: AnimatedTooltipPlacement
  className?: string
}

/** SmoothUI Animated Tooltip — keyboard-focusable wrapper for abbreviated controls. */
export function AppTooltip({
  children,
  content,
  delay = 280,
  placement = 'bottom',
  className,
}: AppTooltipProps) {
  return (
    <StyledAnimatedTooltip
      content={content}
      delay={delay}
      placement={placement}
      className={className}
    >
      {children}
    </StyledAnimatedTooltip>
  )
}

export type { AnimatedTooltipPlacement }
