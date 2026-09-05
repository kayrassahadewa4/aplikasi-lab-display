<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  X,
  Save,
  Plus,
  AlertTriangle,
  Layers,
  Sparkles,
  Eye,
  ShieldCheck,
  Loader2,
  Building2,
  Calendar
} from 'lucide-vue-next'
import type { OperationalHourData } from '@/mocks/admin-operational-hours.mock'
import { operationalHourService } from '@/services/operational-hour.service'
import { laboratoryService } from '@/services/laboratory.service'
import type { LaboratoryData } from '@/mocks/admin-laboratories.mock'
import TimePicker24 from '@/components/common/TimePicker24.vue'

const route = useRoute()
const router = useRouter()
const navStore = useAdminNavStore()

const hourId = computed(() => route.params.id as string | undefined)
const isEditMode = computed(() => !!hourId.value)

// Form State
const form = ref({
  laboratoryId: '',
  day: 'Monday' as OperationalHourData['day'],
  openTime: '08:00',
  closeTime: '17:00',
})

const showToast = ref(false)
const toastMessage = ref('')
const isLoading = ref(false)
const isSaving = ref(false)
const error = ref<string | null>(null)

// Laboratory data for dropdown
const laboratoriesList = ref<LaboratoryData[]>([])
const isLoadingLaboratories = ref(false)

const selectedLabName = computed(() => {
  const found = laboratoriesList.value.find((l) => l.id === form.value.laboratoryId)
  return found ? `${found.code} - ${found.name}` : ''
})

const operatingDurationHours = computed(() => {
  if (!form.value.openTime || !form.value.closeTime) return ''
  const [openH, openM] = form.value.openTime.split(':').map(Number)
  const [closeH, closeM] = form.value.closeTime.split(':').map(Number)
  if (openH === undefined || closeH === undefined) return ''
  const diffMinutes = (closeH * 60 + (closeM || 0)) - (openH * 60 + (openM || 0))
  if (diffMinutes <= 0) return 'Rentang Tidak Valid'
  const hours = Math.floor(diffMinutes / 60)
  const mins = diffMinutes % 60
  return mins > 0 ? `${hours}j ${mins}m` : `${hours} jam`
})

// Load laboratories for dropdown
const loadLaboratories = async () => {
  isLoadingLaboratories.value = true
  try {
    const { laboratories } = await laboratoryService.getLaboratories({
      page: 1,
      limit: 100,
    })
    laboratoriesList.value = laboratories
  } catch (err: any) {
    console.error('Failed to load laboratories:', err)
    error.value = 'Gagal memuat laboratorium. Silakan segarkan halaman.'
  } finally {
    isLoadingLaboratories.value = false
  }
}

