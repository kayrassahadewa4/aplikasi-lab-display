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
  CalendarDays,
  List,
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-vue-next'
import type { AcademicPeriodData } from '@/mocks/admin-academic-calendar.mock'
import { academicCalendarService } from '@/services/academic-calendar.service'
import SummaryCard from '@/components/admin/SummaryCard.vue'

const router = useRouter()
const navStore = useAdminNavStore()

onMounted(() => {
  navStore.setBreadcrumbs([
    { label: 'Dashboard', path: '/admin' },
    { label: 'Kalender Akademik' },
  ])
  loadCalendars()
})

// View Switcher State ('list' | 'timeline')
const activeView = ref<'list' | 'timeline'>('list')

// Reactive State
const periods = ref<AcademicPeriodData[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const selectedYearFilter = ref<string>('All')
const selectedStatusFilter = ref<string>('All')
const sortBy = ref<string>('year')

// Pagination State
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalSystemCalendars = ref(0)

// Delete Dialog State
const showDeleteModal = ref(false)
const selectedPeriodForDelete = ref<AcademicPeriodData | null>(null)

// Load calendars from API
const loadCalendars = async () => {
  isLoading.value = true
  error.value = null

  try {
    const { calendars, meta } = await academicCalendarService.getAcademicCalendars({
      page: 1,
      limit: 100, // Backend maximum limit
      search: searchQuery.value || undefined,
    })

    periods.value = calendars
    totalSystemCalendars.value = meta.total
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Gagal memuat kalender akademik'
    console.error('Failed to load academic calendars:', err)
  } finally {
    isLoading.value = false
  }
}

// Reload on search query change
watch(searchQuery, () => {
  loadCalendars()
})

// Summary Cards Metrics
const totalPeriodsCount = computed(() => totalSystemCalendars.value)
const activePeriodName = computed(() => {
  const active = periods.value.find(p => p.status === 'Active')
  return active ? `${active.academicYear} ${active.semester}` : 'Tidak Ada Periode Aktif'
})
const upcomingCount = computed(() => periods.value.filter(p => p.status === 'Upcoming').length)

// Filtered & Sorted Periods List
const filteredPeriods = computed(() => {
  let list = periods.value.filter(period => {
    const matchesSearch =
      period.academicYear.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      period.semester.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesYear =
      selectedYearFilter.value === 'All' || period.academicYear === selectedYearFilter.value

    const matchesStatus =
      selectedStatusFilter.value === 'All' || period.status === selectedStatusFilter.value

    return matchesSearch && matchesYear && matchesStatus
  })

  // Sort
  if (sortBy.value === 'year') {
    list.sort((a, b) => b.academicYear.localeCompare(a.academicYear))
  }

  return list
})

// Paginated Periods List
const paginatedPeriods = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredPeriods.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredPeriods.value.length / itemsPerPage.value) || 1
})

// Page Navigation Actions
const navigateToCreate = () => {
  router.push('/admin/academic-calendars/create')
}

const navigateToDetail = (period: AcademicPeriodData) => {
  router.push(`/admin/academic-calendars/${period.id}`)
}

const navigateToEdit = (period: AcademicPeriodData) => {
  router.push(`/admin/academic-calendars/${period.id}/edit`)
}

// Delete Confirmation
const openDeleteModal = (period: AcademicPeriodData) => {
  selectedPeriodForDelete.value = period
  showDeleteModal.value = true
}

