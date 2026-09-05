<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { io, Socket } from 'socket.io-client'
import {
  Calendar,
  Users,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Megaphone,
  Maximize2,
  Minimize2,
  WifiOff,
  Clock,
  MapPin,
  Monitor,
  BookOpen,
  ShieldCheck,
  Activity,
  Wifi,
  Moon,
  Sun,
} from 'lucide-vue-next'
import {
  displayService,
  type PublicDisplayResponseDto,
  type DisplayLaboratoryDto,
  type DisplayScheduleDto,
  type DisplayRoomRequestDto,
} from '@/services/display.service'
import { formatTime } from '@/utils/format.utils'

// Reactive state
const now = ref(new Date())
const displayData = ref<PublicDisplayResponseDto | null>(null)
const isLoading = ref(true)
const isSocketConnected = ref(false)
const isFullscreen = ref(false)
const isDarkMode = ref(false)
let socket: Socket | null = null
let clockTimer: number | null = null
let pollTimer: number | null = null

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  try {
    localStorage.setItem('display_theme', isDarkMode.value ? 'dark' : 'light')
  } catch (err) {
    console.warn('LocalStorage access warning:', err)
  }
}

// Fetch display data
const fetchDisplayData = async () => {
  try {
    const data = await displayService.getDisplayData()
    displayData.value = data
  } catch (err) {
    console.error('Failed to fetch display data:', err)
  } finally {
    isLoading.value = false
  }
}

// Indonesian WIB Date & Time
const formattedTime = computed(() => {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now.value)
})

const formattedDate = computed(() => {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now.value)
})

