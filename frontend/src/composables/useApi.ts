import { ref } from 'vue'
import type { Ref } from 'vue'
import apiClient from '@/services/api'
import type { AxiosError, AxiosRequestConfig } from 'axios'

interface UseApiOptions<T> {
  immediate?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export function useApi<T = unknown>(
  url: string,
  config?: AxiosRequestConfig,
  options: UseApiOptions<T> = {},
) {
  const data: Ref<T | null> = ref(null)
  const error: Ref<Error | null> = ref(null)
  const loading = ref(false)

  const execute = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await apiClient.request<T>({
        url,
        ...config,
      })
      data.value = response.data
      if (options.onSuccess) {
        options.onSuccess(response.data)
      }
      return response.data
    } catch (err) {
      const axiosError = err as AxiosError
      error.value = new Error(axiosError.message)
      if (options.onError) {
        options.onError(error.value)
      }
      throw error.value
    } finally {
      loading.value = false
    }
  }

  if (options.immediate) {
    execute()
  }

  return {
    data,
    error,
    loading,
    execute,
  }
}
