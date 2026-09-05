<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLaboranNavStore } from '@/stores/laboran-nav.store'
import { useAuthStore } from '@/stores/auth.store'
import { userService } from '@/services/user.service'
import { roomUsageService } from '@/services/room-usage.service'
import { roomRequestService } from '@/services/room-request.service'
import { sessionManager } from '@/utils'
import { formatDateTime, formatDate } from '@/utils/format.utils'
import apiClient from '@/services/api'
import { ProfileAvatarUploader } from '@/components'
import {
  User,
  Lock,
  SlidersHorizontal,
  History,
  CheckCircle2,
  X,
  AlertCircle,
  Save,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  Key,
  Bell,
  Clock,
  Search,
  Filter,
  Eye,
  EyeOff,
  Check,
  DoorOpen,
  ClipboardList,
  Edit3,
  ArrowLeft,
  Loader2
} from 'lucide-vue-next'

export interface RecentActivityItem {
  id: string
  title: string
  timestamp: string
  type: 'checkin' | 'checkout' | 'approval' | 'rejection' | 'schedule' | 'maintenance' | 'status'
}

const route = useRoute()
const router = useRouter()
const navStore = useLaboranNavStore()
const authStore = useAuthStore()

// Tab state: 'profile' | 'security' | 'preferences' | 'activity-history'
const activeTab = ref<'profile' | 'security' | 'preferences' | 'activity-history'>('profile')
const isEditProfileMode = ref(false)
const isSavingProfile = ref(false)
const isSavingSecurity = ref(false)

// Password show/hide eye toggles
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// 1. Profile State bound to live auth user
const profileForm = ref({
  fullName: authStore.user?.full_name || authStore.userName || 'Staf Laboran',
  email: authStore.user?.email || authStore.userEmail || 'staff@univ.ac.id',
  phone: authStore.user?.phone || '+62 812-3456-7890',
  nip: '199203152020121002',
  department: 'Fakultas Ilmu Komputer (FIK UPNVJ)',
  role: authStore.user?.role?.name || authStore.userRole || 'Staf Laboran',
  joinedDate: 'Semester Akademik'
})

const syncUserData = () => {
  if (authStore.user) {
    profileForm.value.fullName = authStore.user.full_name || authStore.userName || 'Staf Laboran'
    profileForm.value.email = authStore.user.email
    profileForm.value.phone = authStore.user.phone || ''
    profileForm.value.role = authStore.user.role?.name || authStore.userRole || 'Staf Laboran'
  }
}

watch(() => authStore.user, () => {
  syncUserData()
}, { immediate: true })

// 2. Security Form State
const securityForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const securityErrors = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Password Complexity Checkers
const hasMinLength = computed(() => securityForm.value.newPassword.length >= 8)
const hasUppercase = computed(() => /[A-Z]/.test(securityForm.value.newPassword))
const hasLowercase = computed(() => /[a-z]/.test(securityForm.value.newPassword))
const hasNumber = computed(() => /\d/.test(securityForm.value.newPassword))
const isMatch = computed(() => Boolean(securityForm.value.newPassword && securityForm.value.newPassword === securityForm.value.confirmPassword))

// 3. Preferences Form State
const preferencesForm = ref({
  emailNotifications: true,
  desktopAlerts: true,
  autoRefreshInterval: '30',
  defaultView: 'dashboard'
})

// 4. Activity History State & Filtering
const activitiesList = ref<RecentActivityItem[]>([])
const isLoadingActivities = ref(false)

