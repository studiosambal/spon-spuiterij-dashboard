import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// Versie 1 wordt geserveerd onder /v1/ (Netlify) en bouwt naar dist/v1.
export default defineConfig({
  base: '/v1/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    outDir: '../../dist/v1',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    host: true
  }
})
