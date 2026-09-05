<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLaboranNavStore } from '@/stores/laboran-nav.store'
import {
  ClipboardList,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Download,
  RotateCcw,
  Eye,
  ChevronLeft,
  ChevronRight,
  FileText,
  Building2,
  X,
  Loader2,
  AlertCircle
} from 'lucide-vue-next'
import SummaryCard from '@/components/admin/SummaryCard.vue'
import { BaseAvatar } from '@/components'
import { roomRequestService, type RoomRequest } from '@/services/room-request.service'

const router = useRouter()
const navStore = useLaboranNavStore()

onMounted(() => {
  navStore.setBreadcrumbs([
    { label: 'Portal Laboran', path: '/laboran' },
    { label: 'Permohonan Pinjam' }
  ])
  loadRequests()
})

// Datasets
const requests = ref<RoomRequest[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const totalRecords = ref(0)

// Filters
const searchQuery = ref('')
const selectedStatusFilter = ref<string>('ALL')
const selectedLabFilter = ref<string>('ALL')

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalPages = ref(1)

// Toast Feedback
const showToast = ref(false)
const toastMessage = ref('')

const triggerToast = (msg: string) => {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3500)
}

// Load from API
const loadRequests = async () => {
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
    const res = await roomRequestService.getRoomRequests(filters)
    requests.value = res.data
    totalRecords.value = res.meta.total
    totalPages.value = res.meta.totalPages
  } catch (err: any) {
    errorMessage.value = err.message || 'Gagal memuat permohonan pinjam'
  } finally {
    isLoading.value = false
  }
}

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadRequests()
  }, 400)
})

watch(selectedStatusFilter, () => {
  currentPage.value = 1
  loadRequests()
})

// Summary Metrics Counts
const pendingCount = computed(() => requests.value.filter(r => r.status === 'PENDING').length)
const approvedCount = computed(() => requests.value.filter(r => r.status === 'APPROVED').length)
const rejectedCount = computed(() => requests.value.filter(r => r.status === 'REJECTED').length)
const todayRequestsCount = computed(() => totalRecords.value)

// Laboratory Options
const labOptions = computed(() => {
  const set = new Set<string>()
  requests.value.forEach(r => set.add(r.laboratoryName))
  return Array.from(set)
})

// Filtered Requests List (Client-side lab filter)
const filteredRequests = computed(() => {
  return requests.value.filter(req => {
    if (selectedLabFilter.value !== 'ALL' && req.laboratoryName !== selectedLabFilter.value) {
      return false
    }
    return true
  })
})

const resetFilters = () => {
  searchQuery.value = ''
  selectedStatusFilter.value = 'ALL'
  selectedLabFilter.value = 'ALL'
  currentPage.value = 1
  loadRequests()
}

// Navigation to Dedicated Request Detail View
const handleViewDetail = (id: string) => {
  router.push(`/laboran/room-requests/${id}`)
}

// Export Action
const handleExport = () => {
  triggerToast('Log permohonan pinjam berhasil diekspor ke CSV.')
}
</script>

