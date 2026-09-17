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
  GraduationCap,
  Sparkles,
  Timer,
  Check,
  Layers,
  Hourglass,
  Info,
  Cpu,
  FileText,
  Zap,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Tv,
  Wind,
  Printer,
  X,
} from 'lucide-vue-next'
import {
  displayService,
  type PublicDisplayResponseDto,
  type DisplayLaboratoryDto,
  type DisplayScheduleDto,
  type DisplayRoomRequestDto,
  type DisplayLaboratoryFacilityDto,
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
let infoSlideTimer: number | null = null

// Separate Dedicated Widget: Operational & Lab Service Showcase Slides
const activeInfoSlide = ref(0)
const infoSlides = [
  {
    id: 'operational-hours',
    tab: 'Jam Operasional',
    title: 'Jam Layanan & Operasional Laboratorium',
    badge: '07:00 – 21:00 WIB',
    badgeClass: 'bg-emerald-600 text-white',
    icon: Clock,
    iconColor: 'text-emerald-700 dark:text-[#4ade80]',
    iconBg: 'bg-emerald-100/90 dark:bg-[#132c1f] border-emerald-300 dark:border-emerald-600/70',
    description: 'Laboratorium FIK beroperasi setiap hari kerja (Senin – Jumat) mulai pukul 07:00 hingga 21:00 WIB untuk praktikum dan belajar mandiri.',
    highlight: 'Unit PC dan pendingin ruangan dimatikan pukul 21:00 WIB untuk pemeliharaan rutin malam.',
  },
  {
    id: 'room-booking',
    tab: 'Peminjaman Lab',
    title: 'Peminjaman Ruang & Kuliah Pengganti',
    badge: 'Portal Dosen & Riset',
    badgeClass: 'bg-teal-700 text-white',
    icon: FileText,
    iconColor: 'text-teal-700 dark:text-[#2dd4bf]',
    iconBg: 'bg-teal-100/90 dark:bg-[#132c1f] border-teal-300 dark:border-teal-600/70',
    description: 'Pengajuan peminjaman laboratorium untuk kelas pengganti, sertifikasi, workshop, atau ujian dapat diajukan secara online.',
    highlight: 'Permohonan wajib diajukan minimal H-1 sebelum kegiatan melalui sistem permohonan lab.',
  },
  {
    id: 'lab-rules',
    tab: 'Tata Tertib',
    title: 'Tata Tertib & Kebersihan Laboratorium',
    badge: 'Himbauan Bersama',
    badgeClass: 'bg-amber-600 text-white',
    icon: ShieldCheck,
    iconColor: 'text-amber-700 dark:text-amber-300',
    iconBg: 'bg-amber-100/90 dark:bg-[#132c1f] border-amber-300 dark:border-amber-600/70',
    description: 'Seluruh pengguna lab wajib menjaga kebersihan fasilitas, merapikan kembali kursi, serta dilarang membawa makanan dan minuman.',
    highlight: 'Pastikan melakukan Shut Down pada komputer dan log out dari akun pribadi sebelum meninggalkan lab.',
  },
  {
    id: 'facility-readiness',
    tab: 'Kesiapan Alat',
    title: 'Pemeriksaan & Pemeliharaan Peralatan Lab',
    badge: 'Inventaris Real-Time',
    badgeClass: 'bg-emerald-700 text-white',
    icon: Wrench,
    iconColor: 'text-emerald-700 dark:text-[#4ade80]',
    iconBg: 'bg-emerald-100/90 dark:bg-[#132c1f] border-emerald-300 dark:border-emerald-600/70',
    description: 'Seluruh perangkat komputer, proyektor, AC, printer, dan koneksi internet dipantau kondisinya secara berkala oleh Staf Laboran FIK.',
    highlight: 'Laporkan kendala perangkat atau fasilitas yang memerlukan perbaikan ke staf laboran yang bertugas.',
  },
]

const currentInfoSlide = computed(() => (infoSlides[activeInfoSlide.value] || infoSlides[0]) as (typeof infoSlides)[0])

const nextInfoSlide = () => {
  activeInfoSlide.value = (activeInfoSlide.value + 1) % infoSlides.length
}

const prevInfoSlide = () => {
  activeInfoSlide.value = (activeInfoSlide.value - 1 + infoSlides.length) % infoSlides.length
}

const setInfoSlide = (index: number) => {
  activeInfoSlide.value = index
  resetInfoSlideTimer()
}

const resetInfoSlideTimer = () => {
  if (infoSlideTimer) clearInterval(infoSlideTimer)
  infoSlideTimer = window.setInterval(() => {
    nextInfoSlide()
  }, 7000)
}

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

// Current Session Phase (Pagi, Siang, Sore, Malam)
const currentSessionPhase = computed(() => {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      hour12: false,
    })
    const h = parseInt(formatter.format(now.value), 10)
    if (h >= 6 && h < 11) {
      return { label: 'Sesi Pagi', period: '07:00 – 11:00 WIB', darkBadge: 'bg-emerald-500/20 text-[#4ade80] border-emerald-400/50', lightBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
    }
    if (h >= 11 && h < 15) {
      return { label: 'Sesi Siang', period: '11:00 – 15:00 WIB', darkBadge: 'bg-amber-500/20 text-amber-300 border-amber-400/50', lightBadge: 'bg-amber-50 text-amber-800 border-amber-200' }
    }
    if (h >= 15 && h < 18) {
      return { label: 'Sesi Sore', period: '15:00 – 18:00 WIB', darkBadge: 'bg-orange-500/20 text-orange-300 border-orange-400/50', lightBadge: 'bg-orange-50 text-orange-800 border-orange-200' }
    }
    return { label: 'Sesi Malam', period: '18:00 – 21:00 WIB', darkBadge: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/50', lightBadge: 'bg-indigo-50 text-indigo-800 border-indigo-200' }
  } catch {
    return { label: 'Sesi Operasional', period: '07:00 – 21:00 WIB', darkBadge: 'bg-emerald-500/20 text-[#4ade80] border-emerald-400/50', lightBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
  }
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

// Current minutes in Jakarta WIB timezone (UTC+7)
function getCurrentJakartaMinutes(): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    const parts = formatter.formatToParts(now.value)
    const hStr = parts.find((p) => p.type === 'hour')?.value || '0'
    const mStr = parts.find((p) => p.type === 'minute')?.value || '0'
    return parseInt(hStr, 10) * 60 + parseInt(mStr, 10)
  } catch {
    return now.value.getHours() * 60 + now.value.getMinutes()
  }
}

// Normalized end minutes handling midnight or missing end time
function getEffectiveEndMinutes(
  startTime: string | Date | undefined | null,
  endTime: string | Date | undefined | null,
): number {
  const startMin = parseTimeToMinutes(startTime)
  let endMin = parseTimeToMinutes(endTime)
  if (endMin <= startMin || endMin === 0) {
    // Default to +2 hours from start time (max 22:00 / 1320 min)
    endMin = Math.min(1320, startMin + 120)
  }
  return endMin
}

// Progress percentage calculation
const computeProgress = (startTime: string, endTime: string): number => {
  try {
    const startMin = parseTimeToMinutes(startTime)
    const endMin = getEffectiveEndMinutes(startTime, endTime)
    const currentMin = getCurrentJakartaMinutes()
    if (endMin <= startMin) return 100
    if (currentMin <= startMin) return 5
    if (currentMin >= endMin) return 100
    return Math.min(100, Math.max(5, Math.round(((currentMin - startMin) / (endMin - startMin)) * 100)))
  } catch {
    return 50
  }
}

// Remaining minutes calculation
const computeRemainingMinutes = (startTime: string, endTime: string): number => {
  try {
    const endMin = getEffectiveEndMinutes(startTime, endTime)
    const currentMin = getCurrentJakartaMinutes()
    return Math.max(0, endMin - currentMin)
  } catch {
    return 0
  }
}

// Equipment Data Interfaces
export interface LabEquipmentItem {
  id: string
  name: string
  code: string
  category: string
  quantity: number
  condition: 'GOOD' | 'DAMAGED' | 'UNDER_MAINTENANCE'
  description?: string | null
}

export interface LabEquipmentSummary {
  totalUnits: number
  goodUnits: number
  damagedUnits: number
  maintenanceUnits: number
  healthPercentage: number
  hasIssue: boolean
  items: LabEquipmentItem[]
}

function computeEquipmentSummary(facilities?: DisplayLaboratoryFacilityDto[]): LabEquipmentSummary {
  if (!facilities || facilities.length === 0) {
    return {
      totalUnits: 0,
      goodUnits: 0,
      damagedUnits: 0,
      maintenanceUnits: 0,
      healthPercentage: 100,
      hasIssue: false,
      items: [],
    }
  }

  let totalUnits = 0
  let goodUnits = 0
  let damagedUnits = 0
  let maintenanceUnits = 0

  const items: LabEquipmentItem[] = facilities.map((lf) => {
    const qty = lf.quantity || 1
    totalUnits += qty
    if (lf.condition === 'GOOD') {
      goodUnits += qty
    } else if (lf.condition === 'DAMAGED') {
      damagedUnits += qty
    } else if (lf.condition === 'UNDER_MAINTENANCE') {
      maintenanceUnits += qty
    }

    return {
      id: lf.id,
      name: lf.facility?.name || 'Peralatan Lab',
      code: lf.facility?.code || 'FAC',
      category: lf.facility?.category || 'Umum',
      quantity: qty,
      condition: lf.condition || 'GOOD',
      description: lf.facility?.description,
    }
  })

  const healthPercentage = totalUnits > 0 ? Math.round((goodUnits / totalUnits) * 100) : 100
  const hasIssue = damagedUnits > 0 || maintenanceUnits > 0

  return {
    totalUnits,
    goodUnits,
    damagedUnits,
    maintenanceUnits,
    healthPercentage,
    hasIssue,
    items,
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
  isExpired: boolean
  status: 'IN_USE' | 'UPCOMING' | 'AVAILABLE' | 'MAINTENANCE'
  capacity: number
  occupancy: number
  equipmentSummary: LabEquipmentSummary
}

// Computed: Build live lab sessions list combining laboratories, usages, schedules, and requests
const liveLabSessions = computed<FormattedLiveSession[]>(() => {
  // Trigger reactivity on every second clock tick
  const _tick = now.value.getTime()

  if (!displayData.value || !displayData.value.laboratories) {
    return []
  }

  const currentMinutes = getCurrentJakartaMinutes()
  const { laboratories, schedules, room_requests, room_usage } = displayData.value

  return laboratories.map((lab: DisplayLaboratoryDto) => {
    const equipmentSummary = computeEquipmentSummary(lab.laboratoryFacilities)

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
        isExpired: false,
        status: 'MAINTENANCE',
        capacity: lab.maximum_capacity,
        occupancy: 0,
        equipmentSummary,
      }
    }

    // 1. Check for active RoomUsage
    const activeUsage = room_usage?.find(
      (u) =>
        (u.request?.laboratory.id === lab.id || u.schedule?.laboratory.id === lab.id) &&
        (u.status === 'CHECKED_IN' || u.status === 'IN_USE'),
    )

    // 2. Check for matching ongoing schedule (strictly within time window: start <= now < end)
    const ongoingSchedule = schedules?.find((s: DisplayScheduleDto) => {
      if (s.laboratory?.id !== lab.id || s.status === 'CANCELLED') return false
      const startMin = parseTimeToMinutes(s.start_time)
      const endMin = getEffectiveEndMinutes(s.start_time, s.end_time)
      return currentMinutes >= startMin && currentMinutes < endMin
    })

    // 3. Check for matching ongoing approved room request (strictly within time window: start <= now < end)
    const ongoingRequest = room_requests?.find((r: DisplayRoomRequestDto) => {
      if (r.laboratory?.id !== lab.id) return false
      const startMin = parseTimeToMinutes(r.start_time)
      const endMin = getEffectiveEndMinutes(r.start_time, r.end_time)
      return currentMinutes >= startMin && currentMinutes < endMin
    })

    // Evaluate active room usage expiration
    let activeUsageValid = false
    let activeUsageStartTime = '08:00'
    let activeUsageEndTime = '17:00'
    if (activeUsage) {
      activeUsageStartTime = extractTimeString(
        activeUsage.schedule?.start_time ||
        activeUsage.request?.start_time ||
        activeUsage.check_in_time ||
        '08:00',
      )
      activeUsageEndTime = extractTimeString(
        activeUsage.schedule?.end_time ||
        activeUsage.request?.end_time ||
        (activeUsage as any).expected_check_out_time ||
        '',
      )
      const aStartMin = parseTimeToMinutes(activeUsageStartTime)
      let aEndMin = parseTimeToMinutes(activeUsageEndTime)
      if (!activeUsageEndTime || activeUsageEndTime === '--:--' || aEndMin <= aStartMin) {
        aEndMin = Math.min(1320, aStartMin + 120)
        const endH = String(Math.floor(aEndMin / 60)).padStart(2, '0')
        const endM = String(aEndMin % 60).padStart(2, '0')
        activeUsageEndTime = `${endH}:${endM}`
      }
      // ONLY valid if current time is strictly before end time!
      // Once currentMinutes >= aEndMin, usage is forcibly ended.
      if (currentMinutes < aEndMin) {
        activeUsageValid = true
      }
    }

    // Active session is strictly ongoing right now (time has NOT expired)
    if (ongoingSchedule || ongoingRequest || activeUsageValid) {
      const startTimeStr = extractTimeString(
        ongoingSchedule?.start_time ||
          ongoingRequest?.start_time ||
          activeUsageStartTime ||
          '08:00',
      )
      let endTimeStr = extractTimeString(
        ongoingSchedule?.end_time ||
          ongoingRequest?.end_time ||
          activeUsageEndTime,
      )
      const startMin = parseTimeToMinutes(startTimeStr)
      let endMin = parseTimeToMinutes(endTimeStr)
      if (!endTimeStr || endTimeStr === '--:--' || endMin <= startMin) {
        endMin = Math.min(1320, startMin + 120)
        const endH = String(Math.floor(endMin / 60)).padStart(2, '0')
        const endM = String(endMin % 60).padStart(2, '0')
        endTimeStr = `${endH}:${endM}`
      }

      // If current time is strictly before endMin: Session is live and active
      if (currentMinutes < endMin) {
        const courseName =
          ongoingSchedule?.course_name ||
          ongoingRequest?.activity_name ||
          activeUsage?.schedule?.course_name ||
          activeUsage?.request?.activity_name ||
          'Praktikum Sedang Berlangsung'

        const courseCode =
          ongoingSchedule?.class_name ||
          ongoingRequest?.course_name ||
          ongoingRequest?.class_name ||
          'REG-01'

        const instructor =
          ongoingSchedule?.lecturer_name ||
          ongoingRequest?.applicant?.full_name ||
          activeUsage?.checkedInBy?.full_name ||
          'Dosen Pengajar'

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
          remainingMinutes: computeRemainingMinutes(startTimeStr, endTimeStr),
          isExpired: false,
          status: 'IN_USE',
          capacity: lab.maximum_capacity,
          occupancy,
          equipmentSummary,
        }
      }
    }

    // If session ended or lab was forced to stop:
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
        isExpired: false,
        status: 'UPCOMING',
        capacity: lab.maximum_capacity,
        occupancy: 0,
        equipmentSummary,
      }
    }

    // Default: Laboratory is available (forced stop when schedule time has passed)
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
      isExpired: false,
      status: 'AVAILABLE',
      capacity: lab.maximum_capacity,
      occupancy: 0,
      equipmentSummary,
    }
  })
})

