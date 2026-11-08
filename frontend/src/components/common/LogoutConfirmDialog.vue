<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue'
import { LogOut, X, Loader2 } from 'lucide-vue-next'

interface Props {
  modelValue: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Konfirmasi Keluar',
  message: 'Apakah Anda yakin ingin keluar?',
  confirmText: 'Ya, Keluar',
  cancelText: 'Tidak',
  loading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

const close = () => {
  if (props.loading) return
  emit('update:modelValue', false)
  emit('cancel')
}

const handleConfirm = () => {
  if (props.loading) return
  emit('confirm')
}

const handleEscKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.modelValue && !props.loading) {
    close()
  }
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  },
)

onMounted(() => {
  document.addEventListener('keydown', handleEscKey)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
        @click.self="close"
      >
        <div
          class="w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          @click.stop
        >
          <!-- Top Accent Bar (Institusional UPNVJ & Red Danger subtle accent) -->
          <div class="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-500 via-amber-400 to-[#0c5a30]" />

          <!-- Close button -->
          <button
            v-if="!loading"
            @click="close"
            type="button"
            class="absolute top-4 right-4 p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X :size="16" />
          </button>

          <!-- Icon and Message Section -->
          <div class="text-center pt-2">
            <!-- Logout Badge Icon -->
            <div class="mx-auto w-14 h-14 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shadow-xs mb-3.5">
              <LogOut :size="24" stroke-width="2.2" class="ml-0.5" />
            </div>

            <!-- Title -->
            <h3 class="text-base sm:text-lg font-black text-text-primary tracking-tight">
              {{ title }}
            </h3>

            <!-- Confirmation Question -->
            <p class="text-sm font-bold text-gray-800 mt-1.5">
              {{ message }}
            </p>

            <!-- Context Hint -->
            <p class="text-xs text-text-muted mt-1 leading-relaxed">
              Sesi aktif Anda akan diakhiri dan Anda perlu masuk kembali untuk mengakses sistem Lab Display.
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <!-- Tombol Tidak / Batal -->
            <button
              type="button"
              @click="close"
              :disabled="loading"
              class="w-full py-2.5 px-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-text-secondary text-xs sm:text-sm font-bold transition-all duration-150 disabled:opacity-50 cursor-pointer text-center"
            >
              {{ cancelText }}
            </button>

            <!-- Tombol Ya / Ya, Keluar -->
            <button
              type="button"
              @click="handleConfirm"
              :disabled="loading"
              class="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs sm:text-sm font-black transition-all duration-150 shadow-sm hover:shadow shadow-red-600/20 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
            >
              <Loader2 v-if="loading" :size="16" class="animate-spin shrink-0" />
              <span>{{ loading ? 'Mengeluarkan...' : confirmText }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
