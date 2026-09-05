import { ref, computed } from 'vue'

export interface ValidationRule<T = any> {
  message: string
  validator: (value: T) => boolean
}

export function useForm<T extends Record<string, any>>(initialValues: T) {
  // Form state - using plain refs instead of reactive for better type safety
  const formData = ref<T>({ ...initialValues })
  const errors = ref<Partial<Record<keyof T, string | null>>>({})
  const touched = ref<Partial<Record<keyof T, boolean>>>({})
  const isSubmitting = ref(false)
  const isDirty = ref(false)

  // Validation rules storage
  const rules = ref<Partial<Record<keyof T, ValidationRule[]>>>({})

  // Set validation rules
  const setFieldRules = (field: keyof T, fieldRules: ValidationRule[]) => {
    rules.value[field] = fieldRules
  }

  // Validate a single field
  const validateField = (field: keyof T): boolean => {
    const fieldRules = rules.value[field]
    if (!fieldRules || fieldRules.length === 0) {
      errors.value[field] = null
      return true
    }

    for (const rule of fieldRules) {
      if (!rule.validator(formData.value[field])) {
        errors.value[field] = rule.message
        return false
      }
    }

    errors.value[field] = null
    return true
  }

  // Validate all fields
  const validateForm = (): boolean => {
    let isValid = true
    for (const field in formData.value) {
      if (!validateField(field as keyof T)) {
        isValid = false
      }
    }
    return isValid
  }

  // Set field value
  const setFieldValue = (field: keyof T, value: any) => {
    formData.value[field] = value
    touched.value[field] = true
    isDirty.value = true
    validateField(field)
  }

  // Set field error
  const setFieldError = (field: keyof T, error: string | null) => {
    errors.value[field] = error
  }

  // Clear field error
  const clearFieldError = (field: keyof T) => {
    errors.value[field] = null
  }

  // Clear all errors
  const clearErrors = () => {
    errors.value = {}
  }

  // Reset form
  const resetForm = () => {
    formData.value = { ...initialValues }
    errors.value = {}
    touched.value = {}
    isDirty.value = false
    isSubmitting.value = false
  }

  // Set form values
  const setFormValues = (values: Partial<T>) => {
    formData.value = { ...formData.value, ...values }
    isDirty.value = true
  }

  // Handle form submission
  const handleSubmit = async (onSubmit: (values: T) => Promise<void> | void) => {
    // Mark all fields as touched
    for (const field in formData.value) {
      touched.value[field as keyof T] = true
    }

    // Validate form
    if (!validateForm()) {
      return
    }

    isSubmitting.value = true
    try {
      await onSubmit(formData.value)
    } catch (error) {
      // Error handling is done by the caller
      throw error
    } finally {
      isSubmitting.value = false
    }
  }

  // Computed properties
  const isValid = computed(() => {
    return Object.values(errors.value).every(error => !error)
  })

  const hasErrors = computed(() => !isValid.value)

  return {
    // State
    formData,
    errors,
    touched,
    isSubmitting,
    isDirty,
    isValid,
    hasErrors,

    // Methods
    setFieldRules,
    validateField,
    validateForm,
    setFieldValue,
    setFieldError,
    clearFieldError,
    clearErrors,
    resetForm,
    setFormValues,
    handleSubmit,
  }
}

// Common validation rules
export const validators = {
  required: (message = 'This field is required'): ValidationRule => ({
    message,
    validator: (value: any) => {
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'string') return value.trim().length > 0
      return value !== null && value !== undefined
    },
  }),

  email: (message = 'Invalid email address'): ValidationRule => ({
    message,
    validator: (value: string) => {
      if (!value) return true
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value)
    },
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    message: message || `Minimum length is ${min} characters`,
    validator: (value: string) => {
      if (!value) return true
      return value.length >= min
    },
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    message: message || `Maximum length is ${max} characters`,
    validator: (value: string) => {
      if (!value) return true
      return value.length <= max
    },
  }),

  min: (min: number, message?: string): ValidationRule => ({
    message: message || `Minimum value is ${min}`,
    validator: (value: number) => {
      if (value === null || value === undefined) return true
      return value >= min
    },
  }),

  max: (max: number, message?: string): ValidationRule => ({
    message: message || `Maximum value is ${max}`,
    validator: (value: number) => {
      if (value === null || value === undefined) return true
      return value <= max
    },
  }),

  pattern: (regex: RegExp, message = 'Invalid format'): ValidationRule => ({
    message,
    validator: (value: string) => {
      if (!value) return true
      return regex.test(value)
    },
  }),

  custom: (validator: (value: any) => boolean, message: string): ValidationRule => ({
    message,
    validator,
  }),
}
