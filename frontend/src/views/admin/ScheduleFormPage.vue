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
  Layers,
  GraduationCap,
  Sparkles,
  Eye,
  ShieldCheck,
  Loader2,
  Clock,
  Building2,
  Users,
  Repeat,
  ChevronDown,
  CalendarDays
} from 'lucide-vue-next'
import type { ScheduleData } from '@/mocks/admin-schedules.mock'
import { scheduleService } from '@/services/schedule.service'
import { laboratoryService } from '@/services/laboratory.service'
import { academicCalendarService } from '@/services/academic-calendar.service'
import type { LaboratoryData } from '@/mocks/admin-laboratories.mock'
import type { AcademicPeriodData } from '@/mocks/admin-academic-calendar.mock'
import TimePicker24 from '@/components/common/TimePicker24.vue'

const route = useRoute()
const router = useRouter()
const navStore = useAdminNavStore()

const schId = computed(() => route.params.id as string | undefined)
const isEditMode = computed(() => !!schId.value)

// Form State
const form = ref({
  laboratoryId: '',
  academicCalendarId: '',
  courseName: '',
  lecturerName: '',
  className: '',
  dayName: 'Monday' as ScheduleData['dayName'],
  startTime: '08:00',
  endTime: '10:00',
  status: 'SCHEDULED' as ScheduleData['status'],
})

const showToast = ref(false)
const toastMessage = ref('')
const isLoading = ref(false)
const isSaving = ref(false)
const error = ref<string | null>(null)

// Dropdown data
const laboratoriesList = ref<LaboratoryData[]>([])
const academicCalendarsList = ref<AcademicPeriodData[]>([])
const isLoadingLaboratories = ref(false)
const isLoadingAcademicCalendars = ref(false)

const selectedLabName = computed(() => {
  const lab = laboratoriesList.value.find((l) => l.id === form.value.laboratoryId)
  return lab ? `${lab.code} - ${lab.name}` : ''
})

const selectedCalendarName = computed(() => {
  const cal = academicCalendarsList.value.find((c) => c.id === form.value.academicCalendarId)
  return cal ? `${cal.academicYear} (${cal.semester})` : ''
})

const scheduleDuration = computed(() => {
  if (!form.value.startTime || !form.value.endTime) return ''
  const [sH, sM] = form.value.startTime.split(':').map(Number)
  const [eH, eM] = form.value.endTime.split(':').map(Number)
  if (sH === undefined || eH === undefined) return ''
  const diffMinutes = (eH * 60 + (eM || 0)) - (sH * 60 + (sM || 0))
  if (diffMinutes <= 0) return 'Rentang Tidak Valid'
  const hours = Math.floor(diffMinutes / 60)
  const mins = diffMinutes % 60
  return mins > 0 ? `${hours}j ${mins}m` : `${hours} jam`
})

const show16Dates = ref(false)

const dayMap: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
}

