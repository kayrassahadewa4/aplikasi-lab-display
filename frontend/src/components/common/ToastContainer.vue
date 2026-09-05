<script setup lang="ts">
import { ref, watch } from 'vue'
import ToastNotification, { type Toast } from './ToastNotification.vue'

const toasts = ref<Toast[]>([])

const add = (toast: Omit<Toast, 'id'>) => {
  const id = `toast-${Date.now()}-${Math.random()}`
  const newToast: Toast = { id, ...toast }
  toasts.value.push(newToast)

  // Auto-remove after duration
  if (toast.duration !== 0) {
    const duration = toast.duration || 5000
    setTimeout(() => {
      remove(id)
    }, duration)
  }
}

const remove = (id: string) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

defineExpose({ add, remove })
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <TransitionGroup name="toast">
        <ToastNotification
          v-for="toast in toasts"
          :key="toast.id"
          :toast="toast"
          @close="remove"
        />
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
