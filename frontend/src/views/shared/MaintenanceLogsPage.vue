<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  Loader2,
  Paperclip,
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
  Building2,
  Cpu,
  Coins,
  Store,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-vue-next'
import {
  maintenanceService,
  type MaintenanceLog,
  type MaintenanceType,
  type FacilityCondition,
  type CreateMaintenanceLogPayload
} from '@/services/maintenance.service'
import {
  issueTicketService,
  type IssueTicket
} from '@/services/issue-ticket.service'
import { laboratoryService, type LaboratoryData } from '@/services/laboratory.service'
import { facilityService } from '@/services/facility.service'
import { authService } from '@/services/auth.service'
import { sessionManager } from '@/utils/session.utils'
import { getFileUrl, formatDate, formatDateTime } from '@/utils/format.utils'
import { UserRole, type User as AuthUser } from '@/types'
import { useLaboranNavStore } from '@/stores/laboran-nav.store'
import { useAdminNavStore } from '@/stores/admin-nav.store'

const route = useRoute()

// Navigation Stores for Breadcrumbs
const laboranNav = useLaboranNavStore()
const adminNav = useAdminNavStore()

// State
const logs = ref<MaintenanceLog[]>([])
const isLoading = ref(true)
const laboratories = ref<LaboratoryData[]>([])
const availableFacilities = ref<Array<{ id: string; code: string; name: string; category: string; condition?: string }>>([])
const openIssueTickets = ref<IssueTicket[]>([])
const isLoadingFacilities = ref(false)

// Meta & Filtering State
const totalCount = ref(0)
const searchQuery = ref('')
const selectedType = ref<string>('')
const selectedLabFilter = ref<string>('')

// Modals
const showCreateModal = ref(false)
const showDetailModal = ref(false)
const activeLog = ref<MaintenanceLog | null>(null)

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
  issue_ticket_id: string
  maintenance_type: MaintenanceType
  title: string
  action_taken: string
  resulting_condition: FacilityCondition
  cost: number | null
  vendor: string
  attachment_url: string
  maintenance_date: string
}>({
  laboratory_id: '',
  facility_id: '',
  issue_ticket_id: '',
  maintenance_type: 'ROUTINE_PREVENTIVE',
  title: '',
  action_taken: '',
  resulting_condition: 'GOOD',
  cost: null,
  vendor: '',
  attachment_url: '',
  maintenance_date: (new Date().toISOString().split('T')[0] || '') as string,
})

const createFormErrors = reactive({
  laboratory_id: '',
  facility_id: '',
  title: '',
  action_taken: '',
  maintenance_date: '',
})

const isSubmittingCreate = ref(false)
const isUploadingAttachment = ref(false)
const uploadAttachmentError = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

// Setup Breadcrumbs
const setupBreadcrumbs = () => {
  if (route.path.startsWith('/laboran')) {
    laboranNav.setBreadcrumbs([
      { label: 'Portal Laboran', path: '/laboran' },
      { label: 'Log Riwayat Pemeliharaan' },
    ])
  } else if (route.path.startsWith('/admin')) {
    adminNav.setBreadcrumbs([
      { label: 'Dashboard', path: '/admin' },
      { label: 'Log Riwayat Pemeliharaan' },
    ])
  }
}

// Statistics
const stats = computed(() => {
  return {
    total: logs.value.length,
    routine: logs.value.filter((l) => l.maintenanceType === 'ROUTINE_PREVENTIVE').length,
    repair: logs.value.filter((l) => l.maintenanceType === 'CORRECTIVE_REPAIR').length,
    upgrade: logs.value.filter((l) => l.maintenanceType === 'COMPONENT_UPGRADE' || l.maintenanceType === 'REPLACEMENT').length,
  }
})

// Load Laboratories for Dropdowns
const loadLaboratories = async () => {
  try {
    const res = await laboratoryService.getLaboratories({ limit: 100 })
    laboratories.value = res.laboratories || []
  } catch (err) {
    console.error('Failed to load laboratories:', err)
  }
}

