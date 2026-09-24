import { useCallback, useRef, useState } from 'react'
import type { ToastType } from '@/components/ui/smoothui/basic-toast'

export type ActionToastState = {
  id: number
  message: string
  type: ToastType
} | null

/** Single-slot toast state — never stacks; Basic Toast owns auto-dismiss. */
export function useActionToast() {
  const [toast, setToast] = useState<ActionToastState>(null)
  const idRef = useRef(0)

  const clear = useCallback(() => {
    setToast(null)
  }, [])

  const announce = useCallback((message: string, type: ToastType = 'success') => {
    idRef.current += 1
    setToast({ id: idRef.current, message, type })
  }, [])

  return { toast, announce, clear }
}
