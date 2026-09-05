<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  type: 'button',
})

const variantClasses = {
  primary: 'bg-primary hover:bg-primary-hover active:bg-primary-active text-white shadow-2xs focus:ring-primary',
  secondary: 'bg-surface hover:bg-brand-50 text-text-primary border border-gray-200/80 focus:ring-primary',
  danger: 'bg-danger hover:bg-red-600 active:bg-red-700 text-white shadow-2xs focus:ring-red-500',
  success: 'bg-dark-green hover:bg-[#547a5c] active:bg-brand-900 text-white shadow-2xs focus:ring-dark-green',
  warning: 'bg-warning hover:bg-amber-600 text-white shadow-2xs focus:ring-amber-500',
  outline: 'border border-primary hover:bg-brand-50 text-primary bg-white focus:ring-primary',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs font-bold rounded-lg',
  md: 'px-4 py-2 text-xs font-bold rounded-xl',
  lg: 'px-5 py-2.5 text-sm font-bold rounded-xl',
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'font-bold transition-all duration-150 inline-flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99] select-none',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',
      variantClasses[variant],
      sizeClasses[size],
    ]"
  >
    <Loader2 v-if="loading" :size="15" class="animate-spin" />
    <slot name="icon" />
    <slot />
  </button>
</template>
