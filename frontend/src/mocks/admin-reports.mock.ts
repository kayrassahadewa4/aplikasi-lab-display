export interface ReportSummaryMetric {
  title: string
  value: string
  subtext: string
  trend: 'up' | 'down' | 'neutral'
}

export interface LabUsageRanking {
  rank: number
  labName: string
  labCode: string
  hours: number
  sessions: number
  percentage: number
}

export interface DetailedReportRow {
  id: string
  date: string
  labName: string
  labCode: string
  activityName: string
  className: string
  checkedInBy: string
  timeWindow: string
  duration: string
  status: 'IN_USE' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED'
}

export const mockReportMetrics: ReportSummaryMetric[] = [
  { title: 'Total Usage Hours', value: '148 hrs', subtext: '+14% vs previous period', trend: 'up' },
  { title: 'Total Usage Sessions', value: '48 sessions', subtext: 'Avg 3.1 hrs per session', trend: 'up' },
  { title: 'Room Requests', value: '24 requests', subtext: '75% approval rate', trend: 'neutral' },
  { title: 'Average Utilization', value: '78%', subtext: 'Peak usage on Mon & Wed', trend: 'up' },
]

export const mockDailyTrendPoints = [
  { label: 'Mon', hours: 28, sessions: 9 },
  { label: 'Tue', hours: 22, sessions: 7 },
  { label: 'Wed', hours: 34, sessions: 11 },
  { label: 'Thu', hours: 19, sessions: 6 },
  { label: 'Fri', hours: 25, sessions: 8 },
  { label: 'Sat', hours: 14, sessions: 4 },
  { label: 'Sun', hours: 6, sessions: 2 },
]

export const mockLabComparisons: LabUsageRanking[] = [
  { rank: 1, labName: 'Multimedia & Game Dev Lab', labCode: 'LAB-MM', hours: 42, sessions: 14, percentage: 88 },
  { rank: 2, labName: 'Database Systems Laboratory', labCode: 'LAB-DB', hours: 36, sessions: 12, percentage: 75 },
  { rank: 3, labName: 'Computer Network Laboratory', labCode: 'LAB-JAR', hours: 28, sessions: 9, percentage: 58 },
  { rank: 4, labName: 'Software Engineering Laboratory', labCode: 'LAB-RPL', hours: 24, sessions: 8, percentage: 50 },
  { rank: 5, labName: 'Artificial Intelligence & Robotics Lab', labCode: 'LAB-AI', hours: 18, sessions: 5, percentage: 38 },
]

export const mockRequestStatusStats = [
  { label: 'Approved', count: 12, percentage: 50, color: '#657E47' },
  { label: 'Pending', count: 8, percentage: 33, color: '#D97706' },
  { label: 'Rejected', count: 4, percentage: 17, color: '#DC2626' },
]

export const mockUsageStatusStats = [
  { label: 'Checked Out', count: 17, percentage: 71, color: '#657E47' },
  { label: 'In Use', count: 3, percentage: 13, color: '#059669' },
  { label: 'Cancelled', count: 3, percentage: 13, color: '#9CA3AF' },
  { label: 'Checked In', count: 1, percentage: 4, color: '#3B82F6' },
]

export const mockDetailedReportRows: DetailedReportRow[] = [
  {
    id: 'rpt-101',
    date: 'Aug 09, 2026',
    labName: 'Software Engineering Laboratory',
    labCode: 'LAB-RPL',
    activityName: 'Web Programming Practicum',
    className: 'XII RPL 1',
    checkedInBy: 'Ahmad Rizky',
    timeWindow: '08:02 – 10:00',
    duration: '1h 58m',
    status: 'IN_USE',
  },
  {
    id: 'rpt-102',
    date: 'Aug 09, 2026',
    labName: 'Database Systems Laboratory',
    labCode: 'LAB-DB',
    activityName: 'Database Indexing Workshop',
    className: 'XII RPL 2',
    checkedInBy: 'Siti Aminah, M.Kom',
    timeWindow: '10:00 – 12:00',
    duration: '2h 00m',
    status: 'IN_USE',
  },
  {
    id: 'rpt-103',
    date: 'Aug 08, 2026',
    labName: 'Computer Network Laboratory',
    labCode: 'LAB-JAR',
    activityName: 'Network Configuration & Routing',
    className: 'XII TKJ 1',
    checkedInBy: 'Budi Santoso, M.T',
    timeWindow: '08:00 – 10:00',
    duration: '2h 00m',
    status: 'CHECKED_OUT',
  },
  {
    id: 'rpt-104',
    date: 'Aug 08, 2026',
    labName: 'Artificial Intelligence & Robotics Lab',
    labCode: 'LAB-AI',
    activityName: 'Robotics Kinematics Demo',
    className: 'XII AI 1',
    checkedInBy: 'Prof. Hendra Wijaya',
    timeWindow: '08:00 – 11:00',
    duration: '3h 00m',
    status: 'CHECKED_IN',
  },
  {
    id: 'rpt-105',
    date: 'Aug 07, 2026',
    labName: 'Multimedia & Game Dev Lab',
    labCode: 'LAB-MM',
    activityName: 'UI/UX Design & Prototyping',
    className: 'XII RPL 1',
    checkedInBy: 'Dewi Lestari, S.T, M.Ds',
    timeWindow: '10:00 – 12:00',
    duration: '2h 00m',
    status: 'CHECKED_OUT',
  },
  {
    id: 'rpt-106',
    date: 'Aug 06, 2026',
    labName: 'Multimedia & Game Dev Lab',
    labCode: 'LAB-MM',
    activityName: '3D Modeling & Animation',
    className: 'XI MM 1',
    checkedInBy: 'Dewi Lestari, S.T, M.Ds',
    timeWindow: '13:00 – 13:05',
    duration: '0h 05m',
    status: 'CANCELLED',
  },
]
