<script setup lang="ts">
import BaseBreadcrumb, { type BreadcrumbItem } from './BaseBreadcrumb.vue'

interface Props {
  title: string
  subtitle?: string
  breadcrumbs?: BreadcrumbItem[]
}

defineProps<Props>()
</script>

<template>
  <div class="mb-6">
    <!-- Breadcrumbs -->
    <div v-if="breadcrumbs && breadcrumbs.length > 0" class="mb-3">
      <BaseBreadcrumb :items="breadcrumbs" />
    </div>

    <!-- Title Section -->
    <div class="flex items-center justify-between gap-4">
      <div class="flex-1">
        <h1 class="text-2xl font-bold text-gray-900">{{ title }}</h1>
        <p v-if="subtitle" class="text-gray-600 mt-1">{{ subtitle }}</p>
      </div>

      <!-- Action Buttons -->
      <div v-if="$slots.actions" class="flex items-center gap-2 shrink-0">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