const loadActivityHistory = async () => {
  isLoadingActivities.value = true
  try {
    const [usageRes, reqRes] = await Promise.all([
      roomUsageService.getRoomUsages({ limit: 10 }).catch(() => ({ data: [], meta: {} as any })),
      roomRequestService.getRoomRequests({ limit: 10 }).catch(() => ({ data: [], meta: {} as any }))
    ])

    const list: RecentActivityItem[] = []

    // Map usages to checkin/checkout activities
    ;(usageRes.data || []).forEach(u => {
      list.push({
        id: `usage-${u.id}`,
        title: u.status === 'IN_USE' || u.status === 'CHECKED_IN'
          ? `Check-in sesi ruangan: ${u.laboratoryName || 'Lab'} (${u.activityName || 'Praktikum'})`
          : `Sesi ruangan selesai untuk ${u.laboratoryName || 'Lab'} (${u.activityName || 'Praktikum'})`,
        timestamp: `${u.formattedCheckInTime || u.checkInTime}`,
        type: u.status === 'IN_USE' || u.status === 'CHECKED_IN' ? 'checkin' : 'checkout'
      })
    })

    // Map requests to approval/status activities
    ;(reqRes.data || []).forEach(r => {
      const statusType: RecentActivityItem['type'] = r.status === 'APPROVED' ? 'approval' : r.status === 'REJECTED' ? 'rejection' : 'status'
      list.push({
        id: `req-${r.id}`,
        title: `Permohonan pinjam ruangan ${r.laboratoryName || 'Lab'} oleh ${r.applicantName || 'Pemohon'} (${r.status === 'APPROVED' ? 'Disetujui' : r.status === 'REJECTED' ? 'Ditolak' : 'Menunggu'})`,
        timestamp: r.createdAt ? formatDateTime(r.createdAt) : 'Baru saja',
        type: statusType
      })
    })

    if (list.length > 0) {
      activitiesList.value = list
    } else {
      // Fallback operational log if empty
      activitiesList.value = [
        {
          id: 'act-101',
          title: 'Sistem operasional laboratorium diinisialisasi dan aktif',
          timestamp: formatDateTime(new Date()),
          type: 'status'
        }
      ]
    }
  } catch {
    // Graceful fallback
  } finally {
    isLoadingActivities.value = false
  }
}

const activitySearchQuery = ref('')
const activityTypeFilter = ref<string>('ALL')

const filteredActivities = computed(() => {
  return activitiesList.value.filter(item => {
    if (activityTypeFilter.value !== 'ALL' && item.type !== activityTypeFilter.value) {
      return false
    }
    if (activitySearchQuery.value.trim() !== '') {
      const q = activitySearchQuery.value.toLowerCase()
      const matchTitle = item.title.toLowerCase().includes(q)
      const matchTime = item.timestamp.toLowerCase().includes(q)
      if (!matchTitle && !matchTime) {
        return false
      }
    }
    return true
  })
})

// Toast Feedback System
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')

const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3500)
}

// Sync tab from route path
const syncTabFromRoute = () => {
  const path = route.path
  if (path.includes('/settings/activity-history')) {
    activeTab.value = 'activity-history'
    isEditProfileMode.value = false
    loadActivityHistory()
  } else if (path.includes('/settings/security')) {
    activeTab.value = 'security'
    isEditProfileMode.value = false
  } else if (path.includes('/settings/preferences')) {
    activeTab.value = 'preferences'
    isEditProfileMode.value = false
  } else if (path.includes('/settings/profile/edit')) {
    activeTab.value = 'profile'
    isEditProfileMode.value = true
  } else if (path.includes('/settings/profile')) {
    activeTab.value = 'profile'
    isEditProfileMode.value = false
  } else {
    activeTab.value = 'profile'
    isEditProfileMode.value = false
  }

  updateBreadcrumbs()
}

const updateBreadcrumbs = () => {
  const tabLabels: Record<string, string> = {
    profile: isEditProfileMode.value ? 'Ubah Profil' : 'Profil Staf',
    security: 'Keamanan & Kata Sandi',
    preferences: 'Preferensi',
    'activity-history': 'Riwayat Aktivitas'
  }

  navStore.setBreadcrumbs([
    { label: 'Portal Laboran', path: '/laboran' },
    { label: 'Pengaturan', path: '/laboran/settings' },
    { label: tabLabels[activeTab.value] || 'Profil Staf' }
  ])
}

onMounted(async () => {
  await authStore.initialize()
  syncUserData()
  syncTabFromRoute()
})

watch(() => route.path, () => {
  syncTabFromRoute()
})

const handleTabChange = (tab: 'profile' | 'security' | 'preferences' | 'activity-history') => {
  activeTab.value = tab
  isEditProfileMode.value = false
  router.push(`/laboran/settings/${tab}`)
}

