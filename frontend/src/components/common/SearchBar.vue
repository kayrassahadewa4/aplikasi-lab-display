<script setup lang="ts">
import { ref, watch } from 'vue'
import { Search, X } from 'lucide-vue-next'

interface Props {
  modelValue?: string
  placeholder?: string
  debounce?: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search...',
  debounce: 300,
  loading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [value: string]
}>()

const localValue = ref(props.modelValue || '')
let debounceTimeout: ReturnType<typeof setTimeout> | null = null

watch(() => props.modelValue, (newValue) => {
  localValue.value = newValue || ''
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  localValue.value = target.value
  emit('update:modelValue', target.value)

  // Clear existing timeout
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }

  // Set new timeout
  debounceTimeout = setTimeout(() => {
    emit('search', target.value)
  }, props.debounce)
}

const clear = () => {
  localValue.value = ''
  emit('update:modelValue', '')
  emit('search', '')
}
</script>

<template>
  <div class="relative">
    <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
      <Search :size="16" />
    </div>
    <input
      :value="localValue"
      type="text"
      :placeholder="placeholder"
      @input="handleInput"
      class="w-full pl-9 pr-10 py-2 bg-surface/70 border border-gray-200/80 rounded-xl text-xs text-text-primary placeholder:text-text-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary focus:bg-white transition-all duration-150"
    />
    <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
      <div v-if="loading" class="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
      <button
        v-else-if="localValue"
        @click="clear"
        class="text-text-muted hover:text-text-primary p-0.5 rounded-md hover:bg-gray-100 transition-colors"
        aria-label="Clear search"
      >
        <X :size="15" />
      </button>
    </div>
  </div>
</template>