const confirmDeletePeriod = async () => {
  if (!selectedPeriodForDelete.value) return

  isLoading.value = true
  error.value = null

  try {
    await academicCalendarService.deleteAcademicCalendar(selectedPeriodForDelete.value.id)
    showDeleteModal.value = false
    selectedPeriodForDelete.value = null
    await loadCalendars() // Reload list after delete
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Gagal menghapus kalender akademik'
    console.error('Failed to delete academic calendar:', err)
    showDeleteModal.value = false
  } finally {
    isLoading.value = false
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
            Kalender Akademik
          </h1>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-100/80 border border-brand-200 text-dark-green text-[11px] font-bold">
            <Calendar :size="12" class="text-primary-dark" />
            Periode Semester
          </span>
        </div>
        <p class="text-xs sm:text-sm text-text-muted font-normal">
          Kelola rentang semester akademik, periode aktif, dan siklus jadwal laboratorium.
        </p>
      </div>

      <!-- Primary Action CTA Button Navigating to Dedicated Create Page -->
      <div class="self-start sm:self-auto shrink-0">
        <button
          @click="navigateToCreate"
          class="inline-flex items-center gap-2 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs sm:text-xs font-bold shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer"
        >
          <Plus :size="15" stroke-width="2.5" />
          <span>Tambah Periode Akademik</span>
        </button>
      </div>
    </div>

    <!-- 2. Metric Summary Widgets -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        title="Total Periode"
        :value="totalPeriodsCount"
        :icon="Calendar"
        icon-bg-class="bg-brand-100"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Periode Aktif Saat Ini"
        :value="activePeriodName"
        :icon="CheckCircle2"
        icon-bg-class="bg-emerald-50"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Periode Mendatang"
        :value="upcomingCount"
        :icon="Clock"
        icon-bg-class="bg-sky-50"
        icon-color-class="text-sky-700"
      />
      <SummaryCard
        title="Periode Selesai"
        value="3"
        :icon="CalendarDays"
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
        <p class="font-bold text-red-800">Gagal Memuat Kalender Akademik</p>
        <p class="text-red-700 mt-1">{{ error }}</p>
      </div>
      <button
        @click="loadCalendars"
        class="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-semibold transition-colors cursor-pointer"
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
          placeholder="Cari periode berdasarkan tahun akademik atau semester..."
          class="w-full pl-9 pr-3 py-2 bg-surface border border-gray-200 rounded-xl text-text-primary focus:outline-none focus:border-brand-400 focus:bg-white"
        />
      </div>

      <div class="flex items-center gap-2">
        <select
          v-model="selectedStatusFilter"
          class="px-3 py-2 bg-surface border border-gray-200 rounded-xl font-bold text-text-primary focus:outline-none focus:border-brand-400 cursor-pointer"
        >
          <option value="All">Semua Status</option>
          <option value="Active">Aktif</option>
          <option value="Upcoming">Mendatang</option>
          <option value="Completed">Selesai</option>
        </select>
      </div>
    </div>

    <!-- 4. Data Table -->
    <div class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs overflow-hidden">
      <!-- Loading State -->
      <div v-if="isLoading" class="py-20 text-center">
        <div class="inline-flex items-center gap-3 text-text-muted">
          <div class="w-5 h-5 border-2 border-brand-300 border-t-dark-green rounded-full animate-spin"></div>
          <span class="text-xs font-medium">Memuat kalender akademik...</span>
        </div>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs text-text-primary">
          <thead class="bg-surface/60 border-b border-gray-100 text-text-muted font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th class="py-3.5 px-4">Periode Akademik</th>
              <th class="py-3.5 px-4">Semester</th>
              <th class="py-3.5 px-4">Tanggal Mulai</th>
              <th class="py-3.5 px-4">Tanggal Selesai</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="period in paginatedPeriods"
              :key="period.id"
              @click="navigateToDetail(period)"
              class="hover:bg-brand-50/20 transition-colors cursor-pointer group"
            >
              <!-- Year -->
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-brand-100/80 text-dark-green flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    <Calendar :size="16" />
                  </div>
                  <div>
                    <p class="font-bold text-text-primary group-hover:text-dark-green transition-colors">{{ period.academicYear }}</p>
                    <p class="text-[11px] text-text-muted font-normal">durasi {{ period.duration }}</p>
                  </div>
                </div>
              </td>

              <!-- Semester -->
              <td class="py-3.5 px-4 font-semibold text-text-primary">
                {{ period.semester }}
              </td>

              <!-- Start Date -->
              <td class="py-3.5 px-4 font-medium text-text-secondary">
                {{ period.formattedStartDate }}
              </td>

              <!-- End Date -->
              <td class="py-3.5 px-4 font-medium text-text-secondary">
                {{ period.formattedEndDate }}
              </td>

              <!-- Status -->
              <td class="py-3.5 px-4">
                <span :class="['px-2.5 py-0.5 rounded-full text-[10px] font-bold border', period.status === 'Active' ? 'bg-emerald-50 text-dark-green border-brand-200' : period.status === 'Upcoming' ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-gray-100 text-gray-600 border-gray-200']">
                  {{ period.status === 'Active' ? 'Aktif' : period.status === 'Upcoming' ? 'Mendatang' : 'Selesai' }}
                </span>
              </td>

              <!-- Actions -->
              <td class="py-3.5 px-4 text-right" @click.stop>
                <div class="flex items-center justify-end gap-1">
                  <button
                    @click="navigateToDetail(period)"
                    class="p-1.5 rounded-lg text-text-muted hover:text-dark-green hover:bg-brand-50 transition-colors cursor-pointer"
                    title="Lihat Detail Periode"
                  >
                    <Eye :size="15" />
                  </button>

                  <button
                    @click="navigateToEdit(period)"
                    class="p-1.5 rounded-lg text-text-muted hover:text-dark-green hover:bg-brand-50 transition-colors cursor-pointer"
                    title="Ubah Periode"
                  >
                    <Edit3 :size="15" />
                  </button>

                  <button
                    @click="openDeleteModal(period)"
                    class="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Hapus Periode"
                  >
                    <Trash2 :size="15" />
                  </button>
                </div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="paginatedPeriods.length === 0">
              <td colspan="6" class="py-12 text-center text-text-muted">
                <Calendar :size="36" class="mx-auto text-text-muted/40 mb-2" />
                <p class="font-bold text-xs text-text-secondary">Periode akademik tidak ditemukan</p>
                <p class="text-[11px] mt-0.5">Coba sesuaikan pencarian atau filter status Anda.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="p-3 sm:p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
        <span>Menampilkan {{ paginatedPeriods.length }} dari {{ filteredPeriods.length }} periode</span>
        <div class="flex items-center gap-1">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-surface cursor-pointer"
          >
            <ChevronLeft :size="14" />
          </button>
          <span class="px-3 font-bold text-text-primary">Halaman {{ currentPage }} dari {{ totalPages }}</span>
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-surface cursor-pointer"
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
          <h3 class="text-sm font-bold text-text-primary">Hapus Periode Akademik?</h3>
        </div>

        <p class="text-text-muted leading-relaxed">
          Apakah Anda yakin ingin menghapus <strong class="text-text-primary">{{ selectedPeriodForDelete?.academicYear }} {{ selectedPeriodForDelete?.semester }}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            @click="showDeleteModal = false"
            class="px-4 py-2 rounded-full border border-gray-200 text-text-primary font-semibold hover:bg-surface cursor-pointer"
          >
            Batal
          </button>
          <button
            @click="confirmDeletePeriod"
            class="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
          >
            Hapus Periode
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
