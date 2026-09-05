<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Loader2,
} from 'lucide-vue-next'
import { notificationService, type NotificationItem } from '@/services/notification.service'
import { formatDateTime } from '@/utils/format.utils'
import { useAuthStore } from '@/stores'
import { UserRole } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const isOpen = ref(false)
const notifications = ref<NotificationItem[]>([])
const unreadCount = ref(0)
const isLoading = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const cleanEmoji = (text?: string) => {
  if (!text) return ''
  return text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '').trim()
}

const getNotificationIconInfo = (item: NotificationItem) => {
  const title = (item.title || '').toLowerCase()
  const msg = (item.message || '').toLowerCase()

  if (title.includes('disetujui') || title.includes('approved') || msg.includes('disetujui') || msg.includes('approved')) {
    return {
      icon: CheckCircle2,
      iconClass: 'text-emerald-600',
      bgClass: 'bg-emerald-50 border border-emerald-200/60',
    }
  }
  if (title.includes('ditolak') || title.includes('rejected') || title.includes('declined') || msg.includes('ditolak') || msg.includes('rejected')) {
    return {
      icon: XCircle,
      iconClass: 'text-rose-600',
      bgClass: 'bg-rose-50 border border-rose-200/60',
    }
  }
  if (title.includes('dibatalkan') || title.includes('cancelled') || msg.includes('dibatalkan') || msg.includes('cancelled')) {
    return {
      icon: XCircle,
      iconClass: 'text-gray-500',
      bgClass: 'bg-gray-100 border border-gray-200',
    }
  }
  if (item.category === 'schedules' || title.includes('jadwal') || title.includes('schedule')) {
    return {
      icon: Calendar,
      iconClass: 'text-blue-600',
      bgClass: 'bg-blue-50 border border-blue-200/60',
    }
  }
  if (item.category === 'requests' || title.includes('permohonan') || title.includes('request')) {
    return {
      icon: Clock,
      iconClass: 'text-amber-600',
      bgClass: 'bg-amber-50 border border-amber-200/60',
    }
  }
  return {
    icon: Bell,
    iconClass: 'text-dark-green',
    bgClass: 'bg-brand-50 border border-brand-200/60',
  }
}

const loadNotifications = async () => {
  try {
    isLoading.value = true
    const [res, count] = await Promise.all([
      notificationService.getNotifications({ limit: 10 }),
      notificationService.getUnreadCount(),
    ])
    notifications.value = res.data || []
    unreadCount.value = count
  } catch (err) {
    console.error('Failed to load notifications:', err)
  } finally {
    isLoading.value = false
  }
}

const toggleDropdown = async () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    await loadNotifications()
  }
}

const handleClickItem = async (item: NotificationItem) => {
  if (!item.is_read) {
    try {
      await notificationService.markAsRead(item.id)
      item.is_read = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch (err) {
      console.warn('Failed to mark notification as read:', err)
    }
  }
  isOpen.value = false
  if (item.link_url) {
    let targetLink = item.link_url
    // Adapt link for current user role to prevent unauthorized cross-portal redirects
    if (authStore.userRole === UserRole.ADMIN && targetLink.startsWith('/laboran/')) {
      targetLink = targetLink.replace('/laboran/', '/admin/')
    } else if (authStore.userRole === UserRole.LABORAN && targetLink.startsWith('/admin/')) {
      targetLink = targetLink.replace('/admin/', '/laboran/')
    }
    router.push(targetLink)
  }
}

const handleMarkAllRead = async () => {
  try {
    await notificationService.markAllAsRead()
    notifications.value.forEach((n) => {
      n.is_read = true
    })
    unreadCount.value = 0
  } catch (err) {
    console.warn('Failed to mark all as read:', err)
  }
}

// Click outside to close
const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  loadNotifications()
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<template>
  <div ref="dropdownRef" class="relative select-none z-50">
    <!-- Bell Button -->
    <button
      @click="toggleDropdown"
      class="p-2 rounded-full text-text-secondary hover:text-dark-green hover:bg-brand-50 border border-gray-200/60 transition-colors flex items-center justify-center relative cursor-pointer"
      title="Notifikasi & Peringatan"
      aria-label="Notifikasi"
    >
      <Bell :size="17" />
      <!-- Unread Indicator Badge -->
      <span
        v-if="unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-2xs animate-pulse"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- Floating Dropdown Popover -->
    <div
      v-if="isOpen"
      class="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-gray-200/90 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden ring-1 ring-black/5"
    >
      <!-- Header -->
      <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-surface/40">
        <div class="flex items-center gap-2">
          <h4 class="font-extrabold text-xs text-text-primary">Notifikasi</h4>
          <span
            v-if="unreadCount > 0"
            class="px-1.5 py-0.2 rounded-full bg-brand-100 text-dark-green text-[10px] font-bold"
          >
            {{ unreadCount }} baru
          </span>
        </div>
        <button
          v-if="unreadCount > 0"
          @click="handleMarkAllRead"
          class="text-[11px] font-bold text-dark-green hover:underline flex items-center gap-1 cursor-pointer"
        >
          <CheckCheck :size="13" />
          <span>Tandai semua dibaca</span>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading && notifications.length === 0" class="py-8 text-center text-text-muted">
        <Loader2 :size="20" class="mx-auto animate-spin text-dark-green mb-2" />
        <p class="text-xs">Memuat notifikasi...</p>
      </div>

      <!-- Notifications List -->
      <div v-else class="max-h-80 overflow-y-auto divide-y divide-gray-100">
        <div
          v-for="item in notifications"
          :key="item.id"
          @click="handleClickItem(item)"
          :class="[
            'p-3.5 transition-colors cursor-pointer flex items-start gap-3 text-xs',
            !item.is_read ? 'bg-brand-50/40 hover:bg-brand-50/80' : 'hover:bg-surface/80',
          ]"
        >
          <!-- Modern Icon Avatar -->
          <div
            :class="[
              'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs',
              getNotificationIconInfo(item).bgClass,
            ]"
          >
            <component
              :is="getNotificationIconInfo(item).icon"
              :size="15"
              :class="getNotificationIconInfo(item).iconClass"
            />
          </div>

          <div class="flex-1 min-w-0 space-y-0.5">
            <div class="flex items-center justify-between gap-2">
              <h5
                :class="[
                  'text-xs truncate',
                  !item.is_read ? 'font-black text-text-primary' : 'font-semibold text-text-secondary',
                ]"
              >
                {{ cleanEmoji(item.title) }}
              </h5>
              <span
                v-if="!item.is_read"
                class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"
              />
            </div>
            <p class="text-[11px] text-text-muted leading-relaxed line-clamp-2">
              {{ cleanEmoji(item.message) }}
            </p>
            <span class="text-[10px] text-text-muted font-medium block pt-0.5">
              {{ formatDateTime(item.created_at) }}
            </span>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="notifications.length === 0" class="py-8 text-center text-text-muted space-y-1">
          <Bell :size="24" class="mx-auto text-text-muted/40 mb-1" />
          <p class="text-xs font-bold text-text-secondary">Belum ada notifikasi</p>
          <p class="text-[10px]">Pemberitahuan terkait aktivitas Anda akan muncul di sini.</p>
        </div>
      </div>
    </div>
  </div>
</template>
