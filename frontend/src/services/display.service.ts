import apiClient from './api'

export interface DisplayAnnouncementDto {
  id: string
  title: string
  content: string
  start_at: string
  end_at: string
}

export interface DisplayLaboratoryDto {
  id: string
  code: string
  name: string
  location: string
  maximum_capacity: number
  image?: string | null
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'CLOSED'
}

export interface DisplayScheduleDto {
  id: string
  course_name: string
  lecturer_name: string
  class_name: string
  day_of_week: number
  start_time: string
  end_time: string
  status: 'SCHEDULED' | 'ACTIVE' | 'FINISHED' | 'CANCELLED'
  laboratory: {
    id: string
    code: string
    name: string
  }
}

export interface DisplayRoomRequestDto {
  id: string
  activity_name: string
  course_name?: string | null
  class_name?: string | null
  request_date: string
  start_time: string
  end_time: string
  participant_count: number
  applicant: {
    id: string
    full_name: string
  }
  laboratory: {
    id: string
    code: string
    name: string
  }
}

export interface DisplayRoomUsageDto {
  id: string
  check_in_time: string
  check_out_time?: string | null
  status: 'CHECKED_IN' | 'IN_USE' | 'CHECKED_OUT' | 'CANCELLED'
  notes?: string | null
  checkedInBy: {
    id: string
    full_name: string
  }
  request?: {
    activity_name: string
    laboratory: {
      id: string
      code: string
      name: string
    }
  } | null
  schedule?: {
    course_name: string
    laboratory: {
      id: string
      code: string
      name: string
    }
  } | null
}

export interface AggregatedDisplayDto {
  server_time: string
  announcements: DisplayAnnouncementDto[]
  laboratories: DisplayLaboratoryDto[]
  schedules: DisplayScheduleDto[]
  room_requests: DisplayRoomRequestDto[]
  room_usage: DisplayRoomUsageDto[]
}

export type PublicDisplayResponseDto = AggregatedDisplayDto

export const displayService = {
  /**
   * Fetch aggregated display data for public board
   * Endpoint: GET /display
   */
  async getAggregatedDisplay(): Promise<AggregatedDisplayDto> {
    const response = await apiClient.get<{
      success: boolean
      statusCode: number
      message: string
      data: AggregatedDisplayDto
    }>('/display')
    return response.data.data
  },

  /**
   * Alias for getAggregatedDisplay
   */
  async getDisplayData(): Promise<AggregatedDisplayDto> {
    return this.getAggregatedDisplay()
  },

  /**
   * Fetch active announcements
   * Endpoint: GET /display/announcements
   */
  async getAnnouncements(): Promise<DisplayAnnouncementDto[]> {
    const response = await apiClient.get<{
      success: boolean
      statusCode: number
      message: string
      data: DisplayAnnouncementDto[]
    }>('/display/announcements')
    return response.data.data
  },

  /**
   * Fetch laboratory statuses
   * Endpoint: GET /display/laboratories
   */
  async getLaboratories(): Promise<DisplayLaboratoryDto[]> {
    const response = await apiClient.get<{
      success: boolean
      statusCode: number
      message: string
      data: DisplayLaboratoryDto[]
    }>('/display/laboratories')
    return response.data.data
  },

  /**
   * Fetch today schedules
   * Endpoint: GET /display/schedules
   */
  async getSchedules(): Promise<DisplayScheduleDto[]> {
    const response = await apiClient.get<{
      success: boolean
      statusCode: number
      message: string
      data: DisplayScheduleDto[]
    }>('/display/schedules')
    return response.data.data
  },

  /**
   * Fetch current room usages
   * Endpoint: GET /display/usage
   */
  async getUsage(): Promise<DisplayRoomUsageDto[]> {
    const response = await apiClient.get<{
      success: boolean
      statusCode: number
      message: string
      data: DisplayRoomUsageDto[]
    }>('/display/usage')
    return response.data.data
  },
}
