<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLaboranNavStore } from '@/stores/laboran-nav.store'
import {
  ArrowLeft,
  Megaphone,
  Calendar,
  Clock,
  CheckCircle2,
  Building2,
  DoorOpen,
  FileText,
  Sparkles,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Radio,
  ExternalLink
} from 'lucide-vue-next'
import { announcementService, type AnnouncementDto } from '@/services/announcement.service'
import { formatDate } from '@/utils/format.utils'

const route = useRoute()
const router = useRouter()
const navStore = useLaboranNavStore()

const announcementId = computed(() => route.params.id as string)
const announcementItem = ref<AnnouncementDto | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')

onMounted(() => {
  navStore.setBreadcrumbs([
    { label: 'Portal Laboran', path: '/laboran' },
    { label: 'Pengumuman', path: '/laboran/announcements' },
    { label: 'Detail Pengumuman' },
  ])
  loadAnnouncement()
})

const loadAnnouncement = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    announcementItem.value = await announcementService.getAnnouncementById(announcementId.value)
  } catch (err: any) {
    errorMessage.value = err.message || 'Gagal memuat pengumuman'
  } finally {
    isLoading.value = false
  }
}

const getAnnouncementStatus = (item: AnnouncementDto): 'Active' | 'Scheduled' | 'Expired' => {
  const now = new Date()
  const startAt = new Date(item.start_at)
  const endAt = new Date(item.end_at)
  if (!item.is_active) return 'Expired'
  if (now < startAt) return 'Scheduled'
  if (now > endAt) return 'Expired'
  return 'Active'
}

const handleBack = () => {
  router.push('/laboran/announcements')
}

const navigateToSchedules = () => {
  router.push('/laboran/schedules')
}

const navigateToRoomUsage = () => {
  router.push('/laboran/room-usage')
}

const navigateToLaboratories = () => {
  router.push('/laboran/laboratories')
}
</script>

