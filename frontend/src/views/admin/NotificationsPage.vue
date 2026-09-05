<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
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
  Loader2
} from 'lucide-vue-next'
import { notificationService, type NotificationDto } from '@/services/notification.service'
import type { NotificationItem } from '@/mocks/admin-notifications.mock'
import { formatDateTime } from '@/utils/format.utils'

const router = useRouter()
const navStore = useAdminNavStore()

// State
const notificationsList = ref<NotificationItem[]>([])
const activeCategory = ref<'all' | 'unread' | 'requests' | 'schedules' | 'system'>('all')
const isLoading = ref(false)
const rawUnreadCount = ref(0)

// Toast Banner
const showToast = ref(false)
const toastMessage = ref('')

const mapNotificationDtoToUi = (dto: NotificationDto): NotificationItem => {
  const formattedTime = dto.created_at ? formatDateTime(dto.created_at) : 'Baru Saja'

  let statusVariant: 'success' | 'warning' | 'danger' | 'info' = 'info'
  const lowerTitle = dto.title.toLowerCase()
  if (lowerTitle.includes('approved') || lowerTitle.includes('completed') || lowerTitle.includes('success')) {
    statusVariant = 'success'
  } else if (lowerTitle.includes('rejected') || lowerTitle.includes('failed')) {
    statusVariant = 'danger'
  } else if (lowerTitle.includes('request') || lowerTitle.includes('pending')) {
    statusVariant = 'warning'
  }

  return {
    id: dto.id,
    category: (dto.category as any) || 'system',
    title: dto.title,
    description: dto.message,
    timestamp: formattedTime,
    isUnread: !dto.is_read,
    statusVariant,
    linkPath: dto.link_url || undefined,
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
    console.warn('Failed to load notifications:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  navStore.setBreadcrumbs([
    { label: 'Dashboard', path: '/admin' },
    { label: 'Pusat Notifikasi' },
  ])
  loadNotifications()
})

watch(activeCategory, () => {
  loadNotifications()
})

// Computed Filtered List
const filteredNotifications = computed(() => notificationsList.value)

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
    alert(error.response?.data?.message || error.message || 'Gagal menandai semua telah dibaca')
  }
}

