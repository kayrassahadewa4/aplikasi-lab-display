import apiClient from './api'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface RoomUsage {
  id: string
  requestId: string | null
  scheduleId: string | null
  checkedInBy: string
  checkedInByName: string
  checkedInByEmail: string
  checkedOutBy: string | null
  checkedOutByName: string | null
  checkedOutByEmail: string | null
  checkInTime: string // ISO 8601
  formattedCheckInTime: string
  checkOutTime: string | null
  formattedCheckOutTime: string | null
  status: 'CHECKED_IN' | 'IN_USE' | 'CHECKED_OUT' | 'CANCELLED'
  notes: string | null
  laboratoryId: string | null
  laboratoryName: string | null
  laboratoryCode: string | null
  activityName: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateRoomUsagePayload {
  requestId?: string
  scheduleId?: string
  laboratoryId?: string
  activityName?: string
  checkedInBy: string
  checkInTime: string // ISO 8601
  status: 'CHECKED_IN' | 'IN_USE'
  notes?: string
}

export interface UpdateRoomUsagePayload {
  checkedOutBy?: string
  checkOutTime?: string
  status?: 'IN_USE' | 'CHECKED_OUT' | 'CANCELLED'
  notes?: string
}

export interface RoomUsageFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
}

export interface PaginatedRoomUsages {
  data: RoomUsage[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Backend DTO structure
interface BackendRoomUsageDto {
  id: string
  request_id: string | null
  schedule_id: string | null
  checked_in_by: string
  checked_out_by: string | null
  check_in_time: string // ISO 8601 DateTime
  check_out_time: string | null
  status: string
  notes: string | null
  checkedInBy: {
    id: string
    full_name: string
    email: string
  }
  checkedOutBy: {
    id: string
    full_name: string
    email: string
  } | null
  request: {
    id: string
    activity_name: string
    laboratory_id: string
    laboratory: {
      id: string
      name: string
      code: string
    }
  } | null
  schedule: {
    id: string
    course_name: string
    laboratory_id: string
    laboratory: {
      id: string
      name: string
      code: string
    }
  } | null
  created_at: string
  updated_at: string
}

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================

import { formatDateTime } from '@/utils/format.utils'

/**
 * Format ISO timestamp to human-readable string (Indonesian WIB)
 */
function formatTimestamp(isoTimestamp: string | null): string {
  if (!isoTimestamp) return ''
  return formatDateTime(isoTimestamp)
}

/**
 * Map backend DTO to frontend RoomUsage model
 */
function mapToFrontend(dto: BackendRoomUsageDto): RoomUsage {
  // Extract laboratory info from either request or schedule
  let laboratoryId: string | null = null
  let laboratoryName: string | null = null
  let laboratoryCode: string | null = null
  let activityName: string | null = null

  if (dto.request) {
    laboratoryId = dto.request.laboratory_id
    laboratoryName = dto.request.laboratory.name
    laboratoryCode = dto.request.laboratory.code
    activityName = dto.request.activity_name
  } else if (dto.schedule) {
    laboratoryId = dto.schedule.laboratory_id
    laboratoryName = dto.schedule.laboratory.name
    laboratoryCode = dto.schedule.laboratory.code
    activityName = dto.schedule.course_name
  }

  return {
    id: dto.id,
    requestId: dto.request_id,
    scheduleId: dto.schedule_id,
    checkedInBy: dto.checked_in_by,
    checkedInByName: dto.checkedInBy.full_name,
    checkedInByEmail: dto.checkedInBy.email,
    checkedOutBy: dto.checked_out_by,
    checkedOutByName: dto.checkedOutBy?.full_name || null,
    checkedOutByEmail: dto.checkedOutBy?.email || null,
    checkInTime: dto.check_in_time,
    formattedCheckInTime: formatTimestamp(dto.check_in_time),
    checkOutTime: dto.check_out_time,
    formattedCheckOutTime: formatTimestamp(dto.check_out_time),
    status: dto.status as 'CHECKED_IN' | 'IN_USE' | 'CHECKED_OUT' | 'CANCELLED',
    notes: dto.notes,
    laboratoryId,
    laboratoryName,
    laboratoryCode,
    activityName,
    createdAt: formatTimestamp(dto.created_at),
    updatedAt: formatTimestamp(dto.updated_at),
  }
}

/**
 * Map frontend create payload to backend DTO
 */
function mapCreateToBackend(payload: CreateRoomUsagePayload): any {
  const backendPayload: any = {
    checked_in_by: payload.checkedInBy,
    check_in_time: payload.checkInTime,
    status: payload.status,
  }
  if (payload.requestId) backendPayload.request_id = payload.requestId
  if (payload.scheduleId) backendPayload.schedule_id = payload.scheduleId
  if (payload.laboratoryId) backendPayload.laboratory_id = payload.laboratoryId
  if (payload.activityName) backendPayload.activity_name = payload.activityName
  if (payload.notes) backendPayload.notes = payload.notes

  return backendPayload
}

/**
 * Map frontend update payload to backend DTO
 */
function mapUpdateToBackend(payload: UpdateRoomUsagePayload): any {
  const backendPayload: any = {}

  if (payload.checkedOutBy !== undefined)
    backendPayload.checked_out_by = payload.checkedOutBy
  if (payload.checkOutTime !== undefined)
    backendPayload.check_out_time = payload.checkOutTime
  if (payload.status !== undefined) backendPayload.status = payload.status
  if (payload.notes !== undefined) backendPayload.notes = payload.notes

  return backendPayload
}

// ============================================================================
// ROOM USAGE SERVICE
// ============================================================================

export const roomUsageService = {
  /**
   * Get paginated list of room usages with filters
   */
  async getRoomUsages(
    filters: RoomUsageFilters = {}
  ): Promise<PaginatedRoomUsages> {
    const params = new URLSearchParams()

    if (filters.page !== undefined) params.append('page', filters.page.toString())
    if (filters.limit !== undefined) params.append('limit', filters.limit.toString())
    if (filters.search) params.append('search', filters.search)
    if (filters.status) params.append('status', filters.status)

    const queryString = params.toString()
    const url = queryString ? `/room-usage?${queryString}` : '/room-usage'

    const response = await apiClient.get<{
      success: boolean
      statusCode: number
      message: string
      data: {
        data: BackendRoomUsageDto[]
        meta: {
          page: number
          limit: number
          total: number
          totalPages: number
        }
      }
    }>(url)

    return {
      data: response.data.data.data.map(mapToFrontend),
      meta: response.data.data.meta,
    }
  },

  /**
   * Get single room usage by ID
   */
  async getRoomUsageById(id: string): Promise<RoomUsage> {
    const response = await apiClient.get<{
      success: boolean
      statusCode: number
      message: string
      data: BackendRoomUsageDto
    }>(`/room-usage/${id}`)
    return mapToFrontend(response.data.data)
  },

  /**
   * Create new room usage (check in)
   */
  async createRoomUsage(
    payload: CreateRoomUsagePayload
  ): Promise<RoomUsage> {
    const backendPayload = mapCreateToBackend(payload)
    const response = await apiClient.post<{
      success: boolean
      statusCode: number
      message: string
      data: BackendRoomUsageDto
    }>('/room-usage', backendPayload)
    return mapToFrontend(response.data.data)
  },

  /**
   * Update existing room usage (check out or status change)
   */
  async updateRoomUsage(
    id: string,
    payload: UpdateRoomUsagePayload
  ): Promise<RoomUsage> {
    const backendPayload = mapUpdateToBackend(payload)
    const response = await apiClient.patch<{
      success: boolean
      statusCode: number
      message: string
      data: BackendRoomUsageDto
    }>(`/room-usage/${id}`, backendPayload)
    return mapToFrontend(response.data.data)
  },

  /**
   * Delete room usage
   */
  async deleteRoomUsage(id: string): Promise<void> {
    await apiClient.delete(`/room-usage/${id}`)
  },

  /**
   * Check in (sugar method)
   */
  async checkIn(payload: Omit<CreateRoomUsagePayload, 'status'>): Promise<RoomUsage> {
    return this.createRoomUsage({
      ...payload,
      status: 'CHECKED_IN',
    })
  },

  /**
   * Check out (sugar method)
   */
  async checkOut(id: string, userId: string): Promise<RoomUsage> {
    return this.updateRoomUsage(id, {
      checkedOutBy: userId,
      checkOutTime: new Date().toISOString(),
      status: 'CHECKED_OUT',
    })
  },

  /**
   * Mark as in use (sugar method)
   */
  async markInUse(id: string): Promise<RoomUsage> {
    return this.updateRoomUsage(id, {
      status: 'IN_USE',
    })
  },

  /**
   * Cancel usage (sugar method)
   */
  async cancelUsage(id: string): Promise<RoomUsage> {
    return this.updateRoomUsage(id, {
      status: 'CANCELLED',
    })
  },
}
