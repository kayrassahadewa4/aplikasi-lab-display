<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  X,
  Save,
  Plus,
  AlertTriangle,
  Sparkles,
  Eye,
  ShieldCheck,
  Loader2,
  Clock,
  BookOpen
} from 'lucide-vue-next'
import type { AcademicPeriodData } from '@/mocks/admin-academic-calendar.mock'
import { academicCalendarService } from '@/services/academic-calendar.service'

const route = useRoute()
const router = useRouter()
const navStore = useAdminNavStore()

const periodId = computed(() => route.params.id as string | undefined)
const isEditMode = computed(() => !!periodId.value)

// Form State
const form = ref({
  academicYear: '2026/2027',
  semester: 'Odd Semester' as AcademicPeriodData['semester'],
  startDate: '2026-08-01',
  endDate: '2027-01-31',
  status: 'Active' as AcademicPeriodData['status'],
})

const isLoading = ref(false)
const isSaving = ref(false)
const error = ref<string | null>(null)
const showToast = ref(false)
const toastMessage = ref('')

const termDurationWeeks = computed(() => {
  if (!form.value.startDate || !form.value.endDate) return ''
  const start = new Date(form.value.startDate)
  const end = new Date(form.value.endDate)
  const diffTime = end.getTime() - start.getTime()
  if (diffTime <= 0) return 'Tanggal tidak valid'
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const weeks = Math.round(diffDays / 7)
  return `~${weeks} Minggu (${diffDays} hari)`
})

onMounted(async () => {
  if (isEditMode.value && periodId.value) {
    await loadCalendar(periodId.value)
  } else {
    navStore.setBreadcrumbs([
      { label: 'Dashboard', path: '/admin' },
      { label: 'Kalender Akademik', path: '/admin/academic-calendars' },
      { label: 'Tambah Periode Akademik' },
    ])
  }
})

const loadCalendar = async (id: string) => {
  isLoading.value = true
  error.value = null

  try {
    const calendar = await academicCalendarService.getAcademicCalendarById(id)
    form.value = {
      academicYear: calendar.academicYear,
      semester: calendar.semester,
      startDate: calendar.startDate,
      endDate: calendar.endDate,
      status: calendar.status,
    }

    navStore.setBreadcrumbs([
      { label: 'Dashboard', path: '/admin' },
      { label: 'Kalender Akademik', path: '/admin/academic-calendars' },
      { label: `${calendar.academicYear} ${calendar.semester}`, path: `/admin/academic-calendars/${calendar.id}` },
      { label: 'Ubah' },
    ])
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Gagal memuat kalender akademik'
    console.error('Failed to load academic calendar:', err)
    setTimeout(() => router.push('/admin/academic-calendars'), 2000)
  } finally {
    isLoading.value = false
  }
}

const handleSave = async () => {
  if (!form.value.academicYear || !form.value.startDate || !form.value.endDate) return

  isSaving.value = true
  error.value = null

  try {
    if (isEditMode.value && periodId.value) {
      await academicCalendarService.updateAcademicCalendar(periodId.value, {
        academicYear: form.value.academicYear.trim(),
        semester: form.value.semester,
        startDate: form.value.startDate,
        endDate: form.value.endDate,
        status: form.value.status,
      })
      toastMessage.value = 'Periode akademik berhasil diperbarui.'
    } else {
      await academicCalendarService.createAcademicCalendar({
        academicYear: form.value.academicYear.trim(),
        semester: form.value.semester,
        startDate: form.value.startDate,
        endDate: form.value.endDate,
        status: form.value.status,
      })
      toastMessage.value = 'Periode akademik baru berhasil ditambahkan.'
    }

    showToast.value = true
    setTimeout(() => {
      showToast.value = false
      if (isEditMode.value && periodId.value) {
        router.push(`/admin/academic-calendars/${periodId.value}`)
      } else {
        router.push('/admin/academic-calendars')
      }
    }, 1000)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Gagal menyimpan kalender akademik'
    console.error('Failed to save academic calendar:', err)
  } finally {
    isSaving.value = false
  }
}

