<script setup lang="ts">
import { useRouter } from 'vue-router'
import { LogOut, Menu, Monitor } from 'lucide-vue-next'
import { useAuthStore } from '@/stores'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import { BaseAvatar, BaseBreadcrumb, NotificationDropdown } from '@/components'

const router = useRouter()
const authStore = useAuthStore()
const navStore = useAdminNavStore()

const handleLogout = async () => {
  router.push('/login')
  await authStore.logout()
}

const toggleMobileSidebar = () => {
  navStore.toggleSidebar()
}
</script>

<template>
  <header
    class="bg-white/95 backdrop-blur-md border-b border-gray-200/70 h-16 flex items-center justify-between px-4 sm:px-6 shrink-0 z-30 relative shadow-2xs"
  >
    <!-- Institutional Accent Top Line -->
    <div class="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#0c5a30] via-amber-400 to-[#0c5a30]" />

    <!-- Left: Mobile Menu + Breadcrumbs -->
    <div class="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
      <button
        @click="toggleMobileSidebar"
        class="lg:hidden p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-brand-50 transition-colors cursor-pointer shrink-0"
        aria-label="Toggle menu"
      >
        <Menu :size="19" />
      </button>

      <!-- Dynamic Breadcrumb Navigation -->
      <div v-if="navStore.breadcrumbs.length > 0" class="hidden sm:block truncate">
        <BaseBreadcrumb :items="navStore.breadcrumbs" />
      </div>
    </div>

    <!-- Right: Quick Actions + User Profile Pill -->
    <div class="flex items-center gap-2 sm:gap-3">
      <!-- Live Display Quick Shortcut -->
      <router-link
        to="/display"
        target="_blank"
        class="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50/90 hover:bg-emerald-100 text-dark-green border border-emerald-200/80 text-xs font-bold transition-all duration-150 shadow-2xs mr-1 cursor-pointer group"
        title="Buka Layar Display Publik di Tab Baru"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <Monitor :size="14" class="text-dark-green" />
        <span>Layar Display</span>
      </router-link>


      <!-- Notifications Dropdown -->
      <NotificationDropdown />

      <div class="h-5 w-px bg-gray-200 mx-1 hidden sm:block"></div>

      <!-- User Profile Pill -->
      <router-link
        to="/admin/profile"
        class="flex items-center gap-2.5 pl-1.5 bg-brand-50/70 border border-brand-200/80 hover:border-dark-green hover:bg-brand-100/70 transition-all rounded-full p-1 pr-3.5 cursor-pointer shadow-2xs group"
        title="Lihat Profil Administrator"
      >
        <BaseAvatar
          :src="authStore.userAvatar"
          :name="authStore.userName || 'Administrator'"
          size="sm"
          class="ring-2 ring-dark-green/30 group-hover:ring-dark-green"
        />
        <div class="hidden md:block">
          <div class="flex items-center gap-1.5">
            <p class="text-xs font-extrabold text-text-primary group-hover:text-dark-green transition-colors leading-none">
              {{ authStore.userName || 'Administrator' }}
            </p>
            <span class="px-1.5 py-0.2 rounded bg-dark-green text-white text-[9px] font-black uppercase tracking-wider">
              Admin
            </span>
          </div>
          <p class="text-[10px] text-text-muted font-medium mt-0.5 truncate max-w-[120px]">
            {{ authStore.userEmail || 'admin@lab.com' }}
          </p>
        </div>
      </router-link>

      <!-- Logout -->
      <button
        @click="handleLogout"
        class="flex items-center justify-center w-8 h-8 rounded-full text-text-muted hover:text-danger hover:bg-red-50 transition-all duration-150"
        title="Keluar Akun"
      >
        <LogOut :size="16" />
      </button>
    </div>
  </header>
</template>
