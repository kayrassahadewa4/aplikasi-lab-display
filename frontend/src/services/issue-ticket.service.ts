import apiClient from './api'

export type IssueSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type IssueStatus = 'REPORTED' | 'INVESTIGATING' | 'RESOLVED' | 'REJECTED' | 'CLOSED'

export interface IssueTicket {
  id: string
  ticketNumber: string
  laboratoryId: string
  laboratoryName: string
  laboratoryCode: string
  laboratoryLocation?: string
  facilityId?: string | null
  facilityName?: string | null
  facilityCode?: string | null
  facilityCategory?: string | null
  reportedById: string
  reporterName: string
  reporterEmail: string
  reporterAvatar?: string | null
  handledById?: string | null
  handlerName?: string | null
  title: string
  description: string
  severity: IssueSeverity
  status: IssueStatus
  imageUrl?: string | null
  resolutionNotes?: string | null
  resolvedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateIssueTicketPayload {
  laboratory_id: string
  facility_id?: string
  title: string
  description: string
  severity?: IssueSeverity
  image_url?: string
}

export interface UpdateIssueTicketStatusPayload {
  status: IssueStatus
  resolution_notes?: string
}

export interface IssueTicketFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
  severity?: string
  laboratory_id?: string
}

export interface PaginatedIssueTickets {
  data: IssueTicket[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface BackendIssueTicketDto {
  id: string
  ticket_number: string
  laboratory_id: string
  facility_id?: string | null
  reported_by_id: string
  handled_by_id?: string | null
  title: string
  description: string
  severity: IssueSeverity
  status: IssueStatus
  image_url?: string | null
  resolution_notes?: string | null
  resolved_at?: string | null
  created_at: string
  updated_at: string
  laboratory?: {
    id: string
    code: string
    name: string
    location?: string
  }
  facility?: {
    id: string
    code: string
    name: string
    category: string
  } | null
  reporter?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string | null
  }
  handler?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string | null
  } | null
}

function mapToFrontend(dto: BackendIssueTicketDto): IssueTicket {
  return {
    id: dto.id,
    ticketNumber: dto.ticket_number,
    laboratoryId: dto.laboratory_id,
    laboratoryName: dto.laboratory?.name || 'Laboratorium',
    laboratoryCode: dto.laboratory?.code || 'LAB',
    laboratoryLocation: dto.laboratory?.location,
    facilityId: dto.facility_id,
    facilityName: dto.facility?.name || null,
    facilityCode: dto.facility?.code || null,
    facilityCategory: dto.facility?.category || null,
    reportedById: dto.reported_by_id,
    reporterName: dto.reporter?.full_name || 'Pengguna Lab',
    reporterEmail: dto.reporter?.email || '',
    reporterAvatar: dto.reporter?.avatar_url || null,
    handledById: dto.handled_by_id,
    handlerName: dto.handler?.full_name || null,
    title: dto.title,
    description: dto.description,
    severity: dto.severity,
    status: dto.status,
    imageUrl: dto.image_url,
    resolutionNotes: dto.resolution_notes,
    resolvedAt: dto.resolved_at,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  }
}

export const issueTicketService = {
  async getAll(filters?: IssueTicketFilters): Promise<PaginatedIssueTickets> {
    const params: Record<string, any> = {}
    if (filters?.page) params.page = filters.page
    if (filters?.limit) params.limit = filters.limit
    if (filters?.search) params.search = filters.search
    if (filters?.status) params.status = filters.status
    if (filters?.severity) params.severity = filters.severity
    if (filters?.laboratory_id) params.laboratory_id = filters.laboratory_id

    const response = await apiClient.get<{
      success: boolean
      statusCode: number
      message: string
      data: BackendIssueTicketDto[]
      meta: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }>('/issue-tickets', { params })

    return {
      data: (response.data.data || []).map(mapToFrontend),
      meta: response.data.meta || { page: 1, limit: 10, total: 0, totalPages: 1 },
    }
  },

  async getById(id: string): Promise<IssueTicket> {
    const response = await apiClient.get<{
      success: boolean
      statusCode: number
      message: string
      data: BackendIssueTicketDto
    }>(`/issue-tickets/${id}`)
    return mapToFrontend(response.data.data)
  },

  async create(payload: CreateIssueTicketPayload): Promise<IssueTicket> {
    const response = await apiClient.post<{
      success: boolean
      statusCode: number
      message: string
      data: BackendIssueTicketDto
    }>('/issue-tickets', payload)
    return mapToFrontend(response.data.data)
  },

  async updateStatus(id: string, payload: UpdateIssueTicketStatusPayload): Promise<IssueTicket> {
    const response = await apiClient.patch<{
      success: boolean
      statusCode: number
      message: string
      data: BackendIssueTicketDto
    }>(`/issue-tickets/${id}/status`, payload)
    return mapToFrontend(response.data.data)
  },

  async uploadImage(file: File): Promise<{ url: string; originalname: string; size: number }> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post<{
      success: boolean
      statusCode: number
      message: string
      data: { url: string; originalname: string; size: number }
    }>('/issue-tickets/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data
  },
}
