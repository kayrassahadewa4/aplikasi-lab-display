<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import ToastNotification from './ToastNotification.vue'

const { toasts, remove } = useToast()
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      <TransitionGroup
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 translate-x-8 scale-95"
        enter-to-class="opacity-100 translate-x-0 scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 translate-x-8 scale-95"
        move-class="transition-all duration-300 ease-out"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto"
        >
          <ToastNotification
            :toast="toast"
            @close="remove"
          />
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
