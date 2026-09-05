<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import { roleService } from '@/services'
import { formatDate } from '@/utils/format.utils'
import {
  ArrowLeft,
  ShieldCheck,
  Edit3,
  Trash2,
  Users,
  CheckCircle2,
  Check,
  Lock,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
  Layers,
  Key,
  ShieldAlert
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const navStore = useAdminNavStore()

const roleId = route.params.id as string
const role = ref<any | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')

const showDeleteConfirm = ref(false)
const showToast = ref(false)
const toastMessage = ref('')

const loadRoleDetail = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const data = await roleService.getRoleById(roleId)
    const isSystem = ['ADMIN', 'LABORAN', 'DOSEN', 'USER'].includes(data.code.toUpperCase())

    role.value = {
      id: data.id,
      code: data.code,
      name: data.name,
      description: data.description || 'Tidak ada deskripsi yang diberikan.',
      isSystem,
      status: 'Active',
      usersCount: (data as any).users_count ?? 1,
      permissionsLevel: data.code === 'ADMIN' ? 'Akses Penuh' : data.code === 'LABORAN' ? 'Akses Operasional' : 'Akses Standar',
      permissionBadgeClass:
        data.code === 'ADMIN'
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
          : 'bg-teal-50 text-teal-800 border-teal-200',
      permissionsList: [
        'Mengakses Kapabilitas Modul yang Ditugaskan',
        'Menjalankan Aksi Terotorisasi Sesuai Peran',
        'Melihat Informasi Laboratorium & Jadwal',
        'Mengelola Log & Data Operasional Sesuai Cakupan',
      ],
      createdAt: (data as any).created_at ? formatDate((data as any).created_at) : 'Standar Sistem',
    }

    navStore.setBreadcrumbs([
      { label: 'Dashboard', path: '/admin' },
      { label: 'Peran & Hak Akses', path: '/admin/roles' },
      { label: data.name },
    ])
  } catch (err: any) {
    errorMessage.value = err.message || 'Gagal memuat detail peran'
    console.error('Failed to load role:', err)
    setTimeout(() => router.push('/admin/roles'), 2500)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadRoleDetail()
})

const handleEdit = () => {
  router.push(`/admin/roles/${roleId}/edit`)
}

const handleDelete = async () => {
  try {
    await roleService.deleteRole(roleId)
    showDeleteConfirm.value = false
    toastMessage.value = 'Peran berhasil dihapus.'
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
      router.push('/admin/roles')
    }, 1000)
  } catch (err: any) {
    console.error('Failed to delete role:', err)
    showDeleteConfirm.value = false
  }
}
</script>

