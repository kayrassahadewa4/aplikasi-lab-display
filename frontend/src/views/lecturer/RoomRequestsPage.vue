<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLecturerNavStore } from '@/stores/lecturer-nav.store'
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  FlaskConical,
  Calendar,
  User,
  Trash2,
  X,
  FileText,
  AlertCircle,
  AlertTriangle,
  Loader2
} from 'lucide-vue-next'
import { roomRequestService, type RoomRequest } from '@/services/room-request.service'
import { laboratoryService, type LaboratoryData } from '@/services/laboratory.service'

const router = useRouter()
const navStore = useLecturerNavStore()

// State
const requests = ref<RoomRequest[]>([])
const laboratories = ref<LaboratoryData[]>([])
const isLoading = ref(true)
const isActionLoading = ref(false)
const errorMessage = ref<string | null>(null)

// Filtering & Sorting
const searchQuery = ref('')
const selectedStatusFilter = ref('ALL')
const selectedLabFilter = ref('ALL')
const sortBy = ref<'newest' | 'oldest' | 'date'>('newest')

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0)
const totalPages = ref(1)

// Modals
const showCancelModal = ref(false)
const showDeleteModal = ref(false)
const selectedRequest = ref<RoomRequest | null>(null)

// Toast feedback
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')

const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 4000)
}

// Fetch Room Requests from API
const fetchRequests = async () => {
  isLoading.value = true
  errorMessage.value = null

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
    if (selectedLabFilter.value !== 'ALL') {
      filters.laboratoryId = selectedLabFilter.value
    }

    const response = await roomRequestService.getMyRoomRequests(filters)
    requests.value = response.data
    totalItems.value = response.meta.total
    totalPages.value = response.meta.totalPages || 1
  } catch (err: any) {
    console.error('Failed to load room requests:', err)
    errorMessage.value = err.message || 'Gagal memuat permohonan pinjam ruangan. Silakan coba lagi.'
  } finally {
    isLoading.value = false
  }
}

// Fetch Laboratories for filtering dropdown
const fetchLaboratories = async () => {
  try {
    const response = await laboratoryService.getLaboratories({ limit: 100 })
    laboratories.value = response.laboratories
  } catch (err) {
    console.warn('Failed to load laboratories for filter:', err)
  }
}

onMounted(async () => {
  navStore.setBreadcrumbs([
    { label: 'Portal Dosen', path: '/lecturer' },
    { label: 'Permohonan Pinjam' }
  ])

  await Promise.all([fetchRequests(), fetchLaboratories()])
})

// Debounced or watched search/filter changes
watch([selectedStatusFilter, selectedLabFilter], () => {
  currentPage.value = 1
  fetchRequests()
})

let searchTimeout: any = null
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchRequests()
  }, 350)
})

watch(currentPage, () => {
  fetchRequests()
})

// Lecturer-specific summary stats computed from current data set
const stats = computed(() => {
  const pending = requests.value.filter(r => r.status === 'PENDING').length
  const approved = requests.value.filter(r => r.status === 'APPROVED').length
  const rejected = requests.value.filter(r => r.status === 'REJECTED').length
  const total = totalItems.value

  return { pending, approved, rejected, total }
})

// Sorted list
const sortedRequests = computed(() => {
  const list = [...requests.value]
  return list.sort((a, b) => {
    if (sortBy.value === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    } else if (sortBy.value === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    } else if (sortBy.value === 'date') {
      return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
    }
    return 0
  })
})

const navigateTo = (path: string) => {
  router.push(path)
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedStatusFilter.value = 'ALL'
  selectedLabFilter.value = 'ALL'
  sortBy.value = 'newest'
  currentPage.value = 1
  fetchRequests()
}

// Cancel Request Flow
const promptCancel = (req: RoomRequest) => {
  selectedRequest.value = req
  showCancelModal.value = true
}

const confirmCancel = async () => {
  if (!selectedRequest.value) return
  isActionLoading.value = true
  try {
    await roomRequestService.cancelRoomRequest(selectedRequest.value.id)
    triggerToast(`Permohonan pinjam untuk "${selectedRequest.value.activityName}" berhasil dibatalkan.`, 'success')
    showCancelModal.value = false
    selectedRequest.value = null
    await fetchRequests()
  } catch (err: any) {
    triggerToast(err.message || 'Gagal membatalkan permohonan pinjam.', 'error')
  } finally {
    isActionLoading.value = false
  }
}

