import apiClient from './api'

export interface MessageUser {
  id: string
  full_name: string
  email: string
  role?: {
    id: string
    name: string
    code: string
  }
}

export interface MessageDto {
  id: string
  sender_id: string
  recipient_id: string | null
  subject: string
  body: string
  attachment_url?: string
  is_read: boolean
  folder: 'inbox' | 'sent' | 'archived' | string
  created_at: string
  updated_at: string
  sender: MessageUser
  recipient?: MessageUser | null
}

export interface PaginatedMessagesResponse {
  data: MessageDto[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateMessagePayload {
  recipient_id?: string
  subject: string
  body: string
  attachment_url?: string
}

export const messageService = {
  async getMessages(params?: {
    folder?: string
    page?: number
    limit?: number
    search?: string
  }): Promise<PaginatedMessagesResponse> {
    const queryParams: Record<string, string> = {}
    if (params?.folder) queryParams.folder = params.folder
    if (params?.page) queryParams.page = params.page.toString()
    if (params?.limit) queryParams.limit = params.limit.toString()
    if (params?.search) queryParams.search = params.search

    const response = await apiClient.get<{
      success: boolean
      data: PaginatedMessagesResponse
    }>('/messages', { params: queryParams })

    return response.data.data
  },

  async getMessageById(id: string): Promise<MessageDto> {
    const response = await apiClient.get<{
      success: boolean
      data: MessageDto
    }>(`/messages/${id}`)

    return response.data.data
  },

  async sendMessage(payload: CreateMessagePayload): Promise<MessageDto> {
    const response = await apiClient.post<{
      success: boolean
      data: MessageDto
    }>('/messages', payload)

    return response.data.data
  },

  async archiveMessage(id: string): Promise<MessageDto> {
    const response = await apiClient.patch<{
      success: boolean
      data: MessageDto
    }>(`/messages/${id}/archive`)

    return response.data.data
  },

  async deleteMessage(id: string): Promise<void> {
    await apiClient.delete(`/messages/${id}`)
  },

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{
      success: boolean
      data: { count: number }
    }>('/messages/unread-count')

    return response.data.data?.count || 0
  },
}
