<script setup lang="ts">
import { Construction } from 'lucide-vue-next'
import { PageHeader, BaseCard } from '@/components'

interface Props {
  title: string
  subtitle?: string
  description: string
}

defineProps<Props>()
</script>

<template>
  <div class="space-y-4">
    <PageHeader :title="title" :subtitle="subtitle" />

    <BaseCard>
      <div class="text-center py-12">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-brand-100/60 text-dark-green rounded-2xl mb-4 border border-brand-200/60">
          <Construction :size="30" stroke-width="1.8" />
        </div>
        <h3 class="text-lg font-bold text-text-primary mb-2">Module Under Development</h3>
        <p class="text-xs text-text-muted max-w-md mx-auto leading-relaxed">{{ description }}</p>
      </div>
    </BaseCard>
  </div>
</template>
