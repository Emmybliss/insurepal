import '../css/app.css';
import './bootstrap';

import { PwaInstallPrompt } from '@/components/pwa/pwa-install-prompt';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { initializeTheme } from '@/hooks/use-appearance';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'InsurePal-Insurance Management System';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
                <App {...props} />
                <Toaster position="top-right" expand={true} richColors={true} closeButton={true} />
                {/* PWA custom install banner */}
                <PwaInstallPrompt />
            </ThemeProvider>,
        );

        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 500);
        }
    },
    progress: {
        color: '#06b6d4',
    },
});

// This will set light / dark mode on load...
initializeTheme();
