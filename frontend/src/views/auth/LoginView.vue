<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores'
import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  User,
  GraduationCap,
  ArrowRight,
  HelpCircle,
  X,
  CheckCircle2,
  Loader2,
  Send,
} from 'lucide-vue-next'
import { passwordResetService, type ForgotPasswordSubmissionResponse } from '@/services'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Active demo role state
const activeRole = ref<'ADMIN' | 'LABORAN' | 'LECTURER'>('ADMIN')

// Form state
const email = ref('admin@lab.com')
const password = ref('password123') // Backend test password
const remember = ref(false)
const showPassword = ref(false)

// UI state
const isSubmitting = ref(false)
const errorMessage = ref('')

// Interactive Forgot Password State (Option B)
const showForgotModal = ref(false)
const forgotEmail = ref('')
const forgotNotes = ref('')
const isSubmittingForgot = ref(false)
const forgotError = ref('')
const forgotSuccessData = ref<ForgotPasswordSubmissionResponse | null>(null)

const openForgotModal = () => {
  forgotEmail.value = email.value || ''
  forgotNotes.value = ''
  forgotError.value = ''
  forgotSuccessData.value = null
  showForgotModal.value = true
}

const handleForgotSubmit = async () => {
  forgotError.value = ''
  if (!forgotEmail.value || !forgotEmail.value.includes('@')) {
    forgotError.value = 'Silakan masukkan alamat email yang valid.'
    return
  }

  isSubmittingForgot.value = true
  try {
    const res = await passwordResetService.submitForgotPassword({
      email: forgotEmail.value.trim(),
      notes: forgotNotes.value.trim() || undefined,
    })
    forgotSuccessData.value = res
  } catch (err: any) {
    forgotError.value =
      err.response?.data?.message || err.message || 'Gagal mengajukan permohonan reset kata sandi.'
  } finally {
    isSubmittingForgot.value = false
  }
}

const closeForgotModal = () => {
  showForgotModal.value = false
  forgotSuccessData.value = null
  forgotError.value = ''
}

// Google OAuth State
const showGoogleModal = ref(false)
const isGoogleSubmitting = ref(false)
const customGoogleEmail = ref('')
const customGoogleRole = ref<'DOSEN' | 'LABORAN'>('DOSEN')

const triggerGoogleAuth = () => {
  errorMessage.value = ''
  showGoogleModal.value = true
}

const handleGoogleLogin = async (payload: { credential: string; target_role?: 'DOSEN' | 'LABORAN'; full_name?: string }) => {
  isGoogleSubmitting.value = true
  errorMessage.value = ''
  authStore.clearError()

  try {
    const user = await authStore.googleLogin(payload)

    if (user) {
      showGoogleModal.value = false
      const redirect = route.query.redirect as string
      if (redirect) {
        router.push(redirect)
      } else {
        switch (user.role.code) {
          case 'ADMIN':
            errorMessage.value = 'Akun Administrator tidak diizinkan masuk menggunakan Google. Silakan masuk menggunakan kata sandi resmi.'
            break
          case 'LABORAN':
            router.push('/laboran')
            break
          case 'DOSEN':
            router.push('/lecturer')
            break
          default:
            router.push('/')
        }
      }
    }
  } catch (err: any) {
    showGoogleModal.value = false
    errorMessage.value = err.message || 'Login Google gagal. Pastikan Anda menggunakan akun Dosen atau Laboran.'
  } finally {
    isGoogleSubmitting.value = false
  }
}

const submitCustomGoogleLogin = () => {
  if (!customGoogleEmail.value || !customGoogleEmail.value.includes('@')) {
    errorMessage.value = 'Silakan masukkan alamat email Google yang valid.'
    return
  }
  handleGoogleLogin({
    credential: customGoogleEmail.value.trim(),
    target_role: customGoogleRole.value,
  })
}

