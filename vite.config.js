import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// https://vite.dev/config/
export default defineConfig({
    base: '/',
    plugins: [react()],
    resolve: {
        alias: {
            'chartjs-chart-financial': 'chartjs-chart-financial/dist/chartjs-chart-financial.esm.js',
        },
    },
    server: {
        host: '127.0.0.1',
        port: 5173,
        strictPort: true,
    },
});