<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="flex items-center justify-center min-h-[400px]">
    <div class="text-center space-y-3">
      <div class="w-12 h-12 border-4 border-brand-200 border-t-dark-green rounded-full animate-spin mx-auto"></div>
      <p class="text-sm text-text-muted font-medium">Memuat pengumuman...</p>
    </div>
  </div>

  <!-- Error State -->
  <div v-else-if="errorMessage || !announcementItem" class="flex items-center justify-center min-h-[400px]">
    <div class="text-center space-y-4 max-w-md">
      <div class="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
        <AlertCircle :size="32" class="text-red-600" />
      </div>
      <div>
        <h3 class="text-lg font-bold text-text-primary mb-1">Gagal Memuat Pengumuman</h3>
        <p class="text-sm text-text-muted">{{ errorMessage || 'Data pengumuman tidak ditemukan.' }}</p>
      </div>
      <button
        @click="handleBack"
        class="px-4 py-2 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
      >
        Kembali ke Pengumuman
      </button>
    </div>
  </div>

  <!-- Content -->
  <div v-else class="space-y-6 pb-12 w-full max-w-full min-w-0 select-none">
    <!-- 1. Header & Navigation -->
    <div>
      <button
        @click="handleBack"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-dark-green hover:underline mb-2 cursor-pointer"
      >
        <ArrowLeft :size="14" />
        <span>Kembali ke Pengumuman</span>
      </button>

      <div class="pb-3 border-b border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
              {{ announcementItem.title }}
            </h1>
            <span
              :class="[
                'px-3 py-0.5 rounded-full text-xs font-extrabold border',
                getAnnouncementStatus(announcementItem) === 'Active'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : getAnnouncementStatus(announcementItem) === 'Scheduled'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-gray-100 text-text-muted border-gray-200'
              ]"
            >
              {{ getAnnouncementStatus(announcementItem) === 'Active' ? 'Aktif' : getAnnouncementStatus(announcementItem) === 'Scheduled' ? 'Terjadwal' : 'Kedaluwarsa' }}
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted font-medium">
            Diterbitkan pada {{ formatDate(announcementItem.start_at) }} • Target: Semua Laboratorium & Kiosk Display
          </p>
        </div>
      </div>
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
              <h2 class="text-lg font-extrabold text-text-primary">{{ announcementItem.title }}</h2>
              <p class="text-xs text-text-muted mt-0.5 font-medium">Jendela Penayangan: {{ formatDate(announcementItem.start_at) }} – {{ formatDate(announcementItem.end_at) }}</p>
            </div>
          </div>
          <span class="text-xs font-mono font-bold text-dark-green bg-brand-50 px-3 py-1 rounded-full border border-brand-200/60 self-start sm:self-auto">
            Buletin Resmi
          </span>
        </div>

        <!-- Structured Attributes & Details Grid -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 space-y-5">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-extrabold text-text-primary tracking-tight">Metadata Siaran</h3>
            <p class="text-xs text-text-muted">Penjadwalan siaran dan parameter distribusi audiens.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Calendar :size="13" class="text-dark-green" />
                <span>Mulai Penayangan</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ formatDate(announcementItem.start_at) }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Calendar :size="13" class="text-dark-green" />
                <span>Selesai Penayangan</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ formatDate(announcementItem.end_at) }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Radio :size="13" class="text-dark-green" />
                <span>Cakupan Siaran</span>
              </div>
              <p class="text-xs font-bold text-dark-green truncate">Semua Laboratorium</p>
            </div>
          </div>
        </div>

        <!-- Complete Body Content Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 space-y-4">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-extrabold text-text-primary tracking-tight">Isi Lengkap Pengumuman</h3>
            <p class="text-xs text-text-muted">Teks pesan buletin resmi yang disiarkan kepada mahasiswa dan staf.</p>
          </div>

          <div class="p-5 rounded-xl bg-surface/70 border border-gray-200/70 text-xs sm:text-sm text-text-primary leading-relaxed whitespace-pre-line font-medium select-text">
            {{ announcementItem.content }}
          </div>

          <!-- Operational Directive Box -->
          <div class="p-4 rounded-xl bg-brand-50/60 border border-brand-200/80 space-y-1.5 text-xs">
            <span class="font-black text-dark-green block uppercase tracking-wider text-[10px]">Arahan Operasional Staf</span>
            <p class="text-text-secondary leading-relaxed">
              Staf laboratorium (Laboran) diimbau untuk memverifikasi ketersediaan ruangan dan kesesuaian jadwal operasional. Harap laporkan jika terdapat ketidaksesuaian operasional ke koordinator lab.
            </p>
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- RIGHT COLUMN: ACTIONS & CONTEXTUAL SIDEBAR (4 COLS)      -->
      <!-- ======================================================== -->
      <div class="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
        <!-- Quick Operational Actions Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 sm:p-6 space-y-3">
          <h4 class="text-xs font-black uppercase tracking-wider text-text-primary">Alur Kerja Terkait</h4>
          <button
            @click="navigateToSchedules"
            class="w-full py-2.5 px-4 rounded-xl border border-gray-200/80 bg-surface/60 hover:bg-brand-50/60 hover:border-brand-300 text-xs font-bold text-text-primary hover:text-dark-green transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Calendar :size="14" class="text-dark-green" />
            <span>Lihat Jadwal Utama</span>
          </button>
          <button
            @click="navigateToRoomUsage"
            class="w-full py-2.5 px-4 rounded-xl border border-gray-200/80 bg-surface/60 hover:bg-brand-50/60 hover:border-brand-300 text-xs font-bold text-text-primary hover:text-dark-green transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <DoorOpen :size="14" class="text-dark-green" />
            <span>Periksa Pemakaian Ruangan Aktif</span>
          </button>
          <button
            @click="navigateToLaboratories"
            class="w-full py-2.5 px-4 rounded-xl border border-gray-200/80 bg-surface/60 hover:bg-brand-50/60 hover:border-brand-300 text-xs font-bold text-text-primary hover:text-dark-green transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Building2 :size="14" class="text-dark-green" />
            <span>Periksa Laboratorium</span>
          </button>
        </div>

        <!-- Bulletin Snapshot Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-3">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <h4 class="text-xs font-black uppercase tracking-wider text-text-secondary">Status Siaran</h4>
            <span class="px-2 py-0.5 rounded-full bg-brand-100 font-mono text-[10px] font-bold text-dark-green">
              SEMUA KIOSK
            </span>
          </div>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between py-1 border-b border-gray-50">
              <span class="text-text-muted">Status Penayangan</span>
              <span class="font-bold text-dark-green">{{ getAnnouncementStatus(announcementItem) === 'Active' ? 'Aktif' : getAnnouncementStatus(announcementItem) === 'Scheduled' ? 'Terjadwal' : 'Kedaluwarsa' }}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-text-muted">Audiens</span>
              <span class="font-medium text-text-secondary">Kiosk Publik & Mahasiswa</span>
            </div>
          </div>
        </div>

        <!-- System Audit Information -->
        <div class="bg-surface/60 rounded-2xl border border-gray-200/70 p-4 space-y-2 text-[11px] text-text-muted">
          <div class="flex justify-between">
            <span>UUID Pengumuman</span>
            <span class="font-mono text-[10px] text-text-secondary truncate max-w-[140px]">{{ announcementItem.id }}</span>
          </div>
          <div class="flex justify-between">
            <span>Diterbitkan</span>
            <span class="font-medium text-text-secondary">{{ formatDate(announcementItem.start_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
