<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLaboranNavStore } from '@/stores/laboran-nav.store'
import {
  Megaphone,
  CheckCircle2,
  Sparkles,
  Clock,
  Search,
  RotateCcw,
  Eye,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  X,
  FileText,
  Calendar,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-vue-next'
import SummaryCard from '@/components/admin/SummaryCard.vue'
import { announcementService, type AnnouncementDto } from '@/services/announcement.service'

const router = useRouter()
const navStore = useLaboranNavStore()

onMounted(() => {
  navStore.setBreadcrumbs([
    { label: 'Portal Laboran', path: '/laboran' },
    { label: 'Pengumuman' }
  ])
  loadAnnouncements()
})

// State
const announcements = ref<AnnouncementDto[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const totalRecords = ref(0)

// Search & Filter
const searchQuery = ref('')
const selectedStatusFilter = ref<string>('ALL')
const selectedSortOption = ref<string>('NEWEST')

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(20)
const totalPages = ref(1)

// Toast
const showToast = ref(false)
const toastMessage = ref('')

const triggerToast = (msg: string) => {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 3500)
}

// Derived status from API data
const getAnnouncementStatus = (item: AnnouncementDto): 'Active' | 'Scheduled' | 'Expired' => {
  const now = new Date()
  const startAt = new Date(item.start_at)
  const endAt = new Date(item.end_at)
  if (!item.is_active) return 'Expired'
  if (now < startAt) return 'Scheduled'
  if (now > endAt) return 'Expired'
  return 'Active'
}

import { formatDate } from '@/utils/format.utils'

// Load announcements from API
const loadAnnouncements = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const result = await announcementService.getAnnouncements({
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: searchQuery.value.trim() || undefined,
    })
    announcements.value = result.data
    totalRecords.value = result.meta.total
    totalPages.value = result.meta.totalPages
  } catch (err: any) {
    errorMessage.value = err.message || 'Gagal memuat pengumuman'
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
    loadAnnouncements()
  }, 400)
})

const isRefreshing = ref(false)
const handleRefresh = async () => {
  isRefreshing.value = true
  await loadAnnouncements()
  isRefreshing.value = false
  triggerToast('Daftar pengumuman berhasil diperbarui.')
}

// Featured announcement
const featuredAnnouncement = computed(() => {
  return announcements.value.find(a => getAnnouncementStatus(a) === 'Active') || announcements.value[0]
})

// Metrics
const totalCount = computed(() => totalRecords.value)
const activeCount = computed(() => announcements.value.filter(a => getAnnouncementStatus(a) === 'Active').length)
const scheduledCount = computed(() => announcements.value.filter(a => getAnnouncementStatus(a) === 'Scheduled').length)
const expiredCount = computed(() => announcements.value.filter(a => getAnnouncementStatus(a) === 'Expired').length)

// Client-side status + sort filtering
const filteredAnnouncements = computed(() => {
  let list = announcements.value.filter(item => {
    if (selectedStatusFilter.value !== 'ALL') {
      const status = getAnnouncementStatus(item)
      if (status !== selectedStatusFilter.value) return false
    }
    return true
  })

  if (selectedSortOption.value === 'OLDEST') {
    list = [...list].reverse()
  }
  return list
})

const resetFilters = () => {
  searchQuery.value = ''
  selectedStatusFilter.value = 'ALL'
  selectedSortOption.value = 'NEWEST'
  currentPage.value = 1
  loadAnnouncements()
}

const handlePrevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    loadAnnouncements()
  }
}

const handleNextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    loadAnnouncements()
  }
}

const navigateToDetail = (id: string) => {
  router.push(`/laboran/announcements/${id}`)
}
</script>