// Demo role selection helper
const selectDemoRole = (role: 'ADMIN' | 'LABORAN' | 'LECTURER') => {
  activeRole.value = role
  if (role === 'ADMIN') {
    email.value = 'admin@lab.com'
    password.value = 'password123' // Backend test password
  } else if (role === 'LABORAN') {
    email.value = 'laboran@lab.com'
    password.value = 'password123' // Backend test password
  } else if (role === 'LECTURER') {
    email.value = 'lecturer@lab.com'
    password.value = 'password123' // Backend test password
  }
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const handleSubmit = async () => {
  errorMessage.value = ''
  authStore.clearError()

  if (!email.value || !password.value) {
    errorMessage.value = 'Silakan masukkan email dan kata sandi'
    return
  }

  isSubmitting.value = true

  try {
    await authStore.login({
      email: email.value,
      password: password.value,
      remember: remember.value,
    })

    const redirect = route.query.redirect as string
    if (redirect) {
      router.push(redirect)
    } else {
      // Route based on backend role code
      switch (authStore.userRole) {
        case 'ADMIN':
          router.push('/admin')
          break
        case 'LABORAN':
          router.push('/laboran')
          break
        case 'DOSEN': // Backend role code
          router.push('/lecturer') // Frontend route path
          break
        default:
          router.push('/')
      }
    }
  } catch (error: any) {
    errorMessage.value = authStore.error || 'Email atau kata sandi tidak valid. Silakan coba lagi.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <!-- Frosted glass login surface -->
  <div class="bg-white/60 backdrop-blur-2xl rounded-3xl p-7 sm:p-9 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] border border-white/80 relative transition-all duration-300 overflow-hidden" style="box-shadow: 0 8px 40px -12px rgba(0,0,0,0.08), inset 0 1px 0 0 rgba(255,255,255,0.7);">
    <!-- Institutional Top Accent Bar (UPNVJ Green & Gold) -->
    <div class="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#0c5a30] via-amber-400 to-[#0c5a30]" />

    <!-- Card header: heading group (logo is already on hero panel) -->
    <div class="text-center mb-5 pt-1">
      <h2 class="text-[22px] sm:text-[25px] font-black text-text-primary tracking-tight leading-tight">Selamat Datang Kembali!</h2>
      <p class="text-[13px] text-text-muted mt-1 leading-relaxed">Masuk untuk mengelola dan memantau jadwal laboratorium.</p>
    </div>

    <!-- Demo Credential Selector — Glass segmented control -->
    <div class="mb-5">
      <div class="flex items-center justify-between mb-2">
        <p class="text-[10px] font-black text-text-secondary uppercase tracking-wider">Pilihan Akun Demo</p>
        <span class="text-[9.5px] font-bold text-dark-green bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">Eksplorasi Cepat</span>
      </div>
      <div class="grid grid-cols-3 gap-1.5 p-1 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/80 shadow-2xs">
        <button
          type="button"
          @click="selectDemoRole('ADMIN')"
          :class="[
            'px-2 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all duration-200 select-none cursor-pointer',
            activeRole === 'ADMIN'
              ? 'bg-white text-dark-green shadow-md shadow-black/15 font-black'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/60',
          ]"
        >
          <ShieldCheck :size="13" :class="activeRole === 'ADMIN' ? 'text-dark-green' : 'text-text-muted'" />
          <span>Admin</span>
        </button>

        <button
          type="button"
          @click="selectDemoRole('LABORAN')"
          :class="[
            'px-2 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all duration-200 select-none cursor-pointer',
            activeRole === 'LABORAN'
              ? 'bg-white text-dark-green shadow-md shadow-black/15 font-black'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/60',
          ]"
        >
          <User :size="13" :class="activeRole === 'LABORAN' ? 'text-dark-green' : 'text-text-muted'" />
          <span>Laboran</span>
        </button>

        <button
          type="button"
          @click="selectDemoRole('LECTURER')"
          :class="[
            'px-2 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all duration-200 select-none cursor-pointer',
            activeRole === 'LECTURER'
              ? 'bg-white text-dark-green shadow-md shadow-black/15 font-black'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/60',
          ]"
        >
          <GraduationCap :size="13" :class="activeRole === 'LECTURER' ? 'text-dark-green' : 'text-text-muted'" />
          <span>Dosen</span>
        </button>
      </div>
    </div>

    <!-- Error Alert with smooth animation -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div v-if="errorMessage" class="mb-4 p-3 bg-red-50/90 backdrop-blur-sm border border-red-200/80 rounded-xl flex items-start gap-2 shadow-2xs">
        <AlertCircle :size="15" class="text-danger flex-shrink-0 mt-0.5" />
        <p class="text-xs text-red-800 font-medium leading-relaxed">{{ errorMessage }}</p>
      </div>
    </Transition>

    <!-- Login Form -->
    <form @submit.prevent="handleSubmit" class="space-y-3.5">

      <!-- Email -->
      <div>
        <label class="block text-xs font-bold text-text-secondary mb-1.5">Alamat Email</label>
        <div class="relative">
          <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            <Mail :size="16" />
          </div>
          <input
            v-model="email"
            type="email"
            placeholder="Masukkan email Anda"
            required
            :disabled="isSubmitting"
            class="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-white/80 rounded-xl text-xs font-medium transition-all duration-200 hover:bg-white/80 hover:border-white focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white text-text-primary placeholder:text-text-muted/70 backdrop-blur-sm shadow-2xs"
          />
        </div>
      </div>

      <!-- Password -->
      <div>
        <label class="block text-xs font-bold text-text-secondary mb-1.5">Kata Sandi</label>
        <div class="relative flex items-center">
          <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            <Lock :size="16" />
          </div>
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Masukkan kata sandi Anda"
            required
            :disabled="isSubmitting"
            class="w-full pl-10 pr-10 py-2.5 bg-white/60 border border-white/80 rounded-xl text-xs font-medium transition-all duration-200 hover:bg-white/80 hover:border-white focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white text-text-primary placeholder:text-text-muted/70 backdrop-blur-sm shadow-2xs"
          />
          <button
            type="button"
            @click="togglePasswordVisibility"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary focus:outline-none p-1 rounded-lg transition-colors duration-150 cursor-pointer"
            title="Tampilkan kata sandi"
          >
            <EyeOff v-if="showPassword" :size="15" />
            <Eye v-else :size="15" />
          </button>
        </div>
      </div>

      <!-- Remember / Forgot -->
      <div class="flex items-center justify-between pt-0.5">
        <label class="flex items-center cursor-pointer select-none">
          <input
            v-model="remember"
            type="checkbox"
            class="w-3.5 h-3.5 text-primary border-gray-300 rounded focus:ring-primary accent-primary cursor-pointer"
            :disabled="isSubmitting"
          />
          <span class="ml-2 text-xs text-text-secondary font-medium">Ingat saya</span>
        </label>
        <button
          type="button"
          class="text-xs font-semibold text-dark-green hover:text-primary-hover hover:underline transition-colors cursor-pointer"
          @click="openForgotModal"
        >
          Lupa Kata Sandi?
        </button>
      </div>

      <!-- Sign In Button — Official UPNVJ Deep Green Gradient -->
      <button
        type="submit"
        :disabled="isSubmitting"
        class="w-full h-11 mt-1.5 bg-gradient-to-r from-[#0c5a30] via-[#094726] to-[#07371d] hover:from-[#094726] hover:to-[#052614] active:scale-[0.99] text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-950/20 hover:shadow-lg hover:shadow-emerald-950/30 border border-emerald-700/40 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none"
      >
        <span>{{ isSubmitting ? 'Sedang Masuk...' : 'Masuk ke Dashboard' }}</span>
        <ArrowRight :size="15" class="text-amber-400 transition-transform duration-200 group-hover:translate-x-1" />
      </button>
    </form>

    <!-- Divider -->
    <div class="relative my-5 text-center">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-white/50"></div>
      </div>
      <span class="relative px-3 bg-white/40 backdrop-blur-sm rounded-full text-[11px] text-text-muted font-medium uppercase tracking-wider py-0.5">Atau</span>
    </div>

    <!-- Google Button — Glass-integrated -->
    <button
      type="button"
      @click="triggerGoogleAuth"
      :disabled="isSubmitting || isGoogleSubmitting"
      class="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl border border-white/80 bg-white/50 hover:bg-white/70 active:bg-white/80 text-text-primary text-xs font-bold transition-all duration-200 hover:border-white hover:shadow-2xs select-none backdrop-blur-sm relative cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Loader2 v-if="isGoogleSubmitting" :size="16" class="animate-spin text-dark-green" />
      <svg v-else class="w-[18px] h-[18px]" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
      <span>{{ isGoogleSubmitting ? 'Menghubungkan Akun Google...' : 'Lanjutkan dengan Google' }}</span>
      <span class="text-[9.5px] font-bold text-dark-green bg-emerald-100/90 border border-emerald-300/60 px-2 py-0.5 rounded-full ml-1">
        Dosen & Laboran
      </span>
    </button>

    <!-- Footer -->
    <div class="mt-5 text-center pt-3 border-t border-white/40 text-xs">
      <p class="text-text-muted">
        Belum memiliki akun Dosen atau Laboran?
        <router-link to="/register" class="text-dark-green font-extrabold hover:underline ml-1">
          Daftar sekarang &rarr;
        </router-link>
      </p>
    </div>

    <!-- Forgot Password Modal (Option B: Internal Academic Helpdesk) -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showForgotModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          @click.self="closeForgotModal"
        >
          <div class="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <!-- Top Institutional Accent Bar -->
            <div class="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#0c5a30] via-amber-400 to-[#0c5a30]" />
            
            <!-- Close Button Header -->
            <div class="flex items-start justify-between">
              <div
                :class="[
                  'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border',
                  forgotSuccessData
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : 'bg-amber-50 text-amber-600 border-amber-200/80'
                ]"
              >
                <CheckCircle2 v-if="forgotSuccessData" :size="20" stroke-width="2.2" />
                <HelpCircle v-else :size="20" stroke-width="2.2" />
              </div>
              <button
                @click="closeForgotModal"
                class="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-gray-100 transition-colors cursor-pointer"
                title="Tutup dialog"
              >
                <X :size="18" />
              </button>
            </div>

            <!-- STEP 1: FORM PENGAJUAN TIKET -->
            <div v-if="!forgotSuccessData" class="space-y-3.5">
              <div>
                <h3 class="text-base font-extrabold text-text-primary">Lupa Kata Sandi?</h3>
                <p class="text-xs text-text-muted mt-1 leading-relaxed">
                  Ajukan permohonan reset kata sandi ke Administrator TU & Laboran FIK UPNVJ.
                </p>
              </div>

              <!-- Error Alert -->
              <div v-if="forgotError" class="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle :size="15" class="shrink-0 mt-0.5 text-red-600" />
                <span>{{ forgotError }}</span>
              </div>

              <form @submit.prevent="handleForgotSubmit" class="space-y-3">
                <div>
                  <label class="block text-[11px] font-bold text-text-secondary mb-1">Email Akun Terdaftar *</label>
                  <div class="relative">
                    <div class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                      <Mail :size="14" />
                    </div>
                    <input
                      v-model="forgotEmail"
                      type="email"
                      required
                      placeholder="nama@upnvj.ac.id"
                      class="w-full pl-9 pr-3 py-2 bg-surface/60 border border-gray-200 rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-all"
                      :disabled="isSubmittingForgot"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-[11px] font-bold text-text-secondary mb-1">Catatan / Alasan (Opsional)</label>
                  <textarea
                    v-model="forgotNotes"
                    rows="2"
                    placeholder="Contoh: Lupa kata sandi sejak pergantian semester."
                    class="w-full px-3 py-2 bg-surface/60 border border-gray-200 rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-all resize-none"
                    :disabled="isSubmittingForgot"
                  ></textarea>
                </div>

                <div class="p-2.5 rounded-xl bg-brand-50/60 border border-brand-200/60 text-[11px] text-text-secondary">
                  <p class="font-semibold text-dark-green mb-0.5">Proses Verifikasi Internal</p>
                  <p class="text-text-muted leading-tight">Admin TU Lab akan memverifikasi identitas Anda dan menyiapkan kata sandi sementara.</p>
                </div>

                <div class="flex gap-2 pt-1">
                  <button
                    type="submit"
                    :disabled="isSubmittingForgot"
                    class="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#0c5a30] to-[#094726] hover:from-[#094726] hover:to-[#07371d] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Loader2 v-if="isSubmittingForgot" :size="14" class="animate-spin" />
                    <Send v-else :size="13" />
                    <span>{{ isSubmittingForgot ? 'Mengirim...' : 'Kirim Permohonan' }}</span>
                  </button>
                  <button
                    type="button"
                    @click="closeForgotModal"
                    class="px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-text-secondary text-xs font-bold transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>

            <!-- STEP 2: KONFIRMASI TIKET TERKIRIM -->
            <div v-else class="space-y-3.5">
              <div>
                <h3 class="text-base font-extrabold text-text-primary">Tiket Berhasil Diajukan!</h3>
                <p class="text-xs text-text-muted mt-1 leading-relaxed">
                  {{ forgotSuccessData?.message || 'Permohonan reset kata sandi berhasil diajukan.' }}
                </p>
              </div>

              <div class="p-3.5 rounded-2xl bg-surface border border-gray-200/80 space-y-2 text-xs">
                <div class="flex justify-between items-center py-0.5 border-b border-gray-100">
                  <span class="text-text-muted text-[11px]">ID Tiket</span>
                  <span class="font-mono font-black text-dark-green tracking-wide">#{{ (forgotSuccessData?.requestId || '').slice(0, 8).toUpperCase() }}</span>
                </div>
                <div class="flex justify-between items-center py-0.5 border-b border-gray-100">
                  <span class="text-text-muted text-[11px]">Email Pemohon</span>
                  <span class="font-semibold text-text-primary truncate max-w-[170px]">{{ forgotEmail }}</span>
                </div>
                <div class="flex justify-between items-center py-0.5">
                  <span class="text-text-muted text-[11px]">Status</span>
                  <span class="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200/70 text-amber-700 font-bold text-[10px]">
                    Menunggu Verifikasi Admin
                  </span>
                </div>
              </div>

              <div class="p-3 rounded-xl bg-brand-50/70 border border-brand-200/70 text-xs space-y-1">
                <p class="font-bold text-dark-green text-[11.5px]">Langkah Selanjutnya:</p>
                <p class="text-text-secondary text-[11px] leading-relaxed">
                  Silakan temui petugas di <strong>Ruang Tata Usaha & Lab FIK UPNVJ</strong> atau hubungi <strong>admin@upnvj.ac.id</strong> untuk verifikasi kilat dan pengambilan kata sandi sementara.
                </p>
              </div>

              <button
                type="button"
                @click="closeForgotModal"
                class="w-full py-2.5 rounded-xl bg-dark-green hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Kembali ke Halaman Masuk
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Google Account Selector Modal (Dosen & Laboran SSO) -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showGoogleModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          @click.self="showGoogleModal = false"
        >
          <div class="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-4 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <!-- Institutional Top Accent Bar -->
            <div class="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#0c5a30] via-amber-400 to-[#0c5a30]" />

            <!-- Modal Header -->
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-sm font-extrabold text-text-primary">Masuk dengan Google</h3>
                  <p class="text-[11px] text-text-muted">Khusus Akun Dosen & Staf Laboran UPNVJ</p>
                </div>
              </div>
              <button
                type="button"
                @click="showGoogleModal = false"
                class="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X :size="16" />
              </button>
            </div>

            <!-- Role Policy Notice -->
            <div class="p-3 rounded-2xl bg-brand-50/70 border border-brand-200/70 flex items-start gap-2.5 text-xs text-text-secondary">
              <ShieldCheck :size="16" class="text-dark-green shrink-0 mt-0.5" />
              <p class="text-[11.5px] leading-relaxed">
                Login pihak ketiga ini <strong>dikhususkan untuk Dosen dan Laboran</strong>. Akun Administrator demi keamanan sistem wajib menggunakan formulir login resmi.
              </p>
            </div>

            <!-- Quick Profile Selection -->
            <div class="space-y-2">
              <p class="text-[10px] font-black text-text-muted uppercase tracking-wider">Pilih Akun Kampus Tersedia</p>
              
              <!-- Dosen Quick Option -->
              <button
                type="button"
                @click="handleGoogleLogin({ credential: 'lecturer@lab.com', target_role: 'DOSEN', full_name: 'Dr. Budi Santoso, M.Kom' })"
                :disabled="isGoogleSubmitting"
                class="w-full p-3 rounded-2xl border border-gray-200 hover:border-dark-green hover:bg-brand-50/40 flex items-center justify-between transition-all group text-left cursor-pointer"
              >
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <GraduationCap :size="18" />
                  </div>
                  <div>
                    <p class="text-xs font-bold text-text-primary group-hover:text-dark-green transition-colors">Dr. Budi Santoso (lecturer@lab.com)</p>
                    <p class="text-[10.5px] text-text-muted">Portal Dosen • Pinjam Ruang & Jadwal</p>
                  </div>
                </div>
                <span class="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 shrink-0">DOSEN</span>
              </button>

              <!-- Laboran Quick Option -->
              <button
                type="button"
                @click="handleGoogleLogin({ credential: 'laboran@lab.com', target_role: 'LABORAN', full_name: 'Ahmad Fauzi, S.Kom' })"
                :disabled="isGoogleSubmitting"
                class="w-full p-3 rounded-2xl border border-gray-200 hover:border-dark-green hover:bg-brand-50/40 flex items-center justify-between transition-all group text-left cursor-pointer"
              >
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-emerald-50 text-dark-green flex items-center justify-center font-bold text-xs shrink-0">
                    <User :size="18" />
                  </div>
                  <div>
                    <p class="text-xs font-bold text-text-primary group-hover:text-dark-green transition-colors">Ahmad Fauzi (laboran@lab.com)</p>
                    <p class="text-[10.5px] text-text-muted">Portal Laboran • Manajemen Aset & Jadwal</p>
                  </div>
                </div>
                <span class="text-[10px] font-extrabold text-dark-green bg-brand-100 px-2.5 py-0.5 rounded-full border border-brand-200 shrink-0">LABORAN</span>
              </button>

              <!-- Admin Guard Test Option -->
              <button
                type="button"
                @click="handleGoogleLogin({ credential: 'admin@lab.com', full_name: 'Administrator Lab' })"
                :disabled="isGoogleSubmitting"
                class="w-full p-2.5 rounded-2xl border border-rose-200/80 bg-rose-50/40 hover:bg-rose-50 flex items-center justify-between transition-all text-left cursor-pointer"
              >
                <div class="flex items-center gap-2.5">
                  <div class="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <Lock :size="14" />
                  </div>
                  <div>
                    <p class="text-[11px] font-bold text-rose-900">Uji Akun Admin (admin@lab.com)</p>
                    <p class="text-[9.5px] text-rose-600">Akan ditolak otomatis oleh sistem proteksi peran</p>
                  </div>
                </div>
                <span class="text-[9.5px] font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full shrink-0">BLOCKED</span>
              </button>
            </div>

            <!-- Custom Account Entry -->
            <div class="pt-3 border-t border-gray-100 space-y-2.5">
              <p class="text-[10px] font-black text-text-muted uppercase tracking-wider">Atau Masuk dengan Email Google Lainnya</p>
              <div class="flex flex-col sm:flex-row gap-2">
                <input
                  v-model="customGoogleEmail"
                  type="email"
                  placeholder="nama@upnvj.ac.id atau @gmail.com"
                  class="flex-1 px-3 py-2 bg-surface border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-400"
                />
                <select
                  v-model="customGoogleRole"
                  class="px-3 py-2 bg-surface border border-gray-200 rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-brand-400"
                >
                  <option value="DOSEN">Dosen</option>
                  <option value="LABORAN">Laboran</option>
                </select>
              </div>
              <button
                type="button"
                @click="submitCustomGoogleLogin"
                :disabled="!customGoogleEmail || isGoogleSubmitting"
                class="w-full py-2.5 bg-dark-green hover:bg-[#547a5c] text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
              >
                <Loader2 v-if="isGoogleSubmitting" :size="14" class="animate-spin" />
                <span>{{ isGoogleSubmitting ? 'Memproses Otentikasi...' : 'Masuk dengan Email Google Tersebut' }}</span>
              </button>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>





