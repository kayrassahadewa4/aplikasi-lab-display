import apiClient from './api'
import type { ScheduleData } from '@/mocks/admin-schedules.mock'
import { formatDate } from '@/utils/format.utils'
export type { ScheduleData }

/**
 * Backend Schedule DTO Structure (from ResponseScheduleDto)
 */
interface LaboratoryInfo {
  id: string
  code: string
  name: string
}

interface AcademicCalendarInfo {
  id: string
  academic_year: string
  semester: string
}

interface BackendScheduleDto {
  id: string
  laboratory_id: string
  academic_calendar_id: string
  course_name: string
  lecturer_name: string
  class_name: string
  day_of_week: number // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  start_time: Date | string
  end_time: Date | string
  status: ScheduleData['status']
  created_at: Date | string
  updated_at: Date | string
  laboratory?: LaboratoryInfo
  academicCalendar?: AcademicCalendarInfo
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
 * CRITICAL: Day of week conversion
 * Frontend Mock: 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 7=Sunday
 * Backend: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
 */
function backendDayToFrontendDay(backendDay: number): number {
  // Backend: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  // Frontend: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
  return backendDay === 0 ? 7 : backendDay
}

/**
 * Convert frontend day (1-7) to backend day (0-6)
 */
function frontendDayToBackendDay(frontendDay: number): number {
  // Frontend: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
  // Backend: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  return frontendDay === 7 ? 0 : frontendDay
}

/**
 * Map backend day_of_week to day name
 */
function mapDayOfWeekToName(dayOfWeek: number): ScheduleData['dayName'] {
  const days: ScheduleData['dayName'][] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayOfWeek] || 'Monday'
}

/**
 * Map day name to backend day_of_week (0-6)
 */
function mapDayNameToDayOfWeek(dayName: ScheduleData['dayName']): number {
  const dayMap: Record<ScheduleData['dayName'], number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  }
  return dayMap[dayName] ?? 1
}

/**
 * Extract time from Date object or ISO string to HH:mm format
 * Uses UTC methods because Prisma Time(6) serializes as 1970-01-01T{HH:mm:ss}.000Z
 */
function extractTimeString(dateValue: Date | string): string {
  if (typeof dateValue === 'string') {
    // If it's an ISO timestamp like "1970-01-01T08:00:00.000Z"
    if (dateValue.includes('T')) {
      const date = new Date(dateValue)
      const hours = date.getUTCHours().toString().padStart(2, '0')
      const minutes = date.getUTCMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    } else if (dateValue.includes(':')) {
      // Direct time string "HH:mm:ss"
      return dateValue.substring(0, 5) // Extract HH:mm
    }
  } else {
    // Date object — use UTC since Prisma Time(6) is stored as UTC epoch
    const hours = dateValue.getUTCHours().toString().padStart(2, '0')
    const minutes = dateValue.getUTCMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }
  return '00:00'
}

/**
 * Map backend Schedule DTO to UI ScheduleData model
 */
export function mapBackendScheduleToUi(backendSch: BackendScheduleDto): ScheduleData {
  const startTimeStr = extractTimeString(backendSch.start_time)
  const endTimeStr = extractTimeString(backendSch.end_time)

  // Convert backend day_of_week (0-6) to frontend dayOfWeek (1-7)
  const frontendDayOfWeek = backendDayToFrontendDay(backendSch.day_of_week)
  const dayName = mapDayOfWeekToName(backendSch.day_of_week)

  const createdAt = new Date(backendSch.created_at)
  const updatedAt = new Date(backendSch.updated_at)

  return {
    id: backendSch.id,
    laboratoryId: backendSch.laboratory_id,
    laboratoryName: backendSch.laboratory?.name || '',
    laboratoryCode: backendSch.laboratory?.code || '',
    academicCalendarId: backendSch.academic_calendar_id,
    courseName: backendSch.course_name,
    lecturerName: backendSch.lecturer_name,
    className: backendSch.class_name,
    dayOfWeek: frontendDayOfWeek,
    dayName,
    startTime: startTimeStr,
    endTime: endTimeStr,
    status: backendSch.status,
    createdAt: formatDate(backendSch.created_at),
    updatedAt: formatDate(backendSch.updated_at),
  }
}

