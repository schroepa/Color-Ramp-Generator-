import { Toaster as Sonner, type ToasterProps } from 'sonner'

/**
 * Sonner toaster — Tintfield tokens, bottom-left so it stays clear of the scales column.
 */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="bottom-left"
      gap={8}
      offset={{ bottom: '5.5rem', left: '1rem' }}
      toastOptions={{
        classNames: {
          toast:
            'type-label !rounded-full !border-[var(--line)] !bg-[var(--pill)] !text-[var(--text)] !shadow-[var(--material-shadow)]',
          success: '!text-[var(--text)]',
          error: '!text-[var(--text)]',
          title: 'type-label',
          description: 'type-caption !text-[var(--text-muted)]',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
