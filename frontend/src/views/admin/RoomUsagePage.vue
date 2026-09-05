<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import {
  Activity,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  Layers,
  Calendar,
  Building2,
  User,
  Users,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Check,
  Ban,
  Sparkles,
  LogOut,
  Info
} from 'lucide-vue-next'
import { roomUsageService, type RoomUsage } from '@/services/room-usage.service'
import SummaryCard from '@/components/admin/SummaryCard.vue'

const router = useRouter()
const navStore = useAdminNavStore()

onMounted(() => {
  navStore.setBreadcrumbs([
    { label: 'Dashboard', path: '/admin' },
    { label: 'Log Pemakaian Lab' },
  ])
  loadRoomUsages()
})

// Reactive State
const usageList = ref<RoomUsage[]>([])
const totalRecords = ref(0)
const searchQuery = ref('')
const selectedLabFilter = ref<string>('All')
const selectedStatusFilter = ref<string>('All')
const isLoading = ref(false)
const errorMessage = ref('')

// Pagination State
const currentPage = ref(1)
const itemsPerPage = ref(10)

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

    if (selectedLabFilter.value !== 'All') {
      filters.laboratory_id = selectedLabFilter.value
    }

    if (selectedStatusFilter.value !== 'All') {
      filters.status = selectedStatusFilter.value
    }

    const response = await roomUsageService.getRoomUsages(filters)
    usageList.value = response.data
    totalRecords.value = response.meta.total
  } catch (error: any) {
    errorMessage.value = error.message || 'Gagal memuat log pemakaian lab'
    console.error('Failed to load room usages:', error)
  } finally {
    isLoading.value = false
  }
}

// Watch for filter changes
watch([currentPage, searchQuery, selectedStatusFilter], () => {
  loadRoomUsages()
})

// Summary Metrics
const totalCount = computed(() => totalRecords.value)
const activeInUseCount = computed(() => usageList.value.filter(u => u.status === 'IN_USE' || u.status === 'CHECKED_IN').length)
const completedCount = computed(() => usageList.value.filter(u => u.status === 'CHECKED_OUT').length)

const totalPages = computed(() => {
  return Math.ceil(totalRecords.value / itemsPerPage.value) || 1
})

// Page Navigation Actions
const navigateToCreate = () => {
  router.push('/admin/room-usage/create')
}

const navigateToDetail = (usage: RoomUsage) => {
  router.push(`/admin/room-usage/${usage.id}`)
}

const navigateToEdit = (usage: RoomUsage) => {
  router.push(`/admin/room-usage/${usage.id}/edit`)
}
</script>

