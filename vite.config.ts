import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Cei — Buku Racikan',
        short_name: 'Racikan Cei',
        description: 'Buku racikan pribadi Kedai Kopi Cei',
        lang: 'id',
        theme_color: '#191a18',
        background_color: '#191a18',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        // Resep privat disimpan oleh aplikasi per akun, bukan cache HTTP bersama.
      },
    }),
  ],
  test: { include: ['src/**/*.test.ts'] },
});
