<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLecturerNavStore } from '@/stores/lecturer-nav.store'
import {
  FlaskConical,
  CheckCircle2,
  Wrench,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  Users,
  Building2,
  Check,
  X,
  Sparkles,
  Info,
  Loader2,
  AlertCircle,
  Plus
} from 'lucide-vue-next'
import { laboratoryService, type LaboratoryData } from '@/services/laboratory.service'

const router = useRouter()
const navStore = useLecturerNavStore()

// State
const laboratories = ref<LaboratoryData[]>([])
const isLoading = ref(true)
const errorMessage = ref('')

// Filters & Search
const searchQuery = ref('')
const selectedStatusFilter = ref('ALL')
const selectedCapacityFilter = ref('ALL')

const loadLaboratories = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const res = await laboratoryService.getLaboratories({ page: 1, limit: 100 })
    laboratories.value = res.laboratories || []
  } catch (err: any) {
    errorMessage.value = err.message || 'Gagal memuat daftar laboratorium'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  navStore.setBreadcrumbs([
    { label: 'Portal Dosen', path: '/lecturer' },
    { label: 'Laboratorium' }
  ])
  loadLaboratories()
})

// Summary statistics computed from real live dataset
const summaryStats = computed(() => {
  const total = laboratories.value.length
  const active = laboratories.value.filter(l => l.status === 'Active').length
  const maintenance = laboratories.value.filter(l => l.status === 'Maintenance').length
  const availableToday = active
  return { total, active, maintenance, availableToday }
})

// Filtered laboratories
const filteredLaboratories = computed(() => {
  return laboratories.value.filter(lab => {
    // Search query
    const query = searchQuery.value.toLowerCase().trim()
    const matchesQuery = !query ||
      lab.name.toLowerCase().includes(query) ||
      lab.code.toLowerCase().includes(query) ||
      lab.location.toLowerCase().includes(query)

    // Status filter
    let matchesStatus = true
    if (selectedStatusFilter.value === 'Active' || selectedStatusFilter.value === 'Available') {
      matchesStatus = lab.status === 'Active'
    } else if (selectedStatusFilter.value === 'Maintenance') {
      matchesStatus = lab.status === 'Maintenance'
    } else if (selectedStatusFilter.value === 'Closed') {
      matchesStatus = lab.status === 'Closed'
    }

    // Capacity filter
    let matchesCapacity = true
    if (selectedCapacityFilter.value === 'small') matchesCapacity = lab.maximumCapacity < 30
    else if (selectedCapacityFilter.value === 'medium') matchesCapacity = lab.maximumCapacity >= 30 && lab.maximumCapacity <= 35
    else if (selectedCapacityFilter.value === 'large') matchesCapacity = lab.maximumCapacity > 35

    return matchesQuery && matchesStatus && matchesCapacity
  })
})

const resetFilters = () => {
  searchQuery.value = ''
  selectedStatusFilter.value = 'ALL'
  selectedCapacityFilter.value = 'ALL'
}

const navigateTo = (path: string) => {
  router.push(path)
}

const handleBookLab = (lab: LaboratoryData) => {
  router.push({
    path: '/lecturer/room-requests/new',
    query: { labId: lab.id, labName: lab.name }
  })
}
</script>

