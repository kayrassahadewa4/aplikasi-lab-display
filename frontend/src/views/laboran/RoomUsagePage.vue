<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLaboranNavStore } from '@/stores/laboran-nav.store'
import { useAuthStore } from '@/stores/auth.store'
import {
  Activity,
  Clock,
  CheckCircle2,
  Layers,
  Search,
  Building2,
  RefreshCw,
  LogOut,
  DoorOpen,
  Eye,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  X,
  FileText,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Calendar,
  Plus,
  Users,
  Sparkles
} from 'lucide-vue-next'
import SummaryCard from '@/components/admin/SummaryCard.vue'
import { roomUsageService, type RoomUsage } from '@/services/room-usage.service'
import { roomRequestService, type RoomRequest } from '@/services/room-request.service'
import { scheduleService, type ScheduleData } from '@/services/schedule.service'
import { laboratoryService, type LaboratoryData } from '@/services/laboratory.service'
import TimePicker24 from '@/components/common/TimePicker24.vue'
import { formatDate } from '@/utils/format.utils'

const router = useRouter()
const navStore = useLaboranNavStore()
const authStore = useAuthStore()

// Datasets
const usageList = ref<RoomUsage[]>([])
const totalRecords = ref(0)
const isLoading = ref(false)
const errorMessage = ref('')

// Pending Check-In Sources
const approvedRequests = ref<RoomRequest[]>([])
const laboratories = ref<LaboratoryData[]>([])
const todayPendingSchedules = ref<ScheduleData[]>([])

// Search & Filters
const searchQuery = ref('')
const selectedStatusFilter = ref<string>('ALL')
const selectedLabFilter = ref<string>('ALL')

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Toast Banner Feedback
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'warning'>('success')

const triggerToast = (msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3500)
}

// Load Room Usages from API
const loadRoomUsages = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const filters: any = {
      page: currentPage.value,
      limit: itemsPerPage.value,
    }

    if (searchQuery.value.trim()) {
      filters.search = searchQuery.value.trim()
    }

    if (selectedStatusFilter.value !== 'ALL') {
      filters.status = selectedStatusFilter.value
    }

    const response = await roomUsageService.getRoomUsages(filters)
    usageList.value = response.data
    totalRecords.value = response.meta.total
  } catch (error: any) {
    console.error('Failed to load room usages:', error)
    errorMessage.value = error.message || 'Failed to load room usages'
  } finally {
    isLoading.value = false
  }
}

// Load Pending Check-In Sources (Excluding already-used requests)
const loadPendingCheckIns = async () => {
  try {
    const [usageRes, reqRes, schedRes, labRes] = await Promise.all([
      roomUsageService.getRoomUsages({ limit: 100 }).catch(() => ({ data: [] })),
      roomRequestService.getRoomRequests({ status: 'APPROVED', limit: 50 }).catch(() => ({ data: [] })),
      scheduleService.getSchedules({ limit: 20 }).catch(() => ({ schedules: [] })),
      laboratoryService.getLaboratories({ limit: 50 }).catch(() => ({ laboratories: [] }))
    ])
    const allUsages = usageRes.data || []
    // Collect all request IDs and schedule IDs that already have a usage record (active or completed)
    const usedRequestIds = new Set(
      allUsages.filter(u => u.requestId && u.status !== 'CANCELLED').map(u => u.requestId)
    )
    const activeLabIds = new Set(
      allUsages.filter(u => u.status === 'IN_USE' || u.status === 'CHECKED_IN').map(u => u.laboratoryId)
    )
    // Filter: Only show approved requests that have NOT been checked in yet
    approvedRequests.value = (reqRes.data || []).filter((req: RoomRequest) => !usedRequestIds.has(req.id))
    laboratories.value = labRes.laboratories || []
    // Filter: Only show schedules for labs that are not currently occupied
    todayPendingSchedules.value = (schedRes.schedules || []).filter((s: ScheduleData) => !activeLabIds.has(s.laboratoryId)).slice(0, 5)
  } catch (err) {
    console.error('Failed to load pending check-ins:', err)
  }
}

onMounted(async () => {
  navStore.setBreadcrumbs([
    { label: 'Portal Laboran', path: '/laboran' },
    { label: 'Log Pemakaian Lab' }
  ])
  await Promise.all([loadRoomUsages(), loadPendingCheckIns()])
})

// Watch for filter changes
watch([currentPage, searchQuery, selectedStatusFilter], () => {
  loadRoomUsages()
})

// Refresh Action
const isRefreshing = ref(false)
const handleRefresh = async () => {
  isRefreshing.value = true
  try {
    await Promise.all([loadRoomUsages(), loadPendingCheckIns()])
    triggerToast('Data pemakaian lab dan check-in berhasil diperbarui.')
  } catch (error) {
    triggerToast('Gagal memperbarui data', 'error')
  } finally {
    isRefreshing.value = false
  }
}

// Interactive Check-In & Check-Out State
const checkInTarget = ref<RoomUsage | null>(null)
const checkOutTarget = ref<RoomUsage | null>(null)
const checkOutNotes = ref('')
const isActionLoading = ref(false)

// Ad-Hoc Check-In Modal State
const showAdHocModal = ref(false)
const adHocForm = ref({
  laboratoryId: '',
  activityName: '',
  applicantName: '',
  participantCount: 30,
  startTime: '08:00',
  endTime: '10:00',
  notes: ''
})

// Active In-Use Sessions
const activeUsageSessions = computed(() => {
  return usageList.value.filter(u => u.status === 'IN_USE')
})

// Upcoming Sessions Ready for Check-In from room_usage table
const upcomingUsageSessions = computed(() => {
  return usageList.value.filter(u => u.status === 'CHECKED_IN')
})

// Recently Completed
const completedUsageSessions = computed(() => {
  return usageList.value.filter(u => u.status === 'CHECKED_OUT')
})

// Total Usage Today Count
const totalUsageTodayCount = computed(() => {
  return usageList.value.length
})

// Lab Filter Options
const labOptions = computed(() => {
  const set = new Set<string>()
  usageList.value.forEach(u => {
    if (u.laboratoryName) set.add(u.laboratoryName)
  })
  return Array.from(set)
})

// Paginated Table
const totalPages = computed(() => Math.ceil(totalRecords.value / itemsPerPage.value) || 1)

