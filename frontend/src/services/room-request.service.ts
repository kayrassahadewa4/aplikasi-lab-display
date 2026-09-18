import apiClient from './api'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface RoomRequest {
  id: string
  applicantId: string
  applicantName: string
  applicantEmail: string
  applicantRole: string
  applicantAvatar?: string | null
  laboratoryId: string
  laboratoryName: string
  laboratoryCode: string
  approvedBy: string | null
  approverName: string | null
  approverAvatar?: string | null
  activityName: string
  courseName: string
  className: string
  description: string
  requestDate: string // YYYY-MM-DD
  formattedRequestDate: string
  startTime: string // HH:mm
  endTime: string // HH:mm
  participantCount: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  rejectionReason: string | null
  documentUrl: string | null
  approvedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateRoomRequestPayload {
  applicantId?: string
  laboratoryId: string
  activityName: string
  courseName?: string | null
  className?: string | null
  description: string
  requestDate: string // YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  participantCount: number
  documentUrl?: string | null
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  isRecurring?: boolean
  occurrences?: number
}

export interface UpdateRoomRequestPayload {
  applicantId?: string
  laboratoryId?: string
  activityName?: string
  courseName?: string | null
  className?: string | null
  description?: string
  requestDate?: string
  startTime?: string
  endTime?: string
  participantCount?: number
  documentUrl?: string | null
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  approvedBy?: string
  rejectionReason?: string
}

export interface RoomRequestFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
  laboratoryId?: string
  applicantId?: string
  unusedOnly?: boolean
}

