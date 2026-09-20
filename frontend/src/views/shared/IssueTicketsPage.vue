<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  Image as ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Tag,
  Trash2,
  UploadCloud,
  User,
  Wrench,
  X,
  XCircle,
  Building2,
  Cpu
} from 'lucide-vue-next'
import {
  issueTicketService,
  type IssueTicket,
  type IssueSeverity,
  type IssueStatus,
  type CreateIssueTicketPayload
} from '@/services/issue-ticket.service'
import { laboratoryService, type LaboratoryData } from '@/services/laboratory.service'
import { facilityService } from '@/services/facility.service'
import { authService } from '@/services/auth.service'
import { sessionManager } from '@/utils/session.utils'
import { getFileUrl, formatDateTime } from '@/utils/format.utils'
import { UserRole, type User as AuthUser } from '@/types'
import { BaseAvatar } from '@/components'
import { useLecturerNavStore } from '@/stores/lecturer-nav.store'
import { useLaboranNavStore } from '@/stores/laboran-nav.store'
import { useAdminNavStore } from '@/stores/admin-nav.store'

const route = useRoute()

const props = withDefaults(
  defineProps<{
    embedded?: boolean
  }>(),
  {
    embedded: false,
  }
)

// Navigation Stores for Breadcrumbs
const lecturerNav = useLecturerNavStore()
const laboranNav = useLaboranNavStore()
const adminNav = useAdminNavStore()

// Current User & Permissions
const currentUser = ref<AuthUser | null>(sessionManager.getUser())
const isStaffOrAdmin = computed(() => {
  const code = currentUser.value?.role?.code
  return code === UserRole.ADMIN || code === UserRole.LABORAN
})

// Data State
const tickets = ref<IssueTicket[]>([])
const isLoading = ref(true)
const laboratories = ref<LaboratoryData[]>([])
const availableFacilities = ref<Array<{ id: string; code: string; name: string; category: string }>>([])
const isLoadingFacilities = ref(false)

// Meta & Filtering State
const totalCount = ref(0)
const searchQuery = ref('')
const selectedStatus = ref<string>('')
const selectedSeverity = ref<string>('')
const selectedLabFilter = ref<string>('')

// Modals
const showCreateModal = ref(false)
const showDetailModal = ref(false)
const showStatusModal = ref(false)
const activeTicket = ref<IssueTicket | null>(null)
const previewImage = ref<string | null>(null)

// Toast Feedback
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')
const showToast = ref(false)

const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 4000)
}

// Create Form State
const createForm = reactive<{
  laboratory_id: string
  facility_id: string
  title: string
  description: string
  severity: IssueSeverity
  image_url: string
}>({
  laboratory_id: '',
  facility_id: '',
  title: '',
  description: '',
  severity: 'MEDIUM',
  image_url: '',
})

const createFormErrors = reactive({
  laboratory_id: '',
  title: '',
  description: '',
})

const isSubmittingCreate = ref(false)
const isUploadingImage = ref(false)
const uploadImageError = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

// Status Update Form State
const statusForm = reactive<{
  status: IssueStatus
  resolution_notes: string
}>({
  status: 'INVESTIGATING',
  resolution_notes: '',
})
const isSubmittingStatus = ref(false)

// Status & Severity Statistics
const stats = computed(() => {
  return {
    total: tickets.value.length,
    reported: tickets.value.filter((t) => t.status === 'REPORTED').length,
    investigating: tickets.value.filter((t) => t.status === 'INVESTIGATING').length,
    resolved: tickets.value.filter((t) => t.status === 'RESOLVED').length,
  }
})

// Setup Breadcrumbs
const setupBreadcrumbs = () => {
  if (route.path.startsWith('/lecturer')) {
    lecturerNav.setBreadcrumbs([
      { label: 'Portal Dosen', path: '/lecturer' },
      { label: 'Tiket Kendala Alat' },
    ])
  } else if (route.path.startsWith('/laboran')) {
    laboranNav.setBreadcrumbs([
      { label: 'Portal Laboran', path: '/laboran' },
      { label: 'Tiket Kendala Alat' },
    ])
  } else if (route.path.startsWith('/admin')) {
    adminNav.setBreadcrumbs([
      { label: 'Dashboard', path: '/admin' },
      { label: 'Tiket Kendala Alat' },
    ])
  }
}

// Load Laboratories for Dropdowns
const loadLaboratories = async () => {
  try {
    const res = await laboratoryService.getLaboratories({ limit: 100 })
    laboratories.value = res.laboratories || []
  } catch (err) {
    console.error('Failed to load laboratories:', err)
  }
}