const paginatedUsage = computed(() => {
  return usageList.value
})

// Reset Filters
const resetFilters = () => {
  searchQuery.value = ''
  selectedStatusFilter.value = 'ALL'
  selectedLabFilter.value = 'ALL'
  currentPage.value = 1
}

// Navigation to Detail Page
const navigateToDetail = (id: string) => {
  router.push(`/laboran/room-usage/${id}`)
}

// Time Helper for Check-In Alignment
function extractHHmm(timeValue: string | Date | undefined | null): string {
  if (!timeValue) return '00:00'
  if (typeof timeValue === 'string') {
    const trimmed = timeValue.trim()
    // Match "HH:mm" or "HH.mm" (e.g. "08:00", "08.00", "8:00")
    const match = trimmed.match(/^(\d{1,2})[:.](\d{1,2})/)
    if (match && !trimmed.includes('T')) {
      const h = match[1]!.padStart(2, '0')
      const m = match[2]!.padStart(2, '0')
      return `${h}:${m}`
    }
    // Handle ISO timestamp like "1970-01-01T08:00:00.000Z"
    if (trimmed.includes('T')) {
      const d = new Date(trimmed)
      if (!isNaN(d.getTime())) {
        const h = d.getUTCHours().toString().padStart(2, '0')
        const m = d.getUTCMinutes().toString().padStart(2, '0')
        return `${h}:${m}`
      }
    }
  } else if (timeValue instanceof Date) {
    if (!isNaN(timeValue.getTime())) {
      const h = timeValue.getUTCHours().toString().padStart(2, '0')
      const m = timeValue.getUTCMinutes().toString().padStart(2, '0')
      return `${h}:${m}`
    }
  }
  return '00:00'
}

export interface DiscrepancyResult {
  isDiscrepant: boolean
  type: 'EARLY' | 'LATE' | 'DIFFERENT_DATE' | 'ON_TIME'
  badgeLabel: string
  badgeClass: string
  title: string
  description: string
  timeDiffText: string
  scheduledDate: string
  scheduledTime: string
  currentWibDate: string
  currentWibTime: string
}

function evaluateCheckInTimeDiscrepancy(req: RoomRequest): DiscrepancyResult {
  const now = new Date()

  // 1. Current Jakarta Date & Time (WIB)
  const jakartaDateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const currentJakartaDate = jakartaDateFormatter.format(now) // "YYYY-MM-DD"

  const jakartaTimeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const currentJakartaTimeStr = jakartaTimeFormatter.format(now) // "HH:mm"
  const [currH, currM] = currentJakartaTimeStr.split(':').map(Number)
  const currentMinutes = (currH || 0) * 60 + (currM || 0)

  // Candidate request date
  const rawDate = req.requestDate ? req.requestDate.split('T')[0] : null
  const reqDateOnly: string = rawDate || currentJakartaDate

  // Format display strings
  const formattedSchedDate = req.formattedRequestDate || formatDate(reqDateOnly, true)
  const formattedCurrDate = formatDate(now, true)
  const schedStart = extractHHmm(req.startTime)
  const schedEnd = extractHHmm(req.endTime)
  const scheduledTimeStr = `${schedStart} – ${schedEnd} WIB`
  const currentWibStr = `${currentJakartaTimeStr} WIB`

  // 2. Check Date Discrepancy (Scheduled for another date)
  if (reqDateOnly !== currentJakartaDate) {
    const isFuture = reqDateOnly > currentJakartaDate
    return {
      isDiscrepant: true,
      type: 'DIFFERENT_DATE',
      badgeLabel: isFuture ? 'Jadwal Hari Mendatang' : 'Jadwal Tanggal Lampau',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      title: isFuture ? 'Check-In Belum Waktunya (Hari Mendatang)' : 'Check-In Tanggal Lampau',
      description: isFuture
        ? `Sesi peminjaman ini dijadwalkan untuk ${formattedSchedDate}, belum waktunya untuk hari ini (${formattedCurrDate}).`
        : `Sesi peminjaman ini tercatat untuk ${formattedSchedDate} (tanggal pelaksanaan sudah berlalu).`,
      timeDiffText: isFuture ? 'Belum memasuki hari jadwal' : 'Tanggal jadwal telah lewat',
      scheduledDate: formattedSchedDate,
      scheduledTime: scheduledTimeStr,
      currentWibDate: formattedCurrDate,
      currentWibTime: currentWibStr,
    }
  }

  // 3. Check Time Discrepancy on the Same Date
  const startParts = schedStart.split(':')
  const endParts = schedEnd.split(':')
  const startH = parseInt(startParts[0] || '0', 10) || 0
  const startM = parseInt(startParts[1] || '0', 10) || 0
  const endH = parseInt(endParts[0] || '0', 10) || 0
  const endM = parseInt(endParts[1] || '0', 10) || 0

  const startMinutes = startH * 60 + startM
  let endMinutes = endH * 60 + endM
  if (endMinutes <= startMinutes || endMinutes === 0) {
    endMinutes = 1440 // Midnight normalization (24:00)
  }

  // If current time is earlier than start time:
  if (currentMinutes < startMinutes) {
    const diff = startMinutes - currentMinutes
    const hours = Math.floor(diff / 60)
    const minutes = diff % 60
    const diffStr =
      hours > 0 ? `${hours} jam ${minutes > 0 ? minutes + ' menit' : ''}` : `${minutes} menit`

    return {
      isDiscrepant: true,
      type: 'EARLY',
      badgeLabel: 'Lebih Awal dari Jadwal',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      title: 'Konfirmasi Check-In Lebih Awal dari Jadwal',
      description: `Waktu check-in saat ini (${currentWibStr}) adalah ${diffStr} lebih awal dari jam mulai resmi yang ditetapkan (${schedStart} WIB).`,
      timeDiffText: `${diffStr} lebih awal`,
      scheduledDate: formattedSchedDate,
      scheduledTime: scheduledTimeStr,
      currentWibDate: formattedCurrDate,
      currentWibTime: currentWibStr,
    }
  }

  // If current time is past end time:
  if (currentMinutes > endMinutes) {
    const diff = currentMinutes - endMinutes
    const hours = Math.floor(diff / 60)
    const minutes = diff % 60
    const diffStr =
      hours > 0 ? `${hours} jam ${minutes > 0 ? minutes + ' menit' : ''}` : `${minutes} menit`

    return {
      isDiscrepant: true,
      type: 'LATE',
      badgeLabel: 'Melewati Batas Jadwal',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
      title: 'Konfirmasi Check-In Melewati Batas Waktu',
      description: `Waktu check-in saat ini (${currentWibStr}) telah melewati jam selesai yang ditetapkan (${schedEnd} WIB, ${diffStr} yang lalu).`,
      timeDiffText: `${diffStr} terlewat`,
      scheduledDate: formattedSchedDate,
      scheduledTime: scheduledTimeStr,
      currentWibDate: formattedCurrDate,
      currentWibTime: currentWibStr,
    }
  }

  // On Schedule
  return {
    isDiscrepant: false,
    type: 'ON_TIME',
    badgeLabel: 'Sesuai Jadwal',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    title: 'Konfirmasi Check-In Ruangan',
    description: 'Waktu saat ini sesuai dengan rentang jam yang telah disetujui.',
    timeDiffText: 'Tepat waktu',
    scheduledDate: formattedSchedDate,
    scheduledTime: scheduledTimeStr,
    currentWibDate: formattedCurrDate,
    currentWibTime: currentWibStr,
  }
}

