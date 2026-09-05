<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Props {
  src?: string | null
  alt?: string
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-20 h-20 text-xl',
}

const imageError = ref(false)

watch(
  () => props.src,
  () => {
    imageError.value = false
  },
)

const resolvedSrc = computed(() => {
  if (!props.src || imageError.value) return undefined
  if (
    props.src.startsWith('http://') ||
    props.src.startsWith('https://') ||
    props.src.startsWith('data:') ||
    props.src.startsWith('blob:')
  ) {
    return props.src
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
  const hostBase = apiBase.replace(/\/api\/?$/, '')
  return `${hostBase}${props.src.startsWith('/') ? props.src : '/' + props.src}`
})

const initials = computed(() => {
  if (!props.name) return '?'
  return props.name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const bgColor = computed(() => {
  const colors = [
    'bg-dark-green',
    'bg-primary',
    'bg-emerald-600',
    'bg-teal-600',
    'bg-indigo-600',
    'bg-blue-600',
  ]
  const index = props.name ? props.name.charCodeAt(0) % colors.length : 0
  return colors[index]
})
</script>

<template>
  <div
    :class="[
      'rounded-full flex items-center justify-center overflow-hidden shrink-0 select-none font-bold',
      sizeClasses[size],
      !resolvedSrc ? `${bgColor} text-white` : 'bg-gray-100',
    ]"
  >
    <img
      v-if="resolvedSrc"
      :src="resolvedSrc"
      :alt="alt || name || 'Avatar'"
      class="w-full h-full object-cover"
      @error="imageError = true"
    />
    <span v-else>{{ initials }}</span>
  </div>
</template>
