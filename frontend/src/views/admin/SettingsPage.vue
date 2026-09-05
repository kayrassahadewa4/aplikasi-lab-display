<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { userService } from '@/services/user.service'
import { dashboardService, type DashboardSummaryDto } from '@/services/dashboard.service'
import { sessionManager } from '@/utils'
import apiClient from '@/services/api'
import {
  SlidersHorizontal,
  Monitor,
  User,
  Lock,
  Cpu,
  Save,
  RotateCcw,
  CheckCircle2,
  X,
  ShieldCheck,
  Globe,
  Clock,
  RefreshCw,
  Eye,
  Building2,
  Database,
  Server,
  Layers,
  Key,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-vue-next'

const navStore = useAdminNavStore()
const authStore = useAuthStore()
const appStore = useAppStore()

// Active Section Tab
const activeTab = ref<'general' | 'display' | 'account' | 'security' | 'system'>('general')

// Settings State
const generalSettings = ref({
  appName: appStore.generalSettings.appName,
  institution: appStore.generalSettings.institution,
  timezone: appStore.generalSettings.timezone,
})

const displaySettings = ref({
  defaultView: appStore.displaySettings.defaultView,
  autoRefresh: appStore.displaySettings.autoRefresh,
  refreshInterval: appStore.displaySettings.refreshInterval,
  showAnnouncements: appStore.displaySettings.showAnnouncements,
  showRoomStatus: appStore.displaySettings.showRoomStatus,
})

const accountSettings = ref({
  fullName: authStore.user?.full_name || authStore.userName || 'Administrator',
  email: authStore.user?.email || 'admin@lab.com',
  phone: authStore.user?.phone || '',
  role: authStore.user?.role?.name || authStore.userRole || 'ADMIN',
})

const securityForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// Live System Summary Data & Viewport
const summaryData = ref<DashboardSummaryDto | null>(null)
const isSummaryLoading = ref(false)
const viewportInfo = ref({
  width: typeof window !== 'undefined' ? window.innerWidth : 1920,
  height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  screenWidth: typeof window !== 'undefined' ? window.screen.width : 1920,
  screenHeight: typeof window !== 'undefined' ? window.screen.height : 1080,
})

// Unsaved changes tracking & loading states
const isDirty = ref(false)
const isSavingAccount = ref(false)
const isUpdatingPassword = ref(false)

const markDirty = () => {
  isDirty.value = true
}

// UI Feedback States
const showSuccessBanner = ref(false)
const successMessage = ref('Pengaturan berhasil disimpan.')
const showErrorBanner = ref(false)
const errorMessage = ref('')

const triggerSuccessToast = (msg: string) => {
  successMessage.value = msg
  showSuccessBanner.value = true
  showErrorBanner.value = false
  setTimeout(() => {
    showSuccessBanner.value = false
  }, 4000)
}

const triggerErrorToast = (msg: string) => {
  errorMessage.value = msg
  showErrorBanner.value = true
  showSuccessBanner.value = false
  setTimeout(() => {
    showErrorBanner.value = false
  }, 5000)
}

// Sync account settings whenever authStore user loads or changes
watch(
  () => authStore.user,
  (newUser) => {
    if (newUser) {
      accountSettings.value = {
        fullName: newUser.full_name || 'Administrator',
        email: newUser.email || 'admin@lab.com',
        phone: newUser.phone || '',
        role: newUser.role?.name || authStore.userRole || 'ADMIN',
      }
    }
  },
  { immediate: true }
)

const loadSystemMetrics = async () => {
  isSummaryLoading.value = true
  try {
    const data = await dashboardService.getSummary()
    summaryData.value = data
  } catch (err) {
    console.warn('Failed to load system summary metrics:', err)
  } finally {
    isSummaryLoading.value = false
  }
}

onMounted(async () => {
  navStore.setBreadcrumbs([
    { label: 'Dashboard', path: '/admin' },
    { label: 'Pengaturan' },
  ])

  await authStore.initialize()

  appStore.loadSettings()
  generalSettings.value = { ...appStore.generalSettings }
  displaySettings.value = { ...appStore.displaySettings }

  if (authStore.user) {
    accountSettings.value = {
      fullName: authStore.user.full_name || 'Administrator',
      email: authStore.user.email || 'admin@lab.com',
      phone: authStore.user.phone || '',
      role: authStore.user.role?.name || authStore.userRole || 'ADMIN',
    }
  }

  loadSystemMetrics()

  const handleResize = () => {
    viewportInfo.value = {
      width: window.innerWidth,
      height: window.innerHeight,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
    }
  }
  window.addEventListener('resize', handleResize)
})

// TAB 1: General Save
const handleSaveGeneral = () => {
  appStore.saveSettings({ general: generalSettings.value })
  isDirty.value = false
  triggerSuccessToast('Konfigurasi umum berhasil disimpan.')
}

// TAB 2: Display Save
const handleSaveDisplay = () => {
  appStore.saveSettings({ display: displaySettings.value })
  isDirty.value = false
  triggerSuccessToast('Pengaturan layar display dan preferensi monitor berhasil disimpan.')
}

// TAB 3: Account Save (PostgreSQL Profile Update)
const handleSaveAccount = async () => {
  if (!authStore.user?.id) {
    triggerErrorToast('Sesi pengguna tidak ditemukan. Silakan masuk kembali.')
    return
  }

  if (!accountSettings.value.fullName.trim()) {
    triggerErrorToast('Nama lengkap tidak boleh kosong.')
    return
  }

  isSavingAccount.value = true
  try {
    const updated = await userService.updateUser(authStore.user.id, {
      full_name: accountSettings.value.fullName.trim(),
      phone: accountSettings.value.phone?.trim() || undefined,
    })

    // Update in authStore & sessionManager
    authStore.setUser({
      ...authStore.user,
      full_name: updated.fullName,
      phone: updated.phone === 'N/A' ? undefined : (updated.phone || undefined),
    })
    sessionManager.saveUser(authStore.user)

    isDirty.value = false
    triggerSuccessToast('Data profil akun berhasil diperbarui.')
  } catch (err: any) {
    triggerErrorToast(err.response?.data?.message || err.message || 'Gagal memperbarui data akun.')
  } finally {
    isSavingAccount.value = false
  }
}

// TAB 4: Security Save (Password Change Flow)
const handleUpdatePassword = async () => {
  if (!authStore.user?.id || !authStore.user?.email) {
    triggerErrorToast('Sesi pengguna tidak ditemukan. Silakan masuk kembali.')
    return
  }

  if (!securityForm.value.currentPassword) {
    triggerErrorToast('Silakan masukkan kata sandi saat ini.')
    return
  }

  if (!securityForm.value.newPassword) {
    triggerErrorToast('Silakan masukkan kata sandi baru.')
    return
  }

  // Password complexity validation: min 8 chars, uppercase, lowercase, number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  if (!passwordRegex.test(securityForm.value.newPassword)) {
    triggerErrorToast('Kata sandi baru harus memiliki minimal 8 karakter dan mengandung huruf besar, huruf kecil, serta angka.')
    return
  }

  if (securityForm.value.newPassword !== securityForm.value.confirmPassword) {
    triggerErrorToast('Kata sandi baru dan konfirmasi kata sandi tidak cocok.')
    return
  }

  if (securityForm.value.newPassword === securityForm.value.currentPassword) {
    triggerErrorToast('Kata sandi baru harus berbeda dari kata sandi saat ini.')
    return
  }

  isUpdatingPassword.value = true
  try {
    // 1. Verify current password with authentication check
    try {
      await apiClient.post('/auth/login', {
        email: authStore.user.email,
        password: securityForm.value.currentPassword,
      })
    } catch (authErr: any) {
      if (authErr.response?.status === 401 || authErr.response?.data?.statusCode === 401) {
        throw new Error('Kata sandi saat ini salah')
      }
    }

    // 2. Perform backend password update with bcrypt encryption
    await userService.updateUser(authStore.user.id, {
      password: securityForm.value.newPassword,
    })

    // 3. Clear security form
    securityForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }

    isDirty.value = false
    triggerSuccessToast('Kata sandi berhasil diubah dan diperbarui.')
  } catch (err: any) {
    triggerErrorToast(err.response?.data?.message || err.message || 'Gagal memperbarui kata sandi.')
  } finally {
    isUpdatingPassword.value = false
  }
}

