<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, CheckSquare, Users, Calendar, ArrowRight } from 'lucide-vue-next'
import { BaseCard } from '@/components'

const router = useRouter()

interface Props {
  pendingCount?: number
  userCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  pendingCount: 0,
  userCount: 0
})

interface QuickAction {
  id: string
  title: string
  description: string
  icon: any
  path?: string
  badge?: string
  badgeClass?: string
}

const actions = computed<QuickAction[]>(() => [
  {
    id: 'approve-requests',
    title: 'Validasi Permohonan',
    description: 'Tinjau permohonan pinjam lab dosen',
    icon: CheckSquare,
    path: '/admin/room-requests',
    badge: props.pendingCount > 0 ? `${props.pendingCount} Menunggu` : 'Tinjau',
    badgeClass: props.pendingCount > 0
      ? 'bg-accent/90 text-dark-green border-dark-green/10 font-extrabold animate-pulse'
      : 'bg-brand-50 text-dark-green border-brand-200/60 font-semibold',
  },
  {
    id: 'create-schedule',
    title: 'Buat Jadwal Baru',
    description: 'Tambah sesi penggunaan laboratorium',
    icon: Calendar,
    path: '/admin/schedules',
    badge: 'Slot Baru',
    badgeClass: 'bg-brand-100 text-dark-green font-semibold',
  },
  {
    id: 'manage-users',
    title: 'Kelola Pengguna',
    description: 'Atur akun dan hak akses pengguna',
    icon: Users,
    path: '/admin/users',
    badge: props.userCount > 0 ? `${props.userCount} Pengguna` : 'Direktori',
    badgeClass: 'bg-surface border border-gray-200 text-text-muted font-medium',
  },
  {
    id: 'create-announcement',
    title: 'Buat Pengumuman',
    description: 'Kirim informasi broadcast ke pengguna',
    icon: Plus,
    path: '/admin/announcements',
    badge: 'Broadcast',
    badgeClass: 'bg-surface border border-gray-200 text-text-muted font-medium',
  },
])

const handleAction = (action: QuickAction) => {
  if (action.path) {
    router.push(action.path)
  }
}
</script>

<template>
  <BaseCard title="Aksi Cepat Administrator" subtitle="Pintasan menu operasional yang sering digunakan">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <button
        v-for="action in actions"
        :key="action.id"
        @click="handleAction(action)"
        class="p-4 rounded-xl text-left bg-surface/60 border border-gray-200/60 hover:bg-white hover:border-brand-300/60 hover:shadow-md hover:shadow-black/[0.03] transition-all duration-200 group flex flex-col justify-between select-none relative overflow-hidden min-h-[110px]"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="w-9 h-9 rounded-xl bg-brand-100/70 text-dark-green group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all duration-200">
            <component :is="action.icon" :size="18" stroke-width="2" />
          </div>

          <div class="flex items-center gap-1.5">
            <span
              v-if="action.badge"
              :class="['text-[10px] px-2 py-0.5 rounded-full border', action.badgeClass]"
            >
              {{ action.badge }}
            </span>
            <ArrowRight :size="15" class="text-text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
          </div>
        </div>
        
        <div>
          <h4 class="font-bold text-text-primary text-xs sm:text-sm tracking-tight mb-0.5 group-hover:text-dark-green transition-colors">{{ action.title }}</h4>
          <p class="text-[11px] text-text-muted leading-tight truncate">{{ action.description }}</p>
        </div>
      </button>
    </div>
  </BaseCard>
</template>
