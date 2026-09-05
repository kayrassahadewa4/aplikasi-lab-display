export interface AcademicPeriodData {
  id: string
  academicYear: string
  semester: 'Odd Semester' | 'Even Semester' | 'Short / Summer Term'
  startDate: string
  endDate: string
  formattedStartDate: string
  formattedEndDate: string
  duration: string
  status: 'Active' | 'Upcoming' | 'Completed'
  createdAt: string
  updatedAt: string
}

export const mockAcademicPeriodsList: AcademicPeriodData[] = [
  {
    id: 'period-101',
    academicYear: '2026/2027',
    semester: 'Odd Semester',
    startDate: '2026-08-01',
    endDate: '2027-01-31',
    formattedStartDate: 'Aug 01, 2026',
    formattedEndDate: 'Jan 31, 2027',
    duration: '6 months',
    status: 'Active',
    createdAt: 'July 20, 2026',
    updatedAt: 'July 28, 2026',
  },
  {
    id: 'period-102',
    academicYear: '2027/2028',
    semester: 'Odd Semester',
    startDate: '2027-08-01',
    endDate: '2028-01-31',
    formattedStartDate: 'Aug 01, 2027',
    formattedEndDate: 'Jan 31, 2028',
    duration: '6 months',
    status: 'Upcoming',
    createdAt: 'August 1, 2026',
    updatedAt: 'August 5, 2026',
  },
  {
    id: 'period-103',
    academicYear: '2025/2026',
    semester: 'Even Semester',
    startDate: '2026-02-01',
    endDate: '2026-07-31',
    formattedStartDate: 'Feb 01, 2026',
    formattedEndDate: 'Jul 31, 2026',
    duration: '6 months',
    status: 'Completed',
    createdAt: 'January 15, 2026',
    updatedAt: 'January 25, 2026',
  },
  {
    id: 'period-104',
    academicYear: '2025/2026',
    semester: 'Odd Semester',
    startDate: '2025-08-01',
    endDate: '2026-01-31',
    formattedStartDate: 'Aug 01, 2025',
    formattedEndDate: 'Jan 31, 2026',
    duration: '6 months',
    status: 'Completed',
    createdAt: 'July 10, 2025',
    updatedAt: 'July 20, 2025',
  },
  {
    id: 'period-105',
    academicYear: '2024/2025',
    semester: 'Even Semester',
    startDate: '2025-02-01',
    endDate: '2025-07-31',
    formattedStartDate: 'Feb 01, 2025',
    formattedEndDate: 'Jul 31, 2025',
    duration: '6 months',
    status: 'Completed',
    createdAt: 'January 10, 2025',
    updatedAt: 'January 18, 2025',
  },
]
