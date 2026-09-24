'use client'

import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastProps {
  className?: string
  duration?: number
  isVisible?: boolean
  message: string
  onClose?: () => void
  type?: ToastType
}

const toastIcons = {
  error: <XCircle className="size-5 shrink-0 text-[#ff7b7b]" aria-hidden />,
  info: <Info className="size-5 shrink-0 text-[var(--accent)]" aria-hidden />,
  success: <CheckCircle className="size-5 shrink-0 text-[#6ee7a8]" aria-hidden />,
  warning: <AlertCircle className="size-5 shrink-0 text-[#f5c16c]" aria-hidden />,
}

const toastClasses: Record<ToastType, string> = {
  error:
    'border-[rgba(255,123,123,0.35)] bg-[var(--elevated)] text-[var(--text)] shadow-[var(--material-shadow)]',
  info: 'border-[color-mix(in_oklab,var(--accent)_40%,transparent)] bg-[var(--elevated)] text-[var(--text)] shadow-[var(--material-shadow)]',
  success:
    'border-[rgba(110,231,168,0.35)] bg-[var(--elevated)] text-[var(--text)] shadow-[var(--material-shadow)]',
  warning:
    'border-[rgba(245,193,108,0.35)] bg-[var(--elevated)] text-[var(--text)] shadow-[var(--material-shadow)]',
}

/**
 * SmoothUI Basic Toast — restyled with Tintfield tokens.
 * Single visible notification; portals to document.body.
 */
export default function BasicToast({
  message,
  type = 'info',
  duration = 3000,
  onClose,
  isVisible = true,
  className = '',
}: ToastProps) {
  const [visible, setVisible] = useState(isVisible)
  const [mounted, setMounted] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setVisible(isVisible)
  }, [isVisible])

  useEffect(() => {
    if (visible && duration > 0) {
      const timer = window.setTimeout(() => {
        setVisible(false)
        onClose?.()
      }, duration)
      return () => window.clearTimeout(timer)
    }
  }, [visible, duration, onClose])

  if (!mounted) {
    return null
  }

  const dismiss = () => {
    setVisible(false)
    onClose?.()
  }

  const toastContent = (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key={message}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          animate={
            shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }
          }
          className={cn(
            'pointer-events-auto fixed top-4 right-4 left-4 z-50 flex max-w-sm items-center gap-3 rounded-[var(--radius-lg)] border p-4 sm:left-auto sm:w-80',
            toastClasses[type],
            className,
          )}
          exit={
            shouldReduceMotion
              ? { opacity: 0, transition: { duration: 0 } }
              : {
                  opacity: 0,
                  scale: 0.92,
                  transition: { duration: 0.15 },
                  y: -8,
                }
          }
          initial={
            shouldReduceMotion
              ? { opacity: 1 }
              : { opacity: 0, scale: 0.92, y: -12 }
          }
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { bounce: 0.1, duration: 0.25, type: 'spring' as const }
          }
        >
          <div className="shrink-0">{toastIcons[type]}</div>
          <p className="type-body-sm flex-1 text-[var(--text)]">{message}</p>
          <button
            type="button"
            aria-label="Dismiss notification"
            className="shrink-0 cursor-pointer rounded-full p-1 text-[var(--text-muted)] outline-none transition-colors hover:bg-[var(--chip)] hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            onClick={dismiss}
          >
            <X className="size-4" aria-hidden />
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )

  return createPortal(toastContent, document.body)
}

export { BasicToast }
