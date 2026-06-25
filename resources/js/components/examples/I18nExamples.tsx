import { LanguageSwitcher, LanguageSwitcherIcon, LanguageSwitcherWithLabel } from '@/components/LanguageSwitcher';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLang } from '@/hooks/useLang';

/**
 * Example component demonstrating various ways to use the i18n system
 */
export function I18nExamples() {
    const { t, getCurrentLocale, getSupportedLocales } = useLang();

    return (
        <div className="space-y-6 p-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t('Language Examples')}</CardTitle>
                    <CardDescription>
                        {t('Current locale')}: <Badge variant="secondary">{getCurrentLocale()}</Badge>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Basic translation examples */}
                    <div>
                        <h3 className="mb-2 text-lg font-semibold">{t('Basic Translations')}</h3>
                        <div className="space-y-2">
                            <p>
                                <span className="font-medium">{t('Welcome')}</span> - {t('Dashboard')}
                            </p>
                            <p>
                                {t('Total')}: <span className="text-green-600">42</span> {t('Policies')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {t('Status')}: <Badge variant="outline">{t('Active')}</Badge>
                            </p>
                        </div>
                    </div>

                    {/* Translation with replacements */}
                    <div>
                        <h3 className="mb-2 text-lg font-semibold">{t('Translation with Placeholders')}</h3>
                        <p className="text-sm">
                            {t('Hello :name, you have :count new messages', {
                                name: 'John',
                                count: '5',
                            })}
                        </p>
                    </div>

                    {/* Supported locales */}
                    <div>
                        <h3 className="mb-2 text-lg font-semibold">{t('Supported Languages')}</h3>
                        <div className="flex flex-wrap gap-2">
                            {getSupportedLocales().map((locale) => (
                                <Badge key={locale} variant="outline">
                                    {locale}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('Language Switcher Variants')}</CardTitle>
                    <CardDescription>{t('Different ways to display the language switcher')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Default switcher */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Default:</span>
                            <LanguageSwitcher />
                        </div>

                        {/* Icon only */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Icon only:</span>
                            <LanguageSwitcherIcon />
                        </div>

                        {/* With label */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">With label:</span>
                            <LanguageSwitcherWithLabel />
                        </div>

                        {/* Outline variant */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Outline:</span>
                            <LanguageSwitcher variant="outline" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('Common UI Elements')}</CardTitle>
                    <CardDescription>{t('Example of common interface elements using translations')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Navigation example */}
                    <nav className="flex items-center space-x-4 text-sm">
                        <a href="#" className="text-primary hover:underline">
                            {t('Dashboard')}
                        </a>
                        <a href="#" className="text-muted-foreground hover:text-primary">
                            {t('Policies')}
                        </a>
                        <a href="#" className="text-muted-foreground hover:text-primary">
                            {t('Customers')}
                        </a>
                        <a href="#" className="text-muted-foreground hover:text-primary">
                            {t('Messages')}
                        </a>
                        <a href="#" className="text-muted-foreground hover:text-primary">
                            {t('Settings')}
                        </a>
                    </nav>

                    {/* Form example */}
                    <div className="space-y-3 rounded-lg border p-4">
                        <h4 className="font-medium">{t('Example Form')}</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground">{t('Name')}</label>
                                <input type="text" placeholder={t('Enter your name')} className="w-full rounded-md border px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground">{t('Email')}</label>
                                <input type="email" placeholder={t('Enter your email')} className="w-full rounded-md border px-3 py-2" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">{t('Save')}</button>
                            <button className="rounded-md border px-4 py-2 text-sm">{t('Cancel')}</button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Simple layout header example showing language switcher integration
 */
export function ExampleHeader() {
    const { t } = useLang();

    return (
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                <div className="mr-4 flex">
                    <a className="mr-6 flex items-center space-x-2" href="/">
                        <span className="font-bold">{t('InsurePal')}</span>
                    </a>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        <a href="/dashboard">{t('Dashboard')}</a>
                        <a href="/policies">{t('Policies')}</a>
                        <a href="/customers">{t('Customers')}</a>
                    </nav>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <div className="w-full flex-1 md:w-auto md:flex-none">{/* Search or other controls */}</div>
                    <nav className="flex items-center space-x-2">
                        <LanguageSwitcherIcon />
                        {/* User menu, notifications, etc. */}
                    </nav>
                </div>
            </div>
        </header>
    );
}
