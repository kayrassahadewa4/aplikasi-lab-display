<script setup lang="ts">
import { Inbox } from 'lucide-vue-next'

interface Props {
  title?: string
  message?: string
  icon?: any
}

withDefaults(defineProps<Props>(), {
  title: 'No data available',
  message: 'There are no records found for the current query or filter.',
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 px-4 text-center select-none">
    <div class="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-200/60 text-dark-green flex items-center justify-center mb-3.5 shadow-2xs">
      <component :is="icon || Inbox" :size="26" stroke-width="1.8" />
    </div>
    <h3 class="text-sm font-bold text-text-primary mb-1">{{ title }}</h3>
    <p class="text-xs text-text-muted max-w-sm leading-relaxed mb-4">{{ message }}</p>
    <slot />
  </div>
</template>
