<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  Mail,
  Phone,
  User,
  CheckCircle2,
  X,
  Save,
  Plus,
  Lock,
  AlertTriangle,
  Sparkles,
  Eye,
  Loader2,
  KeyRound
} from 'lucide-vue-next'
import { userService, roleService } from '@/services'
import type { RoleData } from '@/mocks/admin-roles.mock'

const route = useRoute()
const router = useRouter()
const navStore = useAdminNavStore()

const userId = computed(() => route.params.id as string | undefined)
const isEditMode = computed(() => !!userId.value)

// Available roles from backend
const availableRoles = ref<RoleData[]>([])

// Form State
const form = ref({
  fullName: '',
  email: '',
  phone: '',
  roleId: '',
  status: 'Active' as 'Active' | 'Inactive',
  password: '',
})

// UI State
const isLoading = ref(false)
const isLoadingRoles = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const showErrorToast = ref(false)
const errorMessage = ref('')

const selectedRoleName = computed(() => {
  const r = availableRoles.value.find((role) => role.id === form.value.roleId)
  return r ? r.name : ''
})

onMounted(async () => {
  isLoadingRoles.value = true
  try {
    availableRoles.value = await roleService.getRoles(1, 100)
  } catch (error) {
    console.error('Failed to load roles', error)
    errorMessage.value = 'Failed to load roles. Please refresh the page.'
    showErrorToast.value = true
  } finally {
    isLoadingRoles.value = false
  }

  if (isEditMode.value && userId.value) {
    try {
      isLoading.value = true
      const existing = await userService.getUserById(userId.value)

      const matchingRole = availableRoles.value.find(
        (r) => r.id === existing.roleId || r.name === existing.role || r.code === existing.roleCode,
      )

      form.value = {
        fullName: existing.fullName,
        email: existing.email,
        phone: existing.phone === 'N/A' ? '' : existing.phone,
        roleId: existing.roleId || matchingRole?.id || '',
        status: existing.status,
        password: '',
      }

      navStore.setBreadcrumbs([
        { label: 'Dashboard', path: '/admin' },
        { label: 'Pengguna', path: '/admin/users' },
        { label: existing.fullName, path: `/admin/users/${existing.id}` },
        { label: 'Edit Pengguna' },
      ])
    } catch (error) {
      console.error('Failed to load user', error)
      errorMessage.value = 'Gagal memuat data pengguna.'
      showErrorToast.value = true
    } finally {
      isLoading.value = false
    }
  } else {
    navStore.setBreadcrumbs([
      { label: 'Dashboard', path: '/admin' },
      { label: 'Pengguna', path: '/admin/users' },
      { label: 'Tambah Pengguna' },
    ])

    if (availableRoles.value.length > 0 && availableRoles.value[0]) {
      form.value.roleId = availableRoles.value[0].id
    }
  }
})

const handleSave = async () => {
  if (!form.value.fullName || !form.value.email || !form.value.roleId) return

  if (!isEditMode.value && !form.value.password) {
    errorMessage.value = 'Kata sandi wajib diisi saat membuat pengguna baru.'
    showErrorToast.value = true
    return
  }

  if (!isEditMode.value && form.value.password.length < 6) {
    errorMessage.value = 'Kata sandi minimal harus terdiri dari 6 karakter.'
    showErrorToast.value = true
    return
  }

  isLoading.value = true
  showErrorToast.value = false

  try {
    if (isEditMode.value && userId.value) {
      const updateData: any = {
        role_id: form.value.roleId,
        full_name: form.value.fullName.trim(),
        email: form.value.email.trim(),
        phone: form.value.phone ? form.value.phone.trim() : null,
        status: form.value.status === 'Active' ? 'ACTIVE' : 'INACTIVE',
      }

      if (form.value.password) {
        updateData.password = form.value.password
      }

      await userService.updateUser(userId.value, updateData)
      toastMessage.value = 'Data pengguna berhasil diperbarui.'
    } else {
      await userService.createUser({
        role_id: form.value.roleId,
        full_name: form.value.fullName.trim(),
        email: form.value.email.trim(),
        phone: form.value.phone ? form.value.phone.trim() : undefined,
        password: form.value.password,
        status: form.value.status === 'Active' ? 'ACTIVE' : 'INACTIVE',
      })
      toastMessage.value = 'Pengguna baru berhasil ditambahkan.'
    }

    showToast.value = true
    setTimeout(() => {
      showToast.value = false
      if (isEditMode.value && userId.value) {
        router.push(`/admin/users/${userId.value}`)
      } else {
        router.push('/admin/users')
      }
    }, 1000)
  } catch (error: any) {
    console.error('Failed to save user', error)
    const apiError = error?.response?.data?.message || error?.message || 'Failed to save user. Please try again.'
    errorMessage.value = apiError
    showErrorToast.value = true
  } finally {
    isLoading.value = false
  }
}