export interface PaginatedRoomRequests {
  data: RoomRequest[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Backend DTO structure
interface BackendRoomRequestDto {
  id: string
  applicant_id?: string
  laboratory_id?: string
  approved_by?: string | null
  activity_name?: string
  course_name?: string | null
  class_name?: string | null
  description?: string
  request_date: string // ISO Date string
  start_time: string // ISO DateTime string (TIME(6) serialized)
  end_time: string // ISO DateTime string (TIME(6) serialized)
  participant_count?: number
  document_url?: string | null
  status?: string
  rejection_reason?: string | null
  applicant?: {
    id?: string
    full_name?: string
    email?: string
    avatar_url?: string | null
  } | null
  approver?: {
    id?: string
    full_name?: string
    email?: string
    avatar_url?: string | null
  } | null
  laboratory?: {
    id?: string
    name?: string
    code?: string
  } | null
  approved_at?: string | null
  created_at?: string
  updated_at?: string
}

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================

/**
 * Convert frontend time (HH:mm) to backend time (HH:mm:ss)
 */
function toBackendTime(timeStr: string): string {
  if (!timeStr) return ''
  // If already in HH:mm:ss format, return as-is
  if (timeStr.length === 8 && timeStr.split(':').length === 3) {
    return timeStr
  }
  // If in HH:mm format, append :00
  if (timeStr.length === 5 && timeStr.split(':').length === 2) {
    return `${timeStr}:00`
  }
  return timeStr
}

/**
 * Convert backend time (ISO DateTime from TIME(6)) to frontend time (HH:mm)
 * Uses UTC methods because Prisma Time(6) serializes as 1970-01-01T{HH:mm:ss}.000Z
 */
function fromBackendTime(isoTime: string): string {
  if (!isoTime) return ''
  if (typeof isoTime === 'string') {
    if (isoTime.includes('T')) {
      const date = new Date(isoTime)
      if (!isNaN(date.getTime())) {
        const hours = date.getUTCHours().toString().padStart(2, '0')
        const minutes = date.getUTCMinutes().toString().padStart(2, '0')
        return `${hours}:${minutes}`
      }
    }
    const match = isoTime.trim().match(/^(\d{1,2})[:.](\d{1,2})/)
    if (match) {
      const hours = match[1]!.padStart(2, '0')
      const minutes = match[2]!.padStart(2, '0')
      return `${hours}:${minutes}`
    }
  }
  return '00:00'
}

/**
 * Convert backend date (ISO Date) to frontend date (YYYY-MM-DD)
 */
function fromBackendDate(isoDate: string): string {
  if (!isoDate) return ''
  const parts = isoDate.split('T')
  return parts[0] || '' // "2026-08-20T00:00:00.000Z" → "2026-08-20"
}

import { formatDate, formatDateTime, formatTime } from '@/utils/format.utils'

/**
 * Format date to human-readable string (Indonesian WIB)
 */
function formatRequestDate(dateStr: string): string {
  if (!dateStr) return ''
  return formatDate(dateStr, true)
}

/**
 * Format ISO timestamp to human-readable string (WIB)
 */
function formatTimestamp(isoTimestamp: string): string {
  if (!isoTimestamp) return ''
  return formatDateTime(isoTimestamp)
}

/**
 * Map backend DTO to frontend RoomRequest model
 */
function mapToFrontend(dto: BackendRoomRequestDto): RoomRequest {
  const requestDate = fromBackendDate(dto.request_date)
  const startTime = fromBackendTime(dto.start_time)
  const endTime = fromBackendTime(dto.end_time)

  return {
    id: dto.id,
    applicantId: dto.applicant_id || dto.applicant?.id || '',
    applicantName: dto.applicant?.full_name || 'Faculty Lecturer',
    applicantEmail: dto.applicant?.email || '',
    applicantRole: 'USER', // Role not returned by backend, use default
    applicantAvatar: dto.applicant?.avatar_url || null,
    laboratoryId: dto.laboratory_id || dto.laboratory?.id || '',
    laboratoryName: dto.laboratory?.name || 'Laboratory Room',
    laboratoryCode: dto.laboratory?.code || 'LAB',
    approvedBy: dto.approved_by || null,
    approverName: dto.approver?.full_name || null,
    approverAvatar: dto.approver?.avatar_url || null,
    activityName: dto.activity_name || 'Laboratory Session',
    courseName: dto.course_name || '',
    className: dto.class_name || '',
    description: dto.description || '',
    requestDate,
    formattedRequestDate: formatRequestDate(requestDate),
    startTime,
    endTime,
    participantCount: dto.participant_count || 0,
    status: (dto.status || 'PENDING') as RoomRequest['status'],
    rejectionReason: dto.rejection_reason || null,
    documentUrl: dto.document_url || null,
    approvedAt: dto.approved_at ? formatTimestamp(dto.approved_at) : null,
    createdAt: dto.created_at ? formatTimestamp(dto.created_at) : '',
    updatedAt: dto.updated_at ? formatTimestamp(dto.updated_at) : '',
  }
}

/**
 * Map frontend create payload to backend DTO
 */
function mapCreateToBackend(payload: CreateRoomRequestPayload): any {
  const backendPayload: any = {
    laboratory_id: payload.laboratoryId,
    activity_name: payload.activityName,
    description: payload.description,
    request_date: payload.requestDate, // YYYY-MM-DD
    start_time: toBackendTime(payload.startTime), // HH:mm → HH:mm:ss
    end_time: toBackendTime(payload.endTime), // HH:mm → HH:mm:ss
    participant_count: Number(payload.participantCount),
  }

  if (payload.courseName) backendPayload.course_name = payload.courseName
  if (payload.className) backendPayload.class_name = payload.className
  if (payload.documentUrl !== undefined) backendPayload.document_url = payload.documentUrl
  if (payload.isRecurring !== undefined) backendPayload.is_recurring = payload.isRecurring
  if (payload.occurrences !== undefined) backendPayload.occurrences = payload.occurrences

  return backendPayload
}

/**
 * Map frontend update payload to backend DTO
 */
function mapUpdateToBackend(payload: UpdateRoomRequestPayload): any {
  const backendPayload: any = {}

  if (payload.applicantId !== undefined)
    backendPayload.applicant_id = payload.applicantId
  if (payload.laboratoryId !== undefined)
    backendPayload.laboratory_id = payload.laboratoryId
  if (payload.activityName !== undefined)
    backendPayload.activity_name = payload.activityName
  if (payload.courseName !== undefined)
    backendPayload.course_name = payload.courseName || null
  if (payload.className !== undefined)
    backendPayload.class_name = payload.className || null
  if (payload.description !== undefined)
    backendPayload.description = payload.description
  if (payload.requestDate !== undefined)
    backendPayload.request_date = payload.requestDate
  if (payload.startTime !== undefined)
    backendPayload.start_time = toBackendTime(payload.startTime)
  if (payload.endTime !== undefined)
    backendPayload.end_time = toBackendTime(payload.endTime)
  if (payload.participantCount !== undefined)
    backendPayload.participant_count = payload.participantCount
  if (payload.documentUrl !== undefined)
    backendPayload.document_url = payload.documentUrl
  if (payload.status !== undefined) backendPayload.status = payload.status
  if (payload.approvedBy !== undefined)
    backendPayload.approved_by = payload.approvedBy
  if (payload.rejectionReason !== undefined)
    backendPayload.rejection_reason = payload.rejectionReason

  return backendPayload
}

// ============================================================================
// ROOM REQUEST SERVICE
// ============================================================================

export const roomRequestService = {
  /**
   * Get paginated list of room requests with filters
   */
  async getRoomRequests(
    filters: RoomRequestFilters = {}
  ): Promise<PaginatedRoomRequests> {
    const params = new URLSearchParams()

    if (filters.page !== undefined) params.append('page', filters.page.toString())
    if (filters.limit !== undefined) params.append('limit', filters.limit.toString())
    if (filters.search) params.append('search', filters.search)
    if (filters.status) params.append('status', filters.status)
    if (filters.laboratoryId)
      params.append('laboratory_id', filters.laboratoryId)
    if (filters.applicantId) params.append('applicant_id', filters.applicantId)
    if (filters.unusedOnly !== undefined)
      params.append('unused_only', filters.unusedOnly.toString())

    const queryString = params.toString()
    const url = queryString ? `/room-requests?${queryString}` : '/room-requests'

    const response = await apiClient.get<{
      success: boolean
      statusCode: number
      message: string
      data: {
        data: BackendRoomRequestDto[]
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
   * Get room requests for current lecturer/user (alias for getRoomRequests)
   */
  async getMyRoomRequests(
    filters: RoomRequestFilters = {}
  ): Promise<PaginatedRoomRequests> {
    return this.getRoomRequests(filters)
  },

  /**
   * Get single room request by ID
   */
  async getRoomRequestById(id: string): Promise<RoomRequest> {
    const response = await apiClient.get<{
      success: boolean
      statusCode: number
      message: string
      data: BackendRoomRequestDto
    }>(`/room-requests/${id}`)
    return mapToFrontend(response.data.data)
  },

  /**
   * Create new room request
   */
  async createRoomRequest(
    payload: CreateRoomRequestPayload
  ): Promise<RoomRequest> {
    const backendPayload = mapCreateToBackend(payload)
    const response = await apiClient.post<{
      success: boolean
      statusCode: number
      message: string
      data: BackendRoomRequestDto
    }>('/room-requests', backendPayload)
    return mapToFrontend(response.data.data)
  },

  /**
   * Update existing room request (partial update)
   */
  async updateRoomRequest(
    id: string,
    payload: UpdateRoomRequestPayload
  ): Promise<RoomRequest> {
    const backendPayload = mapUpdateToBackend(payload)
    const response = await apiClient.patch<{
      success: boolean
      statusCode: number
      message: string
      data: BackendRoomRequestDto
    }>(`/room-requests/${id}`, backendPayload)
    return mapToFrontend(response.data.data)
  },

  /**
   * Delete room request
   */
  async deleteRoomRequest(id: string): Promise<void> {
    await apiClient.delete(`/room-requests/${id}`)
  },

  /**
   * Approve room request (sugar method)
   */
  async approveRoomRequest(
    id: string,
    approvedBy: string
  ): Promise<RoomRequest> {
    return this.updateRoomRequest(id, {
      status: 'APPROVED',
      approvedBy,
    })
  },

  /**
   * Reject room request (sugar method)
   */
  async rejectRoomRequest(id: string, reason: string): Promise<RoomRequest> {
    return this.updateRoomRequest(id, {
      status: 'REJECTED',
      rejectionReason: reason,
    })
  },

  /**
   * Cancel room request (sugar method)
   */
  async cancelRoomRequest(id: string): Promise<RoomRequest> {
    return this.updateRoomRequest(id, {
      status: 'CANCELLED',
    })
  },

  /**
   * Upload supporting document/letter (PDF/PNG/JPG)
   */
  async uploadAttachment(file: File): Promise<{ url: string; originalname: string; size: number }> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post<{
      success: boolean
      statusCode: number
      message: string
      data: { url: string; originalname: string; size: number }
    }>('/room-requests/upload-attachment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data
  },
}