// Delete Request Flow
const promptDelete = (req: RoomRequest) => {
  selectedRequest.value = req
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!selectedRequest.value) return
  isActionLoading.value = true
  try {
    await roomRequestService.deleteRoomRequest(selectedRequest.value.id)
    triggerToast(`Permohonan pinjam untuk "${selectedRequest.value.activityName}" berhasil dihapus.`, 'success')
    showDeleteModal.value = false
    selectedRequest.value = null
    await fetchRequests()
  } catch (err: any) {
    triggerToast(err.message || 'Gagal menghapus permohonan pinjam.', 'error')
  } finally {
    isActionLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6 pb-12 select-none w-full max-w-full min-w-0">
    
    <!-- 1. Page Header Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200/60 w-full min-w-0">
      <div class="min-w-0 flex-1">
        <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight truncate">
          Permohonan Pinjam
        </h1>
        <p class="text-xs sm:text-sm text-text-muted font-normal truncate">
          Ajukan dan pantau status permohonan pinjam ruangan laboratorium Anda.
        </p>
      </div>

      <!-- Action Button -->
      <div class="flex items-center gap-2 flex-wrap self-start sm:self-auto shrink-0">
        <button
          @click="navigateTo('/lecturer/room-requests/new')"
          id="btn-new-room-request"
          class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs shadow-dark-green/20 transition-all duration-150 active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <Plus :size="15" stroke-width="2.5" />
          <span>Permohonan Pinjam Baru</span>
        </button>
      </div>
    </div>

    <!-- Toast Notification Banner -->
    <div
      v-if="showToast"
      :class="[
        'p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in zoom-in-95 duration-150 w-full min-w-0',
        toastType === 'success'
          ? 'bg-emerald-50 border-emerald-200 text-dark-green'
          : 'bg-red-50 border-red-200 text-danger'
      ]"
    >
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <CheckCircle2 v-if="toastType === 'success'" :size="16" class="text-dark-green shrink-0" />
        <AlertCircle v-else :size="16" class="text-danger shrink-0" />
        <span class="truncate">{{ toastMessage }}</span>
      </div>
      <button @click="showToast = false" class="hover:opacity-80 shrink-0">
        <X :size="14" />
      </button>
    </div>

    <!-- Error Alert Banner -->
    <div
      v-if="errorMessage"
      class="p-4 rounded-2xl bg-red-50 border border-red-200 text-danger text-xs flex items-center justify-between shadow-xs w-full min-w-0"
    >
      <div class="flex items-center gap-2.5 min-w-0 flex-1">
        <AlertCircle :size="18" class="shrink-0" />
        <div>
          <p class="font-bold">Gagal memuat permohonan</p>
          <p class="text-[11px] text-danger/80">{{ errorMessage }}</p>
        </div>
      </div>
      <button
        @click="fetchRequests"
        class="px-3 py-1.5 rounded-lg bg-white border border-red-200 text-danger text-xs font-bold hover:bg-red-50 cursor-pointer shrink-0"
      >
        Coba Lagi
      </button>
    </div>

    <!-- 2. Compact Lecturer Summary Statistics Row -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 w-full min-w-0">
      
      <!-- Stat 1: Pending Requests -->
      <div
        class="bg-white p-4.5 rounded-2xl border border-gray-200/70 shadow-2xs flex items-center justify-between transition-all duration-200 ease-out group select-none hover:-translate-y-0.5 hover:bg-brand-50/20 hover:border-brand-300/80 hover:shadow-md hover:shadow-black/[0.04] min-w-0"
      >
        <div class="space-y-0.5 min-w-0 flex-1 pr-2">
          <span class="text-text-muted text-[11px] font-bold uppercase tracking-wider block transition-colors duration-200 group-hover:text-text-primary truncate">
            Menunggu Persetujuan
          </span>
          <span class="text-xl sm:text-2xl font-black text-amber-800 block transition-colors duration-200 group-hover:text-dark-green">
            {{ stats.pending }}
          </span>
          <span class="text-[11px] text-text-muted font-medium block truncate">
            Menunggu verifikasi laboran
          </span>
        </div>
        <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-transparent transition-all duration-200 group-hover:scale-105 group-hover:bg-amber-100/80 group-hover:border-amber-300/50">
          <Clock :size="20" stroke-width="2" />
        </div>
      </div>

      <!-- Stat 2: Approved -->
      <div
        class="bg-white p-4.5 rounded-2xl border border-gray-200/70 shadow-2xs flex items-center justify-between transition-all duration-200 ease-out group select-none hover:-translate-y-0.5 hover:bg-brand-50/20 hover:border-brand-300/80 hover:shadow-md hover:shadow-black/[0.04] min-w-0"
      >
        <div class="space-y-0.5 min-w-0 flex-1 pr-2">
          <span class="text-text-muted text-[11px] font-bold uppercase tracking-wider block transition-colors duration-200 group-hover:text-text-primary truncate">
            Disetujui
          </span>
          <span class="text-xl sm:text-2xl font-black text-text-primary block transition-colors duration-200 group-hover:text-dark-green">
            {{ stats.approved }}
          </span>
          <span class="text-[11px] text-text-muted font-medium block truncate">
            Permohonan disetujui
          </span>
        </div>
        <div class="w-10 h-10 rounded-xl bg-emerald-50 text-dark-green flex items-center justify-center shrink-0 border border-transparent transition-all duration-200 group-hover:scale-105 group-hover:bg-emerald-100/80 group-hover:border-emerald-300/50">
          <CheckCircle2 :size="20" stroke-width="2" />
        </div>
      </div>

      <!-- Stat 3: Rejected -->
      <div
        class="bg-white p-4.5 rounded-2xl border border-gray-200/70 shadow-2xs flex items-center justify-between transition-all duration-200 ease-out group select-none hover:-translate-y-0.5 hover:bg-brand-50/20 hover:border-brand-300/80 hover:shadow-md hover:shadow-black/[0.04] min-w-0"
      >
        <div class="space-y-0.5 min-w-0 flex-1 pr-2">
          <span class="text-text-muted text-[11px] font-bold uppercase tracking-wider block transition-colors duration-200 group-hover:text-text-primary truncate">
            Ditolak
          </span>
          <span class="text-xl sm:text-2xl font-black text-danger block transition-colors duration-200 group-hover:text-dark-green">
            {{ stats.rejected }}
          </span>
          <span class="text-[11px] text-text-muted font-medium block truncate">
            Tidak disetujui
          </span>
        </div>
        <div class="w-10 h-10 rounded-xl bg-red-50 text-danger flex items-center justify-center shrink-0 border border-transparent transition-all duration-200 group-hover:scale-105 group-hover:bg-red-100/80 group-hover:border-red-300/50">
          <XCircle :size="20" stroke-width="2" />
        </div>
      </div>

      <!-- Stat 4: Total Requests -->
      <div
        class="bg-white p-4.5 rounded-2xl border border-gray-200/70 shadow-2xs flex items-center justify-between transition-all duration-200 ease-out group select-none hover:-translate-y-0.5 hover:bg-brand-50/20 hover:border-brand-300/80 hover:shadow-md hover:shadow-black/[0.04] min-w-0"
      >
        <div class="space-y-0.5 min-w-0 flex-1 pr-2">
          <span class="text-text-muted text-[11px] font-bold uppercase tracking-wider block transition-colors duration-200 group-hover:text-text-primary truncate">
            Total Permohonan
          </span>
          <span class="text-xl sm:text-2xl font-black text-text-primary block transition-colors duration-200 group-hover:text-dark-green">
            {{ stats.total }}
          </span>
          <span class="text-[11px] text-text-muted font-medium block truncate">
            Diajukan oleh Anda
          </span>
        </div>
        <div class="w-10 h-10 rounded-xl bg-brand-100/90 text-dark-green flex items-center justify-center shrink-0 border border-transparent transition-all duration-200 group-hover:scale-105 group-hover:bg-brand-200/70 group-hover:border-brand-300/50">
          <ClipboardList :size="20" stroke-width="2" />
        </div>
      </div>

    </div>

    <!-- 3. Filters & Search Toolbar -->
    <div class="bg-white p-4 rounded-2xl border border-gray-200/70 shadow-2xs space-y-3 w-full min-w-0">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-w-0">
        
        <!-- Search Input -->
        <div class="relative w-full lg:w-80 shrink-0">
          <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            <Search :size="16" />
          </div>
          <input
            v-model="searchQuery"
            type="text"
            id="input-search-requests"
            placeholder="Cari berdasarkan kegiatan, mata kuliah, atau nama kelas..."
            class="w-full pl-9 pr-8 py-2 bg-surface/60 border border-gray-200/80 rounded-xl text-xs transition-all focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green focus:bg-white text-text-primary placeholder:text-text-muted/70"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
          >
            <X :size="14" />
          </button>
        </div>

        <!-- Filter Dropdowns -->
        <div class="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          <!-- Status Filter -->
          <select
            v-model="selectedStatusFilter"
            id="select-status-filter"
            class="px-3 py-2 bg-surface/60 border border-gray-200/80 rounded-xl text-xs text-text-secondary font-medium focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Menunggu Persetujuan</option>
            <option value="APPROVED">Disetujui</option>
            <option value="REJECTED">Ditolak</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>

          <!-- Lab Filter -->
          <select
            v-model="selectedLabFilter"
            id="select-lab-filter"
            class="px-3 py-2 bg-surface/60 border border-gray-200/80 rounded-xl text-xs text-text-secondary font-medium focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green cursor-pointer"
          >
            <option value="ALL">Semua Laboratorium</option>
            <option v-for="lab in laboratories" :key="lab.id" :value="lab.id">
              {{ lab.name }} ({{ lab.code }})
            </option>
          </select>

          <!-- Sort Dropdown -->
          <select
            v-model="sortBy"
            id="select-sort-order"
            class="px-3 py-2 bg-surface/60 border border-gray-200/80 rounded-xl text-xs text-text-secondary font-medium focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green cursor-pointer"
          >
            <option value="newest">Urutan: Terbaru</option>
            <option value="oldest">Urutan: Terlama</option>
            <option value="date">Urutan: Tanggal Kegiatan</option>
          </select>

          <!-- Reset Action -->
          <button
            v-if="searchQuery || selectedStatusFilter !== 'ALL' || selectedLabFilter !== 'ALL' || sortBy !== 'newest'"
            @click="resetFilters"
            class="px-2.5 py-1.5 text-xs font-bold text-dark-green hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw :size="13" />
            <span>Reset</span>
          </button>
        </div>

      </div>
    </div>

    <!-- 4. Main Request Table / Responsive List Area -->
    <div class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs overflow-hidden w-full min-w-0">
      
      <div class="p-5 border-b border-gray-100 flex items-center justify-between min-w-0">
        <div>
          <h3 class="text-base font-extrabold text-text-primary tracking-tight">Permohonan Pinjam Saya</h3>
          <p class="text-xs text-text-muted">Menampilkan {{ sortedRequests.length }} dari {{ totalItems }} permohonan.</p>
        </div>
        <button
          @click="fetchRequests"
          :disabled="isLoading"
          class="p-2 rounded-xl border border-gray-200 text-text-muted hover:text-dark-green hover:bg-surface transition-colors cursor-pointer"
          title="Perbarui Daftar"
        >
          <RefreshCw :size="15" :class="{ 'animate-spin': isLoading }" />
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="py-16 text-center space-y-3">
        <Loader2 :size="32" class="animate-spin text-dark-green mx-auto" />
        <p class="text-xs text-text-muted font-medium">Memuat permohonan pinjam ruangan Anda...</p>
      </div>

      <!-- Request Table for Large Screens -->
      <div v-else-if="sortedRequests.length > 0" class="overflow-x-auto min-w-0">
        <table class="w-full text-left text-xs border-collapse min-w-[750px]">
          <thead>
            <tr class="bg-surface/60 border-b border-gray-100 text-text-muted font-bold uppercase text-[10px] tracking-wider">
              <th class="py-3 px-4">Laboratorium</th>
              <th class="py-3 px-4">Kegiatan & Tujuan</th>
              <th class="py-3 px-4">Tanggal Kegiatan</th>
              <th class="py-3 px-4">Rentang Waktu</th>
              <th class="py-3 px-4">Peserta</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 font-medium">
            <tr
              v-for="req in sortedRequests"
              :key="req.id"
              class="hover:bg-brand-50/20 transition-colors group cursor-pointer"
              @click="navigateTo(`/lecturer/room-requests/${req.id}`)"
            >
              <!-- Laboratory -->
              <td class="py-3.5 px-4 whitespace-nowrap">
                <span class="font-bold text-text-primary block">{{ req.laboratoryName }}</span>
                <span class="text-[10px] text-text-muted font-mono font-semibold">{{ req.laboratoryCode }}</span>
              </td>

              <!-- Activity -->
              <td class="py-3.5 px-4 max-w-[220px]">
                <span class="font-bold text-dark-green block truncate">{{ req.activityName }}</span>
                <span v-if="req.courseName" class="text-[11px] text-text-muted truncate block">{{ req.courseName }}</span>
                <span v-if="req.className" class="text-[10px] text-gray-500 font-mono">Kelas: {{ req.className }}</span>
              </td>

              <!-- Requested Date -->
              <td class="py-3.5 px-4 font-bold text-text-primary whitespace-nowrap">
                {{ req.formattedRequestDate }}
              </td>

              <!-- Time Slot -->
              <td class="py-3.5 px-4 font-extrabold text-dark-green whitespace-nowrap">
                <div class="inline-flex items-center gap-1.5">
                  <Clock :size="13" class="text-brand-600 shrink-0" />
                  <span>{{ req.startTime }} - {{ req.endTime }}</span>
                </div>
              </td>

              <!-- Participants -->
              <td class="py-3.5 px-4 whitespace-nowrap">
                <span class="px-2 py-0.5 rounded bg-gray-100 text-text-primary font-bold text-[10px]">
                  {{ req.participantCount }} orang
                </span>
              </td>

              <!-- Status Badge -->
              <td class="py-3.5 px-4 whitespace-nowrap">
                <span
                  :class="[
                    'px-2.5 py-1 rounded-full text-[10px] font-extrabold border inline-flex items-center gap-1',
                    req.status === 'APPROVED'
                      ? 'bg-emerald-50 text-dark-green border-emerald-200'
                      : req.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : req.status === 'REJECTED'
                          ? 'bg-red-50 text-danger border-red-200'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                  ]"
                >
                  <span v-if="req.status === 'APPROVED'" class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span v-else-if="req.status === 'PENDING'" class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>{{
                    req.status === 'PENDING'
                      ? 'Menunggu'
                      : req.status === 'APPROVED'
                        ? 'Disetujui'
                        : req.status === 'REJECTED'
                          ? 'Ditolak'
                          : 'Dibatalkan'
                  }}</span>
                </span>
              </td>

              <!-- Action Buttons -->
              <td class="py-3.5 px-4 text-right whitespace-nowrap">
                <div class="flex items-center justify-end gap-1.5" @click.stop>
                  <button
                    @click="navigateTo(`/lecturer/room-requests/${req.id}`)"
                    class="px-2.5 py-1 rounded-lg border border-gray-200/80 bg-white hover:bg-brand-50 hover:text-dark-green text-text-secondary text-xs font-bold shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Detail</span>
                    <ChevronRight :size="13" />
                  </button>

                  <!-- Cancel Button (PENDING only) -->
                  <button
                    v-if="req.status === 'PENDING'"
                    @click="promptCancel(req)"
                    class="px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                    title="Batalkan permohonan"
                  >
                    Batalkan
                  </button>

                  <!-- Delete Button (PENDING or CANCELLED only) -->
                  <button
                    v-if="req.status === 'PENDING' || req.status === 'CANCELLED'"
                    @click="promptDelete(req)"
                    class="p-1 rounded-lg border border-red-200 bg-red-50 text-danger hover:bg-red-100 text-xs font-bold transition-colors cursor-pointer"
                    title="Hapus permohonan"
                  >
                    <Trash2 :size="13" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Professional Empty State -->
      <div v-else class="py-12 text-center space-y-3 w-full min-w-0">
        <div class="w-12 h-12 rounded-2xl bg-surface border border-gray-200 text-text-muted mx-auto flex items-center justify-center">
          <ClipboardList :size="24" />
        </div>
        <div class="space-y-1">
          <h4 class="text-sm font-bold text-text-primary">Belum ada permohonan pinjam</h4>
          <p class="text-xs text-text-muted max-w-sm mx-auto">
            Anda belum mengajukan permohonan pinjam ruangan atau tidak ada data yang cocok dengan kriteria filter saat ini.
          </p>
        </div>
        <button
          @click="navigateTo('/lecturer/room-requests/new')"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer mt-2"
        >
          <Plus :size="15" stroke-width="2.5" />
          <span>Permohonan Pinjam Baru</span>
        </button>
      </div>

      <!-- Pagination Footer -->
      <div v-if="totalItems > 0" class="p-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-text-muted min-w-0">
        <div>
          Menampilkan <strong class="text-text-primary">{{ (currentPage - 1) * itemsPerPage + 1 }}</strong> hingga
          <strong class="text-text-primary">{{ Math.min(currentPage * itemsPerPage, totalItems) }}</strong> dari
          <strong class="text-text-primary">{{ totalItems }}</strong> permohonan
        </div>

        <div class="flex items-center gap-1.5 self-center sm:self-auto">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1 || isLoading"
            class="px-2.5 py-1 rounded-lg border border-gray-200 text-text-secondary hover:text-text-primary hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
          >
            <ChevronLeft :size="14" />
            <span>Sebelumnya</span>
          </button>

          <span class="px-3 py-1 rounded-lg bg-surface border border-gray-200 text-dark-green font-bold">
            Halaman {{ currentPage }} dari {{ totalPages }}
          </span>

          <button
            @click="currentPage++"
            :disabled="currentPage >= totalPages || isLoading"
            class="px-2.5 py-1 rounded-lg border border-gray-200 text-text-secondary hover:text-text-primary hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
          >
            <span>Selanjutnya</span>
            <ChevronRight :size="14" />
          </button>
        </div>
      </div>

    </div>

    <!-- Cancellation Confirmation Modal -->
    <div
      v-if="showCancelModal"
      class="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <AlertTriangle :size="20" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-text-primary">Batalkan Permohonan Pinjam?</h3>
            <p class="text-xs text-text-muted">Tindakan ini akan mengubah status permohonan menjadi DIBATALKAN.</p>
          </div>
        </div>

        <p class="text-xs text-text-secondary">
          Apakah Anda yakin ingin membatalkan permohonan pinjam untuk <strong>"{{ selectedRequest?.activityName }}"</strong> pada tanggal {{ selectedRequest?.formattedRequestDate }}?
        </p>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            @click="showCancelModal = false; selectedRequest = null"
            :disabled="isActionLoading"
            class="px-4 py-2 rounded-xl border border-gray-200 text-text-secondary text-xs font-bold hover:bg-surface cursor-pointer"
          >
            Tidak, Pertahankan
          </button>
          <button
            @click="confirmCancel"
            :disabled="isActionLoading"
            class="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Loader2 v-if="isActionLoading" :size="14" class="animate-spin" />
            <span>Ya, Batalkan Permohonan</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Deletion Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-red-50 text-danger flex items-center justify-center shrink-0">
            <Trash2 :size="20" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-text-primary">Hapus Permohonan Pinjam?</h3>
            <p class="text-xs text-text-muted">Tindakan ini akan menghapus data permohonan secara permanen.</p>
          </div>
        </div>

        <p class="text-xs text-text-secondary">
          Apakah Anda yakin ingin menghapus permohonan untuk <strong>"{{ selectedRequest?.activityName }}"</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            @click="showDeleteModal = false; selectedRequest = null"
            :disabled="isActionLoading"
            class="px-4 py-2 rounded-xl border border-gray-200 text-text-secondary text-xs font-bold hover:bg-surface cursor-pointer"
          >
            Batal
          </button>
          <button
            @click="confirmDelete"
            :disabled="isActionLoading"
            class="px-4 py-2 rounded-xl bg-danger hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Loader2 v-if="isActionLoading" :size="14" class="animate-spin" />
            <span>Hapus Permohonan</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
