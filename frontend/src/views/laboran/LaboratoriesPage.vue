<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLaboranNavStore } from '@/stores/laboran-nav.store'
import {
  FlaskConical,
  CheckCircle2,
  Activity,
  Wrench,
  Search,
  Building2,
  Users,
  Eye,
  RotateCcw,
  DoorOpen,
  Calendar,
  RefreshCw,
  X,
  Sparkles,
  FileText,
  Check,
  Loader2,
  AlertCircle
} from 'lucide-vue-next'
import SummaryCard from '@/components/admin/SummaryCard.vue'
import { laboratoryService, type LaboratoryData } from '@/services/laboratory.service'

const router = useRouter()
const navStore = useLaboranNavStore()

onMounted(() => {
  navStore.setBreadcrumbs([
    { label: 'Portal Laboran', path: '/laboran' },
    { label: 'Laboratorium' }
  ])
  loadLaboratories()
})

// Datasets
const laboratories = ref<LaboratoryData[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

// Search & Filter
const searchQuery = ref('')
const selectedStatusFilter = ref<string>('ALL')
const selectedLocationFilter = ref<string>('ALL')

// Toast Notification
const showToast = ref(false)
const toastMessage = ref('')

const triggerToast = (msg: string) => {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3500)
}

// Load laboratories from API
const loadLaboratories = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const result = await laboratoryService.getLaboratories({
      page: 1,
      limit: 100,
      search: searchQuery.value.trim() || undefined,
    })
    laboratories.value = result.laboratories
  } catch (err: any) {
    errorMessage.value = err.message || 'Gagal memuat data laboratorium'
  } finally {
    isLoading.value = false
  }
}

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadLaboratories()
  }, 400)
})

const isRefreshing = ref(false)
const handleRefresh = async () => {
  isRefreshing.value = true
  await loadLaboratories()
  isRefreshing.value = false
  triggerToast('Status direktori laboratorium berhasil diperbarui.')
}

// Operational Status mapping for UI presentation
const getLabOperationalStatus = (lab: LaboratoryData): 'Sedang Dipakai' | 'Tersedia' | 'Pemeliharaan' => {
  if (lab.status === 'Maintenance') return 'Pemeliharaan'
  if (lab.code === 'LAB-RPL' || lab.code === 'LAB-MM') return 'Sedang Dipakai'
  return 'Tersedia'
}

// Summary Metrics
const totalCount = computed(() => laboratories.value.length)
const availableCount = computed(() => laboratories.value.filter(l => getLabOperationalStatus(l) === 'Tersedia').length)
const inUseCount = computed(() => laboratories.value.filter(l => getLabOperationalStatus(l) === 'Sedang Dipakai').length)
const maintenanceCount = computed(() => laboratories.value.filter(l => getLabOperationalStatus(l) === 'Pemeliharaan').length)

// Location Options
const locationOptions = computed(() => {
  const set = new Set<string>()
  laboratories.value.forEach(l => {
    if (l.location) {
      const building = l.location.split('·')[0]?.trim() || l.location
      if (building) set.add(building)
    }
  })
  return Array.from(set)
})

// Filtered Laboratories Grid
const filteredLaboratories = computed(() => {
  return laboratories.value.filter(lab => {
    const opStatus = getLabOperationalStatus(lab)
    if (selectedStatusFilter.value !== 'ALL' && opStatus !== selectedStatusFilter.value) {
      return false
    }
    if (selectedLocationFilter.value !== 'ALL' && !lab.location.includes(selectedLocationFilter.value)) {
      return false
    }
    if (searchQuery.value.trim() !== '') {
      const q = searchQuery.value.toLowerCase()
      const matchName = lab.name.toLowerCase().includes(q)
      const matchCode = lab.code.toLowerCase().includes(q)
      const matchLoc = lab.location.toLowerCase().includes(q)
      if (!matchName && !matchCode && !matchLoc) {
        return false
      }
    }
    return true
  })
})

const resetFilters = () => {
  searchQuery.value = ''
  selectedStatusFilter.value = 'ALL'
  selectedLocationFilter.value = 'ALL'
}

const navigateToDetail = (id: string) => {
  router.push(`/laboran/laboratories/${id}`)
}

const navigateToSchedules = () => {
  router.push('/laboran/schedules')
}

const navigateToRoomUsage = () => {
  router.push('/laboran/room-usage')
}
</script>

