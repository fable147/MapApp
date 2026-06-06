import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Service worker'ın scope'u için
    target: 'esnext',
  },
  server: {
    // Geliştirme sırasında HTTPS (PWA için gerekli)
    // https: true  ← production'da açabilirsin
  }
})
