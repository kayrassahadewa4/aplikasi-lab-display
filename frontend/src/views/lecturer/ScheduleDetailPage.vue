<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLecturerNavStore } from '@/stores/lecturer-nav.store'
import {
  ArrowLeft,
  Calendar,
  Clock,
  FlaskConical,
  User,
  GraduationCap,
  Building2,
  CheckCircle2,
  Link2,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  X,
  Loader2,
  Plus,
  Users,
  ShieldCheck
} from 'lucide-vue-next'
import { scheduleService, type ScheduleData } from '@/services/schedule.service'

const route = useRoute()
const router = useRouter()
const navStore = useLecturerNavStore()

const schedule = ref<ScheduleData | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')

const loadScheduleDetail = async () => {
  const scheduleId = route.params.id as string
  if (!scheduleId) {
    router.push('/lecturer/schedules')
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  try {
    const data = await scheduleService.getScheduleById(scheduleId)
    schedule.value = data

    navStore.setBreadcrumbs([
      { label: 'Portal Dosen', path: '/lecturer' },
      { label: 'Jadwal Penggunaan Lab', path: '/lecturer/schedules' },
      { label: data.courseName },
    ])
  } catch (err: any) {
    errorMessage.value = err.message || 'Gagal memuat detail jadwal perkuliahan'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadScheduleDetail()
})

const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="flex items-center justify-center min-h-[400px]">
    <div class="text-center space-y-3">
      <div class="w-12 h-12 border-4 border-brand-200 border-t-dark-green rounded-full animate-spin mx-auto"></div>
      <p class="text-sm text-text-muted font-medium">Memuat detail jadwal perkuliahan...</p>
    </div>
  </div>

  <!-- Error State -->
  <div v-else-if="errorMessage || !schedule" class="flex items-center justify-center min-h-[400px]">
    <div class="text-center space-y-4 max-w-md">
      <div class="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
        <AlertCircle :size="32" class="text-red-600" />
      </div>
      <div>
        <h3 class="text-lg font-bold text-text-primary mb-1">Gagal Memuat Jadwal</h3>
        <p class="text-sm text-text-muted">{{ errorMessage || 'Data jadwal perkuliahan tidak ditemukan.' }}</p>
      </div>
      <button
        @click="navigateTo('/lecturer/schedules')"
        class="px-4 py-2 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
      >
        Kembali ke Jadwal
      </button>
    </div>
  </div>

  <!-- Content (Full-width 12-column grid: 8 cols + 4 cols) -->
  <div v-else class="space-y-6 pb-12 w-full max-w-full min-w-0 select-none">
    <!-- 1. Header with Back Button & Title -->
    <div>
      <button
        @click="navigateTo('/lecturer/schedules')"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-dark-green hover:underline mb-2 cursor-pointer"
      >
        <ArrowLeft :size="14" />
        <span>Kembali ke Jadwal</span>
      </button>

      <div class="pb-3 border-b border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
              {{ schedule.courseName }}
            </h1>
            <span
              :class="[
                'inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-extrabold border shadow-2xs',
                schedule.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : schedule.status === 'SCHEDULED'
                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                    : 'bg-gray-100 text-text-muted border-gray-200'
              ]"
            >
              <span v-if="schedule.status === 'ACTIVE'" class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{{ schedule.status === 'ACTIVE' ? 'Sedang Berjalan' : schedule.status === 'SCHEDULED' ? 'Terjadwal' : 'Selesai' }}</span>
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted font-medium">
            Hari: <span class="font-bold text-text-secondary">{{ schedule.dayName }}</span> • {{ schedule.startTime }} – {{ schedule.endTime }} WIB • Ruang: {{ schedule.laboratoryCode }}
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
              <h2 class="text-lg font-extrabold text-text-primary">{{ schedule.courseName }}</h2>
              <p class="text-xs text-text-muted mt-0.5 font-medium">Kelas: {{ schedule.className }} • Dosen: {{ schedule.lecturerName }}</p>
            </div>
          </div>
          <span class="text-xs font-mono font-bold text-dark-green bg-brand-50 px-3 py-1 rounded-full border border-brand-200/60 self-start sm:self-auto">
            Waktu Standar WIB (UTC+7)
          </span>
        </div>

        <!-- Structured Attributes & Details Grid -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 space-y-5">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-extrabold text-text-primary tracking-tight">Rincian Praktikum Akademik</h3>
            <p class="text-xs text-text-muted">Hari, rentang waktu, ruangan yang ditetapkan, dan kelas praktikum.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Calendar :size="13" class="text-dark-green" />
                <span>Hari Pelaksanaan</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ schedule.dayName }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Clock :size="13" class="text-dark-green" />
                <span>Jam Operasional</span>
              </div>
              <p class="text-xs font-mono font-black text-dark-green truncate">{{ schedule.startTime }} – {{ schedule.endTime }} WIB</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Building2 :size="13" class="text-dark-green" />
                <span>Laboratorium Ditugaskan</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ schedule.laboratoryName }} ({{ schedule.laboratoryCode }})</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Users :size="13" class="text-dark-green" />
                <span>Kelas / Kelompok</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ schedule.className }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <User :size="13" class="text-dark-green" />
                <span>Dosen Pengampu</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ schedule.lecturerName }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <ShieldCheck :size="13" class="text-dark-green" />
                <span>Status Jadwal</span>
              </div>
              <p class="text-xs font-bold text-dark-green truncate">{{
                schedule.status === 'ACTIVE'
                  ? 'Sedang Berjalan'
                  : schedule.status === 'SCHEDULED'
                    ? 'Terjadwal'
                    : 'Selesai'
              }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- RIGHT COLUMN: ACTIONS & CONTEXTUAL SIDEBAR (4 COLS)      -->
      <!-- ======================================================== -->
      <div class="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
        <!-- Quick Action Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 sm:p-6 space-y-3.5">
          <div class="space-y-1">
            <span class="px-2.5 py-0.5 rounded-full bg-brand-100 text-dark-green text-[10px] font-extrabold uppercase tracking-wider">
              RESERVASI RUANGAN
            </span>
            <h3 class="text-base font-extrabold text-text-primary pt-1">
              Pinjam Ruangan Tambahan
            </h3>
            <p class="text-xs text-text-muted leading-relaxed">
              Memerlukan jam tambahan atau praktikum pengganti untuk mata kuliah ini? Ajukan permohonan pinjam ruangan.
            </p>
          </div>

          <button
            @click="navigateTo(`/lecturer/room-requests/new?labId=${schedule.laboratoryId}`)"
            class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#3B694A] to-[#2D5A3F] hover:from-[#31573E] hover:to-[#244430] text-white font-extrabold text-xs shadow-xs shadow-[#2D5A3F]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus :size="16" stroke-width="2.5" />
            <span>Pinjam Ruangan Tambahan</span>
          </button>
        </div>

        <!-- Target Laboratory Snapshot Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-3">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <h4 class="text-xs font-black uppercase tracking-wider text-text-secondary">Ruangan yang Ditugaskan</h4>
            <span class="px-2 py-0.5 rounded-full bg-brand-100 font-mono text-[10px] font-bold text-dark-green">
              {{ schedule.laboratoryCode }}
            </span>
          </div>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between py-1 border-b border-gray-50">
              <span class="text-text-muted">Nama Ruangan</span>
              <span class="font-bold text-text-primary truncate max-w-[170px] text-right">{{ schedule.laboratoryName }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-gray-50">
              <span class="text-text-muted">Hari Rutin</span>
              <span class="font-bold text-dark-green">{{ schedule.dayName }}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-text-muted">Rentang Waktu</span>
              <span class="font-mono font-bold text-text-primary">{{ schedule.startTime }} – {{ schedule.endTime }}</span>
            </div>
          </div>

          <button
            @click="navigateTo(`/lecturer/laboratories/${schedule.laboratoryId}`)"
            class="w-full mt-2 py-2 px-3 rounded-xl border border-gray-200/80 hover:bg-brand-50 text-dark-green text-xs font-bold transition-colors cursor-pointer text-center block"
          >
            Lihat Profil Laboratorium →
          </button>
        </div>

        <!-- System Audit Information -->
        <div class="bg-surface/60 rounded-2xl border border-gray-200/70 p-4 space-y-2 text-[11px] text-text-muted">
          <div class="flex justify-between">
            <span>ID Jadwal</span>
            <span class="font-mono text-[10px] text-text-secondary truncate max-w-[140px]">{{ schedule.id }}</span>
          </div>
          <div class="flex justify-between">
            <span>Tahun Akademik</span>
            <span class="font-medium text-text-secondary truncate max-w-[140px]">{{ schedule.academicCalendarId || 'Semester Berjalan' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
