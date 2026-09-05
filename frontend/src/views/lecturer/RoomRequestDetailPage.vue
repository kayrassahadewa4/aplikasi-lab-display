<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLecturerNavStore } from '@/stores/lecturer-nav.store'
import {
  ArrowLeft,
  ClipboardList,
  Clock,
  FlaskConical,
  User,
  Building2,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  X,
  Calendar,
  Trash2,
  Loader2,
  Users,
  ShieldCheck,
  Sparkles
} from 'lucide-vue-next'
import { roomRequestService, type RoomRequest } from '@/services/room-request.service'

const route = useRoute()
const router = useRouter()
const navStore = useLecturerNavStore()

// State
const request = ref<RoomRequest | null>(null)
const isLoading = ref(true)
const isActionLoading = ref(false)
const errorMessage = ref<string | null>(null)

// Modals
const showCancelModal = ref(false)
const showDeleteModal = ref(false)

// Toast Feedback Banner
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')

const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 4000)
}

const fetchRequestDetail = async () => {
  const reqId = route.params.id as string
  if (!reqId) {
    errorMessage.value = 'ID permohonan tidak diberikan.'
    isLoading.value = false
    return
  }

  isLoading.value = true
  errorMessage.value = null

  try {
    const data = await roomRequestService.getRoomRequestById(reqId)
    request.value = data
    navStore.setBreadcrumbs([
      { label: 'Portal Dosen', path: '/lecturer' },
      { label: 'Permohonan Pinjam', path: '/lecturer/room-requests' },
      { label: data.activityName || 'Detail Permohonan' },
    ])
  } catch (err: any) {
    console.error('Failed to load room request detail:', err)
    errorMessage.value = err.message || 'Data permohonan tidak ditemukan atau akses ditolak.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchRequestDetail()
})

const navigateTo = (path: string) => {
  router.push(path)
}

// Cancel Request Handler for PENDING requests
const handleCancelRequest = async () => {
  if (!request.value || request.value.status !== 'PENDING') return

  isActionLoading.value = true
  try {
    await roomRequestService.cancelRoomRequest(request.value.id)
    triggerToast('Permohonan pinjam berhasil dibatalkan.', 'success')
    showCancelModal.value = false
    await fetchRequestDetail()
  } catch (err: any) {
    triggerToast(err.message || 'Gagal membatalkan permohonan pinjam.', 'error')
  } finally {
    isActionLoading.value = false
  }
}

// Delete Request Handler for PENDING/CANCELLED requests
const handleDeleteRequest = async () => {
  if (!request.value) return

  isActionLoading.value = true
  try {
    await roomRequestService.deleteRoomRequest(request.value.id)
    showDeleteModal.value = false
    router.push('/lecturer/room-requests')
  } catch (err: any) {
    triggerToast(err.message || 'Gagal menghapus permohonan pinjam.', 'error')
  } finally {
    isActionLoading.value = false
  }
}
</script>

