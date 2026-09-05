<script setup lang="ts">
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-vue-next'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

interface Props {
  modelValue: boolean
  type?: 'danger' | 'warning' | 'info' | 'success'
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'warning',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  loading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

const close = () => {
  emit('update:modelValue', false)
}

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
  close()
}

const iconConfig = {
  danger: { component: AlertCircle, class: 'text-danger', bgClass: 'bg-red-50 text-danger border border-red-200' },
  warning: { component: AlertTriangle, class: 'text-amber-600', bgClass: 'bg-amber-50 text-amber-600 border border-amber-200' },
  info: { component: Info, class: 'text-dark-green', bgClass: 'bg-brand-50 text-dark-green border border-brand-200' },
  success: { component: CheckCircle, class: 'text-dark-green', bgClass: 'bg-emerald-50 text-dark-green border border-emerald-200' },
}

const buttonVariant = {
  danger: 'danger',
  warning: 'warning',
  info: 'primary',
  success: 'success',
} as const
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    @update:model-value="close"
    size="sm"
    :close-on-backdrop="!loading"
    :close-on-esc="!loading"
  >
    <div class="text-center py-2">
      <!-- Icon -->
      <div :class="['mx-auto flex items-center justify-center h-12 w-12 rounded-2xl mb-3.5 shadow-2xs', iconConfig[type].bgClass]">
        <component :is="iconConfig[type].component" :size="22" stroke-width="2" />
      </div>

      <!-- Title -->
      <h3 v-if="title" class="text-base font-bold text-text-primary mb-1.5">{{ title }}</h3>

      <!-- Message -->
      <p class="text-xs text-text-muted leading-relaxed mb-4">{{ message }}</p>
    </div>

    <template #footer>
      <div class="flex gap-2.5 justify-end">
        <BaseButton
          variant="secondary"
          @click="handleCancel"
          :disabled="loading"
          size="sm"
        >
          {{ cancelText }}
        </BaseButton>
        <BaseButton
          :variant="buttonVariant[type]"
          @click="handleConfirm"
          :loading="loading"
          :disabled="loading"
          size="sm"
        >
          {{ confirmText }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
