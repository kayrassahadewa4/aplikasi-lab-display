<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminNavStore } from '@/stores/admin-nav.store'
import {
  ArrowLeft,
  Megaphone,
  CheckCircle2,
  X,
  Save,
  Plus,
  AlertTriangle,
  Sparkles,
  Eye,
  ShieldCheck,
  Loader2,
  Calendar,
  FileText
} from 'lucide-vue-next'
import { announcementService } from '@/services/announcement.service'

const route = useRoute()
const router = useRouter()
const navStore = useAdminNavStore()

const ancId = computed(() => route.params.id as string | undefined)
const isEditMode = computed(() => !!ancId.value)

// Form State
const form = ref({
  title: '',
  content: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  status: 'Active' as 'Active' | 'Scheduled' | 'Expired',
})

const showToast = ref(false)
const toastMessage = ref('')
const isSaving = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  if (isEditMode.value && ancId.value) {
    try {
      const existing = await announcementService.getAnnouncementById(ancId.value)
      form.value = {
        title: existing.title,
        content: existing.content,
        startDate: existing.start_at ? existing.start_at.slice(0, 10) : '',
        endDate: existing.end_at ? existing.end_at.slice(0, 10) : '',
        status: existing.is_active ? 'Active' : 'Expired',
      }
      navStore.setBreadcrumbs([
        { label: 'Dashboard', path: '/admin' },
        { label: 'Pengumuman', path: '/admin/announcements' },
        { label: existing.title, path: `/admin/announcements/${existing.id}` },
        { label: 'Ubah' },
      ])
    } catch {
      router.push('/admin/announcements')
    }
  } else {
    navStore.setBreadcrumbs([
      { label: 'Dashboard', path: '/admin' },
      { label: 'Pengumuman', path: '/admin/announcements' },
      { label: 'Tambah Pengumuman' },
    ])
  }
})

const handleSave = async () => {
  if (!form.value.title || !form.value.content) return
  isSaving.value = true
  errorMessage.value = ''

  try {
    const startDateIso = new Date(form.value.startDate + 'T00:00:00.000Z').toISOString()
    const endDateIso = new Date(form.value.endDate + 'T23:59:59.999Z').toISOString()
    const isActive = form.value.status === 'Active'

    if (isEditMode.value && ancId.value) {
      await announcementService.updateAnnouncement(ancId.value, {
        title: form.value.title.trim(),
        content: form.value.content.trim(),
        start_at: startDateIso,
        end_at: endDateIso,
        is_active: isActive,
      })
      toastMessage.value = 'Pengumuman berhasil diperbarui.'
    } else {
      await announcementService.createAnnouncement({
        title: form.value.title.trim(),
        content: form.value.content.trim(),
        start_at: startDateIso,
        end_at: endDateIso,
        is_active: isActive,
      })
      toastMessage.value = 'Pengumuman baru berhasil diterbitkan.'
    }

    showToast.value = true
    setTimeout(() => {
      showToast.value = false
      if (isEditMode.value && ancId.value) {
        router.push(`/admin/announcements/${ancId.value}`)
      } else {
        router.push('/admin/announcements')
      }
    }, 1000)
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || error.message || 'Gagal menyimpan pengumuman'
  } finally {
    isSaving.value = false
  }
}

const handleCancel = () => {
  if (isEditMode.value && ancId.value) {
    router.push(`/admin/announcements/${ancId.value}`)
  } else {
    router.push('/admin/announcements')
  }
}
</script>

