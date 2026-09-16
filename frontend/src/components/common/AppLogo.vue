<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    showText?: boolean
    collapsed?: boolean
    dark?: boolean
  }>(),
  {
    size: 'md',
    showText: true,
    collapsed: false,
    dark: false,
  }
)

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'w-6 h-6'
    case 'sm':
      return 'w-8 h-8'
    case 'md':
      return 'w-10 h-10'
    case 'lg':
      return 'w-12 h-12'
    case 'xl':
      return 'w-16 h-16'
    default:
      return 'w-10 h-10'
  }
})
</script>

<template>
  <div :class="['flex items-center select-none min-w-0', collapsed ? 'justify-center w-full' : 'gap-2.5']">
    <!-- UPNVJ Official Emblem -->
    <div :class="['shrink-0 flex items-center justify-center', sizeClasses]">
      <img
        src="/images/logo-upnvj.webp"
        alt="Logo UPN Veteran Jakarta"
        class="w-full h-full object-contain drop-shadow-md"
        loading="eager"
      />
    </div>

    <!-- Branding Title (Hidden when collapsed) -->
    <div v-if="showText && !collapsed" class="min-w-0 flex-1">
      <div class="flex items-center gap-1.5 leading-none">
        <span :class="['text-base font-extrabold tracking-tight', dark ? 'text-white' : 'text-text-primary']">Lab</span>
        <span :class="['text-base font-extrabold tracking-tight', dark ? 'text-amber-400' : 'text-dark-green']">Display</span>
      </div>
      <p :class="['text-[9.5px] font-bold tracking-tight mt-0.5 whitespace-nowrap leading-tight', dark ? 'text-emerald-200/90' : 'text-text-muted']">
        FIK UPN VETERAN JAKARTA
      </p>
    </div>
  </div>
</template>
