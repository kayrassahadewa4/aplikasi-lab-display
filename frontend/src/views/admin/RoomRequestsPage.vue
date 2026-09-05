<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import {
  FileText,
  Plus,
  Search,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2
} from 'lucide-vue-next'
import { roomRequestService, type RoomRequest } from '@/services/room-request.service'
import SummaryCard from '@/components/admin/SummaryCard.vue'
import { BaseAvatar } from '@/components'

const router = useRouter()
const navStore = useAdminNavStore()

onMounted(() => {
  navStore.setBreadcrumbs([
    { label: 'Dashboard', path: '/admin' },
    { label: 'Permohonan Pinjam' },
  ])
  loadRoomRequests()
})

// Reactive State
const requests = ref<RoomRequest[]>([])
const searchQuery = ref('')
const selectedLabFilter = ref<string>('All')
const selectedStatusFilter = ref<string>('All')

// Loading & Error State
const isLoading = ref(false)
const errorMessage = ref('')

// Pagination State
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0)
const totalPages = ref(1)

// Load room requests from API
const loadRoomRequests = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const filters: any = {
      page: currentPage.value,
      limit: itemsPerPage.value,
    }

    if (searchQuery.value) {
      filters.search = searchQuery.value
    }

    if (selectedStatusFilter.value !== 'All') {
      filters.status = selectedStatusFilter.value
    }

    const response = await roomRequestService.getRoomRequests(filters)
    requests.value = response.data
    totalItems.value = response.meta.total
    totalPages.value = response.meta.totalPages
  } catch (error: any) {
    errorMessage.value = error.message || 'Gagal memuat data permohonan pinjam'
    console.error('Failed to load room requests:', error)
  } finally {
    isLoading.value = false
  }
}

// Watch for filter changes
watch([searchQuery, selectedStatusFilter, currentPage], () => {
  loadRoomRequests()
})

// Watch for lab filter changes (client-side filtering)
watch(selectedLabFilter, () => {
  currentPage.value = 1
})

// Summary Metrics
const totalCount = computed(() => totalItems.value)
const pendingCount = computed(() => requests.value.filter(r => r.status === 'PENDING').length)
const approvedCount = computed(() => requests.value.filter(r => r.status === 'APPROVED').length)
const rejectedCount = computed(() => requests.value.filter(r => r.status === 'REJECTED').length)

// Filtered Requests List (client-side lab filter only)
const filteredRequests = computed(() => {
  if (selectedLabFilter.value === 'All') {
    return requests.value
  }
  return requests.value.filter(req => req.laboratoryCode === selectedLabFilter.value)
})

// Paginated Requests List
const paginatedRequests = computed(() => {
  return filteredRequests.value
})

// Page Navigation Actions
const navigateToCreate = () => {
  router.push('/admin/room-requests/create')
}

const navigateToDetail = (req: RoomRequest) => {
  router.push(`/admin/room-requests/${req.id}`)
}

const navigateToReview = (req: RoomRequest) => {
  router.push(`/admin/room-requests/${req.id}/review`)
}
</script>

