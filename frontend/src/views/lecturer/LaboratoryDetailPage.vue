<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLecturerNavStore } from '@/stores/lecturer-nav.store'
import {
  ArrowLeft,
  FlaskConical,
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  Plus,
  Building2,
  FileText,
  ChevronRight,
  Sparkles,
  Layers,
  Wrench,
  Check,
  Loader2,
  AlertCircle,
  Hash,
  MapPin,
  ShieldCheck
} from 'lucide-vue-next'
import { laboratoryService, type LaboratoryData } from '@/services/laboratory.service'
import { scheduleService, type ScheduleData } from '@/services/schedule.service'

const route = useRoute()
const router = useRouter()
const navStore = useLecturerNavStore()

const laboratory = ref<LaboratoryData | null>(null)
const upcomingSessions = ref<ScheduleData[]>([])
const isLoading = ref(true)
const errorMessage = ref('')

const loadLaboratoryDetail = async () => {
  const labId = route.params.id as string
  if (!labId) {
    router.push('/lecturer/laboratories')
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  try {
    const [labData, schedData] = await Promise.all([
      laboratoryService.getLaboratoryById(labId),
      scheduleService.getSchedules({ laboratory_id: labId, limit: 10 }).catch(() => ({ schedules: [], meta: {} as any })),
    ])

    laboratory.value = labData
    upcomingSessions.value = schedData.schedules || []

    navStore.setBreadcrumbs([
      { label: 'Portal Dosen', path: '/lecturer' },
      { label: 'Laboratorium', path: '/lecturer/laboratories' },
      { label: labData.name },
    ])
  } catch (err: any) {
    errorMessage.value = err.message || 'Gagal memuat detail laboratorium'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadLaboratoryDetail()
})

const navigateTo = (path: string) => {
  router.push(path)
}

const handleRequestLaboratory = () => {
  if (laboratory.value) {
    router.push({
      path: '/lecturer/room-requests/new',
      query: { labId: laboratory.value.id, labName: laboratory.value.name },
    })
  }
}
</script>

<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="flex items-center justify-center min-h-[400px]">
    <div class="text-center space-y-3">
      <div class="w-12 h-12 border-4 border-brand-200 border-t-dark-green rounded-full animate-spin mx-auto"></div>
      <p class="text-sm text-text-muted font-medium">Memuat spesifikasi laboratorium...</p>
    </div>
  </div>

  <!-- Error State -->
  <div v-else-if="errorMessage || !laboratory" class="flex items-center justify-center min-h-[400px]">
    <div class="text-center space-y-4 max-w-md">
      <div class="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
        <AlertCircle :size="32" class="text-red-600" />
      </div>
      <div>
        <h3 class="text-lg font-bold text-text-primary mb-1">Gagal Memuat Laboratorium</h3>
        <p class="text-sm text-text-muted">{{ errorMessage || 'Data laboratorium tidak ditemukan.' }}</p>
      </div>
      <button
        @click="navigateTo('/lecturer/laboratories')"
        class="px-4 py-2 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
      >
        Kembali ke Direktori Laboratorium
      </button>
    </div>
  </div>

  <!-- Content (Full-width 12-column grid: 8 cols + 4 cols) -->
  <div v-else class="space-y-6 pb-12 w-full max-w-full min-w-0 select-none">
    <!-- 1. Header Bar with Back Button -->
    <div>
      <button
        @click="navigateTo('/lecturer/laboratories')"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-dark-green hover:underline mb-2 cursor-pointer"
      >
        <ArrowLeft :size="14" />
        <span>Kembali ke Direktori Laboratorium</span>
      </button>

      <div class="pb-3 border-b border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
              {{ laboratory.name }}
            </h1>
            <span
              :class="[
                'inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-extrabold border shadow-2xs',
                laboratory.status === 'Active'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : laboratory.status === 'Maintenance'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-gray-100 text-text-muted border-gray-200'
              ]"
            >
              <span v-if="laboratory.status === 'Active'" class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{{ laboratory.status === 'Active' ? 'Tersedia' : laboratory.status === 'Maintenance' ? 'Pemeliharaan' : 'Ditutup' }}</span>
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted font-medium">
            {{ laboratory.location }} • Kapasitas Komputer: {{ laboratory.maximumCapacity }} Kursi
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
              <FlaskConical :size="28" stroke-width="2.2" />
            </div>
            <div>
              <h2 class="text-lg font-extrabold text-text-primary">{{ laboratory.name }}</h2>
              <p class="text-xs text-text-muted mt-0.5 font-medium">Kode Ruang: <span class="font-mono font-bold text-dark-green">{{ laboratory.code }}</span> • {{ laboratory.location }}</p>
            </div>
          </div>
          <span class="text-xs font-mono font-bold text-dark-green bg-brand-50 px-3 py-1 rounded-full border border-brand-200/60 self-start sm:self-auto">
            Ruang Laboratorium FIK
          </span>
        </div>

        <!-- Structured Attributes & Details Grid -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 space-y-5">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-extrabold text-text-primary tracking-tight">Spesifikasi Ruangan</h3>
            <p class="text-xs text-text-muted">Kapasitas, lokasi fisik, dan parameter operasional.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Hash :size="13" class="text-dark-green" />
                <span>Kode Ruang</span>
              </div>
              <p class="text-xs font-mono font-black text-dark-green truncate">{{ laboratory.code }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Users :size="13" class="text-dark-green" />
                <span>Kapasitas Kursi</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ laboratory.maximumCapacity }} Mahasiswa</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <MapPin :size="13" class="text-dark-green" />
                <span>Gedung & Lokasi</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ laboratory.location }}</p>
            </div>
          </div>
        </div>

        <!-- Scheduled Timetable Sessions for this Room -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 space-y-4">
          <div class="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 class="text-base font-extrabold text-text-primary tracking-tight flex items-center gap-2">
              <Calendar :size="16" class="text-dark-green" />
              <span>Jadwal Perkuliahan Terjadwal</span>
            </h3>
            <span class="text-xs font-bold text-text-muted">{{ upcomingSessions.length }} Kelas</span>
          </div>

          <div v-if="upcomingSessions.length > 0" class="space-y-3">
            <div
              v-for="session in upcomingSessions"
              :key="session.id"
              class="p-4 rounded-xl border border-gray-100 bg-surface/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="font-mono font-extrabold text-dark-green inline-flex items-center gap-1.5">
                    <Clock :size="13" class="text-brand-600 shrink-0" />
                    <span>{{ session.dayName }} • {{ session.startTime }} – {{ session.endTime }} WIB</span>
                  </span>
                  <span class="text-text-muted">•</span>
                  <span class="font-bold text-text-primary">{{ session.courseName }}</span>
                </div>
                <p class="text-[11px] text-text-muted font-medium">
                  Kelas: <strong>{{ session.className }}</strong> · Dosen: <strong>{{ session.lecturerName }}</strong>
                </p>
              </div>

              <span class="px-2.5 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-dark-green text-[11px] font-bold shrink-0 self-start sm:self-auto">
                {{ session.status === 'ACTIVE' ? 'Sedang Berjalan' : session.status === 'SCHEDULED' ? 'Terjadwal' : 'Selesai' }}
              </span>
            </div>
          </div>

          <div v-else class="py-8 text-center text-text-muted text-xs font-medium">
            Tidak ada sesi perkuliahan rutin yang dijadwalkan untuk laboratorium ini.
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- RIGHT COLUMN: ACTIONS & CONTEXTUAL SIDEBAR (4 COLS)      -->
      <!-- ======================================================== -->
      <div class="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
        <!-- Primary Request Action Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 sm:p-6 space-y-3.5">
          <div class="space-y-1">
            <span class="px-2.5 py-0.5 rounded-full bg-brand-100 text-dark-green text-[10px] font-extrabold uppercase tracking-wider">
              ALUR RESERVASI
            </span>
            <h3 class="text-base font-extrabold text-text-primary pt-1">
              Pinjam Laboratorium
            </h3>
            <p class="text-xs text-text-muted leading-relaxed">
              Ajukan permohonan pinjam ruangan untuk praktikum kelas atau ujian praktikum Anda.
            </p>
          </div>

          <button
            @click="handleRequestLaboratory"
            :disabled="laboratory.status !== 'Active'"
            class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#3B694A] to-[#2D5A3F] hover:from-[#31573E] hover:to-[#244430] text-white font-extrabold text-xs shadow-xs shadow-[#2D5A3F]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus :size="16" stroke-width="2.5" />
            <span>Pinjam Laboratorium Ini</span>
          </button>
        </div>

        <!-- Operational Status Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-3">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <h4 class="text-xs font-black uppercase tracking-wider text-text-secondary">Ringkasan Ruangan</h4>
            <span class="px-2 py-0.5 rounded-full bg-brand-100 font-mono text-[10px] font-bold text-dark-green">
              {{ laboratory.code }}
            </span>
          </div>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between py-1 border-b border-gray-50">
              <span class="text-text-muted">Kapasitas Maksimal</span>
              <span class="font-bold text-text-primary">{{ laboratory.maximumCapacity }} Mahasiswa</span>
            </div>
            <div class="flex justify-between py-1 border-b border-gray-50">
              <span class="text-text-muted">Status Operasional</span>
              <span class="font-bold text-dark-green">{{ laboratory.status === 'Active' ? 'Tersedia' : laboratory.status === 'Maintenance' ? 'Pemeliharaan' : 'Ditutup' }}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-text-muted">Lokasi</span>
              <span class="font-medium text-text-secondary truncate max-w-[160px] text-right">{{ laboratory.location }}</span>
            </div>
          </div>
        </div>

        <!-- System Audit Information -->
        <div class="bg-surface/60 rounded-2xl border border-gray-200/70 p-4 space-y-2 text-[11px] text-text-muted">
          <div class="flex justify-between">
            <span>UUID Ruangan</span>
            <span class="font-mono text-[10px] text-text-secondary truncate max-w-[140px]">{{ laboratory.id }}</span>
          </div>
          <div class="flex justify-between">
            <span>Cakupan Fakultas</span>
            <span class="font-medium text-text-secondary">FIK UPNVJ</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