// Unified Lab Counters
const totalLabsCount = computed(() => displayData.value?.laboratories?.length || 0)
const inUseLabsCount = computed(() => {
  return liveLabSessions.value.filter((s) => s.status === 'IN_USE').length
})
const availableLabsCount = computed(() => {
  return liveLabSessions.value.filter((s) => s.status === 'AVAILABLE').length
})
const upcomingLabsCount = computed(() => {
  return liveLabSessions.value.filter((s) => s.status === 'UPCOMING').length
})

// Overall Equipment Statistics Across All Labs
const overallEquipmentStats = computed(() => {
  let total = 0
  let good = 0
  let damaged = 0
  let maintenance = 0

  liveLabSessions.value.forEach((s) => {
    if (s.equipmentSummary) {
      total += s.equipmentSummary.totalUnits
      good += s.equipmentSummary.goodUnits
      damaged += s.equipmentSummary.damagedUnits
      maintenance += s.equipmentSummary.maintenanceUnits
    }
  })

  const healthRate = total > 0 ? Math.round((good / total) * 100) : 100
  return {
    total,
    good,
    damaged,
    maintenance,
    healthRate,
  }
})

// Live Equipment Inspector Modal State & Helpers
const selectedLabForEquipment = ref<FormattedLiveSession | null>(null)
const isEquipmentModalOpen = ref(false)

const openEquipmentModal = (session: FormattedLiveSession) => {
  selectedLabForEquipment.value = session
  isEquipmentModalOpen.value = true
}

const openOverallEquipmentModal = () => {
  const firstSession = liveLabSessions.value[0]
  if (firstSession) {
    selectedLabForEquipment.value = firstSession
    isEquipmentModalOpen.value = true
  }
}

const closeEquipmentModal = () => {
  isEquipmentModalOpen.value = false
  selectedLabForEquipment.value = null
}

const getEquipmentIcon = (name: string, _category?: string) => {
  const n = (name || '').toLowerCase()
  if (n.includes('komputer') || n.includes('pc') || n.includes('desktop')) return Monitor
  if (n.includes('proyektor') || n.includes('lcd') || n.includes('screen')) return Tv
  if (n.includes('pendingin') || n.includes('ac') || n.includes('air conditioner')) return Wind
  if (n.includes('printer') || n.includes('cetak')) return Printer
  if (n.includes('internet') || n.includes('wifi') || n.includes('lan') || n.includes('jaringan')) return Wifi
  if (n.includes('papan') || n.includes('whiteboard')) return BookOpen
  return Cpu
}

const getLabPcQuantity = (session: FormattedLiveSession): number => {
  const pcItem = session.equipmentSummary?.items.find((i) =>
    i.name.toLowerCase().includes('komputer') || i.name.toLowerCase().includes('pc'),
  )
  return pcItem?.quantity || session.capacity
}

interface StreamItem {
  id: string
  title: string
  subtitle: string
  roomCode: string
  roomName: string
  startTime: string
  endTime: string
  startMin: number
  endMin: number
  type: 'SCHEDULE' | 'REQUEST'
  isOngoing: boolean
  isUpcoming: boolean
  activeUsage: boolean
}

// Total schedules count for today (to distinguish between empty day vs all finished)
const totalTodaySchedulesCount = computed(() => {
  const schedCount =
    displayData.value?.schedules?.filter((s) => s.status !== 'CANCELLED').length || 0
  const reqCount = displayData.value?.room_requests?.length || 0
  return schedCount + reqCount
})