const handleCancel = () => {
  if (isEditMode.value && userId.value) {
    router.push(`/admin/users/${userId.value}`)
  } else {
    router.push('/admin/users')
  }
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
        <span>Kembali ke Manajemen Pengguna</span>
      </button>

      <div class="pb-3 border-b border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
              {{ isEditMode ? 'Edit Akun Pengguna' : 'Tambah Pengguna Baru' }}
            </h1>
            <span class="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-brand-100 text-dark-green text-xs font-extrabold border border-brand-200">
              <Sparkles :size="13" />
              <span>{{ isEditMode ? 'Profil Pengguna' : 'Pengguna Baru' }}</span>
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted font-medium">
            {{ isEditMode ? 'Perbarui data identitas, peran sistem, dan status akun pengguna.' : 'Daftarkan akun staf atau dosen baru ke dalam sistem laboratorium.' }}
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

    <!-- Error Toast Feedback Banner -->
    <div
      v-if="showErrorToast"
      class="p-3.5 rounded-2xl bg-red-50/90 border border-red-200 text-red-700 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="flex items-center gap-2">
        <AlertTriangle :size="16" class="text-red-600 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>
      <button @click="showErrorToast = false" class="text-red-600 hover:opacity-80 cursor-pointer">
        <X :size="14" />
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs p-20 text-center">
      <div class="inline-flex items-center gap-3 text-text-muted">
        <Loader2 :size="24" class="animate-spin text-dark-green" />
        <span class="text-xs font-medium">Memuat profil pengguna...</span>
      </div>
    </div>

    <!-- 2. MAIN 2-COLUMN GRID (8 COLS FORM + 4 COLS SIDEBAR) -->
    <form v-if="!isLoading" @submit.prevent="handleSave" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- ======================================================== -->
      <!-- LEFT COLUMN: MAIN FORM SECTIONS (8 COLS)                 -->
      <!-- ======================================================== -->
      <div class="lg:col-span-8 space-y-5">
        <!-- Section 1: Personal Information -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 sm:p-7 space-y-5">
          <div class="flex items-center gap-3 border-b border-gray-100 pb-3.5">
            <div class="w-10 h-10 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <User :size="20" stroke-width="2.2" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-text-primary tracking-tight">Informasi Pribadi</h3>
              <p class="text-xs text-text-muted">Nama lengkap beserta gelar, alamat email institusi, dan nomor telepon.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1.5 sm:col-span-2">
              <label class="block font-bold text-text-primary">
                Nama Lengkap (beserta Gelar) <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.fullName"
                type="text"
                placeholder="Contoh: Dr. Hendra Wijaya, M.Kom."
                required
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">
                Alamat Email Institusi <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.email"
                type="email"
                placeholder="Contoh: hendra.wijaya@upnvj.ac.id"
                required
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">
                Nomor Telepon / WhatsApp
              </label>
              <input
                v-model="form.phone"
                type="text"
                placeholder="Contoh: +62 812-3456-7890"
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        <!-- Section 2: Role & Authentication -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 sm:p-7 space-y-5">
          <div class="flex items-center gap-3 border-b border-gray-100 pb-3.5">
            <div class="w-10 h-10 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <Lock :size="20" stroke-width="2.2" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-text-primary tracking-tight">Hak Akses & Keamanan</h3>
              <p class="text-xs text-text-muted">Peran sistem, kata sandi, dan status keaktifan akun.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">
                Peran Sistem <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.roleId"
                required
                :disabled="isLoadingRoles"
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white disabled:opacity-50 transition-colors"
              >
                <option value="" disabled>{{ isLoadingRoles ? 'Memuat peran...' : 'Pilih peran yang ditetapkan...' }}</option>
                <option v-for="role in availableRoles" :key="role.id" :value="role.id">
                  {{ role.name }} ({{ role.code }})
                </option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">
                Status Akun <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.status"
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              >
                <option value="Active">Aktif (Dapat Masuk ke Sistem)</option>
                <option value="Inactive">Nonaktif (Akses Dinonaktifkan)</option>
              </select>
            </div>

            <div class="space-y-1.5 sm:col-span-2">
              <label class="block font-bold text-text-primary">
                Kata Sandi
                <span v-if="isEditMode" class="font-normal text-text-muted">(kosongkan jika tidak ingin mengubah kata sandi)</span>
                <span v-else class="text-red-500">*</span>
              </label>
              <input
                v-model="form.password"
                type="password"
                placeholder="Masukkan kata sandi (minimal 6 karakter)"
                :required="!isEditMode"
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
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
              <span>Ringkasan Pengguna</span>
            </h4>
            <span
              :class="[
                'px-2 py-0.5 rounded-full text-[10px] font-extrabold border',
                form.status === 'Active'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              ]"
            >
              {{ form.status === 'Active' ? 'Aktif' : 'Nonaktif' }}
            </span>
          </div>

          <div class="space-y-3 text-xs">
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Nama</span>
              <span class="font-bold text-text-primary truncate max-w-[170px] text-right">{{ form.fullName || 'Pengguna Baru' }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Email</span>
              <span class="font-bold text-dark-green truncate max-w-[170px] text-right text-[11px]">{{ form.email || '-' }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Peran Ditetapkan</span>
              <span class="font-bold text-text-primary">{{ selectedRoleName || 'Belum dipilih' }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5">
              <span class="text-text-muted font-medium">Status Kata Sandi</span>
              <span class="font-mono text-[11px] font-bold text-text-secondary">
                {{ isEditMode ? (form.password ? 'Akan diperbarui' : 'Tetap') : (form.password ? 'Telah diisi' : 'Wajib diisi') }}
              </span>
            </div>
          </div>
        </div>

        <!-- User Governance Guidelines Card -->
        <div class="bg-brand-50/60 rounded-2xl border border-brand-200/80 p-5 space-y-2.5 text-xs">
          <div class="flex items-center gap-2 font-bold text-dark-green">
            <ShieldCheck :size="16" />
            <span>Petunjuk Pengelolaan Akun</span>
          </div>
          <ul class="text-[11px] text-text-secondary space-y-1.5 list-disc list-inside leading-relaxed">
            <li>Pastikan alamat email institusi aktif dan valid sebelum menyimpan.</li>
            <li>Penetapan peran langsung menentukan akses menu dan hak istimewa pengguna.</li>
            <li>Akun yang dinonaktifkan tidak akan dapat masuk atau membuat sesi baru.</li>
          </ul>
        </div>

        <!-- Sticky Primary Action Buttons Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-3">
          <button
            type="submit"
            :disabled="isLoading || isLoadingRoles || !form.fullName || !form.email || !form.roleId"
            class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#3B694A] to-[#2D5A3F] hover:from-[#31573E] hover:to-[#244430] text-white font-extrabold text-xs shadow-xs shadow-[#2D5A3F]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="isLoading" :size="16" class="animate-spin" />
            <Save v-else-if="isEditMode" :size="16" />
            <Plus v-else :size="16" />
            <span>{{ isLoading ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Simpan Pengguna Baru') }}</span>
          </button>
          <button
            type="button"
            @click="handleCancel"
            :disabled="isLoading"
            class="w-full py-2.5 px-4 rounded-xl border border-gray-200/80 hover:bg-surface text-text-secondary font-bold text-xs transition-all cursor-pointer text-center disabled:opacity-50"
          >
            Batal & Kembali
          </button>
        </div>
      </div>
    </form>
  </div>
</template>
