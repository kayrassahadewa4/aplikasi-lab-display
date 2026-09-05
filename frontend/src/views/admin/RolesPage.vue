<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import { BaseCard } from '@/components'
import {
  ShieldCheck,
  Shield,
  Plus,
  Search,
  MoreVertical,
  CheckCircle2,
  Lock,
  Eye,
  Edit3,
  Sliders,
  X,
  Users,
  Sparkles,
  ChevronRight,
  Filter,
  Check,
  Trash2
} from 'lucide-vue-next'
import { roleService } from '@/services'
import { type RoleData } from '@/mocks/admin-roles.mock'
import SummaryCard from '@/components/admin/SummaryCard.vue'

const router = useRouter()
const navStore = useAdminNavStore()

const roles = ref<RoleData[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const selectedPermissionFilter = ref<string>('All')

// Delete dialog state
const showDeleteModal = ref(false)
const selectedRoleForDelete = ref<RoleData | null>(null)

const loadRoles = async () => {
  isLoading.value = true
  try {
    roles.value = await roleService.getRoles()
  } catch (e) {
    console.error('Failed to load roles', e)
    // Show error to user if needed
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  navStore.setBreadcrumbs([
    { label: 'Dashboard', path: '/admin' },
    { label: 'Peran & Hak Akses' },
  ])
  await loadRoles()
})

// Summary metrics
const totalRoles = computed(() => roles.value.length)
const activeRoles = computed(() => roles.value.filter(r => r.status === 'Active').length)
const systemRoles = computed(() => roles.value.filter(r => r.isSystem).length)
const customRoles = computed(() => roles.value.filter(r => !r.isSystem).length)

// Filtered roles list based on search and dropdown filter
const filteredRoles = computed(() => {
  return roles.value.filter(role => {
    const matchesSearch =
      role.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      role.description.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      role.code.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      role.permissionsLevel.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesPermission =
      selectedPermissionFilter.value === 'All' ||
      role.permissionsLevel === selectedPermissionFilter.value

    return matchesSearch && matchesPermission
  })
})

// Navigation Actions
const navigateToCreate = () => {
  router.push('/admin/roles/create')
}

const navigateToDetail = (role: RoleData) => {
  router.push(`/admin/roles/${role.id}`)
}

const navigateToEdit = (role: RoleData) => {
  router.push(`/admin/roles/${role.id}/edit`)
}

// Delete Confirmation
const openDeleteModal = (role: RoleData) => {
  selectedRoleForDelete.value = role
  showDeleteModal.value = true
}

const confirmDeleteRole = async () => {
  if (!selectedRoleForDelete.value) return

  try {
    await roleService.deleteRole(selectedRoleForDelete.value.id)
    roles.value = roles.value.filter(r => r.id !== selectedRoleForDelete.value?.id)
    showDeleteModal.value = false
    selectedRoleForDelete.value = null
  } catch (error) {
    console.error('Failed to delete role', error)
    // Show error notification to user if needed
    showDeleteModal.value = false
    selectedRoleForDelete.value = null
  }
}
</script>

<template>
  <div class="space-y-6 pb-8 select-none">

    <!-- 1. Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2.5 border-b border-gray-200/60">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
            Peran & Hak Akses
          </h1>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-100/80 border border-brand-200 text-dark-green text-[11px] font-bold">
            <ShieldCheck :size="12" class="text-primary-dark" />
            Kontrol Akses
          </span>
        </div>
        <p class="text-xs sm:text-sm text-text-muted font-normal">
          Kelola peran sistem, tingkat izin akses, dan kapabilitas modul.
        </p>
      </div>

      <!-- Primary CTA Button Navigating to Dedicated Create Page -->
      <div class="self-start sm:self-auto shrink-0">
        <button
          @click="navigateToCreate"
          class="inline-flex items-center gap-2 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer"
        >
          <Plus :size="15" stroke-width="2.5" />
          <span>Tambah Peran</span>
        </button>
      </div>
    </div>

    <!-- 2. Metric Summary Widgets -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        title="Total Peran"
        :value="totalRoles"
        :icon="ShieldCheck"
        icon-bg-class="bg-brand-100"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Peran Aktif"
        :value="activeRoles"
        :icon="CheckCircle2"
        icon-bg-class="bg-emerald-50"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Peran Sistem"
        :value="systemRoles"
        :icon="Lock"
        icon-bg-class="bg-amber-50"
        icon-color-class="text-amber-700"
      />
      <SummaryCard
        title="Peran Kustom"
        :value="customRoles"
        :icon="Sliders"
        icon-bg-class="bg-sky-50"
        icon-color-class="text-sky-700"
      />
    </div>

    <!-- 3. Toolbar & Search -->
    <div class="bg-white p-3 sm:p-4 rounded-2xl border border-gray-200/70 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between text-xs">
      <div class="relative flex-1">
        <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari peran berdasarkan nama, kode, atau kapabilitas..."
          class="w-full pl-9 pr-3 py-2 bg-surface border border-gray-200 rounded-xl text-text-primary focus:outline-none focus:border-brand-400 focus:bg-white"
        />
      </div>

      <div class="flex items-center gap-2">
        <select
          v-model="selectedPermissionFilter"
          class="px-3 py-2 bg-surface border border-gray-200 rounded-xl font-bold text-text-primary focus:outline-none focus:border-brand-400"
        >
          <option value="All">Semua Tingkat Akses</option>
          <option value="Full Access">Akses Penuh</option>
          <option value="Operational Access">Akses Operasional</option>
          <option value="Request Access">Akses Permohonan</option>
          <option value="View Only">Hanya Lihat</option>
        </select>
      </div>
    </div>

    <!-- 4. Roles Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="role in filteredRoles"
        :key="role.id"
        @click="navigateToDetail(role)"
        class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs hover:shadow-md hover:border-brand-300 transition-all p-5 space-y-4 cursor-pointer group relative flex flex-col justify-between"
      >
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-brand-100/70 text-dark-green flex items-center justify-center shrink-0">
                <ShieldCheck :size="20" />
              </div>
              <div>
                <h3 class="font-extrabold text-sm text-text-primary group-hover:text-dark-green transition-colors flex items-center gap-2">
                  <span>{{ role.name }}</span>
                  <span class="px-2 py-0.2 rounded-full bg-surface border border-gray-200 text-[10px] font-mono font-bold text-dark-green">
                    {{ role.code }}
                  </span>
                </h3>
                <span :class="['px-2.5 py-0.5 rounded-full text-[10px] inline-block mt-1', role.permissionBadgeClass]">
                  {{ role.permissionsLevel }}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-1" @click.stop>
              <button
                @click="navigateToDetail(role)"
                class="p-1.5 rounded-lg text-text-muted hover:text-dark-green hover:bg-brand-50 transition-colors"
                title="Lihat Detail Peran"
              >
                <Eye :size="15" />
              </button>

              <button
                @click="navigateToEdit(role)"
                class="p-1.5 rounded-lg text-text-muted hover:text-dark-green hover:bg-brand-50 transition-colors"
                title="Ubah Peran"
              >
                <Edit3 :size="15" />
              </button>

              <button
                v-if="!role.isSystem"
                @click="openDeleteModal(role)"
                class="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Hapus Peran"
              >
                <Trash2 :size="15" />
              </button>
            </div>
          </div>

          <p class="text-xs text-text-muted leading-relaxed line-clamp-2">
            {{ role.description }}
          </p>

          <!-- Permissions List Snippet -->
          <div class="space-y-1.5 pt-2 border-t border-gray-100 text-xs">
            <div
              v-for="(perm, idx) in role.permissionsList.slice(0, 3)"
              :key="idx"
              class="flex items-center gap-2 text-text-secondary text-[11px]"
            >
              <Check :size="13" class="text-dark-green shrink-0" />
              <span class="truncate">{{ perm }}</span>
            </div>
            <p v-if="role.permissionsList.length > 3" class="text-[10px] font-bold text-dark-green pt-0.5">
              + {{ role.permissionsList.length - 3 }} hak akses lainnya
            </p>
          </div>
        </div>

        <div class="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-text-muted">
          <span class="flex items-center gap-1 font-semibold text-text-secondary">
            <Users :size="13" class="text-dark-green" />
            {{ role.usersCount }} Pengguna
          </span>
          <span class="text-[11px] font-bold text-dark-green group-hover:underline flex items-center gap-0.5">
            Lihat Detail
            <ChevronRight :size="12" />
          </span>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal Dialog -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xl w-full max-w-sm overflow-hidden p-5 space-y-4 text-xs animate-in zoom-in-95 duration-150">
        <div class="flex items-center gap-3 text-red-600">
          <div class="p-2 bg-red-50 rounded-xl">
            <Trash2 :size="20" />
          </div>
          <h3 class="text-sm font-bold text-text-primary">Hapus Peran Sistem?</h3>
        </div>

        <p class="text-text-muted leading-relaxed">
          Apakah Anda yakin ingin menghapus <strong class="text-text-primary">{{ selectedRoleForDelete?.name }}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            @click="showDeleteModal = false"
            class="px-4 py-2 rounded-full border border-gray-200 text-text-primary font-semibold hover:bg-surface cursor-pointer"
          >
            Batal
          </button>
          <button
            @click="confirmDeleteRole"
            class="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
          >
            Hapus Peran
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
