<script setup lang="ts">
interface Props {
  rows?: number
}

withDefaults(defineProps<Props>(), {
  rows: 3,
})
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
    <!-- Header -->
    <div class="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>

    <!-- Content Rows -->
    <div class="space-y-3">
      <div v-for="i in rows" :key="i" class="h-4 bg-gray-200 rounded" :class="i === rows ? 'w-2/3' : 'w-full'"></div>
    </div>
  </div>
</template>
