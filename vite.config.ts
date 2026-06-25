import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx', 'resources/js/widget/index.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),

    ],
    esbuild: {
        jsx: 'automatic',
    },
resolve: {
        alias: {
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
            'images': resolve(__dirname, 'public/images'),

        },
    },
build: {
        rollupOptions: {
            external: ['@heroicons/react/24/outline'],
            output: {
                assetFileNames: (assetInfo) => {
                    const name = assetInfo.name || '';
                    if (name.endsWith('.mjs')) {
                        return 'assets/[name]-[hash].js';
                    }
                    return 'assets/[name]-[hash][extname]';
                },
                manualChunks: (id) => {
                    // Skip for node_modules to avoid circular dependencies
                    if (!id.includes('node_modules/')) return undefined;

                    // Core React - exclude from ui-vendor to avoid circular dependency
                    if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
                        return 'react-vendor';
                    }
                    // Inertia
                    if (id.includes('node_modules/@inertiajs')) {
                        return 'inertia';
                    }
                    // Charts
                    if (id.includes('node_modules/recharts')) {
                        return 'charts';
                    }
                    // PDF
                    if (id.includes('node_modules/jspdf')) {
                        return 'pdf';
                    }
                    // Date
                    if (id.includes('node_modules/dayjs')) {
                        return 'date';
                    }
                    // DnD
                    if (id.includes('node_modules/@dnd-kit')) {
                        return 'dnd';
                    }
                    // Editor - must include React to avoid "Cannot set properties of undefined" errors
                    if (id.includes('node_modules/@tiptap') || id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
                        return 'react-vendor';
                    }
                },
            },
        },
        chunkSizeWarningLimit: 1000,
    },
});
