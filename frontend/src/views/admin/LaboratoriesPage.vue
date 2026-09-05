<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import {
  FlaskConical,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Clock,
  Layers,
  Building,
  Info
} from 'lucide-vue-next'
import type { LaboratoryData } from '@/mocks/admin-laboratories.mock'
import { laboratoryService } from '@/services/laboratory.service'
import SummaryCard from '@/components/admin/SummaryCard.vue'

const router = useRouter()
const navStore = useAdminNavStore()

onMounted(() => {
  navStore.setBreadcrumbs([
    { label: 'Dashboard', path: '/admin' },
    { label: 'Laboratorium' },
  ])
  loadLaboratories()
})

// Reactive State
const laboratories = ref<LaboratoryData[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const selectedStatusFilter = ref<string>('All')
const sortBy = ref<string>('name')

// Pagination State
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalSystemLabs = ref(0)

// Delete Dialog State
const showDeleteModal = ref(false)
const selectedLabForDelete = ref<LaboratoryData | null>(null)

// Load laboratories from API
const loadLaboratories = async () => {
  isLoading.value = true
  error.value = null

  try {
    const { laboratories: labs, meta } = await laboratoryService.getLaboratories({
      page: 1,
      limit: 100, // Backend maximum limit
      search: searchQuery.value || undefined,
    })

    laboratories.value = labs
    totalSystemLabs.value = meta.total
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Gagal memuat data laboratorium'
    console.error('Failed to load laboratories:', err)
  } finally {
    isLoading.value = false
  }
}

// Reload on search query change
watch(searchQuery, () => {
  loadLaboratories()
})

// Summary Cards Metrics
const totalLabsCount = computed(() => totalSystemLabs.value)
const activeLabsCount = computed(() => laboratories.value.filter(l => l.status === 'Active').length)
const maintenanceLabsCount = computed(() => laboratories.value.filter(l => l.status === 'Maintenance').length)
const totalFacilitiesCount = computed(() => laboratories.value.reduce((sum, lab) => sum + lab.facilitiesCount, 0))

// Filtered & Sorted Laboratories List
const filteredLaboratories = computed(() => {
  let list = laboratories.value.filter(lab => {
    const matchesSearch =
      lab.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      lab.code.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      lab.location.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesStatus =
      selectedStatusFilter.value === 'All' || lab.status === selectedStatusFilter.value

    return matchesSearch && matchesStatus
  })

  // Sort
  if (sortBy.value === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name))
  } else if (sortBy.value === 'capacity') {
    list.sort((a, b) => b.maximumCapacity - a.maximumCapacity)
  }

  return list
})

// Paginated Laboratories List
const paginatedLaboratories = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredLaboratories.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredLaboratories.value.length / itemsPerPage.value) || 1
})

// Page Navigation Actions
const navigateToCreate = () => {
  router.push('/admin/laboratories/create')
}

const navigateToDetail = (lab: LaboratoryData) => {
  router.push(`/admin/laboratories/${lab.id}`)
}

const navigateToEdit = (lab: LaboratoryData) => {
  router.push(`/admin/laboratories/${lab.id}/edit`)
}

// Delete Confirmation Modal
const openDeleteModal = (lab: LaboratoryData) => {
  selectedLabForDelete.value = lab
  showDeleteModal.value = true
}

