<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import {
  GraduationCap,
  FlaskConical,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Check,
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

// Password strength computation
const passwordCriteria = computed(() => {
  const p = password.value
  return {
    length: p.length >= 8,
    hasNumber: /\d/.test(p),
    hasLetter: /[a-zA-Z]/.test(p),
    hasUpperLower: /[a-z]/.test(p) && /[A-Z]/.test(p),
  }
})

const passwordScore = computed(() => {
  if (!password.value) return 0
  let score = 0
  if (passwordCriteria.value.length) score++
  if (passwordCriteria.value.hasNumber) score++
  if (passwordCriteria.value.hasLetter) score++
  if (passwordCriteria.value.hasUpperLower || password.value.length >= 10) score++
  return score // 0 to 4
})

const passwordStrengthLabel = computed(() => {
  switch (passwordScore.value) {
    case 1:
      return { text: 'Sangat Lemah', color: 'text-rose-600', bg: 'bg-rose-500' }
    case 2:
      return { text: 'Cukup', color: 'text-amber-600', bg: 'bg-amber-500' }
    case 3:
      return { text: 'Kuat', color: 'text-emerald-600', bg: 'bg-emerald-500' }
    case 4:
      return { text: 'Sangat Kuat', color: 'text-dark-green', bg: 'bg-[#0c5a30]' }
    default:
      return { text: '', color: 'text-text-muted', bg: 'bg-gray-200' }
  }
})

const passwordsMatch = computed(() => {
  if (!confirmPassword.value) return null
  return password.value === confirmPassword.value
})

const roleFeatures = computed(() => {
  if (selectedRole.value === 'DOSEN') {
    return [
      { icon: CalendarDays, text: 'Pengajuan pinjam lab perkuliahan & riset' },
      { icon: CheckCircle2, text: 'Pelacakan status persetujuan peminjaman' },
      { icon: Building2, text: 'Eksplorasi kapasitas ruangan & fasilitas lab' },
    ]
  }
  return [
    { icon: ShieldCheck, text: 'Tinjau & validasi permohonan peminjaman lab' },
    { icon: CalendarDays, text: 'Kelola jadwal operasional & slot jadwal' },
    { icon: Building2, text: 'Pantau penggunaan langsung (check-in/out)' },
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
  <!-- Frosted glass registration surface matching LoginView -->
  <div
    class="bg-white/60 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] border border-white/80 relative transition-all duration-300 overflow-hidden"
    style="box-shadow: 0 8px 40px -12px rgba(0,0,0,0.08), inset 0 1px 0 0 rgba(255,255,255,0.7);"
  >
    <!-- Institutional Top Accent Bar (UPNVJ Green & Gold) -->
    <div class="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#0c5a30] via-amber-400 to-[#0c5a30]" />

    <!-- Card header: heading group (logo is already on hero panel) -->
    <div class="text-center mb-4 pt-1">
      <h2 class="text-[21px] sm:text-[23px] font-black text-text-primary tracking-tight leading-tight">Pendaftaran Akun Baru</h2>
      <p class="text-[12.5px] text-text-muted mt-1 leading-relaxed">
        Daftar sebagai Dosen atau Staf Laboran untuk sistem manajemen lab.
      </p>
    </div>

    <!-- Role Selection Tabs — Segmented Control -->
    <div class="mb-4">
      <div class="flex items-center justify-between mb-1.5">
        <p class="text-[10px] font-black text-text-secondary uppercase tracking-wider">Pilih Peran Akun</p>
        <span class="text-[9.5px] font-bold text-dark-green bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">Akses Terverifikasi</span>
      </div>
      <div class="grid grid-cols-2 gap-1.5 p-1 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/80 shadow-2xs">
        <button
          type="button"
          @click="selectedRole = 'DOSEN'"
          :class="[
            'px-2.5 py-2 rounded-xl text-xs sm:text-[12.5px] font-bold flex items-center justify-center gap-1.5 transition-all duration-200 select-none cursor-pointer',
            selectedRole === 'DOSEN'
              ? 'bg-white text-dark-green shadow-md shadow-black/15 font-black'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/60'
          ]"
        >
          <GraduationCap :size="15" :class="selectedRole === 'DOSEN' ? 'text-dark-green' : 'text-text-muted'" />
          <span>Dosen Pengajar</span>
        </button>

        <button
          type="button"
          @click="selectedRole = 'LABORAN'"
          :class="[
            'px-2.5 py-2 rounded-xl text-xs sm:text-[12.5px] font-bold flex items-center justify-center gap-1.5 transition-all duration-200 select-none cursor-pointer',
            selectedRole === 'LABORAN'
              ? 'bg-white text-dark-green shadow-md shadow-black/15 font-black'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/60'
          ]"
        >
          <FlaskConical :size="15" :class="selectedRole === 'LABORAN' ? 'text-dark-green' : 'text-text-muted'" />
          <span>Staf Laboran</span>
        </button>
      </div>

      <!-- Role Capabilities Mini Card -->
      <div class="mt-2.5 p-3 bg-gradient-to-br from-emerald-50/80 to-emerald-50/40 rounded-2xl border border-emerald-200/60 text-xs space-y-1.5">
        <div v-for="(feat, idx) in roleFeatures" :key="idx" class="flex items-center gap-2">
          <div class="w-4.5 h-4.5 rounded-md bg-white text-dark-green border border-emerald-200/70 shadow-2xs flex items-center justify-center shrink-0">
            <component :is="feat.icon" :size="11" class="stroke-[2.5]" />
          </div>
          <span class="font-medium text-[11px] leading-tight text-text-secondary">{{ feat.text }}</span>
        </div>
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

    <!-- Registration Form -->
    <form @submit.prevent="handleRegister" class="space-y-3">
      <!-- Full Name -->
      <div>
        <label class="block text-xs font-bold text-text-secondary mb-1">Nama Lengkap & Gelar *</label>
        <div class="relative">
          <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            <User :size="15" />
          </div>
          <input
            v-model="fullName"
            type="text"
            placeholder="Contoh: Dr. Budi Santoso, M.Kom."
            required
            :disabled="isSubmitting"
            class="w-full pl-10 pr-3.5 py-2.5 bg-white/70 hover:bg-white/90 focus:bg-white border border-gray-200/90 focus:border-dark-green focus:ring-2 focus:ring-dark-green/20 rounded-xl text-text-primary text-xs sm:text-[13px] font-medium transition-all placeholder:text-text-muted/60"
          />
        </div>
      </div>

      <!-- Email Address -->
      <div>
        <label class="block text-xs font-bold text-text-secondary mb-1">Alamat Email *</label>
        <div class="relative">
          <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            <Mail :size="15" />
          </div>
          <input
            v-model="email"
            type="email"
            placeholder="Contoh: budi.santoso@upnvj.ac.id"
            required
            :disabled="isSubmitting"
            class="w-full pl-10 pr-3.5 py-2.5 bg-white/70 hover:bg-white/90 focus:bg-white border border-gray-200/90 focus:border-dark-green focus:ring-2 focus:ring-dark-green/20 rounded-xl text-text-primary text-xs sm:text-[13px] font-medium transition-all placeholder:text-text-muted/60"
          />
        </div>
      </div>

      <!-- WhatsApp / Phone -->
      <div>
        <label class="block text-xs font-bold text-text-secondary mb-1">Nomor WhatsApp / HP (Opsional)</label>
        <div class="relative">
          <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            <Phone :size="15" />
          </div>
          <input
            v-model="phone"
            type="tel"
            placeholder="Contoh: +62 812-3456-7890"
            :disabled="isSubmitting"
            class="w-full pl-10 pr-3.5 py-2.5 bg-white/70 hover:bg-white/90 focus:bg-white border border-gray-200/90 focus:border-dark-green focus:ring-2 focus:ring-dark-green/20 rounded-xl text-text-primary text-xs sm:text-[13px] font-medium transition-all placeholder:text-text-muted/60"
          />
        </div>
      </div>

      <!-- Password & Confirm Password in 2 columns -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label class="block text-xs font-bold text-text-secondary mb-1">Kata Sandi *</label>
          <div class="relative">
            <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
              <Lock :size="15" />
            </div>
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Min. 8 karakter"
              required
              :disabled="isSubmitting"
              class="w-full pl-10 pr-9 py-2.5 bg-white/70 hover:bg-white/90 focus:bg-white border border-gray-200/90 focus:border-dark-green focus:ring-2 focus:ring-dark-green/20 rounded-xl text-text-primary text-xs sm:text-[13px] font-medium transition-all placeholder:text-text-muted/60"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 rounded-lg transition-colors cursor-pointer"
              tabindex="-1"
              title="Tampilkan kata sandi"
            >
              <EyeOff v-if="showPassword" :size="14" />
              <Eye v-else :size="14" />
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-text-secondary mb-1">Konfirmasi Sandi *</label>
          <div class="relative">
            <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
              <Lock :size="15" />
            </div>
            <input
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Ulangi sandi"
              required
              :disabled="isSubmitting"
              class="w-full pl-10 pr-9 py-2.5 bg-white/70 hover:bg-white/90 focus:bg-white border border-gray-200/90 focus:border-dark-green focus:ring-2 focus:ring-dark-green/20 rounded-xl text-text-primary text-xs sm:text-[13px] font-medium transition-all placeholder:text-text-muted/60"
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 rounded-lg transition-colors cursor-pointer"
              tabindex="-1"
              title="Tampilkan konfirmasi kata sandi"
            >
              <EyeOff v-if="showConfirmPassword" :size="14" />
              <Eye v-else :size="14" />
            </button>
          </div>
        </div>
      </div>

      <!-- Real-time Password Strength Meter & Match Indicator -->
      <div v-if="password" class="space-y-1.5 pt-0.5">
        <div class="flex items-center justify-between text-[11px]">
          <span class="text-text-muted">Kekuatan Kata Sandi:</span>
          <span class="font-bold" :class="passwordStrengthLabel.color">{{ passwordStrengthLabel.text }}</span>
        </div>
        <div class="grid grid-cols-4 gap-1.5 h-1.5">
          <div
            v-for="i in 4"
            :key="i"
            class="h-full rounded-full transition-all duration-300"
            :class="i <= passwordScore ? passwordStrengthLabel.bg : 'bg-gray-200/80'"
          ></div>
        </div>

        <!-- Real-time Match Feedback -->
        <div v-if="confirmPassword" class="flex items-center justify-end text-[10.5px] pt-0.5 font-bold">
          <span v-if="passwordsMatch" class="text-emerald-700 flex items-center gap-1">
            <Check :size="12" class="stroke-[3]" /> Kata sandi cocok
          </span>
          <span v-else class="text-rose-600 flex items-center gap-1">
            <AlertCircle :size="12" /> Konfirmasi belum cocok
          </span>
        </div>
      </div>

      <!-- Submit Button — Official UPNVJ Deep Green Gradient -->
      <button
        type="submit"
        :disabled="isSubmitting"
        class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0c5a30] via-[#094726] to-[#07371d] hover:from-[#094726] hover:to-[#052614] text-white font-extrabold text-xs sm:text-[13px] shadow-md shadow-emerald-950/20 hover:shadow-lg hover:shadow-emerald-950/30 transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2.5 border border-emerald-700/40 group select-none"
      >
        <Loader2 v-if="isSubmitting" :size="16" class="animate-spin" />
        <span v-else>Daftar sebagai {{ selectedRole === 'DOSEN' ? 'Dosen Pengajar' : 'Staf Laboran' }}</span>
        <ArrowRight v-if="!isSubmitting" :size="15" class="text-amber-400 transition-transform duration-200 group-hover:translate-x-1" />
      </button>
    </form>

    <!-- Institutional Terms Disclaimer -->
    <p class="text-[10.5px] text-text-muted/80 text-center leading-relaxed mt-3">
      Dengan mendaftar, Anda menyetujui Ketentuan Penggunaan Lab dan Kebijakan Privasi FIK UPNVJ.
    </p>

    <!-- Footer -->
    <div class="mt-4 text-center pt-3 border-t border-white/40 text-xs">
      <p class="text-text-muted">
        Sudah memiliki akun?
        <router-link to="/login" class="text-dark-green font-extrabold hover:underline ml-1">
          Masuk di sini &rarr;
        </router-link>
      </p>
    </div>
  </div>
</template>
