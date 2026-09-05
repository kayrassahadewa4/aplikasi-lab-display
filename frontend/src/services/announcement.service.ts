import apiClient from './api'

// ============================================================================
// TYPE DEFINITIONS (Based on backend DTOs)
// ============================================================================

export interface AnnouncementDto {
  id: string
  title: string
  content: string
  start_at: string // ISO date string
  end_at: string // ISO date string
  is_active: boolean
  created_at: string // ISO date string
  updated_at: string // ISO date string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PaginatedAnnouncementsResponse {
  data: AnnouncementDto[]
  meta: PaginationMeta
}

export interface CreateAnnouncementPayload {
  title: string
  content: string
  start_at: string // ISO date string
  end_at: string // ISO date string
  is_active: boolean
}

export interface UpdateAnnouncementPayload {
  title?: string
  content?: string
  start_at?: string // ISO date string
  end_at?: string // ISO date string
  is_active?: boolean
}

// ============================================================================
// ANNOUNCEMENT SERVICE
// ============================================================================

export const announcementService = {
  /**
   * Get all announcements with pagination and search
   * Endpoint: GET /announcements
   */
  async getAnnouncements(params?: {
    page?: number
    limit?: number
    search?: string
  }): Promise<PaginatedAnnouncementsResponse> {
    const queryParams: Record<string, string> = {}

    if (params?.page) queryParams.page = params.page.toString()
    if (params?.limit) queryParams.limit = params.limit.toString()
    if (params?.search) queryParams.search = params.search

    const response = await apiClient.get<{
      success: boolean
      statusCode: number
      message: string
      data: PaginatedAnnouncementsResponse
    }>('/announcements', {
      params: queryParams,
    })

    // Unwrap global ResponseInterceptor wrapper
    // For paginated endpoints: response.data.data contains { data: [...], meta: {...} }
    return response.data.data
  },

  /**
   * Get a single announcement by ID
   * Endpoint: GET /announcements/:id
   */
  async getAnnouncementById(id: string): Promise<AnnouncementDto> {
    const response = await apiClient.get<{
      success: boolean
      statusCode: number
      message: string
      data: AnnouncementDto
    }>(`/announcements/${id}`)

    // Unwrap global ResponseInterceptor wrapper
    return response.data.data
  },

  /**
   * Create a new announcement
   * Endpoint: POST /announcements
   */
  async createAnnouncement(
    payload: CreateAnnouncementPayload
  ): Promise<AnnouncementDto> {
    const response = await apiClient.post<{
      success: boolean
      statusCode: number
      message: string
      data: AnnouncementDto
    }>('/announcements', payload)

    // Unwrap global ResponseInterceptor wrapper
    return response.data.data
  },

  /**
   * Update an announcement
   * Endpoint: PATCH /announcements/:id
   */
  async updateAnnouncement(
    id: string,
    payload: UpdateAnnouncementPayload
  ): Promise<AnnouncementDto> {
    const response = await apiClient.patch<{
      success: boolean
      statusCode: number
      message: string
      data: AnnouncementDto
    }>(`/announcements/${id}`, payload)

    // Unwrap global ResponseInterceptor wrapper
    return response.data.data
  },

  /**
   * Delete an announcement
   * Endpoint: DELETE /announcements/:id
   */
  async deleteAnnouncement(id: string): Promise<void> {
    await apiClient.delete(`/announcements/${id}`)
  },
}
