<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue?: string
  label?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  error?: string
  hint?: string
  required?: boolean
  rows?: number
  maxLength?: number
  showCounter?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  rows: 4,
  disabled: false,
  readonly: false,
  required: false,
  showCounter: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

const characterCount = computed(() => props.modelValue?.length || 0)
const counterText = computed(() => {
  if (props.maxLength) {
    return `${characterCount.value}/${props.maxLength}`
  }
  return `${characterCount.value}`
})
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="block text-xs font-bold text-text-secondary mb-1">
      {{ label }}
      <span v-if="required" class="text-danger ml-0.5">*</span>
    </label>
    <textarea
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :rows="rows"
      :maxlength="maxLength"
      @input="handleInput"
      :class="[
        'w-full px-3 py-2 border rounded-xl resize-y text-xs text-text-primary placeholder:text-text-muted/70 bg-white transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary',
        'disabled:bg-gray-100 disabled:cursor-not-allowed',
        'read-only:bg-gray-50',
        error ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500' : 'border-gray-200/80',
      ]"
    />
    <div class="flex justify-between items-center mt-1">
      <div>
        <p v-if="error" class="text-xs font-medium text-danger">{{ error }}</p>
        <p v-else-if="hint" class="text-xs text-text-muted">{{ hint }}</p>
      </div>
      <p v-if="showCounter" class="text-[11px] font-mono text-text-muted">{{ counterText }}</p>
    </div>
  </div>
</template>
