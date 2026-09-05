<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import {
  ArrowLeft,
  Megaphone,
  Edit3,
  Trash2,
  CheckCircle2,
  Calendar,
  Clock,
  X,
  AlertTriangle,
  Sparkles,
  Radio,
  Eye,
  ShieldCheck,
  FileText
} from 'lucide-vue-next'
import { announcementService, type AnnouncementDto } from '@/services/announcement.service'
import type { AnnouncementData } from '@/mocks/admin-announcements.mock'
import { formatDate } from '@/utils/format.utils'

const route = useRoute()
const router = useRouter()
const navStore = useAdminNavStore()

const ancId = route.params.id as string
const anc = ref<AnnouncementData | null>(null)

const showDeleteConfirm = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const isDeleting = ref(false)

const mapAnnouncementToUi = (dto: AnnouncementDto): AnnouncementData => {
  const now = new Date()
  const start = new Date(dto.start_at)
  const end = new Date(dto.end_at)

  let status: 'Active' | 'Scheduled' | 'Expired' = 'Active'
  if (!dto.is_active || now > end) {
    status = 'Expired'
  } else if (now < start) {
    status = 'Scheduled'
  } else {
    status = 'Active'
  }

  return {
    id: dto.id,
    title: dto.title,
    content: dto.content,
    startDate: dto.start_at ? dto.start_at.slice(0, 10) : '',
    endDate: dto.end_at ? dto.end_at.slice(0, 10) : '',
    formattedStartDate: formatDate(dto.start_at),
    formattedEndDate: formatDate(dto.end_at),
    status,
    createdAt: formatDate(dto.created_at),
    updatedAt: formatDate(dto.updated_at),
  }
}

onMounted(async () => {
  try {
    const found = await announcementService.getAnnouncementById(ancId)
    anc.value = mapAnnouncementToUi(found)
    navStore.setBreadcrumbs([
      { label: 'Dashboard', path: '/admin' },
      { label: 'Pengumuman', path: '/admin/announcements' },
      { label: found.title },
    ])
  } catch {
    router.push('/admin/announcements')
  }
})

const handleEdit = () => {
  router.push(`/admin/announcements/${ancId}/edit`)
}

