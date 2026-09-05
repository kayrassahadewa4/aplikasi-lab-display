export interface RoomRequestData {
  id: string
  applicantId: string
  applicantName: string
  applicantEmail: string
  applicantRole: string
  laboratoryId: string
  laboratoryName: string
  laboratoryCode: string
  approvedBy: string | null
  approverName: string | null
  activityName: string
  courseName: string
  className: string
  description: string
  requestDate: string
  formattedRequestDate: string
  startTime: string
  endTime: string
  participantCount: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  rejectionReason: string | null
  approvedAt: string | null
  createdAt: string
  updatedAt: string
}

export const mockRoomRequestsList: RoomRequestData[] = [
  {
    id: 'req-101',
    applicantId: 'usr-201',
    applicantName: 'Ahmad Rizky',
    applicantEmail: 'ahmad.rizky@lab.ac.id',
    applicantRole: 'Dosen',
    laboratoryId: 'lab-101',
    laboratoryName: 'Software Engineering Laboratory',
    laboratoryCode: 'LAB-RPL',
    approvedBy: null,
    approverName: null,
    activityName: 'Extra Exam Preparation Session',
    courseName: 'Web Programming Practicum',
    className: 'XII RPL 1',
    description: 'Special laboratory allocation request for additional hands-on exam preparation and project submission review.',
    requestDate: '2026-08-12',
    formattedRequestDate: 'Aug 12, 2026',
    startTime: '08:00',
    endTime: '10:00',
    participantCount: 32,
    status: 'PENDING',
    rejectionReason: null,
    approvedAt: null,
    createdAt: 'Aug 05, 2026',
    updatedAt: 'Aug 05, 2026',
  },
  {
    id: 'req-102',
    applicantId: 'usr-202',
    applicantName: 'Siti Aminah, M.Kom',
    applicantEmail: 'siti.aminah@lab.ac.id',
    applicantRole: 'Dosen',
    laboratoryId: 'lab-105',
    laboratoryName: 'Database Systems Laboratory',
    laboratoryCode: 'LAB-DB',
    approvedBy: 'usr-1',
    approverName: 'Administrator',
    activityName: 'Database Indexing Workshop',
    courseName: 'Database Management Systems',
    className: 'XII RPL 2',
    description: 'Practical workshop on PostgreSQL B-tree indexing optimization and query execution plan analysis.',
    requestDate: '2026-08-14',
    formattedRequestDate: 'Aug 14, 2026',
    startTime: '10:00',
    endTime: '12:00',
    participantCount: 28,
    status: 'APPROVED',
    rejectionReason: null,
    approvedAt: 'Aug 06, 2026',
    createdAt: 'Aug 04, 2026',
    updatedAt: 'Aug 06, 2026',
  },
  {
    id: 'req-103',
    applicantId: 'usr-203',
    applicantName: 'Budi Santoso, M.T',
    applicantEmail: 'budi.santoso@lab.ac.id',
    applicantRole: 'Dosen',
    laboratoryId: 'lab-103',
    laboratoryName: 'Computer Network Laboratory',
    laboratoryCode: 'LAB-JAR',
    approvedBy: null,
    approverName: null,
    activityName: 'VLAN Trunking Practical Test',
    courseName: 'Network Configuration & Routing',
    className: 'XII TKJ 1',
    description: 'Hands-on practical examination using Cisco managed switches for inter-VLAN routing setup.',
    requestDate: '2026-08-15',
    formattedRequestDate: 'Aug 15, 2026',
    startTime: '13:00',
    endTime: '15:00',
    participantCount: 30,
    status: 'PENDING',
    rejectionReason: null,
    approvedAt: null,
    createdAt: 'Aug 06, 2026',
    updatedAt: 'Aug 06, 2026',
  },
  {
    id: 'req-104',
    applicantId: 'usr-204',
    applicantName: 'Dewi Lestari, S.T, M.Ds',
    applicantEmail: 'dewi.lestari@lab.ac.id',
    applicantRole: 'Dosen',
    laboratoryId: 'lab-104',
    laboratoryName: 'Multimedia & Game Dev Lab',
    laboratoryCode: 'LAB-MM',
    approvedBy: 'usr-1',
    approverName: 'Administrator',
    activityName: 'Game Rendering Sprint',
    courseName: '3D Modeling & Animation',
    className: 'XI MM 1',
    description: 'Intensive student project rendering sprint utilizing Smartboard and GPU rendering stations.',
    requestDate: '2026-08-10',
    formattedRequestDate: 'Aug 10, 2026',
    startTime: '09:00',
    endTime: '12:00',
    participantCount: 25,
    status: 'REJECTED',
    rejectionReason: 'Laboratory room is already reserved for scheduled UI/UX Design course session.',
    approvedAt: null,
    createdAt: 'Aug 03, 2026',
    updatedAt: 'Aug 04, 2026',
  },
  {
    id: 'req-105',
    applicantId: 'usr-205',
    applicantName: 'Prof. Hendra Wijaya',
    applicantEmail: 'hendra.wijaya@lab.ac.id',
    applicantRole: 'Dosen',
    laboratoryId: 'lab-102',
    laboratoryName: 'Artificial Intelligence & Robotics Lab',
    laboratoryCode: 'LAB-AI',
    approvedBy: 'usr-1',
    approverName: 'Administrator',
    activityName: 'Robotics Kinematics Demo',
    courseName: 'Machine Learning Deep Vision',
    className: 'XII AI 1',
    description: 'Demonstration of robotic arm inverse kinematics and vision object tracking model evaluation.',
    requestDate: '2026-08-18',
    formattedRequestDate: 'Aug 18, 2026',
    startTime: '08:00',
    endTime: '11:00',
    participantCount: 20,
    status: 'APPROVED',
    rejectionReason: null,
    approvedAt: 'Aug 07, 2026',
    createdAt: 'Aug 05, 2026',
    updatedAt: 'Aug 07, 2026',
  },
  {
    id: 'req-106',
    applicantId: 'usr-206',
    applicantName: 'Rina Kusumawati',
    applicantEmail: 'rina.kusuma@lab.ac.id',
    applicantRole: 'Pemohon',
    laboratoryId: 'lab-101',
    laboratoryName: 'Software Engineering Laboratory',
    laboratoryCode: 'LAB-RPL',
    approvedBy: null,
    approverName: null,
    activityName: 'Student Coding Competition Practice',
    courseName: 'Competitive Programming',
    className: 'XII RPL 2',
    description: 'Practice session for university representative team in upcoming national algorithmic coding contest.',
    requestDate: '2026-08-20',
    formattedRequestDate: 'Aug 20, 2026',
    startTime: '13:00',
    endTime: '16:00',
    participantCount: 15,
    status: 'PENDING',
    rejectionReason: null,
    approvedAt: null,
    createdAt: 'Aug 07, 2026',
    updatedAt: 'Aug 07, 2026',
  },
  {
    id: 'req-107',
    applicantId: 'usr-207',
    applicantName: 'Eko Prasetyo',
    applicantEmail: 'eko.prasetyo@lab.ac.id',
    applicantRole: 'Pemohon',
    laboratoryId: 'lab-103',
    laboratoryName: 'Computer Network Laboratory',
    laboratoryCode: 'LAB-JAR',
    approvedBy: null,
    approverName: null,
    activityName: 'Network Security Audit Simulation',
    courseName: 'Network Security',
    className: 'XII TKJ 2',
    description: 'Practical penetration testing simulation environment setup in controlled network lab sandbox.',
    requestDate: '2026-08-01',
    formattedRequestDate: 'Aug 01, 2026',
    startTime: '08:00',
    endTime: '11:00',
    participantCount: 26,
    status: 'CANCELLED',
    rejectionReason: null,
    approvedAt: null,
    createdAt: 'Jul 28, 2026',
    updatedAt: 'Jul 30, 2026',
  },
]

export const getRoomRequestById = (id: string): RoomRequestData | undefined => {
  return mockRoomRequestsList.find(r => r.id === id)
}

export const approveRoomRequest = (id: string, approverName = 'Andi Pratama (Laboran)'): RoomRequestData | undefined => {
  const item = getRoomRequestById(id)
  if (item) {
    item.status = 'APPROVED'
    item.approvedBy = 'usr-laboran-1'
    item.approverName = approverName
    item.approvedAt = 'Aug 09, 2026'
    item.updatedAt = 'Aug 09, 2026'
  }
  return item
}

export const rejectRoomRequest = (id: string, reason: string): RoomRequestData | undefined => {
  const item = getRoomRequestById(id)
  if (item) {
    item.status = 'REJECTED'
    item.rejectionReason = reason
    item.updatedAt = 'Aug 09, 2026'
  }
  return item
}
