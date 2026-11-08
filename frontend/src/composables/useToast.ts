import { ref } from 'vue'
import type { Toast } from '@/components/common/ToastNotification.vue'

// Shared module-level reactive toasts array
const toasts = ref<Toast[]>([])

export function useToast() {
  const add = (toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const duration = toast.duration !== undefined ? toast.duration : 4500
    const newToast: Toast = { id, ...toast, duration }
    toasts.value.push(newToast)

    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }
    return id
  }

  const remove = (id: string) => {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const clear = () => {
    toasts.value = []
  }

  const success = (message: string, title?: string, duration?: number) => {
    return add({
      type: 'success',
      title,
      message,
      duration,
    })
  }

  const error = (message: string, title?: string, duration?: number) => {
    return add({
      type: 'error',
      title,
      message,
      duration,
    })
  }

  const warning = (message: string, title?: string, duration?: number) => {
    return add({
      type: 'warning',
      title,
      message,
      duration,
    })
  }

  const info = (message: string, title?: string, duration?: number) => {
    return add({
      type: 'info',
      title,
      message,
      duration,
    })
  }

  return {
    toasts,
    add,
    remove,
    clear,
    success,
    error,
    warning,
    info,
  }
}
