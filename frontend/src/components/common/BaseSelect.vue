<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

interface Props {
  modelValue?: string | number
  options: SelectOption[]
  label?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  hint?: string
  required?: boolean
}

withDefaults(defineProps<Props>(), {
  placeholder: 'Select an option',
  disabled: false,
  required: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="block text-xs font-bold text-text-secondary mb-1">
      {{ label }}
      <span v-if="required" class="text-danger ml-0.5">*</span>
    </label>
    <div class="relative">
      <select
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        @change="handleChange"
        :class="[
          'w-full px-3 py-2 pr-10 border rounded-xl appearance-none text-xs text-text-primary bg-white transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary',
          'disabled:bg-gray-100 disabled:cursor-not-allowed',
          error ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500' : 'border-gray-200/80',
        ]"
      >
        <option value="" disabled selected>{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </select>
      <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
        <ChevronDown :size="16" />
      </div>
    </div>
    <p v-if="error" class="mt-1 text-xs font-medium text-danger">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-xs text-text-muted">{{ hint }}</p>
  </div>
</template>
