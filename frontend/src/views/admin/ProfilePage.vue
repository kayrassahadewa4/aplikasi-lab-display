<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'
import {
  User,
  ShieldCheck,
  Mail,
  Phone,
  Calendar,
  Clock,
  Lock,
  Camera,
  Edit3,
  Key,
  Activity,
  CheckCircle2,
  X
} from 'lucide-vue-next'
import { formatDate } from '@/utils/format.utils'
import { ProfileAvatarUploader } from '@/components'

const router = useRouter()
const navStore = useAdminNavStore()
const authStore = useAuthStore()

// Profile Data State
const profileData = ref({
  fullName: '',
  email: '',
  role: '',
  phone: '',
  status: '',
  registeredAt: '',
  lastActive: '',
})

onMounted(async () => {
  navStore.setBreadcrumbs([
    { label: 'Portal Admin', path: '/admin' },
    { label: 'Profil Saya' }
  ])

  try {
    const me = await authService.getCurrentUser()
    if (me) {
      profileData.value = {
        fullName: me.full_name || authStore.userName || 'Administrator',
        email: me.email || authStore.user?.email || 'admin@lab.com',
        role: (me.role?.name || authStore.userRole || 'Administrator') as string,
        phone: me.phone || '-',
        status: me.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif',
        registeredAt: me.created_at ? formatDate(me.created_at) : 'Baru Saja',
        lastActive: 'Sesi Aktif',
      }
    }
  } catch (error) {
    console.error('Failed to load current user profile:', error)
  }
})

// Toast Banner State
const showToast = ref(false)
const toastMessage = ref('')

// Account Activity Log
const activityLogs = ref([
  { id: 1, action: 'Masuk ke Portal Administrator', time: 'Hari ini, 10:24 WIB', type: 'login' },
  { id: 2, action: 'Memperbarui informasi laboratorium LAB-RPL', time: 'Kemarin, 15:42 WIB', type: 'update' },
  { id: 3, action: 'Membuat pengumuman publik baru', time: '5 Agustus 2026, 11:18 WIB', type: 'create' },
])

const handlePhotoUpload = () => {
  toastMessage.value = 'Fitur unggah foto profil siap digunakan.'
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 3500)
}
</script>

