<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import {
  Wrench,
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
  FlaskConical,
  Activity,
  AlertTriangle,
  Calendar,
  Monitor,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'
import type { FacilityData } from '@/mocks/admin-facilities.mock'
import { facilityService } from '@/services/facility.service'
import SummaryCard from '@/components/admin/SummaryCard.vue'

const router = useRouter()
const navStore = useAdminNavStore()

onMounted(() => {
  navStore.setBreadcrumbs([
    { label: 'Dashboard', path: '/admin' },
    { label: 'Fasilitas Lab' },
  ])
  loadFacilities()
})

// Reactive State
const facilities = ref<FacilityData[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const selectedLabFilter = ref<string>('All')
const selectedStatusFilter = ref<string>('All')
const sortBy = ref<string>('name')

// Pagination State
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalSystemFacilities = ref(0)

// Delete Dialog State
const showDeleteModal = ref(false)
const selectedFacForDelete = ref<FacilityData | null>(null)

// Load facilities from API
const loadFacilities = async () => {
  isLoading.value = true
  error.value = null

  try {
    const { facilities: facs, meta } = await facilityService.getFacilities({
      page: 1,
      limit: 100, // Backend maximum limit
      search: searchQuery.value || undefined,
    })

    facilities.value = facs
    totalSystemFacilities.value = meta.total
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Gagal memuat data fasilitas'
    console.error('Failed to load facilities:', err)
  } finally {
    isLoading.value = false
  }
}

// Reload on search query change
watch(searchQuery, () => {
  loadFacilities()
})

// Summary Cards Metrics
const totalFacilitiesCount = computed(() => totalSystemFacilities.value)
const availableCount = computed(() => facilities.value.filter(f => f.status === 'Available').length)
const maintenanceCount = computed(() => facilities.value.filter(f => f.status === 'Maintenance').length)
const totalLabsCount = computed(() => new Set(facilities.value.map(f => f.labCode)).size)

// Filtered & Sorted Facilities List
const filteredFacilities = computed(() => {
  let list = facilities.value.filter(fac => {
    const matchesSearch =
      fac.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      fac.code.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      fac.labCode.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesLab =
      selectedLabFilter.value === 'All' || fac.labCode === selectedLabFilter.value

    const matchesStatus =
      selectedStatusFilter.value === 'All' || fac.status === selectedStatusFilter.value

    return matchesSearch && matchesLab && matchesStatus
  })

  return list.sort((a, b) => {
    if (sortBy.value === 'name') return a.name.localeCompare(b.name)
    if (sortBy.value === 'code') return a.code.localeCompare(b.code)
    if (sortBy.value === 'quantity') return b.quantity - a.quantity
    return 0
  })
})

// Paginated Facilities Slice
const totalPages = computed(() => Math.ceil(filteredFacilities.value.length / itemsPerPage.value) || 1)
const paginatedFacilities = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredFacilities.value.slice(start, start + itemsPerPage.value)
})

// Actions Handlers
const navigateToCreate = () => {
  router.push('/admin/facilities/create')
}

const navigateToDetail = (fac: FacilityData) => {
  router.push(`/admin/facilities/${fac.id}`)
}

const navigateToEdit = (fac: FacilityData) => {
  router.push(`/admin/facilities/${fac.id}/edit`)
}

const openDeleteModal = (fac: FacilityData) => {
  selectedFacForDelete.value = fac
  showDeleteModal.value = true
}

