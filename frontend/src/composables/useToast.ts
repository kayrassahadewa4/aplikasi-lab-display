import { ref } from 'vue'
import type { Toast } from '@/components/common/ToastNotification.vue'

// Global toast container reference
const toastContainer = ref<any>(null)

export function useToast() {
  const setContainer = (container: any) => {
    toastContainer.value = container
  }

  const show = (toast: Omit<Toast, 'id'>) => {
    if (!toastContainer.value) {
      console.warn('Toast container not initialized')
      return
    }
    toastContainer.value.add(toast)
  }

  const success = (message: string, title?: string, duration?: number) => {
    show({
      type: 'success',
      title,
      message,
      duration,
    })
  }

  const error = (message: string, title?: string, duration?: number) => {
    show({
      type: 'error',
      title,
      message,
      duration,
    })
  }

  const warning = (message: string, title?: string, duration?: number) => {
    show({
      type: 'warning',
      title,
      message,
      duration,
    })
  }

  const info = (message: string, title?: string, duration?: number) => {
    show({
      type: 'info',
      title,
      message,
      duration,
    })
  }

  return {
    setContainer,
    show,
    success,
    error,
    warning,
    info,
  }
}
