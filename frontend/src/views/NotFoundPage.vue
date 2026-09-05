<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <h1 class="text-9xl font-bold text-gray-300">404</h1>
      <h2 class="text-2xl font-semibold text-gray-900 mt-4">Halaman Tidak Ditemukan</h2>
      <p class="text-gray-600 mt-2">Halaman yang Anda cari tidak ditemukan.</p>
      <button
        @click="goHome"
        class="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Kembali ke Beranda
      </button>
    </div>
  </div>
</template>
