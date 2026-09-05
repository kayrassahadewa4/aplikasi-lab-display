<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import {
  ArrowLeft,
  ShieldCheck,
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
import { roleService } from '@/services'

const route = useRoute()
const router = useRouter()
const navStore = useAdminNavStore()

const roleId = computed(() => route.params.id as string | undefined)
const isEditMode = computed(() => !!roleId.value)

// Form State
const form = ref({
  name: '',
  code: '',
  description: '',
})

// UI State
const isLoading = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const showErrorToast = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  if (isEditMode.value) {
    try {
      isLoading.value = true
      const existing = await roleService.getRoleById(roleId.value as string)
      form.value = {
        name: existing.name,
        code: existing.code,
        description: existing.description,
      }
      navStore.setBreadcrumbs([
        { label: 'Dashboard', path: '/admin' },
        { label: 'Peran & Hak Akses', path: '/admin/roles' },
        { label: existing.name, path: `/admin/roles/${existing.id}` },
        { label: 'Ubah' },
      ])
    } catch (error) {
      console.error('Failed to load role', error)
      router.push('/admin/roles')
    } finally {
      isLoading.value = false
    }
  } else {
    navStore.setBreadcrumbs([
      { label: 'Dashboard', path: '/admin' },
      { label: 'Peran & Hak Akses', path: '/admin/roles' },
      { label: 'Tambah Peran' },
    ])
  }
})

const handleSave = async () => {
  if (!form.value.name || !form.value.code) return

  isLoading.value = true
  showErrorToast.value = false

  try {
    if (isEditMode.value && roleId.value) {
      // UPDATE existing role
      await roleService.updateRole(roleId.value, {
        name: form.value.name.trim(),
        description: form.value.description.trim(),
      })
      toastMessage.value = 'Izin peran berhasil diperbarui.'
    } else {
      // CREATE new role
      await roleService.createRole({
        code: form.value.code.toUpperCase().trim(),
        name: form.value.name.trim(),
        description: form.value.description ? form.value.description.trim() : 'Profil izin akses peran kustom',
      })
      toastMessage.value = 'Peran baru berhasil dibuat.'
    }

    showToast.value = true
    setTimeout(() => {
      showToast.value = false
      if (isEditMode.value && roleId.value) {
        router.push(`/admin/roles/${roleId.value}`)
      } else {
        router.push('/admin/roles')
      }
    }, 1000)
  } catch (error: any) {
    console.error('Failed to save role', error)
    const apiError = error?.response?.data?.message || error?.message || 'Gagal menyimpan peran. Silakan coba lagi.'
    errorMessage.value = apiError
    showErrorToast.value = true
  } finally {
    isLoading.value = false
  }
}

