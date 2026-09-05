<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import { useAuthStore } from '@/stores/auth.store'
import {
  ArrowLeft,
  Activity,
  CheckCircle2,
  X,
  Save,
  Plus,
  Loader2,
  AlertCircle,
  Clock,
  Calendar,
  Building2,
  Sparkles,
  Eye,
  ShieldCheck,
  UserCheck,
  Layers
} from 'lucide-vue-next'
import { roomUsageService, type RoomUsage, type CreateRoomUsagePayload, type UpdateRoomUsagePayload } from '@/services/room-usage.service'
import { roomRequestService, type RoomRequest } from '@/services/room-request.service'
import { scheduleService, type ScheduleData } from '@/services/schedule.service'
import { laboratoryService, type LaboratoryData } from '@/services/laboratory.service'

const route = useRoute()
const router = useRouter()
const navStore = useAdminNavStore()
const authStore = useAuthStore()

const usgId = computed(() => route.params.id as string | undefined)
const isEditMode = computed(() => !!usgId.value)

// Check-in mode: 'request' | 'schedule' | 'adhoc'
const checkInMode = ref<'request' | 'schedule' | 'adhoc'>('request')

// Form State
const form = ref({
  requestId: '',
  scheduleId: '',
  laboratoryId: '',
  activityName: '',
  status: 'CHECKED_IN' as 'CHECKED_IN' | 'IN_USE',
  notes: '',
})

// Data sets for dropdowns
const approvedRequests = ref<RoomRequest[]>([])
const schedules = ref<ScheduleData[]>([])
const laboratories = ref<LaboratoryData[]>([])
const isLoadingData = ref(false)

const showToast = ref(false)
const toastMessage = ref('')
const isToastError = ref(false)
const isLoading = ref(false)
const isSaving = ref(false)
const existingUsage = ref<RoomUsage | null>(null)

const liveSummaryActivity = computed(() => {
  if (isEditMode.value) return existingUsage.value?.activityName || 'Sesi Aktif'
  if (checkInMode.value === 'request') {
    const req = approvedRequests.value.find((r) => r.id === form.value.requestId)
    return req ? req.activityName : 'Menunggu Pilihan'
  }
  if (checkInMode.value === 'schedule') {
    const sch = schedules.value.find((s) => s.id === form.value.scheduleId)
    return sch ? `${sch.courseName} (${sch.className})` : 'Menunggu Pilihan'
  }
  return form.value.activityName.trim() || 'Sesi Langsung Ad-Hoc'
})

const liveSummaryLab = computed(() => {
  if (isEditMode.value) return existingUsage.value?.laboratoryName || existingUsage.value?.laboratoryCode || 'Lab Ditugaskan'
  if (checkInMode.value === 'request') {
    const req = approvedRequests.value.find((r) => r.id === form.value.requestId)
    return req ? `${req.laboratoryCode} - ${req.laboratoryName}` : 'Menunggu Pilihan'
  }
  if (checkInMode.value === 'schedule') {
    const sch = schedules.value.find((s) => s.id === form.value.scheduleId)
    return sch ? (sch.laboratoryCode || sch.laboratoryName) : 'Menunggu Pilihan'
  }
  const lab = laboratories.value.find((l) => l.id === form.value.laboratoryId)
  return lab ? `${lab.code} - ${lab.name}` : 'Belum dipilih'
})

onMounted(async () => {
  if (isEditMode.value && usgId.value) {
    await loadUsage()
  } else {
    navStore.setBreadcrumbs([
      { label: 'Dashboard', path: '/admin' },
      { label: 'Log Pemakaian Lab', path: '/admin/room-usage' },
      { label: 'Check-in Manual' },
    ])
    await loadDropdownData()
  }
})

const loadDropdownData = async () => {
  isLoadingData.value = true
  try {
    const [requestsRes, schedulesRes, labsRes] = await Promise.all([
      roomRequestService.getRoomRequests({ status: 'APPROVED', unusedOnly: true, limit: 100 }),
      scheduleService.getSchedules({ limit: 100 }),
      laboratoryService.getLaboratories({ limit: 100 }),
    ])
    approvedRequests.value = requestsRes.data || []
    schedules.value = schedulesRes.schedules || []
    laboratories.value = labsRes.laboratories || []
  } catch (error: any) {
    console.error('Failed to load check-in reference data:', error)
  } finally {
    isLoadingData.value = false
  }
}