// Extract HH:mm safely
function extractTimeString(dateValue: string | Date | undefined | null): string {
  if (!dateValue) return '--:--'
  if (typeof dateValue === 'string') {
    if (dateValue.includes('T')) {
      const d = new Date(dateValue)
      const h = d.getUTCHours().toString().padStart(2, '0')
      const m = d.getUTCMinutes().toString().padStart(2, '0')
      return `${h}:${m}`
    } else if (dateValue.includes(':')) {
      return dateValue.substring(0, 5)
    }
  }
  const d = new Date(dateValue)
  const h = d.getUTCHours().toString().padStart(2, '0')
  const m = d.getUTCMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

function parseTimeToMinutes(timeValue: string | Date | undefined | null): number {
  const timeFormatted = extractTimeString(timeValue)
  const parts = timeFormatted.split(':')
  const h = parts[0] !== undefined ? parseInt(parts[0], 10) : 0
  const m = parts[1] !== undefined ? parseInt(parts[1], 10) : 0
  if (isNaN(h) || isNaN(m)) return 0
  return h * 60 + m
}

// Progress percentage calculation
const computeProgress = (startTime: string, endTime: string): number => {
  try {
    const startMin = parseTimeToMinutes(startTime)
    const endMin = parseTimeToMinutes(endTime)
    const currentMin = now.value.getHours() * 60 + now.value.getMinutes()
    if (endMin <= startMin) return 5
    if (currentMin <= startMin) return 5
    if (currentMin >= endMin) return 100
    return Math.round(((currentMin - startMin) / (endMin - startMin)) * 100)
  } catch {
    return 50
  }
}

// Remaining minutes calculation
const computeRemainingMinutes = (endTime: string): number => {
  try {
    const endMin = parseTimeToMinutes(endTime)
    const currentMin = now.value.getHours() * 60 + now.value.getMinutes()
    return Math.max(0, endMin - currentMin)
  } catch {
    return 30
  }
}

export interface FormattedLiveSession {
  id: string
  labId: string
  labName: string
  labCode: string
  location: string
  courseName: string
  courseCode: string
  instructor: string
  timeWindow: string
  startTime: string
  endTime: string
  progressPercentage: number
  remainingMinutes: number
  status: 'IN_USE' | 'UPCOMING' | 'AVAILABLE' | 'MAINTENANCE'
  capacity: number
  occupancy: number
}

// Computed: Build live lab sessions list combining laboratories, usages, schedules, and requests
const liveLabSessions = computed<FormattedLiveSession[]>(() => {
  if (!displayData.value || !displayData.value.laboratories) {
    return []
  }

  const currentMinutes = now.value.getHours() * 60 + now.value.getMinutes()
  const { laboratories, schedules, room_requests, room_usage } = displayData.value

  return laboratories.map((lab: DisplayLaboratoryDto) => {
    // 1. Check for active RoomUsage
    const activeUsage = room_usage?.find(
      (u) =>
        (u.request?.laboratory.id === lab.id || u.schedule?.laboratory.id === lab.id) &&
        (u.status === 'CHECKED_IN' || u.status === 'IN_USE'),
    )

    // 2. Check for matching ongoing schedule
    const ongoingSchedule = schedules?.find((s: DisplayScheduleDto) => {
      if (s.laboratory?.id !== lab.id || s.status === 'CANCELLED') return false
      const startMin = parseTimeToMinutes(s.start_time)
      const endMin = parseTimeToMinutes(s.end_time)
      return currentMinutes >= startMin && currentMinutes < endMin
    })

    // 3. Check for matching ongoing approved room request
    const ongoingRequest = room_requests?.find((r: DisplayRoomRequestDto) => {
      if (r.laboratory?.id !== lab.id) return false
      const startMin = parseTimeToMinutes(r.start_time)
      const endMin = parseTimeToMinutes(r.end_time)
      return currentMinutes >= startMin && currentMinutes < endMin
    })

    // If laboratory is in maintenance or closed
    if (lab.status === 'MAINTENANCE' || lab.status === 'CLOSED') {
      return {
        id: lab.id,
        labId: lab.id,
        labName: lab.name,
        labCode: lab.code,
        location: lab.location,
        courseName: 'Facility Maintenance & Diagnostics',
        courseCode: 'MAINT-01',
        instructor: 'Laboratory Technician',
        timeWindow: 'Under Maintenance',
        startTime: '08:00',
        endTime: '17:00',
        progressPercentage: 0,
        remainingMinutes: 0,
        status: 'MAINTENANCE',
        capacity: lab.maximum_capacity,
        occupancy: 0,
      }
    }

    // Active session found (RoomUsage, ongoing schedule, or ongoing request)
    if (activeUsage || ongoingSchedule || ongoingRequest || lab.status === 'IN_USE') {
      const startTimeStr = extractTimeString(
        ongoingSchedule?.start_time ||
          ongoingRequest?.start_time ||
          activeUsage?.check_in_time ||
          '08:00',
      )
      const endTimeStr = extractTimeString(
        ongoingSchedule?.end_time || ongoingRequest?.end_time || '10:00',
      )

      const courseName =
        ongoingSchedule?.course_name ||
        ongoingRequest?.activity_name ||
        activeUsage?.schedule?.course_name ||
        activeUsage?.request?.activity_name ||
        'Active Practicum Session'

      const courseCode =
        ongoingSchedule?.class_name ||
        ongoingRequest?.course_name ||
        ongoingRequest?.class_name ||
        'REG-01'

      const instructor =
        ongoingSchedule?.lecturer_name ||
        ongoingRequest?.applicant?.full_name ||
        activeUsage?.checkedInBy?.full_name ||
        'Faculty Lecturer'

      const occupancy =
        ongoingRequest?.participant_count ||
        Math.min(lab.maximum_capacity, Math.max(1, Math.round(lab.maximum_capacity * 0.85)))

      return {
        id: lab.id,
        labId: lab.id,
        labName: lab.name,
        labCode: lab.code,
        location: lab.location,
        courseName,
        courseCode,
        instructor,
        timeWindow: `${startTimeStr} – ${endTimeStr} WIB`,
        startTime: startTimeStr,
        endTime: endTimeStr,
        progressPercentage: computeProgress(startTimeStr, endTimeStr),
        remainingMinutes: computeRemainingMinutes(endTimeStr),
        status: 'IN_USE',
        capacity: lab.maximum_capacity,
        occupancy,
      }
    }

    // Check for next upcoming schedule or request later today
    const upcomingSchedule = schedules?.find((s: DisplayScheduleDto) => {
      if (s.laboratory?.id !== lab.id || s.status === 'CANCELLED') return false
      const startMin = parseTimeToMinutes(s.start_time)
      return startMin > currentMinutes
    })

    const upcomingRequest = room_requests?.find((r: DisplayRoomRequestDto) => {
      if (r.laboratory?.id !== lab.id) return false
      const startMin = parseTimeToMinutes(r.start_time)
      return startMin > currentMinutes
    })

    if (upcomingSchedule || upcomingRequest) {
      const startTimeStr = extractTimeString(
        upcomingSchedule?.start_time || upcomingRequest?.start_time,
      )
      const endTimeStr = extractTimeString(upcomingSchedule?.end_time || upcomingRequest?.end_time)
      const courseName =
        upcomingSchedule?.course_name || upcomingRequest?.activity_name || 'Praktikum Mendatang'
      const courseCode =
        upcomingSchedule?.class_name || upcomingRequest?.course_name || 'MENDATANG'
      const instructor =
        upcomingSchedule?.lecturer_name ||
        upcomingRequest?.applicant?.full_name ||
        'Dosen Pengajar'

      return {
        id: lab.id,
        labId: lab.id,
        labName: lab.name,
        labCode: lab.code,
        location: lab.location,
        courseName,
        courseCode,
        instructor,
        timeWindow: `${startTimeStr} – ${endTimeStr} WIB`,
        startTime: startTimeStr,
        endTime: endTimeStr,
        progressPercentage: 0,
        remainingMinutes: 0,
        status: 'UPCOMING',
        capacity: lab.maximum_capacity,
        occupancy: 0,
      }
    }

    // Default: Laboratory is available
    return {
      id: lab.id,
      labId: lab.id,
      labName: lab.name,
      labCode: lab.code,
      location: lab.location,
      courseName: 'Terbuka untuk Praktikum & Belajar Mandiri',
      courseCode: 'TERSEDIA',
      instructor: 'Tersedia untuk Reservasi',
      timeWindow: 'Tersedia untuk reservasi',
      startTime: '08:00',
      endTime: '17:00',
      progressPercentage: 0,
      remainingMinutes: 0,
      status: 'AVAILABLE',
      capacity: lab.maximum_capacity,
      occupancy: 0,
    }
  })
})

interface StreamItem {
  id: string
  title: string
  subtitle: string
  roomCode: string
  roomName: string
  startTime: string | Date
  endTime: string | Date
  type: 'SCHEDULE' | 'REQUEST'
}

const todayTimetableStream = computed<StreamItem[]>(() => {
  const stream: StreamItem[] = []
  // 1. Add recurring schedules
  if (displayData.value?.schedules) {
    displayData.value.schedules.forEach((s) => {
      stream.push({
        id: s.id,
        title: s.course_name,
        subtitle: `Dosen: ${s.lecturer_name || s.class_name || 'Dosen Pengajar'}`,
        roomCode: s.laboratory?.code || 'LAB',
        roomName: s.laboratory?.name || 'Laboratorium',
        startTime: s.start_time,
        endTime: s.end_time,
        type: 'SCHEDULE',
      })
    })
  }
  // 2. Add approved room requests for today
  if (displayData.value?.room_requests) {
    displayData.value.room_requests.forEach((r) => {
      stream.push({
        id: r.id,
        title: r.activity_name,
        subtitle: `Dosen: ${r.applicant?.full_name || 'Dosen Pengajar'}`,
        roomCode: r.laboratory?.code || 'LAB',
        roomName: r.laboratory?.name || 'Laboratorium',
        startTime: r.start_time,
        endTime: r.end_time,
        type: 'REQUEST',
      })
    })
  }
  // Sort chronologically by start time
  return stream.sort((a, b) => {
    const timeA = extractTimeString(a.startTime)
    const timeB = extractTimeString(b.startTime)
    return timeA.localeCompare(timeB)
  })
})

// Fullscreen toggle
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement
      .requestFullscreen()
      .then(() => {
        isFullscreen.value = true
      })
      .catch(() => {})
  } else {
    document
      .exitFullscreen()
      .then(() => {
        isFullscreen.value = false
      })
      .catch(() => {})
  }
}

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

