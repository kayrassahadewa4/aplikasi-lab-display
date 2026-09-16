import apiClient from './api'

export interface PasswordResetRequestItem {
  id: string
  user_id: string
  email: string
  full_name: string
  role_code: string
  notes?: string | null
  status: 'PENDING' | 'RESOLVED' | 'REJECTED'
  resolved_by_id?: string | null
  temp_password?: string | null
  resolved_at?: string | null
  created_at: string
  updated_at: string
  user?: {
    id: string
    full_name: string
    email: string
    phone?: string | null
    status: string
    avatar_url?: string | null
    role: {
      id: string
      code: string
      name: string
    }
  }
  resolved_by?: {
    id: string
    full_name: string
    email: string
  } | null
}

export interface ForgotPasswordSubmissionResponse {
  message: string
  requestId: string
  status: string
  created_at: string
  isExisting: boolean
}

export const passwordResetService = {
  /**
   * Submit forgot password ticket (Public endpoint from Login page)
   */
  async submitForgotPassword(payload: {
    email: string
    notes?: string
  }): Promise<ForgotPasswordSubmissionResponse> {
    const res = await apiClient.post<any>(
      '/auth/forgot-password-request',
      payload,
    )
    return res.data?.data ?? res.data
  },

  /**
   * Get all password reset requests (Admin only)
   */
  async getResetRequests(status?: 'PENDING' | 'RESOLVED' | 'REJECTED'): Promise<{
    requests: PasswordResetRequestItem[]
    pendingCount: number
  }> {
    const res = await apiClient.get<any>('/users/reset-requests', {
      params: status ? { status } : undefined,
    })
    return res.data?.data ?? res.data
  },

  /**
   * Resolve a reset request (Admin only: APPROVE or REJECT)
   */
  async resolveResetRequest(
    id: string,
    action: 'APPROVE' | 'REJECT',
    tempPassword?: string,
  ): Promise<{
    message: string
    tempPassword?: string
    request: PasswordResetRequestItem
  }> {
    const res = await apiClient.patch<any>(`/users/reset-requests/${id}`, {
      action,
      temp_password: tempPassword,
    })
    return res.data?.data ?? res.data
  },

  /**
   * Directly reset password for a user from admin user detail page
   */
  async directResetPassword(
    userId: string,
    newPassword?: string,
  ): Promise<{
    message: string
    tempPassword?: string
    user: any
  }> {
    const res = await apiClient.post<any>(`/users/${userId}/direct-reset-password`, {
      new_password: newPassword,
    })
    return res.data?.data ?? res.data
  },
}
