<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import { useAuthStore } from '@/stores/auth.store'
import { userService } from '@/services/user.service'
import { authService } from '@/services/auth.service'
import {
  ArrowLeft,
  User,
  Camera,
  CheckCircle2,
  Lock,
  Save,
  X,
  AlertTriangle,
  Loader2,
  Sparkles,
  Eye,
  ShieldCheck,
  Mail,
  Phone
} from 'lucide-vue-next'
import { ProfileAvatarUploader } from '@/components'

const router = useRouter()
const navStore = useAdminNavStore()
const authStore = useAuthStore()

const isLoading = ref(false)
const isSaving = ref(false)

// Form State
const editForm = ref({
  fullName: authStore.userName || 'Administrator',
  email: authStore.user?.email || 'admin@lab.com',
  phone: '',
  role: authStore.userRole || 'Administrator',
  status: 'Active',
})

// Toast & Error Feedback
const showToast = ref(false)
const toastMessage = ref('')
const errorMessage = ref('')

onMounted(async () => {
  navStore.setBreadcrumbs([
    { label: 'Dashboard', path: '/admin' },
    { label: 'Profil', path: '/admin/profile' },
    { label: 'Ubah Profil' },
  ])
  authStore.initialize()

  try {
    isLoading.value = true
    const me = await authService.getCurrentUser()
    if (me) {
      editForm.value = {
        fullName: me.full_name || authStore.userName || 'Administrator',
        email: me.email || authStore.user?.email || 'admin@lab.com',
        phone: me.phone || '',
        role: (me.role?.name || authStore.userRole || 'Administrator') as string,
        status: me.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif',
      }
    }
  } catch (error) {
    console.error('Failed to load user profile for editing:', error)
  } finally {
    isLoading.value = false
  }
})

const handlePhotoUpload = () => {
  toastMessage.value = 'Fitur unggah foto profil siap digunakan.'
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 2500)
}

const handleSave = async () => {
  if (!editForm.value.fullName.trim()) {
    errorMessage.value = 'Nama lengkap wajib diisi.'
    return
  }

  isSaving.value = true
  errorMessage.value = ''

  try {
    const currentUserId = authStore.user?.id
    if (currentUserId) {
      await userService.updateUser(currentUserId, {
        full_name: editForm.value.fullName.trim(),
        phone: editForm.value.phone ? editForm.value.phone.trim() : undefined,
      })
      if (authStore.user) {
        authStore.user.full_name = editForm.value.fullName.trim()
      }
    }

    toastMessage.value = 'Detail profil berhasil diperbarui.'
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
      router.push('/admin/profile')
    }, 1000)
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || error.message || 'Gagal memperbarui profil'
  } finally {
    isSaving.value = false
  }
}

