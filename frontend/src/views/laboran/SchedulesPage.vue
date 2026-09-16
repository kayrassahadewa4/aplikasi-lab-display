<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLaboranNavStore } from '@/stores/laboran-nav.store'
import {
  Calendar,
  Activity,
  Clock,
  CheckCircle2,
  Search,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  DoorOpen,
  Download,
  RotateCcw,
  LayoutGrid,
  List,
  CalendarDays,
  X,
  AlertCircle,
  BookOpen,
  CalendarCheck,
  Timer,
  FileText,
  Sparkles,
  Radio,
  ExternalLink
} from 'lucide-vue-next'
import SummaryCard from '@/components/admin/SummaryCard.vue'
import { scheduleService, type ScheduleData } from '@/services/schedule.service'
import { laboratoryService, type LaboratoryData } from '@/services/laboratory.service'
import { roomRequestService, type RoomRequest } from '@/services/room-request.service'
import { formatDate } from '@/utils/format.utils'

const router = useRouter()
const navStore = useLaboranNavStore()

// Real-Time Live Clock for "Now" Indicator Line
const now = ref(new Date())
let nowTimer: any = null

onMounted(() => {
  navStore.setBreadcrumbs([
    { label: 'Portal Laboran', path: '/laboran' },
    { label: 'Jadwal Penggunaan' }
  ])
  loadData()
  nowTimer = setInterval(() => {
    now.value = new Date()
  }, 10000)
})

onUnmounted(() => {
  if (nowTimer) clearInterval(nowTimer)
  if (popoverTimeout) clearTimeout(popoverTimeout)
})

// View Modes: 'timetable' | 'list'
const viewMode = ref<'timetable' | 'list'>('timetable')

// Current Selected Date (Default Today)
const currentDate = ref(new Date())
const selectedDateFormatted = computed(() => {
  return formatDate(currentDate.value, true)
})

const selectedDateYYYYMMDD = computed(() => {
  const d = currentDate.value
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
})

const selectedDayOfWeek = computed(() => {
  const day = currentDate.value.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  return day === 0 ? 7 : day // 1=Mon, ..., 7=Sun
})

// Date Navigation (Instant memory switch without jarring shimmer flash)
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

const handleDateInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  if (val) {
    const [y, m, d] = val.split('-').map(Number)
    if (y && m && d) {
      currentDate.value = new Date(y, m - 1, d)
    }
  }
}

// Reactive Datasets
const schedules = ref<ScheduleData[]>([])
const laboratories = ref<LaboratoryData[]>([])
const approvedRequests = ref<RoomRequest[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

// Search & Filter
const searchQuery = ref('')
const selectedStatusFilter = ref<string>('ALL')
const selectedLabFilter = ref<string>('ALL')

// Toast Feedback Notification
const showToast = ref(false)
const toastMessage = ref('')

const triggerToast = (msg: string) => {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3500)
}

// Unified Schedule Item Model
export interface UnifiedScheduleItem {
  id: string
  sourceType: 'SCHEDULE' | 'ROOM_REQUEST'
  sourceId: string
  laboratoryId: string
  laboratoryName: string
  laboratoryCode: string
  courseName: string
  lecturerName: string
  className: string
  date: string // YYYY-MM-DD
  dayOfWeek: number // 1=Mon..7=Sun
  startTime: string // HH:mm
  endTime: string // HH:mm
  status: 'ACTIVE' | 'SCHEDULED' | 'FINISHED' | 'CANCELLED'
  typeLabel: string
  typeBadgeClass: string
}

// Time Helper to parse Minutes
function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0
  const parts = timeStr.split(':')
  const h = parseInt(parts[0] || '0', 10) || 0
  const m = parseInt(parts[1] || '0', 10) || 0
  return h * 60 + m
}

// Dynamic Session Status Evaluator
function evaluateStatus(
  startTime: string,
  endTime: string,
  sessionDateYYYYMMDD: string
): 'ACTIVE' | 'SCHEDULED' | 'FINISHED' {
  const now = new Date()
  const todayYYYYMMDD = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now)

  // Past dates
  if (sessionDateYYYYMMDD < todayYYYYMMDD) return 'FINISHED'
  // Future dates
  if (sessionDateYYYYMMDD > todayYYYYMMDD) return 'SCHEDULED'

  // Today: evaluate against current Jakarta WIB minutes
  const jakartaTimeStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(now)
  const [currH, currM] = jakartaTimeStr.split(':').map(Number)
  const currentMinutes = (currH || 0) * 60 + (currM || 0)

  const startMin = timeToMinutes(startTime)
  let endMin = timeToMinutes(endTime)
  if (endMin <= startMin || endMin === 0) endMin = 1440

  if (currentMinutes >= startMin && currentMinutes < endMin) {
    return 'ACTIVE'
  }
  if (currentMinutes >= endMin) {
    return 'FINISHED'
  }
  return 'SCHEDULED'
}

// Session Duration Calculator
const getSessionDuration = (startTime: string, endTime: string): string => {
  const startMin = timeToMinutes(startTime)
  let endMin = timeToMinutes(endTime)
  if (endMin <= startMin || endMin === 0) endMin += 1440
  const diff = endMin - startMin
  const hours = Math.floor(diff / 60)
  const mins = diff % 60
  if (hours > 0 && mins > 0) return `${hours} jam ${mins} mnt (${diff} mnt)`
  if (hours > 0) return `${hours} jam (${diff} mnt)`
  return `${mins} menit`
}

// "Now" Real-Time Evaluation for Timetable Line
const isToday = computed(() => {
  const cur = selectedDateYYYYMMDD.value
  const todayD = now.value
  const y = todayD.getFullYear()
  const m = String(todayD.getMonth() + 1).padStart(2, '0')
  const d = String(todayD.getDate()).padStart(2, '0')
  return cur === `${y}-${m}-${d}`
})

