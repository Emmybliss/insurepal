import { AnimatedPage } from '@/components/animated-page';
import { useAuth } from '@/hooks/use-permissions';

import { router } from '@inertiajs/react';
import AuthSplitLayout from './auth/auth-split-layout';

export default function AuthLayout({ children, title, description, ...props }: { children: React.ReactNode; title?: string; description?: string }) {
    const { user } = useAuth();

    // If user is already logged in, redirect to dashboard
    if (user) {
        router.visit(route('dashboard'));
        return null;
    }

    return (
        <AuthSplitLayout title={title} description={description} {...props}>
            <AnimatedPage>{children}</AnimatedPage>
        </AuthSplitLayout>
    );
}
