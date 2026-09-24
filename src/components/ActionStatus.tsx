import type { ActionStatusState } from '@/hooks/use-action-status'
import { cn } from '@/lib/utils'

type ActionStatusProps = {
  status: ActionStatusState
  className?: string
}

/** Quiet, single-slot status pill. Always one live region — no stacked toasts. */
export function ActionStatus({ status, className }: ActionStatusProps) {
  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4',
        className,
      )}
    >
      <div
        key={status?.id ?? 'idle'}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          'type-label max-w-[min(100%,20rem)] truncate rounded-full bg-[var(--pill)] px-4 py-2 text-center text-white/90 shadow-[var(--material-shadow)]',
          'motion-safe:transition-opacity motion-safe:duration-[var(--duration-fast)] motion-safe:ease-[var(--ease-out)]',
          status ? 'opacity-100' : 'sr-only opacity-0',
        )}
      >
        {status?.message ?? ''}
      </div>
    </div>
  )
}
