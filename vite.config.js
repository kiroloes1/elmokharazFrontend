import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

VitePWA({
  registerType: 'autoUpdate',

  workbox: {
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
  },

  manifest: {
    name: 'نظام المخرز',
    short_name: 'المخرز',
    description: 'نظام إدارة المخرز',
    theme_color: '#000000',
    background_color: '#ffffff',
    display: 'standalone',
    dir: 'rtl',
    lang: 'ar',

    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
})
  ]
})