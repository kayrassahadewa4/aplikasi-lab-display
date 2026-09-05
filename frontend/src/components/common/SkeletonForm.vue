<script setup lang="ts">
interface Props {
  fields?: number
}

withDefaults(defineProps<Props>(), {
  fields: 4,
})
</script>

<template>
  <div class="space-y-4 animate-pulse">
    <div v-for="i in fields" :key="i" class="space-y-2">
      <!-- Label -->
      <div class="h-4 bg-gray-200 rounded w-24"></div>
      <!-- Input -->
      <div class="h-10 bg-gray-200 rounded w-full"></div>
    </div>

    <!-- Buttons -->
    <div class="flex gap-3 pt-4">
      <div class="h-10 bg-gray-200 rounded w-24"></div>
      <div class="h-10 bg-gray-200 rounded w-24"></div>
    </div>
  </div>
</template>
