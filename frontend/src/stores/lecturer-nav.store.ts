import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Component } from 'vue'
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  FlaskConical,
  SlidersHorizontal,
  Wrench,
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

export const useLecturerNavStore = defineStore('lecturerNav', () => {
  const sidebarCollapsed = ref(false)
  const currentPath = ref('/lecturer')
  const breadcrumbs = ref<BreadcrumbItem[]>([])

  const mainMenuItems = ref<MenuItem[]>([
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/lecturer',
      section: 'main',
    },
    {
      id: 'laboratories',
      label: 'Laboratorium',
      icon: FlaskConical,
      path: '/lecturer/laboratories',
      section: 'main',
    },
    {
      id: 'issue-tickets',
      label: 'Lapor Kendala Alat',
      icon: Wrench,
      path: '/lecturer/issue-tickets',
      section: 'main',
    },
    {
      id: 'schedules',
      label: 'Jadwal Praktikum',
      icon: CalendarDays,
      path: '/lecturer/schedules',
      section: 'main',
    },
    {
      id: 'room-requests',
      label: 'Permohonan Pinjam',
      icon: ClipboardList,
      path: '/lecturer/room-requests',
      section: 'main',
    },
  ])

  const accountMenuItems = ref<MenuItem[]>([
    {
      id: 'settings',
      label: 'Pengaturan',
      icon: SlidersHorizontal,
      path: '/lecturer/settings',
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
