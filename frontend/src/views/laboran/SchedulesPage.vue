<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLaboranNavStore } from '@/stores/laboran-nav.store'
import {
  Calendar,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  DoorOpen,
  Download,
  RotateCcw,
  Sparkles,
  LayoutGrid,
  List,
  CalendarDays,
  X,
  Play,
  Loader2,
  AlertCircle
} from 'lucide-vue-next'
import SummaryCard from '@/components/admin/SummaryCard.vue'
import { scheduleService, type ScheduleData } from '@/services/schedule.service'
import { laboratoryService, type LaboratoryData } from '@/services/laboratory.service'

import { formatDate } from '@/utils/format.utils'

const router = useRouter()
const navStore = useLaboranNavStore()

onMounted(() => {
  navStore.setBreadcrumbs([
    { label: 'Portal Laboran', path: '/laboran' },
    { label: 'Jadwal Penggunaan' }
  ])
  loadData()
})

// View Modes: 'timetable' | 'list'
const viewMode = ref<'timetable' | 'list'>('timetable')

// Current Selected Date (Default Today, Formatted to Indonesian WIB)
const currentDate = ref(new Date())
const selectedDateFormatted = computed(() => {
  return formatDate(currentDate.value, true)
})

// Date Navigation
const handlePrevDate = () => {
  const d = new Date(currentDate.value)
  d.setDate(d.getDate() - 1)
  currentDate.value = d
}

const handleNextDate = () => {
  const d = new Date(currentDate.value)
  d.setDate(d.getDate() + 1)
  currentDate.value = d
}

const handleToday = () => {
  currentDate.value = new Date()
}

// Reactive Datasets
const schedules = ref<ScheduleData[]>([])
const laboratories = ref<LaboratoryData[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

// Search & Filter
const searchQuery = ref('')
const selectedStatusFilter = ref<string>('ALL')
const selectedLabFilter = ref<string>('ALL')

// Toast Banner Feedback
const showToast = ref(false)
const toastMessage = ref('')

const triggerToast = (msg: string) => {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3500)
}

// Load data from APIs
const loadData = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const [schedRes, labRes] = await Promise.all([
      scheduleService.getSchedules({ page: 1, limit: 100 }),
      laboratoryService.getLaboratories({ page: 1, limit: 100 })
    ])
    schedules.value = schedRes.schedules
    laboratories.value = labRes.laboratories
  } catch (err: any) {
    errorMessage.value = err.message || 'Gagal memuat jadwal'
  } finally {
    isLoading.value = false
  }
}

// Filtered Schedules
const filteredSchedules = computed(() => {
  return schedules.value.filter(s => {
    if (selectedStatusFilter.value !== 'ALL' && s.status !== selectedStatusFilter.value) {
      return false
    }
    if (selectedLabFilter.value !== 'ALL' && s.laboratoryName !== selectedLabFilter.value) {
      return false
    }
    if (searchQuery.value.trim() !== '') {
      const q = searchQuery.value.toLowerCase()
      const matchCourse = s.courseName.toLowerCase().includes(q)
      const matchInstructor = s.lecturerName.toLowerCase().includes(q)
      const matchLab = s.laboratoryName.toLowerCase().includes(q)
      const matchId = s.id.toLowerCase().includes(q)
      if (!matchCourse && !matchInstructor && !matchLab && !matchId) {
        return false
      }
    }
    return true
  })
})

// Dynamic Metrics
const todaySessionsCount = computed(() => schedules.value.length)
const ongoingCount = computed(() => schedules.value.filter(s => s.status === 'ACTIVE').length)
const upcomingCount = computed(() => schedules.value.filter(s => s.status === 'SCHEDULED').length)
const completedCount = computed(() => schedules.value.filter(s => s.status === 'FINISHED').length)

// Active Ongoing Session
const ongoingSession = computed(() => {
  return schedules.value.find(s => s.status === 'ACTIVE') || (schedules.value.length > 0 ? schedules.value[0] : null)
})

