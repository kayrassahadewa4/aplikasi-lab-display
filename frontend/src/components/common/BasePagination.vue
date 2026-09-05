<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

interface Props {
  currentPage: number
  totalPages: number
  pageSize?: number
  pageSizeOptions?: number[]
  showPageSize?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  pageSize: 10,
  pageSizeOptions: () => [10, 20, 50, 100],
  showPageSize: true,
})

const emit = defineEmits<{
  'update:currentPage': [page: number]
  'update:pageSize': [size: number]
  pageChange: [page: number]
  pageSizeChange: [size: number]
}>()

const hasPrevious = computed(() => props.currentPage > 1)
const hasNext = computed(() => props.currentPage < props.totalPages)

const goToPage = (page: number) => {
  if (page >= 1 && page <= props.totalPages) {
    emit('update:currentPage', page)
    emit('pageChange', page)
  }
}

const changePageSize = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const size = Number(target.value)
  emit('update:pageSize', size)
  emit('pageSizeChange', size)
  goToPage(1) // Reset to first page
}

const pageNumbers = computed(() => {
  const pages: (number | string)[] = []
  const { currentPage, totalPages } = props

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages)
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
    }
  }

  return pages
})
</script>

<template>
  <div class="flex items-center justify-between gap-4 flex-wrap text-xs">
    <!-- Page Size Selector -->
    <div v-if="showPageSize" class="flex items-center gap-2">
      <label class="text-xs text-text-secondary">Show:</label>
      <select
        :value="pageSize"
        @change="changePageSize"
        class="px-2.5 py-1 border border-gray-200/80 rounded-lg text-xs text-text-primary bg-white focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary cursor-pointer"
      >
        <option v-for="size in pageSizeOptions" :key="size" :value="size">
          {{ size }}
        </option>
      </select>
      <span class="text-xs text-text-muted">per page</span>
    </div>

    <!-- Pagination Controls -->
    <div class="flex items-center gap-1.5">
      <!-- Previous Button -->
      <button
        @click="goToPage(currentPage - 1)"
        :disabled="!hasPrevious"
        class="p-1.5 rounded-lg border border-gray-200/80 bg-white hover:bg-surface text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft :size="16" />
      </button>

      <!-- Page Numbers -->
      <button
        v-for="(page, index) in pageNumbers"
        :key="index"
        @click="typeof page === 'number' ? goToPage(page) : null"
        :disabled="page === '...'"
        :class="[
          'min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all duration-150',
          page === currentPage
            ? 'bg-dark-green text-white shadow-2xs'
            : page === '...'
            ? 'cursor-default text-text-muted'
            : 'border border-gray-200/80 bg-white hover:bg-surface text-text-primary hover:border-brand-300',
        ]"
      >
        {{ page }}
      </button>

      <!-- Next Button -->
      <button
        @click="goToPage(currentPage + 1)"
        :disabled="!hasNext"
        class="p-1.5 rounded-lg border border-gray-200/80 bg-white hover:bg-surface text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        <ChevronRight :size="16" />
      </button>
    </div>

    <!-- Page Info -->
    <div class="text-xs font-medium text-text-muted font-mono">
      Page {{ currentPage }} of {{ totalPages }}
    </div>
  </div>
</template>
