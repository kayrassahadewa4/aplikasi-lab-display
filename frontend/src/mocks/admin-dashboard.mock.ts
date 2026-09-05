import { Users, FlaskConical, Calendar, ClipboardList, Database, Server, Lock, Monitor } from 'lucide-vue-next'
import type { Activity } from '@/components/admin/RecentActivity.vue'
import type { ServiceStatus } from '@/components/admin/SystemStatus.vue'

export interface DashboardStats {
  totalUsers: number
  totalLaboratories: number
  activeSchedules: number
  pendingRequests: number
}

export const mockDashboardStats: DashboardStats = {
  totalUsers: 156,
  totalLaboratories: 12,
  activeSchedules: 48,
  pendingRequests: 8,
}

export const mockStatCards = [
  {
    id: 'active-schedules',
    title: 'Active Schedules',
    value: 48,
    icon: Calendar,
    highlighted: true,
    subtext: 'Weekly lab sessions scheduled',
    trend: { value: 8, isPositive: true },
  },
  {
    id: 'laboratories',
    title: 'Laboratories',
    value: 12,
    icon: FlaskConical,
    highlighted: false,
    subtext: '12 Active · 2 Maintenance',
  },
  {
    id: 'pending-requests',
    title: 'Pending Requests',
    value: 8,
    icon: ClipboardList,
    highlighted: false,
    attention: true,
    subtext: 'Requires review & approval',
    trend: { value: 3, isPositive: false },
  },
  {
    id: 'total-users',
    title: 'Total Users',
    value: 156,
    icon: Users,
    highlighted: false,
    subtext: '+12% registered this month',
    trend: { value: 12, isPositive: true },
  },
]

export const mockRecentActivities: Activity[] = [
  {
    id: '1',
    user: 'John Doe',
    action: 'approved',
    target: 'Room Request #123',
    timestamp: '5 minutes ago',
    type: 'approve',
  },
  {
    id: '2',
    user: 'Jane Smith',
    action: 'created',
    target: 'Lab Schedule for CS301',
    timestamp: '15 minutes ago',
    type: 'create',
  },
  {
    id: '3',
    user: 'Admin User',
    action: 'updated',
    target: 'Laboratory A1 details',
    timestamp: '1 hour ago',
    type: 'update',
  },
  {
    id: '4',
    user: 'Bob Wilson',
    action: 'rejected',
    target: 'Room Request #120',
    timestamp: '2 hours ago',
    type: 'reject',
  },
  {
    id: '5',
    user: 'Alice Johnson',
    action: 'created',
    target: 'New Announcement',
    timestamp: '3 hours ago',
    type: 'create',
  },
]

export const mockUpcomingRequests = [
  {
    id: '1',
    requester: 'Dr. Sarah Connor',
    laboratory: 'Computer Lab A',
    date: '2026-08-06',
    time: '10:00 - 12:00',
    status: 'pending',
  },
  {
    id: '2',
    requester: 'Prof. Michael Scott',
    laboratory: 'Physics Lab B',
    date: '2026-08-07',
    time: '14:00 - 16:00',
    status: 'pending',
  },
  {
    id: '3',
    requester: 'Dr. Emily Chen',
    laboratory: 'Chemistry Lab C',
    date: '2026-08-08',
    time: '09:00 - 11:00',
    status: 'pending',
  },
]

export const mockLatestAnnouncements = [
  {
    id: '1',
    title: 'Laboratory Maintenance Schedule',
    content: 'All laboratories will undergo routine maintenance on August 10, 2026.',
    author: 'System Administrator',
    date: '2026-08-04',
    isActive: true,
  },
  {
    id: '2',
    title: 'New Equipment Arrival',
    content: 'New computers will be installed in Computer Lab A next week.',
    author: 'Lab Manager',
    date: '2026-08-03',
    isActive: true,
  },
  {
    id: '3',
    title: 'Updated Lab Hours',
    content: 'Laboratory operating hours have been extended until 20:00.',
    author: 'Admin',
    date: '2026-08-02',
    isActive: true,
  },
]

export const mockSystemStatus: ServiceStatus[] = [
  {
    name: 'Database',
    status: 'online',
    icon: Database,
    lastCheck: 'Just now',
  },
  {
    name: 'Backend API',
    status: 'online',
    icon: Server,
    lastCheck: '1 minute ago',
  },
  {
    name: 'Authentication',
    status: 'online',
    icon: Lock,
    lastCheck: '2 minutes ago',
  },
  {
    name: 'Display Screens',
    status: 'online',
    icon: Monitor,
    lastCheck: '5 minutes ago',
  },
]
