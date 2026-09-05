/**
 * Utility functions for converting frontend period selections to backend date ranges
 */

export interface DateRange {
  start_date: string // YYYY-MM-DD
  end_date: string // YYYY-MM-DD
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayString(): string {
  const today = new Date()
  return today.toISOString().split('T')[0] || ''
}

/**
 * Get date string for N days ago in YYYY-MM-DD format
 */
function getDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0] || ''
}

/**
 * Get the first day of current month in YYYY-MM-DD format
 */
function getFirstDayOfMonth(): string {
  const date = new Date()
  date.setDate(1)
  return date.toISOString().split('T')[0] || ''
}

/**
 * Get the first day of current week (Monday) in YYYY-MM-DD format
 */
function getFirstDayOfWeek(): string {
  const date = new Date()
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is Sunday
  date.setDate(diff)
  return date.toISOString().split('T')[0] || ''
}

/**
 * Convert period selection to date range for backend filters
 * @param period - Selected period ('today' | 'week' | 'month' | 'semester' | 'custom')
 * @param customStart - Custom start date (for 'custom' period)
 * @param customEnd - Custom end date (for 'custom' period)
 * @returns DateRange object with start_date and end_date
 */
export function periodToDateRange(
  period: 'today' | 'week' | 'month' | 'semester' | 'custom',
  customStart?: string,
  customEnd?: string
): DateRange {
  const today = getTodayString()

  switch (period) {
    case 'today':
      return {
        start_date: today,
        end_date: today,
      }

    case 'week':
      return {
        start_date: getFirstDayOfWeek(),
        end_date: today,
      }

    case 'month':
      return {
        start_date: getFirstDayOfMonth(),
        end_date: today,
      }

    case 'semester':
      // For semester, use a safe 6-month window
      // Actual academic calendar dates should be fetched from backend if needed
      return {
        start_date: getDaysAgo(180), // approximately 6 months
        end_date: today,
      }

    case 'custom':
      if (!customStart || !customEnd) {
        // Fallback to current month if custom dates not provided
        return {
          start_date: getFirstDayOfMonth(),
          end_date: today,
        }
      }
      return {
        start_date: customStart,
        end_date: customEnd,
      }

    default:
      // Default to current month
      return {
        start_date: getFirstDayOfMonth(),
        end_date: today,
      }
  }
}

/**
 * Format ISO date string to human-readable format (Indonesian WIB)
 * @param isoDate - ISO date string (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
 * @returns Formatted date string (e.g., "16 Agu 2026")
 */
export function formatDate(isoDate: string): string {
  if (!isoDate) return ''
  try {
    const date = new Date(isoDate)
    if (isNaN(date.getTime())) return isoDate
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date)
  } catch {
    return isoDate
  }
}

/**
 * Format ISO time string to HH:mm format (Indonesian WIB)
 * @param isoTime - ISO time string (HH:mm:ss or ISO DateTime)
 * @returns Formatted time string (e.g., "08:00")
 */
export function formatTime(isoTime: string): string {
  if (!isoTime) return ''
  if (isoTime.length <= 8 && isoTime.includes(':')) {
    return isoTime.substring(0, 5)
  }
  try {
    const date = new Date(isoTime)
    if (isNaN(date.getTime())) return isoTime
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date)
  } catch {
    return isoTime
  }
}

/**
 * Calculate duration in hours and minutes from start and end timestamps
 * @param startTime - ISO timestamp
 * @param endTime - ISO timestamp
 * @returns Formatted duration string (e.g., "2h 30m")
 */
export function calculateDuration(startTime: string, endTime: string): string {
  if (!startTime || !endTime) return '—'
  try {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const diffMs = end.getTime() - start.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))

    const hours = Math.floor(diffMins / 60)
    const minutes = diffMins % 60

    if (hours === 0) {
      return `${minutes}m`
    } else if (minutes === 0) {
      return `${hours}h`
    } else {
      return `${hours}h ${minutes}m`
    }
  } catch {
    return '—'
  }
}
