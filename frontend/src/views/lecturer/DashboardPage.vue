<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import { useLecturerNavStore } from '@/stores/lecturer-nav.store'
import { BaseAvatar } from '@/components'
import {
  Calendar,
  Clock,
  CheckCircle2,
  FlaskConical,
  Plus,
  CalendarDays,
  ClipboardList,
  ChevronRight,
  History,
  Sparkles,
  Loader2,
  Inbox,
  MapPin,
  Users,
  ArrowUpRight,
  BookOpen,
  DoorOpen,
  Check,
  X,
  ExternalLink,
  GraduationCap
} from 'lucide-vue-next'
import { scheduleService, type ScheduleData } from '@/services/schedule.service'
import { roomRequestService, type RoomRequest } from '@/services/room-request.service'
import { laboratoryService, type LaboratoryData } from '@/services/laboratory.service'
import { formatDate, formatTime, formatDateTime, formatShortDate } from '@/utils/format.utils'

const router = useRouter()
const authStore = useAuthStore()
const navStore = useLecturerNavStore()

export interface LecturerScheduleItem {
  id: string
  timeSlot: string
  dateLabel: string
  roomName: string
  roomCode: string
  courseName: string
  className: string
  studentCount: number
  status: 'IN PROGRESS' | 'SCHEDULED' | 'COMPLETED'
  laboratoryId?: string
}

export interface LecturerRequestItem {
  id: string
  requestId: string
  labName: string
  laboratoryId?: string
  requestedDate: string
  requestedTime: string
  purpose: string
  participantCount?: number
  status: 'Approved' | 'Pending' | 'Rejected' | 'Cancelled'
}

export interface LecturerActivityItem {
  id: string
  title: string
  timestamp: string
  statusType: 'approved' | 'pending' | 'rejected'
}

export interface LabAvailabilityItem {
  id: string
  name: string
  code: string
  capacity: number
  location: string
  status: 'Available' | 'In Use' | 'Maintenance'
}

// Dynamic Lecturer Greeting Name
const lecturerDisplayName = computed(() => {
  if (authStore.userName && !authStore.userName.toLowerCase().includes('admin')) {
    return authStore.userName
  }
  return 'Lecturer'
})

// Current Academic Term Label
const currentAcademicTerm = computed(() => {
  const year = new Date().getFullYear()
  const month = new Date().getMonth() + 1
  const semester = month >= 8 || month <= 1 ? 'Ganjil' : 'Genap'
  return `${year}/${year + 1} ${semester}`
})

// Datasets
const isLoading = ref(true)
const rawRequests = ref<RoomRequest[]>([])
const schedules = ref<LecturerScheduleItem[]>([])
const requests = ref<LecturerRequestItem[]>([])
const activities = ref<LecturerActivityItem[]>([])
const labAvailabilities = ref<LabAvailabilityItem[]>([])

// Reactive Computed Statistics
const upcomingSessionsCount = computed(() => schedules.value.length)
const pendingRequestsCount = computed(() => rawRequests.value.filter(r => r.status === 'PENDING').length)
const approvedRequestsCount = computed(() => rawRequests.value.filter(r => r.status === 'APPROVED').length)
const availableLabsCount = computed(() => labAvailabilities.value.filter(l => l.status === 'Available').length)

// Next Class Spotlight computation
const nextClassSpotlight = computed<LecturerScheduleItem | null>(() => {
  if (schedules.value.length === 0) return null
  return schedules.value.find(s => s.status === 'IN PROGRESS') || schedules.value[0] || null
})

