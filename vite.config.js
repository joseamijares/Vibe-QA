import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        host: '0.0.0.0',
        port: 5173,
        allowedHosts: ['all'],
        cors: {
            origin: process.env.NODE_ENV === 'production'
                ? ['https://vibeqa.app', 'https://*.vibeqa.app', 'https://*.replit.app']
                : '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Project-Key'],
            credentials: true,
        },
    },
    preview: {
        host: '0.0.0.0',
        port: 4173,
        strictPort: true,
        allowedHosts: ['all', 'vibeqa.app'],
        cors: {
            origin: process.env.NODE_ENV === 'production'
                ? ['https://vibeqa.app', 'https://*.vibeqa.app', 'https://*.replit.app']
                : '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Project-Key'],
            credentials: true,
        },
    },
    publicDir: 'public',
});
