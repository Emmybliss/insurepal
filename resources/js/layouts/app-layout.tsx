import { AnimatedPage } from '@/components/animated-page';
import { SubscriptionBanner } from '@/components/subscription/subscription-banner';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function AppLayout({ children, breadcrumbs, ...props }: AppLayoutProps) {
    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
            <SubscriptionBanner />
            <AnimatedPage>
                <main className="p-4">{children}</main>
            </AnimatedPage>

        </AppLayoutTemplate>
    );
}
