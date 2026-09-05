<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Clock, ChevronDown, Check } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue: string // "HH:mm" format (e.g. "08:00", "13:30")
    label?: string
    id?: string
    required?: boolean
    disabled?: boolean
    error?: string
    minHour?: number // 7
    maxHour?: number // 21
    minTime?: string // "07:00"
    maxTime?: string // "21:00"
    stepMinutes?: number // 15 or 30
  }>(),
  {
    modelValue: '08:00',
    minHour: 7,
    maxHour: 21,
    required: false,
    disabled: false,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)

// Parse current modelValue into hour and minute
const currentHour = computed(() => {
  const [h] = (props.modelValue || '08:00').split(':')
  return h || '08'
})

const currentMinute = computed(() => {
  const [, m] = (props.modelValue || '08:00').split(':')
  return m || '00'
})

const effectiveMinHour = computed(() => {
  if (props.minTime) {
    const h = parseInt(props.minTime.split(':')[0] || '7', 10)
    if (!isNaN(h)) return h
  }
  return props.minHour ?? 7
})

const effectiveMaxHour = computed(() => {
  if (props.maxTime) {
    const h = parseInt(props.maxTime.split(':')[0] || '21', 10)
    if (!isNaN(h)) return h
  }
  return props.maxHour ?? 21
})

// Generate Hour options (07 - 21)
const hours = computed(() => {
  const list: string[] = []
  for (let i = effectiveMinHour.value; i <= effectiveMaxHour.value; i++) {
    list.push(String(i).padStart(2, '0'))
  }
  return list
})

// Generate Minute options (00, 15, 30, 45)
const minutes = ['00', '15', '30', '45']

const selectHour = (h: string) => {
  emit('update:modelValue', `${h}:${currentMinute.value}`)
}

const selectMinute = (m: string) => {
  emit('update:modelValue', `${currentHour.value}:${m}`)
  isOpen.value = false // Close on minute selection
}

const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

// Click outside & Esc key handlers
const handleClickOutside = (e: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isOpen.value) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div ref="containerRef" class="space-y-1.5 w-full relative select-none">
    <!-- Field Label Header -->
    <div v-if="label" class="flex items-center justify-between">
      <label :for="id" class="block text-xs font-bold text-text-primary">
        {{ label }} <span v-if="required" class="text-danger">*</span>
      </label>
      <span class="text-[10px] font-bold text-dark-green uppercase tracking-wider">WIB (24h)</span>
    </div>

    <!-- Trigger Input Box -->
    <div
      :id="id"
      @click="toggleDropdown"
      :class="[
        'w-full flex items-center justify-between px-3.5 py-2.5 bg-surface/60 border rounded-xl text-xs font-bold transition-all cursor-pointer select-none',
        isOpen ? 'ring-2 ring-dark-green/25 border-dark-green bg-white shadow-xs' : 'border-gray-200/80 hover:bg-surface/80',
        error ? 'border-danger bg-red-50/30' : '',
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
      ]"
      tabindex="0"
      @keydown.enter.prevent="toggleDropdown"
      @keydown.space.prevent="toggleDropdown"
    >
      <div class="flex items-center gap-2.5">
        <Clock :size="15" class="text-text-muted shrink-0" />
        <span class="text-text-primary font-mono text-sm tracking-tight">{{ modelValue }}</span>
        <span class="px-1.5 py-0.2 rounded bg-brand-100/80 text-dark-green text-[10px] font-bold">WIB</span>
      </div>

      <ChevronDown
        :size="14"
        :class="['text-text-muted transition-transform duration-200', isOpen ? 'rotate-180 text-dark-green' : '']"
      />
    </div>

    <!-- Compact Floating Popover -->
    <div
      v-if="isOpen"
      class="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-2xl border border-gray-200/90 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2.5"
    >
      <div class="flex items-center justify-between pb-1.5 border-b border-gray-100 text-[11px] font-bold text-text-muted">
        <span>Pilih Jam</span>
        <span>Pilih Menit</span>
      </div>

      <!-- 2-Column Time Selector Grid -->
      <div class="grid grid-cols-2 gap-2 h-44">
        <!-- Hours Column -->
        <div class="overflow-y-auto pr-1 space-y-1 max-h-44 scrollbar-thin">
          <button
            type="button"
            v-for="h in hours"
            :key="h"
            @click.stop="selectHour(h)"
            :class="[
              'w-full py-1.5 px-2 rounded-lg text-xs font-bold font-mono transition-all text-center flex items-center justify-between cursor-pointer',
              currentHour === h
                ? 'bg-dark-green text-white shadow-2xs'
                : 'text-text-primary hover:bg-brand-50 hover:text-dark-green'
            ]"
          >
            <span>{{ h }}:00</span>
            <Check v-if="currentHour === h" :size="12" />
          </button>
        </div>

        <!-- Minutes Column -->
        <div class="overflow-y-auto pl-1 space-y-1 border-l border-gray-100 max-h-44 scrollbar-thin">
          <button
            type="button"
            v-for="m in minutes"
            :key="m"
            @click.stop="selectMinute(m)"
            :class="[
              'w-full py-1.5 px-2 rounded-lg text-xs font-bold font-mono transition-all text-center flex items-center justify-between cursor-pointer',
              currentMinute === m
                ? 'bg-dark-green text-white shadow-2xs'
                : 'text-text-primary hover:bg-brand-50 hover:text-dark-green'
            ]"
          >
            <span>:{{ m }}</span>
            <Check v-if="currentMinute === m" :size="12" />
          </button>
        </div>
      </div>

      <!-- Quick Footer -->
      <div class="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
        <span class="text-text-muted">Dipilih: <strong class="text-dark-green font-mono">{{ modelValue }} WIB</strong></span>
        <button
          type="button"
          @click.stop="isOpen = false"
          class="text-xs font-bold text-dark-green hover:underline cursor-pointer"
        >
          Selesai
        </button>
      </div>
    </div>

    <p v-if="error" class="text-[11px] text-danger font-medium">{{ error }}</p>
  </div>
</template>
