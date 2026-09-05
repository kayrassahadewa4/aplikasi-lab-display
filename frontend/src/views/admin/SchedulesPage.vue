<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import {
  Calendar,
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
  List,
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  UserCheck,
  Building2,
  Sparkles,
  Info
} from 'lucide-vue-next'
import type { ScheduleData } from '@/mocks/admin-schedules.mock'
import { scheduleService } from '@/services/schedule.service'
import SummaryCard from '@/components/admin/SummaryCard.vue'

const router = useRouter()
const navStore = useAdminNavStore()

onMounted(() => {
  navStore.setBreadcrumbs([
    { label: 'Dashboard', path: '/admin' },
    { label: 'Jadwal Penggunaan' },
  ])
  loadSchedules()
})

// Reactive State
const schedules = ref<ScheduleData[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const selectedLabFilter = ref<string>('All')
const selectedStatusFilter = ref<string>('All')
const selectedDayFilter = ref<string>('All')

// Pagination State
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalCount = ref(0)

// Delete Dialog State
const showDeleteModal = ref(false)
const selectedSchForDelete = ref<ScheduleData | null>(null)
const isDeleting = ref(false)

// Load schedules from API
const loadSchedules = async () => {
  isLoading.value = true
  error.value = null

  try {
    const { schedules: schedulesData, meta } = await scheduleService.getSchedules({
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: searchQuery.value || undefined,
      laboratory_id: selectedLabFilter.value !== 'All' ? selectedLabFilter.value : undefined,
      status: selectedStatusFilter.value !== 'All' ? (selectedStatusFilter.value as ScheduleData['status']) : undefined,
    })

    schedules.value = schedulesData
    totalCount.value = meta.total
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Gagal memuat data jadwal'
    console.error('Failed to load schedules:', err)
  } finally {
    isLoading.value = false
  }
}

// Reload on pagination, search, or filter change
watch([currentPage, searchQuery, selectedLabFilter, selectedStatusFilter], () => {
  loadSchedules()
})

// Summary Metrics
const activeCount = computed(() => schedules.value.filter(s => s.status === 'ACTIVE').length)
const scheduledCount = computed(() => schedules.value.filter(s => s.status === 'SCHEDULED').length)

// Total Pages
const totalPages = computed(() => {
  return Math.ceil(totalCount.value / itemsPerPage.value) || 1
})

// Page Navigation Actions
const navigateToCreate = () => {
  router.push('/admin/schedules/create')
}

const navigateToDetail = (sch: ScheduleData) => {
  router.push(`/admin/schedules/${sch.id}`)
}

const navigateToEdit = (sch: ScheduleData) => {
  router.push(`/admin/schedules/${sch.id}/edit`)
}

// Delete Action
const openDeleteModal = (sch: ScheduleData) => {
  selectedSchForDelete.value = sch
  showDeleteModal.value = true
}

const confirmDeleteSchedule = async () => {
  if (!selectedSchForDelete.value || isDeleting.value) return

  isDeleting.value = true

  try {
    await scheduleService.deleteSchedule(selectedSchForDelete.value.id)
    showDeleteModal.value = false
    selectedSchForDelete.value = null
    // Reload schedules after successful deletion
    await loadSchedules()
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Gagal menghapus jadwal'
    console.error('Failed to delete schedule:', err)
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="space-y-6 pb-8 select-none">

    <!-- 1. Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2.5 border-b border-gray-200/60">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
            Jadwal Penggunaan
          </h1>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-100/80 border border-brand-200 text-dark-green text-[11px] font-bold">
            <Calendar :size="12" class="text-primary-dark" />
            Jadwal Rutin Mingguan
          </span>
        </div>
        <p class="text-xs sm:text-sm text-text-muted font-normal">
          Kelola jadwal perkuliahan mingguan dan alokasi ruangan laboratorium.
        </p>
      </div>

      <!-- Primary Action CTA Button Navigating to Dedicated Create Page -->
      <div class="self-start sm:self-auto shrink-0">
        <button
          @click="navigateToCreate"
          class="inline-flex items-center gap-2 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs sm:text-xs font-bold shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer"
        >
          <Plus :size="15" stroke-width="2.5" />
          <span>Tambah Jadwal Baru</span>
        </button>
      </div>
    </div>

    <!-- 2. Metric Summary Widgets -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        title="Total Jadwal"
        :value="totalCount"
        :icon="Calendar"
        icon-bg-class="bg-brand-100"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Sedang Berjalan"
        :value="activeCount"
        :icon="Activity"
        icon-bg-class="bg-emerald-50"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Terjadwal Mingguan"
        :value="scheduledCount"
        :icon="Clock"
        icon-bg-class="bg-sky-50"
        icon-color-class="text-sky-700"
      />
      <SummaryCard
        title="Ruangan Terhubung"
        value="Beragam"
        :icon="Building2"
        icon-bg-class="bg-gray-100"
        icon-color-class="text-gray-600"
      />
    </div>

    <!-- Error Alert -->
    <div
      v-if="error"
      class="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-xs"
    >
      <AlertTriangle :size="18" class="text-red-600 shrink-0 mt-0.5" />
      <div class="flex-1">
        <p class="font-bold text-red-800">Gagal Memuat Data Jadwal</p>
        <p class="text-red-700 mt-1">{{ error }}</p>
      </div>
      <button
        @click="loadSchedules"
        class="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-semibold transition-colors"
      >
        Coba Lagi
      </button>
    </div>

    <!-- 3. Toolbar (Search / Filter) -->
    <div class="bg-white p-3 sm:p-4 rounded-2xl border border-gray-200/70 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between text-xs">
      <div class="relative flex-1">
        <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari jadwal berdasarkan mata kuliah, dosen, atau kelas..."
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
          <option value="SCHEDULED">Terjadwal</option>
          <option value="ACTIVE">Sedang Berjalan</option>
          <option value="FINISHED">Selesai</option>
          <option value="CANCELLED">Dibatalkan</option>
        </select>
      </div>
    </div>

    <!-- 4. Data Table -->
    <div class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs overflow-hidden">
      <!-- Loading State -->
      <div v-if="isLoading" class="p-20 text-center">
        <div class="inline-flex items-center gap-3 text-text-muted">
          <div class="w-5 h-5 border-2 border-brand-300 border-t-dark-green rounded-full animate-spin"></div>
          <span class="text-xs font-medium">Memuat data jadwal...</span>
        </div>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs text-text-primary">
          <thead class="bg-surface/60 border-b border-gray-100 text-text-muted font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th class="py-3.5 px-4">Mata Kuliah & Dosen</th>
              <th class="py-3.5 px-4">Ruang Lab</th>
              <th class="py-3.5 px-4">Hari & Jam</th>
              <th class="py-3.5 px-4">Kelas</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="sch in schedules"
              :key="sch.id"
              @click="navigateToDetail(sch)"
              class="hover:bg-brand-50/20 transition-colors cursor-pointer group"
            >
              <!-- Course & Instructor -->
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-brand-100/80 text-dark-green flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    <BookOpen :size="16" />
                  </div>
                  <div>
                    <p class="font-bold text-text-primary group-hover:text-dark-green transition-colors">{{ sch.courseName }}</p>
                    <p class="text-[11px] text-text-muted font-normal">{{ sch.lecturerName }}</p>
                  </div>
                </div>
              </td>

              <!-- Lab Code -->
              <td class="py-3.5 px-4 font-mono font-bold text-dark-green">
                {{ sch.laboratoryCode }}
              </td>

              <!-- Day & Time -->
              <td class="py-3.5 px-4 font-medium text-text-secondary">
                {{ sch.dayName }}, {{ sch.startTime }} - {{ sch.endTime }}
              </td>

              <!-- Class -->
              <td class="py-3.5 px-4 font-semibold text-text-primary">
                {{ sch.className }}
              </td>

              <!-- Status -->
              <td class="py-3.5 px-4">
                <span :class="['px-2.5 py-0.5 rounded-full text-[10px] font-bold border', sch.status === 'ACTIVE' ? 'bg-emerald-50 text-dark-green border-brand-200' : sch.status === 'SCHEDULED' ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-gray-100 text-gray-600 border-gray-200']">
                  {{ sch.status === 'ACTIVE' ? 'Sedang Berjalan' : sch.status === 'SCHEDULED' ? 'Terjadwal' : sch.status === 'FINISHED' ? 'Selesai' : 'Dibatalkan' }}
                </span>
              </td>

              <!-- Actions -->
              <td class="py-3.5 px-4 text-right" @click.stop>
                <div class="flex items-center justify-end gap-1">
                  <button
                    @click="navigateToDetail(sch)"
                    class="p-1.5 rounded-lg text-text-muted hover:text-dark-green hover:bg-brand-50 transition-colors"
                    title="Lihat Detail Jadwal"
                  >
                    <Eye :size="15" />
                  </button>

                  <button
                    @click="navigateToEdit(sch)"
                    class="p-1.5 rounded-lg text-text-muted hover:text-dark-green hover:bg-brand-50 transition-colors"
                    title="Edit Jadwal"
                  >
                    <Edit3 :size="15" />
                  </button>

                  <button
                    @click="openDeleteModal(sch)"
                    class="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Hapus Jadwal"
                  >
                    <Trash2 :size="15" />
                  </button>
                </div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="schedules.length === 0 && !isLoading">
              <td colspan="6" class="py-12 text-center text-text-muted">
                <Calendar :size="36" class="mx-auto text-text-muted/40 mb-2" />
                <p class="font-bold text-xs text-text-secondary">Tidak ada jadwal ditemukan</p>
                <p class="text-[11px] mt-0.5">
                  {{ searchQuery ? 'Coba sesuaikan kriteria pencarian Anda.' : 'Buat jadwal pertama Anda untuk memulai.' }}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="p-3 sm:p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
        <span>Menampilkan {{ schedules.length }} dari {{ totalCount }} jadwal (Halaman {{ currentPage }} dari {{ totalPages }})</span>
        <div class="flex items-center gap-1">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1 || isLoading"
            class="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-surface disabled:cursor-not-allowed"
          >
            <ChevronLeft :size="14" />
          </button>
          <span class="px-3 font-bold text-text-primary">Halaman {{ currentPage }} dari {{ totalPages }}</span>
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages || isLoading"
            class="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-surface disabled:cursor-not-allowed"
          >
            <ChevronRight :size="14" />
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal Dialog -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xl w-full max-w-sm overflow-hidden p-5 space-y-4 text-xs animate-in zoom-in-95 duration-150">
        <div class="flex items-center gap-3 text-red-600">
          <div class="p-2 bg-red-50 rounded-xl">
            <Trash2 :size="20" />
          </div>
          <h3 class="text-sm font-bold text-text-primary">Hapus Jadwal Laboratorium?</h3>
        </div>

        <p class="text-text-muted leading-relaxed">
          Apakah Anda yakin ingin menghapus jadwal <strong class="text-text-primary">{{ selectedSchForDelete?.courseName }}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            @click="showDeleteModal = false"
            :disabled="isDeleting"
            class="px-4 py-2 rounded-full border border-gray-200 text-text-primary font-semibold hover:bg-surface cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button
            @click="confirmDeleteSchedule"
            :disabled="isDeleting"
            class="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <div v-if="isDeleting" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>{{ isDeleting ? 'Menghapus...' : 'Ya, Hapus Jadwal' }}</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