const handleCancel = () => {
  if (isEditMode.value && periodId.value) {
    router.push(`/admin/academic-calendars/${periodId.value}`)
  } else {
    router.push('/admin/academic-calendars')
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
        <span>Kembali ke Kalender Akademik</span>
      </button>

      <div class="pb-3 border-b border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
              {{ isEditMode ? 'Ubah Periode Akademik' : 'Tambah Periode Akademik' }}
            </h1>
            <span class="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-brand-100 text-dark-green text-xs font-extrabold border border-brand-200">
              <Sparkles :size="13" />
              <span>{{ isEditMode ? 'Data Periode' : 'Periode Baru' }}</span>
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted font-medium">
            {{ isEditMode ? 'Perbarui rentang tahun akademik, tipe semester, dan status keaktifan.' : 'Konfigurasikan periode semester baru untuk penjadwalan praktikum laboratorium.' }}
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
        <span class="text-xs font-medium">Memuat kalender akademik...</span>
      </div>
    </div>

    <!-- 2. MAIN 2-COLUMN GRID (8 COLS FORM + 4 COLS SIDEBAR) -->
    <form v-if="!isLoading" @submit.prevent="handleSave" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- ======================================================== -->
      <!-- LEFT COLUMN: MAIN FORM SECTIONS (8 COLS)                 -->
      <!-- ======================================================== -->
      <div class="lg:col-span-8 space-y-5">
        <!-- Section 1: Period Identity -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 sm:p-7 space-y-5">
          <div class="flex items-center gap-3 border-b border-gray-100 pb-3.5">
            <div class="w-10 h-10 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <Calendar :size="20" stroke-width="2.2" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-text-primary tracking-tight">Penetapan Periode</h3>
              <p class="text-xs text-text-muted">Tentukan tahun akademik, semester, dan status keaktifan.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">
                Tahun Akademik <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.academicYear"
                type="text"
                placeholder="mis. 2026/2027"
                required
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">
                Semester <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.semester"
                required
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors cursor-pointer"
              >
                <option value="Odd Semester">Semester Ganjil</option>
                <option value="Even Semester">Semester Genap</option>
                <option value="Short / Summer Term">Semester Pendek / Antara</option>
              </select>
            </div>

            <div class="space-y-1.5 sm:col-span-2">
              <label class="block font-bold text-text-primary">
                Status Periode <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.status"
                required
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors cursor-pointer"
              >
                <option value="Active">Aktif (Semester Berjalan)</option>
                <option value="Upcoming">Mendatang (Semester Depan)</option>
                <option value="Completed">Selesai (Diarsipkan)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Section 2: Date Bounds -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 sm:p-7 space-y-5">
          <div class="flex items-center gap-3 border-b border-gray-100 pb-3.5">
            <div class="w-10 h-10 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <Clock :size="20" stroke-width="2.2" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-text-primary tracking-tight">Rentang Waktu & Batas Tanggal</h3>
              <p class="text-xs text-text-muted">Tentukan tanggal kalender mulai dan selesai untuk semester akademik ini.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">
                Tanggal Mulai <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.startDate"
                type="date"
                required
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">
                Tanggal Selesai <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.endDate"
                type="date"
                required
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
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
              <span>Ringkasan Periode</span>
            </h4>
            <span
              :class="[
                'px-2 py-0.5 rounded-full text-[10px] font-extrabold border',
                form.status === 'Active'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : form.status === 'Upcoming'
                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                    : 'bg-gray-100 text-text-muted border-gray-200'
              ]"
            >
              {{ form.status === 'Active' ? 'Aktif' : form.status === 'Upcoming' ? 'Mendatang' : 'Selesai' }}
            </span>
          </div>

          <div class="space-y-3 text-xs">
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Tahun Akademik</span>
              <span class="font-extrabold text-text-primary">{{ form.academicYear }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Semester</span>
              <span class="font-bold text-dark-green">{{ form.semester }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Rentang Tanggal</span>
              <span class="font-mono font-bold text-text-secondary text-[11px]">{{ form.startDate }} → {{ form.endDate }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5">
              <span class="text-text-muted font-medium">Estimasi Durasi</span>
              <span class="font-mono font-bold text-dark-green">{{ termDurationWeeks || 'Belum Lengkap' }}</span>
            </div>
          </div>
        </div>

        <!-- Academic Policy Guidelines Card -->
        <div class="bg-brand-50/60 rounded-2xl border border-brand-200/80 p-5 space-y-2.5 text-xs">
          <div class="flex items-center gap-2 font-bold text-dark-green">
            <ShieldCheck :size="16" />
            <span>Panduan Akademik</span>
          </div>
          <ul class="text-[11px] text-text-secondary space-y-1.5 list-disc list-inside leading-relaxed">
            <li>Menetapkan periode ke status <strong>Aktif</strong> akan menjadikannya periode default untuk jadwal perkuliahan.</li>
            <li>Tanggal selesai harus berada setelah tanggal mulai.</li>
            <li>Pastikan rentang semester sesuai dengan SK Akademik fakultas.</li>
          </ul>
        </div>

        <!-- Sticky Primary Action Buttons Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-3">
          <button
            type="submit"
            :disabled="isSaving || !form.academicYear || !form.startDate || !form.endDate"
            class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#3B694A] to-[#2D5A3F] hover:from-[#31573E] hover:to-[#244430] text-white font-extrabold text-xs shadow-xs shadow-[#2D5A3F]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="isSaving" :size="16" class="animate-spin" />
            <Save v-else-if="isEditMode" :size="16" />
            <Plus v-else :size="16" />
            <span>{{ isSaving ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Tambah Periode') }}</span>
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
