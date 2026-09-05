<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  padding?: boolean
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  padding: true,
  loading: false,
})
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm shadow-black/[0.03] border border-gray-200/70 overflow-hidden transition-all duration-200">
    <!-- Header -->
    <div v-if="title || $slots.header" class="px-6 py-4 border-b border-gray-100/80 flex items-center justify-between">
      <slot name="header">
        <div>
          <h3 class="text-base font-bold text-text-primary tracking-tight">{{ title }}</h3>
          <p v-if="subtitle" class="text-xs text-text-muted mt-0.5">{{ subtitle }}</p>
        </div>
      </slot>
      <div v-if="$slots.action" class="shrink-0">
        <slot name="action" />
      </div>
    </div>

    <!-- Body -->
    <div :class="{ 'p-6': padding }" class="relative">
      <div v-if="loading" class="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center z-10">
        <div class="animate-spin rounded-full h-7 w-7 border-2 border-primary border-t-transparent"></div>
      </div>
      <slot />
    </div>

    <!-- Footer -->
    <div v-if="$slots.footer" class="px-6 py-3.5 border-t border-gray-100 bg-surface/50">
      <slot name="footer" />
    </div>
  </div>
</template>
