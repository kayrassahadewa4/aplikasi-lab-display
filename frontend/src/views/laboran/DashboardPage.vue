<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import { useLaboranNavStore } from '@/stores/laboran-nav.store'
import {
  Calendar,
  CalendarDays,
  DoorOpen,
  FlaskConical,
  ClipboardList,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Eye,
  History,
  Loader2,
  AlertCircle,
  AlertTriangle,
  X,
  Clock,
  Radio,
  ArrowUpRight,
  Plus,
  Layers,
  UserCheck,
  Building,
  Check,
  MonitorCheck,
  TrendingUp,
  FileText,
  CheckSquare,
  Square,
  Monitor,
  Activity,
  ShieldCheck,
  ArrowRight
} from 'lucide-vue-next'
import { dashboardService, type DashboardSummaryDto } from '@/services/dashboard.service'
import { scheduleService, type ScheduleData } from '@/services/schedule.service'
import { roomUsageService, type RoomUsage } from '@/services/room-usage.service'
import { roomRequestService, type RoomRequest } from '@/services/room-request.service'
import { laboratoryService, type LaboratoryData } from '@/services/laboratory.service'
import { formatDate, formatTime, formatDateTime } from '@/utils/format.utils'
import { BaseAvatar } from '@/components'

const router = useRouter()
const authStore = useAuthStore()
const navStore = useLaboranNavStore()

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

// Daily Shift Checklist
interface ChecklistTask {
  id: string
  label: string
  completed: boolean
  category: string
}

const defaultTasks: ChecklistTask[] = [
  { id: 't-1', label: 'Pengecekan suhu AC & kelistrikan laboratorium', completed: true, category: 'Fasilitas' },
  { id: 't-2', label: 'Verifikasi kesiapan proyektor & PC dosen', completed: true, category: 'Hardware' },
  { id: 't-3', label: 'Buka akses & presensi sesi praktikum pagi', completed: false, category: 'Jadwal' },
  { id: 't-4', label: 'Tinjau & validasi permohonan pinjam ruang masuk', completed: false, category: 'Administrasi' },
  { id: 't-5', label: 'Rekap & finalisasi log penggunaan lab hari ini', completed: false, category: 'Pelaporan' },
]

const storedTasksKey = 'laboran_daily_checklist'
const dailyTasks = ref<ChecklistTask[]>([])

const loadChecklist = () => {
  try {
    const saved = localStorage.getItem(storedTasksKey)
    if (saved) {
      dailyTasks.value = JSON.parse(saved)
      return
    }
  } catch {}
  dailyTasks.value = [...defaultTasks]
}

const toggleTask = (taskId: string) => {
  const task = dailyTasks.value.find(t => t.id === taskId)
  if (task) {
    task.completed = !task.completed
    try {
      localStorage.setItem(storedTasksKey, JSON.stringify(dailyTasks.value))
    } catch {}
  }
}

const completedTasksCount = computed(() => dailyTasks.value.filter(t => t.completed).length)
const checklistProgressPercent = computed(() => {
  if (!dailyTasks.value.length) return 0
  return Math.round((completedTasksCount.value / dailyTasks.value.length) * 100)
})

onMounted(() => {
  navStore.setBreadcrumbs([
    { label: 'Laboran Portal', path: '/laboran' },
    { label: 'Dashboard' }
  ])
  updateLiveClock()
  clockTimer = setInterval(updateLiveClock, 1000)
  loadChecklist()
  loadDashboardData()
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
})

// Dynamic Laboran Greeting Name
const laboranDisplayName = computed(() => {
  if (authStore.userName && !authStore.userName.toLowerCase().includes('admin')) {
    return authStore.userName
  }
  return 'Laboratory Staff'
})

// Formatted Current Date String (Indonesian WIB)
const formattedCurrentDate = computed(() => {
  return formatDate(new Date(), true)
})

// Current Academic Session Phase (Pagi, Siang, Sore, Malam)
const currentSessionPhase = computed(() => {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      hour12: false,
    })
    const h = parseInt(formatter.format(new Date()), 10)
    if (h >= 6 && h < 11) {
      return { label: 'Sesi Pagi', period: '07:00 – 11:00 WIB' }
    }
    if (h >= 11 && h < 15) {
      return { label: 'Sesi Siang', period: '11:00 – 15:00 WIB' }
    }
    if (h >= 15 && h < 18) {
      return { label: 'Sesi Sore', period: '15:00 – 18:00 WIB' }
    }
    return { label: 'Sesi Malam', period: '18:00 – 21:00 WIB' }
  } catch {
    return { label: 'Sesi Operasional', period: '07:00 – 21:00 WIB' }
  }
})

// Reactive Datasets
const summary = ref<DashboardSummaryDto | null>(null)
const todaySchedules = ref<ScheduleData[]>([])
const activeUsages = ref<RoomUsage[]>([])
const laboratories = ref<LaboratoryData[]>([])
const pendingRequests = ref<RoomRequest[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const scheduleFilter = ref<'all' | 'active' | 'upcoming'>('all')

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

// Load all dashboard operational data in parallel
const loadDashboardData = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const [summaryRes, schedRes, usageRes, labRes, reqRes] = await Promise.all([
      dashboardService.getSummary().catch(() => null),
      scheduleService.getSchedules({ page: 1, limit: 50 }).catch(() => ({ schedules: [], meta: {} as any })),
      roomUsageService.getRoomUsages({ status: 'IN_USE', limit: 10 }).catch(() => ({ data: [], meta: {} as any })),
      laboratoryService.getLaboratories({ page: 1, limit: 100 }).catch(() => ({ laboratories: [], meta: {} as any })),
      roomRequestService.getRoomRequests({ status: 'PENDING', limit: 5 }).catch(() => ({ data: [], meta: {} as any }))
    ])

    summary.value = summaryRes

    // Filter schedules for today's day of week
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const todayIndex = new Date().getDay()
    const todayName = dayNames[todayIndex]
    const filteredToday = (schedRes.schedules || []).filter(s => s.dayName === todayName)

    // Use filtered today schedules if found, else first upcoming schedules
    todaySchedules.value = filteredToday.length > 0 ? filteredToday : (schedRes.schedules || []).slice(0, 8)
    activeUsages.value = usageRes.data || []
    laboratories.value = labRes.laboratories || []
    pendingRequests.value = reqRes.data || []
  } catch (err: any) {
    errorMessage.value = err.message || 'Failed to load operational dashboard data'
  } finally {
    isLoading.value = false
  }
}

