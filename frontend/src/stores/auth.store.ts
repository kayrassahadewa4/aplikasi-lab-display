import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginCredentials, GoogleLoginPayload } from '@/types'
import { authService } from '@/services'
import { sessionManager } from '@/utils'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const isAuthenticated = computed(() => !!user.value)
  const userRole = computed(() => user.value?.role?.code || null)
  const userName = computed(() => user.value?.full_name || '')
  const userEmail = computed(() => user.value?.email || '')
  const userAvatar = computed(() => user.value?.avatar_url || null)

  // Actions
  const register = async (payload: {
    full_name: string
    email: string
    password: string
    phone?: string
    role_code: 'DOSEN' | 'LABORAN'
  }) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await authService.register(payload)
      user.value = response.user
      return response
    } catch (err: any) {
      error.value = err instanceof Error ? err.message : 'Registration failed. Please check your details.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const login = async (credentials: LoginCredentials) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await authService.login(credentials)
      user.value = response.user
      return response.user
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const googleLogin = async (payload: GoogleLoginPayload) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await authService.googleLogin(payload)
      user.value = response.user
      return response.user
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login Google gagal'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    isLoading.value = true
    error.value = null

    try {
      await authService.logout()
      user.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Logout failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const setUser = (newUser: User | null) => {
    user.value = newUser
  }

  const clearUser = () => {
    user.value = null
    error.value = null
  }

  const restoreSession = async () => {
    const { user: savedUser, hasToken } = sessionManager.restoreSession()

    // If we have a token, verify it with the backend
    if (hasToken) {
      try {
        const currentUser = await authService.getCurrentUser()
        user.value = currentUser
        return true
      } catch (error) {
        // Token is invalid, clear session
        sessionManager.clearSession()
        user.value = null
        return false
      }
    }

    // No token, not authenticated
    user.value = null
    return false
  }

  const clearError = () => {
    error.value = null
  }

  // Initialize: Try to restore session
  const initialized = ref(false)
  const isInitializing = ref(false)
  let initializationPromise: Promise<void> | null = null

  const initialize = async () => {
    if (initialized.value) return

    if (isInitializing.value && initializationPromise) {
      // Another guard is already initializing — wait for it to complete
      await initializationPromise
      return
    }

    isInitializing.value = true
    initializationPromise = (async () => {
      try {
        await restoreSession()
      } finally {
        initialized.value = true
        isInitializing.value = false
        initializationPromise = null
      }
    })()

    await initializationPromise
  }

  const updateUserAvatar = (avatarUrl: string | null) => {
    if (user.value) {
      user.value = {
        ...user.value,
        avatar_url: avatarUrl,
      }
      sessionManager.saveUser(user.value)
    }
  }

  return {
    // State
    user,
    isLoading,
    error,
    initialized,
    isInitializing,

    // Computed
    isAuthenticated,
    userRole,
    userName,
    userEmail,
    userAvatar,

    // Actions
    register,
    login,
    googleLogin,
    logout,
    setUser,
    clearUser,
    updateUserAvatar,
    restoreSession,
    clearError,
    initialize,
  }
})
