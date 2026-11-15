import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Component } from 'vue'
import {
  LayoutDashboard,
  Shield,
  Users,
  FlaskConical,
  Wrench,
  Calendar,
  Clock,
  Megaphone,
  CalendarDays,
  ClipboardList,
  DoorOpen,
  BarChart3,
  SlidersHorizontal,
} from 'lucide-vue-next'

export interface MenuItem {
  id: string
  label: string
  icon: Component
  path?: string
  badge?: string | number
  section?: 'main' | 'account'
  children?: MenuItem[]
}

export interface BreadcrumbItem {
  label: string
  path?: string
}

export const useAdminNavStore = defineStore('adminNav', () => {
  // State
  const sidebarCollapsed = ref(false)
  const currentPath = ref('/admin')
  const breadcrumbs = ref<BreadcrumbItem[]>([])

  // Menu structure split into main and account sections
  const mainMenuItems = ref<MenuItem[]>([
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin',
      section: 'main',
    },
    {
      id: 'roles',
      label: 'Peran & Hak Akses',
      icon: Shield,
      path: '/admin/roles',
      section: 'main',
    },
    {
      id: 'users',
      label: 'Pengguna',
      icon: Users,
      path: '/admin/users',
      section: 'main',
    },
    {
      id: 'laboratories',
      label: 'Laboratorium',
      icon: FlaskConical,
      path: '/admin/laboratories',
      section: 'main',
    },
    {
      id: 'facilities',
      label: 'Fasilitas Lab',
      icon: Wrench,
      path: '/admin/facilities',
      section: 'main',
    },
    {
      id: 'academic-calendars',
      label: 'Kalender Akademik',
      icon: Calendar,
      path: '/admin/academic-calendars',
      section: 'main',
    },
    {
      id: 'operational-hours',
      label: 'Jam Operasional',
      icon: Clock,
      path: '/admin/operational-hours',
      section: 'main',
    },
    {
      id: 'announcements',
      label: 'Pengumuman',
      icon: Megaphone,
      path: '/admin/announcements',
      section: 'main',
    },
    {
      id: 'schedules',
      label: 'Jadwal Penggunaan',
      icon: CalendarDays,
      path: '/admin/schedules',
      section: 'main',
    },
    {
      id: 'room-requests',
      label: 'Permohonan Pinjam',
      icon: ClipboardList,
      path: '/admin/room-requests',
      section: 'main',
    },
    {
      id: 'room-usage',
      label: 'Log Pemakaian Lab',
      icon: DoorOpen,
      path: '/admin/room-usage',
      section: 'main',
    },
    {
      id: 'reports',
      label: 'Laporan & Rekap',
      icon: BarChart3,
      path: '/admin/reports',
      section: 'main',
    },
  ])

  const accountMenuItems = ref<MenuItem[]>([
    {
      id: 'settings',
      label: 'Pengaturan',
      icon: SlidersHorizontal,
      path: '/admin/settings',
      section: 'account',
    },
  ])

  const allMenuItems = computed(() => [...mainMenuItems.value, ...accountMenuItems.value])
  const menuItems = allMenuItems // backward compatibility

  // Computed
  const activeMenuItem = computed(() => {
    return allMenuItems.value.find(item => item.path === currentPath.value)
  })

  // Actions
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const setSidebarCollapsed = (collapsed: boolean) => {
    sidebarCollapsed.value = collapsed
  }

  const setCurrentPath = (path: string) => {
    currentPath.value = path
  }

  const setBreadcrumbs = (items: BreadcrumbItem[]) => {
    breadcrumbs.value = items
  }

  const addBreadcrumb = (item: BreadcrumbItem) => {
    breadcrumbs.value.push(item)
  }

  const clearBreadcrumbs = () => {
    breadcrumbs.value = []
  }

  return {
    // State
    sidebarCollapsed,
    currentPath,
    breadcrumbs,
    mainMenuItems,
    accountMenuItems,
    allMenuItems,
    menuItems,

    // Computed
    activeMenuItem,

    // Actions
    toggleSidebar,
    setSidebarCollapsed,
    setCurrentPath,
    setBreadcrumbs,
    addBreadcrumb,
    clearBreadcrumbs,
  }
})