// Modal State for Time Discrepancy Confirmation
const discrepancyModal = ref<{
  isOpen: boolean
  request: RoomRequest | null
  discrepancy: DiscrepancyResult | null
  laboranNotes: string
}>({
  isOpen: false,
  request: null,
  discrepancy: null,
  laboranNotes: '',
})

// Check-In button click from list of approved requests
const handleRequestCheckInClick = (req: RoomRequest) => {
  const discrepancy = evaluateCheckInTimeDiscrepancy(req)

  if (discrepancy.isDiscrepant) {
    // Open confirmation pop-up modal
    discrepancyModal.value = {
      isOpen: true,
      request: req,
      discrepancy,
      laboranNotes: '',
    }
    return
  }

  // On-time check-in directly proceeds
  handlePerformCheckIn({
    laboratoryId: req.laboratoryId,
    activityName: req.activityName,
    requestId: req.id,
  })
}

// Confirm check-in from discrepancy modal
const handleConfirmDiscrepantCheckIn = async () => {
  if (!discrepancyModal.value.request) return
  const req = discrepancyModal.value.request
  const customNotes = discrepancyModal.value.laboranNotes.trim()

  let notes = req.activityName
  if (discrepancyModal.value.discrepancy?.isDiscrepant) {
    const label = discrepancyModal.value.discrepancy.badgeLabel
    notes = customNotes
      ? `${req.activityName} [${label}] - ${customNotes}`
      : `${req.activityName} [${label}]`
  }

  discrepancyModal.value.isOpen = false

  await handlePerformCheckIn({
    laboratoryId: req.laboratoryId,
    activityName: req.activityName,
    requestId: req.id,
    notes,
  })
}

// One-Click Check-In Handler from Approved Request / Schedule
const handlePerformCheckIn = async (item: {
  laboratoryId: string
  activityName: string
  requestId?: string
  scheduleId?: string
  notes?: string
}) => {
  if (!authStore.user?.id) {
    triggerToast('Sesi pengguna tidak ditemukan. Silakan masuk kembali.', 'error')
    return
  }
  isActionLoading.value = true
  errorMessage.value = ''
  try {
    await roomUsageService.createRoomUsage({
      laboratoryId: item.laboratoryId,
      requestId: item.requestId || undefined,
      scheduleId: item.scheduleId || undefined,
      checkedInBy: authStore.user.id,
      checkInTime: new Date().toISOString(),
      status: 'IN_USE',
      notes: item.notes || item.activityName,
    })
    triggerToast('Check-in laboratorium berhasil. Sesi kini aktif (LIVE).')
    await Promise.all([loadRoomUsages(), loadPendingCheckIns()])
  } catch (error: any) {
    console.error('Failed to check in room:', error)
    const errorMsg =
      error.response?.data?.message || error.message || 'Gagal melakukan check-in ruangan'

    // If already used, refresh the list immediately and show friendly warning
    if (errorMsg.includes('already has an associated room usage')) {
      triggerToast('Reservasi ini sudah pernah di-check-in sebelumnya.', 'warning')
      await loadPendingCheckIns()
    } else {
      triggerToast(errorMsg, 'error')
    }
  } finally {
    isActionLoading.value = false
  }
}

// Confirm Check-In for existing CHECKED_IN usage record
const handleConfirmCheckIn = async () => {
  if (!checkInTarget.value) return
  isActionLoading.value = true
  try {
    await roomUsageService.markInUse(checkInTarget.value.id)
    const id = checkInTarget.value.id.toUpperCase()
    checkInTarget.value = null
    await Promise.all([loadRoomUsages(), loadPendingCheckIns()])
    triggerToast(`Check-In dikonfirmasi untuk pemakaian ${id}. Status kini SEDANG DIPAKAI.`)
  } catch (error: any) {
    console.error('Failed to check in:', error)
    triggerToast(error.response?.data?.message || error.message || 'Gagal melakukan check-in', 'error')
  } finally {
    isActionLoading.value = false
  }
}

// Perform Check-Out
const handleConfirmCheckOut = async () => {
  if (!checkOutTarget.value || !authStore.user) return
  isActionLoading.value = true
  try {
    await roomUsageService.updateRoomUsage(checkOutTarget.value.id, {
      checkedOutBy: authStore.user.id,
      checkOutTime: new Date().toISOString(),
      status: 'CHECKED_OUT',
      notes: checkOutNotes.value.trim() || undefined,
    })
    const id = checkOutTarget.value.id.toUpperCase()
    checkOutTarget.value = null
    checkOutNotes.value = ''
    await Promise.all([loadRoomUsages(), loadPendingCheckIns()])
    triggerToast(`Check-out selesai untuk pemakaian ${id}. Sesi ditandai SELESAI.`)
  } catch (error: any) {
    console.error('Failed to check out:', error)
    triggerToast(error.response?.data?.message || error.message || 'Gagal melakukan check-out', 'error')
  } finally {
    isActionLoading.value = false
  }
}

