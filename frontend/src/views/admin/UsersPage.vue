<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import {
  Users,
  ShieldCheck,
  FlaskConical,
  GraduationCap,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Mail,
  Phone,
  Calendar,
  Clock,
  UserCheck,
  AlertTriangle
} from 'lucide-vue-next'
import type { UserData } from '@/mocks/admin-users.mock'
import SummaryCard from '@/components/admin/SummaryCard.vue'
import { BaseAvatar } from '@/components'
import { userService } from '@/services'

const router = useRouter()
const navStore = useAdminNavStore()

// Reactive State
const users = ref<UserData[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const selectedRoleFilter = ref<string>('All')
const selectedStatusFilter = ref<string>('All')
const sortBy = ref<string>('name')
const activeDropdownId = ref<string | null>(null)

// Pagination State
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalUsers = ref(0)
const totalPages = computed(() => Math.ceil(totalUsers.value / itemsPerPage.value) || 1)

// Delete Modal State
const showDeleteModal = ref(false)
const selectedUserForDelete = ref<UserData | null>(null)

// Summary Cards Metrics (will be computed from actual data)
const totalUsersCount = computed(() => totalUsers.value)
const adminUsersCount = computed(() => users.value.filter(u => u.role === 'Administrator').length)
const laboranUsersCount = computed(() => users.value.filter(u => u.role === 'Laboran').length)
const lecturerUsersCount = computed(() => users.value.filter(u => u.role === 'Dosen / Pemohon').length)

// Load users from backend API
const loadUsers = async () => {
  isLoading.value = true
  try {
    const statusFilter = selectedStatusFilter.value === 'All'
      ? undefined
      : (selectedStatusFilter.value === 'Active' ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE'

    const { users: fetchedUsers, meta } = await userService.getUsers({
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: searchQuery.value || undefined,
      status: statusFilter,
    })

    users.value = fetchedUsers
    totalUsers.value = meta.total
  } catch (error) {
    console.error('Failed to load users', error)
    users.value = []
    totalUsers.value = 0
  } finally {
    isLoading.value = false
  }
}

// Watch for filter changes and reload
watch([currentPage, selectedRoleFilter, selectedStatusFilter, searchQuery], () => {
  loadUsers()
}, { deep: true })

onMounted(async () => {
  navStore.setBreadcrumbs([
    { label: 'Dashboard', path: '/admin' },
    { label: 'Pengguna' },
  ])
  await loadUsers()
})

// Filtered Users List (now handled by backend, so this is just for client-side role filtering)
const filteredUsers = computed(() => {
  if (selectedRoleFilter.value === 'All') {
    return users.value
  }
  return users.value.filter(u => u.role === selectedRoleFilter.value)
})

// Paginated Users List (already paginated from backend)
const paginatedUsers = computed(() => filteredUsers.value)

// Actions & Page Navigation
const navigateToCreate = () => {
  router.push('/admin/users/create')
}

const navigateToDetail = (user: UserData) => {
  router.push(`/admin/users/${user.id}`)
}

const navigateToEdit = (user: UserData) => {
  closeDropdown()
  router.push(`/admin/users/${user.id}/edit`)
}

// Dropdown Action Menu
const toggleDropdown = (id: string, event: Event) => {
  event.stopPropagation()
  activeDropdownId.value = activeDropdownId.value === id ? null : id
}

const closeDropdown = () => {
  activeDropdownId.value = null
}

// Delete Action
const openDeleteModal = (user: UserData) => {
  selectedUserForDelete.value = user
  showDeleteModal.value = true
  closeDropdown()
}

// Toast Feedback
const errorMessage = ref('')
const successMessage = ref('')

const confirmDeleteUser = async () => {
  if (!selectedUserForDelete.value) return

  errorMessage.value = ''
  successMessage.value = ''

  try {
    await userService.deleteUser(selectedUserForDelete.value.id)
    successMessage.value = 'Pengguna berhasil dihapus.'
    showDeleteModal.value = false
    selectedUserForDelete.value = null
    // Reload users after deletion
    await loadUsers()
    setTimeout(() => { successMessage.value = '' }, 4000)
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || error.message || 'Gagal menghapus pengguna'
    showDeleteModal.value = false
    selectedUserForDelete.value = null
    setTimeout(() => { errorMessage.value = '' }, 5000)
  }
}
</script>

<template>
  <div class="space-y-6 pb-8 select-none" @click="closeDropdown">

    <!-- Error / Success Alert Feedback Banner -->
    <div
      v-if="errorMessage"
      class="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="flex items-center gap-2">
        <AlertTriangle :size="16" class="text-rose-600 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>
      <button @click="errorMessage = ''" class="text-rose-500 hover:text-rose-700">
        <X :size="14" />
      </button>
    </div>

    <div
      v-if="successMessage"
      class="p-3.5 rounded-2xl bg-brand-100/90 border border-brand-200 text-dark-green text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="flex items-center gap-2">
        <Check :size="16" class="text-dark-green shrink-0" />
        <span>{{ successMessage }}</span>
      </div>
      <button @click="successMessage = ''" class="text-dark-green hover:opacity-80">
        <X :size="14" />
      </button>
    </div>

    <!-- 1. Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-brand-100">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h1 class="text-2xl sm:text-[28px] font-black text-text-primary tracking-tight leading-tight">
            Manajemen Pengguna
          </h1>
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 border border-brand-200 text-dark-green text-[11px] font-extrabold shadow-2xs">
            <UserCheck :size="12" class="text-dark-green" />
            Kelola Akun Pengguna
          </span>
        </div>
        <p class="text-xs sm:text-sm text-text-muted font-normal">
          Kelola data seluruh pengguna terdaftar dan hak akses ke sistem laboratorium.
        </p>
      </div>

      <!-- Primary Action CTA Button Navigating to Dedicated Create Page -->
      <div class="self-start sm:self-auto shrink-0">
        <button
          @click="navigateToCreate"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-dark-green to-[#1b703d] hover:from-[#094726] hover:to-dark-green text-white text-xs font-black shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer active:scale-95"
        >
          <Plus :size="15" stroke-width="2.5" />
          <span>Tambah Pengguna</span>
        </button>
      </div>
    </div>

    <!-- 2. Metric Summary Widgets -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        title="Total Pengguna"
        :value="totalUsersCount"
        :icon="Users"
        icon-bg-class="bg-brand-100"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Administrator"
        :value="adminUsersCount"
        :icon="ShieldCheck"
        icon-bg-class="bg-amber-50"
        icon-color-class="text-amber-700"
      />
      <SummaryCard
        title="Staf Laboran"
        :value="laboranUsersCount"
        :icon="FlaskConical"
        icon-bg-class="bg-emerald-50"
        icon-color-class="text-dark-green"
      />
      <SummaryCard
        title="Dosen / Pemohon"
        :value="lecturerUsersCount"
        :icon="GraduationCap"
        icon-bg-class="bg-sky-50"
        icon-color-class="text-sky-700"
      />
    </div>

    <!-- 3. Table Toolbar (Filter / Search) -->
    <div class="bg-white p-3 sm:p-4 rounded-2xl border border-gray-200/70 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between text-xs">
      <div class="relative flex-1">
        <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-dark-green pointer-events-none" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari pengguna berdasarkan nama, email, atau peran..."
          class="w-full pl-9 pr-3 py-2 bg-surface/70 border border-gray-200 rounded-xl text-text-primary focus:outline-none focus:border-dark-green focus:ring-2 focus:ring-dark-green/20 focus:bg-white transition-colors"
        />
      </div>

      <div class="flex items-center gap-2 overflow-x-auto">
        <select
          v-model="selectedRoleFilter"
          class="px-3 py-2 bg-surface/70 border border-gray-200 rounded-xl font-bold text-text-primary focus:outline-none focus:border-dark-green focus:ring-2 focus:ring-dark-green/20 focus:bg-white transition-colors cursor-pointer"
        >
          <option value="All">Semua Peran</option>
          <option value="Administrator">Administrator</option>
          <option value="Laboran">Laboran</option>
          <option value="Dosen / Pemohon">Dosen / Pemohon</option>
        </select>

        <select
          v-model="selectedStatusFilter"
          class="px-3 py-2 bg-surface/70 border border-gray-200 rounded-xl font-bold text-text-primary focus:outline-none focus:border-dark-green focus:ring-2 focus:ring-dark-green/20 focus:bg-white transition-colors cursor-pointer"
        >
          <option value="All">Semua Status</option>
          <option value="Active">Aktif</option>
          <option value="Inactive">Nonaktif</option>
        </select>
      </div>
    </div>

    <!-- 4. Users Data Table -->
    <div class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-text-primary">
          <thead class="bg-emerald-50/40 border-b border-brand-100 text-emerald-950/70 font-extrabold uppercase tracking-wider text-[11px]">
            <tr>
              <th class="py-3.5 px-4">Pengguna</th>
              <th class="py-3.5 px-4">Peran</th>
              <th class="py-3.5 px-4">No. Telepon</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-4">Terdaftar</th>
              <th class="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="user in paginatedUsers"
              :key="user.id"
              @click="navigateToDetail(user)"
              class="hover:bg-brand-50/60 transition-all duration-150 cursor-pointer group relative"
            >
              <!-- Name & Avatar with Left Hover Accent Bar -->
              <td class="py-3.5 px-4 relative">
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-dark-green opacity-0 group-hover:opacity-100 transition-opacity rounded-r" />
                <div class="flex items-center gap-3">
                  <BaseAvatar
                    :src="user.avatarUrl"
                    :name="user.fullName"
                    size="sm"
                    class="shrink-0 ring-2 ring-brand-200/60 group-hover:ring-dark-green/40 transition-all shadow-2xs"
                  />
                  <div class="min-w-0">
                    <p class="font-bold text-text-primary group-hover:text-dark-green transition-colors truncate">{{ user.fullName }}</p>
                    <p class="text-[11px] text-text-muted font-normal truncate">{{ user.email }}</p>
                  </div>
                </div>
              </td>

              <!-- Role with Official Campus Hierarchy Badges -->
              <td class="py-3.5 px-4">
                <span
                  v-if="user.role === 'Administrator'"
                  class="px-2.5 py-0.5 rounded-full bg-dark-green text-white text-[10px] font-black tracking-wider uppercase border border-emerald-800 shadow-2xs inline-block"
                >
                  {{ user.role }}
                </span>
                <span
                  v-else-if="user.role === 'Laboran'"
                  class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-dark-green text-[10px] font-extrabold border border-emerald-300 shadow-2xs inline-block"
                >
                  {{ user.role }}
                </span>
                <span
                  v-else
                  class="px-2.5 py-0.5 rounded-full bg-brand-100/90 text-dark-green text-[10px] font-extrabold border border-brand-200/80 shadow-2xs inline-block"
                >
                  {{ user.role }}
                </span>
              </td>

              <!-- Phone -->
              <td class="py-3.5 px-4 font-medium text-text-secondary">
                {{ user.phone }}
              </td>

              <!-- Status with Animated Pulsing Dot -->
              <td class="py-3.5 px-4">
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border shadow-2xs select-none',
                    user.status === 'Active'
                      ? 'bg-emerald-50 text-dark-green border-emerald-200'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  ]"
                >
                  <span
                    :class="[
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      user.status === 'Active' ? 'bg-emerald-500 animate-pulse ring-2 ring-emerald-300/40' : 'bg-gray-400'
                    ]"
                  />
                  <span>{{ user.status === 'Active' ? 'Aktif' : 'Nonaktif' }}</span>
                </span>
              </td>

              <!-- Registered -->
              <td class="py-3.5 px-4 text-text-muted font-medium">
                {{ user.registered }}
              </td>

              <!-- Actions with Color-Coded Hover Feedback -->
              <td class="py-3.5 px-4 text-right" @click.stop>
                <div class="flex items-center justify-end gap-1">
                  <button
                    @click="navigateToDetail(user)"
                    class="p-1.5 rounded-lg text-text-muted hover:text-dark-green hover:bg-brand-100/80 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title="Lihat Detail"
                  >
                    <Eye :size="15" />
                  </button>

                  <button
                    @click="navigateToEdit(user)"
                    class="p-1.5 rounded-lg text-text-muted hover:text-amber-600 hover:bg-amber-50 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title="Edit Pengguna"
                  >
                    <Edit3 :size="15" />
                  </button>

                  <button
                    @click="openDeleteModal(user)"
                    class="p-1.5 rounded-lg text-text-muted hover:text-rose-600 hover:bg-rose-50 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title="Hapus Pengguna"
                  >
                    <Trash2 :size="15" />
                  </button>
                </div>
              </td>
            </tr>

            <!-- Empty Table State -->
            <tr v-if="paginatedUsers.length === 0">
              <td colspan="6" class="py-12 text-center text-text-muted">
                <Users :size="36" class="mx-auto text-text-muted/40 mb-2" />
                <p class="font-bold text-xs text-text-secondary">Tidak ada data pengguna</p>
                <p class="text-[11px] mt-0.5">Coba sesuaikan kata kunci pencarian atau kriteria filter.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Table Footer / Pagination -->
      <div class="p-3 sm:p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
        <span>Menampilkan {{ paginatedUsers.length }} dari {{ filteredUsers.length }} pengguna</span>
        <div class="flex items-center gap-1">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-surface"
          >
            <ChevronLeft :size="14" />
          </button>
          <span class="px-3 font-bold text-text-primary">Halaman {{ currentPage }} dari {{ totalPages }}</span>
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-surface"
          >
            <ChevronRight :size="14" />
          </button>
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
          <h3 class="text-sm font-bold text-text-primary">Hapus Akun Pengguna?</h3>
        </div>

        <p class="text-text-muted leading-relaxed">
          Apakah Anda yakin ingin menghapus akun <strong class="text-text-primary">{{ selectedUserForDelete?.fullName }}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            @click="showDeleteModal = false"
            class="px-4 py-2 rounded-full border border-gray-200 text-text-primary font-semibold hover:bg-surface cursor-pointer"
          >
            Batal
          </button>
          <button
            @click="confirmDeleteUser"
            class="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
          >
            Ya, Hapus Pengguna
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
