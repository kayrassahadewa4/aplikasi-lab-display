export interface LecturerRoomRequestDetail {
  id: string
  requestCode: string
  labId: string
  labName: string
  labCode: string
  activityName: string
  courseName: string
  courseCode: string
  targetClass: string
  studentCount: number
  requestedDate: string
  formattedDate: string
  startTime: string
  endTime: string
  timeSlot: string
  purpose: string
  submittedAt: string
  updatedAt: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'
  approvalNote?: string
  reviewedBy?: string
  reviewedAt?: string
  relatedScheduleId?: string
  relatedScheduleCode?: string
}

export const mockLecturerRoomRequestList: LecturerRoomRequestDetail[] = [
  {
    id: 'lreq-00124',
    requestCode: 'REQ-00124',
    labId: 'lab-kim',
    labName: 'Chemistry Laboratory',
    labCode: 'LAB-KIM',
    activityName: 'Applied Chemistry Practical Exam',
    courseName: 'CH101 Applied Chemistry Practice',
    courseCode: 'CH101',
    targetClass: 'Class XII RPL 1',
    studentCount: 30,
    requestedDate: '2026-08-15',
    formattedDate: '15 Aug 2026',
    startTime: '13:00',
    endTime: '15:00',
    timeSlot: '13:00 – 15:00',
    purpose: 'Acid-base titration practical examination using fume hood workstations.',
    submittedAt: '10 Aug 2026',
    updatedAt: '10 Aug 2026',
    status: 'PENDING',
    relatedScheduleId: 'lsched-101',
    relatedScheduleCode: 'SCH-KIM-01',
  },
  {
    id: 'lreq-00119',
    requestCode: 'REQ-00119',
    labId: 'lab-kom-a',
    labName: 'Computer Laboratory A',
    labCode: 'LAB-KOM-A',
    activityName: 'CS301 Midterm Examination',
    courseName: 'CS301 Web Programming',
    courseCode: 'CS301',
    targetClass: 'Class XII RPL 2',
    studentCount: 28,
    requestedDate: '2026-08-16',
    formattedDate: '16 Aug 2026',
    startTime: '09:00',
    endTime: '11:00',
    timeSlot: '09:00 – 11:00',
    purpose: 'Vue 3 & Tailwind CSS practical exam for Web Programming class.',
    submittedAt: '08 Aug 2026',
    updatedAt: '09 Aug 2026',
    status: 'APPROVED',
    approvalNote: 'Approved by Laboran Andi. Workstations 1-28 allocated.',
    reviewedBy: 'Andi Pratama, S.Kom (Laboran)',
    reviewedAt: '09 Aug 2026 14:30',
    relatedScheduleId: 'lsched-102',
    relatedScheduleCode: 'SCH-KOM-02',
  },
  {
    id: 'lreq-00110',
    requestCode: 'REQ-00110',
    labId: 'lab-jar',
    labName: 'Networking Laboratory',
    labCode: 'LAB-JAR',
    activityName: 'Cisco Router Benchmark Test',
    courseName: 'NW402 Cisco Router Config',
    courseCode: 'NW402',
    targetClass: 'Class XII TKJ 1',
    studentCount: 32,
    requestedDate: '2026-08-17',
    formattedDate: '17 Aug 2026',
    startTime: '10:00',
    endTime: '12:00',
    timeSlot: '10:00 – 12:00',
    purpose: 'VLAN and inter-VLAN routing lab benchmark evaluation.',
    submittedAt: '05 Aug 2026',
    updatedAt: '06 Aug 2026',
    status: 'APPROVED',
    approvalNote: 'Approved. Cisco Rack 1-8 reserved.',
    reviewedBy: 'Andi Pratama, S.Kom (Laboran)',
    reviewedAt: '06 Aug 2026 11:15',
    relatedScheduleId: 'lsched-104',
    relatedScheduleCode: 'SCH-JAR-04',
  },
  {
    id: 'lreq-00098',
    requestCode: 'REQ-00098',
    labId: 'lab-mm',
    labName: 'Multimedia Laboratory',
    labCode: 'LAB-MM',
    activityName: 'Render Farm Trial Session',
    courseName: 'MM204 3D Animation Practice',
    courseCode: 'MM204',
    targetClass: 'Class XI MM 1',
    studentCount: 25,
    requestedDate: '2026-08-05',
    formattedDate: '05 Aug 2026',
    startTime: '10:00',
    endTime: '12:00',
    timeSlot: '10:00 – 12:00',
    purpose: 'Heavy GPU rendering test session.',
    submittedAt: '01 Aug 2026',
    updatedAt: '02 Aug 2026',
    status: 'REJECTED',
    approvalNote: 'Conflict with scheduled maintenance routine on render nodes.',
    reviewedBy: 'Andi Pratama, S.Kom (Laboran)',
    reviewedAt: '02 Aug 2026 16:00',
  },
  {
    id: 'lreq-00135',
    requestCode: 'REQ-00135',
    labId: 'lab-kim',
    labName: 'Chemistry Laboratory',
    labCode: 'LAB-KIM',
    activityName: 'Organic Compounds Synthesis',
    courseName: 'CH202 Organic Chemistry',
    courseCode: 'CH202',
    targetClass: 'Class XI RPL 2',
    studentCount: 22,
    requestedDate: '2026-08-18',
    formattedDate: '18 Aug 2026',
    startTime: '13:00',
    endTime: '15:00',
    timeSlot: '13:00 – 15:00',
    purpose: 'Synthesis of esters and distillation experiment.',
    submittedAt: '11 Aug 2026',
    updatedAt: '11 Aug 2026',
    status: 'PENDING',
  },
  {
    id: 'lreq-00085',
    requestCode: 'REQ-00085',
    labId: 'lab-kom-b',
    labName: 'Computer Laboratory B',
    labCode: 'LAB-KOM-B',
    activityName: 'Database Indexing Practice',
    courseName: 'CS204 Database Systems',
    courseCode: 'CS204',
    targetClass: 'Class XI RPL 1',
    studentCount: 35,
    requestedDate: '2026-08-08',
    formattedDate: '08 Aug 2026',
    startTime: '09:00',
    endTime: '11:00',
    timeSlot: '09:00 – 11:00',
    purpose: 'PostgreSQL indexing performance lab.',
    submittedAt: '25 Jul 2026',
    updatedAt: '26 Jul 2026',
    status: 'COMPLETED',
    approvalNote: 'Completed session. Checked out by Andi.',
    reviewedBy: 'Andi Pratama, S.Kom (Laboran)',
    reviewedAt: '26 Jul 2026 09:30',
    relatedScheduleId: 'lsched-106',
    relatedScheduleCode: 'SCH-KOM-06',
  },
  {
    id: 'lreq-00072',
    requestCode: 'REQ-00072',
    labId: 'lab-kom-a',
    labName: 'Computer Laboratory A',
    labCode: 'LAB-KOM-A',
    activityName: 'Draft Workshop Session',
    courseName: 'CS301 Web Programming',
    courseCode: 'CS301',
    targetClass: 'Class XII RPL 1',
    studentCount: 30,
    requestedDate: '2026-07-20',
    formattedDate: '20 Jul 2026',
    startTime: '13:00',
    endTime: '15:00',
    timeSlot: '13:00 – 15:00',
    purpose: 'Cancelled by lecturer due to schedule conflict.',
    submittedAt: '15 Jul 2026',
    updatedAt: '16 Jul 2026',
    status: 'CANCELLED',
  },
]

export const getLecturerRoomRequestById = (id: string): LecturerRoomRequestDetail | undefined => {
  return mockLecturerRoomRequestList.find(r => r.id === id || r.requestCode === id)
}
