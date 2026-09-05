<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLaboranNavStore } from '@/stores/laboran-nav.store'
import {
  ArrowLeft,
  FlaskConical,
  Building2,
  Users,
  CheckCircle2,
  Activity,
  DoorOpen,
  Calendar,
  Wrench,
  Clock,
  Laptop,
  Monitor,
  Wifi,
  Video,
  Printer,
  Wind,
  Layers,
  Sparkles,
  FileText,
  Loader2,
  AlertCircle,
  Hash,
  MapPin,
  ShieldCheck
} from 'lucide-vue-next'
import { laboratoryService, type LaboratoryData } from '@/services/laboratory.service'

const route = useRoute()
const router = useRouter()
const navStore = useLaboranNavStore()

const labId = computed(() => route.params.id as string)
const labItem = ref<LaboratoryData | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')

onMounted(() => {
  navStore.setBreadcrumbs([
    { label: 'Portal Laboran', path: '/laboran' },
    { label: 'Laboratorium', path: '/laboran/laboratories' },
    { label: 'Detail Laboratorium' },
  ])
  loadLaboratory()
})

const loadLaboratory = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    labItem.value = await laboratoryService.getLaboratoryById(labId.value)
  } catch (err: any) {
    errorMessage.value = err.message || 'Gagal memuat data laboratorium'
  } finally {
    isLoading.value = false
  }
}

const getLabOperationalStatus = (lab: LaboratoryData): 'In Use' | 'Available' | 'Under Maintenance' => {
  if (lab.status === 'Maintenance') return 'Under Maintenance'
  if (lab.code === 'LAB-RPL' || lab.code === 'LAB-MM') return 'In Use'
  return 'Available'
}

const handleBack = () => {
  router.push('/laboran/laboratories')
}

const navigateToSchedules = () => {
  router.push('/laboran/schedules')
}

const navigateToRoomUsage = () => {
  router.push('/laboran/room-usage')
}
</script>

