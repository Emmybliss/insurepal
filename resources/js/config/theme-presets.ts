export interface ThemePreset {
    name: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        primaryForeground: string;
        secondaryForeground: string;
        accentForeground: string;
    };
    gradients: {
        primary: string;
        secondary: string;
        accent: string;
    };
    dark?: {
        colors: {
            primary: string;
            secondary: string;
            accent: string;
            primaryForeground: string;
            secondaryForeground: string;
            accentForeground: string;
        };
        gradients: {
            primary: string;
            secondary: string;
            accent: string;
        };
    };
}

export const themePresets: Record<string, ThemePreset> = {
    ocean: {
        name: 'Ocean',
        colors: {
            primary: '#0ea5e9', // Sky blue
            secondary: '#06b6d4', // Cyan
            accent: '#14b8a6', // Teal
            primaryForeground: '#ffffff',
            secondaryForeground: '#ffffff',
            accentForeground: '#ffffff',
        },
        gradients: {
            primary: 'linear-gradient(135deg, #0ea5e9, #06b6d4, #14b8a6)',
            secondary: 'linear-gradient(135deg, #06b6d4, #14b8a6, #0ea5e9)',
            accent: 'linear-gradient(135deg, #14b8a6, #0ea5e9, #06b6d4)',
        },
        dark: {
            colors: {
                primary: '#38bdf8', // Lighter blue for dark mode
                secondary: '#22d3ee', // Lighter cyan
                accent: '#2dd4bf', // Lighter teal
                primaryForeground: '#000000',
                secondaryForeground: '#000000',
                accentForeground: '#000000',
            },
            gradients: {
                primary: 'linear-gradient(135deg, #38bdf8, #22d3ee, #2dd4bf)',
                secondary: 'linear-gradient(135deg, #22d3ee, #2dd4bf, #38bdf8)',
                accent: 'linear-gradient(135deg, #2dd4bf, #38bdf8, #22d3ee)',
            },
        },
    },
    sunset: {
        name: 'Sunset',
        colors: {
            primary: '#f97316', // Orange
            secondary: '#ec4899', // Pink
            accent: '#8b5cf6', // Purple
            primaryForeground: '#ffffff',
            secondaryForeground: '#ffffff',
            accentForeground: '#ffffff',
        },
        gradients: {
            primary: 'linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)',
            secondary: 'linear-gradient(135deg, #ec4899, #8b5cf6, #f97316)',
            accent: 'linear-gradient(135deg, #8b5cf6, #f97316, #ec4899)',
        },
        dark: {
            colors: {
                primary: '#fb923c', // Lighter orange
                secondary: '#f472b6', // Lighter pink
                accent: '#a78bfa', // Lighter purple
                primaryForeground: '#000000',
                secondaryForeground: '#000000',
                accentForeground: '#000000',
            },
            gradients: {
                primary: 'linear-gradient(135deg, #fb923c, #f472b6, #a78bfa)',
                secondary: 'linear-gradient(135deg, #f472b6, #a78bfa, #fb923c)',
                accent: 'linear-gradient(135deg, #a78bfa, #fb923c, #f472b6)',
            },
        },
    },
    forest: {
        name: 'Forest',
        colors: {
            primary: '#10b981', // Emerald
            secondary: '#059669', // Green
            accent: '#14532d', // Dark green
            primaryForeground: '#ffffff',
            secondaryForeground: '#ffffff',
            accentForeground: '#ffffff',
        },
        gradients: {
            primary: 'linear-gradient(135deg, #10b981, #059669, #14532d)',
            secondary: 'linear-gradient(135deg, #059669, #14532d, #10b981)',
            accent: 'linear-gradient(135deg, #14532d, #10b981, #059669)',
        },
        dark: {
            colors: {
                primary: '#34d399', // Lighter emerald
                secondary: '#10b981', // Lighter green
                accent: '#059669', // Lighter dark green
                primaryForeground: '#000000',
                secondaryForeground: '#000000',
                accentForeground: '#000000',
            },
            gradients: {
                primary: 'linear-gradient(135deg, #34d399, #10b981, #059669)',
                secondary: 'linear-gradient(135deg, #10b981, #059669, #34d399)',
                accent: 'linear-gradient(135deg, #059669, #34d399, #10b981)',
            },
        },
    },
    royal: {
        name: 'Royal',
        colors: {
            primary: '#6366f1', // Indigo
            secondary: '#8b5cf6', // Violet
            accent: '#a855f7', // Purple
            primaryForeground: '#ffffff',
            secondaryForeground: '#ffffff',
            accentForeground: '#ffffff',
        },
        gradients: {
            primary: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)',
            secondary: 'linear-gradient(135deg, #8b5cf6, #a855f7, #6366f1)',
            accent: 'linear-gradient(135deg, #a855f7, #6366f1, #8b5cf6)',
        },
        dark: {
            colors: {
                primary: '#818cf8', // Lighter indigo
                secondary: '#a78bfa', // Lighter violet
                accent: '#c084fc', // Lighter purple
                primaryForeground: '#000000',
                secondaryForeground: '#000000',
                accentForeground: '#000000',
            },
            gradients: {
                primary: 'linear-gradient(135deg, #818cf8, #a78bfa, #c084fc)',
                secondary: 'linear-gradient(135deg, #a78bfa, #c084fc, #818cf8)',
                accent: 'linear-gradient(135deg, #c084fc, #818cf8, #a78bfa)',
            },
        },
    },
    ember: {
        name: 'Ember',
        colors: {
            primary: '#ef4444', // Red
            secondary: '#f97316', // Orange
            accent: '#fbbf24', // Yellow
            primaryForeground: '#ffffff',
            secondaryForeground: '#ffffff',
            accentForeground: '#000000',
        },
        gradients: {
            primary: 'linear-gradient(135deg, #ef4444, #f97316, #fbbf24)',
            secondary: 'linear-gradient(135deg, #f97316, #fbbf24, #ef4444)',
            accent: 'linear-gradient(135deg, #fbbf24, #ef4444, #f97316)',
        },
        dark: {
            colors: {
                primary: '#f87171', // Lighter red
                secondary: '#fb923c', // Lighter orange
                accent: '#fde047', // Lighter yellow
                primaryForeground: '#000000',
                secondaryForeground: '#000000',
                accentForeground: '#000000',
            },
            gradients: {
                primary: 'linear-gradient(135deg, #f87171, #fb923c, #fde047)',
                secondary: 'linear-gradient(135deg, #fb923c, #fde047, #f87171)',
                accent: 'linear-gradient(135deg, #fde047, #f87171, #fb923c)',
            },
        },
    },
    professional: {
        name: 'Professional',
        colors: {
            primary: '#1e40af', // Navy blue
            secondary: '#1e3a8a', // Dark blue
            accent: '#075985', // Darker blue
            primaryForeground: '#ffffff',
            secondaryForeground: '#ffffff',
            accentForeground: '#ffffff',
        },
        gradients: {
            primary: 'linear-gradient(135deg, #1e40af, #1e3a8a, #075985)',
            secondary: 'linear-gradient(135deg, #1e3a8a, #075985, #1e40af)',
            accent: 'linear-gradient(135deg, #075985, #1e40af, #1e3a8a)',
        },
        dark: {
            colors: {
                primary: '#3b82f6', // Lighter navy
                secondary: '#2563eb', // Lighter dark blue
                accent: '#1d4ed8', // Lighter darker blue
                primaryForeground: '#ffffff',
                secondaryForeground: '#ffffff',
                accentForeground: '#ffffff',
            },
            gradients: {
                primary: 'linear-gradient(135deg, #3b82f6, #2563eb, #1d4ed8)',
                secondary: 'linear-gradient(135deg, #2563eb, #1d4ed8, #3b82f6)',
                accent: 'linear-gradient(135deg, #1d4ed8, #3b82f6, #2563eb)',
            },
        },
    },
    rose: {
        name: 'Rose',
        colors: {
            primary: '#e11d48', // Rose
            secondary: '#f43f5e', // Pink
            accent: '#fb7185', // Light pink
            primaryForeground: '#ffffff',
            secondaryForeground: '#ffffff',
            accentForeground: '#000000',
        },
        gradients: {
            primary: 'linear-gradient(135deg, #e11d48, #f43f5e, #fb7185)',
            secondary: 'linear-gradient(135deg, #f43f5e, #fb7185, #e11d48)',
            accent: 'linear-gradient(135deg, #fb7185, #e11d48, #f43f5e)',
        },
        dark: {
            colors: {
                primary: '#f472b6', // Lighter rose
                secondary: '#fb7185', // Lighter pink
                accent: '#fda4af', // Lighter light pink
                primaryForeground: '#000000',
                secondaryForeground: '#000000',
                accentForeground: '#000000',
            },
            gradients: {
                primary: 'linear-gradient(135deg, #f472b6, #fb7185, #fda4af)',
                secondary: 'linear-gradient(135deg, #fb7185, #fda4af, #f472b6)',
                accent: 'linear-gradient(135deg, #fda4af, #f472b6, #fb7185)',
            },
        },
    },
    mint: {
        name: 'Mint',
        colors: {
            primary: '#22c55e', // Green
            secondary: '#16a34a', // Dark green
            accent: '#15803d', // Darker green
            primaryForeground: '#ffffff',
            secondaryForeground: '#ffffff',
            accentForeground: '#ffffff',
        },
        gradients: {
            primary: 'linear-gradient(135deg, #22c55e, #16a34a, #15803d)',
            secondary: 'linear-gradient(135deg, #16a34a, #15803d, #22c55e)',
            accent: 'linear-gradient(135deg, #15803d, #22c55e, #16a34a)',
        },
        dark: {
            colors: {
                primary: '#4ade80', // Lighter green
                secondary: '#22c55e', // Lighter dark green
                accent: '#16a34a', // Lighter darker green
                primaryForeground: '#000000',
                secondaryForeground: '#000000',
                accentForeground: '#000000',
            },
            gradients: {
                primary: 'linear-gradient(135deg, #4ade80, #22c55e, #16a34a)',
                secondary: 'linear-gradient(135deg, #22c55e, #16a34a, #4ade80)',
                accent: 'linear-gradient(135deg, #16a34a, #4ade80, #22c55e)',
            },
        },
    },
};

export const defaultTheme = 'ocean';

export function getThemePreset(presetKey: string): ThemePreset {
    return themePresets[presetKey] || themePresets[defaultTheme];
}
