<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLecturerNavStore } from '@/stores/lecturer-nav.store'
import {
  Calendar,
  CalendarDays,
  Clock,
  CheckCircle2,
  Plus,
  Download,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  FlaskConical,
  ArrowUpRight,
  Sparkles,
  Link2,
  X,
  FileText,
  Loader2,
  AlertCircle,
  Building2,
  Users
} from 'lucide-vue-next'
import { scheduleService, type ScheduleData } from '@/services/schedule.service'
import { laboratoryService, type LaboratoryData } from '@/services/laboratory.service'

const router = useRouter()
const navStore = useLecturerNavStore()

// Reactive Datasets
const schedules = ref<ScheduleData[]>([])
const laboratories = ref<LaboratoryData[]>([])
const isLoading = ref(true)
const errorMessage = ref('')

// View Mode & Filtering Controls
const activeViewMode = ref<'week' | 'list'>('week')
const searchQuery = ref('')
const selectedLabFilter = ref('ALL')
const selectedDayFilter = ref('ALL')
const selectedStatusFilter = ref('ALL')

// Export Feedback Toast
const showToast = ref(false)
const toastMessage = ref('')

const triggerToast = (msg: string) => {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3500)
}

const handleExport = () => {
  triggerToast('Jadwal perkuliahan berhasil diekspor.')
}

const loadSchedulesAndLabs = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const [schedRes, labRes] = await Promise.all([
      scheduleService.getSchedules({ page: 1, limit: 100 }),
      laboratoryService.getLaboratories({ page: 1, limit: 100 })
    ])
    schedules.value = schedRes.schedules || []
    laboratories.value = labRes.laboratories || []
  } catch (err: any) {
    errorMessage.value = err.message || 'Gagal memuat jadwal perkuliahan'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  navStore.setBreadcrumbs([
    { label: 'Portal Dosen', path: '/lecturer' },
    { label: 'Jadwal Penggunaan Lab' }
  ])
  loadSchedulesAndLabs()
})

const dayTranslations: Record<string, string> = {
  Monday: 'Senin',
  Tuesday: 'Selasa',
  Wednesday: 'Rabu',
  Thursday: 'Kamis',
  Friday: 'Jumat',
  Saturday: 'Sabtu',
  Sunday: 'Minggu',
  Senin: 'Senin',
  Selasa: 'Selasa',
  Rabu: 'Rabu',
  Kamis: 'Kamis',
  Jumat: 'Jumat',
  Sabtu: 'Sabtu',
  Minggu: 'Minggu'
}

const formatDay = (d: string) => dayTranslations[d] || d

// Next Upcoming Session Highlight
const nextUpcomingSession = computed(() => {
  return schedules.value.find(s => s.status === 'ACTIVE' || s.status === 'SCHEDULED') || schedules.value[0] || null
})

// Filtered Schedules Computed Property
const filteredSchedules = computed(() => {
  return schedules.value.filter(item => {
    // Search query matching
    const query = searchQuery.value.toLowerCase().trim()
    const matchesQuery = !query ||
      item.courseName.toLowerCase().includes(query) ||
      item.laboratoryName.toLowerCase().includes(query) ||
      item.laboratoryCode.toLowerCase().includes(query) ||
      item.className.toLowerCase().includes(query) ||
      item.lecturerName.toLowerCase().includes(query)

    // Lab filter matching
    const matchesLab = selectedLabFilter.value === 'ALL' || item.laboratoryId === selectedLabFilter.value

    // Day filter matching
    const matchesDay = selectedDayFilter.value === 'ALL' ||
      item.dayName === selectedDayFilter.value ||
      formatDay(item.dayName) === selectedDayFilter.value

    // Status filter matching
    const matchesStatus = selectedStatusFilter.value === 'ALL' || item.status === selectedStatusFilter.value

    return matchesQuery && matchesLab && matchesDay && matchesStatus
  })
})

// Days list for week view grouping
const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const getSchedulesForDay = (day: string) => {
  return filteredSchedules.value.filter(s => formatDay(s.dayName) === day)
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedLabFilter.value = 'ALL'
  selectedDayFilter.value = 'ALL'
  selectedStatusFilter.value = 'ALL'
}

