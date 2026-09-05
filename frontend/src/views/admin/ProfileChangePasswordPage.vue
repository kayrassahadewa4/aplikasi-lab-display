<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import { useAuthStore } from '@/stores/auth.store'
import { userService } from '@/services/user.service'
import {
  ArrowLeft,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  ShieldCheck,
  Check,
  Loader2,
  Sparkles
} from 'lucide-vue-next'

const router = useRouter()
const navStore = useAdminNavStore()
const authStore = useAuthStore()

const isSaving = ref(false)

onMounted(() => {
  navStore.setBreadcrumbs([
    { label: 'Dashboard', path: '/admin' },
    { label: 'Profil', path: '/admin/profile' },
    { label: 'Ubah Kata Sandi' },
  ])
})

// Form State
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

// Password Visibility State
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Toast & Error Banners
const showToast = ref(false)
const toastMessage = ref('')
const errorMessage = ref('')

// Requirements validation logic
const reqLength = computed(() => newPassword.value.length >= 8)
const reqUppercase = computed(() => /[A-Z]/.test(newPassword.value))
const reqLowercase = computed(() => /[a-z]/.test(newPassword.value))
const reqNumber = computed(() => /[0-9]/.test(newPassword.value))

const isRequirementsMet = computed(() => {
  return reqLength.value && reqUppercase.value && reqLowercase.value && reqNumber.value
})

const isConfirmMatching = computed(() => {
  return confirmPassword.value.length > 0 && confirmPassword.value === newPassword.value
})

const isDifferentFromCurrent = computed(() => {
  return newPassword.value.length > 0 && newPassword.value !== currentPassword.value
})

