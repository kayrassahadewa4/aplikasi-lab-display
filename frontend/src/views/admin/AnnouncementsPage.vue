<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import {
  Megaphone,
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
  Monitor,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  Loader2
} from 'lucide-vue-next'
import { announcementService, type AnnouncementDto } from '@/services/announcement.service'
import type { AnnouncementData } from '@/mocks/admin-announcements.mock'
import SummaryCard from '@/components/admin/SummaryCard.vue'
import { formatDate } from '@/utils/format.utils'

const router = useRouter()
const navStore = useAdminNavStore()

// State
const announcements = ref<AnnouncementData[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const searchQuery = ref('')
const selectedStatusFilter = ref<string>('All')
const sortBy = ref<string>('date')

// Pagination State
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Delete Dialog State
const showDeleteModal = ref(false)
const selectedAncForDelete = ref<AnnouncementData | null>(null)
const isDeleting = ref(false)

const mapAnnouncementToUi = (dto: AnnouncementDto): AnnouncementData => {
  const now = new Date()
  const start = new Date(dto.start_at)
  const end = new Date(dto.end_at)

  let status: 'Active' | 'Scheduled' | 'Expired' = 'Active'
  if (!dto.is_active || now > end) {
    status = 'Expired'
  } else if (now < start) {
    status = 'Scheduled'
  } else {
    status = 'Active'
  }

  const formatIsoDate = (iso: string) => {
    return formatDate(iso)
  }

  return {
    id: dto.id,
    title: dto.title,
    content: dto.content,
    startDate: dto.start_at ? dto.start_at.slice(0, 10) : '',
    endDate: dto.end_at ? dto.end_at.slice(0, 10) : '',
    formattedStartDate: formatDate(dto.start_at),
    formattedEndDate: formatDate(dto.end_at),
    status,
    createdAt: formatDate(dto.created_at),
    updatedAt: formatDate(dto.updated_at),
  }
}

const loadAnnouncements = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const res = await announcementService.getAnnouncements({
      page: 1,
      limit: 50,
      search: searchQuery.value || undefined,
    })
    announcements.value = (res.data || []).map(mapAnnouncementToUi)
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || error.message || 'Gagal memuat data pengumuman'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  navStore.setBreadcrumbs([
    { label: 'Dashboard', path: '/admin' },
    { label: 'Pengumuman' },
  ])
  loadAnnouncements()
})

// Summary Metrics
const totalCount = computed(() => announcements.value.length)
const activeCount = computed(() => announcements.value.filter(a => a.status === 'Active').length)
const scheduledCount = computed(() => announcements.value.filter(a => a.status === 'Scheduled').length)
const expiredCount = computed(() => announcements.value.filter(a => a.status === 'Expired').length)

// Filtered Announcements List
const filteredAnnouncements = computed(() => {
  let list = announcements.value.filter(anc => {
    const matchesSearch =
      anc.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      anc.content.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesStatus =
      selectedStatusFilter.value === 'All' || anc.status === selectedStatusFilter.value

    return matchesSearch && matchesStatus
  })

  // Sort
  if (sortBy.value === 'date') {
    list.sort((a, b) => b.startDate.localeCompare(a.startDate))
  }

  return list
})

// Paginated Announcements List
const paginatedAnnouncements = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredAnnouncements.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredAnnouncements.value.length / itemsPerPage.value) || 1
})

// Page Navigation Actions
const navigateToCreate = () => {
  router.push('/admin/announcements/create')
}

const navigateToDetail = (anc: AnnouncementData) => {
  router.push(`/admin/announcements/${anc.id}`)
}

const navigateToEdit = (anc: AnnouncementData) => {
  router.push(`/admin/announcements/${anc.id}/edit`)
}

// Delete Confirmation
const openDeleteModal = (anc: AnnouncementData) => {
  selectedAncForDelete.value = anc
  showDeleteModal.value = true
}