const todayTimetableStream = computed<StreamItem[]>(() => {
  // Trigger reactivity on every second clock tick
  const _tick = now.value.getTime()

  const stream: StreamItem[] = []
  const currentMinutes = getCurrentJakartaMinutes()
  const usages = displayData.value?.room_usage || []

  // 1. Add recurring schedules
  if (displayData.value?.schedules) {
    displayData.value.schedules.forEach((s) => {
      if (s.status === 'CANCELLED') return

      const startMin = parseTimeToMinutes(s.start_time)
      const endMin = getEffectiveEndMinutes(s.start_time, s.end_time)
      const startTimeStr = extractTimeString(s.start_time)
      const endTimeStr = extractTimeString(s.end_time)

      // Strict expiration: If current time has reached or passed end time, omit from timetable completely
      if (currentMinutes >= endMin) {
        return
      }

      // Check if there is an active check-in/usage for this schedule
      const hasActiveUsage = usages.some(
        (u) =>
          u.schedule?.course_name === s.course_name &&
          u.schedule?.laboratory.id === s.laboratory?.id &&
          (u.status === 'CHECKED_IN' || u.status === 'IN_USE'),
      )

      const isOngoing = currentMinutes >= startMin && currentMinutes < endMin
      const isUpcoming = currentMinutes < startMin

      stream.push({
        id: s.id,
        title: s.course_name,
        subtitle: `Dosen: ${s.lecturer_name || s.class_name || 'Dosen Pengajar'}`,
        roomCode: s.laboratory?.code || 'LAB',
        roomName: s.laboratory?.name || 'Laboratorium',
        startTime: startTimeStr,
        endTime: endTimeStr,
        startMin,
        endMin,
        type: 'SCHEDULE',
        isOngoing,
        isUpcoming,
        activeUsage: hasActiveUsage,
      })
    })
  }

  // 2. Add approved room requests for today
  if (displayData.value?.room_requests) {
    displayData.value.room_requests.forEach((r) => {
      const startMin = parseTimeToMinutes(r.start_time)
      const endMin = getEffectiveEndMinutes(r.start_time, r.end_time)
      const startTimeStr = extractTimeString(r.start_time)
      const endTimeStr = extractTimeString(r.end_time)

      // Strict expiration: If current time has reached or passed end time, omit from timetable completely
      if (currentMinutes >= endMin) {
        return
      }

      // Check if there is an active check-in/usage for this request
      const hasActiveUsage = usages.some(
        (u) =>
          u.request?.activity_name === r.activity_name &&
          u.request?.laboratory.id === r.laboratory?.id &&
          (u.status === 'CHECKED_IN' || u.status === 'IN_USE'),
      )

      const isOngoing = currentMinutes >= startMin && currentMinutes < endMin
      const isUpcoming = currentMinutes < startMin

      stream.push({
        id: r.id,
        title: r.activity_name,
        subtitle: `Dosen: ${r.applicant?.full_name || 'Dosen Pengajar'}`,
        roomCode: r.laboratory?.code || 'LAB',
        roomName: r.laboratory?.name || 'Laboratorium',
        startTime: startTimeStr,
        endTime: endTimeStr,
        startMin,
        endMin,
        type: 'REQUEST',
        isOngoing,
        isUpcoming,
        activeUsage: hasActiveUsage,
      })
    })
  }

  // Sort: ongoing sessions first, then upcoming sessions chronologically by start time
  return stream.sort((a, b) => {
    if (a.isOngoing && !b.isOngoing) return -1
    if (!a.isOngoing && b.isOngoing) return 1
    return a.startMin - b.startMin
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
    const rawApiUrl = (import.meta.env.VITE_API_BASE_URL as string) || ''
    const fallbackWs = rawApiUrl
      ? rawApiUrl.replace(/\/api\/?$/, '')
      : `${window.location.protocol}//${window.location.hostname}:3000`
    const wsUrl =
      (import.meta.env.VITE_WS_URL as string) || fallbackWs || 'http://localhost:3000'

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
    socket.on('schedule:update', () => {
      fetchDisplayData()
    })
    socket.on('room-request:update', () => {
      fetchDisplayData()
    })
    socket.on('usage:update', () => {
      fetchDisplayData()
    })
  } catch (err) {
    console.warn('WebSocket init warning:', err)
  }

  // Fullscreen change listener
  document.addEventListener('fullscreenchange', handleFullscreenChange)

  // Fallback 60s background heartbeat
  pollTimer = window.setInterval(fetchDisplayData, 60000)

  // Start auto-rotation for Info & Service Showcase widget
  resetInfoSlideTimer()
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
  if (pollTimer) clearInterval(pollTimer)
  if (infoSlideTimer) clearInterval(infoSlideTimer)
  if (socket) socket.disconnect()
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
</script>

<template>
  <div
    :class="[
      'min-h-screen h-screen w-screen overflow-hidden select-none flex flex-col justify-between p-3.5 sm:p-4 lg:p-4.5 font-sans relative transition-colors duration-500',
      isDarkMode ? 'dark-display bg-[#040906] text-[#86efac]' : 'bg-gradient-to-br from-[#eaf4ee] via-[#f0f8f3] to-[#e4f1ea] text-text-primary'
    ]"
  >
    <!-- Background Ambient Lighting Grid -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <div
        :class="[
          'absolute -top-40 -left-40 w-[550px] h-[550px] rounded-full blur-[100px] transition-all duration-1000 animate-pulse-slow',
          isDarkMode ? 'bg-emerald-500/[0.14]' : 'bg-emerald-600/[0.08]'
        ]"
      ></div>
      <div
        :class="[
          'absolute top-1/3 -right-40 w-[650px] h-[650px] rounded-full blur-[120px] transition-all duration-1000 animate-pulse-slow',
          isDarkMode ? 'bg-teal-500/[0.12]' : 'bg-teal-400/[0.08]'
        ]"
      ></div>
      <div
        :class="[
          'absolute -bottom-40 left-1/3 w-[600px] h-[600px] rounded-full blur-[100px] transition-all duration-1000 animate-pulse-slow',
          isDarkMode ? 'bg-emerald-400/[0.10]' : 'bg-amber-400/[0.06]'
        ]"
      ></div>
      <div
        :class="[
          'absolute inset-0 [background-size:26px_26px] transition-all duration-700',
          isDarkMode
            ? 'bg-[radial-gradient(#22c55e_1px,transparent_1px)] opacity-[0.12]'
            : 'bg-[radial-gradient(#0c5a30_1px,transparent_1px)] opacity-[0.05]'
        ]"
      ></div>
    </div>

    <!-- 1. COMMAND CENTER HEADER -->
    <header
      :class="[
        'flex items-center justify-between px-5 sm:px-6 py-3.5 rounded-2xl backdrop-blur-xl shrink-0 relative overflow-hidden z-10 transition-colors duration-300 shadow-xl border-2',
        isDarkMode
          ? 'bg-gradient-to-r from-[#04140b] via-[#092617] to-[#04140b] border-emerald-500/70 shadow-[0_4px_25px_rgba(74,222,128,0.2)] text-white'
          : 'bg-gradient-to-r from-[#07371d] via-[#0c5a30] to-[#07371d] border-amber-400/80 shadow-[0_8px_25px_rgba(12,90,48,0.3)] text-white'
      ]"
    >
      <!-- Institutional Accent Top Line with Sheen -->
      <div
        :class="[
          'absolute top-0 left-0 right-0 h-[3.5px]',
          isDarkMode
            ? 'bg-gradient-to-r from-emerald-500 via-green-300 to-emerald-500 shadow-[0_0_12px_rgba(74,222,128,0.6)]'
            : 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-[0_0_12px_rgba(251,191,36,0.8)]'
        ]"
      />

      <!-- Left Branding -->
      <div class="flex items-center gap-3.5">
        <div class="w-12 h-12 shrink-0 flex items-center justify-center p-1 rounded-xl bg-white shadow-md border-2 border-amber-400/90">
          <img
            src="/images/logo-upnvj.webp"
            alt="UPNVJ Logo"
            class="w-full h-full object-contain"
          />
        </div>
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-xl sm:text-2xl font-extrabold tracking-normal text-white drop-shadow-sm">
              Lab<span class="text-amber-400 drop-shadow-[0_0_14px_rgba(251,191,36,0.6)] font-extrabold">Display</span>
            </h1>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-emerald-500/30 text-emerald-200 border border-emerald-400/60 shadow-xs">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
              <span>MONITOR REAL-TIME</span>
            </span>
          </div>
          <p class="text-[11px] font-semibold tracking-wider mt-0.5 text-emerald-100/90">
            FAKULTAS ILMU KOMPUTER • UPN "VETERAN" JAKARTA
          </p>
        </div>
      </div>

      <!-- Right: Real-time WIB Clock, Academic Session & Controls -->
      <div class="flex items-center gap-3 sm:gap-4">
        <!-- Date & Clock Box -->
        <div class="flex items-center gap-3.5 px-4 py-1.5 rounded-xl border-2 bg-black/25 border-emerald-400/50 shadow-inner">
          <div class="text-right pr-3.5 hidden sm:block border-r border-emerald-500/40">
            <div class="flex items-center gap-1.5 text-xs font-semibold capitalize justify-end text-emerald-100">
              <Calendar :size="12" class="text-amber-300 shrink-0" />
              <span>{{ formattedDate }}</span>
            </div>
            <div class="flex items-center gap-1.5 justify-end text-[10.5px] font-bold mt-0.5 text-amber-300">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span>{{ currentSessionPhase.label }} • {{ currentSessionPhase.period }}</span>
            </div>
          </div>
          <div class="flex items-center justify-end gap-1.5 text-2xl sm:text-3xl font-bold font-mono tracking-normal leading-none tabular-nums text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
            <span>{{ formattedTime }}</span>
            <span class="px-1.5 py-0.5 rounded-md text-[10px] font-bold font-sans tracking-wide bg-amber-400 text-gray-950 border-transparent shadow-xs">
              WIB
            </span>
          </div>
        </div>

        <!-- Live Sync Status Pill -->
        <div
          :class="[
            'flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 text-xs font-bold tracking-wide shadow-xs transition-all',
            isSocketConnected
              ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
              : 'bg-black/30 border-gray-600 text-gray-300'
          ]"
        >
          <span v-if="isSocketConnected" class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <WifiOff v-else :size="13" />
          <span class="tracking-wide">{{ isSocketConnected ? 'SINKRONISASI AKTIF' : 'MODE BERKALA' }}</span>
        </div>

        <!-- Dark Mode Toggle Button -->
        <button
          @click="toggleDarkMode"
          class="p-2.5 rounded-xl border-2 transition-all shadow-xs cursor-pointer active:scale-95 flex items-center justify-center bg-white/10 hover:bg-white/20 border-white/30 text-white"
          :title="isDarkMode ? 'Beralih ke Tampilan Terang' : 'Beralih ke Tampilan Gelap (Kontras Tinggi)'"
          aria-label="Toggle Dark Mode"
        >
          <Sun v-if="isDarkMode" :size="17" class="text-amber-300 animate-spin-slow" />
          <Moon v-else :size="17" />
        </button>

        <!-- Fullscreen Button -->
        <button
          @click="toggleFullscreen"
          class="p-2.5 rounded-xl border-2 transition-all shadow-xs cursor-pointer active:scale-95 flex items-center justify-center bg-white/10 hover:bg-white/20 border-white/30 text-white"
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
        <div class="flex items-center justify-between px-1 shrink-0">
          <div class="flex items-center gap-2.5">
            <div
              :class="[
                'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm',
                isDarkMode
                  ? 'bg-[#122b1f] border-2 border-emerald-500 text-[#4ade80] shadow-[0_0_12px_rgba(74,222,128,0.3)]'
                  : 'bg-gradient-to-br from-[#0c5a30] to-[#07371d] text-white shadow-md'
              ]"
            >
              <Radio :size="15" class="animate-pulse" />
            </div>
            <div>
              <h2
                :class="[
                  'text-xs sm:text-sm font-bold tracking-wide uppercase flex items-center gap-2',
                  isDarkMode ? 'text-white' : 'text-[#0c5a30]'
                ]"
              >
                Status & Okupansi Laboratorium FIK
              </h2>
              <p :class="['text-[10.5px] sm:text-[11px] font-medium', isDarkMode ? 'text-[#86efac]' : 'text-emerald-700']">
                Pantauan real-time ketersediaan ruang, unit PC & sesi praktikum
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="openOverallEquipmentModal"
              type="button"
              :class="[
                'text-[10.5px] font-bold px-3 py-1 rounded-full border-2 transition-all duration-300 flex items-center gap-1.5 shadow-sm tracking-wide cursor-pointer hover:scale-105 active:scale-95',
                isDarkMode
                  ? 'text-amber-300 bg-amber-500/20 border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.25)] hover:bg-amber-500/30'
                  : 'text-emerald-950 bg-amber-100 border-amber-300 hover:bg-amber-200'
              ]"
              title="Klik untuk inspeksi kesiapan seluruh peralatan lab"
            >
              <Wrench :size="12" class="text-amber-400" />
              <span>{{ overallEquipmentStats.healthRate }}% ALAT SIAP ({{ overallEquipmentStats.good }}/{{ overallEquipmentStats.total }})</span>
            </button>
            <span
              :class="[
                'text-[10.5px] font-bold px-3 py-1 rounded-full border-2 transition-colors duration-300 flex items-center gap-1.5 shadow-sm tracking-wide',
                isDarkMode
                  ? 'text-[#4ade80] bg-emerald-500/20 border-emerald-400/60 shadow-[0_0_10px_rgba(74,222,128,0.2)]'
                  : 'text-white bg-emerald-600 border-emerald-500'
              ]"
            >
              <span class="w-2 h-2 rounded-full bg-emerald-200 animate-ping"></span>
              <span>{{ inUseLabsCount }} LAB AKTIF</span>
            </span>
            <span
              :class="[
                'text-[10.5px] font-bold px-3 py-1 rounded-full border-2 transition-colors duration-300 flex items-center gap-1 shadow-sm tracking-wide',
                isDarkMode
                  ? 'text-[#5eead4] bg-teal-500/20 border-teal-400/60'
                  : 'text-white bg-teal-600 border-teal-500'
              ]"
            >
              <Check :size="12" />
              <span>{{ availableLabsCount }} TERSEDIA</span>
            </span>
            <span
              :class="[
                'text-[10.5px] font-bold px-3 py-1 rounded-full border-2 transition-colors duration-300 tracking-wide',
                isDarkMode
                  ? 'text-[#86efac] bg-[#122b1f] border-emerald-700/70'
                  : 'text-[#0c5a30] bg-white border-emerald-300 shadow-xs'
              ]"
            >
              TOTAL {{ totalLabsCount }} RUANG
            </span>
          </div>
        </div>

        <!-- Grid of Rooms with Sleek Scrollbar -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 flex-1 overflow-y-auto pr-1.5 custom-scrollbar min-h-0 pb-0.5">
          <div
            v-for="session in liveLabSessions"
            :key="session.id"
            :class="[
              'rounded-2xl border-2 shadow-sm transition-all duration-300 flex flex-col justify-between relative overflow-hidden',
              isDarkMode
                ? session.status === 'IN_USE'
                  ? 'bg-gradient-to-b from-[#133525] via-[#0d241a] to-[#081710] border-emerald-400 ring-4 ring-emerald-400/30 shadow-[0_0_35px_rgba(74,222,128,0.28)]'
                  : session.status === 'AVAILABLE'
                    ? 'bg-[#0d1f17] border-emerald-700/60 hover:border-teal-400/80 shadow-md'
                    : session.status === 'UPCOMING'
                      ? 'bg-[#0d1c24] border-sky-600/60 shadow-md'
                      : 'bg-amber-950/40 border-amber-600/60 shadow-md'
                : session.status === 'IN_USE'
                  ? 'bg-gradient-to-b from-emerald-50 via-white to-emerald-100/60 border-emerald-600 ring-4 ring-emerald-500/25 shadow-xl'
                  : session.status === 'AVAILABLE'
                    ? 'bg-gradient-to-b from-white via-teal-50/20 to-teal-50/40 border-teal-300 hover:border-teal-500 shadow-md hover:shadow-lg'
                    : session.status === 'UPCOMING'
                      ? 'bg-white border-sky-300 hover:border-sky-400 shadow-sm'
                      : 'bg-white border-amber-300 shadow-sm',
            ]"
          >
            <!-- Active Lab Alert Banner (Full-Width Top Header Strip for IN_USE) -->
            <div
              v-if="session.status === 'IN_USE'"
              :class="[
                'px-4 py-2 flex items-center justify-between border-b transition-colors duration-300 shrink-0',
                isDarkMode
                  ? 'bg-gradient-to-r from-emerald-600 via-[#0c5a30] to-emerald-700 text-white border-emerald-400/60 shadow-inner'
                  : 'bg-gradient-to-r from-[#07371d] via-[#0c5a30] to-[#07371d] text-white border-emerald-700 shadow-sm'
              ]"
            >
              <div class="flex items-center gap-2.5">
                <span class="relative flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-90"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-amber-400 shadow-[0_0_8px_#fbbf24]"></span>
                </span>
                <span class="text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 drop-shadow-xs">
                  <Radio :size="13" class="animate-pulse text-amber-300" />
                  <span>PRAKTIKUM SEDANG BERLANGSUNG</span>
                </span>
              </div>
              <div class="flex items-center gap-1.5 font-mono text-[11px] font-bold bg-black/40 px-2.5 py-0.5 rounded-lg border border-emerald-400/40 text-emerald-200 shadow-xs">
                <Clock :size="12" class="text-amber-300" />
                <span>{{ session.timeWindow }}</span>
              </div>
            </div>

            <!-- Top Status Accent Gradient Bar (Only for non-IN_USE cards) -->
            <div
              v-else
              :class="[
                'absolute top-0 left-0 right-0 h-1.5',
                session.status === 'AVAILABLE'
                  ? isDarkMode
                    ? 'bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.4)]'
                    : 'bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-400'
                  : session.status === 'UPCOMING'
                    ? 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500'
                    : 'bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400'
              ]"
            />

            <!-- Inner Card Wrapper -->
            <div class="p-4 flex-1 flex flex-col justify-between">
              <!-- Card Header -->
              <div
                :class="[
                  'flex items-start justify-between gap-3 border-b pb-3 transition-colors duration-300',
                  isDarkMode ? 'border-emerald-700/60' : 'border-emerald-100'
                ]"
              >
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span
                      :class="[
                        'px-2.5 py-1 rounded-lg font-mono text-xs font-bold shrink-0 transition-colors duration-300',
                        session.status === 'IN_USE'
                          ? isDarkMode
                            ? 'bg-emerald-500/30 text-[#4ade80] border-2 border-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.3)]'
                            : 'bg-gradient-to-r from-[#0c5a30] to-emerald-700 text-white border-2 border-emerald-600 shadow-xs'
                          : isDarkMode
                            ? 'bg-emerald-500/25 text-[#4ade80] border border-emerald-400/70 shadow-xs'
                            : 'bg-gradient-to-r from-[#0c5a30] to-[#07371d] text-white shadow-xs'
                      ]"
                    >
                      {{ session.labCode }}
                    </span>
                    <h3
                      :class="[
                        'font-bold text-sm sm:text-base truncate tracking-normal',
                        isDarkMode ? 'text-white drop-shadow-xs' : 'text-gray-900'
                      ]"
                    >
                      {{ session.labName }}
                    </h3>
                  </div>
                  <div
                    :class="[
                      'flex items-center gap-1.5 text-[11px] mt-1 font-medium truncate',
                      isDarkMode ? 'text-[#86efac]' : 'text-emerald-800'
                    ]"
                  >
                    <MapPin :size="12" :class="isDarkMode ? 'text-[#4ade80]' : 'text-[#0c5a30]'" class="shrink-0" />
                    <span class="truncate">{{ session.location }}</span>
                  </div>
                </div>

                <!-- Status Badge -->
                <span
                  v-if="session.status === 'IN_USE'"
                  :class="[
                    'px-3 py-1.5 rounded-xl text-xs font-bold border-2 shrink-0 flex items-center gap-2 transition-all shadow-md tracking-wide',
                    isDarkMode
                      ? 'bg-emerald-400 text-gray-950 border-emerald-200 shadow-[0_0_18px_rgba(74,222,128,0.5)]'
                      : 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-400/40'
                  ]"
                >
                  <span class="relative flex h-2.5 w-2.5">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
                    <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                  </span>
                  <span>SEDANG AKTIF</span>
                </span>
                <span
                  v-else
                  :class="[
                    'px-3 py-1 rounded-full text-[10.5px] font-bold border-2 shrink-0 flex items-center gap-1.5 transition-colors duration-300 shadow-sm tracking-wide',
                    isDarkMode
                      ? session.status === 'AVAILABLE'
                        ? 'bg-teal-500/25 border-teal-400 text-[#5eead4] shadow-[0_0_12px_rgba(45,212,191,0.25)]'
                        : session.status === 'UPCOMING'
                          ? 'bg-sky-500/25 border-sky-400 text-[#7dd3fc] shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                          : 'bg-amber-500/25 border-amber-400 text-[#fcd34d] shadow-[0_0_12px_rgba(251,191,36,0.25)]'
                      : session.status === 'AVAILABLE'
                        ? 'bg-teal-700 border-teal-600 text-white'
                        : session.status === 'UPCOMING'
                          ? 'bg-sky-600 border-sky-500 text-white'
                          : 'bg-amber-600 border-amber-500 text-white',
                  ]"
                >
                  <span
                    v-if="session.status === 'AVAILABLE'"
                    class="w-2 h-2 rounded-full bg-teal-200 shrink-0"
                  ></span>
                  <span
                    v-else-if="session.status === 'UPCOMING'"
                    class="w-2 h-2 rounded-full bg-sky-200 shrink-0"
                  ></span>
                  <span
                    v-else
                    class="w-2 h-2 rounded-full bg-amber-200 shrink-0"
                  ></span>
                  <span>{{
                    session.status === 'AVAILABLE'
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
                <div v-if="session.status === 'IN_USE'" class="space-y-3">
                  <div
                    :class="[
                      'p-3.5 rounded-xl border-2 space-y-2.5 transition-all',
                      isDarkMode
                        ? 'bg-gradient-to-r from-[#0c281a] via-[#091f14] to-[#07160f] border-emerald-500/80 border-l-4 border-l-emerald-400 shadow-[0_0_16px_rgba(74,222,128,0.15)]'
                        : 'bg-white border-emerald-300 border-l-4 border-l-emerald-600 shadow-sm'
                    ]"
                  >
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-2.5 min-w-0">
                        <div
                          :class="[
                            'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border-2 transition-colors',
                            isDarkMode
                              ? 'bg-emerald-500/25 border-emerald-400 text-[#4ade80] shadow-xs'
                              : 'bg-emerald-100 border-emerald-300 text-emerald-800'
                          ]"
                        >
                          <BookOpen :size="14" />
                        </div>
                        <h4
                          :class="[
                            'text-xs sm:text-[13.5px] font-bold truncate tracking-normal',
                            isDarkMode ? 'text-white drop-shadow-xs' : 'text-gray-900'
                          ]"
                        >
                          {{ session.courseName }}
                        </h4>
                      </div>
                      <span
                        :class="[
                          'text-xs font-bold font-mono px-2.5 py-0.5 rounded-lg border-2 shrink-0 transition-colors duration-300',
                          isDarkMode
                            ? 'bg-[#0a1811] text-[#4ade80] border-emerald-400/80 shadow-xs'
                            : 'bg-emerald-50 text-[#0c5a30] border-emerald-400 font-bold shadow-2xs'
                        ]"
                      >
                        {{ session.timeWindow }}
                      </span>
                    </div>

                    <!-- Lecturer Row -->
                    <div
                      :class="[
                        'flex items-center gap-1.5 text-[11.5px] font-medium truncate pt-0.5',
                        isDarkMode ? 'text-[#a7f3d0]' : 'text-gray-700'
                      ]"
                    >
                      <GraduationCap :size="14" :class="isDarkMode ? 'text-[#4ade80]' : 'text-[#0c5a30]'" class="shrink-0" />
                      <span class="truncate">Dosen: <strong :class="isDarkMode ? 'text-white font-bold' : 'text-gray-900 font-bold'">{{ session.instructor }}</strong> <span class="opacity-80">({{ session.courseCode }})</span></span>
                    </div>
                  </div>

                  <!-- Live Dynamic Glowing Progress Meter -->
                  <div class="space-y-1.5 pt-0.5">
                    <div class="flex items-center justify-between text-[11px] font-medium">
                      <span class="flex items-center gap-1.5" :class="isDarkMode ? 'text-[#a7f3d0]' : 'text-gray-700'">
                        <Monitor :size="13" :class="isDarkMode ? 'text-[#4ade80]' : 'text-[#0c5a30]'" />
                        <span>Okupansi PC: <strong :class="['font-bold', isDarkMode ? 'text-white' : 'text-gray-900']">{{ session.occupancy }} / {{ session.capacity }} Unit</strong></span>
                      </span>
                      <span
                        :class="[
                          'font-mono text-[10.5px] font-bold px-2 py-0.5 rounded-md border',
                          isDarkMode
                            ? 'bg-emerald-500/20 text-[#4ade80] border-emerald-500/50'
                            : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        ]"
                      >
                        {{ session.progressPercentage }}% BERJALAN
                      </span>
                    </div>

                    <div
                      :class="[
                        'w-full rounded-full h-3.5 p-0.5 overflow-hidden border-2 transition-colors duration-300',
                        isDarkMode ? 'bg-[#06110a] border-emerald-700/80 shadow-inner' : 'bg-emerald-100/80 border-emerald-300 shadow-inner'
                      ]"
                    >
                      <div
                        class="bg-gradient-to-r from-[#0c5a30] via-emerald-500 to-teal-300 h-full rounded-full transition-all duration-700 relative shadow-[0_0_14px_rgba(74,222,128,0.8)]"
                        :style="{ width: `${session.progressPercentage}%` }"
                      >
                        <!-- Glow Leading Edge Indicator -->
                        <div class="absolute right-0 top-0 bottom-0 w-2.5 rounded-full bg-white shadow-[0_0_10px_#ffffff] animate-pulse"></div>
                      </div>
                    </div>

                    <!-- Dynamic Countdown Pill with Urgency Alert -->
                    <div class="flex items-center justify-end pt-0.5">
                      <span
                        v-if="session.isExpired"
                        class="px-3 py-1 rounded-xl text-xs font-bold border-2 flex items-center gap-1.5 bg-amber-500 text-slate-950 border-amber-600 shadow-md animate-pulse font-sans"
                      >
                        <AlertTriangle :size="13" class="shrink-0 text-slate-950" />
                        <span>Menunggu Check-Out</span>
                      </span>
                      <span
                        v-else
                        :class="[
                          'px-2.5 py-1 rounded-lg font-mono text-xs font-bold border-2 flex items-center gap-1.5 transition-all shadow-xs',
                          session.remainingMinutes <= 15
                            ? isDarkMode
                              ? 'bg-amber-500/30 text-amber-300 border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.4)] animate-pulse'
                              : 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm animate-pulse font-bold'
                            : isDarkMode
                              ? 'bg-emerald-500/25 text-[#4ade80] border-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.25)]'
                              : 'bg-emerald-100 text-[#0c5a30] border-emerald-300 font-bold'
                        ]"
                      >
                        <Timer :size="13" />
                        <span>~{{ session.remainingMinutes }} mnt tersisa</span>
                        <span
                          v-if="session.remainingMinutes <= 15"
                          class="text-[9.5px] font-sans font-bold uppercase tracking-wide ml-1 flex items-center gap-1 text-amber-950 bg-amber-300 px-1.5 py-0.5 rounded shadow-2xs"
                        >
                          <Zap :size="11" class="shrink-0 fill-current" />
                          <span>SEGERA SELESAI</span>
                        </span>
                      </span>
                    </div>

                    <!-- Real-time Equipment Readiness Strip -->
                    <button
                      @click="openEquipmentModal(session)"
                      type="button"
                      :class="[
                        'w-full py-1.5 px-2.5 rounded-lg border flex items-center justify-between text-[11px] font-semibold transition-all cursor-pointer hover:opacity-90',
                        isDarkMode
                          ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200 hover:border-emerald-400'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:border-emerald-400'
                      ]"
                    >
                      <span class="flex items-center gap-1.5 truncate">
                        <Wrench :size="12" class="text-emerald-400 shrink-0" />
                        <span class="truncate">Fasilitas: <strong>{{ session.equipmentSummary.goodUnits }} / {{ session.equipmentSummary.totalUnits }} Unit Siap</strong></span>
                      </span>
                      <span
                        :class="[
                          'text-[9.5px] font-bold px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1',
                          session.equipmentSummary.healthPercentage >= 90
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        ]"
                      >
                        <span>{{ session.equipmentSummary.healthPercentage }}% Siap</span>
                        <span>&bull; Cek Alat &rarr;</span>
                      </span>
                    </button>
                  </div>
                </div>

              <!-- STATE: UPCOMING -->
              <div
                v-else-if="session.status === 'UPCOMING'"
                :class="[
                  'p-3 rounded-xl space-y-1.5 text-xs border-2 transition-colors duration-300',
                  isDarkMode
                    ? 'bg-sky-950/60 border-sky-700/70 text-sky-200'
                    : 'bg-sky-50/90 border-sky-300'
                ]"
              >
                <div class="flex items-center justify-between gap-2">
                  <span
                    :class="[
                      'text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border',
                      isDarkMode ? 'text-sky-200 bg-sky-900 border-sky-600' : 'text-white bg-sky-700 border-sky-600'
                    ]"
                  >
                    Sesi Berikutnya
                  </span>
                  <span :class="['font-mono font-bold text-xs', isDarkMode ? 'text-sky-200' : 'text-sky-900']">
                    {{ session.timeWindow }}
                  </span>
                </div>
                <h4 :class="['font-bold text-xs truncate', isDarkMode ? 'text-white' : 'text-gray-900']">
                  {{ session.courseName }}
                </h4>
                <p :class="['text-[11px] font-semibold truncate', isDarkMode ? 'text-sky-300' : 'text-gray-600']">
                  Dosen: <span :class="['font-bold', isDarkMode ? 'text-white' : 'text-gray-900']">{{ session.instructor }}</span>
                </p>

                <!-- Equipment Readiness Trigger for UPCOMING -->
                <button
                  @click="openEquipmentModal(session)"
                  type="button"
                  :class="[
                    'w-full py-1 px-2 rounded-lg border text-[10.5px] font-semibold flex items-center justify-between transition-all cursor-pointer mt-1.5',
                    isDarkMode
                      ? 'bg-sky-900/40 border-sky-600/50 text-sky-200 hover:border-sky-400'
                      : 'bg-white border-sky-200 text-sky-900 hover:border-sky-400'
                  ]"
                >
                  <span class="flex items-center gap-1.5 truncate">
                    <Wrench :size="11" class="text-sky-400 shrink-0" />
                    <span>Inventaris Alat: <strong>{{ session.equipmentSummary.goodUnits }}/{{ session.equipmentSummary.totalUnits }} Siap</strong></span>
                  </span>
                  <span class="text-[9.5px] font-bold underline">Lihat &rarr;</span>
                </button>
              </div>

              <!-- STATE: MAINTENANCE -->
              <div
                v-else-if="session.status === 'MAINTENANCE'"
                :class="[
                  'p-3 rounded-xl text-center space-y-1 border-2 transition-colors duration-300',
                  isDarkMode ? 'bg-amber-950/60 border-amber-700/70 text-amber-200' : 'text-gray-600 border-amber-300 bg-amber-50'
                ]"
              >
                <AlertTriangle :size="20" class="mx-auto text-amber-500" />
                <p :class="['text-xs font-bold', isDarkMode ? 'text-amber-300' : 'text-amber-900']">
                  Dalam Jadwal Pemeliharaan
                </p>
                <p class="text-[11px] font-medium">Pemeriksaan teknis sedang dilakukan oleh Staf Laboran.</p>
              </div>

              <!-- STATE: AVAILABLE (Substantial 3-Tile Feature Showcase with Live Data) -->
              <div v-else class="space-y-2 py-0.5">
                <div :class="['flex items-center gap-1.5 text-xs font-bold', isDarkMode ? 'text-[#4ade80]' : 'text-teal-800']">
                  <CheckCircle2 :size="15" class="shrink-0" />
                  <span>Laboratorium Terbuka & Siap Digunakan</span>
                </div>
                <!-- 3 Dynamic Feature Micro-Tiles -->
                <div class="grid grid-cols-3 gap-2 text-[10.5px]">
                  <div
                    :class="[
                      'flex flex-col items-center justify-center text-center p-2 rounded-xl border-2 font-bold transition-colors duration-300 shadow-2xs',
                      isDarkMode
                        ? 'bg-[#132c1f] border-emerald-600/60 text-[#a7f3d0]'
                        : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    ]"
                  >
                    <Monitor :size="15" :class="isDarkMode ? 'text-[#4ade80]' : 'text-emerald-700'" class="mb-1" />
                    <span class="font-bold text-[11px] leading-tight">{{ getLabPcQuantity(session) }} PC Aktif</span>
                    <span class="text-[9px] opacity-75">Siap Praktikum</span>
                  </div>
                  <div
                    :class="[
                      'flex flex-col items-center justify-center text-center p-2 rounded-xl border-2 font-bold transition-colors duration-300 shadow-2xs',
                      isDarkMode
                        ? 'bg-[#132c1f] border-emerald-600/60 text-[#a7f3d0]'
                        : 'bg-teal-50/80 border-teal-200 text-teal-950'
                    ]"
                  >
                    <Wifi :size="15" :class="isDarkMode ? 'text-[#4ade80]' : 'text-teal-700'" class="mb-1" />
                    <span class="font-bold text-[11px] leading-tight">Gigabit LAN</span>
                    <span class="text-[9px] opacity-75">Koneksi Kampus</span>
                  </div>
                  <div
                    :class="[
                      'flex flex-col items-center justify-center text-center p-2 rounded-xl border-2 font-bold transition-colors duration-300 shadow-2xs',
                      isDarkMode
                        ? 'bg-[#132c1f] border-emerald-600/60 text-[#a7f3d0]'
                        : 'bg-sky-50/80 border-sky-200 text-sky-950'
                    ]"
                  >
                    <Sparkles :size="15" :class="isDarkMode ? 'text-[#4ade80]' : 'text-sky-700'" class="mb-1" />
                    <span class="font-bold text-[11px] leading-tight">{{ session.equipmentSummary.goodUnits }} Alat Siap</span>
                    <span class="text-[9px] opacity-75">Kondisi Prima</span>
                  </div>
                </div>

                <!-- Interactive Equipment Checker Button -->
                <button
                  @click="openEquipmentModal(session)"
                  type="button"
                  :class="[
                    'w-full py-1.5 px-2.5 rounded-xl border-2 flex items-center justify-between text-[10.5px] font-bold transition-all cursor-pointer shadow-2xs hover:scale-[1.01] active:scale-[0.99]',
                    isDarkMode
                      ? 'bg-emerald-950/60 border-emerald-600/50 text-[#4ade80] hover:border-emerald-400 hover:bg-emerald-900/40'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100 hover:border-emerald-400'
                  ]"
                >
                  <span class="flex items-center gap-1.5">
                    <Wrench :size="12" class="text-emerald-500 shrink-0" />
                    <span>Status Alat: {{ session.equipmentSummary.goodUnits }}/{{ session.equipmentSummary.totalUnits }} Tersedia</span>
                  </span>
                  <span
                    :class="[
                      'px-2 py-0.5 rounded-md text-[9.5px] font-mono font-bold tracking-wide uppercase',
                      session.equipmentSummary.healthPercentage === 100
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    ]"
                  >
                    {{ session.equipmentSummary.healthPercentage }}% Kesiapan • Rincian &rarr;
                  </span>
                </button>
              </div>
            </div>

              <!-- Card Footer -->
              <div
                :class="[
                  'pt-2.5 border-t flex items-center justify-between text-xs font-bold transition-colors duration-300',
                  isDarkMode ? 'border-emerald-700/60 text-[#86efac]' : 'border-emerald-100 text-gray-600'
                ]"
              >
                <span class="flex items-center gap-1.5" :class="isDarkMode ? 'text-[#a7f3d0]' : 'text-gray-700'">
                  <Users :size="13" :class="isDarkMode ? 'text-[#4ade80]' : 'text-[#0c5a30]'" />
                  <span>Kapasitas: <strong :class="isDarkMode ? 'text-white font-bold' : 'text-gray-900 font-bold'">{{ session.capacity }} Kursi</strong></span>
                </span>
                <span
                  :class="[
                    'inline-flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase',
                    isDarkMode ? 'text-[#4ade80]' : 'text-[#0c5a30]'
                  ]"
                >
                  <ShieldCheck :size="13" :class="isDarkMode ? 'text-[#4ade80]' : 'text-emerald-700'" />
                  <span>Live Sync Aktif</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: TIMETABLE STREAM & SUMMARY (4 COLS) -->
      <div class="lg:col-span-4 flex flex-col justify-between gap-2.5 overflow-hidden h-full">
        <!-- Status Summary Ribbon (2 Vibrant Hero Tiles) -->
        <div class="grid grid-cols-2 gap-2.5 shrink-0">
          <!-- Active Labs Tile -->
          <div
            :class="[
              'p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all duration-300 shadow-md',
              isDarkMode
                ? 'bg-[#0d1f17] border-emerald-500/60 shadow-[0_0_20px_rgba(74,222,128,0.15)]'
                : 'bg-gradient-to-br from-[#0c5a30] via-emerald-700 to-teal-800 text-white border-emerald-500 shadow-md'
            ]"
          >
            <div
              :class="[
                'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border-2 transition-colors duration-300 shadow-sm',
                isDarkMode
                  ? 'bg-emerald-500/25 border-emerald-400 text-[#4ade80] shadow-[0_0_14px_rgba(74,222,128,0.3)]'
                  : 'bg-white/20 border-white/30 text-white'
              ]"
            >
              <Activity :size="22" class="animate-pulse" />
            </div>
            <div>
              <span
                :class="[
                  'text-[10.5px] font-bold uppercase tracking-wider block',
                  isDarkMode ? 'text-[#86efac]' : 'text-emerald-100'
                ]"
              >
                Sedang Dipakai
              </span>
              <span
                :class="[
                  'text-3xl font-extrabold leading-none',
                  isDarkMode
                    ? 'text-[#4ade80] drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]'
                    : 'text-white'
                ]"
              >
                {{ inUseLabsCount }}
                <span :class="['text-xs font-bold', isDarkMode ? 'text-[#a7f3d0]' : 'text-emerald-200']">Lab</span>
              </span>
            </div>
          </div>

          <!-- Available Labs Tile -->
          <div
            :class="[
              'p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all duration-300 shadow-md',
              isDarkMode
                ? 'bg-[#0d1f17] border-teal-500/60 shadow-[0_0_20px_rgba(45,212,191,0.15)]'
                : 'bg-gradient-to-br from-teal-700 via-teal-800 to-[#07371d] text-white border-teal-500 shadow-md'
            ]"
          >
            <div
              :class="[
                'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border-2 transition-colors duration-300 shadow-sm',
                isDarkMode
                  ? 'bg-teal-500/25 border-teal-400 text-[#2dd4bf] shadow-[0_0_14px_rgba(45,212,191,0.3)]'
                  : 'bg-white/20 border-white/30 text-white'
              ]"
            >
              <CheckCircle2 :size="22" />
            </div>
            <div>
              <span
                :class="[
                  'text-[10.5px] font-bold uppercase tracking-wider block',
                  isDarkMode ? 'text-[#5eead4]' : 'text-teal-100'
                ]"
              >
                Tersedia
              </span>
              <span
                :class="[
                  'text-3xl font-extrabold leading-none',
                  isDarkMode
                    ? 'text-[#2dd4bf] drop-shadow-[0_0_10px_rgba(45,212,191,0.5)]'
                    : 'text-white'
                ]"
              >
                {{ availableLabsCount }}
                <span :class="['text-xs font-bold', isDarkMode ? 'text-[#5eead4]' : 'text-teal-200']">Lab</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Today's Class Schedule Stream Container -->
        <div
          :class="[
            'p-4 rounded-2xl border-2 flex-1 flex flex-col justify-between overflow-hidden relative min-h-0 transition-colors duration-300 shadow-md',
            isDarkMode
              ? 'bg-[#0d1f17] border-emerald-600/50 shadow-xl'
              : 'bg-white/95 border-emerald-200/90 shadow-md'
          ]"
        >
          <!-- Top Accent Gradient Bar -->
          <div
            :class="[
              'absolute top-0 left-0 right-0 h-1',
              isDarkMode
                ? 'bg-gradient-to-r from-emerald-500 via-green-300 to-teal-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]'
                : 'bg-gradient-to-r from-[#0c5a30] via-emerald-400 to-teal-400'
            ]"
          />

          <!-- Header -->
          <div
            :class="[
              'flex items-center justify-between border-b pb-3 mb-2.5 shrink-0 transition-colors duration-300',
              isDarkMode ? 'border-emerald-700/60' : 'border-emerald-100'
            ]"
          >
            <h3
              :class="[
                'text-xs font-bold uppercase tracking-wide flex items-center gap-2',
                isDarkMode ? 'text-white' : 'text-[#0c5a30]'
              ]"
            >
              <div
                :class="[
                  'w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-300 shadow-xs',
                  isDarkMode
                    ? 'bg-emerald-500/25 text-[#4ade80] border-2 border-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.3)]'
                    : 'bg-gradient-to-br from-[#0c5a30] to-[#07371d] text-white'
                ]"
              >
                <Calendar :size="14" />
              </div>
              <span>Jadwal Perkuliahan Hari Ini</span>
            </h3>
            <span
              :class="[
                'text-[10.5px] font-bold px-3 py-1 rounded-full border-2 transition-colors duration-300 shadow-xs tracking-wide',
                isDarkMode
                  ? 'text-[#4ade80] bg-emerald-500/25 border-emerald-400/70 shadow-[0_0_10px_rgba(74,222,128,0.25)]'
                  : 'text-white bg-gradient-to-r from-[#0c5a30] to-emerald-700 border-emerald-600'
              ]"
            >
              {{ todayTimetableStream.length }} SESI
            </span>
          </div>

          <!-- Stream List with Sleek Scrollbar -->
          <div class="space-y-2.5 overflow-y-auto flex-1 pr-1 custom-scrollbar min-h-0">
            <div
              v-for="item in todayTimetableStream"
              :key="item.id"
              :class="[
                'rounded-xl border-2 transition-all text-xs overflow-hidden shadow-xs relative group',
                item.isOngoing
                  ? isDarkMode
                    ? 'border-amber-500/80 bg-gradient-to-r from-amber-950/70 via-[#191910] to-[#0d1f17] shadow-[0_0_16px_rgba(245,158,11,0.2)]'
                    : 'border-amber-400 bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-white shadow-md'
                  : isDarkMode
                    ? item.type === 'REQUEST'
                      ? 'border-sky-700/60 bg-gradient-to-r from-sky-950/80 to-[#0d1f17] hover:border-sky-500'
                      : 'border-emerald-700/60 bg-gradient-to-r from-emerald-950/80 to-[#0d1f17] hover:border-emerald-500'
                    : item.type === 'REQUEST'
                      ? 'border-sky-200 bg-gradient-to-r from-sky-50 to-white hover:border-sky-300 hover:shadow-xs'
                      : 'border-emerald-200 bg-gradient-to-r from-emerald-50/80 to-white hover:border-emerald-300 hover:shadow-xs'
              ]"
            >
              <!-- Left Accent Bar -->
              <div class="flex">
                <div
                  :class="[
                    'w-1.5 shrink-0 rounded-l-lg',
                    item.isOngoing
                      ? 'bg-gradient-to-b from-amber-400 via-orange-500 to-amber-600 shadow-[2px_0_12px_rgba(245,158,11,0.4)]'
                      : item.type === 'REQUEST'
                        ? 'bg-gradient-to-b from-sky-400 via-blue-500 to-sky-600'
                        : 'bg-gradient-to-b from-emerald-500 via-green-600 to-teal-500'
                  ]"
                />

                <!-- Card Content -->
                <div class="flex-1 p-3 space-y-1.5">
                  <!-- Row 1: Time + Live Pill + Room Badge -->
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-1.5">
                      <Clock
                        :size="13"
                        :class="[
                          item.isOngoing
                            ? 'text-amber-500 animate-pulse'
                            : isDarkMode
                              ? item.type === 'REQUEST' ? 'text-sky-400' : 'text-[#4ade80]'
                              : item.type === 'REQUEST' ? 'text-sky-600' : 'text-emerald-700'
                        ]"
                      />
                      <span
                        :class="[
                          'font-bold font-mono text-[13px] tracking-normal',
                          item.isOngoing
                            ? isDarkMode
                              ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                              : 'text-amber-900'
                            : isDarkMode
                              ? item.type === 'REQUEST'
                                ? 'text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]'
                                : 'text-[#4ade80] drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]'
                              : item.type === 'REQUEST' ? 'text-sky-800' : 'text-[#0c5a30]'
                        ]"
                      >
                        {{ item.startTime }} – {{ item.endTime }} WIB
                      </span>
                    </div>

                    <div class="flex items-center gap-1.5 shrink-0">
                      <!-- Live Ongoing Pill -->
                      <span
                        v-if="item.isOngoing"
                        :class="[
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wider border shrink-0',
                          isDarkMode
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                            : 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs animate-pulse font-bold'
                        ]"
                      >
                        <Radio :size="10" class="animate-pulse" />
                        Live
                      </span>

                      <!-- Room Code Badge -->
                      <span
                        :class="[
                          'px-2.5 py-0.5 rounded-lg font-mono text-[10.5px] font-bold border-2 shrink-0 transition-colors',
                          item.isOngoing
                            ? isDarkMode
                              ? 'bg-amber-500/20 text-amber-300 border-amber-400/70 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                              : 'bg-amber-100 text-amber-950 border-amber-300 shadow-xs'
                            : item.type === 'REQUEST'
                              ? isDarkMode
                                ? 'bg-sky-500/20 text-sky-300 border-sky-500/70'
                                : 'bg-sky-100 text-sky-900 border-sky-300 shadow-xs'
                              : isDarkMode
                                ? 'bg-emerald-500/20 text-[#4ade80] border-emerald-400/70'
                                : 'bg-emerald-100 text-[#0c5a30] border-emerald-300 shadow-xs'
                        ]"
                      >
                        {{ item.roomCode }}
                      </span>
                    </div>
                  </div>

                  <!-- Row 2: Course Name -->
                  <div class="flex items-start gap-1.5">
                    <GraduationCap
                      :size="14"
                      :class="[
                        'shrink-0 mt-0.5',
                        item.isOngoing
                          ? 'text-amber-500'
                          : isDarkMode
                            ? item.type === 'REQUEST' ? 'text-sky-400' : 'text-[#4ade80]'
                            : item.type === 'REQUEST' ? 'text-sky-700' : 'text-emerald-700'
                      ]"
                    />
                    <h4
                      :class="[
                        'font-bold text-[13px] leading-snug line-clamp-2',
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      ]"
                    >
                      {{ item.title }}
                    </h4>
                  </div>

                  <!-- Row 3: Lecturer + Type Badge -->
                  <div class="flex items-center justify-between gap-2">
                    <p
                      :class="[
                        'text-[11px] font-medium truncate flex items-center gap-1',
                        isDarkMode ? 'text-[#a7f3d0]' : 'text-gray-700'
                      ]"
                    >
                      <Users
                        :size="11"
                        :class="[
                          item.isOngoing
                            ? 'text-amber-500'
                            : isDarkMode
                              ? item.type === 'REQUEST' ? 'text-sky-400' : 'text-emerald-400'
                              : item.type === 'REQUEST' ? 'text-sky-600' : 'text-emerald-700'
                        ]"
                        class="shrink-0"
                      />
                      <span>{{ item.subtitle }}</span>
                    </p>
                    <div class="flex items-center gap-1 shrink-0">
                      <span
                        v-if="item.isOngoing"
                        :class="[
                          'text-[9.5px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full border shrink-0',
                          isDarkMode
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/50'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        ]"
                      >
                        Berlangsung
                      </span>
                      <span
                        v-if="item.type === 'REQUEST'"
                        :class="[
                          'text-[9.5px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full border shrink-0',
                          isDarkMode
                            ? 'bg-sky-500/15 text-sky-300 border-sky-500/50'
                            : 'bg-sky-100 text-sky-800 border-sky-300'
                        ]"
                      >
                        Peminjaman
                      </span>
                      <span
                        v-else
                        :class="[
                          'text-[9.5px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full border shrink-0',
                          isDarkMode
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/50'
                            : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        ]"
                      >
                        Terjadwal
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Clean Dignified Empty State for Schedule Stream -->
            <div
              v-if="todayTimetableStream.length === 0"
              class="py-8 px-4 text-center space-y-3 flex-1 flex flex-col items-center justify-center h-full"
            >
              <div
                :class="[
                  'w-12 h-12 rounded-2xl border-2 flex items-center justify-center shadow-xs transition-colors',
                  isDarkMode
                    ? 'bg-[#122b1f] border-emerald-400 text-[#4ade80] shadow-[0_0_14px_rgba(74,222,128,0.3)]'
                    : 'bg-emerald-50 border-emerald-300 text-[#0c5a30] shadow-sm'
                ]"
              >
                <CheckCircle2 :size="24" />
              </div>
              <div class="space-y-1">
                <h4 :class="['text-xs sm:text-sm font-bold', isDarkMode ? 'text-white' : 'text-[#0c5a30]']">
                  {{ totalTodaySchedulesCount > 0 ? 'Semua Sesi Hari Ini Selesai' : 'Tidak Ada Jadwal Sesi Hari Ini' }}
                </h4>
                <p :class="['text-[11.5px] font-normal leading-relaxed max-w-xs mx-auto', isDarkMode ? 'text-emerald-200/90' : 'text-gray-600']">
                  {{
                    totalTodaySchedulesCount > 0
                      ? 'Seluruh jadwal perkuliahan dan peminjaman laboratorium untuk hari ini telah rampung dilaksanakan.'
                      : 'Seluruh ruangan laboratorium terbuka untuk kegiatan riset dan belajar mandiri mahasiswa.'
                  }}
                </p>
              </div>
              <div
                :class="[
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10.5px] font-semibold shadow-2xs mt-1',
                  isDarkMode
                    ? 'bg-[#132c1f] border-emerald-600/60 text-[#a7f3d0]'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                ]"
              >
                <Calendar :size="12" :class="isDarkMode ? 'text-[#4ade80]' : 'text-[#0c5a30]'" />
                <span>{{ totalTodaySchedulesCount > 0 ? 'Sesi Hari Ini Selesai • Buka Kembali Besok Pagi 07:00 WIB' : 'Jam Operasional: 07:00 – 21:00 WIB' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. SEPARATE DEDICATED WIDGET: PUSAT INFORMASI & LAYANAN LAB (Single Card Showcase - Tidak Menumpuk) -->
        <div
          :class="[
            'p-3.5 rounded-2xl border-2 flex flex-col justify-between overflow-hidden relative shrink-0 transition-all duration-300 shadow-md',
            isDarkMode
              ? 'bg-[#0d1f17] border-emerald-600/50 shadow-xl'
              : 'bg-white/95 border-emerald-200/90 shadow-md'
          ]"
          style="min-height: 200px; height: 215px;"
        >
          <!-- Top Accent Gradient Bar -->
          <div
            :class="[
              'absolute top-0 left-0 right-0 h-1',
              isDarkMode
                ? 'bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.5)]'
                : 'bg-gradient-to-r from-[#0c5a30] via-teal-500 to-emerald-400'
            ]"
          />

          <!-- Widget Header & Tab Switchers (Eliminates Vertical Stacking!) -->
          <div
            :class="[
              'flex items-center justify-between border-b pb-2 shrink-0 transition-colors',
              isDarkMode ? 'border-emerald-700/60' : 'border-emerald-100'
            ]"
          >
            <div class="flex items-center gap-2">
              <div
                :class="[
                  'w-6 h-6 rounded-lg flex items-center justify-center transition-colors shadow-2xs',
                  isDarkMode
                    ? 'bg-teal-500/25 text-[#5eead4] border border-teal-400/60'
                    : 'bg-gradient-to-br from-[#0c5a30] to-[#07371d] text-white'
                ]"
              >
                <Info :size="13" />
              </div>
              <span
                :class="[
                  'text-xs font-bold uppercase tracking-wider',
                  isDarkMode ? 'text-white' : 'text-[#0c5a30]'
                ]"
              >
                Informasi & Layanan Lab
              </span>
            </div>

            <!-- Slide Tab Navigation Buttons -->
            <div class="flex items-center gap-1">
              <button
                v-for="(slide, index) in infoSlides"
                :key="slide.id"
                @click="setInfoSlide(index)"
                :class="[
                  'px-2.5 py-1 rounded-lg text-[10.5px] font-semibold transition-all flex items-center gap-1 cursor-pointer tracking-wide',
                  activeInfoSlide === index
                    ? isDarkMode
                      ? 'bg-emerald-500/30 text-[#4ade80] border border-emerald-400/80 shadow-[0_0_8px_rgba(74,222,128,0.3)]'
                      : 'bg-[#0c5a30] text-white shadow-xs'
                    : isDarkMode
                      ? 'text-emerald-300/70 hover:text-white bg-transparent'
                      : 'text-gray-600 hover:text-[#0c5a30] hover:bg-emerald-50'
                ]"
                :title="slide.title"
              >
                <span v-if="activeInfoSlide === index" class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span>{{ slide.tab }}</span>
              </button>
            </div>
          </div>

          <!-- Active Slide Showcase Card (Single Card, Never Stacks!) -->
          <transition name="fade" mode="out-in">
            <div :key="activeInfoSlide" class="py-2 px-1 flex-1 flex flex-col justify-between min-h-0">
              <!-- Top Row: Icon + Title + Badge -->
              <div class="flex items-start justify-between gap-2.5">
                <div class="flex items-start gap-2.5 min-w-0">
                  <div
                    :class="[
                      'w-9 h-9 rounded-xl border-2 flex items-center justify-center shrink-0 shadow-xs transition-colors',
                      currentInfoSlide.iconBg
                    ]"
                  >
                    <component :is="currentInfoSlide.icon" :size="18" :class="currentInfoSlide.iconColor" />
                  </div>
                  <div class="min-w-0">
                    <h5
                      :class="[
                        'text-xs sm:text-[13px] font-bold truncate leading-snug',
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      ]"
                    >
                      {{ currentInfoSlide.title }}
                    </h5>
                    <p
                      :class="[
                        'text-[11px] mt-0.5 leading-relaxed line-clamp-2 font-normal',
                        isDarkMode ? 'text-emerald-100/80' : 'text-gray-600'
                      ]"
                    >
                      {{ currentInfoSlide.description }}
                    </p>
                  </div>
                </div>

                <span
                  :class="[
                    'text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shrink-0 shadow-xs uppercase tracking-wide',
                    currentInfoSlide.badgeClass
                  ]"
                >
                  {{ currentInfoSlide.badge }}
                </span>
              </div>

              <!-- Highlight Pill Box -->
              <div
                :class="[
                  'px-2.5 py-1.5 rounded-xl border flex items-center gap-2 text-[10.5px] font-medium mt-1.5 transition-colors',
                  isDarkMode
                    ? 'bg-[#0a1811] border-emerald-800/80 text-[#86efac]'
                    : 'bg-emerald-50/80 border-emerald-200/80 text-emerald-950'
                ]"
              >
                <Sparkles :size="12" class="text-amber-500 shrink-0" />
                <span class="truncate">{{ currentInfoSlide.highlight }}</span>
              </div>
            </div>
          </transition>

          <!-- Widget Footer: Slide Indicators & Controls -->
          <div
            :class="[
              'pt-2 border-t flex items-center justify-between text-[10px] font-semibold shrink-0 transition-colors',
              isDarkMode ? 'border-emerald-700/60 text-emerald-300' : 'border-emerald-100 text-gray-500'
            ]"
          >
            <!-- Progress / Auto-Rotate Dots -->
            <div class="flex items-center gap-1.5">
              <button
                v-for="(_, idx) in infoSlides"
                :key="idx"
                @click="setInfoSlide(idx)"
                :class="[
                  'h-1.5 rounded-full transition-all duration-500 cursor-pointer',
                  activeInfoSlide === idx
                    ? 'w-6 bg-emerald-600 dark:bg-emerald-400'
                    : 'w-1.5 bg-gray-300 dark:bg-emerald-900 hover:bg-emerald-400'
                ]"
                :aria-label="'Slide ' + (idx + 1)"
              />
              <span class="text-[9.5px] font-mono ml-1.5 opacity-80">
                ROTASI OTOMATIS
              </span>
            </div>

            <!-- Arrows to switch slides manually -->
            <div class="flex items-center gap-1">
              <span class="text-[9.5px] font-mono mr-1 opacity-75">
                {{ activeInfoSlide + 1 }} / {{ infoSlides.length }}
              </span>
              <button
                @click="prevInfoSlide"
                class="p-1 rounded-md border hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors cursor-pointer"
                :class="isDarkMode ? 'border-emerald-800 text-emerald-300' : 'border-gray-200 text-gray-700'"
                title="Slide Sebelumnya"
                aria-label="Previous Slide"
              >
                <ChevronLeft :size="12" />
              </button>
              <button
                @click="nextInfoSlide"
                class="p-1 rounded-md border hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors cursor-pointer"
                :class="isDarkMode ? 'border-emerald-800 text-emerald-300' : 'border-gray-200 text-gray-700'"
                title="Slide Berikutnya"
                aria-label="Next Slide"
              >
                <ChevronRight :size="12" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 3. FOOTER ANNOUNCEMENT MARQUEE -->
    <footer
      :class="[
        'backdrop-blur-md px-4.5 py-2.5 rounded-2xl flex items-center gap-3 shrink-0 relative z-10 overflow-hidden border-2 transition-colors duration-300 shadow-xl',
        isDarkMode
          ? 'bg-[#07160f] border-emerald-500/70'
          : 'bg-gradient-to-r from-[#07371d] via-[#0c5a30] to-[#07371d] text-white border-amber-400/90'
      ]"
    >
      <div
        class="flex items-center gap-1.5 px-3.5 py-1 rounded-xl text-xs font-bold shrink-0 border transition-colors duration-300 shadow-md bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-slate-950 border-amber-200 tracking-wide"
      >
        <Megaphone :size="14" class="text-amber-950 shrink-0 animate-bounce" />
        <span class="tracking-wide">PENGUMUMAN RESMI FIK</span>
      </div>
      <div
        class="overflow-hidden whitespace-nowrap flex-1 text-xs font-semibold tracking-normal ticker-fade-mask text-emerald-50 drop-shadow-sm pl-2"
      >
        <div class="inline-block animate-marquee">
          {{ activeAnnouncementText }}
        </div>
      </div>
    </footer>

    <!-- 4. LIVE EQUIPMENT INSPECTOR MODAL (POPUP REAL-TIME DIALOG) -->
    <Teleport to="body">
      <transition name="fade">
        <div
          v-if="isEquipmentModalOpen && selectedLabForEquipment"
          class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md"
          @click.self="closeEquipmentModal"
        >
          <div
            :class="[
              'w-full max-w-4xl max-h-[90vh] rounded-2xl border-2 flex flex-col shadow-2xl overflow-hidden relative transition-all duration-300',
              isDarkMode
                ? 'bg-[#081710] border-emerald-500 text-white shadow-[0_0_50px_rgba(74,222,128,0.25)]'
                : 'bg-white border-emerald-600 text-gray-900 shadow-2xl'
            ]"
          >
            <!-- Modal Accent Top Line -->
            <div
              :class="[
                'h-1.5 w-full shrink-0',
                isDarkMode
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400'
                  : 'bg-gradient-to-r from-[#0c5a30] via-emerald-600 to-teal-500'
              ]"
            />

            <!-- Modal Header -->
            <div
              :class="[
                'px-5 py-4 border-b flex items-start justify-between gap-3 shrink-0',
                isDarkMode ? 'border-emerald-800/80 bg-[#0c2419]' : 'border-emerald-100 bg-emerald-50/60'
              ]"
            >
              <div class="space-y-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span
                    :class="[
                      'px-2.5 py-0.5 rounded-lg font-mono text-xs font-bold border-2',
                      isDarkMode
                        ? 'bg-emerald-500/25 border-emerald-400 text-[#4ade80]'
                        : 'bg-emerald-600 border-emerald-700 text-white'
                    ]"
                  >
                    {{ selectedLabForEquipment.labCode }}
                  </span>
                  <h3 class="text-base sm:text-lg font-bold tracking-tight">
                    {{ selectedLabForEquipment.labName }}
                  </h3>
                  <span
                    :class="[
                      'text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1',
                      selectedLabForEquipment.status === 'IN_USE'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : selectedLabForEquipment.status === 'AVAILABLE'
                          ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                          : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    ]"
                  >
                    <span class="w-2 h-2 rounded-full bg-current"></span>
                    <span>{{ selectedLabForEquipment.status }}</span>
                  </span>
                </div>
                <p :class="['text-xs font-medium flex items-center gap-1.5', isDarkMode ? 'text-emerald-200/80' : 'text-emerald-800']">
                  <MapPin :size="13" class="shrink-0" />
                  <span>{{ selectedLabForEquipment.location }} &bull; Kapasitas: {{ selectedLabForEquipment.capacity }} Kursi</span>
                </p>
              </div>

              <!-- Close Button -->
              <button
                @click="closeEquipmentModal"
                type="button"
                :class="[
                  'p-2 rounded-xl border-2 transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0',
                  isDarkMode
                    ? 'bg-white/10 hover:bg-white/20 border-emerald-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700'
                ]"
                title="Tutup Modal"
                aria-label="Tutup"
              >
                <X :size="18" />
              </button>
            </div>

            <!-- Lab Switcher Tabs -->
            <div
              :class="[
                'px-5 py-2 border-b flex items-center gap-1.5 overflow-x-auto shrink-0 custom-scrollbar',
                isDarkMode ? 'border-emerald-900 bg-[#06120c]' : 'border-gray-100 bg-gray-50'
              ]"
            >
              <span class="text-[11px] font-bold uppercase tracking-wider opacity-70 shrink-0 mr-1">
                Pilih Lab:
              </span>
              <button
                v-for="labSession in liveLabSessions"
                :key="labSession.id"
                @click="selectedLabForEquipment = labSession"
                type="button"
                :class="[
                  'px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 border',
                  selectedLabForEquipment.id === labSession.id
                    ? isDarkMode
                      ? 'bg-emerald-500/30 text-[#4ade80] border-emerald-400 shadow-xs'
                      : 'bg-[#0c5a30] text-white border-emerald-700 shadow-xs'
                    : isDarkMode
                      ? 'bg-[#0d2117] text-emerald-300 border-emerald-800 hover:border-emerald-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-400'
                ]"
              >
                <span>{{ labSession.labCode }}</span>
                <span
                  :class="[
                    'w-1.5 h-1.5 rounded-full',
                    labSession.equipmentSummary.healthPercentage === 100 ? 'bg-emerald-400' : 'bg-amber-400'
                  ]"
                />
              </button>
            </div>

            <!-- Modal Body (Scrollable) -->
            <div class="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              <!-- Summary Health Banner -->
              <div
                :class="[
                  'p-4 rounded-xl border-2 space-y-3',
                  isDarkMode ? 'bg-[#0d261a] border-emerald-600/60' : 'bg-emerald-50 border-emerald-200'
                ]"
              >
                <div class="flex items-center justify-between gap-3 flex-wrap">
                  <div class="flex items-center gap-2">
                    <Wrench :size="18" :class="isDarkMode ? 'text-[#4ade80]' : 'text-emerald-700'" />
                    <h4 class="text-sm font-bold tracking-tight">
                      Indeks Kesiapan & Kelaikan Peralatan Lab
                    </h4>
                  </div>
                  <span
                    :class="[
                      'px-3 py-1 rounded-full font-mono text-xs font-bold border-2',
                      selectedLabForEquipment.equipmentSummary.healthPercentage === 100
                        ? isDarkMode
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                          : 'bg-emerald-600 text-white border-emerald-700'
                        : isDarkMode
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                          : 'bg-amber-500 text-slate-950 border-amber-600'
                    ]"
                  >
                    {{ selectedLabForEquipment.equipmentSummary.healthPercentage }}% SIAP DIGUNAKAN
                  </span>
                </div>

                <!-- Progress Bar -->
                <div
                  :class="[
                    'w-full rounded-full h-3 p-0.5 overflow-hidden border',
                    isDarkMode ? 'bg-black/40 border-emerald-800' : 'bg-white border-emerald-200'
                  ]"
                >
                  <div
                    class="bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-300 h-full rounded-full transition-all duration-500"
                    :style="{ width: `${selectedLabForEquipment.equipmentSummary.healthPercentage}%` }"
                  />
                </div>

                <!-- 4 Quick Counter Badges -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div
                    :class="[
                      'p-2.5 rounded-lg border text-center font-bold',
                      isDarkMode ? 'bg-[#07170f] border-emerald-800/80 text-white' : 'bg-white border-emerald-100 text-gray-900'
                    ]"
                  >
                    <span class="text-[10.5px] block opacity-75 font-normal">Total Peralatan</span>
                    <span class="text-base font-mono font-bold">{{ selectedLabForEquipment.equipmentSummary.totalUnits }} Unit</span>
                  </div>
                  <div
                    :class="[
                      'p-2.5 rounded-lg border text-center font-bold',
                      isDarkMode ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' : 'bg-emerald-100/70 border-emerald-300 text-emerald-950'
                    ]"
                  >
                    <span class="text-[10.5px] block opacity-75 font-normal">Kondisi Baik</span>
                    <span class="text-base font-mono font-bold">{{ selectedLabForEquipment.equipmentSummary.goodUnits }} Unit</span>
                  </div>
                  <div
                    :class="[
                      'p-2.5 rounded-lg border text-center font-bold',
                      isDarkMode ? 'bg-amber-950/40 border-amber-500/50 text-amber-300' : 'bg-amber-100/70 border-amber-300 text-amber-950'
                    ]"
                  >
                    <span class="text-[10.5px] block opacity-75 font-normal">Dalam Pemeliharaan</span>
                    <span class="text-base font-mono font-bold">{{ selectedLabForEquipment.equipmentSummary.maintenanceUnits }} Unit</span>
                  </div>
                  <div
                    :class="[
                      'p-2.5 rounded-lg border text-center font-bold',
                      isDarkMode ? 'bg-rose-950/40 border-rose-500/50 text-rose-300' : 'bg-rose-100/70 border-rose-300 text-rose-950'
                    ]"
                  >
                    <span class="text-[10.5px] block opacity-75 font-normal">Rusak / Trouble</span>
                    <span class="text-base font-mono font-bold">{{ selectedLabForEquipment.equipmentSummary.damagedUnits }} Unit</span>
                  </div>
                </div>
              </div>

              <!-- Equipment Items Grid -->
              <div class="space-y-2">
                <h5 class="text-xs font-bold uppercase tracking-wider opacity-80 flex items-center gap-1.5">
                  <Activity :size="13" />
                  <span>Daftar Fasilitas & Inventaris Real-Time</span>
                </h5>

                <!-- Empty state if no equipment found -->
                <div
                  v-if="selectedLabForEquipment.equipmentSummary.items.length === 0"
                  :class="[
                    'p-6 text-center rounded-xl border-2 border-dashed space-y-2',
                    isDarkMode ? 'border-emerald-800 text-emerald-300' : 'border-gray-200 text-gray-500'
                  ]"
                >
                  <Wrench :size="28" class="mx-auto opacity-50" />
                  <p class="text-xs font-medium">Belum ada rincian peralatan yang terdata untuk laboratorium ini.</p>
                </div>

                <!-- Items list -->
                <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div
                    v-for="item in selectedLabForEquipment.equipmentSummary.items"
                    :key="item.id"
                    :class="[
                      'p-3 rounded-xl border-2 transition-all flex items-start gap-3 shadow-xs',
                      isDarkMode
                        ? 'bg-[#0d2218] border-emerald-700/60 hover:border-emerald-500'
                        : 'bg-white border-gray-200 hover:border-emerald-300'
                    ]"
                  >
                    <!-- Item Icon -->
                    <div
                      :class="[
                        'w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs',
                        isDarkMode
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-[#4ade80]'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      ]"
                    >
                      <component :is="getEquipmentIcon(item.name, item.category)" :size="20" />
                    </div>

                    <!-- Item Details -->
                    <div class="flex-1 min-w-0 space-y-1">
                      <div class="flex items-center justify-between gap-1.5">
                        <h6 class="font-bold text-xs sm:text-[13px] truncate">
                          {{ item.name }}
                        </h6>
                        <span class="font-mono text-xs font-bold px-2 py-0.5 rounded-md border shrink-0"
                          :class="isDarkMode ? 'bg-black/30 border-emerald-700/70 text-emerald-200' : 'bg-gray-100 border-gray-300 text-gray-800'"
                        >
                          {{ item.quantity }} Unit
                        </span>
                      </div>

                      <div class="flex items-center gap-1.5 flex-wrap text-[10.5px]">
                        <span
                          :class="[
                            'font-mono px-1.5 py-0.2 rounded border font-semibold',
                            isDarkMode ? 'bg-[#06140d] border-emerald-800 text-emerald-300' : 'bg-gray-50 border-gray-200 text-gray-600'
                          ]"
                        >
                          {{ item.code }}
                        </span>
                        <span class="opacity-60">&bull;</span>
                        <span class="opacity-80">{{ item.category }}</span>
                      </div>

                      <!-- Status Badge -->
                      <div class="pt-0.5">
                        <span
                          v-if="item.condition === 'GOOD'"
                          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                        >
                          <CheckCircle2 :size="11" />
                          <span>Siap Pakai (Kondisi Baik)</span>
                        </span>
                        <span
                          v-else-if="item.condition === 'UNDER_MAINTENANCE'"
                          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50"
                        >
                          <AlertTriangle :size="11" />
                          <span>Dalam Perawatan / Maintenance</span>
                        </span>
                        <span
                          v-else
                          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50"
                        >
                          <AlertTriangle :size="11" />
                          <span>Rusak (Perlu Perbaikan)</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div
              :class="[
                'px-5 py-3 border-t flex items-center justify-between gap-3 shrink-0',
                isDarkMode ? 'border-emerald-800/80 bg-[#0c2419]' : 'border-gray-200 bg-gray-50'
              ]"
            >
              <div class="flex items-center gap-1.5 text-xs opacity-75">
                <ShieldCheck :size="14" class="text-emerald-500" />
                <span>Data tersinkronisasi otomatis via WebSocket Display Center</span>
              </div>
              <button
                @click="closeEquipmentModal"
                type="button"
                :class="[
                  'px-4 py-1.5 rounded-xl font-bold text-xs border-2 transition-all cursor-pointer active:scale-95',
                  isDarkMode
                    ? 'bg-emerald-500 text-gray-950 border-emerald-400 hover:bg-emerald-400'
                    : 'bg-[#0c5a30] text-white border-emerald-700 hover:bg-[#07371d]'
                ]"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style scoped>
.ticker-fade-mask {
  mask-image: linear-gradient(to right, transparent 0%, black 3.5%, black 96.5%, transparent 100%);
  -webkit-mask-image: linear-gradient(to right, transparent 0%, black 3.5%, black 96.5%, transparent 100%);
}

@keyframes pulse-slow {
  0%, 100% {
    opacity: 0.75;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.06);
  }
}
.animate-pulse-slow {
  animation: pulse-slow 8s ease-in-out infinite;
}

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

/* Smooth fade transition for info slide showcase */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
