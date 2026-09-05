<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  CalendarDays,
  ShieldCheck,
  Building2,
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

// Form state
const selectedRole = ref<'DOSEN' | 'LABORAN'>('DOSEN')
const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const phone = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// UI state
const isSubmitting = ref(false)
const errorMessage = ref('')

const roleFeatures = computed(() => {
  if (selectedRole.value === 'DOSEN') {
    return [
      { icon: CalendarDays, text: 'Pengajuan pinjam lab untuk perkuliahan & riset' },
      { icon: CheckCircle2, text: 'Pelacakan status persetujuan peminjaman secara real-time' },
      { icon: Building2, text: 'Eksplorasi kapasitas ruangan, fasilitas, & perangkat lab' },
    ]
  }
  return [
    { icon: ShieldCheck, text: 'Tinjau & validasi permohonan peminjaman laboratorium' },
    { icon: CalendarDays, text: 'Kelola jadwal operasional master & slot penggunaan lab' },
    { icon: Building2, text: 'Pantau pemakaian langsung (check-in/check-out) & fasilitas' },
  ]
})

const handleRegister = async () => {
  errorMessage.value = ''
  authStore.clearError()

  if (!fullName.value.trim() || !email.value.trim() || !password.value) {
    errorMessage.value = 'Silakan lengkapi semua kolom yang wajib diisi.'
    return
  }

  if (password.value.length < 8) {
    errorMessage.value = 'Kata sandi harus terdiri dari minimal 8 karakter.'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Konfirmasi kata sandi tidak cocok.'
    return
  }

  isSubmitting.value = true

  try {
    await authStore.register({
      full_name: fullName.value.trim(),
      email: email.value.trim().toLowerCase(),
      password: password.value,
      phone: phone.value.trim() || undefined,
      role_code: selectedRole.value,
    })

    // Automatic role-based routing
    if (selectedRole.value === 'DOSEN') {
      router.push('/lecturer')
    } else {
      router.push('/laboran')
    }
  } catch (err: any) {
    errorMessage.value = authStore.error || 'Gagal membuat akun. Silakan coba lagi.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen w-full bg-[#F4F7F5] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans select-none">
    <div class="w-full max-w-xl bg-white rounded-3xl border border-gray-200/80 shadow-xl shadow-dark-green/5 p-6 sm:p-9 space-y-6">
      
      <!-- Header -->
      <div class="text-center space-y-2">
        <div class="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
          <img
            src="/images/logo-upnvj.webp"
            alt="UPNVJ Logo"
            class="w-full h-full object-contain drop-shadow-sm"
          />
        </div>
        <h1 class="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">Pendaftaran Akun Baru</h1>
        <p class="text-xs sm:text-sm text-text-muted max-w-md mx-auto">
          Daftar sebagai Dosen Pengajar atau Staf Laboran untuk mengakses Sistem Manajemen Laboratorium.
        </p>
      </div>

      <!-- Role Selection Tab -->
      <div class="space-y-2.5">
        <label class="font-bold text-text-secondary text-xs block uppercase tracking-wider">Pilih Peran Anda *</label>
        <div class="grid grid-cols-2 gap-2.5 p-1.5 bg-[#F0F4F1] border border-gray-200/80 rounded-2xl">
          <button
            type="button"
            @click="selectedRole = 'DOSEN'"
            :class="[
              'flex items-center justify-center gap-2.5 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer',
              selectedRole === 'DOSEN'
                ? 'bg-white text-dark-green shadow-xs border border-gray-200/80 ring-1 ring-dark-green/15'
                : 'text-text-muted hover:text-text-primary hover:bg-white/50'
            ]"
          >
            <GraduationCap :size="18" :class="selectedRole === 'DOSEN' ? 'text-dark-green' : 'text-text-muted'" />
            <span>Dosen Pengajar</span>
          </button>
          <button
            type="button"
            @click="selectedRole = 'LABORAN'"
            :class="[
              'flex items-center justify-center gap-2.5 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer',
              selectedRole === 'LABORAN'
                ? 'bg-white text-dark-green shadow-xs border border-gray-200/80 ring-1 ring-dark-green/15'
                : 'text-text-muted hover:text-text-primary hover:bg-white/50'
            ]"
          >
            <FlaskConical :size="18" :class="selectedRole === 'LABORAN' ? 'text-dark-green' : 'text-text-muted'" />
            <span>Staf Laboran</span>
          </button>
        </div>

        <!-- Role Capability Highlights Card -->
        <div class="p-3.5 bg-brand-50/50 rounded-xl border border-brand-200/50 text-[11.5px] text-text-secondary space-y-1.5">
          <div v-for="(feat, idx) in roleFeatures" :key="idx" class="flex items-center gap-2">
            <component :is="feat.icon" :size="14" class="text-dark-green shrink-0" />
            <span>{{ feat.text }}</span>
          </div>
        </div>
      </div>

      <!-- Error Alert -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div v-if="errorMessage" class="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-danger text-xs font-semibold flex items-center gap-2 shadow-2xs">
          <AlertCircle :size="16" class="shrink-0 text-danger" />
          <span>{{ errorMessage }}</span>
        </div>
      </Transition>

      <!-- Registration Form -->
      <form @submit.prevent="handleRegister" class="space-y-4 text-xs">
        <!-- Full Name -->
        <div class="space-y-1.5">
          <label class="font-bold text-text-primary block">Nama Lengkap beserta Gelar *</label>
          <div class="relative">
            <User :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              v-model="fullName"
              type="text"
              placeholder="Contoh: Dr. Budi Santoso, M.Kom."
              required
              :disabled="isSubmitting"
              class="w-full pl-10 pr-3.5 py-2.5 bg-[#F9FAF9] border border-gray-200/90 rounded-xl text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green focus:bg-white transition-colors"
            />
          </div>
        </div>

        <!-- Email Address -->
        <div class="space-y-1.5">
          <label class="font-bold text-text-primary block">Alamat Email Institusi *</label>
          <div class="relative">
            <Mail :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              v-model="email"
              type="email"
              placeholder="Contoh: budi.santoso@upnvj.ac.id"
              required
              :disabled="isSubmitting"
              class="w-full pl-10 pr-3.5 py-2.5 bg-[#F9FAF9] border border-gray-200/90 rounded-xl text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green focus:bg-white transition-colors"
            />
          </div>
        </div>

        <!-- Phone / WhatsApp -->
        <div class="space-y-1.5">
          <label class="font-bold text-text-primary block">Nomor WhatsApp / Telepon (Opsional)</label>
          <div class="relative">
            <Phone :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              v-model="phone"
              type="tel"
              placeholder="Contoh: +62 812-3456-7890"
              :disabled="isSubmitting"
              class="w-full pl-10 pr-3.5 py-2.5 bg-[#F9FAF9] border border-gray-200/90 rounded-xl text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green focus:bg-white transition-colors"
            />
          </div>
        </div>

        <!-- Password & Confirm Password -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div class="space-y-1.5">
            <label class="font-bold text-text-primary block">Kata Sandi *</label>
            <div class="relative flex items-center">
              <Lock :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Minimal 8 karakter"
                required
                :disabled="isSubmitting"
                class="w-full pl-10 pr-9 py-2.5 bg-[#F9FAF9] border border-gray-200/90 rounded-xl text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green focus:bg-white transition-colors"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 rounded-lg transition-colors cursor-pointer"
                title="Tampilkan kata sandi"
              >
                <EyeOff v-if="showPassword" :size="15" />
                <Eye v-else :size="15" />
              </button>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="font-bold text-text-primary block">Konfirmasi Kata Sandi *</label>
            <div class="relative flex items-center">
              <Lock :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Ulangi kata sandi"
                required
                :disabled="isSubmitting"
                class="w-full pl-10 pr-9 py-2.5 bg-[#F9FAF9] border border-gray-200/90 rounded-xl text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-dark-green/25 focus:border-dark-green focus:bg-white transition-colors"
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 rounded-lg transition-colors cursor-pointer"
                title="Tampilkan konfirmasi kata sandi"
              >
                <EyeOff v-if="showConfirmPassword" :size="15" />
                <Eye v-else :size="15" />
              </button>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#3B694A] to-[#2D5A3F] hover:from-[#31573E] hover:to-[#244430] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-[#2D5A3F]/20 hover:shadow-lg transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          <Loader2 v-if="isSubmitting" :size="18" class="animate-spin" />
          <span v-else>Daftar sebagai {{ selectedRole === 'DOSEN' ? 'Dosen Pengajar' : 'Staf Laboran' }}</span>
          <ArrowRight v-if="!isSubmitting" :size="16" />
        </button>
      </form>

      <!-- Footer Link to Login -->
      <div class="text-center pt-3 border-t border-gray-100 text-xs">
        <p class="text-text-muted">
          Sudah memiliki akun?
          <router-link to="/login" class="text-dark-green font-extrabold hover:underline ml-1">
            Masuk di sini →
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