const handleSubmit = async () => {
  errorMessage.value = ''

  if (!currentPassword.value) {
    errorMessage.value = 'Silakan masukkan kata sandi saat ini.'
    return
  }

  if (!isRequirementsMet.value) {
    errorMessage.value = 'Silakan penuhi semua kriteria kompleksitas kata sandi.'
    return
  }

  if (!isDifferentFromCurrent.value) {
    errorMessage.value = 'Kata sandi baru harus berbeda dari kata sandi saat ini.'
    return
  }

  if (!isConfirmMatching.value) {
    errorMessage.value = 'Konfirmasi kata sandi tidak cocok dengan kata sandi baru.'
    return
  }

  isSaving.value = true

  try {
    const currentUserId = authStore.user?.id
    if (!currentUserId) {
      errorMessage.value = 'Pengguna tidak terotentikasi'
      return
    }

    await userService.updateUser(currentUserId, {
      password: newPassword.value,
    })

    toastMessage.value = 'Kata sandi berhasil diubah.'
    showToast.value = true

    setTimeout(() => {
      showToast.value = false
      router.push('/admin/profile')
    }, 1200)
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || error.message || 'Gagal memperbarui kata sandi'
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
              Ubah Kata Sandi Akun
            </h1>
            <span class="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-brand-100 text-dark-green text-xs font-extrabold border border-brand-200">
              <Sparkles :size="13" />
              <span>Keamanan Kredensial</span>
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted font-medium">
            Perbarui kata sandi login akun Anda dengan persyaratan kompleksitas kriptografis yang kuat.
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
        <AlertCircle :size="16" class="text-rose-600 shrink-0" />
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

    <!-- 2. MAIN 2-COLUMN GRID (8 COLS FORM + 4 COLS SIDEBAR) -->
    <form @submit.prevent="handleSubmit" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- ======================================================== -->
      <!-- LEFT COLUMN: MAIN FORM SECTIONS (8 COLS)                 -->
      <!-- ======================================================== -->
      <div class="lg:col-span-8 space-y-5">
        <!-- Section 1: Password Fields -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 sm:p-7 space-y-5">
          <div class="flex items-center gap-3 border-b border-gray-100 pb-3.5">
            <div class="w-10 h-10 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <Key :size="20" stroke-width="2.2" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-text-primary tracking-tight">Kredensial Keamanan</h3>
              <p class="text-xs text-text-muted">Masukkan kata sandi saat ini dan kata sandi baru pengganti.</p>
            </div>
          </div>

          <div class="space-y-4 text-xs">
            <!-- Current Password -->
            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">Kata Sandi Saat Ini <span class="text-red-500">*</span></label>
              <div class="relative">
                <input
                  v-model="currentPassword"
                  :type="showCurrentPassword ? 'text' : 'password'"
                  required
                  placeholder="Masukkan kata sandi saat ini"
                  class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white pr-10 transition-colors"
                />
                <button
                  type="button"
                  @click="showCurrentPassword = !showCurrentPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer p-1"
                >
                  <EyeOff v-if="showCurrentPassword" :size="15" />
                  <Eye v-else :size="15" />
                </button>
              </div>
            </div>

            <!-- New Password -->
            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">Kata Sandi Baru <span class="text-red-500">*</span></label>
              <div class="relative">
                <input
                  v-model="newPassword"
                  :type="showNewPassword ? 'text' : 'password'"
                  required
                  placeholder="Masukkan kata sandi baru"
                  class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white pr-10 transition-colors"
                />
                <button
                  type="button"
                  @click="showNewPassword = !showNewPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer p-1"
                >
                  <EyeOff v-if="showNewPassword" :size="15" />
                  <Eye v-else :size="15" />
                </button>
              </div>
            </div>

            <!-- Confirm New Password -->
            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">Konfirmasi Kata Sandi Baru <span class="text-red-500">*</span></label>
              <div class="relative">
                <input
                  v-model="confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  required
                  placeholder="Masukkan ulang kata sandi baru"
                  class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white pr-10 transition-colors"
                />
                <button
                  type="button"
                  @click="showConfirmPassword = !showConfirmPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer p-1"
                >
                  <EyeOff v-if="showConfirmPassword" :size="15" />
                  <Eye v-else :size="15" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- RIGHT COLUMN: LIVE PREVIEW & ACTION SIDEBAR (4 COLS)     -->
      <!-- ======================================================== -->
      <div class="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
        <!-- Password Requirements Live Checklist Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 sm:p-6 space-y-4">
          <div class="flex items-center justify-between border-b border-gray-100 pb-3">
            <h4 class="text-xs font-black uppercase tracking-wider text-text-primary flex items-center gap-2">
              <ShieldCheck :size="15" class="text-dark-green" />
              <span>Pemeriksaan Kompleksitas</span>
            </h4>
            <span
              :class="[
                'px-2 py-0.5 rounded-full text-[10px] font-extrabold border',
                isRequirementsMet
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              ]"
            >
              {{ isRequirementsMet ? 'VALID' : 'MENUNGGU' }}
            </span>
          </div>

          <div class="space-y-2 text-xs">
            <div
              :class="[
                'flex items-center gap-2 py-1 transition-colors',
                reqLength ? 'text-dark-green font-bold' : 'text-text-muted'
              ]"
            >
              <div
                :class="[
                  'w-4 h-4 rounded-full flex items-center justify-center text-[10px]',
                  reqLength ? 'bg-emerald-100 text-dark-green' : 'bg-gray-100 text-text-muted'
                ]"
              >
                <Check v-if="reqLength" :size="10" stroke-width="3" />
                <span v-else>•</span>
              </div>
              <span>Minimal 8 karakter</span>
            </div>

            <div
              :class="[
                'flex items-center gap-2 py-1 transition-colors',
                reqUppercase ? 'text-dark-green font-bold' : 'text-text-muted'
              ]"
            >
              <div
                :class="[
                  'w-4 h-4 rounded-full flex items-center justify-center text-[10px]',
                  reqUppercase ? 'bg-emerald-100 text-dark-green' : 'bg-gray-100 text-text-muted'
                ]"
              >
                <Check v-if="reqUppercase" :size="10" stroke-width="3" />
                <span v-else>•</span>
              </div>
              <span>Satu huruf kapital (A-Z)</span>
            </div>

            <div
              :class="[
                'flex items-center gap-2 py-1 transition-colors',
                reqLowercase ? 'text-dark-green font-bold' : 'text-text-muted'
              ]"
            >
              <div
                :class="[
                  'w-4 h-4 rounded-full flex items-center justify-center text-[10px]',
                  reqLowercase ? 'bg-emerald-100 text-dark-green' : 'bg-gray-100 text-text-muted'
                ]"
              >
                <Check v-if="reqLowercase" :size="10" stroke-width="3" />
                <span v-else>•</span>
              </div>
              <span>Satu huruf kecil (a-z)</span>
            </div>

            <div
              :class="[
                'flex items-center gap-2 py-1 transition-colors',
                reqNumber ? 'text-dark-green font-bold' : 'text-text-muted'
              ]"
            >
              <div
                :class="[
                  'w-4 h-4 rounded-full flex items-center justify-center text-[10px]',
                  reqNumber ? 'bg-emerald-100 text-dark-green' : 'bg-gray-100 text-text-muted'
                ]"
              >
                <Check v-if="reqNumber" :size="10" stroke-width="3" />
                <span v-else>•</span>
              </div>
              <span>Satu digit angka (0-9)</span>
            </div>

            <div
              :class="[
                'flex items-center gap-2 py-1 border-t border-gray-100 pt-2 transition-colors',
                isConfirmMatching ? 'text-dark-green font-bold' : 'text-text-muted'
              ]"
            >
              <div
                :class="[
                  'w-4 h-4 rounded-full flex items-center justify-center text-[10px]',
                  isConfirmMatching ? 'bg-emerald-100 text-dark-green' : 'bg-gray-100 text-text-muted'
                ]"
              >
                <Check v-if="isConfirmMatching" :size="10" stroke-width="3" />
                <span v-else>•</span>
              </div>
              <span>Kata sandi cocok</span>
            </div>
          </div>
        </div>

        <!-- Sticky Primary Action Buttons Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-3">
          <button
            type="submit"
            :disabled="isSaving || !currentPassword || !isRequirementsMet || !isConfirmMatching"
            class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#3B694A] to-[#2D5A3F] hover:from-[#31573E] hover:to-[#244430] text-white font-extrabold text-xs shadow-xs shadow-[#2D5A3F]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="isSaving" :size="16" class="animate-spin" />
            <Key v-else :size="16" />
            <span>{{ isSaving ? 'Memperbarui Kata Sandi...' : 'Perbarui Kata Sandi' }}</span>
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
