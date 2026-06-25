export interface ThemeGradient {
    from: string;
    via: string;
    to: string;
}

export interface Theme {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    gradient: ThemeGradient;
    sidebar_style: 'solid' | 'gradient';
    header_style: 'solid' | 'gradient';
    body_style: 'solid' | 'gradient' | 'none';
}

export interface ThemePreset {
    name: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    gradient: ThemeGradient;
}

export interface ThemeContextType {
    theme: Theme;
    applyTheme: (theme: Theme) => void;
    applyPreset: (presetKey: string) => Promise<void>;
    resetTheme: () => Promise<void>;
    isLoading: boolean;
}
