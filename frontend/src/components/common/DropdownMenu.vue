<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { MoreVertical } from 'lucide-vue-next'

export interface DropdownItem {
  label: string
  icon?: any
  disabled?: boolean
  divider?: boolean
  onClick?: () => void
}

interface Props {
  items: DropdownItem[]
  position?: 'left' | 'right'
}

withDefaults(defineProps<Props>(), {
  position: 'right',
})

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const toggle = () => {
  isOpen.value = !isOpen.value
}

const close = () => {
  isOpen.value = false
}

const handleItemClick = (item: DropdownItem) => {
  if (!item.disabled && item.onClick) {
    item.onClick()
    close()
  }
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="dropdownRef" class="relative inline-block">
    <!-- Trigger Button -->
    <button
      @click="toggle"
      class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
      aria-label="Open menu"
    >
      <slot name="trigger">
        <MoreVertical :size="18" class="text-gray-600" />
      </slot>
    </button>

    <!-- Dropdown Menu -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        :class="[
          'absolute top-full mt-2 min-w-[180px] bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50',
          position === 'right' ? 'right-0' : 'left-0',
        ]"
      >
        <template v-for="(item, index) in items" :key="index">
          <!-- Divider -->
          <div v-if="item.divider" class="my-1 border-t border-gray-200"></div>

          <!-- Menu Item -->
          <button
            v-else
            @click="handleItemClick(item)"
            :disabled="item.disabled"
            :class="[
              'w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors',
              item.disabled
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-50',
            ]"
          >
            <component v-if="item.icon" :is="item.icon" :size="16" />
            <span>{{ item.label }}</span>
          </button>
        </template>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
