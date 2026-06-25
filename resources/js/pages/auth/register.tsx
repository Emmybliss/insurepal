import { Head, useForm, usePage } from '@inertiajs/react';
import { Turnstile } from '@marsidev/react-turnstile';
import { Check, CircleCheck, CircleX, Eye, EyeOff, LoaderCircle, X } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import { SocialAuth } from '@/components/auth/social-auth';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

const checkPasswordStrength = (password: string) => ({
    length: password.length >= 8,
    letter: /[a-zA-Z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
});

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        'cf-turnstile-response': '',
    });

    const { turnstile } = usePage().props as any;

    const strength = checkPasswordStrength(data.password);
    const strengthMet = Object.values(strength).filter(Boolean).length;
    const isStrong = strengthMet >= 4;
    const passwordMatch = data.password !== '' && data.password_confirmation !== '' && data.password === data.password_confirmation;
    const passwordMismatch = data.password !== '' && data.password_confirmation !== '' && data.password !== data.password_confirmation;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        // <AuthLayout title="Sign up" description="Enter your details below to create your account">
        <AuthLayout title="Sign up">
            <Head title="Register" />
            <SocialAuth />
            <form onSubmit={submit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-3 md:grid md:grid-cols-2">
                    <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="name"
                            placeholder="Full name"
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>
                    <div>
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            tabIndex={2}
                            autoComplete="email"
                            placeholder="email@example.com"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div>
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                required
                                tabIndex={3}
                                autoComplete="new-password"
                                placeholder="Password"
                                className={`pr-10 ${isStrong ? 'border-green-500 focus:ring-green-500' : data.password ? 'border-amber-500 focus:ring-amber-500' : ''}`}
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
                        {data.password && (
                            <div className="mt-1.5 space-y-1 rounded-md bg-muted p-2 text-xs">
                                <div className={`flex items-center gap-1.5 ${strength.length ? 'text-green-600' : 'text-muted-foreground'}`}>
                                    {strength.length ? <CircleCheck className="h-3 w-3" /> : <CircleX className="h-3 w-3" />}
                                    Min 8 chars
                                </div>
                                <div className={`flex items-center gap-1.5 ${strength.letter ? 'text-green-600' : 'text-muted-foreground'}`}>
                                    {strength.letter ? <CircleCheck className="h-3 w-3" /> : <CircleX className="h-3 w-3" />}
                                    Letter (a-z, A-Z)
                                </div>
                                <div className={`flex items-center gap-1.5 ${strength.number ? 'text-green-600' : 'text-muted-foreground'}`}>
                                    {strength.number ? <CircleCheck className="h-3 w-3" /> : <CircleX className="h-3 w-3" />}
                                    Number (0-9)
                                </div>
                                <div className={`flex items-center gap-1.5 ${strength.symbol ? 'text-green-600' : 'text-muted-foreground'}`}>
                                    {strength.symbol ? <CircleCheck className="h-3 w-3" /> : <CircleX className="h-3 w-3" />}
                                    Symbol (!@#$%^&*)
                                </div>
                            </div>
                        )}
                        <InputError message={errors.password} />
                    </div>

                    <div>
                        <Label htmlFor="password_confirmation">Confirm password</Label>
                        <div className="relative">
                            <Input
                                id="password_confirmation"
                                type={showConfirm ? 'text' : 'password'}
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                required
                                tabIndex={4}
                                autoComplete="new-password"
                                placeholder="Confirm password"
                                className={`pr-10 ${!isStrong && data.password ? 'border-muted-foreground/50' : passwordMatch ? 'border-green-500 focus:ring-green-500' : passwordMismatch ? 'border-red-500 focus:ring-red-500' : ''}`}
                            />
                            <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1">
                                {data.password_confirmation !== '' && !isStrong && data.password && <CircleX className="h-4 w-4 text-amber-500" />}
                                {passwordMatch && isStrong && <Check className="h-4 w-4 text-green-500" />}
                                {passwordMismatch && isStrong && <X className="h-4 w-4 text-red-500" />}
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm((v) => !v)}
                                    className="ml-1 text-muted-foreground hover:text-foreground focus:outline-none"
                                    tabIndex={-1}
                                    aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                                >
                                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        {data.password_confirmation !== '' && (
                            <p
                                className={`mt-1.5 text-xs ${!isStrong && data.password ? 'text-amber-600' : passwordMatch ? 'text-green-600' : 'text-red-500'}`}
                            >
                                {!isStrong && data.password
                                    ? 'Please meet password requirements first'
                                    : passwordMatch
                                      ? 'Passwords match'
                                      : 'Passwords do not match'}
                            </p>
                        )}
                        <InputError message={errors.password_confirmation} />
                    </div>

                    <div className="col-span-2 flex justify-center w-full">
                        <Turnstile
                            siteKey={turnstile.siteKey}
                            onSuccess={(token) => setData('cf-turnstile-response', token)}
                            onExpire={() => setData('cf-turnstile-response', '')}
                        />
                        {errors['cf-turnstile-response'] && <InputError message={errors['cf-turnstile-response']} />}
                    </div>

                    <Button type="submit" className="col-span-2 mt-2 w-full" tabIndex={5} disabled={processing}>
                        {processing ? (
                            <>
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                                Processing
                            </>
                        ) : (
                            'Create account'
                        )}
                    </Button>
                </div>

                {/* <SocialAuth /> */}
                <div className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <TextLink href={route('login')} tabIndex={6}>
                        Log in
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
