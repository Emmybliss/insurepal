import { SocialAuth } from '@/components/auth/social-auth';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLang } from '@/hooks/useLang';
import AuthLayout from '@/layouts/auth-layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status }: LoginProps) {
    const { t } = useLang();
    const [showPassword, setShowPassword] = useState(false);
    const { turnstile } = usePage().props as any;

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
        'cf-turnstile-response': '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('login'), {
            onSuccess: () => reset('password'),
        });
    };

    return (
        // <AuthLayout title={t('Sign In')} description={t('Enter your credentials to access your account')}>
        <AuthLayout title={t('Sign In')}>
            <Head title={t('Sign In')} />
            <SocialAuth />
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="email">{t('Email address')}</Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            placeholder={t('email@example.com')}
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        {/* <div className="flex items-center">
                            <Label htmlFor="password">{t('Password')}</Label>
                            {canResetPassword && (
                                <TextLink href="/password/request" className="ml-auto text-sm" tabIndex={5}>
                                    {t('Forgot password?')}
                                </TextLink>
                            )}
                        </div> */}
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                required
                                tabIndex={2}
                                autoComplete="current-password"
                                placeholder={t('Password')}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                                tabIndex={-1}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        <InputError message={errors.password} />
                    </div>
<div className="flex justify-center w-full flex-col items-center gap-2">
                        <Turnstile
                            siteKey={turnstile.siteKey}
                            onSuccess={(token) => setData('cf-turnstile-response', token)}
                            onExpire={() => setData('cf-turnstile-response', '')}
                        />
                        {errors['cf-turnstile-response'] && <InputError message={errors['cf-turnstile-response']} />}
                    </div>
                    

                   
                    <Button type="submit" className="w-full" tabIndex={4} disabled={processing}>
                        {processing ? (
                            <>  
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                                Processing
                            </>
                        ) : (
                            t('Log in')
                        )}
                    </Button>
                </div>

                <div className="mt-2 text-center text-sm text-muted-foreground">
                    {t("Don't have an account?")}{' '}
                    <TextLink href="/register" tabIndex={5}>
                        {t('Sign up')}
                    </TextLink>
                </div>
            </form>

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}
        </AuthLayout>
    );
}
