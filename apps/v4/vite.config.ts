import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// Versie 4 wordt geserveerd onder /v4/ (Netlify) en bouwt naar dist/v4.
export default defineConfig({
  base: '/v4/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    outDir: '../../dist/v4',
    emptyOutDir: true
  },
  server: {
    port: 5176,
    host: true
  }
})
