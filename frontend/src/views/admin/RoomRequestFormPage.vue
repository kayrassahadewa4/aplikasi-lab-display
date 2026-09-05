<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  X,
  Plus,
  AlertTriangle,
  Loader2,
  Building2,
  Calendar,
  Clock,
  Users,
  GraduationCap,
  Sparkles,
  Eye,
  ShieldCheck,
  Repeat,
  ChevronDown,
  CalendarDays
} from 'lucide-vue-next'
import { roomRequestService } from '@/services/room-request.service'
import { laboratoryService, type LaboratoryData } from '@/services/laboratory.service'
import { authService } from '@/services/auth.service'
import TimePicker24 from '@/components/common/TimePicker24.vue'

const route = useRoute()
const router = useRouter()
const navStore = useAdminNavStore()

const reqId = computed(() => route.params.id as string | undefined)

// Form State
const form = ref({
  applicantId: '',
  applicantName: '',
  applicantEmail: '',
  laboratoryId: '',
  activityName: '',
  courseName: '',
  className: '',
  description: '',
  requestDate: new Date().toISOString().slice(0, 10),
  startTime: '08:00',
  endTime: '10:00',
  participantCount: 30,
  isRecurring: false,
  occurrences: 16,
})

// Loading & Error State
const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')
const showToast = ref(false)
const toastMessage = ref('')

// Laboratories List
const laboratories = ref<LaboratoryData[]>([])

const selectedLabName = computed(() => {
  const lab = laboratories.value.find((l) => l.id === form.value.laboratoryId)
  return lab ? `${lab.code} - ${lab.name}` : ''
})

const bookingDuration = computed(() => {
  if (!form.value.startTime || !form.value.endTime) return ''
  const [sH, sM] = form.value.startTime.split(':').map(Number)
  const [eH, eM] = form.value.endTime.split(':').map(Number)
  if (sH === undefined || eH === undefined) return ''
  const diffMinutes = (eH * 60 + (eM || 0)) - (sH * 60 + (sM || 0))
  if (diffMinutes <= 0) return 'Rentang tidak valid'
  const hours = Math.floor(diffMinutes / 60)
  const mins = diffMinutes % 60
  return mins > 0 ? `${hours}j ${mins}m` : `${hours} jam`
})

const isPreviewExpanded = ref(false)

const recurringDatesPreview = computed(() => {
  if (!form.value.requestDate) return []
  const count = Math.min(Math.max(Number(form.value.occurrences) || 16, 1), 24)
  const [yStr, mStr, dStr] = form.value.requestDate.split('-')
  const y = parseInt(yStr || '2026', 10)
  const m = parseInt(mStr || '1', 10) - 1
  const d = parseInt(dStr || '1', 10)

  const list: Array<{ index: number; dayName: string; dateFormatted: string; isoDate: string }> = []
  for (let i = 0; i < count; i++) {
    const dt = new Date(y, m, d + i * 7, 12, 0, 0)
    const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(dt)
    const dateFormatted = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(dt)
    const isoDate = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
    list.push({ index: i + 1, dayName, dateFormatted, isoDate })
  }
  return list
})

const recurringSummary = computed(() => {
  if (!recurringDatesPreview.value.length) return ''
  const first = recurringDatesPreview.value[0]
  const last = recurringDatesPreview.value[recurringDatesPreview.value.length - 1]
  if (!first || !last) return ''
  return `Setiap ${first.dayName}, ${form.value.startTime || '08:00'} – ${form.value.endTime || '10:00'} WIB (${recurringDatesPreview.value.length} sesi pertemuan: ${first.dateFormatted} s.d. ${last.dateFormatted})`
})

const setOccurrencesPreset = (count: number) => {
  form.value.occurrences = count
}

onMounted(async () => {
  navStore.setBreadcrumbs([
    { label: 'Dashboard', path: '/admin' },
    { label: 'Permohonan Pinjam', path: '/admin/room-requests' },
    { label: 'Tambah Permohonan' },
  ])

  try {
    const user = await authService.getCurrentUser()
    if (user) {
      form.value.applicantId = user.id
      form.value.applicantName = user.full_name || user.email
      form.value.applicantEmail = user.email || ''
    }
  } catch (error) {
    console.error('Failed to load user info:', error)
  }

  await loadLaboratories()
})

