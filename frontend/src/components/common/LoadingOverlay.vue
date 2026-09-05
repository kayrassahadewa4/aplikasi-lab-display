<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

interface Props {
  message?: string
}

withDefaults(defineProps<Props>(), {
  message: 'Loading...',
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div class="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center gap-4">
      <Loader2 :size="48" class="animate-spin text-blue-600" />
      <p class="text-gray-700 font-medium">{{ message }}</p>
    </div>
  </div>
</template>