// Computed stats with fallbacks
const totalSchedulesCount = computed(() => summary.value?.today_schedules ?? todaySchedules.value.length)
const activeUsageCount = computed(() => summary.value?.current_room_usage ?? activeUsages.value.length)
const totalLabsCount = computed(() => summary.value?.total_laboratories ?? laboratories.value.length)
const availableLabsCount = computed(() => summary.value?.active_laboratories ?? laboratories.value.filter(l => l.status === 'Active').length)
const pendingRequestsCount = computed(() => summary.value?.pending_requests ?? pendingRequests.value.length)

const activeSpotlightSession = computed(() => activeUsages.value[0] || null)

const occupancyRate = computed(() => {
  if (totalLabsCount.value === 0) return 0
  return Math.min(100, Math.round((activeUsageCount.value / totalLabsCount.value) * 100))
})

// Helper: Calculate session duration
const getSessionDuration = (startTime?: string, endTime?: string): string => {
  if (!startTime || !endTime) return '2 hrs'
  try {
    const [h1, m1] = startTime.split(':').map(Number)
    const [h2, m2] = endTime.split(':').map(Number)
    const totalMinutes = (h2! * 60 + (m2 || 0)) - (h1! * 60 + (m1 || 0))
    if (totalMinutes <= 0) return '2 hrs'
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    if (minutes === 0) return `${hours} hr${hours > 1 ? 's' : ''}`
    return `${hours}h ${minutes}m`
  } catch {
    return '2 hrs'
  }
}

// Helper: Get dynamic schedule session status
const getScheduleStatus = (item: ScheduleData): 'ACTIVE' | 'SCHEDULED' | 'COMPLETED' => {
  if (item.status === 'ACTIVE') return 'ACTIVE'
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  if (item.startTime && item.endTime) {
    const [h1, m1] = item.startTime.split(':').map(Number)
    const [h2, m2] = item.endTime.split(':').map(Number)
    const startMinutes = (h1 || 0) * 60 + (m1 || 0)
    const endMinutes = (h2 || 0) * 60 + (m2 || 0)

    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
      return 'ACTIVE'
    } else if (currentMinutes > endMinutes) {
      return 'COMPLETED'
    }
  }
  return 'SCHEDULED'
}

// Filtered Schedules Stream
const filteredSchedules = computed(() => {
  return todaySchedules.value.filter(s => {
    const status = getScheduleStatus(s)
    if (scheduleFilter.value === 'active') return status === 'ACTIVE'
    if (scheduleFilter.value === 'upcoming') return status === 'SCHEDULED'
    return true
  })
})

// Helper: Check if laboratory is currently in use
const isLabInUse = (labId: string): boolean => {
  return activeUsages.value.some(u => u.laboratoryId === labId)
}

// 1. Live Occupancy Percentage
const occupancyPercentage = computed(() => {
  if (!laboratories.value.length) return 0
  const occupiedCount = laboratories.value.filter(l => isLabInUse(l.id)).length
  return Math.round((occupiedCount / laboratories.value.length) * 100)
})

// 2. Total Workstations & Health Index
const totalWorkstations = computed(() => {
  return laboratories.value.reduce((acc, lab) => acc + (lab.maximumCapacity || 35), 0)
})

// 3. Today's Total Practicum Hours
const totalPracticumHours = computed(() => {
  const sessions = todaySchedules.value.length + activeUsages.value.length
  return (sessions * 2).toFixed(1) // Average 2h per session
})

