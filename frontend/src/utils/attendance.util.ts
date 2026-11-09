/**
 * Attendance & Late Tolerance Evaluation Utility
 *
 * Rules:
 * 1. Before session start time:
 *    - Not checked in: 'UPCOMING' (Menunggu Jam Masuk)
 *    - Checked in early: 'EARLY' (Hadir Lebih Awal)
 * 2. Between session start time and (endTime - 1 minute):
 *    - Checked in: 'ON_TIME' / 'ATTENDED' (Hadir - Sesi Berlangsung)
 *    - Not checked in: 'LATE' (Dosen Terlambat - X menit belum masuk)
 * 3. At or after (endTime - 1 minute):
 *    - If no check-in occurred during the session: 'ABSENT' (Dosen Dinyatakan Tidak Hadir / Alpha)
 *    - If checked in: 'COMPLETED' (Selesai)
 */

export type AttendanceStatusType =
  | 'UPCOMING'
  | 'EARLY'
  | 'ON_TIME'
  | 'LATE'
  | 'ABSENT'
  | 'COMPLETED'

export interface AttendanceEvaluationResult {
  status: AttendanceStatusType
  label: string
  badgeClass: string
  pillClass: string
  description: string
  diffMinutes: number
  isLate: boolean
  isAbsent: boolean
  isEarly: boolean
  isOnTime: boolean
  timeText: string
  toleranceCutoffMinutes: number // endMin - 1
}

/**
 * Extract HH:mm from ISO string, "HH:mm:ss", "HH.mm", or Date
 */
export function extractHHmm(timeValue: string | Date | undefined | null): string {
  if (!timeValue) return '00:00'
  if (typeof timeValue === 'string') {
    const trimmed = timeValue.trim()
    const match = trimmed.match(/^(\d{1,2})[:.](\d{1,2})/)
    if (match && !trimmed.includes('T')) {
      const h = match[1]!.padStart(2, '0')
      const m = match[2]!.padStart(2, '0')
      return `${h}:${m}`
    }
    if (trimmed.includes('T')) {
      const d = new Date(trimmed)
      if (!isNaN(d.getTime())) {
        const h = d.getUTCHours().toString().padStart(2, '0')
        const m = d.getUTCMinutes().toString().padStart(2, '0')
        return `${h}:${m}`
      }
    }
  } else if (timeValue instanceof Date) {
    if (!isNaN(timeValue.getTime())) {
      const h = timeValue.getUTCHours().toString().padStart(2, '0')
      const m = timeValue.getUTCMinutes().toString().padStart(2, '0')
      return `${h}:${m}`
    }
  }
  return '00:00'
}

/**
 * Convert time string "HH:mm" to minutes from midnight
 */
export function parseTimeToMinutes(timeValue: string | Date | undefined | null): number {
  const timeStr = extractHHmm(timeValue)
  const parts = timeStr.split(':')
  const h = parts[0] !== undefined ? parseInt(parts[0], 10) : 0
  const m = parts[1] !== undefined ? parseInt(parts[1], 10) : 0
  if (isNaN(h) || isNaN(m)) return 0
  return h * 60 + m
}

/**
 * Calculate effective end minutes (defaults to +120 mins if missing or invalid, max 22:00)
 */
export function getEffectiveEndMinutes(
  startTime: string | Date | undefined | null,
  endTime: string | Date | undefined | null,
): number {
  const startMin = parseTimeToMinutes(startTime)
  let endMin = parseTimeToMinutes(endTime)
  if (endMin <= startMin || endMin === 0) {
    endMin = Math.min(1320, startMin + 120)
  }
  return endMin
}

/**
 * Get current minutes in Jakarta WIB timezone (Asia/Jakarta, UTC+7)
 */
export function getCurrentJakartaMinutes(now: Date = new Date()): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    const parts = formatter.formatToParts(now)
    const hStr = parts.find((p) => p.type === 'hour')?.value || '0'
    const mStr = parts.find((p) => p.type === 'minute')?.value || '0'
    return parseInt(hStr, 10) * 60 + parseInt(mStr, 10)
  } catch {
    return now.getHours() * 60 + now.getMinutes()
  }
}

