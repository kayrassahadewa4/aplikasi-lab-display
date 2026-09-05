import apiClient from './api'
import type { AcademicPeriodData } from '@/mocks/admin-academic-calendar.mock'

/**
 * Backend Academic Calendar DTO Structure (from ResponseAcademicCalendarDto)
 */
interface BackendAcademicCalendarDto {
  id: string
  academic_year: string
  semester: string
  start_date: Date | string
  end_date: Date | string
  status: 'ACTIVE' | 'INACTIVE'
  created_at: Date | string
  updated_at: Date | string
}

/**
 * Backend Paginated Response Structure
 */
interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

/**
 * Map backend semester to UI semester
 */
function mapBackendSemesterToUi(backendSemester: string): AcademicPeriodData['semester'] {
  const lower = backendSemester.toLowerCase()
  if (lower.includes('ganjil') || lower.includes('odd')) {
    return 'Odd Semester'
  } else if (lower.includes('genap') || lower.includes('even')) {
    return 'Even Semester'
  } else if (lower.includes('antara') || lower.includes('short') || lower.includes('summer')) {
    return 'Short / Summer Term'
  }
  // Default to Odd Semester if unknown
  return 'Odd Semester'
}

/**
 * Map UI semester to backend semester
 */
function mapUiSemesterToBackend(uiSemester: AcademicPeriodData['semester']): string {
  switch (uiSemester) {
    case 'Odd Semester':
      return 'Ganjil'
    case 'Even Semester':
      return 'Genap'
    case 'Short / Summer Term':
      return 'Antara'
    default:
      return 'Ganjil'
  }
}

/**
 * Map backend CalendarStatus to UI status
 */
function mapBackendStatusToUi(
  backendStatus: 'ACTIVE' | 'INACTIVE',
  startDate: string,
  endDate: string
): AcademicPeriodData['status'] {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (backendStatus === 'ACTIVE' && now >= start && now <= end) {
    return 'Active'
  } else if (now < start) {
    return 'Upcoming'
  } else if (now > end || backendStatus === 'INACTIVE') {
    return 'Completed'
  }
  return 'Completed'
}

/**
 * Map UI status to backend CalendarStatus
 */
function mapUiStatusToBackend(uiStatus: AcademicPeriodData['status']): 'ACTIVE' | 'INACTIVE' {
  return uiStatus === 'Active' ? 'ACTIVE' : 'INACTIVE'
}

/**
 * Calculate duration between two dates in months
 */
function calculateDuration(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30))
  return `${diffMonths} months`
}

import { formatDate } from '@/utils/format.utils'

/**
 * Map backend Academic Calendar DTO to UI AcademicPeriodData model
 */
export function mapBackendAcademicCalendarToUi(backendCal: BackendAcademicCalendarDto): AcademicPeriodData {
  // Extract date strings, handling both string and Date types from backend
  const startDateStr = ((typeof backendCal.start_date === 'string'
    ? backendCal.start_date
    : new Date(backendCal.start_date).toISOString()).split('T')[0])!

  const endDateStr = ((typeof backendCal.end_date === 'string'
    ? backendCal.end_date
    : new Date(backendCal.end_date).toISOString()).split('T')[0])!

  return {
    id: backendCal.id,
    academicYear: backendCal.academic_year,
    semester: mapBackendSemesterToUi(backendCal.semester),
    startDate: startDateStr,
    endDate: endDateStr,
    formattedStartDate: formatDate(startDateStr),
    formattedEndDate: formatDate(endDateStr),
    duration: calculateDuration(startDateStr, endDateStr),
    status: mapBackendStatusToUi(backendCal.status, startDateStr, endDateStr),
    createdAt: formatDate(backendCal.created_at),
    updatedAt: formatDate(backendCal.updated_at),
  }
}

export const academicCalendarService = {
  /**
   * Fetch all academic calendars from backend API with pagination support
   */
  async getAcademicCalendars(params?: {
    page?: number
    limit?: number
    search?: string
  }): Promise<{ calendars: AcademicPeriodData[]; meta: PaginatedResponse<any>['meta'] }> {
    const queryParams: any = {
      page: params?.page || 1,
      limit: params?.limit || 100, // Backend maximum limit
    }

    if (params?.search) queryParams.search = params.search

    const response = await apiClient.get<{ data: PaginatedResponse<BackendAcademicCalendarDto> }>('/academic-calendars', {
      params: queryParams,
    })

    const calendarsData = response.data.data.data.map(mapBackendAcademicCalendarToUi)
    const meta = response.data.data.meta

    return { calendars: calendarsData, meta }
  },

  /**
   * Get a single academic calendar by ID
   */
  async getAcademicCalendarById(id: string): Promise<AcademicPeriodData> {
    const response = await apiClient.get<{ data: BackendAcademicCalendarDto }>(`/academic-calendars/${id}`)
    return mapBackendAcademicCalendarToUi(response.data.data)
  },

  /**
   * Create a new academic calendar via POST /api/academic-calendars
   */
  async createAcademicCalendar(data: {
    academicYear: string
    semester: AcademicPeriodData['semester']
    startDate: string
    endDate: string
    status: AcademicPeriodData['status']
  }): Promise<AcademicPeriodData> {
    const response = await apiClient.post<{ data: BackendAcademicCalendarDto }>('/academic-calendars', {
      academic_year: data.academicYear,
      semester: mapUiSemesterToBackend(data.semester),
      start_date: data.startDate,
      end_date: data.endDate,
      status: mapUiStatusToBackend(data.status),
    })

    return mapBackendAcademicCalendarToUi(response.data.data)
  },

  /**
   * Update an existing academic calendar via PATCH /api/academic-calendars/:id
   */
  async updateAcademicCalendar(
    id: string,
    data: {
      academicYear?: string
      semester?: AcademicPeriodData['semester']
      startDate?: string
      endDate?: string
      status?: AcademicPeriodData['status']
    }
  ): Promise<AcademicPeriodData> {
    const updatePayload: any = {}

    if (data.academicYear !== undefined) updatePayload.academic_year = data.academicYear
    if (data.semester !== undefined) updatePayload.semester = mapUiSemesterToBackend(data.semester)
    if (data.startDate !== undefined) updatePayload.start_date = data.startDate
    if (data.endDate !== undefined) updatePayload.end_date = data.endDate
    if (data.status !== undefined) updatePayload.status = mapUiStatusToBackend(data.status)

    const response = await apiClient.patch<{ data: BackendAcademicCalendarDto }>(`/academic-calendars/${id}`, updatePayload)
    return mapBackendAcademicCalendarToUi(response.data.data)
  },

  /**
   * Delete an academic calendar via DELETE /api/academic-calendars/:id
   *
   * NOTE: Backend returns 204 No Content on success
   * Will return 409 Conflict if calendar is referenced in schedules
   */
  async deleteAcademicCalendar(id: string): Promise<void> {
    await apiClient.delete(`/academic-calendars/${id}`)
  },
}
