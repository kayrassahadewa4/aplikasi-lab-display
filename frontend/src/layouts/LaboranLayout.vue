<script setup lang="ts">
import LaboranSidebar from '@/components/laboran/LaboranSidebar.vue'
import LaboranNavbar from '@/components/laboran/LaboranNavbar.vue'
</script>

<template>
  <div class="flex h-screen bg-surface selection:bg-brand-200 selection:text-dark-green font-sans text-text-primary antialiased overflow-hidden">
    <!-- Laboran Sidebar -->
    <LaboranSidebar />

    <!-- Main Content Body -->
    <div class="flex-1 flex flex-col overflow-hidden relative min-w-0">
      <!-- Laboran Top Navbar -->
      <LaboranNavbar />

      <!-- Main Router Container -->
      <main class="flex-1 overflow-y-auto px-5 sm:px-6 lg:px-7 py-6">
        <div class="w-full">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>
