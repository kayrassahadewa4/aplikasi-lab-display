import apiClient from './api'

// Status enums (matching backend Prisma types)
export type UsageStatus = 'CHECKED_IN' | 'IN_USE' | 'CHECKED_OUT' | 'CANCELLED'
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type ScheduleStatus = 'SCHEDULED' | 'ACTIVE' | 'FINISHED' | 'CANCELLED'
export type LaboratoryStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'CLOSED'

// ============================================================================
// TYPE DEFINITIONS (Based on backend DTOs)
// ============================================================================

export interface ReportFilters {
  start_date?: string // ISO date format YYYY-MM-DD
  end_date?: string // ISO date format YYYY-MM-DD
  laboratory_id?: string // UUID
  status?: string
  user_id?: string // UUID
  room_request_id?: string // UUID
  schedule_id?: string // UUID
  search?: string
  page?: number
  limit?: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

// Usage Report Types
export interface UsageReportItem {
  id: string
  laboratory: {
    id: string
    code: string
    name: string
  } | null
  user: {
    id: string
    full_name: string
    email: string
  }
  schedule?: {
    id: string
    course_name: string
    lecturer_name: string
  } | null
  request?: {
    id: string
    activity_name: string
  } | null
  check_in_time: string // ISO timestamp
  check_out_time: string | null // ISO timestamp
  duration_minutes: number
  status: UsageStatus
}

// Request Report Types
export interface RequestReportItem {
  id: string
  applicant: {
    id: string
    full_name: string
    email: string
  }
  laboratory: {
    id: string
    code: string
    name: string
  }
  activity_name: string
  course_name?: string | null
  class_name?: string | null
  request_date: string // ISO date
  start_time: string // ISO time
  end_time: string // ISO time
  approval_date?: string | null // ISO timestamp
  approved_by?: {
    id: string
    full_name: string
  } | null
  status: RequestStatus
}

// Schedule Report Types
export interface ScheduleReportItem {
  id: string
  laboratory: {
    id: string
    code: string
    name: string
  }
  course_name: string
  lecturer_name: string
  class_name: string
  day_of_week: number // 0-6 (Sunday-Saturday)
  start_time: string // ISO time
  end_time: string // ISO time
  status: ScheduleStatus
}

// Laboratory Report Types
export interface LaboratoryReportItem {
  id: string
  code: string
  name: string
  location: string
  maximum_capacity: number
  status: LaboratoryStatus
  total_schedules: number
  total_requests: number
  total_usages: number
}

// Summary Report Types
export interface SummaryReport {
  total_schedules: number
  total_requests: number
  approved_requests: number
  rejected_requests: number
  pending_requests: number
  completed_usages: number
  ongoing_usages: number
  active_laboratories: number
  inactive_laboratories: number
  occupancy_percentage: number
}

// ============================================================================
// REPORTS SERVICE
// ============================================================================

export const reportsService = {
  /**
   * Get usage report with filters and pagination
   * Endpoint: GET /reports/usage
   */
  async getUsageReport(
    filters: ReportFilters = {}
  ): Promise<PaginatedResponse<UsageReportItem>> {
    const params = new URLSearchParams()

    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.laboratory_id) params.append('laboratory_id', filters.laboratory_id)
    if (filters.status) params.append('status', filters.status)
    if (filters.user_id) params.append('user_id', filters.user_id)
    if (filters.room_request_id) params.append('room_request_id', filters.room_request_id)
    if (filters.schedule_id) params.append('schedule_id', filters.schedule_id)
    if (filters.search) params.append('search', filters.search)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    const queryString = params.toString()
    const url = queryString ? `/reports/usage?${queryString}` : '/reports/usage'

    // Backend returns: ResponseInterceptor{ success, statusCode, message, data: PaginatedResponseDto{ data: [...], meta: {...} } }
    // Axios wraps as: response.data = ResponseInterceptor output
    // Therefore: response.data.data = PaginatedResponseDto{ data, meta }
    const response = await apiClient.get<{
      success: boolean
      statusCode: number
      message: string
      data: PaginatedResponse<UsageReportItem>
    }>(url)

    return response.data.data
  },

  /**
   * Get request report with filters and pagination
   * Endpoint: GET /reports/requests
   */
  async getRequestReport(
    filters: ReportFilters = {}
  ): Promise<PaginatedResponse<RequestReportItem>> {
    const params = new URLSearchParams()

    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.laboratory_id) params.append('laboratory_id', filters.laboratory_id)
    if (filters.status) params.append('status', filters.status)
    if (filters.user_id) params.append('user_id', filters.user_id)
    if (filters.search) params.append('search', filters.search)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    const queryString = params.toString()
    const url = queryString ? `/reports/requests?${queryString}` : '/reports/requests'

    const response = await apiClient.get<{
      success: boolean
      statusCode: number
      message: string
      data: PaginatedResponse<RequestReportItem>
    }>(url)

    // Unwrap global ResponseInterceptor wrapper
    return response.data.data
  },

  /**
   * Get schedule report with filters and pagination
   * Endpoint: GET /reports/schedules
   */
  async getScheduleReport(
    filters: ReportFilters = {}
  ): Promise<PaginatedResponse<ScheduleReportItem>> {
    const params = new URLSearchParams()

    if (filters.laboratory_id) params.append('laboratory_id', filters.laboratory_id)
    if (filters.status) params.append('status', filters.status)
    if (filters.search) params.append('search', filters.search)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    const queryString = params.toString()
    const url = queryString ? `/reports/schedules?${queryString}` : '/reports/schedules'

    const response = await apiClient.get<{
      success: boolean
      statusCode: number
      message: string
      data: PaginatedResponse<ScheduleReportItem>
    }>(url)

    // Unwrap global ResponseInterceptor wrapper
    return response.data.data
  },

  /**
   * Get laboratory report with statistics
   * Endpoint: GET /reports/laboratories
   */
  async getLaboratoryReport(
    filters: ReportFilters = {}
  ): Promise<PaginatedResponse<LaboratoryReportItem>> {
    const params = new URLSearchParams()

    if (filters.status) params.append('status', filters.status)
    if (filters.search) params.append('search', filters.search)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    const queryString = params.toString()
    const url = queryString ? `/reports/laboratories?${queryString}` : '/reports/laboratories'

    const response = await apiClient.get<{
      success: boolean
      statusCode: number
      message: string
      data: PaginatedResponse<LaboratoryReportItem>
    }>(url)

    // Unwrap global ResponseInterceptor wrapper
    return response.data.data
  },

  /**
   * Get summary report with aggregated statistics
   * Endpoint: GET /reports/summary
   */
  async getSummaryReport(filters: ReportFilters = {}): Promise<SummaryReport> {
    const params = new URLSearchParams()

    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)

    const queryString = params.toString()
    const url = queryString ? `/reports/summary?${queryString}` : '/reports/summary'

    const response = await apiClient.get<{
      success: boolean
      statusCode: number
      message: string
      data: SummaryReport
    }>(url)

    // Unwrap global ResponseInterceptor wrapper
    return response.data.data
  },
}
