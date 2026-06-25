import { useLang } from '@/hooks/useLang';
import { useForm } from '@inertiajs/react';
import { Button } from '../ui/button';

export const SocialAuth = () => {
    const { t } = useLang();
    const { processing } = useForm();

    const handleSocialLogin = (provider: 'google' | 'microsoft') => {
        // ✅ use full redirect for external OAuth routes
        window.location.href = route(`auth.${provider}`);
        // OR, if you later add local OAuth middleware, prefer:
        // router.visit(route(`auth.${provider}`));
    };

    return (
        <div className="mt-0">
            {/* Social Buttons */}
            <div className="flex gap-3">
                <Button
                    type="button"
                    variant="outline"
                    className="flex flex-1 items-center justify-center"
                    onClick={() => handleSocialLogin('google')}
                    disabled={processing}
                >
                    <img src="/google-logo.svg" alt="microsoft" className="mr-2 h-4 w-4" />
                    Google
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    className="flex flex-1 items-center justify-center"
                    onClick={() => handleSocialLogin('microsoft')}
                    disabled={processing}
                >
                    <img src="/microsoft-logo.svg" alt="microsoft" className="mr-2 h-4 w-4" />
                    Microsoft
                </Button>
            </div>
            {/* Divider */}
            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="rounded-lg bg-background px-3 text-muted-foreground">{t('Or continue with')}</span>
                </div>
            </div>
        </div>
    );
};
