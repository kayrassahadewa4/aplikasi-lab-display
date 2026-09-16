<script lang="ts">
// In-memory module-level flag: resets on EVERY page refresh / reload!
let hasShownInCurrentPageLoad = false

export function resetSplashScreenState() {
  hasShownInCurrentPageLoad = false
}
</script>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'

const props = withDefaults(
  defineProps<{
    duration?: number
    sessionOnly?: boolean
    force?: boolean
  }>(),
  {
    duration: 2000,
    sessionOnly: false,
    force: false,
  }
)

const emit = defineEmits<{
  (e: 'finish'): void
}>()

const isVisible = ref(true)
const isExiting = ref(false)
const progress = ref(0)
let animInterval: ReturnType<typeof setInterval> | null = null
let exitTimeout: ReturnType<typeof setTimeout> | null = null

const statusText = computed(() => {
  if (progress.value < 35) return 'Memuat Sistem...'
  if (progress.value < 75) return 'Menyiapkan Layanan...'
  return 'Selamat Datang'
})

onMounted(() => {
  // Clean up any old sessionStorage flag
  try {
    sessionStorage.removeItem('upn_splash_seen')
  } catch {
    // Ignore private browsing restrictions
  }

  // Determine whether to display splash screen
  if (!props.force) {
    if (props.sessionOnly) {
      try {
        const hasSeen = sessionStorage.getItem('upn_splash_session')
        if (hasSeen === 'true') {
          isVisible.value = false
          emit('finish')
          return
        }
        sessionStorage.setItem('upn_splash_session', 'true')
      } catch {
        // Fallback to in-memory check
      }
    } else {
      // Default: In-memory page-load check.
      // Every browser refresh (F5) re-executes JavaScript, so splash screen ALWAYS plays on refresh!
      // Within the same page run (navigating Login <-> Register), it won't repeat unnecessarily.
      if (hasShownInCurrentPageLoad) {
        isVisible.value = false
        emit('finish')
        return
      }
      hasShownInCurrentPageLoad = true
    }
  }

  // Animate progress smoothly over props.duration
  const startTime = Date.now()
  const totalDuration = Math.max(1200, props.duration)

  animInterval = setInterval(() => {
    const elapsed = Date.now() - startTime
    const currentProgress = Math.min(100, Math.round((elapsed / totalDuration) * 100))
    progress.value = currentProgress

    if (currentProgress >= 100) {
      if (animInterval) clearInterval(animInterval)
      // Hold at 100% briefly so user clearly sees full completion before fade out
      exitTimeout = setTimeout(() => {
        isExiting.value = true
        // Allow fade out transition to complete before unmounting
        setTimeout(() => {
          isVisible.value = false
          emit('finish')
        }, 650)
      }, 300)
    }
  }, 20)
})

onUnmounted(() => {
  if (animInterval) clearInterval(animInterval)
  if (exitTimeout) clearTimeout(exitTimeout)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
      role="status"
      aria-live="polite"
      aria-label="Memuat aplikasi LabDisplay UPN Veteran Jakarta"
      :class="[
        'fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none overflow-hidden',
        'bg-gradient-to-b from-[#02180c] via-[#062e17] to-[#0c5a30]',
        'transition-all duration-700 ease-out',
        isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100',
      ]"
    >
      <!-- Atmospheric Ambient Radial Glow Backing -->
      <div
        class="absolute inset-0 pointer-events-none"
        style="background: radial-gradient(circle at 50% 45%, rgba(16, 185, 129, 0.22) 0%, rgba(12, 90, 48, 0.08) 45%, transparent 70%);"
      ></div>

      <!-- Subtle Dot Pattern Motif -->
      <div class="absolute inset-0 opacity-[0.07] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>

      <!-- Ambient Glow Behind Emblem -->
      <div class="absolute w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none animate-pulse"></div>

      <!-- Centerpiece Content -->
      <div class="relative z-10 flex flex-col items-center text-center px-6 animate-in fade-in zoom-in-95 duration-500">

        <!-- UPN Emblem Glassmorphic Badge -->
        <div class="relative mb-6 group">
          <!-- Outer Pulsing Ring -->
          <div class="absolute -inset-2 rounded-[28px] bg-gradient-to-tr from-amber-400/20 to-emerald-400/30 blur-md opacity-70 animate-pulse"></div>

          <!-- Glass Shield -->
          <div class="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-4 bg-white/12 backdrop-blur-2xl border border-white/30 shadow-[0_12px_40px_rgba(0,0,0,0.35)] flex items-center justify-center transition-transform duration-500 hover:scale-105">
            <img
              src="/images/logo-upnvj.webp"
              alt="Logo Resmi UPN Veteran Jakarta"
              class="w-full h-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)]"
              loading="eager"
            />
          </div>
        </div>

        <!-- Typography & Branding -->
        <div class="space-y-1.5">
          <!-- Main App Logo Title -->
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Lab<span class="text-amber-400">Display</span>
          </h1>

          <!-- Faculty Identity -->
          <p class="text-xs sm:text-[13px] font-bold tracking-[0.22em] text-white/95 uppercase">
            Fakultas Ilmu Komputer
          </p>

          <!-- University Identity -->
          <p class="text-[10px] sm:text-[11px] font-semibold tracking-[0.16em] text-emerald-300/85 uppercase">
            UPN "Veteran" Jakarta
          </p>
        </div>

        <!-- Sleek Animated Progress Bar ("Pipa") -->
        <div class="w-56 sm:w-64 mt-8">
          <!-- Track ("Pipa Luar") -->
          <div class="h-2.5 w-full rounded-full bg-black/40 backdrop-blur-md overflow-hidden p-0.5 border border-white/20 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
            <!-- Fill ("Isi Pipa Bergerak") -->
            <div
              class="h-full rounded-full transition-all duration-100 ease-out relative"
              :style="{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #10b981 0%, #f59e0b 60%, #fbbf24 100%)',
                boxShadow: '0 0 12px rgba(245, 158, 11, 0.85), 0 0 4px rgba(16, 185, 129, 0.9)',
              }"
            >
              <!-- Ujung Pendar Cairan yang Bergerak -->
              <div
                v-if="progress > 3 && progress < 99"
                class="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_6px_#ffffff]"
              ></div>
            </div>
          </div>

          <!-- Status Text & Persentase Berjalan -->
          <div class="flex items-center justify-between text-[11px] font-medium tracking-wide text-white/75 mt-2.5 px-1">
            <span class="flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{{ statusText }}</span>
            </span>
            <span class="font-mono text-[10.5px] font-bold text-amber-400">{{ progress }}%</span>
          </div>
        </div>

      </div>

      <!-- Footer Subtitle / Institutional Seal -->
      <div class="absolute bottom-6 text-center z-10 px-4">
        <p class="text-[9.5px] sm:text-[10px] tracking-[0.2em] font-medium uppercase text-white/40 font-mono">
          Sistem Display Jadwal & Operasional Laboratorium
        </p>
      </div>
    </div>
  </Teleport>
</template>
