import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const financialEsm = require.resolve('chartjs-chart-financial/dist/chartjs-chart-financial.esm.js');
const adapterMain = require.resolve('chartjs-adapter-date-fns');
const adapterEsm = path.join(path.dirname(adapterMain), 'chartjs-adapter-date-fns.esm.js');
// https://vite.dev/config/
export default defineConfig({
    base: '/personal-website/',
    plugins: [react()],
    resolve: {
        alias: {
            'chartjs-chart-financial': financialEsm,
            'chartjs-adapter-date-fns': adapterEsm,
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
});
