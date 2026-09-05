<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLaboranNavStore } from '@/stores/laboran-nav.store'
import { useAuthStore } from '@/stores/auth.store'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  User,
  Building2,
  DoorOpen,
  LogOut,
  FileText,
  Layers,
  Wrench,
  Sparkles,
  Activity,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Calendar,
  UserCheck,
  ShieldCheck
} from 'lucide-vue-next'
import { roomUsageService, type RoomUsage } from '@/services/room-usage.service'

const route = useRoute()
const router = useRouter()
const navStore = useLaboranNavStore()
const authStore = useAuthStore()

onMounted(async () => {
  await loadUsage()
})

const usageId = computed(() => route.params.id as string)

const usageItem = ref<RoomUsage | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')

const loadUsage = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    usageItem.value = await roomUsageService.getRoomUsageById(usageId.value)
    navStore.setBreadcrumbs([
      { label: 'Portal Laboran', path: '/laboran' },
      { label: 'Log Pemakaian Lab', path: '/laboran/room-usage' },
      { label: usageItem.value.activityName || 'Detail Pemakaian' },
    ])
  } catch (error: any) {
    console.error('Failed to load room usage:', error)
    errorMessage.value = error.message || 'Gagal memuat log pemakaian lab'
  } finally {
    isLoading.value = false
  }
}

// Check-Out Confirmation Mode
const showCheckOutConfirm = ref(false)
const checkOutNotes = ref('')
const isActionLoading = ref(false)

// Toast Notification
const showToast = ref(false)
const toastMessage = ref('')

const triggerToast = (msg: string) => {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3500)
}

const handleBack = () => {
  router.push('/laboran/room-usage')
}

const confirmCheckOut = async () => {
  if (!usageItem.value || !authStore.user) return
  isActionLoading.value = true
  try {
    await roomUsageService.updateRoomUsage(usageItem.value.id, {
      checkedOutBy: authStore.user.id,
      checkOutTime: new Date().toISOString(),
      status: 'CHECKED_OUT',
      notes: checkOutNotes.value.trim() || undefined,
    })
    showCheckOutConfirm.value = false
    checkOutNotes.value = ''
    await loadUsage()
    triggerToast(`Sesi pemakaian lab ${usageItem.value.id.toUpperCase()} berhasil di-checkout.`)
  } catch (error: any) {
    console.error('Failed to check out:', error)
    triggerToast(error.message || 'Gagal melakukan check-out')
  } finally {
    isActionLoading.value = false
  }
}

