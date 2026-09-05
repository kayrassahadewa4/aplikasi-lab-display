<script setup lang="ts">
interface Props {
  columns?: number
  rows?: number
}

withDefaults(defineProps<Props>(), {
  columns: 4,
  rows: 5,
})
</script>

<template>
  <div class="w-full overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200 animate-pulse">
      <!-- Header -->
      <thead class="bg-gray-50">
        <tr>
          <th v-for="i in columns" :key="`header-${i}`" class="px-6 py-3">
            <div class="h-4 bg-gray-200 rounded w-24"></div>
          </th>
        </tr>
      </thead>

      <!-- Body -->
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-for="row in rows" :key="`row-${row}`">
          <td v-for="col in columns" :key="`cell-${row}-${col}`" class="px-6 py-4">
            <div class="h-4 bg-gray-200 rounded" :class="col === 1 ? 'w-32' : 'w-24'"></div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
