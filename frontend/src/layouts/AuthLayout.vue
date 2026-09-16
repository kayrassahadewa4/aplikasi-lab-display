<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { CheckCircle2, UserPlus } from 'lucide-vue-next'
import { SplashScreen } from '@/components'

const route = useRoute()
const isRegisterPage = computed(() => route.name === 'Register' || route.path.includes('register'))
</script>

<template>
  <!-- Institutional UPNVJ Splash Screen -->
  <SplashScreen :force="route.query.splash === 'true'" />

  <div class="min-h-screen lg:h-[100dvh] lg:max-h-[100dvh] w-full flex flex-col lg:flex-row font-sans antialiased text-text-primary relative overflow-hidden">
    <!-- Top Right Fixed "Live Display" Pill — Frosted glass chip -->
    <div class="absolute top-4 right-4 lg:top-5 lg:right-6 z-30 hidden sm:block">
      <RouterLink
        to="/display"
        class="text-[11px] font-semibold tracking-wide uppercase px-3.5 py-1.5 rounded-full bg-white/70 hover:bg-white/90 text-text-secondary shadow-sm border border-white/60 backdrop-blur-xl transition-all duration-200 flex items-center gap-2 group hover:shadow-md"
      >
        <span class="w-[7px] h-[7px] rounded-full bg-primary animate-pulse ring-2 ring-primary/20"></span>
        <span class="group-hover:text-text-primary transition-colors">Live Display</span>
      </RouterLink>
    </div>

    <!-- LEFT PANEL (HERO) — Preserved & Context Aware -->
    <div
      class="w-full lg:w-[52%] xl:w-1/2 relative flex flex-col justify-between p-6 sm:p-10 lg:p-10 xl:p-12 overflow-hidden min-h-[480px] lg:min-h-0 lg:h-full bg-cover bg-no-repeat select-none"
      style="background-image: url('/images/fik-campus-hero.jpg'); background-position: left 90%;"
    >
      <!-- Overlays -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/82 via-black/30 to-black/55 pointer-events-none"></div>
      <div class="absolute inset-0 bg-dark-green/10 mix-blend-multiply pointer-events-none"></div>
      <div class="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/40 to-transparent pointer-events-none"></div>

      <!-- Dot pattern accent -->
      <div class="absolute top-1/3 right-8 opacity-[0.12] pointer-events-none hidden lg:block z-10">
        <div class="grid grid-cols-5 gap-2">
          <div v-for="i in 15" :key="i" class="w-1 h-1 rounded-full bg-white"></div>
        </div>
      </div>

      <!-- Logo & Identity -->
      <div class="relative z-20">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl bg-white p-1 flex items-center justify-center shadow-lg shadow-black/30 border border-white/20">
            <img
              src="/images/logo-upnvj.webp"
              alt="UPNVJ Logo"
              class="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 class="font-bold text-lg text-white tracking-tight leading-none">Lab<span class="font-extrabold text-amber-400">Display</span></h1>
            <p class="text-[10.5px] text-white/70 font-medium mt-1 tracking-wide uppercase">FIK UPN "Veteran" Jakarta</p>
          </div>
        </div>
      </div>

      <!-- Headline & Description -->
      <div class="relative z-20 mt-6 lg:mt-8 mb-auto max-w-xl xl:max-w-2xl">
        <div class="flex items-start gap-3.5 sm:gap-5 lg:gap-6">
          <!-- Extra Large Opening Quotation Mark Accent (Beside text on the left) -->
          <svg
            class="w-14 h-14 sm:w-20 sm:h-20 lg:w-[92px] lg:h-[92px] xl:w-[104px] xl:h-[104px] text-white/30 drop-shadow-md fill-current shrink-0 select-none -mt-1.5 sm:-mt-2.5 lg:-mt-3.5"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
          </svg>

          <!-- Content Column: Big Text, Small Text, and Badge All Aligned Flush Left -->
          <div class="flex-1 min-w-0 space-y-4">
            <!-- Big text headline -->
            <h2 v-if="isRegisterPage" class="text-[24px] sm:text-3xl lg:text-[34px] xl:text-[38px] font-extrabold tracking-tight leading-[1.2] text-left text-white">
              Bergabung dengan Civitas FIK.<br />
              <span class="text-amber-400">Kolaborasi Tanpa Hambatan.</span>
            </h2>
            <h2 v-else class="text-[24px] sm:text-3xl lg:text-[34px] xl:text-[38px] font-extrabold tracking-tight leading-[1.2] text-left text-white">
              Kelola Jadwal Laboratorium.<br />
              <span class="text-accent">Optimalkan Operasional.</span>
            </h2>

            <!-- Small text description (aligned with big text) -->
            <p v-if="isRegisterPage" class="text-white/65 text-xs sm:text-[13px] lg:text-sm leading-[1.7] font-normal max-w-md">
              Daftarkan akun resmi Dosen Pengajar atau Staf Laboran untuk mempermudah reservasi ruang, validasi jadwal, dan pemantauan fasilitas laboratorium FIK UPNVJ.
            </p>
            <p v-else class="text-white/65 text-xs sm:text-[13px] lg:text-sm leading-[1.7] font-normal max-w-md">
              Portal manajemen terpadu untuk penjadwalan laboratorium, permohonan fasilitas, pemantauan operasional, dan layanan display publik.
            </p>

            <!-- Trust Badge (also aligned with big text) -->
            <div class="pt-1">
              <div v-if="isRegisterPage" class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/8 border border-white/12 text-white/70 text-[11px] font-medium tracking-wide backdrop-blur-sm">
                <UserPlus :size="13" class="text-amber-400" />
                <span>Registrasi Resmi · Civitas FIK UPNVJ</span>
              </div>
              <div v-else class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/8 border border-white/12 text-white/70 text-[11px] font-medium tracking-wide backdrop-blur-sm">
                <CheckCircle2 :size="13" class="text-accent" />
                <span>Aman · Andal · Efisien</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="relative z-20 pt-3 border-t border-white/12">
        <p class="text-[10px] lg:text-[11px] text-white/35 font-normal tracking-wide">© 2026 Sistem Display Laboratorium · Fakultas Ilmu Komputer UPNVJ</p>
      </div>
    </div>

    <!-- RIGHT PANEL — Luminous layered environment -->
    <div class="w-full lg:w-[48%] xl:w-1/2 flex flex-col items-center p-4 sm:p-6 lg:p-6 xl:p-8 overflow-y-auto lg:h-full relative overflow-x-hidden">
      
      <!-- Layered ambient background container (strictly clipped) -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <!-- Layer 0: Warm-cool base gradient -->
        <div class="absolute inset-0 bg-gradient-to-br from-[#f0f4f1] via-[#f6f8f6] to-[#eef2ef]"></div>
        
        <!-- Layer 1: Large soft radial green glow — top-right -->
        <div class="absolute -top-20 -right-20 w-[420px] h-[420px] rounded-full" style="background: radial-gradient(circle, rgba(108,155,118,0.08) 0%, rgba(108,155,118,0.02) 50%, transparent 70%);"></div>
        
        <!-- Layer 2: Subtle mint glow — bottom-left -->
        <div class="absolute -bottom-16 -left-16 w-[380px] h-[380px] rounded-full" style="background: radial-gradient(circle, rgba(151,196,158,0.10) 0%, rgba(151,196,158,0.03) 45%, transparent 70%);"></div>
        
        <!-- Layer 3: Warm highlight — center-right -->
        <div class="absolute top-1/2 -translate-y-1/2 right-0 w-[300px] h-[500px]" style="background: radial-gradient(ellipse at right, rgba(186,209,122,0.04) 0%, transparent 60%);"></div>
        
        <!-- Layer 4: Subtle top-left cool wash -->
        <div class="absolute top-0 left-0 w-[250px] h-[300px]" style="background: radial-gradient(ellipse at top left, rgba(205,232,212,0.15) 0%, transparent 60%);"></div>

        <!-- Layer 5: Very subtle institutional dot grid -->
        <div class="absolute bottom-12 right-10 opacity-[0.04] hidden lg:block">
          <div class="grid grid-cols-6 gap-3">
            <div v-for="i in 24" :key="'rg-'+i" class="w-1 h-1 rounded-full bg-primary"></div>
          </div>
        </div>
      </div>

      <div class="w-full max-w-[440px] xl:max-w-[470px] relative z-10 my-auto py-4 sm:py-6">
        <!-- Mobile Live Display Button -->
        <div class="sm:hidden flex justify-end mb-3">
          <RouterLink
            to="/display"
            class="text-[11px] font-semibold tracking-wide uppercase px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md text-text-secondary shadow-sm border border-white/60 flex items-center gap-1.5"
          >
            <span>Live Display</span>
            <span class="w-[7px] h-[7px] rounded-full bg-primary animate-pulse"></span>
          </RouterLink>
        </div>

        <RouterView />
      </div>
    </div>
  </div>
</template>





