<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  X,
  Save,
  Plus,
  AlertTriangle,
  Sparkles,
  Eye,
  ShieldCheck,
  Loader2,
  Users,
  MapPin,
  Layers
} from 'lucide-vue-next'
import type { LaboratoryData } from '@/mocks/admin-laboratories.mock'
import { laboratoryService } from '@/services/laboratory.service'

const route = useRoute()
const router = useRouter()
const navStore = useAdminNavStore()

const labId = computed(() => route.params.id as string | undefined)
const isEditMode = computed(() => !!labId.value)

// Form State
const form = ref({
  name: '',
  code: '',
  location: '',
  maximumCapacity: 30,
  status: 'Active' as LaboratoryData['status'],
  description: '',
})

const isLoading = ref(false)
const isSaving = ref(false)
const error = ref<string | null>(null)
const showToast = ref(false)
const toastMessage = ref('')

onMounted(async () => {
  if (isEditMode.value && labId.value) {
    await loadLaboratory(labId.value)
  } else {
    navStore.setBreadcrumbs([
      { label: 'Dashboard', path: '/admin' },
      { label: 'Laboratorium', path: '/admin/laboratories' },
      { label: 'Tambah Laboratorium' },
    ])
  }
})

const loadLaboratory = async (id: string) => {
  isLoading.value = true
  error.value = null

  try {
    const laboratory = await laboratoryService.getLaboratoryById(id)
    form.value = {
      name: laboratory.name,
      code: laboratory.code,
      location: laboratory.location,
      maximumCapacity: laboratory.maximumCapacity,
      status: laboratory.status,
      description: laboratory.facilitiesList ? laboratory.facilitiesList.join('\n') : '',
    }

    navStore.setBreadcrumbs([
      { label: 'Dashboard', path: '/admin' },
      { label: 'Laboratorium', path: '/admin/laboratories' },
      { label: laboratory.name, path: `/admin/laboratories/${laboratory.id}` },
      { label: 'Ubah' },
    ])
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Gagal memuat data laboratorium'
    console.error('Failed to load laboratory:', err)
    setTimeout(() => router.push('/admin/laboratories'), 2000)
  } finally {
    isLoading.value = false
  }
}

const handleSave = async () => {
  if (!form.value.name || !form.value.code) return

  isSaving.value = true
  error.value = null

  try {
    if (isEditMode.value && labId.value) {
      await laboratoryService.updateLaboratory(labId.value, {
        name: form.value.name.trim(),
        code: form.value.code.toUpperCase().trim(),
        location: form.value.location.trim(),
        maximum_capacity: form.value.maximumCapacity,
        status: form.value.status,
        description: form.value.description ? form.value.description.trim() : undefined,
      })
      toastMessage.value = 'Laboratorium berhasil diperbarui.'
    } else {
      await laboratoryService.createLaboratory({
        name: form.value.name.trim(),
        code: form.value.code.toUpperCase().trim(),
        location: form.value.location.trim(),
        maximum_capacity: form.value.maximumCapacity,
        status: form.value.status,
        description: form.value.description ? form.value.description.trim() : undefined,
      })
      toastMessage.value = 'Laboratorium baru berhasil ditambahkan.'
    }

    showToast.value = true
    setTimeout(() => {
      showToast.value = false
      if (isEditMode.value && labId.value) {
        router.push(`/admin/laboratories/${labId.value}`)
      } else {
        router.push('/admin/laboratories')
      }
    }, 1000)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Gagal menyimpan laboratorium'
    console.error('Failed to save laboratory:', err)
  } finally {
    isSaving.value = false
  }
}

