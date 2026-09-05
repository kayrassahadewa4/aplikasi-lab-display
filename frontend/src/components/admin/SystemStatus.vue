<script setup lang="ts">
import { Database, Server, Lock, Monitor, CheckCircle, XCircle } from 'lucide-vue-next'
import { BaseCard } from '@/components'

export interface ServiceStatus {
  name: string
  status: 'online' | 'offline'
  icon: any
  lastCheck?: string
}

interface Props {
  services: ServiceStatus[]
}

defineProps<Props>()
</script>

<template>
  <BaseCard title="Status Sistem & Server" subtitle="Kondisi infrastruktur dan database secara real-time">
    <div class="space-y-2.5">
      <div
        v-for="service in services"
        :key="service.name"
        class="flex items-center justify-between p-3 rounded-xl bg-surface/60 border border-gray-200/50 hover:bg-surface transition-colors"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-brand-100/60 text-dark-green flex items-center justify-center">
            <component :is="service.icon" :size="16" stroke-width="2" />
          </div>
          <div>
            <p class="text-xs font-bold text-text-primary leading-tight">{{ service.name }}</p>
            <p v-if="service.lastCheck" class="text-[10.5px] text-text-muted mt-0.5">{{ service.lastCheck }}</p>
          </div>
        </div>

        <div class="flex items-center gap-1.5">
          <span
            :class="[
              'text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 border',
              service.status === 'online'
                ? 'bg-brand-50 text-dark-green border-brand-200/80'
                : 'bg-red-50 text-danger border-red-200/60',
            ]"
          >
            <span :class="['w-1.5 h-1.5 rounded-full', service.status === 'online' ? 'bg-primary-dark animate-pulse' : 'bg-danger']"></span>
            <span>{{ service.status === 'online' ? 'Online' : 'Offline' }}</span>
          </span>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
