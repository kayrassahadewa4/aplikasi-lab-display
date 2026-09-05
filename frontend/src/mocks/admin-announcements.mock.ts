export interface AnnouncementData {
  id: string
  title: string
  content: string
  startDate: string
  endDate: string
  formattedStartDate: string
  formattedEndDate: string
  status: 'Active' | 'Scheduled' | 'Expired'
  createdAt: string
  updatedAt: string
}

export const mockAnnouncementsList: AnnouncementData[] = [
  {
    id: 'anc-101',
    title: 'Laboratory Maintenance',
    content: 'Please be informed that scheduled laboratory equipment maintenance will take place across all software engineering rooms during this period.',
    startDate: '2026-08-10',
    endDate: '2026-08-11',
    formattedStartDate: 'Aug 10, 2026',
    formattedEndDate: 'Aug 11, 2026',
    status: 'Active',
    createdAt: 'Aug 05, 2026',
    updatedAt: 'Aug 05, 2026',
  },
  {
    id: 'anc-102',
    title: 'New Academic Semester Kickoff',
    content: 'The new academic semester has officially started. Please check your assigned laboratory schedule and submit any special room allocation requests early.',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    formattedStartDate: 'Aug 01, 2026',
    formattedEndDate: 'Aug 31, 2026',
    status: 'Active',
    createdAt: 'Aug 01, 2026',
    updatedAt: 'Aug 01, 2026',
  },
  {
    id: 'anc-103',
    title: 'Network & Cisco Switch Upgrade',
    content: 'Network maintenance and gigabit switch installation will be performed in Computer Network Laboratory (LAB-JAR). Internet connectivity may fluctuate.',
    startDate: '2026-08-15',
    endDate: '2026-08-16',
    formattedStartDate: 'Aug 15, 2026',
    formattedEndDate: 'Aug 16, 2026',
    status: 'Scheduled',
    createdAt: 'Aug 06, 2026',
    updatedAt: 'Aug 06, 2026',
  },
  {
    id: 'anc-104',
    title: 'Laboratory Usage Registration Guidelines',
    content: 'All faculty lecturers and practical session supervisors must complete room usage registration according to standard operational procedures.',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    formattedStartDate: 'Jul 01, 2026',
    formattedEndDate: 'Jul 31, 2026',
    status: 'Expired',
    createdAt: 'Jul 01, 2026',
    updatedAt: 'Jul 01, 2026',
  },
  {
    id: 'anc-105',
    title: 'GPU Workstation Server Allocation',
    content: 'High-performance NVIDIA GPU nodes in the AI & Robotics Lab are now available for registered thesis students and artificial intelligence research.',
    startDate: '2026-08-05',
    endDate: '2026-08-25',
    formattedStartDate: 'Aug 05, 2026',
    formattedEndDate: 'Aug 25, 2026',
    status: 'Active',
    createdAt: 'Aug 04, 2026',
    updatedAt: 'Aug 04, 2026',
  },
  {
    id: 'anc-106',
    title: 'National Holiday Laboratory Closure',
    content: 'All laboratory facilities will be closed on Independence Day. Regular practical schedules will resume the following business day.',
    startDate: '2026-08-17',
    endDate: '2026-08-17',
    formattedStartDate: 'Aug 17, 2026',
    formattedEndDate: 'Aug 17, 2026',
    status: 'Scheduled',
    createdAt: 'Aug 07, 2026',
    updatedAt: 'Aug 07, 2026',
  },
  {
    id: 'anc-107',
    title: 'Final Practicum Examination Schedule',
    content: 'Final laboratory practicum examinations for the previous academic period have been completed successfully. Scores have been submitted.',
    startDate: '2026-06-15',
    endDate: '2026-06-30',
    formattedStartDate: 'Jun 15, 2026',
    formattedEndDate: 'Jun 30, 2026',
    status: 'Expired',
    createdAt: 'Jun 10, 2026',
    updatedAt: 'Jun 10, 2026',
  },
]

export const getAnnouncementById = (id: string): AnnouncementData | undefined => {
  return mockAnnouncementsList.find(a => a.id === id)
}
