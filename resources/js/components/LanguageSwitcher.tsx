import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useLang } from '@/hooks/useLang';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { Check, Languages, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface LanguageSwitcherProps {
    className?: string;
    showLabel?: boolean;
    variant?: 'default' | 'ghost' | 'outline';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function LanguageSwitcher({ className, showLabel = false, variant = 'ghost', size = 'default' }: LanguageSwitcherProps) {
    const { t, getCurrentLocale, getSupportedLocales, getLocaleDisplayName } = useLang();
    const [isChanging, setIsChanging] = useState<string | null>(null);

    const currentLocale = getCurrentLocale();
    const supportedLocales = getSupportedLocales();

    const handleLocaleChange = async (newLocale: string) => {
        if (newLocale === currentLocale || isChanging) {
            return;
        }

        setIsChanging(newLocale);

        try {
            router.post(
                route('locale.set', { locale: newLocale }),
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    onFinish: () => {
                        setIsChanging(null);
                    },
                },
            );
        } catch (error) {
            console.error('Failed to change language:', error);
            setIsChanging(null);
        }
    };

    if (supportedLocales.length <= 1) {
        return null;
    }

    const currentLocaleDisplay = getLocaleDisplayName(currentLocale);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size={size} className={cn('gap-2', className)} disabled={!!isChanging}>
                    {isChanging ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
                    {showLabel && <span className="hidden sm:inline-block">{currentLocaleDisplay}</span>}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {supportedLocales.map((locale) => {
                    const isActive = locale === currentLocale;
                    const isLoading = isChanging === locale;
                    const displayName = getLocaleDisplayName(locale);

                    return (
                        <DropdownMenuItem
                            key={locale}
                            onClick={() => handleLocaleChange(locale)}
                            disabled={isActive || !!isChanging}
                            className={cn('flex cursor-pointer items-center justify-between', isActive && 'bg-accent/50')}
                        >
                            <span>{displayName}</span>
                            <div className="flex items-center">
                                {isLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                {isActive && <Check className="h-3 w-3 text-primary" />}
                            </div>
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// Export with different presets for common use cases
export const LanguageSwitcherIcon = (props: Omit<LanguageSwitcherProps, 'size' | 'showLabel'>) => (
    <LanguageSwitcher {...props} size="icon" showLabel={false} />
);

export const LanguageSwitcherWithLabel = (props: Omit<LanguageSwitcherProps, 'showLabel'>) => <LanguageSwitcher {...props} showLabel={true} />;

export const LanguageSwitcherCompact = (props: Omit<LanguageSwitcherProps, 'size' | 'variant'>) => (
    <LanguageSwitcher {...props} size="sm" variant="outline" />
);
