<script setup lang="ts">
import { ref, computed } from 'vue'
import { Camera, Trash2, Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-vue-next'
import BaseAvatar from './BaseAvatar.vue'
import { userService } from '@/services/user.service'
import { useAuthStore } from '@/stores/auth.store'

interface Props {
  modelValue?: string | null
  userName?: string
  size?: 'lg' | 'xl' | '2xl'
  editable?: boolean
  showControls?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  userName: '',
  size: '2xl',
  editable: true,
  showControls: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void
  (e: 'uploaded', url: string): void
  (e: 'deleted'): void
}>()

const authStore = useAuthStore()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)
const isDeleting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const currentAvatar = computed(() => {
  return props.modelValue !== undefined ? props.modelValue : authStore.userAvatar
})

const displayName = computed(() => {
  return props.userName || authStore.userName || 'User'
})

const triggerFileInput = () => {
  if (!props.editable || isUploading.value || isDeleting.value) return
  errorMessage.value = ''
  fileInputRef.value?.click()
}

const handleFileSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Reset input value so same file can be selected again if needed
  target.value = ''

  // Validate format
  const validMimes = ['image/jpeg', 'image/png', 'image/webp']
  if (!validMimes.includes(file.type)) {
    errorMessage.value = 'Hanya format JPG, PNG, atau WEBP yang diperbolehkan.'
    return
  }

  // Validate size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    errorMessage.value = 'Ukuran berkas maksimal adalah 2MB.'
    return
  }

  isUploading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const result = await userService.uploadProfilePhoto(file)
    const newUrl = result.avatar_url

    authStore.updateUserAvatar(newUrl)
    emit('update:modelValue', newUrl)
    emit('uploaded', newUrl)

    successMessage.value = 'Foto profil berhasil diperbarui!'
    setTimeout(() => {
      successMessage.value = ''
    }, 3500)
  } catch (err: any) {
    errorMessage.value =
      err.response?.data?.message || err.message || 'Gagal mengunggah foto profil.'
  } finally {
    isUploading.value = false
  }
}

const handleDeletePhoto = async () => {
  if (!currentAvatar.value || isDeleting.value || isUploading.value) return

  if (!confirm('Apakah Anda yakin ingin menghapus foto profil ini?')) return

  isDeleting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await userService.deleteProfilePhoto()
    authStore.updateUserAvatar(null)
    emit('update:modelValue', null)
    emit('deleted')

    successMessage.value = 'Foto profil berhasil dihapus.'
    setTimeout(() => {
      successMessage.value = ''
    }, 3500)
  } catch (err: any) {
    errorMessage.value =
      err.response?.data?.message || err.message || 'Gagal menghapus foto profil.'
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center gap-4">
    <!-- Hidden input -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="hidden"
      @change="handleFileSelected"
    />

    <!-- Avatar with Overlay & Trigger Button -->
    <div class="relative inline-block shrink-0">
      <div
        class="relative rounded-full ring-4 ring-brand-100 shadow-md overflow-hidden"
        :class="{ 'cursor-pointer group': editable }"
        @click="triggerFileInput"
      >
        <BaseAvatar :src="currentAvatar" :name="displayName" :size="size" />

        <!-- Loading Overlay -->
        <div
          v-if="isUploading || isDeleting"
          class="absolute inset-0 bg-black/60 flex items-center justify-center text-white"
        >
          <Loader2 :size="20" class="animate-spin" />
        </div>

        <!-- Hover Overlay for Click to Change -->
        <div
          v-else-if="editable"
          class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
        >
          <Camera :size="20" />
        </div>
      </div>

      <!-- Quick Action Floating Button -->
      <button
        v-if="editable && !isUploading && !isDeleting"
        type="button"
        @click.stop="triggerFileInput"
        class="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-dark-green hover:bg-[#547a5c] text-white border-2 border-white shadow-xs transition-colors cursor-pointer"
        title="Ganti Foto Profil"
      >
        <Camera :size="13" />
      </button>
    </div>

    <!-- Side Action Controls & Status -->
    <div v-if="showControls" class="space-y-2">
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          :disabled="isUploading || isDeleting"
          @click="triggerFileInput"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <Upload :size="13" />
          <span>{{ isUploading ? 'Mengunggah...' : 'Pilih Foto' }}</span>
        </button>

        <button
          v-if="currentAvatar"
          type="button"
          :disabled="isUploading || isDeleting"
          @click="handleDeletePhoto"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
        >
          <Trash2 :size="13" />
          <span>{{ isDeleting ? 'Menghapus...' : 'Hapus Foto' }}</span>
        </button>
      </div>

      <p class="text-[11px] text-text-muted">
        Format: <span class="font-semibold text-text-primary">JPG, PNG, WEBP</span> (Maks. 2MB)
      </p>

      <!-- Inline alerts -->
      <div
        v-if="errorMessage"
        class="text-xs text-rose-600 font-semibold flex items-center gap-1 animate-in fade-in"
      >
        <AlertCircle :size="13" class="shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <div
        v-if="successMessage"
        class="text-xs text-dark-green font-semibold flex items-center gap-1 animate-in fade-in"
      >
        <CheckCircle2 :size="13" class="shrink-0" />
        <span>{{ successMessage }}</span>
      </div>
    </div>
  </div>
</template>
