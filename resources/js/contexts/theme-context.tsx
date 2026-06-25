import { router, usePage } from '@inertiajs/react';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { getThemePreset, themePresets } from '@/config/theme-presets';
import type { Theme, ThemeContextType } from '@/types/theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Local storage key for theme persistence
const THEME_STORAGE_KEY = 'theme-preset';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [currentPreset, setCurrentPreset] = useState<string>('ocean');
    const [isLoading, setIsLoading] = useState(false);

    // Get page props at component level (now safe because we're inside Inertia context)
    const page = usePage<{ theme?: Theme }>();
    const pageTheme = page.props.theme;

    // Initialize theme from localStorage or page props
    useEffect(() => {
        const savedPreset = localStorage.getItem(THEME_STORAGE_KEY);
        if (savedPreset && themePresets[savedPreset]) {
            setCurrentPreset(savedPreset);
            applyPresetToCSS(savedPreset);
        } else if (pageTheme) {
            // Convert backend theme to preset if possible
            const matchingPreset = findMatchingPreset(pageTheme);
            if (matchingPreset) {
                setCurrentPreset(matchingPreset);
                applyPresetToCSS(matchingPreset);
            } else {
                applyThemeToCSSVariables(pageTheme);
            }
        } else {
            applyPresetToCSS('ocean');
        }
    }, [pageTheme]);

    // Listen for dark mode changes
    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    // Reapply current preset with new dark mode state
                    applyPresetToCSS(currentPreset);
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, [currentPreset]);

    const applyPresetToCSS = (presetKey: string) => {
        const preset = getThemePreset(presetKey);
        const root = document.documentElement;

        // Check if dark mode is active
        const isDarkMode = document.documentElement.classList.contains('dark');
        const colors = isDarkMode && preset.dark ? preset.dark.colors : preset.colors;
        const gradients = isDarkMode && preset.dark ? preset.dark.gradients : preset.gradients;

        // Apply colors directly to Tailwind CSS variables
        root.style.setProperty('--primary', colors.primary);
        root.style.setProperty('--secondary', colors.secondary);
        root.style.setProperty('--accent', colors.accent);
        root.style.setProperty('--primary-foreground', colors.primaryForeground);
        root.style.setProperty('--secondary-foreground', colors.secondaryForeground);
        root.style.setProperty('--accent-foreground', colors.accentForeground);

        // Update sidebar colors
        root.style.setProperty('--sidebar-primary', colors.primary);
        root.style.setProperty('--sidebar-primary-foreground', colors.primaryForeground);

        // Update ring colors
        root.style.setProperty('--ring', colors.primary);
        root.style.setProperty('--sidebar-ring', colors.primary);

        // Apply gradient to sidebar if needed
        root.style.setProperty('--sidebar', gradients.primary);

        // Store in localStorage
        localStorage.setItem(THEME_STORAGE_KEY, presetKey);
    };

    const findMatchingPreset = (theme: Theme): string | null => {
        for (const [key, preset] of Object.entries(themePresets)) {
            if (
                preset.colors.primary === theme.primary_color &&
                preset.colors.secondary === theme.secondary_color &&
                preset.colors.accent === theme.accent_color
            ) {
                return key;
            }
        }
        return null;
    };

    const applyTheme = (newTheme: Theme) => {
        applyThemeToCSSVariables(newTheme);
    };

    const applyPreset = async (presetKey: string) => {
        setIsLoading(true);
        setCurrentPreset(presetKey);
        applyPresetToCSS(presetKey);

        // Also update backend if possible
        try {
            await router.post(
                route('api.theme.preset'),
                { preset: presetKey },
                {
                    preserveScroll: true,
                    only: ['theme'],
                    onSuccess: () => {
                        setIsLoading(false);
                    },
                    onError: (errors) => {
                        console.error('Error applying preset:', errors);
                        setIsLoading(false);
                    },
                },
            );
        } catch (error) {
            console.error('Error applying preset:', error);
            setIsLoading(false);
        }
    };

    const resetTheme = async () => {
        setIsLoading(true);
        setCurrentPreset('ocean');
        applyPresetToCSS('ocean');

        try {
            await router.post(
                route('api.theme.reset'),
                {},
                {
                    preserveScroll: true,
                    only: ['theme'],
                    onSuccess: () => {
                        setIsLoading(false);
                    },
                    onError: (errors) => {
                        console.error('Error resetting theme:', errors);
                        setIsLoading(false);
                    },
                },
            );
        } catch (error) {
            console.error('Error resetting theme:', error);
            setIsLoading(false);
        }
    };

    // Convert current preset to theme format for compatibility
    const theme: Theme = {
        primary_color: getThemePreset(currentPreset).colors.primary,
        secondary_color: getThemePreset(currentPreset).colors.secondary,
        accent_color: getThemePreset(currentPreset).colors.accent,
        gradient: {
            from: getThemePreset(currentPreset).colors.primary,
            via: getThemePreset(currentPreset).colors.secondary,
            to: getThemePreset(currentPreset).colors.accent,
        },
        sidebar_style: 'gradient',
        header_style: 'solid',
        body_style: 'gradient',
    };

    return <ThemeContext.Provider value={{ theme, applyTheme, applyPreset, resetTheme, isLoading }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

/**
 * Apply theme colors to CSS variables (legacy support)
 */
function applyThemeToCSSVariables(theme: Theme) {
    const root = document.documentElement;

    // Convert hex colors to oklch format for Tailwind compatibility
    const primaryOklch = hexToOklch(theme.primary_color);
    const secondaryOklch = hexToOklch(theme.secondary_color);
    const accentOklch = hexToOklch(theme.accent_color);

    // Set standard Tailwind color variables
    root.style.setProperty('--primary', primaryOklch);
    root.style.setProperty('--secondary', secondaryOklch);
    root.style.setProperty('--accent', accentOklch);

    // Set primary foreground (white or black based on primary color brightness)
    const primaryForeground = getContrastColor(theme.primary_color);
    root.style.setProperty('--primary-foreground', primaryForeground);

    // Set secondary foreground
    const secondaryForeground = getContrastColor(theme.secondary_color);
    root.style.setProperty('--secondary-foreground', secondaryForeground);

    // Set accent foreground
    const accentForeground = getContrastColor(theme.accent_color);
    root.style.setProperty('--accent-foreground', accentForeground);

    // Update sidebar colors to use the new primary color
    root.style.setProperty('--sidebar-primary', primaryOklch);
    root.style.setProperty('--sidebar-primary-foreground', primaryForeground);

    if (theme.gradient && theme.gradient.from && theme.gradient.to) {
        const via = theme.gradient.via || theme.gradient.to;
        if (theme.sidebar_style === 'gradient') {
            const gradient = `linear-gradient(135deg, ${theme.gradient.from}, ${via}, ${theme.gradient.to})`;
            root.style.setProperty('--sidebar', gradient);
        }

        root.style.setProperty('--gradient-from', theme.gradient.from);
        root.style.setProperty('--gradient-via', via);
        root.style.setProperty('--gradient-to', theme.gradient.to);
    } else {
        if (theme.sidebar_style !== 'gradient') {
            root.style.setProperty('--sidebar', primaryOklch);
        }
    }

    root.style.setProperty('--ring', primaryOklch);
    root.style.setProperty('--sidebar-ring', primaryOklch);
}

/**
 * Convert hex color to oklch format
 */
function hexToOklch(hex: string): string {
    // Validate and clean the hex string
    const cleanedHex = hex.startsWith('#') ? hex.substring(1) : hex;
    if (!/^[0-9a-fA-F]{6}$/.test(cleanedHex)) {
        console.warn(`Invalid hex color: ${hex}. Using fallback.`);
        return 'oklch(0.5 0.1 200)'; // A neutral fallback color
    }

    // Convert hex to RGB
    const r = parseInt(cleanedHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanedHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanedHex.substring(4, 6), 16) / 255;

    // A more standard RGB to sRGB conversion before XYZ
    const sR = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    const sG = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    const sB = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    // Convert sRGB to XYZ
    const x = sR * 0.4124564 + sG * 0.3575761 + sB * 0.1804375;
    const y = sR * 0.2126729 + sG * 0.7151522 + sB * 0.072175;
    const z = sR * 0.0193339 + sG * 0.119192 + sB * 0.9503041;

    // Convert XYZ to Lab
    const fx = (v: number) => (v > 0.008856 ? Math.cbrt(v) : (v * 903.3 + 16) / 116);
    const fX = fx(x / 0.95047);
    const fY = fx(y / 1.0);
    const fZ = fx(z / 1.08883);

    const L = 116 * fY - 16;
    const a = 500 * (fX - fY);
    const b_lab = 200 * (fY - fZ);

    // Convert Lab to LCH, then to OKLCH
    const C = Math.sqrt(a * a + b_lab * b_lab);
    const H = Math.atan2(b_lab, a) * (180 / Math.PI);

    // OKLCH conversion (simplified from LCH)
    const l_ok = L / 100;
    const c_ok = C / 100;
    const h_ok = H < 0 ? H + 360 : H;

    return `oklch(${l_ok.toFixed(3)} ${c_ok.toFixed(3)} ${h_ok.toFixed(1)})`;
}

/**
 * Get contrast color (white or black) based on background color brightness
 */
function getContrastColor(hex: string): string {
    // Remove # if present
    hex = hex.replace('#', '');

    // Convert hex to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate brightness
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // Return white for dark backgrounds, black for light backgrounds
    return brightness > 128 ? 'oklch(0.2 0 0)' : 'oklch(1 0 0)';
}