<template>
  <div class="space-y-6 pb-8 select-none">

    <!-- Error Message -->
    <div
      v-if="errorMessage"
      class="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center justify-between shadow-xs"
    >
      <div class="flex items-center gap-2">
        <AlertTriangle :size="16" class="shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>
      <button @click="errorMessage = ''" class="text-red-700 hover:opacity-80">
        <X :size="14" />
      </button>
    </div>

    <!-- 1. Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2.5 border-b border-gray-200/60">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
            Permohonan Pinjam
          </h1>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-100/80 border border-brand-200 text-dark-green text-[11px] font-bold">
            <FileText :size="12" class="text-primary-dark" />
            Pengajuan Insidental
          </span>
        </div>
        <p class="text-xs sm:text-sm text-text-muted font-normal">
          Tinjau dan setujui permohonan peminjaman ruangan laboratorium yang diajukan oleh dosen dan sivitas akademika.
        </p>
      </div>

      <!-- Primary Action CTA Button Navigating to Dedicated Create Page -->
      <div class="self-start sm:self-auto shrink-0">
        <button
          @click="navigateToCreate"
          class="inline-flex items-center gap-2 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs sm:text-xs font-bold shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer"
        >
          <Plus :size="15" stroke-width="2.5" />
          <span>Buat Permohonan Baru</span>
        </button>
      </div>
    </div>

    <!-- 2. Metric Summary Widgets -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        title="Total Permohonan"
        :value="totalCount"
        :icon="FileText"
        icon-bg-class="bg-brand-100"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Menunggu Persetujuan"
        :value="pendingCount"
        :icon="Clock"
        icon-bg-class="bg-amber-50"
        icon-color-class="text-amber-800"
      />
      <SummaryCard
        title="Permohonan Disetujui"
        :value="approvedCount"
        :icon="CheckCircle2"
        icon-bg-class="bg-emerald-50"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Permohonan Ditolak"
        :value="rejectedCount"
        :icon="XCircle"
        icon-bg-class="bg-red-50"
        icon-color-class="text-red-700"
      />
    </div>

    <!-- 3. Toolbar (Search / Filter) -->
    <div class="bg-white p-3 sm:p-4 rounded-2xl border border-gray-200/70 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between text-xs">
      <div class="relative flex-1">
        <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari permohonan berdasarkan nama kegiatan, pemohon, atau lab..."
          class="w-full pl-9 pr-3 py-2 bg-surface border border-gray-200 rounded-xl text-text-primary focus:outline-none focus:border-brand-400 focus:bg-white"
        />
      </div>

      <div class="flex items-center gap-2">
        <select
          v-model="selectedLabFilter"
          class="px-3 py-2 bg-surface border border-gray-200 rounded-xl font-bold text-text-primary focus:outline-none focus:border-brand-400"
        >
          <option value="All">Semua Ruangan</option>
        </select>

        <select
          v-model="selectedStatusFilter"
          class="px-3 py-2 bg-surface border border-gray-200 rounded-xl font-bold text-text-primary focus:outline-none focus:border-brand-400"
        >
          <option value="All">Semua Status</option>
          <option value="PENDING">Menunggu Persetujuan</option>
          <option value="APPROVED">Disetujui</option>
          <option value="REJECTED">Ditolak</option>
          <option value="CANCELLED">Dibatalkan</option>
        </select>
      </div>
    </div>

    <!-- 4. Data Table -->
    <div class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs overflow-hidden">

      <!-- Loading State -->
      <div v-if="isLoading" class="py-12 text-center">
        <Loader2 :size="36" class="mx-auto text-dark-green animate-spin mb-2" />
        <p class="text-xs text-text-muted font-bold">Memuat data permohonan pinjam...</p>
      </div>

      <!-- Data Table -->
      <div v-else-if="!isLoading && paginatedRequests.length > 0" class="overflow-x-auto">
        <table class="w-full text-left text-xs text-text-primary">
          <thead class="bg-surface/60 border-b border-gray-100 text-text-muted font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th class="py-3.5 px-4">Kegiatan & Pemohon</th>
              <th class="py-3.5 px-4">Lab Diajukan</th>
              <th class="py-3.5 px-4">Tanggal & Jam</th>
              <th class="py-3.5 px-4">Peserta</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="req in paginatedRequests"
              :key="req.id"
              @click="navigateToDetail(req)"
              class="hover:bg-brand-50/20 transition-colors cursor-pointer group"
            >
              <!-- Activity & Applicant -->
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-3">
                  <BaseAvatar
                    :src="req.applicantAvatar"
                    :name="req.applicantName"
                    size="sm"
                    class="shrink-0 ring-2 ring-brand-200/60 shadow-2xs"
                  />
                  <div>
                    <p class="font-bold text-text-primary group-hover:text-dark-green transition-colors">{{ req.activityName }}</p>
                    <p class="text-[11px] text-text-muted font-normal">{{ req.applicantName }} ({{ req.applicantRole }})</p>
                  </div>
                </div>
              </td>

              <!-- Lab Code -->
              <td class="py-3.5 px-4 font-mono font-bold text-dark-green">
                {{ req.laboratoryCode }}
              </td>

              <!-- Date & Time -->
              <td class="py-3.5 px-4 font-medium text-text-secondary">
                {{ req.formattedRequestDate }}, {{ req.startTime }} - {{ req.endTime }}
              </td>

              <!-- Participants -->
              <td class="py-3.5 px-4 font-semibold text-text-primary">
                {{ req.participantCount }} Peserta
              </td>

              <!-- Status -->
              <td class="py-3.5 px-4">
                <span :class="['px-2.5 py-0.5 rounded-full text-[10px] font-bold border', req.status === 'APPROVED' ? 'bg-emerald-50 text-dark-green border-brand-200' : req.status === 'PENDING' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-red-50 text-red-700 border-red-200']">
                  {{ req.status === 'APPROVED' ? 'Disetujui' : req.status === 'PENDING' ? 'Menunggu' : req.status === 'REJECTED' ? 'Ditolak' : 'Dibatalkan' }}
                </span>
              </td>

              <!-- Actions -->
              <td class="py-3.5 px-4 text-right" @click.stop>
                <div class="flex items-center justify-end gap-1">
                  <button
                    @click="navigateToDetail(req)"
                    class="p-1.5 rounded-lg text-text-muted hover:text-dark-green hover:bg-brand-50 transition-colors"
                    title="Lihat Detail Permohonan"
                  >
                    <Eye :size="15" />
                  </button>

                  <button
                    v-if="req.status === 'PENDING'"
                    @click="navigateToReview(req)"
                    class="px-2.5 py-1 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-[10px] font-bold transition-colors shadow-2xs"
                  >
                    Tinjau
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-else class="py-12 text-center text-text-muted">
        <FileText :size="36" class="mx-auto text-text-muted/40 mb-2" />
        <p class="font-bold text-xs text-text-secondary">Tidak ada permohonan pinjam ditemukan</p>
        <p class="text-[11px] mt-0.5">Coba sesuaikan kata kunci pencarian atau filter Anda.</p>
      </div>

      <!-- Pagination -->
      <div v-if="!isLoading && paginatedRequests.length > 0" class="p-3 sm:p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
        <span>Menampilkan {{ paginatedRequests.length }} dari {{ totalItems }} permohonan</span>
        <div class="flex items-center gap-1">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-surface"
          >
            <ChevronLeft :size="14" />
          </button>
          <span class="px-3 font-bold text-text-primary">Halaman {{ currentPage }} dari {{ totalPages }}</span>
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-surface"
          >
            <ChevronRight :size="14" />
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