// Fetch Tickets from API
const fetchTickets = async () => {
  isLoading.value = true
  try {
    const res = await issueTicketService.getAll({
      search: searchQuery.value || undefined,
      status: selectedStatus.value || undefined,
      severity: selectedSeverity.value || undefined,
      laboratory_id: selectedLabFilter.value || undefined,
      limit: 100,
    })
    tickets.value = res.data
    totalCount.value = res.meta.total
  } catch (err: any) {
    console.error('Failed to fetch issue tickets:', err)
    triggerToast(err.message || 'Gagal memuat daftar tiket kerusakan', 'error')
  } finally {
    isLoading.value = false
  }
}

// Load facilities when lab is changed in create form
watch(
  () => createForm.laboratory_id,
  async (newLabId) => {
    createForm.facility_id = ''
    availableFacilities.value = []
    if (!newLabId) return

    isLoadingFacilities.value = true
    try {
      availableFacilities.value = await facilityService.getFacilitiesByLaboratoryId(newLabId)
    } catch (err) {
      console.error('Failed to load facilities for lab:', err)
    } finally {
      isLoadingFacilities.value = false
    }
  }
)

// Handle Image Upload for Issue Ticket
const handleImageSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  const file = target.files[0]
  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    uploadImageError.value = 'Ukuran foto maksimal 5MB.'
    return
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    uploadImageError.value = 'Hanya foto berformat JPG, PNG, atau WEBP yang diperbolehkan.'
    return
  }

  uploadImageError.value = ''
  isUploadingImage.value = true

  try {
    const res = await issueTicketService.uploadImage(file)
    createForm.image_url = res.url
  } catch (err: any) {
    uploadImageError.value = err.message || 'Gagal mengunggah foto kendala'
  } finally {
    isUploadingImage.value = false
    target.value = ''
  }
}