export const scheduleService = {
  /**
   * Fetch all schedules from backend API with pagination support
   */
  async getSchedules(params?: {
    page?: number
    limit?: number
    search?: string
    academic_calendar_id?: string
    laboratory_id?: string
    status?: ScheduleData['status']
  }): Promise<{ schedules: ScheduleData[]; meta: PaginatedResponse<any>['meta'] }> {
    const queryParams: any = {
      page: params?.page || 1,
      limit: params?.limit || 10,
    }

    if (params?.search) queryParams.search = params.search
    if (params?.academic_calendar_id) queryParams.academic_calendar_id = params.academic_calendar_id
    if (params?.laboratory_id) queryParams.laboratory_id = params.laboratory_id
    if (params?.status) queryParams.status = params.status

    const response = await apiClient.get<{ data: PaginatedResponse<BackendScheduleDto> }>('/schedules', {
      params: queryParams,
    })

    const schedulesData = response.data.data.data.map(mapBackendScheduleToUi)
    const meta = response.data.data.meta

    return { schedules: schedulesData, meta }
  },

  /**
   * Get a single schedule by ID
   */
  async getScheduleById(id: string): Promise<ScheduleData> {
    const response = await apiClient.get<{ data: BackendScheduleDto }>(`/schedules/${id}`)
    return mapBackendScheduleToUi(response.data.data)
  },

  /**
   * Create a new schedule via POST /api/schedules
   */
  async createSchedule(data: {
    laboratoryId: string
    academicCalendarId: string
    courseName: string
    lecturerName: string
    className: string
    dayName: ScheduleData['dayName']
    startTime: string // HH:mm format
    endTime: string // HH:mm format
    status: ScheduleData['status']
  }): Promise<ScheduleData> {
    const response = await apiClient.post<{ data: BackendScheduleDto }>('/schedules', {
      laboratory_id: data.laboratoryId,
      academic_calendar_id: data.academicCalendarId,
      course_name: data.courseName,
      lecturer_name: data.lecturerName,
      class_name: data.className,
      day_of_week: mapDayNameToDayOfWeek(data.dayName),
      start_time: `${data.startTime}:00`, // Convert HH:mm to HH:mm:ss
      end_time: `${data.endTime}:00`,
      status: data.status,
    })

    return mapBackendScheduleToUi(response.data.data)
  },

  /**
   * Update an existing schedule via PATCH /api/schedules/:id
   */
  async updateSchedule(
    id: string,
    data: {
      laboratoryId?: string
      academicCalendarId?: string
      courseName?: string
      lecturerName?: string
      className?: string
      dayName?: ScheduleData['dayName']
      startTime?: string // HH:mm format
      endTime?: string // HH:mm format
      status?: ScheduleData['status']
    }
  ): Promise<ScheduleData> {
    const updatePayload: any = {}

    if (data.laboratoryId !== undefined) updatePayload.laboratory_id = data.laboratoryId
    if (data.academicCalendarId !== undefined) updatePayload.academic_calendar_id = data.academicCalendarId
    if (data.courseName !== undefined) updatePayload.course_name = data.courseName
    if (data.lecturerName !== undefined) updatePayload.lecturer_name = data.lecturerName
    if (data.className !== undefined) updatePayload.class_name = data.className
    if (data.dayName !== undefined) updatePayload.day_of_week = mapDayNameToDayOfWeek(data.dayName)
    if (data.startTime !== undefined) updatePayload.start_time = `${data.startTime}:00`
    if (data.endTime !== undefined) updatePayload.end_time = `${data.endTime}:00`
    if (data.status !== undefined) updatePayload.status = data.status

    const response = await apiClient.patch<{ data: BackendScheduleDto }>(`/schedules/${id}`, updatePayload)
    return mapBackendScheduleToUi(response.data.data)
  },

  /**
   * Delete a schedule via DELETE /api/schedules/:id
   *
   * NOTE: Backend returns 204 No Content on success
   */
  async deleteSchedule(id: string): Promise<void> {
    await apiClient.delete(`/schedules/${id}`)
  },
}
