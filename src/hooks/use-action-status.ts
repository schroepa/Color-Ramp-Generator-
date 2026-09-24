import { useCallback, useEffect, useRef, useState } from 'react'

export type ActionStatusState = {
  id: number
  message: string
} | null

/** Single-slot status: replaces the previous message; never stacks. */
export function useActionStatus(durationMs = 1600) {
  const [status, setStatus] = useState<ActionStatusState>(null)
  const timeoutRef = useRef<number | null>(null)
  const idRef = useRef(0)

  const clear = useCallback(() => {
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setStatus(null)
  }, [])

  const announce = useCallback(
    (message: string) => {
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current)
      }
      idRef.current += 1
      setStatus({ id: idRef.current, message })
      timeoutRef.current = window.setTimeout(() => {
        setStatus(null)
        timeoutRef.current = null
      }, durationMs)
    },
    [durationMs],
  )

  useEffect(
    () => () => {
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current)
      }
    },
    [],
  )

  return { status, announce, clear }
}
