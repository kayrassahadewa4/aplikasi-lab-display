import apiClient from './api'

export interface NotificationItem {
  id: string
  user_id?: string
  title: string
  message: string
  category: 'requests' | 'schedules' | 'system' | string
  is_read: boolean
  link_url?: string
  created_at: string
}

export type NotificationDto = NotificationItem

export interface PaginatedNotificationsResponse {
  data: NotificationItem[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const notificationService = {
  async getNotifications(params?: {
    page?: number
    limit?: number
    category?: string
    unread_only?: boolean
  }): Promise<PaginatedNotificationsResponse> {
    const queryParams: Record<string, string> = {}
    if (params?.page) queryParams.page = params.page.toString()
    if (params?.limit) queryParams.limit = params.limit.toString()
    if (params?.category && params.category !== 'all') queryParams.category = params.category
    if (params?.unread_only) queryParams.unread_only = 'true'

    const response = await apiClient.get<{
      success: boolean
      data: PaginatedNotificationsResponse
    }>('/notifications', { params: queryParams })

    return response.data.data
  },

  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get<{
        success: boolean
        data: { count: number }
      }>('/notifications/unread-count')

      return response.data?.data?.count ?? 0
    } catch {
      return 0
    }
  },

  async markAsRead(id: string): Promise<NotificationItem> {
    const response = await apiClient.patch<{
      success: boolean
      data: NotificationItem
    }>(`/notifications/${id}/read`)

    return response.data.data
  },

  async markAllAsRead(): Promise<{ count: number }> {
    const response = await apiClient.patch<{
      success: boolean
      data: { count: number }
    }>('/notifications/read-all')

    return response.data.data
  },
}