const handleCancel = () => {
  if (isEditMode.value && roleId.value) {
    router.push(`/admin/roles/${roleId.value}`)
  } else {
    router.push('/admin/roles')
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
        <span>Kembali ke Peran & Hak Akses</span>
      </button>

      <div class="pb-3 border-b border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
              {{ isEditMode ? 'Ubah Peran Sistem' : 'Tambah Peran Sistem' }}
            </h1>
            <span class="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-brand-100 text-dark-green text-xs font-extrabold border border-brand-200">
              <Sparkles :size="13" />
              <span>{{ isEditMode ? 'Profil Peran' : 'Peran Baru' }}</span>
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted font-medium">
            {{ isEditMode ? 'Perbarui definisi peran dan tingkat izin akses pengguna.' : 'Tambahkan profil peran akses baru ke dalam sistem pengelolaan laboratorium.' }}
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

    <!-- 2. MAIN 2-COLUMN GRID (8 COLS FORM + 4 COLS SIDEBAR) -->
    <form @submit.prevent="handleSave" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- ======================================================== -->
      <!-- LEFT COLUMN: MAIN FORM SECTIONS (8 COLS)                 -->
      <!-- ======================================================== -->
      <div class="lg:col-span-8 space-y-5">
        <!-- Section 1: Role Identification -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 sm:p-7 space-y-5">
          <div class="flex items-center gap-3 border-b border-gray-100 pb-3.5">
            <div class="w-10 h-10 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldCheck :size="20" stroke-width="2.2" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-text-primary tracking-tight">Identifikasi Peran</h3>
              <p class="text-xs text-text-muted">Tentukan label tampilan dan kode kunci identitas sistem yang unik.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">
                Nama Tampilan Peran <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                placeholder="mis. Asisten Laboratorium"
                required
                :disabled="isLoading"
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">
                Kode Kunci Sistem <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.code"
                type="text"
                placeholder="mis. ASISTEN_LAB"
                required
                :disabled="isLoading || isEditMode"
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-mono font-bold text-dark-green focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white uppercase disabled:opacity-60 transition-colors"
              />
              <p v-if="isEditMode" class="text-[11px] text-text-muted">Kunci sistem terkunci dan tidak dapat diubah setelah pembuatan awal.</p>
            </div>
          </div>
        </div>

        <!-- Section 2: Access Scope & Responsibilities -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 sm:p-7 space-y-5">
          <div class="flex items-center gap-3 border-b border-gray-100 pb-3.5">
            <div class="w-10 h-10 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <Lock :size="20" stroke-width="2.2" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-text-primary tracking-tight">Cakupan Akses & Deskripsi</h3>
              <p class="text-xs text-text-muted">Jelaskan tanggung jawab operasional dan cakupan izin akses dari peran ini.</p>
            </div>
          </div>

          <div class="space-y-1.5 text-xs">
            <label class="block font-bold text-text-primary">
              Deskripsi Cakupan Peran <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="form.description"
              rows="4"
              placeholder="mis. Berwenang membantu pelaksanaan sesi praktikum, mencatat log pemeliharaan rutin, dan memverifikasi inventaris ruangan..."
              required
              :disabled="isLoading"
              class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-medium text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white resize-none leading-relaxed transition-colors"
            ></textarea>
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
              <span>Profil Peran</span>
            </h4>
            <span class="px-2 py-0.5 rounded-full bg-brand-50 text-dark-green font-mono text-[10px] font-extrabold border border-brand-200/60">
              RBAC
            </span>
          </div>

          <div class="space-y-3 text-xs">
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Nama Peran</span>
              <span class="font-bold text-text-primary truncate max-w-[170px] text-right">{{ form.name || 'Peran Tanpa Judul' }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Kunci Sistem</span>
              <span class="font-mono font-extrabold text-dark-green">{{ form.code ? form.code.toUpperCase() : 'MENUNGGU' }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5">
              <span class="text-text-muted font-medium">Cakupan Izin</span>
              <span class="text-text-secondary font-medium text-[11px] truncate max-w-[170px]">
                {{ form.description ? `${form.description.slice(0, 30)}...` : 'Akses standar' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Security Policy Guidelines Card -->
        <div class="bg-brand-50/60 rounded-2xl border border-brand-200/80 p-5 space-y-2.5 text-xs">
          <div class="flex items-center gap-2 font-bold text-dark-green">
            <KeyRound :size="16" />
            <span>Catatan Keamanan RBAC</span>
          </div>
          <ul class="text-[11px] text-text-secondary space-y-1.5 list-disc list-inside leading-relaxed">
            <li>Kode kunci sistem direferensikan dalam penjaga otorisasi backend.</li>
            <li>Jangan mengubah peran yang ditugaskan kepada staf administratif aktif tanpa verifikasi.</li>
            <li>Penetapan peran langsung berlaku saat pembaruan token akses pengguna berikutnya.</li>
          </ul>
        </div>

        <!-- Sticky Primary Action Buttons Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-3">
          <button
            type="submit"
            :disabled="isLoading || !form.name || !form.code"
            class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#3B694A] to-[#2D5A3F] hover:from-[#31573E] hover:to-[#244430] text-white font-extrabold text-xs shadow-xs shadow-[#2D5A3F]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="isLoading" :size="16" class="animate-spin" />
            <Save v-else-if="isEditMode" :size="16" />
            <Plus v-else :size="16" />
            <span>{{ isLoading ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Buat Peran') }}</span>
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
