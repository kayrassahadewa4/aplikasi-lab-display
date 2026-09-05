<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}
</script>

<template>
  <div class="flex flex-col items-center justify-center">
    <div
      :class="['animate-spin rounded-full border-2 border-primary border-t-transparent', sizeClasses[size]]"
    />
    <p v-if="text" class="mt-2 text-xs font-medium text-text-secondary">{{ text }}</p>
  </div>
</template>
