import apiClient from './api'
import type { OperationalHourData } from '@/mocks/admin-operational-hours.mock'
import { formatDate } from '@/utils/format.utils'

/**
 * Backend Operational Hour DTO Structure (from ResponseOperationalHourDto)
 */
interface LaboratoryInfo {
  id: string
  code: string
  name: string
}

interface BackendOperationalHourDto {
  id: string
  laboratory_id: string
  day_of_week: number
  open_time: Date | string
  close_time: Date | string
  created_at: Date | string
  updated_at: Date | string
  laboratory?: LaboratoryInfo
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
 * Map day_of_week number to day name
 * Backend: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
 */
function mapDayOfWeekToName(dayOfWeek: number): OperationalHourData['day'] {
  const days: OperationalHourData['day'][] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayOfWeek] || 'Monday'
}

/**
 * Map day name to day_of_week number
 */
function mapDayNameToDayOfWeek(dayName: OperationalHourData['day']): number {
  const dayMap: Record<OperationalHourData['day'], number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  }
  return dayMap[dayName] || 1
}

/**
 * Extract time from Date object or ISO string to HH:mm format
 * Uses UTC methods because Prisma Time(6) serializes as 1970-01-01T{HH:mm:ss}.000Z
 */
function extractTimeString(dateValue: Date | string): string {
  if (typeof dateValue === 'string') {
    // If it's already a string like "08:00:00" or ISO timestamp
    if (dateValue.includes('T')) {
      // ISO format — parse and extract UTC time
      const date = new Date(dateValue)
      const hours = date.getUTCHours().toString().padStart(2, '0')
      const minutes = date.getUTCMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    } else {
      // Direct time string "HH:mm:ss"
      return dateValue.substring(0, 5) // Extract HH:mm
    }
  } else {
    // Date object — use UTC since Prisma Time(6) is stored as UTC epoch
    const hours = dateValue.getUTCHours().toString().padStart(2, '0')
    const minutes = dateValue.getUTCMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }
}

/**
 * Calculate duration in hours between open and close times
 */
function calculateDuration(openTime: string, closeTime: string): number {
  const [openHours, openMinutes] = openTime.split(':').map(Number)
  const [closeHours, closeMinutes] = closeTime.split(':').map(Number)

  const openTotalMinutes = (openHours ?? 0) * 60 + (openMinutes ?? 0)
  const closeTotalMinutes = (closeHours ?? 0) * 60 + (closeMinutes ?? 0)

  return Math.round((closeTotalMinutes - openTotalMinutes) / 60 * 10) / 10
}

/**
 * Map backend Operational Hour DTO to UI OperationalHourData model
 */
export function mapBackendOperationalHourToUi(backendOp: BackendOperationalHourDto): OperationalHourData {
  const openTimeStr = extractTimeString(backendOp.open_time)
  const closeTimeStr = extractTimeString(backendOp.close_time)
  const duration = calculateDuration(openTimeStr, closeTimeStr)

  // Determine status: if duration is 0 or very small, consider it closed
  const status: OperationalHourData['status'] = duration > 0 ? 'Open' : 'Closed'

  const createdAt = new Date(backendOp.created_at)
  const updatedAt = new Date(backendOp.updated_at)

  return {
    id: backendOp.id,
    day: mapDayOfWeekToName(backendOp.day_of_week),
    openTime: openTimeStr,
    closeTime: closeTimeStr,
    durationHours: duration,
    status,
    createdAt: formatDate(backendOp.created_at),
    updatedAt: formatDate(backendOp.updated_at),
    // Add laboratory info if available (extend OperationalHourData interface)
    laboratoryId: backendOp.laboratory_id,
    laboratoryCode: backendOp.laboratory?.code || '',
    laboratoryName: backendOp.laboratory?.name || '',
  }
}

export const operationalHourService = {
  /**
   * Fetch all operational hours from backend API with pagination support
   */
  async getOperationalHours(params?: {
    page?: number
    limit?: number
    search?: string
  }): Promise<{ operationalHours: OperationalHourData[]; meta: PaginatedResponse<any>['meta'] }> {
    const queryParams: any = {
      page: params?.page || 1,
      limit: params?.limit || 100, // Backend maximum limit
    }

    if (params?.search) queryParams.search = params.search

    const response = await apiClient.get<{ data: PaginatedResponse<BackendOperationalHourDto> }>('/operational-hours', {
      params: queryParams,
    })

    const operationalHoursData = response.data.data.data.map(mapBackendOperationalHourToUi)
    const meta = response.data.data.meta

    return { operationalHours: operationalHoursData, meta }
  },

  /**
   * Get a single operational hour by ID
   */
  async getOperationalHourById(id: string): Promise<OperationalHourData> {
    const response = await apiClient.get<{ data: BackendOperationalHourDto }>(`/operational-hours/${id}`)
    return mapBackendOperationalHourToUi(response.data.data)
  },

  /**
   * Create a new operational hour via POST /api/operational-hours
   */
  async createOperationalHour(data: {
    laboratoryId: string
    day: OperationalHourData['day']
    openTime: string // HH:mm format
    closeTime: string // HH:mm format
  }): Promise<OperationalHourData> {
    const response = await apiClient.post<{ data: BackendOperationalHourDto }>('/operational-hours', {
      laboratory_id: data.laboratoryId,
      day_of_week: mapDayNameToDayOfWeek(data.day),
      open_time: `${data.openTime}:00`, // Convert HH:mm to HH:mm:ss
      close_time: `${data.closeTime}:00`,
    })

    return mapBackendOperationalHourToUi(response.data.data)
  },

  /**
   * Update an existing operational hour via PATCH /api/operational-hours/:id
   */
  async updateOperationalHour(
    id: string,
    data: {
      laboratoryId?: string
      day?: OperationalHourData['day']
      openTime?: string // HH:mm format
      closeTime?: string // HH:mm format
    }
  ): Promise<OperationalHourData> {
    const updatePayload: any = {}

    if (data.laboratoryId !== undefined) updatePayload.laboratory_id = data.laboratoryId
    if (data.day !== undefined) updatePayload.day_of_week = mapDayNameToDayOfWeek(data.day)
    if (data.openTime !== undefined) updatePayload.open_time = `${data.openTime}:00`
    if (data.closeTime !== undefined) updatePayload.close_time = `${data.closeTime}:00`

    const response = await apiClient.patch<{ data: BackendOperationalHourDto }>(`/operational-hours/${id}`, updatePayload)
    return mapBackendOperationalHourToUi(response.data.data)
  },

  /**
   * Delete an operational hour via DELETE /api/operational-hours/:id
   *
   * NOTE: Backend returns 204 No Content on success
   */
  async deleteOperationalHour(id: string): Promise<void> {
    await apiClient.delete(`/operational-hours/${id}`)
  },
}
