<script setup lang="ts">
import type { Component } from 'vue'

interface Props {
  title: string
  value: string | number
  icon?: Component
  iconBgClass?: string
  iconColorClass?: string
  subtext?: string
  clickable?: boolean
}

withDefaults(defineProps<Props>(), {
  clickable: false,
  iconBgClass: 'bg-emerald-50 border border-emerald-200/60',
  iconColorClass: 'text-dark-green',
})
</script>

<template>
  <div
    :class="[
      'bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center justify-between transition-all duration-300 ease-out group relative select-none overflow-hidden hover:-translate-y-1 hover:border-dark-green/40 hover:shadow-lg hover:shadow-emerald-950/5',
      clickable ? 'cursor-pointer focus-visible:ring-2 focus-visible:ring-dark-green/30 focus-visible:outline-none' : 'cursor-default'
    ]"
    :tabindex="clickable ? 0 : undefined"
  >
    <!-- Institutional Top Accent Bar (UPN Green & Gold) -->
    <div class="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#0c5a30] via-emerald-500 to-amber-400 opacity-70 group-hover:opacity-100 transition-opacity duration-300" />

    <!-- Ambient Hover Glow -->
    <div class="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-emerald-100/30 blur-2xl pointer-events-none group-hover:bg-emerald-200/40 transition-colors duration-300" />

    <div class="space-y-1 relative z-10 min-w-0 pr-2">
      <span class="text-text-muted text-[10.5px] font-black uppercase tracking-wider block transition-colors duration-200 group-hover:text-dark-green truncate">
        {{ title }}
      </span>
      <span class="text-2xl sm:text-3xl font-black text-text-primary block tracking-tight transition-all duration-200 group-hover:text-dark-green group-hover:translate-x-0.5">
        {{ value }}
      </span>
      <span v-if="subtext" class="text-[11px] text-text-muted font-medium block truncate">
        {{ subtext }}
      </span>
    </div>

    <div
      v-if="icon"
      :class="[
        'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs transition-all duration-300 group-hover:scale-110 group-hover:shadow-md ring-1 ring-black/5 relative z-10',
        iconBgClass,
        iconColorClass
      ]"
    >
      <component :is="icon" :size="22" stroke-width="2.2" />
    </div>
  </div>
</template>
