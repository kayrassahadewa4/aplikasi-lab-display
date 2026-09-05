import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import type { PaginationMeta } from '@/types'

export function usePagination(initialPage = 1, initialLimit = 10) {
  const page: Ref<number> = ref(initialPage)
  const limit: Ref<number> = ref(initialLimit)
  const meta: Ref<PaginationMeta | null> = ref(null)

  const totalPages = computed(() => meta.value?.totalPages ?? 0)
  const total = computed(() => meta.value?.total ?? 0)
  const hasNextPage = computed(() => meta.value?.hasNextPage ?? false)
  const hasPreviousPage = computed(() => meta.value?.hasPreviousPage ?? false)

  const setMeta = (newMeta: PaginationMeta) => {
    meta.value = newMeta
  }

  const nextPage = () => {
    if (hasNextPage.value) {
      page.value++
    }
  }

  const previousPage = () => {
    if (hasPreviousPage.value) {
      page.value--
    }
  }

  const goToPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages.value) {
      page.value = pageNumber
    }
  }

  const setLimit = (newLimit: number) => {
    limit.value = newLimit
    page.value = 1 // Reset to first page when changing limit
  }

  const reset = () => {
    page.value = initialPage
    limit.value = initialLimit
    meta.value = null
  }

  return {
    page,
    limit,
    meta,
    totalPages,
    total,
    hasNextPage,
    hasPreviousPage,
    setMeta,
    nextPage,
    previousPage,
    goToPage,
    setLimit,
    reset,
  }
}