<template>
  <div class="space-y-6 pb-12 select-none w-full max-w-full min-w-0">
    
    <!-- 1. Page Header Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200/60 w-full min-w-0">
      <div class="min-w-0 flex-1">
        <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight truncate">
          Direktori Laboratorium
        </h1>
        <p class="text-xs sm:text-sm text-text-muted font-normal truncate">
          Jelajahi ruangan lab, periksa konfigurasi fasilitas alat, dan ajukan permohonan peminjaman ruangan.
        </p>
      </div>

      <!-- Quick Action CTA -->
      <div class="flex items-center gap-2 self-start sm:self-auto shrink-0">
        <button
          @click="navigateTo('/lecturer/room-requests/new')"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs shadow-dark-green/20 transition-all duration-150 active:scale-95 cursor-pointer"
        >
          <Plus :size="15" stroke-width="2.5" />
          <span>Permohonan Pinjam Baru</span>
        </button>
      </div>
    </div>

    <!-- Error Banner -->
    <div
      v-if="errorMessage"
      class="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between shadow-xs"
    >
      <div class="flex items-center gap-2">
        <AlertCircle :size="16" class="text-rose-600 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>
      <button @click="loadLaboratories" class="text-xs text-rose-800 underline font-bold hover:opacity-80 cursor-pointer">
        Coba Lagi
      </button>
    </div>

    <!-- 2. Four Operational Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 w-full min-w-0">
      
      <!-- Card 1: Total Laboratories -->
      <div class="bg-white p-4.5 rounded-2xl border border-gray-200/70 shadow-2xs flex items-center justify-between min-w-0">
        <div class="space-y-0.5 min-w-0">
          <span class="text-text-muted text-[11px] font-bold uppercase tracking-wider block truncate">
            Total Lab
          </span>
          <span class="text-xl sm:text-2xl font-black text-text-primary block">
            {{ summaryStats.total }}
          </span>
          <span class="text-[11px] text-text-muted font-medium block truncate">
            Fasilitas operasional
          </span>
        </div>
        <div class="w-10 h-10 rounded-xl bg-brand-100/90 text-dark-green flex items-center justify-center shrink-0">
          <FlaskConical :size="20" stroke-width="2" />
        </div>
      </div>

      <!-- Card 2: Active & Ready -->
      <div class="bg-white p-4.5 rounded-2xl border border-gray-200/70 shadow-2xs flex items-center justify-between min-w-0">
        <div class="space-y-0.5 min-w-0">
          <span class="text-text-muted text-[11px] font-bold uppercase tracking-wider block truncate">
            Aktif & Siap Pakai
          </span>
          <span class="text-xl sm:text-2xl font-black text-emerald-700 block">
            {{ summaryStats.active }}
          </span>
          <span class="text-[11px] text-emerald-600 font-medium block truncate">
            Siap untuk sesi praktikum
          </span>
        </div>
        <div class="w-10 h-10 rounded-xl bg-emerald-50 text-dark-green flex items-center justify-center shrink-0">
          <CheckCircle2 :size="20" stroke-width="2" />
        </div>
      </div>

      <!-- Card 3: Under Maintenance -->
      <div class="bg-white p-4.5 rounded-2xl border border-gray-200/70 shadow-2xs flex items-center justify-between min-w-0">
        <div class="space-y-0.5 min-w-0">
          <span class="text-text-muted text-[11px] font-bold uppercase tracking-wider block truncate">
            Pemeliharaan
          </span>
          <span class="text-xl sm:text-2xl font-black text-text-primary block">
            {{ summaryStats.maintenance }}
          </span>
          <span class="text-[11px] text-amber-700 font-medium block truncate">
            Kalibrasi & perbaikan alat
          </span>
        </div>
        <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0">
          <Wrench :size="20" stroke-width="2" />
        </div>
      </div>

      <!-- Card 4: Booking Eligibility -->
      <div class="bg-white p-4.5 rounded-2xl border border-gray-200/70 shadow-2xs flex items-center justify-between min-w-0">
        <div class="space-y-0.5 min-w-0">
          <span class="text-text-muted text-[11px] font-bold uppercase tracking-wider block truncate">
            Tersedia untuk Dipinjam
          </span>
          <span class="text-xl sm:text-2xl font-black text-dark-green block">
            {{ summaryStats.availableToday }}
          </span>
          <span class="text-[11px] text-text-muted font-medium block truncate">
            Memenuhi syarat pinjam instan
          </span>
        </div>
        <div class="w-10 h-10 rounded-xl bg-brand-100/80 text-dark-green flex items-center justify-center shrink-0">
          <Calendar :size="20" stroke-width="2" />
        </div>
      </div>

    </div>

    <!-- 3. Search & Multi-Criteria Filter Controls -->
    <div class="bg-white p-4 rounded-2xl border border-gray-200/70 shadow-2xs space-y-3 w-full min-w-0">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full min-w-0">
        
        <!-- Search Input -->
        <div class="relative w-full sm:w-80 shrink-0">
          <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            <Search :size="16" />
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari laboratorium berdasarkan nama, kode, atau lokasi..."
            class="w-full pl-9 pr-8 py-2 bg-surface/60 border border-gray-200/80 rounded-xl text-xs transition-all focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green focus:bg-white text-text-primary placeholder:text-text-muted/70"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
          >
            <X :size="14" />
          </button>
        </div>

        <!-- Filter Dropdowns -->
        <div class="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          <!-- Status Filter -->
          <select
            v-model="selectedStatusFilter"
            class="px-3 py-2 bg-surface/60 border border-gray-200/80 rounded-xl text-xs text-text-secondary font-medium focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="Active">Aktif / Siap Pakai</option>
            <option value="Maintenance">Dalam Pemeliharaan</option>
            <option value="Closed">Ditutup</option>
          </select>

          <!-- Capacity Filter -->
          <select
            v-model="selectedCapacityFilter"
            class="px-3 py-2 bg-surface/60 border border-gray-200/80 rounded-xl text-xs text-text-secondary font-medium focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green cursor-pointer"
          >
            <option value="ALL">Semua Kapasitas</option>
            <option value="small">Kecil (&lt; 30 kursi)</option>
            <option value="medium">Sedang (30 – 35 kursi)</option>
            <option value="large">Besar (&gt; 35 kursi)</option>
          </select>

          <!-- Reset Filter Button -->
          <button
            v-if="searchQuery || selectedStatusFilter !== 'ALL' || selectedCapacityFilter !== 'ALL'"
            @click="resetFilters"
            class="px-2.5 py-1.5 text-xs font-bold text-dark-green hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw :size="13" />
            <span>Hapus Filter</span>
          </button>
        </div>

      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="py-16 text-center">
      <Loader2 :size="32" class="mx-auto text-dark-green animate-spin mb-3" />
      <p class="text-xs text-text-muted font-medium">Memuat direktori laboratorium...</p>
    </div>

    <!-- 4. Laboratory Cards Directory Grid -->
    <div v-else-if="filteredLaboratories.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 w-full min-w-0">
      
      <div
        v-for="lab in filteredLaboratories"
        :key="lab.id"
        @click="navigateTo(`/lecturer/laboratories/${lab.id}`)"
        class="bg-white p-5 rounded-2xl border border-gray-200/70 shadow-2xs space-y-4 flex flex-col justify-between transition-all duration-200 ease-out group hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md cursor-pointer min-w-0"
      >
        <!-- Top Info: Icon, Name, Code, Status -->
        <div class="space-y-3 min-w-0">
          <div class="flex items-start justify-between gap-3 min-w-0">
            <div class="w-10 h-10 rounded-xl bg-brand-100/90 text-dark-green flex items-center justify-center shrink-0 border border-transparent transition-all duration-200 group-hover:scale-105 group-hover:bg-brand-200/80">
              <FlaskConical :size="20" stroke-width="2" />
            </div>

            <!-- Status Badge -->
            <span
              :class="[
                'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 whitespace-nowrap',
                lab.status === 'Active'
                  ? 'bg-emerald-50 text-dark-green border-emerald-200'
                  : lab.status === 'Maintenance'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
              ]"
            >
              {{ lab.status === 'Active' ? 'Tersedia' : lab.status === 'Maintenance' ? 'Pemeliharaan' : 'Ditutup' }}
            </span>
          </div>

          <div class="space-y-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap min-w-0">
              <h3 class="text-base font-extrabold text-text-primary group-hover:text-dark-green transition-colors truncate min-w-0">
                {{ lab.name }}
              </h3>
              <span class="px-1.5 py-0.2 rounded bg-gray-100 text-text-muted text-[10px] font-mono font-bold shrink-0">
                {{ lab.code }}
              </span>
            </div>
            <p class="text-[11px] text-text-muted font-medium truncate flex items-center gap-1">
              <Building2 :size="12" class="text-text-muted shrink-0" />
              <span>{{ lab.location }}</span>
            </p>
          </div>

          <!-- Maximum Capacity Info -->
          <div class="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
            <span class="text-text-muted font-medium">Kapasitas Maksimum</span>
            <span class="font-extrabold text-text-primary flex items-center gap-1">
              <Users :size="13" class="text-dark-green" />
              {{ lab.maximumCapacity }} mahasiswa
            </span>
          </div>
        </div>

        <!-- Card Action Dual Buttons Footer -->
        <div class="pt-3 border-t border-gray-100 flex items-center gap-2" @click.stop>
          <button
            @click="navigateTo(`/lecturer/laboratories/${lab.id}`)"
            class="flex-1 py-2 px-3 rounded-xl border border-gray-200/80 bg-surface/50 hover:bg-brand-50 hover:text-dark-green text-text-secondary text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            <span>Detail</span>
            <ChevronRight :size="13" />
          </button>

          <button
            @click="handleBookLab(lab)"
            :disabled="lab.status !== 'Active'"
            class="flex-1 py-2 px-3 rounded-xl bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
          >
            <Plus :size="13" stroke-width="2.5" />
            <span>Pinjam Lab</span>
          </button>
        </div>
      </div>

    </div>

    <!-- 5. Search Empty State -->
    <div v-else class="bg-white p-12 rounded-2xl border border-gray-200/70 shadow-2xs text-center space-y-3 w-full min-w-0">
      <div class="w-12 h-12 rounded-2xl bg-surface border border-gray-200 text-text-muted mx-auto flex items-center justify-center">
        <FlaskConical :size="24" />
      </div>
      <div class="space-y-1">
        <h4 class="text-sm font-bold text-text-primary">Laboratorium tidak ditemukan</h4>
        <p class="text-xs text-text-muted max-w-sm mx-auto">
          Coba sesuaikan kata kunci pencarian atau kriteria filter untuk menemukan ruangan lab.
        </p>
      </div>
      <button
        @click="resetFilters"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer mt-2"
      >
        <RefreshCw :size="14" />
        <span>Hapus Filter</span>
      </button>
    </div>

  </div>
</template>
