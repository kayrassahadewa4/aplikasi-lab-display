export interface RoomUsageData {
  id: string
  requestId: string | null
  scheduleId: string | null
  laboratoryId: string
  laboratoryName: string
  laboratoryCode: string
  activityName: string
  className: string
  checkedInById: string
  checkedInByName: string
  checkedInByEmail: string
  checkedOutById: string | null
  checkedOutByName: string | null
  checkInTime: string
  checkOutTime: string | null
  status: 'CHECKED_IN' | 'IN_USE' | 'CHECKED_OUT' | 'CANCELLED'
  notes: string | null
  createdAt: string
  updatedAt: string
}

export const mockRoomUsageList: RoomUsageData[] = [
  {
    id: 'usg-101',
    requestId: null,
    scheduleId: 'sch-101',
    laboratoryId: 'lab-101',
    laboratoryName: 'Software Engineering Laboratory',
    laboratoryCode: 'LAB-RPL',
    activityName: 'Web Programming Practicum',
    className: 'XII RPL 1',
    checkedInById: 'usr-201',
    checkedInByName: 'Ahmad Rizky',
    checkedInByEmail: 'ahmad.rizky@lab.ac.id',
    checkedOutById: null,
    checkedOutByName: null,
    checkInTime: 'Aug 09, 2026, 08:02',
    checkOutTime: null,
    status: 'IN_USE',
    notes: 'All 30 PC workstations active, high-definition projector and AC running smoothly.',
    createdAt: 'Aug 09, 2026',
    updatedAt: 'Aug 09, 2026',
  },
  {
    id: 'usg-102',
    requestId: 'req-102',
    scheduleId: null,
    laboratoryId: 'lab-105',
    laboratoryName: 'Database Systems Laboratory',
    laboratoryCode: 'LAB-DB',
    activityName: 'Database Indexing Workshop',
    className: 'XII RPL 2',
    checkedInById: 'usr-202',
    checkedInByName: 'Siti Aminah, M.Kom',
    checkedInByEmail: 'siti.aminah@lab.ac.id',
    checkedOutById: null,
    checkedOutByName: null,
    checkInTime: 'Aug 09, 2026, 10:00',
    checkOutTime: null,
    status: 'IN_USE',
    notes: 'PostgreSQL database server container active for query plan optimization.',
    createdAt: 'Aug 09, 2026',
    updatedAt: 'Aug 09, 2026',
  },
  {
    id: 'usg-103',
    requestId: null,
    scheduleId: 'sch-103',
    laboratoryId: 'lab-103',
    laboratoryName: 'Computer Network Laboratory',
    laboratoryCode: 'LAB-JAR',
    activityName: 'Network Configuration & Routing',
    className: 'XII TKJ 1',
    checkedInById: 'usr-203',
    checkedInByName: 'Budi Santoso, M.T',
    checkedInByEmail: 'budi.santoso@lab.ac.id',
    checkedOutById: 'usr-1',
    checkedOutByName: 'Administrator',
    checkInTime: 'Aug 08, 2026, 08:00',
    checkOutTime: 'Aug 08, 2026, 10:00',
    status: 'CHECKED_OUT',
    notes: 'Cisco switch rack modules powered off after practical session completion.',
    createdAt: 'Aug 08, 2026',
    updatedAt: 'Aug 08, 2026',
  },
  {
    id: 'usg-104',
    requestId: 'req-105',
    scheduleId: null,
    laboratoryId: 'lab-102',
    laboratoryName: 'Artificial Intelligence & Robotics Lab',
    laboratoryCode: 'LAB-AI',
    activityName: 'Robotics Kinematics Demo',
    className: 'XII AI 1',
    checkedInById: 'usr-205',
    checkedInByName: 'Prof. Hendra Wijaya',
    checkedInByEmail: 'hendra.wijaya@lab.ac.id',
    checkedOutById: null,
    checkedOutByName: null,
    checkInTime: 'Aug 09, 2026, 08:00',
    checkOutTime: null,
    status: 'CHECKED_IN',
    notes: 'GPU Workstation Node initialized for robotics vision model evaluation.',
    createdAt: 'Aug 09, 2026',
    updatedAt: 'Aug 09, 2026',
  },
  {
    id: 'usg-105',
    requestId: null,
    scheduleId: 'sch-105',
    laboratoryId: 'lab-104',
    laboratoryName: 'Multimedia & Game Dev Lab',
    laboratoryCode: 'LAB-MM',
    activityName: 'UI/UX Design & Prototyping',
    className: 'XII RPL 1',
    checkedInById: 'usr-204',
    checkedInByName: 'Dewi Lestari, S.T, M.Ds',
    checkedInByEmail: 'dewi.lestari@lab.ac.id',
    checkedOutById: 'usr-1',
    checkedOutByName: 'Administrator',
    checkInTime: 'Aug 07, 2026, 10:00',
    checkOutTime: 'Aug 07, 2026, 12:00',
    status: 'CHECKED_OUT',
    notes: 'Smartboard and drawing tablets shut down cleanly.',
    createdAt: 'Aug 07, 2026',
    updatedAt: 'Aug 07, 2026',
  },
  {
    id: 'sch-108',
    requestId: null,
    scheduleId: 'sch-108',
    laboratoryId: 'lab-104',
    laboratoryName: 'Multimedia & Game Dev Lab',
    laboratoryCode: 'LAB-MM',
    activityName: '3D Modeling & Animation',
    className: 'XI MM 1',
    checkedInById: 'usr-204',
    checkedInByName: 'Dewi Lestari, S.T, M.Ds',
    checkedInByEmail: 'dewi.lestari@lab.ac.id',
    checkedOutById: null,
    checkedOutByName: null,
    checkInTime: 'Aug 06, 2026, 13:00',
    checkOutTime: 'Aug 06, 2026, 13:05',
    status: 'CANCELLED',
    notes: 'Session cancelled due to emergency faculty department meeting.',
    createdAt: 'Aug 06, 2026',
    updatedAt: 'Aug 06, 2026',
  },
]

export const getRoomUsageById = (id: string): RoomUsageData | undefined => {
  return mockRoomUsageList.find(u => u.id === id)
}

export const checkInRoomUsage = (id: string, staffName = 'Andi Pratama (Laboran)'): RoomUsageData | undefined => {
  const item = getRoomUsageById(id)
  if (item) {
    item.status = 'IN_USE'
    item.checkInTime = `Aug 09, 2026, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    item.checkedInByName = staffName
    item.updatedAt = 'Aug 09, 2026'
  }
  return item
}

export const checkOutRoomUsage = (id: string, staffName = 'Andi Pratama (Laboran)', notes?: string): RoomUsageData | undefined => {
  const item = getRoomUsageById(id)
  if (item) {
    item.status = 'CHECKED_OUT'
    item.checkedOutById = 'usr-laboran-1'
    item.checkedOutByName = staffName
    item.checkOutTime = `Aug 09, 2026, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    if (notes) item.notes = notes
    item.updatedAt = 'Aug 09, 2026'
  }
  return item
}