<template>
  <div class="space-y-6 pb-8 select-none">
    
    <!-- 1. Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2.5 border-b border-gray-200/60">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
            Profil Pengguna
          </h1>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-100/80 border border-brand-200 text-dark-green text-[11px] font-bold">
            <User :size="12" class="text-primary-dark" />
            Akun Administrator
          </span>
        </div>
        <p class="text-xs sm:text-sm text-text-muted font-normal">
          Kelola informasi profil akun Anda dan preferensi keamanan.
        </p>
      </div>
    </div>

    <!-- Success Feedback Toast Banner -->
    <div
      v-if="showToast"
      class="p-3.5 rounded-2xl bg-brand-100/90 border border-brand-200 text-dark-green text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="flex items-center gap-2">
        <CheckCircle2 :size="16" class="text-dark-green shrink-0" />
        <span>{{ toastMessage }}</span>
      </div>
      <button @click="showToast = false" class="text-dark-green hover:opacity-80">
        <X :size="14" />
      </button>
    </div>

    <!-- 2. Profile Overview Banner Card -->
    <div class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
      <div class="flex flex-col sm:flex-row sm:items-center gap-5">
        <!-- Avatar with Upload Capabilities -->
        <ProfileAvatarUploader
          :model-value="authStore.userAvatar"
          :user-name="profileData.fullName"
          size="2xl"
          :show-controls="true"
        />

        <!-- User Identity Info -->
        <div>
          <div class="flex items-center gap-2 mb-1">
            <h2 class="text-lg sm:text-xl font-extrabold text-text-primary tracking-tight">{{ profileData.fullName }}</h2>
            <span class="px-2.5 py-0.5 rounded-full bg-brand-100 text-dark-green text-[10px] font-extrabold uppercase border border-brand-200">
              {{ profileData.role }}
            </span>
          </div>
          <p class="text-xs text-text-muted font-normal">{{ profileData.email }}</p>
          <div class="flex items-center gap-2 mt-2 text-[11px] font-semibold text-dark-green">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Status Akun: {{ profileData.status }}</span>
          </div>
        </div>
      </div>

      <!-- Action Button Navigating to Separate Page /admin/profile/edit -->
      <div class="flex items-center gap-2 sm:self-center">
        <router-link
          to="/admin/profile/edit"
          class="px-4 py-2 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Edit3 :size="14" />
          <span>Ubah Profil</span>
        </router-link>
      </div>
    </div>

    <!-- 3. Personal Information Card -->
    <div class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-5 sm:p-6 space-y-5">
      <div class="border-b border-gray-100 pb-3 flex items-center justify-between">
        <div>
          <h3 class="text-base font-bold text-text-primary tracking-tight">Informasi Pribadi</h3>
          <p class="text-xs text-text-muted">Informasi dasar akun dan detail peran sistem Anda.</p>
        </div>
        <router-link
          to="/admin/profile/edit"
          class="text-xs font-bold text-dark-green hover:underline flex items-center gap-1"
        >
          <Edit3 :size="13" />
          <span>Ubah</span>
        </router-link>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-xs">
        <div class="p-3.5 rounded-xl bg-surface/60 border border-gray-100 space-y-1">
          <span class="text-text-muted font-medium text-[11px] block">Nama Lengkap</span>
          <span class="font-bold text-text-primary block text-sm">{{ profileData.fullName }}</span>
        </div>

        <div class="p-3.5 rounded-xl bg-surface/60 border border-gray-100 space-y-1">
          <span class="text-text-muted font-medium text-[11px] block">Alamat Email</span>
          <span class="font-bold text-text-primary block text-sm">{{ profileData.email }}</span>
        </div>

        <div class="p-3.5 rounded-xl bg-surface/60 border border-gray-100 space-y-1">
          <span class="text-text-muted font-medium text-[11px] block">Peran</span>
          <span class="font-bold text-dark-green block text-sm">{{ profileData.role }}</span>
        </div>

        <div class="p-3.5 rounded-xl bg-surface/60 border border-gray-100 space-y-1">
          <span class="text-text-muted font-medium text-[11px] block">Nomor Telepon</span>
          <span class="font-semibold text-text-primary block text-sm">{{ profileData.phone }}</span>
        </div>

        <div class="p-3.5 rounded-xl bg-surface/60 border border-gray-100 space-y-1">
          <span class="text-text-muted font-medium text-[11px] block">Terdaftar Sejak</span>
          <span class="font-semibold text-text-primary block text-sm">{{ profileData.registeredAt }}</span>
        </div>

        <div class="p-3.5 rounded-xl bg-surface/60 border border-gray-100 space-y-1">
          <span class="text-text-muted font-medium text-[11px] block">Aktivitas Terakhir</span>
          <span class="font-semibold text-text-primary block text-sm">{{ profileData.lastActive }}</span>
        </div>
      </div>
    </div>

    <!-- 4. Security Card -->
    <div class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-5 sm:p-6 space-y-5">
      <div class="border-b border-gray-100 pb-3 flex items-center justify-between">
        <div>
          <h3 class="text-base font-bold text-text-primary tracking-tight">Keamanan Akun</h3>
          <p class="text-xs text-text-muted">Kelola kata sandi dan pengaturan keamanan akun Anda.</p>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface/60 border border-gray-100 text-xs">
        <div class="space-y-1">
          <span class="font-bold text-text-primary block text-sm">Kata Sandi Akun</span>
          <span class="text-text-muted block">Kata Sandi: •••••••••••• (Terakhir diubah: Belum pernah)</span>
        </div>
        <router-link
          to="/admin/profile/change-password"
          class="px-4 py-2 rounded-full border border-gray-200 bg-white hover:bg-surface text-text-primary font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Key :size="14" class="text-dark-green" />
          <span>Ubah Kata Sandi</span>
        </router-link>
      </div>
    </div>

    <!-- 5. Recent Account Activity Card -->
    <div class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-5 sm:p-6 space-y-4">
      <div class="border-b border-gray-100 pb-3">
        <h3 class="text-base font-bold text-text-primary tracking-tight">Aktivitas Akun Terakhir</h3>
        <p class="text-xs text-text-muted">Jejak audit tindakan terkini yang dilakukan pada akun administrator ini.</p>
      </div>

      <div class="space-y-3 text-xs">
        <div
          v-for="log in activityLogs"
          :key="log.id"
          class="p-3.5 rounded-xl bg-surface/50 border border-gray-100 flex items-center justify-between gap-3"
        >
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-brand-100/70 text-dark-green flex items-center justify-center shrink-0">
              <Activity :size="15" />
            </div>
            <div>
              <p class="font-bold text-text-primary">{{ log.action }}</p>
              <p class="text-[11px] text-text-muted font-normal">Peristiwa sesi administrator</p>
            </div>
          </div>
          <span class="text-[11px] font-semibold text-text-muted shrink-0">{{ log.time }}</span>
        </div>
      </div>
    </div>

  </div>
</template>
