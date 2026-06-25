import React from 'react';
import { createRoot } from 'react-dom/client';
import WidgetApp from './WidgetApp';

const mountWidget = () => {
    if (document.getElementById('insurepal-widget-root')) return;

    // Use global config from loader, fallback to currentScript (unlikely in module context)
    const config = (window as any).InsurePalConfig || {};
    const currentScript = document.currentScript;

    const publicKey = config.publicKey || currentScript?.getAttribute('data-key');
    const product = config.product || currentScript?.getAttribute('data-product');

    if (!publicKey) {
        console.warn('InsurePal Widget: data-key is missing.');
        // return;
    }

    const container = document.createElement('div');
    container.id = 'insurepal-widget-root';
    document.body.appendChild(container);

    // Append styles if built (for development, Vite injects styles, for prod, we need to link CSS)
    // We assume the user loads the CSS or we inject it.
    // For this implementation, we assume the CSS is bundled or loaded.

    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <WidgetApp publicKey={publicKey || 'MISSING_KEY'} product={product} />
        </React.StrictMode>,
    );
};

if (document.readyState === 'complete') {
    mountWidget();
} else {
    window.addEventListener('load', mountWidget);
}
