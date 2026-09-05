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
} from 'lucide-vue-next'

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
  <div class="bg-white/55 backdrop-blur-2xl rounded-3xl p-7 sm:p-9 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] border border-white/70 relative transition-all duration-300" style="box-shadow: 0 8px 40px -12px rgba(0,0,0,0.08), inset 0 1px 0 0 rgba(255,255,255,0.6);">

    <!-- Card header: icon + heading group -->
    <div class="text-center mb-6">
      <!-- UPNVJ Official Emblem -->
      <div class="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
        <img
          src="/images/logo-upnvj.webp"
          alt="UPNVJ Logo"
          class="w-full h-full object-contain drop-shadow-sm"
        />
      </div>

      <h2 class="text-[22px] sm:text-[25px] font-bold text-text-primary tracking-tight leading-tight">Selamat Datang Kembali!</h2>
      <p class="text-[13px] text-text-muted mt-1.5 leading-relaxed">Masuk untuk mengelola dan melihat jadwal laboratorium.</p>
    </div>

    <!-- Demo Credential Selector — Glass segmented control -->
    <div class="mb-6">
      <p class="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2.5">Pilihan Akun Demo</p>
      <div class="grid grid-cols-3 gap-1.5 p-1 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/60 shadow-2xs">
        <button
          type="button"
          @click="selectDemoRole('ADMIN')"
          :class="[
            'px-2 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all duration-200 select-none cursor-pointer',
            activeRole === 'ADMIN'
              ? 'bg-white text-dark-green shadow-xs border border-brand-200/80 ring-1 ring-brand-300/40'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/50',
          ]"
        >
          <ShieldCheck :size="13" :class="activeRole === 'ADMIN' ? 'text-primary' : 'text-text-muted'" />
          <span>Admin</span>
        </button>

        <button
          type="button"
          @click="selectDemoRole('LABORAN')"
          :class="[
            'px-2 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all duration-200 select-none cursor-pointer',
            activeRole === 'LABORAN'
              ? 'bg-white text-dark-green shadow-xs border border-brand-200/80 ring-1 ring-brand-300/40'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/50',
          ]"
        >
          <User :size="13" :class="activeRole === 'LABORAN' ? 'text-primary' : 'text-text-muted'" />
          <span>Laboran</span>
        </button>

        <button
          type="button"
          @click="selectDemoRole('LECTURER')"
          :class="[
            'px-2 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all duration-200 select-none cursor-pointer',
            activeRole === 'LECTURER'
              ? 'bg-white text-dark-green shadow-xs border border-brand-200/80 ring-1 ring-brand-300/40'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/50',
          ]"
        >
          <GraduationCap :size="13" :class="activeRole === 'LECTURER' ? 'text-primary' : 'text-text-muted'" />
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
            class="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-white/80 rounded-xl text-xs font-medium transition-all duration-200 hover:bg-white/80 hover:border-white focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary focus:bg-white text-text-primary placeholder:text-text-muted/70 backdrop-blur-sm shadow-2xs"
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
            class="w-full pl-10 pr-10 py-2.5 bg-white/60 border border-white/80 rounded-xl text-xs font-medium transition-all duration-200 hover:bg-white/80 hover:border-white focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary focus:bg-white text-text-primary placeholder:text-text-muted/70 backdrop-blur-sm shadow-2xs"
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
          class="text-xs font-semibold text-dark-green hover:text-primary transition-colors cursor-pointer"
          @click.prevent
        >
          Lupa Kata Sandi?
        </button>
      </div>

      <!-- Sign In Button — Refined pine gradient -->
      <button
        type="submit"
        :disabled="isSubmitting"
        class="w-full h-11 mt-1.5 bg-gradient-to-r from-[#3B694A] to-[#2D5A3F] hover:from-[#31573E] hover:to-[#244430] active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md shadow-[#2D5A3F]/20 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none"
      >
        <span>{{ isSubmitting ? 'Sedang Masuk...' : 'Masuk ke Dashboard' }}</span>
        <ArrowRight :size="15" class="transition-transform duration-200 group-hover:translate-x-0.5" />
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
      class="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl border border-white/70 bg-white/40 hover:bg-white/60 active:bg-white/70 text-text-primary text-sm font-medium transition-all duration-200 hover:border-white/90 hover:shadow-sm select-none backdrop-blur-sm"
    >
      <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
      <span>Lanjutkan dengan Google</span>
    </button>

    <!-- Footer -->
    <div class="mt-5 text-center space-y-2 pt-3 border-t border-white/40 text-xs">
      <p class="text-text-muted">
        Belum memiliki akun Dosen atau Laboran?
        <router-link to="/register" class="text-dark-green font-extrabold hover:underline ml-1">
          Daftar sekarang &rarr;
        </router-link>
      </p>
      <p class="text-[11px] text-text-muted/70">
        Bantuan akun & sistem?
        <a href="mailto:admin@institution.edu" class="text-primary font-medium hover:text-primary-hover hover:underline transition-colors ml-0.5">
          Hubungi Administrator
        </a>
      </p>
    </div>

  </div>
</template>