/**
 * Get current date string in Jakarta WIB timezone (YYYY-MM-DD)
 */
export function getCurrentJakartaDate(now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now)
  } catch {
    const y = now.getFullYear()
    const m = (now.getMonth() + 1).toString().padStart(2, '0')
    const d = now.getDate().toString().padStart(2, '0')
    return `${y}-${m}-${d}`
  }
}

export interface EvaluateSessionAttendanceOptions {
  startTime: string | Date | undefined | null
  endTime: string | Date | undefined | null
  isCheckedIn?: boolean
  checkInTime?: string | Date | undefined | null
  sessionDate?: string | Date | undefined | null
  now?: Date
}

/**
 * Evaluate session attendance according to the Automatic Late Tolerance policy:
 * - 1 minute before class end time: lecturer officially declared ABSENT (Tidak Hadir).
 */
export function evaluateSessionAttendance(
  options: EvaluateSessionAttendanceOptions,
): AttendanceEvaluationResult {
  const now = options.now || new Date()
  const currentMinutes = getCurrentJakartaMinutes(now)
  const currentDateStr = getCurrentJakartaDate(now)

  const startMin = parseTimeToMinutes(options.startTime)
  const endMin = getEffectiveEndMinutes(options.startTime, options.endTime)
  const toleranceCutoffMin = Math.max(startMin, endMin - 1) // 1 minute before session end

  const startTimeStr = extractHHmm(options.startTime)
  const endTimeStr = extractHHmm(options.endTime)
  const timeText = `${startTimeStr} – ${endTimeStr} WIB`

  // 1. Check Date Context (if sessionDate is specified)
  if (options.sessionDate) {
    const rawDate = typeof options.sessionDate === 'string'
      ? options.sessionDate.split('T')[0]
      : getCurrentJakartaDate(options.sessionDate)

    if (rawDate && rawDate !== currentDateStr) {
      if (rawDate < currentDateStr) {
        // Past date
        if (options.isCheckedIn) {
          return {
            status: 'COMPLETED',
            label: 'Selesai (Hadir)',
            badgeClass: 'bg-gray-100 text-gray-700 border-gray-300',
            pillClass: 'bg-gray-100 text-gray-600',
            description: 'Sesi perkuliahan pada tanggal lampau telah selesai.',
            diffMinutes: 0,
            isLate: false,
            isAbsent: false,
            isEarly: false,
            isOnTime: true,
            timeText,
            toleranceCutoffMinutes: toleranceCutoffMin,
          }
        }
        return {
          status: 'ABSENT',
          label: 'Dosen Tidak Hadir',
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
          pillClass: 'bg-rose-50 text-rose-700 border-rose-200',
          description: 'Sesi pada tanggal lampau tidak dihadiri / tidak melakukan check-in.',
          diffMinutes: 0,
          isLate: false,
          isAbsent: true,
          isEarly: false,
          isOnTime: false,
          timeText,
          toleranceCutoffMinutes: toleranceCutoffMin,
        }
      } else {
        // Future date
        return {
          status: 'UPCOMING',
          label: 'Menunggu Jadwal',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
          pillClass: 'bg-slate-50 text-slate-600 border-slate-200',
          description: 'Sesi dijadwalkan untuk hari mendatang.',
          diffMinutes: 0,
          isLate: false,
          isAbsent: false,
          isEarly: false,
          isOnTime: false,
          timeText,
          toleranceCutoffMinutes: toleranceCutoffMin,
        }
      }
    }
  }

  // 2. Evaluated for TODAY:
  // Case A: Lecturer is already CHECKED IN
  if (options.isCheckedIn) {
    if (currentMinutes >= endMin) {
      return {
        status: 'COMPLETED',
        label: 'Selesai (Hadir)',
        badgeClass: 'bg-gray-100 text-gray-700 border-gray-300',
        pillClass: 'bg-gray-100 text-gray-600',
        description: 'Sesi telah selesai dilaksanakan.',
        diffMinutes: 0,
        isLate: false,
        isAbsent: false,
        isEarly: false,
        isOnTime: true,
        timeText,
        toleranceCutoffMinutes: toleranceCutoffMin,
      }
    }

    const checkInMin = options.checkInTime ? parseTimeToMinutes(options.checkInTime) : currentMinutes
    if (checkInMin < startMin - 5) {
      const diff = startMin - checkInMin
      return {
        status: 'EARLY',
        label: `Masuk Lebih Awal (${diff} mnt)`,
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        pillClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        description: `Dosen hadir dan check-in ${diff} menit lebih awal dari jadwal resmi.`,
        diffMinutes: diff,
        isLate: false,
        isAbsent: false,
        isEarly: true,
        isOnTime: false,
        timeText,
        toleranceCutoffMinutes: toleranceCutoffMin,
      }
    }

    if (checkInMin > startMin + 5) {
      const diff = checkInMin - startMin
      return {
        status: 'LATE',
        label: `Hadir Terlambat (${diff} mnt)`,
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
        pillClass: 'bg-amber-50 text-amber-800 border-amber-200',
        description: `Dosen check-in terlambat ${diff} menit dari jadwal resmi.`,
        diffMinutes: diff,
        isLate: true,
        isAbsent: false,
        isEarly: false,
        isOnTime: false,
        timeText,
        toleranceCutoffMinutes: toleranceCutoffMin,
      }
    }

    return {
      status: 'ON_TIME',
      label: 'Hadir Tepat Waktu',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      pillClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'Sesi sedang berlangsung, dosen hadir tepat waktu.',
      diffMinutes: 0,
      isLate: false,
      isAbsent: false,
      isEarly: false,
      isOnTime: true,
      timeText,
      toleranceCutoffMinutes: toleranceCutoffMin,
    }
  }

  // Case B: Lecturer has NOT checked in yet
  // B1. Before Start Time
  if (currentMinutes < startMin) {
    const diff = startMin - currentMinutes
    const hours = Math.floor(diff / 60)
    const mins = diff % 60
    const diffText = hours > 0 ? `${hours} jam ${mins} mnt lagi` : `${mins} mnt lagi`

    return {
      status: 'UPCOMING',
      label: 'Menunggu Jam Mulai',
      badgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
      pillClass: 'bg-sky-50 text-sky-700 border-sky-200',
      description: `Perkuliahan dimulai dalam ${diffText} (${startTimeStr} WIB).`,
      diffMinutes: diff,
      isLate: false,
      isAbsent: false,
      isEarly: false,
      isOnTime: false,
      timeText,
      toleranceCutoffMinutes: toleranceCutoffMin,
    }
  }

  // B2. At or After Cutoff (1 minute before end time or past end time)
  // CORE RULE: 1 menit sebelum jam berakhir -> Dinyatakan Dosen Tidak Hadir
  if (currentMinutes >= toleranceCutoffMin) {
    return {
      status: 'ABSENT',
      label: 'Dosen Tidak Hadir (Alpha)',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
      pillClass: 'bg-rose-50 text-rose-700 border-rose-200',
      description:
        'Batas toleransi kehadiran telah berakhir (1 menit sebelum jam kuliah selesai). Dosen dinyatakan Tidak Hadir.',
      diffMinutes: Math.max(0, currentMinutes - startMin),
      isLate: false,
      isAbsent: true,
      isEarly: false,
      isOnTime: false,
      timeText,
      toleranceCutoffMinutes: toleranceCutoffMin,
    }
  }

  // B3. Started but still within tolerance window (startMin <= currentMinutes < toleranceCutoffMin)
  const diffLate = currentMinutes - startMin
  const hours = Math.floor(diffLate / 60)
  const mins = diffLate % 60
  const diffText = hours > 0 ? `${hours} jam ${mins} mnt` : `${mins} menit`

  return {
    status: 'LATE',
    label: `Dosen Terlambat (${diffText})`,
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    pillClass: 'bg-amber-50 text-amber-800 border-amber-200',
    description: `Dosen belum check-in ke laboratorium. Keterlambatan berjalan: ${diffText}.`,
    diffMinutes: diffLate,
    isLate: true,
    isAbsent: false,
    isEarly: false,
    isOnTime: false,
    timeText,
    toleranceCutoffMinutes: toleranceCutoffMin,
  }
}
