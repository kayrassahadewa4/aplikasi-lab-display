<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Loader2,
  AlertTriangle
} from 'lucide-vue-next'
import { roomRequestService, type RoomRequest } from '@/services/room-request.service'
import { authService } from '@/services/auth.service'
import { BaseAvatar } from '@/components'

const route = useRoute()
const router = useRouter()
const navStore = useAdminNavStore()

const reqId = route.params.id as string
const request = ref<RoomRequest | null>(null)

const rejectionReason = ref('')
const showToast = ref(false)
const toastMessage = ref('')
const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  await loadRoomRequest()
})

const loadRoomRequest = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    request.value = await roomRequestService.getRoomRequestById(reqId)

    navStore.setBreadcrumbs([
      { label: 'Dashboard', path: '/admin' },
      { label: 'Permohonan Pinjam', path: '/admin/room-requests' },
      { label: request.value.activityName, path: `/admin/room-requests/${request.value.id}` },
      { label: 'Tinjau Permohonan' },
    ])
  } catch (error: any) {
    errorMessage.value = error.message || 'Gagal memuat data permohonan pinjam lab'
    console.error('Failed to load room request:', error)
  } finally {
    isLoading.value = false
  }
}

const handleApprove = async () => {
  if (!request.value) return

  isSaving.value = true
  errorMessage.value = ''

  try {
    const currentUser = await authService.getCurrentUser()
    if (!currentUser) {
      errorMessage.value = 'Pengguna belum diautentikasi'
      return
    }

    await roomRequestService.approveRoomRequest(reqId, currentUser.id)

    toastMessage.value = 'Permohonan peminjaman berhasil DISETUJUI.'
    showToast.value = true

    setTimeout(() => {
      showToast.value = false
      router.push(`/admin/room-requests/${reqId}`)
    }, 1000)
  } catch (error: any) {
    errorMessage.value = error.message || 'Gagal menyetujui permohonan pinjam lab'
    console.error('Failed to approve room request:', error)
  } finally {
    isSaving.value = false
  }
}

const handleReject = async () => {
  if (!rejectionReason.value) {
    errorMessage.value = 'Harap berikan alasan penolakan'
    return
  }
  if (!request.value) return

  isSaving.value = true
  errorMessage.value = ''

  try {
    await roomRequestService.rejectRoomRequest(reqId, rejectionReason.value)

    toastMessage.value = 'Permohonan peminjaman DITOLAK.'
    showToast.value = true

    setTimeout(() => {
      showToast.value = false
      router.push(`/admin/room-requests/${reqId}`)
    }, 1000)
  } catch (error: any) {
    errorMessage.value = error.message || 'Gagal menolak permohonan pinjam lab'
    console.error('Failed to reject room request:', error)
  } finally {
    isSaving.value = false
  }
}

const handleCancel = () => {
  router.push(`/admin/room-requests/${reqId}`)
}
</script>

