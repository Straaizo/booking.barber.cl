import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  assetsInclude: ['**/*.glb'],
  build: {
    rollupOptions: {
      output: {
        // React/Supabase/React Query casi no cambian entre deploys — en su
        // propio chunk, el navegador los deja en caché entre visitas en vez
        // de volver a bajarlos cada vez que se sube código nuevo.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/react-router-dom|\/react\/|\/react-dom\//.test(id)) return 'vendor-react'
          if (id.includes('@supabase/supabase-js')) return 'vendor-supabase'
          if (id.includes('@tanstack/react-query')) return 'vendor-query'
        },
      },
    },
  },
})
