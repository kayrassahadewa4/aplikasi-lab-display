<script setup lang="ts">
import { Clock, CheckCircle2, PlusCircle, Edit3, XCircle } from 'lucide-vue-next'
import { BaseCard } from '@/components'

export interface Activity {
  id: string
  user: string
  action: string
  target: string
  timestamp: string
  type: 'create' | 'update' | 'delete' | 'approve' | 'reject'
}

interface Props {
  activities: Activity[]
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false,
})

const getIcon = (type: Activity['type']) => {
  switch (type) {
    case 'approve': return CheckCircle2
    case 'create': return PlusCircle
    case 'update': return Edit3
    case 'reject': return XCircle
    default: return Clock
  }
}

const typeStyles: Record<Activity['type'], { iconColor: string; actionColor: string }> = {
  approve: { iconColor: 'text-primary-dark bg-brand-100/80', actionColor: 'text-primary-dark font-semibold' },
  create: { iconColor: 'text-dark-green bg-brand-200/50', actionColor: 'text-dark-green font-semibold' },
  update: { iconColor: 'text-primary bg-brand-100/60', actionColor: 'text-primary-dark font-medium' },
  reject: { iconColor: 'text-danger bg-red-50', actionColor: 'text-danger font-semibold' },
  delete: { iconColor: 'text-danger bg-red-50', actionColor: 'text-danger font-semibold' },
}
</script>

<template>
  <BaseCard title="Aktivitas & Riwayat Sistem" subtitle="Log tindakan dan peristiwa administratif terkini" :loading="loading">
    <div v-if="activities.length === 0" class="text-center py-8 text-text-muted text-xs">
      Belum ada aktivitas terbaru yang tercatat
    </div>
    
    <div v-else class="relative pl-2 space-y-5 before:absolute before:left-[19px] before:top-3 before:bottom-3 before:w-px before:bg-gray-200/80">
      <div
        v-for="activity in activities"
        :key="activity.id"
        class="flex items-start gap-3.5 relative group"
      >
        <!-- Icon Badge -->
        <div :class="['w-7 h-7 rounded-lg flex items-center justify-center shrink-0 z-10 shadow-2xs border border-white', typeStyles[activity.type]?.iconColor || 'text-text-muted bg-gray-100']">
          <component :is="getIcon(activity.type)" :size="14" stroke-width="2.2" />
        </div>
        
        <!-- Activity Details -->
        <div class="flex-1 min-w-0 pt-0.5">
          <p class="text-xs text-text-primary leading-snug">
            <span class="font-bold text-text-primary">{{ activity.user }}</span>
            <span :class="['mx-1', typeStyles[activity.type]?.actionColor]">{{ activity.action }}</span>
            <span class="font-medium text-text-secondary">{{ activity.target }}</span>
          </p>
          <p class="text-[11px] text-text-muted mt-1 font-normal flex items-center gap-1">
            <Clock :size="11" class="text-text-muted/70" />
            <span>{{ activity.timestamp }}</span>
          </p>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