// Fetch Maintenance Logs
const fetchLogs = async () => {
  isLoading.value = true
  try {
    const res = await maintenanceService.getAll({
      search: searchQuery.value || undefined,
      maintenance_type: selectedType.value || undefined,
      laboratory_id: selectedLabFilter.value || undefined,
      limit: 100,
    })
    logs.value = res.data
    totalCount.value = res.meta.total
  } catch (err: any) {
    console.error('Failed to fetch maintenance logs:', err)
    triggerToast(err.message || 'Gagal memuat riwayat pemeliharaan', 'error')
  } finally {
    isLoading.value = false
  }
}

// Watch Lab select in Create Form -> load facilities and open issue tickets
watch(
  () => createForm.laboratory_id,
  async (newLabId) => {
    createForm.facility_id = ''
    createForm.issue_ticket_id = ''
    availableFacilities.value = []
    openIssueTickets.value = []
    if (!newLabId) return

    isLoadingFacilities.value = true
    try {
      const [facList, ticketList] = await Promise.all([
        facilityService.getFacilitiesByLaboratoryId(newLabId),
        issueTicketService.getAll({ laboratory_id: newLabId, limit: 50 })
      ])
      availableFacilities.value = facList
      // filter open tickets
      openIssueTickets.value = ticketList.data.filter(t => t.status === 'REPORTED' || t.status === 'INVESTIGATING')
    } catch (err) {
      console.error('Failed to load lab facilities or tickets:', err)
    } finally {
      isLoadingFacilities.value = false
    }
  }
)

// Handle Attachment Upload
const handleAttachmentSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  const file = target.files[0]
  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    uploadAttachmentError.value = 'Ukuran berkas maksimal 5MB.'
    return
  }

  uploadAttachmentError.value = ''
  isUploadingAttachment.value = true

  try {
    const res = await maintenanceService.uploadAttachment(file)
    createForm.attachment_url = res.url
  } catch (err: any) {
    uploadAttachmentError.value = err.message || 'Gagal mengunggah berkas kuitansi / dokumen'
  } finally {
    isUploadingAttachment.value = false
    target.value = ''
  }
}