// Delete Action
const confirmDeleteFacility = async () => {
  if (!selectedFacForDelete.value) return

  isLoading.value = true
  error.value = null

  try {
    await facilityService.deleteFacility(selectedFacForDelete.value.id)
    showDeleteModal.value = false
    selectedFacForDelete.value = null
    await loadFacilities() // Reload list after delete
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Gagal menghapus fasilitas'
    console.error('Failed to delete facility:', err)
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
            Fasilitas Lab
          </h1>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-100/80 border border-brand-200 text-dark-green text-[11px] font-bold">
            <Wrench :size="12" class="text-primary-dark" />
            Inventaris Aset & Alat
          </span>
        </div>
        <p class="text-xs sm:text-sm text-text-muted font-normal">
          Kelola perangkat keras, komputer, proyektor, dan fasilitas laboratorium.
        </p>
      </div>

      <!-- Primary Action CTA Button Navigating to Dedicated Create Page -->
      <div class="self-start sm:self-auto shrink-0">
        <button
          @click="navigateToCreate"
          class="inline-flex items-center gap-2 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs sm:text-xs font-bold shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer"
        >
          <Plus :size="15" stroke-width="2.5" />
          <span>Tambah Fasilitas</span>
        </button>
      </div>
    </div>

    <!-- 2. Metric Summary Widgets -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        title="Total Unit Fasilitas"
        :value="totalFacilitiesCount"
        :icon="Wrench"
        icon-bg-class="bg-brand-100"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Aset Tersedia"
        :value="availableCount"
        :icon="CheckCircle2"
        icon-bg-class="bg-emerald-50"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Dalam Pemeliharaan"
        :value="maintenanceCount"
        :icon="Activity"
        icon-bg-class="bg-amber-50"
        icon-color-class="text-amber-700"
      />
      <SummaryCard
        title="Ruangan Terhubung"
        :value="totalLabsCount"
        :icon="FlaskConical"
        icon-bg-class="bg-sky-50"
        icon-color-class="text-sky-700"
      />
    </div>

    <!-- Error Alert -->
    <div
      v-if="error"
      class="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-xs"
    >
      <AlertTriangle :size="18" class="text-red-600 shrink-0 mt-0.5" />
      <div class="flex-1">
        <p class="font-bold text-red-800">Gagal Memuat Data Fasilitas</p>
        <p class="text-red-700 mt-1">{{ error }}</p>
      </div>
      <button
        @click="loadFacilities"
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
          placeholder="Cari fasilitas berdasarkan nama, kode aset, atau ruangan..."
          class="w-full pl-9 pr-3 py-2 bg-surface border border-gray-200 rounded-xl text-text-primary focus:outline-none focus:border-brand-400 focus:bg-white"
        />
      </div>

      <div class="flex items-center gap-2">
        <select
          v-model="selectedLabFilter"
          class="px-3 py-2 bg-surface border border-gray-200 rounded-xl font-bold text-text-primary focus:outline-none focus:border-brand-400"
        >
          <option value="All">Semua Laboratorium</option>
          <option value="LAB-RPL">LAB-RPL (Rekayasa Perangkat Lunak)</option>
          <option value="LAB-MM">LAB-MM (Multimedia)</option>
          <option value="LAB-JAR">LAB-JAR (Jaringan Komputer)</option>
          <option value="LAB-DB">LAB-DB (Basis Data)</option>
          <option value="LAB-AI">LAB-AI (Kecerdasan Buatan)</option>
        </select>

        <select
          v-model="selectedStatusFilter"
          class="px-3 py-2 bg-surface border border-gray-200 rounded-xl font-bold text-text-primary focus:outline-none focus:border-brand-400"
        >
          <option value="All">Semua Status</option>
          <option value="Available">Tersedia</option>
          <option value="In Use">Sedang Dipakai</option>
          <option value="Maintenance">Pemeliharaan</option>
          <option value="Inactive">Nonaktif</option>
        </select>
      </div>
    </div>

    <!-- 4. Data Table -->
    <div class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs overflow-hidden">
      <!-- Loading State -->
      <div v-if="isLoading" class="py-20 text-center">
        <div class="inline-flex items-center gap-3 text-text-muted">
          <div class="w-5 h-5 border-2 border-brand-300 border-t-dark-green rounded-full animate-spin"></div>
          <span class="text-xs font-medium">Memuat data fasilitas...</span>
        </div>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs text-text-primary">
          <thead class="bg-surface/60 border-b border-gray-100 text-text-muted font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th class="py-3.5 px-4">Aset Fasilitas</th>
              <th class="py-3.5 px-4">Kode Aset</th>
              <th class="py-3.5 px-4">Ruang Lab</th>
              <th class="py-3.5 px-4">Jumlah</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="fac in paginatedFacilities"
              :key="fac.id"
              @click="navigateToDetail(fac)"
              class="hover:bg-brand-50/20 transition-colors cursor-pointer group"
            >
              <!-- Asset Name -->
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-brand-100/80 text-dark-green flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    <Wrench :size="16" />
                  </div>
                  <div>
                    <p class="font-bold text-text-primary group-hover:text-dark-green transition-colors">{{ fac.name }}</p>
                    <p class="text-[11px] text-text-muted font-normal line-clamp-1 max-w-xs">{{ fac.description }}</p>
                  </div>
                </div>
              </td>

              <!-- Code -->
              <td class="py-3.5 px-4">
                <span class="px-2.5 py-0.5 rounded-full bg-brand-100/80 text-dark-green font-mono text-[10px] font-bold border border-brand-200/60">
                  {{ fac.code }}
                </span>
              </td>

              <!-- Assigned Lab -->
              <td class="py-3.5 px-4 font-semibold text-text-primary">
                {{ fac.labCode }}
              </td>

              <!-- Quantity -->
              <td class="py-3.5 px-4 font-semibold text-text-primary">
                {{ fac.quantity }} Unit
              </td>

              <!-- Status -->
              <td class="py-3.5 px-4">
                <span :class="['px-2.5 py-0.5 rounded-full text-[10px] font-bold border', fac.status === 'Available' ? 'bg-emerald-50 text-dark-green border-brand-200' : fac.status === 'In Use' ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-amber-50 text-amber-800 border-amber-200']">
                  {{ fac.status === 'Available' ? 'Tersedia' : fac.status === 'In Use' ? 'Sedang Dipakai' : fac.status === 'Maintenance' ? 'Pemeliharaan' : 'Nonaktif' }}
                </span>
              </td>

              <!-- Actions -->
              <td class="py-3.5 px-4 text-right" @click.stop>
                <div class="flex items-center justify-end gap-1">
                  <button
                    @click="navigateToDetail(fac)"
                    class="p-1.5 rounded-lg text-text-muted hover:text-dark-green hover:bg-brand-50 transition-colors"
                    title="Lihat Detail Fasilitas"
                  >
                    <Eye :size="15" />
                  </button>

                  <button
                    @click="navigateToEdit(fac)"
                    class="p-1.5 rounded-lg text-text-muted hover:text-dark-green hover:bg-brand-50 transition-colors"
                    title="Edit Fasilitas"
                  >
                    <Edit3 :size="15" />
                  </button>

                  <button
                    @click="openDeleteModal(fac)"
                    class="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Hapus Fasilitas"
                  >
                    <Trash2 :size="15" />
                  </button>
                </div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="paginatedFacilities.length === 0">
              <td colspan="6" class="py-12 text-center text-text-muted">
                <Wrench :size="36" class="mx-auto text-text-muted/40 mb-2" />
                <p class="font-bold text-xs text-text-secondary">Tidak ada fasilitas ditemukan</p>
                <p class="text-[11px] mt-0.5">Coba sesuaikan kata kunci pencarian atau filter lab.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="p-3 sm:p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
        <span>Menampilkan {{ paginatedFacilities.length }} dari {{ filteredFacilities.length }} fasilitas</span>
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
          <h3 class="text-sm font-bold text-text-primary">Hapus Aset Fasilitas?</h3>
        </div>

        <p class="text-text-muted leading-relaxed">
          Apakah Anda yakin ingin menghapus <strong class="text-text-primary">{{ selectedFacForDelete?.name }}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            @click="showDeleteModal = false"
            class="px-4 py-2 rounded-full border border-gray-200 text-text-primary font-semibold hover:bg-surface cursor-pointer"
          >
            Batal
          </button>
          <button
            @click="confirmDeleteFacility"
            class="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
          >
            Ya, Hapus Aset
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