// Action Shortcuts Navigation
const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="space-y-6 pb-12 select-none">
    
    <!-- ======================================================== -->
    <!-- 1. PRESTIGIOUS OPERATIONAL COMMAND CENTER HERO BANNER     -->
    <!-- ======================================================== -->
    <div
      class="bg-gradient-to-br from-[#0c5a30] via-[#094726] to-[#06331b] text-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-emerald-950/15 relative overflow-hidden border border-emerald-700/30"
    >
      <!-- Institutional Ambient Glow Circles -->
      <div class="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      <div class="absolute right-1/3 -top-12 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

      <div class="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        
        <!-- Left: User Identity & Welcome Greeting -->
        <div class="flex items-start sm:items-center gap-4.5">
          <div class="relative shrink-0">
            <BaseAvatar
              :src="authStore.userAvatar"
              :name="laboranDisplayName"
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
              <h1 class="text-xl sm:text-2xl font-bold text-white leading-tight">
                Selamat Datang, {{ laboranDisplayName }}!
              </h1>
              <span class="px-2.5 py-0.5 rounded-full bg-amber-400 text-emerald-950 text-[10px] font-bold uppercase tracking-wide shadow-2xs">
                Laboran On Duty
              </span>
            </div>

            <p class="text-xs text-emerald-100/80 font-medium">
              Staff Laboratorium Komputer • FIK UPN Veteran Jakarta
            </p>

            <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 text-[11px] text-emerald-200/90 font-semibold">
              <span class="inline-flex items-center gap-1.5">
                <Calendar :size="12" class="text-amber-400" />
                <span>{{ formattedCurrentDate }}</span>
              </span>
              <span>•</span>
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/25 border border-white/15 font-mono text-white text-xs font-bold shadow-inner">
                <Clock :size="12" class="text-emerald-300" />
                <span>{{ liveTimeStr || 'WIB' }}</span>
              </span>
              <span>•</span>
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/25 text-emerald-100 border border-emerald-400/40 text-[10px] font-bold">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span>{{ currentSessionPhase.label }} ({{ currentSessionPhase.period }})</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Right: Live Quick Operational Telemetry & Actions -->
        <div class="flex flex-wrap items-center gap-2.5 sm:gap-3 self-start lg:self-center">
          <button
            @click="navigateTo('/laboran/room-usage')"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-bold shadow-md shadow-black/10 transition-all duration-150 cursor-pointer active:scale-95"
          >
            <Plus :size="15" stroke-width="2.5" />
            <span>Log Check-In Ruang</span>
          </button>

          <button
            @click="navigateTo('/laboran/room-requests')"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold backdrop-blur-xs transition-all duration-150 cursor-pointer active:scale-95"
          >
            <ClipboardList :size="15" />
            <span>Tinjau Permohonan ({{ pendingRequestsCount }})</span>
          </button>

          <router-link
            to="/display"
            target="_blank"
            class="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer hidden sm:flex items-center justify-center"
            title="Buka Layar Display TV Publik"
          >
            <Monitor :size="16" />
          </router-link>
        </div>

      </div>

      <!-- Quick Metrics Ribbon inside Hero -->
      <div class="mt-6 pt-5 border-t border-emerald-800/40 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs relative z-10">
        <div class="space-y-0.5">
          <span class="text-[10px] font-bold text-emerald-200/70 uppercase tracking-wide block">Lab Siap Digunakan</span>
          <p class="text-lg font-bold text-white">
            {{ laboratories.filter(l => l.status === 'Active' && !isLabInUse(l.id)).length }}
            <span class="text-xs font-normal text-emerald-200/70">/ {{ laboratories.length }} Lab</span>
          </p>
        </div>

        <div class="space-y-0.5">
          <span class="text-[10px] font-bold text-emerald-200/70 uppercase tracking-wide block">Sesi Berlangsung</span>
          <p class="text-lg font-bold text-amber-300">
            {{ activeUsages.length }} Sesi Aktif
          </p>
        </div>

        <div class="space-y-0.5">
          <span class="text-[10px] font-bold text-emerald-200/70 uppercase tracking-wide block">Jadwal Kelas Hari Ini</span>
          <p class="text-lg font-bold text-white">
            {{ todaySchedules.length }} Mata Kuliah
          </p>
        </div>

        <div class="space-y-0.5">
          <span class="text-[10px] font-bold text-emerald-200/70 uppercase tracking-wide block">Antrean Permohonan</span>
          <p class="text-lg font-bold" :class="pendingRequests.length > 0 ? 'text-amber-300' : 'text-emerald-200'">
            {{ pendingRequests.length }} Surat Masuk
          </p>
        </div>

        <div class="space-y-0.5 col-span-2 sm:col-span-1">
          <span class="text-[10px] font-bold text-emerald-200/70 uppercase tracking-wide block">Checklist Shift</span>
          <p class="text-lg font-bold text-emerald-200 flex items-center gap-1.5">
            <span>{{ completedTasksCount }}/{{ dailyTasks.length }}</span>
            <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/10 text-emerald-100 border border-white/15 font-mono">
              {{ checklistProgressPercent }}%
            </span>
          </p>
        </div>
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
      <button @click="errorMessage = ''" class="text-rose-800 hover:opacity-80 cursor-pointer">
        <X :size="14" />
      </button>
    </div>

    <!-- 2. HIGH-FIDELITY DASHBOARD SKELETON SHIMMER (ZERO CLS) -->
    <div v-if="isLoading" class="space-y-6 animate-pulse select-none">
      <!-- Top 4 KPI Skeleton Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="`sk-dash-kpi-${i}`" class="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3 min-h-[142px]">
          <div class="flex justify-between items-center">
            <div class="w-10 h-10 rounded-xl bg-gray-200/70" />
            <div class="h-4 bg-gray-100 rounded-full w-20" />
          </div>
          <div class="space-y-1.5 pt-2">
            <div class="h-3 bg-gray-100 rounded w-28" />
            <div class="h-7 bg-gray-200/80 rounded w-36" />
          </div>
          <div class="h-1.5 bg-gray-100 rounded-full w-full mt-2" />
        </div>
      </div>

      <!-- Main Content Split Skeleton -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Left Column (7 cols) -->
        <div class="lg:col-span-7 space-y-6">
          <!-- Timetable Stream Skeleton -->
          <div class="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
            <div class="flex items-center justify-between border-b border-gray-100 pb-3">
              <div class="space-y-1.5">
                <div class="h-4 bg-gray-200/80 rounded w-44" />
                <div class="h-3 bg-gray-100 rounded w-64" />
              </div>
              <div class="h-6 bg-gray-100 rounded-full w-24" />
            </div>
            <div class="space-y-3">
              <div v-for="i in 3" :key="`sk-dash-sched-${i}`" class="p-3.5 rounded-xl border border-gray-100 bg-surface/40 flex items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-gray-200/70 shrink-0" />
                  <div class="space-y-1.5">
                    <div class="h-3.5 bg-gray-200/80 rounded w-36" />
                    <div class="h-3 bg-gray-100 rounded w-48" />
                  </div>
                </div>
                <div class="h-7 bg-gray-200/70 rounded-xl w-20 shrink-0" />
              </div>
            </div>
          </div>

          <!-- Laboratories Catalog Grid Skeleton -->
          <div class="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
            <div class="flex items-center justify-between border-b border-gray-100 pb-3">
              <div class="space-y-1.5">
                <div class="h-4 bg-gray-200/80 rounded w-48" />
                <div class="h-3 bg-gray-100 rounded w-56" />
              </div>
              <div class="h-6 bg-emerald-100/60 rounded-full w-20" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div v-for="i in 4" :key="`sk-dash-lab-${i}`" class="p-4 rounded-xl border border-gray-100 bg-surface/30 space-y-2.5">
                <div class="flex justify-between items-center">
                  <div class="h-4 bg-gray-200/80 rounded w-16" />
                  <div class="h-4 bg-emerald-100/70 rounded-full w-20" />
                </div>
                <div class="h-4 bg-gray-200/80 rounded w-32" />
                <div class="h-3 bg-gray-100 rounded w-24" />
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column (5 cols) -->
        <div class="lg:col-span-5 space-y-5">
          <!-- Shift Checklist Skeleton -->
          <div class="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
            <div class="flex items-center justify-between border-b border-gray-100 pb-3">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-gray-200/70" />
                <div class="space-y-1">
                  <div class="h-3.5 bg-gray-200/80 rounded w-32" />
                  <div class="h-2.5 bg-gray-100 rounded w-24" />
                </div>
              </div>
              <div class="h-4 bg-gray-200/80 rounded w-10" />
            </div>
            <div class="h-2 bg-gray-100 rounded-full w-full" />
            <div class="space-y-2">
              <div v-for="i in 4" :key="`sk-dash-task-${i}`" class="p-2.5 rounded-xl border border-gray-100 bg-surface/40 flex items-center gap-3">
                <div class="w-5 h-5 rounded-lg bg-gray-200/70 shrink-0" />
                <div class="h-3 bg-gray-200/80 rounded flex-1" />
                <div class="h-3 bg-gray-100 rounded w-12 shrink-0" />
              </div>
            </div>
          </div>

          <!-- Spotlight Session Skeleton -->
          <div class="p-5 rounded-2xl bg-emerald-900/20 border border-emerald-800/30 space-y-3">
            <div class="h-4 bg-emerald-700/30 rounded w-36" />
            <div class="h-5 bg-emerald-700/40 rounded w-48" />
            <div class="h-3 bg-emerald-700/20 rounded w-32" />
          </div>
        </div>
      </div>
    </div>

    <!-- Dashboard Content -->
    <template v-else>
      
      <!-- ======================================================== -->
      <!-- 2. MODERN 4-CARD KPI RIBBON (UPNVJ ACCENT DESIGN)        -->
      <!-- ======================================================== -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- CARD 1: LIVE OCCUPANCY -->
        <div
          @click="navigateTo('/laboran/room-usage')"
          class="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs hover:shadow-lg hover:shadow-emerald-950/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
        >
          <div class="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#0c5a30] via-emerald-500 to-amber-400 opacity-70 group-hover:opacity-100 transition-opacity" />
          <div class="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-emerald-100/30 blur-2xl pointer-events-none group-hover:bg-emerald-200/40 transition-colors" />

          <div class="flex items-center justify-between relative z-10">
            <div class="w-11 h-11 rounded-2xl bg-emerald-50 text-dark-green border border-emerald-200/80 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
              <Radio :size="20" class="animate-pulse" />
            </div>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-dark-green text-[10px] font-bold tracking-wide border border-emerald-200">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              LIVE MONITOR
            </span>
          </div>

          <div class="my-3.5 space-y-1 relative z-10">
            <p class="text-xs font-bold text-text-muted uppercase tracking-wide group-hover:text-dark-green transition-colors">
              Okupansi Laboratorium
            </p>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl sm:text-3xl font-extrabold text-text-primary">
                {{ laboratories.filter(l => isLabInUse(l.id)).length }}
                <span class="text-sm font-semibold text-text-muted">/ {{ laboratories.length }} Ruang</span>
              </span>
              <span class="text-xs font-bold text-dark-green font-mono">({{ occupancyPercentage }}%)</span>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="space-y-1.5 relative z-10">
            <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden flex">
              <div
                class="bg-gradient-to-r from-dark-green to-[#1b703d] h-full rounded-full transition-all duration-500"
                :style="{ width: `${occupancyPercentage}%` }"
              />
            </div>
            <div class="flex items-center justify-between text-[10.5px] text-text-muted font-semibold">
              <span>{{ laboratories.filter(l => l.status === 'Active' && !isLabInUse(l.id)).length }} Lab Kosong</span>
              <span class="text-dark-green font-bold group-hover:underline">Detail Log →</span>
            </div>
          </div>
        </div>

        <!-- CARD 2: TODAY'S PRACTICUM LOAD -->
        <div
          @click="navigateTo('/laboran/schedules')"
          class="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs hover:shadow-lg hover:shadow-emerald-950/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
        >
          <div class="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#0c5a30] via-emerald-500 to-amber-400 opacity-70 group-hover:opacity-100 transition-opacity" />
          <div class="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-teal-100/30 blur-2xl pointer-events-none group-hover:bg-teal-200/40 transition-colors" />

          <div class="flex items-center justify-between relative z-10">
            <div class="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200/80 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
              <Clock :size="20" />
            </div>
            <span class="px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200 font-mono">
              HARI INI
            </span>
          </div>

          <div class="my-3.5 space-y-1 relative z-10">
            <p class="text-xs font-bold text-text-muted uppercase tracking-wide group-hover:text-dark-green transition-colors">
              Beban Praktikum Harian
            </p>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl sm:text-3xl font-extrabold text-text-primary">{{ todaySchedules.length }}</span>
              <span class="text-xs font-semibold text-text-muted">Sesi ({{ totalPracticumHours }} Jam)</span>
            </div>
          </div>

          <div class="pt-2 border-t border-gray-100 flex items-center justify-between text-[10.5px] text-text-muted font-semibold relative z-10">
            <span class="flex items-center gap-1 text-teal-700 font-bold">
              <TrendingUp :size="12" />
              <span>Jam Sibuk: 10:00 – 14:00</span>
            </span>
            <span class="text-teal-700 font-bold group-hover:underline">Jadwal →</span>
          </div>
        </div>

        <!-- CARD 3: PENDING APPROVAL QUEUE -->
        <div
          @click="navigateTo('/laboran/room-requests')"
          class="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs hover:shadow-lg hover:shadow-emerald-950/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
        >
          <div class="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 via-emerald-500 to-[#0c5a30] opacity-70 group-hover:opacity-100 transition-opacity" />
          <div class="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-amber-100/30 blur-2xl pointer-events-none group-hover:bg-amber-200/40 transition-colors" />

          <div class="flex items-center justify-between relative z-10">
            <div class="w-11 h-11 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
              <ClipboardList :size="20" />
            </div>
            <span
              v-if="pendingRequests.length > 0"
              class="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300 animate-bounce shadow-2xs"
            >
              {{ pendingRequests.length }} BUTUH TINJAUAN
            </span>
            <span v-else class="px-2.5 py-1 rounded-full bg-emerald-50 text-dark-green text-[10px] font-bold border border-emerald-200">
              Antrean Bersih
            </span>
          </div>

          <div class="my-3.5 space-y-1 relative z-10">
            <p class="text-xs font-bold text-text-muted uppercase tracking-wide group-hover:text-dark-green transition-colors">
              Permohonan Pinjam Lab
            </p>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl sm:text-3xl font-extrabold text-text-primary">{{ pendingRequests.length }}</span>
              <span class="text-xs font-bold text-amber-700">Menunggu Respon</span>
            </div>
          </div>

          <div class="pt-2 border-t border-gray-100 flex items-center justify-between text-[10.5px] text-text-muted font-semibold relative z-10">
            <span>Pengajuan Dosen</span>
            <span class="text-amber-800 font-bold group-hover:underline">Validasi Semua →</span>
          </div>
        </div>

        <!-- CARD 4: WORKSTATION INVENTORY -->
        <div
          @click="navigateTo('/laboran/laboratories')"
          class="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs hover:shadow-lg hover:shadow-emerald-950/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
        >
          <div class="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#0c5a30] via-emerald-500 to-amber-400 opacity-70 group-hover:opacity-100 transition-opacity" />
          <div class="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-emerald-100/30 blur-2xl pointer-events-none group-hover:bg-emerald-200/40 transition-colors" />

          <div class="flex items-center justify-between relative z-10">
            <div class="w-11 h-11 rounded-2xl bg-brand-50 text-dark-green border border-brand-200 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
              <MonitorCheck :size="20" />
            </div>
            <span class="px-2.5 py-1 rounded-full bg-emerald-50 text-dark-green text-[10px] font-bold border border-emerald-200">
              98% PC SIAP
            </span>
          </div>

          <div class="my-3.5 space-y-1 relative z-10">
            <p class="text-xs font-bold text-text-muted uppercase tracking-wide group-hover:text-dark-green transition-colors">
              Kapasitas Perangkat Lab
            </p>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl sm:text-3xl font-extrabold text-text-primary">{{ totalWorkstations }}</span>
              <span class="text-xs font-semibold text-text-muted">Unit Komputer</span>
            </div>
          </div>

          <div class="pt-2 border-t border-gray-100 flex items-center justify-between text-[10.5px] text-text-muted font-semibold relative z-10">
            <span>{{ laboratories.length }} Ruangan Lab FIK</span>
            <span class="text-dark-green font-bold group-hover:underline">Inventaris →</span>
          </div>
        </div>

      </div>

      <!-- ======================================================== -->
      <!-- 3. QUICK ACTION LAUNCHPAD HUB (4 CARDS)                  -->
      <!-- ======================================================== -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div
          @click="navigateTo('/laboran/room-usage')"
          class="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs hover:border-dark-green hover:shadow-md transition-all duration-200 cursor-pointer flex items-center gap-3.5 group"
        >
          <div class="w-10 h-10 rounded-xl bg-emerald-50 text-dark-green flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <DoorOpen :size="20" />
          </div>
          <div class="min-w-0 flex-1">
            <h4 class="text-xs font-extrabold text-text-primary group-hover:text-dark-green transition-colors truncate">
              Log Check-In
            </h4>
            <p class="text-[11px] text-text-muted truncate">Catat sesi lab masuk</p>
          </div>
          <ChevronRight :size="14" class="text-text-muted group-hover:text-dark-green group-hover:translate-x-1 transition-transform" />
        </div>

        <div
          @click="navigateTo('/laboran/room-requests')"
          class="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs hover:border-amber-400 hover:shadow-md transition-all duration-200 cursor-pointer flex items-center gap-3.5 group"
        >
          <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <ClipboardList :size="20" />
          </div>
          <div class="min-w-0 flex-1">
            <h4 class="text-xs font-extrabold text-text-primary group-hover:text-amber-800 transition-colors truncate">
              Surat Permohonan
            </h4>
            <p class="text-[11px] text-text-muted truncate">{{ pendingRequestsCount }} menunggu validasi</p>
          </div>
          <ChevronRight :size="14" class="text-text-muted group-hover:text-amber-700 group-hover:translate-x-1 transition-transform" />
        </div>

        <router-link
          to="/display"
          target="_blank"
          class="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs hover:border-emerald-500 hover:shadow-md transition-all duration-200 cursor-pointer flex items-center gap-3.5 group"
        >
          <div class="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Monitor :size="20" />
          </div>
          <div class="min-w-0 flex-1">
            <h4 class="text-xs font-extrabold text-text-primary group-hover:text-dark-green transition-colors truncate">
              Layar TV Display
            </h4>
            <p class="text-[11px] text-text-muted truncate">Pratinjau jadwal lorong</p>
          </div>
          <ArrowUpRight :size="14" class="text-text-muted group-hover:text-dark-green transition-transform" />
        </router-link>

        <div
          @click="navigateTo('/laboran/reports')"
          class="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs hover:border-dark-green hover:shadow-md transition-all duration-200 cursor-pointer flex items-center gap-3.5 group"
        >
          <div class="w-10 h-10 rounded-xl bg-brand-50 text-dark-green flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <FileText :size="20" />
          </div>
          <div class="min-w-0 flex-1">
            <h4 class="text-xs font-extrabold text-text-primary group-hover:text-dark-green transition-colors truncate">
              Laporan Pemakaian
            </h4>
            <p class="text-[11px] text-text-muted truncate">Rekapitulasi jam & lab</p>
          </div>
          <ChevronRight :size="14" class="text-text-muted group-hover:text-dark-green group-hover:translate-x-1 transition-transform" />
        </div>

      </div>

      <!-- ======================================================== -->
      <!-- 4. MAIN SPLIT: SCHEDULE & ROOMS (7) + TASKS & MATRIX (5) -->
      <!-- ======================================================== -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        
        <!-- LEFT COLUMN (7 COLS): SCHEDULE STREAM & VISUAL LAB GRID -->
        <div class="lg:col-span-7 space-y-6">
          
          <!-- SECTION A: TODAY'S SCHEDULE STREAM -->
          <div class="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3.5">
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base font-bold text-text-primary">Jadwal Praktikum Hari Ini</h3>
                  <span class="px-2.5 py-0.5 rounded-full bg-brand-100 text-dark-green text-[10px] font-bold">
                    {{ filteredSchedules.length }} Sesi
                  </span>
                </div>
                <p class="text-xs text-text-muted">Sesi aktif dan jadwal perkuliahan hari ini di lab FIK.</p>
              </div>

              <!-- Quick Filter Pills -->
              <div class="flex items-center gap-2 self-start sm:self-auto">
                <div class="flex items-center bg-surface p-1 rounded-xl border border-gray-200/80 text-xs">
                  <button
                    @click="scheduleFilter = 'all'"
                    :class="[
                      'px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all',
                      scheduleFilter === 'all' ? 'bg-dark-green text-white shadow-2xs' : 'text-text-muted hover:text-text-primary'
                    ]"
                  >
                    Semua
                  </button>
                  <button
                    @click="scheduleFilter = 'active'"
                    :class="[
                      'px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all',
                      scheduleFilter === 'active' ? 'bg-dark-green text-white shadow-2xs' : 'text-text-muted hover:text-text-primary'
                    ]"
                  >
                    Aktif
                  </button>
                  <button
                    @click="scheduleFilter = 'upcoming'"
                    :class="[
                      'px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all',
                      scheduleFilter === 'upcoming' ? 'bg-dark-green text-white shadow-2xs' : 'text-text-muted hover:text-text-primary'
                    ]"
                  >
                    Mendatang
                  </button>
                </div>

                <button
                  @click="navigateTo('/laboran/schedules')"
                  class="inline-flex items-center gap-1 text-xs font-bold text-dark-green hover:underline cursor-pointer ml-1"
                >
                  <span>Selengkapnya</span>
                  <ChevronRight :size="14" />
                </button>
              </div>
            </div>

            <!-- Schedule Stream Cards -->
            <div v-if="filteredSchedules.length > 0" class="space-y-3">
              <div
                v-for="item in filteredSchedules"
                :key="item.id"
                class="p-4 rounded-xl border border-gray-100 bg-surface/40 hover:bg-brand-50/50 hover:border-brand-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group relative overflow-hidden"
              >
                <!-- Active Indicator Bar -->
                <div
                  v-if="getScheduleStatus(item) === 'ACTIVE'"
                  class="absolute left-0 top-0 bottom-0 w-1 bg-dark-green"
                />

                <!-- Time Block Column & Metadata -->
                <div class="flex items-start gap-3.5">
                  <!-- Time Pillar Box -->
                  <div class="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-center shrink-0 shadow-2xs group-hover:border-dark-green/40 transition-colors">
                    <span class="text-xs font-bold font-mono text-dark-green block">{{ item.startTime }} – {{ item.endTime }}</span>
                    <span class="text-[10px] font-semibold text-text-muted uppercase tracking-wide block mt-0.5">
                      {{ getSessionDuration(item.startTime, item.endTime) }}
                    </span>
                  </div>

                  <!-- Course & Instructor Metadata -->
                  <div class="space-y-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="px-2 py-0.5 rounded-md bg-emerald-100 text-dark-green text-[10px] font-mono font-bold border border-emerald-200/60">
                        {{ item.laboratoryCode }}
                      </span>
                      <span class="text-xs font-bold text-text-primary">
                        {{ item.laboratoryName }}
                      </span>
                    </div>

                    <h4 class="text-sm font-bold text-text-primary group-hover:text-dark-green transition-colors">
                      {{ item.courseName }}
                    </h4>

                    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-muted font-medium">
                      <span>Dosen: <strong class="text-text-primary font-semibold">{{ item.lecturerName }}</strong></span>
                      <span>•</span>
                      <span>Kelas: <strong class="text-text-primary font-semibold">{{ item.className }}</strong></span>
                    </div>
                  </div>
                </div>

                <!-- Status Badge & Quick Action -->
                <div class="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                  <span
                    :class="[
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border select-none',
                      getScheduleStatus(item) === 'ACTIVE'
                        ? 'bg-emerald-50 border-emerald-300 text-dark-green shadow-2xs'
                        : getScheduleStatus(item) === 'SCHEDULED'
                          ? 'bg-sky-50 border-sky-200 text-sky-800'
                          : 'bg-gray-100 border-gray-200 text-gray-600'
                    ]"
                  >
                    <span v-if="getScheduleStatus(item) === 'ACTIVE'" class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{{ getScheduleStatus(item) === 'ACTIVE' ? 'SEDANG BERJALAN' : getScheduleStatus(item) }}</span>
                  </span>

                  <button
                    v-if="getScheduleStatus(item) === 'ACTIVE'"
                    @click="navigateTo('/laboran/room-usage')"
                    class="px-3.5 py-1.5 rounded-xl bg-dark-green hover:bg-[#094726] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                  >
                    <DoorOpen :size="13" />
                    <span>Log Ruang</span>
                  </button>

                  <button
                    v-else
                    @click="navigateTo(`/laboran/schedules/${item.id}`)"
                    class="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-brand-50 hover:text-dark-green text-text-secondary text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    Detail →
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty Schedule State -->
            <div v-else class="py-12 text-center text-text-muted space-y-2 bg-surface/30 rounded-2xl border border-dashed border-gray-200">
              <CalendarDays :size="32" class="mx-auto text-dark-green/30" />
              <h4 class="text-xs font-bold text-text-secondary">Tidak Ada Sesi Terjadwal</h4>
              <p class="text-[11px]">Belum ada jadwal perkuliahan untuk filter yang dipilih hari ini.</p>
            </div>
          </div>

          <!-- SECTION B: VISUAL LABORATORY STATUS GRID -->
          <div class="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
            <div class="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 class="text-base font-bold text-text-primary">Katalog Ruangan Laboratorium</h3>
                <p class="text-xs text-text-muted">Ketersediaan instan & status fisik setiap lab komputer.</p>
              </div>
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-dark-green border border-emerald-200 text-xs font-bold">
                {{ laboratories.length }} Ruangan
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                v-for="lab in laboratories"
                :key="lab.id"
                @click="navigateTo(`/laboran/laboratories/${lab.id}`)"
                class="p-4 rounded-xl border border-gray-100 bg-surface/30 hover:bg-brand-50/50 hover:border-dark-green/40 hover:shadow-xs transition-all duration-200 cursor-pointer space-y-2 group"
              >
                <div class="flex items-center justify-between">
                  <span class="font-mono text-xs font-bold text-text-primary px-2 py-0.5 bg-white rounded-md border border-gray-200/80 group-hover:border-dark-green transition-colors">
                    {{ lab.code }}
                  </span>
                  <span
                    :class="[
                      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border',
                      isLabInUse(lab.id)
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : lab.status === 'Active'
                          ? 'bg-emerald-50 text-dark-green border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                    ]"
                  >
                    <span
                      :class="[
                        'w-1.5 h-1.5 rounded-full',
                        isLabInUse(lab.id) ? 'bg-rose-500 animate-pulse' : lab.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'
                      ]"
                    />
                    <span>{{ isLabInUse(lab.id) ? 'Sedang Dipakai' : lab.status === 'Active' ? 'Tersedia' : lab.status }}</span>
                  </span>
                </div>

                <div>
                  <h4 class="text-xs font-bold text-text-primary group-hover:text-dark-green transition-colors truncate">
                    {{ lab.name }}
                  </h4>
                  <p class="text-[10.5px] text-text-muted mt-0.5">
                    Kapasitas: <strong class="text-text-primary font-semibold">{{ lab.maximumCapacity || 35 }} PC</strong> • {{ lab.location || 'Gedung FIK' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- RIGHT COLUMN (5 COLS): DAILY CHECKLIST, SPOTLIGHT & INCOMING -->
        <div class="lg:col-span-5 space-y-5">
          
          <!-- WIDGET 1: DAILY SHIFT OPERATIONAL CHECKLIST -->
          <div class="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
            <div class="flex items-center justify-between border-b border-gray-100 pb-3">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center">
                  <CheckSquare :size="16" />
                </div>
                <div>
                  <h3 class="text-xs font-bold uppercase tracking-wide text-text-primary">
                    Checklist Shift Laboran
                  </h3>
                  <p class="text-[10px] text-text-muted">Prosedur operasional harian</p>
                </div>
              </div>
              <span class="text-xs font-bold text-dark-green font-mono">
                {{ completedTasksCount }}/{{ dailyTasks.length }}
              </span>
            </div>

            <!-- Progress Bar -->
            <div class="space-y-1">
              <div class="flex items-center justify-between text-[10.5px] font-semibold">
                <span class="text-text-muted">Progres Hari Ini</span>
                <span class="text-dark-green font-bold">{{ checklistProgressPercent }}%</span>
              </div>
              <div class="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  class="bg-gradient-to-r from-dark-green to-emerald-500 h-full rounded-full transition-all duration-300"
                  :style="{ width: `${checklistProgressPercent}%` }"
                />
              </div>
            </div>

            <!-- Complete Celebration Banner -->
            <div
              v-if="completedTasksCount === dailyTasks.length && dailyTasks.length > 0"
              class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-dark-green text-xs font-bold flex items-center gap-2 shadow-2xs animate-in fade-in zoom-in-95 duration-200"
            >
              <CheckCircle2 :size="16" class="text-emerald-600 shrink-0" />
              <span>Seluruh Prosedur Shift Rampung Hari Ini!</span>
            </div>

            <!-- Checklist Items -->
            <div class="space-y-2">
              <div
                v-for="task in dailyTasks"
                :key="task.id"
                @click="toggleTask(task.id)"
                class="p-2.5 rounded-xl border border-gray-100 bg-surface/40 hover:bg-brand-50/50 hover:border-emerald-200 transition-all cursor-pointer flex items-center gap-3 select-none active:scale-[0.98] group"
              >
                <div
                  :class="[
                    'w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105',
                    task.completed
                      ? 'bg-dark-green text-white shadow-2xs'
                      : 'border-2 border-gray-300 group-hover:border-dark-green bg-white'
                  ]"
                >
                  <Check v-if="task.completed" :size="13" stroke-width="3" />
                </div>
                <div class="min-w-0 flex-1">
                  <p
                    :class="[
                      'text-xs leading-snug',
                      task.completed ? 'line-through text-text-muted font-normal' : 'text-text-primary font-semibold'
                    ]"
                  >
                    {{ task.label }}
                  </p>
                </div>
                <span class="text-[9.5px] px-1.5 py-0.5 rounded bg-gray-100 text-text-muted font-mono font-semibold shrink-0">
                  {{ task.category }}
                </span>
              </div>
            </div>
          </div>

          <!-- WIDGET 2: LIVE SESSION SPOTLIGHT (UPNVJ SIGNATURE CARD) -->
          <div
            class="bg-gradient-to-br from-[#0c5a30] via-[#094726] to-[#06331b] text-white rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-emerald-950/20 space-y-4 border border-emerald-700/40"
          >
            <!-- Ambient Glow -->
            <div class="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div class="absolute -left-6 -top-6 w-24 h-24 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />

            <div class="flex items-center justify-between relative z-10">
              <span class="text-[10px] font-bold uppercase tracking-wide text-amber-400 flex items-center gap-1.5">
                <Radio :size="14" class="text-amber-400 animate-pulse" />
                <span>Live Session Spotlight</span>
              </span>
              <span class="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold backdrop-blur-xs">
                ● Aktif Sekarang
              </span>
            </div>

            <!-- Active Live Session Info -->
            <div v-if="activeSpotlightSession" class="space-y-3 relative z-10">
              <div>
                <span class="inline-block px-2 py-0.5 rounded bg-white/15 text-white font-mono text-[11px] font-bold mb-1">
                  {{ activeSpotlightSession.laboratoryCode || 'LAB' }}
                </span>
                <h4 class="text-base font-bold text-white leading-snug">
                  {{ activeSpotlightSession.laboratoryName || 'Laboratorium Aktif' }}
                </h4>
                <p class="text-xs text-emerald-100/90 font-medium mt-0.5">
                  {{ activeSpotlightSession.activityName || 'Sesi Perkuliahan / Praktikum Berlangsung' }}
                </p>
              </div>

              <div class="p-3 rounded-xl bg-black/20 border border-white/10 space-y-1.5 text-xs text-emerald-100">
                <div class="flex items-center justify-between">
                  <span class="text-[11px]">Staff Pencatat:</span>
                  <strong class="text-white font-semibold">{{ activeSpotlightSession.checkedInByName || 'Staff' }}</strong>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-[11px]">Waktu Check-In:</span>
                  <strong class="text-white font-mono font-semibold">{{ activeSpotlightSession.formattedCheckInTime || activeSpotlightSession.checkInTime || 'Aktif' }}</strong>
                </div>
              </div>

              <button
                @click="navigateTo(`/laboran/room-usage/${activeSpotlightSession.id}`)"
                class="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-bold shadow-sm transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Kelola / Check-Out Sesi</span>
                <ChevronRight :size="14" />
              </button>
            </div>

            <!-- Standby Fallback State -->
            <div v-else class="py-4 text-center space-y-3 relative z-10">
              <div class="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 text-emerald-200 flex items-center justify-center mx-auto">
                <Check :size="22" stroke-width="2.5" />
              </div>
              <div>
                <h4 class="text-sm font-bold text-white">Semua Lab Siap Digunakan</h4>
                <p class="text-xs text-emerald-100/80 mt-0.5">Belum ada sesi praktikum yang sedang berjalan saat ini.</p>
              </div>
              <button
                @click="navigateTo('/laboran/room-usage')"
                class="w-full py-2.5 rounded-xl bg-white hover:bg-brand-50 text-dark-green text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                + Catat Check-In Ruang Sekarang
              </button>
            </div>
          </div>

          <!-- WIDGET 3: PENDING REQUESTS QUICK QUEUE -->
          <div class="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
            <div class="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <div>
                <h3 class="text-xs font-bold uppercase tracking-wide text-text-primary">
                  Antrean Permohonan Masuk
                </h3>
                <p class="text-[10px] text-text-muted">Pengajuan pinjam lab dari dosen</p>
              </div>
              <span class="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                {{ pendingRequests.length }} Menunggu
              </span>
            </div>

            <div v-if="pendingRequests.length > 0" class="divide-y divide-gray-100">
              <div
                v-for="req in pendingRequests.slice(0, 3)"
                :key="req.id"
                class="py-2.5 flex items-center justify-between text-xs gap-2"
              >
                <div class="min-w-0">
                  <h5 class="font-bold text-text-primary truncate">{{ req.applicantName }}</h5>
                  <p class="text-[10px] text-text-muted truncate">{{ req.laboratoryName }} · {{ req.formattedRequestDate }}</p>
                </div>
                <button
                  @click="navigateTo(`/laboran/room-requests/${req.id}`)"
                  class="text-[11px] font-bold text-dark-green hover:underline shrink-0"
                >
                  Tinjau →
                </button>
              </div>
            </div>

            <div v-else class="py-4 text-center text-text-muted text-[11px]">
              Tidak ada permohonan yang menunggu validasi.
            </div>
          </div>

        </div>

      </div>

    </template>

  </div>
</template>