// Load all lecturer dashboard data
const loadLecturerDashboard = async () => {
  isLoading.value = true
  try {
    const [schedRes, reqRes, labRes] = await Promise.all([
      scheduleService.getSchedules({ limit: 50 }).catch((err) => {
        console.warn('Failed to load schedules:', err)
        return { schedules: [], meta: {} as any }
      }),
      roomRequestService.getMyRoomRequests({ limit: 50 }).catch((err) => {
        console.error('Failed to load my room requests:', err)
        return { data: [], meta: {} as any }
      }),
      laboratoryService.getLaboratories({ page: 1, limit: 10 }).catch((err) => {
        console.warn('Failed to load laboratories:', err)
        return { laboratories: [], meta: {} as any }
      })
    ])

    // 1. Process Schedules
    const allSchedules: ScheduleData[] = schedRes?.schedules || []
    const currentLecturerName = authStore.userName?.toLowerCase() || ''
    
    const filteredSchedules = currentLecturerName
      ? allSchedules.filter(s => s.lecturerName.toLowerCase().includes(currentLecturerName) || allSchedules.length <= 5)
      : allSchedules

    schedules.value = filteredSchedules.slice(0, 5).map((s, idx) => ({
      id: s.id,
      timeSlot: `${s.startTime} – ${s.endTime}`,
      dateLabel: s.dayName || 'Regular Session',
      roomName: s.laboratoryName || 'Laboratory Room',
      roomCode: s.laboratoryCode || `LAB-${idx + 1}`,
      courseName: s.courseName,
      className: s.className || 'Class 3A',
      studentCount: 35,
      status: (idx === 0 && s.status === 'ACTIVE' ? 'IN PROGRESS' : s.status === 'ACTIVE' ? 'SCHEDULED' : 'SCHEDULED') as LecturerScheduleItem['status'],
      laboratoryId: s.laboratoryId
    }))

    // 2. Process Room Requests
    rawRequests.value = reqRes?.data || []
    requests.value = rawRequests.value.slice(0, 5).map(r => ({
      id: r.id,
      requestId: `REQ-${r.id.slice(0, 6).toUpperCase()}`,
      labName: r.laboratoryName,
      laboratoryId: r.laboratoryId,
      requestedDate: r.formattedRequestDate || r.requestDate,
      requestedTime: `${r.startTime} – ${r.endTime} WIB`,
      purpose: r.activityName,
      participantCount: r.participantCount || 30,
      status: (r.status === 'PENDING' ? 'Pending' : r.status === 'APPROVED' ? 'Approved' : r.status === 'REJECTED' ? 'Rejected' : 'Cancelled') as any,
    }))

    // 3. Synthesize Recent Activity Timeline
    if (rawRequests.value.length > 0) {
      activities.value = rawRequests.value.slice(0, 4).map(r => {
        let actionText = `Room application submitted for ${r.laboratoryName} (${r.activityName})`
        let statusType: LecturerActivityItem['statusType'] = 'pending'
        if (r.status === 'APPROVED') {
          actionText = `Booking approved for ${r.laboratoryName} on ${r.formattedRequestDate || r.requestDate}`
          statusType = 'approved'
        } else if (r.status === 'REJECTED') {
          actionText = `Booking rejected for ${r.laboratoryName}: ${r.rejectionReason || 'Schedule conflict'}`
          statusType = 'rejected'
        }
        return {
          id: `act-${r.id}`,
          title: actionText,
          timestamp: r.createdAt ? formatDateTime(r.createdAt) : 'Recent',
          statusType
        }
      })
    } else {
      activities.value = [
        {
          id: 'act-default',
          title: 'Lecturer academic workspace initialized and active',
          timestamp: 'Today',
          statusType: 'approved'
        }
      ]
    }

    // 4. Process Laboratory Availabilities
    const labs: LaboratoryData[] = labRes.laboratories || []
    labAvailabilities.value = labs.slice(0, 5).map(l => ({
      id: l.id,
      name: l.name,
      code: l.code || 'LAB',
      capacity: l.maximumCapacity || 35,
      location: l.location || 'Faculty Lab Building',
      status: l.status === 'Active' ? 'Available' : 'Maintenance'
    }))

  } catch (err) {
    console.warn('Failed to load dynamic data on lecturer dashboard:', err)
  } finally {
    isLoading.value = false
  }
}

// Live Clock WIB
const liveTimeStr = ref('')
let clockTimer: any = null

const updateLiveClock = () => {
  const now = new Date()
  liveTimeStr.value =
    now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' WIB'
}

const formattedCurrentDate = computed(() => {
  return formatDate(new Date(), true)
})

onMounted(() => {
  navStore.setBreadcrumbs([
    { label: 'Lecturer Portal', path: '/lecturer' },
    { label: 'Dashboard' }
  ])
  updateLiveClock()
  clockTimer = setInterval(updateLiveClock, 1000)
  loadLecturerDashboard()
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
})

