// Token storage utilities
const ACCESS_TOKEN_KEY = 'lab_access_token'

export const tokenStorage = {
  /**
   * Save access token to localStorage
   */
  saveAccessToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  },

  /**
   * Get access token from localStorage
   */
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  /**
   * Remove access token from localStorage
   */
  removeAccessToken(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  },

  /**
   * Remove all tokens (for backward compatibility)
   */
  clearTokens(): void {
    this.removeAccessToken()
  },

  /**
   * Check if access token exists
   */
  hasAccessToken(): boolean {
    return !!this.getAccessToken()
  },
}