const getCategoryBadgeClass = (category: NotificationItem['category']) => {
  switch (category) {
    case 'requests':
      return 'bg-amber-50 text-amber-800 border-amber-200'
    case 'schedules':
      return 'bg-sky-50 text-sky-800 border-sky-200'
    case 'system':
      return 'bg-brand-50 text-dark-green border-brand-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

const getCategoryLabel = (category: NotificationItem['category']) => {
  switch (category) {
    case 'requests':
      return 'Permohonan'
    case 'schedules':
      return 'Jadwal'
    case 'system':
      return 'Sistem'
    default:
      return 'Umum'
  }
}
</script>

<template>
  <div class="space-y-6 pb-8 select-none">
    
    <!-- 1. Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2.5 border-b border-gray-200/60">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
            Pusat Notifikasi
          </h1>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-100/80 border border-brand-200 text-dark-green text-[11px] font-bold">
            <Bell :size="12" class="text-primary-dark" />
            Aktivitas & Peristiwa Sistem
          </span>
        </div>
        <p class="text-xs sm:text-sm text-text-muted font-normal">
          Pantau informasi penting terkait aktivitas laboratorium, permohonan ruangan, dan peristiwa sistem.
        </p>
      </div>

      <!-- Top Primary Action -->
      <div class="flex items-center gap-3">
        <button
          @click="markAllAsRead"
          :disabled="unreadCount === 0"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white hover:bg-surface text-text-primary text-xs font-bold shadow-2xs transition-all duration-150 disabled:opacity-50 cursor-pointer"
        >
          <Check :size="15" stroke-width="2.5" class="text-dark-green" />
          <span>Tandai Semua Dibaca</span>
        </button>
      </div>
    </div>

    <!-- Success Feedback Toast Banner -->
    <div
      v-if="showToast"
      class="p-3.5 rounded-2xl bg-brand-100/90 border border-brand-200 text-dark-green text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="flex items-center gap-2">
        <CheckCircle2 :size="16" class="text-dark-green shrink-0" />
        <span>{{ toastMessage }}</span>
      </div>
      <button @click="showToast = false" class="text-dark-green hover:opacity-80">
        <X :size="14" />
      </button>
    </div>

    <!-- 2. Category Filter Controls Bar -->
    <div class="bg-white p-2.5 rounded-2xl border border-gray-200/70 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
      <div class="flex items-center gap-1.5 overflow-x-auto py-0.5">
        <button
          @click="activeCategory = 'all'"
          :class="[
            'px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5',
            activeCategory === 'all' ? 'bg-dark-green text-white shadow-2xs' : 'text-text-secondary hover:bg-surface'
          ]"
        >
          <span>Semua</span>
          <span class="px-1.5 py-0.2 rounded-full text-[10px]" :class="activeCategory === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-text-muted'">
            {{ notificationsList.length }}
          </span>
        </button>

        <button
          @click="activeCategory = 'unread'"
          :class="[
            'px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5',
            activeCategory === 'unread' ? 'bg-dark-green text-white shadow-2xs' : 'text-text-secondary hover:bg-surface'
          ]"
        >
          <span>Belum Dibaca</span>
          <span v-if="unreadCount > 0" class="px-1.5 py-0.2 rounded-full text-[10px]" :class="activeCategory === 'unread' ? 'bg-white/20 text-white' : 'bg-brand-100 text-dark-green font-bold'">
            {{ unreadCount }}
          </span>
        </button>

        <button
          @click="activeCategory = 'requests'"
          :class="[
            'px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer',
            activeCategory === 'requests' ? 'bg-dark-green text-white shadow-2xs' : 'text-text-secondary hover:bg-surface'
          ]"
        >
          Permohonan Pinjam
        </button>

        <button
          @click="activeCategory = 'schedules'"
          :class="[
            'px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer',
            activeCategory === 'schedules' ? 'bg-dark-green text-white shadow-2xs' : 'text-text-secondary hover:bg-surface'
          ]"
        >
          Jadwal Penggunaan
        </button>

        <button
          @click="activeCategory = 'system'"
          :class="[
            'px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer',
            activeCategory === 'system' ? 'bg-dark-green text-white shadow-2xs' : 'text-text-secondary hover:bg-surface'
          ]"
        >
          Sistem
        </button>
      </div>

      <div class="text-[11px] text-text-muted font-medium pr-1">
        Menampilkan {{ filteredNotifications.length }} notifikasi
      </div>
    </div>

    <!-- 3. Notification List Container -->
    <div class="bg-white rounded-2xl border border-gray-200/70 shadow-2xs overflow-hidden divide-y divide-gray-100">
      <div v-if="isLoading" class="p-12 text-center text-text-muted">
        <Loader2 :size="24" class="animate-spin text-dark-green mx-auto mb-2" />
        <p class="text-xs">Memuat notifikasi...</p>
      </div>
      <div
        v-else
        v-for="item in filteredNotifications"
        :key="item.id"
        :class="[
          'p-4 sm:p-5 transition-all flex items-start gap-4 group',
          item.isUnread ? 'bg-brand-50/30' : 'hover:bg-surface/50'
        ]"
      >
        <!-- Semantic Icon Container -->
        <div
          :class="[
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs',
            item.statusVariant === 'success' ? 'bg-emerald-50 text-dark-green border-brand-200' :
            item.statusVariant === 'warning' ? 'bg-amber-50 text-amber-800 border-amber-200' :
            item.statusVariant === 'danger' ? 'bg-red-50 text-red-700 border-red-200' :
            'bg-sky-50 text-sky-800 border-sky-200'
          ]"
        >
          <CheckCircle2 v-if="item.statusVariant === 'success'" :size="18" />
          <AlertCircle v-else-if="item.statusVariant === 'warning' || item.statusVariant === 'danger'" :size="18" />
          <Info v-else :size="18" />
        </div>

        <!-- Content Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2 mb-1">
            <div class="flex items-center gap-2">
              <h3 :class="['text-xs sm:text-sm tracking-tight', item.isUnread ? 'font-bold text-text-primary' : 'font-semibold text-text-secondary']">
                {{ item.title }}
              </h3>
              <span :class="['px-2 py-0.2 rounded-full text-[10px] font-bold uppercase tracking-wider border', getCategoryBadgeClass(item.category)]">
                {{ getCategoryLabel(item.category) }}
              </span>
            </div>
            <span class="text-[11px] text-text-muted font-medium shrink-0">{{ item.timestamp }}</span>
          </div>

          <p class="text-xs text-text-muted font-normal leading-relaxed mb-2">
            {{ item.description }}
          </p>

          <div class="flex items-center justify-between pt-1">
            <router-link
              v-if="item.linkPath"
              :to="item.linkPath"
              class="inline-flex items-center gap-1 text-[11px] font-bold text-dark-green hover:underline"
            >
              <span>Lihat detail</span>
              <ChevronRight :size="12" />
            </router-link>
            <span v-else></span>

            <button
              @click="toggleReadStatus(item)"
              class="text-[11px] text-text-muted hover:text-dark-green font-semibold cursor-pointer"
            >
              {{ item.isUnread ? 'Tandai sudah dibaca' : 'Tandai belum dibaca' }}
            </button>
          </div>
        </div>

        <!-- Unread Green Dot Indicator -->
        <span
          v-if="item.isUnread"
          class="w-2.5 h-2.5 rounded-full bg-dark-green shrink-0 mt-2 shadow-xs"
        ></span>
      </div>

      <!-- Empty Notification State -->
      <div v-if="filteredNotifications.length === 0" class="p-12 text-center text-text-muted space-y-3">
        <Bell :size="36" class="mx-auto text-text-muted/40" />
        <h4 class="text-sm font-bold text-text-secondary">Tidak ada notifikasi ditemukan</h4>
        <p class="text-xs text-text-muted max-w-sm mx-auto">
          Tidak ada pemberitahuan yang sesuai dengan kategori filter yang dipilih.
        </p>
      </div>
    </div>

  </div>
</template>