const loadLaboratories = async () => {
  isLoading.value = true
  try {
    const response = await laboratoryService.getLaboratories({ limit: 100 })
    laboratories.value = response.laboratories

    if (laboratories.value.length > 0 && !form.value.laboratoryId && laboratories.value[0]) {
      form.value.laboratoryId = laboratories.value[0].id
    }
  } catch (error: any) {
    errorMessage.value = 'Gagal memuat daftar laboratorium'
    console.error('Failed to load laboratories:', error)
  } finally {
    isLoading.value = false
  }
}

const handleSave = async () => {
  if (!form.value.activityName || !form.value.laboratoryId) {
    errorMessage.value = 'Harap lengkapi semua kolom yang wajib diisi'
    return
  }

  isSaving.value = true
  errorMessage.value = ''

  try {
    await roomRequestService.createRoomRequest({
      applicantId: form.value.applicantId,
      laboratoryId: form.value.laboratoryId,
      activityName: form.value.activityName.trim(),
      courseName: form.value.courseName ? form.value.courseName.trim() : undefined,
      className: form.value.className ? form.value.className.trim() : undefined,
      description: form.value.description ? form.value.description.trim() : 'Permohonan peminjaman ruang laboratorium',
      requestDate: form.value.requestDate,
      startTime: form.value.startTime,
      endTime: form.value.endTime,
      participantCount: form.value.participantCount,
      status: 'PENDING',
      isRecurring: form.value.isRecurring,
      occurrences: form.value.isRecurring ? Number(form.value.occurrences) : 1,
    })

    toastMessage.value = 'Permohonan peminjaman ruangan berhasil diajukan.'
    showToast.value = true

    setTimeout(() => {
      showToast.value = false
      router.push('/admin/room-requests')
    }, 1000)
  } catch (error: any) {
    errorMessage.value = error.message || 'Gagal mengajukan permohonan pinjam lab'
    console.error('Failed to create room request:', error)
  } finally {
    isSaving.value = false
  }
}

