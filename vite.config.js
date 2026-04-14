import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import sitemap from 'vite-plugin-sitemap'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    sitemap({
      hostname: 'https://xteink-wallpaper.vercel.app',
      outDir: 'dist',
      routes: [
        { path: '/', changefreq: 'monthly', priority: 1 },
      ],
    }),
  ],
  server: {
    host: true,
    port: 5173,
    hmr: {
      overlay: false,
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'],
  },
})