const removeImage = () => {
  createForm.image_url = ''
  uploadImageError.value = ''
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// Validate & Submit New Ticket
const validateCreateForm = () => {
  createFormErrors.laboratory_id = ''
  createFormErrors.title = ''
  createFormErrors.description = ''

  let isValid = true
  if (!createForm.laboratory_id) {
    createFormErrors.laboratory_id = 'Pilih laboratorium terkait'
    isValid = false
  }
  if (!createForm.title.trim()) {
    createFormErrors.title = 'Judul kendala wajib diisi'
    isValid = false
  }
  if (!createForm.description.trim()) {
    createFormErrors.description = 'Deskripsi detail kerusakan wajib diisi'
    isValid = false
  }
  return isValid
}

const handleCreateTicket = async () => {
  if (!validateCreateForm()) return

  isSubmittingCreate.value = true
  try {
    const payload: CreateIssueTicketPayload = {
      laboratory_id: createForm.laboratory_id,
      facility_id: createForm.facility_id || undefined,
      title: createForm.title.trim(),
      description: createForm.description.trim(),
      severity: createForm.severity,
      image_url: createForm.image_url || undefined,
    }

    await issueTicketService.create(payload)
    triggerToast('Laporan kerusakan alat berhasil dikirimkan!', 'success')
    showCreateModal.value = false

    // Reset Form
    createForm.laboratory_id = ''
    createForm.facility_id = ''
    createForm.title = ''
    createForm.description = ''
    createForm.severity = 'MEDIUM'
    createForm.image_url = ''

    await fetchTickets()
  } catch (err: any) {
    triggerToast(err.message || 'Gagal mengirimkan laporan kerusakan', 'error')
  } finally {
    isSubmittingCreate.value = false
  }
}

// Open Detail Modal
const openDetail = (ticket: IssueTicket) => {
  activeTicket.value = ticket
  showDetailModal.value = true
}

// Open Status Update Modal (Laboran / Admin only)
const openStatusUpdate = (ticket: IssueTicket) => {
  activeTicket.value = ticket
  statusForm.status = ticket.status
  statusForm.resolution_notes = ticket.resolutionNotes || ''
  showStatusModal.value = true
}

const handleUpdateStatus = async () => {
  if (!activeTicket.value) return

  isSubmittingStatus.value = true
  try {
    await issueTicketService.updateStatus(activeTicket.value.id, {
      status: statusForm.status,
      resolution_notes: statusForm.resolution_notes.trim() || undefined,
    })

    triggerToast('Status tiket berhasil diperbarui!', 'success')
    showStatusModal.value = false
    if (showDetailModal.value && activeTicket.value) {
      activeTicket.value = await issueTicketService.getById(activeTicket.value.id)
    }
    await fetchTickets()
  } catch (err: any) {
    triggerToast(err.message || 'Gagal memperbarui status tiket', 'error')
  } finally {
    isSubmittingStatus.value = false
  }
}

// Severity Styles Helper
const getSeverityBadgeClass = (sev: IssueSeverity) => {
  switch (sev) {
    case 'CRITICAL':
      return 'bg-rose-50 border-rose-200 text-rose-700'
    case 'HIGH':
      return 'bg-amber-50 border-amber-200 text-amber-700'
    case 'MEDIUM':
      return 'bg-blue-50 border-blue-200 text-blue-700'
    case 'LOW':
      return 'bg-emerald-50 border-emerald-200 text-emerald-700'
    default:
      return 'bg-gray-50 border-gray-200 text-gray-700'
  }
}

const getSeverityLabel = (sev: IssueSeverity) => {
  switch (sev) {
    case 'CRITICAL':
      return 'Kritis / Mendesak'
    case 'HIGH':
      return 'Tinggi'
    case 'MEDIUM':
      return 'Sedang'
    case 'LOW':
      return 'Rendah'
    default:
      return sev
  }
}

// Status Styles Helper
const getStatusBadgeClass = (status: IssueStatus) => {
  switch (status) {
    case 'REPORTED':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'INVESTIGATING':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'RESOLVED':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'REJECTED':
      return 'bg-rose-100 text-rose-800 border-rose-200'
    case 'CLOSED':
      return 'bg-gray-100 text-gray-700 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

const getStatusLabel = (status: IssueStatus) => {
  switch (status) {
    case 'REPORTED':
      return 'Menunggu Penanganan'
    case 'INVESTIGATING':
      return 'Sedang Diperiksa'
    case 'RESOLVED':
      return 'Selesai Ditangani'
    case 'REJECTED':
      return 'Ditolak'
    case 'CLOSED':
      return 'Ditutup'
    default:
      return status
  }
}

onMounted(async () => {
  if (!props.embedded) {
    setupBreadcrumbs()
  }
  await Promise.all([loadLaboratories(), fetchTickets()])
})
</script>

<template>
  <div class="space-y-6 pb-12 select-none w-full max-w-full min-w-0">
    <!-- Toast Feedback Notification -->
    <div
      v-if="showToast"
      :class="[
        'fixed top-20 right-6 z-50 p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 shadow-lg animate-in fade-in slide-in-from-top-4 duration-200',
        toastType === 'success' ? 'bg-emerald-50 border-emerald-200 text-dark-green' : 'bg-red-50 border-red-200 text-danger'
      ]"
    >
      <CheckCircle2 v-if="toastType === 'success'" :size="18" class="text-dark-green shrink-0" />
      <AlertCircle v-else :size="18" class="text-danger shrink-0" />
      <span>{{ toastMessage }}</span>
      <button @click="showToast = false" class="ml-2 hover:opacity-75 cursor-pointer">
        <X :size="14" />
      </button>
    </div>

    <!-- Header Section (only shown when standalone) -->
    <div v-if="!props.embedded" class="space-y-3 pb-2 border-b border-gray-200/60 w-full min-w-0">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
              Tiket Kendala Fasilitas
            </h1>
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-100/80 border border-brand-200 text-dark-green text-[11px] font-bold">
              <Wrench :size="12" />
              Sistem Ticketing
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted">
            Pelaporan kerusakan perangkat keras/lunak laboratorium dan pemantauan penanganan teknis oleh staf laboran.
          </p>
        </div>

        <div class="flex items-center gap-2.5 shrink-0">
          <button
            @click="fetchTickets"
            :disabled="isLoading"
            class="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-text-secondary transition-colors cursor-pointer"
            title="Muat ulang tiket"
          >
            <RefreshCw :size="16" :class="{ 'animate-spin': isLoading }" />
          </button>

          <button
            @click="showCreateModal = true"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs shadow-dark-green/20 transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <Plus :size="16" />
            <span>Laporkan Kendala Baru</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Embedded Header Action Bar (when embedded in Facilities Hub) -->
    <div v-else class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-brand-50/40 p-4 rounded-2xl border border-brand-100/80">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
          <Wrench :size="17" />
        </div>
        <div>
          <h2 class="text-sm font-bold text-text-primary">Tiket Kendala & Kerusakan Alat</h2>
          <p class="text-[11px] text-text-muted">Pelaporan kerusakan, pembaruan status perbaikan, dan tindak lanjut teknis laboran.</p>
        </div>
      </div>
      <div class="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <button
          @click="fetchTickets"
          :disabled="isLoading"
          class="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-text-secondary transition-colors cursor-pointer"
          title="Muat ulang tiket"
        >
          <RefreshCw :size="15" :class="{ 'animate-spin': isLoading }" />
        </button>

        <button
          @click="showCreateModal = true"
          class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs shadow-dark-green/20 transition-all duration-150 active:scale-95 cursor-pointer"
        >
          <Plus :size="15" />
          <span>Laporkan Kendala Baru</span>
        </button>
      </div>
    </div>

    <!-- Quick Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-2xl border border-gray-200/70 p-4 shadow-2xs space-y-1">
        <span class="text-[11px] font-bold text-text-muted uppercase tracking-wider">Total Tiket</span>
        <div class="flex items-baseline justify-between">
          <span class="text-2xl font-black text-text-primary">{{ stats.total }}</span>
          <span class="text-xs text-text-muted">Laporan</span>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-amber-200/70 p-4 shadow-2xs space-y-1">
        <span class="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Menunggu Penanganan</span>
        <div class="flex items-baseline justify-between">
          <span class="text-2xl font-black text-amber-800">{{ stats.reported }}</span>
          <span class="text-xs text-amber-600 font-bold">Baru diajukan</span>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-blue-200/70 p-4 shadow-2xs space-y-1">
        <span class="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Sedang Diperiksa</span>
        <div class="flex items-baseline justify-between">
          <span class="text-2xl font-black text-blue-800">{{ stats.investigating }}</span>
          <span class="text-xs text-blue-600 font-bold">Investigasi</span>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-emerald-200/70 p-4 shadow-2xs space-y-1">
        <span class="text-[11px] font-bold text-dark-green uppercase tracking-wider">Selesai Ditangani</span>
        <div class="flex items-baseline justify-between">
          <span class="text-2xl font-black text-dark-green">{{ stats.resolved }}</span>
          <span class="text-xs text-dark-green font-bold">Normal kembali</span>
        </div>
      </div>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="bg-white rounded-2xl border border-gray-200/70 p-4 shadow-2xs space-y-3">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <!-- Search -->
        <div class="relative flex-1">
          <Search :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            v-model="searchQuery"
            @keyup.enter="fetchTickets"
            type="text"
            placeholder="Cari nomor tiket, judul kendala, atau nama alat..."
            class="w-full pl-9 pr-4 py-2 bg-surface border border-gray-200 rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green"
          />
        </div>

        <!-- Filter Selects -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Status Select -->
          <select
            v-model="selectedStatus"
            @change="fetchTickets"
            class="px-3 py-2 rounded-xl bg-surface border border-gray-200 text-xs font-bold text-text-secondary focus:outline-none focus:border-dark-green cursor-pointer"
          >
            <option value="">Semua Status</option>
            <option value="REPORTED">Menunggu Penanganan</option>
            <option value="INVESTIGATING">Sedang Diperiksa</option>
            <option value="RESOLVED">Selesai Ditangani</option>
            <option value="REJECTED">Ditolak</option>
            <option value="CLOSED">Ditutup</option>
          </select>

          <!-- Severity Select -->
          <select
            v-model="selectedSeverity"
            @change="fetchTickets"
            class="px-3 py-2 rounded-xl bg-surface border border-gray-200 text-xs font-bold text-text-secondary focus:outline-none focus:border-dark-green cursor-pointer"
          >
            <option value="">Semua Tingkat</option>
            <option value="LOW">Rendah</option>
            <option value="MEDIUM">Sedang</option>
            <option value="HIGH">Tinggi</option>
            <option value="CRITICAL">Kritis / Mendesak</option>
          </select>

          <!-- Lab Filter -->
          <select
            v-model="selectedLabFilter"
            @change="fetchTickets"
            class="px-3 py-2 rounded-xl bg-surface border border-gray-200 text-xs font-bold text-text-secondary focus:outline-none focus:border-dark-green cursor-pointer"
          >
            <option value="">Semua Laboratorium</option>
            <option v-for="lab in laboratories" :key="lab.id" :value="lab.id">
              {{ lab.code }} - {{ lab.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="space-y-3">
      <div v-for="n in 3" :key="n" class="bg-white rounded-2xl border border-gray-200/70 p-5 animate-pulse space-y-3">
        <div class="flex justify-between">
          <div class="h-4 bg-gray-200 rounded w-1/4"></div>
          <div class="h-4 bg-gray-200 rounded w-20"></div>
        </div>
        <div class="h-5 bg-gray-200 rounded w-1/2"></div>
        <div class="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="tickets.length === 0"
      class="bg-white rounded-2xl border border-gray-200/70 p-12 text-center space-y-4 shadow-2xs"
    >
      <div class="w-16 h-16 rounded-2xl bg-emerald-50 text-dark-green border border-emerald-100 flex items-center justify-center mx-auto">
        <CheckCircle2 :size="32" />
      </div>
      <div class="max-w-md mx-auto">
        <h3 class="text-base font-extrabold text-text-primary">Tidak Ada Tiket Kendala</h3>
        <p class="text-xs text-text-muted mt-1">
          Tidak ditemukan laporan kendala fasilitas yang cocok dengan kriteria filter saat ini.
        </p>
      </div>
      <button
        @click="showCreateModal = true"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-green text-white text-xs font-bold hover:bg-[#547a5c] transition-colors cursor-pointer"
      >
        <Plus :size="14" />
        <span>Buat Tiket Baru</span>
      </button>
    </div>

    <!-- Tickets List -->
    <div v-else class="space-y-3.5">
      <div
        v-for="ticket in tickets"
        :key="ticket.id"
        class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 transition-all hover:border-dark-green/40 hover:shadow-xs space-y-3"
      >
        <!-- Top Row: Ticket Number, Badges, Date -->
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-mono text-xs font-black text-dark-green bg-brand-50 px-2.5 py-0.5 rounded-lg border border-brand-200">
              {{ ticket.ticketNumber }}
            </span>
            <span :class="['px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border', getStatusBadgeClass(ticket.status)]">
              {{ getStatusLabel(ticket.status) }}
            </span>
            <span :class="['px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border', getSeverityBadgeClass(ticket.severity)]">
              Tingkat: {{ getSeverityLabel(ticket.severity) }}
            </span>
          </div>

          <span class="text-[11px] text-text-muted font-mono">
            {{ formatDateTime(ticket.createdAt) }}
          </span>
        </div>

        <!-- Middle Row: Title, Description, Associated Lab & Facility -->
        <div class="space-y-1.5">
          <h3 class="text-base font-bold text-text-primary tracking-tight">
            {{ ticket.title }}
          </h3>
          <p class="text-xs text-text-secondary leading-relaxed line-clamp-2 font-medium">
            {{ ticket.description }}
          </p>
        </div>

        <!-- Tags & Associations Row -->
        <div class="flex flex-wrap items-center gap-2 pt-1">
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-gray-200 text-xs font-bold text-text-secondary">
            <Building2 :size="13" class="text-dark-green" />
            <span>{{ ticket.laboratoryCode }} ({{ ticket.laboratoryName }})</span>
          </div>

          <div v-if="ticket.facilityName" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-gray-200 text-xs font-bold text-text-secondary">
            <Cpu :size="13" class="text-dark-green" />
            <span>{{ ticket.facilityName }} ({{ ticket.facilityCode }})</span>
          </div>

          <div v-if="ticket.imageUrl" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-dark-green">
            <ImageIcon :size="13" />
            <span>Foto Bukti Terlampir</span>
          </div>
        </div>

        <!-- Resolution Notes snippet if resolved -->
        <div v-if="ticket.status === 'RESOLVED' && ticket.resolutionNotes" class="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-xs text-dark-green space-y-0.5">
          <p class="font-bold flex items-center gap-1.5">
            <CheckCircle2 :size="13" />
            <span>Catatan Penanganan:</span>
          </p>
          <p class="text-[11.5px] leading-relaxed">{{ ticket.resolutionNotes }}</p>
        </div>

        <!-- Bottom Row: Reporter, Actions -->
        <div class="flex items-center justify-between pt-2 border-t border-gray-100 gap-3">
          <div class="flex items-center gap-2 min-w-0">
            <BaseAvatar :src="ticket.reporterAvatar" :name="ticket.reporterName" size="sm" class="shrink-0" />
            <div class="min-w-0">
              <p class="text-xs font-bold text-text-primary truncate">{{ ticket.reporterName }}</p>
              <p class="text-[10px] text-text-muted truncate">{{ ticket.reporterEmail }}</p>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button
              @click="openDetail(ticket)"
              class="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-surface text-text-secondary text-xs font-bold transition-colors cursor-pointer"
            >
              Lihat Detail
            </button>

            <button
              v-if="isStaffOrAdmin"
              @click="openStatusUpdate(ticket)"
              class="px-3 py-1.5 rounded-xl bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              Tindak Lanjuti
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- MODAL 1: CREATE ISSUE TICKET MODAL                      -->
    <!-- ======================================================== -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div class="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 my-8 animate-in fade-in zoom-in-95">
        <div class="flex items-center justify-between border-b border-gray-100 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center">
              <Wrench :size="18" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-text-primary">Laporkan Kendala Alat</h3>
              <p class="text-[11px] text-text-muted">Buat tiket kendala laboratorium untuk ditindaklanjuti laboran.</p>
            </div>
          </div>
          <button @click="showCreateModal = false" class="text-text-muted hover:text-text-primary cursor-pointer">
            <X :size="18" />
          </button>
        </div>

        <form @submit.prevent="handleCreateTicket" class="space-y-4">
          <!-- Laboratory Selector -->
          <div class="space-y-1">
            <label class="block text-xs font-bold text-text-primary">
              Laboratorium Terkait <span class="text-danger">*</span>
            </label>
            <select
              v-model="createForm.laboratory_id"
              class="w-full px-3.5 py-2.5 bg-surface border border-gray-200 rounded-xl text-xs font-medium text-text-primary focus:outline-none focus:border-dark-green"
            >
              <option value="">Pilih Laboratorium...</option>
              <option v-for="lab in laboratories" :key="lab.id" :value="lab.id">
                {{ lab.code }} - {{ lab.name }}
              </option>
            </select>
            <p v-if="createFormErrors.laboratory_id" class="text-[11px] text-danger font-medium">{{ createFormErrors.laboratory_id }}</p>
          </div>

          <!-- Specific Facility Selector (Optional) -->
          <div class="space-y-1">
            <label class="block text-xs font-bold text-text-primary">
              Peralatan / Komputer Tertentu (Opsional)
            </label>
            <select
              v-model="createForm.facility_id"
              :disabled="!createForm.laboratory_id || isLoadingFacilities"
              class="w-full px-3.5 py-2.5 bg-surface border border-gray-200 rounded-xl text-xs font-medium text-text-primary focus:outline-none focus:border-dark-green disabled:opacity-50"
            >
              <option value="">{{ isLoadingFacilities ? 'Memuat peralatan...' : 'Seluruh Lab / Fasilitas Umum' }}</option>
              <option v-for="fac in availableFacilities" :key="fac.id" :value="fac.id">
                {{ fac.code }} - {{ fac.name }} ({{ fac.category }})
              </option>
            </select>
            <p class="text-[10.5px] text-text-muted">
              Pilih jika kendala hanya terjadi pada unit alat spesifik (mis. PC-01 atau Proyektor).
            </p>
          </div>

          <!-- Title -->
          <div class="space-y-1">
            <label class="block text-xs font-bold text-text-primary">
              Judul Kendala <span class="text-danger">*</span>
            </label>
            <input
              v-model="createForm.title"
              type="text"
              placeholder="Contoh: Monitor PC-05 Layar Mati, Proyektor Tidak Merespon"
              class="w-full px-3.5 py-2.5 bg-surface border border-gray-200 rounded-xl text-xs text-text-primary focus:outline-none focus:border-dark-green"
            />
            <p v-if="createFormErrors.title" class="text-[11px] text-danger font-medium">{{ createFormErrors.title }}</p>
          </div>

          <!-- Severity Selector -->
          <div class="space-y-1">
            <label class="block text-xs font-bold text-text-primary">
              Tingkat Urgensi Kerusakan <span class="text-danger">*</span>
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                @click="createForm.severity = 'LOW'"
                :class="[
                  'px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center',
                  createForm.severity === 'LOW' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-surface border-gray-200 text-text-secondary hover:bg-gray-100'
                ]"
              >
                Rendah
              </button>
              <button
                type="button"
                @click="createForm.severity = 'MEDIUM'"
                :class="[
                  'px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center',
                  createForm.severity === 'MEDIUM' ? 'bg-blue-600 text-white border-blue-600' : 'bg-surface border-gray-200 text-text-secondary hover:bg-gray-100'
                ]"
              >
                Sedang
              </button>
              <button
                type="button"
                @click="createForm.severity = 'HIGH'"
                :class="[
                  'px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center',
                  createForm.severity === 'HIGH' ? 'bg-amber-600 text-white border-amber-600' : 'bg-surface border-gray-200 text-text-secondary hover:bg-gray-100'
                ]"
              >
                Tinggi
              </button>
              <button
                type="button"
                @click="createForm.severity = 'CRITICAL'"
                :class="[
                  'px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center',
                  createForm.severity === 'CRITICAL' ? 'bg-rose-600 text-white border-rose-600' : 'bg-surface border-gray-200 text-text-secondary hover:bg-gray-100'
                ]"
              >
                Kritis
              </button>
            </div>
          </div>

          <!-- Description -->
          <div class="space-y-1">
            <label class="block text-xs font-bold text-text-primary">
              Deskripsi Detail Kerusakan <span class="text-danger">*</span>
            </label>
            <textarea
              v-model="createForm.description"
              rows="3"
              placeholder="Jelaskan kronologi kendala, gejala fisik yang muncul, dan tindakan awal yang sudah dicoba..."
              class="w-full px-3.5 py-2.5 bg-surface border border-gray-200 rounded-xl text-xs text-text-primary focus:outline-none focus:border-dark-green"
            ></textarea>
            <p v-if="createFormErrors.description" class="text-[11px] text-danger font-medium">{{ createFormErrors.description }}</p>
          </div>

          <!-- Photo Evidence Upload -->
          <div class="space-y-2">
            <label class="block text-xs font-bold text-text-primary">
              Unggah Foto Bukti Kendala (Opsional)
            </label>
            <input
              ref="fileInputRef"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              @change="handleImageSelect"
            />

            <div v-if="isUploadingImage" class="p-4 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 text-center space-y-1">
              <Loader2 :size="18" class="animate-spin text-dark-green mx-auto" />
              <p class="text-xs font-bold text-dark-green">Mengunggah foto...</p>
            </div>

            <div v-else-if="createForm.image_url" class="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center justify-between gap-3">
              <div class="flex items-center gap-2.5 min-w-0">
                <img :src="getFileUrl(createForm.image_url)" alt="Bukti" class="w-10 h-10 rounded-lg object-cover border border-emerald-300" />
                <div class="min-w-0 text-xs">
                  <p class="font-bold text-dark-green truncate">Foto Kendala Terunggah</p>
                  <a :href="getFileUrl(createForm.image_url)" target="_blank" class="underline text-[11px] text-emerald-800 font-medium">Lihat foto</a>
                </div>
              </div>
              <button type="button" @click="removeImage" class="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg">
                <Trash2 :size="15" />
              </button>
            </div>

            <div
              v-else
              @click="fileInputRef?.click()"
              class="p-4 rounded-xl border border-dashed border-gray-200 hover:border-dark-green/40 bg-surface/50 hover:bg-emerald-50/20 text-center cursor-pointer space-y-1 transition-colors"
            >
              <UploadCloud :size="20" class="mx-auto text-text-muted" />
              <p class="text-xs font-bold text-text-primary">Pilih foto dari galeri / kamera</p>
              <p class="text-[10.5px] text-text-muted">JPG, PNG, atau WEBP (Maksimal 5MB)</p>
            </div>

            <p v-if="uploadImageError" class="text-[11px] text-danger font-medium">{{ uploadImageError }}</p>
          </div>

          <!-- Form Actions -->
          <div class="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              @click="showCreateModal = false"
              :disabled="isSubmittingCreate"
              class="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-text-secondary hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="isSubmittingCreate || isUploadingImage"
              class="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Loader2 v-if="isSubmittingCreate" :size="14" class="animate-spin" />
              <Send v-else :size="14" />
              <span>{{ isSubmittingCreate ? 'Mengirim...' : 'Kirim Laporan' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- MODAL 2: TICKET DETAIL MODAL                            -->
    <!-- ======================================================== -->
    <div
      v-if="showDetailModal && activeTicket"
      class="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div class="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 my-8 animate-in fade-in zoom-in-95">
        <div class="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <span class="font-mono text-xs font-bold text-dark-green bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
              {{ activeTicket.ticketNumber }}
            </span>
            <h3 class="text-base font-extrabold text-text-primary mt-1">{{ activeTicket.title }}</h3>
          </div>
          <button @click="showDetailModal = false" class="text-text-muted hover:text-text-primary cursor-pointer">
            <X :size="18" />
          </button>
        </div>

        <div class="space-y-4 text-xs">
          <!-- Status & Severity Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div class="p-3 rounded-xl bg-surface border border-gray-100 space-y-1">
              <span class="text-text-muted text-[10px] font-bold uppercase">Status</span>
              <p :class="['px-2 py-0.5 rounded-full text-[10.5px] font-extrabold border text-center', getStatusBadgeClass(activeTicket.status)]">
                {{ getStatusLabel(activeTicket.status) }}
              </p>
            </div>
            <div class="p-3 rounded-xl bg-surface border border-gray-100 space-y-1">
              <span class="text-text-muted text-[10px] font-bold uppercase">Urgensi</span>
              <p :class="['px-2 py-0.5 rounded-full text-[10.5px] font-bold border text-center', getSeverityBadgeClass(activeTicket.severity)]">
                {{ getSeverityLabel(activeTicket.severity) }}
              </p>
            </div>
            <div class="p-3 rounded-xl bg-surface border border-gray-100 space-y-1">
              <span class="text-text-muted text-[10px] font-bold uppercase">Laboratorium</span>
              <p class="font-black text-dark-green truncate">{{ activeTicket.laboratoryCode }}</p>
            </div>
            <div class="p-3 rounded-xl bg-surface border border-gray-100 space-y-1">
              <span class="text-text-muted text-[10px] font-bold uppercase">Alat Spesifik</span>
              <p class="font-bold text-text-primary truncate">{{ activeTicket.facilityName || 'Umum / Seluruh Ruang' }}</p>
            </div>
          </div>

          <!-- Description -->
          <div class="p-4 rounded-xl bg-surface/60 border border-gray-200/80 space-y-1">
            <span class="text-[10px] font-bold text-text-muted uppercase">Rincian Kerusakan</span>
            <p class="text-xs text-text-primary leading-relaxed whitespace-pre-line font-medium">{{ activeTicket.description }}</p>
          </div>

          <!-- Photo Evidence Preview -->
          <div v-if="activeTicket.imageUrl" class="space-y-1.5">
            <span class="text-[10px] font-bold text-text-muted uppercase">Foto Bukti Kerusakan</span>
            <div class="rounded-xl overflow-hidden border border-gray-200 bg-black/5 p-2 flex justify-center">
              <img
                :src="getFileUrl(activeTicket.imageUrl)"
                alt="Foto Bukti"
                class="max-h-72 object-contain rounded-lg"
              />
            </div>
          </div>

          <!-- Resolution Notes if any -->
          <div v-if="activeTicket.resolutionNotes" class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
            <span class="text-[10px] font-bold text-dark-green uppercase flex items-center gap-1">
              <CheckCircle2 :size="12" />
              Catatan Penanganan & Tindak Lanjut
            </span>
            <p class="text-xs text-dark-green leading-relaxed whitespace-pre-line font-medium">{{ activeTicket.resolutionNotes }}</p>
            <p v-if="activeTicket.handlerName" class="text-[10px] text-emerald-800/80 pt-1 font-mono">
              Ditangani oleh: {{ activeTicket.handlerName }}
            </p>
          </div>

          <!-- Audit info -->
          <div class="p-3 bg-surface rounded-xl border border-gray-100 flex justify-between text-[11px] text-text-muted">
            <span>Dilaporkan oleh: <strong>{{ activeTicket.reporterName }}</strong></span>
            <span>Tanggal: {{ formatDateTime(activeTicket.createdAt) }}</span>
          </div>
        </div>

        <div class="pt-3 border-t border-gray-100 flex items-center justify-between">
          <button
            @click="showDetailModal = false"
            class="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-text-secondary hover:bg-gray-50"
          >
            Tutup
          </button>

          <button
            v-if="isStaffOrAdmin"
            @click="showDetailModal = false; openStatusUpdate(activeTicket)"
            class="px-4 py-2 rounded-xl bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            Tindak Lanjuti Tiket
          </button>
        </div>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- MODAL 3: UPDATE STATUS & RESOLUTION MODAL (STAFF/ADMIN)  -->
    <!-- ======================================================== -->
    <div
      v-if="showStatusModal && activeTicket"
      class="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 my-8 animate-in fade-in zoom-in-95">
        <div class="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 class="text-base font-extrabold text-text-primary">Tindak Lanjuti Tiket</h3>
            <p class="text-[11px] text-text-muted font-mono">{{ activeTicket.ticketNumber }} - {{ activeTicket.title }}</p>
          </div>
          <button @click="showStatusModal = false" class="text-text-muted hover:text-text-primary cursor-pointer">
            <X :size="18" />
          </button>
        </div>

        <form @submit.prevent="handleUpdateStatus" class="space-y-4">
          <div class="space-y-1">
            <label class="block text-xs font-bold text-text-primary">Status Penanganan</label>
            <select
              v-model="statusForm.status"
              class="w-full px-3.5 py-2.5 bg-surface border border-gray-200 rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-dark-green"
            >
              <option value="INVESTIGATING">INVESTIGATING - Sedang Diperiksa</option>
              <option value="RESOLVED">RESOLVED - Selesai Diperbaiki</option>
              <option value="REJECTED">REJECTED - Ditolak (Bukan Kerusakan Teknis)</option>
              <option value="CLOSED">CLOSED - Tiket Ditutup</option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-bold text-text-primary">Catatan Solusi / Hasil Pemeriksaan</label>
            <textarea
              v-model="statusForm.resolution_notes"
              rows="4"
              placeholder="Jelaskan tindakan perbaikan yang telah dilakukan, komponen yang diganti, atau alasan penolakan..."
              class="w-full px-3.5 py-2.5 bg-surface border border-gray-200 rounded-xl text-xs text-text-primary focus:outline-none focus:border-dark-green leading-relaxed"
            ></textarea>
          </div>

          <div class="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              @click="showStatusModal = false"
              :disabled="isSubmittingStatus"
              class="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-text-secondary hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="isSubmittingStatus"
              class="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Loader2 v-if="isSubmittingStatus" :size="14" class="animate-spin" />
              <span>{{ isSubmittingStatus ? 'Menyimpan...' : 'Simpan Pembaruan' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>
