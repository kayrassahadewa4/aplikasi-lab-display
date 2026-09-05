export interface LecturerScheduleDetail {
  id: string
  scheduleCode: string
  timeSlot: string
  startTime: string
  endTime: string
  date: string
  formattedDate: string
  dayName: string
  roomName: string
  roomCode: string
  roomLocation: string
  courseName: string
  courseCode: string
  className: string
  studentCount: number
  instructorName: string
  instructorNip: string
  status: 'UPCOMING' | 'IN USE' | 'COMPLETED' | 'CANCELLED' | 'PENDING'
  relatedRequestId?: string
  relatedRequestCode?: string
  createdAt: string
  updatedAt: string
  notes?: string
}

export const mockLecturerScheduleList: LecturerScheduleDetail[] = [
  {
    id: 'lsched-101',
    scheduleCode: 'SCH-KIM-01',
    timeSlot: '13:00 – 15:00',
    startTime: '13:00',
    endTime: '15:00',
    date: '2026-08-12',
    formattedDate: 'Wednesday, Aug 12, 2026',
    dayName: 'Wednesday',
    roomName: 'Chemistry Laboratory',
    roomCode: 'LAB-KIM',
    roomLocation: 'Science Building B · Floor 1',
    courseName: 'CH101 Applied Chemistry Practice',
    courseCode: 'CH101',
    className: 'Class XII RPL 1',
    studentCount: 30,
    instructorName: 'Dr. Emily Chen',
    instructorNip: '19870415 201201 2 003',
    status: 'UPCOMING',
    relatedRequestId: 'lreq-1',
    relatedRequestCode: 'REQ-0124',
    createdAt: '2026-08-01 09:30',
    updatedAt: '2026-08-10 14:15',
    notes: 'Mid-term practical demonstration on acid-base titration titration equipment.',
  },
  {
    id: 'lsched-102',
    scheduleCode: 'SCH-KOM-02',
    timeSlot: '15:30 – 17:30',
    startTime: '15:30',
    endTime: '17:30',
    date: '2026-08-13',
    formattedDate: 'Thursday, Aug 13, 2026',
    dayName: 'Thursday',
    roomName: 'Computer Laboratory A',
    roomCode: 'LAB-KOM-A',
    roomLocation: 'Main Building A · Floor 2',
    courseName: 'CS301 Web Programming Practicum',
    courseCode: 'CS301',
    className: 'Class XII RPL 2',
    studentCount: 28,
    instructorName: 'Dr. Emily Chen',
    instructorNip: '19870415 201201 2 003',
    status: 'UPCOMING',
    relatedRequestId: 'lreq-2',
    relatedRequestCode: 'REQ-0119',
    createdAt: '2026-08-03 11:00',
    updatedAt: '2026-08-11 08:45',
    notes: 'Vue 3 composition API hands-on lab assignment.',
  },
  {
    id: 'lsched-103',
    scheduleCode: 'SCH-MM-03',
    timeSlot: '08:00 – 10:00',
    startTime: '08:00',
    endTime: '10:00',
    date: '2026-08-15',
    formattedDate: 'Saturday, Aug 15, 2026',
    dayName: 'Saturday',
    roomName: 'Multimedia Laboratory',
    roomCode: 'LAB-MM',
    roomLocation: 'Creative Tower · Floor 3',
    courseName: '3D Animation & Rendering Practice',
    courseCode: 'MM204',
    className: 'Class XI MM 1',
    studentCount: 25,
    instructorName: 'Dr. Emily Chen',
    instructorNip: '19870415 201201 2 003',
    status: 'UPCOMING',
    relatedRequestId: 'lreq-5',
    relatedRequestCode: 'REQ-0130',
    createdAt: '2026-08-05 15:20',
    updatedAt: '2026-08-11 16:30',
    notes: 'Blender keyframe animation rendering workshop.',
  },
  {
    id: 'lsched-104',
    scheduleCode: 'SCH-JAR-04',
    timeSlot: '10:00 – 12:00',
    startTime: '10:00',
    endTime: '12:00',
    date: '2026-08-17',
    formattedDate: 'Monday, Aug 17, 2026',
    dayName: 'Monday',
    roomName: 'Networking Laboratory',
    roomCode: 'LAB-JAR',
    roomLocation: 'Main Building A · Floor 3',
    courseName: 'Cisco Router & Switch Configuration',
    courseCode: 'NW402',
    className: 'Class XII TKJ 1',
    studentCount: 32,
    instructorName: 'Dr. Emily Chen',
    instructorNip: '19870415 201201 2 003',
    status: 'IN USE',
    relatedRequestId: 'lreq-3',
    relatedRequestCode: 'REQ-0110',
    createdAt: '2026-08-02 08:15',
    updatedAt: '2026-08-12 10:05',
    notes: 'VLAN and inter-VLAN routing lab exam.',
  },
  {
    id: 'lsched-105',
    scheduleCode: 'SCH-KIM-05',
    timeSlot: '13:00 – 15:00',
    startTime: '13:00',
    endTime: '15:00',
    date: '2026-08-18',
    formattedDate: 'Tuesday, Aug 18, 2026',
    dayName: 'Tuesday',
    roomName: 'Chemistry Laboratory',
    roomCode: 'LAB-KIM',
    roomLocation: 'Science Building B · Floor 1',
    courseName: 'Organic Compounds Synthesis',
    courseCode: 'CH202',
    className: 'Class XI RPL 2',
    studentCount: 22,
    instructorName: 'Dr. Emily Chen',
    instructorNip: '19870415 201201 2 003',
    status: 'PENDING',
    relatedRequestId: 'lreq-6',
    relatedRequestCode: 'REQ-0135',
    createdAt: '2026-08-10 13:00',
    updatedAt: '2026-08-10 13:00',
    notes: 'Awaiting Laboran room availability confirmation.',
  },
  {
    id: 'lsched-106',
    scheduleCode: 'SCH-KOM-06',
    timeSlot: '09:00 – 11:00',
    startTime: '09:00',
    endTime: '11:00',
    date: '2026-08-08',
    formattedDate: 'Saturday, Aug 8, 2026',
    dayName: 'Saturday',
    roomName: 'Computer Laboratory B',
    roomCode: 'LAB-KOM-B',
    roomLocation: 'Main Building A · Floor 2',
    courseName: 'Database Indexing & Tuning Lab',
    courseCode: 'CS204',
    className: 'Class XI RPL 1',
    studentCount: 35,
    instructorName: 'Dr. Emily Chen',
    instructorNip: '19870415 201201 2 003',
    status: 'COMPLETED',
    relatedRequestId: 'lreq-7',
    relatedRequestCode: 'REQ-0095',
    createdAt: '2026-07-28 10:00',
    updatedAt: '2026-08-08 11:05',
    notes: 'Session completed successfully. Lab check-out verified by Andi.',
  },
]

export const getLecturerScheduleById = (id: string): LecturerScheduleDetail | undefined => {
  return mockLecturerScheduleList.find(s => s.id === id || s.scheduleCode === id)
}