const confirmCheckIn = async () => {
  if (!usageItem.value) return
  isActionLoading.value = true
  try {
    await roomUsageService.markInUse(usageItem.value.id)
    await loadUsage()
    triggerToast(`Sesi pemakaian lab ${usageItem.value.id.toUpperCase()} ditandai sebagai SEDANG DIGUNAKAN.`)
  } catch (error: any) {
    console.error('Failed to check in:', error)
    triggerToast(error.message || 'Gagal melakukan check-in')
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
      <p class="text-sm text-text-muted font-medium">Memuat detail pemakaian lab...</p>
    </div>
  </div>

  <!-- Error State -->
  <div v-else-if="errorMessage || !usageItem" class="flex items-center justify-center min-h-[400px]">
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

  <!-- Content (Full-width 2-Column Layout) -->
  <div v-else class="space-y-6 pb-12 w-full max-w-full min-w-0 select-none">
    <!-- 1. Header & Back Navigation -->
    <div>
      <button
        @click="handleBack"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-dark-green hover:underline mb-2 cursor-pointer"
      >
        <ArrowLeft :size="14" />
        <span>Kembali ke Log Pemakaian Lab</span>
      </button>

      <div class="pb-3 border-b border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
              {{ usageItem.activityName || 'Sesi Laboratorium Berjalan' }}
            </h1>
            <span
              :class="[
                'inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-extrabold border',
                usageItem.status === 'IN_USE'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs'
                  : usageItem.status === 'CHECKED_IN'
                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                    : 'bg-gray-100 text-text-muted border-gray-200'
              ]"
            >
              <span v-if="usageItem.status === 'IN_USE'" class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{{ usageItem.status === 'IN_USE' ? 'Sedang Digunakan' : usageItem.status === 'CHECKED_IN' ? 'Check-in' : 'Selesai' }}</span>
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted font-medium">
            {{ usageItem.laboratoryName }} ({{ usageItem.laboratoryCode }}) • Diawasi oleh {{ usageItem.checkedInByName }}
          </p>
        </div>
      </div>
    </div>

    <!-- Toast Notification Banner -->
    <div
      v-if="showToast"
      class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-dark-green text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="flex items-center gap-2.5">
        <CheckCircle2 :size="18" class="text-dark-green shrink-0" />
        <span>{{ toastMessage }}</span>
      </div>
      <button @click="showToast = false" class="text-dark-green hover:opacity-80 cursor-pointer">
        <X :size="14" />
      </button>
    </div>

    <!-- Check-Out Modal / Action Box if triggered -->
    <div
      v-if="showCheckOutConfirm"
      class="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-3 shadow-xs animate-in fade-in"
    >
      <div class="flex items-start gap-3">
        <LogOut :size="20" class="text-amber-800 shrink-0 mt-0.5" />
        <div class="space-y-1">
          <h3 class="font-extrabold text-sm text-amber-900">Selesaikan & Check-out Sesi Ruangan?</h3>
          <p class="text-amber-800 text-xs">
            Konfirmasi check-out untuk sesi <strong>{{ usageItem.laboratoryName }}</strong> ({{ usageItem.activityName }}).
          </p>
        </div>
      </div>

      <div class="space-y-1">
        <label class="block font-bold text-amber-900 text-[11px] uppercase tracking-wider">
          Catatan Penyelesaian / Serah Terima (Opsional)
        </label>
        <input
          v-model="checkOutNotes"
          type="text"
          placeholder="mis. Sesi selesai tertib, semua komputer terverifikasi normal..."
          class="w-full p-2.5 rounded-xl bg-white border border-amber-200 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-300 font-medium"
        />
      </div>

      <div class="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/60">
        <button
          @click="showCheckOutConfirm = false"
          :disabled="isActionLoading"
          class="px-3.5 py-1.5 rounded-full border border-gray-200 bg-white text-text-secondary hover:bg-surface text-xs font-bold transition-all cursor-pointer"
        >
          Batal
        </button>
        <button
          @click="confirmCheckOut"
          :disabled="isActionLoading"
          class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          <Loader2 v-if="isActionLoading" :size="13" class="animate-spin" />
          <Check v-else :size="13" />
          <span>Konfirmasi Check-Out</span>
        </button>
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
            <div class="w-14 h-14 rounded-2xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <Activity :size="28" stroke-width="2.2" />
            </div>
            <div>
              <h2 class="text-lg font-extrabold text-text-primary">{{ usageItem.activityName || 'Sesi Berjalan' }}</h2>
              <p class="text-xs text-text-muted mt-0.5 font-medium">Check-in Oleh: {{ usageItem.checkedInByName }} • {{ usageItem.laboratoryName }}</p>
            </div>
          </div>
          <span class="text-xs font-mono font-bold text-dark-green bg-brand-50 px-3 py-1 rounded-full border border-brand-200/60 self-start sm:self-auto">
            Standar WIB (UTC+7)
          </span>
        </div>

        <!-- Structured Attributes & Details Grid -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 space-y-5">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-extrabold text-text-primary tracking-tight">Spesifikasi Pemakaian Operasional</h3>
            <p class="text-xs text-text-muted">Waktu check-in, waktu check-out, dan petugas pengawas.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <UserCheck :size="13" class="text-dark-green" />
                <span>Petugas Check-In</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ usageItem.checkedInByName }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Clock :size="13" class="text-dark-green" />
                <span>Waktu Check-In</span>
              </div>
              <p class="text-xs font-mono font-black text-dark-green truncate">{{ usageItem.formattedCheckInTime }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Clock :size="13" class="text-dark-green" />
                <span>Waktu Check-Out</span>
              </div>
              <p class="text-xs font-mono font-black text-text-primary truncate">{{ usageItem.formattedCheckOutTime || '— Masih Berlangsung —' }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Building2 :size="13" class="text-dark-green" />
                <span>Ruang Laboratorium</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ usageItem.laboratoryName }} ({{ usageItem.laboratoryCode }})</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <ShieldCheck :size="13" class="text-dark-green" />
                <span>Status Operasional</span>
              </div>
              <p class="text-xs font-bold text-dark-green truncate">{{ usageItem.status === 'IN_USE' ? 'Sedang Digunakan' : usageItem.status === 'CHECKED_IN' ? 'Check-in' : 'Selesai' }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <User :size="13" class="text-dark-green" />
                <span>Petugas Check-Out</span>
              </div>
              <p class="text-xs font-semibold text-text-secondary truncate">{{ usageItem.checkedOutByName || 'Menunggu Check-Out' }}</p>
            </div>
          </div>
        </div>

        <!-- Remarks & Notes Section -->
        <div v-if="usageItem.notes" class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 space-y-4">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-extrabold text-text-primary tracking-tight">Catatan & Keterangan Operasional</h3>
            <p class="text-xs text-text-muted">Kondisi peralatan, jumlah peserta, atau catatan khusus yang dicatat selama sesi ini.</p>
          </div>

          <div class="p-4 rounded-xl bg-surface/60 border border-gray-200/70 text-xs text-text-primary leading-relaxed font-medium">
            {{ usageItem.notes }}
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- RIGHT COLUMN: ACTIONS & CONTEXTUAL SIDEBAR (4 COLS)      -->
      <!-- ======================================================== -->
      <div class="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
        <!-- Quick Operational Actions Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 sm:p-6 space-y-3">
          <h4 class="text-xs font-black uppercase tracking-wider text-text-primary">Aksi Operasional</h4>
          <button
            v-if="usageItem.status === 'IN_USE' && !showCheckOutConfirm"
            @click="showCheckOutConfirm = true"
            class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#3B694A] to-[#2D5A3F] hover:from-[#31573E] hover:to-[#244430] text-white font-extrabold text-xs shadow-xs shadow-[#2D5A3F]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut :size="14" />
            <span>Check Out Sesi</span>
          </button>
          <button
            v-else-if="usageItem.status === 'CHECKED_IN'"
            @click="confirmCheckIn"
            :disabled="isActionLoading"
            class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#3B694A] to-[#2D5A3F] hover:from-[#31573E] hover:to-[#244430] text-white font-extrabold text-xs shadow-xs shadow-[#2D5A3F]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Loader2 v-if="isActionLoading" :size="14" class="animate-spin" />
            <DoorOpen v-else :size="14" />
            <span>Konfirmasi Check-In Ruangan</span>
          </button>
          <button
            @click="handleBack"
            class="w-full py-2.5 px-4 rounded-xl border border-gray-200/80 hover:bg-surface text-text-secondary font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
          >
            <span>Kembali ke Log Pemakaian Lab</span>
          </button>
        </div>

        <!-- Occupied Space Snapshot Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-3">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <h4 class="text-xs font-black uppercase tracking-wider text-text-secondary">Ruangan Ditugaskan</h4>
            <span class="px-2 py-0.5 rounded-full bg-brand-100 font-mono text-[10px] font-bold text-dark-green">
              {{ usageItem.laboratoryCode }}
            </span>
          </div>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between py-1 border-b border-gray-50">
              <span class="text-text-muted">Nama Ruangan</span>
              <span class="font-bold text-text-primary truncate max-w-[170px] text-right">{{ usageItem.laboratoryName }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-gray-50">
              <span class="text-text-muted">Status Saat Ini</span>
              <span class="font-bold text-dark-green">{{ usageItem.status === 'IN_USE' ? 'Sedang Digunakan' : usageItem.status === 'CHECKED_IN' ? 'Check-in' : 'Selesai' }}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-text-muted">Waktu Check-In</span>
              <span class="font-medium text-text-secondary truncate max-w-[160px] text-right">{{ usageItem.formattedCheckInTime }}</span>
            </div>
          </div>
        </div>

        <!-- System Audit Information -->
        <div class="bg-surface/60 rounded-2xl border border-gray-200/70 p-4 space-y-2 text-[11px] text-text-muted">
          <div class="flex justify-between">
            <span>UUID Log</span>
            <span class="font-mono text-[10px] text-text-secondary truncate max-w-[140px]">{{ usageItem.id }}</span>
          </div>
          <div class="flex justify-between">
            <span>Lingkup Fakultas</span>
            <span class="font-medium text-text-secondary">FIK UPNVJ</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
