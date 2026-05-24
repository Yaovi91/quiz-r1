import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// IMPORTANT : si tu renommes le repo, change la constante REPO ci-dessous.
// Pour un repo nommé "r1-quizz", l'URL finale sera :
//   https://<ton-pseudo>.github.io/r1-quizz/
const REPO = 'quiz-r1'

export default defineConfig({
  base: `/${REPO}/`,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png'],
      manifest: {
        name: 'R1 Quizz',
        short_name: 'R1',
        description: 'Révision règle APSAD R1 — sprinkler',
        theme_color: '#0A0B0F',
        background_color: '#0A0B0F',
        display: 'standalone',
        orientation: 'portrait',
        scope: `/${REPO}/`,
        start_url: `/${REPO}/`,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Lot INTER — on retire 'json' du précache (limite Workbox 2 MiB, et
        // notre questions.json fait 2,8 MB). Le catalogue est servi via le
        // runtimeCaching ci-dessous (StaleWhileRevalidate), pas via le précache.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: ['**/questions.json', '**/questions.example.json'],
        // Garde-fou : si un autre asset volumineux apparaît un jour, on
        // accepte jusqu'à 5 MiB en précache au lieu de planter le build.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Cache runtime pour le catalogue de questions
        runtimeCaching: [
          {
            urlPattern: /questions\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'r1-questions-catalog',
              expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      }
    })
  ]
})
