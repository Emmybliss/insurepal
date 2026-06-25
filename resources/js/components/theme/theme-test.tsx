import { useTheme } from '@/contexts/theme-context';

export function ThemeTest() {
    const { theme } = useTheme();

    return (
        <div className="space-y-4 p-4">
            <h3 className="text-lg font-semibold">Theme Test</h3>

            {/* Test Tailwind utilities */}
            <div className="space-y-2">
                <div className="rounded bg-primary p-2 text-primary-foreground">Primary Background & Text</div>
                <div className="rounded bg-secondary p-2 text-secondary-foreground">Secondary Background & Text</div>
                <div className="rounded bg-accent p-2 text-accent-foreground">Accent Background & Text</div>
            </div>

            {/* Test borders */}
            <div className="space-y-2">
                <div className="rounded border-2 border-primary p-2">Primary Border</div>
                <div className="rounded border-2 border-secondary p-2">Secondary Border</div>
                <div className="rounded border-2 border-accent p-2">Accent Border</div>
            </div>

            {/* Current theme info */}
            <div className="text-sm text-muted-foreground">
                <p>Primary: {theme.primary_color}</p>
                <p>Secondary: {theme.secondary_color}</p>
                <p>Accent: {theme.accent_color}</p>
            </div>
        </div>
    );
}
