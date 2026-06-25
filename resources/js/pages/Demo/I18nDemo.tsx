import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLang } from '@/hooks/useLang';
import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { useState } from 'react';

export default function I18nDemo() {
    const { t, getCurrentLocale, getSupportedLocales, getLocaleDisplayName } = useLang();
    const [isChanging, setIsChanging] = useState(false);

    const handleQuickLanguageChange = (locale: string) => {
        setIsChanging(true);
        router.post(
            route('locale.set', { locale }),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsChanging(false),
            },
        );
    };

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: 'I18n Demo', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('Language')} Demo</h1>
                    <p className="text-muted-foreground">Demonstration of the internationalization system in the application sidebar and UI.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('Current Language')}</CardTitle>
                            <CardDescription>{t('Language changed successfully.')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{t('Current locale')}:</span>
                                <Badge variant="secondary">
                                    {getCurrentLocale()} - {getLocaleDisplayName(getCurrentLocale())}
                                </Badge>
                            </div>

                            <div>
                                <h4 className="mb-2 text-sm font-medium">{t('Supported Languages')}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {getSupportedLocales().map((locale) => (
                                        <Button
                                            key={locale}
                                            variant={locale === getCurrentLocale() ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => handleQuickLanguageChange(locale)}
                                            disabled={isChanging || locale === getCurrentLocale()}
                                        >
                                            {getLocaleDisplayName(locale)}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('Navigation Examples')}</CardTitle>
                            <CardDescription>Sidebar navigation items in current language</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="font-medium">{t('Dashboard')}</div>
                                <div className="font-medium">{t('Users')}</div>
                                <div className="font-medium">{t('Customers')}</div>
                                <div className="font-medium">{t('Policies')}</div>
                                <div className="font-medium">{t('Reports')}</div>
                                <div className="font-medium">{t('Messages')}</div>
                                <div className="font-medium">{t('Settings')}</div>
                                <div className="font-medium">{t('Help & Support')}</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('Common UI Elements')}</CardTitle>
                        <CardDescription>Examples of translated UI elements</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <Button variant="default">{t('Save')}</Button>
                            <Button variant="outline">{t('Cancel')}</Button>
                            <Button variant="destructive">{t('Delete')}</Button>
                            <Button variant="secondary">{t('Edit')}</Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                            <div>
                                <span className="font-medium">{t('Actions')}:</span>
                                <ul className="mt-1 space-y-1 text-muted-foreground">
                                    <li>{t('Create')}</li>
                                    <li>{t('Update')}</li>
                                    <li>{t('View')}</li>
                                    <li>{t('Remove')}</li>
                                </ul>
                            </div>
                            <div>
                                <span className="font-medium">{t('Status')}:</span>
                                <ul className="mt-1 space-y-1 text-muted-foreground">
                                    <li>{t('Active')}</li>
                                    <li>{t('Inactive')}</li>
                                    <li>{t('Loading')}</li>
                                    <li>{t('Success')}</li>
                                </ul>
                            </div>
                            <div>
                                <span className="font-medium">{t('Navigation')}:</span>
                                <ul className="mt-1 space-y-1 text-muted-foreground">
                                    <li>{t('Next')}</li>
                                    <li>{t('Previous')}</li>
                                    <li>{t('Back')}</li>
                                    <li>{t('Close')}</li>
                                </ul>
                            </div>
                            <div>
                                <span className="font-medium">{t('Options')}:</span>
                                <ul className="mt-1 space-y-1 text-muted-foreground">
                                    <li>{t('Yes')}</li>
                                    <li>{t('No')}</li>
                                    <li>{t('All')}</li>
                                    <li>{t('None')}</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Instructions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p>• Use the language switcher in the top-right corner of the sidebar header to change languages</p>
                        <p>• Or use the quick language buttons above to test the functionality</p>
                        <p>• Notice how the sidebar navigation, breadcrumbs, and all UI elements update instantly</p>
                        <p>• Your language preference is saved to your user account for future sessions</p>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