<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="flex items-center justify-center min-h-[400px]">
    <div class="text-center space-y-3">
      <div class="w-12 h-12 border-4 border-brand-200 border-t-dark-green rounded-full animate-spin mx-auto"></div>
      <p class="text-sm text-text-muted font-medium">Memuat detail peran...</p>
    </div>
  </div>

  <!-- Error State -->
  <div v-else-if="errorMessage || !role" class="flex items-center justify-center min-h-[400px]">
    <div class="text-center space-y-4 max-w-md">
      <div class="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
        <AlertCircle :size="32" class="text-red-600" />
      </div>
      <div>
        <h3 class="text-lg font-bold text-text-primary mb-1">Gagal Memuat Peran</h3>
        <p class="text-sm text-text-muted">{{ errorMessage || 'Peran tidak ditemukan. Mengalihkan...' }}</p>
      </div>
    </div>
  </div>

  <!-- Loaded Role Content -->
  <div v-else class="space-y-6 pb-12 w-full max-w-full min-w-0 select-none">
    <!-- 1. TOP HEADER & BREADCRUMB -->
    <div>
      <router-link
        to="/admin/roles"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-dark-green hover:underline mb-2 cursor-pointer"
      >
        <ArrowLeft :size="14" />
        <span>Kembali ke Peran & Hak Akses</span>
      </router-link>

      <div class="pb-3 border-b border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
              {{ role.name }}
            </h1>
            <span :class="['px-3 py-0.5 rounded-full text-xs font-extrabold border', role.permissionBadgeClass]">
              {{ role.permissionsLevel }}
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted font-medium">
            {{ role.description }}
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
            <div class="w-14 h-14 rounded-2xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldCheck :size="28" stroke-width="2.2" />
            </div>
            <div>
              <h2 class="text-lg font-extrabold text-text-primary">{{ role.name }}</h2>
              <p class="text-xs text-text-muted mt-0.5 font-medium">Kunci Sistem: <span class="font-mono font-bold text-dark-green">{{ role.code }}</span> • {{ role.isSystem ? 'Peran Bawaan Sistem' : 'Peran Kustom Terkonfigurasi' }}</p>
            </div>
          </div>
          <span class="text-xs font-mono font-bold text-dark-green bg-brand-50 px-3 py-1 rounded-full border border-brand-200/60 self-start sm:self-auto">
            Profil Akses RBAC
          </span>
        </div>

        <!-- Structured Attributes & Details Grid -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 space-y-5">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-extrabold text-text-primary tracking-tight">Parameter Peran Keamanan</h3>
            <p class="text-xs text-text-muted">Pengidentifikasi utama dan spesifikasi tata kelola cakupan akses.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Key :size="13" class="text-dark-green" />
                <span>Kode Kunci Peran</span>
              </div>
              <p class="text-xs font-mono font-black text-dark-green truncate">{{ role.code }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <ShieldCheck :size="13" class="text-dark-green" />
                <span>Tingkat Akses</span>
              </div>
              <p class="text-xs font-black text-text-primary truncate">{{ role.permissionsLevel }}</p>
            </div>

            <div class="p-4 rounded-xl border border-gray-100 bg-surface/60 space-y-1">
              <div class="flex items-center gap-1.5 text-text-muted text-[11px] font-bold">
                <Lock :size="13" class="text-dark-green" />
                <span>Tipe Peran Sistem</span>
              </div>
              <p class="text-xs font-bold text-dark-green truncate">{{ role.isSystem ? 'Inti Bawaan' : 'Kustom Terdefinisi' }}</p>
            </div>
          </div>
        </div>

        <!-- Permissions List Section -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 space-y-4">
          <div class="border-b border-gray-100 pb-3">
            <h3 class="text-base font-extrabold text-text-primary tracking-tight">Hak Akses & Kapabilitas yang Diberikan</h3>
            <p class="text-xs text-text-muted">Izin fungsional yang diberikan bagi pengguna dengan peran ini.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div
              v-for="(perm, idx) in role.permissionsList"
              :key="idx"
              class="p-3.5 rounded-xl bg-surface/60 border border-gray-100 flex items-center gap-2.5 font-semibold text-text-primary"
            >
              <Check :size="15" class="text-dark-green shrink-0" />
              <span>{{ perm }}</span>
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
            <span>Ubah Profil Peran</span>
          </button>
          <button
            v-if="!role.isSystem"
            @click="showDeleteConfirm = true"
            class="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 :size="14" />
            <span>Hapus Peran</span>
          </button>
        </div>

        <!-- Role Snapshot Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-3">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <h4 class="text-xs font-black uppercase tracking-wider text-text-secondary">Cakupan Profil</h4>
            <span class="px-2 py-0.5 rounded-full bg-brand-100 font-mono text-[10px] font-bold text-dark-green">
              {{ role.code }}
            </span>
          </div>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between py-1 border-b border-gray-50">
              <span class="text-text-muted">Nama Peran</span>
              <span class="font-bold text-text-primary">{{ role.name }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-gray-50">
              <span class="text-text-muted">Tingkat Akses</span>
              <span class="font-bold text-dark-green">{{ role.permissionsLevel }}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-text-muted">Proteksi Sistem</span>
              <span class="font-bold text-text-primary">{{ role.isSystem ? 'Dilindungi' : 'Kustom' }}</span>
            </div>
          </div>
        </div>

        <!-- System Audit Information -->
        <div class="bg-surface/60 rounded-2xl border border-gray-200/70 p-4 space-y-2 text-[11px] text-text-muted">
          <div class="flex justify-between">
            <span>UUID Peran</span>
            <span class="font-mono text-[10px] text-text-secondary truncate max-w-[140px]">{{ role.id }}</span>
          </div>
          <div class="flex justify-between">
            <span>Dibuat</span>
            <span class="font-medium text-text-secondary">{{ role.createdAt }}</span>
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
          <h3 class="text-sm font-bold text-text-primary">Hapus Peran?</h3>
        </div>

        <p class="text-text-muted leading-relaxed">
          Apakah Anda yakin ingin menghapus <strong class="text-text-primary">{{ role.name }}</strong>? Tindakan ini tidak dapat dibatalkan.
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
            class="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
          >
            Hapus Peran
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
