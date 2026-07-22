import { router, usePage } from '@inertiajs/react';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

import { getThemePreset, themePresets } from '@/config/theme-presets';
import type { Theme, ThemeContextType } from '@/types/theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Local storage key for theme persistence
const THEME_STORAGE_KEY = 'theme-preset';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [currentPreset, setCurrentPreset] = useState<string>('ocean');
    const [customTheme, setCustomTheme] = useState<Theme | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Use refs so MutationObserver callbacks always read the latest values
    const customThemeRef = useRef<Theme | null>(null);
    const currentPresetRef = useRef<string>('ocean');

    // Keep refs in sync with state
    const syncRefs = (preset: string, theme: Theme | null) => {
        currentPresetRef.current = preset;
        customThemeRef.current = theme;
    };

    // Get page props at component level (now safe because we're inside Inertia context)
    const page = usePage<{ theme?: Theme }>();
    const pageTheme = page.props.theme;

    // Initialize theme from backend page props first, falling back to localStorage
    useEffect(() => {
        if (pageTheme) {
            const matchingPreset = findMatchingPreset(pageTheme);
            if (matchingPreset) {
                setCurrentPreset(matchingPreset);
                setCustomTheme(null);
                syncRefs(matchingPreset, null);
                applyPresetToCSS(matchingPreset);
            } else {
                setCustomTheme(pageTheme);
                syncRefs('ocean', pageTheme);
                applyThemeToCSSVariables(pageTheme);
                localStorage.removeItem(THEME_STORAGE_KEY);
            }
        } else {
            const savedPreset = localStorage.getItem(THEME_STORAGE_KEY);
            if (savedPreset && themePresets[savedPreset]) {
                setCurrentPreset(savedPreset);
                setCustomTheme(null);
                syncRefs(savedPreset, null);
                applyPresetToCSS(savedPreset);
            } else {
                setCustomTheme(null);
                syncRefs('ocean', null);
                applyPresetToCSS('ocean');
            }
        }
    }, [pageTheme]);

    // Listen for dark mode changes — reads from refs to avoid stale closures
    useEffect(() => {
        const observer = new MutationObserver(() => {
            if (customThemeRef.current) {
                applyThemeToCSSVariables(customThemeRef.current);
            } else {
                applyPresetToCSS(currentPresetRef.current);
            }
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, []);

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
        setCustomTheme(newTheme);
        syncRefs('ocean', newTheme);
        applyThemeToCSSVariables(newTheme);
    };

    const applyPreset = async (presetKey: string) => {
        setIsLoading(true);
        setCurrentPreset(presetKey);
        setCustomTheme(null);
        syncRefs(presetKey, null);
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
        setCustomTheme(null);
        syncRefs('ocean', null);
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

    // Convert current theme to the expected format
    const theme: Theme = customTheme ?? {
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
 * Apply theme colors to CSS variables
 */
function applyThemeToCSSVariables(theme: Theme) {
    const root = document.documentElement;

    root.style.setProperty('--primary', theme.primary_color);
    root.style.setProperty('--secondary', theme.secondary_color);
    root.style.setProperty('--accent', theme.accent_color);

    const primaryForeground = getContrastColor(theme.primary_color);
    root.style.setProperty('--primary-foreground', primaryForeground);

    const secondaryForeground = getContrastColor(theme.secondary_color);
    root.style.setProperty('--secondary-foreground', secondaryForeground);

    const accentForeground = getContrastColor(theme.accent_color);
    root.style.setProperty('--accent-foreground', accentForeground);

    root.style.setProperty('--sidebar-primary', theme.primary_color);
    root.style.setProperty('--sidebar-primary-foreground', primaryForeground);

    if (theme.sidebar_style === 'gradient' && theme.gradient?.from && theme.gradient?.to) {
        const via = theme.gradient.via || theme.gradient.to;
        const gradient = `linear-gradient(135deg, ${theme.gradient.from}, ${via}, ${theme.gradient.to})`;
        root.style.setProperty('--sidebar', gradient);
    } else if (theme.sidebar_style === 'transparent') {
        root.style.setProperty('--sidebar', 'transparent');
    } else {
        root.style.setProperty('--sidebar', theme.primary_color);
    }

    if (theme.gradient?.from && theme.gradient?.to) {
        const via = theme.gradient.via || theme.gradient.to;
        root.style.setProperty('--gradient-from', theme.gradient.from);
        root.style.setProperty('--gradient-via', via);
        root.style.setProperty('--gradient-to', theme.gradient.to);
    }

    root.style.setProperty('--ring', theme.primary_color);
    root.style.setProperty('--sidebar-ring', theme.primary_color);
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
