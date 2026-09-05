import { ShieldCheck, FlaskConical, GraduationCap, Users } from 'lucide-vue-next'
import type { Component } from 'vue'

export interface RoleData {
  id: string
  name: string
  code: string
  description: string
  usersCount: number
  permissionsLevel: 'Full Access' | 'Operational Access' | 'Request Access' | 'View Only'
  permissionBadgeClass: string
  isSystem: boolean
  status: 'Active' | 'Inactive'
  icon: Component
  permissionsList: string[]
  updatedAt: string
}

export const mockRolesList: RoleData[] = [
  {
    id: 'role-1',
    name: 'Administrator',
    code: 'ADMIN',
    description: 'Full system access and configuration control across all modules and facilities',
    usersCount: 2,
    permissionsLevel: 'Full Access',
    permissionBadgeClass: 'bg-dark-green text-white font-extrabold',
    isSystem: true,
    status: 'Active',
    icon: ShieldCheck,
    permissionsList: [
      'Manage System Roles & Security',
      'Manage User Accounts & Access',
      'Configure Laboratories & Facilities',
      'Manage Academic Calendar & Hours',
      'Approve & Override Schedules',
      'Access Reports & Audit Logs',
    ],
    updatedAt: '2026-08-01',
  },
  {
    id: 'role-2',
    name: 'Laboran',
    code: 'LABORAN',
    description: 'Manages laboratory operations, schedules, inventory, and daily room usage',
    usersCount: 5,
    permissionsLevel: 'Operational Access',
    permissionBadgeClass: 'bg-brand-100 text-dark-green border border-brand-300/60 font-bold',
    isSystem: true,
    status: 'Active',
    icon: FlaskConical,
    permissionsList: [
      'Manage Assigned Laboratory Operations',
      'Approve Room Booking Requests',
      'Update Room Usage & Equipment Status',
      'Post System Announcements',
      'Generate Laboratory Reports',
    ],
    updatedAt: '2026-08-03',
  },
  {
    id: 'role-3',
    name: 'Dosen / Pemohon',
    code: 'DOSEN', // Backend role code
    description: 'Can submit, track, and manage laboratory room requests for academic courses',
    usersCount: 48,
    permissionsLevel: 'Request Access',
    permissionBadgeClass: 'bg-accent/80 text-dark-green border border-dark-green/10 font-bold',
    isSystem: true,
    status: 'Active',
    icon: GraduationCap,
    permissionsList: [
      'Submit Room Reservation Requests',
      'View Real-time Lab Schedules',
      'Cancel Personal Pending Requests',
      'Receive Schedule Notifications',
    ],
    updatedAt: '2026-08-04',
  },
  {
    id: 'role-4',
    name: 'Pengguna Umum',
    code: 'PUBLIC',
    description: 'Public access to laboratory schedule displays and general availability',
    usersCount: 101,
    permissionsLevel: 'View Only',
    permissionBadgeClass: 'bg-gray-100 text-text-secondary border border-gray-200 font-medium',
    isSystem: false,
    status: 'Active',
    icon: Users,
    permissionsList: [
      'View Public Laboratory Schedules',
      'Access Live Room Availability Display',
      'View Published Announcements',
    ],
    updatedAt: '2026-08-05',
  },
]