const nowJakartaTime = computed(() => {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    const parts = formatter.formatToParts(now.value)
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10)
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10)
    return {
      hour,
      minute,
      str: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} WIB`
    }
  } catch {
    const h = now.value.getHours()
    const m = now.value.getMinutes()
    return {
      hour: h,
      minute: m,
      str: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} WIB`
    }
  }
})

const isCurrentTimeSlot = (timeSlotStr: string): boolean => {
  if (!isToday.value) return false
  const slotHour = parseInt(timeSlotStr.split(':')[0] || '0', 10)
  return nowJakartaTime.value.hour === slotHour
}

const currentMinutePercentage = computed(() => {
  return Math.min(100, Math.max(0, (nowJakartaTime.value.minute / 60) * 100))
})

// Hovered Session for Quick Info Preview Popover
const hoveredSession = ref<UnifiedScheduleItem | null>(null)
const popoverPosition = ref<{ x: number; y: number }>({ x: 0, y: 0 })
let popoverTimeout: any = null

const handleSessionMouseEnter = (session: UnifiedScheduleItem, event: MouseEvent) => {
  if (popoverTimeout) clearTimeout(popoverTimeout)
  hoveredSession.value = session
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()

  const popoverWidth = 320
  let left = rect.left + rect.width / 2 - popoverWidth / 2
  if (left < 16) left = 16
  if (left + popoverWidth > window.innerWidth - 16) {
    left = window.innerWidth - popoverWidth - 16
  }

  const popoverHeight = 280
  let top = rect.bottom + 8
  if (top + popoverHeight > window.innerHeight) {
    top = Math.max(16, rect.top - popoverHeight - 8)
  }

  popoverPosition.value = { x: left, y: top }
}

const handleSessionMouseLeave = () => {
  popoverTimeout = setTimeout(() => {
    hoveredSession.value = null
  }, 150)
}

const handlePopoverMouseEnter = () => {
  if (popoverTimeout) clearTimeout(popoverTimeout)
}

const handlePopoverMouseLeave = () => {
  hoveredSession.value = null
}

// Load data from APIs
const loadData = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const [schedRes, labRes, reqRes] = await Promise.all([
      scheduleService.getSchedules({ page: 1, limit: 100 }).catch(() => ({ schedules: [], total: 0 })),
      laboratoryService.getLaboratories({ page: 1, limit: 100 }).catch(() => ({ laboratories: [] })),
      roomRequestService.getRoomRequests({ status: 'APPROVED', limit: 100 }).catch(() => ({
        data: [],
        meta: { page: 1, limit: 100, total: 0, totalPages: 0 }
      }))
    ])
    schedules.value = schedRes.schedules || []
    laboratories.value = labRes.laboratories || []
    approvedRequests.value = reqRes.data || []
  } catch (err: any) {
    errorMessage.value = err.message || 'Gagal memuat data jadwal'
  } finally {
    isLoading.value = false
  }
}

// Unified Sessions for the Selected Date
const daySessions = computed<UnifiedScheduleItem[]>(() => {
  // Track `now.value` for real-time reactivity so status auto-updates every 10s
  const _tick = now.value
  const list: UnifiedScheduleItem[] = []
  const curDateStr = selectedDateYYYYMMDD.value
  const curDayOfWeek = selectedDayOfWeek.value

  // 1. Regular fixed schedules (repeat weekly on matching day of week)
  schedules.value.forEach(sch => {
    if (sch.dayOfWeek === curDayOfWeek) {
      const status = sch.status === 'CANCELLED'
        ? 'CANCELLED'
        : evaluateStatus(sch.startTime, sch.endTime, curDateStr)
      list.push({
        id: `sch-${sch.id}`,
        sourceType: 'SCHEDULE',
        sourceId: sch.id,
        laboratoryId: sch.laboratoryId,
        laboratoryName: sch.laboratoryName,
        laboratoryCode: sch.laboratoryCode,
        courseName: sch.courseName,
        lecturerName: sch.lecturerName,
        className: sch.className,
        date: curDateStr,
        dayOfWeek: sch.dayOfWeek,
        startTime: sch.startTime,
        endTime: sch.endTime,
        status,
        typeLabel: 'Jadwal Kuliah',
        typeBadgeClass: 'bg-emerald-50 text-dark-green border-emerald-200'
      })
    }
  })

  // 2. Approved room requests (match exact requestDate)
  approvedRequests.value.forEach(req => {
    const reqDate = req.requestDate ? req.requestDate.split('T')[0] : ''
    if (reqDate === curDateStr) {
      const status = (req as any).status === 'CANCELLED'
        ? 'CANCELLED'
        : evaluateStatus(req.startTime, req.endTime, curDateStr)
      list.push({
        id: `req-${req.id}`,
        sourceType: 'ROOM_REQUEST',
        sourceId: req.id,
        laboratoryId: req.laboratoryId,
        laboratoryName: req.laboratoryName,
        laboratoryCode: req.laboratoryCode,
        courseName: req.activityName,
        lecturerName: req.applicantName,
        className: req.className || req.courseName || 'Peminjaman',
        date: curDateStr,
        dayOfWeek: curDayOfWeek,
        startTime: req.startTime,
        endTime: req.endTime,
        status,
        typeLabel: 'Peminjaman Lab',
        typeBadgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
      })
    }
  })

  // Sort chronologically by startTime
  return list.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
})