<template>
  <div class="space-y-6 pb-12 select-none">
    
    <!-- 1. Page Header Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2.5 border-b border-gray-200/60">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
            Laboratorium
          </h1>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-100/80 border border-brand-200 text-dark-green text-[11px] font-bold">
            <FlaskConical :size="12" />
            Direktori Operasional
          </span>
        </div>
        <p class="text-xs sm:text-sm text-text-muted font-normal">
          Pantau ketersediaan, kapasitas, fasilitas, dan status operasional laboratorium.
        </p>
      </div>

      <!-- Controls -->
      <div class="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
        <button
          @click="handleRefresh"
          :disabled="isRefreshing"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-gray-200/80 bg-white hover:bg-surface text-text-secondary text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw :size="14" :class="{ 'animate-spin': isRefreshing }" />
          <span>Perbarui Status</span>
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

    <!-- 2. Summary Statistics Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      <SummaryCard
        title="Total Laboratorium"
        :value="totalCount"
        subtext="Laboratorium terdaftar"
        :icon="FlaskConical"
        icon-bg-class="bg-brand-100"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Tersedia"
        :value="availableCount"
        subtext="Siap digunakan"
        :icon="CheckCircle2"
        icon-bg-class="bg-sky-50"
        icon-color-class="text-sky-700"
      />
      <SummaryCard
        title="Sedang Dipakai"
        :value="inUseCount"
        subtext="Sesi aktif berlangsung"
        :icon="Activity"
        icon-bg-class="bg-emerald-50"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Pemeliharaan"
        :value="maintenanceCount"
        subtext="Perlu perhatian staf"
        :icon="Wrench"
        icon-bg-class="bg-amber-50"
        icon-color-class="text-amber-800"
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
            placeholder="Cari nama laboratorium, kode ruang, lokasi..."
            class="w-full pl-9 pr-4 py-2 bg-surface/60 border border-gray-200/80 rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-400 focus:bg-white transition-all"
          />
        </div>

        <!-- Filter Dropdowns -->
        <div class="flex items-center gap-2 flex-wrap text-xs">
          <!-- Status Dropdown -->
          <div class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface border border-gray-200/80">
            <span class="text-text-muted font-bold uppercase text-[10px]">Status:</span>
            <select
              v-model="selectedStatusFilter"
              class="bg-transparent text-xs font-bold text-text-primary focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="Tersedia">Tersedia</option>
              <option value="Sedang Dipakai">Sedang Dipakai (Aktif)</option>
              <option value="Pemeliharaan">Pemeliharaan</option>
            </select>
          </div>

          <!-- Location Dropdown -->
          <div class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface border border-gray-200/80">
            <Building2 :size="13" class="text-text-muted shrink-0" />
            <select
              v-model="selectedLocationFilter"
              class="bg-transparent text-xs font-bold text-text-primary focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Lokasi</option>
              <option v-for="loc in locationOptions" :key="loc" :value="loc">
                {{ loc }}
              </option>
            </select>
          </div>

          <!-- Reset Filter Button -->
          <button
            v-if="searchQuery || selectedStatusFilter !== 'ALL' || selectedLocationFilter !== 'ALL'"
            @click="resetFilters"
            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200/80 text-text-muted hover:text-text-primary hover:bg-surface font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw :size="12" />
            <span>Reset</span>
          </button>
        </div>

      </div>
    </div>

    <!-- 4. Main Laboratory Cards Grid Layout -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      
      <div
        v-for="lab in filteredLaboratories"
        :key="lab.id"
        class="bg-white rounded-2xl border border-gray-200/70 p-5 shadow-2xs space-y-4 hover:border-brand-300/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between"
      >
        <div class="space-y-3">
          <!-- Card Header: Code & Status Badge -->
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded bg-brand-100 text-dark-green text-[11px] font-mono font-extrabold">
                {{ lab.code }}
              </span>
              <span class="text-xs text-text-muted font-semibold truncate max-w-[130px]">{{ lab.location }}</span>
            </div>

            <!-- Status Pill Badge -->
            <span
              :class="[
                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border',
                getLabOperationalStatus(lab) === 'Sedang Dipakai'
                  ? 'bg-emerald-50 text-dark-green border-emerald-200 shadow-2xs'
                  : getLabOperationalStatus(lab) === 'Tersedia'
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
              ]"
            >
              <span v-if="getLabOperationalStatus(lab) === 'Sedang Dipakai'" class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{{ getLabOperationalStatus(lab) }}</span>
            </span>
          </div>

          <!-- Lab Name & Capacity -->
          <div>
            <h3 class="text-base font-extrabold text-text-primary group-hover:text-dark-green transition-colors leading-snug">
              {{ lab.name }}
            </h3>
            <p class="text-xs text-text-muted font-medium mt-1 flex items-center gap-1.5">
              <Users :size="13" class="text-dark-green" />
              <span>Kapasitas: <strong class="font-extrabold text-text-primary">{{ lab.maximumCapacity }} Unit PC</strong></span>
            </p>
          </div>

          <!-- Facilities Summary Pills -->
          <div class="space-y-1 pt-1">
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-text-muted block">Fasilitas Utama</span>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="(fac, idx) in lab.facilitiesList.slice(0, 3)"
                :key="idx"
                class="px-2 py-0.5 rounded-md bg-surface text-text-secondary text-[10.5px] font-semibold border border-gray-100 inline-flex items-center gap-1"
              >
                <Check :size="10" class="text-brand-600 shrink-0" />
                <span>{{ fac }}</span>
              </span>
              <span v-if="lab.facilitiesList.length > 3" class="px-1.5 py-0.5 rounded-md bg-gray-100 text-text-muted text-[10px] font-bold">
                +{{ lab.facilitiesList.length - 3 }} lainnya
              </span>
            </div>
          </div>

          <!-- Operational Live Activity Box -->
          <div
            :class="[
              'p-3 rounded-xl border text-xs space-y-1',
              getLabOperationalStatus(lab) === 'Sedang Dipakai'
                ? 'bg-brand-50/40 border-brand-200/80 text-dark-green'
                : getLabOperationalStatus(lab) === 'Tersedia'
                  ? 'bg-surface/50 border-gray-100 text-text-primary'
                  : 'bg-amber-50/50 border-amber-200/70 text-amber-900'
            ]"
          >
            <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
              <span>{{ getLabOperationalStatus(lab) === 'Sedang Dipakai' ? 'Aktivitas Berjalan' : getLabOperationalStatus(lab) === 'Tersedia' ? 'Sesi Berikutnya' : 'Catatan Pemeliharaan' }}</span>
              <span v-if="getLabOperationalStatus(lab) === 'Sedang Dipakai'" class="font-mono text-emerald-800 font-bold">08:00 – 10:00</span>
            </div>

            <p class="font-bold text-xs">
              {{ getLabOperationalStatus(lab) === 'Sedang Dipakai' ? 'Praktikum Pemrograman Web' : getLabOperationalStatus(lab) === 'Tersedia' ? 'Sistem Basis Data (IF-2A) pkl 13:00' : 'Pemeliharaan modul rak server lab' }}
            </p>

            <div class="flex items-center justify-between text-[11px] pt-1">
              <span class="text-text-muted font-medium">
                {{ getLabOperationalStatus(lab) === 'Sedang Dipakai' ? 'Dr. Aris Kurniawan' : 'Ruangan siap digunakan' }}
              </span>
              
              <button
                v-if="getLabOperationalStatus(lab) === 'Sedang Dipakai'"
                @click.stop="navigateToRoomUsage"
                class="font-bold text-dark-green hover:underline cursor-pointer"
              >
                Lihat Log Pemakaian →
              </button>
              <button
                v-else-if="getLabOperationalStatus(lab) === 'Tersedia'"
                @click.stop="navigateToSchedules"
                class="font-bold text-dark-green hover:underline cursor-pointer"
              >
                Lihat Jadwal →
              </button>
            </div>
          </div>
        </div>

        <!-- Primary Card Action -->
        <div class="pt-3 border-t border-gray-100 flex items-center justify-end">
          <button
            @click="navigateToDetail(lab.id)"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-100/80 hover:bg-dark-green text-dark-green hover:text-white font-bold text-xs transition-colors cursor-pointer w-full justify-center shadow-2xs"
          >
            <Eye :size="14" />
            <span>Lihat Rincian</span>
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredLaboratories.length === 0" class="col-span-full py-12 text-center text-text-muted bg-white rounded-2xl border border-gray-200/70 p-8 space-y-2">
        <FlaskConical :size="36" class="mx-auto text-text-muted/40 mb-2" />
        <h4 class="text-xs font-bold text-text-secondary">Laboratorium tidak ditemukan</h4>
        <p class="text-[11px] text-text-muted max-w-sm mx-auto">
          Tidak ada laboratorium yang cocok dengan parameter pencarian atau filter yang dipilih.
        </p>
      </div>

    </div>

  </div>
</template>
