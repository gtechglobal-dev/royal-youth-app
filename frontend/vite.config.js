import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const cdnUrl = process.env.VITE_CDN_URL;

export default defineConfig({
  base: cdnUrl ? cdnUrl : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192x192.png', 'icon-512x512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Royal Youth Hub',
        short_name: 'RYH',
        description: 'Royal Youth Church Community App',
        theme_color: '#7c3aed',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
              networkTimeoutSeconds: 10
            }
          }
        ]
      },
      selfDestroying: true
    })
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router-dom')) return 'vendor';
          if (id.includes('node_modules/axios') || id.includes('node_modules/socket.io-client')) return 'ui';
        }
      }
    },
    cssMinify: true,
    sourcemap: false,
    target: 'es2020'
  },
  server: {
    historyApiFallback: true
  }
})
