<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router'
import { CheckCircle2 } from 'lucide-vue-next'
</script>

<template>
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

    <!-- LEFT PANEL (HERO) — Preserved -->
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
            <h1 class="font-bold text-lg text-white tracking-tight leading-none">Lab<span class="font-extrabold text-accent">Display</span></h1>
            <p class="text-[10.5px] text-white/70 font-medium mt-1 tracking-wide uppercase">FIK UPN "Veteran" Jakarta</p>
          </div>
        </div>
      </div>

      <!-- Headline & Description -->
      <div class="relative z-20 mt-6 lg:mt-8 mb-auto max-w-lg">
        <h2 class="text-[28px] sm:text-4xl lg:text-[42px] xl:text-[46px] font-extrabold tracking-[-0.025em] leading-[1.1] text-left text-white mb-5">
          Streamline<br />
          <span class="text-accent">Lab Schedules.</span><br />
          <span class="text-white/90">Empower Operations.</span>
        </h2>
        
        <p class="text-white/65 text-xs sm:text-[13px] lg:text-sm leading-[1.7] font-normal max-w-md mb-4">
          Comprehensive management portal for laboratory schedules, facility requests, operational tracking, and public display services.
        </p>

        <!-- Trust Badge -->
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/8 border border-white/12 text-white/70 text-[11px] font-medium tracking-wide backdrop-blur-sm">
          <CheckCircle2 :size="13" class="text-accent" />
          <span>Secure · Reliable · Efficient</span>
        </div>
      </div>

      <!-- Footer -->
      <div class="relative z-20 pt-3 border-t border-white/12">
        <p class="text-[10px] lg:text-[11px] text-white/35 font-normal tracking-wide">© 2026 Laboratory Display System · Faculty of Computer Science</p>
      </div>
    </div>

    <!-- RIGHT PANEL — Luminous layered environment -->
    <div class="w-full lg:w-[48%] xl:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-6 xl:p-10 overflow-y-auto lg:h-full relative overflow-x-hidden">
      
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

      <div class="w-full max-w-[420px] relative z-10 my-auto">
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





