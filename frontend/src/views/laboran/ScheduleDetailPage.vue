<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLaboranNavStore } from '@/stores/laboran-nav.store'
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Building2,
  CheckCircle2,
  DoorOpen,
  FileText,
  Layers,
  Wrench,
  Sparkles,
  Activity,
  XCircle,
  Loader2,
  AlertTriangle,
  GraduationCap,
  Users,
  ShieldCheck
} from 'lucide-vue-next'
import { scheduleService, type ScheduleData } from '@/services/schedule.service'

const route = useRoute()
const router = useRouter()
const navStore = useLaboranNavStore()

const scheduleId = computed(() => route.params.id as string)
const scheduleItem = ref<ScheduleData | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')

onMounted(() => {
  navStore.setBreadcrumbs([
    { label: 'Portal Laboran', path: '/laboran' },
    { label: 'Jadwal Penggunaan', path: '/laboran/schedules' },
    { label: 'Detail Jadwal' },
  ])
  loadSchedule()
})

const loadSchedule = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    scheduleItem.value = await scheduleService.getScheduleById(scheduleId.value)
  } catch (err: any) {
    errorMessage.value = err.message || 'Gagal memuat jadwal'
  } finally {
    isLoading.value = false
  }
}

const handleBack = () => {
  router.push('/laboran/schedules')
}

