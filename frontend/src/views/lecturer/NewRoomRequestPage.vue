<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLecturerNavStore } from '@/stores/lecturer-nav.store'
import {
  ArrowLeft,
  Send,
  FlaskConical,
  Calendar,
  Clock,
  User,
  Building2,
  FileText,
  AlertCircle,
  AlertTriangle,
  X,
  Loader2,
  Users,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Info,
  Layers,
  ChevronRight,
  Repeat,
  ChevronDown,
  CalendarDays,
  Paperclip,
  UploadCloud,
  FileCheck,
  Trash2,
  ExternalLink
} from 'lucide-vue-next'
import { roomRequestService } from '@/services/room-request.service'
import { laboratoryService, type LaboratoryData } from '@/services/laboratory.service'
import { formatDate, getFileUrl } from '@/utils/format.utils'
import TimePicker24 from '@/components/common/TimePicker24.vue'

const route = useRoute()
const router = useRouter()
const navStore = useLecturerNavStore()

// State
const laboratories = ref<LaboratoryData[]>([])
const isLoadingLabs = ref(true)
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)
const isPreviewExpanded = ref(false)

// Document Attachment State
const attachmentFile = ref<File | null>(null)
const attachmentUrl = ref<string | null>(null)
const isUploadingAttachment = ref(false)
const attachmentError = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// Form Data State
const form = reactive({
  laboratoryId: '',
  activityName: '',
  courseName: '',
  className: '',
  participantCount: 30,
  requestDate: (new Date().toISOString().split('T')[0] || '') as string,
  startTime: '08:00',
  endTime: '10:00',
  description: '',
  isRecurring: false,
  occurrences: 16,
})

// Validation Error State
const errors = reactive({
  laboratoryId: '',
  activityName: '',
  courseName: '',
  participantCount: '',
  requestDate: '',
  startTime: '',
  endTime: '',
  description: '',
})

const selectedLaboratory = computed(() => {
  return laboratories.value.find(l => l.id === form.laboratoryId) || null
})

const isCapacityExceeded = computed(() => {
  if (!selectedLaboratory.value || !form.participantCount) return false
  return form.participantCount > selectedLaboratory.value.maximumCapacity
})

const capacityPercentage = computed(() => {
  if (!selectedLaboratory.value || !form.participantCount) return 0
  const pct = Math.round((form.participantCount / selectedLaboratory.value.maximumCapacity) * 100)
  return Math.min(pct, 100)
})

const formattedSelectedDate = computed(() => {
  if (!form.requestDate) return ''
  return formatDate(form.requestDate, true)
})

const calculatedDuration = computed(() => {
  if (!form.startTime || !form.endTime) return ''
  const startParts = form.startTime.split(':')
  const endParts = form.endTime.split(':')
  const sH = Number(startParts[0])
  const sM = Number(startParts[1])
  const eH = Number(endParts[0])
  const eM = Number(endParts[1])
  if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) return ''
  const diffMins = (eH * 60 + eM) - (sH * 60 + sM)
  if (diffMins <= 0) return 'Rentang waktu tidak valid'
  const hrs = Math.floor(diffMins / 60)
  const mins = diffMins % 60
  if (mins === 0) return `${hrs} jam`
  return `${hrs > 0 ? `${hrs} jam ` : ''}${mins} mnt`
})

const setDurationPreset = (hours: number) => {
  if (!form.startTime) form.startTime = '08:00'
  const [hStr, mStr] = form.startTime.split(':')
  let h = parseInt(hStr || '8', 10) + hours
  const m = mStr || '00'
  if (h > 22) h = 22
  form.endTime = `${h.toString().padStart(2, '0')}:${m}`
}

const recurringDatesPreview = computed(() => {
  if (!form.requestDate) return []
  const count = Math.min(Math.max(Number(form.occurrences) || 16, 1), 24)
  const [yStr, mStr, dStr] = form.requestDate.split('-')
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
  return `Setiap ${first.dayName}, ${form.startTime || '08:00'} – ${form.endTime || '10:00'} WIB (${recurringDatesPreview.value.length} sesi pertemuan: ${first.dateFormatted} s.d. ${last.dateFormatted})`
})

