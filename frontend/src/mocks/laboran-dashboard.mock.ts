export interface LaboranStat {
  id: string
  title: string
  value: number | string
  subtext: string
  iconName: 'Calendar' | 'Activity' | 'FlaskConical' | 'Clock'
  iconBg: string
  iconColor: string
  trend?: string
}

export interface TodayScheduleItem {
  id: string
  timeSlot: string
  roomName: string
  roomCode: string
  courseName: string
  instructor: string
  studentCount: number
  status: 'IN USE' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'
}

export interface ActiveSessionItem {
  id: string
  roomName: string
  courseName: string
  instructor: string
  startTime: string
  durationFormatted: string
  capacity: string
  status: 'Active Now'
}

export interface LabStatusItem {
  id: string
  name: string
  code: string
  capacity: string
  status: 'Available' | 'In Use' | 'Under Maintenance' | 'Unavailable'
  note?: string
}

export interface PendingRequestItem {
  id: string
  requesterName: string
  requesterRole: string
  labName: string
  date: string
  time: string
  purpose: string
  status: 'Pending' | 'Approved' | 'Rejected'
}

export interface RecentActivityItem {
  id: string
  title: string
  timestamp: string
  type: 'checkin' | 'checkout' | 'approval' | 'maintenance' | 'status'
}

export const mockLaboranStats: LaboranStat[] = [
  {
    id: 'stat-schedules',
    title: "Today's Schedules",
    value: 12,
    subtext: "Today's scheduled sessions",
    iconName: 'Calendar',
    iconBg: 'bg-brand-100/90',
    iconColor: 'text-dark-green',
  },
  {
    id: 'stat-in-use',
    title: 'Laboratories In Use',
    value: 4,
    subtext: 'Currently occupied',
    iconName: 'Activity',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-dark-green',
  },
  {
    id: 'stat-available',
    title: 'Available Laboratories',
    value: 8,
    subtext: 'Ready for use',
    iconName: 'FlaskConical',
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-700',
  },
  {
    id: 'stat-pending',
    title: 'Pending Requests',
    value: 3,
    subtext: 'Requires review',
    iconName: 'Clock',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-800',
  },
]

export const mockTodaySchedules: TodayScheduleItem[] = [
  {
    id: 'sched-1',
    timeSlot: '08:00 – 10:00',
    roomName: 'Computer Laboratory A',
    roomCode: 'LAB-KOM-A',
    courseName: 'CS301 Web Programming Practicum',
    instructor: 'Dr. Sarah Connor',
    studentCount: 35,
    status: 'IN USE',
  },
  {
    id: 'sched-2',
    timeSlot: '10:00 – 12:00',
    roomName: 'Computer Laboratory B',
    roomCode: 'LAB-KOM-B',
    courseName: 'CS204 Database Systems Practicum',
    instructor: 'Prof. Michael Scott',
    studentCount: 28,
    status: 'UPCOMING',
  },
  {
    id: 'sched-3',
    timeSlot: '13:00 – 15:00',
    roomName: 'Chemistry Laboratory',
    roomCode: 'LAB-KIM',
    courseName: 'CH101 Applied Chemistry Practice',
    instructor: 'Dr. Emily Chen',
    studentCount: 20,
    status: 'UPCOMING',
  },
  {
    id: 'sched-4',
    timeSlot: '15:30 – 17:30',
    roomName: 'Networking Laboratory',
    roomCode: 'LAB-JAR',
    courseName: 'NW402 Cisco Router Config Lab',
    instructor: 'Budi Santoso, M.T',
    studentCount: 30,
    status: 'UPCOMING',
  },
]

export const mockActiveSessions: ActiveSessionItem[] = [
  {
    id: 'session-1',
    roomName: 'Computer Laboratory A (LAB-KOM-A)',
    courseName: 'CS301 Web Programming Practicum',
    instructor: 'Dr. Sarah Connor',
    startTime: '08:00 AM',
    durationFormatted: '01:24:08',
    capacity: '35 Workstations',
    status: 'Active Now',
  },
  {
    id: 'session-2',
    roomName: 'Multimedia Laboratory (LAB-MM)',
    courseName: '3D Graphics & Rendering Workshop',
    instructor: 'Dewi Lestari, S.T, M.Ds',
    startTime: '08:30 AM',
    durationFormatted: '00:54:12',
    capacity: '25 Render Nodes',
    status: 'Active Now',
  },
]

export const mockLaboratoriesStatus: LabStatusItem[] = [
  {
    id: 'lab-1',
    name: 'Computer Laboratory A',
    code: 'LAB-KOM-A',
    capacity: '35 PC',
    status: 'In Use',
    note: 'CS301 Web Programming',
  },
  {
    id: 'lab-2',
    name: 'Computer Laboratory B',
    code: 'LAB-KOM-B',
    capacity: '40 PC',
    status: 'Available',
    note: 'Next: 10:00 AM Session',
  },
  {
    id: 'lab-3',
    name: 'Chemistry Laboratory',
    code: 'LAB-KIM',
    capacity: '24 Station',
    status: 'Under Maintenance',
    note: 'Fume Hood Servicing',
  },
  {
    id: 'lab-4',
    name: 'Networking Laboratory',
    code: 'LAB-JAR',
    capacity: '30 Rack',
    status: 'Available',
    note: 'Ready for Session',
  },
  {
    id: 'lab-5',
    name: 'Multimedia Laboratory',
    code: 'LAB-MM',
    capacity: '25 Workstation',
    status: 'In Use',
    note: '3D Rendering Class',
  },
]

export const mockPendingRequests: PendingRequestItem[] = [
  {
    id: 'req-101',
    requesterName: 'Dr. Sarah Connor',
    requesterRole: 'Dosen / Pemohon',
    labName: 'Computer Laboratory A',
    date: 'Aug 12, 2026',
    time: '10:00 – 12:00',
    purpose: 'Web Dev Practical Exam (35 Workstations)',
    status: 'Pending',
  },
  {
    id: 'req-102',
    requesterName: 'Prof. Michael Scott',
    requesterRole: 'Dosen / Pemohon',
    labName: 'Networking Laboratory',
    date: 'Aug 14, 2026',
    time: '13:00 – 16:00',
    purpose: 'Cisco Router Benchmark Test',
    status: 'Pending',
  },
  {
    id: 'req-103',
    requesterName: 'Dewi Lestari, S.T, M.Ds',
    requesterRole: 'Dosen / Pemohon',
    labName: 'Multimedia Laboratory',
    date: 'Aug 15, 2026',
    time: '09:00 – 11:30',
    purpose: 'Wacom Graphics Tablet Workshop',
    status: 'Pending',
  },
]

export const mockRecentActivities: RecentActivityItem[] = [
  {
    id: 'act-1',
    title: 'Computer Laboratory A check-in completed for Dr. Sarah Connor',
    timestamp: '5 minutes ago',
    type: 'checkin',
  },
  {
    id: 'act-2',
    title: 'Networking Lab marked as available for scheduling',
    timestamp: '15 minutes ago',
    type: 'status',
  },
  {
    id: 'act-3',
    title: 'Room Request #102 approved for Prof. Michael Scott',
    timestamp: '1 hour ago',
    type: 'approval',
  },
  {
    id: 'act-4',
    title: 'Maintenance routine logged for Chemistry Lab (Fume Hood Servicing)',
    timestamp: '3 hours ago',
    type: 'maintenance',
  },
  {
    id: 'act-5',
    title: 'CS301 Practicum session check-out verified by Andi',
    timestamp: '4 hours ago',
    type: 'checkout',
  },
]
