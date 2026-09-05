<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue?: string | number
  label?: string
  placeholder?: string
  type?: string
  disabled?: boolean
  readonly?: boolean
  error?: string
  hint?: string
  required?: boolean
  prefixIcon?: any
  suffixIcon?: any
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  readonly: false,
  required: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const hasPrefix = computed(() => !!props.prefixIcon)
const hasSuffix = computed(() => !!props.suffixIcon)
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="block text-xs font-bold text-text-secondary mb-1">
      {{ label }}
      <span v-if="required" class="text-danger ml-0.5">*</span>
    </label>
    <div class="relative">
      <div v-if="hasPrefix" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
        <component :is="prefixIcon" :size="16" />
      </div>
      <input
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        @input="handleInput"
        :class="[
          'w-full px-3 py-2 border rounded-xl text-xs text-text-primary placeholder:text-text-muted/70 bg-white transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary',
          'disabled:bg-gray-100 disabled:cursor-not-allowed',
          'read-only:bg-gray-50',
          hasPrefix ? 'pl-10' : '',
          hasSuffix ? 'pr-10' : '',
          error ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500' : 'border-gray-200/80',
        ]"
      />
      <div v-if="hasSuffix" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
        <component :is="suffixIcon" :size="16" />
      </div>
    </div>
    <p v-if="error" class="mt-1 text-xs font-medium text-danger">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-xs text-text-muted">{{ hint }}</p>
  </div>
</template>