// Global Save Handler (triggers the active tab's action)
const handleSave = () => {
  if (activeTab.value === 'general') {
    handleSaveGeneral()
  } else if (activeTab.value === 'display') {
    handleSaveDisplay()
  } else if (activeTab.value === 'account') {
    handleSaveAccount()
  } else if (activeTab.value === 'security') {
    handleUpdatePassword()
  }
}

const handleDiscard = () => {
  appStore.loadSettings()
  generalSettings.value = { ...appStore.generalSettings }
  displaySettings.value = { ...appStore.displaySettings }

  if (authStore.user) {
    accountSettings.value = {
      fullName: authStore.user.full_name || 'Administrator',
      email: authStore.user.email || 'admin@lab.com',
      phone: authStore.user.phone || '',
      role: authStore.user.role?.name || authStore.userRole || 'ADMIN',
    }
  }

  securityForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }

  isDirty.value = false
}
</script>

<template>
  <div class="space-y-6 pb-8 select-none">
    
    <!-- 1. Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2.5 border-b border-gray-200/60">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
            Pengaturan
          </h1>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-100/80 border border-brand-200 text-dark-green text-[11px] font-bold">
            <SlidersHorizontal :size="12" class="text-primary-dark" />
            Konfigurasi Sistem
          </span>
        </div>
        <p class="text-xs sm:text-sm text-text-muted font-normal">
          Kelola preferensi administrator, kredensial keamanan, dan konfigurasi sistem.
        </p>
      </div>
    </div>

    <!-- Success Feedback Toast Banner -->
    <div
      v-if="showSuccessBanner"
      class="p-3.5 rounded-2xl bg-brand-100/90 border border-brand-200 text-dark-green text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="flex items-center gap-2">
        <CheckCircle2 :size="16" class="text-dark-green shrink-0" />
        <span>{{ successMessage }}</span>
      </div>
      <button @click="showSuccessBanner = false" class="text-dark-green hover:opacity-80 cursor-pointer">
        <X :size="14" />
      </button>
    </div>

    <!-- Error Feedback Toast Banner -->
    <div
      v-if="showErrorBanner"
      class="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="flex items-center gap-2">
        <AlertCircle :size="16" class="text-rose-600 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>
      <button @click="showErrorBanner = false" class="text-rose-800 hover:opacity-80 cursor-pointer">
        <X :size="14" />
      </button>
    </div>

    <!-- Unsaved Changes Floating Bar -->
    <div
      v-if="isDirty"
      class="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2 duration-150"
    >
      <div class="flex items-center gap-2">
        <AlertCircle :size="16" class="text-amber-600 shrink-0" />
        <span>Terdapat perubahan yang belum disimpan di halaman ini.</span>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="handleDiscard"
          class="px-3 py-1 rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
        >
          Batalkan
        </button>
        <button
          @click="handleSave"
          class="px-3.5 py-1 rounded-lg bg-dark-green text-white hover:bg-[#547a5c] shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <Save :size="13" />
          <span>Simpan Perubahan</span>
        </button>
      </div>
    </div>

    <!-- 2. Two-Column Settings Layout -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
      
      <!-- Left Sidebar Navigation Column (1 col) -->
      <div class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-2 space-y-1">
        <button
          @click="activeTab = 'general'"
          :class="[
            'w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-left cursor-pointer',
            activeTab === 'general'
              ? 'bg-brand-50 text-dark-green border-l-4 border-dark-green shadow-2xs'
              : 'text-text-secondary hover:bg-surface hover:text-text-primary'
          ]"
        >
          <SlidersHorizontal :size="16" :class="activeTab === 'general' ? 'text-dark-green' : 'text-text-muted'" />
          <span>Umum</span>
        </button>

        <button
          @click="activeTab = 'display'"
          :class="[
            'w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-left cursor-pointer',
            activeTab === 'display'
              ? 'bg-brand-50 text-dark-green border-l-4 border-dark-green shadow-2xs'
              : 'text-text-secondary hover:bg-surface hover:text-text-primary'
          ]"
        >
          <Monitor :size="16" :class="activeTab === 'display' ? 'text-dark-green' : 'text-text-muted'" />
          <span>Layar Display</span>
        </button>

        <button
          @click="activeTab = 'account'"
          :class="[
            'w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-left cursor-pointer',
            activeTab === 'account'
              ? 'bg-brand-50 text-dark-green border-l-4 border-dark-green shadow-2xs'
              : 'text-text-secondary hover:bg-surface hover:text-text-primary'
          ]"
        >
          <User :size="16" :class="activeTab === 'account' ? 'text-dark-green' : 'text-text-muted'" />
          <span>Akun</span>
        </button>

        <button
          @click="activeTab = 'security'"
          :class="[
            'w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-left cursor-pointer',
            activeTab === 'security'
              ? 'bg-brand-50 text-dark-green border-l-4 border-dark-green shadow-2xs'
              : 'text-text-secondary hover:bg-surface hover:text-text-primary'
          ]"
        >
          <Lock :size="16" :class="activeTab === 'security' ? 'text-dark-green' : 'text-text-muted'" />
          <span>Keamanan</span>
        </button>

        <button
          @click="activeTab = 'system'"
          :class="[
            'w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-left cursor-pointer',
            activeTab === 'system'
              ? 'bg-brand-50 text-dark-green border-l-4 border-dark-green shadow-2xs'
              : 'text-text-secondary hover:bg-surface hover:text-text-primary'
          ]"
        >
          <Cpu :size="16" :class="activeTab === 'system' ? 'text-dark-green' : 'text-text-muted'" />
          <span>Info Sistem</span>
        </button>
      </div>

      <!-- Right Active Content Column (3 cols) -->
      <div class="md:col-span-3 space-y-6">
        
        <!-- SECTION 1: GENERAL SETTINGS -->
        <div v-if="activeTab === 'general'" class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-5 sm:p-6 space-y-5 animate-in fade-in duration-150">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-bold text-text-primary tracking-tight">Pengaturan Umum</h3>
            <p class="text-xs text-text-muted">Kelola informasi dasar aplikasi dan identitas institusi.</p>
          </div>

          <form @submit.prevent="handleSaveGeneral" class="space-y-4 text-xs">
            <div>
              <label class="block font-bold text-text-primary mb-1">Nama Aplikasi</label>
              <input
                v-model="generalSettings.appName"
                type="text"
                @input="markDirty"
                class="w-full px-3 py-2 bg-surface border border-gray-200 rounded-xl font-semibold text-text-primary focus:outline-none focus:border-brand-400 focus:bg-white"
              />
              <p class="text-[11px] text-text-muted mt-1">Ditampilkan pada judul halaman dan navigasi branding.</p>
            </div>

            <div>
              <label class="block font-bold text-text-primary mb-1">Institusi</label>
              <input
                v-model="generalSettings.institution"
                type="text"
                @input="markDirty"
                class="w-full px-3 py-2 bg-surface border border-gray-200 rounded-xl font-semibold text-text-primary focus:outline-none focus:border-brand-400 focus:bg-white"
              />
              <p class="text-[11px] text-text-muted mt-1">Nama fakultas atau organisasi universitas.</p>
            </div>

            <div>
              <label class="block font-bold text-text-primary mb-1">Zona Waktu</label>
              <select
                v-model="generalSettings.timezone"
                @change="markDirty"
                class="w-full px-3 py-2 bg-surface border border-gray-200 rounded-xl font-semibold text-text-primary focus:outline-none focus:border-brand-400 focus:bg-white cursor-pointer"
              >
                <option value="Asia/Jakarta">Asia/Jakarta (WIB • UTC+7)</option>
                <option value="Asia/Makassar">Asia/Makassar (WITA • UTC+8)</option>
                <option value="Asia/Jayapura">Asia/Jayapura (WIT • UTC+9)</option>
              </select>
            </div>

            <div class="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                @click="handleDiscard"
                class="px-4 py-2 rounded-full border border-gray-200 text-text-primary font-semibold hover:bg-surface cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                class="px-5 py-2 rounded-full bg-dark-green hover:bg-[#547a5c] text-white font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Save :size="14" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </form>
        </div>

        <!-- SECTION 2: DISPLAY SETTINGS -->
        <div v-if="activeTab === 'display'" class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-5 sm:p-6 space-y-5 animate-in fade-in duration-150">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-bold text-text-primary tracking-tight">Pengaturan Layar Display</h3>
            <p class="text-xs text-text-muted">Konfigurasi tampilan informasi laboratorium dan monitor publik.</p>
          </div>

          <form @submit.prevent="handleSaveDisplay" class="space-y-5 text-xs">
            <div>
              <label class="block font-bold text-text-primary mb-1">Tampilan Display Default</label>
              <select
                v-model="displaySettings.defaultView"
                @change="markDirty"
                class="w-full px-3 py-2 bg-surface border border-gray-200 rounded-xl font-semibold text-text-primary focus:outline-none focus:border-brand-400 focus:bg-white cursor-pointer"
              >
                <option value="schedule">Tampilan Jadwal Rutin Perkuliahan</option>
                <option value="requests">Grid Permohonan Pinjam</option>
                <option value="usage">Monitor Sesi Pemakaian Langsung</option>
              </select>
            </div>

            <!-- Auto Refresh Toggle -->
            <div class="flex items-center justify-between p-3.5 rounded-xl bg-surface/60 border border-gray-100">
              <div>
                <span class="font-bold text-text-primary block">Penyegaran Otomatis (Auto Refresh)</span>
                <span class="text-[11px] text-text-muted">Secara otomatis memperbarui jadwal perkuliahan dan status sesi pemakaian di /display.</span>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  v-model="displaySettings.autoRefresh"
                  @change="markDirty"
                  class="sr-only peer"
                />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-dark-green"></div>
              </label>
            </div>

            <div>
              <label class="block font-bold text-text-primary mb-1">Interval Penyegaran</label>
              <select
                v-model="displaySettings.refreshInterval"
                @change="markDirty"
                :disabled="!displaySettings.autoRefresh"
                class="w-full px-3 py-2 bg-surface border border-gray-200 rounded-xl font-semibold text-text-primary focus:outline-none focus:border-brand-400 focus:bg-white cursor-pointer disabled:opacity-50"
              >
                <option value="15">Setiap 15 detik</option>
                <option value="30">Setiap 30 detik (Disarankan)</option>
                <option value="60">Setiap 60 detik</option>
                <option value="300">Setiap 5 menit</option>
              </select>
            </div>

            <!-- Show Announcements Toggle -->
            <div class="flex items-center justify-between p-3.5 rounded-xl bg-surface/60 border border-gray-100">
              <div>
                <span class="font-bold text-text-primary block">Tampilkan Banner Pengumuman</span>
                <span class="text-[11px] text-text-muted">Tampilkan teks berjalan pengumuman aktif pada monitor display laboratorium publik.</span>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  v-model="displaySettings.showAnnouncements"
                  @change="markDirty"
                  class="sr-only peer"
                />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-dark-green"></div>
              </label>
            </div>

            <!-- Show Room Status Toggle -->
            <div class="flex items-center justify-between p-3.5 rounded-xl bg-surface/60 border border-gray-100">
              <div>
                <span class="font-bold text-text-primary block">Tampilkan Badge Status Ruangan</span>
                <span class="text-[11px] text-text-muted">Tampilkan indikator status real-time Tersedia / Sedang Dipakai pada kartu display lab.</span>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  v-model="displaySettings.showRoomStatus"
                  @change="markDirty"
                  class="sr-only peer"
                />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-dark-green"></div>
              </label>
            </div>

            <div class="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                @click="handleDiscard"
                class="px-4 py-2 rounded-full border border-gray-200 text-text-primary font-semibold hover:bg-surface cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                class="px-5 py-2 rounded-full bg-dark-green hover:bg-[#547a5c] text-white font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Save :size="14" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </form>
        </div>

        <!-- SECTION 3: ACCOUNT SETTINGS -->
        <div v-if="activeTab === 'account'" class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-5 sm:p-6 space-y-5 animate-in fade-in duration-150">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-bold text-text-primary tracking-tight">Preferensi Akun</h3>
            <p class="text-xs text-text-muted">Kelola rincian profil administrator yang tersimpan di sistem.</p>
          </div>

          <div class="flex items-center gap-4 p-4 rounded-xl bg-surface/50 border border-gray-100">
            <div class="w-14 h-14 rounded-full bg-gradient-to-br from-brand-200 to-dark-green text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-xs">
              {{ (accountSettings.fullName || 'A').charAt(0).toUpperCase() }}
            </div>
            <div>
              <h4 class="font-extrabold text-text-primary text-base tracking-tight">{{ accountSettings.fullName }}</h4>
              <p class="text-xs text-text-muted font-normal mt-0.5">{{ accountSettings.email }}</p>
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-100 text-dark-green text-[10px] font-bold mt-2">
                {{ accountSettings.role }}
              </span>
            </div>
          </div>

          <form @submit.prevent="handleSaveAccount" class="space-y-4 text-xs">
            <div>
              <label class="block font-bold text-text-primary mb-1">Nama Lengkap Administrator</label>
              <input
                v-model="accountSettings.fullName"
                type="text"
                required
                @input="markDirty"
                class="w-full px-3 py-2 bg-surface border border-gray-200 rounded-xl font-semibold text-text-primary focus:outline-none focus:border-brand-400 focus:bg-white"
              />
            </div>

            <div>
              <label class="block font-bold text-text-primary mb-1">Alamat Email (Hanya Baca)</label>
              <input
                v-model="accountSettings.email"
                type="email"
                disabled
                class="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl font-semibold text-text-muted cursor-not-allowed"
              />
              <p class="text-[11px] text-text-muted mt-1">Alamat email adalah pengidentifikasi unik akun Anda di sistem.</p>
            </div>

            <div>
              <label class="block font-bold text-text-primary mb-1">Nomor Telepon / WhatsApp</label>
              <input
                v-model="accountSettings.phone"
                type="text"
                placeholder="contoh: +62 812-3456-7890"
                @input="markDirty"
                class="w-full px-3 py-2 bg-surface border border-gray-200 rounded-xl font-medium text-text-primary focus:outline-none focus:border-brand-400 focus:bg-white"
              />
            </div>

            <div class="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                @click="handleDiscard"
                class="px-4 py-2 rounded-full border border-gray-200 text-text-primary font-semibold hover:bg-surface cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="isSavingAccount"
                class="px-5 py-2 rounded-full bg-dark-green hover:bg-[#547a5c] text-white font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Loader2 v-if="isSavingAccount" :size="14" class="animate-spin" />
                <span>{{ isSavingAccount ? 'Menyimpan...' : 'Simpan Profil' }}</span>
              </button>
            </div>
          </form>
        </div>

        <!-- SECTION 4: SECURITY SETTINGS -->
        <div v-if="activeTab === 'security'" class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-5 sm:p-6 space-y-5 animate-in fade-in duration-150">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-bold text-text-primary tracking-tight">Keamanan & Kata Sandi</h3>
            <p class="text-xs text-text-muted">Perbarui kata sandi akun Anda. Perubahan akan dienkripsi secara aman.</p>
          </div>

          <form @submit.prevent="handleUpdatePassword" class="space-y-4 text-xs">
            <div>
              <label class="block font-bold text-text-primary mb-1">Kata Sandi Saat Ini</label>
              <input
                v-model="securityForm.currentPassword"
                type="password"
                placeholder="••••••••••••"
                required
                @input="markDirty"
                class="w-full px-3 py-2 bg-surface border border-gray-200 rounded-xl font-mono text-text-primary focus:outline-none focus:border-brand-400 focus:bg-white"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block font-bold text-text-primary mb-1">Kata Sandi Baru</label>
                <input
                  v-model="securityForm.newPassword"
                  type="password"
                  placeholder="Masukkan kata sandi baru"
                  required
                  @input="markDirty"
                  class="w-full px-3 py-2 bg-surface border border-gray-200 rounded-xl font-mono text-text-primary focus:outline-none focus:border-brand-400 focus:bg-white"
                />
                <p class="text-[10px] text-text-muted mt-1">Min 8 karakter, 1 huruf besar, 1 huruf kecil, 1 angka.</p>
              </div>

              <div>
                <label class="block font-bold text-text-primary mb-1">Konfirmasi Kata Sandi Baru</label>
                <input
                  v-model="securityForm.confirmPassword"
                  type="password"
                  placeholder="Konfirmasi kata sandi baru"
                  required
                  @input="markDirty"
                  class="w-full px-3 py-2 bg-surface border border-gray-200 rounded-xl font-mono text-text-primary focus:outline-none focus:border-brand-400 focus:bg-white"
                />
              </div>
            </div>

            <div class="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                @click="handleDiscard"
                class="px-4 py-2 rounded-full border border-gray-200 text-text-primary font-semibold hover:bg-surface cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="isUpdatingPassword"
                class="px-5 py-2 rounded-full bg-dark-green hover:bg-[#547a5c] text-white font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Loader2 v-if="isUpdatingPassword" :size="14" class="animate-spin" />
                <span>{{ isUpdatingPassword ? 'Memperbarui...' : 'Perbarui Kata Sandi' }}</span>
              </button>
            </div>
          </form>
        </div>

        <!-- SECTION 5: SYSTEM INFORMATION & STATUS -->
        <div v-if="activeTab === 'system'" class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-5 sm:p-6 space-y-6 animate-in fade-in duration-150">
          <div class="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 class="text-base font-bold text-text-primary tracking-tight">Informasi Sistem</h3>
              <p class="text-xs text-text-muted">Metadata teknis aplikasi, ringkasan database, dan status lingkungan runtime.</p>
            </div>
            <button
              @click="loadSystemMetrics"
              :disabled="isSummaryLoading"
              class="p-2 rounded-xl text-text-muted hover:text-dark-green hover:bg-brand-50 transition-colors cursor-pointer"
              title="Perbarui Metrik Sistem"
            >
              <RefreshCw :size="16" :class="{ 'animate-spin': isSummaryLoading }" />
            </button>
          </div>

          <!-- Non-editable System Metadata -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div class="p-3.5 rounded-xl bg-surface/60 border border-gray-100 space-y-1">
              <span class="text-text-muted font-medium text-[11px] block">Aplikasi</span>
              <span class="font-bold text-text-primary block text-sm">LabDisplay System</span>
            </div>

            <div class="p-3.5 rounded-xl bg-surface/60 border border-gray-100 space-y-1">
              <span class="text-text-muted font-medium text-[11px] block">Versi</span>
              <span class="font-mono font-bold text-dark-green block text-sm">v1.0.0 (Production Architecture)</span>
            </div>

            <div class="p-3.5 rounded-xl bg-surface/60 border border-gray-100 space-y-1">
              <span class="text-text-muted font-medium text-[11px] block">Lingkungan Server & Runtime</span>
              <span class="font-bold text-text-primary block text-sm">Node.js 22+ (NestJS 11 REST API)</span>
            </div>

            <div class="p-3.5 rounded-xl bg-surface/60 border border-gray-100 space-y-1">
              <span class="text-text-muted font-medium text-[11px] block">Mesin Database & ORM</span>
              <span class="font-bold text-text-primary block text-sm">PostgreSQL 17 (Prisma ORM 6)</span>
            </div>

            <div class="p-3.5 rounded-xl bg-surface/60 border border-gray-100 space-y-1">
              <span class="text-text-muted font-medium text-[11px] block">Framework & UI Frontend</span>
              <span class="font-bold text-text-primary block text-sm">Vue 3.5 + Vite 8.1 + TailwindCSS v4</span>
            </div>

            <div class="p-3.5 rounded-xl bg-surface/60 border border-gray-100 space-y-1">
              <span class="text-text-muted font-medium text-[11px] block">Resolusi Layar / Viewport Klien</span>
              <span class="font-mono font-bold text-dark-green block text-sm">
                {{ viewportInfo.width }} × {{ viewportInfo.height }} px
                <span class="text-xs font-normal text-text-muted">({{ viewportInfo.screenWidth }} × {{ viewportInfo.screenHeight }} Layar)</span>
              </span>
            </div>
          </div>

          <!-- Active Database Records Summary -->
          <div class="space-y-3 pt-2">
            <h4 class="font-bold text-text-primary text-xs uppercase tracking-wider text-text-muted">Ringkasan Data Database Aktif</h4>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div class="p-3 rounded-xl bg-brand-50/50 border border-brand-200/60">
                <span class="text-text-muted text-[11px] block">Laboratorium</span>
                <span class="text-lg font-extrabold text-dark-green">{{ summaryData?.total_laboratories ?? '--' }}</span>
              </div>

              <div class="p-3 rounded-xl bg-sky-50/50 border border-sky-200/60">
                <span class="text-text-muted text-[11px] block">Jadwal</span>
                <span class="text-lg font-extrabold text-sky-800">{{ summaryData?.total_schedules ?? '--' }}</span>
              </div>

              <div class="p-3 rounded-xl bg-amber-50/50 border border-amber-200/60">
                <span class="text-text-muted text-[11px] block">Permohonan Pinjam</span>
                <span class="text-lg font-extrabold text-amber-800">{{ summaryData?.total_room_requests ?? '--' }}</span>
              </div>

              <div class="p-3 rounded-xl bg-purple-50/50 border border-purple-200/60">
                <span class="text-text-muted text-[11px] block">Pengumuman</span>
                <span class="text-lg font-extrabold text-purple-800">{{ summaryData?.active_announcements ?? '--' }}</span>
              </div>
            </div>
          </div>

          <!-- System Runtime Status -->
          <div class="space-y-3 pt-2">
            <h4 class="font-bold text-text-primary text-xs uppercase tracking-wider text-text-muted">Status Runtime Sistem</h4>
            <div class="p-4 rounded-xl bg-surface/50 border border-gray-100 space-y-2.5 text-xs">
              <div class="flex items-center justify-between">
                <span class="text-text-primary font-bold flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Klien Aplikasi Frontend
                </span>
                <span class="font-mono text-dark-green font-bold">Operasional (Aktif)</span>
              </div>
              <div class="flex items-center justify-between border-t border-gray-100 pt-2">
                <span class="text-text-primary font-bold flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  NestJS REST API
                </span>
                <span class="font-mono text-dark-green font-bold">Terhubung (Port 3000)</span>
              </div>
              <div class="flex items-center justify-between border-t border-gray-100 pt-2">
                <span class="text-text-primary font-bold flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  PostgreSQL 17 (Prisma ORM 6)
                </span>
                <span class="font-mono text-dark-green font-bold">● Terhubung (Online)</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>
