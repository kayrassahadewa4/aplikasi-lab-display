export interface ScheduleData {
  id: string
  laboratoryId: string
  laboratoryName: string
  laboratoryCode: string
  academicCalendarId: string
  courseName: string
  lecturerName: string
  className: string
  dayOfWeek: number // 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat, 7 = Sun
  dayName: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'
  startTime: string // HH:MM
  endTime: string // HH:MM
  status: 'SCHEDULED' | 'ACTIVE' | 'FINISHED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
}

export const mockSchedulesList: ScheduleData[] = [
  {
    id: 'sch-101',
    laboratoryId: 'lab-101',
    laboratoryName: 'Software Engineering Laboratory',
    laboratoryCode: 'LAB-RPL',
    academicCalendarId: 'period-101',
    courseName: 'Web Programming Practicum',
    lecturerName: 'Dr. Aris Kurniawan',
    className: 'XII RPL 1',
    dayOfWeek: 1,
    dayName: 'Monday',
    startTime: '08:00',
    endTime: '10:00',
    status: 'SCHEDULED',
    createdAt: 'Aug 05, 2026',
    updatedAt: 'Aug 05, 2026',
  },
  {
    id: 'sch-102',
    laboratoryId: 'lab-105',
    laboratoryName: 'Database Systems Laboratory',
    laboratoryCode: 'LAB-DB',
    academicCalendarId: 'period-101',
    courseName: 'Database Management Systems',
    lecturerName: 'Siti Aminah, M.Kom',
    className: 'XII RPL 2',
    dayOfWeek: 1,
    dayName: 'Monday',
    startTime: '10:00',
    endTime: '12:00',
    status: 'SCHEDULED',
    createdAt: 'Aug 05, 2026',
    updatedAt: 'Aug 05, 2026',
  },
  {
    id: 'sch-103',
    laboratoryId: 'lab-103',
    laboratoryName: 'Computer Network Laboratory',
    laboratoryCode: 'LAB-JAR',
    academicCalendarId: 'period-101',
    courseName: 'Network Configuration & Routing',
    lecturerName: 'Budi Santoso, M.T',
    className: 'XII TKJ 1',
    dayOfWeek: 2,
    dayName: 'Tuesday',
    startTime: '08:00',
    endTime: '10:00',
    status: 'SCHEDULED',
    createdAt: 'Aug 05, 2026',
    updatedAt: 'Aug 05, 2026',
  },
  {
    id: 'sch-104',
    laboratoryId: 'lab-101',
    laboratoryName: 'Software Engineering Laboratory',
    laboratoryCode: 'LAB-RPL',
    academicCalendarId: 'period-101',
    courseName: 'Object-Oriented Software Design',
    lecturerName: 'Dr. Aris Kurniawan',
    className: 'XII RPL 2',
    dayOfWeek: 3,
    dayName: 'Wednesday',
    startTime: '13:00',
    endTime: '15:00',
    status: 'SCHEDULED',
    createdAt: 'Aug 05, 2026',
    updatedAt: 'Aug 05, 2026',
  },
  {
    id: 'sch-105',
    laboratoryId: 'lab-104',
    laboratoryName: 'Multimedia & Game Dev Lab',
    laboratoryCode: 'LAB-MM',
    academicCalendarId: 'period-101',
    courseName: 'UI/UX Design & Prototyping',
    lecturerName: 'Dewi Lestari, S.T, M.Ds',
    className: 'XII RPL 1',
    dayOfWeek: 4,
    dayName: 'Thursday',
    startTime: '10:00',
    endTime: '12:00',
    status: 'ACTIVE',
    createdAt: 'Aug 05, 2026',
    updatedAt: 'Aug 05, 2026',
  },
  {
    id: 'sch-106',
    laboratoryId: 'lab-102',
    laboratoryName: 'Artificial Intelligence & Robotics Lab',
    laboratoryCode: 'LAB-AI',
    academicCalendarId: 'period-101',
    courseName: 'Machine Learning Deep Vision',
    lecturerName: 'Prof. Hendra Wijaya',
    className: 'XII AI 1',
    dayOfWeek: 5,
    dayName: 'Friday',
    startTime: '08:00',
    endTime: '11:00',
    status: 'SCHEDULED',
    createdAt: 'Aug 05, 2026',
    updatedAt: 'Aug 05, 2026',
  },
  {
    id: 'sch-107',
    laboratoryId: 'lab-103',
    laboratoryName: 'Computer Network Laboratory',
    laboratoryCode: 'LAB-JAR',
    academicCalendarId: 'period-101',
    courseName: 'Cisco Switching Practical',
    lecturerName: 'Budi Santoso, M.T',
    className: 'XI TKJ 2',
    dayOfWeek: 6,
    dayName: 'Saturday',
    startTime: '08:00',
    endTime: '10:00',
    status: 'SCHEDULED',
    createdAt: 'Aug 05, 2026',
    updatedAt: 'Aug 05, 2026',
  },
  {
    id: 'sch-108',
    laboratoryId: 'lab-104',
    laboratoryName: 'Multimedia & Game Dev Lab',
    laboratoryCode: 'LAB-MM',
    academicCalendarId: 'period-101',
    courseName: '3D Modeling & Animation',
    lecturerName: 'Dewi Lestari, S.T, M.Ds',
    className: 'XI MM 1',
    dayOfWeek: 2,
    dayName: 'Tuesday',
    startTime: '13:00',
    endTime: '15:00',
    status: 'CANCELLED',
    createdAt: 'Aug 05, 2026',
    updatedAt: 'Aug 05, 2026',
  },
]

export const getScheduleById = (id: string): ScheduleData | undefined => {
  return mockSchedulesList.find(s => s.id === id)
}
