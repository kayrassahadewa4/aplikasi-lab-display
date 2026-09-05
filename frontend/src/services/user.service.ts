import apiClient from './api'
import type { UserData } from '@/mocks/admin-users.mock'
import { formatDate } from '@/utils/format.utils'

/**
 * Backend User DTO Structure (from ResponseUserDto)
 */
interface BackendUserDto {
  id: string
  role_id: string
  keycloak_id: string | null
  full_name: string
  email: string
  phone: string | null
  avatar_url?: string | null
  status: 'ACTIVE' | 'INACTIVE'
  created_at: string
  updated_at: string
  role: {
    id: string
    code: string
    name: string
  }
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
 * Map role code to display name
 */
function mapRoleToDisplayName(roleCode: string, roleName: string): string {
  const upperCode = roleCode.toUpperCase()

  switch (upperCode) {
    case 'ADMIN':
      return 'Administrator'
    case 'LABORAN':
      return 'Laboran'
    case 'DOSEN':
      return 'Dosen / Pemohon'
    default:
      return roleName || roleCode
  }
}

/**
 * Map role code to avatar background class
 */
function getAvatarBgClass(roleCode: string): string {
  const upperCode = roleCode.toUpperCase()

  switch (upperCode) {
    case 'ADMIN':
      return 'bg-dark-green text-white'
    case 'LABORAN':
      return 'bg-brand-100 text-dark-green border border-brand-300/60'
    case 'DOSEN':
      return 'bg-accent/80 text-dark-green border border-dark-green/10'
    default:
      return 'bg-gray-100 text-gray-600 border border-gray-200'
  }
}

/**
 * Map backend User DTO to UI UserData model
 */
export function mapBackendUserToUi(backendUser: BackendUserDto): UserData {
  return {
    id: backendUser.id,
    fullName: backendUser.full_name,
    email: backendUser.email,
    phone: backendUser.phone || 'N/A',
    avatarUrl: backendUser.avatar_url || null,
    role: mapRoleToDisplayName(backendUser.role.code, backendUser.role.name) as UserData['role'],
    roleId: backendUser.role_id || backendUser.role?.id,
    roleCode: backendUser.role?.code,
    status: backendUser.status === 'ACTIVE' ? 'Active' : 'Inactive',
    registered: formatDate(backendUser.created_at),
    lastActive: 'N/A', // Backend doesn't track last active
    avatarBgClass: getAvatarBgClass(backendUser.role.code),
    avatarTextClass: backendUser.role.code === 'ADMIN' ? 'text-white' : 'text-dark-green',
  }
}

export const userService = {
  /**
   * Fetch all users from backend API with pagination, search, and filtering
   */
  async getUsers(params?: {
    page?: number
    limit?: number
    search?: string
    role_id?: string
    status?: 'ACTIVE' | 'INACTIVE'
  }): Promise<{ users: UserData[]; meta: PaginatedResponse<any>['meta'] }> {
    const queryParams: any = {
      page: params?.page || 1,
      limit: params?.limit || 10,
    }

    if (params?.search) queryParams.search = params.search
    if (params?.role_id) queryParams.role_id = params.role_id
    if (params?.status) queryParams.status = params.status

    const response = await apiClient.get<{ data: PaginatedResponse<BackendUserDto> }>('/users', {
      params: queryParams,
    })

    const usersData = response.data.data.data.map(mapBackendUserToUi)
    const meta = response.data.data.meta

    return { users: usersData, meta }
  },

  /**
   * Get a single user by ID
   */
  async getUserById(id: string): Promise<UserData> {
    const response = await apiClient.get<{ data: BackendUserDto }>(`/users/${id}`)
    return mapBackendUserToUi(response.data.data)
  },

  /**
   * Create a new user via POST /api/users
   */
  async createUser(data: {
    role_id: string
    full_name: string
    email: string
    phone?: string
    password: string
    status?: 'ACTIVE' | 'INACTIVE'
  }): Promise<UserData> {
    const response = await apiClient.post<{ data: BackendUserDto }>('/users', {
      role_id: data.role_id,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      password: data.password,
      status: data.status || 'ACTIVE',
    })

    return mapBackendUserToUi(response.data.data)
  },

  /**
   * Update an existing user via PATCH /api/users/:id
   */
  async updateUser(
    id: string,
    data: {
      role_id?: string
      full_name?: string
      email?: string
      phone?: string
      password?: string
      status?: 'ACTIVE' | 'INACTIVE'
    }
  ): Promise<UserData> {
    const updatePayload: any = {}

    if (data.role_id !== undefined) updatePayload.role_id = data.role_id
    if (data.full_name !== undefined) updatePayload.full_name = data.full_name
    if (data.email !== undefined) updatePayload.email = data.email
    if (data.phone !== undefined) updatePayload.phone = data.phone
    if (data.password !== undefined) updatePayload.password = data.password
    if (data.status !== undefined) updatePayload.status = data.status

    const response = await apiClient.patch<{ data: BackendUserDto }>(`/users/${id}`, updatePayload)
    return mapBackendUserToUi(response.data.data)
  },

  /**
   * Delete a user via DELETE /api/users/:id
   */
  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`)
  },

  /**
   * Upload user profile photo via POST /api/users/profile/photo
   */
  async uploadProfilePhoto(file: File): Promise<{ avatar_url: string; user: any }> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post<{
      success: boolean
      data: { avatar_url: string; user: any }
    }>('/users/profile/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data
  },

  /**
   * Delete user profile photo via DELETE /api/users/profile/photo
   */
  async deleteProfilePhoto(): Promise<{ message: string; user: any }> {
    const response = await apiClient.delete<{
      success: boolean
      data: { message: string; user: any }
    }>('/users/profile/photo')
    return response.data.data
  },
}
