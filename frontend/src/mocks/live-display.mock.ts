export interface LiveSession {
  id: string
  labName: string
  labCode: string
  courseName: string
  courseCode: string
  instructor: string
  timeWindow: string
  startTime: string
  endTime: string
  progressPercentage: number
  status: 'IN_USE' | 'UPCOMING' | 'AVAILABLE' | 'MAINTENANCE'
  capacity: number
  occupancy: number
}

export interface UpcomingItem {
  id: string
  time: string
  labName: string
  labCode: string
  courseName: string
  courseCode: string
  instructor: string
}

export interface LabStatusCount {
  total: number
  inUse: number
  available: number
  maintenance: number
}

export const mockLiveSessions: LiveSession[] = [
  {
    id: 'live-1',
    labName: 'Multimedia & Game Dev Lab',
    labCode: 'LAB-MM',
    courseName: 'UI/UX Design & 3D Modeling',
    courseCode: 'MM204',
    instructor: 'Dewi Lestari, S.T, M.Ds',
    timeWindow: '08:00 — 10:30',
    startTime: '08:00',
    endTime: '10:30',
    progressPercentage: 82,
    status: 'IN_USE',
    capacity: 30,
    occupancy: 28,
  },
  {
    id: 'live-2',
    labName: 'Database Systems Laboratory',
    labCode: 'LAB-DB',
    courseName: 'Database Indexing & Query Tuning',
    courseCode: 'CS302',
    instructor: 'Prof. Michael Scott',
    timeWindow: '10:00 — 12:00',
    startTime: '10:00',
    endTime: '12:00',
    progressPercentage: 45,
    status: 'IN_USE',
    capacity: 36,
    occupancy: 32,
  },
  {
    id: 'live-3',
    labName: 'Software Engineering Laboratory',
    labCode: 'LAB-RPL',
    courseName: 'Web Programming Practicum',
    courseCode: 'CS301',
    instructor: 'Dr. Sarah Connor',
    timeWindow: '10:00 — 12:00',
    startTime: '10:00',
    endTime: '12:00',
    progressPercentage: 30,
    status: 'IN_USE',
    capacity: 36,
    occupancy: 34,
  },
  {
    id: 'live-4',
    labName: 'Computer Network Laboratory',
    labCode: 'LAB-JAR',
    courseName: 'Network Routing & Cisco Config',
    courseCode: 'NET102',
    instructor: 'Budi Santoso, M.T',
    timeWindow: '13:00 — 15:00',
    startTime: '13:00',
    endTime: '15:00',
    progressPercentage: 0,
    status: 'UPCOMING',
    capacity: 36,
    occupancy: 0,
  },
  {
    id: 'live-5',
    labName: 'Artificial Intelligence & Robotics Lab',
    labCode: 'LAB-AI',
    courseName: 'Open Research & Autonomous Hardware',
    courseCode: 'AI401',
    instructor: 'Prof. Hendra Wijaya',
    timeWindow: 'Available for reservation',
    startTime: '12:00',
    endTime: '16:00',
    progressPercentage: 0,
    status: 'AVAILABLE',
    capacity: 25,
    occupancy: 0,
  },
]

export const mockUpcomingItems: UpcomingItem[] = [
  {
    id: 'up-1',
    time: '11:00 — 13:00',
    labName: 'Software Engineering Lab',
    labCode: 'LAB-RPL',
    courseName: 'Software Architecture & Design Patterns',
    courseCode: 'CS304',
    instructor: 'Dr. Aris Setiawan',
  },
  {
    id: 'up-2',
    time: '13:00 — 15:00',
    labName: 'Database Systems Lab',
    labCode: 'LAB-DB',
    courseName: 'Distributed Database Systems',
    courseCode: 'CS402',
    instructor: 'Prof. Michael Scott',
  },
  {
    id: 'up-3',
    time: '14:00 — 16:00',
    labName: 'Multimedia & Game Dev Lab',
    labCode: 'LAB-MM',
    courseName: 'Real-time Game Physics & Animation',
    courseCode: 'MM302',
    instructor: 'Eko Prasetyo, M.T',
  },
  {
    id: 'up-4',
    time: '15:00 — 17:00',
    labName: 'Computer Network Lab',
    labCode: 'LAB-JAR',
    courseName: 'Cyber Security & Network Defense',
    courseCode: 'NET201',
    instructor: 'Budi Santoso, M.T',
  },
]

export const mockLabStatusSummary: LabStatusCount = {
  total: 5,
  inUse: 3,
  available: 1,
  maintenance: 1,
}

export const mockLiveAnnouncements = [
  'NOTICE: Mid-Semester Laboratory Examinations scheduled for August 15–20, 2026. All room reservation requests must be submitted 24 hours prior.',
  'REMINDER: Please ensure all computer workstations are powered off and equipment returned to storage after practical sessions.',
]
