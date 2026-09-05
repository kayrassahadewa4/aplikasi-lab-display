<script setup lang="ts">
import type { Component } from 'vue'
import { ArrowUpRight, TrendingUp, TrendingDown } from 'lucide-vue-next'

interface Props {
  title: string
  value: string | number
  icon: Component
  highlighted?: boolean
  attention?: boolean
  subtext?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

withDefaults(defineProps<Props>(), {
  highlighted: false,
  attention: false,
})
</script>

<template>
  <div
    :class="[
      'rounded-2xl p-5 transition-all duration-300 ease-out group relative overflow-hidden select-none flex flex-col justify-between min-h-[142px] cursor-pointer hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-dark-green/30 focus-visible:outline-none shadow-2xs hover:shadow-lg hover:shadow-emerald-950/5',
      highlighted
        ? 'bg-gradient-to-br from-[#0c5a30] via-[#094726] to-[#06331b] text-white shadow-md shadow-emerald-950/20 border border-emerald-700/40 hover:border-amber-400/50'
        : attention
          ? 'bg-white text-text-primary border border-amber-300/80 ring-2 ring-amber-400/20 hover:border-amber-400 hover:bg-brand-50/20'
          : 'bg-white text-text-primary border border-gray-200/80 hover:border-dark-green/40 hover:bg-brand-50/20'
    ]"
    tabindex="0"
  >
    <!-- Top Accent Line -->
    <div
      :class="[
        'absolute top-0 left-0 right-0 h-[3px] transition-opacity duration-300',
        highlighted
          ? 'bg-gradient-to-r from-amber-400 via-emerald-300 to-amber-400 opacity-90'
          : 'bg-gradient-to-r from-[#0c5a30] via-emerald-500 to-amber-400 opacity-60 group-hover:opacity-100'
      ]"
    />

    <!-- Ambient Radial Glow -->
    <div
      :class="[
        'absolute -right-8 -bottom-8 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity duration-300',
        highlighted ? 'bg-emerald-400/20 group-hover:bg-amber-400/20' : 'bg-emerald-100/40 group-hover:bg-emerald-200/50'
      ]"
    />

    <!-- Top Row: Title + Arrow Badge -->
    <div class="flex items-center justify-between gap-2 mb-2 relative z-10">
      <div class="flex items-center gap-2.5">
        <div
          :class="[
            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-all duration-300 group-hover:scale-110',
            highlighted
              ? 'bg-white/15 text-amber-300 border border-white/20 group-hover:bg-white/25'
              : 'bg-emerald-50 text-dark-green border border-emerald-200/60 group-hover:bg-emerald-100'
          ]"
        >
          <component :is="icon" :size="18" stroke-width="2.2" />
        </div>
        <h3
          :class="[
            'text-xs font-black tracking-tight transition-colors duration-200',
            highlighted ? 'text-white/95' : 'text-text-primary group-hover:text-dark-green'
          ]"
        >
          {{ title }}
        </h3>
      </div>

      <!-- Top-right Diagonal Arrow Badge -->
      <div
        :class="[
          'w-7 h-7 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 group-hover:scale-110 group-hover:rotate-45',
          highlighted
            ? 'bg-amber-400 text-emerald-950 border-amber-300 font-bold'
            : 'bg-surface text-text-muted border-gray-200 group-hover:border-dark-green group-hover:text-white group-hover:bg-dark-green'
        ]"
      >
        <ArrowUpRight :size="13" stroke-width="2.5" />
      </div>
    </div>

    <!-- Middle: Metric Value -->
    <div class="my-1 relative z-10">
      <p
        :class="[
          'text-3xl sm:text-4xl font-black tracking-tight leading-none font-sans transition-all duration-200 group-hover:translate-x-0.5',
          highlighted ? 'text-white' : 'text-text-primary group-hover:text-dark-green'
        ]"
      >
        {{ value }}
      </p>
    </div>

    <!-- Bottom: Trend & Subtext -->
    <div
      class="mt-2 pt-2 border-t flex items-center gap-1.5 text-[11px] relative z-10"
      :class="highlighted ? 'border-white/10' : 'border-gray-100/60'"
    >
      <div
        v-if="trend"
        :class="[
          'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md font-black text-[10.5px]',
          highlighted
            ? (trend.isPositive ? 'bg-amber-400/25 text-amber-300' : 'bg-rose-500/25 text-rose-200')
            : (trend.isPositive ? 'bg-emerald-100 text-dark-green' : 'bg-rose-50 text-rose-600')
        ]"
      >
        <component :is="trend.isPositive ? TrendingUp : TrendingDown" :size="11" />
        <span>{{ Math.abs(trend.value) }}%</span>
      </div>

      <span
        :class="[
          'truncate font-semibold text-[11px]',
          highlighted ? 'text-emerald-100/80' : 'text-text-muted'
        ]"
      >
        {{ subtext || (trend ? 'vs last month' : 'Active system count') }}
      </span>
    </div>
  </div>
</template>