// Load existing operational hour in edit mode
const loadOperationalHour = async () => {
  if (!hourId.value) return

  isLoading.value = true
  error.value = null

  try {
    const operationalHour = await operationalHourService.getOperationalHourById(hourId.value)

    form.value = {
      laboratoryId: operationalHour.laboratoryId || '',
      day: operationalHour.day,
      openTime: operationalHour.openTime,
      closeTime: operationalHour.closeTime,
    }

    navStore.setBreadcrumbs([
      { label: 'Dashboard', path: '/admin' },
      { label: 'Jam Operasional', path: '/admin/operational-hours' },
      { label: operationalHour.day },
      { label: 'Ubah' },
    ])
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Gagal memuat jam operasional'
    console.error('Failed to load operational hour:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadLaboratories()

  if (isEditMode.value) {
    await loadOperationalHour()
  } else {
    navStore.setBreadcrumbs([
      { label: 'Dashboard', path: '/admin' },
      { label: 'Jam Operasional', path: '/admin/operational-hours' },
      { label: 'Tambah Jadwal' },
    ])
  }
})

const handleSave = async () => {
  if (!form.value.laboratoryId) {
    error.value = 'Silakan pilih laboratorium'
    return
  }

  isSaving.value = true
  error.value = null

  try {
    if (isEditMode.value && hourId.value) {
      await operationalHourService.updateOperationalHour(hourId.value, {
        laboratoryId: form.value.laboratoryId,
        day: form.value.day,
        openTime: form.value.openTime,
        closeTime: form.value.closeTime,
      })
      toastMessage.value = 'Jam operasional berhasil diperbarui.'
    } else {
      await operationalHourService.createOperationalHour({
        laboratoryId: form.value.laboratoryId,
        day: form.value.day,
        openTime: form.value.openTime,
        closeTime: form.value.closeTime,
      })
      toastMessage.value = 'Jadwal operasional baru berhasil dibuat.'
    }

    showToast.value = true
    setTimeout(() => {
      showToast.value = false
      router.push('/admin/operational-hours')
    }, 1500)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Gagal menyimpan jam operasional'
    console.error('Failed to save operational hour:', err)
  } finally {
    isSaving.value = false
  }
}

const handleCancel = () => {
  router.push('/admin/operational-hours')
}
</script>

<template>
  <div class="space-y-6 pb-12 select-none w-full max-w-full min-w-0">
    <!-- 1. TOP HEADER & BREADCRUMB BACK LINK -->
    <div>
      <button
        @click="handleCancel"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-dark-green hover:underline mb-2 cursor-pointer"
      >
        <ArrowLeft :size="14" />
        <span>Kembali ke Jam Operasional</span>
      </button>

      <div class="pb-3 border-b border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
              {{ isEditMode ? 'Ubah Jam Operasional' : 'Tambah Jam Operasional' }}
            </h1>
            <span class="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-brand-100 text-dark-green text-xs font-extrabold border border-brand-200">
              <Sparkles :size="13" />
              <span>{{ isEditMode ? 'Jadwal Aktif' : 'Jadwal Baru' }}</span>
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted font-medium">
            {{ isEditMode ? 'Perbarui jam buka dan tutup operasional laboratorium harian.' : 'Konfigurasi jam buka dan tutup operasional laboratorium harian.' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-20 text-center">
      <div class="inline-flex items-center gap-3 text-text-muted">
        <Loader2 :size="24" class="animate-spin text-dark-green" />
        <span class="text-xs font-medium">Memuat jam operasional...</span>
      </div>
    </div>

    <!-- Error Alert -->
    <div
      v-if="error"
      class="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-xs shadow-2xs"
    >
      <AlertTriangle :size="18" class="text-red-600 shrink-0 mt-0.5" />
      <div class="flex-1">
        <p class="font-bold text-red-800">Terjadi Kesalahan</p>
        <p class="text-red-700 mt-1">{{ error }}</p>
      </div>
      <button @click="error = null" class="text-red-600 hover:text-red-800 cursor-pointer">
        <X :size="16" />
      </button>
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

    <!-- 2. MAIN 2-COLUMN GRID (8 COLS FORM + 4 COLS SIDEBAR) -->
    <form v-if="!isLoading" @submit.prevent="handleSave" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- ======================================================== -->
      <!-- LEFT COLUMN: MAIN FORM SECTIONS (8 COLS)                 -->
      <!-- ======================================================== -->
      <div class="lg:col-span-8 space-y-5">
        <!-- Section 1: Laboratory Selection -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 sm:p-7 space-y-5">
          <div class="flex items-center gap-3 border-b border-gray-100 pb-3.5">
            <div class="w-10 h-10 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <Building2 :size="20" stroke-width="2.2" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-text-primary tracking-tight">Laboratorium Tujuan</h3>
              <p class="text-xs text-text-muted">Pilih ruang laboratorium spesifik untuk jadwal ini.</p>
            </div>
          </div>

          <div class="space-y-4 text-xs">
            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">
                Ruang Laboratorium <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.laboratoryId"
                required
                :disabled="isLoadingLaboratories"
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white disabled:opacity-50 transition-colors"
              >
                <option value="" disabled>{{ isLoadingLaboratories ? 'Memuat laboratorium...' : 'Pilih ruang laboratorium' }}</option>
                <option
                  v-for="lab in laboratoriesList"
                  :key="lab.id"
                  :value="lab.id"
                >
                  {{ lab.code }} — {{ lab.name }} ({{ lab.location || 'Gedung Utama' }})
                </option>
              </select>
              <p class="text-[11px] text-text-muted">Rentang operasional berlaku secara unik per ruang laboratorium.</p>
            </div>
          </div>
        </div>

        <!-- Section 2: Day & Operating Window -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 sm:p-7 space-y-5">
          <div class="flex items-center gap-3 border-b border-gray-100 pb-3.5">
            <div class="w-10 h-10 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <Clock :size="20" stroke-width="2.2" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-text-primary tracking-tight">Rentang Operasional</h3>
              <p class="text-xs text-text-muted">Konfigurasi waktu operasional harian dalam format 24 jam Waktu Indonesia Barat (WIB).</p>
            </div>
          </div>

          <div class="space-y-4 text-xs">
            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">
                Hari Operasional <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.day"
                required
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              >
                <option value="Monday">Senin</option>
                <option value="Tuesday">Selasa</option>
                <option value="Wednesday">Rabu</option>
                <option value="Thursday">Kamis</option>
                <option value="Friday">Jumat</option>
                <option value="Saturday">Sabtu</option>
                <option value="Sunday">Minggu</option>
              </select>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <TimePicker24
                v-model="form.openTime"
                label="Waktu Buka"
                :required="true"
                min-time="06:00"
                max-time="20:00"
                :step-minutes="30"
              />

              <TimePicker24
                v-model="form.closeTime"
                label="Waktu Tutup"
                :required="true"
                min-time="07:00"
                max-time="22:00"
                :step-minutes="30"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- RIGHT COLUMN: LIVE PREVIEW & ACTION SIDEBAR (4 COLS)     -->
      <!-- ======================================================== -->
      <div class="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
        <!-- Live Configuration Summary Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 sm:p-6 space-y-4">
          <div class="flex items-center justify-between border-b border-gray-100 pb-3">
            <h4 class="text-xs font-black uppercase tracking-wider text-text-primary flex items-center gap-2">
              <Eye :size="15" class="text-dark-green" />
              <span>Ringkasan Langsung</span>
            </h4>
            <span class="px-2 py-0.5 rounded-full bg-brand-50 text-dark-green font-mono text-[10px] font-extrabold border border-brand-200/60">
              WIB (UTC+7)
            </span>
          </div>

          <div class="space-y-3 text-xs">
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Lab Tujuan</span>
              <span class="font-bold text-text-primary truncate max-w-[170px] text-right">{{ selectedLabName || 'Belum dipilih' }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Hari Operasional</span>
              <span class="font-bold text-dark-green">{{ form.day }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Jam Operasional</span>
              <span class="font-mono font-bold text-text-primary">{{ form.openTime }} – {{ form.closeTime }} WIB</span>
            </div>
            <div class="flex items-center justify-between py-1.5">
              <span class="text-text-muted font-medium">Rentang Harian</span>
              <span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-extrabold font-mono">
                {{ operatingDurationHours || 'Dihitung' }}
              </span>
            </div>
          </div>
        </div>

        <!-- System Guidelines & Validation Card -->
        <div class="bg-brand-50/60 rounded-2xl border border-brand-200/80 p-5 space-y-2.5 text-xs">
          <div class="flex items-center gap-2 font-bold text-dark-green">
            <ShieldCheck :size="16" />
            <span>Panduan Operasional</span>
          </div>
          <ul class="text-[11px] text-text-secondary space-y-1.5 list-disc list-inside leading-relaxed">
            <li>Jam operasional menentukan batas rentang peminjaman yang diizinkan untuk dosen.</li>
            <li>Perubahan langsung berlaku di seluruh portal pengguna & Layar Display Publik.</li>
            <li>Setiap laboratorium maksimal memiliki satu konfigurasi jadwal per hari.</li>
          </ul>
        </div>

        <!-- Sticky Primary Action Buttons Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-3">
          <button
            type="submit"
            :disabled="isSaving || !form.laboratoryId"
            class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#3B694A] to-[#2D5A3F] hover:from-[#31573E] hover:to-[#244430] text-white font-extrabold text-xs shadow-xs shadow-[#2D5A3F]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="isSaving" :size="16" class="animate-spin" />
            <Save v-else-if="isEditMode" :size="16" />
            <Plus v-else :size="16" />
            <span>{{ isSaving ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Buat Jadwal') }}</span>
          </button>
          <button
            type="button"
            @click="handleCancel"
            :disabled="isSaving"
            class="w-full py-2.5 px-4 rounded-xl border border-gray-200/80 hover:bg-surface text-text-secondary font-bold text-xs transition-all cursor-pointer text-center disabled:opacity-50"
          >
            Batal & Kembali
          </button>
        </div>
      </div>
    </form>
  </div>
</template>
