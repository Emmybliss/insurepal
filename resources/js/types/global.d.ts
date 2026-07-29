import type { route as routeFn } from 'ziggy-js';

declare global {
    const route: typeof routeFn;
}

declare module '@inertiajs/core' {
    interface PageProps {
        flash?: {
            success?: string;
            error?: string;
        };
    }
}