const handleCancel = () => {
  router.push('/admin/room-requests')
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
        <span>Kembali ke Permohonan Pinjam</span>
      </button>

      <div class="pb-3 border-b border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
              Buat Permohonan Pinjam
            </h1>
            <span class="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-brand-100 text-dark-green text-xs font-extrabold border border-brand-200">
              <Sparkles :size="13" />
              <span>Permohonan Khusus</span>
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted font-medium">
            Ajukan permohonan peminjaman ruang laboratorium untuk ujian praktikum, workshop tamu, atau sesi belajar tambahan.
          </p>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div
      v-if="errorMessage"
      class="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-xs shadow-2xs"
    >
      <AlertTriangle :size="18" class="text-red-600 shrink-0 mt-0.5" />
      <div class="flex-1">
        <p class="font-bold text-red-800">Gagal</p>
        <p class="text-red-700 mt-1">{{ errorMessage }}</p>
      </div>
      <button @click="errorMessage = ''" class="text-red-600 hover:opacity-80 cursor-pointer">
        <X :size="14" />
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

    <!-- Loading State -->
    <div v-if="isLoading" class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-20 text-center">
      <div class="inline-flex items-center gap-3 text-text-muted">
        <Loader2 :size="24" class="animate-spin text-dark-green" />
        <span class="text-xs font-medium">Memuat data formulir...</span>
      </div>
    </div>

    <!-- 2. MAIN 2-COLUMN GRID (8 COLS FORM + 4 COLS SIDEBAR) -->
    <form v-else @submit.prevent="handleSave" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- ======================================================== -->
      <!-- LEFT COLUMN: MAIN FORM SECTIONS (8 COLS)                 -->
      <!-- ======================================================== -->
      <div class="lg:col-span-8 space-y-5">
        <!-- Section 1: Applicant & Target Space -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 sm:p-7 space-y-5">
          <div class="flex items-center gap-3 border-b border-gray-100 pb-3.5">
            <div class="w-10 h-10 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <Building2 :size="20" stroke-width="2.2" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-text-primary tracking-tight">Pemohon & Pilihan Ruangan</h3>
              <p class="text-xs text-text-muted">Informasi kontak pemohon dan ruang laboratorium yang dituju.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">Nama Pemohon <span class="text-red-500">*</span></label>
              <input
                v-model="form.applicantName"
                type="text"
                required
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">Email Pemohon <span class="text-red-500">*</span></label>
              <input
                v-model="form.applicantEmail"
                type="email"
                required
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">Laboratorium yang Dituju <span class="text-red-500">*</span></label>
              <select
                v-model="form.laboratoryId"
                required
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors cursor-pointer"
              >
                <option value="" disabled>-- Pilih Laboratorium --</option>
                <option v-for="lab in laboratories" :key="lab.id" :value="lab.id">
                  {{ lab.code }} — {{ lab.name }} (Kapasitas: {{ lab.maximumCapacity }})
                </option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">Estimasi Peserta <span class="text-red-500">*</span></label>
              <input
                v-model.number="form.participantCount"
                type="number"
                min="1"
                required
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        <!-- Section 2: Activity & Academic Context -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 sm:p-7 space-y-5">
          <div class="flex items-center gap-3 border-b border-gray-100 pb-3.5">
            <div class="w-10 h-10 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <GraduationCap :size="20" stroke-width="2.2" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-text-primary tracking-tight">Rincian Kegiatan & Perkuliahan</h3>
              <p class="text-xs text-text-muted">Nama tujuan, mata kuliah kurikulum terkait, dan kelas mahasiswa.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1.5 sm:col-span-2">
              <label class="block font-bold text-text-primary">
                Nama Kegiatan / Tujuan <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.activityName"
                type="text"
                placeholder="mis. Ujian Praktikum Tengah Semester"
                required
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">Mata Kuliah Terkait</label>
              <input
                v-model="form.courseName"
                type="text"
                placeholder="mis. Sistem Basis Data Terdistribusi"
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">Kelas / Kelompok Mahasiswa</label>
              <input
                v-model="form.className"
                type="text"
                placeholder="mis. S1-IF-2024-B"
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        <!-- Section 3: Time Slot & Purpose Notes -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 sm:p-7 space-y-5">
          <div class="flex items-center gap-3 border-b border-gray-100 pb-3.5">
            <div class="w-10 h-10 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <Clock :size="20" stroke-width="2.2" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-text-primary tracking-tight">Rentang Waktu & Catatan Peminjaman</h3>
              <p class="text-xs text-text-muted">Tanggal kalender reservasi dan rentang 24-jam waktu WIB.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div class="space-y-1.5 sm:col-span-1">
              <label class="block font-bold text-text-primary">Tanggal Peminjaman <span class="text-red-500">*</span></label>
              <input
                v-model="form.requestDate"
                type="date"
                required
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              />
            </div>

            <div class="pt-1 sm:col-span-1">
              <TimePicker24
                v-model="form.startTime"
                label="Jam Mulai"
                :required="true"
                min-time="07:00"
                max-time="20:00"
                :step-minutes="30"
              />
            </div>

            <div class="pt-1 sm:col-span-1">
              <TimePicker24
                v-model="form.endTime"
                label="Jam Selesai"
                :required="true"
                min-time="08:00"
                max-time="21:00"
                :step-minutes="30"
              />
            </div>

            <div class="sm:col-span-3 space-y-1.5">
              <label class="block font-bold text-text-primary">Deskripsi & Catatan Kebutuhan Khusus</label>
              <textarea
                v-model="form.description"
                rows="3"
                placeholder="Rincikan kebutuhan perangkat lunak, kebutuhan proyektor, atau izin khusus tamu luar..."
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-medium text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white resize-none leading-relaxed transition-colors"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Section 4: Repeat Weekly (Pengulangan Mingguan 16x) -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 sm:p-7 space-y-5">
          <div class="flex items-center gap-3 border-b border-gray-100 pb-3.5">
            <div class="w-10 h-10 rounded-xl bg-emerald-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <Repeat :size="20" stroke-width="2.2" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <h3 class="text-base font-extrabold text-text-primary tracking-tight">Pola Pengulangan Jadwal (Repeat Weekly)</h3>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold" :class="form.isRecurring ? 'bg-dark-green text-white' : 'bg-gray-100 text-text-muted'">
                  {{ form.isRecurring ? `${form.occurrences}x Pertemuan` : 'Sekali Sesi' }}
                </span>
              </div>
              <p class="text-xs text-text-muted">Jadwalkan perkuliahan berulang 1 semester penuh (16x pertemuan) secara otomatis.</p>
            </div>
          </div>

          <!-- Toggle Switch Card -->
          <div class="p-4 rounded-2xl border transition-all duration-300" :class="form.isRecurring ? 'bg-emerald-50/40 border-emerald-200' : 'bg-gray-50/70 border-gray-200/80'">
            <div class="flex items-center justify-between gap-4">
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <span class="text-xs sm:text-sm font-bold text-text-primary">
                    Ulangi Setiap Minggu (Repeat Weekly)
                  </span>
                  <span v-if="form.isRecurring" class="px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10.5px] font-bold">
                    Jadwal Rutin Perkuliahan
                  </span>
                </div>
                <p class="text-[11.5px] text-text-muted leading-relaxed">
                  {{ form.isRecurring 
                    ? 'Jadwal akan dibuat setiap pekan untuk 1 semester penuh (16x pertemuan) pada jam & laboratorium yang sama.' 
                    : 'Aktifkan opsi ini untuk jadwal kuliah rutin semesteran. Biarkan nonaktif untuk kegiatan insidental / mendadak seperti rapat.' }}
                </p>
              </div>

              <!-- Modern Switch Component -->
              <button
                type="button"
                @click="form.isRecurring = !form.isRecurring"
                :class="[
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-dark-green focus:ring-offset-2',
                  form.isRecurring ? 'bg-dark-green' : 'bg-gray-300'
                ]"
              >
                <span
                  :class="[
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                    form.isRecurring ? 'translate-x-5' : 'translate-x-0'
                  ]"
                />
              </button>
            </div>

            <!-- When Recurring is Activated: Occurrences selector & Date preview -->
            <div v-if="form.isRecurring" class="mt-4 pt-4 border-t border-emerald-200/70 space-y-4">
              <!-- Preset Buttons & Number input -->
              <div class="space-y-2">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label class="block text-xs font-bold text-text-primary">
                    Jumlah Pertemuan Perkuliahan <span class="text-red-500">*</span>
                  </label>
                  <span class="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Standar Perguruan Tinggi: 16x Pertemuan (1 Semester)
                  </span>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    @click="setOccurrencesPreset(16)"
                    :class="[
                      'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border',
                      form.occurrences === 16 
                        ? 'bg-dark-green text-white border-dark-green shadow-sm' 
                        : 'bg-white text-text-secondary border-gray-200 hover:border-dark-green/40'
                    ]"
                  >
                    16x Pertemuan (1 Semester Penuh)
                  </button>
                  <button
                    type="button"
                    @click="setOccurrencesPreset(8)"
                    :class="[
                      'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border',
                      form.occurrences === 8 
                        ? 'bg-dark-green text-white border-dark-green shadow-sm' 
                        : 'bg-white text-text-secondary border-gray-200 hover:border-dark-green/40'
                    ]"
                  >
                    8x Pertemuan (Sebelum UTS)
                  </button>
                  <button
                    type="button"
                    @click="setOccurrencesPreset(4)"
                    :class="[
                      'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border',
                      form.occurrences === 4 
                        ? 'bg-dark-green text-white border-dark-green shadow-sm' 
                        : 'bg-white text-text-secondary border-gray-200 hover:border-dark-green/40'
                    ]"
                  >
                    4x Pertemuan (1 Bulan)
                  </button>

                  <!-- Custom Number Input -->
                  <div class="flex items-center gap-1.5 ml-auto">
                    <span class="text-[11px] font-bold text-text-muted">Kustom:</span>
                    <input
                      v-model.number="form.occurrences"
                      type="number"
                      min="1"
                      max="24"
                      class="w-16 px-2 py-1 text-xs font-bold text-center bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-green/20"
                    />
                    <span class="text-[11px] font-bold text-text-muted">x</span>
                  </div>
                </div>
              </div>

              <!-- Schedule Summary Banner -->
              <div v-if="recurringSummary" class="p-3 bg-white/80 rounded-xl border border-emerald-200/80 flex items-start gap-2.5">
                <CalendarDays :size="16" class="text-dark-green shrink-0 mt-0.5" />
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-extrabold text-emerald-900 leading-tight">
                    {{ recurringSummary }}
                  </p>
                  <p class="text-[11px] text-emerald-700/90 mt-0.5">
                    Sistem akan memvalidasi jadwal secara otomatis untuk memastikan tidak ada bentrok pada ke-{{ form.occurrences }} pekan tersebut.
                  </p>
                </div>
              </div>

              <!-- Accordion Toggle for Generated Dates Preview -->
              <div class="space-y-2">
                <button
                  type="button"
                  @click="isPreviewExpanded = !isPreviewExpanded"
                  class="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-white border border-emerald-200/80 text-xs font-bold text-dark-green hover:bg-emerald-50/50 cursor-pointer transition-colors"
                >
                  <span class="flex items-center gap-1.5">
                    <Calendar :size="14" />
                    <span>Lihat Rincian {{ recurringDatesPreview.length }} Tanggal Pertemuan</span>
                  </span>
                  <div class="flex items-center gap-1 text-[11px]">
                    <span>{{ isPreviewExpanded ? 'Tutup Daftar' : 'Buka Daftar' }}</span>
                    <ChevronDown :size="14" :class="['transition-transform duration-200', isPreviewExpanded ? 'rotate-180' : '']" />
                  </div>
                </button>

                <!-- Expanded Meeting List Grid -->
                <div v-if="isPreviewExpanded" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
                  <div
                    v-for="item in recurringDatesPreview"
                    :key="item.index"
                    class="px-3 py-2 rounded-xl bg-white border border-gray-200 flex items-center justify-between text-xs"
                  >
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="w-5 h-5 rounded-full bg-emerald-100 text-dark-green font-bold text-[10px] flex items-center justify-center shrink-0">
                        {{ item.index }}
                      </span>
                      <div class="min-w-0">
                        <p class="font-bold text-text-primary truncate">{{ item.dayName }}</p>
                        <p class="text-[10.5px] text-text-muted truncate">{{ item.dateFormatted }}</p>
                      </div>
                    </div>
                    <span class="text-[10px] font-mono text-dark-green shrink-0 font-semibold">P-{{ item.index }}</span>
                  </div>
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
              <span>Ringkasan Permohonan</span>
            </h4>
            <span class="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold">
              MENUNGGU TINJAUAN
            </span>
          </div>

          <div class="space-y-3 text-xs">
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Kegiatan</span>
              <span class="font-bold text-text-primary truncate max-w-[170px] text-right">{{ form.activityName || 'Permohonan Tanpa Nama' }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Laboratorium Target</span>
              <span class="font-bold text-text-primary truncate max-w-[170px] text-right">{{ selectedLabName || 'Belum dipilih' }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Tanggal Peminjaman</span>
              <span class="font-bold text-dark-green">{{ form.requestDate }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Rentang Waktu</span>
              <span class="font-mono font-bold text-text-primary">{{ form.startTime }} – {{ form.endTime }} WIB</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Durasi</span>
              <span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-extrabold font-mono">
                {{ bookingDuration || 'Dihitung' }}
              </span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Pola Jadwal</span>
              <span :class="['px-2 py-0.5 rounded-full text-[10.5px] font-bold', form.isRecurring ? 'bg-dark-green text-white' : 'bg-gray-100 text-text-muted']">
                {{ form.isRecurring ? `Mingguan (${form.occurrences}x)` : 'Sekali Sesi' }}
              </span>
            </div>
            <div class="flex items-center justify-between py-1.5">
              <span class="text-text-muted font-medium">Peserta</span>
              <span class="font-bold text-text-primary">{{ form.participantCount }} Peserta</span>
            </div>
          </div>
        </div>

        <!-- Room Request Review Guidelines Card -->
        <div class="bg-brand-50/60 rounded-2xl border border-brand-200/80 p-5 space-y-2.5 text-xs">
          <div class="flex items-center gap-2 font-bold text-dark-green">
            <ShieldCheck :size="16" />
            <span>Panduan Pengajuan Permohonan</span>
          </div>
          <ul class="text-[11px] text-text-secondary space-y-1.5 list-disc list-inside leading-relaxed">
            <li>Permohonan yang diajukan memerlukan persetujuan dari Staf Laboran atau Administrator.</li>
            <li>Reservasi yang disetujui akan otomatis muncul pada arus jadwal di tanggal yang diminta.</li>
            <li>Pastikan jumlah peserta yang diajukan tidak melebihi kapasitas ruangan laboratorium.</li>
          </ul>
        </div>

        <!-- Sticky Primary Action Buttons Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-3">
          <button
            type="submit"
            :disabled="isSaving || !form.activityName || !form.laboratoryId"
            class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#3B694A] to-[#2D5A3F] hover:from-[#31573E] hover:to-[#244430] text-white font-extrabold text-xs shadow-xs shadow-[#2D5A3F]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="isSaving" :size="16" class="animate-spin" />
            <Plus v-else :size="16" />
            <span>{{ isSaving ? 'Mengirimkan Permohonan...' : 'Ajukan Permohonan Pinjam' }}</span>
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