const setOccurrencesPreset = (count: number) => {
  form.occurrences = count
}

onMounted(async () => {
  navStore.setBreadcrumbs([
    { label: 'Portal Dosen', path: '/lecturer' },
    { label: 'Permohonan Pinjam', path: '/lecturer/room-requests' },
    { label: 'Permohonan Pinjam Baru' }
  ])

  try {
    const response = await laboratoryService.getLaboratories({ limit: 100 })
    laboratories.value = (response.laboratories || []).filter((l: LaboratoryData) => l.status === 'Active')
    const queryLabId = (route.query.labId || route.query.laboratoryId) as string | undefined
    if (queryLabId && laboratories.value.some(l => l.id === queryLabId)) {
      form.laboratoryId = queryLabId
    } else if (laboratories.value.length > 0 && !form.laboratoryId && laboratories.value[0]) {
      form.laboratoryId = laboratories.value[0].id
    }
  } catch (err) {
    console.error('Failed to load laboratories for request form:', err)
  } finally {
    isLoadingLabs.value = false
  }
})

const validateForm = (): boolean => {
  errors.laboratoryId = ''
  errors.activityName = ''
  errors.courseName = ''
  errors.participantCount = ''
  errors.requestDate = ''
  errors.startTime = ''
  errors.endTime = ''
  errors.description = ''

  let isValid = true

  if (!form.laboratoryId) {
    errors.laboratoryId = 'Silakan pilih laboratorium'
    isValid = false
  }

  if (!form.activityName.trim()) {
    errors.activityName = 'Nama kegiatan wajib diisi'
    isValid = false
  }

  if (!form.participantCount || form.participantCount < 1) {
    errors.participantCount = 'Jumlah peserta minimal 1 orang'
    isValid = false
  } else if (selectedLaboratory.value && form.participantCount > selectedLaboratory.value.maximumCapacity) {
    errors.participantCount = `Jumlah peserta melebihi kapasitas lab (Maks: ${selectedLaboratory.value.maximumCapacity} kursi)`
    isValid = false
  }

  if (!form.requestDate) {
    errors.requestDate = 'Tanggal kegiatan wajib diisi'
    isValid = false
  }

  if (!form.startTime) {
    errors.startTime = 'Waktu mulai wajib diisi'
    isValid = false
  }

  if (!form.endTime) {
    errors.endTime = 'Waktu selesai wajib diisi'
    isValid = false
  }

  if (form.startTime && form.endTime && form.startTime >= form.endTime) {
    errors.endTime = 'Waktu selesai harus lebih lambat dari waktu mulai'
    isValid = false
  }

  if (!form.description.trim()) {
    errors.description = 'Deskripsi / tujuan kegiatan wajib diisi'
    isValid = false
  }

  return isValid
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  const file = target.files[0]
  if (!file) return

  // Check 5MB limit
  if (file.size > 5 * 1024 * 1024) {
    attachmentError.value = 'Ukuran berkas maksimal 5MB.'
    return
  }

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    attachmentError.value = 'Format berkas harus berupa PDF, PNG, JPG, atau WEBP.'
    return
  }

  attachmentError.value = null
  isUploadingAttachment.value = true

  try {
    const res = await roomRequestService.uploadAttachment(file)
    attachmentFile.value = file
    attachmentUrl.value = res.url
  } catch (err: any) {
    console.error('Failed to upload attachment:', err)
    attachmentError.value = err.message || 'Gagal mengunggah berkas lampiran.'
  } finally {
    isUploadingAttachment.value = false
    target.value = ''
  }
}