const confirmDeleteLab = async () => {
  if (!selectedLabForDelete.value) return

  isLoading.value = true
  error.value = null

  try {
    await laboratoryService.deleteLaboratory(selectedLabForDelete.value.id)
    showDeleteModal.value = false
    selectedLabForDelete.value = null
    await loadLaboratories() // Reload list after delete
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to delete laboratory'
    console.error('Failed to delete laboratory:', err)
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
            Laboratorium
          </h1>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-100/80 border border-brand-200 text-dark-green text-[11px] font-bold">
            <FlaskConical :size="12" class="text-primary-dark" />
            Ruangan & Kapasitas
          </span>
        </div>
        <p class="text-xs sm:text-sm text-text-muted font-normal">
          Kelola ruangan laboratorium, alokasi kapasitas, dan ketersediaan fasilitas.
        </p>
      </div>

      <!-- Primary Action CTA Button Navigating to Dedicated Create Page -->
      <div class="self-start sm:self-auto shrink-0">
        <button
          @click="navigateToCreate"
          class="inline-flex items-center gap-2 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs sm:text-xs font-bold shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer"
        >
          <Plus :size="15" stroke-width="2.5" />
          <span>Tambah Laboratorium</span>
        </button>
      </div>
    </div>

    <!-- 2. Metric Summary Widgets -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        title="Total Laboratorium"
        :value="totalLabsCount"
        :icon="FlaskConical"
        icon-bg-class="bg-brand-100"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Lab Aktif"
        :value="activeLabsCount"
        :icon="CheckCircle2"
        icon-bg-class="bg-emerald-50"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Dalam Pemeliharaan"
        :value="maintenanceLabsCount"
        :icon="Wrench"
        icon-bg-class="bg-amber-50"
        icon-color-class="text-amber-700"
      />
      <SummaryCard
        title="Total Unit Fasilitas"
        :value="totalFacilitiesCount"
        :icon="Layers"
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
        <p class="font-bold text-red-800">Gagal Memuat Data Laboratorium</p>
        <p class="text-red-700 mt-1">{{ error }}</p>
      </div>
      <button
        @click="loadLaboratories"
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
          placeholder="Cari lab berdasarkan nama, kode ruang, atau lokasi..."
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
          <option value="Maintenance">Pemeliharaan</option>
          <option value="Closed">Ditutup</option>
        </select>
      </div>
    </div>

    <!-- 4. Data Table -->
    <div class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs overflow-hidden">
      <!-- Loading State -->
      <div v-if="isLoading" class="py-20 text-center">
        <div class="inline-flex items-center gap-3 text-text-muted">
          <div class="w-5 h-5 border-2 border-brand-300 border-t-dark-green rounded-full animate-spin"></div>
          <span class="text-xs font-medium">Memuat data laboratorium...</span>
        </div>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs text-text-primary">
          <thead class="bg-surface/60 border-b border-gray-100 text-text-muted font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th class="py-3.5 px-4">Laboratorium</th>
              <th class="py-3.5 px-4">Kode Ruang</th>
              <th class="py-3.5 px-4">Lokasi</th>
              <th class="py-3.5 px-4">Kapasitas</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="lab in paginatedLaboratories"
              :key="lab.id"
              @click="navigateToDetail(lab)"
              class="hover:bg-brand-50/20 transition-colors cursor-pointer group"
            >
              <!-- Name -->
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-brand-100/80 text-dark-green flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    <FlaskConical :size="16" />
                  </div>
                  <div>
                    <p class="font-bold text-text-primary group-hover:text-dark-green transition-colors">{{ lab.name }}</p>
                    <p class="text-[11px] text-text-muted font-normal">{{ lab.facilitiesCount }} Fasilitas terpasang</p>
                  </div>
                </div>
              </td>

              <!-- Code -->
              <td class="py-3.5 px-4">
                <span class="px-2.5 py-0.5 rounded-full bg-brand-100/80 text-dark-green font-mono text-[10px] font-bold border border-brand-200/60">
                  {{ lab.code }}
                </span>
              </td>

              <!-- Location -->
              <td class="py-3.5 px-4 font-medium text-text-secondary">
                {{ lab.location }}
              </td>

              <!-- Capacity -->
              <td class="py-3.5 px-4 font-semibold text-text-primary">
                {{ lab.maximumCapacity }} Kursi / Komputer
              </td>

              <!-- Status -->
              <td class="py-3.5 px-4">
                <span :class="['px-2.5 py-0.5 rounded-full text-[10px] font-bold border', lab.status === 'Active' ? 'bg-emerald-50 text-dark-green border-brand-200' : lab.status === 'Maintenance' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-red-50 text-red-700 border-red-200']">
                  {{ lab.status === 'Active' ? 'Aktif' : lab.status === 'Maintenance' ? 'Pemeliharaan' : 'Ditutup' }}
                </span>
              </td>

              <!-- Actions -->
              <td class="py-3.5 px-4 text-right" @click.stop>
                <div class="flex items-center justify-end gap-1">
                  <button
                    @click="navigateToDetail(lab)"
                    class="p-1.5 rounded-lg text-text-muted hover:text-dark-green hover:bg-brand-50 transition-colors"
                    title="Lihat Detail Lab"
                  >
                    <Eye :size="15" />
                  </button>

                  <button
                    @click="navigateToEdit(lab)"
                    class="p-1.5 rounded-lg text-text-muted hover:text-dark-green hover:bg-brand-50 transition-colors"
                    title="Edit Laboratorium"
                  >
                    <Edit3 :size="15" />
                  </button>

                  <button
                    @click="openDeleteModal(lab)"
                    class="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Hapus Laboratorium"
                  >
                    <Trash2 :size="15" />
                  </button>
                </div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="paginatedLaboratories.length === 0">
              <td colspan="6" class="py-12 text-center text-text-muted">
                <FlaskConical :size="36" class="mx-auto text-text-muted/40 mb-2" />
                <p class="font-bold text-xs text-text-secondary">Tidak ada laboratorium ditemukan</p>
                <p class="text-[11px] mt-0.5">Coba sesuaikan kata kunci pencarian atau filter status.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="p-3 sm:p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
        <span>Menampilkan {{ paginatedLaboratories.length }} dari {{ filteredLaboratories.length }} laboratorium</span>
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
          <h3 class="text-sm font-bold text-text-primary">Hapus Ruangan Laboratorium?</h3>
        </div>

        <p class="text-text-muted leading-relaxed">
          Apakah Anda yakin ingin menghapus ruangan <strong class="text-text-primary">{{ selectedLabForDelete?.name }}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            @click="showDeleteModal = false"
            class="px-4 py-2 rounded-full border border-gray-200 text-text-primary font-semibold hover:bg-surface cursor-pointer"
          >
            Batal
          </button>
          <button
            @click="confirmDeleteLab"
            class="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
          >
            Ya, Hapus Ruangan
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