// Lab List Options
const labOptions = computed(() => {
  const set = new Set<string>()
  schedules.value.forEach(s => set.add(s.laboratoryName))
  laboratories.value.forEach(l => set.add(l.name))
  return Array.from(set)
})

// Timetable Matrix Rooms & Slots
const timetableRooms = computed(() => {
  if (laboratories.value.length > 0) {
    return laboratories.value.map(l => ({ id: l.id, name: l.name, code: l.code }))
  }
  return [
    { id: 'lab-101', name: 'Software Engineering Lab', code: 'LAB-RPL' },
    { id: 'lab-105', name: 'Database Systems Lab', code: 'LAB-DB' },
    { id: 'lab-103', name: 'Computer Network Lab', code: 'LAB-JAR' },
    { id: 'lab-104', name: 'Multimedia Dev Lab', code: 'LAB-MM' },
    { id: 'lab-102', name: 'AI & Robotics Lab', code: 'LAB-AI' },
  ]
})

const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00']

// Find schedule for room & time
const getScheduleForSlot = (labId: string, time: string) => {
  return filteredSchedules.value.find(
    s => s.laboratoryId === labId && s.startTime.startsWith(time.slice(0, 2))
  )
}

// Navigation to Schedule Detail
const navigateToDetail = (id: string) => {
  router.push(`/laboran/schedules/${id}`)
}

// Navigation to Room Usage
const navigateToRoomUsage = () => {
  router.push('/laboran/room-usage')
}

// Reset Filters
const resetFilters = () => {
  searchQuery.value = ''
  selectedStatusFilter.value = 'ALL'
  selectedLabFilter.value = 'ALL'
}
</script>