<template>
  <div class="space-y-6 pb-12 select-none">
    
    <!-- 1. Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2.5 border-b border-gray-200/60">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
            Permohonan Pinjam
          </h1>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-100/80 border border-brand-200 text-dark-green text-[11px] font-bold">
            <ClipboardList :size="12" />
            Portal Evaluasi Laboran
          </span>
        </div>
        <p class="text-xs sm:text-sm text-text-muted font-normal">
          Tinjau dan kelola permohonan penggunaan ruang laboratorium.
        </p>
      </div>

      <!-- Header Actions -->
      <div class="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
        <button
          @click="handleExport"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-gray-200/80 bg-white hover:bg-surface text-text-secondary text-xs font-bold shadow-2xs transition-all cursor-pointer"
        >
          <Download :size="14" />
          <span>Ekspor Log</span>
        </button>
      </div>
    </div>

    <!-- Toast Notification Banner -->
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

    <!-- 2. Summary Statistics Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      <SummaryCard
        title="Menunggu Persetujuan"
        :value="pendingCount"
        subtext="Menunggu evaluasi staf"
        :icon="Clock"
        icon-bg-class="bg-amber-50"
        icon-color-class="text-amber-800"
      />
      <SummaryCard
        title="Total Permohonan"
        :value="todayRequestsCount"
        subtext="Seluruh permohonan tercatat"
        :icon="Calendar"
        icon-bg-class="bg-brand-100"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Disetujui"
        :value="approvedCount"
        subtext="Permohonan disetujui"
        :icon="CheckCircle2"
        icon-bg-class="bg-emerald-50"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Ditolak"
        :value="rejectedCount"
        subtext="Permohonan ditolak"
        :icon="XCircle"
        icon-bg-class="bg-red-50"
        icon-color-class="text-red-700"
      />
    </div>

    <!-- 3. Toolbar (Search & Filter Controls) -->
    <div class="bg-white p-4 rounded-2xl border border-gray-200/70 shadow-2xs space-y-3">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        <!-- Search Input -->
        <div class="relative flex-1 min-w-[240px]">
          <Search :size="15" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari pemohon, laboratorium, kegiatan..."
            class="w-full pl-9 pr-4 py-2 bg-surface/60 border border-gray-200/80 rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-400 focus:bg-white transition-all"
          />
        </div>

        <!-- Dropdown Filters -->
        <div class="flex items-center gap-2 flex-wrap text-xs">
          <!-- Status Filter -->
          <div class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface border border-gray-200/80">
            <span class="text-text-muted font-bold uppercase text-[10px]">Status:</span>
            <select
              v-model="selectedStatusFilter"
              class="bg-transparent text-xs font-bold text-text-primary focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING">Menunggu</option>
              <option value="APPROVED">Disetujui</option>
              <option value="REJECTED">Ditolak</option>
              <option value="CANCELLED">Dibatalkan</option>
            </select>
          </div>

          <!-- Laboratory Filter -->
          <div class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface border border-gray-200/80">
            <Building2 :size="13" class="text-text-muted shrink-0" />
            <select
              v-model="selectedLabFilter"
              class="bg-transparent text-xs font-bold text-text-primary focus:outline-none cursor-pointer max-w-[160px] truncate"
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
        </div>

      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="py-16 text-center">
      <Loader2 :size="32" class="mx-auto text-dark-green animate-spin mb-3" />
      <p class="text-xs text-text-muted font-medium">Memuat data permohonan pinjam...</p>
    </div>

    <!-- 4. Primary Room Requests Data Table -->
    <div v-else class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-surface/50 border-b border-gray-100 text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              <th class="py-3.5 px-4">ID Pengajuan</th>
              <th class="py-3.5 px-4">Pemohon</th>
              <th class="py-3.5 px-4">Laboratorium</th>
              <th class="py-3.5 px-4">Kegiatan & Mata Kuliah</th>
              <th class="py-3.5 px-4">Tanggal</th>
              <th class="py-3.5 px-4">Rentang Waktu</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 text-xs">
            <tr
              v-for="req in filteredRequests"
              :key="req.id"
              class="hover:bg-brand-50/20 transition-colors group select-none"
            >
              <!-- ID -->
              <td class="py-3.5 px-4 font-mono font-bold text-dark-green whitespace-nowrap">
                {{ req.id.substring(0, 8).toUpperCase() }}
              </td>

              <!-- Requester info -->
              <td class="py-3.5 px-4 whitespace-nowrap">
                <div class="flex items-center gap-2.5">
                  <BaseAvatar
                    :src="req.applicantAvatar"
                    :name="req.applicantName"
                    size="sm"
                    class="shrink-0 ring-2 ring-brand-200/60 shadow-2xs"
                  />
                  <div>
                    <span class="font-bold text-text-primary block leading-tight">{{ req.applicantName }}</span>
                    <span class="text-[10px] text-text-muted font-medium block">{{ req.applicantEmail }}</span>
                  </div>
                </div>
              </td>

              <!-- Laboratory info -->
              <td class="py-3.5 px-4 whitespace-nowrap">
                <span class="px-1.5 py-0.2 rounded bg-gray-100 text-text-muted text-[10px] font-mono font-bold mr-1">
                  {{ req.laboratoryCode }}
                </span>
                <span class="font-bold text-text-primary">{{ req.laboratoryName }}</span>
              </td>

              <!-- Activity info -->
              <td class="py-3.5 px-4">
                <span class="font-bold text-text-primary block truncate max-w-[200px]">{{ req.activityName }}</span>
                <span class="text-[10px] text-text-muted font-medium block truncate max-w-[200px]">{{ req.courseName }}</span>
              </td>

              <!-- Date -->
              <td class="py-3.5 px-4 whitespace-nowrap font-medium text-text-secondary">
                {{ req.formattedRequestDate }}
              </td>

              <!-- Time -->
              <td class="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-text-primary">
                {{ req.startTime }} – {{ req.endTime }}
              </td>

              <!-- Status Badge -->
              <td class="py-3.5 px-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border',
                    req.status === 'PENDING'
                      ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                      : req.status === 'APPROVED'
                        ? 'bg-emerald-50 text-dark-green border-emerald-200/80'
                        : req.status === 'REJECTED'
                          ? 'bg-red-50 text-red-700 border-red-200/80'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                  ]"
                >
                  <Clock v-if="req.status === 'PENDING'" :size="11" />
                  <CheckCircle2 v-else-if="req.status === 'APPROVED'" :size="11" />
                  <XCircle v-else-if="req.status === 'REJECTED'" :size="11" />
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

              <!-- Action Button -->
              <td class="py-3.5 px-4 text-right whitespace-nowrap">
                <button
                  @click="handleViewDetail(req.id)"
                  class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-100/70 hover:bg-dark-green text-dark-green hover:text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  <Eye :size="13" />
                  <span>Lihat</span>
                </button>
              </td>
            </tr>

            <!-- Empty Table State -->
            <tr v-if="filteredRequests.length === 0">
              <td colspan="8" class="py-12 text-center text-text-muted space-y-2">
                <FileText :size="36" class="mx-auto text-text-muted/40 mb-2" />
                <h4 class="text-xs font-bold text-text-secondary">Permohonan pinjam tidak ditemukan</h4>
                <p class="text-[11px] text-text-muted max-w-sm mx-auto">
                  Saat ini tidak ada permohonan yang sesuai dengan filter atau kriteria pencarian yang dipilih.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Table Footer / Pagination -->
      <div class="px-5 py-3.5 bg-surface/30 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span class="text-text-muted font-medium">
          Menampilkan <strong class="font-bold text-text-primary">{{ filteredRequests.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0 }}</strong> – <strong class="font-bold text-text-primary">{{ Math.min(currentPage * itemsPerPage, totalRecords) }}</strong> dari <strong class="font-bold text-text-primary">{{ totalRecords }}</strong> permohonan
        </span>

        <div class="flex items-center gap-1.5">
          <button
            @click="currentPage--; loadRequests()"
            :disabled="currentPage === 1"
            class="p-1.5 rounded-lg border border-gray-200 text-text-muted hover:text-text-primary hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft :size="15" />
          </button>
          
          <span class="px-3 py-1 font-bold text-dark-green bg-brand-100 rounded-lg">
            {{ currentPage }} / {{ totalPages }}
          </span>

          <button
            @click="currentPage++; loadRequests()"
            :disabled="currentPage >= totalPages"
            class="p-1.5 rounded-lg border border-gray-200 text-text-muted hover:text-text-primary hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronRight :size="15" />
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
