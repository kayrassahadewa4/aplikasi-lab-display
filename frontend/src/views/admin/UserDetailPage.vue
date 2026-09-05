<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import { userService } from '@/services/user.service'
import type { UserData } from '@/mocks/admin-users.mock'
import { BaseAvatar } from '@/components'
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  Mail,
  Phone,
  Calendar,
  Clock,
  Edit3,
  Trash2,
  Activity,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
  User,
  Layers,
  Lock
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const navStore = useAdminNavStore()

const userId = route.params.id as string
const user = ref<UserData | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')

// Delete Dialog State
const showDeleteConfirm = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const isDeleting = ref(false)

const loadUserDetail = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const data = await userService.getUserById(userId)
    user.value = data

    navStore.setBreadcrumbs([
      { label: 'Dashboard', path: '/admin' },
      { label: 'Pengguna', path: '/admin/users' },
      { label: data.fullName },
    ])
  } catch (err: any) {
    errorMessage.value = err.message || 'Gagal memuat detail pengguna'
    console.error('Failed to load user detail:', err)
    setTimeout(() => router.push('/admin/users'), 2500)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadUserDetail()
})

const userInitials = computed(() => {
  if (!user.value?.fullName) return 'U'
  return user.value.fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
})

const handleEdit = () => {
  router.push(`/admin/users/${userId}/edit`)
}

