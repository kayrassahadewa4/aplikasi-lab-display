<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import { useAuthStore } from '@/stores/auth.store'
import {
  ArrowLeft,
  Activity,
  Edit3,
  Trash2,
  CheckCircle2,
  LogOut,
  Clock,
  User,
  X,
  AlertTriangle,
  Loader2,
  Building2,
  Sparkles,
  ShieldCheck,
  Calendar,
  Layers,
  UserCheck
} from 'lucide-vue-next'
import { roomUsageService, type RoomUsage } from '@/services/room-usage.service'

const route = useRoute()
const router = useRouter()
const navStore = useAdminNavStore()
const authStore = useAuthStore()

const usgId = route.params.id as string
const usage = ref<RoomUsage | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')

const showDeleteConfirm = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const isDeleting = ref(false)
const isCheckingOut = ref(false)

onMounted(async () => {
  await loadUsage()
})

const loadUsage = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    usage.value = await roomUsageService.getRoomUsageById(usgId)
    navStore.setBreadcrumbs([
      { label: 'Dashboard', path: '/admin' },
      { label: 'Log Pemakaian Lab', path: '/admin/room-usage' },
      { label: usage.value.activityName || 'Detail' },
    ])
  } catch (error: any) {
    console.error('Failed to load room usage:', error)
    errorMessage.value = error.message || 'Gagal memuat log pemakaian lab'
  } finally {
    isLoading.value = false
  }
}

const handleEdit = () => {
  router.push(`/admin/room-usage/${usgId}/edit`)
}

const handleCheckOut = async () => {
  if (!usage.value || !authStore.user) return

  isCheckingOut.value = true
  try {
    await roomUsageService.checkOut(usgId, authStore.user.id)
    toastMessage.value = 'Laboratorium berhasil di-checkout.'
    showToast.value = true
    setTimeout(async () => {
      showToast.value = false
      await loadUsage()
    }, 1500)
  } catch (error: any) {
    console.error('Failed to check out:', error)
    toastMessage.value = error.message || 'Gagal melakukan check-out'
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
    }, 3000)
  } finally {
    isCheckingOut.value = false
  }
}

