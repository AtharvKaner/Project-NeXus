import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,          // allow external access (ngrok, IP)
    port: 5175,          // optional: fix your current port
    allowedHosts: ['fragrant-setback-nursing.ngrok-free.dev'],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/download-locker': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})