import { Check, Loader2, Palette, RotateCcw } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { themePresets } from '@/config/theme-presets';
import { useTheme } from '@/contexts/theme-context';

export function ThemeSwitcher() {
    const { theme, applyPreset, resetTheme, isLoading } = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    const handlePresetClick = async (presetKey: string) => {
        await applyPreset(presetKey);
        setIsOpen(false);
    };

    const handleReset = async () => {
        await resetTheme();
        setIsOpen(false);
    };

    const isCurrentPreset = (presetKey: string) => {
        const preset = themePresets[presetKey];
        return (
            theme.primary_color === preset.colors.primary &&
            theme.secondary_color === preset.colors.secondary &&
            theme.accent_color === preset.colors.accent
        );
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Palette className="h-5 w-5" />}
                    <span className="sr-only">Switch theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Theme Presets</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(themePresets).map(([key, preset]) => (
                    <DropdownMenuItem key={key} onClick={() => handlePresetClick(key)} className="cursor-pointer">
                        <div className="flex w-full items-center gap-3">
                            <div className="flex gap-1">
                                <div className="h-4 w-4 rounded-full border border-gray-200" style={{ backgroundColor: preset.colors.primary }} />
                                <div className="h-4 w-4 rounded-full border border-gray-200" style={{ backgroundColor: preset.colors.secondary }} />
                                <div className="h-4 w-4 rounded-full border border-gray-200" style={{ backgroundColor: preset.colors.accent }} />
                            </div>
                            <span className="flex-1">{preset.name}</span>
                            {isCurrentPreset(key) && <Check className="h-4 w-4" />}
                        </div>
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleReset} className="cursor-pointer">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset to Default
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