// Handle Ad-Hoc Check-In submission
const handleCreateAdHocCheckIn = async () => {
  if (!authStore.user?.id) {
    triggerToast('Sesi pengguna tidak ditemukan. Silakan masuk kembali.', 'error')
    return
  }
  if (!adHocForm.value.laboratoryId || !adHocForm.value.activityName.trim()) {
    triggerToast('Silakan pilih laboratorium dan masukkan judul kegiatan.', 'error')
    return
  }
  isActionLoading.value = true
  try {
    // Directly create live room usage with laboratory_id and activity_name
    await roomUsageService.createRoomUsage({
      laboratoryId: adHocForm.value.laboratoryId,
      activityName: adHocForm.value.activityName.trim(),
      checkedInBy: authStore.user.id,
      checkInTime: new Date().toISOString(),
      status: 'IN_USE',
      notes: adHocForm.value.notes?.trim() || adHocForm.value.activityName.trim(),
    })

    showAdHocModal.value = false
    adHocForm.value = {
      laboratoryId: '',
      activityName: '',
      applicantName: '',
      participantCount: 30,
      startTime: '08:00',
      endTime: '10:00',
      notes: ''
    }
    triggerToast('Check-in insidental berhasil dicatat. Sesi kini aktif (LIVE).')
    await Promise.all([loadRoomUsages(), loadPendingCheckIns()])
  } catch (error: any) {
    console.error('Failed to log ad-hoc check-in:', error)
    triggerToast(error.response?.data?.message || error.message || 'Gagal mencatat check-in insidental', 'error')
  } finally {
    isActionLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6 pb-12 select-none">

    <!-- 1. Page Header Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2.5 border-b border-gray-200/60">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
            Log Pemakaian Lab
          </h1>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-dark-green text-[11px] font-bold">
            <DoorOpen :size="12" />
            Kontrol Operasional Sesi Langsung
          </span>
        </div>
        <p class="text-xs sm:text-sm text-text-muted font-normal">
          Pantau dan kelola sesi ruangan yang sedang aktif, check-in mendatang, dan log riwayat pemakaian.
        </p>
      </div>

      <!-- Header Controls -->
      <div class="flex items-center gap-2.5 self-start sm:self-auto shrink-0 flex-wrap">
        <button
          @click="showAdHocModal = true"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Plus :size="14" stroke-width="2.5" />
          <span>Catat Check-In Insidental</span>
        </button>

        <button
          @click="handleRefresh"
          :disabled="isRefreshing"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-gray-200/80 bg-white hover:bg-surface text-text-secondary text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw :size="14" :class="{ 'animate-spin': isRefreshing }" />
          <span>Perbarui</span>
        </button>
      </div>
    </div>

    <!-- Toast Notification Banner -->
    <div
      v-if="showToast"
      :class="[
        'p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in zoom-in-95 duration-150',
        toastType === 'success'
          ? 'bg-emerald-50 border-emerald-200 text-dark-green'
          : toastType === 'warning'
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-rose-50 border-rose-200 text-rose-800'
      ]"
    >
      <div class="flex items-center gap-2">
        <CheckCircle2 v-if="toastType === 'success'" :size="16" class="text-dark-green shrink-0" />
        <AlertTriangle v-else-if="toastType === 'warning'" :size="16" class="text-amber-600 shrink-0" />
        <AlertCircle v-else :size="16" class="text-rose-600 shrink-0" />
        <span>{{ toastMessage }}</span>
      </div>
      <button @click="showToast = false" class="hover:opacity-80 cursor-pointer">
        <X :size="14" />
      </button>
    </div>

    <!-- 2. Top Summary Statistic Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      <SummaryCard
        title="Sesi Aktif"
        :value="activeUsageSessions.length"
        subtext="Sedang berlangsung"
        :icon="Activity"
        icon-bg-class="bg-emerald-50"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Check-In Mendatang"
        :value="approvedRequests.length + upcomingUsageSessions.length"
        subtext="Siap untuk check-in"
        :icon="Clock"
        icon-bg-class="bg-sky-50"
        icon-color-class="text-sky-700"
      />
      <SummaryCard
        title="Selesai Hari Ini"
        :value="completedUsageSessions.length"
        subtext="Sesi yang telah selesai"
        :icon="CheckCircle2"
        icon-bg-class="bg-brand-100"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Total Log Riwayat"
        :value="totalUsageTodayCount"
        subtext="Semua log pemakaian lab"
        :icon="Layers"
        icon-bg-class="bg-surface"
        icon-color-class="text-text-secondary"
      />
    </div>

    <!-- Interactive Check-In Modal / Box -->
    <div
      v-if="checkInTarget"
      class="p-5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-xs space-y-3 animate-in fade-in shadow-xs"
    >
      <div class="flex items-start gap-3">
        <DoorOpen :size="20" class="text-dark-green shrink-0 mt-0.5" />
        <div class="space-y-1">
          <h3 class="font-extrabold text-sm text-dark-green">Konfirmasi Check-In Ruangan untuk {{ checkInTarget.laboratoryName || 'N/A' }}</h3>
          <p class="text-text-secondary">
            Kegiatan: <strong>{{ checkInTarget.activityName || 'N/A' }}</strong> — Pengguna: <strong>{{ checkInTarget.checkedInByName }}</strong>. Konfirmasi inisialisasi akses ruangan.
          </p>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 pt-2 border-t border-emerald-200/60">
        <button
          @click="checkInTarget = null"
          :disabled="isActionLoading"
          class="px-3.5 py-1.5 rounded-full border border-gray-200 bg-white text-text-secondary hover:bg-surface text-xs font-bold transition-all cursor-pointer"
        >
          Batal
        </button>

        <button
          @click="handleConfirmCheckIn"
          :disabled="isActionLoading"
          class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          <Loader2 v-if="isActionLoading" :size="13" class="animate-spin" />
          <Check v-else :size="13" />
          <span>Konfirmasi Check-In</span>
        </button>
      </div>
    </div>

    <!-- Interactive Check-Out Modal / Box -->
    <div
      v-if="checkOutTarget"
      class="p-5 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-xs space-y-3 animate-in fade-in shadow-xs"
    >
      <div class="flex items-start gap-3">
        <LogOut :size="20" class="text-amber-800 shrink-0 mt-0.5" />
        <div class="space-y-1">
          <h3 class="font-extrabold text-sm text-amber-900">Selesaikan Pemakaian Ruangan untuk {{ checkOutTarget.laboratoryName || 'N/A' }}</h3>
          <p class="text-amber-800 text-xs">
            Konfirmasi bahwa sesi <strong>"{{ checkOutTarget.activityName || 'N/A' }}"</strong> oleh {{ checkOutTarget.checkedInByName }} telah selesai.
          </p>
        </div>
      </div>

      <div class="space-y-1">
        <label class="block font-bold text-amber-900 text-[11px] uppercase tracking-wider">
          Catatan / Keterangan Penyelesaian (Opsional)
        </label>
        <input
          v-model="checkOutNotes"
          type="text"
          placeholder="contoh: Komputer dan pendingin ruangan telah dimatikan..."
          class="w-full p-2.5 rounded-xl bg-white border border-amber-200 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-300 font-normal"
        />
      </div>

      <div class="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/60">
        <button
          @click="checkOutTarget = null"
          :disabled="isActionLoading"
          class="px-3.5 py-1.5 rounded-full border border-gray-200 bg-white text-text-secondary hover:bg-surface text-xs font-bold transition-all cursor-pointer"
        >
          Batal
        </button>

        <button
          @click="handleConfirmCheckOut"
          :disabled="isActionLoading"
          class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          <Loader2 v-if="isActionLoading" :size="13" class="animate-spin" />
          <Check v-else :size="13" />
          <span>Konfirmasi Selesai (Check-Out)</span>
        </button>
      </div>
    </div>

    <!-- 3. Primary Operational Control Section: Currently In Use -->
    <div class="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/70 shadow-2xs space-y-4">
      <div class="flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-base font-extrabold text-text-primary tracking-tight">Sedang Dipakai Saat Ini</h2>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-dark-green text-[10px] font-extrabold">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              OKUPANSI LANGSUNG
            </span>
          </div>
          <p class="text-xs text-text-muted">Laboratorium yang sedang digunakan untuk sesi aktif saat ini.</p>
        </div>

        <span class="text-xs font-bold text-text-muted">{{ activeUsageSessions.length }} Ruangan Aktif</span>
      </div>

      <!-- Active Sessions Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="session in activeUsageSessions"
          :key="session.id"
          class="p-4 rounded-xl border border-brand-200/80 bg-brand-50/30 hover:bg-brand-50/60 transition-all space-y-3 shadow-2xs"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <span class="px-1.5 py-0.2 rounded bg-dark-green text-white text-[10px] font-mono font-extrabold">
                {{ session.laboratoryCode || 'LAB' }}
              </span>
              <h3 class="text-sm font-extrabold text-text-primary">{{ session.laboratoryName }}</h3>
            </div>

            <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-dark-green text-[10px] font-bold flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              SEDANG DIPAKAI
            </span>
          </div>

          <div>
            <h4 class="text-xs font-bold text-dark-green">{{ session.activityName || 'N/A' }}</h4>
            <p class="text-[11px] text-text-muted mt-0.5">Pengguna / Dosen: <strong class="text-text-primary font-semibold">{{ session.checkedInByName }}</strong></p>
          </div>

          <div class="p-2.5 rounded-lg bg-white/80 border border-brand-100 flex items-center justify-between text-[11px]">
            <div>
              <span class="text-text-muted block">Waktu Check-In:</span>
              <strong class="font-mono text-dark-green font-bold">{{ session.formattedCheckInTime }}</strong>
            </div>

            <div class="text-right">
              <span class="text-text-muted block">Status:</span>
              <strong class="font-mono text-dark-green font-bold">Sesi Aktif</strong>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-2 pt-1">
            <button
              @click="navigateToDetail(session.id)"
              class="px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-surface text-text-secondary text-xs font-bold transition-colors cursor-pointer"
            >
              Lihat Rincian
            </button>

            <button
              @click="checkOutTarget = session"
              class="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
            >
              <LogOut :size="13" />
              <span>Selesai (Check-Out)</span>
            </button>
          </div>
        </div>

        <!-- Empty Active State -->
        <div v-if="activeUsageSessions.length === 0" class="col-span-full py-8 text-center text-text-muted space-y-1">
          <DoorOpen :size="32" class="mx-auto text-text-muted/40 mb-1" />
          <h4 class="text-xs font-bold text-text-secondary">Tidak ada laboratorium yang sedang dipakai</h4>
          <p class="text-[11px] text-text-muted">Seluruh ruangan saat ini tersedia untuk check-in yang dijadwalkan.</p>
        </div>
      </div>
    </div>

    <!-- 4. Secondary Operational Grid: Upcoming Usage & Recently Completed -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

      <!-- Upcoming Usage Ready for Check-In -->
      <div class="bg-white p-5 rounded-2xl border border-gray-200/70 shadow-2xs space-y-3">
        <div class="flex items-center justify-between border-b border-gray-100 pb-2.5">
          <h3 class="text-xs font-extrabold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
            <Clock :size="14" class="text-sky-700" />
            <span>Sesi Siap untuk Check-In</span>
          </h3>
          <span class="text-[10px] text-text-muted font-bold">{{ approvedRequests.length + upcomingUsageSessions.length }} Disetujui / Menunggu</span>
        </div>

        <!-- List of Approved Bookings Ready for Check-In -->
        <div v-if="approvedRequests.length > 0 || upcomingUsageSessions.length > 0" class="space-y-2.5">
          
          <!-- From Approved Room Requests -->
          <div
            v-for="req in approvedRequests"
            :key="req.id"
            class="p-3 rounded-xl border border-gray-100 bg-surface/30 hover:bg-brand-50/20 transition-all flex items-center justify-between gap-3 text-xs"
          >
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="font-bold text-text-primary truncate">{{ req.laboratoryName }}</span>
                <span class="px-1.5 py-0.2 rounded bg-emerald-50 text-dark-green text-[10px] font-bold border border-emerald-200">
                  DISETUJUI
                </span>
              </div>
              <p class="text-[11px] font-semibold text-dark-green mt-0.5 truncate">{{ req.activityName }}</p>
              <p class="text-[10px] text-text-muted mt-0.5 font-mono">
                {{ req.formattedRequestDate || req.requestDate }} · {{ req.startTime }} - {{ req.endTime }} ({{ req.applicantName }})
              </p>
            </div>

            <button
              @click="handleRequestCheckInClick(req)"
              :disabled="isActionLoading"
              class="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
            >
              <DoorOpen :size="13" />
              <span>Check-In</span>
            </button>
          </div>

          <!-- From Existing CHECKED_IN records -->
          <div
            v-for="item in upcomingUsageSessions"
            :key="item.id"
            class="p-3 rounded-xl border border-gray-100 bg-surface/30 hover:bg-brand-50/20 transition-all flex items-center justify-between gap-3 text-xs"
          >
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="font-bold text-text-primary truncate">{{ item.laboratoryName || 'Lab' }}</span>
                <span class="px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 text-[10px] font-bold">
                  CHECK-IN
                </span>
              </div>
              <p class="text-[11px] font-semibold text-dark-green mt-0.5 truncate">{{ item.activityName || 'N/A' }}</p>
              <p class="text-[10px] text-text-muted mt-0.5">Oleh {{ item.checkedInByName }}</p>
            </div>

            <button
              @click="checkInTarget = item"
              class="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <DoorOpen :size="13" />
              <span>Check-In</span>
            </button>
          </div>

        </div>

        <!-- Clean Empty State Fallback -->
        <div v-else class="py-10 text-center text-text-muted space-y-1">
          <Clock :size="30" class="mx-auto text-text-muted/40 mb-1" />
          <h4 class="text-xs font-bold text-text-secondary">Tidak ada reservasi disetujui yang menunggu check-in</h4>
          <p class="text-[11px] text-text-muted">Permohonan pinjam yang disetujui akan muncul di sini untuk proses check-in cepat.</p>
        </div>
      </div>

      <!-- Recently Completed -->
      <div class="bg-white p-5 rounded-2xl border border-gray-200/70 shadow-2xs space-y-3">
        <div class="flex items-center justify-between border-b border-gray-100 pb-2.5">
          <h3 class="text-xs font-extrabold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
            <CheckCircle2 :size="14" class="text-dark-green" />
            <span>Sesi Baru Saja Selesai</span>
          </h3>
          <span class="text-[10px] text-text-muted font-bold">{{ completedUsageSessions.length }} Selesai</span>
        </div>

        <div v-if="completedUsageSessions.length > 0" class="space-y-2.5">
          <div
            v-for="item in completedUsageSessions"
            :key="item.id"
            class="p-3 rounded-xl border border-gray-100 bg-surface/30 flex items-center justify-between gap-3 text-xs"
          >
            <div>
              <div class="flex items-center gap-1.5">
                <span class="font-bold text-text-primary">{{ item.laboratoryName || 'N/A' }}</span>
                <span class="px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 text-[10px] font-bold">SELESAI</span>
              </div>
              <p class="text-[11px] font-medium text-text-secondary mt-0.5">{{ item.activityName || 'N/A' }}</p>
              <p class="text-[10px] text-text-muted mt-0.5 font-mono">Check-out: {{ item.formattedCheckOutTime || 'Baru saja' }}</p>
            </div>

            <button
              @click="navigateToDetail(item.id)"
              class="px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-surface text-text-secondary text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              Lihat Log
            </button>
          </div>
        </div>

        <div v-else class="py-10 text-center text-text-muted space-y-1">
          <CheckCircle2 :size="30" class="mx-auto text-text-muted/40 mb-1" />
          <h4 class="text-xs font-bold text-text-secondary">Belum ada sesi selesai yang tercatat hari ini</h4>
          <p class="text-[11px] text-text-muted">Sesi yang telah di-check-out akan muncul di sini sebagai riwayat audit.</p>
        </div>
      </div>

    </div>

    <!-- 5. Primary Room Usage History Table -->
    <div class="bg-white p-4 rounded-2xl border border-gray-200/70 shadow-2xs space-y-4">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h3 class="text-sm font-extrabold text-text-primary tracking-tight">Riwayat Operasional Pemakaian Lab</h3>
          <p class="text-[11px] text-text-muted">Audit log lengkap dari seluruh check-in ruangan, sesi aktif, dan check-out.</p>
        </div>

        <!-- Filters -->
        <div class="flex items-center gap-2 flex-wrap text-xs">
          <!-- Search -->
          <div class="relative min-w-[180px]">
            <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari riwayat pemakaian..."
              class="w-full pl-8 pr-3 py-1.5 bg-surface/60 border border-gray-200/80 rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-400 focus:bg-white transition-all"
            />
          </div>

          <!-- Status Dropdown -->
          <select
            v-model="selectedStatusFilter"
            class="px-3 py-1.5 rounded-xl bg-surface border border-gray-200/80 text-xs font-bold text-text-primary focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="IN_USE">Sedang Dipakai (Aktif)</option>
            <option value="CHECKED_IN">Check-In</option>
            <option value="CHECKED_OUT">Selesai</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>

          <button
            v-if="searchQuery || selectedStatusFilter !== 'ALL'"
            @click="resetFilters"
            class="p-1.5 rounded-xl border border-gray-200 text-text-muted hover:text-text-primary cursor-pointer"
            title="Reset Filter"
          >
            <RotateCcw :size="13" />
          </button>
        </div>
      </div>

      <!-- Data Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-surface/50 border-b border-gray-100 text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              <th class="py-3.5 px-4">ID Pemakaian</th>
              <th class="py-3.5 px-4">Laboratorium</th>
              <th class="py-3.5 px-4">Kegiatan & Tujuan</th>
              <th class="py-3.5 px-4">Waktu Check-In</th>
              <th class="py-3.5 px-4">Waktu Check-Out</th>
              <th class="py-3.5 px-4">Check-In Oleh</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 text-xs">
            <tr
              v-for="item in paginatedUsage"
              :key="item.id"
              class="hover:bg-brand-50/20 transition-colors select-none"
            >
              <!-- Usage ID -->
              <td class="py-3.5 px-4 font-mono font-bold text-dark-green whitespace-nowrap">
                {{ item.id.toUpperCase() }}
              </td>

              <!-- Laboratory -->
              <td class="py-3.5 px-4 whitespace-nowrap">
                <span class="px-1.5 py-0.2 rounded bg-gray-100 text-text-muted text-[10px] font-mono font-bold mr-1">
                  {{ item.laboratoryCode || 'LAB' }}
                </span>
                <span class="font-bold text-text-primary">{{ item.laboratoryName || 'N/A' }}</span>
              </td>

              <!-- Activity -->
              <td class="py-3.5 px-4">
                <span class="font-bold text-text-primary block truncate max-w-[200px]">{{ item.activityName || 'N/A' }}</span>
                <span class="text-[10px] text-dark-green font-bold block">{{ item.activityName || 'N/A' }}</span>
              </td>

              <!-- Check-In Time -->
              <td class="py-3.5 px-4 font-mono text-text-secondary whitespace-nowrap">
                {{ item.formattedCheckInTime }}
              </td>

              <!-- Check-Out Time -->
              <td class="py-3.5 px-4 font-mono text-text-muted whitespace-nowrap">
                {{ item.formattedCheckOutTime || '— Sedang Berjalan —' }}
              </td>

              <!-- Instructor -->
              <td class="py-3.5 px-4 whitespace-nowrap font-medium text-text-primary">
                {{ item.checkedInByName }}
              </td>

              <!-- Status -->
              <td class="py-3.5 px-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border',
                    item.status === 'IN_USE'
                      ? 'bg-emerald-50 text-dark-green border-emerald-200'
                      : item.status === 'CHECKED_IN'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : item.status === 'CHECKED_OUT'
                          ? 'bg-gray-100 text-gray-600 border-gray-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                  ]"
                >
                  <span v-if="item.status === 'IN_USE'" class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{{
                    item.status === 'IN_USE'
                      ? 'Sedang Dipakai'
                      : item.status === 'CHECKED_IN'
                        ? 'Check-In'
                        : item.status === 'CHECKED_OUT'
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

            <tr v-if="paginatedUsage.length === 0">
              <td colspan="8" class="py-12 text-center text-text-muted space-y-2">
                <FileText :size="36" class="mx-auto text-text-muted/40 mb-2" />
                <h4 class="text-xs font-bold text-text-secondary">Riwayat pemakaian ruangan tidak ditemukan</h4>
                <p class="text-[11px] text-text-muted max-w-sm mx-auto">
                  Tidak ada data log penggunaan laboratorium yang cocok dengan filter yang dipilih.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-3 py-2 border-t border-gray-100 flex items-center justify-between text-xs">
        <span class="text-text-muted font-medium">
          Menampilkan <strong>{{ paginatedUsage.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0 }}</strong> – <strong>{{ Math.min(currentPage * itemsPerPage, totalRecords) }}</strong> dari <strong>{{ totalRecords }}</strong> riwayat
        </span>

        <div class="flex items-center gap-1.5">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="p-1 rounded-lg border border-gray-200 text-text-muted hover:text-text-primary disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft :size="14" />
          </button>
          <span class="px-2.5 py-0.5 font-bold text-dark-green bg-brand-100 rounded-lg">
            {{ currentPage }} / {{ totalPages }}
          </span>
          <button
            @click="currentPage++"
            :disabled="currentPage >= totalPages"
            class="p-1 rounded-lg border border-gray-200 text-text-muted hover:text-text-primary disabled:opacity-40 cursor-pointer"
          >
            <ChevronRight :size="14" />
          </button>
        </div>
      </div>
    </div>

    <!-- Ad-Hoc Check-In Modal Dialog -->
    <div
      v-if="showAdHocModal"
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div class="bg-white rounded-3xl border border-gray-200/80 shadow-2xl w-full max-w-lg overflow-hidden p-6 sm:p-7 space-y-4 text-xs animate-in zoom-in-95 duration-200">
        <div class="flex items-center justify-between border-b border-gray-100 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center">
              <DoorOpen :size="16" />
            </div>
            <div>
              <h3 class="text-sm font-extrabold text-text-primary">Catat Check-In Insidental</h3>
              <p class="text-[11px] text-text-muted">Mulai sesi penggunaan laboratorium secara langsung.</p>
            </div>
          </div>

          <button @click="showAdHocModal = false" class="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-surface cursor-pointer transition-colors">
            <X :size="16" />
          </button>
        </div>

        <form @submit.prevent="handleCreateAdHocCheckIn" class="space-y-3.5">
          <!-- Laboratory Selection -->
          <div class="space-y-1">
            <label class="block font-bold text-text-primary">Laboratorium Tujuan <span class="text-danger">*</span></label>
            <select
              v-model="adHocForm.laboratoryId"
              required
              class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/80 rounded-xl text-text-primary font-semibold focus:outline-none focus:border-brand-400 focus:bg-white cursor-pointer transition-all"
            >
              <option value="" disabled>Pilih laboratorium...</option>
              <option v-for="lab in laboratories" :key="lab.id" :value="lab.id">
                {{ lab.name }} ({{ lab.code || 'Kapasitas: ' + lab.maximumCapacity }})
              </option>
            </select>
          </div>

          <!-- Activity / Purpose -->
          <div class="space-y-1">
            <label class="block font-bold text-text-primary">Judul Kegiatan / Sesi <span class="text-danger">*</span></label>
            <input
              v-model="adHocForm.activityName"
              type="text"
              placeholder="contoh: Remedial Praktikum / Belajar Mandiri"
              required
              class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/80 rounded-xl text-text-primary font-semibold focus:outline-none focus:border-brand-400 focus:bg-white transition-all"
            />
          </div>

          <!-- Participant Count & Times -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="space-y-1">
              <label class="block font-bold text-text-primary">Jumlah Peserta</label>
              <input
                v-model.number="adHocForm.participantCount"
                type="number"
                min="1"
                class="w-full px-3.5 py-2 bg-surface/60 border border-gray-200/80 rounded-xl text-text-primary font-semibold focus:outline-none focus:border-brand-400 focus:bg-white transition-all"
              />
            </div>

            <TimePicker24
              v-model="adHocForm.startTime"
              label="Waktu Mulai"
              min-time="07:00"
              max-time="20:00"
              :step-minutes="30"
            />

            <TimePicker24
              v-model="adHocForm.endTime"
              label="Waktu Selesai"
              min-time="08:00"
              max-time="21:00"
              :step-minutes="30"
            />
          </div>

          <!-- Operational Notes -->
          <div class="space-y-1">
            <label class="block font-bold text-text-primary">Catatan Operasional (Opsional)</label>
            <input
              v-model="adHocForm.notes"
              type="text"
              placeholder="contoh: Diizinkan oleh Koordinator Laboratorium"
              class="w-full px-3.5 py-2 bg-surface/60 border border-gray-200/80 rounded-xl text-text-primary font-medium focus:outline-none focus:border-brand-400 focus:bg-white transition-all"
            />
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              @click="showAdHocModal = false"
              class="px-4 py-2 rounded-xl border border-gray-200 text-text-secondary hover:bg-surface font-bold cursor-pointer transition-all active:scale-95"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="isActionLoading"
              class="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-dark-green hover:bg-[#547a5c] text-white font-bold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Loader2 v-if="isActionLoading" :size="14" class="animate-spin" />
              <DoorOpen v-else :size="14" />
              <span>Mulai Sesi Langsung</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Konfirmasi Check-In Di Luar Jadwal (Early / Late / Different Date) -->
    <div
      v-if="discrepancyModal.isOpen && discrepancyModal.request && discrepancyModal.discrepancy"
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        class="bg-white rounded-3xl border border-gray-200/80 shadow-2xl w-full max-w-lg overflow-hidden p-6 sm:p-7 space-y-4 text-xs animate-in zoom-in-95 duration-200"
      >
        <!-- Modal Header -->
        <div class="flex items-start justify-between gap-3 border-b border-gray-100 pb-3.5">
          <div class="flex items-center gap-3">
            <div
              :class="[
                'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border',
                discrepancyModal.discrepancy.type === 'LATE'
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-amber-50 border-amber-200 text-amber-600'
              ]"
            >
              <AlertTriangle :size="22" />
            </div>
            <div>
              <h3 class="text-sm sm:text-base font-extrabold text-gray-900 leading-snug">
                {{ discrepancyModal.discrepancy.title }}
              </h3>
              <p class="text-[11px] text-text-muted mt-0.5">
                Konfirmasi persetujuan akses ruangan di luar jadwal yang ditetapkan.
              </p>
            </div>
          </div>

          <button
            @click="discrepancyModal.isOpen = false"
            :disabled="isActionLoading"
            class="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-surface cursor-pointer shrink-0 transition-colors"
          >
            <X :size="18" />
          </button>
        </div>

        <!-- Discrepancy Alert Box -->
        <div
          :class="[
            'p-4 rounded-2xl border space-y-2',
            discrepancyModal.discrepancy.type === 'LATE'
              ? 'bg-rose-50/70 border-rose-200/80 text-rose-950'
              : 'bg-amber-50/70 border-amber-200/80 text-amber-950'
          ]"
        >
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <span
              :class="[
                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border shadow-2xs',
                discrepancyModal.discrepancy.badgeClass
              ]"
            >
              <Clock :size="11" />
              {{ discrepancyModal.discrepancy.badgeLabel }}
            </span>
            <span class="text-[11px] font-bold font-mono">
              {{ discrepancyModal.discrepancy.timeDiffText }}
            </span>
          </div>

          <p class="text-[12px] font-medium leading-relaxed">
            {{ discrepancyModal.discrepancy.description }}
          </p>
        </div>

        <!-- Comparison Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <!-- Current Time -->
          <div class="p-3 rounded-xl bg-surface/70 border border-gray-200/70 space-y-1">
            <div class="flex items-center gap-1.5 text-text-muted text-[10px] font-semibold uppercase tracking-wide">
              <Clock :size="12" class="text-text-secondary" />
              <span>Waktu Saat Ini (WIB)</span>
            </div>
            <p class="text-base font-bold font-mono text-text-primary">
              {{ discrepancyModal.discrepancy.currentWibTime }}
            </p>
            <p class="text-[10px] text-text-muted truncate">
              {{ discrepancyModal.discrepancy.currentWibDate }}
            </p>
          </div>

          <!-- Official Schedule -->
          <div class="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70 space-y-1">
            <div class="flex items-center gap-1.5 text-dark-green text-[10px] font-semibold uppercase tracking-wide">
              <Calendar :size="12" />
              <span>Jadwal Resmi</span>
            </div>
            <p class="text-base font-bold font-mono text-dark-green">
              {{ discrepancyModal.discrepancy.scheduledTime }}
            </p>
            <p class="text-[10px] text-text-secondary truncate">
              {{ discrepancyModal.discrepancy.scheduledDate }}
            </p>
          </div>
        </div>

        <!-- Session Details Summary -->
        <div class="p-3.5 rounded-xl bg-gray-50/80 border border-gray-200/60 space-y-1.5">
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-text-muted font-medium flex items-center gap-1">
              <Building2 :size="12" /> Ruangan:
            </span>
            <span class="font-bold text-text-primary">
              {{ discrepancyModal.request.laboratoryName }} ({{ discrepancyModal.request.laboratoryCode }})
            </span>
          </div>
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-text-muted font-medium flex items-center gap-1">
              <FileText :size="12" /> Kegiatan:
            </span>
            <span class="font-bold text-dark-green truncate max-w-[240px]">
              {{ discrepancyModal.request.activityName }}
            </span>
          </div>
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-text-muted font-medium flex items-center gap-1">
              <Users :size="12" /> Pemohon / Dosen:
            </span>
            <span class="font-medium text-text-secondary">
              {{ discrepancyModal.request.applicantName }}
            </span>
          </div>
        </div>

        <!-- Optional Laboran Notes Input -->
        <div class="space-y-1">
          <label class="block font-bold text-text-primary text-[11px]">
            Catatan Alasan Check-In <span class="text-text-muted font-normal">(Opsional)</span>
          </label>
          <input
            v-model="discrepancyModal.laboranNotes"
            type="text"
            placeholder="contoh: Mahasiswa & dosen sudah hadir lebih awal untuk persiapan"
            class="w-full px-3.5 py-2 bg-surface/60 border border-gray-200/80 rounded-xl text-text-primary font-medium focus:outline-none focus:border-brand-400 focus:bg-white text-xs"
          />
        </div>

        <!-- Confirmation Prompt -->
        <p class="text-[11px] text-text-muted text-center font-medium">
          Apakah Anda yakin ingin tetap membuka akses dan melakukan <strong>Check-In</strong> sekarang?
        </p>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
          <button
            type="button"
            @click="discrepancyModal.isOpen = false"
            :disabled="isActionLoading"
            class="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-surface text-text-secondary text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            @click="handleConfirmDiscrepantCheckIn"
            :disabled="isActionLoading"
            :class="[
              'inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50',
              discrepancyModal.discrepancy.type === 'LATE'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
            ]"
          >
            <Loader2 v-if="isActionLoading" :size="14" class="animate-spin" />
            <DoorOpen v-else :size="14" />
            <span>Tetap Lanjutkan Check-In</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
