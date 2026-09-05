<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import { AppLogo } from '@/components'

const route = useRoute()
const router = useRouter()
const navStore = useAdminNavStore()

const isActive = (path?: string) => {
  if (!path) return false
  // Root Dashboard route must be an exact match
  if (path === '/admin') return route.path === '/admin'
  return route.path === path || route.path.startsWith(path + '/')
}

const handleMenuClick = (path?: string) => {
  if (path) {
    router.push(path)
    navStore.setCurrentPath(path)
  }
}
</script>

<template>
  <aside
    :class="[
      'bg-gradient-to-b from-[#0c5a30] via-[#094726] to-[#06331b] text-white border-r border-[#083b20] transition-all duration-300 flex flex-col z-20 select-none shadow-xl shadow-black/10',
      navStore.sidebarCollapsed ? 'w-20' : 'w-64',
    ]"
  >
    <!-- Top Sidebar Header -->
    <div class="h-16 flex items-center justify-between px-4 border-b border-emerald-800/40 shrink-0">
      <router-link to="/admin" class="flex items-center gap-2.5 overflow-hidden">
        <AppLogo :size="navStore.sidebarCollapsed ? 'sm' : 'md'" :collapsed="navStore.sidebarCollapsed" dark />
      </router-link>
      
      <button
        @click="navStore.toggleSidebar"
        :class="[
          'p-1.5 rounded-lg text-emerald-200/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer',
          navStore.sidebarCollapsed ? 'hidden' : 'block'
        ]"
        :aria-label="navStore.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <ChevronLeft :size="16" />
      </button>
    </div>

    <!-- Navigation Menu -->
    <nav class="flex-1 overflow-y-auto p-3 space-y-4">
      
      <!-- MAIN MENU SECTION -->
      <div>
        <h2
          v-if="!navStore.sidebarCollapsed"
          class="px-3 text-[10px] font-black uppercase tracking-wider text-emerald-200/60 mb-2 block"
        >
          MENU UTAMA
        </h2>
        <ul class="space-y-1">
          <li v-for="item in navStore.mainMenuItems" :key="item.id">
            <button
              @click="handleMenuClick(item.path)"
              :class="[
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left relative group select-none cursor-pointer',
                isActive(item.path)
                  ? 'bg-white/15 text-white font-black shadow-sm border-l-4 border-amber-400 pl-2.5 backdrop-blur-xs'
                  : 'text-emerald-100/75 hover:bg-white/10 hover:text-white',
                navStore.sidebarCollapsed ? 'justify-center px-0' : '',
              ]"
              :title="navStore.sidebarCollapsed ? item.label : undefined"
            >
              <component
                :is="item.icon"
                :size="19"
                :class="[
                  'shrink-0 transition-colors duration-150',
                  isActive(item.path) ? 'text-amber-400 drop-shadow-xs' : 'text-emerald-300/80 group-hover:text-white'
                ]"
              />
              
              <span v-if="!navStore.sidebarCollapsed" class="flex-1 text-xs sm:text-[13px] tracking-tight font-bold">{{ item.label }}</span>
              
              <span
                v-if="!navStore.sidebarCollapsed && item.badge"
                class="px-2 py-0.5 bg-amber-400 text-emerald-950 text-[10px] font-black rounded-full shadow-2xs"
              >
                {{ item.badge }}
              </span>
            </button>
          </li>
        </ul>
      </div>

      <!-- ACCOUNT SECTION -->
      <div class="pt-2 border-t border-emerald-800/40">
        <h2
          v-if="!navStore.sidebarCollapsed"
          class="px-3 text-[10px] font-black uppercase tracking-wider text-emerald-200/60 mb-2 block"
        >
          PENGATURAN AKUN
        </h2>
        <ul class="space-y-1">
          <li v-for="item in navStore.accountMenuItems" :key="item.id">
            <button
              @click="handleMenuClick(item.path)"
              :class="[
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left relative group select-none cursor-pointer',
                isActive(item.path)
                  ? 'bg-white/15 text-white font-black shadow-sm border-l-4 border-amber-400 pl-2.5 backdrop-blur-xs'
                  : 'text-emerald-100/75 hover:bg-white/10 hover:text-white',
                navStore.sidebarCollapsed ? 'justify-center px-0' : '',
              ]"
              :title="navStore.sidebarCollapsed ? item.label : undefined"
            >
              <component
                :is="item.icon"
                :size="19"
                :class="[
                  'shrink-0 transition-colors duration-150',
                  isActive(item.path) ? 'text-amber-400 drop-shadow-xs' : 'text-emerald-300/80 group-hover:text-white'
                ]"
              />
              
              <span v-if="!navStore.sidebarCollapsed" class="flex-1 text-xs sm:text-[13px] tracking-tight font-bold">{{ item.label }}</span>
              
              <span
                v-if="!navStore.sidebarCollapsed && item.badge"
                class="px-2 py-0.5 bg-amber-400 text-emerald-950 text-[10px] font-black rounded-full shadow-2xs"
              >
                {{ item.badge }}
              </span>
            </button>
          </li>
        </ul>
      </div>

    </nav>

    <!-- Bottom Collapse Toggle on Collapsed mode -->
    <div v-if="navStore.sidebarCollapsed" class="p-3 border-t border-emerald-800/40 flex justify-center shrink-0">
      <button
        @click="navStore.toggleSidebar"
        class="p-2 rounded-xl text-emerald-200/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        aria-label="Expand sidebar"
      >
        <ChevronRight :size="18" />
      </button>
    </div>

    <!-- Footer -->
    <div v-if="!navStore.sidebarCollapsed" class="p-4 border-t border-emerald-800/40 shrink-0 bg-black/15">
      <p class="text-[11px] text-emerald-200/70 text-center font-bold tracking-wide">© 2026 LabDisplay UPNVJ</p>
    </div>
  </aside>
</template>
