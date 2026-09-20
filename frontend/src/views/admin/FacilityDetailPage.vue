<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import { useLaboranNavStore } from '@/stores/laboran-nav.store'
import {
  ArrowLeft,
  Wrench,
  Edit3,
  Trash2,
  Building2,
  CheckCircle2,
  X,
  AlertTriangle,
  Sparkles,
  Layers,
  ShieldCheck,
  Hash,
  Box,
  FileText
} from 'lucide-vue-next'
import type { FacilityData } from '@/mocks/admin-facilities.mock'
import { facilityService } from '@/services/facility.service'

const route = useRoute()
const router = useRouter()
const adminNav = useAdminNavStore()
const laboranNav = useLaboranNavStore()

const isLaboran = computed(() => route.path.startsWith('/laboran'))
const basePath = computed(() => (isLaboran.value ? '/laboran' : '/admin'))

const facilityId = route.params.id as string
const facility = ref<FacilityData | null>(null)
const isLoading = ref(false)
const isDeleting = ref(false)
const error = ref<string | null>(null)

const showDeleteConfirm = ref(false)
const showToast = ref(false)
const toastMessage = ref('')

onMounted(async () => {
  await loadFacility()
})

const loadFacility = async () => {
  isLoading.value = true
  error.value = null

  try {
    const fac = await facilityService.getFacilityById(facilityId)
    facility.value = fac

    if (isLaboran.value) {
      laboranNav.setBreadcrumbs([
        { label: 'Portal Laboran', path: '/laboran' },
        { label: 'Fasilitas Lab', path: '/laboran/facilities' },
        { label: fac.name },
      ])
    } else {
      adminNav.setBreadcrumbs([
        { label: 'Dashboard', path: '/admin' },
        { label: 'Fasilitas Lab', path: '/admin/facilities' },
        { label: fac.name },
      ])
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Gagal memuat data fasilitas lab'
    console.error('Failed to load facility:', err)
    setTimeout(() => router.push(`${basePath.value}/facilities`), 2000)
  } finally {
    isLoading.value = false
  }
}

const handleEdit = () => {
  router.push(`${basePath.value}/facilities/${facilityId}/edit`)
}

const handleDelete = async () => {
  isDeleting.value = true
  error.value = null

  try {
    await facilityService.deleteFacility(facilityId)
    showDeleteConfirm.value = false
    toastMessage.value = 'Aset fasilitas berhasil dihapus.'
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
      router.push(`${basePath.value}/facilities`)
    }, 1000)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Gagal menghapus fasilitas'
    console.error('Failed to delete facility:', err)
    showDeleteConfirm.value = false
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="flex items-center justify-center min-h-[400px]">
    <div class="text-center space-y-3">
      <div class="w-12 h-12 border-4 border-brand-200 border-t-dark-green rounded-full animate-spin mx-auto"></div>
      <p class="text-sm text-text-muted font-medium">Memuat data fasilitas lab...</p>
    </div>
  </div>

  <!-- Error State -->
  <div v-else-if="error && !facility" class="flex items-center justify-center min-h-[400px]">
    <div class="text-center space-y-4 max-w-md">
      <div class="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
        <AlertTriangle :size="32" class="text-red-600" />
      </div>
      <div>
        <h3 class="text-lg font-bold text-text-primary mb-1">Gagal Memuat Fasilitas</h3>
        <p class="text-sm text-text-muted">{{ error }}</p>
      </div>
      <button
        @click="loadFacility"
        class="px-4 py-2 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
      >
        Coba Lagi
      </button>
    </div>
  </div>

  <!-- Content State -->
  <div v-else-if="facility && !isLoading" class="space-y-6 pb-12 w-full max-w-full min-w-0 select-none">
    <!-- 1. TOP HEADER & BREADCRUMB -->
    <div>
      <router-link
        :to="basePath + '/facilities'"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-dark-green hover:underline mb-2 cursor-pointer"
      >
        <ArrowLeft :size="14" />
        <span>Kembali ke Fasilitas Lab</span>
      </router-link>

      <div class="pb-3 border-b border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
              {{ facility.name }}
            </h1>
            <span
              :class="[
                'px-3 py-0.5 rounded-full text-xs font-extrabold border',
                facility.status === 'Available'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : facility.status === 'In Use'
                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
              ]"
            >
              {{ facility.status === 'Available' ? 'Tersedia' : facility.status === 'In Use' ? 'Sedang Digunakan' : 'Pemeliharaan' }}
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted font-medium">
            Ditempatkan di {{ facility.labName }} ({{ facility.labCode }}) • {{ facility.quantity }} Unit Aktif
          </p>
        </div>
      </div>
    </div>

    <!-- Success Toast Feedback Banner -->
    <div
      v-if="showToast"
      class="p-3.5 rounded-2xl bg-brand-100/90 border border-brand-200 text-dark-green text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="flex items-center gap-2">
        <CheckCircle2 :size="16" class="text-dark-green shrink-0" />
        <span>{{ toastMessage }}</span>
      </div>
      <button @click="showToast = false" class="text-dark-green hover:opacity-80 cursor-pointer">
        <X :size="14" />
      </button>
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
              <Wrench :size="28" stroke-width="2.2" />
            </div>
            <div>
              <h2 class="text-lg font-extrabold text-text-primary">{{ facility.name }}</h2>
              <p class="text-xs text-text-muted mt-0.5 font-medium">Kode Aset: <span class="font-mono font-bold text-dark-green">{{ facility.code }}</span> • {{ facility.quantity }} Unit</p>
            </div>
          </div>
          <span class="text-xs font-mono font-bold text-dark-green bg-brand-50 px-3 py-1 rounded-full border border-brand-200/60 self-start sm:self-auto">
            Aset Inventaris FIK
          </span>
        </div>

        <!-- Structured Attributes & Details Grid -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 space-y-5">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-extrabold text-text-primary tracking-tight">Spesifikasi Peralatan & Fasilitas</h3>
            <p class="text-xs text-text-muted">Kode pengenal, lokasi fisik, dan metrik perangkat keras.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Hash :size="13" class="text-dark-green" />
                <span>Kode Aset</span>
              </div>
              <p class="text-xs font-mono font-black text-dark-green truncate">{{ facility.code }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Box :size="13" class="text-dark-green" />
                <span>Jumlah Inventaris</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ facility.quantity }} Unit</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Building2 :size="13" class="text-dark-green" />
                <span>Laboratorium Ditugaskan</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ facility.labName }} ({{ facility.labCode }})</p>
            </div>
          </div>
        </div>

        <!-- Asset Description Card -->
        <div v-if="facility.description" class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 space-y-4">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-extrabold text-text-primary tracking-tight">Deskripsi & Catatan Perangkat</h3>
            <p class="text-xs text-text-muted">Spesifikasi teknis dan riwayat pemeliharaan.</p>
          </div>

          <div class="p-4 rounded-xl bg-surface/60 border border-gray-200/70 text-xs text-text-primary leading-relaxed font-medium">
            {{ facility.description }}
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- RIGHT COLUMN: ACTIONS & CONTEXTUAL SIDEBAR (4 COLS)      -->
      <!-- ======================================================== -->
      <div class="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
        <!-- Action Management Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 sm:p-6 space-y-3">
          <h4 class="text-xs font-black uppercase tracking-wider text-text-primary">Tindakan Pengelolaan</h4>
          <button
            @click="handleEdit"
            class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#3B694A] to-[#2D5A3F] hover:from-[#31573E] hover:to-[#244430] text-white font-extrabold text-xs shadow-xs shadow-[#2D5A3F]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Edit3 :size="14" />
            <span>Ubah Fasilitas</span>
          </button>
          <button
            @click="showDeleteConfirm = true"
            :disabled="isDeleting"
            class="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Trash2 :size="14" />
            <span>Hapus Fasilitas</span>
          </button>
        </div>

        <!-- Assigned Location Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-3">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <h4 class="text-xs font-black uppercase tracking-wider text-text-secondary">Lokasi</h4>
            <span class="px-2 py-0.5 rounded-full bg-brand-100 font-mono text-[10px] font-bold text-dark-green">
              {{ facility.labCode }}
            </span>
          </div>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between py-1 border-b border-gray-50">
              <span class="text-text-muted">Ruang Laboratorium</span>
              <span class="font-bold text-text-primary truncate max-w-[170px] text-right">{{ facility.labName }}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-text-muted">Jumlah Terpasang</span>
              <span class="font-bold text-dark-green">{{ facility.quantity }} Unit</span>
            </div>
          </div>
        </div>

        <!-- System Audit Information -->
        <div class="bg-surface/60 rounded-2xl border border-gray-200/70 p-4 space-y-2 text-[11px] text-text-muted">
          <div class="flex justify-between">
            <span>UUID Aset</span>
            <span class="font-mono text-[10px] text-text-secondary truncate max-w-[140px]">{{ facility.id }}</span>
          </div>
          <div class="flex justify-between">
            <span>Kode Aset</span>
            <span class="font-mono font-bold text-dark-green">{{ facility.code }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal Dialog -->
    <div
      v-if="showDeleteConfirm"
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
          Apakah Anda yakin ingin menghapus <strong class="text-text-primary">{{ facility.name }}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            @click="showDeleteConfirm = false"
            :disabled="isDeleting"
            class="px-4 py-2 rounded-full border border-gray-200 text-text-primary font-semibold hover:bg-surface cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button
            @click="handleDelete"
            :disabled="isDeleting"
            class="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <div v-if="isDeleting" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>{{ isDeleting ? 'Menghapus...' : 'Hapus Aset' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