const removeAttachment = () => {
  createForm.attachment_url = ''
  uploadAttachmentError.value = ''
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// Validate & Submit
const validateCreateForm = () => {
  createFormErrors.laboratory_id = ''
  createFormErrors.facility_id = ''
  createFormErrors.title = ''
  createFormErrors.action_taken = ''
  createFormErrors.maintenance_date = ''

  let isValid = true
  if (!createForm.laboratory_id) {
    createFormErrors.laboratory_id = 'Pilih laboratorium'
    isValid = false
  }
  if (!createForm.facility_id) {
    createFormErrors.facility_id = 'Pilih fasilitas / alat yang dirawat'
    isValid = false
  }
  if (!createForm.title.trim()) {
    createFormErrors.title = 'Judul tindakan pemeliharaan wajib diisi'
    isValid = false
  }
  if (!createForm.action_taken.trim()) {
    createFormErrors.action_taken = 'Tindakan yang dilakukan wajib diisi'
    isValid = false
  }
  if (!createForm.maintenance_date) {
    createFormErrors.maintenance_date = 'Tanggal perawatan wajib diisi'
    isValid = false
  }
  return isValid
}

const handleCreateLog = async () => {
  if (!validateCreateForm()) return

  isSubmittingCreate.value = true
  try {
    const selectedFacility = availableFacilities.value.find(f => f.id === createForm.facility_id)
    const prevCond = (selectedFacility?.condition as FacilityCondition) || 'GOOD'

    const payload: CreateMaintenanceLogPayload = {
      laboratory_id: createForm.laboratory_id,
      facility_id: createForm.facility_id,
      issue_ticket_id: createForm.issue_ticket_id || undefined,
      maintenance_type: createForm.maintenance_type,
      title: createForm.title.trim(),
      action_taken: createForm.action_taken.trim(),
      previous_condition: prevCond,
      resulting_condition: createForm.resulting_condition,
      cost: createForm.cost ? Number(createForm.cost) : undefined,
      vendor: createForm.vendor.trim() || undefined,
      attachment_url: createForm.attachment_url || undefined,
      maintenance_date: createForm.maintenance_date,
    }

    await maintenanceService.create(payload)
    triggerToast('Log pemeliharaan berhasil dicatat & disinkronkan ke Public Display!', 'success')
    showCreateModal.value = false

    // Reset Form
    createForm.laboratory_id = ''
    createForm.facility_id = ''
    createForm.issue_ticket_id = ''
    createForm.maintenance_type = 'ROUTINE_PREVENTIVE'
    createForm.title = ''
    createForm.action_taken = ''
    createForm.resulting_condition = 'GOOD'
    createForm.cost = null
    createForm.vendor = ''
    createForm.attachment_url = ''

    await fetchLogs()
  } catch (err: any) {
    triggerToast(err.message || 'Gagal menyimpan log pemeliharaan', 'error')
  } finally {
    isSubmittingCreate.value = false
  }
}

const openDetail = (log: MaintenanceLog) => {
  activeLog.value = log
  showDetailModal.value = true
}

// Helpers for badges
const getTypeLabel = (type: MaintenanceType) => {
  switch (type) {
    case 'ROUTINE_PREVENTIVE':
      return 'Servis Rutin / Preventif'
    case 'CORRECTIVE_REPAIR':
      return 'Perbaikan Kerusakan'
    case 'COMPONENT_UPGRADE':
      return 'Upgrade Komponen'
    case 'REPLACEMENT':
      return 'Penggantian Unit'
    default:
      return type
  }
}

const getTypeBadgeClass = (type: MaintenanceType) => {
  switch (type) {
    case 'ROUTINE_PREVENTIVE':
      return 'bg-blue-50 border-blue-200 text-blue-700'
    case 'CORRECTIVE_REPAIR':
      return 'bg-amber-50 border-amber-200 text-amber-700'
    case 'COMPONENT_UPGRADE':
      return 'bg-purple-50 border-purple-200 text-purple-700'
    case 'REPLACEMENT':
      return 'bg-emerald-50 border-emerald-200 text-emerald-700'
    default:
      return 'bg-gray-50 border-gray-200 text-gray-700'
  }
}

const getConditionLabel = (cond?: FacilityCondition | null) => {
  switch (cond) {
    case 'GOOD':
      return 'Normal / Baik'
    case 'DAMAGED':
      return 'Rusak'
    case 'UNDER_MAINTENANCE':
      return 'Sedang Servis'
    default:
      return 'Baik'
  }
}

const getConditionBadgeClass = (cond?: FacilityCondition | null) => {
  switch (cond) {
    case 'GOOD':
      return 'bg-emerald-50 border-emerald-200 text-dark-green'
    case 'DAMAGED':
      return 'bg-rose-50 border-rose-200 text-rose-700'
    case 'UNDER_MAINTENANCE':
      return 'bg-amber-50 border-amber-200 text-amber-700'
    default:
      return 'bg-gray-50 border-gray-200 text-gray-700'
  }
}

const formatRupiah = (val?: number | null) => {
  if (!val) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

onMounted(async () => {
  setupBreadcrumbs()
  await Promise.all([loadLaboratories(), fetchLogs()])
})
</script>

<template>
  <div class="space-y-6 pb-12 select-none w-full max-w-full min-w-0">
    <!-- Toast Feedback -->
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

    <!-- Header Section -->
    <div class="space-y-3 pb-2 border-b border-gray-200/60 w-full min-w-0">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
              Log Riwayat Pemeliharaan
            </h1>
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-100/80 border border-brand-200 text-dark-green text-[11px] font-bold">
              <ShieldCheck :size="12" />
              Sync Live Display
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted">
            Pencatatan riwayat servis berkala, perbaikan darurat, pergantian suku cadang, dan pembaruan kondisi alat secara real-time.
          </p>
        </div>

        <div class="flex items-center gap-2.5 shrink-0">
          <button
            @click="fetchLogs"
            :disabled="isLoading"
            class="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-text-secondary transition-colors cursor-pointer"
            title="Muat ulang log"
          >
            <RefreshCw :size="16" :class="{ 'animate-spin': isLoading }" />
          </button>

          <button
            @click="showCreateModal = true"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs shadow-dark-green/20 transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <Plus :size="16" />
            <span>Catat Pemeliharaan Baru</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Quick Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-2xl border border-gray-200/70 p-4 shadow-2xs space-y-1">
        <span class="text-[11px] font-bold text-text-muted uppercase tracking-wider">Total Tindakan</span>
        <div class="flex items-baseline justify-between">
          <span class="text-2xl font-black text-text-primary">{{ stats.total }}</span>
          <span class="text-xs text-text-muted">Aksi tercatat</span>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-blue-200/70 p-4 shadow-2xs space-y-1">
        <span class="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Servis Rutin</span>
        <div class="flex items-baseline justify-between">
          <span class="text-2xl font-black text-blue-800">{{ stats.routine }}</span>
          <span class="text-xs text-blue-600 font-bold">Preventif</span>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-amber-200/70 p-4 shadow-2xs space-y-1">
        <span class="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Perbaikan Alat</span>
        <div class="flex items-baseline justify-between">
          <span class="text-2xl font-black text-amber-800">{{ stats.repair }}</span>
          <span class="text-xs text-amber-600 font-bold">Korektif</span>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-purple-200/70 p-4 shadow-2xs space-y-1">
        <span class="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Upgrade / Unit Baru</span>
        <div class="flex items-baseline justify-between">
          <span class="text-2xl font-black text-purple-800">{{ stats.upgrade }}</span>
          <span class="text-xs text-purple-600 font-bold">Peningkatan</span>
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
            @keyup.enter="fetchLogs"
            type="text"
            placeholder="Cari tindakan, nama alat, teknisi, atau vendor..."
            class="w-full pl-9 pr-4 py-2 bg-surface border border-gray-200 rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green"
          />
        </div>

        <!-- Filter Selects -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Type Select -->
          <select
            v-model="selectedType"
            @change="fetchLogs"
            class="px-3 py-2 rounded-xl bg-surface border border-gray-200 text-xs font-bold text-text-secondary focus:outline-none focus:border-dark-green cursor-pointer"
          >
            <option value="">Semua Tipe Pemeliharaan</option>
            <option value="ROUTINE_PREVENTIVE">Servis Rutin / Preventif</option>
            <option value="CORRECTIVE_REPAIR">Perbaikan Kerusakan</option>
            <option value="COMPONENT_UPGRADE">Upgrade Komponen</option>
            <option value="REPLACEMENT">Penggantian Unit</option>
          </select>

          <!-- Lab Filter -->
          <select
            v-model="selectedLabFilter"
            @change="fetchLogs"
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
      v-else-if="logs.length === 0"
      class="bg-white rounded-2xl border border-gray-200/70 p-12 text-center space-y-4 shadow-2xs"
    >
      <div class="w-16 h-16 rounded-2xl bg-emerald-50 text-dark-green border border-emerald-100 flex items-center justify-center mx-auto">
        <Wrench :size="32" />
      </div>
      <div class="max-w-md mx-auto">
        <h3 class="text-base font-extrabold text-text-primary">Belum Ada Riwayat Pemeliharaan</h3>
        <p class="text-xs text-text-muted mt-1">
          Catat pemeliharaan fasilitas pertama untuk mulai melacak riwayat kesehatan alat laboratorium.
        </p>
      </div>
      <button
        @click="showCreateModal = true"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-green text-white text-xs font-bold hover:bg-[#547a5c] transition-colors cursor-pointer"
      >
        <Plus :size="14" />
        <span>Catat Pemeliharaan</span>
      </button>
    </div>

    <!-- Logs List -->
    <div v-else class="space-y-3.5">
      <div
        v-for="log in logs"
        :key="log.id"
        class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 transition-all hover:border-dark-green/40 hover:shadow-xs space-y-3"
      >
        <!-- Top Row: Date, Type Badge, Condition change -->
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-mono text-xs font-black text-dark-green bg-brand-50 px-2.5 py-0.5 rounded-lg border border-brand-200 flex items-center gap-1.5">
              <Calendar :size="13" />
              {{ formatDate(log.maintenanceDate) }}
            </span>
            <span :class="['px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border', getTypeBadgeClass(log.maintenanceType)]">
              {{ getTypeLabel(log.maintenanceType) }}
            </span>
          </div>

          <!-- Condition Result Badge -->
          <div class="flex items-center gap-1.5 text-xs font-bold">
            <span class="text-text-muted text-[11px]">Kondisi Akhir:</span>
            <span :class="['px-2.5 py-0.5 rounded-full text-[10.5px] border', getConditionBadgeClass(log.resultingCondition)]">
              {{ getConditionLabel(log.resultingCondition) }}
            </span>
          </div>
        </div>

        <!-- Middle Row: Title & Action Taken -->
        <div class="space-y-1.5">
          <h3 class="text-base font-bold text-text-primary tracking-tight">
            {{ log.title }}
          </h3>
          <p class="text-xs text-text-secondary leading-relaxed font-medium">
            {{ log.actionTaken }}
          </p>
        </div>

        <!-- Tags: Laboratory, Facility, Ticket Link -->
        <div class="flex flex-wrap items-center gap-2 pt-1">
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-gray-200 text-xs font-bold text-text-secondary">
            <Building2 :size="13" class="text-dark-green" />
            <span>{{ log.laboratoryCode }} ({{ log.laboratoryName }})</span>
          </div>

          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-gray-200 text-xs font-bold text-text-secondary">
            <Cpu :size="13" class="text-dark-green" />
            <span>{{ log.facilityName }} ({{ log.facilityCode }})</span>
          </div>

          <div v-if="log.issueTicketNumber" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-dark-green">
            <CheckCircle2 :size="13" />
            <span>Menyelesaikan {{ log.issueTicketNumber }}</span>
          </div>

          <div v-if="log.cost" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-gray-200 text-xs font-bold text-text-secondary">
            <Coins :size="13" class="text-amber-600" />
            <span>{{ formatRupiah(log.cost) }}</span>
          </div>

          <div v-if="log.vendor" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-gray-200 text-xs font-bold text-text-secondary">
            <Store :size="13" class="text-blue-600" />
            <span>{{ log.vendor }}</span>
          </div>

          <div v-if="log.attachmentUrl" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-dark-green">
            <Paperclip :size="13" />
            <a :href="getFileUrl(log.attachmentUrl)" target="_blank" class="underline hover:text-emerald-900 inline-flex items-center gap-1">
              Kuitansi / Dokumen <ExternalLink :size="10" />
            </a>
          </div>
        </div>

        <!-- Bottom Row: Performed By & Detail Action -->
        <div class="flex items-center justify-between pt-2 border-t border-gray-100 gap-3">
          <div class="flex items-center gap-2 text-xs text-text-muted">
            <User :size="14" class="text-dark-green" />
            <span>Teknisi Pelaksana: <strong class="text-text-primary">{{ log.technicianName }}</strong></span>
          </div>

          <button
            @click="openDetail(log)"
            class="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-surface text-text-secondary text-xs font-bold transition-colors cursor-pointer"
          >
            Lihat Rincian
          </button>
        </div>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- MODAL 1: CREATE MAINTENANCE LOG MODAL                   -->
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
              <h3 class="text-base font-extrabold text-text-primary">Catat Pemeliharaan Fasilitas</h3>
              <p class="text-[11px] text-text-muted">Perbarui kondisi alat laboratorium dan publikasikan ke TV Display.</p>
            </div>
          </div>
          <button @click="showCreateModal = false" class="text-text-muted hover:text-text-primary cursor-pointer">
            <X :size="18" />
          </button>
        </div>

        <form @submit.prevent="handleCreateLog" class="space-y-4">
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

          <!-- Specific Facility Selector -->
          <div class="space-y-1">
            <label class="block text-xs font-bold text-text-primary">
              Peralatan / Komputer yang Dirawat <span class="text-danger">*</span>
            </label>
            <select
              v-model="createForm.facility_id"
              :disabled="!createForm.laboratory_id || isLoadingFacilities"
              class="w-full px-3.5 py-2.5 bg-surface border border-gray-200 rounded-xl text-xs font-medium text-text-primary focus:outline-none focus:border-dark-green disabled:opacity-50"
            >
              <option value="">{{ isLoadingFacilities ? 'Memuat peralatan...' : 'Pilih Peralatan Lab...' }}</option>
              <option v-for="fac in availableFacilities" :key="fac.id" :value="fac.id">
                {{ fac.code }} - {{ fac.name }} (Saat ini: {{ getConditionLabel(fac.condition as any) }})
              </option>
            </select>
            <p v-if="createFormErrors.facility_id" class="text-[11px] text-danger font-medium">{{ createFormErrors.facility_id }}</p>
          </div>

          <!-- Optional Link to Issue Ticket -->
          <div v-if="openIssueTickets.length > 0" class="space-y-1">
            <label class="block text-xs font-bold text-emerald-800">
              Hubungkan & Selesaikan Tiket Kendala Terbuka
            </label>
            <select
              v-model="createForm.issue_ticket_id"
              class="w-full px-3.5 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 focus:outline-none focus:border-dark-green"
            >
              <option value="">Tidak terhubung ke tiket</option>
              <option v-for="t in openIssueTickets" :key="t.id" :value="t.id">
                {{ t.ticketNumber }} - {{ t.title }} (Urgensi: {{ t.severity }})
              </option>
            </select>
            <p class="text-[10.5px] text-emerald-700">
              Jika dipilih, tiket kendala tersebut akan otomatis diubah statusnya menjadi SELESAI (RESOLVED).
            </p>
          </div>

          <!-- Type & Date -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="block text-xs font-bold text-text-primary">
                Tipe Pemeliharaan <span class="text-danger">*</span>
              </label>
              <select
                v-model="createForm.maintenance_type"
                class="w-full px-3.5 py-2.5 bg-surface border border-gray-200 rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-dark-green"
              >
                <option value="ROUTINE_PREVENTIVE">Servis Rutin / Preventif</option>
                <option value="CORRECTIVE_REPAIR">Perbaikan Kerusakan</option>
                <option value="COMPONENT_UPGRADE">Upgrade Komponen</option>
                <option value="REPLACEMENT">Penggantian Unit</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="block text-xs font-bold text-text-primary">
                Tanggal Perawatan <span class="text-danger">*</span>
              </label>
              <input
                v-model="createForm.maintenance_date"
                type="date"
                class="w-full px-3.5 py-2.5 bg-surface border border-gray-200 rounded-xl text-xs font-medium text-text-primary focus:outline-none focus:border-dark-green"
              />
              <p v-if="createFormErrors.maintenance_date" class="text-[11px] text-danger font-medium">{{ createFormErrors.maintenance_date }}</p>
            </div>
          </div>

          <!-- Title -->
          <div class="space-y-1">
            <label class="block text-xs font-bold text-text-primary">
              Judul Tindakan Pemeliharaan <span class="text-danger">*</span>
            </label>
            <input
              v-model="createForm.title"
              type="text"
              placeholder="Contoh: Pembersihan Debu Kipas CPU & Penggantian Kabel HDMI"
              class="w-full px-3.5 py-2.5 bg-surface border border-gray-200 rounded-xl text-xs text-text-primary focus:outline-none focus:border-dark-green"
            />
            <p v-if="createFormErrors.title" class="text-[11px] text-danger font-medium">{{ createFormErrors.title }}</p>
          </div>

          <!-- Action Taken Description -->
          <div class="space-y-1">
            <label class="block text-xs font-bold text-text-primary">
              Rincian Tindakan / Suku Cadang yang Diganti <span class="text-danger">*</span>
            </label>
            <textarea
              v-model="createForm.action_taken"
              rows="3"
              placeholder="Jelaskan secara rinci tindakan teknis yang dilakukan, pergantian part, atau upgrade BIOS/OS..."
              class="w-full px-3.5 py-2.5 bg-surface border border-gray-200 rounded-xl text-xs text-text-primary focus:outline-none focus:border-dark-green"
            ></textarea>
            <p v-if="createFormErrors.action_taken" class="text-[11px] text-danger font-medium">{{ createFormErrors.action_taken }}</p>
          </div>

          <!-- Resulting Condition -->
          <div class="space-y-1">
            <label class="block text-xs font-bold text-text-primary">
              Kondisi Akhir Peralatan <span class="text-danger">*</span>
            </label>
            <div class="grid grid-cols-3 gap-2">
              <button
                type="button"
                @click="createForm.resulting_condition = 'GOOD'"
                :class="[
                  'px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center',
                  createForm.resulting_condition === 'GOOD' ? 'bg-dark-green text-white border-dark-green shadow-xs' : 'bg-surface border-gray-200 text-text-secondary hover:bg-gray-100'
                ]"
              >
                Normal / Baik
              </button>
              <button
                type="button"
                @click="createForm.resulting_condition = 'UNDER_MAINTENANCE'"
                :class="[
                  'px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center',
                  createForm.resulting_condition === 'UNDER_MAINTENANCE' ? 'bg-amber-600 text-white border-amber-600 shadow-xs' : 'bg-surface border-gray-200 text-text-secondary hover:bg-gray-100'
                ]"
              >
                Masih Diservis
              </button>
              <button
                type="button"
                @click="createForm.resulting_condition = 'DAMAGED'"
                :class="[
                  'px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center',
                  createForm.resulting_condition === 'DAMAGED' ? 'bg-rose-600 text-white border-rose-600 shadow-xs' : 'bg-surface border-gray-200 text-text-secondary hover:bg-gray-100'
                ]"
              >
                Rusak / Afkir
              </button>
            </div>
            <p class="text-[10.5px] text-text-muted">
              Kondisi ini akan langsung terupdate pada status display TV publik dan monitor lab.
            </p>
          </div>

          <!-- Optional Cost & Vendor -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="block text-xs font-bold text-text-primary">Biaya Servis / Part (Rp)</label>
              <input
                v-model.number="createForm.cost"
                type="number"
                min="0"
                placeholder="0"
                class="w-full px-3.5 py-2.5 bg-surface border border-gray-200 rounded-xl text-xs text-text-primary focus:outline-none focus:border-dark-green"
              />
            </div>

            <div class="space-y-1">
              <label class="block text-xs font-bold text-text-primary">Vendor / Pusat Servis</label>
              <input
                v-model="createForm.vendor"
                type="text"
                placeholder="Contoh: Asus Service Center, Mandiri Teknindo"
                class="w-full px-3.5 py-2.5 bg-surface border border-gray-200 rounded-xl text-xs text-text-primary focus:outline-none focus:border-dark-green"
              />
            </div>
          </div>

          <!-- Attachment Upload (Invoice / Receipt) -->
          <div class="space-y-2">
            <label class="block text-xs font-bold text-text-primary">
              Unggah Bukti Nota / Kuitansi / Laporan Servis (Opsional)
            </label>
            <input
              ref="fileInputRef"
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              class="hidden"
              @change="handleAttachmentSelect"
            />

            <div v-if="isUploadingAttachment" class="p-4 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 text-center space-y-1">
              <Loader2 :size="18" class="animate-spin text-dark-green mx-auto" />
              <p class="text-xs font-bold text-dark-green">Mengunggah dokumen...</p>
            </div>

            <div v-else-if="createForm.attachment_url" class="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center justify-between gap-3">
              <div class="flex items-center gap-2.5 min-w-0">
                <Paperclip :size="16" class="text-dark-green shrink-0" />
                <div class="min-w-0 text-xs">
                  <p class="font-bold text-dark-green truncate">Berkas Kuitansi Terunggah</p>
                  <a :href="getFileUrl(createForm.attachment_url)" target="_blank" class="underline text-[11px] text-emerald-800 font-medium">Buka berkas</a>
                </div>
              </div>
              <button type="button" @click="removeAttachment" class="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg">
                <Trash2 :size="15" />
              </button>
            </div>

            <div
              v-else
              @click="fileInputRef?.click()"
              class="p-4 rounded-xl border border-dashed border-gray-200 hover:border-dark-green/40 bg-surface/50 hover:bg-emerald-50/20 text-center cursor-pointer space-y-1 transition-colors"
            >
              <UploadCloud :size="20" class="mx-auto text-text-muted" />
              <p class="text-xs font-bold text-text-primary">Pilih berkas kuitansi / invoice</p>
              <p class="text-[10.5px] text-text-muted">PDF, PNG, atau JPG (Maksimal 5MB)</p>
            </div>

            <p v-if="uploadAttachmentError" class="text-[11px] text-danger font-medium">{{ uploadAttachmentError }}</p>
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
              :disabled="isSubmittingCreate || isUploadingAttachment"
              class="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Loader2 v-if="isSubmittingCreate" :size="14" class="animate-spin" />
              <Send v-else :size="14" />
              <span>{{ isSubmittingCreate ? 'Menyimpan...' : 'Simpan Pemeliharaan' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- MODAL 2: DETAIL MAINTENANCE LOG MODAL                   -->
    <!-- ======================================================== -->
    <div
      v-if="showDetailModal && activeLog"
      class="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div class="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 my-8 animate-in fade-in zoom-in-95">
        <div class="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <span class="font-mono text-xs font-bold text-dark-green bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
              {{ formatDate(activeLog.maintenanceDate) }}
            </span>
            <h3 class="text-base font-extrabold text-text-primary mt-1">{{ activeLog.title }}</h3>
          </div>
          <button @click="showDetailModal = false" class="text-text-muted hover:text-text-primary cursor-pointer">
            <X :size="18" />
          </button>
        </div>

        <div class="space-y-4 text-xs">
          <!-- Parameter grid -->
          <div class="grid grid-cols-2 gap-2.5">
            <div class="p-3 rounded-xl bg-surface border border-gray-100 space-y-1">
              <span class="text-text-muted text-[10px] font-bold uppercase">Laboratorium</span>
              <p class="font-black text-dark-green truncate">{{ activeLog.laboratoryCode }} ({{ activeLog.laboratoryName }})</p>
            </div>
            <div class="p-3 rounded-xl bg-surface border border-gray-100 space-y-1">
              <span class="text-text-muted text-[10px] font-bold uppercase">Peralatan</span>
              <p class="font-bold text-text-primary truncate">{{ activeLog.facilityName }} ({{ activeLog.facilityCode }})</p>
            </div>
            <div class="p-3 rounded-xl bg-surface border border-gray-100 space-y-1">
              <span class="text-text-muted text-[10px] font-bold uppercase">Tipe Pemeliharaan</span>
              <p :class="['px-2 py-0.5 rounded-full text-[10.5px] font-bold border text-center', getTypeBadgeClass(activeLog.maintenanceType)]">
                {{ getTypeLabel(activeLog.maintenanceType) }}
              </p>
            </div>
            <div class="p-3 rounded-xl bg-surface border border-gray-100 space-y-1">
              <span class="text-text-muted text-[10px] font-bold uppercase">Kondisi Hasil</span>
              <p :class="['px-2 py-0.5 rounded-full text-[10.5px] font-bold border text-center', getConditionBadgeClass(activeLog.resultingCondition)]">
                {{ getConditionLabel(activeLog.resultingCondition) }}
              </p>
            </div>
          </div>

          <!-- Action Taken details -->
          <div class="p-4 rounded-xl bg-surface/60 border border-gray-200/80 space-y-1">
            <span class="text-[10px] font-bold text-text-muted uppercase">Tindakan Teknis</span>
            <p class="text-xs text-text-primary leading-relaxed whitespace-pre-line font-medium">{{ activeLog.actionTaken }}</p>
          </div>

          <!-- Cost & Vendor -->
          <div v-if="activeLog.cost || activeLog.vendor" class="p-3 rounded-xl bg-surface border border-gray-100 flex items-center justify-between">
            <div v-if="activeLog.cost">
              <span class="text-text-muted text-[10px] font-bold uppercase block">Biaya Perawatan</span>
              <span class="font-mono font-bold text-amber-700 text-sm">{{ formatRupiah(activeLog.cost) }}</span>
            </div>
            <div v-if="activeLog.vendor" class="text-right">
              <span class="text-text-muted text-[10px] font-bold uppercase block">Vendor / Mitra</span>
              <span class="font-bold text-text-primary">{{ activeLog.vendor }}</span>
            </div>
          </div>

          <!-- Attachment -->
          <div v-if="activeLog.attachmentUrl" class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Paperclip :size="16" class="text-dark-green" />
              <span class="font-bold text-dark-green">Kuitansi / Faktur Pemeliharaan</span>
            </div>
            <a
              :href="getFileUrl(activeLog.attachmentUrl)"
              target="_blank"
              class="px-3 py-1 bg-dark-green text-white rounded-lg font-bold hover:bg-[#547a5c] inline-flex items-center gap-1"
            >
              Buka Berkas <ExternalLink :size="11" />
            </a>
          </div>

          <!-- Audit info -->
          <div class="p-3 bg-surface rounded-xl border border-gray-100 flex justify-between text-[11px] text-text-muted">
            <span>Teknisi: <strong>{{ activeLog.technicianName }}</strong></span>
            <span>Tercatat: {{ formatDateTime(activeLog.createdAt) }}</span>
          </div>
        </div>

        <div class="pt-3 border-t border-gray-100 flex justify-end">
          <button
            @click="showDetailModal = false"
            class="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-text-secondary hover:bg-gray-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
