import apiClient from './api'
import type { LaboratoryData } from '@/mocks/admin-laboratories.mock'
import { formatDate } from '@/utils/format.utils'
export type { LaboratoryData }

/**
 * Backend Laboratory DTO Structure (from ResponseLaboratoryDto)
 */
interface BackendLaboratoryDto {
  id: string
  code: string
  name: string
  location: string
  maximum_capacity: number
  image: string | null
  description: string | null
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'CLOSED'
  created_at: string
  updated_at: string
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
 * Map backend LaboratoryStatus to UI status
 */
function mapBackendStatusToUi(backendStatus: BackendLaboratoryDto['status']): LaboratoryData['status'] {
  switch (backendStatus) {
    case 'AVAILABLE':
      return 'Active'
    case 'IN_USE':
      return 'Active' // Laboratory in use is still considered "Active" in UI
    case 'MAINTENANCE':
      return 'Maintenance'
    case 'CLOSED':
      return 'Closed'
    default:
      return 'Active'
  }
}

/**
 * Map UI status to backend LaboratoryStatus
 */
function mapUiStatusToBackend(uiStatus: LaboratoryData['status']): BackendLaboratoryDto['status'] {
  switch (uiStatus) {
    case 'Active':
      return 'AVAILABLE'
    case 'Maintenance':
      return 'MAINTENANCE'
    case 'Closed':
      return 'CLOSED'
    default:
      return 'AVAILABLE'
  }
}

/**
 * Map backend Laboratory DTO to UI LaboratoryData model
 */
export function mapBackendLaboratoryToUi(backendLab: BackendLaboratoryDto): LaboratoryData {
  return {
    id: backendLab.id,
    name: backendLab.name,
    code: backendLab.code,
    location: backendLab.location,
    maximumCapacity: backendLab.maximum_capacity,
    facilitiesCount: 0, // Not available from backend, can be populated separately if needed
    status: mapBackendStatusToUi(backendLab.status),
    facilitiesList: [], // Not available from backend
    createdAt: formatDate(backendLab.created_at),
    updatedAt: formatDate(backendLab.updated_at),
  }
}

export const laboratoryService = {
  /**
   * Fetch all laboratories from backend API with pagination support
   */
  async getLaboratories(params?: {
    page?: number
    limit?: number
    search?: string
  }): Promise<{ laboratories: LaboratoryData[]; meta: PaginatedResponse<any>['meta'] }> {
    const queryParams: any = {
      page: params?.page || 1,
      limit: params?.limit || 100,
    }

    if (params?.search) queryParams.search = params.search

    const response = await apiClient.get<{ data: PaginatedResponse<BackendLaboratoryDto> }>('/laboratories', {
      params: queryParams,
    })

    const laboratoriesData = response.data.data.data.map(mapBackendLaboratoryToUi)
    const meta = response.data.data.meta

    return { laboratories: laboratoriesData, meta }
  },

  /**
   * Get a single laboratory by ID
   */
  async getLaboratoryById(id: string): Promise<LaboratoryData> {
    const response = await apiClient.get<{ data: BackendLaboratoryDto }>(`/laboratories/${id}`)
    return mapBackendLaboratoryToUi(response.data.data)
  },

  /**
   * Create a new laboratory via POST /api/laboratories
   */
  async createLaboratory(data: {
    code: string
    name: string
    location: string
    maximum_capacity: number
    image?: string
    description?: string
    status?: LaboratoryData['status']
  }): Promise<LaboratoryData> {
    const response = await apiClient.post<{ data: BackendLaboratoryDto }>('/laboratories', {
      code: data.code,
      name: data.name,
      location: data.location,
      maximum_capacity: data.maximum_capacity,
      image: data.image || null,
      description: data.description || null,
      status: mapUiStatusToBackend(data.status || 'Active'),
    })

    return mapBackendLaboratoryToUi(response.data.data)
  },

  /**
   * Update an existing laboratory via PATCH /api/laboratories/:id
   */
  async updateLaboratory(
    id: string,
    data: {
      code?: string
      name?: string
      location?: string
      maximum_capacity?: number
      image?: string
      description?: string
      status?: LaboratoryData['status']
    }
  ): Promise<LaboratoryData> {
    const updatePayload: any = {}

    if (data.code !== undefined) updatePayload.code = data.code
    if (data.name !== undefined) updatePayload.name = data.name
    if (data.location !== undefined) updatePayload.location = data.location
    if (data.maximum_capacity !== undefined) updatePayload.maximum_capacity = data.maximum_capacity
    if (data.image !== undefined) updatePayload.image = data.image
    if (data.description !== undefined) updatePayload.description = data.description
    if (data.status !== undefined) updatePayload.status = mapUiStatusToBackend(data.status)

    const response = await apiClient.patch<{ data: BackendLaboratoryDto }>(`/laboratories/${id}`, updatePayload)
    return mapBackendLaboratoryToUi(response.data.data)
  },

  /**
   * Delete a laboratory via DELETE /api/laboratories/:id
   */
  async deleteLaboratory(id: string): Promise<void> {
    await apiClient.delete(`/laboratories/${id}`)
  },
}
