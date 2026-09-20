import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Component } from 'vue'
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  DoorOpen,
  FlaskConical,
  Megaphone,
  BarChart3,
  SlidersHorizontal,
  Wrench,
  Hammer,
} from 'lucide-vue-next'

export interface MenuItem {
  id: string
  label: string
  icon: Component
  path?: string
  badge?: string | number
  section?: 'main' | 'account'
}

export interface BreadcrumbItem {
  label: string
  path?: string
}

export const useLaboranNavStore = defineStore('laboranNav', () => {
  const sidebarCollapsed = ref(false)
  const currentPath = ref('/laboran')
  const breadcrumbs = ref<BreadcrumbItem[]>([])

  const mainMenuItems = ref<MenuItem[]>([
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/laboran',
      section: 'main',
    },
    {
      id: 'laboratories',
      label: 'Laboratorium',
      icon: FlaskConical,
      path: '/laboran/laboratories',
      section: 'main',
    },
    {
      id: 'facilities',
      label: 'Fasilitas Lab',
      icon: Wrench,
      path: '/laboran/facilities',
      section: 'main',
    },
    {
      id: 'schedules',
      label: 'Jadwal Penggunaan',
      icon: CalendarDays,
      path: '/laboran/schedules',
      section: 'main',
    },
    {
      id: 'room-requests',
      label: 'Permohonan Pinjam',
      icon: ClipboardList,
      path: '/laboran/room-requests',
      section: 'main',
    },
    {
      id: 'room-usage',
      label: 'Log Pemakaian Lab',
      icon: DoorOpen,
      path: '/laboran/room-usage',
      section: 'main',
    },
    {
      id: 'announcements',
      label: 'Pengumuman',
      icon: Megaphone,
      path: '/laboran/announcements',
      section: 'main',
    },
    {
      id: 'reports',
      label: 'Laporan & Rekap',
      icon: BarChart3,
      path: '/laboran/reports',
      section: 'main',
    },
  ])

  const accountMenuItems = ref<MenuItem[]>([
    {
      id: 'settings',
      label: 'Pengaturan',
      icon: SlidersHorizontal,
      path: '/laboran/settings',
      section: 'account',
    },
  ])

  const allMenuItems = computed(() => [...mainMenuItems.value, ...accountMenuItems.value])

  const activeMenuItem = computed(() => {
    return allMenuItems.value.find(item => item.path === currentPath.value)
  })

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

  return {
    sidebarCollapsed,
    currentPath,
    breadcrumbs,
    mainMenuItems,
    accountMenuItems,
    allMenuItems,
    activeMenuItem,
    toggleSidebar,
    setSidebarCollapsed,
    setCurrentPath,
    setBreadcrumbs,
  }
})
