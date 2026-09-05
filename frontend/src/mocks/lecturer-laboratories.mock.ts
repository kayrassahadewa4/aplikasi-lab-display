export interface LabFacilityItem {
  id: string
  name: string
  icon?: string
}

export interface LabUpcomingSession {
  id: string
  dateLabel: string
  timeSlot: string
  courseName: string
  courseCode: string
  className: string
  instructorName: string
}

export interface LecturerLaboratoryDetail {
  id: string
  name: string
  code: string
  location: string
  description: string
  maximumCapacity: number
  status: 'Available' | 'In Use' | 'Maintenance' | 'Closed'
  availabilityNote?: string
  facilitiesList: string[]
  upcomingSessions: LabUpcomingSession[]
}

export const mockLecturerLabList: LecturerLaboratoryDetail[] = [
  {
    id: 'lab-kom-a',
    name: 'Computer Laboratory A',
    code: 'LAB-KOM-A',
    location: 'Main Building A · Floor 2',
    description: 'High-performance desktop workstations designed for Web Programming, Software Engineering, and Database System practical sessions.',
    maximumCapacity: 35,
    status: 'In Use',
    availabilityNote: 'Currently occupied (CS301 Web Dev)',
    facilitiesList: ['35 Workstation PCs', 'High-Speed LAN', 'HD Projector & Screen', 'Air Conditioning', 'Interactive Whiteboard'],
    upcomingSessions: [
      {
        id: 's1',
        dateLabel: 'Today, 13:00 – 15:00',
        timeSlot: '13:00 – 15:00',
        courseName: 'CS301 Web Programming',
        courseCode: 'CS301',
        className: 'Class XII RPL 1',
        instructorName: 'Dr. Emily Chen',
      },
      {
        id: 's2',
        dateLabel: 'Tomorrow, 15:30 – 17:30',
        timeSlot: '15:30 – 17:30',
        courseName: 'CS301 Web Programming',
        courseCode: 'CS301',
        className: 'Class XII RPL 2',
        instructorName: 'Dr. Emily Chen',
      },
    ],
  },
  {
    id: 'lab-kim',
    name: 'Chemistry Laboratory',
    code: 'LAB-KIM',
    location: 'Science Building B · Floor 1',
    description: 'Fully equipped wet laboratory for general, organic, and analytical chemistry experiments featuring fume hood safety stations.',
    maximumCapacity: 30,
    status: 'Available',
    availabilityNote: 'Ready for reservation',
    facilitiesList: ['30 Lab Benches & Bunsen Burners', 'Fume Hood Ventilation', 'Chemical Safety Cabinet', 'Eye Wash Station', 'Digital Analytical Balances'],
    upcomingSessions: [
      {
        id: 's3',
        dateLabel: 'Friday, 13:00 – 15:00',
        timeSlot: '13:00 – 15:00',
        courseName: 'CH101 Applied Chemistry Practice',
        courseCode: 'CH101',
        className: 'Class XII RPL 1',
        instructorName: 'Dr. Emily Chen',
      },
    ],
  },
  {
    id: 'lab-jar',
    name: 'Networking Laboratory',
    code: 'LAB-JAR',
    location: 'Main Building A · Floor 3',
    description: 'Hardware networking lab equipped with Cisco routers, switches, patch panels, and server racks for hands-on network architecture practice.',
    maximumCapacity: 30,
    status: 'Available',
    availabilityNote: 'Ready for reservation',
    facilitiesList: ['30 PC Terminals', '8 Cisco Router/Switch Racks', 'Network Cable Testing Bench', 'Fiber Optic Splicer', 'HD Projection Unit'],
    upcomingSessions: [
      {
        id: 's4',
        dateLabel: 'Monday, 10:00 – 12:00',
        timeSlot: '10:00 – 12:00',
        courseName: 'NW402 Cisco Router Config',
        courseCode: 'NW402',
        className: 'Class XII TKJ 1',
        instructorName: 'Budi Santoso, M.T',
      },
    ],
  },
  {
    id: 'lab-mm',
    name: 'Multimedia Laboratory',
    code: 'LAB-MM',
    location: 'Creative Tower · Floor 3',
    description: 'Digital media studio equipped with dedicated GPU render nodes, drawing graphics tablets, and audio/video production suites.',
    maximumCapacity: 25,
    status: 'In Use',
    availabilityNote: 'Currently occupied (3D Animation)',
    facilitiesList: ['25 RTX Render Workstations', 'Wacom Intuos Tablets', '4K Preview Monitors', 'Acoustic Isolation Booth', 'Dual Studio Lighting Racks'],
    upcomingSessions: [
      {
        id: 's5',
        dateLabel: 'Saturday, 08:00 – 10:00',
        timeSlot: '08:00 – 10:00',
        courseName: 'MM204 3D Animation Practice',
        courseCode: 'MM204',
        className: 'Class XI MM 1',
        instructorName: 'Dewi Lestari, M.Ds',
      },
    ],
  },
  {
    id: 'lab-kom-b',
    name: 'Computer Laboratory B',
    code: 'LAB-KOM-B',
    location: 'Main Building A · Floor 2',
    description: 'Secondary computing lab configured for database administration, algorithm practice, and computer fundamentals.',
    maximumCapacity: 40,
    status: 'Available',
    availabilityNote: 'Ready for reservation',
    facilitiesList: ['40 Desktop PCs', 'High-Speed Gigabit LAN', 'Projector & Sound System', 'Air Conditioning', 'Ergonomic Seating'],
    upcomingSessions: [],
  },
  {
    id: 'lab-bio',
    name: 'Biology & Life Science Lab',
    code: 'LAB-BIO',
    location: 'Science Building B · Floor 2',
    description: 'Microbiology and life science facility with compound microscopes, autoclaves, and specimen culture incubators.',
    maximumCapacity: 24,
    status: 'Maintenance',
    availabilityNote: 'Autoclave maintenance in progress',
    facilitiesList: ['24 Microscope Stations', 'Autoclave Sterilizer', 'Incubator Shaker', 'Refrigerated Centrifuge', 'Biosafety Cabinet Class II'],
    upcomingSessions: [],
  },
]

export const getLecturerLabById = (id: string): LecturerLaboratoryDetail | undefined => {
  return mockLecturerLabList.find(l => l.id === id || l.code === id)
}
