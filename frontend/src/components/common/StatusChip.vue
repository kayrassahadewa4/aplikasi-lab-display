<script setup lang="ts">
import { computed } from 'vue'

type StatusType =
  | 'ACTIVE' | 'INACTIVE'
  | 'APPROVED' | 'PENDING' | 'REJECTED' | 'CANCELLED'
  | 'FINISHED' | 'SCHEDULED' | 'IN_PROGRESS'
  | 'OCCUPIED' | 'AVAILABLE' | 'MAINTENANCE' | 'CLOSED'
  | 'CHECKED_IN' | 'CHECKED_OUT'

interface Props {
  status: StatusType
}

const props = defineProps<Props>()

const statusConfig = {
  // User/Entity Status
  ACTIVE: { label: 'Aktif', variant: 'success' },
  INACTIVE: { label: 'Nonaktif', variant: 'neutral' },

  // Request/Approval Status
  APPROVED: { label: 'Disetujui', variant: 'success' },
  PENDING: { label: 'Menunggu Persetujuan', variant: 'warning' },
  REJECTED: { label: 'Ditolak', variant: 'danger' },
  CANCELLED: { label: 'Dibatalkan', variant: 'neutral' },

  // Schedule/Activity Status
  FINISHED: { label: 'Selesai', variant: 'neutral' },
  SCHEDULED: { label: 'Terjadwal', variant: 'info' },
  IN_PROGRESS: { label: 'Sedang Berjalan', variant: 'warning' },

  // Laboratory Status
  OCCUPIED: { label: 'Sedang Dipakai', variant: 'danger' },
  AVAILABLE: { label: 'Tersedia', variant: 'success' },
  MAINTENANCE: { label: 'Pemeliharaan', variant: 'warning' },
  CLOSED: { label: 'Ditutup', variant: 'neutral' },

  // Usage Status
  CHECKED_IN: { label: 'Sedang Digunakan', variant: 'success' },
  CHECKED_OUT: { label: 'Selesai Sesi', variant: 'neutral' },
} as const

const config = computed(() => statusConfig[props.status] || { label: props.status, variant: 'neutral' })

const variantClasses = {
  success: 'bg-emerald-50 text-dark-green border-emerald-200/90 font-extrabold',
  danger: 'bg-rose-50 text-rose-700 border-rose-200 font-extrabold',
  warning: 'bg-amber-50 text-amber-800 border-amber-200 font-extrabold',
  info: 'bg-sky-50 text-sky-800 border-sky-200 font-extrabold',
  neutral: 'bg-gray-100 text-gray-700 border-gray-200 font-bold',
}

const dotClasses = {
  success: 'bg-emerald-500',
  danger: 'bg-rose-500',
  warning: 'bg-amber-500',
  info: 'bg-sky-500',
  neutral: 'bg-gray-400',
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] border transition-all duration-150 shadow-2xs select-none',
      variantClasses[config.variant],
    ]"
  >
    <span
      :class="[
        'w-1.5 h-1.5 rounded-full shrink-0',
        dotClasses[config.variant],
        config.variant === 'success' ? 'animate-pulse ring-2 ring-emerald-300/40' : ''
      ]"
    />
    <span>{{ config.label }}</span>
  </span>
</template>
