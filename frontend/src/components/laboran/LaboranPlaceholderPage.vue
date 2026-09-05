<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Clock, Sparkles } from 'lucide-vue-next'

interface Props {
  title?: string
  description?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Laboran Portal Module',
  description: 'This feature module is currently under active development for Laboratory Staff.',
})

const route = useRoute()
const router = useRouter()

const moduleTitle = computed(() => {
  if (props.title !== 'Laboran Portal Module') return props.title
  const path = route.path.split('/').pop() || 'Module'
  return path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ')
})
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6 select-none pb-12">
    <div class="pb-3 border-b border-gray-200/60 flex items-center justify-between">
      <div>
        <button
          @click="router.push('/laboran')"
          class="inline-flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-dark-green transition-colors cursor-pointer mb-2"
        >
          <ArrowLeft :size="14" />
          <span>Back to Laboran Dashboard</span>
        </button>

        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-extrabold text-text-primary tracking-tight">
            {{ moduleTitle }}
          </h1>
          <span class="px-2.5 py-0.5 rounded-full bg-brand-100 text-dark-green text-[11px] font-bold">
            Laboran Module
          </span>
        </div>
      </div>
    </div>

    <div class="bg-white p-8 sm:p-12 rounded-2xl border border-gray-200/70 shadow-2xs text-center space-y-4">
      <div class="w-14 h-14 rounded-2xl bg-brand-100/80 text-dark-green flex items-center justify-center mx-auto shadow-xs">
        <Sparkles :size="28" />
      </div>

      <div class="space-y-1 max-w-md mx-auto">
        <h3 class="text-lg font-bold text-text-primary">{{ moduleTitle }} Management</h3>
        <p class="text-xs text-text-muted leading-relaxed">
          {{ description }}
        </p>
      </div>

      <div class="pt-4 flex items-center justify-center gap-3">
        <button
          @click="router.push('/laboran')"
          class="px-5 py-2.5 rounded-full bg-dark-green hover:bg-[#547a5c] text-white text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
        >
          Return to Laboran Dashboard
        </button>
      </div>
    </div>
  </div>
</template>
