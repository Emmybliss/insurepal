import { usePage } from '@inertiajs/react';

interface PageProps {
    locale?: string;
    translations?: Record<string, string>;
    supportedLocales?: string[];
    [key: string]: unknown;
}

export function useLang() {
    const { props } = usePage<PageProps>();

    const locale = props?.locale ?? 'en';
    const translations = props?.translations ?? {};
    const supportedLocales = props?.supportedLocales ?? ['en'];

    /**
     * Translate a key to the current locale.
     * Supports dot notation and fallback to key if translation not found.
     */
    const t = (key: string, replacements?: Record<string, string | number>): string => {
        let translation = translations?.[key] ?? key;

        // Handle replacements
        if (replacements) {
            for (const [placeholder, value] of Object.entries(replacements)) {
                const regex = new RegExp(`:${placeholder}`, 'g');
                translation = translation.replace(regex, String(value));
            }
        }

        return translation;
    };
    /**
     * Get the current locale
     */
    const getCurrentLocale = (): string => locale;
    /**
     * Get all supported locales
     */
    const getSupportedLocales = (): string[] => supportedLocales;
    /**
     * Check if a locale is supported
     */
    const isLocaleSupported = (localeToCheck: string): boolean => supportedLocales.includes(localeToCheck);

    /**
     * Get locale display name
     */
    const getLocaleDisplayName = (localeCode: string): string => {
        const localeNames: Record<string, string> = {
            en: t('English'),
            fr: t('French'),
            es: t('Spanish'),
            de: t('German'),
            it: t('Italian'),
            pt: t('Portuguese'),
            ar: t('Arabic'),
            zh: t('Chinese'),
            ja: t('Japanese'),
            ru: t('Russian'),
        };

        return localeNames[localeCode] ?? localeCode.toUpperCase();
    };

    return {
        t,
        locale,
        translations,
        supportedLocales,
        getCurrentLocale,
        getSupportedLocales,
        isLocaleSupported,
        getLocaleDisplayName,
    };
}
