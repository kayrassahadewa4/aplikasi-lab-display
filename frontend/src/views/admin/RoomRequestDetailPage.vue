<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  X,
  Loader2,
  AlertTriangle,
  Calendar,
  Clock,
  Users,
  Building2,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  UserCheck,
  User,
  Paperclip,
  ExternalLink
} from 'lucide-vue-next'
import { BaseAvatar } from '@/components'
import { roomRequestService, type RoomRequest } from '@/services/room-request.service'
import { getFileUrl } from '@/utils/format.utils'

const route = useRoute()
const router = useRouter()
const navStore = useAdminNavStore()

const reqId = route.params.id as string
const request = ref<RoomRequest | null>(null)
const isLoading = ref(false)
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
      { label: request.value.activityName },
    ])
  } catch (error: any) {
    errorMessage.value = error.message || 'Gagal memuat data permohonan pinjam lab'
    console.error('Failed to load room request:', error)
  } finally {
    isLoading.value = false
  }
}

const handleReview = () => {
  router.push(`/admin/room-requests/${reqId}/review`)
}
</script>

<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="flex items-center justify-center min-h-[400px]">
    <div class="text-center space-y-3">
      <div class="w-12 h-12 border-4 border-brand-200 border-t-dark-green rounded-full animate-spin mx-auto"></div>
      <p class="text-sm text-text-muted font-medium">Memuat detail permohonan pinjam lab...</p>
    </div>
  </div>

  <!-- Error State -->
  <div v-else-if="errorMessage || !request" class="flex items-center justify-center min-h-[400px]">
    <div class="text-center space-y-4 max-w-md">
      <div class="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
        <AlertTriangle :size="32" class="text-red-600" />
      </div>
      <div>
        <h3 class="text-lg font-bold text-text-primary mb-1">Gagal Memuat Permohonan</h3>
        <p class="text-sm text-text-muted">{{ errorMessage || 'Data permohonan pinjam lab tidak ditemukan.' }}</p>
      </div>
      <button
        @click="router.push('/admin/room-requests')"
        class="px-4 py-2 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
      >
        Kembali ke Daftar
      </button>
    </div>
  </div>

  <!-- Content State -->
  <div v-else class="space-y-6 pb-12 w-full max-w-full min-w-0 select-none">
    <!-- 1. TOP HEADER & BREADCRUMB -->
    <div>
      <router-link
        to="/admin/room-requests"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-dark-green hover:underline mb-2 cursor-pointer"
      >
        <ArrowLeft :size="14" />
        <span>Kembali ke Permohonan Pinjam</span>
      </router-link>

      <div class="pb-3 border-b border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
              {{ request.activityName }}
            </h1>
            <span
              :class="[
                'px-3 py-0.5 rounded-full text-xs font-extrabold border',
                request.status === 'APPROVED'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : request.status === 'PENDING'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
              ]"
            >
              {{ request.status === 'APPROVED' ? 'Disetujui' : request.status === 'PENDING' ? 'Menunggu' : request.status === 'REJECTED' ? 'Ditolak' : 'Dibatalkan' }}
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted font-medium">
            Diajukan oleh {{ request.applicantName }} • Ruang Target: {{ request.laboratoryCode }} ({{ request.formattedRequestDate }})
          </p>
        </div>
      </div>
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
            <BaseAvatar
              :src="request.applicantAvatar"
              :name="request.applicantName"
              size="xl"
              class="shrink-0 ring-2 ring-brand-200/60 shadow-2xs"
            />
            <div>
              <h2 class="text-lg font-extrabold text-text-primary">{{ request.activityName }}</h2>
              <p class="text-xs text-text-muted mt-0.5 font-medium">Pemohon: {{ request.applicantName }} • Mata Kuliah: {{ request.courseName || 'Akademik Umum' }} • Kelas: {{ request.className || 'Kelas Umum' }}</p>
            </div>
          </div>
          <span class="text-xs font-mono font-bold text-dark-green bg-brand-50 px-3 py-1 rounded-full border border-brand-200/60 self-start sm:self-auto">
            Standar WIB (UTC+7)
          </span>
        </div>

        <!-- Structured Attributes & Details Grid -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 space-y-5">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-extrabold text-text-primary tracking-tight">Parameter Permohonan Peminjaman</h3>
            <p class="text-xs text-text-muted">Informasi pemohon, rentang waktu, dan estimasi peserta.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <User :size="13" class="text-dark-green" />
                <span>Pemohon</span>
              </div>
              <div class="flex items-center gap-2 pt-0.5">
                <BaseAvatar :src="request.applicantAvatar" :name="request.applicantName" size="sm" class="shrink-0" />
                <p class="text-xs font-black text-text-primary truncate">{{ request.applicantName }}</p>
              </div>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Calendar :size="13" class="text-dark-green" />
                <span>Tanggal Peminjaman</span>
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
              <p class="text-xs font-mono font-black text-dark-green truncate">{{ request.laboratoryCode }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Users :size="13" class="text-dark-green" />
                <span>Estimasi Peserta</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ request.participantCount }} Mahasiswa</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <ShieldCheck :size="13" class="text-dark-green" />
                <span>Status Persetujuan</span>
              </div>
              <p class="text-xs font-bold text-dark-green truncate">{{ request.status === 'APPROVED' ? 'Disetujui' : request.status === 'PENDING' ? 'Menunggu' : request.status === 'REJECTED' ? 'Ditolak' : 'Dibatalkan' }}</p>
            </div>
          </div>
        </div>

        <!-- Description Card -->
        <div v-if="request.description" class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 space-y-4">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-extrabold text-text-primary tracking-tight">Tujuan & Kebutuhan Khusus</h3>
            <p class="text-xs text-text-muted">Kebutuhan sesi khusus dan catatan lingkungan perangkat lunak.</p>
          </div>

          <div class="p-4 rounded-xl bg-surface/60 border border-gray-200/70 text-xs text-text-primary leading-relaxed font-medium">
            {{ request.description }}
          </div>
        </div>

        <!-- Document Attachment Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 space-y-4">
          <div class="border-b border-gray-100 pb-3 flex items-center justify-between">
            <div>
              <h3 class="text-base font-extrabold text-text-primary tracking-tight">Dokumen / Surat Pendukung</h3>
              <p class="text-xs text-text-muted">Berkas resmi surat permohonan peminjaman dari pemohon.</p>
            </div>
            <span
              :class="[
                'px-2.5 py-0.5 rounded-full text-[11px] font-bold',
                request.documentUrl ? 'bg-emerald-50 text-dark-green border border-emerald-200' : 'bg-gray-100 text-text-muted'
              ]"
            >
              {{ request.documentUrl ? '1 Berkas Terlampir' : 'Tidak Ada Berkas' }}
            </span>
          </div>

          <div v-if="request.documentUrl" class="space-y-3">
            <div class="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-white border border-emerald-200 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
                  <Paperclip :size="18" />
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-bold text-text-primary truncate">Surat Permohonan / TOR Kegiatan</p>
                  <p class="text-[11px] text-text-muted font-mono truncate">{{ request.documentUrl.split('/').pop() }}</p>
                </div>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <a
                  :href="getFileUrl(request.documentUrl)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  <ExternalLink :size="13" />
                  <span>Buka Dokumen</span>
                </a>
              </div>
            </div>

            <!-- Inlined Image Preview if image -->
            <div
              v-if="/\.(png|jpe?g|webp|gif)$/i.test(request.documentUrl)"
              class="rounded-xl overflow-hidden border border-gray-200 max-h-96 flex items-center justify-center bg-gray-50 p-2"
            >
              <img
                :src="getFileUrl(request.documentUrl)"
                alt="Pratinjau Dokumen Pendukung"
                class="max-h-80 object-contain rounded-lg"
              />
            </div>
          </div>

          <div v-else class="p-4 rounded-xl bg-surface/50 border border-dashed border-gray-200 text-center text-xs text-text-muted">
            Pemohon tidak melampirkan berkas dokumen atau surat fisik.
          </div>
        </div>


        <!-- Rejection Reason Card if Rejected -->
        <div v-if="request.rejectionReason" class="bg-rose-50 rounded-2xl border border-rose-200 p-6 space-y-2">
          <h4 class="text-xs font-bold text-rose-800 flex items-center gap-2">
            <AlertTriangle :size="16" class="text-rose-600" />
            <span>Alasan Penolakan</span>
          </h4>
          <p class="text-xs text-rose-700 leading-relaxed font-medium">{{ request.rejectionReason }}</p>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- RIGHT COLUMN: ACTIONS & CONTEXTUAL SIDEBAR (4 COLS)      -->
      <!-- ======================================================== -->
      <div class="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
        <!-- Action Management Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 sm:p-6 space-y-3">
          <h4 class="text-xs font-black uppercase tracking-wider text-text-primary">Tindakan Pengelolaan</h4>
          <button
            v-if="request.status === 'PENDING'"
            @click="handleReview"
            class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#3B694A] to-[#2D5A3F] hover:from-[#31573E] hover:to-[#244430] text-white font-extrabold text-xs shadow-xs shadow-[#2D5A3F]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 :size="14" />
            <span>Tinjau & Setujui Permohonan</span>
          </button>
          <router-link
            to="/admin/room-requests"
            class="w-full py-2.5 px-4 rounded-xl border border-gray-200/80 hover:bg-surface text-text-secondary font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
          >
            <span>Kembali ke Semua Permohonan</span>
          </router-link>
        </div>

        <!-- Room Snapshot Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-3">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <h4 class="text-xs font-black uppercase tracking-wider text-text-secondary">Laboratorium Target</h4>
            <span class="px-2 py-0.5 rounded-full bg-brand-100 font-mono text-[10px] font-bold text-dark-green">
              {{ request.laboratoryCode }}
            </span>
          </div>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between py-1 border-b border-gray-50">
              <span class="text-text-muted">Tanggal Peminjaman</span>
              <span class="font-bold text-text-primary">{{ request.formattedRequestDate }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-gray-50">
              <span class="text-text-muted">Rentang Waktu</span>
              <span class="font-mono font-bold text-dark-green">{{ request.startTime }} – {{ request.endTime }}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-text-muted">Estimasi Peserta</span>
              <span class="font-bold text-text-primary">{{ request.participantCount }} Peserta</span>
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
            <span>Email Pemohon</span>
            <span class="font-medium text-text-secondary truncate max-w-[140px]">{{ request.applicantEmail }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
