export interface FacilityData {
  id: string
  name: string
  code: string
  labName: string
  labCode: string
  quantity: number
  status: 'Available' | 'In Use' | 'Maintenance' | 'Inactive'
  description: string
  createdAt: string
  updatedAt: string
}

export const mockFacilitiesList: FacilityData[] = [
  {
    id: 'fac-101',
    name: 'Desktop Computer',
    code: 'FAC-PC-RPL',
    labName: 'Software Engineering Laboratory',
    labCode: 'LAB-RPL',
    quantity: 30,
    status: 'Available',
    description: 'Intel Core i7 workstations with 16GB RAM, SSD storage, and dual monitors for software engineering coursework.',
    createdAt: 'August 1, 2026',
    updatedAt: 'August 5, 2026',
  },
  {
    id: 'fac-102',
    name: 'High-Definition Projector',
    code: 'FAC-PROJ-MM',
    labName: 'Multimedia & Graphic Laboratory',
    labCode: 'LAB-MM',
    quantity: 2,
    status: 'Available',
    description: '4K color-calibrated laser projector mounted on ceiling with motorized 120-inch projection screen.',
    createdAt: 'August 2, 2026',
    updatedAt: 'August 6, 2026',
  },
  {
    id: 'fac-103',
    name: 'Air Conditioner Unit',
    code: 'FAC-AC-RPL',
    labName: 'Software Engineering Laboratory',
    labCode: 'LAB-RPL',
    quantity: 4,
    status: 'Available',
    description: '2.5 PK inverter split air conditioner units with climate control for room temperature maintenance.',
    createdAt: 'August 2, 2026',
    updatedAt: 'August 5, 2026',
  },
  {
    id: 'fac-104',
    name: 'Cisco Managed Network Switch',
    code: 'FAC-NET-JAR',
    labName: 'Computer Network Laboratory',
    labCode: 'LAB-JAR',
    quantity: 6,
    status: 'In Use',
    description: '48-port Gigabit Layer 3 managed enterprise switch rack module for computer networking practical sessions.',
    createdAt: 'August 3, 2026',
    updatedAt: 'August 7, 2026',
  },
  {
    id: 'fac-105',
    name: 'Magnetic Whiteboard',
    code: 'FAC-WB-DB',
    labName: 'Database & Data Science Laboratory',
    labCode: 'LAB-DB',
    quantity: 2,
    status: 'Available',
    description: '240x120cm double-sided mobile magnetic whiteboard with marker tray and eraser kit.',
    createdAt: 'August 3, 2026',
    updatedAt: 'August 6, 2026',
  },
  {
    id: 'fac-106',
    name: 'CCTV Security Camera',
    code: 'FAC-CCTV-AI',
    labName: 'Artificial Intelligence & Robotics Lab',
    labCode: 'LAB-AI',
    quantity: 4,
    status: 'Maintenance',
    description: '1080p IP dome camera with night vision and 24/7 central server video recording integration.',
    createdAt: 'August 4, 2026',
    updatedAt: 'August 8, 2026',
  },
  {
    id: 'fac-107',
    name: 'GPU Workstation Node',
    code: 'FAC-GPU-AI',
    labName: 'Artificial Intelligence & Robotics Lab',
    labCode: 'LAB-AI',
    quantity: 8,
    status: 'Available',
    description: 'High-performance AI model training workstations equipped with NVIDIA RTX GPUs and liquid cooling.',
    createdAt: 'August 4, 2026',
    updatedAt: 'August 8, 2026',
  },
  {
    id: 'fac-108',
    name: 'Interactive Smartboard',
    code: 'FAC-SB-MM',
    labName: 'Multimedia & Graphic Laboratory',
    labCode: 'LAB-MM',
    quantity: 1,
    status: 'Available',
    description: '75-inch 4K touchscreen interactive smart display panel with stylus support and wireless casting.',
    createdAt: 'August 5, 2026',
    updatedAt: 'August 7, 2026',
  },
]
