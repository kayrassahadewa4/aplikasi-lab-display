// Session management utilities
import { tokenStorage } from './token.utils'
import type { User } from '@/types'

const USER_KEY = 'lab_user'

export const sessionManager = {
  /**
   * Save user data to localStorage
   */
  saveUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },

  /**
   * Get user data from localStorage
   */
  getUser(): User | null {
    const userData = localStorage.getItem(USER_KEY)
    if (!userData) return null

    try {
      return JSON.parse(userData) as User
    } catch {
      return null
    }
  },

  /**
   * Remove user data from localStorage
   */
  removeUser(): void {
    localStorage.removeItem(USER_KEY)
  },

  /**
   * Check if user session exists
   */
  hasSession(): boolean {
    return !!this.getUser() && tokenStorage.hasAccessToken()
  },

  /**
   * Restore session from localStorage
   */
  restoreSession(): { user: User | null; hasToken: boolean } {
    const user = this.getUser()
    const hasToken = tokenStorage.hasAccessToken()
    return { user, hasToken }
  },

  /**
   * Clear entire session
   */
  clearSession(): void {
    this.removeUser()
    tokenStorage.clearTokens()
  },

  /**
   * Check if user is authenticated (mock implementation)
   */
  checkAuthentication(): boolean {
    // Mock: Check if tokens and user data exist
    return this.hasSession()
  },
}
