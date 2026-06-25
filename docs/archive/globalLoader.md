# Global Loader Implementation Guide

This guide explains how to implement a fullscreen loader that displays while a Laravel + Inertia + React app is loading.

## Implementation Steps

### 1. Add the Loader HTML & CSS in Blade Template

Place this in your main Blade template (e.g., `resources/views/app.blade.php`) inside the `<body>` tag, before the `@inertia` component:

```blade
<style>
    #global-loader {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(to right, #164e63, #67e8f9); /* cyan-900 to cyan-300 */
        transition: opacity 0.5s ease-out;
    }
    html.dark #global-loader {
        background: linear-gradient(to right, #164e63, #67e8f9); /* cyan-900 to cyan-300 */
    }
    .loader-icon {
        width: 6rem; /* 24 * 4px = 96px */
        height: 6rem;
        color: white;
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
</style>
<div id="global-loader">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="loader-icon">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
        <path d="M21 3v5h-5"/>
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
        <path d="M3 21v-5h5"/>
    </svg>
</div>
```

### 2. Add the JavaScript Cleanup Logic

In your React entry point (e.g., `resources/js/app.tsx`), add the cleanup logic inside the `setup` callback of `createInertiaApp`:

```tsx
createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <>
                <App {...props} />
            </>,
        );

        // Remove the global loader after React mounts
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.remove();
            }, 500);
        }
    },
    progress: {
        color: '#06b6d4',
    },
});
```

## How It Works

1. **Before JavaScript loads**: The `#global-loader` div is visible immediately when the HTML is parsed, showing a fullscreen cyan gradient with a spinning icon.

2. **During page load**: Inertia shows a progress bar (configured via `progress` option).

3. **After React mounts**: The `setup` callback in `createInertiaApp` finds the `#global-loader` element, fades it out by setting `opacity: '0'`, and removes it from the DOM after a 500ms transition.

## Customization Options

### Colors

Change the gradient in the `#global-loader` CSS:

```css
background: linear-gradient(to right, #164e63, #67e8f9);
```

Replace with your brand colors, e.g.:

```css
background: linear-gradient(to right, #1e3a8a, #3b82f6); /* blue-900 to blue-500 */
```

### Animation

Modify the `@keyframes spin` rule or replace with a different animation:

```css
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
.loader-icon {
    animation: pulse 1.5s ease-in-out infinite;
}
```

### Spinner Icon

Use any SVG icon. Common options:

- **Lucide Icons**: https://lucide.dev/icons/loader
- **Heroicons**: https://heroicons.com
- **Phosphor Icons**: https://phosphoricons.com

### Loader Size

Adjust the `.loader-icon` dimensions:

```css
.loader-icon {
    width: 4rem;   /* smaller: 64px */
    height: 4rem;  /* smaller: 64px */
    /* or */
    width: 8rem;   /* larger: 128px */
    height: 8rem;  /* larger: 128px */
}
```

### Transition Duration

Match the CSS transition with the JavaScript timeout:

```css
/* CSS */
transition: opacity 0.5s ease-out;

/* JavaScript */
setTimeout(() => {
    loader.remove();
}, 500); // 500ms = 0.5s
```

## Complete File Examples

### resources/views/app.blade.php (relevant section)

```blade
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', config('app.name'))</title>
    @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
</head>
<body class="font-sans antialiased">
    <style>
        #global-loader {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(to right, #164e63, #67e8f9);
            transition: opacity 0.5s ease-out;
        }
        html.dark #global-loader {
            background: linear-gradient(to right, #164e63, #67e8f9);
        }
        .loader-icon {
            width: 6rem;
            height: 6rem;
            color: white;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
    <div id="global-loader">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="loader-icon">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M3 21v-5h5"/>
        </svg>
    </div>

    @inertia
</body>
</html>
```

### resources/js/app.tsx (relevant section)

```tsx
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <>
                <App {...props} />
            </>,
        );

        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.remove();
            }, 500);
        }
    },
    progress: {
        color: '#06b6d4',
    },
});
```

## Requirements

- Laravel
- Inertia.js (React adapter)
- Vite with `@vitejs/plugin-react` or `laravel-vite-plugin`

## Troubleshooting

### Loader doesn't disappear

Ensure the JavaScript cleanup code is inside the `setup` callback:

```tsx
setup({ el, App, props }) {
    // ... your code here
}
```

### Loader flashes briefly

The loader should be visible before JavaScript loads. If it's hidden too quickly:

1. Ensure `#global-loader` has `display: flex` (not `display: none`)
2. Check no JavaScript runs before `createInertiaApp`

### Fade animation doesn't work

Ensure CSS `transition` property is set:

```css
transition: opacity 0.5s ease-out;
```

And JavaScript sets `opacity` before removing:

```javascript
loader.style.opacity = '0';
setTimeout(() => { loader.remove(); }, 500);
```