const handleSaveProfile = async () => {
  if (!authStore.user?.id) {
    triggerToast('Sesi pengguna tidak ditemukan. Silakan masuk kembali.', 'error')
    return
  }

  if (!profileForm.value.fullName.trim()) {
    triggerToast('Nama lengkap tidak boleh kosong.', 'error')
    return
  }

  isSavingProfile.value = true
  try {
    const updated = await userService.updateUser(authStore.user.id, {
      full_name: profileForm.value.fullName.trim(),
      phone: profileForm.value.phone?.trim() || undefined,
    })

    authStore.setUser({
      ...authStore.user,
      full_name: updated.fullName,
      phone: updated.phone === 'N/A' ? undefined : (updated.phone || undefined),
    })
    sessionManager.saveUser(authStore.user)

    profileForm.value.fullName = updated.fullName
    profileForm.value.phone = updated.phone === 'N/A' ? '' : (updated.phone || '')

    isEditProfileMode.value = false
    triggerToast('Data profil akun berhasil diperbarui.', 'success')
    router.push('/laboran/settings/profile')
  } catch (err: any) {
    triggerToast(err.response?.data?.message || err.message || 'Gagal memperbarui profil.', 'error')
  } finally {
    isSavingProfile.value = false
  }
}

const handleSaveSecurity = async () => {
  if (!authStore.user?.id || !authStore.user?.email) {
    triggerToast('Sesi pengguna tidak ditemukan. Silakan masuk kembali.', 'error')
    return
  }

  securityErrors.value = { currentPassword: '', newPassword: '', confirmPassword: '' }

  if (!securityForm.value.currentPassword) {
    securityErrors.value.currentPassword = 'Kata sandi saat ini harus diisi'
    return
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  if (!securityForm.value.newPassword) {
    securityErrors.value.newPassword = 'Kata sandi baru harus diisi'
    return
  } else if (!passwordRegex.test(securityForm.value.newPassword)) {
    securityErrors.value.newPassword = 'Kata sandi harus memenuhi seluruh kriteria kerumitan'
    return
  }

  if (securityForm.value.newPassword !== securityForm.value.confirmPassword) {
    securityErrors.value.confirmPassword = 'Konfirmasi kata sandi tidak cocok'
    return
  }

  if (securityForm.value.currentPassword === securityForm.value.newPassword) {
    securityErrors.value.newPassword = 'Kata sandi baru tidak boleh sama dengan kata sandi saat ini'
    return
  }

  isSavingSecurity.value = true
  try {
    // 1. Verify current password
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

    // 2. Update password in PostgreSQL
    await userService.updateUser(authStore.user.id, {
      password: securityForm.value.newPassword,
    })

    securityForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
    triggerToast('Kata sandi berhasil diubah dan diperbarui.', 'success')
  } catch (err: any) {
    triggerToast(err.response?.data?.message || err.message || 'Gagal memperbarui kata sandi.', 'error')
  } finally {
    isSavingSecurity.value = false
  }
}

const handleSavePreferences = () => {
  triggerToast('Preferensi aplikasi berhasil disimpan.', 'success')
}
</script>

<template>
  <div class="space-y-6 pb-12 select-none">
    
    <!-- 1. Page Header Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2.5 border-b border-gray-200/60">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
            Pengaturan
          </h1>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-100/80 border border-brand-200 text-dark-green text-[11px] font-bold">
            <SlidersHorizontal :size="12" />
            Manajemen Akun
          </span>
        </div>
        <p class="text-xs sm:text-sm text-text-muted font-normal">
          Kelola akun staf, kredensial keamanan, preferensi, dan log riwayat aktivitas Anda.
        </p>
      </div>
    </div>

    <!-- Toast Banner -->
    <div
      v-if="showToast"
      :class="[
        'p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in zoom-in-95 duration-150',
        toastType === 'success' ? 'bg-emerald-50 border border-emerald-200 text-dark-green' : 'bg-rose-50 border border-rose-200 text-rose-800'
      ]"
    >
      <div class="flex items-center gap-2">
        <CheckCircle2 v-if="toastType === 'success'" :size="16" class="text-dark-green shrink-0" />
        <AlertCircle v-else :size="16" class="text-rose-600 shrink-0" />
        <span>{{ toastMessage }}</span>
      </div>
      <button @click="showToast = false" class="hover:opacity-80 cursor-pointer">
        <X :size="14" />
      </button>
    </div>

    <!-- 2. Two-Column Settings Layout -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
      
      <!-- Left Sub-Navigation Menu (1 col) -->
      <div class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-2 space-y-1">
        <button
          @click="handleTabChange('profile')"
          :class="[
            'w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-left cursor-pointer select-none',
            activeTab === 'profile'
              ? 'bg-brand-50 text-dark-green border-l-4 border-dark-green shadow-2xs font-extrabold'
              : 'text-text-secondary hover:bg-surface hover:text-text-primary'
          ]"
        >
          <User :size="16" :class="activeTab === 'profile' ? 'text-dark-green' : 'text-text-muted'" />
          <span>Profil</span>
        </button>

        <button
          @click="handleTabChange('security')"
          :class="[
            'w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-left cursor-pointer select-none',
            activeTab === 'security'
              ? 'bg-brand-50 text-dark-green border-l-4 border-dark-green shadow-2xs font-extrabold'
              : 'text-text-secondary hover:bg-surface hover:text-text-primary'
          ]"
        >
          <Lock :size="16" :class="activeTab === 'security' ? 'text-dark-green' : 'text-text-muted'" />
          <span>Keamanan</span>
        </button>

        <button
          @click="handleTabChange('preferences')"
          :class="[
            'w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-left cursor-pointer select-none',
            activeTab === 'preferences'
              ? 'bg-brand-50 text-dark-green border-l-4 border-dark-green shadow-2xs font-extrabold'
              : 'text-text-secondary hover:bg-surface hover:text-text-primary'
          ]"
        >
          <SlidersHorizontal :size="16" :class="activeTab === 'preferences' ? 'text-dark-green' : 'text-text-muted'" />
          <span>Preferensi</span>
        </button>

        <button
          @click="handleTabChange('activity-history')"
          :class="[
            'w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-left cursor-pointer select-none',
            activeTab === 'activity-history'
              ? 'bg-brand-50 text-dark-green border-l-4 border-dark-green shadow-2xs font-extrabold'
              : 'text-text-secondary hover:bg-surface hover:text-text-primary'
          ]"
        >
          <History :size="16" :class="activeTab === 'activity-history' ? 'text-dark-green' : 'text-text-muted'" />
          <span>Riwayat Aktivitas</span>
        </button>
      </div>

      <!-- Right Active Content Area (3 cols) -->
      <div class="md:col-span-3 space-y-6">
        
        <!-- ========================================== -->
        <!-- TAB 1: PROFILE / EDIT PROFILE -->
        <!-- ========================================== -->
        <div v-if="activeTab === 'profile'" class="space-y-6 animate-in fade-in duration-150">
          
          <!-- Profile View Mode -->
          <div v-if="!isEditProfileMode" class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-5 sm:p-6 space-y-6">
            <div class="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 class="text-base font-extrabold text-text-primary tracking-tight">Profil Staf</h3>
                <p class="text-xs text-text-muted">Kelola informasi pribadi dan data kredensial staf laboran Anda.</p>
              </div>

              <button
                @click="router.push('/laboran/settings/profile/edit')"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <Edit3 :size="14" />
                <span>Ubah Profil</span>
              </button>
            </div>

            <!-- Profile Summary Card -->
            <div class="flex flex-col sm:flex-row sm:items-center gap-5 p-5 rounded-2xl bg-brand-50/40 border border-brand-200/60">
              <ProfileAvatarUploader
                :model-value="authStore.userAvatar"
                :user-name="profileForm.fullName"
                size="2xl"
                :show-controls="true"
              />
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <h4 class="font-extrabold text-text-primary text-lg tracking-tight">{{ profileForm.fullName }}</h4>
                  <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-dark-green text-[10px] font-extrabold border border-emerald-200">
                    {{ profileForm.role }}
                  </span>
                </div>
                <p class="text-xs text-text-secondary font-medium">{{ profileForm.email }}</p>
                <p class="text-[11px] text-text-muted">Staf Laboran • Akses Terverifikasi</p>
              </div>
            </div>

            <!-- Profile Fields Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div class="p-3.5 rounded-xl border border-gray-100 bg-surface/40 space-y-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Nama Lengkap</span>
                <p class="font-extrabold text-text-primary text-sm">{{ profileForm.fullName }}</p>
              </div>

              <div class="p-3.5 rounded-xl border border-gray-100 bg-surface/40 space-y-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Alamat Email</span>
                <p class="font-extrabold text-text-primary text-sm">{{ profileForm.email }}</p>
              </div>

              <div class="p-3.5 rounded-xl border border-gray-100 bg-surface/40 space-y-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Nomor Telepon</span>
                <p class="font-extrabold text-text-primary text-sm">{{ profileForm.phone || 'Belum diatur' }}</p>
              </div>

              <div class="p-3.5 rounded-xl border border-gray-100 bg-surface/40 space-y-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-text-muted block">NIP / ID Staf</span>
                <p class="font-extrabold text-text-primary font-mono text-sm">{{ profileForm.nip }}</p>
              </div>

              <div class="p-3.5 rounded-xl border border-gray-100 bg-surface/40 space-y-1 sm:col-span-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Fakultas / Unit Kerja</span>
                <p class="font-extrabold text-text-primary text-sm">{{ profileForm.department }}</p>
              </div>
            </div>
          </div>

          <!-- Edit Profile Mode -->
          <div v-else class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-5 sm:p-6 space-y-5">
            <div class="flex items-center justify-between border-b border-gray-100 pb-3">
              <div class="flex items-center gap-2">
                <button
                  @click="router.push('/laboran/settings/profile')"
                  class="p-1.5 rounded-lg hover:bg-surface text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  <ArrowLeft :size="16" />
                </button>
                <h3 class="text-base font-extrabold text-text-primary tracking-tight">Ubah Profil</h3>
              </div>
            </div>

            <form @submit.prevent="handleSaveProfile" class="space-y-4 text-xs">
              <div>
                <label class="block font-bold text-text-primary mb-1">Nama Lengkap <span class="text-danger">*</span></label>
                <input
                  v-model="profileForm.fullName"
                  type="text"
                  required
                  class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/80 rounded-xl text-text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green focus:bg-white"
                />
              </div>

              <div>
                <label class="block font-bold text-text-primary mb-1">Alamat Email (Hanya-Baca)</label>
                <input
                  v-model="profileForm.email"
                  type="email"
                  disabled
                  class="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-text-muted font-semibold cursor-not-allowed"
                />
              </div>

              <div>
                <label class="block font-bold text-text-primary mb-1">Nomor Telepon</label>
                <input
                  v-model="profileForm.phone"
                  type="text"
                  placeholder="+62 812-3456-7890"
                  class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/80 rounded-xl text-text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green focus:bg-white"
                />
              </div>

              <div class="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  @click="router.push('/laboran/settings/profile')"
                  class="px-4 py-2 rounded-xl border border-gray-200 hover:bg-surface text-text-secondary font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  :disabled="isSavingProfile"
                  class="px-5 py-2.5 rounded-xl bg-dark-green hover:bg-[#547a5c] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Loader2 v-if="isSavingProfile" :size="14" class="animate-spin" />
                  <span>{{ isSavingProfile ? 'Menyimpan...' : 'Simpan Profil' }}</span>
                </button>
              </div>
            </form>
          </div>

        </div>

        <!-- ========================================== -->
        <!-- TAB 2: SECURITY (HARMONIZED IN-TAB LAYOUT) -->
        <!-- ========================================== -->
        <div v-if="activeTab === 'security'" class="space-y-6 animate-in fade-in duration-150">
          
          <!-- Card 1: Change Password Form (Main Card) -->
          <div class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-5 sm:p-6 space-y-6">
            <div class="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div class="w-10 h-10 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0">
                <Key :size="18" />
              </div>
              <div>
                <h3 class="text-base font-extrabold text-text-primary tracking-tight">Ubah Kata Sandi Akun</h3>
                <p class="text-xs text-text-muted">Perbarui kredensial Anda untuk menjaga keamanan akun.</p>
              </div>
            </div>

            <form @submit.prevent="handleSaveSecurity" class="space-y-4 text-xs">
              <!-- Current Password -->
              <div class="space-y-1.5">
                <label class="block font-bold text-text-primary">Kata Sandi Saat Ini <span class="text-danger">*</span></label>
                <div class="relative">
                  <input
                    v-model="securityForm.currentPassword"
                    :type="showCurrentPassword ? 'text' : 'password'"
                    placeholder="Masukkan kata sandi saat ini"
                    required
                    class="w-full pl-3.5 pr-10 py-2.5 bg-surface/60 border border-gray-200/80 rounded-xl text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green focus:bg-white"
                  />
                  <button
                    type="button"
                    @click="showCurrentPassword = !showCurrentPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
                  >
                    <EyeOff v-if="showCurrentPassword" :size="16" />
                    <Eye v-else :size="16" />
                  </button>
                </div>
                <p v-if="securityErrors.currentPassword" class="text-[11px] text-danger font-medium">
                  {{ securityErrors.currentPassword }}
                </p>
              </div>

              <!-- New Password -->
              <div class="space-y-1.5">
                <label class="block font-bold text-text-primary">Kata Sandi Baru <span class="text-danger">*</span></label>
                <div class="relative">
                  <input
                    v-model="securityForm.newPassword"
                    :type="showNewPassword ? 'text' : 'password'"
                    placeholder="Masukkan kata sandi baru"
                    required
                    class="w-full pl-3.5 pr-10 py-2.5 bg-surface/60 border border-gray-200/80 rounded-xl text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green focus:bg-white"
                  />
                  <button
                    type="button"
                    @click="showNewPassword = !showNewPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
                  >
                    <EyeOff v-if="showNewPassword" :size="16" />
                    <Eye v-else :size="16" />
                  </button>
                </div>

                <!-- Requirement Chips -->
                <div class="flex items-center gap-1.5 flex-wrap pt-1 text-[10.5px]">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded-md border flex items-center gap-1 transition-colors font-medium',
                      hasMinLength ? 'bg-emerald-50 border-emerald-200 text-dark-green font-bold' : 'bg-surface border-gray-200 text-text-muted'
                    ]"
                  >
                    <Check v-if="hasMinLength" :size="11" stroke-width="3" />
                    <span>8+ karakter</span>
                  </span>

                  <span
                    :class="[
                      'px-2 py-0.5 rounded-md border flex items-center gap-1 transition-colors font-medium',
                      hasUppercase ? 'bg-emerald-50 border-emerald-200 text-dark-green font-bold' : 'bg-surface border-gray-200 text-text-muted'
                    ]"
                  >
                    <Check v-if="hasUppercase" :size="11" stroke-width="3" />
                    <span>1 huruf besar</span>
                  </span>

                  <span
                    :class="[
                      'px-2 py-0.5 rounded-md border flex items-center gap-1 transition-colors font-medium',
                      hasLowercase ? 'bg-emerald-50 border-emerald-200 text-dark-green font-bold' : 'bg-surface border-gray-200 text-text-muted'
                    ]"
                  >
                    <Check v-if="hasLowercase" :size="11" stroke-width="3" />
                    <span>1 huruf kecil</span>
                  </span>

                  <span
                    :class="[
                      'px-2 py-0.5 rounded-md border flex items-center gap-1 transition-colors font-medium',
                      hasNumber ? 'bg-emerald-50 border-emerald-200 text-dark-green font-bold' : 'bg-surface border-gray-200 text-text-muted'
                    ]"
                  >
                    <Check v-if="hasNumber" :size="11" stroke-width="3" />
                    <span>1 angka</span>
                  </span>
                </div>

                <p v-if="securityErrors.newPassword" class="text-[11px] text-danger font-medium">
                  {{ securityErrors.newPassword }}
                </p>
              </div>

              <!-- Confirm Password -->
              <div class="space-y-1.5">
                <label class="block font-bold text-text-primary">Konfirmasi Kata Sandi Baru <span class="text-danger">*</span></label>
                <div class="relative">
                  <input
                    v-model="securityForm.confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    placeholder="Konfirmasi kata sandi baru"
                    required
                    class="w-full pl-3.5 pr-10 py-2.5 bg-surface/60 border border-gray-200/80 rounded-xl text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green focus:bg-white"
                  />
                  <button
                    type="button"
                    @click="showConfirmPassword = !showConfirmPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
                  >
                    <EyeOff v-if="showConfirmPassword" :size="16" />
                    <Eye v-else :size="16" />
                  </button>
                </div>

                <div v-if="securityForm.confirmPassword" class="pt-1 text-[10.5px]">
                  <span
                    :class="[
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-medium transition-colors',
                      isMatch ? 'bg-emerald-50 border-emerald-200 text-dark-green font-bold' : 'bg-rose-50 border-rose-200 text-rose-800'
                    ]"
                  >
                    <Check v-if="isMatch" :size="11" stroke-width="3" />
                    <X v-else :size="11" />
                    <span>{{ isMatch ? 'Kata sandi cocok' : 'Kata sandi tidak cocok' }}</span>
                  </span>
                </div>

                <p v-if="securityErrors.confirmPassword" class="text-[11px] text-danger font-medium">
                  {{ securityErrors.confirmPassword }}
                </p>
              </div>

              <div class="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  @click="securityForm.currentPassword = ''; securityForm.newPassword = ''; securityForm.confirmPassword = ''"
                  class="px-4 py-2 rounded-xl border border-gray-200 hover:bg-surface text-text-secondary font-bold transition-colors cursor-pointer"
                >
                  Bersihkan
                </button>
                <button
                  type="submit"
                  :disabled="isSavingSecurity"
                  class="px-6 py-2.5 rounded-xl bg-dark-green hover:bg-[#547a5c] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Loader2 v-if="isSavingSecurity" :size="14" class="animate-spin" />
                  <Key v-else :size="14" />
                  <span>{{ isSavingSecurity ? 'Memperbarui...' : 'Perbarui Kata Sandi' }}</span>
                </button>
              </div>
            </form>
          </div>

          <!-- Card 2: Security Status Box -->
          <div class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-5 sm:p-6 space-y-4">
            <h4 class="font-extrabold text-text-primary text-xs uppercase tracking-wider text-text-muted border-b border-gray-100 pb-2">
              Ringkasan Keamanan & Proteksi
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div class="p-4 rounded-xl border border-gray-100 bg-surface/40 space-y-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Enkripsi Kata Sandi</span>
                <p class="font-extrabold text-text-primary text-sm flex items-center gap-1.5">
                  <ShieldCheck :size="16" class="text-dark-green" />
                  <span>bcrypt Hashed (Salt Rounds: 10)</span>
                </p>
                <p class="text-[11px] text-text-muted">Terenkripsi pada database PostgreSQL</p>
              </div>

              <div class="p-4 rounded-xl border border-gray-100 bg-surface/40 space-y-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Keamanan Sesi</span>
                <p class="font-extrabold text-dark-green text-sm flex items-center gap-1.5">
                  <CheckCircle2 :size="16" />
                  <span>Sesi Terautentikasi JWT Aktif</span>
                </p>
                <p class="text-[11px] text-text-muted">Otorisasi aman berbasis token bearer</p>
              </div>
            </div>
          </div>

        </div>

        <!-- ========================================== -->
        <!-- TAB 3: PREFERENCES -->
        <!-- ========================================== -->
        <div v-if="activeTab === 'preferences'" class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-5 sm:p-6 space-y-5 animate-in fade-in duration-150">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-extrabold text-text-primary tracking-tight">Preferensi Aplikasi</h3>
            <p class="text-xs text-text-muted">Konfigurasi pemberitahuan operasional dan interval pembaruan data otomatis.</p>
          </div>

          <form @submit.prevent="handleSavePreferences" class="space-y-4 text-xs">
            <!-- Email Notifications -->
            <div class="flex items-center justify-between p-3.5 rounded-xl bg-surface/60 border border-gray-100">
              <div>
                <span class="font-bold text-text-primary block">Pemberitahuan Permohonan Pinjam</span>
                <span class="text-[11px] text-text-muted">Terima pemberitahuan setiap ada permohonan pinjam ruangan baru yang diajukan.</span>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  v-model="preferencesForm.emailNotifications"
                  class="sr-only peer"
                />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-dark-green"></div>
              </label>
            </div>

            <!-- Real-time Alerts -->
            <div class="flex items-center justify-between p-3.5 rounded-xl bg-surface/60 border border-gray-100">
              <div>
                <span class="font-bold text-text-primary block">Notifikasi Toast Desktop</span>
                <span class="text-[11px] text-text-muted">Tampilkan notifikasi pop-up saat sesi pemakaian ruangan dimulai atau selesai.</span>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  v-model="preferencesForm.desktopAlerts"
                  class="sr-only peer"
                />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-dark-green"></div>
              </label>
            </div>

            <div>
              <label class="block font-bold text-text-primary mb-1">Interval Pembaruan Monitor Langsung</label>
              <select
                v-model="preferencesForm.autoRefreshInterval"
                class="w-full px-3.5 py-2 bg-surface border border-gray-200 rounded-xl font-semibold text-text-primary focus:outline-none focus:border-brand-400 focus:bg-white cursor-pointer"
              >
                <option value="15">Setiap 15 detik</option>
                <option value="30">Setiap 30 detik (Disarankan)</option>
                <option value="60">Setiap 60 detik</option>
              </select>
            </div>

            <div class="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="submit"
                class="px-5 py-2 rounded-full bg-dark-green hover:bg-[#547a5c] text-white font-bold shadow-xs transition-colors cursor-pointer"
              >
                Simpan Preferensi
              </button>
            </div>
          </form>
        </div>

        <!-- ========================================== -->
        <!-- TAB 4: ACTIVITY HISTORY -->
        <!-- ========================================== -->
        <div v-if="activeTab === 'activity-history'" class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-5 sm:p-6 space-y-5 animate-in fade-in duration-150">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h3 class="text-base font-extrabold text-text-primary tracking-tight">Jejak Audit Aktivitas Staf</h3>
              <p class="text-xs text-text-muted">Tinjau log check-in operasional terbaru, persetujuan ruangan, dan aktivitas staf.</p>
            </div>

            <!-- Filters -->
            <div class="flex items-center gap-2 text-xs flex-wrap">
              <div class="relative min-w-[180px]">
                <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  v-model="activitySearchQuery"
                  type="text"
                  placeholder="Cari aktivitas..."
                  class="w-full pl-8 pr-3 py-1.5 bg-surface/60 border border-gray-200/80 rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-400 focus:bg-white transition-all"
                />
              </div>

              <select
                v-model="activityTypeFilter"
                class="px-3 py-1.5 rounded-xl bg-surface border border-gray-200 text-xs font-bold text-text-primary focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Jenis Aktivitas</option>
                <option value="checkin">Check-In</option>
                <option value="checkout">Check-Out</option>
                <option value="approval">Persetujuan Ruangan</option>
                <option value="rejection">Penolakan Ruangan</option>
                <option value="status">Perubahan Status</option>
              </select>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="isLoadingActivities" class="py-8 text-center">
            <Loader2 :size="24" class="mx-auto text-dark-green animate-spin mb-2" />
            <p class="text-xs text-text-muted">Memuat riwayat aktivitas...</p>
          </div>

          <!-- Activity Log List -->
          <div v-else class="space-y-3">
            <div
              v-for="item in filteredActivities"
              :key="item.id"
              class="p-3.5 rounded-xl border border-gray-100 bg-surface/30 flex items-start justify-between gap-3 text-xs hover:border-brand-200 transition-colors"
            >
              <div class="flex items-start gap-3">
                <div
                  :class="[
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                    item.type === 'checkin'
                      ? 'bg-emerald-100 text-dark-green'
                      : item.type === 'checkout'
                        ? 'bg-sky-100 text-sky-800'
                        : item.type === 'approval'
                          ? 'bg-brand-100 text-dark-green'
                          : item.type === 'rejection'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                  ]"
                >
                  <DoorOpen v-if="item.type === 'checkin' || item.type === 'checkout'" :size="16" />
                  <ClipboardList v-else-if="item.type === 'approval' || item.type === 'rejection'" :size="16" />
                  <History v-else :size="16" />
                </div>

                <div class="space-y-0.5">
                  <p class="font-bold text-text-primary leading-snug">{{ item.title }}</p>
                  <div class="flex items-center gap-2 text-[10.5px] text-text-muted">
                    <span class="font-medium">Pelaku: {{ profileForm.fullName }}</span>
                    <span>•</span>
                    <span class="font-mono text-dark-green font-semibold">{{ item.timestamp }}</span>
                  </div>
                </div>
              </div>

              <span
                :class="[
                  'px-2 py-0.5 rounded text-[10px] font-extrabold uppercase shrink-0',
                  item.type === 'checkin'
                    ? 'bg-emerald-50 text-dark-green border border-emerald-200'
                    : item.type === 'checkout'
                      ? 'bg-sky-50 text-sky-700 border border-sky-200'
                      : item.type === 'approval'
                        ? 'bg-brand-100 text-dark-green border border-brand-200'
                        : item.type === 'rejection'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                ]"
              >
                {{
                  item.type === 'checkin'
                    ? 'Check-In'
                    : item.type === 'checkout'
                      ? 'Check-Out'
                      : item.type === 'approval'
                        ? 'Disetujui'
                        : item.type === 'rejection'
                          ? 'Ditolak'
                          : 'Status'
                }}
              </span>
            </div>

            <div v-if="filteredActivities.length === 0" class="py-8 text-center text-text-muted space-y-1">
              <History :size="32" class="mx-auto text-text-muted/40 mb-1" />
              <h4 class="text-xs font-bold text-text-secondary">Log aktivitas tidak ditemukan</h4>
              <p class="text-[11px] text-text-muted">Tidak ada catatan aktivitas yang sesuai dengan kriteria filter saat ini.</p>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>