// Filtered Sessions (by Search, Status, Laboratory)
const filteredSchedules = computed<UnifiedScheduleItem[]>(() => {
  return daySessions.value.filter(s => {
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
      const matchCode = s.laboratoryCode.toLowerCase().includes(q)
      const matchClass = s.className.toLowerCase().includes(q)
      if (!matchCourse && !matchInstructor && !matchLab && !matchCode && !matchClass) {
        return false
      }
    }
    return true
  })
})

// Dynamic Metrics
const todaySessionsCount = computed(() => daySessions.value.length)
const ongoingCount = computed(() => daySessions.value.filter(s => s.status === 'ACTIVE').length)
const upcomingCount = computed(() => daySessions.value.filter(s => s.status === 'SCHEDULED').length)
const completedCount = computed(() => daySessions.value.filter(s => s.status === 'FINISHED').length)

// Active Ongoing Session (or next upcoming session)
const ongoingSession = computed(() => {
  return (
    daySessions.value.find(s => s.status === 'ACTIVE') ||
    daySessions.value.find(s => s.status === 'SCHEDULED') ||
    null
  )
})

// Lab List Options for Filter Dropdown
const labOptions = computed(() => {
  const set = new Set<string>()
  laboratories.value.forEach(l => set.add(l.name))
  schedules.value.forEach(s => set.add(s.laboratoryName))
  approvedRequests.value.forEach(r => set.add(r.laboratoryName))
  return Array.from(set).filter(Boolean)
})

// Timetable Matrix Rooms (filtered if specific lab selected)
const timetableRooms = computed(() => {
  let list = laboratories.value
  if (selectedLabFilter.value !== 'ALL') {
    list = list.filter(l => l.name === selectedLabFilter.value)
  }
  if (list.length > 0) {
    return list.map(l => ({ id: l.id, name: l.name, code: l.code }))
  }

  // Fallback: extract distinct laboratories from loaded schedules/requests
  const labsFromSchedules = new Map<string, { id: string; name: string; code: string }>()
  schedules.value.forEach(s => {
    if (s.laboratoryId && !labsFromSchedules.has(s.laboratoryId)) {
      labsFromSchedules.set(s.laboratoryId, {
        id: s.laboratoryId,
        name: s.laboratoryName || 'Lab',
        code: s.laboratoryCode || 'LAB'
      })
    }
  })
  approvedRequests.value.forEach(r => {
    if (r.laboratoryId && !labsFromSchedules.has(r.laboratoryId)) {
      labsFromSchedules.set(r.laboratoryId, {
        id: r.laboratoryId,
        name: r.laboratoryName || 'Lab',
        code: r.laboratoryCode || 'LAB'
      })
    }
  })
  if (labsFromSchedules.size > 0) {
    let result = Array.from(labsFromSchedules.values())
    if (selectedLabFilter.value !== 'ALL') {
      result = result.filter(l => l.name === selectedLabFilter.value)
    }
    if (result.length > 0) return result
  }

  return [
    { id: 'lab-101', name: 'Software Engineering Lab', code: 'LAB-RPL' },
    { id: 'lab-105', name: 'Database Systems Lab', code: 'LAB-DB' },
    { id: 'lab-103', name: 'Computer Network Lab', code: 'LAB-JAR' },
    { id: 'lab-104', name: 'Multimedia Dev Lab', code: 'LAB-MM' },
    { id: 'lab-102', name: 'AI & Robotics Lab', code: 'LAB-AI' },
  ]
})

// Extended time slots from 07:00 to 21:00
const timeSlots = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00'
]

// Slot Occupancy Checker
interface SlotOccupancy {
  type: 'START' | 'SPANNING' | 'EMPTY'
  session?: UnifiedScheduleItem
}

const getSlotOccupancy = (labId: string, time: string): SlotOccupancy => {
  const slotHour = parseInt(time.split(':')[0] || '0', 10)
  const slotStartMin = slotHour * 60
  const slotEndMin = slotStartMin + 60

  // Filter out cancelled sessions so they do not block room occupancy in the timetable
  const labSessions = filteredSchedules.value.filter(
    s => s.laboratoryId === labId && s.status !== 'CANCELLED'
  )

  // 1. Session starting within this slot hour [slotStartMin, slotEndMin)
  const starting = labSessions.find(s => {
    const startMin = timeToMinutes(s.startTime)
    return startMin >= slotStartMin && startMin < slotEndMin
  })
  if (starting) {
    return { type: 'START', session: starting }
  }

  // 2. Session spanning across this slot hour (starts before slotStartMin and ends after slotStartMin)
  const spanning = labSessions.find(s => {
    const startMin = timeToMinutes(s.startTime)
    let endMin = timeToMinutes(s.endTime)
    if (endMin <= startMin || endMin === 0) endMin = 1440
    return startMin < slotStartMin && endMin > slotStartMin
  })
  if (spanning) {
    return { type: 'SPANNING', session: spanning }
  }

  return { type: 'EMPTY' }
}