const handleDelete = async () => {
  isDeleting.value = true
  try {
    await announcementService.deleteAnnouncement(ancId)
    showDeleteConfirm.value = false
    toastMessage.value = 'Pengumuman berhasil dihapus.'
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
      router.push('/admin/announcements')
    }, 1000)
  } catch (error: any) {
    alert(error.response?.data?.message || error.message || 'Gagal menghapus pengumuman')
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div v-if="anc" class="space-y-6 pb-12 w-full max-w-full min-w-0 select-none">
    <!-- 1. TOP HEADER & BREADCRUMB -->
    <div>
      <router-link
        to="/admin/announcements"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-dark-green hover:underline mb-2 cursor-pointer"
      >
        <ArrowLeft :size="14" />
        <span>Kembali ke Pengumuman</span>
      </router-link>

      <div class="pb-3 border-b border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
              {{ anc.title }}
            </h1>
            <span
              :class="[
                'px-3 py-0.5 rounded-full text-xs font-extrabold border',
                anc.status === 'Active'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : anc.status === 'Scheduled'
                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                    : 'bg-gray-100 text-text-muted border-gray-200'
              ]"
            >
              {{ anc.status === 'Active' ? 'Aktif' : anc.status === 'Scheduled' ? 'Terjadwal' : 'Kedaluwarsa' }}
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted font-medium">
            Rentang Penayangan: {{ anc.formattedStartDate }} — {{ anc.formattedEndDate }}
          </p>
        </div>
      </div>
    </div>

    <!-- Success Toast Feedback Banner -->
    <div
      v-if="showToast"
      class="p-3.5 rounded-2xl bg-brand-100/90 border border-brand-200 text-dark-green text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="flex items-center gap-2">
        <CheckCircle2 :size="16" class="text-dark-green shrink-0" />
        <span>{{ toastMessage }}</span>
      </div>
      <button @click="showToast = false" class="text-dark-green hover:opacity-80 cursor-pointer">
        <X :size="14" />
      </button>
    </div>

    <!-- 2. MAIN 2-COLUMN GRID (8 COLS DATA + 4 COLS SIDEBAR) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- ======================================================== -->
      <!-- LEFT COLUMN: SPECIFICATIONS & CORE ATTRIBUTES (8 COLS)   -->
      <!-- ======================================================== -->
      <div class="lg:col-span-8 space-y-6">
        <!-- Hero Overview Banner Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <Megaphone :size="28" stroke-width="2.2" />
            </div>
            <div>
              <h2 class="text-lg font-extrabold text-text-primary">{{ anc.title }}</h2>
              <p class="text-xs text-text-muted mt-0.5 font-medium">Diterbitkan: {{ anc.createdAt }}</p>
            </div>
          </div>
          <span class="text-xs font-mono font-bold text-dark-green bg-brand-50 px-3 py-1 rounded-full border border-brand-200/60 self-start sm:self-auto">
            Pemberitahuan Siaran Langsung
          </span>
        </div>

        <!-- Structured Attributes & Details Grid -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 space-y-5">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-extrabold text-text-primary tracking-tight">Parameter Penayangan</h3>
            <p class="text-xs text-text-muted">Jadwal tayang dan status visibilitas.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Calendar :size="13" class="text-dark-green" />
                <span>Tanggal Mulai</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ anc.formattedStartDate }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Calendar :size="13" class="text-dark-green" />
                <span>Tanggal Selesai</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ anc.formattedEndDate }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Radio :size="13" class="text-dark-green" />
                <span>Status Penayangan</span>
              </div>
              <p class="text-xs font-bold text-dark-green truncate">{{ anc.status === 'Active' ? 'Aktif' : anc.status === 'Scheduled' ? 'Terjadwal' : 'Kedaluwarsa' }}</p>
            </div>
          </div>
        </div>

        <!-- Notice Content Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 space-y-4">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-extrabold text-text-primary tracking-tight">Pesan Teks Berjalan Layar Display</h3>
            <p class="text-xs text-text-muted">Konten siaran yang ditampilkan pada monitor publik.</p>
          </div>

          <div class="p-5 rounded-xl bg-surface/70 border border-gray-200/70 text-xs text-text-primary leading-relaxed whitespace-pre-line font-medium">
            {{ anc.content }}
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- RIGHT COLUMN: ACTIONS & CONTEXTUAL SIDEBAR (4 COLS)      -->
      <!-- ======================================================== -->
      <div class="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
        <!-- Action Management Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 sm:p-6 space-y-3">
          <h4 class="text-xs font-black uppercase tracking-wider text-text-primary">Tindakan Pengelolaan</h4>
          <button
            @click="handleEdit"
            class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#3B694A] to-[#2D5A3F] hover:from-[#31573E] hover:to-[#244430] text-white font-extrabold text-xs shadow-xs shadow-[#2D5A3F]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Edit3 :size="14" />
            <span>Ubah Pengumuman</span>
          </button>
          <button
            @click="showDeleteConfirm = true"
            :disabled="isDeleting"
            class="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Trash2 :size="14" />
            <span>Hapus Pengumuman</span>
          </button>
        </div>

        <!-- Broadcast Status Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-3">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <h4 class="text-xs font-black uppercase tracking-wider text-text-secondary">Target Siaran</h4>
            <span class="px-2 py-0.5 rounded-full bg-brand-100 font-mono text-[10px] font-bold text-dark-green">
              SEMUA KIOSK DISPLAY
            </span>
          </div>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between py-1 border-b border-gray-50">
              <span class="text-text-muted">Status Saat Ini</span>
              <span class="font-bold text-dark-green">{{ anc.status === 'Active' ? 'Aktif' : anc.status === 'Scheduled' ? 'Terjadwal' : 'Kedaluwarsa' }}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-text-muted">Tipe Tampilan</span>
              <span class="font-bold text-text-primary">Teks Berjalan & Peringatan Layar</span>
            </div>
          </div>
        </div>

        <!-- System Audit Information -->
        <div class="bg-surface/60 rounded-2xl border border-gray-200/70 p-4 space-y-2 text-[11px] text-text-muted">
          <div class="flex justify-between">
            <span>Dibuat</span>
            <span class="font-medium text-text-secondary">{{ anc.createdAt }}</span>
          </div>
          <div class="flex justify-between">
            <span>Terakhir Diperbarui</span>
            <span class="font-medium text-text-secondary">{{ anc.updatedAt }}</span>
          </div>
          <div class="flex justify-between font-mono text-[10px] pt-1 border-t border-gray-200/60">
            <span>UUID</span>
            <span class="truncate max-w-[120px]">{{ anc.id }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal Dialog -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xl w-full max-w-sm overflow-hidden p-5 space-y-4 text-xs animate-in zoom-in-95 duration-150">
        <div class="flex items-center gap-3 text-red-600">
          <div class="p-2 bg-red-50 rounded-xl">
            <Trash2 :size="20" />
          </div>
          <h3 class="text-sm font-bold text-text-primary">Hapus Pengumuman?</h3>
        </div>

        <p class="text-text-muted leading-relaxed">
          Apakah Anda yakin ingin menghapus <strong class="text-text-primary">{{ anc.title }}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            @click="showDeleteConfirm = false"
            class="px-4 py-2 rounded-full border border-gray-200 text-text-primary font-semibold hover:bg-surface cursor-pointer"
          >
            Batal
          </button>
          <button
            @click="handleDelete"
            class="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
          >
            Hapus Pengumuman
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
