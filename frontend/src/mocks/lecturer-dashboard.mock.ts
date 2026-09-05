export interface LecturerStat {
  id: string
  title: string
  value: number | string
  subtext: string
  iconName: 'Calendar' | 'Clock' | 'CheckCircle2' | 'FlaskConical'
  iconBg: string
  iconColor: string
}

export interface LecturerScheduleItem {
  id: string
  timeSlot: string
  dateLabel: string
  roomName: string
  roomCode: string
  courseName: string
  courseCode: string
  className: string
  studentCount: number
  status: 'UPCOMING' | 'IN USE' | 'COMPLETED'
}

export interface LecturerRequestItem {
  id: string
  requestId: string
  labName: string
  purpose: string
  requestedDate: string
  requestedTime: string
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'
  submittedAt: string
}

export interface LecturerActivityItem {
  id: string
  title: string
  timestamp: string
  type: 'approval' | 'submission' | 'update' | 'rejection'
}

export interface LabAvailabilityItem {
  id: string
  name: string
  code: string
  status: 'Available' | 'In Use' | 'Maintenance'
  note?: string
}

export const mockLecturerStats: LecturerStat[] = [
  {
    id: 'stat-upcoming',
    title: 'Upcoming Sessions',
    value: 3,
    subtext: 'Next 7 days',
    iconName: 'Calendar',
    iconBg: 'bg-brand-100/90',
    iconColor: 'text-dark-green',
  },
  {
    id: 'stat-pending',
    title: 'Pending Requests',
    value: 3,
    subtext: 'Awaiting staff review',
    iconName: 'Clock',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-800',
  },
  {
    id: 'stat-approved',
    title: 'Approved Requests',
    value: 8,
    subtext: 'Ready for class',
    iconName: 'CheckCircle2',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-dark-green',
  },
  {
    id: 'stat-reservations',
    title: 'Active Reservations',
    value: 4,
    subtext: 'Active this semester',
    iconName: 'FlaskConical',
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-700',
  },
]

export const mockLecturerSchedules: LecturerScheduleItem[] = [
  {
    id: 'lsched-1',
    timeSlot: '13:00 – 15:00',
    dateLabel: 'Today, Aug 12',
    roomName: 'Chemistry Laboratory',
    roomCode: 'LAB-KIM',
    courseName: 'CH101 Applied Chemistry Practice',
    courseCode: 'CH101',
    className: 'Class XII RPL 1',
    studentCount: 30,
    status: 'UPCOMING',
  },
  {
    id: 'lsched-2',
    timeSlot: '15:30 – 17:30',
    dateLabel: 'Tomorrow, Aug 13',
    roomName: 'Computer Laboratory A',
    roomCode: 'LAB-KOM-A',
    courseName: 'CS301 Web Programming',
    courseCode: 'CS301',
    className: 'Class XII RPL 2',
    studentCount: 28,
    status: 'UPCOMING',
  },
  {
    id: 'lsched-3',
    timeSlot: '08:00 – 10:00',
    dateLabel: 'Friday, Aug 15',
    roomName: 'Multimedia Laboratory',
    roomCode: 'LAB-MM',
    courseName: '3D Animation & Rendering Practice',
    courseCode: 'MM204',
    className: 'Class XI MM 1',
    studentCount: 25,
    status: 'UPCOMING',
  },
]

export const mockLecturerRequests: LecturerRequestItem[] = [
  {
    id: 'lreq-1',
    requestId: 'REQ-0124',
    labName: 'Chemistry Laboratory',
    purpose: 'Applied Chemistry Practical Exam',
    requestedDate: '15 Aug 2026',
    requestedTime: '13:00 – 15:00',
    status: 'Pending',
    submittedAt: 'Yesterday',
  },
  {
    id: 'lreq-2',
    requestId: 'REQ-0119',
    labName: 'Computer Laboratory A',
    purpose: 'CS301 Midterm Examination',
    requestedDate: '16 Aug 2026',
    requestedTime: '09:00 – 11:00',
    status: 'Approved',
    submittedAt: '2 days ago',
  },
  {
    id: 'lreq-3',
    requestId: 'REQ-0110',
    labName: 'Networking Laboratory',
    purpose: 'Cisco Router Topology Practice',
    requestedDate: '10 Aug 2026',
    requestedTime: '14:00 – 16:30',
    status: 'Approved',
    submittedAt: '3 days ago',
  },
  {
    id: 'lreq-4',
    requestId: 'REQ-0098',
    labName: 'Multimedia Laboratory',
    purpose: 'Render Farm Trial Session',
    requestedDate: '05 Aug 2026',
    requestedTime: '10:00 – 12:00',
    status: 'Rejected',
    submittedAt: '1 week ago',
  },
]

export const mockLecturerActivities: LecturerActivityItem[] = [
  {
    id: 'lact-1',
    title: 'Room request REQ-0119 approved for Computer Laboratory A',
    timestamp: '2 hours ago',
    type: 'approval',
  },
  {
    id: 'lact-2',
    title: 'Room request REQ-0124 submitted for Chemistry Laboratory',
    timestamp: 'Yesterday',
    type: 'submission',
  },
  {
    id: 'lact-3',
    title: 'Schedule updated for CS301 Web Programming Practicum',
    timestamp: '2 days ago',
    type: 'update',
  },
  {
    id: 'lact-4',
    title: 'Room request REQ-0110 approved by Laboran Andi',
    timestamp: '3 days ago',
    type: 'approval',
  },
]

export const mockLecturerLabAvailabilities: LabAvailabilityItem[] = [
  {
    id: 'lab-kim',
    name: 'Chemistry Laboratory',
    code: 'LAB-KIM',
    status: 'Available',
    note: 'Ready for reservation',
  },
  {
    id: 'lab-kom-a',
    name: 'Computer Laboratory A',
    code: 'LAB-KOM-A',
    status: 'In Use',
    note: 'CS301 Web Dev Class',
  },
  {
    id: 'lab-jar',
    name: 'Networking Laboratory',
    code: 'LAB-JAR',
    status: 'Available',
    note: 'Ready for reservation',
  },
  {
    id: 'lab-mm',
    name: 'Multimedia Laboratory',
    code: 'LAB-MM',
    status: 'In Use',
    note: '3D Rendering Workshop',
  },
  {
    id: 'lab-kom-b',
    name: 'Computer Laboratory B',
    code: 'LAB-KOM-B',
    status: 'Available',
    note: 'Ready for reservation',
  },
]
