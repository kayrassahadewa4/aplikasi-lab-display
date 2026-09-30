import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    mode === 'development' && vueDevTools(),
    tailwindcss(),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('vue') || id.includes('pinia')) {
              return 'vendor-vue'
            }
            if (id.includes('lucide-vue-next')) {
              return 'vendor-icons'
            }
            if (id.includes('html2canvas') || id.includes('jspdf') || id.includes('xlsx')) {
              return 'vendor-export'
            }
            if (id.includes('socket.io-client') || id.includes('axios')) {
              return 'vendor-network'
            }
            return 'vendor-libs'
          }
        },
      },
    },
  },
}))