const confirmDeleteAnnouncement = async () => {
  if (!selectedAncForDelete.value) return
  isDeleting.value = true
  try {
    await announcementService.deleteAnnouncement(selectedAncForDelete.value.id)
    announcements.value = announcements.value.filter(a => a.id !== selectedAncForDelete.value?.id)
    showDeleteModal.value = false
    selectedAncForDelete.value = null
  } catch (error: any) {
    alert(error.response?.data?.message || error.message || 'Gagal menghapus pengumuman')
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
            Pengumuman
          </h1>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-100/80 border border-brand-200 text-dark-green text-[11px] font-bold">
            <Megaphone :size="12" class="text-primary-dark" />
            Informasi Layar Display
          </span>
        </div>
        <p class="text-xs sm:text-sm text-text-muted font-normal">
          Kelola informasi dan pengumuman yang ditayangkan pada layar monitor display laboratorium.
        </p>
      </div>

      <!-- Primary Action CTA Button Navigating to Dedicated Create Page -->
      <div class="self-start sm:self-auto shrink-0">
        <button
          @click="navigateToCreate"
          class="inline-flex items-center gap-2 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs sm:text-xs font-bold shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer"
        >
          <Plus :size="15" stroke-width="2.5" />
          <span>Buat Pengumuman Baru</span>
        </button>
      </div>
    </div>

    <!-- 2. Metric Summary Widgets -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        title="Total Pengumuman"
        :value="totalCount"
        :icon="Megaphone"
        icon-bg-class="bg-brand-100"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Pengumuman Aktif"
        :value="activeCount"
        :icon="CheckCircle2"
        icon-bg-class="bg-emerald-50"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Terjadwal"
        :value="scheduledCount"
        :icon="Clock"
        icon-bg-class="bg-sky-50"
        icon-color-class="text-sky-700"
      />
      <SummaryCard
        title="Kedaluwarsa"
        :value="expiredCount"
        :icon="Calendar"
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
          placeholder="Cari pengumuman berdasarkan judul atau teks..."
          class="w-full pl-9 pr-3 py-2 bg-surface border border-gray-200 rounded-xl text-text-primary focus:outline-none focus:border-brand-400 focus:bg-white"
        />
      </div>

      <div class="flex items-center gap-2">
        <select
          v-model="selectedStatusFilter"
          class="px-3 py-2 bg-surface border border-gray-200 rounded-xl font-bold text-text-primary focus:outline-none focus:border-brand-400"
        >
          <option value="All">Semua Status</option>
          <option value="Active">Aktif</option>
          <option value="Scheduled">Terjadwal</option>
          <option value="Expired">Kedaluwarsa</option>
        </select>
      </div>
    </div>

    <!-- 4. Data Table -->
    <div class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-text-primary">
          <thead class="bg-surface/60 border-b border-gray-100 text-text-muted font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th class="py-3.5 px-4">Judul Pengumuman</th>
              <th class="py-3.5 px-4">Periode Tayang</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-100">
            <tr v-if="isLoading">
              <td colspan="4" class="py-12 text-center text-text-muted">
                <Loader2 :size="24" class="animate-spin text-dark-green mx-auto mb-2" />
                <p class="text-xs">Memuat data pengumuman...</p>
              </td>
            </tr>
            <tr v-else-if="paginatedAnnouncements.length === 0">
              <td colspan="4" class="py-12 text-center text-text-muted">
                <Megaphone :size="24" class="text-gray-300 mx-auto mb-2" />
                <p class="text-xs font-bold">Tidak ada pengumuman ditemukan</p>
                <p class="text-[11px] text-text-muted mt-0.5">Klik "Buat Pengumuman Baru" untuk mempublikasikan pengumuman pertama Anda.</p>
              </td>
            </tr>
            <tr
              v-else
              v-for="anc in paginatedAnnouncements"
              :key="anc.id"
              @click="navigateToDetail(anc)"
              class="hover:bg-brand-50/20 transition-colors cursor-pointer group"
            >
              <!-- Title -->
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-brand-100/80 text-dark-green flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    <Megaphone :size="16" />
                  </div>
                  <div>
                    <p class="font-bold text-text-primary group-hover:text-dark-green transition-colors">{{ anc.title }}</p>
                    <p class="text-[11px] text-text-muted font-normal line-clamp-1 max-w-md">{{ anc.content }}</p>
                  </div>
                </div>
              </td>

              <!-- Dates -->
              <td class="py-3.5 px-4 font-medium text-text-secondary">
                {{ anc.formattedStartDate }} — {{ anc.formattedEndDate }}
              </td>

              <!-- Status -->
              <td class="py-3.5 px-4">
                <span :class="['px-2.5 py-0.5 rounded-full text-[10px] font-bold border', anc.status === 'Active' ? 'bg-emerald-50 text-dark-green border-brand-200' : anc.status === 'Scheduled' ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-gray-100 text-gray-600 border-gray-200']">
                  {{ anc.status === 'Active' ? 'Aktif' : anc.status === 'Scheduled' ? 'Terjadwal' : 'Kedaluwarsa' }}
                </span>
              </td>

              <!-- Actions -->
              <td class="py-3.5 px-4 text-right" @click.stop>
                <div class="flex items-center justify-end gap-1">
                  <button
                    @click="navigateToDetail(anc)"
                    class="p-1.5 rounded-lg text-text-muted hover:text-dark-green hover:bg-brand-50 transition-colors"
                    title="Lihat Detail Pengumuman"
                  >
                    <Eye :size="15" />
                  </button>

                  <button
                    @click="navigateToEdit(anc)"
                    class="p-1.5 rounded-lg text-text-muted hover:text-dark-green hover:bg-brand-50 transition-colors"
                    title="Edit Pengumuman"
                  >
                    <Edit3 :size="15" />
                  </button>

                  <button
                    @click="openDeleteModal(anc)"
                    class="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Hapus Pengumuman"
                  >
                    <Trash2 :size="15" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="p-3 sm:p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
        <span>Menampilkan {{ paginatedAnnouncements.length }} dari {{ filteredAnnouncements.length }} pengumuman</span>
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
          <h3 class="text-sm font-bold text-text-primary">Hapus Pengumuman?</h3>
        </div>

        <p class="text-text-muted leading-relaxed">
          Apakah Anda yakin ingin menghapus <strong class="text-text-primary">{{ selectedAncForDelete?.title }}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            @click="showDeleteModal = false"
            class="px-4 py-2 rounded-full border border-gray-200 text-text-primary font-semibold hover:bg-surface cursor-pointer"
          >
            Batal
          </button>
          <button
            @click="confirmDeleteAnnouncement"
            class="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
          >
            Ya, Hapus Pengumuman
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
