<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { X, ZoomIn, Download } from 'lucide-vue-next'

interface Props {
  src?: string | null
  alt?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  objectPosition?: string
  previewable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  objectPosition: 'center 20%',
  previewable: false,
})

const sizeClasses = {
  xs: 'w-7 h-7 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 sm:w-18 sm:h-18 text-lg',
  '2xl': 'w-20 h-20 text-xl',
  '3xl': 'w-24 h-24 text-2xl',
}

const imageError = ref(false)
const isModalOpen = ref(false)

watch(
  () => props.src,
  () => {
    imageError.value = false
  },
)

const resolvedSrc = computed(() => {
  if (!props.src || imageError.value) return undefined
  if (
    props.src.startsWith('http://') ||
    props.src.startsWith('https://') ||
    props.src.startsWith('data:') ||
    props.src.startsWith('blob:')
  ) {
    return props.src
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
  const hostBase = apiBase.replace(/\/api\/?$/, '')
  return `${hostBase}${props.src.startsWith('/') ? props.src : '/' + props.src}`
})

const initials = computed(() => {
  if (!props.name) return '?'
  return props.name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const bgColor = computed(() => {
  const colors = [
    'bg-dark-green',
    'bg-primary',
    'bg-emerald-600',
    'bg-teal-600',
    'bg-indigo-600',
    'bg-blue-600',
  ]
  const index = props.name ? props.name.charCodeAt(0) % colors.length : 0
  return colors[index]
})

const openModal = (e?: MouseEvent) => {
  if (e) e.stopPropagation()
  if (!resolvedSrc.value) return
  isModalOpen.value = true
  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'hidden'
  }
}

const closeModal = () => {
  isModalOpen.value = false
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
}

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isModalOpen.value) {
    closeModal()
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onKeyDown)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onKeyDown)
    if (typeof document !== 'undefined') {
      document.body.style.overflow = ''
    }
  }
})

defineExpose({
  openModal,
  closeModal,
  resolvedSrc,
})
</script>

<template>
  <div
    :class="[
      'rounded-full flex items-center justify-center overflow-hidden shrink-0 select-none font-bold relative group/avatar transition-all duration-200',
      sizeClasses[size],
      !resolvedSrc ? `${bgColor} text-white` : 'bg-gray-100',
      previewable && resolvedSrc ? 'cursor-pointer hover:scale-105 hover:ring-2 hover:ring-emerald-400/80' : '',
    ]"
    style="isolation: isolate; transform: translateZ(0);"
    :title="previewable && resolvedSrc ? 'Klik untuk melihat foto HD' : (alt || name || undefined)"
    @click="openModal"
  >
    <img
      v-if="resolvedSrc"
      :src="resolvedSrc"
      :alt="alt || name || 'Avatar'"
      class="w-full h-full object-cover select-none pointer-events-none transform-gpu"
      :style="{
        objectPosition: objectPosition,
        imageRendering: '-webkit-optimize-contrast',
      }"
      loading="eager"
      decoding="sync"
      @error="imageError = true"
    />
    <span v-else>{{ initials }}</span>

    <!-- Hover Zoom Overlay when previewable -->
    <div
      v-if="previewable && resolvedSrc"
      class="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white pointer-events-none rounded-full backdrop-blur-2xs"
    >
      <ZoomIn :size="size === 'xs' || size === 'sm' ? 12 : size === 'md' ? 14 : 18" stroke-width="2.5" />
    </div>
  </div>

  <!-- Teleported Fullscreen HD Image Lightbox Modal -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isModalOpen && resolvedSrc"
        class="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md select-none"
        @click.self="closeModal"
      >
        <div
          class="relative max-w-lg w-full bg-[#0e1f14] border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center animate-in zoom-in-95 duration-200 ring-1 ring-white/10"
        >
          <!-- Top Institutional Bar -->
          <div class="h-1 w-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-400" />

          <!-- Modal Header -->
          <div class="w-full flex items-center justify-between px-5 py-3.5 border-b border-emerald-900/60 bg-[#08150c]/90">
            <div class="flex items-center gap-3">
              <div class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
              <div>
                <h3 class="text-sm font-extrabold text-white tracking-tight">
                  {{ name || 'Foto Profil' }}
                </h3>
                <p class="text-[11px] text-emerald-300/80 font-medium">
                  Tampilan Resolusi Penuh HD
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <a
                :href="resolvedSrc"
                target="_blank"
                download
                class="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Buka / Unduh Foto Asli"
              >
                <Download :size="16" />
              </a>
              <button
                @click="closeModal"
                class="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Tutup (Esc)"
              >
                <X :size="18" />
              </button>
            </div>
          </div>

          <!-- Main Image Showcase -->
          <div class="p-4 sm:p-6 flex items-center justify-center max-h-[72vh] w-full overflow-hidden bg-black/50">
            <img
              :src="resolvedSrc"
              :alt="alt || name || 'Foto Profil'"
              class="max-h-[62vh] w-auto max-w-full rounded-2xl shadow-2xl object-contain border border-emerald-500/20"
              style="image-rendering: auto;"
            />
          </div>

          <!-- Modal Footer -->
          <div class="w-full px-5 py-3 bg-[#08150c]/90 border-t border-emerald-900/60 flex items-center justify-between text-[11px] text-emerald-200/70 font-medium">
            <span class="flex items-center gap-1.5">
              <span>Tekan</span>
              <kbd class="px-1.5 py-0.5 rounded-md bg-white/15 text-white font-mono text-[10px] font-bold">Esc</kbd>
              <span>atau klik di luar untuk menutup</span>
            </span>
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-400/30">
              HD Asli
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
