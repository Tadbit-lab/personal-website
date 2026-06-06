import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// https://vite.dev/config/
export default defineConfig({
    base: '/personal-website/',
    plugins: [react()],
    server: {
        // TODO(security): Use 127.0.0.1 for local dev to avoid exposing to network
        host: '127.0.0.1',
        port: 5173,
        strictPort: true,
    },
});
