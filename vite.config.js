import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      devOptions: {
        enabled: true,
      },

      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,

        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2}',
        ],
      },

      manifest: {
        id: '/',
        name: 'نظام المخرز',
        short_name: 'المخرز',
        description: 'نظام إدارة المخرز',

        start_url: '/',
        scope: '/',

        display: 'standalone',

        theme_color: '#000000',
        background_color: '#ffffff',

        orientation: 'portrait-primary',

        dir: 'rtl',
        lang: 'ar',

        icons: [
          {
            src: '/icon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon.=',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})