<template>
  <div class="space-y-6 pb-12 select-none w-full max-w-full min-w-0">
    <!-- 1. TOP HEADER & BREADCRUMB BACK LINK -->
    <div>
      <button
        @click="handleCancel"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-dark-green hover:underline mb-2 cursor-pointer"
      >
        <ArrowLeft :size="14" />
        <span>Kembali ke Pengumuman</span>
      </button>

      <div class="pb-3 border-b border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-text-primary tracking-tight leading-tight">
              {{ isEditMode ? 'Ubah Pengumuman' : 'Tambah Pengumuman' }}
            </h1>
            <span class="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-brand-100 text-dark-green text-xs font-extrabold border border-brand-200">
              <Sparkles :size="13" />
              <span>{{ isEditMode ? 'Siaran Aktif' : 'Pengumuman Baru' }}</span>
            </span>
          </div>
          <p class="text-xs sm:text-sm text-text-muted font-medium">
            {{ isEditMode ? 'Perbarui teks pengumuman publik, rentang penayangan, dan status siaran.' : 'Terbitkan pengumuman baru untuk ditampilkan pada layar display monitor dan portal.' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Success Toast Feedback Banner -->
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

    <!-- Error Alert -->
    <div
      v-if="errorMessage"
      class="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-xs shadow-2xs"
    >
      <AlertTriangle :size="18" class="text-red-600 shrink-0 mt-0.5" />
      <div class="flex-1">
        <p class="font-bold text-red-800">Gagal</p>
        <p class="text-red-700 mt-1">{{ errorMessage }}</p>
      </div>
      <button @click="errorMessage = ''" class="text-red-600 hover:opacity-80 cursor-pointer">
        <X :size="14" />
      </button>
    </div>

    <!-- 2. MAIN 2-COLUMN GRID (8 COLS FORM + 4 COLS SIDEBAR) -->
    <form @submit.prevent="handleSave" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- ======================================================== -->
      <!-- LEFT COLUMN: MAIN FORM SECTIONS (8 COLS)                 -->
      <!-- ======================================================== -->
      <div class="lg:col-span-8 space-y-5">
        <!-- Section 1: Title & Schedule -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 sm:p-7 space-y-5">
          <div class="flex items-center gap-3 border-b border-gray-100 pb-3.5">
            <div class="w-10 h-10 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <Megaphone :size="20" stroke-width="2.2" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-text-primary tracking-tight">Konfigurasi Pengumuman</h3>
              <p class="text-xs text-text-muted">Tentukan judul tajuk, durasi siaran, dan status keaktifan.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1.5 sm:col-span-2">
              <label class="block font-bold text-text-primary">
                Judul Tajuk <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.title"
                type="text"
                placeholder="mis. Ujian Praktikum Tengah Semester & Masa Pemeliharaan Lab"
                required
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">
                Tanggal Mulai Tayang <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.startDate"
                type="date"
                required
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-text-primary">
                Tanggal Selesai Tayang <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.endDate"
                type="date"
                required
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors"
              />
            </div>

            <div class="space-y-1.5 sm:col-span-2">
              <label class="block font-bold text-text-primary">
                Status Penayangan <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.status"
                class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white transition-colors cursor-pointer"
              >
                <option value="Active">Aktif (Ditayangkan Langsung)</option>
                <option value="Scheduled">Terjadwal (Antrean Menunggu Tanggal Mulai)</option>
                <option value="Expired">Kedaluwarsa (Diarsipkan / Nonaktif)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Section 2: Message Body -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 sm:p-7 space-y-5">
          <div class="flex items-center gap-3 border-b border-gray-100 pb-3.5">
            <div class="w-10 h-10 rounded-xl bg-brand-100 text-dark-green flex items-center justify-center shrink-0 shadow-2xs">
              <FileText :size="20" stroke-width="2.2" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-text-primary tracking-tight">Isi Teks Berjalan</h3>
              <p class="text-xs text-text-muted">Masukkan teks pengumuman lengkap yang akan berjalan pada bilah bawah monitor publik.</p>
            </div>
          </div>

          <div class="space-y-1.5 text-xs">
            <div class="flex items-center justify-between">
              <label class="block font-bold text-text-primary">
                Isi Pengumuman <span class="text-red-500">*</span>
              </label>
              <span class="text-[11px] text-text-muted font-medium">{{ form.content.length }} karakter</span>
            </div>
            <textarea
              v-model="form.content"
              rows="5"
              placeholder="Masukkan pesan publik yang akan ditayangkan di layar monitor langsung..."
              required
              class="w-full px-3.5 py-2.5 bg-surface/60 border border-gray-200/90 rounded-xl font-medium text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-dark-green/20 focus:border-dark-green focus:bg-white resize-none leading-relaxed transition-colors"
            ></textarea>
            <p class="text-[11px] text-text-muted">Buat pengumuman secara ringkas dan jelas agar mudah dibaca pada layar monitor jarak jauh.</p>
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- RIGHT COLUMN: LIVE PREVIEW & ACTION SIDEBAR (4 COLS)     -->
      <!-- ======================================================== -->
      <div class="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
        <!-- Live Ticker Simulation Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 sm:p-6 space-y-4">
          <div class="flex items-center justify-between border-b border-gray-100 pb-3">
            <h4 class="text-xs font-black uppercase tracking-wider text-text-primary flex items-center gap-2">
              <Eye :size="15" class="text-dark-green" />
              <span>Pratinjau Teks Berjalan</span>
            </h4>
            <span
              :class="[
                'px-2 py-0.5 rounded-full text-[10px] font-extrabold border',
                form.status === 'Active'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : form.status === 'Scheduled'
                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                    : 'bg-gray-100 text-text-muted border-gray-200'
              ]"
            >
              {{ form.status === 'Active' ? 'Aktif' : form.status === 'Scheduled' ? 'Terjadwal' : 'Kedaluwarsa' }}
            </span>
          </div>

          <div class="space-y-3 text-xs">
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Judul</span>
              <span class="font-bold text-text-primary truncate max-w-[170px] text-right">{{ form.title || 'Tanpa Judul' }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span class="text-text-muted font-medium">Rentang Penayangan</span>
              <span class="font-mono font-bold text-text-secondary text-[11px]">{{ form.startDate }} → {{ form.endDate }}</span>
            </div>

            <!-- Ticker Mock Container -->
            <div class="p-3 rounded-xl bg-surface/80 border border-gray-100 space-y-1">
              <span class="text-[10px] font-extrabold uppercase text-dark-green tracking-wider block">Simulasi Teks Berjalan Langsung</span>
              <p class="text-[11px] font-semibold text-text-secondary leading-snug line-clamp-3">
                {{ form.content || 'Pratinjau teks pengumuman yang akan ditampilkan...' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Broadcast Policy Guidelines Card -->
        <div class="bg-brand-50/60 rounded-2xl border border-brand-200/80 p-5 space-y-2.5 text-xs">
          <div class="flex items-center gap-2 font-bold text-dark-green">
            <ShieldCheck :size="16" />
            <span>Panduan Penayangan</span>
          </div>
          <ul class="text-[11px] text-text-secondary space-y-1.5 list-disc list-inside leading-relaxed">
            <li>Pengumuman aktif akan otomatis berjalan pada bilah teks layar monitor display publik.</li>
            <li>Gunakan informasi penting secara bijak agar keterbacaan mahasiswa dan staf tetap terjaga.</li>
            <li>Pengumuman kedaluwarsa akan otomatis diarsipkan dan dihapus dari tayangan publik.</li>
          </ul>
        </div>

        <!-- Sticky Primary Action Buttons Card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-3">
          <button
            type="submit"
            :disabled="isSaving || !form.title || !form.content"
            class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#3B694A] to-[#2D5A3F] hover:from-[#31573E] hover:to-[#244430] text-white font-extrabold text-xs shadow-xs shadow-[#2D5A3F]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="isSaving" :size="16" class="animate-spin" />
            <Save v-else-if="isEditMode" :size="16" />
            <Plus v-else :size="16" />
            <span>{{ isSaving ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Terbitkan Pengumuman') }}</span>
          </button>
          <button
            type="button"
            @click="handleCancel"
            :disabled="isSaving"
            class="w-full py-2.5 px-4 rounded-xl border border-gray-200/80 hover:bg-surface text-text-secondary font-bold text-xs transition-all cursor-pointer text-center disabled:opacity-50"
          >
            Batal & Kembali
          </button>
        </div>
      </div>
    </form>
  </div>
</template>
