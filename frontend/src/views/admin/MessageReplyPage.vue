<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import {
  ArrowLeft,
  CornerUpLeft,
  Send,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  User,
  Clock,
  FileText,
  Loader2
} from 'lucide-vue-next'
import { messageService, type MessageDto } from '@/services/message.service'
import { formatDateTime } from '@/utils/format.utils'

const route = useRoute()
const router = useRouter()
const navStore = useAdminNavStore()

// State
const messageId = computed(() => route.params.id as string)
const originalMessage = ref<MessageDto | null>(null)
const isLoadingMessage = ref(true)

// Form State
const replyBody = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)
const isSubmitted = ref(false)
const showToast = ref(false)

onMounted(async () => {
  navStore.setBreadcrumbs([
    { label: 'Dashboard', path: '/admin' },
    { label: 'Kotak Pesan', path: '/admin/messages' },
    { label: 'Balas Pesan' },
  ])

  try {
    const msg = await messageService.getMessageById(messageId.value)
    originalMessage.value = msg
  } catch (error) {
    console.warn('Failed to load message:', error)
    router.push('/admin/messages')
  } finally {
    isLoadingMessage.value = false
  }
})

// Auto-populated Subject
const replySubject = computed(() => {
  if (!originalMessage.value) return 'Re: Pesan'
  const subj = originalMessage.value.subject
  return subj.toLowerCase().startsWith('re:') ? subj : `Re: ${subj}`
})

// Handle Back / Cancel
const handleBackToMessage = () => {
  router.push('/admin/messages')
}