const handleCancel = () => {
  router.push('/admin/profile')
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
        <span>Kembali ke Profil</span>
      </button>

      <div class="pb-3 border-b border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
              Ubah Profil Saya
            </h1>
            <span class="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-brand-100 text-dark-green text-xs font-extrabold border border-brand-200">
              <Sparkles :size="13" />
              <span>Catatan Pribadi</span>
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted font-medium">
            Perbarui detail identitas pribadi, gelar akademik, dan nomor telepon kontak Anda.
          </p>
        </div>
      </div>
    </div>

    <!-- Error Alert Banner -->
    <div
      v-if="errorMessage"
      class="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="flex items-center gap-2">
        <AlertTriangle :size="16" class="text-rose-600 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>
      <button @click="errorMessage = ''" class="text-rose-500 hover:text-rose-700 cursor-pointer">
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

    <!-- Loading State -->
    <div v-if="isLoading" class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-20 text-center">
      <div class="inline-flex items-center gap-3 text-text-muted">
        <Loader2 :size="24" class="animate-spin text-dark-green" />
        <span class="text-xs font-medium">Memuat data profil...</span>
      </div>
    </div>

    <!-- 2. MAIN 2-COLUMN GRID (8 COLS FORM + 4 COLS SIDEBAR) -->
    <form v-if="!isLoading" @submit.prevent="handleSave" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- ======================================================== -->
      <!-- LEFT COLUMN: MAIN FORM SECTIONS (8 COLS)                 -->
      <!-- ======================================================== -->
      <div class="lg:col-span-8 space-y-5">
        <!-- Section 1: Avatar & Basic Information -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 sm:p-7 space-y-5">
          <div class="p-4 rounded-2xl bg-surface/60 border border-gray-100">
            <ProfileAvatarUploader
              :model-value="authStore.userAvatar"
              :user-name="editForm.fullName"
              size="2xl"
              :show-controls="true"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1.5 sm:col-span-2">
              <label class="block font-bold text-text-primary">
                Nama Lengkap (beserta Gelar Akademik) <span class="text-red-500">*</span>
              </label>
              <input
                v-model="editForm.fullName"
                type="text"
                required
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">
                Alamat Email
              </label>
              <input
                :value="editForm.email"
                type="email"
                disabled
                class="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200/80 rounded-xl font-medium text-text-muted cursor-not-allowed"
              />
              <p class="text-[10px] text-text-muted">Dikelola melalui SSO Institusi Pusat</p>
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">
                Nomor Telepon
              </label>
              <input
                v-model="editForm.phone"
                type="text"
                placeholder="mis. +62 812-3456-7890"
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        <!-- Section 2: Account Privileges (Read-Only) -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 sm:p-7 space-y-5">
          <div class="flex items-center gap-3 border-b border-gray-100 pb-3.5">
            <div class="w-10 h-10 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <Lock :size="20" stroke-width="2.2" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-text-primary tracking-tight">Peran Sistem & Hak Akses</h3>
              <p class="text-xs text-text-muted">Tingkat keamanan administratif yang ditetapkan dan status keaktifan akun.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">Peran Sistem yang Ditetapkan</label>
              <input
                :value="editForm.role"
                type="text"
                disabled
                class="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200/80 rounded-xl font-bold text-dark-green cursor-not-allowed"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">Status Akun</label>
              <input
                :value="editForm.status"
                type="text"
                disabled
                class="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200/80 rounded-xl font-bold text-emerald-800 cursor-not-allowed"
              />
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
              <span>Kartu Profil</span>
            </h4>
            <span class="px-2 py-0.5 rounded-full bg-brand-50 text-dark-green font-mono text-[10px] font-extrabold border border-brand-200/60">
              AKTIF
            </span>
          </div>

          <div class="space-y-3 text-xs">
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Nama Lengkap</span>
              <span class="font-bold text-text-primary truncate max-w-[170px] text-right">{{ editForm.fullName }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Email</span>
              <span class="font-semibold text-text-secondary truncate max-w-[170px] text-right text-[11px]">{{ editForm.email }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Peran</span>
              <span class="font-extrabold text-dark-green">{{ editForm.role }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5">
              <span class="text-text-muted font-medium">Nomor Telepon</span>
              <span class="font-medium text-text-secondary">{{ editForm.phone || 'Belum dikonfigurasi' }}</span>
            </div>
          </div>
        </div>

        <!-- Security Guidelines Card -->
        <div class="bg-brand-50/60 rounded-2xl border border-brand-200/80 p-5 space-y-2.5 text-xs">
          <div class="flex items-center gap-2 font-bold text-dark-green">
            <ShieldCheck :size="16" />
            <span>Panduan Profil</span>
          </div>
          <ul class="text-[11px] text-text-secondary space-y-1.5 list-disc list-inside leading-relaxed">
            <li>Pastikan nama lengkap Anda mencantumkan gelar akademik yang sesuai.</li>
            <li>Penetapan peran dikelola secara terpusat oleh Administrator Sistem.</li>
            <li>Untuk memperbarui kata sandi keamanan Anda, gunakan menu Ubah Kata Sandi khusus.</li>
          </ul>
        </div>

        <!-- Sticky Primary Action Buttons Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-3">
          <button
            type="submit"
            :disabled="isSaving || !editForm.fullName.trim()"
            class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#3B694A] to-[#2D5A3F] hover:from-[#31573E] hover:to-[#244430] text-white font-extrabold text-xs shadow-xs shadow-[#2D5A3F]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Loader2 v-if="isSaving" :size="16" class="animate-spin" />
            <Save v-else :size="16" />
            <span>{{ isSaving ? 'Menyimpan Perubahan...' : 'Simpan Detail Profil' }}</span>
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