<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="flex items-center justify-center min-h-[400px]">
    <div class="text-center space-y-3">
      <div class="w-12 h-12 border-4 border-brand-200 border-t-dark-green rounded-full animate-spin mx-auto"></div>
      <p class="text-sm text-text-muted font-medium">Memuat detail permohonan pinjam...</p>
    </div>
  </div>

  <!-- Error State -->
  <div v-else-if="errorMessage || !request" class="flex items-center justify-center min-h-[400px]">
    <div class="text-center space-y-4 max-w-md">
      <div class="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
        <AlertCircle :size="32" class="text-red-600" />
      </div>
      <div>
        <h3 class="text-lg font-bold text-text-primary mb-1">Gagal Memuat Permohonan</h3>
        <p class="text-sm text-text-muted">{{ errorMessage || 'Data permohonan pinjam tidak ditemukan.' }}</p>
      </div>
      <button
        @click="navigateTo('/lecturer/room-requests')"
        class="px-4 py-2 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
      >
        Kembali ke Permohonan Saya
      </button>
    </div>
  </div>

  <!-- Content (Full-width 12-column grid: 8 cols + 4 cols) -->
  <div v-else class="space-y-6 pb-12 w-full max-w-full min-w-0 select-none">
    <!-- 1. Page Header with Back Button -->
    <div>
      <button
        @click="navigateTo('/lecturer/room-requests')"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-dark-green hover:underline mb-2 cursor-pointer"
      >
        <ArrowLeft :size="14" />
        <span>Kembali ke Permohonan Pinjam</span>
      </button>

      <div class="pb-3 border-b border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
              {{ request.activityName }}
            </h1>
            <span
              :class="[
                'inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-extrabold border shadow-2xs',
                request.status === 'APPROVED'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : request.status === 'PENDING'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : request.status === 'REJECTED'
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : 'bg-gray-100 border-gray-200 text-text-muted'
              ]"
            >
              <Clock v-if="request.status === 'PENDING'" :size="13" />
              <CheckCircle2 v-else-if="request.status === 'APPROVED'" :size="13" />
              <XCircle v-else :size="13" />
              <span>{{
                request.status === 'PENDING'
                  ? 'Menunggu'
                  : request.status === 'APPROVED'
                    ? 'Disetujui'
                    : request.status === 'REJECTED'
                      ? 'Ditolak'
                      : 'Dibatalkan'
              }}</span>
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted font-medium">
            Diajukan pada {{ request.createdAt }} • Target: {{ request.laboratoryCode }} ({{ request.formattedRequestDate }})
          </p>
        </div>
      </div>
    </div>

    <!-- Toast Notification Banner -->
    <div
      v-if="showToast"
      :class="[
        'p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in zoom-in-95 duration-150',
        toastType === 'success' ? 'bg-emerald-50 border-emerald-200 text-dark-green' : 'bg-red-50 border-red-200 text-danger'
      ]"
    >
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <CheckCircle2 v-if="toastType === 'success'" :size="16" class="text-dark-green shrink-0" />
        <AlertCircle v-else :size="16" class="text-danger shrink-0" />
        <span class="truncate">{{ toastMessage }}</span>
      </div>
      <button @click="showToast = false" class="hover:opacity-80 shrink-0 cursor-pointer">
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
              <ClipboardList :size="28" stroke-width="2.2" />
            </div>
            <div>
              <h2 class="text-lg font-extrabold text-text-primary">{{ request.activityName }}</h2>
              <p class="text-xs text-text-muted mt-0.5 font-medium">Mata Kuliah: {{ request.courseName || 'Umum' }} • Kelas: {{ request.className || 'Umum' }}</p>
            </div>
          </div>
          <span class="text-xs font-mono font-bold text-dark-green bg-brand-50 px-3 py-1 rounded-full border border-brand-200/60 self-start sm:self-auto">
            Waktu Standar WIB (UTC+7)
          </span>
        </div>

        <!-- Structured Attributes & Details Grid -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 space-y-5">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-extrabold text-text-primary tracking-tight">Spesifikasi Permohonan Pinjam</h3>
            <p class="text-xs text-text-muted">Ruang tujuan, rentang reservasi, dan jumlah peserta.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Calendar :size="13" class="text-dark-green" />
                <span>Tanggal Kegiatan</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ request.formattedRequestDate }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Clock :size="13" class="text-dark-green" />
                <span>Rentang Waktu</span>
              </div>
              <p class="text-xs font-mono font-black text-dark-green truncate">{{ request.startTime }} – {{ request.endTime }} WIB</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Building2 :size="13" class="text-dark-green" />
                <span>Laboratorium yang Dituju</span>
              </div>
              <p class="text-xs font-mono font-black text-dark-green truncate">{{ request.laboratoryCode }} ({{ request.laboratoryName }})</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Users :size="13" class="text-dark-green" />
                <span>Estimasi Peserta</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ request.participantCount }} Mahasiswa {{ request.className ? `(${request.className})` : '' }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <User :size="13" class="text-dark-green" />
                <span>Pemohon</span>
              </div>
              <p class="text-xs font-bold text-dark-green truncate">{{ request.applicantName }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <ShieldCheck :size="13" class="text-dark-green" />
                <span>Status Permohonan</span>
              </div>
              <p class="text-xs font-bold text-dark-green truncate">{{
                request.status === 'PENDING'
                  ? 'Menunggu'
                  : request.status === 'APPROVED'
                    ? 'Disetujui'
                    : request.status === 'REJECTED'
                      ? 'Ditolak'
                      : 'Dibatalkan'
              }}</p>
            </div>
          </div>
        </div>

        <!-- Purpose / Description -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 space-y-4">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-extrabold text-text-primary tracking-tight">Tujuan & Keterangan Rinci Permohonan</h3>
            <p class="text-xs text-text-muted">Kebutuhan khusus sesi dan catatan lingkungan perangkat lunak.</p>
          </div>

          <div class="p-4 rounded-xl bg-surface/60 border border-gray-200/70 text-xs text-text-primary leading-relaxed whitespace-pre-line font-medium">
            {{ request.description }}
          </div>
        </div>

        <!-- Rejection Reason (if rejected) -->
        <div v-if="request.status === 'REJECTED' && request.rejectionReason" class="bg-rose-50 rounded-2xl border border-rose-200 p-6 space-y-2">
          <h4 class="text-xs font-bold text-rose-800 flex items-center gap-2">
            <AlertCircle :size="16" class="text-rose-600" />
            <span>Alasan Penolakan</span>
          </h4>
          <p class="text-xs text-rose-700 font-medium leading-relaxed">{{ request.rejectionReason }}</p>
        </div>

        <!-- Approval Info (if approved) -->
        <div v-if="request.status === 'APPROVED' && request.approverName" class="bg-emerald-50/70 rounded-2xl border border-emerald-200 p-6 space-y-2">
          <h4 class="text-xs font-bold text-dark-green flex items-center gap-2">
            <CheckCircle2 :size="16" class="text-dark-green" />
            <span>Disetujui oleh Administrator / Laboran</span>
          </h4>
          <p class="text-xs text-dark-green font-medium leading-relaxed">
            Ditinjau dan disetujui oleh {{ request.approverName }} pada {{ request.approvedAt || request.updatedAt }}.
          </p>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- RIGHT COLUMN: ACTIONS & CONTEXTUAL SIDEBAR (4 COLS)      -->
      <!-- ======================================================== -->
      <div class="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
        <!-- Actions Management Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 sm:p-6 space-y-3">
          <h4 class="text-xs font-black uppercase tracking-wider text-text-primary">Tindakan Pengelolaan</h4>

          <!-- Cancel Action (If PENDING) -->
          <button
            v-if="request.status === 'PENDING'"
            @click="showCancelModal = true"
            :disabled="isActionLoading"
            class="w-full py-3 px-4 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <XCircle :size="15" />
            <span>Batalkan Permohonan Pinjam</span>
          </button>

          <!-- Delete Action (If PENDING or CANCELLED) -->
          <button
            v-if="request.status === 'PENDING' || request.status === 'CANCELLED'"
            @click="showDeleteModal = true"
            :disabled="isActionLoading"
            class="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Trash2 :size="15" />
            <span>Hapus Data Permohonan</span>
          </button>

          <!-- Back Shortcut -->
          <button
            @click="navigateTo('/lecturer/room-requests')"
            class="w-full py-2.5 px-4 rounded-xl border border-gray-200/80 hover:bg-surface text-text-secondary font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
          >
            <span>Kembali ke Permohonan Saya</span>
          </button>
        </div>

        <!-- Target Laboratory Snapshot Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-3">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <h4 class="text-xs font-black uppercase tracking-wider text-text-secondary">Ruangan yang Dituju</h4>
            <span class="px-2 py-0.5 rounded-full bg-brand-100 font-mono text-[10px] font-bold text-dark-green">
              {{ request.laboratoryCode }}
            </span>
          </div>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between py-1 border-b border-gray-50">
              <span class="text-text-muted">Ruang Target</span>
              <span class="font-bold text-text-primary truncate max-w-[170px] text-right">{{ request.laboratoryName }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-gray-50">
              <span class="text-text-muted">Tanggal Peminjaman</span>
              <span class="font-bold text-dark-green">{{ request.formattedRequestDate }}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-text-muted">Rentang Waktu</span>
              <span class="font-mono font-bold text-text-primary">{{ request.startTime }} – {{ request.endTime }}</span>
            </div>
          </div>
        </div>

        <!-- System Audit Information -->
        <div class="bg-surface/60 rounded-2xl border border-gray-200/70 p-4 space-y-2 text-[11px] text-text-muted">
          <div class="flex justify-between">
            <span>UUID Permohonan</span>
            <span class="font-mono text-[10px] text-text-secondary truncate max-w-[140px]">{{ request.id }}</span>
          </div>
          <div class="flex justify-between">
            <span>Diajukan Pada</span>
            <span class="font-medium text-text-secondary truncate max-w-[140px]">{{ request.createdAt }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Cancellation Confirmation Modal -->
    <div
      v-if="showCancelModal"
      class="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <AlertTriangle :size="20" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-text-primary">Batalkan Permohonan Pinjam?</h3>
            <p class="text-xs text-text-muted">Status permohonan akan diubah menjadi DIBATALKAN.</p>
          </div>
        </div>

        <p class="text-xs text-text-secondary leading-relaxed">
          Apakah Anda yakin ingin membatalkan permohonan pinjam untuk <strong>"{{ request?.activityName }}"</strong>?
        </p>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            @click="showCancelModal = false"
            :disabled="isActionLoading"
            class="px-4 py-2 rounded-xl border border-gray-200 text-text-secondary text-xs font-bold hover:bg-surface cursor-pointer"
          >
            Tidak, Pertahankan
          </button>
          <button
            @click="handleCancelRequest"
            :disabled="isActionLoading"
            class="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Loader2 v-if="isActionLoading" :size="14" class="animate-spin" />
            <span>Ya, Batalkan Permohonan</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Deletion Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95">
        <div class="flex items-center gap-3 text-red-600">
          <div class="p-2 bg-red-50 rounded-xl">
            <Trash2 :size="20" />
          </div>
          <h3 class="text-sm font-bold text-text-primary">Hapus Permohonan Pinjam?</h3>
        </div>

        <p class="text-xs text-text-secondary leading-relaxed">
          Apakah Anda yakin ingin menghapus permohonan untuk <strong>"{{ request?.activityName }}"</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            @click="showDeleteModal = false"
            :disabled="isActionLoading"
            class="px-4 py-2 rounded-xl border border-gray-200 text-text-secondary text-xs font-bold hover:bg-surface cursor-pointer"
          >
            Batal
          </button>
          <button
            @click="handleDeleteRequest"
            :disabled="isActionLoading"
            class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Loader2 v-if="isActionLoading" :size="14" class="animate-spin" />
            <span>Hapus Permohonan</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
