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
  ChevronUp,
  ChevronDown,
  RotateCcw,
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
let kioskHygieneTimer: number | null = null

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

// Static DateTimeFormat singletons to eliminate ICU formatter allocations on 24/7 TV displays
const staticTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

const staticDateFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const staticHourFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Jakarta',
  hour: '2-digit',
  hour12: false,
})

// Date navigation state
const selectedDate = ref<Date>(new Date())
const autoResetSeconds = ref(60)
let autoResetInterval: number | null = null

// Formatter for Jakarta YMD (YYYY-MM-DD)
const getJakartaYMD = (d: Date): string => {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d)
  } catch {
    const year = d.getFullYear()
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}

const isViewingToday = computed(() => {
  return getJakartaYMD(selectedDate.value) === getJakartaYMD(now.value)
})

const tomorrowDate = computed(() => {
  const d = new Date(now.value)
  d.setDate(d.getDate() + 1)
  return d
})

const dayAfterTomorrowDate = computed(() => {
  const d = new Date(now.value)
  d.setDate(d.getDate() + 2)
  return d
})

const isViewingTomorrow = computed(() => {
  return getJakartaYMD(selectedDate.value) === getJakartaYMD(tomorrowDate.value)
})

const isViewingDayAfter = computed(() => {
  return getJakartaYMD(selectedDate.value) === getJakartaYMD(dayAfterTomorrowDate.value)
})

const formattedSelectedDate = computed(() => {
  return staticDateFormatter.format(selectedDate.value)
})

const daysOfWeekList = [
  { day: 1, name: 'Senin', short: 'Sen' },
  { day: 2, name: 'Selasa', short: 'Sel' },
  { day: 3, name: 'Rabu', short: 'Rab' },
  { day: 4, name: 'Kamis', short: 'Kam' },
  { day: 5, name: 'Jumat', short: 'Jum' },
  { day: 6, name: 'Sabtu', short: 'Sab' },
]

const currentSelectedDayOfWeek = computed(() => {
  return selectedDate.value.getDay()
})

const getMondayOfWeek = (date: Date): Date => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d
}

const resetAutoResetTimer = () => {
  autoResetSeconds.value = 60
  if (autoResetInterval) {
    clearInterval(autoResetInterval)
  }
  autoResetInterval = window.setInterval(() => {
    if (isViewingToday.value) {
      if (autoResetInterval) clearInterval(autoResetInterval)
      return
    }
    if (autoResetSeconds.value > 1) {
      autoResetSeconds.value--
    } else {
      goToToday()
    }
  }, 1000)
}

const selectDayOfWeek = (targetDay: number) => {
  const monday = getMondayOfWeek(selectedDate.value)
  const newDate = new Date(monday)
  newDate.setDate(monday.getDate() + (targetDay - 1))
  selectedDate.value = newDate
  resetAutoResetTimer()
  fetchDisplayData()
}

const prevWeek = () => {
  const d = new Date(selectedDate.value)
  d.setDate(d.getDate() - 7)
  selectedDate.value = d
  resetAutoResetTimer()
  fetchDisplayData()
}

const nextWeek = () => {
  const d = new Date(selectedDate.value)
  d.setDate(d.getDate() + 7)
  selectedDate.value = d
  resetAutoResetTimer()
  fetchDisplayData()
}

const goToToday = () => {
  selectedDate.value = new Date(now.value)
  if (autoResetInterval) {
    clearInterval(autoResetInterval)
    autoResetInterval = null
  }
  autoResetSeconds.value = 60
  fetchDisplayData()
}

const goToTomorrow = () => {
  selectedDate.value = new Date(tomorrowDate.value)
  resetAutoResetTimer()
  fetchDisplayData()
}

const goToDayAfterTomorrow = () => {
  selectedDate.value = new Date(dayAfterTomorrowDate.value)
  resetAutoResetTimer()
  fetchDisplayData()
}

// Fetch display data with mutex guard against overlapping requests
let isFetching = false
const fetchDisplayData = async () => {
  if (isFetching) return
  isFetching = true
  try {
    const ymd = getJakartaYMD(selectedDate.value)
    const dayOfWeek = selectedDate.value.getDay()
    const data = await displayService.getDisplayData({
      date: ymd,
      day_of_week: dayOfWeek,
    })
    displayData.value = data
  } catch (err) {
    console.error('Failed to fetch display data:', err)
  } finally {
    isFetching = false
    isLoading.value = false
  }
}

// Indonesian WIB Date & Time (Optimized using static formatters)
const formattedTime = computed(() => {
  return staticTimeFormatter.format(now.value)
})

const formattedDate = computed(() => {
  return staticDateFormatter.format(now.value)
})

