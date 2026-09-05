<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import {
  Mail,
  Search,
  Plus,
  Inbox,
  Send,
  Archive,
  Paperclip,
  Trash2,
  CheckCircle2,
  X,
  User,
  Clock,
  Filter,
  CornerUpLeft,
  MessageSquare,
  Loader2
} from 'lucide-vue-next'
import { messageService, type MessageDto } from '@/services/message.service'
import { userService } from '@/services/user.service'
import type { UserData } from '@/mocks/admin-users.mock'
import type { MessageItem } from '@/mocks/admin-messages.mock'
import { formatDateTime } from '@/utils/format.utils'

const router = useRouter()
const navStore = useAdminNavStore()

// State
const messagesList = ref<MessageItem[]>([])
const selectedFolder = ref<'inbox' | 'sent' | 'archived'>('inbox')
const filterMode = ref<'all' | 'unread'>('all')
const searchQuery = ref('')
const selectedMessageId = ref<string>('')
const isLoading = ref(false)
const isSending = ref(false)
const usersList = ref<UserData[]>([])

// Modals & Banners
const showComposeModal = ref(false)
const showToast = ref(false)
const toastMessage = ref('')

// Compose Form State
const composeForm = ref({
  recipientId: '',
  subject: '',
  body: '',
})

const mapMessageDtoToUi = (dto: MessageDto): MessageItem => {
  const senderName = dto.sender?.full_name || 'System / Administrator'
  const senderRole = dto.sender?.role?.name || 'User'
  const email = dto.sender?.email || 'user@lab.com'
  const initial = senderName.charAt(0).toUpperCase() || 'U'

  const formattedTime = dto.created_at ? formatDateTime(dto.created_at) : 'Baru Saja'

  return {
    id: dto.id,
    senderName,
    senderRole,
    email,
    avatarInitial: initial,
    subject: dto.subject,
    preview: dto.body.slice(0, 80) + (dto.body.length > 80 ? '...' : ''),
    body: dto.body,
    timestamp: formattedTime,
    isUnread: !dto.is_read,
    folder: (dto.folder as 'inbox' | 'sent' | 'archived') || 'inbox',
    hasAttachment: !!dto.attachment_url,
    attachmentName: dto.attachment_url ? dto.attachment_url.split('/').pop() : undefined,
  }
}

const loadMessages = async () => {
  isLoading.value = true
  try {
    const res = await messageService.getMessages({
      folder: selectedFolder.value,
      search: searchQuery.value || undefined,
    })
    messagesList.value = (res.data || []).map(mapMessageDtoToUi)
    if (messagesList.value.length > 0 && !selectedMessageId.value) {
      selectedMessageId.value = messagesList.value[0]!.id
    } else if (messagesList.value.length === 0) {
      selectedMessageId.value = ''
    }
  } catch (error) {
    console.warn('Failed to load messages:', error)
  } finally {
    isLoading.value = false
  }
}

const loadUsers = async () => {
  try {
    const res = await userService.getUsers({ page: 1, limit: 100 })
    usersList.value = res.users || []
  } catch {}
}

onMounted(() => {
  navStore.setBreadcrumbs([
    { label: 'Dashboard', path: '/admin' },
    { label: 'Kotak Pesan' },
  ])
  loadMessages()
  loadUsers()
})

watch([selectedFolder, searchQuery], () => {
  loadMessages()
})

// Computed Unread Counts
const unreadInboxCount = computed(() => {
  return messagesList.value.filter(m => m.folder === 'inbox' && m.isUnread).length
})

// Filtered Messages List
const filteredMessages = computed(() => {
  return messagesList.value.filter(msg => {
    if (filterMode.value === 'unread' && !msg.isUnread) return false
    return true
  })
})

// Selected Message Object
const selectedMessage = computed(() => {
  return messagesList.value.find(m => m.id === selectedMessageId.value) || null
})

// Actions
const selectMessage = async (msg: MessageItem) => {
  selectedMessageId.value = msg.id
  if (msg.isUnread) {
    msg.isUnread = false
    try {
      await messageService.getMessageById(msg.id)
    } catch {}
  }
}

const handleSendMessage = async () => {
  if (!composeForm.value.subject || !composeForm.value.body) return
  isSending.value = true

  try {
    await messageService.sendMessage({
      recipient_id: composeForm.value.recipientId || undefined,
      subject: composeForm.value.subject,
      body: composeForm.value.body,
    })

    composeForm.value = { recipientId: '', subject: '', body: '' }
    showComposeModal.value = false
    toastMessage.value = 'Pesan berhasil dikirim.'
    showToast.value = true
    setTimeout(() => { showToast.value = false }, 3500)

    if (selectedFolder.value === 'sent') {
      await loadMessages()
    }
  } catch (error: any) {
    alert(error.response?.data?.message || error.message || 'Gagal mengirim pesan')
  } finally {
    isSending.value = false
  }
}

