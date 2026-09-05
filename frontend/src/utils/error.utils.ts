// Error handling utilities
import type { AxiosError } from 'axios'

export interface ErrorResponse {
  statusCode: number
  message: string
  error?: string
}

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'An unknown error occurred'
}

/**
 * Handle API error response
 */
export function handleApiError(error: AxiosError<ErrorResponse>): string {
  if (error.response) {
    const { status, data } = error.response

    switch (status) {
      case 400:
        return data.message || 'Bad request. Please check your input.'
      case 401:
        return 'Unauthorized. Please login again.'
      case 403:
        return 'Forbidden. You do not have permission to perform this action.'
      case 404:
        return data.message || 'Resource not found.'
      case 409:
        return data.message || 'Conflict. The resource already exists.'
      case 422:
        return data.message || 'Validation failed. Please check your input.'
      case 500:
        return 'Server error. Please try again later.'
      case 503:
        return 'Service unavailable. Please try again later.'
      default:
        return data.message || `Error ${status}: ${error.message}`
    }
  }

  if (error.request) {
    return 'Network error. Please check your internet connection.'
  }

  return error.message || 'An unexpected error occurred.'
}

/**
 * Create user-friendly error message
 */
export function createUserFriendlyError(error: unknown): string {
  if ((error as AxiosError).isAxiosError) {
    return handleApiError(error as AxiosError<ErrorResponse>)
  }

  return getErrorMessage(error)
}

/**
 * Log error to console (development only)
 */
export function logError(error: unknown, context?: string): void {
  if (import.meta.env.DEV) {
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, error)
  }
}