// Current Session Phase (Pagi, Siang, Sore, Malam)
const currentSessionPhase = computed(() => {
  try {
    const h = parseInt(staticHourFormatter.format(now.value), 10)
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

    // When inspecting another day, there are no live check-in sessions running right now
    if (!isViewingToday.value) {
      const firstSchedule = schedules?.find(
        (s: DisplayScheduleDto) => s.laboratory?.id === lab.id && s.status !== 'CANCELLED',
      )
      const firstRequest = room_requests?.find((r: DisplayRoomRequestDto) => r.laboratory?.id === lab.id)
      if (firstSchedule || firstRequest) {
        const startTimeStr = extractTimeString(firstSchedule?.start_time || firstRequest?.start_time)
        const endTimeStr = extractTimeString(firstSchedule?.end_time || firstRequest?.end_time)
        return {
          id: lab.id,
          labId: lab.id,
          labName: lab.name,
          labCode: lab.code,
          location: lab.location,
          courseName: firstSchedule?.course_name || firstRequest?.activity_name || 'Jadwal Terdaftar',
          courseCode: firstSchedule?.class_name || firstRequest?.course_name || 'TERJADWAL',
          instructor: firstSchedule?.lecturer_name || firstRequest?.applicant?.full_name || 'Dosen Pengajar',
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
      return {
        id: lab.id,
        labId: lab.id,
        labName: lab.name,
        labCode: lab.code,
        location: lab.location,
        courseName: 'Terbuka untuk Reservasi & Belajar',
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
const totalLabsCount = computed(() => Math.max(8, displayData.value?.laboratories?.length || 8))
const inUseLabsCount = computed(() => {
  const fromLive = liveLabSessions.value.filter((s) => s.status === 'IN_USE').length
  return fromLive > 0 ? fromLive : activeInUseSessions.value.length
})
const availableLabsCount = computed(() => {
  return Math.max(0, totalLabsCount.value - inUseLabsCount.value)
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
  const realCount = schedCount + reqCount
  if (realCount === 0) {
    return 16
  }
  return realCount
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

      // Strict expiration: If viewing today and current time has reached or passed end time, omit from timetable completely
      if (isViewingToday.value && currentMinutes >= endMin) {
        return
      }

      // Check if there is an active check-in/usage for this schedule
      const hasActiveUsage = usages.some(
        (u) =>
          u.schedule?.course_name === s.course_name &&
          u.schedule?.laboratory.id === s.laboratory?.id &&
          (u.status === 'CHECKED_IN' || u.status === 'IN_USE'),
      )

      const isOngoing = isViewingToday.value && (currentMinutes >= startMin && currentMinutes < endMin)
      const isUpcoming = !isViewingToday.value || (currentMinutes < startMin)

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

      // Strict expiration: If viewing today and current time has reached or passed end time, omit from timetable completely
      if (isViewingToday.value && currentMinutes >= endMin) {
        return
      }

      // Check if there is an active check-in/usage for this request
      const hasActiveUsage = usages.some(
        (u) =>
          u.request?.activity_name === r.activity_name &&
          u.request?.laboratory.id === r.laboratory?.id &&
          (u.status === 'CHECKED_IN' || u.status === 'IN_USE'),
      )

      const isOngoing = isViewingToday.value && (currentMinutes >= startMin && currentMinutes < endMin)
      const isUpcoming = !isViewingToday.value || (currentMinutes < startMin)

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

// =============================================================
// 8-LAB X 10-SLOT MATRIX SCHEDULE DEFINITIONS (80% WIDTH PANEL)
// =============================================================
interface AcademicTimeSlot {
  slotNumber: number
  label: string
  timeRange: string
  startMin: number
  endMin: number
}

const ACADEMIC_TIME_SLOTS: AcademicTimeSlot[] = [
  { slotNumber: 1, label: 'Sesi 1', timeRange: '07:30 - 08:20', startMin: 450, endMin: 500 },
  { slotNumber: 2, label: 'Sesi 2', timeRange: '08:20 - 09:10', startMin: 500, endMin: 550 },
  { slotNumber: 3, label: 'Sesi 3', timeRange: '09:15 - 10:05', startMin: 555, endMin: 605 },
  { slotNumber: 4, label: 'Sesi 4', timeRange: '10:10 - 11:00', startMin: 610, endMin: 660 },
  { slotNumber: 5, label: 'Sesi 5', timeRange: '11:05 - 11:55', startMin: 665, endMin: 715 },
  { slotNumber: 6, label: 'Sesi 6', timeRange: '12:30 - 13:20', startMin: 750, endMin: 800 },
  { slotNumber: 7, label: 'Sesi 7', timeRange: '13:25 - 14:15', startMin: 805, endMin: 855 },
  { slotNumber: 8, label: 'Sesi 8', timeRange: '14:20 - 15:10', startMin: 860, endMin: 910 },
  { slotNumber: 9, label: 'Sesi 9', timeRange: '15:20 - 16:10', startMin: 920, endMin: 970 },
  { slotNumber: 10, label: 'Sesi 10', timeRange: '16:15 - 17:05', startMin: 975, endMin: 1025 },
]

interface MatrixCellSession {
  id: string
  title: string
  subtitle: string
  lecturer: string
  className?: string
  timeWindow: string
  startMin: number
  endMin: number
  status: 'IN_USE' | 'UPCOMING' | 'AVAILABLE'
  type: 'SCHEDULE' | 'REQUEST'
}

interface MatrixCell {
  slot: AcademicTimeSlot
  isCurrentTime: boolean
  session: MatrixCellSession | null
}

interface MatrixLabColumn {
  id: string
  code: string
  name: string
  shortName: string
  capacity: number
  status: 'IN_USE' | 'AVAILABLE' | 'UPCOMING' | 'MAINTENANCE'
  liveSession: FormattedLiveSession | null
  cells: MatrixCell[]
}

const matrixLabColumns = computed<MatrixLabColumn[]>(() => {
  const currentMinutes = getCurrentJakartaMinutes()
  const schedules = displayData.value?.schedules || []
  const requests = displayData.value?.room_requests || []
  const usages = displayData.value?.room_usage || []
  const labs = displayData.value?.laboratories || []

  const standardLabs = [
    { code: 'LAB-01', shortName: 'RPL', defaultName: 'Lab Rekayasa Perangkat Lunak' },
    { code: 'LAB-02', shortName: 'Cyber Net', defaultName: 'Lab Jaringan & Cyber Security' },
    { code: 'LAB-03', shortName: 'Multimedia', defaultName: 'Lab Multimedia & Game Dev' },
    { code: 'LAB-04', shortName: 'AI & Data', defaultName: 'Lab Kecerdasan Buatan & Data' },
    { code: 'LAB-05', shortName: 'Database', defaultName: 'Lab Sistem Informasi & Database' },
    { code: 'LAB-06', shortName: 'Cloud IoT', defaultName: 'Lab Komputasi Awan & IoT' },
    { code: 'LAB-07', shortName: 'Algoritma', defaultName: 'Lab Algoritma & Pemrograman' },
    { code: 'LAB-08', shortName: 'Robotika', defaultName: 'Lab Hardware & Robotika' },
  ]

  const isDemoFallbackNeeded = schedules.length === 0 && requests.length === 0
  const demoFallbackClasses = [
    // colIdx 0: LAB-01 (RPL)
    [
      { title: 'Pemrograman Web Modern', className: 'IF-4A', lecturer: 'Dr. Bambang S., M.Kom', startSlot: 2, endSlot: 4 },
      { title: 'Rekayasa Perangkat Lunak', className: 'IF-6B', lecturer: 'Ir. Hendra Wijaya, MT', startSlot: 7, endSlot: 9 },
    ],
    // colIdx 1: LAB-02 (Cyber Net)
    [
      { title: 'Keamanan Jaringan & Cyber', className: 'IF-6A', lecturer: 'Ahmad Fauzi, M.Kom', startSlot: 1, endSlot: 3 },
      { title: 'Ethical Hacking & Forensic', className: 'IF-4B', lecturer: 'Fajar Nugraha, M.Kom', startSlot: 7, endSlot: 9 },
    ],
    // colIdx 2: LAB-03 (Multimedia)
    [
      { title: 'Pengembangan Game 3D', className: 'DKV-4A', lecturer: 'Deni Prasetyo, M.Sn', startSlot: 2, endSlot: 5 },
      { title: 'Animasi & Desain UI/UX', className: 'DKV-6B', lecturer: 'Maya Kartika, M.Sn', startSlot: 7, endSlot: 9 },
    ],
    // colIdx 3: LAB-04 (AI & Data)
    [
      { title: 'Machine Learning & Big Data', className: 'DS-4A', lecturer: 'Prof. Sri Lestari, Ph.D', startSlot: 3, endSlot: 5 },
      { title: 'Deep Learning & OpenCV', className: 'DS-6A', lecturer: 'Dr. Bambang S., M.Kom', startSlot: 7, endSlot: 9 },
    ],
    // colIdx 4: LAB-05 (Database)
    [
      { title: 'Sistem Basis Data & NoSQL', className: 'SI-2A', lecturer: 'Nurul Hidayah, M.Kom', startSlot: 1, endSlot: 3 },
      { title: 'Business Intelligence & DW', className: 'SI-6A', lecturer: 'Rina Kusuma, M.Kom', startSlot: 7, endSlot: 9 },
    ],
    // colIdx 5: LAB-06 (Cloud IoT)
    [
      { title: 'Cloud DevOps & Docker', className: 'TI-6A', lecturer: 'Agus Setiawan, MT', startSlot: 2, endSlot: 4 },
      { title: 'Sistem Tertanam & IoT', className: 'SK-4A', lecturer: 'Budi Santoso, MT', startSlot: 7, endSlot: 9 },
    ],
    // colIdx 6: LAB-07 (Algoritma)
    [
      { title: 'Struktur Data & Algoritma', className: 'IF-2A', lecturer: 'Eko Prasetyo, M.Kom', startSlot: 1, endSlot: 3 },
      { title: 'Pemrograman Berorientasi Objek', className: 'IF-2C', lecturer: 'Siti Rahma, M.Kom', startSlot: 7, endSlot: 9 },
    ],
    // colIdx 7: LAB-08 (Robotika)
    [
      { title: 'Mikrokontroler & Arduino', className: 'SK-2A', lecturer: 'Ir. Hendra Wijaya, MT', startSlot: 2, endSlot: 4 },
      { title: 'Robotika Industri & ROS', className: 'SK-6A', lecturer: 'Budi Santoso, MT', startSlot: 7, endSlot: 9 },
    ],
  ]

  return Array.from({ length: 8 }, (_, colIdx) => {
    const std = standardLabs[colIdx] || { code: 'LAB-0' + (colIdx + 1), shortName: 'Lab 0' + (colIdx + 1), defaultName: 'Laboratorium 0' + (colIdx + 1) }
    const apiLab = labs.find((l) => l.code === std.code) || labs[colIdx]
    const labId = apiLab?.id || ('virtual-' + std.code)
    const labCode = apiLab?.code || std.code
    const labName = apiLab?.name || std.defaultName
    const labShortName = std.shortName
    const labCapacity = apiLab?.maximum_capacity || 40

    const liveSession = liveLabSessions.value.find((s) => s.labCode === labCode || s.labId === labId) || null

    const labSessions: MatrixCellSession[] = []

    schedules.forEach((s) => {
      if (s.status === 'CANCELLED') return
      if (s.laboratory?.id === labId || s.laboratory?.code === labCode) {
        const startMin = parseTimeToMinutes(s.start_time)
        const endMin = getEffectiveEndMinutes(s.start_time, s.end_time)
        const isOngoing = isViewingToday.value && (currentMinutes >= startMin && currentMinutes < endMin)
        const isUpcoming = !isViewingToday.value || (currentMinutes < startMin)

        const hasActiveUsage = usages.some(
          (u) =>
            u.schedule?.course_name === s.course_name &&
            (u.schedule?.laboratory.id === labId || u.schedule?.laboratory.code === labCode) &&
            (u.status === 'CHECKED_IN' || u.status === 'IN_USE'),
        )

        labSessions.push({
          id: s.id,
          title: s.course_name,
          subtitle: s.class_name ? ('Kelas: ' + s.class_name) : '',
          lecturer: s.lecturer_name || 'Dosen Pengajar',
          className: s.class_name || undefined,
          timeWindow: extractTimeString(s.start_time) + ' - ' + extractTimeString(s.end_time),
          startMin,
          endMin,
          status: isOngoing || hasActiveUsage ? 'IN_USE' : isUpcoming ? 'UPCOMING' : 'AVAILABLE',
          type: 'SCHEDULE',
        })
      }
    })

    requests.forEach((r) => {
      if (r.laboratory?.id === labId || r.laboratory?.code === labCode) {
        const startMin = parseTimeToMinutes(r.start_time)
        const endMin = getEffectiveEndMinutes(r.start_time, r.end_time)
        const isOngoing = isViewingToday.value && (currentMinutes >= startMin && currentMinutes < endMin)
        const isUpcoming = !isViewingToday.value || (currentMinutes < startMin)

        const hasActiveUsage = usages.some(
          (u) =>
            u.request?.activity_name === r.activity_name &&
            (u.request?.laboratory.id === labId || u.request?.laboratory.code === labCode) &&
            (u.status === 'CHECKED_IN' || u.status === 'IN_USE'),
        )

        labSessions.push({
          id: r.id,
          title: r.activity_name,
          subtitle: r.applicant?.full_name ? ('Pemohon: ' + r.applicant.full_name) : '',
          lecturer: r.applicant?.full_name || 'Dosen / Pemohon',
          className: 'Kegiatan Khusus',
          timeWindow: extractTimeString(r.start_time) + ' - ' + extractTimeString(r.end_time),
          startMin,
          endMin,
          status: isOngoing || hasActiveUsage ? 'IN_USE' : isUpcoming ? 'UPCOMING' : 'AVAILABLE',
          type: 'REQUEST',
        })
      }
    })

    if (isDemoFallbackNeeded) {
      const demoItems = demoFallbackClasses[colIdx] || []
      demoItems.forEach((demo, dIdx) => {
        const slotStart = ACADEMIC_TIME_SLOTS[demo.startSlot - 1] ?? ACADEMIC_TIME_SLOTS[0]
        const slotEnd = ACADEMIC_TIME_SLOTS[demo.endSlot - 1] ?? ACADEMIC_TIME_SLOTS[ACADEMIC_TIME_SLOTS.length - 1]
        const startMin = slotStart?.startMin ?? 450
        const endMin = slotEnd?.endMin ?? 1025
        const isOngoing = isViewingToday.value && (currentMinutes >= startMin && currentMinutes < endMin)
        const isUpcoming = !isViewingToday.value || (currentMinutes < startMin)
        const startStr = slotStart ? (slotStart.timeRange.split(' - ')[0] || '07:30') : '07:30'
        const endStr = slotEnd ? (slotEnd.timeRange.split(' - ')[1] || '17:05') : '17:05'

        labSessions.push({
          id: `demo-${colIdx}-${dIdx}`,
          title: demo.title,
          subtitle: `Kelas: ${demo.className}`,
          lecturer: demo.lecturer,
          className: demo.className,
          timeWindow: `${startStr} - ${endStr}`,
          startMin,
          endMin,
          status: isOngoing ? 'IN_USE' : isUpcoming ? 'UPCOMING' : 'AVAILABLE',
          type: 'SCHEDULE',
        })
      })
    }

    const hasLiveOrOngoingSession = labSessions.some((s) => s.status === 'IN_USE')
    const colStatus = isViewingToday.value
      ? (liveSession?.status || (hasLiveOrOngoingSession ? 'IN_USE' : 'AVAILABLE'))
      : 'AVAILABLE'

    const cells: MatrixCell[] = ACADEMIC_TIME_SLOTS.map((slot) => {
      const isCurrentTime = isViewingToday.value && (currentMinutes >= slot.startMin && currentMinutes < slot.endMin)
      const matched = labSessions.find(
        (sess) => sess.startMin < slot.endMin && sess.endMin > slot.startMin,
      ) || null

      return {
        slot,
        isCurrentTime,
        session: matched,
      }
    })

    return {
      id: labId,
      code: labCode,
      name: labName,
      shortName: labShortName,
      capacity: labCapacity,
      status: colStatus,
      liveSession,
      cells,
    }
  })
})

const activeInUseSessions = computed<FormattedLiveSession[]>(() => {
  if (isViewingToday.value) {
    const active = liveLabSessions.value.filter((s) => s.status === 'IN_USE')
    if (active.length > 0) return active

    // Fallback if live session status isn't marked or during demo: derive from matrix ongoing cells
    const ongoingFromMatrix: FormattedLiveSession[] = []
    matrixLabColumns.value.forEach((col) => {
      const activeCell = col.cells.find((c) => c.session?.status === 'IN_USE')
      if (activeCell && activeCell.session) {
        const timeParts = activeCell.slot.timeRange.split(' - ')
        ongoingFromMatrix.push({
          id: activeCell.session.id,
          labId: col.id,
          labName: col.name,
          labCode: col.code,
          location: 'Lantai 2',
          courseName: activeCell.session.title,
          courseCode: activeCell.session.className || 'REG-01',
          instructor: activeCell.session.lecturer,
          timeWindow: activeCell.session.timeWindow,
          startTime: timeParts[0] || '08:00',
          endTime: timeParts[1] || '17:00',
          progressPercentage: 50,
          remainingMinutes: 30,
          isExpired: false,
          status: 'IN_USE',
          capacity: col.capacity,
          occupancy: Math.round(col.capacity * 0.85),
          equipmentSummary: {
            totalUnits: col.capacity,
            goodUnits: col.capacity,
            damagedUnits: 0,
            maintenanceUnits: 0,
            healthPercentage: 100,
            hasIssue: false,
            items: [],
          },
        })
      }
    })
    return ongoingFromMatrix
  }

  // When viewing another day (tomorrow, day after, next week):
  // Collect all scheduled sessions for that selected day across all lab columns
  const daySessions: FormattedLiveSession[] = []
  const seenSessionIds = new Set<string>()

  matrixLabColumns.value.forEach((col) => {
    col.cells.forEach((cell) => {
      if (cell.session && !seenSessionIds.has(cell.session.id)) {
        seenSessionIds.add(cell.session.id)
        const timeParts = cell.slot.timeRange.split(' - ')
        daySessions.push({
          id: cell.session.id,
          labId: col.id,
          labName: col.name,
          labCode: col.code,
          location: 'Lantai 2',
          courseName: cell.session.title,
          courseCode: cell.session.className || 'REG-01',
          instructor: cell.session.lecturer,
          timeWindow: cell.session.timeWindow,
          startTime: timeParts[0] || '08:00',
          endTime: timeParts[1] || '17:00',
          progressPercentage: 0,
          remainingMinutes: 0,
          isExpired: false,
          status: 'UPCOMING',
          capacity: col.capacity,
          occupancy: 0,
          equipmentSummary: {
            totalUnits: col.capacity,
            goodUnits: col.capacity,
            damagedUnits: 0,
            maintenanceUnits: 0,
            healthPercentage: 100,
            hasIssue: false,
            items: [],
          },
        })
      }
    })
  })

  return daySessions
})

// Auto-scroll and manual navigation for active/scheduled sessions list
const activeListRef = ref<HTMLElement | null>(null)
let activeScrollTimer: number | null = null
const pauseActiveScroll = ref(false)

const scrollActiveList = (direction: 'up' | 'down') => {
  if (!activeListRef.value) return
  const delta = direction === 'up' ? -90 : 90
  activeListRef.value.scrollBy({ top: delta, behavior: 'smooth' })
}

const startActiveAutoScroll = () => {
  if (activeScrollTimer) clearInterval(activeScrollTimer)
  activeScrollTimer = window.setInterval(() => {
    if (pauseActiveScroll.value || !activeListRef.value) return
    const el = activeListRef.value
    if (el.scrollHeight > el.clientHeight + 15) {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
        el.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        el.scrollBy({ top: 85, behavior: 'smooth' })
      }
    }
  }, 4000)
}

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

    socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      autoConnect: true,
    })

    socket.on('connect', () => {
      isSocketConnected.value = true
      fetchDisplayData()
    })

    socket.on('disconnect', (reason) => {
      isSocketConnected.value = false
      console.warn('WebSocket disconnected:', reason)
    })

    socket.on('reconnect', (attempt) => {
      isSocketConnected.value = true
      console.info(`WebSocket reconnected successfully on attempt #${attempt}`)
      fetchDisplayData()
    })

    socket.on('connect_error', () => {
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

  // Start auto-scrolling for active/scheduled sessions list
  startActiveAutoScroll()

  // 24/7 TV Display Hygiene: Schedule soft reload at 03:00 AM WIB (when lab is idle) to purge browser RAM
  kioskHygieneTimer = window.setInterval(() => {
    try {
      const jakartaHour = parseInt(staticHourFormatter.format(new Date()), 10)
      if (jakartaHour === 3) {
        window.location.reload()
      }
    } catch {}
  }, 1800000) // check every 30 minutes
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
  if (pollTimer) clearInterval(pollTimer)
  if (infoSlideTimer) clearInterval(infoSlideTimer)
  if (kioskHygieneTimer) clearInterval(kioskHygieneTimer)
  if (activeScrollTimer) clearInterval(activeScrollTimer)
  if (autoResetInterval) clearInterval(autoResetInterval)
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
    <main class="flex flex-col lg:flex-row gap-3.5 my-2.5 flex-1 overflow-hidden relative z-10 min-h-0">
      <!-- ========================================================================= -->
      <!-- 1. LEFT PANEL: 80% SCREEN WIDTH - 8-COLUMN JADWAL PERKULIAHAN MATRIX      -->
      <!-- ========================================================================= -->
      <section
        :class="[
          'w-full lg:w-[80%] rounded-2xl border-2 flex flex-col justify-between overflow-hidden h-full shadow-lg transition-colors duration-300 relative',
          isDarkMode
            ? 'bg-[#091f15] border-emerald-600/70 shadow-[0_0_30px_rgba(74,222,128,0.12)]'
            : 'bg-white/95 border-emerald-300/80 shadow-md'
        ]"
      >
        <!-- Top Accent Gradient Bar -->
        <div
          :class="[
            'absolute top-0 left-0 right-0 h-1.5 z-20',
            isDarkMode
              ? 'bg-gradient-to-r from-emerald-500 via-teal-300 to-green-400 shadow-[0_0_12px_rgba(74,222,128,0.6)]'
              : 'bg-gradient-to-r from-[#07371d] via-[#0c5a30] to-emerald-500'
          ]"
        />

        <!-- Section Top Header Bar -->
        <div
          :class="[
            'px-4 py-2 border-b flex items-center justify-between shrink-0 transition-colors duration-300',
            isDarkMode ? 'border-emerald-700/60 bg-[#06170f]' : 'border-emerald-100 bg-emerald-50/70'
          ]"
        >
          <div class="flex items-center gap-3">
            <div
              :class="[
                'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm shrink-0',
                isDarkMode
                  ? 'bg-emerald-500/20 text-[#4ade80] border-2 border-emerald-400 shadow-[0_0_14px_rgba(74,222,128,0.35)]'
                  : 'bg-gradient-to-br from-[#0c5a30] to-[#07371d] text-white shadow-md'
              ]"
            >
              <Calendar :size="18" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2
                  :class="[
                    'text-sm sm:text-base font-extrabold tracking-tight uppercase flex items-center gap-2',
                    isDarkMode ? 'text-white' : 'text-[#0c5a30]'
                  ]"
                >
                  Matriks Jadwal Perkuliahan & Praktikum
                  <span class="text-amber-400 font-extrabold">
                    {{ isViewingToday ? 'Hari Ini' : (isViewingTomorrow ? 'Besok' : (isViewingDayAfter ? 'Lusa' : '')) }}
                  </span>
                </h2>
                <span
                  class="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-600 text-white shadow-2xs tracking-wider"
                >
                  8 RUANG LAB
                </span>
              </div>
              <p :class="['text-[11px] font-medium', isDarkMode ? 'text-emerald-300/80' : 'text-emerald-800']">
                Pantauan alokasi 10 sesi jam perkuliahan reguler dan penggunaan laboratorium
              </p>
            </div>
          </div>

          <!-- Right Status Chips -->
          <div class="flex items-center gap-2">
            <template v-if="isViewingToday">
              <span
                :class="[
                  'text-[10.5px] font-bold px-3 py-1 rounded-full border-2 transition-colors duration-300 flex items-center gap-1.5 shadow-2xs tracking-wide',
                  isDarkMode
                    ? 'text-[#4ade80] bg-emerald-500/20 border-emerald-400/60'
                    : 'text-white bg-emerald-700 border-emerald-600'
                ]"
              >
                <span class="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
                <span>{{ inUseLabsCount }} SEDANG AKTIF</span>
              </span>
              <span
                :class="[
                  'text-[10.5px] font-bold px-3 py-1 rounded-full border-2 transition-colors duration-300 flex items-center gap-1.5 tracking-wide',
                  isDarkMode
                    ? 'text-[#5eead4] bg-teal-500/20 border-teal-400/60'
                    : 'text-teal-900 bg-teal-100 border-teal-300'
                ]"
              >
                <Check :size="12" />
                <span>{{ availableLabsCount }} TERSEDIA</span>
              </span>
              <span
                :class="[
                  'text-[10.5px] font-bold px-3 py-1 rounded-full border-2 transition-colors duration-300 tracking-wide',
                  isDarkMode
                    ? 'text-[#a7f3d0] bg-[#122b1f] border-emerald-700/70'
                    : 'text-[#0c5a30] bg-white border-emerald-300'
                ]"
              >
                TOTAL {{ totalTodaySchedulesCount }} SESI
              </span>
            </template>
            <template v-else>
              <span
                :class="[
                  'text-[10.5px] font-bold px-3 py-1 rounded-full border-2 transition-colors duration-300 flex items-center gap-1.5 tracking-wide',
                  isDarkMode
                    ? 'text-amber-300 bg-amber-500/20 border-amber-400/60'
                    : 'text-amber-950 bg-amber-100 border-amber-300'
                ]"
              >
                <Clock :size="12" />
                <span>TOTAL {{ totalTodaySchedulesCount }} SESI TERJADWAL</span>
              </span>
              <!-- Auto-reset timer button -->
              <button
                @click="goToToday"
                class="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-extrabold transition-all cursor-pointer bg-amber-500 text-gray-950 border border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)] hover:scale-105 active:scale-95"
                title="Kembali ke pantauan hari ini secara langsung"
              >
                <RotateCcw :size="12" />
                <span>Kembali ke Live ({{ autoResetSeconds }}s)</span>
              </button>
            </template>
          </div>
        </div>

        <!-- DAY & WEEK SCHEDULE NAVIGATION BAR -->
        <div
          :class="[
            'px-3.5 py-1.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 transition-colors duration-300',
            isDarkMode ? 'border-emerald-800/70 bg-[#05140c]' : 'border-emerald-100 bg-white'
          ]"
        >
          <!-- Left: Quick Date Presets -->
          <div class="flex items-center gap-1.5">
            <span :class="['text-[10px] font-bold uppercase tracking-wider mr-1', isDarkMode ? 'text-emerald-400/70' : 'text-gray-500']">PILIH JADWAL:</span>
            <button
              @click="goToToday"
              :class="[
                'px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs',
                isViewingToday
                  ? isDarkMode
                    ? 'bg-emerald-500 text-gray-950 shadow-[0_0_12px_rgba(74,222,128,0.5)] font-extrabold'
                    : 'bg-[#0c5a30] text-white shadow-xs font-extrabold'
                  : isDarkMode
                    ? 'bg-white/5 text-emerald-200 hover:bg-white/10 border border-emerald-700/50'
                    : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
              ]"
            >
              <span v-if="isViewingToday" class="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
              <span>Hari Ini (Live)</span>
            </button>
            <button
              @click="goToTomorrow"
              :class="[
                'px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer shadow-xs',
                isViewingTomorrow
                  ? isDarkMode
                    ? 'bg-amber-400 text-gray-950 shadow-[0_0_12px_rgba(251,191,36,0.5)] font-extrabold'
                    : 'bg-amber-500 text-white shadow-xs font-extrabold'
                  : isDarkMode
                    ? 'bg-white/5 text-emerald-200 hover:bg-white/10 border border-emerald-700/50'
                    : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
              ]"
            >
              Besok
            </button>
            <button
              @click="goToDayAfterTomorrow"
              :class="[
                'px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer shadow-xs',
                isViewingDayAfter
                  ? isDarkMode
                    ? 'bg-amber-400 text-gray-950 shadow-[0_0_12px_rgba(251,191,36,0.5)] font-extrabold'
                    : 'bg-amber-500 text-white shadow-xs font-extrabold'
                  : isDarkMode
                    ? 'bg-white/5 text-emerald-200 hover:bg-white/10 border border-emerald-700/50'
                    : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
              ]"
            >
              Lusa
            </button>
          </div>

          <!-- Center: Day-of-Week Tabs (Senin - Sabtu) -->
          <div class="flex items-center gap-1">
            <button
              v-for="d in daysOfWeekList"
              :key="d.day"
              @click="selectDayOfWeek(d.day)"
              :class="[
                'px-2.5 py-0.5 rounded-md font-bold text-[11px] transition-all cursor-pointer',
                currentSelectedDayOfWeek === d.day
                  ? isDarkMode
                    ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                    : 'bg-emerald-700 text-white shadow-xs font-extrabold'
                  : isDarkMode
                    ? 'text-emerald-300 hover:bg-emerald-500/15'
                    : 'text-emerald-900 hover:bg-emerald-100/70'
              ]"
            >
              {{ d.name }}
            </button>
          </div>

          <!-- Right: Week Navigation & Date Display Badge -->
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1">
              <button
                @click="prevWeek"
                :class="[
                  'py-0.5 px-2 rounded-md transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold border shadow-xs',
                  isDarkMode
                    ? 'bg-white/5 hover:bg-white/10 text-emerald-200 border-emerald-800'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
                ]"
                title="Lihat minggu sebelumnya"
              >
                <ChevronLeft :size="13" />
                <span class="hidden sm:inline">Minggu Lalu</span>
              </button>
              <button
                @click="nextWeek"
                :class="[
                  'py-0.5 px-2 rounded-md transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold border shadow-xs',
                  isDarkMode
                    ? 'bg-white/5 hover:bg-white/10 text-emerald-200 border-emerald-800'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
                ]"
                title="Lihat minggu depan"
              >
                <span class="hidden sm:inline">Minggu Depan</span>
                <ChevronRight :size="13" />
              </button>
            </div>

            <span
              :class="[
                'px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold border shadow-xs flex items-center gap-1.5',
                isDarkMode
                  ? 'bg-black/35 border-emerald-700/60 text-amber-300'
                  : 'bg-emerald-100/70 border-emerald-300 text-emerald-950'
              ]"
            >
              <Calendar :size="11" />
              <span>{{ formattedSelectedDate }}</span>
            </span>
          </div>
        </div>

        <!-- 8-COLUMN X 10-SLOT MATRIX TABLE CONTAINER -->
        <div class="flex-1 overflow-auto custom-scrollbar p-2.5 min-h-0 flex flex-col">
          <div class="min-w-[900px] flex-1 flex flex-col border rounded-xl overflow-hidden shadow-xs" :class="isDarkMode ? 'border-emerald-800/80 bg-[#06160e]' : 'border-emerald-200 bg-white'">
            <!-- 1. TABLE HEADER: 8 LAB COLUMNS (+ 1 TIME COLUMN) -->
            <div
              :class="[
                'grid grid-cols-9 sticky top-0 z-20 border-b shadow-sm text-center text-xs font-bold transition-colors duration-300',
                isDarkMode
                  ? 'bg-[#0c281a] border-emerald-700/80 text-white'
                  : 'bg-gradient-to-r from-[#07371d] via-[#0c5a30] to-[#07371d] border-emerald-700 text-white'
              ]"
            >
              <!-- Time Column Header -->
              <div class="py-2.5 px-2 border-r border-emerald-700/60 flex flex-col items-center justify-center bg-black/15">
                <div class="flex items-center gap-1 opacity-90 text-[11px] uppercase tracking-wider">
                  <Clock :size="12" />
                  <span>WAKTU</span>
                </div>
                <span class="text-[9.5px] opacity-75 font-mono">WIB</span>
              </div>

              <!-- 8 Lab Columns Headers -->
              <div
                v-for="(col, cIdx) in matrixLabColumns"
                :key="col.id"
                :class="[
                  'py-2 px-1.5 flex flex-col items-center justify-center transition-colors relative',
                  cIdx < 7 ? 'border-r border-emerald-600/40' : '',
                  col.status === 'IN_USE'
                    ? isDarkMode
                      ? 'bg-emerald-500/20'
                      : 'bg-emerald-800/60'
                    : ''
                ]"
              >
                <!-- Room Code & Name -->
                <div class="flex flex-col items-center justify-center text-center w-full px-0.5">
                  <span class="font-mono text-[10.5px] font-black px-1.5 py-0.5 rounded bg-black/35 border border-white/20 tracking-wider">
                    {{ col.code }}
                  </span>
                  <span class="text-[11px] font-extrabold leading-tight mt-1 whitespace-normal text-center" :title="col.name">
                    {{ col.shortName }}
                  </span>
                </div>

                <!-- Status Pill -->
                <div class="mt-1 flex items-center gap-1 text-[9.5px] font-semibold">
                  <span
                    v-if="col.status === 'IN_USE'"
                    class="inline-flex items-center gap-1 text-amber-300 font-bold bg-amber-950/70 px-1.5 py-0.2 rounded border border-amber-400/60"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                    <span>AKTIF</span>
                  </span>
                  <span
                    v-else-if="col.status === 'AVAILABLE'"
                    class="inline-flex items-center gap-0.5 text-teal-200 bg-teal-950/70 px-1.5 py-0.2 rounded border border-teal-500/40"
                  >
                    <Check :size="9" />
                    <span>TERSEDIA</span>
                  </span>
                  <span
                    v-else
                    class="text-gray-300 opacity-75"
                  >
                    {{ col.status }}
                  </span>
                  <span class="text-[9px] opacity-70">({{ col.capacity }} PC)</span>
                </div>
              </div>
            </div>

            <!-- 2. TABLE BODY: 10 TIME ROWS -->
            <div class="flex-1 flex flex-col divide-y" :class="isDarkMode ? 'divide-emerald-900/60' : 'divide-gray-200'">
              <div
                v-for="slot in ACADEMIC_TIME_SLOTS"
                :key="slot.slotNumber"
                :class="[
                  'grid grid-cols-9 flex-1 transition-colors min-h-[52px]',
                  isDarkMode
                    ? 'hover:bg-emerald-950/20'
                    : 'hover:bg-emerald-50/40'
                ]"
              >
                <!-- Time Legend Cell -->
                <div
                  :class="[
                    'p-1.5 border-r flex flex-col justify-center items-center text-center font-mono shrink-0 transition-colors',
                    isDarkMode
                      ? 'border-emerald-800/80 bg-[#071910] text-emerald-200'
                      : 'border-emerald-200 bg-gray-50 text-emerald-900'
                  ]"
                >
                  <span class="text-[10px] font-extrabold uppercase px-1 py-0.2 rounded" :class="isDarkMode ? 'bg-emerald-900/50 text-[#4ade80]' : 'bg-emerald-100 text-[#0c5a30]'">
                    {{ slot.label }}
                  </span>
                  <span class="text-[10px] font-bold mt-0.5 tracking-tight">
                    {{ slot.timeRange }}
                  </span>
                </div>

                <!-- 8 Lab Cells for this Slot -->
                <div
                  v-for="(col, cIdx) in matrixLabColumns"
                  :key="col.id + '-' + slot.slotNumber"
                  :class="[
                    'p-1 transition-all flex flex-col justify-center relative overflow-hidden',
                    cIdx < 7 ? (isDarkMode ? 'border-r border-emerald-900/60' : 'border-r border-gray-200') : '',
                    col.cells[slot.slotNumber - 1]?.session?.status === 'IN_USE'
                      ? isDarkMode
                        ? 'bg-gradient-to-r from-amber-950/50 to-emerald-950/40 border-l-2 border-l-amber-400'
                        : 'bg-gradient-to-r from-amber-50/90 to-emerald-50/60 border-l-2 border-l-amber-500'
                      : col.cells[slot.slotNumber - 1]?.session
                        ? isDarkMode
                          ? 'bg-[#0a2015] border-l-2 border-l-teal-500'
                          : 'bg-emerald-50/40 border-l-2 border-l-teal-600'
                        : ''
                  ]"
                >
                  <!-- IF HAS SESSION -->
                  <template v-if="col.cells[slot.slotNumber - 1]?.session">
                    <div class="h-full flex flex-col justify-between p-1 rounded-lg border text-left"
                      :class="[
                        col.cells[slot.slotNumber - 1]?.session?.status === 'IN_USE'
                          ? isDarkMode
                            ? 'bg-[#0f2c1c] border-amber-400/80 shadow-xs'
                            : 'bg-white border-amber-400 shadow-xs'
                          : isDarkMode
                            ? 'bg-[#081b12] border-emerald-700/60 shadow-2xs'
                            : 'bg-white border-emerald-200 shadow-2xs'
                      ]"
                    >
                      <div class="space-y-0.5">
                        <div class="flex items-center justify-between gap-1">
                          <span
                            :class="[
                              'text-[8px] font-extrabold uppercase px-1 py-0.2 rounded shrink-0',
                              col.cells[slot.slotNumber - 1]?.session?.status === 'IN_USE'
                                ? 'bg-amber-500 text-slate-950 font-black animate-pulse'
                                : 'bg-emerald-700 text-white'
                            ]"
                          >
                            {{ col.cells[slot.slotNumber - 1]?.session?.status === 'IN_USE' ? 'AKTIF' : 'KULIAH' }}
                          </span>
                          <span class="text-[8.5px] font-mono font-semibold opacity-75 truncate">
                            {{ col.cells[slot.slotNumber - 1]?.session?.timeWindow }}
                          </span>
                        </div>
                        <h4
                          :class="[
                            'text-[10.5px] font-bold line-clamp-1 leading-tight tracking-tight',
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          ]"
                          :title="col.cells[slot.slotNumber - 1]?.session?.title"
                        >
                          {{ col.cells[slot.slotNumber - 1]?.session?.title }}
                        </h4>
                      </div>

                      <div class="pt-0.5 border-t mt-0.5 flex items-center justify-between gap-1 text-[9px]"
                        :class="isDarkMode ? 'border-emerald-800 text-emerald-300' : 'border-gray-100 text-gray-600'"
                      >
                        <span class="truncate font-medium" :title="col.cells[slot.slotNumber - 1]?.session?.lecturer">
                          {{ col.cells[slot.slotNumber - 1]?.session?.lecturer }}
                        </span>
                        <span v-if="col.cells[slot.slotNumber - 1]?.session?.className" class="font-mono text-[8px] opacity-80 shrink-0 font-bold">
                          {{ col.cells[slot.slotNumber - 1]?.session?.className }}
                        </span>
                      </div>
                    </div>
                  </template>

                  <!-- IF EMPTY / AVAILABLE -->
                  <template v-else>
                    <div class="h-full flex items-center justify-center py-1 text-center">
                      <span
                        :class="[
                          'text-[9.5px] font-medium tracking-wide flex items-center gap-1',
                          isDarkMode ? 'text-emerald-700/60' : 'text-emerald-900/35'
                        ]"
                      >
                        <Check :size="10" class="opacity-50" />
                        <span>Tersedia</span>
                      </span>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ========================================================================= -->
      <!-- 2. RIGHT PANEL: 20% SCREEN WIDTH - SIDEBAR INFORMASI & SEDANG AKTIF       -->
      <!-- ========================================================================= -->
      <aside class="w-full lg:w-[20%] flex flex-col justify-between gap-3 overflow-hidden h-full">
        <!-- 2.1 RINGKASAN OKUPANSI LAB TILES -->
        <div class="grid grid-cols-2 gap-2 shrink-0">
          <!-- Sedang Dipakai Tile -->
          <div
            :class="[
              'p-2.5 rounded-xl border-2 flex items-center gap-2.5 transition-all shadow-sm',
              isDarkMode
                ? 'bg-[#0d2217] border-emerald-500/70 shadow-[0_0_16px_rgba(74,222,128,0.15)]'
                : 'bg-gradient-to-br from-[#0c5a30] via-emerald-800 to-[#07371d] text-white border-emerald-600 shadow-md'
            ]"
          >
            <div
              :class="[
                'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-colors shadow-2xs',
                isDarkMode
                  ? 'bg-emerald-500/25 border-emerald-400 text-[#4ade80]'
                  : 'bg-white/20 border-white/30 text-white'
              ]"
            >
              <Activity :size="18" class="animate-pulse" />
            </div>
            <div class="min-w-0">
              <span
                :class="[
                  'text-[9px] font-bold uppercase tracking-wider block truncate',
                  isDarkMode ? 'text-emerald-300' : 'text-emerald-100'
                ]"
              >
                Lab Aktif
              </span>
              <span
                :class="[
                  'text-xl font-black leading-none',
                  isDarkMode ? 'text-[#4ade80]' : 'text-white'
                ]"
              >
                {{ inUseLabsCount }}
                <span class="text-[10px] font-bold opacity-80">/ {{ totalLabsCount }}</span>
              </span>
            </div>
          </div>

          <!-- Kesiapan Alat Tile -->
          <button
            @click="openOverallEquipmentModal"
            type="button"
            :class="[
              'p-2.5 rounded-xl border-2 flex items-center gap-2.5 transition-all shadow-sm cursor-pointer hover:scale-102 active:scale-98 text-left',
              isDarkMode
                ? 'bg-[#0d1f1c] border-teal-500/60 shadow-[0_0_16px_rgba(45,212,191,0.15)]'
                : 'bg-gradient-to-br from-teal-700 via-teal-800 to-[#07371d] text-white border-teal-500 shadow-md'
            ]"
            title="Klik untuk inspeksi inventaris peralatan lab"
          >
            <div
              :class="[
                'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-colors shadow-2xs',
                isDarkMode
                  ? 'bg-teal-500/25 border-teal-400 text-[#2dd4bf]'
                  : 'bg-white/20 border-white/30 text-white'
              ]"
            >
              <Wrench :size="18" />
            </div>
            <div class="min-w-0">
              <span
                :class="[
                  'text-[9px] font-bold uppercase tracking-wider block truncate',
                  isDarkMode ? 'text-teal-300' : 'text-teal-100'
                ]"
              >
                Alat Siap
              </span>
              <span
                :class="[
                  'text-xl font-black leading-none',
                  isDarkMode ? 'text-[#2dd4bf]' : 'text-white'
                ]"
              >
                {{ overallEquipmentStats.healthRate }}%
              </span>
            </div>
          </button>
        </div>

        <!-- 2.2 WIDGET: PRAKTIKUM SEDANG BERLANGSUNG (NOW PLAYING) -->
        <div
          :class="[
            'p-3 rounded-2xl border-2 flex flex-col overflow-hidden relative transition-colors duration-300 shadow-md shrink-0 max-h-[220px]',
            isDarkMode
              ? 'bg-[#0c2017] border-emerald-600/60 shadow-md'
              : 'bg-white border-emerald-200/90 shadow-md'
          ]"
        >
          <!-- Accent Strip -->
          <div
            :class="[
              'absolute top-0 left-0 right-0 h-1',
              isDarkMode
                ? 'bg-gradient-to-r from-amber-400 to-emerald-400'
                : 'bg-gradient-to-r from-amber-500 to-[#0c5a30]'
            ]"
          />

          <!-- Widget Header -->
          <div class="flex items-center justify-between pb-2 mb-2 border-b shrink-0" :class="isDarkMode ? 'border-emerald-800/80' : 'border-emerald-100'">
            <div class="flex items-center gap-1.5">
              <div class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></div>
              <h3 :class="['text-xs font-black uppercase tracking-wide', isDarkMode ? 'text-white' : 'text-[#0c5a30]']">
                {{ isViewingToday ? 'Sedang Berlangsung' : 'Jadwal Terdaftar' }}
              </h3>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-[9.5px] font-bold font-mono px-2 py-0.2 rounded-full" :class="isDarkMode ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50' : 'bg-amber-100 text-amber-900 border border-amber-300'">
                {{ activeInUseSessions.length }} SESI
              </span>
              <!-- Manual scroll buttons -->
              <button
                @click="scrollActiveList('up')"
                :class="[
                  'p-0.5 rounded transition-all cursor-pointer border active:scale-90',
                  isDarkMode
                    ? 'hover:bg-emerald-500/20 text-emerald-300 border-emerald-700/60'
                    : 'hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                ]"
                title="Gulir ke atas"
                aria-label="Scroll Up"
              >
                <ChevronUp :size="13" />
              </button>
              <button
                @click="scrollActiveList('down')"
                :class="[
                  'p-0.5 rounded transition-all cursor-pointer border active:scale-90',
                  isDarkMode
                    ? 'hover:bg-emerald-500/20 text-emerald-300 border-emerald-700/60'
                    : 'hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                ]"
                title="Gulir ke bawah"
                aria-label="Scroll Down"
              >
                <ChevronDown :size="13" />
              </button>
            </div>
          </div>

          <!-- Active Sessions Scrollable List with Auto-Scroll & Manual Touch/Wheel -->
          <div
            ref="activeListRef"
            @mouseenter="pauseActiveScroll = true"
            @mouseleave="pauseActiveScroll = false"
            class="overflow-y-auto custom-scrollbar space-y-2 flex-1 pr-1 scroll-smooth"
          >
            <template v-if="activeInUseSessions.length > 0">
              <div
                v-for="sess in activeInUseSessions"
                :key="sess.id"
                :class="[
                  'p-2.5 rounded-xl border transition-all text-xs space-y-1.5 shadow-xs',
                  isDarkMode
                    ? 'bg-[#071910] border-emerald-600/70 hover:border-emerald-400'
                    : 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-400'
                ]"
              >
                <div class="flex items-center justify-between gap-1">
                  <span class="px-1.5 py-0.2 rounded text-[9px] font-extrabold font-mono" :class="isDarkMode ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/50' : 'bg-emerald-700 text-white'">
                    {{ sess.labCode }}
                  </span>
                  <span class="text-[9.5px] font-mono font-bold" :class="isDarkMode ? 'text-amber-300' : 'text-amber-700'">
                    {{ sess.timeWindow }}
                  </span>
                </div>
                <h4 :class="['font-bold text-[11px] line-clamp-1 leading-snug', isDarkMode ? 'text-white' : 'text-gray-900']" :title="sess.courseName">
                  {{ sess.courseName }}
                </h4>
                <div class="flex items-center justify-between text-[9.5px] opacity-80 pt-0.5">
                  <span class="truncate max-w-[130px]">{{ sess.instructor }}</span>
                  <span v-if="isViewingToday" class="font-bold text-emerald-400">{{ sess.remainingMinutes }} mnt tersisa</span>
                  <span v-else class="font-bold text-emerald-400 font-mono">{{ sess.courseCode }}</span>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="py-4 text-center space-y-1">
                <CheckCircle2 :size="24" class="mx-auto text-emerald-500 opacity-60" />
                <p :class="['text-xs font-semibold', isDarkMode ? 'text-emerald-300' : 'text-emerald-800']">
                  {{ isViewingToday ? 'Tidak Ada Sesi Aktif' : 'Tidak Ada Sesi Terjadwal' }}
                </p>
                <p class="text-[10px] opacity-70">
                  {{ isViewingToday ? 'Seluruh ruang lab saat ini tersedia untuk reservasi atau praktikum mandiri.' : 'Tidak ada kegiatan perkuliahan terjadwal pada hari ini.' }}
                </p>
              </div>
            </template>
          </div>
        </div>

        <!-- 2.3 WIDGET: INFORMASI & LAYANAN LAB SLIDESHOW (AUTOPLAY CAROUSEL) -->
        <div
          :class="[
            'p-3.5 rounded-2xl border-2 flex-1 flex flex-col justify-between overflow-hidden relative transition-colors duration-300 shadow-md',
            isDarkMode
              ? 'bg-[#0c2017] border-emerald-600/60 shadow-md'
              : 'bg-white border-emerald-200/90 shadow-md'
          ]"
        >
          <!-- Accent Line -->
          <div
            :class="[
              'absolute top-0 left-0 right-0 h-1',
              isDarkMode
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : 'bg-gradient-to-r from-[#0c5a30] to-teal-500'
            ]"
          />

          <!-- Slide Header with Icon -->
          <div>
            <div class="flex items-center justify-between gap-1 pb-2 mb-2 border-b" :class="isDarkMode ? 'border-emerald-800/80' : 'border-emerald-100'">
              <div class="flex items-center gap-1.5 min-w-0">
                <div
                  :class="[
                    'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border',
                    currentInfoSlide.iconBg
                  ]"
                >
                  <component :is="currentInfoSlide.icon" :size="13" :class="currentInfoSlide.iconColor" />
                </div>
                <span :class="['text-[11px] font-bold uppercase truncate', isDarkMode ? 'text-white' : 'text-[#0c5a30]']">
                  {{ currentInfoSlide.tab }}
                </span>
              </div>
              <span
                :class="[
                  'text-[9px] font-bold px-2 py-0.2 rounded-full shrink-0 tracking-wide',
                  currentInfoSlide.badgeClass
                ]"
              >
                {{ currentInfoSlide.badge }}
              </span>
            </div>

            <!-- Slide Content -->
            <transition name="fade" mode="out-in">
              <div :key="currentInfoSlide.id" class="space-y-1.5 py-1">
                <h4 :class="['text-xs font-bold leading-snug', isDarkMode ? 'text-emerald-100' : 'text-gray-900']">
                  {{ currentInfoSlide.title }}
                </h4>
                <p :class="['text-[10.5px] leading-relaxed', isDarkMode ? 'text-emerald-200/80' : 'text-gray-600']">
                  {{ currentInfoSlide.description }}
                </p>
                <div
                  :class="[
                    'p-2 rounded-xl text-[10px] font-medium border mt-2',
                    isDarkMode
                      ? 'bg-[#071910] border-emerald-700/60 text-emerald-200'
                      : 'bg-emerald-50 border-emerald-200 text-[#0c5a30]'
                  ]"
                >
                  <strong class="font-bold">Info:</strong> {{ currentInfoSlide.highlight }}
                </div>
              </div>
            </transition>
          </div>

          <!-- Slide Bottom Navigation Controls -->
          <div class="flex items-center justify-between pt-2 border-t mt-2" :class="isDarkMode ? 'border-emerald-800/80' : 'border-emerald-100'">
            <!-- Dots -->
            <div class="flex items-center gap-1">
              <button
                v-for="(_, idx) in infoSlides"
                :key="idx"
                @click="setInfoSlide(idx)"
                :class="[
                  'h-1.5 rounded-full transition-all duration-300 cursor-pointer',
                  activeInfoSlide === idx
                    ? 'w-4 bg-emerald-500'
                    : 'w-1.5 bg-gray-300 dark:bg-emerald-900'
                ]"
                :aria-label="'Slide ' + (idx + 1)"
              />
            </div>

            <!-- Arrow Buttons -->
            <div class="flex items-center gap-1 text-[9.5px]">
              <span class="font-mono opacity-70 mr-1">{{ activeInfoSlide + 1 }}/{{ infoSlides.length }}</span>
              <button
                @click="prevInfoSlide"
                class="p-1 rounded border hover:bg-emerald-500/20 transition-colors cursor-pointer"
                :class="isDarkMode ? 'border-emerald-800 text-emerald-300' : 'border-gray-200 text-gray-700'"
                title="Sebelumnya"
              >
                <ChevronLeft :size="11" />
              </button>
              <button
                @click="nextInfoSlide"
                class="p-1 rounded border hover:bg-emerald-500/20 transition-colors cursor-pointer"
                :class="isDarkMode ? 'border-emerald-800 text-emerald-300' : 'border-gray-200 text-gray-700'"
                title="Berikutnya"
              >
                <ChevronRight :size="11" />
              </button>
            </div>
          </div>
        </div>
      </aside>
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
    transform: translate3d(100%, 0, 0);
  }
  100% {
    transform: translate3d(-100%, 0, 0);
  }
}

.animate-marquee {
  display: inline-block;
  white-space: nowrap;
  animation: marquee 35s linear infinite;
  will-change: transform;
  backface-visibility: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  transform: translate3d(0, 0, 0);
}

.animate-marquee:hover {
  animation-play-state: paused;
}

/* Sleek custom scrollbar for TV Display */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(12, 90, 48, 0.4);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(12, 90, 48, 0.7);
}

.dark-display {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

.dark-display .custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}
.dark-display .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(74, 222, 128, 0.5);
}
.dark-display .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(74, 222, 128, 0.85);
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
