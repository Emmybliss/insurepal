import { Head } from '@inertiajs/react';

import HeadingSmall from '@/components/heading-small';
import { type BreadcrumbItem } from '@/types';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

interface Theme {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    gradient: { from: string; via: string; to: string };
    sidebar_style: string;
    header_style: string;
    body_style: string;
}

interface ThemePresets {
    [key: string]: {
        name: string;
        primary_color: string;
        secondary_color: string;
        accent_color: string;
        gradient: { from: string; via: string; to: string };
    };
}

interface Props {
    currentTheme: Theme;
    themePresets: ThemePresets;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Theme settings',
        href: '/settings/theme',
    },
];

export default function Theme({ currentTheme, themePresets }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Theme settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Theme settings" description="Customize your brand colors and theme styles" />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