const removeAttachment = () => {
  attachmentFile.value = null
  attachmentUrl.value = null
  attachmentError.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const handleSubmit = async () => {
  if (!validateForm()) return

  isSubmitting.value = true
  submitError.value = null

  try {
    await roomRequestService.createRoomRequest({
      laboratoryId: form.laboratoryId,
      activityName: form.activityName.trim(),
      courseName: form.courseName.trim() ? form.courseName.trim() : null,
      className: form.className.trim() ? form.className.trim() : null,
      description: form.description.trim(),
      requestDate: form.requestDate,
      startTime: form.startTime,
      endTime: form.endTime,
      participantCount: Number(form.participantCount),
      documentUrl: attachmentUrl.value || undefined,
      isRecurring: form.isRecurring,
      occurrences: form.isRecurring ? Number(form.occurrences) : 1,
    })

    router.push('/lecturer/room-requests')
  } catch (err: any) {
    console.error('Room request creation failed:', err)
    submitError.value = err.message || 'Gagal mengajukan permohonan pinjam ruangan. Silakan periksa kembali isian form dan jam operasional lab.'
  } finally {
    isSubmitting.value = false
  }
}

const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="space-y-6 pb-16 select-none w-full max-w-6xl mx-auto min-w-0">
    
    <!-- 1. Page Header with Back Navigation Link -->
    <div class="space-y-3 pb-2 border-b border-gray-200/60 w-full min-w-0">
      <button
        @click="navigateTo('/lecturer/room-requests')"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-dark-green hover:underline cursor-pointer transition-colors"
      >
        <ArrowLeft :size="15" />
        <span>Kembali ke Permohonan Pinjam</span>
      </button>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight truncate">
              Permohonan Pinjam Baru
            </h1>
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-100/80 border border-brand-200 text-dark-green text-[11px] font-bold shrink-0">
              <Sparkles :size="12" />
              Reservasi Akademik
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted font-normal">
            Ajukan permohonan peminjaman ruangan laboratorium untuk praktikum mengajar, ujian, atau lokakarya akademik.
          </p>
        </div>
      </div>
    </div>

    <!-- Error Alert Banner -->
    <div
      v-if="submitError"
      class="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 shadow-xs w-full min-w-0 animate-in fade-in"
    >
      <AlertCircle :size="18" class="shrink-0 mt-0.5 text-rose-600" />
      <div class="space-y-0.5 flex-1 min-w-0">
        <p class="font-bold text-rose-900">Gagal membuat permohonan pinjam ruangan</p>
        <p class="text-[11px] text-rose-700">{{ submitError }}</p>
      </div>
      <button
        @click="submitError = null"
        class="p-1 rounded-lg text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
        aria-label="Tutup"
      >
        <X :size="15" />
      </button>
    </div>

    <!-- 2. Two-Column Booking Layout (8 Cols Form + 4 Cols Sticky Summary) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
      
      <!-- ======================================================== -->
      <!-- LEFT COLUMN: 8 COLS (STRUCTURED APPLICATION FORM) -->
      <!-- ======================================================== -->
      <div class="lg:col-span-8 w-full min-w-0">
        <form @submit.prevent="handleSubmit" class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-5 sm:p-7 space-y-6">
          
          <!-- Section 1: Laboratory & Activity Details -->
          <div class="space-y-4">
            <div class="flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <div class="w-7 h-7 rounded-lg bg-brand-100 text-dark-green flex items-center justify-center shrink-0">
                <FlaskConical :size="15" />
              </div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-text-primary">
                Rincian Laboratorium & Kegiatan
              </h3>
            </div>

            <!-- Laboratory Selection -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="block text-xs font-bold text-text-primary">
                  Laboratorium yang Dituju <span class="text-danger">*</span>
                </label>
                <span
                  v-if="selectedLaboratory"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-50 border border-brand-200/70 text-[10.5px] font-bold text-dark-green font-mono"
                >
                  Kapasitas Maks: {{ selectedLaboratory.maximumCapacity }} kursi
                </span>
              </div>

              <select
                v-model="form.laboratoryId"
                id="select-lab"
                :disabled="isLoadingLabs || isSubmitting"
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/80 rounded-xl text-xs text-text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green cursor-pointer disabled:opacity-50 transition-all"
              >
                <option value="" disabled>Pilih laboratorium...</option>
                <option v-for="lab in laboratories" :key="lab.id" :value="lab.id">
                  {{ lab.name }} ({{ lab.code || 'LAB' }}) — {{ lab.maximumCapacity }} Kursi · {{ lab.location || 'Gedung FIK' }}
                </option>
              </select>
              <p v-if="errors.laboratoryId" class="text-[11px] text-danger font-medium">{{ errors.laboratoryId }}</p>
            </div>

            <!-- Activity Name -->
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-text-primary">
                Judul / Tujuan Kegiatan <span class="text-danger">*</span>
              </label>
              <input
                v-model="form.activityName"
                type="text"
                id="input-activity-name"
                placeholder="cth., Ujian Praktikum Pemrograman Web & Presentasi Proyek"
                :disabled="isSubmitting"
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/80 rounded-xl text-xs text-text-primary font-medium placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green disabled:opacity-50 transition-all"
              />
              <p v-if="errors.activityName" class="text-[11px] text-danger font-medium">{{ errors.activityName }}</p>
            </div>

            <!-- Course Name & Class Section Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Course Name -->
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-text-primary">
                  Mata Kuliah <span class="text-text-muted font-normal">(Opsional)</span>
                </label>
                <input
                  v-model="form.courseName"
                  type="text"
                  id="input-course-name"
                  placeholder="cth., Sistem Basis Data Lanjut"
                  :disabled="isSubmitting"
                  class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/80 rounded-xl text-xs text-text-primary font-medium placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green disabled:opacity-50 transition-all"
                />
              </div>

              <!-- Class Name -->
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-text-primary">
                  Kelas / Kelompok Praktikum <span class="text-text-muted font-normal">(Opsional)</span>
                </label>
                <input
                  v-model="form.className"
                  type="text"
                  id="input-class-name"
                  placeholder="cth., Kelas 3A / Paralel B"
                  :disabled="isSubmitting"
                  class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/80 rounded-xl text-xs text-text-primary font-medium placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green disabled:opacity-50 transition-all"
                />
              </div>
            </div>

          </div>

          <!-- Section 2: Date, Time Slot & Capacity -->
          <div class="space-y-4 pt-2">
            <div class="flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <div class="w-7 h-7 rounded-lg bg-brand-100 text-dark-green flex items-center justify-center shrink-0">
                <Calendar :size="15" />
              </div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-text-primary">
                Tanggal, Waktu & Kapasitas
              </h3>
            </div>

            <!-- Date & Participants -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Request Date -->
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-text-primary">
                  Tanggal Kegiatan <span class="text-danger">*</span>
                </label>
                <input
                  v-model="form.requestDate"
                  type="date"
                  id="input-request-date"
                  :disabled="isSubmitting"
                  class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/80 rounded-xl text-xs text-text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green disabled:opacity-50 transition-all"
                />
                <p v-if="errors.requestDate" class="text-[11px] text-danger font-medium">{{ errors.requestDate }}</p>
              </div>

              <!-- Participant Count & Capacity Indicator -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-bold text-text-primary">
                    Estimasi Jumlah Mahasiswa <span class="text-danger">*</span>
                  </label>
                  <span
                    v-if="isCapacityExceeded"
                    class="text-[10.5px] font-bold text-danger animate-pulse inline-flex items-center gap-1"
                  >
                    <AlertTriangle :size="12" class="shrink-0" />
                    <span>Melebihi kapasitas (Maks: {{ selectedLaboratory?.maximumCapacity }})</span>
                  </span>
                  <span
                    v-else-if="selectedLaboratory"
                    class="text-[10.5px] font-bold text-dark-green font-mono"
                  >
                    {{ form.participantCount || 0 }} / {{ selectedLaboratory.maximumCapacity }} Kursi
                  </span>
                </div>

                <input
                  v-model.number="form.participantCount"
                  type="number"
                  min="1"
                  id="input-participant-count"
                  placeholder="cth., 30"
                  :disabled="isSubmitting"
                  :class="[
                    'w-full px-3.5 py-2.5 bg-surface/60 border rounded-xl text-xs text-text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green disabled:opacity-50 transition-colors',
                    isCapacityExceeded ? 'border-red-400 bg-red-50/40' : 'border-gray-200/80'
                  ]"
                />

                <!-- Dynamic Capacity Progress Bar -->
                <div v-if="selectedLaboratory" class="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden mt-1">
                  <div
                    :class="[
                      'h-full transition-all duration-300 rounded-full',
                      isCapacityExceeded ? 'bg-rose-500' : capacityPercentage > 85 ? 'bg-amber-500' : 'bg-dark-green'
                    ]"
                    :style="{ width: `${capacityPercentage}%` }"
                  ></div>
                </div>

                <p v-if="errors.participantCount" class="text-[11px] text-danger font-medium">{{ errors.participantCount }}</p>
              </div>
            </div>

            <!-- Start Time & End Time with TimePicker24 & Academic Shifts -->
            <div class="space-y-2.5">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TimePicker24
                  v-model="form.startTime"
                  label="Waktu Mulai"
                  id="input-start-time"
                  :required="true"
                  :disabled="isSubmitting"
                  :error="errors.startTime"
                  min-time="07:00"
                  max-time="20:00"
                  :step-minutes="30"
                />
                <TimePicker24
                  v-model="form.endTime"
                  label="Waktu Selesai"
                  id="input-end-time"
                  :required="true"
                  :disabled="isSubmitting"
                  :error="errors.endTime"
                  min-time="08:00"
                  max-time="21:00"
                  :step-minutes="30"
                />
              </div>

              <!-- Academic Session Quick Presets -->
              <div class="flex items-center gap-2 pt-1 flex-wrap">
                <span class="text-[11px] font-bold text-text-muted">Shift Perkuliahan:</span>
                <button
                  type="button"
                  @click="form.startTime = '08:00'; form.endTime = '10:00'"
                  class="px-2.5 py-1 rounded-lg bg-surface hover:bg-brand-100/70 border border-gray-200 text-[11px] font-bold text-text-secondary cursor-pointer transition-colors"
                >
                  Pagi 1 (08:00 – 10:00)
                </button>
                <button
                  type="button"
                  @click="form.startTime = '10:00'; form.endTime = '12:00'"
                  class="px-2.5 py-1 rounded-lg bg-surface hover:bg-brand-100/70 border border-gray-200 text-[11px] font-bold text-text-secondary cursor-pointer transition-colors"
                >
                  Pagi 2 (10:00 – 12:00)
                </button>
                <button
                  type="button"
                  @click="form.startTime = '13:00'; form.endTime = '15:00'"
                  class="px-2.5 py-1 rounded-lg bg-surface hover:bg-brand-100/70 border border-gray-200 text-[11px] font-bold text-text-secondary cursor-pointer transition-colors"
                >
                  Siang (13:00 – 15:00)
                </button>
                <button
                  type="button"
                  @click="form.startTime = '15:30'; form.endTime = '17:30'"
                  class="px-2.5 py-1 rounded-lg bg-surface hover:bg-brand-100/70 border border-gray-200 text-[11px] font-bold text-text-secondary cursor-pointer transition-colors"
                >
                  Sore (15:30 – 17:30)
                </button>
                <span v-if="calculatedDuration" class="text-[11px] font-mono font-bold text-dark-green ml-auto">
                  Durasi: {{ calculatedDuration }}
                </span>
              </div>
            </div>

          </div>

          <!-- Section 3: Repeat Weekly (Pengulangan Mingguan 16x) -->
          <div class="space-y-4 pt-2">
            <div class="flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <div class="w-7 h-7 rounded-lg bg-emerald-100 text-dark-green flex items-center justify-center shrink-0">
                <Repeat :size="15" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-2">
                  <span>Pola Pengulangan Jadwal (Repeat Weekly)</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="form.isRecurring ? 'bg-dark-green text-white' : 'bg-gray-100 text-text-muted'">
                    {{ form.isRecurring ? `${form.occurrences}x Pertemuan` : 'Sekali Sesi' }}
                  </span>
                </h3>
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
                      ? 'Jadwal perkuliahan akan otomatis dibuat setiap pekan untuk 1 semester penuh (16x pertemuan) pada jam & laboratorium yang sama.' 
                      : 'Aktifkan opsi ini untuk jadwal kuliah rutin semesteran. Biarkan nonaktif untuk jadwal insidental / mendadak (seperti rapat atau seminar).' }}
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
                      Jumlah Pertemuan Perkuliahan <span class="text-danger">*</span>
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

          <!-- Section 4: Purpose & Description -->
          <div class="space-y-4 pt-2">
            <div class="flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <div class="w-7 h-7 rounded-lg bg-brand-100 text-dark-green flex items-center justify-center shrink-0">
                <FileText :size="15" />
              </div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-text-primary">
                Tujuan Sesi & Catatan Kebutuhan Alat
              </h3>
            </div>

            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="block text-xs font-bold text-text-primary">
                  Justifikasi / Keterangan Rinci <span class="text-danger">*</span>
                </label>
                <span class="text-[10.5px] text-text-muted">{{ form.description.length }} karakter</span>
              </div>
              <textarea
                v-model="form.description"
                rows="3"
                id="textarea-description"
                placeholder="Jelaskan paket perangkat lunak, kebutuhan perangkat keras, atau target luaran dari sesi laboratorium ini..."
                :disabled="isSubmitting"
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/80 rounded-xl text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green disabled:opacity-50 leading-relaxed transition-all"
              ></textarea>
              <p v-if="errors.description" class="text-[11px] text-danger font-medium">{{ errors.description }}</p>
            </div>
          </div>

          <!-- Section 5: Document Attachment (Surat Permohonan / TOR) -->
          <div class="space-y-4 pt-2">
            <div class="flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <div class="w-7 h-7 rounded-lg bg-emerald-100 text-dark-green flex items-center justify-center shrink-0">
                <Paperclip :size="15" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-2">
                  <span>Berkas Dokumen Pendukung (Opsional)</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-text-muted">
                    PDF / Gambar (Maks. 5MB)
                  </span>
                </h3>
              </div>
            </div>

            <!-- Upload Dropzone / Existing File Card -->
            <div class="space-y-2">
              <input
                ref="fileInputRef"
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                class="hidden"
                @change="handleFileChange"
              />

              <!-- Uploading State -->
              <div
                v-if="isUploadingAttachment"
                class="p-6 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 flex flex-col items-center justify-center text-center space-y-2"
              >
                <Loader2 :size="24" class="text-dark-green animate-spin" />
                <p class="text-xs font-bold text-dark-green">Mengunggah dokumen pendukung...</p>
                <p class="text-[11px] text-text-muted">Mohon tunggu sebentar sampai berkas tersimpan.</p>
              </div>

              <!-- Uploaded State -->
              <div
                v-else-if="attachmentUrl"
                class="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-10 h-10 rounded-xl bg-white border border-emerald-200 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
                    <FileCheck :size="20" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-black text-text-primary truncate">
                      {{ attachmentFile ? attachmentFile.name : 'Dokumen Pendukung Terlampir' }}
                    </p>
                    <div class="flex items-center gap-2 text-[11px] text-emerald-700 font-medium">
                      <span>Berkas berhasil diunggah</span>
                      <span>•</span>
                      <a
                        :href="getFileUrl(attachmentUrl)"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="underline hover:text-dark-green inline-flex items-center gap-1 font-bold"
                      >
                        Pratinjau <ExternalLink :size="11" />
                      </a>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  @click="removeAttachment"
                  :disabled="isSubmitting"
                  class="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer shrink-0"
                  title="Hapus berkas"
                >
                  <Trash2 :size="16" />
                </button>
              </div>

              <!-- Default Empty State -->
              <div
                v-else
                @click="fileInputRef?.click()"
                class="p-5 rounded-2xl border-2 border-dashed border-gray-200 hover:border-dark-green/50 bg-gray-50/50 hover:bg-emerald-50/20 transition-all duration-200 cursor-pointer text-center space-y-1.5 group"
              >
                <div class="w-10 h-10 rounded-xl bg-white group-hover:bg-brand-100 border border-gray-200 group-hover:border-emerald-200 text-text-muted group-hover:text-dark-green flex items-center justify-center mx-auto transition-colors shadow-2xs">
                  <UploadCloud :size="20" />
                </div>
                <div>
                  <p class="text-xs font-bold text-text-primary group-hover:text-dark-green transition-colors">
                    Klik untuk memilih surat permohonan / proposal / TOR
                  </p>
                  <p class="text-[11px] text-text-muted">
                    Mendukung PDF, PNG, JPG, JPEG (Maks. 5 MB). Mempermudah persetujuan oleh laboran & pimpinan.
                  </p>
                </div>
              </div>

              <!-- Error state -->
              <p v-if="attachmentError" class="text-[11px] text-danger font-medium flex items-center gap-1">
                <AlertCircle :size="12" />
                <span>{{ attachmentError }}</span>
              </p>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              @click="navigateTo('/lecturer/room-requests')"
              :disabled="isSubmitting"
              class="px-5 py-2.5 rounded-xl border border-gray-200 text-text-secondary text-xs font-bold hover:bg-surface transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              id="btn-submit-room-request"
              :disabled="isSubmitting || isLoadingLabs"
              class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs shadow-dark-green/20 transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Loader2 v-if="isSubmitting" :size="15" class="animate-spin" />
              <Send v-else :size="15" />
              <span>{{ isSubmitting ? 'Mengirimkan Permohonan...' : 'Kirim Permohonan Pinjam' }}</span>
            </button>
          </div>

        </form>
      </div>

      <!-- ======================================================== -->
      <!-- RIGHT COLUMN: 4 COLS (STICKY LIVE SUMMARY & ROOM SPECS) -->
      <!-- ======================================================== -->
      <div class="lg:col-span-4 sticky top-20 space-y-5 w-full min-w-0">
        
        <!-- Live Reservation Summary Card -->
        <div class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-5 sm:p-6 space-y-4">
          <div class="flex items-center justify-between border-b border-gray-100 pb-3">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 font-bold">
                <Building2 :size="16" />
              </div>
              <div>
                <h4 class="text-xs font-extrabold text-text-primary uppercase tracking-wider">Ringkasan Reservasi Langsung</h4>
                <p class="text-[10.5px] text-text-muted">Pemeriksaan parameter seketika</p>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-brand-50 border border-brand-200/80 text-[10px] font-bold text-dark-green font-mono">
              PRATINJAU
            </span>
          </div>

          <!-- Room Snapshot -->
          <div v-if="selectedLaboratory" class="p-3.5 rounded-xl bg-surface/50 border border-gray-100 space-y-2 text-xs">
            <div class="flex items-center justify-between">
              <span class="font-extrabold text-text-primary text-sm">{{ selectedLaboratory.name }}</span>
              <span class="px-2 py-0.5 rounded bg-gray-100 text-text-muted text-[10px] font-mono font-bold">
                {{ selectedLaboratory.code || 'LAB' }}
              </span>
            </div>
            
            <div class="flex items-center gap-1.5 text-[11px] text-text-muted">
              <MapPin :size="13" class="text-dark-green shrink-0" />
              <span class="truncate">{{ selectedLaboratory.location || 'Gedung Laboratorium FIK, Lantai 2' }}</span>
            </div>

            <div class="pt-1 flex items-center justify-between text-[11px] font-medium border-t border-gray-100">
              <span class="text-text-muted">Maks. Komputer:</span>
              <strong class="font-mono text-dark-green font-bold">{{ selectedLaboratory.maximumCapacity }} Kursi</strong>
            </div>
          </div>

          <!-- Parameter Checklist -->
          <div class="space-y-2.5 text-xs">
            <!-- Date -->
            <div class="flex items-center justify-between p-2 rounded-lg bg-surface/30">
              <span class="text-text-muted text-[11px] font-medium flex items-center gap-1.5">
                <Calendar :size="13" class="text-dark-green" />
                <span>Tanggal</span>
              </span>
              <strong class="font-mono text-text-primary text-[11px]">{{ formattedSelectedDate || 'Belum dipilih' }}</strong>
            </div>

            <!-- Time Window -->
            <div class="flex items-center justify-between p-2 rounded-lg bg-surface/30">
              <span class="text-text-muted text-[11px] font-medium flex items-center gap-1.5">
                <Clock :size="13" class="text-dark-green" />
                <span>Rentang Waktu</span>
              </span>
              <strong class="font-mono text-text-primary text-[11px]">
                {{ form.startTime }} – {{ form.endTime }}
                <span v-if="calculatedDuration" class="text-[10px] text-dark-green font-bold">({{ calculatedDuration }})</span>
              </strong>
            </div>

            <!-- Participants -->
            <div class="flex items-center justify-between p-2 rounded-lg bg-surface/30">
              <span class="text-text-muted text-[11px] font-medium flex items-center gap-1.5">
                <Users :size="13" class="text-dark-green" />
                <span>Jumlah Kursi</span>
              </span>
              <strong :class="['font-mono text-[11px]', isCapacityExceeded ? 'text-danger font-black' : 'text-text-primary']">
                {{ form.participantCount || 0 }} Mahasiswa
              </strong>
            </div>

            <!-- Schedule Pattern (Repeat Weekly) -->
            <div class="flex items-center justify-between p-2 rounded-lg" :class="form.isRecurring ? 'bg-emerald-50 border border-emerald-200' : 'bg-surface/30'">
              <span class="text-text-muted text-[11px] font-medium flex items-center gap-1.5">
                <Repeat :size="13" class="text-dark-green" />
                <span>Pola Jadwal</span>
              </span>
              <span :class="['text-[10.5px] font-bold px-2 py-0.5 rounded-full', form.isRecurring ? 'bg-dark-green text-white' : 'bg-gray-100 text-text-muted']">
                {{ form.isRecurring ? `Mingguan (${form.occurrences}x)` : 'Sekali Sesi' }}
              </span>
            </div>

            <!-- Attached Document Indicator -->
            <div class="flex items-center justify-between p-2 rounded-lg bg-surface/30">
              <span class="text-text-muted text-[11px] font-medium flex items-center gap-1.5">
                <Paperclip :size="13" class="text-dark-green" />
                <span>Dokumen Pendukung</span>
              </span>
              <span v-if="attachmentUrl" class="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-dark-green border border-emerald-200 flex items-center gap-1">
                <FileCheck :size="11" />
                <span>Terlampir</span>
              </span>
              <span v-else class="text-[10.5px] text-text-muted">
                Tidak ada
              </span>
            </div>

            <!-- Activity Title -->
            <div class="p-2.5 rounded-lg bg-surface/30 space-y-0.5">
              <span class="text-text-muted text-[10px] font-bold uppercase tracking-wider block">Tujuan Kegiatan</span>
              <p class="font-bold text-text-primary text-xs truncate">
                {{ form.activityName || '— Belum ada kegiatan yang ditentukan —' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Institutional Booking Policy Callout -->
        <div class="bg-brand-50/70 border border-brand-200/70 rounded-2xl p-4 sm:p-5 space-y-2.5 text-xs text-text-secondary">
          <div class="flex items-center gap-2 text-dark-green font-extrabold text-xs">
            <ShieldCheck :size="16" />
            <span>Kebijakan & Ketentuan Peminjaman</span>
          </div>

          <ul class="space-y-1.5 text-[11px] text-text-muted leading-relaxed">
            <li class="flex items-start gap-1.5">
              <CheckCircle2 :size="13" class="text-dark-green shrink-0 mt-0.5" />
              <span>Otomatis masuk ke antrean verifikasi staf laboran terkait.</span>
            </li>
            <li class="flex items-start gap-1.5">
              <CheckCircle2 :size="13" class="text-dark-green shrink-0 mt-0.5" />
              <span>Pendeteksian bentrok jadwal operasional semester secara langsung.</span>
            </li>
            <li class="flex items-start gap-1.5">
              <CheckCircle2 :size="13" class="text-dark-green shrink-0 mt-0.5" />
              <span>Notifikasi instan otomatis terkirim segera setelah permohonan disetujui.</span>
            </li>
          </ul>
        </div>

      </div>

    </div>

  </div>
</template>
