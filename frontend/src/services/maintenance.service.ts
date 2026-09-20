import apiClient from './api'

export type MaintenanceType =
  | 'ROUTINE_PREVENTIVE'
  | 'CORRECTIVE_REPAIR'
  | 'COMPONENT_UPGRADE'
  | 'REPLACEMENT'

export type FacilityCondition = 'GOOD' | 'DAMAGED' | 'UNDER_MAINTENANCE'

export interface MaintenanceLog {
  id: string
  laboratoryId: string
  laboratoryName: string
  laboratoryCode: string
  facilityId: string
  facilityName: string
  facilityCode: string
  facilityCategory: string
  performedById: string
  technicianName: string
  issueTicketId?: string | null
  issueTicketNumber?: string | null
  issueTicketTitle?: string | null
  maintenanceType: MaintenanceType
  title: string
  actionTaken: string
  previousCondition?: FacilityCondition | null
  resultingCondition: FacilityCondition
  cost?: number | null
  vendor?: string | null
  attachmentUrl?: string | null
  maintenanceDate: string
  createdAt: string
  updatedAt: string
}

export interface CreateMaintenanceLogPayload {
  laboratory_id: string
  facility_id: string
  issue_ticket_id?: string
  maintenance_type: MaintenanceType
  title: string
  action_taken: string
  previous_condition?: FacilityCondition
  resulting_condition: FacilityCondition
  cost?: number
  vendor?: string
  attachment_url?: string
  maintenance_date: string
}

export interface MaintenanceLogFilters {
  page?: number
  limit?: number
  search?: string
  maintenance_type?: string
  laboratory_id?: string
  facility_id?: string
}

export interface PaginatedMaintenanceLogs {
  data: MaintenanceLog[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface BackendMaintenanceLogDto {
  id: string
  laboratory_id: string
  facility_id: string
  performed_by_id: string
  issue_ticket_id?: string | null
  maintenance_type: MaintenanceType
  title: string
  action_taken: string
  previous_condition?: FacilityCondition | null
  resulting_condition: FacilityCondition
  cost?: number | null
  vendor?: string | null
  attachment_url?: string | null
  maintenance_date: string
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
  }
  technician?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string | null
  }
  issueTicket?: {
    id: string
    ticket_number: string
    title: string
    status: string
  } | null
}

function mapToFrontend(dto: BackendMaintenanceLogDto): MaintenanceLog {
  return {
    id: dto.id,
    laboratoryId: dto.laboratory_id,
    laboratoryName: dto.laboratory?.name || 'Laboratorium',
    laboratoryCode: dto.laboratory?.code || 'LAB',
    facilityId: dto.facility_id,
    facilityName: dto.facility?.name || 'Fasilitas Lab',
    facilityCode: dto.facility?.code || 'FAC',
    facilityCategory: dto.facility?.category || 'Umum',
    performedById: dto.performed_by_id,
    technicianName: dto.technician?.full_name || 'Staf Laboran',
    issueTicketId: dto.issue_ticket_id,
    issueTicketNumber: dto.issueTicket?.ticket_number,
    issueTicketTitle: dto.issueTicket?.title,
    maintenanceType: dto.maintenance_type,
    title: dto.title,
    actionTaken: dto.action_taken,
    previousCondition: dto.previous_condition,
    resultingCondition: dto.resulting_condition,
    cost: dto.cost,
    vendor: dto.vendor,
    attachmentUrl: dto.attachment_url,
    maintenanceDate: (dto.maintenance_date ? dto.maintenance_date.split('T')[0] : '') || '',
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  }
}

export const maintenanceService = {
  async getAll(filters?: MaintenanceLogFilters): Promise<PaginatedMaintenanceLogs> {
    const params: Record<string, any> = {}
    if (filters?.page) params.page = filters.page
    if (filters?.limit) params.limit = filters.limit
    if (filters?.search) params.search = filters.search
    if (filters?.maintenance_type) params.maintenance_type = filters.maintenance_type
    if (filters?.laboratory_id) params.laboratory_id = filters.laboratory_id
    if (filters?.facility_id) params.facility_id = filters.facility_id

    const response = await apiClient.get<any>('/maintenance-logs', { params })

    const rawList = Array.isArray(response.data?.data?.data)
      ? response.data.data.data
      : Array.isArray(response.data?.data)
        ? response.data.data
        : []

    const meta = response.data?.data?.meta || response.data?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 }

    return {
      data: rawList.map(mapToFrontend),
      meta,
    }
  },

  async getById(id: string): Promise<MaintenanceLog> {
    const response = await apiClient.get<any>(`/maintenance-logs/${id}`)
    const item = response.data?.data?.id ? response.data.data : (response.data?.data || response.data)
    return mapToFrontend(item)
  },

  async create(payload: CreateMaintenanceLogPayload): Promise<MaintenanceLog> {
    const response = await apiClient.post<any>('/maintenance-logs', payload)
    const item = response.data?.data?.id ? response.data.data : (response.data?.data || response.data)
    return mapToFrontend(item)
  },

  async uploadAttachment(file: File): Promise<{ url: string; originalname: string; size: number }> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post<any>('/maintenance-logs/upload-attachment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data?.data || response.data
  },
}