<template>
  <div class="space-y-6 pb-12 select-none">
    
    <!-- 1. Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2.5 border-b border-gray-200/60">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
            Jadwal Penggunaan
          </h1>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-100/80 border border-brand-200 text-dark-green text-[11px] font-bold">
            <CalendarDays :size="12" />
            Jadwal Operasional
          </span>
        </div>
        <p class="text-xs sm:text-sm text-text-muted font-normal">
          Pantau dan kelola jadwal laboratorium serta aktivitas ruangan harian.
        </p>
      </div>

      <!-- Header Controls: Date Picker & Export -->
      <div class="flex items-center gap-2 sm:gap-3 flex-wrap self-start sm:self-auto shrink-0">
        
        <!-- Date Selector Pill -->
        <div class="inline-flex items-center gap-1.5 p-1 rounded-full bg-surface border border-gray-200/80 text-xs font-bold shadow-2xs">
          <button
            @click="handlePrevDate"
            class="p-1 rounded-full hover:bg-gray-200/70 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            title="Hari Sebelumnya"
          >
            <ChevronLeft :size="15" />
          </button>

          <span class="px-2 text-text-primary font-extrabold text-xs whitespace-nowrap">
            {{ selectedDateFormatted }}
          </span>

          <button
            @click="handleNextDate"
            class="p-1 rounded-full hover:bg-gray-200/70 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            title="Hari Berikutnya"
          >
            <ChevronRight :size="15" />
          </button>
        </div>

        <button
          @click="handleToday"
          class="px-3 py-1.5 rounded-full border border-brand-300 bg-brand-50 hover:bg-brand-100 text-dark-green text-xs font-bold transition-all cursor-pointer"
        >
          Hari Ini
        </button>

        <button
          @click="triggerToast('Jadwal penggunaan berhasil diekspor ke CSV.')"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200/80 bg-white hover:bg-surface text-text-secondary text-xs font-bold shadow-2xs transition-all cursor-pointer"
        >
          <Download :size="14" />
          <span>Ekspor</span>
        </button>
      </div>
    </div>

    <!-- Toast Feedback Notification Banner -->
    <div
      v-if="showToast"
      class="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-dark-green text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="flex items-center gap-2">
        <CheckCircle2 :size="16" class="text-dark-green shrink-0" />
        <span>{{ toastMessage }}</span>
      </div>
      <button @click="showToast = false" class="text-dark-green hover:opacity-80">
        <X :size="14" />
      </button>
    </div>

    <!-- Error Banner -->
    <div
      v-if="errorMessage"
      class="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <AlertCircle :size="16" class="text-red-500 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>
      <button @click="errorMessage = ''" class="text-red-500 hover:opacity-80">
        <X :size="14" />
      </button>
    </div>

    <!-- 2. Top Summary Statistic Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      <SummaryCard
        title="Sesi Hari Ini"
        :value="todaySessionsCount"
        subtext="Terjadwal untuk hari ini"
        :icon="Calendar"
        icon-bg-class="bg-brand-100"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Sedang Berjalan"
        :value="ongoingCount"
        subtext="Sedang dipakai saat ini"
        :icon="Activity"
        icon-bg-class="bg-emerald-50"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Mendatang"
        :value="upcomingCount"
        subtext="Sesi berikutnya hari ini"
        :icon="Clock"
        icon-bg-class="bg-sky-50"
        icon-color-class="text-sky-700"
      />
      <SummaryCard
        title="Selesai"
        :value="completedCount"
        subtext="Selesai hari ini"
        :icon="CheckCircle2"
        icon-bg-class="bg-gray-100"
        icon-color-class="text-gray-600"
      />
    </div>

    <!-- 3. Highlighted Live Ongoing Session Banner (Right Now) -->
    <div
      v-if="ongoingSession"
      class="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-900 via-dark-green to-[#3a5840] text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-[11px] font-extrabold tracking-wide">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Sedang Berjalan
          </span>
          <span class="text-[11px] font-mono text-emerald-200 font-bold">
            Sesi Berlangsung
          </span>
        </div>

        <h3 class="text-base sm:text-lg font-extrabold tracking-tight text-white pt-1">
          {{ ongoingSession.laboratoryName }} ({{ ongoingSession.laboratoryCode }})
        </h3>
        <p class="text-xs text-emerald-100/90 font-medium">
          {{ ongoingSession.courseName }} — Dosen: <strong class="text-white font-bold">{{ ongoingSession.lecturerName }}</strong> ({{ ongoingSession.className }})
        </p>
      </div>

      <!-- Action Shortcut -->
      <div class="flex items-center gap-2 shrink-0 self-end sm:self-auto">
        <button
          @click="navigateToDetail(ongoingSession.id)"
          class="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
        >
          Lihat Rincian
        </button>

        <button
          @click="navigateToRoomUsage"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-dark-green hover:bg-emerald-50 text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <DoorOpen :size="15" />
          <span>Buka Log Pemakaian</span>
        </button>
      </div>
    </div>

    <!-- 4. Filter & View Mode Controls Bar -->
    <div class="bg-white p-4 rounded-2xl border border-gray-200/70 shadow-2xs space-y-3">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        <!-- Search Input -->
        <div class="relative flex-1 min-w-[220px]">
          <Search :size="15" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari nama lab, kegiatan, mata kuliah, dosen..."
            class="w-full pl-9 pr-4 py-2 bg-surface/60 border border-gray-200/80 rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-400 focus:bg-white transition-all"
          />
        </div>

        <!-- Dropdowns & View Toggle -->
        <div class="flex items-center gap-2 flex-wrap text-xs">
          <!-- Status Dropdown -->
          <div class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface border border-gray-200/80">
            <span class="text-text-muted font-bold uppercase text-[10px]">Status:</span>
            <select
              v-model="selectedStatusFilter"
              class="bg-transparent text-xs font-bold text-text-primary focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Sedang Berjalan</option>
              <option value="SCHEDULED">Mendatang</option>
              <option value="FINISHED">Selesai</option>
              <option value="CANCELLED">Dibatalkan</option>
            </select>
          </div>

          <!-- Lab Dropdown -->
          <div class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface border border-gray-200/80">
            <Building2 :size="13" class="text-text-muted shrink-0" />
            <select
              v-model="selectedLabFilter"
              class="bg-transparent text-xs font-bold text-text-primary focus:outline-none cursor-pointer max-w-[150px] truncate"
            >
              <option value="ALL">Semua Laboratorium</option>
              <option v-for="lab in labOptions" :key="lab" :value="lab">
                {{ lab }}
              </option>
            </select>
          </div>

          <!-- Reset Filter -->
          <button
            v-if="searchQuery || selectedStatusFilter !== 'ALL' || selectedLabFilter !== 'ALL'"
            @click="resetFilters"
            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200/80 text-text-muted hover:text-text-primary hover:bg-surface font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw :size="12" />
            <span>Reset</span>
          </button>

          <div class="h-5 w-px bg-gray-200 mx-1 hidden sm:block"></div>

          <!-- View Mode Buttons -->
          <div class="p-0.5 rounded-xl bg-surface border border-gray-200/80 inline-flex items-center gap-1">
            <button
              @click="viewMode = 'timetable'"
              :class="[
                'px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer',
                viewMode === 'timetable'
                  ? 'bg-white text-dark-green shadow-2xs'
                  : 'text-text-muted hover:text-text-primary'
              ]"
            >
              <LayoutGrid :size="13" />
              <span>Tabel Waktu</span>
            </button>

            <button
              @click="viewMode = 'list'"
              :class="[
                'px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer',
                viewMode === 'list'
                  ? 'bg-white text-dark-green shadow-2xs'
                  : 'text-text-muted hover:text-text-primary'
              ]"
            >
              <List :size="13" />
              <span>Daftar</span>
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- 5. Main Schedule Visualization Section -->

    <!-- MODE 1: TIMETABLE ROOM-TIME MATRIX -->
    <div v-if="viewMode === 'timetable'" class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr class="bg-surface/60 border-b border-gray-100 text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              <th class="py-3 px-4 w-20 text-center border-r border-gray-100">Waktu</th>
              <th
                v-for="room in timetableRooms"
                :key="room.id"
                class="py-3 px-4 border-r border-gray-100 last:border-0"
              >
                <div class="flex items-center gap-1.5">
                  <span class="font-mono text-dark-green font-bold text-[10px] bg-brand-100 px-1.5 py-0.2 rounded">
                    {{ room.code }}
                  </span>
                  <span class="font-extrabold text-text-primary">{{ room.name }}</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 text-xs">
            <tr v-for="time in timeSlots" :key="time" class="h-20">
              <!-- Time Column -->
              <td class="py-2 px-3 font-mono font-bold text-text-muted text-center border-r border-gray-100 bg-surface/20">
                {{ time }}
              </td>

              <!-- Room Grid Cells -->
              <td
                v-for="room in timetableRooms"
                :key="room.id"
                class="py-2 px-3 border-r border-gray-100 last:border-0 align-top relative bg-white hover:bg-surface/30 transition-colors"
              >
                <div
                  v-if="getScheduleForSlot(room.id, time)"
                  @click="navigateToDetail(getScheduleForSlot(room.id, time)!.id)"
                  :class="[
                    'p-2.5 rounded-xl border transition-all duration-150 cursor-pointer space-y-1 shadow-2xs group',
                    getScheduleForSlot(room.id, time)!.status === 'ACTIVE'
                      ? 'bg-emerald-50/90 border-emerald-300 text-dark-green hover:border-dark-green hover:shadow-md'
                      : getScheduleForSlot(room.id, time)!.status === 'SCHEDULED'
                        ? 'bg-brand-50/60 border-brand-200/90 hover:border-brand-400 hover:shadow-md'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                  ]"
                >
                  <div class="flex items-center justify-between gap-1 text-[10px] font-bold">
                    <span class="font-mono">{{ getScheduleForSlot(room.id, time)!.startTime }}–{{ getScheduleForSlot(room.id, time)!.endTime }}</span>
                    <span
                      :class="[
                        'px-1.5 py-0.2 rounded text-[9px] font-extrabold',
                        getScheduleForSlot(room.id, time)!.status === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'bg-brand-200 text-dark-green'
                      ]"
                    >
                      {{
                        getScheduleForSlot(room.id, time)!.status === 'ACTIVE'
                          ? 'Sedang Berjalan'
                          : getScheduleForSlot(room.id, time)!.status === 'SCHEDULED'
                            ? 'Mendatang'
                            : 'Selesai'
                      }}
                    </span>
                  </div>

                  <p class="font-extrabold text-xs text-text-primary line-clamp-1 group-hover:text-dark-green transition-colors">
                    {{ getScheduleForSlot(room.id, time)!.courseName }}
                  </p>

                  <p class="text-[10px] text-text-muted font-medium truncate">
                    {{ getScheduleForSlot(room.id, time)!.lecturerName }} ({{ getScheduleForSlot(room.id, time)!.className }})
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODE 2: OPERATIONAL TABLE LIST VIEW -->
    <div v-else class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-surface/50 border-b border-gray-100 text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              <th class="py-3.5 px-4">Rentang Waktu</th>
              <th class="py-3.5 px-4">Laboratorium</th>
              <th class="py-3.5 px-4">Mata Kuliah & Kelas</th>
              <th class="py-3.5 px-4">Dosen Pengampu</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 text-xs">
            <tr
              v-for="item in filteredSchedules"
              :key="item.id"
              class="hover:bg-brand-50/20 transition-colors select-none"
            >
              <!-- Time Slot -->
              <td class="py-3.5 px-4 whitespace-nowrap">
                <span class="font-mono font-extrabold text-dark-green text-xs block">
                  {{ item.startTime }} – {{ item.endTime }}
                </span>
                <span class="text-[10px] text-text-muted font-medium block">Alokasi 2 Jam</span>
              </td>

              <!-- Laboratory -->
              <td class="py-3.5 px-4 whitespace-nowrap">
                <span class="px-1.5 py-0.2 rounded bg-gray-100 text-text-muted text-[10px] font-mono font-bold mr-1">
                  {{ item.laboratoryCode }}
                </span>
                <span class="font-bold text-text-primary">{{ item.laboratoryName }}</span>
              </td>

              <!-- Course & Class -->
              <td class="py-3.5 px-4">
                <span class="font-bold text-text-primary block truncate max-w-[220px]">{{ item.courseName }}</span>
                <span class="text-[10px] text-dark-green font-extrabold block">{{ item.className }}</span>
              </td>

              <!-- Instructor -->
              <td class="py-3.5 px-4 whitespace-nowrap font-medium text-text-primary">
                {{ item.lecturerName }}
              </td>

              <!-- Status -->
              <td class="py-3.5 px-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border',
                    item.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-dark-green border-emerald-200 shadow-2xs'
                      : item.status === 'SCHEDULED'
                        ? 'bg-brand-100/80 text-dark-green border-brand-200'
                        : item.status === 'FINISHED'
                          ? 'bg-gray-100 text-gray-600 border-gray-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                  ]"
                >
                  <span v-if="item.status === 'ACTIVE'" class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{{
                    item.status === 'ACTIVE'
                      ? 'Sedang Berjalan'
                      : item.status === 'SCHEDULED'
                        ? 'Mendatang'
                        : item.status === 'FINISHED'
                          ? 'Selesai'
                          : 'Dibatalkan'
                  }}</span>
                </span>
              </td>

              <!-- Action -->
              <td class="py-3.5 px-4 text-right whitespace-nowrap">
                <button
                  @click="navigateToDetail(item.id)"
                  class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-100/70 hover:bg-dark-green text-dark-green hover:text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  <Eye :size="13" />
                  <span>Lihat</span>
                </button>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="filteredSchedules.length === 0">
              <td colspan="6" class="py-12 text-center text-text-muted space-y-2">
                <CalendarDays :size="36" class="mx-auto text-text-muted/40 mb-2" />
                <h4 class="text-xs font-bold text-text-secondary">Sesi laboratorium tidak ditemukan</h4>
                <p class="text-[11px] text-text-muted max-w-sm mx-auto">
                  Tidak ada jadwal sesi yang cocok dengan tanggal dan filter yang dipilih.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>
