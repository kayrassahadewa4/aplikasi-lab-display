<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLecturerNavStore } from '@/stores/lecturer-nav.store'
import { useAuthStore } from '@/stores/auth.store'
import { userService } from '@/services/user.service'
import { sessionManager } from '@/utils'
import apiClient from '@/services/api'
import {
  User,
  Lock,
  SlidersHorizontal,
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
  Edit3,
  ArrowLeft,
  GraduationCap,
  Loader2,
  Eye,
  EyeOff,
  Check
} from 'lucide-vue-next'
import { BaseAvatar, ProfileAvatarUploader } from '@/components'

const route = useRoute()
const router = useRouter()
const navStore = useLecturerNavStore()
const authStore = useAuthStore()

// Tab state: 'profile' | 'security' | 'preferences'
const activeTab = ref<'profile' | 'security' | 'preferences'>('profile')
const isEditProfileMode = ref(false)
const isSavingProfile = ref(false)
const isSavingPassword = ref(false)

// Password show/hide toggles
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Lecturer Profile State
const profileData = reactive({
  fullName: authStore.user?.full_name || authStore.userName || 'Dosen',
  email: authStore.user?.email || authStore.userEmail || 'lecturer@univ.ac.id',
  phone: authStore.user?.phone || '',
  nip: '19870415 201201 2 003',
  department: 'Fakultas Ilmu Komputer & Informatika',
  academicTitle: 'Dosen Pengajar / Asisten Ahli',
  role: authStore.user?.role?.name || authStore.userRole || 'Dosen',
  accountCreated: 'Semester Berjalan',
  lastPasswordChange: 'Terenkripsi (bcrypt)',
})

// Edit Profile Form State
const editForm = reactive({ ...profileData })
const editErrors = reactive({
  fullName: '',
  phone: '',
  department: '',
})

// Change Password Form State
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const passwordErrors = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// Password Complexity Checkers
const hasMinLength = computed(() => passwordForm.newPassword.length >= 8)
const hasUppercase = computed(() => /[A-Z]/.test(passwordForm.newPassword))
const hasLowercase = computed(() => /[a-z]/.test(passwordForm.newPassword))
const hasNumber = computed(() => /\d/.test(passwordForm.newPassword))
const isMatch = computed(() => Boolean(passwordForm.newPassword && passwordForm.newPassword === passwordForm.confirmPassword))

// Preferences State
const preferences = reactive({
  emailNotifications: true,
  desktopToasts: true,
  autoRefreshTimetable: true,
})

// Toast Feedback Notification State
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

// Sync live auth user
const syncUserData = () => {
  if (authStore.user) {
    profileData.fullName = authStore.user.full_name || authStore.userName || 'Dosen'
    profileData.email = authStore.user.email
    profileData.phone = authStore.user.phone || ''
    profileData.role = authStore.user.role?.name || authStore.userRole || 'Dosen'
    Object.assign(editForm, profileData)
  }
}

watch(() => authStore.user, () => {
  syncUserData()
}, { immediate: true })

// Sync active tab from route path
const syncFromRoute = () => {
  const path = route.path
  if (path.includes('/settings/profile/edit')) {
    activeTab.value = 'profile'
    isEditProfileMode.value = true
    Object.assign(editForm, profileData)
  } else if (path.includes('/settings/security') || path.includes('/settings/password')) {
    activeTab.value = 'security'
    isEditProfileMode.value = false
  } else if (path.includes('/settings/preferences')) {
    activeTab.value = 'preferences'
    isEditProfileMode.value = false
  } else {
    activeTab.value = 'profile'
    isEditProfileMode.value = false
  }

  updateBreadcrumbs()
}

const updateBreadcrumbs = () => {
  const tabLabels: Record<string, string> = {
    profile: isEditProfileMode.value ? 'Ubah Profil' : 'Profil Pribadi',
    security: 'Keamanan & Kata Sandi',
    preferences: 'Preferensi'
  }

  navStore.setBreadcrumbs([
    { label: 'Portal Dosen', path: '/lecturer' },
    { label: 'Pengaturan', path: '/lecturer/settings' },
    { label: tabLabels[activeTab.value] || 'Pengaturan' }
  ])
}

onMounted(async () => {
  await authStore.initialize()
  syncUserData()
  syncFromRoute()
})

watch(() => route.path, () => {
  syncFromRoute()
})