<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="flex items-center justify-center min-h-[400px]">
    <div class="text-center space-y-3">
      <div class="w-12 h-12 border-4 border-brand-200 border-t-dark-green rounded-full animate-spin mx-auto"></div>
      <p class="text-sm text-text-muted font-medium">Memuat detail laboratorium...</p>
    </div>
  </div>

  <!-- Error State -->
  <div v-else-if="errorMessage || !labItem" class="flex items-center justify-center min-h-[400px]">
    <div class="text-center space-y-4 max-w-md">
      <div class="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
        <AlertCircle :size="32" class="text-red-600" />
      </div>
      <div>
        <h3 class="text-lg font-bold text-text-primary mb-1">Gagal Memuat Laboratorium</h3>
        <p class="text-sm text-text-muted">{{ errorMessage || 'Data laboratorium tidak ditemukan.' }}</p>
      </div>
      <button
        @click="handleBack"
        class="px-4 py-2 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
      >
        Kembali ke Laboratorium
      </button>
    </div>
  </div>

  <!-- Content -->
  <div v-else class="space-y-6 pb-12 w-full max-w-full min-w-0 select-none">
    <!-- 1. Header & Navigation -->
    <div>
      <button
        @click="handleBack"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-dark-green hover:underline mb-2 cursor-pointer"
      >
        <ArrowLeft :size="14" />
        <span>Kembali ke Laboratorium</span>
      </button>

      <div class="pb-3 border-b border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
              {{ labItem.name }}
            </h1>
            <span
              :class="[
                'inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-extrabold border',
                getLabOperationalStatus(labItem) === 'In Use'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : getLabOperationalStatus(labItem) === 'Available'
                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
              ]"
            >
              <span v-if="getLabOperationalStatus(labItem) === 'In Use'" class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{{ getLabOperationalStatus(labItem) === 'In Use' ? 'Sedang Digunakan' : getLabOperationalStatus(labItem) === 'Available' ? 'Tersedia' : 'Dalam Pemeliharaan' }}</span>
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted font-medium">
            {{ labItem.location }} • Kapasitas Kursi: {{ labItem.maximumCapacity }} Kursi
          </p>
        </div>
      </div>
    </div>

    <!-- 2. MAIN 2-COLUMN GRID (8 COLS DATA + 4 COLS SIDEBAR) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- ======================================================== -->
      <!-- LEFT COLUMN: SPECIFICATIONS & CORE ATTRIBUTES (8 COLS)   -->
      <!-- ======================================================== -->
      <div class="lg:col-span-8 space-y-6">
        <!-- Hero Overview Banner Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <FlaskConical :size="28" stroke-width="2.2" />
            </div>
            <div>
              <h2 class="text-lg font-extrabold text-text-primary">{{ labItem.name }}</h2>
              <p class="text-xs text-text-muted mt-0.5 font-medium">Kode Ruang: <span class="font-mono font-bold text-dark-green">{{ labItem.code }}</span> • {{ labItem.location }}</p>
            </div>
          </div>
          <span class="text-xs font-mono font-bold text-dark-green bg-brand-50 px-3 py-1 rounded-full border border-brand-200/60 self-start sm:self-auto">
            Ruang Lab FIK
          </span>
        </div>

        <!-- Live Room Usage Hero if in use -->
        <div
          v-if="getLabOperationalStatus(labItem) === 'In Use'"
          class="p-5 rounded-2xl bg-gradient-to-r from-emerald-900 via-dark-green to-[#3a5840] text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-[11px] font-extrabold tracking-wide">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                OKUPANSI AKTIF
              </span>
              <span class="text-[11px] font-mono text-emerald-200 font-bold">08:00 – 10:00 WIB</span>
            </div>

            <h3 class="text-base font-extrabold text-white pt-0.5">
              Sesi Praktikum Berjalan
            </h3>
            <p class="text-xs text-emerald-100/90 font-medium">
              Pengawas resmi bertugas
            </p>
          </div>

          <button
            @click="navigateToRoomUsage"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-dark-green hover:bg-emerald-50 text-xs font-black shadow-xs active:scale-95 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <DoorOpen :size="15" />
            <span>Kelola Check-in Ruangan</span>
          </button>
        </div>

        <!-- Structured Attributes & Details Grid -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 space-y-5">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-extrabold text-text-primary tracking-tight">Spesifikasi Ruangan</h3>
            <p class="text-xs text-text-muted">Kapasitas, lokasi fisik, dan metrik operasional.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Hash :size="13" class="text-dark-green" />
                <span>Kode Ruang</span>
              </div>
              <p class="text-xs font-mono font-black text-dark-green truncate">{{ labItem.code }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Users :size="13" class="text-dark-green" />
                <span>Kapasitas Kursi</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ labItem.maximumCapacity }} Kursi</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <MapPin :size="13" class="text-dark-green" />
                <span>Gedung & Lantai</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ labItem.location }}</p>
            </div>
          </div>
        </div>

        <!-- Facilities & Equipment Section -->
        <div v-if="labItem.facilitiesList && labItem.facilitiesList.length > 0" class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 space-y-4">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-extrabold text-text-primary tracking-tight">Fasilitas & Peralatan Terpasang</h3>
            <p class="text-xs text-text-muted">Aset perangkat keras dan inventaris yang saat ini terverifikasi di ruang lab ini.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div
              v-for="(fac, idx) in labItem.facilitiesList"
              :key="idx"
              class="p-3.5 rounded-xl bg-surface/60 border border-gray-100 flex items-center gap-2.5 font-semibold text-text-primary"
            >
              <CheckCircle2 :size="15" class="text-dark-green shrink-0" />
              <span>{{ fac }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- RIGHT COLUMN: ACTIONS & CONTEXTUAL SIDEBAR (4 COLS)      -->
      <!-- ======================================================== -->
      <div class="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
        <!-- Action Management Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 sm:p-6 space-y-3">
          <h4 class="text-xs font-black uppercase tracking-wider text-text-primary">Aksi Laboratorium</h4>
          <button
            @click="navigateToRoomUsage"
            class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#3B694A] to-[#2D5A3F] hover:from-[#31573E] hover:to-[#244430] text-white font-extrabold text-xs shadow-xs shadow-[#2D5A3F]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <DoorOpen :size="14" />
            <span>Kelola Check-in Ruangan</span>
          </button>
          <button
            @click="navigateToSchedules"
            class="w-full py-2.5 px-4 rounded-xl border border-gray-200/80 bg-surface/60 hover:bg-brand-50 text-text-secondary font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Calendar :size="14" class="text-dark-green" />
            <span>Lihat Jadwal Hari Ini</span>
          </button>
        </div>

        <!-- Room Snapshot Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-3">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <h4 class="text-xs font-black uppercase tracking-wider text-text-secondary">Ringkasan Ruangan</h4>
            <span class="px-2 py-0.5 rounded-full bg-brand-100 font-mono text-[10px] font-bold text-dark-green">
              {{ labItem.code }}
            </span>
          </div>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between py-1 border-b border-gray-50">
              <span class="text-text-muted">Kapasitas Maksimal</span>
              <span class="font-bold text-text-primary">{{ labItem.maximumCapacity }} Kursi</span>
            </div>
            <div class="flex justify-between py-1 border-b border-gray-50">
              <span class="text-text-muted">Status Operasional</span>
              <span class="font-bold text-dark-green">{{ getLabOperationalStatus(labItem) === 'In Use' ? 'Sedang Digunakan' : getLabOperationalStatus(labItem) === 'Available' ? 'Tersedia' : 'Dalam Pemeliharaan' }}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-text-muted">Lokasi</span>
              <span class="font-medium text-text-secondary truncate max-w-[160px] text-right">{{ labItem.location }}</span>
            </div>
          </div>
        </div>

        <!-- System Audit Information -->
        <div class="bg-surface/60 rounded-2xl border border-gray-200/70 p-4 space-y-2 text-[11px] text-text-muted">
          <div class="flex justify-between">
            <span>UUID Ruangan</span>
            <span class="font-mono text-[10px] text-text-secondary truncate max-w-[140px]">{{ labItem.id }}</span>
          </div>
          <div class="flex justify-between">
            <span>Lingkup Fakultas</span>
            <span class="font-medium text-text-secondary">FIK UPNVJ</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
