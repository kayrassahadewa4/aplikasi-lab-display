import apiClient from './api'
import type { RoleData } from '@/mocks/admin-roles.mock'
import { ShieldCheck, FlaskConical, GraduationCap, Users, Shield } from 'lucide-vue-next'
import { formatDate } from '@/utils/format.utils'

/**
 * Backend Role DTO Structure (from ResponseRoleDto)
 */
interface BackendRoleDto {
  id: string
  code: string
  name: string
  description: string
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
 * Map backend role code to permission metadata
 */
function getRoleMetadata(code: string) {
  const upperCode = code.toUpperCase()

  switch (upperCode) {
    case 'ADMIN':
      return {
        icon: ShieldCheck,
        permissionsLevel: 'Full Access' as const,
        permissionBadgeClass: 'bg-dark-green text-white font-extrabold',
        isSystem: true,
        permissionsList: [
          'Manage System Roles & Security',
          'Manage User Accounts & Access',
          'Configure Laboratories & Facilities',
          'Manage Academic Calendar & Hours',
          'Approve & Override Schedules',
          'Access Reports & Audit Logs',
        ],
      }
    case 'LABORAN':
      return {
        icon: FlaskConical,
        permissionsLevel: 'Operational Access' as const,
        permissionBadgeClass: 'bg-brand-100 text-dark-green border border-brand-300/60 font-bold',
        isSystem: true,
        permissionsList: [
          'Manage Assigned Laboratory Operations',
          'Approve Room Booking Requests',
          'Update Room Usage & Equipment Status',
          'Post System Announcements',
          'Generate Laboratory Reports',
        ],
      }
    case 'DOSEN':
      return {
        icon: GraduationCap,
        permissionsLevel: 'Request Access' as const,
        permissionBadgeClass: 'bg-accent/80 text-dark-green border border-dark-green/10 font-bold',
        isSystem: true,
        permissionsList: [
          'Submit Room Reservation Requests',
          'View Real-time Lab Schedules',
          'Cancel Personal Pending Requests',
          'Receive Schedule Notifications',
        ],
      }
    case 'PUBLIC':
      return {
        icon: Users,
        permissionsLevel: 'View Only' as const,
        permissionBadgeClass: 'bg-gray-100 text-text-secondary border border-gray-200 font-medium',
        isSystem: false,
        permissionsList: [
          'View Public Laboratory Schedules',
          'Access Live Room Availability Display',
          'View Published Announcements',
        ],
      }
    default:
      return {
        icon: Shield,
        permissionsLevel: 'Operational Access' as const,
        permissionBadgeClass: 'bg-brand-100 text-dark-green border border-brand-300/60 font-bold',
        isSystem: false,
        permissionsList: [
          'Access Assigned Modules',
          'Perform Role-specific Actions',
        ],
      }
  }
}

/**
 * Map backend Role DTO to UI RoleData model
 */
export function mapBackendRoleToUi(backendRole: BackendRoleDto, usersCount: number = 0): RoleData {
  const metadata = getRoleMetadata(backendRole.code)

  return {
    id: backendRole.id,
    name: backendRole.name,
    code: backendRole.code,
    description: backendRole.description,
    usersCount,
    permissionsLevel: metadata.permissionsLevel,
    permissionBadgeClass: metadata.permissionBadgeClass,
    isSystem: metadata.isSystem,
    status: 'Active', // Backend doesn't have status field, default to Active
    icon: metadata.icon,
    permissionsList: metadata.permissionsList,
    updatedAt: formatDate(backendRole.updated_at),
  }
}

/**
 * Count users for each role
 */
async function getUsersCountByRole(roleId: string): Promise<number> {
  try {
    // Fetch users filtered by role_id with limit=1 to get only count from meta
    const response = await apiClient.get('/users', {
      params: { role_id: roleId, limit: 1 },
    })

    if (response.data?.data?.meta) {
      return response.data.data.meta.total || 0
    }
  } catch (error) {
    console.error(`Failed to count users for role ${roleId}`, error)
  }
  return 0
}

export const roleService = {
  /**
   * Fetch all roles from backend API with pagination support
   */
  async getRoles(page: number = 1, limit: number = 100, search?: string): Promise<RoleData[]> {
    const params: any = { page, limit }
    if (search) params.search = search

    const response = await apiClient.get<{ data: PaginatedResponse<BackendRoleDto> }>('/roles', { params })
    const rolesData = response.data.data.data

    // Fetch user counts for each role in parallel
    const userCounts = await Promise.all(
      rolesData.map(role => getUsersCountByRole(role.id))
    )

    return rolesData.map((role, index) => mapBackendRoleToUi(role, userCounts[index]))
  },

  /**
   * Get a single role by ID
   */
  async getRoleById(id: string): Promise<RoleData> {
    const response = await apiClient.get<{ data: BackendRoleDto }>(`/roles/${id}`)
    const role = response.data.data
    const usersCount = await getUsersCountByRole(role.id)
    return mapBackendRoleToUi(role, usersCount)
  },

  /**
   * Create a new role via POST /api/roles
   */
  async createRole(data: {
    code: string
    name: string
    description: string
  }): Promise<RoleData> {
    const response = await apiClient.post<{ data: BackendRoleDto }>('/roles', {
      code: data.code.toUpperCase(),
      name: data.name,
      description: data.description,
    })

    const createdRole = response.data.data
    return mapBackendRoleToUi(createdRole, 0)
  },

  /**
   * Update an existing role via PATCH /api/roles/:id
   */
  async updateRole(
    id: string,
    data: { name?: string; description?: string }
  ): Promise<RoleData> {
    const response = await apiClient.patch<{ data: BackendRoleDto }>(`/roles/${id}`, data)
    const updatedRole = response.data.data
    const usersCount = await getUsersCountByRole(updatedRole.id)
    return mapBackendRoleToUi(updatedRole, usersCount)
  },

  /**
   * Delete a role via DELETE /api/roles/:id
   */
  async deleteRole(id: string): Promise<void> {
    await apiClient.delete(`/roles/${id}`)
  },
}