<template>
  <div class="space-y-6 pb-8 select-none">

    <!-- 1. Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2.5 border-b border-gray-200/60">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
            Log Pemakaian Lab
          </h1>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-100/80 border border-brand-200 text-dark-green text-[11px] font-bold">
            <Activity :size="12" class="text-primary-dark" />
            Monitoring Sesi Aktif
          </span>
        </div>
        <p class="text-xs sm:text-sm text-text-muted font-normal">
          Pantau status check-in ruangan laboratorium, sesi aktif secara real-time, dan riwayat check-out.
        </p>
      </div>

      <!-- Primary Action CTA Button Navigating to Dedicated Create Page -->
      <div class="self-start sm:self-auto shrink-0">
        <button
          @click="navigateToCreate"
          class="inline-flex items-center gap-2 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs sm:text-xs font-bold shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer"
        >
          <Plus :size="15" stroke-width="2.5" />
          <span>Check-in Manual</span>
        </button>
      </div>
    </div>

    <!-- 2. Metric Summary Widgets -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        title="Total Sesi"
        :value="totalCount"
        :icon="Activity"
        icon-bg-class="bg-brand-100"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Sesi Aktif"
        :value="activeInUseCount"
        :icon="CheckCircle2"
        icon-bg-class="bg-emerald-50"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Telah Selesai (Check-out)"
        :value="completedCount"
        :icon="LogOut"
        icon-bg-class="bg-sky-50"
        icon-color-class="text-sky-700"
      />
      <SummaryCard
        title="Lab Terpantau"
        value="5 Ruangan"
        :icon="Building2"
        icon-bg-class="bg-gray-100"
        icon-color-class="text-gray-600"
      />
    </div>

    <!-- 3. Toolbar (Search / Filter) -->
    <div class="bg-white p-3 sm:p-4 rounded-2xl border border-gray-200/70 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between text-xs">
      <div class="relative flex-1">
        <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari log pemakaian berdasarkan kegiatan, nama pengguna, atau kelas..."
          class="w-full pl-9 pr-3 py-2 bg-surface border border-gray-200 rounded-xl text-text-primary focus:outline-none focus:border-brand-400 focus:bg-white"
        />
      </div>

      <div class="flex items-center gap-2">
        <select
          v-model="selectedLabFilter"
          class="px-3 py-2 bg-surface border border-gray-200 rounded-xl font-bold text-text-primary focus:outline-none focus:border-brand-400"
        >
          <option value="All">Semua Ruangan</option>
          <option value="LAB-RPL">LAB-RPL</option>
          <option value="LAB-MM">LAB-MM</option>
          <option value="LAB-JAR">LAB-JAR</option>
          <option value="LAB-DB">LAB-DB</option>
          <option value="LAB-AI">LAB-AI</option>
        </select>

        <select
          v-model="selectedStatusFilter"
          class="px-3 py-2 bg-surface border border-gray-200 rounded-xl font-bold text-text-primary focus:outline-none focus:border-brand-400"
        >
          <option value="All">Semua Status</option>
          <option value="IN_USE">Sedang Dipakai</option>
          <option value="CHECKED_IN">Check-in</option>
          <option value="CHECKED_OUT">Selesai (Check-out)</option>
          <option value="CANCELLED">Dibatalkan</option>
        </select>
      </div>
    </div>

    <!-- 4. Data Table -->
    <div class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-text-primary">
          <thead class="bg-surface/60 border-b border-gray-100 text-text-muted font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th class="py-3.5 px-4">Kegiatan & Pengguna</th>
              <th class="py-3.5 px-4">Ruangan</th>
              <th class="py-3.5 px-4">Waktu Check-in</th>
              <th class="py-3.5 px-4">Kegiatan / Kelas</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-100">
            <!-- Loading State -->
            <tr v-if="isLoading">
              <td colspan="6" class="py-12 text-center text-text-muted">
                <Activity :size="36" class="mx-auto text-text-muted/40 mb-2 animate-pulse" />
                <p class="font-bold text-xs text-text-secondary">Memuat data pemakaian lab...</p>
              </td>
            </tr>

            <!-- Error State -->
            <tr v-else-if="errorMessage">
              <td colspan="6" class="py-12 text-center text-red-600">
                <AlertTriangle :size="36" class="mx-auto mb-2" />
                <p class="font-bold text-xs">{{ errorMessage }}</p>
                <button @click="loadRoomUsages" class="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold cursor-pointer">
                  Coba Lagi
                </button>
              </td>
            </tr>

            <!-- Data Rows -->
            <tr
              v-else
              v-for="u in usageList"
              :key="u.id"
              @click="navigateToDetail(u)"
              class="hover:bg-brand-50/20 transition-colors cursor-pointer group"
            >
              <!-- Activity & User -->
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-brand-100/80 text-dark-green flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    <Activity :size="16" />
                  </div>
                  <div>
                    <p class="font-bold text-text-primary group-hover:text-dark-green transition-colors">{{ u.activityName || '-' }}</p>
                    <p class="text-[11px] text-text-muted font-normal">Check-in oleh {{ u.checkedInByName }}</p>
                  </div>
                </div>
              </td>

              <!-- Room Code -->
              <td class="py-3.5 px-4 font-mono font-bold text-dark-green">
                {{ u.laboratoryCode || '-' }}
              </td>

              <!-- Check-in Time -->
              <td class="py-3.5 px-4 font-medium text-text-secondary">
                {{ u.formattedCheckInTime }}
              </td>

              <!-- Class -->
              <td class="py-3.5 px-4 font-semibold text-text-primary">
                {{ u.activityName || '-' }}
              </td>

              <!-- Status -->
              <td class="py-3.5 px-4">
                <span :class="['px-2.5 py-0.5 rounded-full text-[10px] font-bold border', u.status === 'IN_USE' ? 'bg-emerald-50 text-dark-green border-brand-200' : u.status === 'CHECKED_IN' ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-gray-100 text-gray-600 border-gray-200']">
                  {{ u.status === 'IN_USE' ? 'Sedang Dipakai' : u.status === 'CHECKED_IN' ? 'Check-in' : u.status === 'CHECKED_OUT' ? 'Selesai' : 'Dibatalkan' }}
                </span>
              </td>

              <!-- Actions -->
              <td class="py-3.5 px-4 text-right" @click.stop>
                <div class="flex items-center justify-end gap-1">
                  <button
                    @click="navigateToDetail(u)"
                    class="p-1.5 rounded-lg text-text-muted hover:text-dark-green hover:bg-brand-50 transition-colors"
                    title="Lihat Detail Pemakaian"
                  >
                    <Eye :size="15" />
                  </button>

                  <button
                    @click="navigateToEdit(u)"
                    class="p-1.5 rounded-lg text-text-muted hover:text-dark-green hover:bg-brand-50 transition-colors"
                    title="Edit Data Pemakaian"
                  >
                    <Edit3 :size="15" />
                  </button>
                </div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="!isLoading && !errorMessage && usageList.length === 0">
              <td colspan="6" class="py-12 text-center text-text-muted">
                <Activity :size="36" class="mx-auto text-text-muted/40 mb-2" />
                <p class="font-bold text-xs text-text-secondary">Tidak ada riwayat pemakaian lab ditemukan</p>
                <p class="text-[11px] mt-0.5">Coba sesuaikan kata kunci pencarian atau filter Anda.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="p-3 sm:p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
        <span>Menampilkan {{ usageList.length }} dari {{ totalRecords }} riwayat</span>
        <div class="flex items-center gap-1">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1 || isLoading"
            class="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-surface"
          >
            <ChevronLeft :size="14" />
          </button>
          <span class="px-3 font-bold text-text-primary">Halaman {{ currentPage }} dari {{ totalPages }}</span>
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages || isLoading"
            class="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-surface"
          >
            <ChevronRight :size="14" />
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
