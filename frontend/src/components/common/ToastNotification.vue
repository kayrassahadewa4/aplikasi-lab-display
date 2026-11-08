<script setup lang="ts">
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-vue-next'

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
  success: {
    component: CheckCircle2,
    iconColor: 'text-emerald-700',
    bgColor: 'bg-emerald-50 border-emerald-200/90',
    barColor: 'bg-emerald-600',
  },
  error: {
    component: AlertCircle,
    iconColor: 'text-red-700',
    bgColor: 'bg-red-50 border-red-200/90',
    barColor: 'bg-red-600',
  },
  warning: {
    component: AlertTriangle,
    iconColor: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200/90',
    barColor: 'bg-amber-500',
  },
  info: {
    component: Info,
    iconColor: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200/90',
    barColor: 'bg-blue-600',
  },
}

const close = () => {
  emit('close', props.toast.id)
}
</script>

<template>
  <div
    class="flex items-start gap-3.5 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-gray-200/90 shadow-xl shadow-black/10 relative overflow-hidden select-none transition-all duration-200"
  >
    <!-- Left Accent Indicator Bar -->
    <div
      :class="['absolute left-0 top-0 bottom-0 w-1.5', iconConfig[toast.type].barColor]"
    />

    <!-- Icon Badge -->
    <div
      :class="[
        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ml-1 shadow-2xs',
        iconConfig[toast.type].bgColor,
      ]"
    >
      <component
        :is="iconConfig[toast.type].component"
        :size="19"
        stroke-width="2.3"
        :class="iconConfig[toast.type].iconColor"
      />
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0 pr-1">
      <h4
        v-if="toast.title"
        class="font-black text-xs sm:text-sm text-text-primary tracking-tight leading-snug"
      >
        {{ toast.title }}
      </h4>
      <p class="text-xs text-text-secondary font-medium leading-relaxed mt-0.5">
        {{ toast.message }}
      </p>
    </div>

    <!-- Close Button -->
    <button
      @click="close"
      type="button"
      class="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-xl transition-colors shrink-0 cursor-pointer"
      aria-label="Tutup notifikasi"
    >
      <X :size="15" />
    </button>
  </div>
</template>
