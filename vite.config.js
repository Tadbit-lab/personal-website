import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// https://vite.dev/config/
export default defineConfig({
    base: '/personal-website/',
    plugins: [react()],
    resolve: {
        alias: {
            'chartjs-chart-financial': 'chartjs-chart-financial/dist/chartjs-chart-financial.esm.js',
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
