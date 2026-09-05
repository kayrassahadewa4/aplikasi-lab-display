/** Standard API success response envelope */
export interface ApiResponse<T = unknown> {
  success: boolean
  statusCode: number
  message: string
  data: T
}

/** Standard API error response */
export interface ApiErrorResponse {
  statusCode: number
  message: string
  timestamp: string
}

/** Pagination metadata */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/** Paginated API response */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta
}
