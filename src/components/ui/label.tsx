import { cn } from '@/lib/utils'
import type { LabelHTMLAttributes } from 'react'

/** Compact field label for the app form density. */
export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('type-label text-[var(--text-muted)]', className)}
      {...props}
    />
  )
}
