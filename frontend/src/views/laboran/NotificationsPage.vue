<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLaboranNavStore } from '@/stores/laboran-nav.store'
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Check,
  Filter,
  X,
  Sparkles,
  Layers,
  ChevronRight,
  Info,
  Loader2,
  Megaphone,
  ClipboardList
} from 'lucide-vue-next'
import { notificationService, type NotificationDto } from '@/services/notification.service'
import type { NotificationItem } from '@/mocks/admin-notifications.mock'
import { formatDateTime } from '@/utils/format.utils'

const router = useRouter()
const navStore = useLaboranNavStore()

// State
const notificationsList = ref<NotificationItem[]>([])
const activeCategory = ref<'all' | 'unread' | 'requests' | 'announcements' | 'schedules'>('all')
const isLoading = ref(false)
const rawUnreadCount = ref(0)
const errorMessage = ref('')
const selectedNotification = ref<NotificationItem | null>(null)
const showDetailModal = ref(false)

// Toast Banner
const showToast = ref(false)
const toastMessage = ref('')

const mapNotificationDtoToUi = (dto: NotificationDto): NotificationItem => {
  const formattedTime = dto.created_at ? formatDateTime(dto.created_at) : 'Baru saja'

  let statusVariant: 'success' | 'warning' | 'danger' | 'info' = 'info'
  const lowerTitle = dto.title.toLowerCase()
  if (lowerTitle.includes('approved') || lowerTitle.includes('completed') || lowerTitle.includes('success')) {
    statusVariant = 'success'
  } else if (lowerTitle.includes('rejected') || lowerTitle.includes('failed') || lowerTitle.includes('cancelled')) {
    statusVariant = 'danger'
  } else if (lowerTitle.includes('request') || lowerTitle.includes('pending')) {
    statusVariant = 'warning'
  }

  // Adjust link_url for laboran context if it points to admin
  let linkPath = dto.link_url || undefined
  if (linkPath && linkPath.startsWith('/admin/room-requests')) {
    linkPath = linkPath.replace('/admin/room-requests', '/laboran/room-requests')
  }

  return {
    id: dto.id,
    category: (dto.category as any) || 'system',
    title: dto.title,
    description: dto.message,
    timestamp: formattedTime,
    isUnread: !dto.is_read,
    statusVariant,
    linkPath,
  }
}

const loadNotifications = async () => {
  isLoading.value = true
  try {
    const [res, unread] = await Promise.all([
      notificationService.getNotifications({
        category: activeCategory.value !== 'all' && activeCategory.value !== 'unread' ? activeCategory.value : undefined,
        unread_only: activeCategory.value === 'unread',
        limit: 50,
      }),
      notificationService.getUnreadCount(),
    ])

    notificationsList.value = (res.data || []).map(mapNotificationDtoToUi)
    rawUnreadCount.value = unread
  } catch (error) {
    console.warn('Failed to load laboran notifications:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  navStore.setBreadcrumbs([
    { label: 'Portal Laboran', path: '/laboran' },
    { label: 'Notifikasi' },
  ])
  loadNotifications()
})

watch(activeCategory, () => {
  loadNotifications()
})

const unreadCount = computed(() => {
  return rawUnreadCount.value || notificationsList.value.filter(n => n.isUnread).length
})

// Actions
const toggleReadStatus = async (item: NotificationItem) => {
  try {
    await notificationService.markAsRead(item.id)
    item.isUnread = false
    rawUnreadCount.value = Math.max(0, rawUnreadCount.value - 1)
  } catch (error) {
    console.warn('Failed to mark notification as read:', error)
  }
}

const markAllAsRead = async () => {
  try {
    await notificationService.markAllAsRead()
    notificationsList.value.forEach(n => { n.isUnread = false })
    rawUnreadCount.value = 0
    toastMessage.value = 'Semua notifikasi ditandai telah dibaca.'
    showToast.value = true
    setTimeout(() => { showToast.value = false }, 3500)
  } catch (error: any) {
    alert(error.response?.data?.message || error.message || 'Gagal menandai semua dibaca')
  }
}

