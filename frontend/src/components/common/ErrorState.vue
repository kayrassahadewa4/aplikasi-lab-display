<script setup lang="ts">
defineProps<{
  /** Main error title */
  title?: string
  /** Optional error description */
  description?: string
  /** Whether a retry button should be shown */
  retryable?: boolean
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 text-center">
    <div class="mb-4 text-red-400">
      <slot name="icon">
        <svg
          class="mx-auto h-12 w-12"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </slot>
    </div>
    <h3 class="text-sm font-medium text-gray-900">
      {{ title ?? 'Something went wrong' }}
    </h3>
    <p v-if="description" class="mt-1 text-sm text-gray-500">
      {{ description }}
    </p>
    <div v-if="retryable" class="mt-4">
      <button
        type="button"
        class="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
        @click="emit('retry')"
      >
        Try again
      </button>
    </div>
  </div>
</template>