// Navigation to Detail Page
const handleNavigateToSession = (session: UnifiedScheduleItem) => {
  if (session.sourceType === 'SCHEDULE') {
    router.push(`/laboran/schedules/${session.sourceId}`)
  } else {
    router.push(`/laboran/room-requests/${session.sourceId}`)
  }
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

// Real CSV Export
const handleExportCSV = () => {
  if (filteredSchedules.value.length === 0) {
    triggerToast('Tidak ada data jadwal untuk diekspor pada filter/tanggal ini.')
    return
  }

  const headers = [
    'Waktu Mulai',
    'Waktu Selesai',
    'Laboratorium',
    'Kode Lab',
    'Mata Kuliah / Kegiatan',
    'Dosen / Pemohon',
    'Kelas',
    'Tipe',
    'Status'
  ]
  const rows = filteredSchedules.value.map(s => [
    s.startTime || '',
    s.endTime || '',
    `"${(s.laboratoryName || '').replace(/"/g, '""')}"`,
    s.laboratoryCode || '',
    `"${(s.courseName || '').replace(/"/g, '""')}"`,
    `"${(s.lecturerName || '').replace(/"/g, '""')}"`,
    `"${(s.className || '').replace(/"/g, '""')}"`,
    s.typeLabel || '',
    s.status === 'ACTIVE'
      ? 'Sedang Berjalan'
      : s.status === 'SCHEDULED'
        ? 'Mendatang'
        : s.status === 'CANCELLED'
          ? 'Dibatalkan'
          : 'Selesai'
  ])

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `jadwal-laboratorium-${selectedDateYYYYMMDD.value}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  triggerToast(`Jadwal tanggal ${selectedDateFormatted.value} berhasil diekspor ke CSV.`)
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
            class="p-1 rounded-full hover:bg-gray-200/70 text-text-muted hover:text-text-primary transition-all active:scale-90 cursor-pointer"
            title="Hari Sebelumnya"
          >
            <ChevronLeft :size="15" />
          </button>

          <label class="relative px-2 py-0.5 rounded-full hover:bg-gray-200/60 cursor-pointer flex items-center gap-1.5 transition-colors" title="Pilih tanggal dari kalender">
            <Calendar :size="12" class="text-text-muted shrink-0" />
            <span class="text-text-primary font-extrabold text-xs whitespace-nowrap select-none">
              {{ selectedDateFormatted }}
            </span>
            <input
              type="date"
              :value="selectedDateYYYYMMDD"
              @change="handleDateInput"
              class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>

          <button
            @click="handleNextDate"
            class="p-1 rounded-full hover:bg-gray-200/70 text-text-muted hover:text-text-primary transition-all active:scale-90 cursor-pointer"
            title="Hari Berikutnya"
          >
            <ChevronRight :size="15" />
          </button>
        </div>

        <button
          @click="handleToday"
          class="px-3 py-1.5 rounded-full border border-brand-300 bg-brand-50 hover:bg-brand-100 text-dark-green text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
        >
          Hari Ini
        </button>

        <button
          @click="handleExportCSV"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200/80 bg-white hover:bg-surface text-text-secondary text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
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
        subtext="Terjadwal untuk tanggal ini"
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
        subtext="Selesai pada tanggal ini"
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
        <div class="flex items-center gap-2 flex-wrap">
          <span
            :class="[
              'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-wide border',
              ongoingSession.status === 'ACTIVE'
                ? 'bg-emerald-500/30 border-emerald-400/40 text-emerald-200'
                : 'bg-sky-500/30 border-sky-400/40 text-sky-200'
            ]"
          >
            <span v-if="ongoingSession.status === 'ACTIVE'" class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <Clock v-else :size="12" />
            <span>{{ ongoingSession.status === 'ACTIVE' ? 'Sedang Berjalan' : 'Sesi Berikutnya' }}</span>
          </span>
          <span class="text-[11px] font-mono text-emerald-200 font-bold">
            {{ ongoingSession.startTime }} – {{ ongoingSession.endTime }} WIB
          </span>
          <span
            :class="[
              'px-2 py-0.5 rounded-full text-[10px] font-extrabold border',
              ongoingSession.sourceType === 'SCHEDULE'
                ? 'bg-emerald-800/60 text-emerald-200 border-emerald-600'
                : 'bg-amber-800/60 text-amber-200 border-amber-600'
            ]"
          >
            {{ ongoingSession.typeLabel }}
          </span>
        </div>

        <h3 class="text-base sm:text-lg font-extrabold tracking-tight text-white pt-1">
          {{ ongoingSession.laboratoryName }} ({{ ongoingSession.laboratoryCode }})
        </h3>
        <p class="text-xs text-emerald-100/90 font-medium">
          {{ ongoingSession.courseName }} — {{ ongoingSession.sourceType === 'SCHEDULE' ? 'Dosen' : 'Pemohon' }}: <strong class="text-white font-bold">{{ ongoingSession.lecturerName }}</strong> ({{ ongoingSession.className }})
        </p>
      </div>

      <!-- Action Shortcut -->
      <div class="flex items-center gap-2 shrink-0 self-end sm:self-auto">
        <button
          @click="handleNavigateToSession(ongoingSession)"
          class="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
        >
          Lihat Rincian
        </button>

        <button
          @click="navigateToRoomUsage"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-dark-green hover:bg-emerald-50 text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
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

    <!-- 4b. Rich Institutional Empty State (Laboratorium Bebas Digunakan) -->
    <div
      v-if="daySessions.length === 0 && !isLoading"
      class="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60 border border-emerald-200/80 shadow-xs relative overflow-hidden space-y-5"
    >
      <!-- Background Ambient Glow -->
      <div class="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
      <div class="absolute -left-10 -top-10 w-40 h-40 bg-brand-100/40 rounded-full blur-2xl pointer-events-none" />

      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <!-- Left: Concentric Ring Icon & Description -->
        <div class="flex items-start sm:items-center gap-4">
          <div class="relative shrink-0">
            <div class="w-13 h-13 rounded-2xl bg-emerald-100 text-dark-green flex items-center justify-center ring-6 ring-emerald-50/90 shadow-2xs">
              <CalendarCheck :size="26" stroke-width="2.2" />
            </div>
            <span class="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center shadow-2xs">
              <Sparkles :size="10" />
            </span>
          </div>

          <div class="space-y-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-base sm:text-lg font-bold text-text-primary tracking-normal">
                Laboratorium Bebas & Siap Digunakan
              </h3>
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-dark-green border border-emerald-300/80 text-[10.5px] font-bold uppercase tracking-wide">
                Status Terbuka
              </span>
            </div>
            <p class="text-xs text-text-muted max-w-xl leading-relaxed font-normal">
              Tidak ada perkuliahan semester reguler maupun reservasi ruangan pada <strong>{{ selectedDateFormatted }}</strong>. Seluruh laboratorium dalam status siap pakai untuk kegiatan akademik.
            </p>
          </div>
        </div>

        <!-- Right: Action & Date Shortcuts -->
        <div class="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-auto">
          <button
            @click="navigateToRoomUsage"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-dark-green hover:bg-[#094726] text-white text-xs font-bold shadow-md shadow-emerald-950/10 transition-all cursor-pointer active:scale-95"
          >
            <DoorOpen :size="15" />
            <span>Check-In Ruang Ad-Hoc</span>
          </button>

          <button
            v-if="!isToday"
            @click="handleToday"
            class="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white hover:bg-emerald-50/80 border border-emerald-200 text-dark-green text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
            title="Kembali ke jadwal hari ini"
          >
            <RotateCcw :size="13" />
            <span>Kembali ke Hari Ini</span>
          </button>
        </div>
      </div>

      <!-- 3-Tile Guidance Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 relative z-10">
        <div class="p-3.5 rounded-2xl bg-white/90 border border-emerald-100/90 shadow-2xs space-y-1">
          <div class="flex items-center gap-2 text-dark-green font-bold text-xs tracking-normal">
            <Sparkles :size="14" class="text-amber-500" />
            <span>Akses Belajar Mandiri</span>
          </div>
          <p class="text-[11.5px] text-text-muted leading-relaxed font-normal">
            Mahasiswa diperbolehkan memanfaatkan workstation PC lab dengan koordinasi bersama staf laboran bertugas.
          </p>
        </div>

        <div class="p-3.5 rounded-2xl bg-white/90 border border-emerald-100/90 shadow-2xs space-y-1">
          <div class="flex items-center gap-2 text-dark-green font-bold text-xs tracking-normal">
            <FileText :size="14" class="text-emerald-600" />
            <span>Peminjaman Ruang Lab</span>
          </div>
          <p class="text-[11.5px] text-text-muted leading-relaxed font-normal">
            Dosen atau tim penelitian dapat mengajukan reservasi ruangan pengganti melalui portal resmi.
          </p>
        </div>

        <div class="p-3.5 rounded-2xl bg-white/90 border border-emerald-100/90 shadow-2xs space-y-1">
          <div class="flex items-center gap-2 text-dark-green font-bold text-xs tracking-normal">
            <Building2 :size="14" class="text-sky-600" />
            <span>Pemeliharaan Sistem</span>
          </div>
          <p class="text-[11.5px] text-text-muted leading-relaxed font-normal">
            Waktu yang ideal untuk pembaruan software, pengecekan kabel LAN, serta pemeliharaan kebersihan hardware.
          </p>
        </div>
      </div>
    </div>

    <!-- 5. Main Schedule Visualization Section -->

    <!-- SKELETON SHIMMER LOADING CONTAINER -->
    <div
      v-if="isLoading"
      class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs overflow-hidden animate-pulse select-none"
    >
      <!-- Timetable Mode Skeleton -->
      <div v-if="viewMode === 'timetable'" class="overflow-x-auto">
        <table class="w-full border-collapse min-w-[800px]">
          <thead>
            <tr class="bg-surface/60 border-b border-gray-100">
              <th class="py-3 px-4 w-20 text-center border-r border-gray-100">
                <div class="h-3.5 bg-gray-200/80 rounded w-10 mx-auto" />
              </th>
              <th v-for="i in 5" :key="`sk-th-${i}`" class="py-3 px-4 border-r border-gray-100 last:border-0">
                <div class="flex items-center gap-2">
                  <div class="h-4 w-10 bg-emerald-100/70 rounded" />
                  <div class="h-3.5 w-24 bg-gray-200/80 rounded" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="r in 6" :key="`sk-tr-${r}`" class="h-20">
              <td class="py-2 px-3 border-r border-gray-100 bg-surface/20 text-center">
                <div class="h-3.5 w-10 bg-gray-200/80 rounded mx-auto" />
              </td>
              <td v-for="c in 5" :key="`sk-td-${r}-${c}`" class="p-2 border-r border-gray-100 last:border-0 align-top">
                <!-- Shimmering placeholder card -->
                <div v-if="(r + c) % 3 === 0" class="p-2.5 rounded-xl border border-gray-100 bg-gray-50/80 space-y-2">
                  <div class="flex justify-between items-center">
                    <div class="h-3 w-14 bg-gray-200/70 rounded" />
                    <div class="h-3 w-10 bg-gray-200/70 rounded" />
                  </div>
                  <div class="h-3.5 w-3/4 bg-gray-200/80 rounded" />
                  <div class="h-2.5 w-1/2 bg-gray-200/60 rounded" />
                </div>
                <div v-else class="h-full rounded-xl flex items-center justify-center opacity-40">
                  <div class="h-2 w-8 bg-gray-100 rounded" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- List Mode Skeleton -->
      <div v-else class="overflow-x-auto p-4 space-y-3">
        <div class="flex items-center justify-between pb-3 border-b border-gray-100">
          <div v-for="w in ['w-24', 'w-32', 'w-44', 'w-28', 'w-16', 'w-20', 'w-16']" :key="w" :class="['h-3 bg-gray-200/80 rounded', w]" />
        </div>
        <div v-for="i in 6" :key="`sk-list-${i}`" class="flex items-center justify-between py-3 border-b border-gray-50">
          <div class="space-y-1.5 w-24">
            <div class="h-3.5 bg-gray-200/80 rounded w-20" />
            <div class="h-2.5 bg-gray-100 rounded w-14" />
          </div>
          <div class="h-4 bg-gray-200/80 rounded w-32" />
          <div class="space-y-1.5 w-44">
            <div class="h-3.5 bg-gray-200/80 rounded w-36" />
            <div class="h-2.5 bg-gray-100 rounded w-20" />
          </div>
          <div class="h-3.5 bg-gray-200/80 rounded w-28" />
          <div class="h-4 bg-emerald-100/70 rounded w-16" />
          <div class="h-4 bg-gray-200/80 rounded w-20" />
          <div class="h-7 bg-brand-100/70 rounded-full w-16" />
        </div>
      </div>
    </div>

    <!-- MAIN DATA VISUALIZATION CONTAINER WITH TRANSITION -->
    <Transition v-else name="view-fade" mode="out-in">
      <!-- MODE 1: TIMETABLE ROOM-TIME MATRIX -->
      <div v-if="viewMode === 'timetable'" key="timetable" class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr class="bg-surface/60 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                <th class="py-3 px-4 w-20 text-center border-r border-gray-100">Waktu</th>
                <th
                  v-for="room in timetableRooms"
                  :key="room.id"
                  class="py-3 px-4 border-r border-gray-100 last:border-0"
                >
                  <div class="flex items-center gap-1.5">
                    <span class="font-mono text-dark-green font-bold text-[10px] bg-brand-100 px-1.5 py-0.5 rounded">
                      {{ room.code }}
                    </span>
                    <span class="font-bold text-text-primary">{{ room.name }}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 text-xs">
              <tr v-for="time in timeSlots" :key="time" class="h-20">
                <!-- Time Column -->
                <td class="py-2 px-3 font-mono font-bold text-text-muted text-center border-r border-gray-100 bg-surface/20 relative overflow-visible">
                  <span :class="isCurrentTimeSlot(time) ? 'text-rose-600 font-bold' : ''">{{ time }}</span>

                  <!-- "Now" Time Indicator Badge on Time Column -->
                  <div
                    v-if="isCurrentTimeSlot(time)"
                    class="absolute left-0 right-0 z-30 flex items-center justify-center pointer-events-none"
                    :style="{ top: `${currentMinutePercentage}%`, transform: 'translateY(-50%)' }"
                  >
                    <span class="bg-rose-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-rose-400">
                      <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                      <span>{{ nowJakartaTime.str }}</span>
                    </span>
                  </div>
                </td>

                <!-- Room Grid Cells -->
                <td
                  v-for="(room, rIdx) in timetableRooms"
                  :key="room.id"
                  class="py-1.5 px-2 border-r border-gray-100 last:border-0 align-top relative bg-white hover:bg-surface/30 transition-colors"
                >
                  <!-- "Now" Horizontal Red Indicator Line Across Room Cells -->
                  <div
                    v-if="isCurrentTimeSlot(time)"
                    class="absolute left-0 right-0 border-t-2 border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)] z-20 pointer-events-none"
                    :style="{ top: `${currentMinutePercentage}%` }"
                  >
                    <span
                      v-if="rIdx === timetableRooms.length - 1"
                      class="absolute right-1 -top-2.5 text-[8.5px] font-mono font-bold bg-rose-600 text-white px-1.5 py-0.5 rounded-full shadow-xs tracking-wide"
                    >
                      SEKARANG
                    </span>
                  </div>

                  <!-- 1. Start of Session -->
                  <div
                    v-if="getSlotOccupancy(room.id, time).type === 'START'"
                    @click="handleNavigateToSession(getSlotOccupancy(room.id, time).session!)"
                    @mouseenter="handleSessionMouseEnter(getSlotOccupancy(room.id, time).session!, $event)"
                    @mouseleave="handleSessionMouseLeave"
                    :class="[
                      'p-2.5 rounded-xl border-2 transition-all duration-150 cursor-pointer space-y-1 shadow-2xs group relative overflow-hidden',
                      getSlotOccupancy(room.id, time).session!.status === 'ACTIVE'
                        ? 'bg-gradient-to-r from-emerald-50 via-emerald-100/50 to-teal-50 border-emerald-500 ring-2 ring-emerald-400/40 text-dark-green shadow-md'
                        : getSlotOccupancy(room.id, time).session!.sourceType === 'SCHEDULE'
                          ? 'bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 border-emerald-300/90 text-dark-green hover:border-dark-green hover:shadow-md'
                          : 'bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 border-amber-300 text-amber-950 hover:border-amber-500 hover:shadow-md'
                    ]"
                  >
                    <!-- Accent Left Border -->
                    <div
                      :class="[
                        'absolute left-0 top-0 bottom-0 w-1',
                        getSlotOccupancy(room.id, time).session!.status === 'ACTIVE'
                          ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                          : getSlotOccupancy(room.id, time).session!.sourceType === 'SCHEDULE'
                            ? 'bg-emerald-600'
                            : 'bg-amber-500'
                      ]"
                    />

                    <div class="flex items-center justify-between gap-1 text-[10px] font-bold pl-1">
                      <span class="font-mono font-bold">{{ getSlotOccupancy(room.id, time).session!.startTime }}–{{ getSlotOccupancy(room.id, time).session!.endTime }}</span>
                      <div class="flex items-center gap-1">
                        <span
                          :class="[
                            'px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider',
                            getSlotOccupancy(room.id, time).session!.sourceType === 'SCHEDULE'
                              ? 'bg-emerald-100 text-[#0c5a30] border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          ]"
                        >
                          {{ getSlotOccupancy(room.id, time).session!.sourceType === 'SCHEDULE' ? 'Kuliah' : 'Pinjam' }}
                        </span>
                        <span
                          :class="[
                            'px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1',
                            getSlotOccupancy(room.id, time).session!.status === 'ACTIVE'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : getSlotOccupancy(room.id, time).session!.status === 'SCHEDULED'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-gray-200 text-gray-700'
                          ]"
                        >
                          <span v-if="getSlotOccupancy(room.id, time).session!.status === 'ACTIVE'" class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                          <span>{{
                            getSlotOccupancy(room.id, time).session!.status === 'ACTIVE'
                              ? 'Sedang Berjalan'
                              : getSlotOccupancy(room.id, time).session!.status === 'SCHEDULED'
                                ? 'Mendatang'
                                : 'Selesai'
                          }}</span>
                        </span>
                      </div>
                    </div>

                    <p class="font-bold text-xs text-text-primary line-clamp-1 group-hover:text-dark-green transition-colors pl-1">
                      {{ getSlotOccupancy(room.id, time).session!.courseName }}
                    </p>

                    <p class="text-[10.5px] text-text-muted font-medium truncate pl-1 flex items-center gap-1">
                      <span>{{ getSlotOccupancy(room.id, time).session!.lecturerName }}</span>
                      <span class="opacity-60">•</span>
                      <span class="font-bold text-dark-green">{{ getSlotOccupancy(room.id, time).session!.className }}</span>
                    </p>
                  </div>

                  <!-- 2. Spanning/Continuation Slot -->
                  <div
                    v-else-if="getSlotOccupancy(room.id, time).type === 'SPANNING'"
                    @click="handleNavigateToSession(getSlotOccupancy(room.id, time).session!)"
                    @mouseenter="handleSessionMouseEnter(getSlotOccupancy(room.id, time).session!, $event)"
                    @mouseleave="handleSessionMouseLeave"
                    :class="[
                      'h-full rounded-xl border border-dashed p-2 flex items-center justify-between gap-2 cursor-pointer transition-all group',
                      getSlotOccupancy(room.id, time).session!.status === 'ACTIVE'
                        ? 'border-emerald-400 bg-emerald-50/60 text-dark-green hover:bg-emerald-100/50 shadow-2xs'
                        : getSlotOccupancy(room.id, time).session!.sourceType === 'SCHEDULE'
                          ? 'border-emerald-300/80 bg-emerald-50/30 text-dark-green hover:bg-emerald-50/60'
                          : 'border-amber-300/80 bg-amber-50/30 text-amber-900 hover:bg-amber-50/60'
                    ]"
                  >
                    <div class="flex items-center gap-1.5 text-[10px] font-bold truncate">
                      <span
                        :class="[
                          'w-1.5 h-1.5 rounded-full shrink-0',
                          getSlotOccupancy(room.id, time).session!.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-dark-green/60'
                        ]"
                      />
                      <span class="truncate font-bold text-text-secondary group-hover:text-dark-green">
                        Lanjutan: {{ getSlotOccupancy(room.id, time).session!.courseName }}
                      </span>
                    </div>
                    <span class="font-mono text-[9px] font-bold opacity-80 shrink-0">
                      s.d. {{ getSlotOccupancy(room.id, time).session!.endTime }}
                    </span>
                  </div>

                  <!-- 3. Empty Slot -->
                  <div
                    v-else
                    class="h-full rounded-xl flex items-center justify-center text-[10px] text-gray-400/40 hover:text-dark-green hover:bg-emerald-50/40 transition-colors select-none group border border-transparent hover:border-emerald-200"
                    title="Ruangan tersedia pada jam ini"
                  >
                    <span class="text-[9px] font-mono tracking-wider opacity-30 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <span class="w-1 h-1 rounded-full bg-emerald-400 opacity-0 group-hover:opacity-100"></span>
                      <span>Tersedia</span>
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODE 2: OPERATIONAL TABLE LIST VIEW -->
      <div v-else key="list" class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface/50 border-b border-gray-100 text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
                <th class="py-3.5 px-4">Rentang Waktu</th>
                <th class="py-3.5 px-4">Laboratorium</th>
                <th class="py-3.5 px-4">Mata Kuliah / Kegiatan</th>
                <th class="py-3.5 px-4">Dosen / Pemohon</th>
                <th class="py-3.5 px-4">Tipe</th>
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
                    {{ item.startTime }} – {{ item.endTime }} WIB
                  </span>
                  <span class="text-[10px] text-text-muted font-medium block">
                    {{ selectedDateFormatted }}
                  </span>
                </td>

                <!-- Laboratory -->
                <td class="py-3.5 px-4 whitespace-nowrap">
                  <span class="px-1.5 py-0.5 rounded bg-gray-100 text-text-muted text-[10px] font-mono font-bold mr-1">
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

                <!-- Type -->
                <td class="py-3.5 px-4 whitespace-nowrap">
                  <span :class="['px-2 py-0.5 rounded-full text-[10px] font-bold border', item.typeBadgeClass]">
                    {{ item.typeLabel }}
                  </span>
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
                    @click="handleNavigateToSession(item)"
                    class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-100/70 hover:bg-dark-green text-dark-green hover:text-white font-bold text-xs transition-colors cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <Eye :size="13" />
                    <span>Lihat</span>
                  </button>
                </td>
              </tr>

              <!-- Empty State: Filter or Zero Sched -->
              <tr v-if="filteredSchedules.length === 0 && (searchQuery || selectedStatusFilter !== 'ALL' || selectedLabFilter !== 'ALL')">
                <td colspan="7" class="py-14 text-center space-y-3">
                  <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto ring-6 ring-amber-100/50 shadow-2xs">
                    <Search :size="22" stroke-width="2.2" />
                  </div>
                  <div class="space-y-1">
                    <h4 class="text-xs font-bold text-text-primary">Tidak Ada Jadwal yang Cocok</h4>
                    <p class="text-[11px] text-text-muted max-w-sm mx-auto">
                      Tidak ditemukan jadwal yang sesuai dengan filter atau kata kunci
                      <span v-if="searchQuery" class="font-bold text-dark-green">"{{ searchQuery }}"</span>.
                    </p>
                  </div>
                  <div class="pt-1">
                    <button
                      @click="resetFilters"
                      class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-surface hover:bg-white text-xs font-bold text-dark-green shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      <RotateCcw :size="12" />
                      <span>Reset Semua Filter</span>
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-else-if="filteredSchedules.length === 0">
                <td colspan="7" class="py-14 text-center space-y-3">
                  <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-dark-green flex items-center justify-center mx-auto ring-6 ring-emerald-100/50 shadow-2xs">
                    <CalendarDays :size="22" stroke-width="2.2" />
                  </div>
                  <div class="space-y-1">
                    <h4 class="text-xs font-bold text-text-primary">Tidak Ada Sesi Laboratorium</h4>
                    <p class="text-[11px] text-text-muted max-w-sm mx-auto">
                      Seluruh laboratorium dalam status bebas digunakan pada {{ selectedDateFormatted }}.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Transition>

    <!-- Teleported Floating Quick-Preview Popover Card (Micro-Interaction) -->
    <teleport to="body">
      <div
        v-if="hoveredSession"
        @mouseenter="handlePopoverMouseEnter"
        @mouseleave="handlePopoverMouseLeave"
        class="fixed z-50 w-80 p-4 rounded-2xl bg-white border-2 border-emerald-400/80 shadow-2xl space-y-3 pointer-events-auto transition-all animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
        :style="{
          top: `${popoverPosition.y}px`,
          left: `${popoverPosition.x}px`
        }"
      >
        <!-- Popover Header -->
        <div class="flex items-start justify-between gap-2 border-b border-gray-100 pb-2.5">
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-dark-green text-white shadow-2xs">
                {{ hoveredSession.laboratoryCode }}
              </span>
              <span
                :class="[
                  'px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border',
                  hoveredSession.sourceType === 'SCHEDULE'
                    ? 'bg-emerald-50 text-dark-green border-emerald-300'
                    : 'bg-amber-50 text-amber-900 border-amber-300'
                ]"
              >
                {{ hoveredSession.typeLabel }}
              </span>
            </div>
            <h4 class="font-bold text-sm text-gray-900 mt-1.5 line-clamp-1">
              {{ hoveredSession.courseName }}
            </h4>
          </div>

          <span
            :class="[
              'px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 border flex items-center gap-1',
              hoveredSession.status === 'ACTIVE'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                : hoveredSession.status === 'SCHEDULED'
                  ? 'bg-sky-100 text-sky-800 border-sky-200'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
            ]"
          >
            <span v-if="hoveredSession.status === 'ACTIVE'" class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
            <span>{{
              hoveredSession.status === 'ACTIVE'
                ? 'Sedang Berjalan'
                : hoveredSession.status === 'SCHEDULED'
                  ? 'Mendatang'
                  : 'Selesai'
            }}</span>
          </span>
        </div>

        <!-- Popover Details Body -->
        <div class="space-y-2 text-xs">
          <div class="flex items-center justify-between text-gray-600">
            <span class="flex items-center gap-1.5 font-medium">
              <Clock :size="13" class="text-dark-green" />
              <span>Waktu Sesi:</span>
            </span>
            <span class="font-mono font-bold text-dark-green">
              {{ hoveredSession.startTime }} – {{ hoveredSession.endTime }} WIB
            </span>
          </div>

          <div class="flex items-center justify-between text-gray-600">
            <span class="flex items-center gap-1.5 font-medium">
              <Timer :size="13" class="text-amber-600" />
              <span>Total Durasi:</span>
            </span>
            <span class="font-bold text-gray-800">
              {{ getSessionDuration(hoveredSession.startTime, hoveredSession.endTime) }}
            </span>
          </div>

          <div class="flex items-center justify-between text-gray-600">
            <span class="flex items-center gap-1.5 font-medium">
              <Building2 :size="13" class="text-dark-green" />
              <span>Ruangan:</span>
            </span>
            <span class="font-bold text-gray-800 truncate max-w-[170px]">
              {{ hoveredSession.laboratoryName }}
            </span>
          </div>

          <div class="flex items-center justify-between text-gray-600">
            <span class="flex items-center gap-1.5 font-medium">
              <BookOpen :size="13" class="text-emerald-700" />
              <span>{{ hoveredSession.sourceType === 'SCHEDULE' ? 'Dosen' : 'Pemohon' }}:</span>
            </span>
            <span class="font-bold text-gray-900 truncate max-w-[160px]">
              {{ hoveredSession.lecturerName }} ({{ hoveredSession.className }})
            </span>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="pt-2.5 border-t border-gray-100 flex items-center gap-2">
          <button
            @click="handleNavigateToSession(hoveredSession)"
            class="flex-1 py-1.5 px-3 rounded-xl bg-dark-green hover:bg-[#082b17] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            <Eye :size="13" />
            <span>Lihat Rincian</span>
          </button>
          <button
            @click="navigateToRoomUsage"
            class="py-1.5 px-3 rounded-xl border border-gray-200 hover:bg-surface text-gray-700 font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer active:scale-95"
            title="Buka Log Pemakaian"
          >
            <DoorOpen :size="13" class="text-dark-green" />
            <span>Log Ruang</span>
          </button>
        </div>
      </div>
    </teleport>

  </div>
</template>

<style scoped>
.view-fade-enter-active,
.view-fade-leave-active {
  transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.view-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.view-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