// Navigation Shortcut Helper
const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="space-y-6 pb-12 select-none w-full max-w-full min-w-0">
    
    <!-- ======================================================== -->
    <!-- PRESTIGIOUS ACADEMIC COMMAND CENTER HERO BANNER (LECTURER)-->
    <!-- ======================================================== -->
    <div
      class="bg-gradient-to-br from-[#0c5a30] via-[#094726] to-[#06331b] text-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-emerald-950/15 relative overflow-hidden border border-emerald-700/30 w-full"
    >
      <!-- Ambient Glow Circles -->
      <div class="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      <div class="absolute right-1/3 -top-12 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

      <div class="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        
        <!-- Left: User Identity & Welcome Greeting -->
        <div class="flex items-start sm:items-center gap-4.5">
          <div class="relative shrink-0">
            <BaseAvatar
              :src="authStore.userAvatar"
              :name="lecturerDisplayName"
              size="xl"
              class="ring-4 ring-emerald-400/30 shadow-md"
            />
            <span
              class="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#094726] shadow-2xs"
              title="Online"
            />
          </div>

          <div class="space-y-1.5">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
                Selamat Datang, {{ lecturerDisplayName }}!
              </h1>
              <span class="px-2.5 py-0.5 rounded-full bg-amber-400 text-emerald-950 text-[10px] font-black uppercase tracking-wider shadow-2xs">
                Dosen Pengampu / Pemohon Lab
              </span>
            </div>

            <p class="text-xs text-emerald-100/80 font-medium">
              Fakultas Ilmu Komputer • Semester {{ currentAcademicTerm }}
            </p>

            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px] text-emerald-200/90 font-semibold">
              <span class="inline-flex items-center gap-1.5">
                <Calendar :size="12" class="text-amber-400" />
                <span>{{ formattedCurrentDate }}</span>
              </span>
              <span>•</span>
              <span class="inline-flex items-center gap-1.5 font-mono">
                <Clock :size="12" class="text-emerald-300" />
                <span>{{ liveTimeStr || 'WIB' }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Right: Direct Action Buttons -->
        <div class="flex flex-wrap items-center gap-2.5 sm:gap-3 self-start lg:self-center">
          <button
            @click="navigateTo('/lecturer/room-requests/new')"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-black shadow-md shadow-black/10 transition-all duration-150 cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Plus :size="15" stroke-width="2.5" />
            <span>Ajukan Pinjam Lab</span>
          </button>

          <button
            @click="navigateTo('/lecturer/schedules')"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold backdrop-blur-xs transition-all duration-150 cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Calendar :size="15" />
            <span>Jadwal Mengajar</span>
          </button>

          <router-link
            to="/display"
            target="_blank"
            class="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer hidden sm:flex items-center justify-center"
            title="Buka Layar Display TV Publik"
          >
            <ExternalLink :size="16" />
          </router-link>
        </div>

      </div>

      <!-- Quick Metrics Ribbon inside Hero -->
      <div class="mt-6 pt-5 border-t border-emerald-800/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs relative z-10">
        <div class="space-y-0.5">
          <span class="text-[10px] font-bold text-emerald-200/70 uppercase tracking-wider block">Jadwal Praktikum</span>
          <p class="text-lg font-black text-white">
            {{ upcomingSessionsCount }}
            <span class="text-xs font-normal text-emerald-200/70">Sesi Minggu Ini</span>
          </p>
        </div>

        <div class="space-y-0.5">
          <span class="text-[10px] font-bold text-emerald-200/70 uppercase tracking-wider block">Permohonan Pending</span>
          <p class="text-lg font-black text-amber-300">
            {{ pendingRequestsCount }} Menunggu Review
          </p>
        </div>

        <div class="space-y-0.5">
          <span class="text-[10px] font-bold text-emerald-200/70 uppercase tracking-wider block">Reservasi Disetujui</span>
          <p class="text-lg font-black text-white">
            {{ approvedRequestsCount }} Ruang Siap
          </p>
        </div>

        <div class="space-y-0.5">
          <span class="text-[10px] font-bold text-emerald-200/70 uppercase tracking-wider block">Lab Tersedia</span>
          <p class="text-lg font-black text-emerald-200">
            {{ availableLabsCount }} Laboratorium
          </p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="py-20 text-center">
      <Loader2 :size="36" class="mx-auto text-dark-green animate-spin mb-3" />
      <p class="text-xs text-text-muted font-medium">Loading your academic dashboard...</p>
    </div>

    <template v-else>
      <!-- 2. Modern 4-Card KPI Metric Ribbon -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0">
        
        <!-- Card 1: Weekly Class Sessions -->
        <div
          @click="navigateTo('/lecturer/schedules')"
          class="bg-white p-4.5 rounded-2xl border border-gray-200/70 shadow-2xs flex items-center justify-between transition-all duration-200 ease-out group select-none hover:-translate-y-0.5 hover:bg-brand-50/20 hover:border-brand-300/80 hover:shadow-md hover:shadow-black/[0.04] cursor-pointer min-w-0"
        >
          <div class="space-y-1 min-w-0 flex-1 pr-2">
            <span class="text-text-muted text-[11px] font-bold uppercase tracking-wider block transition-colors duration-200 group-hover:text-text-primary truncate">
              Jadwal Praktikum Mingguan
            </span>
            <span class="text-xl sm:text-2xl font-black text-text-primary block transition-colors duration-200 group-hover:text-dark-green">
              {{ upcomingSessionsCount }} Sesi
            </span>
            <span class="text-[11px] text-text-muted font-medium block truncate">
              Sesi terjadwal minggu ini
            </span>
          </div>
          <div class="w-11 h-11 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 border border-brand-200/60 transition-all duration-200 group-hover:scale-105 group-hover:bg-brand-200/70">
            <Calendar :size="20" stroke-width="2" />
          </div>
        </div>

        <!-- Card 2: Pending Applications -->
        <div
          @click="navigateTo('/lecturer/room-requests')"
          class="bg-white p-4.5 rounded-2xl border border-gray-200/70 shadow-2xs flex items-center justify-between transition-all duration-200 ease-out group select-none hover:-translate-y-0.5 hover:bg-brand-50/20 hover:border-brand-300/80 hover:shadow-md hover:shadow-black/[0.04] cursor-pointer min-w-0"
        >
          <div class="space-y-1 min-w-0 flex-1 pr-2">
            <span class="text-text-muted text-[11px] font-bold uppercase tracking-wider block transition-colors duration-200 group-hover:text-text-primary truncate">
              Permohonan Menunggu
            </span>
            <span class="text-xl sm:text-2xl font-black text-amber-800 block transition-colors duration-200 group-hover:text-dark-green">
              {{ pendingRequestsCount }} Menunggu
            </span>
            <span class="inline-flex items-center gap-1 text-[10.5px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
              Menunggu respon staf lab
            </span>
          </div>
          <div class="w-11 h-11 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200/60 transition-all duration-200 group-hover:scale-105 group-hover:bg-amber-100/80">
            <Clock :size="20" stroke-width="2" />
          </div>
        </div>

        <!-- Card 3: Confirmed Reservations -->
        <div
          @click="navigateTo('/lecturer/room-requests')"
          class="bg-white p-4.5 rounded-2xl border border-gray-200/70 shadow-2xs flex items-center justify-between transition-all duration-200 ease-out group select-none hover:-translate-y-0.5 hover:bg-brand-50/20 hover:border-brand-300/80 hover:shadow-md hover:shadow-black/[0.04] cursor-pointer min-w-0"
        >
          <div class="space-y-1 min-w-0 flex-1 pr-2">
            <span class="text-text-muted text-[11px] font-bold uppercase tracking-wider block transition-colors duration-200 group-hover:text-text-primary truncate">
              Reservasi Disetujui
            </span>
            <span class="text-xl sm:text-2xl font-black text-text-primary block transition-colors duration-200 group-hover:text-dark-green">
              {{ approvedRequestsCount }} Disetujui
            </span>
            <span class="inline-flex items-center gap-1 text-[10.5px] text-dark-green font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
              Ruang siap digunakan
            </span>
          </div>
          <div class="w-11 h-11 rounded-xl bg-emerald-50 text-dark-green flex items-center justify-center shrink-0 border border-emerald-200/60 transition-all duration-200 group-hover:scale-105 group-hover:bg-emerald-100/80">
            <CheckCircle2 :size="20" stroke-width="2" />
          </div>
        </div>

        <!-- Card 4: Available Lab Spaces -->
        <div
          @click="navigateTo('/lecturer/laboratories')"
          class="bg-white p-4.5 rounded-2xl border border-gray-200/70 shadow-2xs flex items-center justify-between transition-all duration-200 ease-out group select-none hover:-translate-y-0.5 hover:bg-brand-50/20 hover:border-brand-300/80 hover:shadow-md hover:shadow-black/[0.04] cursor-pointer min-w-0"
        >
          <div class="space-y-1 min-w-0 flex-1 pr-2">
            <span class="text-text-muted text-[11px] font-bold uppercase tracking-wider block transition-colors duration-200 group-hover:text-text-primary truncate">
              Laboratorium Tersedia
            </span>
            <span class="text-xl sm:text-2xl font-black text-text-primary block transition-colors duration-200 group-hover:text-dark-green">
              {{ availableLabsCount }} Laboratorium
            </span>
            <span class="text-[11px] text-text-muted font-medium block truncate">
              Siap diajukan peminjaman
            </span>
          </div>
          <div class="w-11 h-11 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 border border-sky-200/60 transition-all duration-200 group-hover:scale-105 group-hover:bg-sky-100/80">
            <FlaskConical :size="20" stroke-width="2" />
          </div>
        </div>

      </div>

      <!-- 3 & 4. Primary Two-Column Layout (Left: 8 Cols, Right: 4 Cols) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
        
        <!-- ======================================================== -->
        <!-- LEFT COLUMN: 8 COLS (TIMETABLE FEED & RESERVATION TRACKER) -->
        <!-- ======================================================== -->
        <div class="lg:col-span-8 space-y-6 w-full min-w-0">
          
          <!-- Section A: Interactive Teaching Timetable Feed -->
          <div class="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/70 shadow-2xs space-y-4 w-full min-w-0">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3 min-w-0">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <h3 class="text-base font-extrabold text-text-primary tracking-tight truncate">Jadwal Praktikum Mendatang</h3>
                  <span class="px-2 py-0.5 rounded-full bg-brand-100 text-dark-green text-[10px] font-extrabold font-mono">
                    {{ schedules.length }} AKTIF
                  </span>
                </div>
                <p class="text-xs text-text-muted truncate">Sesi mengajar dan praktikum yang telah dijadwalkan.</p>
              </div>

              <button
                @click="navigateTo('/lecturer/schedules')"
                class="self-start sm:self-auto inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full border border-gray-200 bg-surface/40 hover:bg-brand-50 text-dark-green text-xs font-bold transition-all cursor-pointer shrink-0"
              >
                <span>Lihat Jadwal Lengkap</span>
                <ChevronRight :size="14" />
              </button>
            </div>

            <!-- Session Cards Feed -->
            <div v-if="schedules.length > 0" class="space-y-3 w-full min-w-0">
              <div
                v-for="item in schedules"
                :key="item.id"
                @click="navigateTo(`/lecturer/schedules/${item.id}`)"
                class="p-4 rounded-xl border border-gray-100 bg-surface/30 hover:bg-brand-50/40 hover:border-brand-200/80 transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full min-w-0 group cursor-pointer"
              >
                <!-- Time & Room Info -->
                <div class="flex items-start gap-3.5 min-w-0 flex-1">
                  <!-- Stylized Time Pill -->
                  <div class="px-3 py-2 rounded-xl bg-white border border-gray-200/80 text-center shrink-0 shadow-2xs group-hover:border-brand-300 transition-colors">
                    <span class="text-xs font-extrabold text-dark-green block whitespace-nowrap font-mono">{{ item.timeSlot }}</span>
                    <span class="text-[9.5px] font-bold text-text-muted uppercase tracking-wider block mt-0.5">{{ item.dateLabel }}</span>
                  </div>

                  <div class="min-w-0 flex-1 space-y-1">
                    <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap min-w-0">
                      <span class="px-2 py-0.5 rounded bg-gray-100 text-text-primary text-[10px] font-mono font-bold shrink-0">
                        {{ item.roomCode }}
                      </span>
                      <h4 class="text-xs sm:text-sm font-bold text-text-primary truncate min-w-0 group-hover:text-dark-green transition-colors">
                        {{ item.roomName }}
                      </h4>
                    </div>

                    <p class="text-xs font-semibold text-text-primary truncate">{{ item.courseName }}</p>

                    <div class="flex items-center gap-2 text-[11px] text-text-muted font-medium flex-wrap">
                      <span class="px-2 py-0.5 rounded-md bg-white border border-gray-200/80 font-bold text-text-secondary">
                        {{ item.className }}
                      </span>
                      <span>•</span>
                      <span>{{ item.studentCount }} Mahasiswa</span>
                    </div>
                  </div>
                </div>

                <!-- Status Badge -->
                <div class="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <span
                    :class="[
                      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-extrabold border whitespace-nowrap',
                      item.status === 'IN PROGRESS'
                        ? 'bg-emerald-50 border-emerald-200 text-dark-green shadow-2xs'
                        : 'bg-sky-50 border-sky-200 text-sky-700'
                    ]"
                  >
                    <span
                      v-if="item.status === 'IN PROGRESS'"
                      class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
                    ></span>
                    <span>{{ item.status === 'IN PROGRESS' ? 'Sedang Berjalan' : 'Terjadwal' }}</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="py-12 text-center text-text-muted space-y-1">
              <CalendarDays :size="32" class="mx-auto text-text-muted/40 mb-1" />
              <h4 class="text-xs font-bold text-text-secondary">Tidak ada sesi mengajar terjadwal</h4>
              <p class="text-[11px] text-text-muted">Anda tidak memiliki kelas praktikum laboratorium yang aktif pada periode ini.</p>
            </div>
          </div>

          <!-- Section B: Room Reservation Status Tracker ("My Room Requests") -->
          <div class="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/70 shadow-2xs space-y-4 w-full min-w-0">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3 min-w-0">
              <div class="min-w-0 flex-1">
                <h3 class="text-base font-extrabold text-text-primary tracking-tight truncate">Permohonan Pinjam Lab Terbaru</h3>
                <p class="text-xs text-text-muted truncate">Pantau status persetujuan dan riwayat permohonan ruangan Anda.</p>
              </div>

              <button
                @click="navigateTo('/lecturer/room-requests')"
                class="self-start sm:self-auto inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full border border-gray-200 bg-surface/40 hover:bg-brand-50 text-dark-green text-xs font-bold transition-all cursor-pointer shrink-0"
              >
                <span>Lihat Semua Permohonan</span>
                <ChevronRight :size="14" />
              </button>
            </div>

            <!-- High-Density Requests List -->
            <div v-if="requests.length > 0" class="space-y-2.5 w-full min-w-0">
              <div
                v-for="req in requests"
                :key="req.id"
                @click="navigateTo(`/lecturer/room-requests/${req.id}`)"
                class="p-3.5 rounded-xl border border-gray-100 bg-surface/25 hover:bg-brand-50/30 hover:border-brand-200 transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs w-full min-w-0 group cursor-pointer relative overflow-hidden"
              >
                <div class="space-y-1 min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap min-w-0">
                    <span class="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-text-primary font-mono font-bold text-[10px] shrink-0">
                      {{ req.requestId }}
                    </span>
                    <span class="font-extrabold text-text-primary truncate min-w-0 group-hover:text-dark-green transition-colors">
                      {{ req.labName }}
                    </span>
                  </div>

                  <p class="text-xs font-semibold text-text-secondary truncate">{{ req.purpose }}</p>

                  <div class="flex items-center gap-2 text-[10.5px] text-text-muted font-medium truncate">
                    <span class="font-mono">{{ req.requestedDate }}</span>
                    <span>•</span>
                    <span class="font-mono">{{ req.requestedTime }}</span>
                    <span>•</span>
                    <span>{{ req.participantCount }} Kursi</span>
                  </div>
                </div>

                <!-- Status Badge & Hover Prompt -->
                <div class="flex items-center gap-3 self-end sm:self-auto shrink-0">
                  <span
                    :class="[
                      'px-3 py-1 rounded-full text-[10.5px] font-extrabold border whitespace-nowrap',
                      req.status === 'Approved'
                        ? 'bg-emerald-50 text-dark-green border-emerald-200'
                        : req.status === 'Pending'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : req.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                    ]"
                  >
                    {{ req.status === 'Approved' ? 'Disetujui' : req.status === 'Pending' ? 'Menunggu' : req.status === 'Rejected' ? 'Ditolak' : req.status }}
                  </span>

                  <!-- Slide-in "Tap to see more →" -->
                  <span class="hidden md:inline-flex items-center gap-0.5 text-[11px] font-bold text-dark-green opacity-0 group-hover:opacity-100 transition-opacity">
                    Detail →
                  </span>
                </div>
              </div>
            </div>

            <!-- Empty State with Active Button -->
            <div v-else class="py-10 text-center text-text-muted space-y-3">
              <div class="w-12 h-12 rounded-2xl bg-surface border border-gray-200/60 flex items-center justify-center mx-auto text-text-muted">
                <ClipboardList :size="24" />
              </div>
              <div class="space-y-1">
                <h4 class="text-xs font-bold text-text-primary">Belum ada permohonan ruangan</h4>
                <p class="text-[11px] text-text-muted max-w-xs mx-auto">
                  Anda belum pernah mengajukan permohonan peminjaman ruangan laboratorium.
                </p>
              </div>
              <button
                @click="navigateTo('/lecturer/room-requests/new')"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#3B694A] to-[#2D5A3F] hover:from-[#31573E] hover:to-[#244430] text-white text-xs font-extrabold shadow-xs shadow-[#2D5A3F]/20 transition-all active:scale-95 cursor-pointer"
              >
                <Plus :size="14" />
                <span>Ajukan Pinjam Lab</span>
              </button>
            </div>
          </div>

        </div>

        <!-- ======================================================== -->
        <!-- RIGHT COLUMN: 4 COLS (SPOTLIGHT, AVAILABILITY, TIMELINE) -->
        <!-- ======================================================== -->
        <div class="lg:col-span-4 space-y-6 w-full min-w-0">
          
          <!-- Section A: Next Class Spotlight Card (Chalet Green Signature Card) -->
          <div class="bg-gradient-to-br from-dark-green via-[#547a5c] to-brand-950 text-white rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-md space-y-4">
            <!-- Decorative Glow Background Effect -->
            <div class="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div class="flex items-center justify-between border-b border-white/15 pb-3">
              <span class="text-[11px] font-extrabold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                <Sparkles :size="13" class="text-lime-200" />
                <span>Sorotan Kelas Berikutnya</span>
              </span>
              <span class="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-extrabold backdrop-blur-xs font-mono">
                MENDATANG
              </span>
            </div>

            <div v-if="nextClassSpotlight" class="space-y-3">
              <div>
                <span class="text-[11px] text-white/70 block uppercase tracking-wider font-semibold">
                  {{ nextClassSpotlight.dateLabel }} · {{ nextClassSpotlight.timeSlot }}
                </span>
                <h4 class="text-lg font-black text-white tracking-tight leading-tight mt-0.5">
                  {{ nextClassSpotlight.courseName }}
                </h4>
                <p class="text-xs text-white/90 font-medium mt-0.5">
                  {{ nextClassSpotlight.className }} · {{ nextClassSpotlight.studentCount }} Mahasiswa Terdaftar
                </p>
              </div>

              <div class="p-3 rounded-xl bg-black/20 border border-white/10 flex items-center justify-between text-xs backdrop-blur-xs">
                <div class="flex items-center gap-2">
                  <MapPin :size="15" class="text-lime-300 shrink-0" />
                  <div>
                    <span class="font-extrabold text-white block leading-tight">{{ nextClassSpotlight.roomName }}</span>
                    <span class="text-[10px] text-white/70 font-mono">{{ nextClassSpotlight.roomCode }}</span>
                  </div>
                </div>

                <span class="px-2 py-0.5 rounded bg-white/20 text-white text-[10px] font-bold">
                  Siap Pakai
                </span>
              </div>

              <button
                @click="navigateTo(`/lecturer/schedules/${nextClassSpotlight.id}`)"
                class="w-full py-2 px-3 rounded-xl bg-white text-dark-green font-extrabold text-xs shadow-xs hover:bg-white/95 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              >
                <span>Lihat Jadwal Kelas</span>
                <ArrowUpRight :size="14" />
              </button>
            </div>

            <!-- Standby Fallback when no upcoming class -->
            <div v-else class="py-4 text-center space-y-2">
              <BookOpen :size="28" class="mx-auto text-white/60 mb-1" />
              <h4 class="text-xs font-extrabold text-white">Tidak ada sesi tersisa hari ini</h4>
              <p class="text-[11px] text-white/80">Semua agenda perkuliahan dan praktikum laboratorium hari ini telah selesai.</p>
            </div>
          </div>

          <!-- Section B: Quick Laboratory Availability Browser -->
          <div class="bg-white p-5 rounded-2xl border border-gray-200/70 shadow-2xs space-y-3.5 w-full min-w-0">
            <div class="flex items-center justify-between border-b border-gray-100 pb-2.5 min-w-0">
              <div class="min-w-0 flex-1">
                <h3 class="text-xs font-extrabold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <DoorOpen :size="14" class="text-dark-green" />
                  <span>Ketersediaan Lab</span>
                </h3>
                <p class="text-[10.5px] text-text-muted truncate">Status fisik ruangan saat ini</p>
              </div>
              <span class="text-[10px] text-text-muted font-bold shrink-0">{{ labAvailabilities.length }} Ruangan</span>
            </div>

            <div v-if="labAvailabilities.length > 0" class="space-y-2 w-full min-w-0">
              <div
                v-for="lab in labAvailabilities"
                :key="lab.id"
                class="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-surface/20 hover:bg-brand-50/20 transition-all text-xs gap-2 min-w-0"
              >
                <div class="min-w-0 flex-1 pr-2 space-y-0.5">
                  <div class="flex items-center gap-1.5">
                    <span class="font-bold text-text-primary truncate">{{ lab.name }}</span>
                    <span class="px-1.5 py-0.2 rounded bg-gray-100 text-text-muted text-[9.5px] font-mono font-bold">
                      {{ lab.code }}
                    </span>
                  </div>
                  <p class="text-[10px] text-text-muted font-medium truncate">
                    {{ lab.capacity }} Kursi · {{ lab.location }}
                  </p>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 whitespace-nowrap',
                      lab.status === 'Available'
                        ? 'bg-emerald-50 text-dark-green border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    ]"
                  >
                    <span
                      :class="[
                        'w-1.5 h-1.5 rounded-full',
                        lab.status === 'Available' ? 'bg-emerald-500' : 'bg-amber-500'
                      ]"
                    ></span>
                    <span>{{ lab.status === 'Available' ? 'Tersedia' : 'Sedang Dipakai' }}</span>
                  </span>

                  <button
                    @click="navigateTo(`/lecturer/room-requests/new?labId=${lab.id}`)"
                    class="p-1 rounded-lg hover:bg-brand-100 text-text-muted hover:text-dark-green transition-colors cursor-pointer"
                    title="Ajukan Pinjam Ruangan"
                  >
                    <ArrowUpRight :size="15" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="py-6 text-center text-text-muted text-xs font-medium">
              Belum ada data laboratorium yang terdaftar.
            </div>
          </div>

          <!-- Section C: Activity Timeline ("Recent Updates") -->
          <div class="bg-white p-5 rounded-2xl border border-gray-200/70 shadow-2xs space-y-3.5 w-full min-w-0">
            <div class="flex items-center justify-between border-b border-gray-100 pb-2.5 min-w-0">
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 truncate">
                <History :size="14" class="text-dark-green shrink-0" />
                <span>Pembaruan Terkini</span>
              </h3>
              <span class="text-[10px] text-text-muted font-bold shrink-0">Riwayat Log</span>
            </div>

            <div v-if="activities.length > 0" class="space-y-3 text-xs w-full min-w-0">
              <div
                v-for="act in activities"
                :key="act.id"
                class="flex items-start gap-3 pb-2.5 border-b border-gray-100 last:border-0 last:pb-0 w-full min-w-0"
              >
                <div
                  :class="[
                    'w-2 h-2 rounded-full shrink-0 mt-1.5',
                    act.statusType === 'approved'
                      ? 'bg-emerald-500 ring-2 ring-emerald-100'
                      : act.statusType === 'rejected'
                        ? 'bg-rose-500 ring-2 ring-rose-100'
                        : 'bg-amber-500 ring-2 ring-amber-100'
                  ]"
                ></div>
                <div class="min-w-0 flex-1 space-y-0.5">
                  <p class="font-medium text-text-primary leading-snug break-words">{{ act.title }}</p>
                  <span class="text-[10px] text-text-muted font-mono block">{{ act.timestamp }}</span>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="py-6 text-center text-text-muted text-xs font-medium">
              Belum ada riwayat aktivitas terbaru.
            </div>
          </div>

        </div>

      </div>
    </template>

  </div>
</template>