const handleOpenRoomUsage = () => {
  router.push('/laboran/room-usage')
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
  <div v-else-if="errorMessage || !scheduleItem" class="flex items-center justify-center min-h-[400px]">
    <div class="text-center space-y-4 max-w-md">
      <div class="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
        <AlertTriangle :size="32" class="text-red-600" />
      </div>
      <div>
        <h3 class="text-lg font-bold text-text-primary mb-1">Gagal Memuat Jadwal</h3>
        <p class="text-sm text-text-muted">{{ errorMessage || 'Data jadwal tidak ditemukan.' }}</p>
      </div>
      <button
        @click="handleBack"
        class="px-4 py-2 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
      >
        Kembali ke Jadwal Penggunaan
      </button>
    </div>
  </div>

  <!-- Content (Full-width 2-Column Layout) -->
  <div v-else class="space-y-6 pb-12 w-full max-w-full min-w-0 select-none">
    <!-- 1. Header & Back Navigation -->
    <div>
      <button
        @click="handleBack"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-dark-green hover:underline mb-2 cursor-pointer"
      >
        <ArrowLeft :size="14" />
        <span>Kembali ke Jadwal Penggunaan</span>
      </button>

      <div class="pb-3 border-b border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
              {{ scheduleItem.courseName }}
            </h1>
            <span
              :class="[
                'inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-extrabold border',
                scheduleItem.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs'
                  : scheduleItem.status === 'SCHEDULED'
                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                    : 'bg-gray-100 text-text-muted border-gray-200'
              ]"
            >
              <span v-if="scheduleItem.status === 'ACTIVE'" class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{{ scheduleItem.status === 'ACTIVE' ? 'Aktif' : scheduleItem.status === 'SCHEDULED' ? 'Terjadwal' : 'Tidak Aktif' }}</span>
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted font-medium">
            {{ scheduleItem.laboratoryName }} ({{ scheduleItem.laboratoryCode }}) • {{ scheduleItem.dayName }} {{ scheduleItem.startTime }} – {{ scheduleItem.endTime }} WIB
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
              <GraduationCap :size="28" stroke-width="2.2" />
            </div>
            <div>
              <h2 class="text-lg font-extrabold text-text-primary">{{ scheduleItem.courseName }}</h2>
              <p class="text-xs text-text-muted mt-0.5 font-medium">Dosen Pengampu: {{ scheduleItem.lecturerName }} • Kelas: {{ scheduleItem.className }}</p>
            </div>
          </div>
          <span class="text-xs font-mono font-bold text-dark-green bg-brand-50 px-3 py-1 rounded-full border border-brand-200/60 self-start sm:self-auto">
            Standar WIB (UTC+7)
          </span>
        </div>

        <!-- Structured Attributes & Details Grid -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 space-y-5">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-extrabold text-text-primary tracking-tight">Rincian Alokasi Jadwal</h3>
            <p class="text-xs text-text-muted">Hari, rentang waktu, dosen pengampu, dan ruangan laboratorium.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Calendar :size="13" class="text-dark-green" />
                <span>Hari Pelaksanaan</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ scheduleItem.dayName }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Clock :size="13" class="text-dark-green" />
                <span>Rentang Waktu</span>
              </div>
              <p class="text-xs font-mono font-black text-dark-green truncate">{{ scheduleItem.startTime }} – {{ scheduleItem.endTime }} WIB</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Building2 :size="13" class="text-dark-green" />
                <span>Laboratorium Ditugaskan</span>
              </div>
              <p class="text-xs font-mono font-black text-dark-green truncate">{{ scheduleItem.laboratoryCode }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <User :size="13" class="text-dark-green" />
                <span>Dosen Pengampu</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ scheduleItem.lecturerName }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Users :size="13" class="text-dark-green" />
                <span>Kelompok Kelas</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ scheduleItem.className }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <ShieldCheck :size="13" class="text-dark-green" />
                <span>Status Jadwal</span>
              </div>
              <p class="text-xs font-bold text-dark-green truncate">{{ scheduleItem.status === 'ACTIVE' ? 'Aktif' : scheduleItem.status === 'SCHEDULED' ? 'Terjadwal' : 'Tidak Aktif' }}</p>
            </div>
          </div>
        </div>

        <!-- Operational Guidelines Note Card -->
        <div class="p-5 rounded-2xl bg-brand-50/60 border border-brand-200/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div class="space-y-1">
            <h4 class="font-extrabold text-dark-green text-sm">Alur Kerja Check-In / Check-Out Operasional</h4>
            <p class="text-text-secondary">
              Staf laboratorium dapat melacak kedatangan, kepulangan, dan status sesi ruangan langsung secara real-time melalui panel Log Pemakaian Lab.
            </p>
          </div>

          <button
            @click="handleOpenRoomUsage"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <DoorOpen :size="14" />
            <span>Kelola Pemakaian Lab</span>
          </button>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- RIGHT COLUMN: ACTIONS & CONTEXTUAL SIDEBAR (4 COLS)      -->
      <!-- ======================================================== -->
      <div class="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
        <!-- Quick Operational Actions Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 sm:p-6 space-y-3">
          <h4 class="text-xs font-black uppercase tracking-wider text-text-primary">Aksi Operasional</h4>
          <button
            @click="handleOpenRoomUsage"
            class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#3B694A] to-[#2D5A3F] hover:from-[#31573E] hover:to-[#244430] text-white font-extrabold text-xs shadow-xs shadow-[#2D5A3F]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <DoorOpen :size="14" />
            <span>Buka Log Pemakaian Lab</span>
          </button>
          <button
            @click="handleBack"
            class="w-full py-2.5 px-4 rounded-xl border border-gray-200/80 hover:bg-surface text-text-secondary font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
          >
            <span>Kembali ke Jadwal Penggunaan</span>
          </button>
        </div>

        <!-- Room Snapshot Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-3">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <h4 class="text-xs font-black uppercase tracking-wider text-text-secondary">Ruangan Ditugaskan</h4>
            <span class="px-2 py-0.5 rounded-full bg-brand-100 font-mono text-[10px] font-bold text-dark-green">
              {{ scheduleItem.laboratoryCode }}
            </span>
          </div>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between py-1 border-b border-gray-50">
              <span class="text-text-muted">Nama Ruangan</span>
              <span class="font-bold text-text-primary truncate max-w-[170px] text-right">{{ scheduleItem.laboratoryName }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-gray-50">
              <span class="text-text-muted">Hari Berulang</span>
              <span class="font-bold text-dark-green">{{ scheduleItem.dayName }}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-text-muted">Sesi Waktu</span>
              <span class="font-mono font-bold text-text-primary">{{ scheduleItem.startTime }} – {{ scheduleItem.endTime }}</span>
            </div>
          </div>
        </div>

        <!-- System Audit Information -->
        <div class="bg-surface/60 rounded-2xl border border-gray-200/70 p-4 space-y-2 text-[11px] text-text-muted">
          <div class="flex justify-between">
            <span>UUID Jadwal</span>
            <span class="font-mono text-[10px] text-text-secondary truncate max-w-[140px]">{{ scheduleItem.id }}</span>
          </div>
          <div class="flex justify-between">
            <span>Periode Akademik</span>
            <span class="font-medium text-text-secondary truncate max-w-[140px]">{{ scheduleItem.academicCalendarId || 'Semester Aktif' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