const handleDelete = async () => {
  isDeleting.value = true
  try {
    await roomUsageService.deleteRoomUsage(usgId)
    showDeleteConfirm.value = false
    toastMessage.value = 'Log pemakaian lab berhasil dihapus.'
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
      router.push('/admin/room-usage')
    }, 1000)
  } catch (error: any) {
    console.error('Failed to delete room usage:', error)
    toastMessage.value = error.message || 'Gagal menghapus log pemakaian lab'
    showToast.value = true
    showDeleteConfirm.value = false
    setTimeout(() => {
      showToast.value = false
    }, 3000)
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="flex items-center justify-center min-h-[400px]">
    <div class="text-center space-y-3">
      <div class="w-12 h-12 border-4 border-brand-200 border-t-dark-green rounded-full animate-spin mx-auto"></div>
      <p class="text-sm text-text-muted font-medium">Memuat detail pemakaian lab...</p>
    </div>
  </div>

  <!-- Error State -->
  <div v-else-if="errorMessage || !usage" class="flex items-center justify-center min-h-[400px]">
    <div class="text-center space-y-4 max-w-md">
      <div class="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
        <AlertTriangle :size="32" class="text-red-600" />
      </div>
      <div>
        <h3 class="text-lg font-bold text-text-primary mb-1">Gagal Memuat Pemakaian</h3>
        <p class="text-sm text-text-muted">{{ errorMessage || 'Data log pemakaian lab tidak ditemukan.' }}</p>
      </div>
      <button
        @click="loadUsage"
        class="px-4 py-2 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
      >
        Coba Lagi
      </button>
    </div>
  </div>

  <!-- Content State -->
  <div v-else class="space-y-6 pb-12 w-full max-w-full min-w-0 select-none">
    <!-- 1. TOP HEADER & BREADCRUMB -->
    <div>
      <router-link
        to="/admin/room-usage"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-dark-green hover:underline mb-2 cursor-pointer"
      >
        <ArrowLeft :size="14" />
        <span>Kembali ke Log Pemakaian Lab</span>
      </router-link>

      <div class="pb-3 border-b border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
              {{ usage.activityName }}
            </h1>
            <span
              :class="[
                'px-3 py-0.5 rounded-full text-xs font-extrabold border',
                usage.status === 'IN_USE'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : usage.status === 'CHECKED_IN'
                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                    : 'bg-gray-100 text-text-muted border-gray-200'
              ]"
            >
              {{ usage.status === 'IN_USE' ? 'Sedang Digunakan' : usage.status === 'CHECKED_IN' ? 'Check-in' : 'Selesai' }}
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted font-medium">
            {{ usage.laboratoryName }} ({{ usage.laboratoryCode }}) • Petugas Sesi: {{ usage.checkedInByName }}
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
              <Activity :size="28" stroke-width="2.2" />
            </div>
            <div>
              <h2 class="text-lg font-extrabold text-text-primary">{{ usage.activityName }}</h2>
              <p class="text-xs text-text-muted mt-0.5 font-medium">Check-in Oleh: {{ usage.checkedInByName }} ({{ usage.checkedInByEmail }})</p>
            </div>
          </div>
          <span class="text-xs font-mono font-bold text-dark-green bg-brand-50 px-3 py-1 rounded-full border border-brand-200/60 self-start sm:self-auto">
            Standar WIB (UTC+7)
          </span>
        </div>

        <!-- Structured Attributes & Details Grid -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 space-y-5">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-extrabold text-text-primary tracking-tight">Waktu Pelaksanaan & Rincian</h3>
            <p class="text-xs text-text-muted">Waktu check-in, waktu check-out, dan metadata pengawas.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <UserCheck :size="13" class="text-dark-green" />
                <span>Petugas Check-In</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ usage.checkedInByName }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Clock :size="13" class="text-dark-green" />
                <span>Waktu Check-In</span>
              </div>
              <p class="text-xs font-mono font-black text-dark-green truncate">{{ usage.formattedCheckInTime }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Clock :size="13" class="text-dark-green" />
                <span>Waktu Check-Out</span>
              </div>
              <p class="text-xs font-mono font-black text-text-primary truncate">{{ usage.formattedCheckOutTime || 'Sesi Masih Berlangsung' }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Building2 :size="13" class="text-dark-green" />
                <span>Laboratorium Target</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ usage.laboratoryName }} ({{ usage.laboratoryCode }})</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <ShieldCheck :size="13" class="text-dark-green" />
                <span>Status Operasional</span>
              </div>
              <p class="text-xs font-bold text-dark-green truncate">{{ usage.status === 'IN_USE' ? 'Sedang Digunakan' : usage.status === 'CHECKED_IN' ? 'Check-in' : 'Selesai' }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <User :size="13" class="text-dark-green" />
                <span>Petugas Check-Out</span>
              </div>
              <p class="text-xs font-semibold text-text-secondary truncate">{{ usage.checkedOutByName || 'Menunggu Serah Terima' }}</p>
            </div>
          </div>
        </div>

        <!-- Session Notes Card -->
        <div v-if="usage.notes" class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 space-y-4">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-extrabold text-text-primary tracking-tight">Catatan Serah Terima Sesi</h3>
            <p class="text-xs text-text-muted">Kondisi peralatan, jumlah peserta, atau catatan khusus yang dicatat selama sesi ini.</p>
          </div>

          <div class="p-4 rounded-xl bg-surface/60 border border-gray-200/70 text-xs text-text-primary leading-relaxed font-medium">
            {{ usage.notes }}
          </div>
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
            v-if="usage.status === 'IN_USE' || usage.status === 'CHECKED_IN'"
            @click="handleCheckOut"
            :disabled="isCheckingOut"
            class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#3B694A] to-[#2D5A3F] hover:from-[#31573E] hover:to-[#244430] text-white font-extrabold text-xs shadow-xs shadow-[#2D5A3F]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Loader2 v-if="isCheckingOut" :size="16" class="animate-spin" />
            <LogOut v-else :size="16" />
            <span>{{ isCheckingOut ? 'Memproses Check-out...' : 'Check-out Laboratorium' }}</span>
          </button>
          <button
            @click="handleEdit"
            class="w-full py-2.5 px-4 rounded-xl border border-gray-200/80 hover:bg-surface text-text-primary font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Edit3 :size="14" />
            <span>Ubah Log Pemakaian</span>
          </button>
          <button
            @click="showDeleteConfirm = true"
            :disabled="isDeleting"
            class="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Trash2 :size="14" />
            <span>Hapus Log Pemakaian</span>
          </button>
        </div>

        <!-- Room Snapshot Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-3">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <h4 class="text-xs font-black uppercase tracking-wider text-text-secondary">Ruangan Terpakai</h4>
            <span class="px-2 py-0.5 rounded-full bg-brand-100 font-mono text-[10px] font-bold text-dark-green">
              {{ usage.laboratoryCode }}
            </span>
          </div>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between py-1 border-b border-gray-50">
              <span class="text-text-muted">Nama Ruangan</span>
              <span class="font-bold text-text-primary truncate max-w-[170px] text-right">{{ usage.laboratoryName }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-gray-50">
              <span class="text-text-muted">Status Saat Ini</span>
              <span class="font-bold text-dark-green">{{ usage.status === 'IN_USE' ? 'Sedang Digunakan' : usage.status === 'CHECKED_IN' ? 'Check-in' : 'Selesai' }}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-text-muted">Waktu Check-In</span>
              <span class="font-medium text-text-secondary truncate max-w-[160px] text-right">{{ usage.formattedCheckInTime }}</span>
            </div>
          </div>
        </div>

        <!-- System Audit Information -->
        <div class="bg-surface/60 rounded-2xl border border-gray-200/70 p-4 space-y-2 text-[11px] text-text-muted">
          <div class="flex justify-between">
            <span>UUID Log</span>
            <span class="font-mono text-[10px] text-text-secondary truncate max-w-[140px]">{{ usage.id }}</span>
          </div>
          <div class="flex justify-between">
            <span>Email Petugas</span>
            <span class="font-medium text-text-secondary truncate max-w-[140px]">{{ usage.checkedInByEmail }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal Dialog -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xl w-full max-w-sm overflow-hidden p-5 space-y-4 text-xs animate-in zoom-in-95 duration-150">
        <div class="flex items-center gap-3 text-red-600">
          <div class="p-2 bg-red-50 rounded-xl">
            <Trash2 :size="20" />
          </div>
          <h3 class="text-sm font-bold text-text-primary">Hapus Log Pemakaian Lab?</h3>
        </div>

        <p class="text-text-muted leading-relaxed">
          Apakah Anda yakin ingin menghapus log <strong class="text-text-primary">{{ usage.activityName }}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            @click="showDeleteConfirm = false"
            :disabled="isDeleting"
            class="px-4 py-2 rounded-full border border-gray-200 text-text-primary font-semibold hover:bg-surface cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            @click="handleDelete"
            :disabled="isDeleting"
            class="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            <Loader2 v-if="isDeleting" :size="14" class="animate-spin" />
            <span>Hapus Log</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