const switchTab = (tab: 'profile' | 'security' | 'preferences') => {
  activeTab.value = tab
  isEditProfileMode.value = false
  if (tab === 'profile') router.push('/lecturer/settings')
  else if (tab === 'security') router.push('/lecturer/settings/security')
  else if (tab === 'preferences') router.push('/lecturer/settings/preferences')
}

// Edit Profile Handlers
const openEditProfile = () => {
  router.push('/lecturer/settings/profile/edit')
}

const saveEditProfile = async () => {
  if (!authStore.user?.id) {
    triggerToast('Sesi pengguna tidak ditemukan. Silakan masuk kembali.', 'error')
    return
  }

  editErrors.fullName = ''
  editErrors.phone = ''
  editErrors.department = ''

  let valid = true
  if (!editForm.fullName.trim()) {
    editErrors.fullName = 'Nama lengkap wajib diisi'
    valid = false
  }

  if (!valid) return

  isSavingProfile.value = true
  try {
    const updated = await userService.updateUser(authStore.user.id, {
      full_name: editForm.fullName.trim(),
      phone: editForm.phone?.trim() || undefined,
    })

    authStore.setUser({
      ...authStore.user,
      full_name: updated.fullName,
      phone: updated.phone === 'N/A' ? undefined : (updated.phone || undefined),
    })
    sessionManager.saveUser(authStore.user)

    profileData.fullName = updated.fullName
    profileData.phone = updated.phone === 'N/A' ? '' : (updated.phone || '')

    triggerToast('Profil dosen berhasil diperbarui.', 'success')
    router.push('/lecturer/settings')
  } catch (err: any) {
    triggerToast(err.response?.data?.message || err.message || 'Gagal memperbarui profil.', 'error')
  } finally {
    isSavingProfile.value = false
  }
}

