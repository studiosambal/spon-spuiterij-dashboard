import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// Versie 2 wordt geserveerd onder /v2/ (Netlify) en bouwt naar dist/v2.
export default defineConfig({
  base: '/v2/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    outDir: '../../dist/v2',
    emptyOutDir: true
  },
  server: {
    port: 5174,
    host: true
  }
})
