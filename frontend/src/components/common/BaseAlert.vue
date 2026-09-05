<script setup lang="ts">
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-vue-next'

interface Props {
  type?: 'success' | 'danger' | 'warning' | 'info'
  title?: string
  dismissible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  dismissible: false,
})

const emit = defineEmits<{
  dismiss: []
}>()

const iconConfig = {
  success: { component: CheckCircle, class: 'text-green-500' },
  danger: { component: AlertCircle, class: 'text-red-500' },
  warning: { component: AlertTriangle, class: 'text-yellow-500' },
  info: { component: Info, class: 'text-blue-500' },
}

const bgClasses = {
  success: 'bg-green-50 border-green-200',
  danger: 'bg-red-50 border-red-200',
  warning: 'bg-yellow-50 border-yellow-200',
  info: 'bg-blue-50 border-blue-200',
}

const handleDismiss = () => {
  emit('dismiss')
}
</script>

<template>
  <div
    :class="[
      'flex items-start gap-3 p-4 rounded-lg border',
      bgClasses[type],
    ]"
  >
    <!-- Icon -->
    <component :is="iconConfig[type].component" :size="20" :class="iconConfig[type].class" />

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <h4 v-if="title" class="font-semibold text-gray-900 mb-1">{{ title }}</h4>
      <div class="text-sm text-gray-700">
        <slot />
      </div>
    </div>

    <!-- Dismiss Button -->
    <button
      v-if="dismissible"
      @click="handleDismiss"
      class="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
      aria-label="Dismiss"
    >
      <X :size="18" />
    </button>
  </div>
</template>
