<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'

export interface BreadcrumbItem {
  label: string
  to?: string
  active?: boolean
}

interface Props {
  items: BreadcrumbItem[]
}

defineProps<Props>()
</script>

<template>
  <nav aria-label="Breadcrumb">
    <ol class="flex items-center gap-2 text-sm">
      <li v-for="(item, index) in items" :key="index" class="flex items-center gap-2">
        <!-- Separator -->
        <ChevronRight v-if="index > 0" :size="16" class="text-gray-400" />

        <!-- Item -->
        <RouterLink
          v-if="item.to && !item.active"
          :to="item.to"
          class="text-blue-600 hover:text-blue-700 transition-colors"
        >
          {{ item.label }}
        </RouterLink>
        <span
          v-else
          :class="item.active ? 'text-gray-900 font-medium' : 'text-gray-600'"
        >
          {{ item.label }}
        </span>
      </li>
    </ol>
  </nav>
</template>