const projected16Dates = computed(() => {
  const cal = academicCalendarsList.value.find((c) => c.id === form.value.academicCalendarId)
  const baseStart = cal?.startDate ? new Date(cal.startDate) : new Date()
  const targetDay = dayMap[form.value.dayName] ?? 1

  const firstDate = new Date(baseStart.getFullYear(), baseStart.getMonth(), baseStart.getDate(), 12, 0, 0)
  while (firstDate.getDay() !== targetDay) {
    firstDate.setDate(firstDate.getDate() + 1)
  }

  const list: Array<{ index: number; dayName: string; dateFormatted: string }> = []
  for (let i = 0; i < 16; i++) {
    const dt = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate() + (i * 7), 12, 0, 0)
    const dayNameStr = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(dt)
    const dateFormatted = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(dt)
    list.push({ index: i + 1, dayName: dayNameStr, dateFormatted })
  }
  return list
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

// Load academic calendars for dropdown
const loadAcademicCalendars = async () => {
  isLoadingAcademicCalendars.value = true
  try {
    const { calendars } = await academicCalendarService.getAcademicCalendars({
      page: 1,
      limit: 100,
    })
    academicCalendarsList.value = calendars
  } catch (err: any) {
    console.error('Failed to load academic calendars:', err)
    error.value = 'Gagal memuat kalender akademik. Silakan segarkan halaman.'
  } finally {
    isLoadingAcademicCalendars.value = false
  }
}

// Load existing schedule in edit mode
const loadSchedule = async () => {
  if (!schId.value) return

  isLoading.value = true
  error.value = null

  try {
    const schedule = await scheduleService.getScheduleById(schId.value)

    form.value = {
      laboratoryId: schedule.laboratoryId,
      academicCalendarId: schedule.academicCalendarId,
      courseName: schedule.courseName,
      lecturerName: schedule.lecturerName,
      className: schedule.className,
      dayName: schedule.dayName,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      status: schedule.status,
    }

    navStore.setBreadcrumbs([
      { label: 'Dashboard', path: '/admin' },
      { label: 'Jadwal Penggunaan', path: '/admin/schedules' },
      { label: schedule.courseName, path: `/admin/schedules/${schedule.id}` },
      { label: 'Ubah' },
    ])
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Gagal memuat jadwal'
    console.error('Failed to load schedule:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadLaboratories(), loadAcademicCalendars()])

  if (isEditMode.value) {
    await loadSchedule()
  } else {
    navStore.setBreadcrumbs([
      { label: 'Dashboard', path: '/admin' },
      { label: 'Jadwal Penggunaan', path: '/admin/schedules' },
      { label: 'Tambah Jadwal' },
    ])
  }
})

const handleSave = async () => {
  if (!form.value.laboratoryId) {
    error.value = 'Silakan pilih laboratorium'
    return
  }
  if (!form.value.academicCalendarId) {
    error.value = 'Silakan pilih kalender akademik'
    return
  }
  if (!form.value.courseName || !form.value.lecturerName || !form.value.className) {
    error.value = 'Silakan lengkapi semua kolom yang wajib diisi'
    return
  }

  isSaving.value = true
  error.value = null

  try {
    if (isEditMode.value && schId.value) {
      await scheduleService.updateSchedule(schId.value, {
        laboratoryId: form.value.laboratoryId,
        academicCalendarId: form.value.academicCalendarId,
        courseName: form.value.courseName.trim(),
        lecturerName: form.value.lecturerName.trim(),
        className: form.value.className.trim(),
        dayName: form.value.dayName,
        startTime: form.value.startTime,
        endTime: form.value.endTime,
        status: form.value.status,
      })
      toastMessage.value = 'Jadwal laboratorium berhasil diperbarui.'
    } else {
      await scheduleService.createSchedule({
        laboratoryId: form.value.laboratoryId,
        academicCalendarId: form.value.academicCalendarId,
        courseName: form.value.courseName.trim(),
        lecturerName: form.value.lecturerName.trim(),
        className: form.value.className.trim(),
        dayName: form.value.dayName,
        startTime: form.value.startTime,
        endTime: form.value.endTime,
        status: form.value.status,
      })
      toastMessage.value = 'Jadwal mingguan berulang baru berhasil dibuat.'
    }

    showToast.value = true
    setTimeout(() => {
      showToast.value = false
      if (isEditMode.value && schId.value) {
        router.push(`/admin/schedules/${schId.value}`)
      } else {
        router.push('/admin/schedules')
      }
    }, 1500)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Gagal menyimpan jadwal'
    console.error('Failed to save schedule:', err)
  } finally {
    isSaving.value = false
  }
}

const handleCancel = () => {
  if (isEditMode.value && schId.value) {
    router.push(`/admin/schedules/${schId.value}`)
  } else {
    router.push('/admin/schedules')
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
        <span>Kembali ke Jadwal Penggunaan</span>
      </button>

      <div class="pb-3 border-b border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
              {{ isEditMode ? 'Ubah Jadwal Laboratorium' : 'Tambah Jadwal Laboratorium' }}
            </h1>
            <span class="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-brand-100 text-dark-green text-xs font-extrabold border border-brand-200">
              <Sparkles :size="13" />
              <span>{{ isEditMode ? 'Slot Mingguan' : 'Jadwal Baru' }}</span>
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted font-medium">
            {{ isEditMode ? 'Perbarui alokasi mata kuliah, rincian dosen pengampu, dan jadwal ruangan mingguan.' : 'Tambah alokasi jadwal mata kuliah mingguan berulang untuk sesi praktikum akademik.' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-20 text-center">
      <div class="inline-flex items-center gap-3 text-text-muted">
        <Loader2 :size="24" class="animate-spin text-dark-green" />
        <span class="text-xs font-medium">Memuat jadwal...</span>
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
        <!-- Section 1: Laboratory & Academic Period Context -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 sm:p-7 space-y-5">
          <div class="flex items-center gap-3 border-b border-gray-100 pb-3.5">
            <div class="w-10 h-10 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <Layers :size="20" stroke-width="2.2" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-text-primary tracking-tight">Laboratorium & Periode Akademik</h3>
              <p class="text-xs text-text-muted">Ruang laboratorium tujuan dan periode semester akademik aktif.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">
                Laboratorium Ditugaskan <span class="text-red-500">*</span>
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
                  {{ lab.code }} — {{ lab.name }}
                </option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">
                Kalender Akademik <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.academicCalendarId"
                required
                :disabled="isLoadingAcademicCalendars"
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white disabled:opacity-50 transition-colors"
              >
                <option value="" disabled>{{ isLoadingAcademicCalendars ? 'Memuat kalender...' : 'Pilih kalender akademik' }}</option>
                <option
                  v-for="cal in academicCalendarsList"
                  :key="cal.id"
                  :value="cal.id"
                >
                  {{ cal.academicYear }} ({{ cal.semester }})
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Section 2: Course & Instructor Allocation -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 sm:p-7 space-y-5">
          <div class="flex items-center gap-3 border-b border-gray-100 pb-3.5">
            <div class="w-10 h-10 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <GraduationCap :size="20" stroke-width="2.2" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-text-primary tracking-tight">Rincian Mata Kuliah & Dosen</h3>
              <p class="text-xs text-text-muted">Tentukan mata kuliah praktikum, dosen pengampu, dan kelompok kelas mahasiswa.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1.5 sm:col-span-2">
              <label class="block font-bold text-text-primary">
                Nama Mata Kuliah <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.courseName"
                type="text"
                placeholder="mis. Praktikum Pemrograman Web & Framework"
                required
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">
                Nama Dosen Pengampu <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.lecturerName"
                type="text"
                placeholder="mis. Dr. Aris Kurniawan, M.Kom."
                required
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">
                Kelas / Kelompok Mahasiswa <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.className"
                type="text"
                placeholder="mis. S1-IF-2024-A"
                required
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        <!-- Section 3: Timetable Slot & Time Window -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 sm:p-7 space-y-5">
          <div class="flex items-center gap-3 border-b border-gray-100 pb-3.5">
            <div class="w-10 h-10 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <Calendar :size="20" stroke-width="2.2" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-text-primary tracking-tight">Slot Waktu & Jadwal</h3>
              <p class="text-xs text-text-muted">Konfigurasi hari pelaksanaan berulang dan slot waktu 24 jam WIB.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">
                Hari Pelaksanaan <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.dayName"
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

            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">
                Status Jadwal <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.status"
                required
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              >
                <option value="SCHEDULED">SCHEDULED (Terjadwal)</option>
                <option value="ACTIVE">ACTIVE (Sedang Berjalan)</option>
                <option value="FINISHED">FINISHED (Selesai)</option>
                <option value="CANCELLED">CANCELLED (Dibatalkan)</option>
              </select>
            </div>

            <div class="pt-1">
              <TimePicker24
                v-model="form.startTime"
                label="Waktu Mulai"
                :required="true"
                min-time="07:00"
                max-time="20:00"
                :step-minutes="30"
              />
            </div>

            <div class="pt-1">
              <TimePicker24
                v-model="form.endTime"
                label="Waktu Selesai"
                :required="true"
                min-time="08:00"
                max-time="21:00"
                :step-minutes="30"
              />
            </div>
          </div>

          <!-- Repeat Weekly Lecture 16x Projection Card -->
          <div class="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-emerald-100 text-dark-green flex items-center justify-center shrink-0">
                  <Repeat :size="16" />
                </div>
                <div>
                  <h4 class="text-xs font-extrabold text-emerald-900">Jadwal Tetap Mingguan (16x Pertemuan Perkuliahan)</h4>
                  <p class="text-[11px] text-emerald-700/90">
                    Otomatis berulang setiap {{ form.dayName === 'Monday' ? 'Senin' : form.dayName === 'Tuesday' ? 'Selasa' : form.dayName === 'Wednesday' ? 'Rabu' : form.dayName === 'Thursday' ? 'Kamis' : form.dayName === 'Friday' ? 'Jumat' : form.dayName === 'Saturday' ? 'Sabtu' : 'Minggu' }} sepanjang semester dan tersinkronisasi ke Layar Display.
                  </p>
                </div>
              </div>
              <span class="px-2.5 py-0.5 rounded-full bg-dark-green text-white text-[10px] font-bold shrink-0">
                16x Pertemuan
              </span>
            </div>

            <!-- Accordion Toggle for 16 Dates -->
            <div v-if="projected16Dates.length > 0" class="pt-1">
              <button
                type="button"
                @click="show16Dates = !show16Dates"
                class="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-emerald-200/80 text-xs font-bold text-dark-green hover:bg-emerald-50/50 cursor-pointer transition-colors"
              >
                <span class="flex items-center gap-1.5">
                  <CalendarDays :size="14" />
                  <span>Proyeksi 16 Tanggal Perkuliahan Semester</span>
                </span>
                <div class="flex items-center gap-1 text-[11px]">
                  <span>{{ show16Dates ? 'Tutup Daftar' : 'Buka 16 Pertemuan' }}</span>
                  <ChevronDown :size="14" :class="['transition-transform duration-200', show16Dates ? 'rotate-180' : '']" />
                </div>
              </button>

              <div v-if="show16Dates" class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5">
                <div
                  v-for="d in projected16Dates"
                  :key="d.index"
                  class="px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <p class="font-bold text-text-primary text-[11px]">P-{{ d.index }}</p>
                    <p class="text-[10px] text-text-muted">{{ d.dateFormatted }}</p>
                  </div>
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                </div>
              </div>
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
              <span>Ringkasan Jadwal</span>
            </h4>
            <span
              :class="[
                'px-2 py-0.5 rounded-full text-[10px] font-extrabold border',
                form.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : form.status === 'SCHEDULED'
                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                    : 'bg-gray-100 text-text-muted border-gray-200'
              ]"
            >
              {{ form.status === 'ACTIVE' ? 'Aktif' : form.status === 'SCHEDULED' ? 'Terjadwal' : form.status === 'FINISHED' ? 'Selesai' : 'Dibatalkan' }}
            </span>
          </div>

          <div class="space-y-3 text-xs">
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Mata Kuliah</span>
              <span class="font-bold text-text-primary truncate max-w-[170px] text-right">{{ form.courseName || 'Belum Diisi' }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Dosen Pengampu</span>
              <span class="font-semibold text-text-secondary truncate max-w-[170px] text-right">{{ form.lecturerName || 'Belum Ditentukan' }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Kelompok Kelas</span>
              <span class="font-bold text-dark-green">{{ form.className || 'Menunggu' }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Laboratorium</span>
              <span class="font-bold text-text-primary truncate max-w-[170px] text-right">{{ selectedLabName || 'Belum dipilih' }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Sesi Waktu</span>
              <span class="font-mono font-bold text-text-primary">{{ form.dayName }}, {{ form.startTime }} – {{ form.endTime }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5">
              <span class="text-text-muted font-medium">Durasi</span>
              <span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-extrabold font-mono">
                {{ scheduleDuration || 'Dihitung' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Timetable Guidelines Card -->
        <div class="bg-brand-50/60 rounded-2xl border border-brand-200/80 p-5 space-y-2.5 text-xs">
          <div class="flex items-center gap-2 font-bold text-dark-green">
            <ShieldCheck :size="16" />
            <span>Kebijakan Penjadwalan</span>
          </div>
          <ul class="text-[11px] text-text-secondary space-y-1.5 list-disc list-inside leading-relaxed">
            <li>Jadwal langsung ditayangkan pada Layar Display Publik pada hari yang bersangkutan.</li>
            <li>Pemesanan ganda pada rentang waktu lab yang sama akan memicu peringatan konflik.</li>
            <li>Waktu selesai jadwal minimal 30 menit setelah waktu mulai.</li>
          </ul>
        </div>

        <!-- Sticky Primary Action Buttons Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-3">
          <button
            type="submit"
            :disabled="isSaving || !form.laboratoryId || !form.academicCalendarId || !form.courseName"
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
