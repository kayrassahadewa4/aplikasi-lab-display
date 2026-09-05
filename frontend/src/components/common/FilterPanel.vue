<script setup lang="ts">
import { Filter, X } from 'lucide-vue-next'
import BaseButton from './BaseButton.vue'

interface Props {
  modelValue?: boolean
  hasActiveFilters?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  hasActiveFilters: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  reset: []
  apply: []
}>()

const togglePanel = () => {
  emit('update:modelValue', !props.modelValue)
}

const handleReset = () => {
  emit('reset')
}

const handleApply = () => {
  emit('apply')
  emit('update:modelValue', false)
}
</script>

<template>
  <div>
    <!-- Toggle Button -->
    <BaseButton
      variant="outline"
      @click="togglePanel"
      :class="{ 'ring-2 ring-blue-500': hasActiveFilters }"
    >
      <template #icon>
        <Filter :size="18" />
      </template>
      Filters
      <span v-if="hasActiveFilters" class="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
        Active
      </span>
    </BaseButton>

    <!-- Filter Panel -->
    <Transition name="slide">
      <div
        v-if="modelValue"
        class="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
      >
        <!-- Filter Content -->
        <div class="space-y-4 mb-4">
          <slot />
        </div>

        <!-- Actions -->
        <div class="flex gap-2 justify-end pt-4 border-t border-gray-200">
          <BaseButton
            variant="outline"
            size="sm"
            @click="handleReset"
          >
            <template #icon>
              <X :size="16" />
            </template>
            Reset
          </BaseButton>
          <BaseButton
            variant="primary"
            size="sm"
            @click="handleApply"
          >
            Apply Filters
          </BaseButton>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
