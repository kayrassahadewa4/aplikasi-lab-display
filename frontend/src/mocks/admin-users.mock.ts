export interface UserData {
  id: string
  fullName: string
  email: string
  phone: string
  avatarUrl?: string | null
  role: 'Administrator' | 'Laboran' | 'Dosen / Pemohon'
  roleId?: string
  roleCode?: string
  status: 'Active' | 'Inactive'
  registered: string
  lastActive: string
  avatarBgClass: string
  avatarTextClass: string
}

export const mockUsersList: UserData[] = [
  {
    id: 'usr-101',
    fullName: 'Dr. Hendra Wijaya, M.T.',
    email: 'hendra.wijaya@fik.upnvj.ac.id',
    phone: '+62 812-3456-7890',
    role: 'Administrator',
    status: 'Active',
    registered: 'Aug 01, 2026',
    lastActive: '5 minutes ago',
    avatarBgClass: 'bg-dark-green text-white',
    avatarTextClass: 'text-white',
  },
  {
    id: 'usr-102',
    fullName: 'Siti Rahmawati, S.Kom.',
    email: 'siti.rahmawati@lab.upnvj.ac.id',
    phone: '+62 813-9876-5432',
    role: 'Laboran',
    status: 'Active',
    registered: 'Aug 02, 2026',
    lastActive: '12 minutes ago',
    avatarBgClass: 'bg-brand-100 text-dark-green border border-brand-300/60',
    avatarTextClass: 'text-dark-green',
  },
  {
    id: 'usr-103',
    fullName: 'Prof. Dr. Ir. Budi Santoso, M.Sc.',
    email: 'budi.santoso@fik.upnvj.ac.id',
    phone: '+62 811-2233-4455',
    role: 'Dosen / Pemohon',
    status: 'Active',
    registered: 'Aug 03, 2026',
    lastActive: '1 hour ago',
    avatarBgClass: 'bg-accent/80 text-dark-green border border-dark-green/10',
    avatarTextClass: 'text-dark-green',
  },
  {
    id: 'usr-104',
    fullName: 'Ahmad Pratama, S.T.',
    email: 'ahmad.pratama@lab.upnvj.ac.id',
    phone: '+62 815-6677-8899',
    role: 'Laboran',
    status: 'Active',
    registered: 'Aug 03, 2026',
    lastActive: '2 hours ago',
    avatarBgClass: 'bg-brand-100 text-dark-green border border-brand-300/60',
    avatarTextClass: 'text-dark-green',
  },
  {
    id: 'usr-105',
    fullName: 'Dr. Eng. Fitriani Ningsih',
    email: 'fitriani.ningsih@fik.upnvj.ac.id',
    phone: '+62 817-1122-3344',
    role: 'Dosen / Pemohon',
    status: 'Active',
    registered: 'Aug 04, 2026',
    lastActive: '3 hours ago',
    avatarBgClass: 'bg-accent/80 text-dark-green border border-dark-green/10',
    avatarTextClass: 'text-dark-green',
  },
  {
    id: 'usr-106',
    fullName: 'Dewi Lestari, M.Kom.',
    email: 'dewi.lestari@fik.upnvj.ac.id',
    phone: '+62 819-4455-6677',
    role: 'Administrator',
    status: 'Active',
    registered: 'Aug 04, 2026',
    lastActive: 'Yesterday',
    avatarBgClass: 'bg-dark-green text-white',
    avatarTextClass: 'text-white',
  },
  {
    id: 'usr-107',
    fullName: 'Rizky Kurniawan, S.Kom.',
    email: 'rizky.kurniawan@lab.upnvj.ac.id',
    phone: '+62 821-7788-9900',
    role: 'Laboran',
    status: 'Inactive',
    registered: 'Aug 05, 2026',
    lastActive: '3 days ago',
    avatarBgClass: 'bg-gray-100 text-gray-600 border border-gray-200',
    avatarTextClass: 'text-gray-600',
  },
  {
    id: 'usr-108',
    fullName: 'Dr. Bambang Sugiarto, S.T.',
    email: 'bambang.sugiarto@fik.upnvj.ac.id',
    phone: '+62 823-1133-5577',
    role: 'Dosen / Pemohon',
    status: 'Active',
    registered: 'Aug 05, 2026',
    lastActive: 'Yesterday',
    avatarBgClass: 'bg-accent/80 text-dark-green border border-dark-green/10',
    avatarTextClass: 'text-dark-green',
  },
  {
    id: 'usr-109',
    fullName: 'Indah Permatasari, M.T.',
    email: 'indah.permatasari@fik.upnvj.ac.id',
    phone: '+62 825-9988-7766',
    role: 'Dosen / Pemohon',
    status: 'Active',
    registered: 'Aug 06, 2026',
    lastActive: '4 hours ago',
    avatarBgClass: 'bg-accent/80 text-dark-green border border-dark-green/10',
    avatarTextClass: 'text-dark-green',
  },
  {
    id: 'usr-110',
    fullName: 'Eko Prasetyo, S.Kom.',
    email: 'eko.prasetyo@lab.upnvj.ac.id',
    phone: '+62 827-4433-2211',
    role: 'Laboran',
    status: 'Active',
    registered: 'Aug 06, 2026',
    lastActive: '5 hours ago',
    avatarBgClass: 'bg-brand-100 text-dark-green border border-brand-300/60',
    avatarTextClass: 'text-dark-green',
  },
]