<template>
  <div class="space-y-6 pb-8 max-w-4xl mx-auto select-none">

    <!-- Loading State -->
    <div v-if="isLoading" class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-12 text-center">
      <Loader2 :size="36" class="mx-auto text-dark-green animate-spin mb-2" />
      <p class="text-xs text-text-muted font-bold">Memuat data permohonan pinjam...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="!isLoading && !request" class="space-y-4">
      <div class="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center justify-between shadow-xs">
        <div class="flex items-center gap-2">
          <AlertTriangle :size="16" class="shrink-0" />
          <span>{{ errorMessage || 'Data permohonan pinjam lab tidak ditemukan' }}</span>
        </div>
        <button @click="router.push('/admin/room-requests')" class="text-red-700 hover:opacity-80">
          <X :size="14" />
        </button>
      </div>
    </div>

    <!-- Content -->
    <template v-else-if="request">

    <!-- Top Back Link -->
    <div>
      <button
        @click="handleCancel"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-dark-green hover:underline mb-2 cursor-pointer"
      >
        <ArrowLeft :size="14" />
        <span>Kembali ke Detail Permohonan</span>
      </button>

      <!-- Page Header -->
      <div class="pb-2.5 border-b border-gray-200/60 flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
              Tinjau Permohonan Pinjam
            </h1>
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-bold">
              <AlertCircle :size="12" />
              Menunggu Evaluasi
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted font-normal">
            Evaluasi ketersediaan kapasitas ruang, risiko konflik jadwal, dan setujui/tolak permohonan.
          </p>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div
      v-if="errorMessage"
      class="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center justify-between shadow-xs"
    >
      <div class="flex items-center gap-2">
        <AlertTriangle :size="16" class="shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>
      <button @click="errorMessage = ''" class="text-red-700 hover:opacity-80 cursor-pointer">
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

    <!-- Summary Details Card -->
    <div class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-5 sm:p-6 space-y-4">
      <div class="border-b border-gray-100 pb-3 flex items-center justify-between">
        <div>
          <h3 class="text-base font-bold text-text-primary tracking-tight">Ringkasan Permohonan</h3>
          <p class="text-xs text-text-muted">Detail kegiatan, ruangan, tanggal, dan jadwal pelaksanaan.</p>
        </div>
        <span class="font-mono text-xs font-bold text-dark-green bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200/80">
          ID: {{ request.id.slice(0, 8).toUpperCase() }}
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        <div class="p-3.5 rounded-xl border border-gray-100 bg-surface/50 space-y-1">
          <span class="text-text-muted font-bold uppercase text-[10px] tracking-wider block">Judul Kegiatan</span>
          <span class="font-extrabold text-text-primary text-sm block truncate">{{ request.activityName }}</span>
          <span class="text-[11px] text-text-muted">{{ request.courseName || 'Kegiatan Umum' }}</span>
        </div>

        <div class="p-3.5 rounded-xl border border-gray-100 bg-surface/50 space-y-1">
          <span class="text-text-muted font-bold uppercase text-[10px] tracking-wider block">Nama Pemohon</span>
          <div class="flex items-center gap-2.5 pt-0.5">
            <BaseAvatar :src="request.applicantAvatar" :name="request.applicantName" size="sm" class="shrink-0 ring-2 ring-brand-200/60" />
            <div>
              <span class="font-extrabold text-text-primary text-sm block leading-tight">{{ request.applicantName }}</span>
              <span class="text-[11px] text-dark-green font-bold block">{{ request.applicantRole }}</span>
            </div>
          </div>
        </div>

        <div class="p-3.5 rounded-xl border border-gray-100 bg-surface/50 space-y-1">
          <span class="text-text-muted font-bold uppercase text-[10px] tracking-wider block">Laboratorium yang Dituju</span>
          <span class="font-mono font-extrabold text-dark-green text-sm block">{{ request.laboratoryName }}</span>
          <span class="text-[11px] text-text-muted font-mono font-medium">Kode: {{ request.laboratoryCode }}</span>
        </div>

        <div class="p-3.5 rounded-xl border border-gray-100 bg-surface/50 space-y-1">
          <span class="text-text-muted font-bold uppercase text-[10px] tracking-wider block">Tanggal & Sesi Waktu</span>
          <span class="font-extrabold text-text-primary text-sm block">{{ request.startTime }} – {{ request.endTime }}</span>
          <span class="text-[11px] text-text-muted">{{ request.formattedRequestDate }}</span>
        </div>

        <div class="p-3.5 rounded-xl border border-gray-100 bg-surface/50 space-y-1">
          <span class="text-text-muted font-bold uppercase text-[10px] tracking-wider block">Peserta & Kelas</span>
          <span class="font-extrabold text-text-primary text-sm block">{{ request.participantCount }} Peserta</span>
          <span class="text-[11px] text-text-muted">{{ request.className || 'Semua Kelas' }}</span>
        </div>

        <div class="p-3.5 rounded-xl border border-gray-100 bg-surface/50 space-y-1">
          <span class="text-text-muted font-bold uppercase text-[10px] tracking-wider block">Waktu Pengajuan</span>
          <span class="font-extrabold text-text-primary text-sm block font-mono">{{ request.createdAt }}</span>
          <span class="text-[11px] text-text-muted">Tercatat dalam antrean audit</span>
        </div>
      </div>

      <!-- Description / Justification -->
      <div v-if="request.description" class="p-4 rounded-xl border border-gray-100 bg-surface/40 space-y-1">
        <span class="text-text-muted font-bold uppercase text-[10px] tracking-wider block">Tujuan / Keterangan</span>
        <p class="text-xs text-text-primary leading-relaxed whitespace-pre-line">{{ request.description }}</p>
      </div>
    </div>

    <!-- Review Decision Actions Card -->
    <div class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-5 sm:p-6 space-y-6">
      <div class="border-b border-gray-100 pb-3">
        <h3 class="text-base font-bold text-text-primary tracking-tight">Keputusan Persetujuan</h3>
        <p class="text-xs text-text-muted">Setujui alokasi ruangan atau tolak dengan alasan penjelasan yang wajib diisi.</p>
      </div>

      <div class="space-y-4">
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block font-bold text-text-primary text-xs">Alasan Penolakan (Wajib diisi jika menolak permohonan)</label>
            <span class="text-[11px] text-text-muted font-mono">{{ rejectionReason.length }} karakter</span>
          </div>
          <textarea
            v-model="rejectionReason"
            rows="3"
            placeholder="Sebutkan alasan penolakan (mis. Konflik jadwal dengan perkuliahan reguler)..."
            :disabled="isSaving"
            class="w-full px-3.5 py-2.5 bg-surface border border-gray-200/80 rounded-xl font-medium text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary focus:bg-white resize-none leading-relaxed disabled:opacity-50 transition-all duration-150"
          ></textarea>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            @click="handleReject"
            :disabled="!rejectionReason.trim() || isSaving"
            class="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.99] disabled:opacity-40 text-white font-bold text-xs shadow-2xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer select-none"
          >
            <Loader2 v-if="isSaving" :size="15" class="animate-spin" />
            <XCircle v-else :size="15" />
            <span>Tolak Permohonan</span>
          </button>

          <button
            type="button"
            @click="handleApprove"
            :disabled="isSaving"
            class="px-5 py-2.5 rounded-xl bg-dark-green hover:bg-[#547a5c] active:scale-[0.99] text-white font-bold text-xs shadow-2xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 select-none"
          >
            <Loader2 v-if="isSaving" :size="15" class="animate-spin" />
            <CheckCircle2 v-else :size="15" />
            <span>Setujui Permohonan</span>
          </button>
        </div>
      </div>
    </div>

    </template>

  </div>
</template>
