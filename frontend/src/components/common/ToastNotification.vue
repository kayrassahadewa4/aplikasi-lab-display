<script setup lang="ts">
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-vue-next'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
}

interface Props {
  toast: Toast
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: [id: string]
}>()

const iconConfig = {
  success: { component: CheckCircle, class: 'text-green-500' },
  error: { component: AlertCircle, class: 'text-red-500' },
  warning: { component: AlertTriangle, class: 'text-yellow-500' },
  info: { component: Info, class: 'text-blue-500' },
}

const bgClasses = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  warning: 'bg-yellow-50 border-yellow-200',
  info: 'bg-blue-50 border-blue-200',
}

const close = () => {
  emit('close', props.toast.id)
}
</script>

<template>
  <div
    :class="[
      'flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-md',
      bgClasses[toast.type],
    ]"
  >
    <!-- Icon -->
    <component :is="iconConfig[toast.type].component" :size="20" :class="iconConfig[toast.type].class" />

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <h4 v-if="toast.title" class="font-semibold text-gray-900 mb-1">{{ toast.title }}</h4>
      <p class="text-sm text-gray-700">{{ toast.message }}</p>
    </div>

    <!-- Close Button -->
    <button
      @click="close"
      class="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
      aria-label="Close"
    >
      <X :size="18" />
    </button>
  </div>
</template>