const handleCancel = () => {
  if (isEditMode.value && labId.value) {
    router.push(`/admin/laboratories/${labId.value}`)
  } else {
    router.push('/admin/laboratories')
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
        <span>Kembali ke Laboratorium</span>
      </button>

      <div class="pb-3 border-b border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
              {{ isEditMode ? 'Ubah Laboratorium' : 'Tambah Laboratorium' }}
            </h1>
            <span class="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-brand-100 text-dark-green text-xs font-extrabold border border-brand-200">
              <Sparkles :size="13" />
              <span>{{ isEditMode ? 'Data Ruangan' : 'Ruang Lab Baru' }}</span>
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted font-medium">
            {{ isEditMode ? 'Perbarui kapasitas ruangan, lokasi fisik, dan spesifikasi laboratorium.' : 'Daftarkan ruang laboratorium baru ke dalam matriks penjadwalan universitas.' }}
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
        <span class="text-xs font-medium">Memuat data laboratorium...</span>
      </div>
    </div>

    <!-- 2. MAIN 2-COLUMN GRID (8 COLS FORM + 4 COLS SIDEBAR) -->
    <form v-if="!isLoading" @submit.prevent="handleSave" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- ======================================================== -->
      <!-- LEFT COLUMN: MAIN FORM SECTIONS (8 COLS)                 -->
      <!-- ======================================================== -->
      <div class="lg:col-span-8 space-y-5">
        <!-- Section 1: Laboratory Master Details -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 sm:p-7 space-y-5">
          <div class="flex items-center gap-3 border-b border-gray-100 pb-3.5">
            <div class="w-10 h-10 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <Building2 :size="20" stroke-width="2.2" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-text-primary tracking-tight">Informasi Ruangan</h3>
              <p class="text-xs text-text-muted">Nama laboratorium, kode ruang unik, lokasi fisik, dan batas kapasitas kursi.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1.5 sm:col-span-2">
              <label class="block font-bold text-text-primary">
                Nama Laboratorium <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                placeholder="mis. Laboratorium Rekayasa Perangkat Lunak"
                required
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">
                Kode Ruang <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.code"
                type="text"
                placeholder="mis. LAB-RPL"
                required
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-mono font-bold text-dark-green focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white uppercase transition-colors"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">
                Lokasi / Lantai <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.location"
                type="text"
                placeholder="mis. Gedung A · Lantai 2 · Ruang 204"
                required
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">
                Kapasitas Maksimal (Kursi) <span class="text-red-500">*</span>
              </label>
              <input
                v-model.number="form.maximumCapacity"
                type="number"
                min="1"
                max="200"
                required
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">
                Status Operasional <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.status"
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors cursor-pointer"
              >
                <option value="Active">Aktif (Tersedia untuk Dipinjam)</option>
                <option value="Maintenance">Pemeliharaan (Dibatasi)</option>
                <option value="Closed">Ditutup (Tidak Tersedia)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Section 2: Room Notes & Environment -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 sm:p-7 space-y-5">
          <div class="flex items-center gap-3 border-b border-gray-100 pb-3.5">
            <div class="w-10 h-10 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <Layers :size="20" stroke-width="2.2" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-text-primary tracking-tight">Deskripsi & Fasilitas Ruangan</h3>
              <p class="text-xs text-text-muted">Catatan singkat tentang spesifikasi lab, perangkat lunak terpasang, atau ringkasan peralatan.</p>
            </div>
          </div>

          <div class="space-y-1.5 text-xs">
            <label class="block font-bold text-text-primary">
              Deskripsi / Catatan (Opsional)
            </label>
            <textarea
              v-model="form.description"
              rows="4"
              placeholder="mis. Dilengkapi dengan 35 workstation spesifikasi tinggi, proyektor ganda, LAN gigabit kecepatan tinggi, dan pendingin ruangan terpusat..."
              class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-medium text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white resize-none leading-relaxed transition-colors"
            ></textarea>
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
              <span>Ringkasan Ruangan</span>
            </h4>
            <span
              :class="[
                'px-2 py-0.5 rounded-full text-[10px] font-extrabold border',
                form.status === 'Active'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : form.status === 'Maintenance'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
              ]"
            >
              {{ form.status === 'Active' ? 'Aktif' : form.status === 'Maintenance' ? 'Pemeliharaan' : 'Ditutup' }}
            </span>
          </div>

          <div class="space-y-3 text-xs">
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Nama Ruangan</span>
              <span class="font-bold text-text-primary truncate max-w-[170px] text-right">{{ form.name || 'Tanpa Nama' }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Kode</span>
              <span class="font-mono font-extrabold text-dark-green">{{ form.code ? form.code.toUpperCase() : 'BELUM DIISI' }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Lokasi</span>
              <span class="font-bold text-text-secondary truncate max-w-[170px] text-right">{{ form.location || 'Belum Ditentukan' }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5">
              <span class="text-text-muted font-medium">Kapasitas</span>
              <span class="font-bold text-dark-green">{{ form.maximumCapacity }} Kursi</span>
            </div>
          </div>
        </div>

        <!-- Space Management Guidelines Card -->
        <div class="bg-brand-50/60 rounded-2xl border border-brand-200/80 p-5 space-y-2.5 text-xs">
          <div class="flex items-center gap-2 font-bold text-dark-green">
            <ShieldCheck :size="16" />
            <span>Catatan Pengelolaan Ruangan</span>
          </div>
          <ul class="text-[11px] text-text-secondary space-y-1.5 list-disc list-inside leading-relaxed">
            <li>Kode ruang ditampilkan di seluruh kartu jadwal dan layar display kiosk.</li>
            <li>Kapasitas mencegah dosen mengajukan peminjaman melebihi jumlah peserta yang diizinkan.</li>
            <li>Menetapkan status ke <strong>Pemeliharaan</strong> akan langsung memblokir reservasi ruangan.</li>
          </ul>
        </div>

        <!-- Sticky Primary Action Buttons Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-3">
          <button
            type="submit"
            :disabled="isSaving || !form.name || !form.code"
            class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#3B694A] to-[#2D5A3F] hover:from-[#31573E] hover:to-[#244430] text-white font-extrabold text-xs shadow-xs shadow-[#2D5A3F]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="isSaving" :size="16" class="animate-spin" />
            <Save v-else-if="isEditMode" :size="16" />
            <Plus v-else :size="16" />
            <span>{{ isSaving ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Tambah Laboratorium') }}</span>
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
