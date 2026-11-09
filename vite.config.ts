/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Conservative target for TV browsers (Tizen 5+/webOS 5+ ship Chromium 63-79+).
    // Real devices still need validation; see README.
    target: 'es2020',
    // Shaka (~290 kB gzip) is lazy-loaded only when the player opens.
    chunkSizeWarningLimit: 900,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
})
