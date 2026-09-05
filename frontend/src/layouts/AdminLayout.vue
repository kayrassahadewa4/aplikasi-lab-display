<script setup lang="ts">
import AdminSidebar from '@/components/admin/AdminSidebar.vue'
import AdminNavbar from '@/components/admin/AdminNavbar.vue'
</script>

<template>
  <div class="flex h-screen bg-surface selection:bg-brand-200 selection:text-dark-green font-sans text-text-primary antialiased overflow-hidden">
    <!-- Sidebar -->
    <AdminSidebar />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden relative min-w-0">
      <!-- Navbar -->
      <AdminNavbar />

      <!-- Content Container -->
      <main class="flex-1 overflow-y-auto px-5 sm:px-6 lg:px-7 py-6">
        <div class="w-full">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>
