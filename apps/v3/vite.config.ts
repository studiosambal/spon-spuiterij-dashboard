import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// Versie 3 wordt geserveerd onder /v3/ (Netlify) en bouwt naar dist/v3.
export default defineConfig({
  base: '/v3/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    outDir: '../../dist/v3',
    emptyOutDir: true
  },
  server: {
    port: 5175,
    host: true
  }
})
