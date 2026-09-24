import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type SurfaceProps = HTMLAttributes<HTMLElement> & {
  as?: 'section' | 'div' | 'article' | 'li'
  inset?: boolean
}

/**
 * App panel / card surface — SmoothUI-style content card pattern,
 * filled with Tintfield tokens (not glass/demo chrome).
 */
export function Surface({
  as: Comp = 'section',
  className,
  inset = false,
  ...props
}: SurfaceProps) {
  return (
    <Comp
      className={cn(
        'rounded-[var(--radius-xl)] bg-[var(--card)] shadow-[var(--material-shadow)]',
        inset ? 'p-3 tablet:p-4' : 'p-4 tablet:p-5',
        className,
      )}
      {...props}
    />
  )
}

export function Stage({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] bg-[var(--stage)] p-3 tablet:p-4',
        className,
      )}
      {...props}
    />
  )
}
