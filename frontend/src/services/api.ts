import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { appConfig } from '@/config/app.config'
import { tokenStorage, sessionManager } from '@/utils'

const apiClient: AxiosInstance = axios.create({
  baseURL: appConfig.api.baseUrl,
  timeout: appConfig.api.timeout,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Request interceptor - Inject JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor - Handle authentication errors and extract backend messages
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      // Clear session and redirect to login
      sessionManager.clearSession()

      // Avoid redirect loop if already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    // Extract backend error message for better error display
    if (error.response?.data) {
      // Backend typically returns: { statusCode, message, error }
      const backendMessage = error.response.data.message
      const backendError = error.response.data.error

      if (backendMessage) {
        // Replace generic Axios message with actual backend message
        error.message = Array.isArray(backendMessage)
          ? backendMessage.join(', ')
          : backendMessage
      } else if (backendError) {
        error.message = backendError
      }
    }

    // Handle 403 Forbidden - insufficient permissions
    // User remains authenticated but cannot access resource
    // Frontend should handle this with appropriate UI feedback

    return Promise.reject(error)
  },
)

export default apiClient
