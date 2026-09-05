<script setup lang="ts">
interface Props {
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  dot?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'neutral',
  size: 'md',
  dot: false,
})

const variantClasses = {
  success: 'bg-emerald-50 text-dark-green border-brand-200',
  danger: 'bg-red-50 text-danger border-red-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  info: 'bg-sky-50 text-sky-800 border-sky-200',
  neutral: 'bg-gray-100/80 text-gray-700 border-gray-200',
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[11px] font-bold',
  md: 'px-2.5 py-0.5 text-xs font-bold',
  lg: 'px-3 py-1 text-xs font-bold',
}

const dotClasses = {
  success: 'bg-primary',
  danger: 'bg-danger',
  warning: 'bg-warning',
  info: 'bg-info',
  neutral: 'bg-gray-400',
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 rounded-full font-medium border',
      variantClasses[variant],
      sizeClasses[size],
    ]"
  >
    <span v-if="dot" :class="['w-2 h-2 rounded-full', dotClasses[variant]]"></span>
    <slot />
  </span>
</template>