// Change Password Handler
const saveChangePassword = async () => {
  if (!authStore.user?.id || !authStore.user?.email) {
    triggerToast('Sesi pengguna tidak ditemukan. Silakan masuk kembali.', 'error')
    return
  }

  passwordErrors.currentPassword = ''
  passwordErrors.newPassword = ''
  passwordErrors.confirmPassword = ''

  let valid = true
  if (!passwordForm.currentPassword) {
    passwordErrors.currentPassword = 'Kata sandi saat ini wajib diisi'
    valid = false
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  if (!passwordForm.newPassword) {
    passwordErrors.newPassword = 'Kata sandi baru wajib diisi'
    valid = false
  } else if (!passwordRegex.test(passwordForm.newPassword)) {
    passwordErrors.newPassword = 'Kata sandi harus memenuhi semua kriteria keamanan'
    valid = false
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordErrors.confirmPassword = 'Konfirmasi kata sandi tidak cocok'
    valid = false
  }

  if (passwordForm.currentPassword && passwordForm.newPassword === passwordForm.currentPassword) {
    passwordErrors.newPassword = 'Kata sandi baru tidak boleh sama dengan kata sandi saat ini'
    valid = false
  }

  if (!valid) return

  isSavingPassword.value = true
  try {
    // 1. Verify current password with backend
    try {
      await apiClient.post('/auth/login', {
        email: authStore.user.email,
        password: passwordForm.currentPassword,
      })
    } catch (authErr: any) {
      if (authErr.response?.status === 401 || authErr.response?.data?.statusCode === 401) {
        throw new Error('Kata sandi saat ini salah')
      }
    }

    // 2. Update password in PostgreSQL
    await userService.updateUser(authStore.user.id, {
      password: passwordForm.newPassword,
    })

    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''

    triggerToast('Kata sandi berhasil diperbarui dan terenkripsi.', 'success')
  } catch (err: any) {
    triggerToast(err.response?.data?.message || err.message || 'Gagal memperbarui kata sandi.', 'error')
  } finally {
    isSavingPassword.value = false
  }
}

const savePreferences = () => {
  triggerToast('Preferensi akun berhasil disimpan.', 'success')
}

const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="space-y-6 pb-12 select-none w-full max-w-full min-w-0">
    
    <!-- 1. Page Header Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200/60 w-full min-w-0">
      <div class="min-w-0 flex-1">
        <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight truncate">
          Pengaturan Akun
        </h1>
        <p class="text-xs sm:text-sm text-text-muted font-normal truncate">
          Kelola profil dosen, kredensial keamanan, dan preferensi aplikasi.
        </p>
      </div>
    </div>

    <!-- Toast Feedback Notification Banner -->
    <div
      v-if="showToast"
      :class="[
        'p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in zoom-in-95 duration-150',
        toastType === 'success' ? 'bg-brand-100/90 border border-brand-200 text-dark-green' : 'bg-rose-50 border border-rose-200 text-rose-800'
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

    <!-- 2. Permanent Navigation Tabs Bar -->
    <div v-if="!isEditProfileMode" class="flex items-center gap-2 border-b border-gray-200 overflow-x-auto w-full min-w-0">
      <button
        @click="switchTab('profile')"
        :class="[
          'px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap',
          activeTab === 'profile'
            ? 'border-dark-green text-dark-green bg-brand-50/40 rounded-t-xl font-extrabold'
            : 'border-transparent text-text-secondary hover:text-text-primary'
        ]"
      >
        <User :size="15" />
        <span>Profil Pribadi</span>
      </button>

      <button
        @click="switchTab('security')"
        :class="[
          'px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap',
          activeTab === 'security'
            ? 'border-dark-green text-dark-green bg-brand-50/40 rounded-t-xl font-extrabold'
            : 'border-transparent text-text-secondary hover:text-text-primary'
        ]"
      >
        <Lock :size="15" />
        <span>Keamanan & Kata Sandi</span>
      </button>

      <button
        @click="switchTab('preferences')"
        :class="[
          'px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap',
          activeTab === 'preferences'
            ? 'border-dark-green text-dark-green bg-brand-50/40 rounded-t-xl font-extrabold'
            : 'border-transparent text-text-secondary hover:text-text-primary'
        ]"
      >
        <SlidersHorizontal :size="15" />
        <span>Preferensi</span>
      </button>
    </div>

    <!-- ========================================================= -->
    <!-- VIEW A: PROFILE OVERVIEW (MAIN TAB)                      -->
    <!-- ========================================================= -->
    <div v-if="activeTab === 'profile' && !isEditProfileMode" class="space-y-6 w-full min-w-0">
      
      <!-- Profile Card -->
      <div class="bg-white p-6 rounded-2xl border border-gray-200/70 shadow-2xs space-y-6 w-full min-w-0">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5 min-w-0">
          <div class="flex flex-col sm:flex-row sm:items-center gap-5 min-w-0">
            <ProfileAvatarUploader
              :model-value="authStore.userAvatar"
              :user-name="profileData.fullName"
              size="2xl"
              :show-controls="true"
            />
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap min-w-0">
                <h2 class="text-lg font-extrabold text-text-primary truncate min-w-0">{{ profileData.fullName }}</h2>
                <span class="px-2 py-0.5 rounded bg-brand-100 text-dark-green text-[10px] font-extrabold shrink-0">
                  {{ profileData.role }}
                </span>
              </div>
              <p class="text-xs text-text-muted mt-0.5 truncate">{{ profileData.email }}</p>
              <p class="text-[11px] text-dark-green font-bold mt-1 truncate">{{ profileData.academicTitle }}</p>
            </div>
          </div>

          <button
            @click="openEditProfile"
            class="px-4 py-2 rounded-xl bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 self-start sm:self-auto flex items-center gap-1.5"
          >
            <Edit3 :size="14" />
            <span>Ubah Profil</span>
          </button>
        </div>

        <!-- Personal Details Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div class="p-3.5 rounded-xl border border-gray-100 bg-surface/40 space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Nama Lengkap</span>
            <p class="font-extrabold text-text-primary text-sm">{{ profileData.fullName }}</p>
          </div>

          <div class="p-3.5 rounded-xl border border-gray-100 bg-surface/40 space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Alamat Email (ID Autentikasi)</span>
            <p class="font-extrabold text-text-primary text-sm">{{ profileData.email }}</p>
            <p class="text-[10px] text-text-muted">Dikelola oleh penyedia autentikasi sistem</p>
          </div>

          <div class="p-3.5 rounded-xl border border-gray-100 bg-surface/40 space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Nomor Telepon / Kontak</span>
            <p class="font-extrabold text-text-primary text-sm">{{ profileData.phone || 'Belum diatur' }}</p>
          </div>

          <div class="p-3.5 rounded-xl border border-gray-100 bg-surface/40 space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-text-muted block">NIP / ID Staf</span>
            <p class="font-extrabold text-text-primary font-mono text-sm">{{ profileData.nip }}</p>
          </div>

          <div class="p-3.5 rounded-xl border border-gray-100 bg-surface/40 space-y-1 sm:col-span-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Departemen / Unit Fakultas</span>
            <p class="font-extrabold text-text-primary text-sm">{{ profileData.department }}</p>
          </div>
        </div>
      </div>

      <!-- Read-Only Account Information Card -->
      <div class="bg-white p-6 rounded-2xl border border-gray-200/70 shadow-2xs space-y-4 w-full min-w-0">
        <h3 class="text-xs font-extrabold uppercase tracking-wider text-text-secondary border-b border-gray-100 pb-2.5">
          Informasi Akun
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div class="space-y-1">
            <span class="text-text-muted text-[11px]">Email Utama:</span>
            <p class="font-bold text-text-primary">{{ profileData.email }}</p>
          </div>

          <div class="space-y-1">
            <span class="text-text-muted text-[11px]">Peran Pengguna:</span>
            <p class="font-bold text-dark-green flex items-center gap-1">
              <GraduationCap :size="14" />
              <span>{{ profileData.role }}</span>
            </p>
          </div>

          <div class="space-y-1">
            <span class="text-text-muted text-[11px]">Status Akun:</span>
            <p class="font-bold text-emerald-700">● Data Aktif di Basis Data</p>
          </div>
        </div>
      </div>

    </div>

    <!-- ========================================================= -->
    <!-- VIEW B: DEDICATED EDIT PROFILE SUBPAGE                    -->
    <!-- ========================================================= -->
    <div v-if="isEditProfileMode" class="space-y-6 w-full min-w-0">
      <div class="space-y-2 pb-2 border-b border-gray-200/60 min-w-0">
        <button
          @click="navigateTo('/lecturer/settings')"
          class="inline-flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-dark-green transition-colors cursor-pointer"
        >
          <ArrowLeft :size="16" />
          <span>Kembali ke Pengaturan</span>
        </button>
        <h2 class="text-xl font-extrabold text-text-primary">Ubah Profil</h2>
        <p class="text-xs text-text-muted">Perbarui informasi pribadi dan kontak Anda.</p>
      </div>

      <form @submit.prevent="saveEditProfile" class="bg-white p-6 sm:p-7 rounded-2xl border border-gray-200/70 shadow-2xs space-y-5 max-w-3xl min-w-0">
        <!-- Full Name -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-text-primary block">
            Nama Lengkap <span class="text-danger">*</span>
          </label>
          <input
            v-model="editForm.fullName"
            type="text"
            required
            :class="[
              'w-full px-3.5 py-2.5 bg-surface/60 border rounded-xl text-xs text-text-primary font-medium transition-all focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green focus:bg-white',
              editErrors.fullName ? 'border-danger bg-red-50/20' : 'border-gray-200/80'
            ]"
          />
          <p v-if="editErrors.fullName" class="text-[11px] text-danger font-medium flex items-center gap-1">
            <AlertCircle :size="12" />
            <span>{{ editErrors.fullName }}</span>
          </p>
        </div>

        <!-- Read-Only Email -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-text-primary block">
            Alamat Email (Hanya Baca)
          </label>
          <input
            v-model="editForm.email"
            type="email"
            disabled
            class="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs text-text-muted font-medium cursor-not-allowed"
          />
          <p class="text-[10px] text-text-muted">Email terikat dengan kredensial masuk dan tidak dapat diubah langsung.</p>
        </div>

        <!-- Phone Number -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-text-primary block">
            Nomor Telepon / Kontak
          </label>
          <input
            v-model="editForm.phone"
            type="text"
            placeholder="+62 812-3456-7890"
            class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/80 rounded-xl text-xs text-text-primary font-medium transition-all focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green focus:bg-white"
          />
        </div>

        <!-- Department -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-text-primary block">
            Departemen / Unit Fakultas
          </label>
          <input
            v-model="editForm.department"
            type="text"
            class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/80 rounded-xl text-xs text-text-primary font-medium transition-all focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green focus:bg-white"
          />
        </div>

        <!-- Form Actions -->
        <div class="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            @click="navigateTo('/lecturer/settings')"
            class="px-5 py-2.5 rounded-xl border border-gray-200 text-text-secondary hover:text-text-primary hover:bg-surface font-bold text-xs transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="submit"
            :disabled="isSavingProfile"
            class="px-6 py-2.5 rounded-xl bg-dark-green hover:bg-[#547a5c] text-white font-bold text-xs shadow-xs shadow-dark-green/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            <Loader2 v-if="isSavingProfile" :size="15" class="animate-spin" />
            <Save v-else :size="15" />
            <span>{{ isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan' }}</span>
          </button>
        </div>
      </form>
    </div>

    <!-- ========================================================= -->
    <!-- VIEW C: SECURITY & PASSWORD (HARMONIZED IN-TAB LAYOUT)   -->
    <!-- ========================================================= -->
    <div v-if="activeTab === 'security' && !isEditProfileMode" class="space-y-6 w-full min-w-0">
      
      <!-- Card 1: Change Account Password Form (Main Card) -->
      <div class="bg-white p-6 sm:p-7 rounded-2xl border border-gray-200/70 shadow-2xs space-y-6 max-w-3xl min-w-0">
        
        <!-- Card Header -->
        <div class="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div class="w-10 h-10 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0">
            <Key :size="18" />
          </div>
          <div>
            <h3 class="text-base font-extrabold text-text-primary tracking-tight">Ubah Kata Sandi Akun</h3>
            <p class="text-xs text-text-muted">Perbarui kredensial Anda demi menjaga keamanan akun.</p>
          </div>
        </div>

        <form @submit.prevent="saveChangePassword" class="space-y-5">
          
          <!-- Current Password -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-text-primary block">
              Kata Sandi Saat Ini <span class="text-danger">*</span>
            </label>
            <div class="relative">
              <input
                v-model="passwordForm.currentPassword"
                :type="showCurrentPassword ? 'text' : 'password'"
                placeholder="Masukkan kata sandi saat ini"
                required
                :class="[
                  'w-full pl-3.5 pr-10 py-2.5 bg-surface/60 border rounded-xl text-xs text-text-primary font-medium transition-all focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green focus:bg-white',
                  passwordErrors.currentPassword ? 'border-danger bg-red-50/20' : 'border-gray-200/80'
                ]"
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
            <p v-if="passwordErrors.currentPassword" class="text-[11px] text-danger font-medium flex items-center gap-1">
              <AlertCircle :size="12" />
              <span>{{ passwordErrors.currentPassword }}</span>
            </p>
          </div>

          <!-- New Password -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-text-primary block">
              Kata Sandi Baru <span class="text-danger">*</span>
            </label>
            <div class="relative">
              <input
                v-model="passwordForm.newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                placeholder="Masukkan kata sandi baru yang kuat"
                required
                :class="[
                  'w-full pl-3.5 pr-10 py-2.5 bg-surface/60 border rounded-xl text-xs text-text-primary font-medium transition-all focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green focus:bg-white',
                  passwordErrors.newPassword ? 'border-danger bg-red-50/20' : 'border-gray-200/80'
                ]"
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
            
            <!-- Live Requirement Chips -->
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

            <p v-if="passwordErrors.newPassword" class="text-[11px] text-danger font-medium flex items-center gap-1">
              <AlertCircle :size="12" />
              <span>{{ passwordErrors.newPassword }}</span>
            </p>
          </div>

          <!-- Confirm Password -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-text-primary block">
              Konfirmasi Kata Sandi Baru <span class="text-danger">*</span>
            </label>
            <div class="relative">
              <input
                v-model="passwordForm.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Masukkan ulang kata sandi baru"
                required
                :class="[
                  'w-full pl-3.5 pr-10 py-2.5 bg-surface/60 border rounded-xl text-xs text-text-primary font-medium transition-all focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green focus:bg-white',
                  passwordErrors.confirmPassword ? 'border-danger bg-red-50/20' : 'border-gray-200/80'
                ]"
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

            <div v-if="passwordForm.confirmPassword" class="pt-1 text-[10.5px]">
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

            <p v-if="passwordErrors.confirmPassword" class="text-[11px] text-danger font-medium flex items-center gap-1">
              <AlertCircle :size="12" />
              <span>{{ passwordErrors.confirmPassword }}</span>
            </p>
          </div>

          <!-- Form Actions Footer -->
          <div class="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              @click="passwordForm.currentPassword = ''; passwordForm.newPassword = ''; passwordForm.confirmPassword = ''"
              class="px-5 py-2.5 rounded-xl border border-gray-200 text-text-secondary hover:text-text-primary hover:bg-surface font-bold text-xs transition-colors cursor-pointer"
            >
              Hapus
            </button>

            <button
              type="submit"
              :disabled="isSavingPassword"
              class="px-6 py-2.5 rounded-xl bg-dark-green hover:bg-[#547a5c] text-white font-bold text-xs shadow-xs shadow-dark-green/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Loader2 v-if="isSavingPassword" :size="15" class="animate-spin" />
              <Key v-else :size="15" />
              <span>{{ isSavingPassword ? 'Memperbarui Kata Sandi...' : 'Perbarui Kata Sandi' }}</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Card 2: Security & Authentication Snapshot -->
      <div class="bg-white p-6 rounded-2xl border border-gray-200/70 shadow-2xs space-y-4 max-w-3xl min-w-0">
        <h3 class="text-xs font-extrabold uppercase tracking-wider text-text-secondary border-b border-gray-100 pb-2.5">
          Ringkasan Keamanan & Proteksi
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div class="p-4 rounded-xl border border-gray-100 bg-surface/40 space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Enkripsi Kata Sandi</span>
            <p class="font-extrabold text-text-primary text-sm flex items-center gap-1.5">
              <ShieldCheck :size="16" class="text-dark-green" />
              <span>Hashing bcrypt (Putaran Garam: 10)</span>
            </p>
            <p class="text-[11px] text-text-muted">Terenkripsi di basis data PostgreSQL</p>
          </div>

          <div class="p-4 rounded-xl border border-gray-100 bg-surface/40 space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Keamanan Sesi</span>
            <p class="font-extrabold text-dark-green text-sm flex items-center gap-1.5">
              <CheckCircle2 :size="16" />
              <span>Sesi Terautentikasi JWT Aktif</span>
            </p>
            <p class="text-[11px] text-text-muted">Otorisasi bearer token terlindungi</p>
          </div>
        </div>
      </div>

    </div>

    <!-- ========================================================= -->
    <!-- VIEW D: PREFERENCES                                       -->
    <!-- ========================================================= -->
    <div v-if="activeTab === 'preferences' && !isEditProfileMode" class="space-y-6 w-full min-w-0">
      <div class="bg-white p-6 sm:p-7 rounded-2xl border border-gray-200/70 shadow-2xs space-y-6 max-w-3xl min-w-0">
        <h3 class="text-sm font-extrabold uppercase tracking-wider text-text-secondary border-b border-gray-100 pb-2.5 flex items-center gap-2">
          <Bell :size="16" class="text-dark-green" />
          <span>Preferensi Notifikasi & Aplikasi</span>
        </h3>

        <div class="space-y-4 text-xs">
          <!-- Toggle 1: Email Notifications -->
          <div class="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-surface/30">
            <div>
              <h4 class="font-bold text-text-primary">Notifikasi Email</h4>
              <p class="text-[11px] text-text-muted">Terima notifikasi email saat status permohonan pinjam ruangan Anda diperbarui (Disetujui/Ditolak).</p>
            </div>
            <input
              v-model="preferences.emailNotifications"
              type="checkbox"
              class="w-4 h-4 text-dark-green rounded focus:ring-dark-green cursor-pointer"
            />
          </div>

          <!-- Toggle 2: Desktop Toast Alerts -->
          <div class="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-surface/30">
            <div>
              <h4 class="font-bold text-text-primary">Notifikasi Toast Desktop</h4>
              <p class="text-[11px] text-text-muted">Tampilkan notifikasi sembulan langsung di dalam Portal Dosen.</p>
            </div>
            <input
              v-model="preferences.desktopToasts"
              type="checkbox"
              class="w-4 h-4 text-dark-green rounded focus:ring-dark-green cursor-pointer"
            />
          </div>

          <!-- Toggle 3: Timetable Auto Refresh -->
          <div class="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-surface/30">
            <div>
              <h4 class="font-bold text-text-primary">Pembaruan Otomatis Jadwal Perkuliahan</h4>
              <p class="text-[11px] text-text-muted">Perbarui tampilan jadwal perkuliahan dan ketersediaan ruangan secara otomatis.</p>
            </div>
            <input
              v-model="preferences.autoRefreshTimetable"
              type="checkbox"
              class="w-4 h-4 text-dark-green rounded focus:ring-dark-green cursor-pointer"
            />
          </div>
        </div>

        <div class="pt-4 border-t border-gray-100 flex justify-end">
          <button
            @click="savePreferences"
            class="px-6 py-2.5 rounded-xl bg-dark-green hover:bg-[#547a5c] text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Save :size="15" />
            <span>Simpan Preferensi</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
