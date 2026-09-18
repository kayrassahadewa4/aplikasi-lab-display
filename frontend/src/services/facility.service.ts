import apiClient from './api'
import type { FacilityData } from '@/mocks/admin-facilities.mock'
import { formatDate } from '@/utils/format.utils'

/**
 * Backend Facility DTO Structure (from ResponseFacilityDto)
 */
interface LaboratoryInfo {
  id: string
  code: string
  name: string
}

interface LaboratoryFacilityInfo {
  id: string
  laboratory_id: string
  facility_id: string
  quantity: number
  condition: 'GOOD' | 'DAMAGED' | 'UNDER_MAINTENANCE'
  laboratory: LaboratoryInfo
}

export interface BackendFacilityDto {
  id: string
  code: string
  name: string
  category: string
  description: string | null
  created_at: string
  updated_at: string
  laboratoryFacilities: LaboratoryFacilityInfo[]
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
 * Map backend Facility DTO to UI FacilityData model
 *
 * NOTE: The backend does NOT have a "status" field on Facility.
 * Status exists only as "condition" in LaboratoryFacility relation.
 * For UI compatibility with existing mock data structure, we derive status from:
 * - If assigned to lab: use condition or default to 'Available'
 * - If not assigned: 'Available'
 */
export function mapBackendFacilityToUi(backendFac: BackendFacilityDto): FacilityData {
  // Get first laboratory assignment if exists
  const firstAssignment = backendFac.laboratoryFacilities[0]

  // Derive UI status from condition (backend uses GOOD/DAMAGED/UNDER_MAINTENANCE)
  let status: FacilityData['status'] = 'Available'
  if (firstAssignment) {
    switch (firstAssignment.condition) {
      case 'GOOD':
        status = 'Available'
        break
      case 'DAMAGED':
        status = 'Maintenance'
        break
      case 'UNDER_MAINTENANCE':
        status = 'Maintenance'
        break
      default:
        status = 'Available'
    }
  }

  return {
    id: backendFac.id,
    name: backendFac.name,
    code: backendFac.code,
    labName: firstAssignment?.laboratory.name || 'Not Assigned',
    labCode: firstAssignment?.laboratory.code || 'N/A',
    quantity: firstAssignment?.quantity || 0,
    status,
    description: backendFac.description || '',
    createdAt: formatDate(backendFac.created_at),
    updatedAt: formatDate(backendFac.updated_at),
  }
}

export const facilityService = {
  /**
   * Fetch all facilities from backend API with pagination support
   */
  async getFacilities(params?: {
    page?: number
    limit?: number
    search?: string
  }): Promise<{ facilities: FacilityData[]; meta: PaginatedResponse<any>['meta'] }> {
    const queryParams: any = {
      page: params?.page || 1,
      limit: params?.limit || 100, // Backend maximum limit
    }

    if (params?.search) queryParams.search = params.search

    const response = await apiClient.get<{ data: PaginatedResponse<BackendFacilityDto> }>('/facilities', {
      params: queryParams,
    })

    const facilitiesData = response.data.data.data.map(mapBackendFacilityToUi)
    const meta = response.data.data.meta

    return { facilities: facilitiesData, meta }
  },

  /**
   * Get a single facility by ID
   */
  async getFacilityById(id: string): Promise<FacilityData> {
    const response = await apiClient.get<{ data: BackendFacilityDto }>(`/facilities/${id}`)
    return mapBackendFacilityToUi(response.data.data)
  },

  /**
   * Create a new facility via POST /api/facilities
   *
   * NOTE: Backend only accepts code, name, category, description
   * Laboratory assignment (labCode/quantity/status) is NOT part of facility creation
   * Those are managed through LaboratoryFacility relation (separate endpoint)
   */
  async createFacility(data: {
    code: string
    name: string
    category: string
    description?: string
  }): Promise<FacilityData> {
    const response = await apiClient.post<{ data: BackendFacilityDto }>('/facilities', {
      code: data.code,
      name: data.name,
      category: data.category,
      description: data.description || undefined,
    })

    return mapBackendFacilityToUi(response.data.data)
  },

  /**
   * Update an existing facility via PATCH /api/facilities/:id
   */
  async updateFacility(
    id: string,
    data: {
      code?: string
      name?: string
      category?: string
      description?: string
    }
  ): Promise<FacilityData> {
    const updatePayload: any = {}

    if (data.code !== undefined) updatePayload.code = data.code
    if (data.name !== undefined) updatePayload.name = data.name
    if (data.category !== undefined) updatePayload.category = data.category
    if (data.description !== undefined) updatePayload.description = data.description

    const response = await apiClient.patch<{ data: BackendFacilityDto }>(`/facilities/${id}`, updatePayload)
    return mapBackendFacilityToUi(response.data.data)
  },

  /**
   * Delete a facility via DELETE /api/facilities/:id
   *
   * NOTE: Backend returns 204 No Content on success
   * Will return 409 Conflict if facility is assigned to laboratories
   */
  async deleteFacility(id: string): Promise<void> {
    await apiClient.delete(`/facilities/${id}`)
  },

  /**
   * Fetch raw facilities with laboratory facilities assignments
   */
  async getRawFacilities(): Promise<BackendFacilityDto[]> {
    const response = await apiClient.get<{ data: PaginatedResponse<BackendFacilityDto> }>('/facilities', {
      params: { limit: 100 },
    })
    return response.data.data.data
  },

  /**
   * Fetch facilities available inside a specific laboratory
   */
  async getFacilitiesByLaboratoryId(
    laboratoryId: string
  ): Promise<Array<{ id: string; code: string; name: string; category: string; condition?: string; quantity?: number }>> {
    const rawList = await this.getRawFacilities()
    const result: Array<{ id: string; code: string; name: string; category: string; condition?: string; quantity?: number }> = []
    for (const fac of rawList) {
      const match = fac.laboratoryFacilities?.find(
        (lf) => lf.laboratory_id === laboratoryId || lf.laboratory?.id === laboratoryId
      )
      if (match) {
        result.push({
          id: fac.id,
          code: fac.code,
          name: fac.name,
          category: fac.category,
          condition: match.condition,
          quantity: match.quantity,
        })
      }
    }
    return result
  },
}

