import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Prasanna — Case Tracker',
        short_name: 'Prasanna',
        description: 'Track court cases, hearings and clients.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#7e14ff',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/maskable-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Only precache the built app shell (JS/CSS/HTML/fonts/icons) so the
        // app installs and opens instantly offline. Deliberately NOT caching
        // /api/* responses — this is a live court case tracker, and silently
        // serving a stale cached hearing date while offline would be worse
        // than just failing the request.
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
})
