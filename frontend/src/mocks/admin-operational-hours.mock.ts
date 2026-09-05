export interface OperationalHourData {
  id: string
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'
  openTime: string
  closeTime: string
  durationHours: number
  status: 'Open' | 'Closed'
  createdAt: string
  updatedAt: string
  // Added fields for backend integration
  laboratoryId?: string
  laboratoryCode?: string
  laboratoryName?: string
}

export const mockOperationalHoursList: OperationalHourData[] = [
  {
    id: 'oph-101',
    day: 'Monday',
    openTime: '08:00',
    closeTime: '17:00',
    durationHours: 9,
    status: 'Open',
    createdAt: 'August 1, 2026',
    updatedAt: 'August 5, 2026',
  },
  {
    id: 'oph-102',
    day: 'Tuesday',
    openTime: '08:00',
    closeTime: '17:00',
    durationHours: 9,
    status: 'Open',
    createdAt: 'August 1, 2026',
    updatedAt: 'August 5, 2026',
  },
  {
    id: 'oph-103',
    day: 'Wednesday',
    openTime: '08:00',
    closeTime: '17:00',
    durationHours: 9,
    status: 'Open',
    createdAt: 'August 1, 2026',
    updatedAt: 'August 5, 2026',
  },
  {
    id: 'oph-104',
    day: 'Thursday',
    openTime: '08:00',
    closeTime: '17:00',
    durationHours: 9,
    status: 'Open',
    createdAt: 'August 1, 2026',
    updatedAt: 'August 5, 2026',
  },
  {
    id: 'oph-105',
    day: 'Friday',
    openTime: '08:00',
    closeTime: '16:00',
    durationHours: 8,
    status: 'Open',
    createdAt: 'August 1, 2026',
    updatedAt: 'August 5, 2026',
  },
  {
    id: 'oph-106',
    day: 'Saturday',
    openTime: '08:00',
    closeTime: '12:00',
    durationHours: 4,
    status: 'Open',
    createdAt: 'August 1, 2026',
    updatedAt: 'August 5, 2026',
  },
  {
    id: 'oph-107',
    day: 'Sunday',
    openTime: '00:00',
    closeTime: '00:00',
    durationHours: 0,
    status: 'Closed',
    createdAt: 'August 1, 2026',
    updatedAt: 'August 5, 2026',
  },
]
