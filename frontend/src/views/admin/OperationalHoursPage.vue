<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import {
  Clock,
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
  Layers,
  Calendar,
  Sun,
  Moon,
  AlertTriangle,
  Sparkles,
  Info
} from 'lucide-vue-next'
import type { OperationalHourData } from '@/mocks/admin-operational-hours.mock'
import { operationalHourService } from '@/services/operational-hour.service'
import SummaryCard from '@/components/admin/SummaryCard.vue'

const router = useRouter()
const navStore = useAdminNavStore()

onMounted(() => {
  navStore.setBreadcrumbs([
    { label: 'Dashboard', path: '/admin' },
    { label: 'Jam Operasional' },
  ])
  loadOperationalHours()
})

const hoursList = ref<OperationalHourData[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const totalSystemOperationalHours = ref(0)

// Load operational hours from API
const loadOperationalHours = async () => {
  isLoading.value = true
  error.value = null

  try {
    const { operationalHours, meta } = await operationalHourService.getOperationalHours({
      page: 1,
      limit: 100, // Backend maximum limit
      search: searchQuery.value || undefined,
    })

    hoursList.value = operationalHours
    totalSystemOperationalHours.value = meta.total
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Gagal memuat jam operasional'
    console.error('Failed to load operational hours:', err)
  } finally {
    isLoading.value = false
  }
}

// Reload on search query change
watch(searchQuery, () => {
  loadOperationalHours()
})

// Current Day of Week Helper
const currentDayName = computed(() => {
  const days: OperationalHourData['day'][] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const todayIdx = new Date().getDay()
  return days[todayIdx]
})

// Summary Metrics
const openDaysCount = computed(() => hoursList.value.filter(h => h.status === 'Open').length)
const closedDaysCount = computed(() => hoursList.value.filter(h => h.status === 'Closed').length)
const totalWeeklyHours = computed(() => hoursList.value.reduce((acc, curr) => acc + (curr.status === 'Open' ? curr.durationHours : 0), 0))

// Page Navigation Actions
const navigateToCreate = () => {
  router.push('/admin/operational-hours/create')
}

const navigateToEdit = (hour: OperationalHourData) => {
  router.push(`/admin/operational-hours/${hour.id}/edit`)
}
</script>

<template>
  <div class="space-y-6 pb-8 select-none">

    <!-- 1. Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2.5 border-b border-gray-200/60">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
            Jam Operasional
          </h1>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-100/80 border border-brand-200 text-dark-green text-[11px] font-bold">
            <Clock :size="12" class="text-primary-dark" />
            Jam Operasional Standar
          </span>
        </div>
        <p class="text-xs sm:text-sm text-text-muted font-normal">
          Kelola jam operasional mingguan dan jendela ketersediaan buka/tutup laboratorium.
        </p>
      </div>

      <!-- Primary Action CTA Button Navigating to Dedicated Create Page -->
      <div class="self-start sm:self-auto shrink-0">
        <button
          @click="navigateToCreate"
          class="inline-flex items-center gap-2 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs sm:text-xs font-bold shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer"
        >
          <Plus :size="15" stroke-width="2.5" />
          <span>Tambah Jadwal</span>
        </button>
      </div>
    </div>

    <!-- 2. Metric Summary Widgets -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        title="Total Jam Mingguan"
        :value="`${totalWeeklyHours} Jam`"
        :icon="Clock"
        icon-bg-class="bg-brand-100"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Hari Buka"
        :value="`${openDaysCount} Hari`"
        :icon="Sun"
        icon-bg-class="bg-emerald-50"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Hari Tutup"
        :value="`${closedDaysCount} Hari`"
        :icon="Moon"
        icon-bg-class="bg-gray-100"
        icon-color-class="text-gray-600"
      />
      <SummaryCard
        title="Jadwal Hari Ini"
        :value="`${currentDayName} (BUKA)`"
        :icon="Calendar"
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
        <p class="font-bold text-red-800">Gagal Memuat Jam Operasional</p>
        <p class="text-red-700 mt-1">{{ error }}</p>
      </div>
      <button
        @click="loadOperationalHours"
        class="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-semibold transition-colors cursor-pointer"
      >
        Coba Lagi
      </button>
    </div>

    <!-- Search Bar -->
    <div class="bg-white p-3 sm:p-4 rounded-2xl border border-gray-200/70 shadow-2xs">
      <div class="relative">
        <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari berdasarkan nama atau kode laboratorium..."
          class="w-full pl-9 pr-3 py-2 bg-surface border border-gray-200 rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-400 focus:bg-white"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-20 text-center">
      <div class="inline-flex items-center gap-3 text-text-muted">
        <div class="w-5 h-5 border-2 border-brand-300 border-t-dark-green rounded-full animate-spin"></div>
        <span class="text-xs font-medium">Memuat jam operasional...</span>
      </div>
    </div>

    <!-- 3. Operational Hours Grid -->
    <div v-if="!isLoading && hoursList.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="hour in hoursList"
        :key="hour.id"
        :class="[
          'bg-white rounded-2xl border shadow-2xs p-5 flex flex-col justify-between transition-all relative',
          hour.day === currentDayName ? 'border-brand-300 ring-2 ring-brand-100' : 'border-gray-200/70'
        ]"
      >
        <div class="space-y-3">
          <!-- Laboratory Info -->
          <div v-if="hour.laboratoryName" class="pb-2 border-b border-gray-100">
            <div class="flex items-center gap-2">
              <Layers :size="14" class="text-dark-green shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-text-primary truncate">{{ hour.laboratoryName }}</p>
                <p class="text-[10px] text-text-muted font-medium">{{ hour.laboratoryCode }}</p>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <h3 class="font-extrabold text-base text-text-primary">{{ hour.day }}</h3>
              <span v-if="hour.day === currentDayName" class="px-2 py-0.2 rounded-full bg-brand-100 text-dark-green text-[9px] font-extrabold uppercase">
                Hari Ini
              </span>
            </div>
            <span :class="['px-2.5 py-0.5 rounded-full text-[10px] font-bold border', hour.status === 'Open' ? 'bg-emerald-50 text-dark-green border-brand-200' : 'bg-gray-100 text-gray-600 border-gray-200']">
              {{ hour.status === 'Open' ? 'Buka' : 'Tutup' }}
            </span>
          </div>

          <div v-if="hour.status === 'Open'" class="space-y-1">
            <div class="flex items-center justify-between text-xs">
              <span class="text-text-muted font-medium">Rentang Operasional:</span>
              <span class="font-mono font-bold text-dark-green">{{ hour.openTime }} — {{ hour.closeTime }}</span>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-text-muted font-medium">Durasi Harian:</span>
              <span class="font-bold text-text-primary">{{ hour.durationHours }} Jam</span>
            </div>
          </div>

          <div v-else class="p-3 rounded-xl bg-gray-50 text-center text-xs text-text-muted font-medium">
            Laboratorium Tutup pada hari {{ hour.day }}
          </div>
        </div>

        <div class="pt-4 mt-4 border-t border-gray-100 flex items-center justify-end">
          <button
            @click="navigateToEdit(hour)"
            class="px-3.5 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-surface text-text-primary text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 :size="13" class="text-dark-green" />
            <span>Ubah Jam</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!isLoading && hoursList.length === 0" class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-20 text-center">
      <div class="max-w-md mx-auto space-y-4">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-2">
          <Clock :size="32" class="text-gray-400" />
        </div>
        <h3 class="text-lg font-bold text-text-primary">Jam Operasional Tidak Ditemukan</h3>
        <p class="text-sm text-text-muted">
          {{ searchQuery ? 'Tidak ada jam operasional yang cocok dengan kriteria pencarian Anda.' : 'Mulai dengan menambahkan jadwal operasional pertama.' }}
        </p>
        <button
          v-if="!searchQuery"
          @click="navigateToCreate"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus :size="15" />
          <span>Tambah Jadwal</span>
        </button>
        <button
          v-else
          @click="searchQuery = ''"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 bg-white hover:bg-surface text-text-primary text-xs font-bold shadow-2xs transition-colors cursor-pointer"
        >
          <X :size="15" />
          <span>Hapus Pencarian</span>
        </button>
      </div>
    </div>

  </div>
</template>
