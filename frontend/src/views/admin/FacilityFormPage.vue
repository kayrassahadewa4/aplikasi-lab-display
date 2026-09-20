<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import { useLaboranNavStore } from '@/stores/laboran-nav.store'
import {
  ArrowLeft,
  Wrench,
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
  Tag,
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

const facilityId = computed(() => route.params.id as string | undefined)
const isEditMode = computed(() => !!facilityId.value)

// Form State
const form = ref({
  name: '',
  code: '',
  category: '',
  description: '',
})

const isLoading = ref(false)
const isSaving = ref(false)
const error = ref<string | null>(null)
const showToast = ref(false)
const toastMessage = ref('')

onMounted(async () => {
  if (isEditMode.value && facilityId.value) {
    await loadFacility(facilityId.value)
  } else {
    if (isLaboran.value) {
      laboranNav.setBreadcrumbs([
        { label: 'Portal Laboran', path: '/laboran' },
        { label: 'Fasilitas Lab', path: '/laboran/facilities' },
        { label: 'Tambah Fasilitas' },
      ])
    } else {
      adminNav.setBreadcrumbs([
        { label: 'Dashboard', path: '/admin' },
        { label: 'Fasilitas Lab', path: '/admin/facilities' },
        { label: 'Tambah Fasilitas' },
      ])
    }
  }
})

const loadFacility = async (id: string) => {
  isLoading.value = true
  error.value = null

  try {
    const facility = await facilityService.getFacilityById(id)
    form.value = {
      name: facility.name,
      code: facility.code,
      category: 'Equipment',
      description: facility.description,
    }

    if (isLaboran.value) {
      laboranNav.setBreadcrumbs([
        { label: 'Portal Laboran', path: '/laboran' },
        { label: 'Fasilitas Lab', path: '/laboran/facilities' },
        { label: facility.name, path: `/laboran/facilities/${facility.id}` },
        { label: 'Ubah' },
      ])
    } else {
      adminNav.setBreadcrumbs([
        { label: 'Dashboard', path: '/admin' },
        { label: 'Fasilitas Lab', path: '/admin/facilities' },
        { label: facility.name, path: `/admin/facilities/${facility.id}` },
        { label: 'Ubah' },
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

const handleSave = async () => {
  if (!form.value.name || !form.value.code || !form.value.category) return

  isSaving.value = true
  error.value = null

  try {
    if (isEditMode.value && facilityId.value) {
      await facilityService.updateFacility(facilityId.value, {
        name: form.value.name.trim(),
        code: form.value.code.toUpperCase().trim(),
        category: form.value.category.trim(),
        description: form.value.description ? form.value.description.trim() : undefined,
      })
      toastMessage.value = 'Aset fasilitas berhasil diperbarui.'
    } else {
      await facilityService.createFacility({
        name: form.value.name.trim(),
        code: form.value.code.toUpperCase().trim(),
        category: form.value.category.trim(),
        description: form.value.description ? form.value.description.trim() : undefined,
      })
      toastMessage.value = 'Aset fasilitas baru berhasil ditambahkan.'
    }

    showToast.value = true
    setTimeout(() => {
      showToast.value = false
      if (isEditMode.value && facilityId.value) {
        router.push(`${basePath.value}/facilities/${facilityId.value}`)
      } else {
        router.push(`${basePath.value}/facilities`)
      }
    }, 1000)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Gagal menyimpan fasilitas'
    console.error('Failed to save facility:', err)
  } finally {
    isSaving.value = false
  }
}

const handleCancel = () => {
  if (isEditMode.value && facilityId.value) {
    router.push(`${basePath.value}/facilities/${facilityId.value}`)
  } else {
    router.push(`${basePath.value}/facilities`)
  }
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
        <span>Kembali ke Fasilitas Lab</span>
      </button>

      <div class="pb-3 border-b border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
              {{ isEditMode ? 'Ubah Aset Fasilitas' : 'Tambah Aset Fasilitas' }}
            </h1>
            <span class="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-brand-100 text-dark-green text-xs font-extrabold border border-brand-200">
              <Sparkles :size="13" />
              <span>{{ isEditMode ? 'Data Aset' : 'Aset Baru' }}</span>
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted font-medium">
            {{ isEditMode ? 'Perbarui spesifikasi peralatan dan data induk aset.' : 'Daftarkan aset peralatan, furnitur, atau perangkat keras baru ke katalog induk laboratorium.' }}
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

    <!-- Error Alert -->
    <div
      v-if="error"
      class="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-xs shadow-2xs"
    >
      <AlertTriangle :size="18" class="text-red-600 shrink-0 mt-0.5" />
      <div class="flex-1">
        <p class="font-bold text-red-800">Gagal</p>
        <p class="text-red-700 mt-1">{{ error }}</p>
      </div>
      <button @click="error = null" class="text-red-600 hover:opacity-80 cursor-pointer">
        <X :size="14" />
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-20 text-center">
      <div class="inline-flex items-center gap-3 text-text-muted">
        <Loader2 :size="24" class="animate-spin text-dark-green" />
        <span class="text-xs font-medium">Memuat data fasilitas lab...</span>
      </div>
    </div>

    <!-- 2. MAIN 2-COLUMN GRID (8 COLS FORM + 4 COLS SIDEBAR) -->
    <form v-if="!isLoading" @submit.prevent="handleSave" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- ======================================================== -->
      <!-- LEFT COLUMN: MAIN FORM SECTIONS (8 COLS)                 -->
      <!-- ======================================================== -->
      <div class="lg:col-span-8 space-y-5">
        <!-- Section 1: Basic Identity -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 sm:p-7 space-y-5">
          <div class="flex items-center gap-3 border-b border-gray-100 pb-3.5">
            <div class="w-10 h-10 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <Wrench :size="20" stroke-width="2.2" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-text-primary tracking-tight">Identifikasi Aset</h3>
              <p class="text-xs text-text-muted">Tentukan nama peralatan, kode aset unik, dan klasifikasi kategori.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1.5 sm:col-span-2">
              <label class="block font-bold text-text-primary">
                Nama Fasilitas / Peralatan <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                placeholder="mis. Desktop Workstation Intel Core i7"
                required
                maxlength="100"
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">
                Kode Aset <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.code"
                type="text"
                placeholder="mis. FAC-PC-001"
                required
                maxlength="20"
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-mono font-bold text-dark-green focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white uppercase transition-colors"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">
                Kategori <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.category"
                type="text"
                placeholder="mis. Elektronik, Furnitur, Jaringan"
                required
                maxlength="50"
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        <!-- Section 2: Technical Specifications -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 sm:p-7 space-y-5">
          <div class="flex items-center gap-3 border-b border-gray-100 pb-3.5">
            <div class="w-10 h-10 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <FileText :size="20" stroke-width="2.2" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-text-primary tracking-tight">Spesifikasi Teknis</h3>
              <p class="text-xs text-text-muted">Dokumentasikan spesifikasi perangkat keras, rincian model, atau petunjuk pemeliharaan.</p>
            </div>
          </div>

          <div class="space-y-1.5 text-xs">
            <label class="block font-bold text-text-primary">
              Deskripsi & Spesifikasi Perangkat Keras
            </label>
            <textarea
              v-model="form.description"
              rows="4"
              maxlength="1000"
              placeholder="mis. Intel Core i7-12700, 32GB DDR4 RAM, 1TB NVMe SSD, NVIDIA RTX 3060 12GB..."
              class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-medium text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white resize-none leading-relaxed transition-colors"
            ></textarea>
            <p class="text-[11px] text-text-muted">Penempatan laboratorium dan jumlah inventaris ditautkan per ruangan pada modul Fasilitas Laboratorium.</p>
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
              <span>Ringkasan Aset</span>
            </h4>
            <span class="px-2 py-0.5 rounded-full bg-brand-50 text-dark-green font-mono text-[10px] font-extrabold border border-brand-200/60">
              FASILITAS
            </span>
          </div>

          <div class="space-y-3 text-xs">
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Nama Aset</span>
              <span class="font-bold text-text-primary truncate max-w-[170px] text-right">{{ form.name || 'Tanpa Nama' }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Kode</span>
              <span class="font-mono font-extrabold text-dark-green">{{ form.code ? form.code.toUpperCase() : 'BELUM DIISI' }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Kategori</span>
              <span class="font-bold text-text-secondary">{{ form.category || 'Belum Ditentukan' }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5">
              <span class="text-text-muted font-medium">Spesifikasi</span>
              <span class="text-text-secondary font-medium text-[11px] truncate max-w-[170px]">
                {{ form.description ? `${form.description.slice(0, 30)}...` : 'Belum ada' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Inventory Guidelines Card -->
        <div class="bg-brand-50/60 rounded-2xl border border-brand-200/80 p-5 space-y-2.5 text-xs">
          <div class="flex items-center gap-2 font-bold text-dark-green">
            <ShieldCheck :size="16" />
            <span>Panduan Katalog Aset</span>
          </div>
          <ul class="text-[11px] text-text-secondary space-y-1.5 list-disc list-inside leading-relaxed">
            <li>Kode aset harus unik di seluruh inventaris institusi.</li>
            <li>Tetapkan kategori standar untuk mempermudah penyaringan laboratorium.</li>
            <li>Spesifikasi detail membantu dosen dalam memverifikasi kesiapan perangkat praktikum.</li>
          </ul>
        </div>

        <!-- Sticky Primary Action Buttons Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-3">
          <button
            type="submit"
            :disabled="isSaving || !form.name || !form.code || !form.category"
            class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#3B694A] to-[#2D5A3F] hover:from-[#31573E] hover:to-[#244430] text-white font-extrabold text-xs shadow-xs shadow-[#2D5A3F]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="isSaving" :size="16" class="animate-spin" />
            <Save v-else-if="isEditMode" :size="16" />
            <Plus v-else :size="16" />
            <span>{{ isSaving ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Tambah Fasilitas') }}</span>
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