const loadUsage = async () => {
  if (!usgId.value) return

  isLoading.value = true
  try {
    existingUsage.value = await roomUsageService.getRoomUsageById(usgId.value)
    form.value = {
      requestId: existingUsage.value.requestId || '',
      scheduleId: existingUsage.value.scheduleId || '',
      laboratoryId: existingUsage.value.laboratoryId || '',
      activityName: existingUsage.value.activityName || '',
      status:
        existingUsage.value.status === 'CHECKED_IN' || existingUsage.value.status === 'IN_USE'
          ? existingUsage.value.status
          : 'CHECKED_IN',
      notes: existingUsage.value.notes || '',
    }
    navStore.setBreadcrumbs([
      { label: 'Dashboard', path: '/admin' },
      { label: 'Log Pemakaian Lab', path: '/admin/room-usage' },
      { label: existingUsage.value.activityName || 'Ubah' },
      { label: 'Ubah' },
    ])
  } catch (error: any) {
    console.error('Failed to load room usage:', error)
    toastMessage.value = error.message || 'Gagal memuat log pemakaian lab'
    isToastError.value = true
    showToast.value = true
    setTimeout(() => {
      router.push('/admin/room-usage')
    }, 2000)
  } finally {
    isLoading.value = false
  }
}

const triggerToast = (msg: string, isError = false) => {
  toastMessage.value = msg
  isToastError.value = isError
  showToast.value = true
}

const handleSave = async () => {
  const currentUser = authStore.user
  if (!currentUser) {
    triggerToast('Pengguna tidak terautentikasi', true)
    return
  }

  if (!isEditMode.value) {
    if (checkInMode.value === 'request' && !form.value.requestId) {
      triggerToast('Silakan pilih Permohonan Pinjam yang telah disetujui', true)
      return
    }
    if (checkInMode.value === 'schedule' && !form.value.scheduleId) {
      triggerToast('Silakan pilih Jadwal Perkuliahan', true)
      return
    }
    if (checkInMode.value === 'adhoc') {
      if (!form.value.laboratoryId) {
        triggerToast('Silakan pilih Laboratorium Tujuan', true)
        return
      }
      if (!form.value.activityName.trim()) {
        triggerToast('Silakan masukkan Nama Kegiatan / Keperluan', true)
        return
      }
    }
  }

  isSaving.value = true

  try {
    if (isEditMode.value && usgId.value) {
      const payload: UpdateRoomUsagePayload = {
        status: form.value.status as any,
        notes: form.value.notes || undefined,
      }

      await roomUsageService.updateRoomUsage(usgId.value, payload)
      triggerToast('Log pemakaian lab berhasil diperbarui.', false)
    } else {
      const payload: CreateRoomUsagePayload = {
        requestId: checkInMode.value === 'request' ? form.value.requestId : undefined,
        scheduleId: checkInMode.value === 'schedule' ? form.value.scheduleId : undefined,
        laboratoryId: checkInMode.value === 'adhoc' ? form.value.laboratoryId : undefined,
        activityName: checkInMode.value === 'adhoc' ? form.value.activityName.trim() : undefined,
        checkedInBy: currentUser.id,
        checkInTime: new Date().toISOString(),
        status: form.value.status,
        notes: form.value.notes || undefined,
      }

      await roomUsageService.createRoomUsage(payload)
      triggerToast('Data check-in manual berhasil dibuat.', false)
    }

    setTimeout(() => {
      showToast.value = false
      if (isEditMode.value && usgId.value) {
        router.push(`/admin/room-usage/${usgId.value}`)
      } else {
        router.push('/admin/room-usage')
      }
    }, 1000)
  } catch (error: any) {
    console.error('Failed to save room usage:', error)
    triggerToast(error.message || 'Gagal menyimpan log pemakaian lab', true)
  } finally {
    isSaving.value = false
  }
}