const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="space-y-6 pb-12 select-none w-full max-w-full min-w-0">
    
    <!-- 1. Page Header Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200/60 w-full min-w-0">
      <div class="min-w-0 flex-1">
        <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight truncate">
          Jadwal Penggunaan & Perkuliahan
        </h1>
        <p class="text-xs sm:text-sm text-text-muted font-normal truncate">
          Periksa alokasi penggunaan laboratorium, jadwal kelas praktikum, dan ketersediaan ruangan.
        </p>
      </div>

      <!-- Header Action Buttons -->
      <div class="flex items-center gap-2 self-start sm:self-auto shrink-0">
        <button
          @click="handleExport"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-gray-200/80 bg-white hover:bg-surface text-text-secondary hover:text-text-primary text-xs font-bold transition-all shadow-2xs cursor-pointer"
        >
          <Download :size="14" />
          <span>Ekspor Jadwal</span>
        </button>

        <button
          @click="navigateTo('/lecturer/room-requests/new')"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs shadow-dark-green/20 transition-all duration-150 active:scale-95 cursor-pointer"
        >
          <Plus :size="15" stroke-width="2.5" />
          <span>Pinjam Ruangan</span>
        </button>
      </div>
    </div>

    <!-- Toast Notification Banner -->
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

    <!-- Error Banner -->
    <div
      v-if="errorMessage"
      class="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between shadow-xs"
    >
      <div class="flex items-center gap-2">
        <AlertCircle :size="16" class="text-rose-600 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>
      <button @click="loadSchedulesAndLabs" class="text-xs text-rose-800 underline font-bold hover:opacity-80 cursor-pointer">
        Coba Lagi
      </button>
    </div>

    <!-- 2. Next Session Spotlight Card -->
    <div
      v-if="nextUpcomingSession"
      class="bg-gradient-to-r from-dark-green via-[#547a5c] to-brand-900 text-white p-5 sm:p-6 rounded-2xl shadow-sm space-y-4 relative overflow-hidden w-full min-w-0"
    >
      <!-- Decorative Glow -->
      <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 min-w-0">
        <div class="space-y-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-xs">
              SESI BERIKUTNYA
            </span>
            <span class="text-xs text-brand-100 font-bold">
              ● {{ formatDay(nextUpcomingSession.dayName) }}
            </span>
          </div>

          <h2 class="text-lg sm:text-xl font-extrabold text-white tracking-tight pt-1 truncate">
            {{ nextUpcomingSession.courseName }}
          </h2>
          <p class="text-xs text-brand-100 font-medium truncate">
            {{ nextUpcomingSession.laboratoryName }} ({{ nextUpcomingSession.laboratoryCode }}) • Kelas {{ nextUpcomingSession.className }}
          </p>
        </div>

        <div class="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          <div class="px-3 py-1.5 rounded-xl bg-black/20 border border-white/15 text-center">
            <span class="text-xs font-mono font-bold text-white block">{{ nextUpcomingSession.startTime }} – {{ nextUpcomingSession.endTime }}</span>
            <span class="text-[10px] text-brand-100 uppercase tracking-wider block">Rentang Waktu</span>
          </div>

          <button
            @click="navigateTo(`/lecturer/schedules/${nextUpcomingSession.id}`)"
            class="px-3.5 py-2 rounded-xl bg-white hover:bg-brand-50 text-dark-green text-xs font-extrabold shadow-sm transition-all duration-150 cursor-pointer flex items-center gap-1"
          >
            <span>Detail</span>
            <ChevronRight :size="14" />
          </button>
        </div>
      </div>
    </div>

    <!-- 3. Filter Controls & View Switcher -->
    <div class="bg-white p-4 rounded-2xl border border-gray-200/70 shadow-2xs space-y-3 w-full min-w-0">
      <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full min-w-0">
        
        <!-- Search Input -->
        <div class="relative w-full md:w-72 shrink-0">
          <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            <Search :size="16" />
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari mata kuliah, ruangan, dosen..."
            class="w-full pl-9 pr-8 py-2 bg-surface/60 border border-gray-200/80 rounded-xl text-xs transition-all focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green focus:bg-white text-text-primary placeholder:text-text-muted/70"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
          >
            <X :size="14" />
          </button>
        </div>

        <!-- Filter Dropdowns -->
        <div class="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          <!-- Laboratory Filter -->
          <select
            v-model="selectedLabFilter"
            class="px-3 py-2 bg-surface/60 border border-gray-200/80 rounded-xl text-xs text-text-secondary font-medium focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green cursor-pointer"
          >
            <option value="ALL">Semua Laboratorium</option>
            <option v-for="lab in laboratories" :key="lab.id" :value="lab.id">
              {{ lab.code }} — {{ lab.name }}
            </option>
          </select>

          <!-- Day Filter -->
          <select
            v-model="selectedDayFilter"
            class="px-3 py-2 bg-surface/60 border border-gray-200/80 rounded-xl text-xs text-text-secondary font-medium focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green cursor-pointer"
          >
            <option value="ALL">Semua Hari</option>
            <option value="Senin">Senin</option>
            <option value="Selasa">Selasa</option>
            <option value="Rabu">Rabu</option>
            <option value="Kamis">Kamis</option>
            <option value="Jumat">Jumat</option>
            <option value="Sabtu">Sabtu</option>
          </select>

          <!-- Status Filter -->
          <select
            v-model="selectedStatusFilter"
            class="px-3 py-2 bg-surface/60 border border-gray-200/80 rounded-xl text-xs text-text-secondary font-medium focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="SCHEDULED">Terjadwal</option>
            <option value="ACTIVE">Sedang Berjalan</option>
            <option value="FINISHED">Selesai</option>
          </select>

          <button
            v-if="searchQuery || selectedLabFilter !== 'ALL' || selectedDayFilter !== 'ALL' || selectedStatusFilter !== 'ALL'"
            @click="resetFilters"
            class="px-2.5 py-1.5 text-xs font-bold text-dark-green hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw :size="13" />
            <span>Reset</span>
          </button>
        </div>

        <!-- View Mode Switcher -->
        <div class="flex items-center bg-surface p-1 rounded-xl border border-gray-200/80 shrink-0 self-end md:self-auto">
          <button
            @click="activeViewMode = 'week'"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
              activeViewMode === 'week' ? 'bg-white text-dark-green shadow-2xs' : 'text-text-muted hover:text-text-primary'
            ]"
          >
            <CalendarDays :size="14" />
            <span>Tabel Mingguan</span>
          </button>
          <button
            @click="activeViewMode = 'list'"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
              activeViewMode === 'list' ? 'bg-white text-dark-green shadow-2xs' : 'text-text-muted hover:text-text-primary'
            ]"
          >
            <FileText :size="14" />
            <span>Daftar</span>
          </button>
        </div>

      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="py-16 text-center">
      <Loader2 :size="32" class="mx-auto text-dark-green animate-spin mb-3" />
      <p class="text-xs text-text-muted font-medium">Memuat jadwal perkuliahan...</p>
    </div>

    <!-- 4. Schedule Timetable Views -->
    <template v-else-if="filteredSchedules.length > 0">
      
      <!-- VIEW 1: WEEKLY GROUPED CARDS VIEW -->
      <div v-if="activeViewMode === 'week'" class="space-y-6 w-full min-w-0">
        <div
          v-for="day in daysOfWeek"
          :key="day"
          v-show="getSchedulesForDay(day).length > 0 || selectedDayFilter === day || selectedDayFilter === 'ALL'"
          class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-5 space-y-3.5"
        >
          <!-- Day Header -->
          <div class="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <h3 class="text-sm font-extrabold text-text-primary flex items-center gap-2">
              <Calendar :size="16" class="text-dark-green" />
              <span>{{ day }}</span>
            </h3>
            <span class="px-2.5 py-0.5 rounded-full bg-brand-50 text-dark-green text-[11px] font-bold">
              {{ getSchedulesForDay(day).length }} Sesi
            </span>
          </div>

          <!-- Day Sessions Grid -->
          <div v-if="getSchedulesForDay(day).length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div
              v-for="item in getSchedulesForDay(day)"
              :key="item.id"
              @click="navigateTo(`/lecturer/schedules/${item.id}`)"
              class="p-4 rounded-xl border border-gray-100 bg-surface/30 hover:bg-brand-50/40 hover:border-brand-200/80 transition-all duration-150 cursor-pointer space-y-2.5 flex flex-col justify-between group"
            >
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="px-2 py-0.5 rounded bg-white border border-gray-200/80 font-mono text-[10.5px] font-bold text-dark-green shadow-2xs">
                    {{ item.startTime }} – {{ item.endTime }}
                  </span>
                  <span
                    :class="[
                      'px-2 py-0.2 rounded-full text-[10px] font-extrabold border',
                      item.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-dark-green border-emerald-200'
                        : item.status === 'SCHEDULED'
                          ? 'bg-sky-50 text-sky-800 border-sky-200'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                    ]"
                  >
                    {{ item.status === 'ACTIVE' ? 'Sedang Berjalan' : item.status === 'SCHEDULED' ? 'Terjadwal' : 'Selesai' }}
                  </span>
                </div>

                <h4 class="text-xs sm:text-sm font-extrabold text-text-primary group-hover:text-dark-green transition-colors line-clamp-1">
                  {{ item.courseName }}
                </h4>

                <p class="text-[11px] text-text-muted font-medium truncate flex items-center gap-1">
                  <Building2 :size="12" class="text-text-muted shrink-0" />
                  <span>{{ item.laboratoryName }} ({{ item.laboratoryCode }})</span>
                </p>
              </div>

              <div class="pt-2 border-t border-gray-100 flex items-center justify-between text-[10.5px] text-text-muted">
                <span>Kelas: <strong class="text-text-primary">{{ item.className }}</strong></span>
                <span>Dosen: <strong class="text-text-primary">{{ item.lecturerName }}</strong></span>
              </div>
            </div>
          </div>

          <div v-else class="py-4 text-center text-text-muted text-xs">
            Tidak ada jadwal perkuliahan untuk hari {{ day }}.
          </div>
        </div>
      </div>

      <!-- VIEW 2: LIST VIEW -->
      <div v-else class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs overflow-hidden w-full min-w-0">
        <div class="divide-y divide-gray-100">
          <div
            v-for="item in filteredSchedules"
            :key="item.id"
            @click="navigateTo(`/lecturer/schedules/${item.id}`)"
            class="p-4 sm:p-5 hover:bg-brand-50/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
          >
            <div class="flex items-start gap-3.5 min-w-0 flex-1">
              <div class="px-3 py-1.5 rounded-xl bg-surface border border-gray-200 text-center shrink-0">
                <span class="text-xs font-extrabold text-dark-green block">{{ item.startTime }} – {{ item.endTime }}</span>
                <span class="text-[10px] font-bold text-text-muted uppercase tracking-wider block mt-0.5">{{ formatDay(item.dayName) }}</span>
              </div>

              <div class="space-y-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="px-1.5 py-0.2 rounded bg-gray-100 font-mono text-[10px] font-bold text-text-primary">
                    {{ item.laboratoryCode }}
                  </span>
                  <span class="text-xs font-semibold text-text-muted truncate">
                    {{ item.laboratoryName }}
                  </span>
                </div>
                <h4 class="text-sm font-extrabold text-text-primary group-hover:text-dark-green transition-colors truncate">
                  {{ item.courseName }}
                </h4>
                <p class="text-xs text-text-muted">
                  Dosen: <strong class="text-text-primary">{{ item.lecturerName }}</strong> · Kelas: <strong class="text-text-primary">{{ item.className }}</strong>
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3 self-end sm:self-auto shrink-0">
              <span
                :class="[
                  'px-2.5 py-1 rounded-full text-xs font-extrabold border',
                  item.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-dark-green border-emerald-200'
                    : item.status === 'SCHEDULED'
                      ? 'bg-sky-50 text-sky-800 border-sky-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                ]"
              >
                {{ item.status === 'ACTIVE' ? 'Sedang Berjalan' : item.status === 'SCHEDULED' ? 'Terjadwal' : 'Selesai' }}
              </span>
              <button class="text-xs font-bold text-dark-green group-hover:underline flex items-center gap-0.5">
                <span>Lihat</span>
                <ChevronRight :size="14" />
              </button>
            </div>
          </div>
        </div>
      </div>

    </template>

    <!-- 5. Empty State -->
    <div v-else class="bg-white p-12 rounded-2xl border border-gray-200/70 shadow-2xs text-center space-y-3 w-full min-w-0">
      <div class="w-12 h-12 rounded-2xl bg-surface border border-gray-200 text-text-muted mx-auto flex items-center justify-center">
        <CalendarDays :size="24" />
      </div>
      <div class="space-y-1">
        <h4 class="text-sm font-bold text-text-primary">Jadwal perkuliahan tidak ditemukan</h4>
        <p class="text-xs text-text-muted max-w-sm mx-auto">
          Coba bersihkan parameter filter atau kata kunci pencarian untuk memeriksa jadwal induk.
        </p>
      </div>
      <button
        @click="resetFilters"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer mt-2"
      >
        <RefreshCw :size="14" />
        <span>Reset Filter</span>
      </button>
    </div>

  </div>
</template>
