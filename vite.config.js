import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Identificador único de cada build: va dentro del JS (`__VERSION_APP__`) y
// también como `/version.json` publicado. La app instalada compara ambos
// para avisar cuando hay una versión nueva (ver useActualizacionApp.js).
const VERSION_APP = String(Date.now())

function versionPublicada() {
  return {
    name: 'version-publicada',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: VERSION_APP }) })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), versionPublicada()],
  define: {
    __VERSION_APP__: JSON.stringify(VERSION_APP),
  },
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