// Computed: Active marquee announcement text
const activeAnnouncementText = computed(() => {
  const announcements = displayData.value?.announcements
  if (announcements && announcements.length > 0) {
    return announcements.map((a) => `• ${a.title.toUpperCase()}: ${a.content}`).join('     ')
  }
  return '• Seluruh mahasiswa dan dosen wajib mematuhi tata tertib penggunaan laboratorium FIK UPNVJ. • Matikan seluruh unit komputer dan pendingin ruangan setelah sesi praktikum selesai. • Pengajuan peminjaman ruangan wajib dilakukan minimal 24 jam sebelum kegiatan.'
})

onMounted(() => {
  // Load dark mode preference
  try {
    const savedTheme = localStorage.getItem('display_theme')
    if (savedTheme) {
      isDarkMode.value = savedTheme === 'dark'
    }
  } catch {}

  fetchDisplayData()

  // 1-second live clock ticker
  clockTimer = window.setInterval(() => {
    now.value = new Date()
  }, 1000)

  // WebSocket Live Instant Connection
  try {
    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000'
    socket = io(wsUrl, { transports: ['websocket', 'polling'] })
    socket.on('connect', () => {
      isSocketConnected.value = true
    })
    socket.on('disconnect', () => {
      isSocketConnected.value = false
    })
    socket.on('display:sync', () => {
      fetchDisplayData()
    })
  } catch (err) {
    console.warn('WebSocket init warning:', err)
  }

  // Fullscreen change listener
  document.addEventListener('fullscreenchange', handleFullscreenChange)

  // Fallback 60s background heartbeat
  pollTimer = window.setInterval(fetchDisplayData, 60000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
  if (pollTimer) clearInterval(pollTimer)
  if (socket) socket.disconnect()
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
</script>

<template>
  <div
    :class="[
      'min-h-screen h-screen w-screen overflow-hidden select-none flex flex-col justify-between p-3.5 sm:p-4 lg:p-4.5 font-sans relative transition-colors duration-300',
      isDarkMode ? 'dark-display bg-[#060b08] text-[#86efac]' : 'bg-[#F6F9F8] text-text-primary'
    ]"
  >
    <!-- Background Ambient Lighting Grid -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <div
        :class="[
          'absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-3xl transition-all duration-700',
          isDarkMode ? 'bg-emerald-500/[0.12]' : 'bg-emerald-600/[0.04]'
        ]"
      ></div>
      <div
        :class="[
          'absolute top-1/2 -right-40 w-[600px] h-[600px] rounded-full blur-3xl transition-all duration-700',
          isDarkMode ? 'bg-teal-500/[0.10]' : 'bg-brand-500/[0.03]'
        ]"
      ></div>
      <div
        :class="[
          'absolute -bottom-40 left-1/3 w-[500px] h-[500px] rounded-full blur-3xl transition-all duration-700',
          isDarkMode ? 'bg-emerald-400/[0.08]' : 'bg-amber-400/[0.03]'
        ]"
      ></div>
      <div
        :class="[
          'absolute inset-0 [background-size:24px_24px] transition-all duration-700',
          isDarkMode
            ? 'bg-[radial-gradient(#22c55e_1px,transparent_1px)] opacity-[0.10]'
            : 'bg-[radial-gradient(#0c5a30_1px,transparent_1px)] opacity-[0.03]'
        ]"
      ></div>
    </div>

    <!-- 1. COMMAND CENTER HEADER -->
    <header
      :class="[
        'flex items-center justify-between px-5 sm:px-6 py-3 rounded-2xl backdrop-blur-md shrink-0 relative overflow-hidden z-10 transition-colors duration-300 shadow-sm',
        isDarkMode
          ? 'bg-[#0d1f17] border-2 border-emerald-600/50 shadow-black/50 shadow-lg'
          : 'bg-white/95 border border-gray-200/90 shadow-2xs'
      ]"
    >
      <!-- Institutional Accent Top Line -->
      <div
        :class="[
          'absolute top-0 left-0 right-0 h-[3.5px]',
          isDarkMode
            ? 'bg-gradient-to-r from-emerald-500 via-green-300 to-emerald-500 shadow-[0_0_10px_rgba(74,222,128,0.5)]'
            : 'bg-gradient-to-r from-[#0c5a30] via-amber-400 to-[#0c5a30]'
        ]"
      />

      <!-- Left Branding -->
      <div class="flex items-center gap-3.5">
        <div
          :class="[
            'w-12 h-12 shrink-0 flex items-center justify-center p-1 rounded-xl shadow-2xs transition-colors duration-300',
            isDarkMode ? 'bg-[#132c1f] border-2 border-emerald-500/60 shadow-md' : 'bg-white border border-gray-200/90'
          ]"
        >
          <img
            src="/images/logo-upnvj.webp"
            alt="UPNVJ Logo"
            class="w-full h-full object-contain"
          />
        </div>
        <div>
          <div class="flex items-center gap-2.5">
            <h1
              :class="[
                'text-xl sm:text-2xl font-black tracking-tight',
                isDarkMode ? 'text-white drop-shadow-sm' : 'text-text-primary'
              ]"
            >
              Lab<span :class="isDarkMode ? 'text-[#4ade80] drop-shadow-[0_0_14px_rgba(74,222,128,0.6)] font-black' : 'text-dark-green'">Display</span>
            </h1>
            <span
              :class="[
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider transition-colors duration-300',
                isDarkMode
                  ? 'bg-emerald-500/20 text-[#4ade80] border-2 border-emerald-400/80 shadow-[0_0_12px_rgba(74,222,128,0.25)]'
                  : 'bg-emerald-50 text-dark-green border border-emerald-200/80 shadow-2xs'
              ]"
            >
              <span class="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
              <span>MONITOR REAL-TIME</span>
            </span>
          </div>
          <p
            :class="[
              'text-[11px] font-bold tracking-wide mt-0.5',
              isDarkMode ? 'text-[#86efac]' : 'text-text-muted'
            ]"
          >
            FAKULTAS ILMU KOMPUTER • UPN "VETERAN" JAKARTA
          </p>
        </div>
      </div>

      <!-- Right: Real-time WIB Clock & Controls -->
      <div class="flex items-center gap-3 sm:gap-4">
        <!-- Date & Clock Box -->
        <div
          :class="[
            'flex items-center gap-3.5 px-4 py-1.5 rounded-xl transition-colors duration-300',
            isDarkMode
              ? 'bg-[#122b1f] border-2 border-emerald-500/60 shadow-md'
              : 'bg-surface/80 border border-gray-200/80 shadow-2xs'
          ]"
        >
          <div
            :class="[
              'text-right pr-3.5 hidden sm:block border-r',
              isDarkMode ? 'border-emerald-600/60' : 'border-gray-200/80'
            ]"
          >
            <div
              :class="[
                'flex items-center gap-1.5 text-xs font-bold capitalize justify-end',
                isDarkMode ? 'text-[#a7f3d0]' : 'text-text-secondary'
              ]"
            >
              <Calendar :size="12" :class="isDarkMode ? 'text-[#4ade80]' : 'text-dark-green'" class="shrink-0" />
              <span>{{ formattedDate }}</span>
            </div>
            <div :class="['text-[10px] font-semibold', isDarkMode ? 'text-[#86efac]' : 'text-text-muted']">
              Tahun Akademik Aktif
            </div>
          </div>
          <div
            :class="[
              'flex items-center justify-end gap-1.5 text-2xl sm:text-3xl font-black font-mono tracking-tight leading-none',
              isDarkMode
                ? 'text-[#4ade80] drop-shadow-[0_0_12px_rgba(74,222,128,0.5)]'
                : 'text-text-primary'
            ]"
          >
            <span>{{ formattedTime }}</span>
            <span
              :class="[
                'px-1.5 py-0.5 rounded-md text-[10px] font-black font-sans border',
                isDarkMode
                  ? 'bg-emerald-500/25 text-[#4ade80] border-emerald-400/60 shadow-xs'
                  : 'bg-brand-100 text-dark-green border-transparent shadow-2xs'
              ]"
            >
              WIB
            </span>
          </div>
        </div>

        <!-- Live Sync Status Pill -->
        <div
          :class="[
            'flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 text-xs font-black shadow-2xs transition-all',
            isDarkMode
              ? isSocketConnected
                ? 'bg-[#122b1f] border-emerald-500 text-[#4ade80] shadow-[0_0_12px_rgba(74,222,128,0.25)]'
                : 'bg-[#16251d] border-emerald-800 text-emerald-600'
              : isSocketConnected
                ? 'bg-emerald-50/90 border-emerald-200 text-dark-green'
                : 'bg-gray-100 border-gray-200 text-text-muted',
          ]"
        >
          <span v-if="isSocketConnected" class="relative flex h-2 w-2">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
            ></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <WifiOff v-else :size="13" />
          <span class="tracking-wide">{{ isSocketConnected ? 'SINKRONISASI AKTIF' : 'MODE BERKALA' }}</span>
        </div>

        <!-- Dark Mode Toggle Button -->
        <button
          @click="toggleDarkMode"
          :class="[
            'p-2.5 rounded-xl border-2 transition-all shadow-2xs cursor-pointer active:scale-95 flex items-center justify-center',
            isDarkMode
              ? 'bg-[#122b1f] border-emerald-500 text-[#4ade80] hover:text-white hover:bg-emerald-700 shadow-[0_0_14px_rgba(74,222,128,0.3)]'
              : 'bg-white border-gray-200/80 text-text-secondary hover:text-dark-green hover:bg-brand-50 hover:border-dark-green'
          ]"
          :title="isDarkMode ? 'Beralih ke Tampilan Terang' : 'Beralih ke Tampilan Gelap (Kontras Tinggi)'"
          aria-label="Toggle Dark Mode"
        >
          <Sun v-if="isDarkMode" :size="17" class="text-amber-300 animate-spin-slow" />
          <Moon v-else :size="17" />
        </button>

        <!-- Fullscreen Button -->
        <button
          @click="toggleFullscreen"
          :class="[
            'p-2.5 rounded-xl border-2 transition-all shadow-2xs cursor-pointer active:scale-95 flex items-center justify-center',
            isDarkMode
              ? 'bg-[#122b1f] border-emerald-500 text-[#4ade80] hover:text-white hover:bg-emerald-700'
              : 'bg-white border-gray-200/80 text-text-secondary hover:text-dark-green hover:bg-brand-50 hover:border-dark-green'
          ]"
          title="Beralih ke Layar Penuh (Mode TV)"
          aria-label="Toggle Fullscreen"
        >
          <Minimize2 v-if="isFullscreen" :size="17" />
          <Maximize2 v-else :size="17" />
        </button>
      </div>
    </header>

    <!-- 2. MAIN 2-COLUMN DISPLAY BODY -->
    <main class="grid grid-cols-1 lg:grid-cols-12 gap-4 my-2.5 flex-1 overflow-hidden relative z-10 min-h-0">
      <!-- LEFT: LIVE OCCUPANCY MATRIX (8 COLS) -->
      <div class="lg:col-span-8 flex flex-col justify-between gap-2 overflow-hidden h-full">
        <!-- Section Bar -->
        <div class="flex items-center justify-between px-1">
          <div class="flex items-center gap-2.5">
            <div
              :class="[
                'w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-300',
                isDarkMode
                  ? 'bg-[#122b1f] border-2 border-emerald-500 text-[#4ade80] shadow-[0_0_12px_rgba(74,222,128,0.3)]'
                  : 'bg-brand-100 text-dark-green shadow-2xs'
              ]"
            >
              <Radio :size="14" class="animate-pulse" />
            </div>
            <div>
              <h2
                :class="[
                  'text-xs font-black tracking-wider uppercase',
                  isDarkMode ? 'text-white' : 'text-text-primary'
                ]"
              >
                Status & Pemakaian Laboratorium Saat Ini
              </h2>
              <p :class="['text-[10px] font-semibold', isDarkMode ? 'text-[#86efac]' : 'text-text-muted']">
                Pantauan langsung ketersediaan unit komputer & sesi praktikum
              </p>
            </div>
          </div>
          <span
            :class="[
              'text-[10.5px] font-black px-3 py-0.5 rounded-full border-2 transition-colors duration-300',
              isDarkMode
                ? 'text-[#4ade80] bg-[#122b1f] border-emerald-500/70 shadow-xs'
                : 'text-dark-green bg-brand-100 border-brand-200/80 shadow-2xs'
            ]"
          >
            {{ displayData?.laboratories?.length || 0 }} RUANG LAB TERPANTAU
          </span>
        </div>

        <!-- Grid of Rooms with Sleek Scrollbar -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 overflow-y-auto pr-1.5 custom-scrollbar min-h-0 pb-0.5">
          <div
            v-for="session in liveLabSessions"
            :key="session.id"
            :class="[
              'rounded-2xl border-2 p-4 shadow-sm transition-all duration-300 flex flex-col justify-between relative overflow-hidden',
              isDarkMode
                ? session.status === 'IN_USE'
                  ? 'bg-[#102a1e] border-emerald-400 ring-2 ring-emerald-400/30 shadow-[0_0_25px_rgba(74,222,128,0.2)]'
                  : 'bg-[#0d1f17] border-emerald-600/50 hover:border-emerald-400 shadow-md'
                : session.status === 'IN_USE'
                  ? 'bg-white border-emerald-300/90 ring-2 ring-emerald-500/15 shadow-sm'
                  : 'bg-white border-gray-200/90 hover:border-brand-300 shadow-2xs',
            ]"
          >
            <!-- Top Status Accent Gradient Bar -->
            <div
              :class="[
                'absolute top-0 left-0 right-0 h-[3.5px]',
                session.status === 'IN_USE'
                  ? 'bg-gradient-to-r from-emerald-500 via-green-300 to-emerald-500 shadow-[0_0_10px_rgba(74,222,128,0.6)]'
                  : session.status === 'AVAILABLE'
                    ? isDarkMode
                      ? 'bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.4)]'
                      : 'bg-gradient-to-r from-[#0c5a30]/50 via-emerald-400/40 to-teal-400/30'
                    : session.status === 'UPCOMING'
                      ? 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500'
                      : 'bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400'
              ]"
            />

            <!-- Card Header -->
            <div
              :class="[
                'flex items-start justify-between gap-3 border-b pb-2.5 transition-colors duration-300',
                isDarkMode ? 'border-emerald-700/60' : 'border-gray-100'
              ]"
            >
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded-lg font-mono text-xs font-black shrink-0 transition-colors duration-300',
                      isDarkMode
                        ? 'bg-emerald-500/25 text-[#4ade80] border border-emerald-400/70 shadow-xs'
                        : 'bg-brand-100 text-dark-green border border-brand-200/60 shadow-2xs'
                    ]"
                  >
                    {{ session.labCode }}
                  </span>
                  <h3
                    :class="[
                      'font-black text-sm sm:text-base truncate',
                      isDarkMode ? 'text-white drop-shadow-xs' : 'text-text-primary'
                    ]"
                  >
                    {{ session.labName }}
                  </h3>
                </div>
                <div
                  :class="[
                    'flex items-center gap-1.5 text-[11px] mt-1 font-bold truncate',
                    isDarkMode ? 'text-[#86efac]' : 'text-text-muted font-semibold'
                  ]"
                >
                  <MapPin :size="12" :class="isDarkMode ? 'text-[#4ade80]' : 'text-dark-green'" class="shrink-0" />
                  <span class="truncate">{{ session.location }}</span>
                </div>
              </div>

              <!-- Status Badge -->
              <span
                :class="[
                  'px-3 py-1 rounded-full text-[10.5px] font-black border-2 shrink-0 flex items-center gap-1.5 transition-colors duration-300 shadow-xs',
                  isDarkMode
                    ? session.status === 'IN_USE'
                      ? 'bg-emerald-500/25 border-emerald-400 text-[#4ade80] shadow-[0_0_12px_rgba(74,222,128,0.3)]'
                      : session.status === 'AVAILABLE'
                        ? 'bg-teal-500/25 border-teal-400 text-[#5eead4] shadow-[0_0_12px_rgba(45,212,191,0.25)]'
                        : session.status === 'UPCOMING'
                          ? 'bg-sky-500/25 border-sky-400 text-[#7dd3fc] shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                          : 'bg-amber-500/25 border-amber-400 text-[#fcd34d] shadow-[0_0_12px_rgba(251,191,36,0.25)]'
                    : session.status === 'IN_USE'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : session.status === 'AVAILABLE'
                        ? 'bg-teal-50 border-teal-200 text-teal-800 font-extrabold'
                        : session.status === 'UPCOMING'
                          ? 'bg-sky-50 border-sky-200 text-sky-800 font-extrabold'
                          : 'bg-amber-50 border-amber-200 text-amber-800 font-extrabold',
                ]"
              >
                <span
                  v-if="session.status === 'IN_USE'"
                  class="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse shrink-0 shadow-[0_0_6px_rgba(74,222,128,0.8)]"
                ></span>
                <span
                  v-else-if="session.status === 'AVAILABLE'"
                  class="w-2 h-2 rounded-full bg-[#2dd4bf] shrink-0 shadow-[0_0_6px_rgba(45,212,191,0.8)]"
                ></span>
                <span
                  v-else-if="session.status === 'UPCOMING'"
                  class="w-2 h-2 rounded-full bg-[#38bdf8] shrink-0"
                ></span>
                <span
                  v-else
                  class="w-2 h-2 rounded-full bg-[#fbbf24] shrink-0"
                ></span>
                <span>{{
                  session.status === 'IN_USE'
                    ? 'SEDANG DIPAKAI'
                    : session.status === 'AVAILABLE'
                      ? 'TERSEDIA'
                      : session.status === 'UPCOMING'
                        ? 'SESI BERIKUTNYA'
                        : 'PEMELIHARAAN'
                }}</span>
              </span>
            </div>

            <!-- Card Body: Current Session Info -->
            <div class="py-3 space-y-2.5">
              <!-- STATE: IN_USE -->
              <div v-if="session.status === 'IN_USE'" class="space-y-2">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2 min-w-0">
                    <BookOpen :size="14" :class="isDarkMode ? 'text-[#4ade80]' : 'text-emerald-700'" class="shrink-0" />
                    <h4
                      :class="[
                        'text-xs sm:text-[13px] font-black truncate',
                        isDarkMode ? 'text-white' : 'text-text-primary'
                      ]"
                    >
                      {{ session.courseName }}
                    </h4>
                  </div>
                  <span
                    :class="[
                      'text-xs font-black font-mono px-2 py-0.5 rounded-md border shrink-0 transition-colors duration-300',
                      isDarkMode
                        ? 'bg-[#0a1811] text-[#4ade80] border-emerald-500/70 shadow-xs'
                        : 'bg-emerald-50 text-dark-green border-emerald-200'
                    ]"
                  >
                    {{ session.timeWindow }}
                  </span>
                </div>

                <!-- Progress Meter -->
                <div class="space-y-1">
                  <div
                    :class="[
                      'w-full rounded-full h-2.5 overflow-hidden',
                      isDarkMode ? 'bg-[#0a1811] border border-emerald-800' : 'bg-gray-100'
                    ]"
                  >
                    <div
                      class="bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-300 h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(74,222,128,0.7)]"
                      :style="{ width: `${session.progressPercentage}%` }"
                    ></div>
                  </div>
                  <div
                    :class="[
                      'flex items-center justify-between text-[11px] font-bold pt-0.5',
                      isDarkMode ? 'text-[#86efac]' : 'text-text-muted'
                    ]"
                  >
                    <span class="flex items-center gap-1">
                      <Monitor :size="12" :class="isDarkMode ? 'text-[#4ade80]' : 'text-dark-green'" />
                      <span>Okupansi: <strong :class="['font-black', isDarkMode ? 'text-white' : 'text-text-primary']">{{ session.occupancy }} / {{ session.capacity }} Unit PC</strong></span>
                    </span>
                    <span :class="['font-black font-mono', isDarkMode ? 'text-[#4ade80] drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]' : 'text-dark-green']">
                      ~{{ session.remainingMinutes }} mnt tersisa
                    </span>
                  </div>
                </div>
              </div>

              <!-- STATE: UPCOMING -->
              <div
                v-else-if="session.status === 'UPCOMING'"
                :class="[
                  'p-2.5 rounded-xl space-y-1 text-xs border-2 transition-colors duration-300',
                  isDarkMode
                    ? 'bg-sky-950/60 border-sky-700/70 text-sky-200'
                    : 'bg-sky-50/70 border-sky-100'
                ]"
              >
                <div class="flex items-center justify-between gap-2">
                  <span
                    :class="[
                      'text-[10px] font-black uppercase px-2 py-0.5 rounded',
                      isDarkMode ? 'text-sky-200 bg-sky-900 border border-sky-600' : 'text-sky-800 bg-sky-100'
                    ]"
                  >
                    Sesi Berikutnya
                  </span>
                  <span :class="['font-mono font-black text-xs', isDarkMode ? 'text-sky-200' : 'text-sky-900']">
                    {{ session.timeWindow }}
                  </span>
                </div>
                <h4 :class="['font-black text-xs truncate', isDarkMode ? 'text-white' : 'text-text-primary']">
                  {{ session.courseName }}
                </h4>
                <p :class="['text-[11px] font-bold truncate', isDarkMode ? 'text-sky-300' : 'text-text-muted']">
                  Dosen: <span :class="['font-bold', isDarkMode ? 'text-white' : 'text-text-primary']">{{ session.instructor }}</span>
                </p>
              </div>

              <!-- STATE: MAINTENANCE -->
              <div
                v-else-if="session.status === 'MAINTENANCE'"
                :class="[
                  'p-2.5 rounded-xl text-center space-y-1 border-2 transition-colors duration-300',
                  isDarkMode ? 'bg-amber-950/60 border-amber-700/70 text-amber-200' : 'text-text-muted'
                ]"
              >
                <AlertTriangle :size="20" class="mx-auto text-amber-400" />
                <p :class="['text-xs font-black', isDarkMode ? 'text-amber-300' : 'text-amber-900']">
                  Dalam Jadwal Pemeliharaan
                </p>
                <p class="text-[11px] font-medium">Pemeriksaan teknis sedang dilakukan oleh Staf Laboran.</p>
              </div>

              <!-- STATE: AVAILABLE -->
              <div v-else class="space-y-2">
                <div :class="['flex items-center gap-1.5', isDarkMode ? 'text-[#4ade80] font-black' : 'text-dark-green font-black']">
                  <CheckCircle2 :size="16" class="shrink-0" />
                  <span class="text-xs">Laboratorium Tersedia & Siap Digunakan</span>
                </div>
                <!-- Modern Feature Micro-chips -->
                <div class="grid grid-cols-2 gap-2 text-[10.5px]">
                  <div
                    :class="[
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 font-bold transition-colors duration-300 shadow-xs',
                      isDarkMode
                        ? 'bg-[#132c1f] border-emerald-600/60 text-[#a7f3d0]'
                        : 'bg-surface/80 border-gray-100 text-text-secondary'
                    ]"
                  >
                    <Monitor :size="12" :class="isDarkMode ? 'text-[#4ade80]' : 'text-dark-green'" class="shrink-0" />
                    <span>{{ session.capacity }} Unit PC Siap Pakai</span>
                  </div>
                  <div
                    :class="[
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 font-bold transition-colors duration-300 shadow-xs',
                      isDarkMode
                        ? 'bg-[#132c1f] border-emerald-600/60 text-[#a7f3d0]'
                        : 'bg-surface/80 border-gray-100 text-text-secondary'
                    ]"
                  >
                    <Wifi :size="12" :class="isDarkMode ? 'text-[#4ade80]' : 'text-dark-green'" class="shrink-0" />
                    <span>Jaringan Kampus Aktif</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card Footer -->
            <div
              :class="[
                'pt-2.5 border-t flex items-center justify-between text-xs font-bold transition-colors duration-300',
                isDarkMode ? 'border-emerald-700/60 text-[#86efac]' : 'border-gray-100 text-text-muted'
              ]"
            >
              <span class="flex items-center gap-1.5" :class="isDarkMode ? 'text-[#a7f3d0]' : 'text-text-secondary'">
                <Users :size="13" :class="isDarkMode ? 'text-[#4ade80]' : 'text-dark-green'" />
                <span>Kapasitas: <strong :class="isDarkMode ? 'text-white font-black' : 'text-text-primary'">{{ session.capacity }} Kursi</strong></span>
              </span>
              <span
                :class="[
                  'inline-flex items-center gap-1 text-[10px] font-black tracking-wide uppercase',
                  isDarkMode ? 'text-[#4ade80]' : 'text-dark-green'
                ]"
              >
                <ShieldCheck :size="13" :class="isDarkMode ? 'text-[#4ade80]' : 'text-emerald-600'" />
                <span>Live Sync Aktif</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: TIMETABLE STREAM & SUMMARY (4 COLS) -->
      <div class="lg:col-span-4 flex flex-col justify-between gap-2.5 overflow-hidden h-full">
        <!-- Status Summary Ribbon (2 Modern Tiles) -->
        <div class="grid grid-cols-2 gap-2.5 shrink-0">
          <div
            :class="[
              'p-3 rounded-2xl border-2 shadow-sm flex items-center gap-3 transition-colors duration-300',
              isDarkMode
                ? 'bg-[#0d1f17] border-emerald-500/60 shadow-lg'
                : 'bg-gradient-to-br from-white to-emerald-50/60 border-emerald-200/80 shadow-2xs'
            ]"
          >
            <div
              :class="[
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 transition-colors duration-300',
                isDarkMode
                  ? 'bg-emerald-500/25 border-emerald-400 text-[#4ade80] shadow-[0_0_14px_rgba(74,222,128,0.3)]'
                  : 'bg-emerald-500/10 border-emerald-200/60 text-emerald-700 shadow-2xs'
              ]"
            >
              <Activity :size="20" class="animate-pulse" />
            </div>
            <div>
              <span
                :class="[
                  'text-[10px] font-black uppercase tracking-wider block',
                  isDarkMode ? 'text-[#86efac]' : 'text-text-muted'
                ]"
              >
                Sedang Dipakai
              </span>
              <span
                :class="[
                  'text-3xl font-black leading-none',
                  isDarkMode
                    ? 'text-[#4ade80] drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]'
                    : 'text-dark-green'
                ]"
              >
                {{ displayData?.laboratories?.filter((l) => l.status === 'IN_USE').length || 0 }}
                <span :class="['text-xs font-bold', isDarkMode ? 'text-[#a7f3d0]' : 'text-text-muted font-normal']">Lab</span>
              </span>
            </div>
          </div>
          <div
            :class="[
              'p-3 rounded-2xl border-2 shadow-sm flex items-center gap-3 transition-colors duration-300',
              isDarkMode
                ? 'bg-[#0d1f17] border-teal-500/60 shadow-lg'
                : 'bg-gradient-to-br from-white to-teal-50/60 border-teal-200/80 shadow-2xs'
            ]"
          >
            <div
              :class="[
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 transition-colors duration-300',
                isDarkMode
                  ? 'bg-teal-500/25 border-teal-400 text-[#2dd4bf] shadow-[0_0_14px_rgba(45,212,191,0.3)]'
                  : 'bg-teal-500/10 border-teal-200/60 text-teal-700 shadow-2xs'
              ]"
            >
              <CheckCircle2 :size="20" />
            </div>
            <div>
              <span
                :class="[
                  'text-[10px] font-black uppercase tracking-wider block',
                  isDarkMode ? 'text-[#5eead4]' : 'text-text-muted'
                ]"
              >
                Tersedia
              </span>
              <span
                :class="[
                  'text-3xl font-black leading-none',
                  isDarkMode
                    ? 'text-[#2dd4bf] drop-shadow-[0_0_10px_rgba(45,212,191,0.5)]'
                    : 'text-teal-800'
                ]"
              >
                {{ displayData?.laboratories?.filter((l) => l.status === 'AVAILABLE').length || 0 }}
                <span :class="['text-xs font-bold', isDarkMode ? 'text-[#5eead4]' : 'text-text-muted font-normal']">Lab</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Today's Class Schedule Stream -->
        <div
          :class="[
            'p-4 rounded-2xl border-2 flex-1 flex flex-col justify-between overflow-hidden relative min-h-0 transition-colors duration-300 shadow-md',
            isDarkMode
              ? 'bg-[#0d1f17] border-emerald-600/50 shadow-lg'
              : 'bg-white border-gray-200/90 shadow-2xs'
          ]"
        >
          <!-- Header -->
          <div
            :class="[
              'flex items-center justify-between border-b pb-2.5 mb-2.5 shrink-0 transition-colors duration-300',
              isDarkMode ? 'border-emerald-700/60' : 'border-gray-100'
            ]"
          >
            <h3
              :class="[
                'text-xs font-black uppercase tracking-wider flex items-center gap-2',
                isDarkMode ? 'text-white' : 'text-text-primary'
              ]"
            >
              <div
                :class="[
                  'w-6 h-6 rounded-lg flex items-center justify-center transition-colors duration-300',
                  isDarkMode
                    ? 'bg-[#122b1f] text-[#4ade80] border-2 border-emerald-500/70 shadow-xs'
                    : 'bg-brand-100 text-dark-green'
                ]"
              >
                <Calendar :size="13" />
              </div>
              <span>Jadwal Perkuliahan Hari Ini</span>
            </h3>
            <span
              :class="[
                'text-[10px] font-black px-2.5 py-0.5 rounded-full border-2 transition-colors duration-300',
                isDarkMode
                  ? 'text-[#4ade80] bg-emerald-500/25 border-emerald-400/70 shadow-xs'
                  : 'text-dark-green bg-brand-100 border-brand-200/80 shadow-2xs'
              ]"
            >
              {{ todayTimetableStream.length }} SESI
            </span>
          </div>

          <!-- Stream List with Sleek Scrollbar -->
          <div class="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar min-h-0">
            <div
              v-for="item in todayTimetableStream.slice(0, 6)"
              :key="item.id"
              :class="[
                'p-3 rounded-xl border-2 transition-all text-xs space-y-1.5 shadow-xs',
                isDarkMode
                  ? 'border-emerald-700/60 bg-[#132b1e] hover:bg-[#193627] hover:border-emerald-500'
                  : 'border-gray-100 bg-surface/60 hover:bg-brand-50/50 hover:border-brand-200/80 shadow-2xs'
              ]"
            >
              <div class="flex items-center justify-between gap-2">
                <span
                  :class="[
                    'font-black font-mono text-xs',
                    isDarkMode ? 'text-[#4ade80] drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]' : 'text-dark-green'
                  ]"
                >
                  {{ formatTime(item.startTime) }} – {{ formatTime(item.endTime) }} WIB
                </span>
                <span
                  :class="[
                    'px-2 py-0.5 rounded-md font-mono text-[10px] font-black border',
                    item.type === 'REQUEST'
                      ? isDarkMode
                        ? 'bg-sky-950 text-sky-200 border-sky-600'
                        : 'bg-sky-50 text-sky-800 border-sky-200'
                      : isDarkMode
                        ? 'bg-emerald-950 text-[#4ade80] border-emerald-500/70'
                        : 'bg-brand-100 text-dark-green border-brand-200',
                  ]"
                >
                  {{ item.roomCode }}
                </span>
              </div>
              <h4 :class="['font-bold truncate text-xs', isDarkMode ? 'text-white' : 'text-text-primary']">{{ item.title }}</h4>
              <p :class="['text-[11px] font-medium truncate', isDarkMode ? 'text-[#86efac]' : 'text-text-muted']">{{ item.subtitle }}</p>
            </div>

            <!-- Substantial Empty State -->
            <div
              v-if="todayTimetableStream.length === 0"
              :class="['py-8 text-center space-y-2.5', isDarkMode ? 'text-[#86efac]' : 'text-text-muted']"
            >
              <div
                :class="[
                  'w-11 h-11 rounded-2xl border-2 flex items-center justify-center mx-auto shadow-sm transition-colors duration-300',
                  isDarkMode
                    ? 'bg-[#122b1f] border-emerald-400 text-[#4ade80] shadow-[0_0_14px_rgba(74,222,128,0.3)]'
                    : 'bg-brand-50 border-brand-200/80 text-dark-green shadow-2xs'
                ]"
              >
                <CheckCircle2 :size="22" />
              </div>
              <div class="space-y-1">
                <h4 :class="['text-xs font-extrabold', isDarkMode ? 'text-white' : 'text-text-primary']">
                  Tidak Ada Jadwal Sesi Hari Ini
                </h4>
                <p :class="['text-[11px] max-w-xs mx-auto leading-relaxed', isDarkMode ? 'text-[#a7f3d0]' : 'text-text-muted']">
                  Seluruh ruangan laboratorium terbuka untuk peminjaman kegiatan, riset, dan belajar mandiri.
                </p>
              </div>
              <div
                :class="[
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 text-[10px] font-bold shadow-xs',
                  isDarkMode
                    ? 'bg-[#132c1f] border-emerald-600/60 text-[#a7f3d0]'
                    : 'bg-surface border-gray-200 text-text-secondary shadow-2xs'
                ]"
              >
                <Clock :size="12" :class="isDarkMode ? 'text-[#4ade80]' : 'text-dark-green'" />
                <span>Jam Operasional: 07:00 – 21:00 WIB</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 3. FOOTER ANNOUNCEMENT MARQUEE -->
    <footer
      :class="[
        'backdrop-blur-md px-4.5 py-2.5 rounded-2xl flex items-center gap-3 shrink-0 relative z-10 overflow-hidden border-2 transition-colors duration-300 shadow-md',
        isDarkMode
          ? 'bg-[#0d1f17] border-emerald-600/50 shadow-xl'
          : 'bg-white/95 border-gray-200/90 shadow-xs'
      ]"
    >
      <div
        :class="[
          'flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black shrink-0 border transition-colors duration-300 shadow-xs',
          isDarkMode
            ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_15px_rgba(74,222,128,0.35)]'
            : 'bg-dark-green text-white border-[#083b20]'
        ]"
      >
        <Megaphone :size="13" class="text-amber-400 shrink-0" />
        <span class="tracking-wide">PENGUMUMAN RESMI</span>
      </div>
      <div
        :class="[
          'overflow-hidden whitespace-nowrap flex-1 text-xs font-black tracking-wide',
          isDarkMode ? 'text-[#86efac] drop-shadow-[0_0_8px_rgba(134,239,172,0.3)]' : 'text-text-primary font-bold'
        ]"
      >
        <div class="inline-block animate-marquee">
          {{ activeAnnouncementText }}
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@keyframes marquee {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}

.animate-marquee {
  display: inline-block;
  white-space: nowrap;
  animation: marquee 35s linear infinite;
}

.animate-marquee:hover {
  animation-play-state: paused;
}

/* Sleek custom scrollbar for TV Display */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(12, 90, 48, 0.25);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(12, 90, 48, 0.45);
}

.dark-display {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

.dark-display .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(74, 222, 128, 0.45);
}
.dark-display .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(74, 222, 128, 0.75);
}

@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.animate-spin-slow {
  animation: spin-slow 20s linear infinite;
}
</style>