// Handle Form Submission
const handleSendReply = async () => {
  if (!replyBody.value.trim() || !originalMessage.value) {
    errorMessage.value = 'Silakan masukkan pesan sebelum mengirim.'
    return
  }

  errorMessage.value = ''
  isSubmitting.value = true

  try {
    await messageService.sendMessage({
      recipient_id: originalMessage.value.sender_id,
      subject: replySubject.value,
      body: replyBody.value.trim(),
    })

    isSubmitted.value = true
    showToast.value = true

    setTimeout(() => {
      router.push('/admin/messages')
    }, 1000)
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || error.message || 'Gagal mengirim balasan'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6 pb-12 select-none">
    
    <!-- 1. Page Header & Back Navigation -->
    <div class="space-y-3 pb-3 border-b border-gray-200/60">
      <div>
        <button
          @click="handleBackToMessage"
          class="inline-flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-dark-green transition-colors cursor-pointer mb-2"
        >
          <ArrowLeft :size="14" />
          <span>Kembali ke Kotak Pesan</span>
        </button>

        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
            Balas Pesan
          </h1>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-100/80 border border-brand-200 text-dark-green text-[11px] font-bold">
            <CornerUpLeft :size="12" />
            Mode Balasan
          </span>
        </div>

        <p class="text-xs sm:text-sm text-text-muted font-normal mt-0.5">
          Balas pesan ini dan lanjutkan percakapan.
        </p>
      </div>
    </div>

    <!-- Toast Notification Feedback Banner -->
    <div
      v-if="showToast"
      class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-dark-green text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="flex items-center gap-2.5">
        <CheckCircle2 :size="18" class="text-dark-green shrink-0" />
        <span>Balasan berhasil dikirim. Mengalihkan kembali ke Kotak Pesan...</span>
      </div>
      <button @click="showToast = false" class="text-dark-green hover:opacity-80">
        <X :size="14" />
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoadingMessage" class="p-12 text-center text-text-muted bg-white rounded-2xl border border-gray-200/70">
      <Loader2 :size="28" class="animate-spin text-dark-green mx-auto mb-2" />
      <p class="text-xs font-semibold">Memuat pesan asli...</p>
    </div>

    <!-- 2. Original Message Card (Read-only) -->
    <div v-else-if="originalMessage" class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs overflow-hidden">
      <!-- Section Header -->
      <div class="px-5 py-3.5 bg-surface/50 border-b border-gray-100 flex items-center justify-between">
        <div class="flex items-center gap-2 text-text-secondary font-bold text-xs">
          <Mail :size="14" class="text-text-muted" />
          <span>Pesan Asli</span>
        </div>
        <span class="text-[11px] text-text-muted font-mono">ID: {{ originalMessage.id.substring(0, 8) }}</span>
      </div>

      <div class="p-5 sm:p-6 space-y-4">
        <!-- Sender Header Info -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-brand-200 to-dark-green text-white font-extrabold text-sm flex items-center justify-center shadow-2xs shrink-0">
              {{ (originalMessage.sender?.full_name || 'U').charAt(0).toUpperCase() }}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-bold text-text-primary">{{ originalMessage.sender?.full_name || 'Pengguna' }}</h3>
                <span class="px-2 py-0.5 rounded-full bg-brand-100 text-dark-green text-[10px] font-bold">
                  {{ originalMessage.sender?.role?.name || 'Pengguna' }}
                </span>
              </div>
              <p class="text-xs text-text-muted font-normal mt-0.5">{{ originalMessage.sender?.email }}</p>
            </div>
          </div>

          <div class="flex items-center gap-1.5 text-xs text-text-muted font-medium self-start sm:self-auto">
            <Clock :size="13" class="text-text-muted" />
            <span>{{ formatDateTime(originalMessage.created_at) }}</span>
          </div>
        </div>

        <!-- Message Subject & Body -->
        <div class="space-y-2">
          <h4 class="text-sm font-extrabold text-text-primary tracking-tight">
            {{ originalMessage.subject }}
          </h4>
          <div class="p-4 rounded-2xl bg-surface/60 border border-gray-100 text-xs text-text-primary leading-relaxed whitespace-pre-line font-medium">
            {{ originalMessage.body }}
          </div>
        </div>

        <!-- Attachment if present -->
        <div v-if="originalMessage.attachment_url" class="p-3 rounded-xl bg-brand-50/40 border border-brand-200/60 flex items-center justify-between text-xs">
          <div class="flex items-center gap-2 text-dark-green font-bold">
            <Paperclip :size="15" />
            <span>{{ originalMessage.attachment_url.split('/').pop() }}</span>
          </div>
          <span class="text-[11px] text-text-muted font-medium">Lampiran (Hanya Baca)</span>
        </div>
      </div>
    </div>

    <!-- 3. Reply Message Card (Form) -->
    <div class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs overflow-hidden">
      <div class="px-5 py-3.5 bg-surface/50 border-b border-gray-100 flex items-center gap-2 text-text-secondary font-bold text-xs">
        <CornerUpLeft :size="14" class="text-dark-green" />
        <span>Balasan Anda</span>
      </div>

      <div class="p-5 sm:p-6 space-y-5">
        <!-- Recipient & Subject Info Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <!-- To Field -->
          <div class="space-y-1">
            <label class="block text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Kepada
            </label>
            <div class="px-3.5 py-2.5 rounded-xl bg-surface border border-gray-200/80 text-text-primary font-semibold flex items-center gap-2">
              <User :size="14" class="text-dark-green shrink-0" />
              <span class="truncate">{{ originalMessage?.sender?.full_name || 'Pengguna' }} &lt;{{ originalMessage?.sender?.email }}&gt;</span>
            </div>
          </div>

          <!-- Subject Field -->
          <div class="space-y-1">
            <label class="block text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Subjek
            </label>
            <div class="px-3.5 py-2.5 rounded-xl bg-surface border border-gray-200/80 text-text-primary font-semibold flex items-center gap-2 truncate">
              <FileText :size="14" class="text-dark-green shrink-0" />
              <span class="truncate">{{ replySubject }}</span>
            </div>
          </div>
        </div>

        <!-- Message Editor Area -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-text-primary">
            Isi Pesan <span class="text-danger">*</span>
          </label>
          
          <textarea
            v-model="replyBody"
            rows="8"
            placeholder="Tulis balasan Anda di sini..."
            :class="[
              'w-full p-4 rounded-xl text-xs text-text-primary leading-relaxed border transition-all duration-150 focus:outline-none font-normal',
              errorMessage
                ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
                : 'border-gray-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-200/60'
            ]"
          ></textarea>

          <!-- Error Validation Message -->
          <p v-if="errorMessage" class="text-[11px] font-semibold text-danger flex items-center gap-1 mt-1">
            <AlertCircle :size="12" />
            <span>{{ errorMessage }}</span>
          </p>
        </div>

        <!-- Attachment Action UI Placeholder -->
        <div class="flex items-center justify-between pt-2 border-t border-gray-100">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200/80 bg-surface hover:bg-gray-100 text-text-muted hover:text-text-primary text-xs font-semibold transition-colors cursor-pointer"
            title="Lampirkan berkas"
          >
            <Paperclip :size="13" />
            <span>Lampirkan Berkas</span>
          </button>
          
          <span class="text-[11px] text-text-muted">Teks pesan standar</span>
        </div>

        <!-- Form Actions Bar -->
        <div class="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            @click="handleBackToMessage"
            :disabled="isSubmitting || isSubmitted"
            class="px-4 py-2 rounded-full border border-gray-200 text-text-secondary hover:bg-surface text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            @click="handleSendReply"
            :disabled="isSubmitting || isSubmitted"
            :class="[
              'inline-flex items-center gap-2 px-5 py-2 rounded-full text-white text-xs font-bold shadow-xs transition-all cursor-pointer',
              isSubmitted
                ? 'bg-emerald-600'
                : 'bg-dark-green hover:bg-[#547a5c] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
            ]"
          >
            <Loader2 v-if="isSubmitting" :size="14" class="animate-spin" />
            <CheckCircle2 v-else-if="isSubmitted" :size="14" />
            <Send v-else :size="14" />

            <span>
              {{ isSubmitting ? 'Mengirim...' : isSubmitted ? 'Balasan Terkirim' : 'Kirim Balasan' }}
            </span>
          </button>
        </div>

      </div>
    </div>

  </div>
</template>
