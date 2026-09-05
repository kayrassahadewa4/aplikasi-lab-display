<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import {
  ArrowLeft,
  Calendar,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  Building2,
  User,
  Users,
  X,
  AlertTriangle,
  GraduationCap,
  Sparkles,
  Layers,
  ShieldCheck,
  MapPin,
  ExternalLink
} from 'lucide-vue-next'
import type { ScheduleData } from '@/mocks/admin-schedules.mock'
import { scheduleService } from '@/services/schedule.service'
import { formatDateTime } from '@/utils/format.utils'

const route = useRoute()
const router = useRouter()
const navStore = useAdminNavStore()

const schId = route.params.id as string
const sch = ref<ScheduleData | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

const showDeleteConfirm = ref(false)
const isDeleting = ref(false)
const showToast = ref(false)
const toastMessage = ref('')

const scheduleDuration = computed(() => {
  if (!sch.value?.startTime || !sch.value?.endTime) return ''
  const [sH, sM] = sch.value.startTime.split(':').map(Number)
  const [eH, eM] = sch.value.endTime.split(':').map(Number)
  if (sH === undefined || eH === undefined) return ''
  const diffMinutes = (eH * 60 + (eM || 0)) - (sH * 60 + (sM || 0))
  if (diffMinutes <= 0) return ''
  const hours = Math.floor(diffMinutes / 60)
  const mins = diffMinutes % 60
  return mins > 0 ? `${hours}j ${mins}m` : `${hours} jam`
})