const handleReply = () => {
  if (!selectedMessage.value) return
  router.push(`/admin/messages/${selectedMessage.value.id}/reply`)
}

const handleArchive = async () => {
  if (!selectedMessage.value) return
  try {
    await messageService.archiveMessage(selectedMessage.value.id)
    selectedMessage.value.folder = 'archived'
    toastMessage.value = 'Pesan dipindahkan ke arsip.'
    showToast.value = true
    setTimeout(() => { showToast.value = false }, 3500)
    await loadMessages()
  } catch (error: any) {
    alert(error.response?.data?.message || error.message || 'Gagal mengarsipkan pesan')
  }
}

const handleDelete = async () => {
  if (!selectedMessage.value) return
  try {
    await messageService.deleteMessage(selectedMessage.value.id)
    toastMessage.value = 'Pesan berhasil dihapus.'
    showToast.value = true
    setTimeout(() => { showToast.value = false }, 3500)
    await loadMessages()
  } catch (error: any) {
    alert(error.response?.data?.message || error.message || 'Gagal menghapus pesan')
  }
}
</script>

<template>
  <div class="space-y-6 pb-8 select-none">
    
    <!-- 1. Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2.5 border-b border-gray-200/60">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
            Kotak Pesan
          </h1>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-100/80 border border-brand-200 text-dark-green text-[11px] font-bold">
            <Mail :size="12" class="text-primary-dark" />
            Kotak Masuk & Komunikasi
          </span>
        </div>
        <p class="text-xs sm:text-sm text-text-muted font-normal">
          Tetap terhubung melalui percakapan dan pesan dari pengguna sistem.
        </p>
      </div>

      <!-- Top Primary Action -->
      <div class="flex items-center gap-3">
        <button
          @click="showComposeModal = true"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs transition-all duration-150 cursor-pointer"
        >
          <Plus :size="15" stroke-width="2.5" />
          <span>Tulis Pesan</span>
        </button>
      </div>
    </div>

    <!-- Success Toast Notification Banner -->
    <div
      v-if="showToast"
      class="p-3.5 rounded-2xl bg-brand-100/90 border border-brand-200 text-dark-green text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="flex items-center gap-2">
        <CheckCircle2 :size="16" class="text-dark-green shrink-0" />
        <span>{{ toastMessage }}</span>
      </div>
      <button @click="showToast = false" class="text-dark-green hover:opacity-80">
        <X :size="14" />
      </button>
    </div>

    <!-- 2. Two-Panel Messaging Container -->
    <div class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
      
      <!-- LEFT PANEL: MESSAGES LIST & NAVIGATION (5 COLS) -->
      <div class="lg:col-span-5 border-r border-gray-100 flex flex-col justify-between bg-surface/30">
        
        <!-- Top Toolbar & Search -->
        <div class="p-3.5 border-b border-gray-100 space-y-3 bg-white">
          <!-- Folder Tabs -->
          <div class="flex items-center justify-between gap-1 p-1 bg-surface rounded-xl border border-gray-200/60 text-xs">
            <button
              @click="selectedFolder = 'inbox'"
              :class="[
                'flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                selectedFolder === 'inbox' ? 'bg-white text-dark-green shadow-2xs' : 'text-text-muted hover:text-text-primary'
              ]"
            >
              <Inbox :size="14" />
              <span>Kotak Masuk</span>
              <span v-if="unreadInboxCount > 0" class="px-1.5 py-0.2 rounded-full bg-brand-100 text-dark-green text-[10px]">
                {{ unreadInboxCount }}
              </span>
            </button>

            <button
              @click="selectedFolder = 'sent'"
              :class="[
                'flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                selectedFolder === 'sent' ? 'bg-white text-dark-green shadow-2xs' : 'text-text-muted hover:text-text-primary'
              ]"
            >
              <Send :size="14" />
              <span>Terkirim</span>
            </button>

            <button
              @click="selectedFolder = 'archived'"
              :class="[
                'flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                selectedFolder === 'archived' ? 'bg-white text-dark-green shadow-2xs' : 'text-text-muted hover:text-text-primary'
              ]"
            >
              <Archive :size="14" />
              <span>Arsip</span>
            </button>
          </div>

          <!-- Search & Unread Filter -->
          <div class="flex items-center gap-2">
            <div class="relative flex-1">
              <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Cari pesan..."
                class="w-full pl-8 pr-3 py-1.5 bg-surface border border-gray-200/80 rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-400 focus:bg-white"
              />
            </div>
            
            <div class="flex items-center bg-surface p-1 rounded-xl border border-gray-200/80 text-xs">
              <button
                @click="filterMode = 'all'"
                :class="[
                  'px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all',
                  filterMode === 'all' ? 'bg-white text-dark-green shadow-2xs' : 'text-text-muted'
                ]"
              >
                Semua
              </button>
              <button
                @click="filterMode = 'unread'"
                :class="[
                  'px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all',
                  filterMode === 'unread' ? 'bg-white text-dark-green shadow-2xs' : 'text-text-muted'
                ]"
              >
                Belum Dibaca
              </button>
            </div>
          </div>
        </div>

        <!-- Messages List Container -->
        <div class="flex-1 overflow-y-auto divide-y divide-gray-100">
          <div
            v-for="msg in filteredMessages"
            :key="msg.id"
            @click="selectMessage(msg)"
            :class="[
              'p-3.5 transition-all cursor-pointer relative flex items-start gap-3',
              selectedMessageId === msg.id
                ? 'bg-brand-50/70 border-l-4 border-dark-green'
                : msg.isUnread
                  ? 'bg-white font-semibold'
                  : 'bg-surface/20 text-text-secondary hover:bg-surface/60'
            ]"
          >
            <!-- Avatar Circle -->
            <div class="w-9 h-9 rounded-full bg-gradient-to-br from-brand-200 to-dark-green text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
              {{ msg.avatarInitial }}
            </div>

            <!-- Message Preview Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-1 mb-0.5">
                <h4 :class="['text-xs truncate', msg.isUnread ? 'font-bold text-text-primary' : 'font-semibold text-text-secondary']">
                  {{ msg.senderName }}
                </h4>
                <span class="text-[10px] text-text-muted shrink-0 font-medium">{{ msg.timestamp }}</span>
              </div>

              <h5 :class="['text-xs truncate mb-1', msg.isUnread ? 'font-bold text-dark-green' : 'text-text-primary']">
                {{ msg.subject }}
              </h5>

              <p class="text-[11px] text-text-muted line-clamp-1 font-normal">
                {{ msg.preview }}
              </p>

              <div v-if="msg.hasAttachment" class="flex items-center gap-1 text-[10px] text-dark-green font-bold mt-1">
                <Paperclip :size="11" />
                <span>{{ msg.attachmentName }}</span>
              </div>
            </div>

            <!-- Unread Blue/Green Dot Indicator -->
            <span
              v-if="msg.isUnread"
              class="w-2 h-2 rounded-full bg-dark-green shrink-0 mt-1"
            ></span>
          </div>

          <!-- Empty Messages List State -->
          <div v-if="filteredMessages.length === 0" class="p-8 text-center text-text-muted space-y-2">
            <MessageSquare :size="32" class="mx-auto text-text-muted/50" />
            <h4 class="text-xs font-bold text-text-secondary">Tidak ada pesan ditemukan</h4>
            <p class="text-[11px]">Filter kotak pesan Anda tidak menghasilkan apa pun.</p>
          </div>
        </div>

      </div>

      <!-- RIGHT PANEL: MESSAGE DETAIL VIEW (7 COLS) -->
      <div class="lg:col-span-7 flex flex-col justify-between bg-white">
        
        <template v-if="selectedMessage">
          <!-- Detail View Top Bar -->
          <div class="p-4 border-b border-gray-100 flex items-center justify-between bg-surface/20">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-brand-200 to-dark-green text-white font-bold text-sm flex items-center justify-center shadow-xs">
                {{ selectedMessage.avatarInitial }}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-bold text-text-primary">{{ selectedMessage.senderName }}</h3>
                  <span class="px-2 py-0.5 rounded-full bg-brand-100 text-dark-green text-[10px] font-bold">
                    {{ selectedMessage.senderRole }}
                  </span>
                </div>
                <p class="text-xs text-text-muted font-normal">{{ selectedMessage.email }}</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <span class="text-xs text-text-muted font-medium mr-2">{{ selectedMessage.timestamp }}</span>
              <button
                @click="handleArchive"
                class="p-2 rounded-xl text-text-muted hover:text-dark-green hover:bg-brand-50 transition-colors cursor-pointer"
                title="Arsipkan pesan"
              >
                <Archive :size="16" />
              </button>
              <button
                @click="handleDelete"
                class="p-2 rounded-xl text-text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Hapus pesan"
              >
                <Trash2 :size="16" />
              </button>
            </div>
          </div>

          <!-- Detail Subject & Body -->
          <div class="p-6 flex-1 overflow-y-auto space-y-4">
            <h2 class="text-base sm:text-lg font-extrabold text-text-primary tracking-tight">
              {{ selectedMessage.subject }}
            </h2>

            <div class="p-4 rounded-2xl bg-surface/40 border border-gray-100 text-xs text-text-primary leading-relaxed whitespace-pre-line font-medium">
              {{ selectedMessage.body }}
            </div>

            <!-- Attachment Section if Available -->
            <div v-if="selectedMessage.hasAttachment" class="p-3 rounded-xl bg-brand-50/50 border border-brand-200/60 flex items-center justify-between text-xs">
              <div class="flex items-center gap-2 text-dark-green font-bold">
                <Paperclip :size="16" />
                <span>{{ selectedMessage.attachmentName }}</span>
              </div>
              <button class="text-xs text-dark-green font-bold hover:underline cursor-pointer">
                Unduh
              </button>
            </div>
          </div>

          <!-- Detail Bottom Action Bar -->
          <div class="p-4 border-t border-gray-100 flex items-center justify-between bg-surface/20">
            <button
              @click="handleReply"
              class="px-4 py-2 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <CornerUpLeft :size="14" />
              <span>Balas Pesan</span>
            </button>
            <span class="text-[11px] text-text-muted font-mono">ID: {{ selectedMessage.id.substring(0, 8) }}</span>
          </div>
        </template>

        <!-- Empty Selection State -->
        <template v-else>
          <div class="h-full flex items-center justify-center p-8 text-center text-text-muted space-y-3">
            <div>
              <Mail :size="40" class="mx-auto text-text-muted/40 mb-2" />
              <h3 class="text-sm font-bold text-text-secondary">Pilih pesan untuk melihat rincian</h3>
              <p class="text-xs text-text-muted max-w-sm mx-auto mt-1">
                Pilih pesan dari panel kotak masuk di sebelah kiri untuk membaca percakapan.
              </p>
            </div>
          </div>
        </template>

      </div>

    </div>

    <!-- 3. COMPOSE MESSAGE MODAL DIALOG -->
    <div
      v-if="showComposeModal"
      class="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xl w-full max-w-lg overflow-hidden space-y-4 p-5 sm:p-6 animate-in zoom-in-95 duration-150">
        <div class="flex items-center justify-between border-b border-gray-100 pb-3">
          <div class="flex items-center gap-2">
            <Mail :size="18" class="text-dark-green" />
            <h3 class="text-base font-bold text-text-primary tracking-tight">Tulis Pesan Baru</h3>
          </div>
          <button @click="showComposeModal = false" class="text-text-muted hover:text-text-primary cursor-pointer">
            <X :size="18" />
          </button>
        </div>

        <form @submit.prevent="handleSendMessage" class="space-y-4 text-xs">
          <div>
            <label class="block font-bold text-text-primary mb-1">Kepada (Penerima)</label>
            <select
              v-model="composeForm.recipientId"
              class="w-full px-3 py-2 bg-surface border border-gray-200 rounded-xl font-medium text-text-primary focus:outline-none focus:border-brand-400 focus:bg-white"
            >
              <option value="">Siaran / Seluruh Admin & Laboran</option>
              <option v-for="u in usersList" :key="u.id" :value="u.id">
                {{ u.fullName }} ({{ u.role || 'Pengguna' }}) — {{ u.email }}
              </option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-text-primary mb-1">Subjek</label>
            <input
              v-model="composeForm.subject"
              type="text"
              placeholder="Masukkan subjek pesan"
              required
              class="w-full px-3 py-2 bg-surface border border-gray-200 rounded-xl font-semibold text-text-primary focus:outline-none focus:border-brand-400 focus:bg-white"
            />
          </div>

          <div>
            <label class="block font-bold text-text-primary mb-1">Isi Pesan</label>
            <textarea
              v-model="composeForm.body"
              rows="5"
              placeholder="Tulis pesan Anda di sini..."
              required
              class="w-full px-3 py-2 bg-surface border border-gray-200 rounded-xl font-medium text-text-primary focus:outline-none focus:border-brand-400 focus:bg-white resize-none"
            ></textarea>
          </div>

          <div class="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              type="button"
              @click="showComposeModal = false"
              class="px-4 py-2 rounded-full border border-gray-200 text-text-primary font-semibold hover:bg-surface cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="isSending"
              class="px-5 py-2 rounded-full bg-dark-green hover:bg-[#547a5c] text-white font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Loader2 v-if="isSending" :size="14" class="animate-spin" />
              <span>{{ isSending ? 'Mengirim...' : 'Kirim Pesan' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>
