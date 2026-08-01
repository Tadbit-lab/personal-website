import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  base: '/personal-website/',
  plugins: [react()],
  resolve: {
    alias: {
      'chartjs-chart-financial': path.resolve(
        __dirname,
        'node_modules/chartjs-chart-financial/dist/chartjs-chart-financial.esm.js'
      ),
      'chartjs-adapter-date-fns': path.resolve(
        __dirname,
        'node_modules/chartjs-adapter-date-fns/dist/chartjs-adapter-date-fns.esm.js'
      ),
    },
  },
  optimizeDeps: {
    include: [
      'chartjs-chart-financial',
      'chartjs-adapter-date-fns',
    ],
  },
  build: {
    commonjsOptions: {
      include: [/chartjs-chart-financial/, /chartjs-adapter-date-fns/, /node_modules/],
    },
  },
  server: {
    // TODO(security): Use 127.0.0.1 for local dev to avoid exposing to network
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
})
