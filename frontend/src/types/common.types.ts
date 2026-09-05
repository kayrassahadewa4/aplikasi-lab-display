// Common types used across the application
// Note: PaginationMeta, ApiResponse, and PaginatedResponse are defined in api.types.ts

export interface ApiError {
  statusCode: number
  message: string
  error: string
}

export type SortOrder = 'asc' | 'desc'

export interface QueryParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: SortOrder
  [key: string]: string | number | boolean | undefined
}

