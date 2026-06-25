export interface Locale {
    code: string;
    name: string;
    nativeName: string;
}

export interface Translation {
    [key: string]: string;
}

export interface I18nPageProps {
    locale: string;
    translations: Translation;
    supportedLocales: string[];
}

export interface LanguageConfig {
    defaultLocale: string;
    fallbackLocale: string;
    supportedLocales: string[];
}

export type LocaleCode = 'en' | 'fr' | 'es' | 'de' | 'it' | 'pt' | 'ar' | 'zh' | 'ja' | 'ru';

export const SUPPORTED_LOCALES: Record<LocaleCode, Locale> = {
    en: { code: 'en', name: 'English', nativeName: 'English' },
    fr: { code: 'fr', name: 'French', nativeName: 'Français' },
    es: { code: 'es', name: 'Spanish', nativeName: 'Español' },
    de: { code: 'de', name: 'German', nativeName: 'Deutsch' },
    it: { code: 'it', name: 'Italian', nativeName: 'Italiano' },
    pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    zh: { code: 'zh', name: 'Chinese', nativeName: '中文' },
    ja: { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    ru: { code: 'ru', name: 'Russian', nativeName: 'Русский' },
};
