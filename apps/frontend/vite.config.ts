import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    // El frontend debe consumir el fuente ESM de shared; la API compila
    // el mismo paquete como CommonJS y necesita conservar su salida dist.
    alias: {
      '@gym/shared': fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url)),
    },
  },
  plugins: [
    react(),
    VitePWA({
      // 7. Estrategia generateSW: genera el Service Worker en build
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png', 'apple-touch-icon.png', 'logo-prime.webp', 'logo-prime-transparent.webp', 'prime-icon.jpeg'],
      manifest: {
        name: 'Prime Gym',
        short_name: 'Prime Gym',
        description: 'Prime Gym: gestión de miembros, clases y entrenamientos.',
        theme_color: '#0ea5e9',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        // Iconos generados desde public/prime-icon.jpeg (ver public/ para regenerar).
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Cache-first para la SPA + runtime caching de la API (NetworkFirst)
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'gym-api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
      devOptions: {
        // Útil para probar el SW en `vite dev` (desactivado por defecto en prod)
        enabled: false,
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      // Fallback en dev cuando no se define VITE_API_URL: evita que /api
      // devuelva el index.html de la SPA (string) y rompa `socios.map`.
      '/api': 'http://localhost:3001',
    },
  },
  preview: {
    port: 4173,
  },
});