const handleNotificationClick = async (item: NotificationItem) => {
  if (item.isUnread) {
    await toggleReadStatus(item)
  }
  if (item.linkPath) {
    router.push(item.linkPath)
  }
}

const getCategoryBadgeClass = (category: NotificationItem['category']) => {
  switch (category) {
    case 'requests':
      return 'bg-amber-50 text-amber-800 border-amber-200'
    case 'announcements':
      return 'bg-purple-50 text-purple-800 border-purple-200'
    case 'schedules':
      return 'bg-sky-50 text-sky-800 border-sky-200'
    case 'system':
      return 'bg-brand-50 text-dark-green border-brand-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}
</script>

<template>
  <div class="space-y-6 pb-12 select-none">
    
    <!-- 1. Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2.5 border-b border-gray-200/60">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
            Pusat Notifikasi
          </h1>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-100/80 border border-brand-200 text-dark-green text-[11px] font-bold">
            <Bell :size="12" class="text-primary-dark" />
            Pemberitahuan Laboran
          </span>
        </div>
        <p class="text-xs sm:text-sm text-text-muted font-normal">
          Pantau pembaruan permohonan peminjaman, pengumuman siaran, dan aktivitas jadwal operasional.
        </p>
      </div>

      <!-- Action: Mark All Read -->
      <div class="flex items-center gap-2 self-start sm:self-auto shrink-0">
        <button
          @click="markAllAsRead"
          :disabled="unreadCount === 0"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 bg-white hover:bg-brand-50 text-text-primary hover:text-dark-green text-xs font-bold transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-2xs"
        >
          <Check :size="14" />
          <span>Tandai semua dibaca</span>
        </button>
      </div>
    </div>

    <!-- Toast Feedback Notification Banner -->
    <div
      v-if="showToast"
      class="p-3.5 rounded-2xl bg-brand-100/90 border border-brand-200 text-dark-green text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="flex items-center gap-2">
        <CheckCircle2 :size="16" class="text-dark-green shrink-0" />
        <span>{{ toastMessage }}</span>
      </div>
      <button @click="showToast = false" class="text-dark-green hover:opacity-80 cursor-pointer">
        <X :size="14" />
      </button>
    </div>

    <!-- 2. Category Filter Ribbon & Quick Counts -->
    <div class="flex flex-wrap items-center justify-between gap-3 bg-white p-2 sm:p-2.5 rounded-2xl border border-gray-200/70 shadow-2xs">
      <div class="flex flex-wrap items-center gap-1 sm:gap-1.5">
        <button
          @click="activeCategory = 'all'"
          :class="[
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
            activeCategory === 'all'
              ? 'bg-dark-green text-white shadow-xs'
              : 'text-text-secondary hover:bg-surface hover:text-text-primary'
          ]"
        >
          <span>Semua</span>
          <span :class="['px-1.5 py-0.2 rounded-full text-[10px] font-extrabold', activeCategory === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-text-muted']">
            {{ notificationsList.length }}
          </span>
        </button>

        <button
          @click="activeCategory = 'unread'"
          :class="[
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
            activeCategory === 'unread'
              ? 'bg-dark-green text-white shadow-xs'
              : 'text-text-secondary hover:bg-surface hover:text-text-primary'
          ]"
        >
          <span>Belum Dibaca</span>
          <span v-if="unreadCount > 0" class="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-accent text-dark-green">
            {{ unreadCount }}
          </span>
        </button>

        <button
          @click="activeCategory = 'requests'"
          :class="[
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
            activeCategory === 'requests'
              ? 'bg-dark-green text-white shadow-xs'
              : 'text-text-secondary hover:bg-surface hover:text-text-primary'
          ]"
        >
          <ClipboardList :size="13" />
          <span>Permohonan</span>
        </button>

        <button
          @click="activeCategory = 'announcements'"
          :class="[
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
            activeCategory === 'announcements'
              ? 'bg-dark-green text-white shadow-xs'
              : 'text-text-secondary hover:bg-surface hover:text-text-primary'
          ]"
        >
          <Megaphone :size="13" />
          <span>Pengumuman</span>
        </button>

        <button
          @click="activeCategory = 'schedules'"
          :class="[
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
            activeCategory === 'schedules'
              ? 'bg-dark-green text-white shadow-xs'
              : 'text-text-secondary hover:bg-surface hover:text-text-primary'
          ]"
        >
          <Calendar :size="13" />
          <span>Jadwal</span>
        </button>
      </div>

      <div class="text-[11px] text-text-muted px-2 font-medium hidden md:block">
        Menampilkan {{ notificationsList.length }} pemberitahuan
      </div>
    </div>

    <!-- 3. Notifications Stream List -->
    <div class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs overflow-hidden">
      <!-- Loading State -->
      <div v-if="isLoading" class="py-16 text-center">
        <Loader2 :size="30" class="mx-auto text-dark-green animate-spin mb-3" />
        <p class="text-xs text-text-muted font-medium">Memuat notifikasi...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="notificationsList.length === 0" class="py-16 text-center space-y-2">
        <div class="w-12 h-12 rounded-2xl bg-surface border border-gray-100 flex items-center justify-center mx-auto text-text-muted">
          <Bell :size="24" />
        </div>
        <h3 class="text-sm font-bold text-text-primary">Tidak ada notifikasi</h3>
        <p class="text-xs text-text-muted max-w-sm mx-auto">
          Semua pemberitahuan telah diperiksa! Tidak ada notifikasi pada kategori ini.
        </p>
      </div>

      <!-- Notifications List Items -->
      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="item in notificationsList"
          :key="item.id"
          :class="[
            'p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors cursor-pointer group',
            item.isUnread ? 'bg-brand-50/35 hover:bg-brand-50/60' : 'hover:bg-surface/50'
          ]"
          @click="handleNotificationClick(item)"
        >
          <div class="flex items-start gap-3.5 min-w-0 flex-1">
            <!-- Unread Status Dot or Icon -->
            <div class="pt-0.5 shrink-0">
              <div
                v-if="item.isUnread"
                class="w-2.5 h-2.5 rounded-full bg-dark-green ring-4 ring-brand-100 mt-1"
                title="Belum dibaca"
              ></div>
              <div
                v-else
                class="w-2.5 h-2.5 rounded-full bg-transparent mt-1"
              ></div>
            </div>

            <!-- Content Area -->
            <div class="space-y-1 min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span :class="['px-2 py-0.2 rounded-full text-[10px] font-bold uppercase tracking-wider border', getCategoryBadgeClass(item.category)]">
                  {{ item.category === 'requests' ? 'Permohonan' : item.category === 'announcements' ? 'Pengumuman' : item.category === 'schedules' ? 'Jadwal' : 'Sistem' }}
                </span>
                <span class="text-[11px] text-text-muted font-medium flex items-center gap-1">
                  <Clock :size="11" />
                  {{ item.timestamp }}
                </span>
              </div>

              <h4 :class="['text-xs sm:text-sm tracking-tight', item.isUnread ? 'font-extrabold text-text-primary' : 'font-semibold text-text-secondary']">
                {{ item.title }}
              </h4>

              <p class="text-xs text-text-muted leading-relaxed">
                {{ item.description }}
              </p>
            </div>
          </div>

          <!-- Right Action: Mark Read / Open -->
          <div class="flex items-center gap-2 shrink-0 self-center sm:self-auto" @click.stop>
            <button
              v-if="item.isUnread"
              @click="toggleReadStatus(item)"
              class="p-1.5 rounded-lg text-text-muted hover:text-dark-green hover:bg-brand-100/60 transition-colors cursor-pointer"
              title="Tandai telah dibaca"
            >
              <Check :size="15" />
            </button>

            <button
              v-if="item.linkPath"
              @click="handleNotificationClick(item)"
              class="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-dark-green hover:underline cursor-pointer ml-1"
            >
              <span>Lihat</span>
              <ChevronRight :size="13" />
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