const handleCancel = () => {
  if (isEditMode.value && usgId.value) {
    router.push(`/admin/room-usage/${usgId.value}`)
  } else {
    router.push('/admin/room-usage')
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
        <span>Kembali ke Log Pemakaian Lab</span>
      </button>

      <div class="pb-3 border-b border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
              {{ isEditMode ? 'Ubah Log Pemakaian Lab' : 'Check-in Ruangan Manual' }}
            </h1>
            <span class="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-brand-100 text-dark-green text-xs font-extrabold border border-brand-200">
              <Sparkles :size="13" />
              <span>{{ isEditMode ? 'Data Sesi Aktif' : 'Check-in Baru' }}</span>
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted font-medium">
            {{ isEditMode ? 'Perbarui status operasional check-in atau catatan serah terima sesi.' : 'Catat sesi check-in laboratorium aktif dari permohonan yang disetujui, jadwal perkuliahan, atau keperluan ad-hoc.' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Dynamic Feedback Banner -->
    <div
      v-if="showToast"
      :class="[
        'p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in zoom-in-95 duration-150',
        isToastError ? 'bg-red-50 border-red-200 text-danger' : 'bg-brand-100/90 border-brand-200 text-dark-green'
      ]"
    >
      <div class="flex items-center gap-2">
        <AlertCircle v-if="isToastError" :size="16" class="text-danger shrink-0" />
        <CheckCircle2 v-else :size="16" class="text-dark-green shrink-0" />
        <span>{{ toastMessage }}</span>
      </div>
      <button @click="showToast = false" class="hover:opacity-80 cursor-pointer">
        <X :size="14" />
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-20 text-center">
      <div class="inline-flex items-center gap-3 text-text-muted">
        <Loader2 :size="24" class="animate-spin text-dark-green" />
        <span class="text-xs font-medium">Memuat data pemakaian lab...</span>
      </div>
    </div>

    <!-- 2. MAIN 2-COLUMN GRID (8 COLS FORM + 4 COLS SIDEBAR) -->
    <form v-if="!isLoading" @submit.prevent="handleSave" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- ======================================================== -->
      <!-- LEFT COLUMN: MAIN FORM SECTIONS (8 COLS)                 -->
      <!-- ======================================================== -->
      <div class="lg:col-span-8 space-y-5">
        <!-- Section 1: Check-in Source & Mode -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 sm:p-7 space-y-5">
          <div class="flex items-center gap-3 border-b border-gray-100 pb-3.5">
            <div class="w-10 h-10 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <Activity :size="20" stroke-width="2.2" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-text-primary tracking-tight">Sumber Check-in & Laboratorium</h3>
              <p class="text-xs text-text-muted">Pilih sumber otorisasi untuk sesi check-in ruangan ini.</p>
            </div>
          </div>

          <!-- Mode Selector Tabs (Creation Mode Only) -->
          <div v-if="!isEditMode" class="space-y-2">
            <label class="block text-xs font-bold text-text-primary">Mode Otorisasi Sumber</label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 bg-surface/80 border border-gray-200/80 rounded-xl text-xs font-bold">
              <button
                type="button"
                @click="checkInMode = 'request'; form.scheduleId = ''; form.laboratoryId = ''; form.activityName = ''"
                :class="[
                  'py-2.5 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer',
                  checkInMode === 'request'
                    ? 'bg-white text-dark-green shadow-xs border border-gray-200/80 font-black'
                    : 'text-text-muted hover:text-text-primary'
                ]"
              >
                <Calendar :size="14" />
                <span>Permohonan Disetujui</span>
              </button>
              <button
                type="button"
                @click="checkInMode = 'schedule'; form.requestId = ''; form.laboratoryId = ''; form.activityName = ''"
                :class="[
                  'py-2.5 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer',
                  checkInMode === 'schedule'
                    ? 'bg-white text-dark-green shadow-xs border border-gray-200/80 font-black'
                    : 'text-text-muted hover:text-text-primary'
                ]"
              >
                <Clock :size="14" />
                <span>Jadwal Perkuliahan</span>
              </button>
              <button
                type="button"
                @click="checkInMode = 'adhoc'; form.requestId = ''; form.scheduleId = ''"
                :class="[
                  'py-2.5 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer',
                  checkInMode === 'adhoc'
                    ? 'bg-white text-dark-green shadow-xs border border-gray-200/80 font-black'
                    : 'text-text-muted hover:text-text-primary'
                ]"
              >
                <Building2 :size="14" />
                <span>Langsung (Ad-Hoc)</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <!-- Mode 1: From Approved Room Request -->
            <div v-if="!isEditMode && checkInMode === 'request'" class="sm:col-span-2 space-y-1.5">
              <label class="block font-bold text-text-primary">
                Permohonan Pinjam Disetujui <span class="text-danger">*</span>
              </label>
              <select
                v-model="form.requestId"
                :disabled="isLoadingData"
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              >
                <option value="" disabled>Pilih permohonan pinjam yang disetujui...</option>
                <option v-for="request in approvedRequests" :key="request.id" :value="request.id">
                  {{ request.activityName }} — {{ request.laboratoryCode }} ({{ request.formattedRequestDate }} {{ request.startTime }}–{{ request.endTime }}) • {{ request.applicantName }}
                </option>
              </select>
              <p v-if="approvedRequests.length === 0 && !isLoadingData" class="text-[11px] text-text-muted mt-1">
                Tidak ada permohonan pinjam disetujui yang menunggu. Anda juga dapat memilih <strong>Check-in Langsung (Ad-Hoc)</strong>.
              </p>
            </div>

            <!-- Mode 2: From Timetable Schedule -->
            <div v-if="!isEditMode && checkInMode === 'schedule'" class="sm:col-span-2 space-y-1.5">
              <label class="block font-bold text-text-primary">
                Jadwal Perkuliahan <span class="text-danger">*</span>
              </label>
              <select
                v-model="form.scheduleId"
                :disabled="isLoadingData"
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              >
                <option value="" disabled>Pilih jadwal perkuliahan...</option>
                <option v-for="sch in schedules" :key="sch.id" :value="sch.id">
                  {{ sch.courseName }} ({{ sch.className }}) — {{ sch.laboratoryCode || sch.laboratoryName }} • {{ sch.dayName }} {{ sch.startTime }}–{{ sch.endTime }} ({{ sch.lecturerName }})
                </option>
              </select>
            </div>

            <!-- Mode 3: Direct / Ad-Hoc Session -->
            <template v-if="!isEditMode && checkInMode === 'adhoc'">
              <div class="space-y-1.5">
                <label class="block font-bold text-text-primary">
                  Laboratorium Tujuan <span class="text-danger">*</span>
                </label>
                <select
                  v-model="form.laboratoryId"
                  :disabled="isLoadingData"
                  class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
                >
                  <option value="" disabled>Pilih laboratorium...</option>
                  <option v-for="lab in laboratories" :key="lab.id" :value="lab.id">
                    {{ lab.code }} — {{ lab.name }} (Kapasitas: {{ lab.maximumCapacity }})
                  </option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="block font-bold text-text-primary">
                  Nama Kegiatan / Keperluan <span class="text-danger">*</span>
                </label>
                <input
                  v-model="form.activityName"
                  type="text"
                  placeholder="mis. Pemeliharaan Khusus Lab / Sesi Belajar Mandiri"
                  class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
                />
              </div>
            </template>

            <!-- Edit Mode View -->
            <div v-if="isEditMode && existingUsage" class="sm:col-span-2 space-y-1.5">
              <label class="block font-bold text-text-primary">Kegiatan & Ruangan Terkait</label>
              <div class="p-3 rounded-xl bg-surface/70 border border-gray-200/70 font-semibold text-text-primary">
                {{ existingUsage.activityName || 'Sesi Aktif' }} — {{ existingUsage.laboratoryName }} ({{ existingUsage.laboratoryCode }})
              </div>
            </div>
          </div>
        </div>

        <!-- Section 2: Status & Session Handover Notes -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 sm:p-7 space-y-5">
          <div class="flex items-center gap-3 border-b border-gray-100 pb-3.5">
            <div class="w-10 h-10 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <Clock :size="20" stroke-width="2.2" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-text-primary tracking-tight">Status Pelaksanaan & Catatan</h3>
              <p class="text-xs text-text-muted">Atur status okupansi aktif dan catat kondisi peralatan.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">Status Operasional <span class="text-danger">*</span></label>
              <select
                v-model="form.status"
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              >
                <option value="CHECKED_IN">CHECKED_IN (Ruangan Dibuka)</option>
                <option value="IN_USE">IN_USE (Sedang Digunakan & Aktif)</option>
              </select>
            </div>

            <div v-if="isEditMode" class="space-y-1.5">
              <label class="block font-bold text-text-primary">Petugas / Staf</label>
              <input
                :value="existingUsage?.checkedInByName || 'Staf Lab'"
                type="text"
                disabled
                class="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200/80 rounded-xl font-semibold text-text-muted cursor-not-allowed"
              />
            </div>

            <div class="sm:col-span-2 space-y-1.5">
              <label class="block font-bold text-text-primary">Catatan Serah Terima Sesi (Opsional)</label>
              <textarea
                v-model="form.notes"
                rows="3"
                placeholder="Daftar periksa peralatan, jumlah peserta, atau catatan operasional khusus..."
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-medium text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white resize-none leading-relaxed transition-colors"
              ></textarea>
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
              <span>Ringkasan Pemakaian</span>
            </h4>
            <span
              :class="[
                'px-2 py-0.5 rounded-full text-[10px] font-extrabold border',
                form.status === 'IN_USE'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-teal-50 text-teal-800 border-teal-200'
              ]"
            >
              {{ form.status === 'IN_USE' ? 'Sedang Digunakan' : 'Check-in' }}
            </span>
          </div>

          <div class="space-y-3 text-xs">
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Mode Sumber</span>
              <span class="font-bold text-dark-green uppercase text-[10px]">
                {{ isEditMode ? 'LOG AKTIF' : (checkInMode === 'request' ? 'PERMOHONAN' : checkInMode === 'schedule' ? 'JADWAL' : 'AD-HOC') }}
              </span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Kegiatan</span>
              <span class="font-bold text-text-primary truncate max-w-[170px] text-right">{{ liveSummaryActivity }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Lab Tujuan</span>
              <span class="font-bold text-text-primary truncate max-w-[170px] text-right">{{ liveSummaryLab }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5">
              <span class="text-text-muted font-medium">Petugas Pengawas</span>
              <span class="font-semibold text-text-secondary truncate max-w-[170px] text-right">
                {{ isEditMode ? (existingUsage?.checkedInByName || 'Staf') : (authStore.userName || authStore.user?.full_name || 'Staf Aktif') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Room Check-in Policy Guidelines Card -->
        <div class="bg-brand-50/60 rounded-2xl border border-brand-200/80 p-5 space-y-2.5 text-xs">
          <div class="flex items-center gap-2 font-bold text-dark-green">
            <ShieldCheck :size="16" />
            <span>Panduan Check-in</span>
          </div>
          <ul class="text-[11px] text-text-secondary space-y-1.5 list-disc list-inside leading-relaxed">
            <li>Melakukan check-in ruangan akan langsung menampilkan lencana <strong>DIGUNAKAN</strong> pada layar kiosk publik.</li>
            <li>Ingat untuk melakukan check-out setelah sesi selesai agar status ruangan kembali tersedia.</li>
            <li>Verifikasi jumlah komputer dan kondisi peralatan sebelum menyetujui akses masuk.</li>
          </ul>
        </div>

        <!-- Sticky Primary Action Buttons Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-3">
          <button
            type="submit"
            :disabled="isSaving"
            class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#3B694A] to-[#2D5A3F] hover:from-[#31573E] hover:to-[#244430] text-white font-extrabold text-xs shadow-xs shadow-[#2D5A3F]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Loader2 v-if="isSaving" :size="16" class="animate-spin" />
            <Save v-else-if="isEditMode" :size="16" />
            <Plus v-else :size="16" />
            <span>{{ isSaving ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Check-in Laboratorium') }}</span>
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