<template>
  <div class="space-y-6 pb-12 select-none">
    
    <!-- 1. Page Header Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2.5 border-b border-gray-200/60">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
            Pengumuman
          </h1>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-100/80 border border-brand-200 text-dark-green text-[11px] font-bold">
            <Megaphone :size="12" />
            Papan Informasi Operasional
          </span>
        </div>
        <p class="text-xs sm:text-sm text-text-muted font-normal">
          Tetap terinformasi dengan berita dan pengumuman operasional laboratorium terkini.
        </p>
      </div>

      <div class="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
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
        title="Total Pengumuman"
        :value="totalCount"
        subtext="Seluruh pengumuman"
        :icon="Megaphone"
        icon-bg-class="bg-brand-100"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Aktif"
        :value="activeCount"
        subtext="Sedang dipublikasikan"
        :icon="CheckCircle2"
        icon-bg-class="bg-emerald-50"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Terjadwal"
        :value="scheduledCount"
        subtext="Pengumuman mendatang"
        :icon="Clock"
        icon-bg-class="bg-amber-50"
        icon-color-class="text-amber-800"
      />
      <SummaryCard
        title="Kedaluwarsa"
        :value="expiredCount"
        subtext="Pengumuman lampau"
        :icon="FileText"
        icon-bg-class="bg-gray-100"
        icon-color-class="text-gray-600"
      />
    </div>

    <!-- 3. Featured / Latest Announcement Hero Banner -->
    <div
      v-if="featuredAnnouncement && !isLoading"
      class="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-dark-green via-[#547a5c] to-brand-900 text-white shadow-md space-y-3"
    >
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 rounded-full bg-white/20 border border-white/30 text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
            <Sparkles :size="11" />
            Pengumuman Utama
          </span>
          <span class="px-2 py-0.5 rounded-full bg-emerald-400 text-dark-green text-[10px] font-extrabold flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-dark-green animate-pulse"></span>
            {{
              getAnnouncementStatus(featuredAnnouncement) === 'Active'
                ? 'AKTIF'
                : getAnnouncementStatus(featuredAnnouncement) === 'Scheduled'
                  ? 'TERJADWAL'
                  : 'KEDALUWARSA'
            }}
          </span>
        </div>

        <span class="text-[11px] font-mono text-brand-100 font-medium">
          Dipublikasikan: {{ formatDate(featuredAnnouncement.start_at) }}
        </span>
      </div>

      <div class="space-y-1">
        <h3 class="text-lg sm:text-xl font-extrabold tracking-tight text-white leading-snug">
          {{ featuredAnnouncement.title }}
        </h3>
        <p class="text-xs text-brand-100/90 leading-relaxed max-w-3xl line-clamp-2">
          {{ featuredAnnouncement.content }}
        </p>
      </div>

      <div class="pt-2 flex items-center justify-between gap-4 border-t border-white/10">
        <div class="flex items-center gap-2 text-[11px] text-brand-100">
          <Calendar :size="13" />
          <span>Periode Aktif: <strong>{{ formatDate(featuredAnnouncement.start_at) }} – {{ formatDate(featuredAnnouncement.end_at) }}</strong></span>
        </div>

        <button
          @click="navigateToDetail(featuredAnnouncement.id)"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-dark-green hover:bg-brand-50 text-xs font-black shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <span>Baca Pengumuman Lengkap</span>
          <ArrowRight :size="14" />
        </button>
      </div>
    </div>

    <!-- 4. Toolbar (Search, Filters & Sorting) -->
    <div class="bg-white p-4 rounded-2xl border border-gray-200/70 shadow-2xs space-y-3">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        <!-- Search Input -->
        <div class="relative flex-1 min-w-[240px]">
          <Search :size="15" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari pengumuman berdasarkan judul atau konten..."
            class="w-full pl-9 pr-4 py-2 bg-surface/60 border border-gray-200/80 rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-400 focus:bg-white transition-all"
          />
        </div>

        <!-- Dropdowns -->
        <div class="flex items-center gap-2 flex-wrap text-xs">
          <!-- Status Dropdown -->
          <div class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface border border-gray-200/80">
            <span class="text-text-muted font-bold uppercase text-[10px]">Status:</span>
            <select
              v-model="selectedStatusFilter"
              class="bg-transparent text-xs font-bold text-text-primary focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="Active">Aktif</option>
              <option value="Scheduled">Terjadwal</option>
              <option value="Expired">Kedaluwarsa</option>
            </select>
          </div>

          <!-- Sort Dropdown -->
          <div class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface border border-gray-200/80">
            <span class="text-text-muted font-bold uppercase text-[10px]">Urutan:</span>
            <select
              v-model="selectedSortOption"
              class="bg-transparent text-xs font-bold text-text-primary focus:outline-none cursor-pointer"
            >
              <option value="NEWEST">Terbaru Dahulu</option>
              <option value="OLDEST">Terlama Dahulu</option>
            </select>
          </div>

          <!-- Reset Filter Button -->
          <button
            v-if="searchQuery || selectedStatusFilter !== 'ALL' || selectedSortOption !== 'NEWEST'"
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
      <p class="text-xs text-text-muted font-medium">Memuat pengumuman...</p>
    </div>

    <!-- 5. Main Announcement List Layout -->
    <div v-else class="space-y-4">
      <div
        v-for="item in filteredAnnouncements"
        :key="item.id"
        class="bg-white rounded-2xl border border-gray-200/70 p-5 shadow-2xs space-y-3 hover:border-brand-300/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group select-none cursor-pointer"
        @click="navigateToDetail(item.id)"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div class="flex items-center gap-2">
            <h3 class="text-base font-extrabold text-text-primary group-hover:text-dark-green transition-colors tracking-tight leading-snug">
              {{ item.title }}
            </h3>
          </div>

          <span
            :class="[
              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border self-start sm:self-auto',
              getAnnouncementStatus(item) === 'Active'
                ? 'bg-emerald-50 text-dark-green border-emerald-200'
                : getAnnouncementStatus(item) === 'Scheduled'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
            ]"
          >
            <CheckCircle2 v-if="getAnnouncementStatus(item) === 'Active'" :size="11" />
            <Clock v-else-if="getAnnouncementStatus(item) === 'Scheduled'" :size="11" />
            <span>{{
              getAnnouncementStatus(item) === 'Active'
                ? 'Aktif'
                : getAnnouncementStatus(item) === 'Scheduled'
                  ? 'Terjadwal'
                  : 'Kedaluwarsa'
            }}</span>
          </span>
        </div>

        <p class="text-xs text-text-secondary leading-relaxed line-clamp-2 font-normal">
          {{ item.content }}
        </p>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
          <div class="flex items-center gap-3 text-[11px] text-text-muted font-medium">
            <span>Dipublikasikan: <strong>{{ formatDate(item.start_at) }}</strong></span>
            <span>•</span>
            <span>Aktif hingga: <strong>{{ formatDate(item.end_at) }}</strong></span>
          </div>

          <button
            @click.stop="navigateToDetail(item.id)"
            class="inline-flex items-center gap-1 text-xs font-bold text-dark-green hover:underline cursor-pointer self-end sm:self-auto"
          >
            <span>Baca Selengkapnya</span>
            <ChevronRight :size="14" />
          </button>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="flex items-center justify-between pt-2"
      >
        <span class="text-[11px] text-text-muted font-medium">
          Halaman {{ currentPage }} dari {{ totalPages }} · Total {{ totalRecords }} data
        </span>
        <div class="flex items-center gap-2">
          <button
            @click="handlePrevPage"
            :disabled="currentPage <= 1"
            class="p-1.5 rounded-lg border border-gray-200/80 bg-white hover:bg-surface disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft :size="14" />
          </button>
          <button
            @click="handleNextPage"
            :disabled="currentPage >= totalPages"
            class="p-1.5 rounded-lg border border-gray-200/80 bg-white hover:bg-surface disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight :size="14" />
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredAnnouncements.length === 0 && !isLoading" class="py-12 text-center text-text-muted bg-white rounded-2xl border border-gray-200/70 p-8 space-y-2">
        <FileText :size="36" class="mx-auto text-text-muted/40 mb-2" />
        <h4 class="text-xs font-bold text-text-secondary">Pengumuman tidak ditemukan</h4>
        <p class="text-[11px] text-text-muted max-w-sm mx-auto">
          Saat ini tidak ada pengumuman yang sesuai dengan kriteria pencarian atau filter yang dipilih.
        </p>
      </div>
    </div>

  </div>
</template>
