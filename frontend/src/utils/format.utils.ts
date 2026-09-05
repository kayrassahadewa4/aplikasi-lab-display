const DEFAULT_LOCALE = 'id-ID'
const DEFAULT_TIMEZONE = 'Asia/Jakarta'

/**
 * Format Date to Indonesian Date string (e.g. "Minggu, 23 Agustus 2026" or "23 Agustus 2026")
 */
export function formatDate(
  date: Date | string,
  includeDayName = false,
  locale = DEFAULT_LOCALE,
  timeZone = DEFAULT_TIMEZONE
): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return String(date)
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: includeDayName ? 'long' : undefined,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

/**
 * Format Time to 24-hour Indonesian format (e.g. "15:30" or "15:30 WIB")
 */
export function formatTime(
  date: Date | string,
  includeWibSuffix = false,
  locale = DEFAULT_LOCALE,
  timeZone = DEFAULT_TIMEZONE
): string {
  if (!date) return '--:--'
  // If already in HH:mm or HH:mm:ss string format (e.g., "08:00")
  if (typeof date === 'string' && date.length <= 8 && date.includes(':')) {
    const timeOnly = date.substring(0, 5)
    return includeWibSuffix ? `${timeOnly} WIB` : timeOnly
  }
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return String(date)
  const timeStr = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
  return includeWibSuffix ? `${timeStr} WIB` : timeStr
}

/**
 * Format Date & Time with WIB suffix (e.g. "23 Agu 2026, 15:30 WIB")
 */
export function formatDateTime(
  date: Date | string,
  locale = DEFAULT_LOCALE,
  timeZone = DEFAULT_TIMEZONE
): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return String(date)
  const datePart = new Intl.DateTimeFormat(locale, {
    timeZone,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
  const timePart = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
  return `${datePart}, ${timePart} WIB`
}

/**
 * Format short date (e.g. "23 Agu 2026")
 */
export function formatShortDate(
  date: Date | string,
  locale = DEFAULT_LOCALE,
  timeZone = DEFAULT_TIMEZONE
): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return String(date)
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

/**
 * Truncate a string to a max length with an ellipsis.
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}
