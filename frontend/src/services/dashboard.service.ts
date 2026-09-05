import apiClient from './api'

// ============================================================================
// TYPE DEFINITIONS (Based on backend DTOs)
// ============================================================================

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type UsageStatus = 'CHECKED_IN' | 'IN_USE' | 'CHECKED_OUT' | 'CANCELLED'

export interface DashboardSummaryDto {
  total_laboratories: number
  active_laboratories: number
  inactive_laboratories: number
  total_schedules: number
  today_schedules: number
  total_room_requests: number
  pending_requests: number
  approved_requests: number
  rejected_requests: number
  current_room_usage: number
  active_announcements: number
}

export interface LaboratoryStatisticDto {
  laboratory_id: string
  laboratory_code: string
  laboratory_name: string
  total_schedules: number
  total_requests: number
  total_usage: number
  occupancy_percentage: number
}

export interface RequestStatisticDto {
  status: RequestStatus
  count: number
  percentage: number
}

export interface UsageStatisticDto {
  today_usage: number
  weekly_usage: number
  monthly_usage: number
  average_duration_minutes: number
  completed_usage: number
  ongoing_usage: number
}

export interface OccupancyStatisticDto {
  laboratory_id: string
  laboratory_code: string
  laboratory_name: string
  occupied_hours: number
  available_hours: number
  occupancy_percentage: number
}

// ============================================================================
// DASHBOARD SERVICE
// ============================================================================

export const dashboardService = {
  /**
   * Get overall dashboard summary
   * Endpoint: GET /dashboard
   */
  async getSummary(): Promise<DashboardSummaryDto> {
    const response = await apiClient.get<{
      success: boolean
      statusCode: number
      message: string
      data: DashboardSummaryDto
    }>('/dashboard')

    // Unwrap global ResponseInterceptor wrapper
    return response.data.data
  },

  /**
   * Get overall dashboard statistics (alias endpoint)
   * Endpoint: GET /dashboard/statistics
   */
  async getStatistics(): Promise<DashboardSummaryDto> {
    const response = await apiClient.get<{
      success: boolean
      statusCode: number
      message: string
      data: DashboardSummaryDto
    }>('/dashboard/statistics')

    // Unwrap global ResponseInterceptor wrapper
    return response.data.data
  },

  /**
   * Get laboratory statistics with usage data
   * Endpoint: GET /dashboard/laboratories
   */
  async getLaboratoryStatistics(): Promise<LaboratoryStatisticDto[]> {
    const response = await apiClient.get<{
      success: boolean
      statusCode: number
      message: string
      data: LaboratoryStatisticDto[]
    }>('/dashboard/laboratories')

    // Unwrap global ResponseInterceptor wrapper
    return response.data.data
  },

  /**
   * Get request statistics by status
   * Endpoint: GET /dashboard/requests
   */
  async getRequestStatistics(): Promise<RequestStatisticDto[]> {
    const response = await apiClient.get<{
      success: boolean
      statusCode: number
      message: string
      data: RequestStatisticDto[]
    }>('/dashboard/requests')

    // Unwrap global ResponseInterceptor wrapper
    return response.data.data
  },

  /**
   * Get usage statistics
   * Endpoint: GET /dashboard/usage
   */
  async getUsageStatistics(): Promise<UsageStatisticDto> {
    const response = await apiClient.get<{
      success: boolean
      statusCode: number
      message: string
      data: UsageStatisticDto
    }>('/dashboard/usage')

    // Unwrap global ResponseInterceptor wrapper
    return response.data.data
  },

  /**
   * Get occupancy statistics per laboratory
   * Endpoint: GET /dashboard/occupancy
   */
  async getOccupancyStatistics(): Promise<OccupancyStatisticDto[]> {
    const response = await apiClient.get<{
      success: boolean
      statusCode: number
      message: string
      data: OccupancyStatisticDto[]
    }>('/dashboard/occupancy')

    // Unwrap global ResponseInterceptor wrapper
    return response.data.data
  },
}