const handleDelete = async () => {
  isDeleting.value = true
  try {
    await userService.deleteUser(userId)
    showDeleteConfirm.value = false
    toastMessage.value = 'Akun pengguna berhasil dihapus.'
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
      router.push('/admin/users')
    }, 1000)
  } catch (err: any) {
    console.error('Failed to delete user:', err)
    showDeleteConfirm.value = false
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="flex items-center justify-center min-h-[400px]">
    <div class="text-center space-y-3">
      <div class="w-12 h-12 border-4 border-brand-200 border-t-dark-green rounded-full animate-spin mx-auto"></div>
      <p class="text-sm text-text-muted font-medium">Memuat detail pengguna...</p>
    </div>
  </div>

  <!-- Error State -->
  <div v-else-if="errorMessage || !user" class="flex items-center justify-center min-h-[400px]">
    <div class="text-center space-y-4 max-w-md">
      <div class="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
        <AlertCircle :size="32" class="text-red-600" />
      </div>
      <div>
        <h3 class="text-lg font-bold text-text-primary mb-1">Gagal Memuat Pengguna</h3>
        <p class="text-sm text-text-muted">{{ errorMessage || 'Akun pengguna tidak ditemukan.' }}</p>
      </div>
      <button
        @click="router.push('/admin/users')"
        class="px-4 py-2 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
      >
        Kembali ke Pengguna
      </button>
    </div>
  </div>

  <!-- Content State -->
  <div v-else class="space-y-6 pb-12 w-full max-w-full min-w-0 select-none">
    <!-- 1. TOP HEADER & BREADCRUMB -->
    <div>
      <router-link
        to="/admin/users"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-dark-green hover:underline mb-2 cursor-pointer"
      >
        <ArrowLeft :size="14" />
        <span>Kembali ke Pengguna</span>
      </router-link>

      <div class="pb-3 border-b border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
              {{ user.fullName }}
            </h1>
            <span
              :class="[
                'px-3 py-0.5 rounded-full text-xs font-extrabold border',
                user.status === 'Active'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-gray-100 text-text-muted border-gray-200'
              ]"
            >
              {{ user.status === 'Active' ? 'Aktif' : 'Tidak Aktif' }}
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted font-medium">
            {{ user.email }} • Peran: {{ user.role }} • Terdaftar: {{ user.registered }}
          </p>
        </div>
      </div>
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

    <!-- 2. MAIN 2-COLUMN GRID (8 COLS DATA + 4 COLS SIDEBAR) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- ======================================================== -->
      <!-- LEFT COLUMN: SPECIFICATIONS & CORE ATTRIBUTES (8 COLS)   -->
      <!-- ======================================================== -->
      <div class="lg:col-span-8 space-y-6">
        <!-- Hero Overview Banner Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div class="flex items-center gap-4">
            <BaseAvatar
              :src="user.avatarUrl"
              :name="user.fullName"
              size="xl"
              class="shrink-0 ring-2 ring-brand-100/80 shadow-md"
            />
            <div>
              <h2 class="text-lg font-extrabold text-text-primary">{{ user.fullName }}</h2>
              <p class="text-xs text-text-muted mt-0.5 font-medium">{{ user.email }} • <span class="font-bold text-dark-green">{{ user.role }}</span></p>
            </div>
          </div>
          <span class="text-xs font-mono font-bold text-dark-green bg-brand-50 px-3 py-1 rounded-full border border-brand-200/60 self-start sm:self-auto">
            Akun Terotorisasi
          </span>
        </div>

        <!-- Structured Attributes & Details Grid -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 space-y-5">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-extrabold text-text-primary tracking-tight">Identitas & Parameter Sistem</h3>
            <p class="text-xs text-text-muted">Informasi kontak pribadi, cakupan peran, dan kredensial akun.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <User :size="13" class="text-dark-green" />
                <span>Nama Lengkap</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ user.fullName }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Mail :size="13" class="text-dark-green" />
                <span>Alamat Email</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ user.email }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <ShieldCheck :size="13" class="text-dark-green" />
                <span>Peran Sistem</span>
              </div>
              <p class="text-xs font-bold text-dark-green truncate">{{ user.role }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Phone :size="13" class="text-dark-green" />
                <span>Nomor Telepon</span>
              </div>
              <p class="text-xs font-semibold text-text-primary truncate">{{ user.phone || 'Belum dikonfigurasi' }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Calendar :size="13" class="text-dark-green" />
                <span>Tanggal Terdaftar</span>
              </div>
              <p class="text-xs font-semibold text-text-primary truncate">{{ user.registered }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Clock :size="13" class="text-dark-green" />
                <span>Aktivitas Terakhir</span>
              </div>
              <p class="text-xs font-semibold text-text-primary truncate">{{ user.lastActive }}</p>
            </div>
          </div>
        </div>

        <!-- Recent Activity Audit Log Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 space-y-4">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-extrabold text-text-primary tracking-tight">Aktivitas Terakhir Pengguna</h3>
            <p class="text-xs text-text-muted">Log permohonan ruangan, check-in sesi, atau login portal terkini.</p>
          </div>

          <div class="space-y-3 text-xs">
            <div class="p-4 rounded-xl bg-surface/60 border border-gray-100 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0">
                  <Activity :size="16" />
                </div>
                <div>
                  <p class="font-bold text-text-primary">Sesi Portal Terautentikasi</p>
                  <p class="text-[11px] text-text-muted font-normal">Token akses aktif terverifikasi</p>
                </div>
              </div>
              <span class="text-[11px] font-bold text-text-muted shrink-0">{{ user.lastActive }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- RIGHT COLUMN: ACTIONS & CONTEXTUAL SIDEBAR (4 COLS)      -->
      <!-- ======================================================== -->
      <div class="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
        <!-- Action Management Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 sm:p-6 space-y-3">
          <h4 class="text-xs font-black uppercase tracking-wider text-text-primary">Tindakan Pengelolaan</h4>
          <button
            @click="handleEdit"
            class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#3B694A] to-[#2D5A3F] hover:from-[#31573E] hover:to-[#244430] text-white font-extrabold text-xs shadow-xs shadow-[#2D5A3F]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Edit3 :size="14" />
            <span>Ubah Profil Pengguna</span>
          </button>
          <button
            @click="showDeleteConfirm = true"
            class="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 :size="14" />
            <span>Hapus Akun Pengguna</span>
          </button>
        </div>

        <!-- User Role Snapshot Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-3">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <h4 class="text-xs font-black uppercase tracking-wider text-text-secondary">Profil Keamanan</h4>
            <span class="px-2 py-0.5 rounded-full bg-brand-100 font-mono text-[10px] font-bold text-dark-green">
              {{ user.role }}
            </span>
          </div>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between py-1 border-b border-gray-50">
              <span class="text-text-muted">Status Akun</span>
              <span class="font-bold text-dark-green">{{ user.status === 'Active' ? 'Aktif' : 'Tidak Aktif' }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-gray-50">
              <span class="text-text-muted">Terdaftar</span>
              <span class="font-medium text-text-secondary">{{ user.registered }}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-text-muted">Aktivitas Terakhir</span>
              <span class="font-medium text-text-secondary">{{ user.lastActive }}</span>
            </div>
          </div>
        </div>

        <!-- System Audit Information -->
        <div class="bg-surface/60 rounded-2xl border border-gray-200/70 p-4 space-y-2 text-[11px] text-text-muted">
          <div class="flex justify-between">
            <span>UUID Pengguna</span>
            <span class="font-mono text-[10px] text-text-secondary truncate max-w-[140px]">{{ user.id }}</span>
          </div>
          <div class="flex justify-between">
            <span>Email Terverifikasi</span>
            <span class="font-bold text-dark-green">Ya</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal Dialog -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xl w-full max-w-sm overflow-hidden p-5 space-y-4 text-xs animate-in zoom-in-95 duration-150">
        <div class="flex items-center gap-3 text-red-600">
          <div class="p-2 bg-red-50 rounded-xl">
            <Trash2 :size="20" />
          </div>
          <h3 class="text-sm font-bold text-text-primary">Hapus Akun Pengguna?</h3>
        </div>

        <p class="text-text-muted leading-relaxed">
          Apakah Anda yakin ingin menghapus <strong class="text-text-primary">{{ user.fullName }}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            @click="showDeleteConfirm = false"
            class="px-4 py-2 rounded-full border border-gray-200 text-text-primary font-semibold hover:bg-surface cursor-pointer"
          >
            Batal
          </button>
          <button
            @click="handleDelete"
            :disabled="isDeleting"
            class="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer disabled:opacity-50"
          >
            {{ isDeleting ? 'Menghapus...' : 'Hapus Pengguna' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
