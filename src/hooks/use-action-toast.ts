import { toast as sonnerToast } from 'sonner'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

/** Thin announce API over Sonner — single call site for action feedback. */
export function useActionToast() {
  const announce = (message: string, type: ToastType = 'success') => {
    if (type === 'error') {
      sonnerToast.error(message)
      return
    }
    if (type === 'warning') {
      sonnerToast.warning(message)
      return
    }
    if (type === 'info') {
      sonnerToast.info(message)
      return
    }
    sonnerToast.success(message)
  }

  const clear = () => {
    sonnerToast.dismiss()
  }

  return { announce, clear }
}
