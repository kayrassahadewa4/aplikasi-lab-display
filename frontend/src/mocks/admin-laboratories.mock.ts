export interface LaboratoryData {
  id: string
  name: string
  code: string
  location: string
  maximumCapacity: number
  facilitiesCount: number
  status: 'Active' | 'Maintenance' | 'Closed'
  facilitiesList: string[]
  createdAt: string
  updatedAt: string
}

export const mockLaboratoriesList: LaboratoryData[] = [
  {
    id: 'lab-101',
    name: 'Software Engineering Laboratory',
    code: 'LAB-RPL',
    location: 'Building A · Floor 2',
    maximumCapacity: 40,
    facilitiesCount: 8,
    status: 'Active',
    facilitiesList: [
      'Desktop Computers (40 units)',
      'High-definition Projector & Screen',
      'Air Conditioner (2 units)',
      'Whiteboard & Markers',
      'Managed Network Switch (48-port)',
      'High-speed Wi-Fi Access Point',
      'CCTV Surveillance System',
      'Network Laser Printer',
    ],
    createdAt: 'August 1, 2026',
    updatedAt: 'August 5, 2026',
  },
  {
    id: 'lab-102',
    name: 'Multimedia & Graphic Laboratory',
    code: 'LAB-MM',
    location: 'Building A · Floor 3',
    maximumCapacity: 35,
    facilitiesCount: 7,
    status: 'Active',
    facilitiesList: [
      'Workstation Workstation PC (35 units)',
      'Drawing Graphics Tablets (20 units)',
      '4K Color-calibrated Display Projector',
      'Air Conditioner (2 units)',
      'Sound System & Studio Speakers',
      'High-speed Fiber Connection',
      'Professional Camera Tripods',
    ],
    createdAt: 'August 2, 2026',
    updatedAt: 'August 6, 2026',
  },
  {
    id: 'lab-103',
    name: 'Computer Network Laboratory',
    code: 'LAB-JAR',
    location: 'Building B · Floor 3',
    maximumCapacity: 30,
    facilitiesCount: 6,
    status: 'Maintenance',
    facilitiesList: [
      'Server Racks & Routers (6 units)',
      'Cisco Enterprise Switches',
      'Student Workstations (30 units)',
      'Air Conditioner (2 units)',
      'Smart Projector Board',
      'Structured Cabling Tester Kit',
    ],
    createdAt: 'August 3, 2026',
    updatedAt: 'August 7, 2026',
  },
  {
    id: 'lab-104',
    name: 'Database & Data Science Laboratory',
    code: 'LAB-DB',
    location: 'Building B · Floor 2',
    maximumCapacity: 32,
    facilitiesCount: 9,
    status: 'Active',
    facilitiesList: [
      'Data Analytics PCs (32 units)',
      'Dedicated Server Node',
      'Dual Projector Setup',
      'Air Conditioner (2 units)',
      'Interactive Smartboard',
      'Uninterruptible Power Supply (UPS)',
      'Gigabit Ethernet Switch',
      'CCTV Surveillance System',
      'Laser Printer',
    ],
    createdAt: 'August 3, 2026',
    updatedAt: 'August 6, 2026',
  },
  {
    id: 'lab-105',
    name: 'Artificial Intelligence & Robotics Lab',
    code: 'LAB-AI',
    location: 'Building C · Floor 2',
    maximumCapacity: 28,
    facilitiesCount: 8,
    status: 'Active',
    facilitiesList: [
      'GPU Workstation Nodes (28 units)',
      'Robotics Simulation Workbench',
      '3D Printer & Filament Station',
      'Laser Cutter & Prototyping Tools',
      'Air Conditioner (2 units)',
      'Smart Interactive Display Board',
      'High-capacity UPS Backup',
      'High-speed Fiber Network',
    ],
    createdAt: 'August 4, 2026',
    updatedAt: 'August 8, 2026',
  },
]

export const getLaboratoryById = (id: string): LaboratoryData | undefined => {
  return mockLaboratoriesList.find(l => l.id === id)
}