// Load schedule from API
const loadSchedule = async () => {
  isLoading.value = true
  error.value = null

  try {
    const schedule = await scheduleService.getScheduleById(schId)
    sch.value = schedule

    navStore.setBreadcrumbs([
      { label: 'Dashboard', path: '/admin' },
      { label: 'Jadwal Penggunaan', path: '/admin/schedules' },
      { label: schedule.courseName },
    ])
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Gagal memuat jadwal'
    console.error('Failed to load schedule:', err)
    if (err.response?.status === 404) {
      setTimeout(() => router.push('/admin/schedules'), 2000)
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadSchedule()
})

const handleEdit = () => {
  router.push(`/admin/schedules/${schId}/edit`)
}

const handleDelete = async () => {
  if (isDeleting.value) return

  isDeleting.value = true

  try {
    await scheduleService.deleteSchedule(schId)
    showDeleteConfirm.value = false
    toastMessage.value = 'Jadwal laboratorium berhasil dihapus.'
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
      router.push('/admin/schedules')
    }, 1500)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Gagal menghapus jadwal'
    console.error('Failed to delete schedule:', err)
    showDeleteConfirm.value = false
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="flex items-center justify-center min-h-[400px]">
    <div class="text-center space-y-3">
      <div class="w-12 h-12 border-4 border-brand-200 border-t-dark-green rounded-full animate-spin mx-auto"></div>
      <p class="text-sm text-text-muted font-medium">Memuat detail jadwal...</p>
    </div>
  </div>

  <!-- Error State -->
  <div v-else-if="error && !sch" class="flex items-center justify-center min-h-[400px]">
    <div class="text-center space-y-4 max-w-md">
      <div class="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
        <AlertTriangle :size="32" class="text-red-600" />
      </div>
      <div>
        <h3 class="text-lg font-bold text-text-primary mb-1">Gagal Memuat Jadwal</h3>
        <p class="text-sm text-text-muted">{{ error }}</p>
      </div>
      <button
        @click="loadSchedule"
        class="px-4 py-2 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
      >
        Coba Lagi
      </button>
    </div>
  </div>

  <!-- Content State -->
  <div v-else-if="sch && !isLoading" class="space-y-6 pb-12 w-full max-w-full min-w-0 select-none">
    <!-- 1. TOP HEADER & BREADCRUMB -->
    <div>
      <router-link
        to="/admin/schedules"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-dark-green hover:underline mb-2 cursor-pointer"
      >
        <ArrowLeft :size="14" />
        <span>Kembali ke Jadwal Penggunaan</span>
      </router-link>

      <div class="pb-3 border-b border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
              {{ sch.courseName }}
            </h1>
            <span
              :class="[
                'px-3 py-0.5 rounded-full text-xs font-extrabold border',
                sch.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : sch.status === 'SCHEDULED'
                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                    : 'bg-gray-100 text-text-muted border-gray-200'
              ]"
            >
              {{ sch.status === 'ACTIVE' ? 'Aktif' : sch.status === 'SCHEDULED' ? 'Terjadwal' : 'Tidak Aktif' }}
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted font-medium">
            {{ sch.laboratoryName }} ({{ sch.laboratoryCode }}) • Rutin Setiap {{ sch.dayName }} {{ sch.startTime }} – {{ sch.endTime }} WIB
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
              <GraduationCap :size="28" stroke-width="2.2" />
            </div>
            <div>
              <h2 class="text-lg font-extrabold text-text-primary">{{ sch.courseName }}</h2>
              <p class="text-xs text-text-muted mt-0.5 font-medium">Dosen: {{ sch.lecturerName }} • Kelas: {{ sch.className }}</p>
            </div>
          </div>
          <span class="text-xs font-mono font-bold text-dark-green bg-brand-50 px-3 py-1 rounded-full border border-brand-200/60 self-start sm:self-auto">
            Standar WIB (UTC+7)
          </span>
        </div>

        <!-- Structured Attributes & Details Grid -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 space-y-5">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-extrabold text-text-primary tracking-tight">Spesifikasi Jadwal Perkuliahan</h3>
            <p class="text-xs text-text-muted">Parameter detail jadwal perkuliahan dan konfigurasi slot mingguan.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Calendar :size="13" class="text-dark-green" />
                <span>Hari Pelaksanaan</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ sch.dayName }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Clock :size="13" class="text-dark-green" />
                <span>Rentang Waktu</span>
              </div>
              <p class="text-xs font-mono font-black text-dark-green truncate">{{ sch.startTime }} – {{ sch.endTime }} WIB</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Building2 :size="13" class="text-dark-green" />
                <span>Ruangan Ditugaskan</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ sch.laboratoryName }} ({{ sch.laboratoryCode }})</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <User :size="13" class="text-dark-green" />
                <span>Dosen Pengampu</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ sch.lecturerName }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Users :size="13" class="text-dark-green" />
                <span>Kelompok Kelas</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ sch.className }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Clock :size="13" class="text-dark-green" />
                <span>Durasi Sesi</span>
              </div>
              <p class="text-xs font-mono font-black text-dark-green truncate">{{ scheduleDuration || 'Standar' }}</p>
            </div>
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
            <span>Ubah Slot Jadwal</span>
          </button>
          <button
            @click="showDeleteConfirm = true"
            :disabled="isDeleting"
            class="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Trash2 :size="14" />
            <span>Hapus Slot Jadwal</span>
          </button>
        </div>

        <!-- Related Laboratory Snapshot Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-3">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <h4 class="text-xs font-black uppercase tracking-wider text-text-secondary">Ruangan Ditugaskan</h4>
            <span class="px-2 py-0.5 rounded-full bg-brand-100 font-mono text-[10px] font-bold text-dark-green">
              {{ sch.laboratoryCode || 'RUANG' }}
            </span>
          </div>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between py-1 border-b border-gray-50">
              <span class="text-text-muted">Nama Ruangan</span>
              <span class="font-bold text-text-primary truncate max-w-[170px] text-right">{{ sch.laboratoryName || 'Ruang Laboratorium' }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-gray-50">
              <span class="text-text-muted">Hari Berulang</span>
              <span class="font-bold text-dark-green">{{ sch.dayName }}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-text-muted">Sesi Waktu</span>
              <span class="font-mono font-bold text-text-primary">{{ sch.startTime }} – {{ sch.endTime }}</span>
            </div>
          </div>
        </div>

        <!-- System Audit Information -->
        <div class="bg-surface/60 rounded-2xl border border-gray-200/70 p-4 space-y-2 text-[11px] text-text-muted">
          <div class="flex justify-between">
            <span>ID Jadwal</span>
            <span class="font-mono text-[10px] text-text-secondary truncate max-w-[140px]">{{ sch.id }}</span>
          </div>
          <div class="flex justify-between">
            <span>Periode Akademik</span>
            <span class="font-medium text-text-secondary truncate max-w-[140px]">{{ sch.academicCalendarId || 'Semester Aktif' }}</span>
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
          <h3 class="text-sm font-bold text-text-primary">Hapus Jadwal Laboratorium?</h3>
        </div>

        <p class="text-text-muted leading-relaxed">
          Apakah Anda yakin ingin menghapus jadwal <strong class="text-text-primary">{{ sch.courseName }}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            @click="showDeleteConfirm = false"
            :disabled="isDeleting"
            class="px-4 py-2 rounded-full border border-gray-200 text-text-primary font-semibold hover:bg-surface cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button
            @click="handleDelete"
            :disabled="isDeleting"
            class="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <div v-if="isDeleting" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>{{ isDeleting ? 'Menghapus...' : 'Hapus Jadwal' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
