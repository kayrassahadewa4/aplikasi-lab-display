// Auth service - Real API implementation
import type { LoginCredentials, AuthResponse, User, GoogleLoginPayload } from '@/types'
import { tokenStorage, sessionManager } from '@/utils'
import apiClient from './api'

export const authService = {
  /**
   * Register a new Lecturer or Lab Staff user
   */
  async register(payload: {
    full_name: string
    email: string
    password: string
    phone?: string
    role_code: 'DOSEN' | 'LABORAN'
  }): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<{
        success: boolean
        data: AuthResponse
      }>('/auth/register', payload)

      const { accessToken, user } = response.data.data

      // Save token and user to localStorage
      tokenStorage.saveAccessToken(accessToken)
      sessionManager.saveUser(user)

      return { accessToken, user }
    } catch (error: any) {
      if (error.response?.data?.message) {
        const msg = error.response.data.message
        throw new Error(Array.isArray(msg) ? msg.join(', ') : msg)
      }
      throw error
    }
  },

  /**
   * Login with real backend API
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<{
        success: boolean
        data: AuthResponse
      }>('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      })

      const { accessToken, user } = response.data.data

      // Save token and user to localStorage
      tokenStorage.saveAccessToken(accessToken)
      sessionManager.saveUser(user)

      return { accessToken, user }
    } catch (error: any) {
      // Handle authentication errors
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password')
      }
      throw new Error('Login failed. Please try again.')
    }
  },

  /**
   * Google OAuth login strictly for Lecturer and Lab Staff
   */
  async googleLogin(payload: GoogleLoginPayload): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<{
        success: boolean
        data: AuthResponse
      }>('/auth/google', payload)

      const { accessToken, user } = response.data.data

      // Save token and user to localStorage
      tokenStorage.saveAccessToken(accessToken)
      sessionManager.saveUser(user)

      return { accessToken, user }
    } catch (error: any) {
      if (error.response?.data?.message) {
        const msg = error.response.data.message
        throw new Error(Array.isArray(msg) ? msg.join(', ') : msg)
      }
      throw error
    }
  },

  /**
   * Logout - Clear session
   */
  async logout(): Promise<void> {
    // Clear local session (JWT is stateless, no backend logout needed)
    sessionManager.clearSession()
  },

  /**
   * Get current user from backend
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<{
        success: boolean
        data: User
      }>('/auth/me')

      return response.data.data
    } catch (error: any) {
      // If token is invalid, clear session
      if (error.response?.status === 401) {
        sessionManager.clearSession()
      }
      throw error
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return sessionManager.checkAuthentication()
  },
}
