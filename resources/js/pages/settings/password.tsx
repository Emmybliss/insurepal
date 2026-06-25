import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head } from '@inertiajs/react';
import { Check, CircleCheck, CircleX, Eye, EyeOff, X } from 'lucide-react';
import { useRef, useState } from 'react';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Password settings',
        href: '/settings/password',
    },
];

const checkPasswordStrength = (password: string) => ({
    length: password.length >= 8,
    letter: /[a-zA-Z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
});

export default function Password() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const passwordMatch = newPassword !== '' && confirmPassword !== '' && newPassword === confirmPassword;
    const passwordMismatch = newPassword !== '' && confirmPassword !== '' && newPassword !== confirmPassword;
    const strength = checkPasswordStrength(newPassword);
    const strengthMet = Object.values(strength).filter(Boolean).length;
    const isStrong = strengthMet >= 4;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Password settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Update password" description="Ensure your account is using a long, random password to stay secure" />

                    <Form
                        method="put"
                        action={route('password.update')}
                        options={{
                            preserveScroll: true,
                        }}
                        resetOnError={['password', 'password_confirmation', 'current_password']}
                        resetOnSuccess
                        onSuccess={() => {
                            toast({
                                title: 'Password updated',
                                description: 'Your password has been changed successfully.',
                            });
                        }}
                        onError={(errors) => {
                            toast({
                                title: 'Error updating password',
                                description: 'Please check the form for errors and try again.',
                                variant: 'destructive',
                            });

                            if (errors.password) {
                                passwordInput.current?.focus();
                            }

                            if (errors.current_password) {
                                currentPasswordInput.current?.focus();
                            }
                        }}
                        className="space-y-6"
                    >
                        {({ errors, processing, recentlySuccessful }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="current_password">Current password</Label>

                                    <div className="relative">
                                        <Input
                                            id="current_password"
                                            ref={currentPasswordInput}
                                            name="current_password"
                                            type={showCurrent ? 'text' : 'password'}
                                            className="mt-1 block w-full pr-10"
                                            autoComplete="current-password"
                                            placeholder="Current password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrent((v) => !v)}
                                            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                                            tabIndex={-1}
                                            aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                                        >
                                            {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>

                                    <InputError message={errors.current_password} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password">New password</Label>

                                    <div className="relative">
                                        <Input
                                            id="password"
                                            ref={passwordInput}
                                            name="password"
                                            type={showNew ? 'text' : 'password'}
                                            className={`mt-1 block w-full pr-10 ${isStrong ? 'border-green-500 focus:ring-green-500' : newPassword ? 'border-amber-500 focus:ring-amber-500' : ''}`}
                                            autoComplete="new-password"
                                            placeholder="New password"
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNew((v) => !v)}
                                            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                                            tabIndex={-1}
                                            aria-label={showNew ? 'Hide new password' : 'Show new password'}
                                        >
                                            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>

                                    {newPassword && (
                                        <div className="space-y-1.5 rounded-md bg-muted p-2.5 text-xs">
                                            <p className={`font-medium ${isStrong ? 'text-green-600' : 'text-amber-600'}`}>
                                                {isStrong ? 'Strong password' : 'Password requirements:'}
                                            </p>
                                            <div className="space-y-1">
                                                <div
                                                    className={`flex items-center gap-1.5 ${strength.length ? 'text-green-600' : 'text-muted-foreground'}`}
                                                >
                                                    {strength.length ? <CircleCheck className="h-3 w-3" /> : <CircleX className="h-3 w-3" />}
                                                    Minimum 8 characters
                                                </div>
                                                <div
                                                    className={`flex items-center gap-1.5 ${strength.letter ? 'text-green-600' : 'text-muted-foreground'}`}
                                                >
                                                    {strength.letter ? <CircleCheck className="h-3 w-3" /> : <CircleX className="h-3 w-3" />}
                                                    Contains a letter (a-z, A-Z)
                                                </div>
                                                <div
                                                    className={`flex items-center gap-1.5 ${strength.number ? 'text-green-600' : 'text-muted-foreground'}`}
                                                >
                                                    {strength.number ? <CircleCheck className="h-3 w-3" /> : <CircleX className="h-3 w-3" />}
                                                    Contains a number (0-9)
                                                </div>
                                                <div
                                                    className={`flex items-center gap-1.5 ${strength.symbol ? 'text-green-600' : 'text-muted-foreground'}`}
                                                >
                                                    {strength.symbol ? <CircleCheck className="h-3 w-3" /> : <CircleX className="h-3 w-3" />}
                                                    Contains a symbol (!@#$%^&*)
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <InputError message={errors.password} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation">Confirm password</Label>

                                    <div className="relative">
                                        <Input
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            type={showConfirm ? 'text' : 'password'}
                                            className={`mt-1 block w-full pr-10 ${!isStrong && newPassword ? 'border-muted-foreground/50' : passwordMatch ? 'border-green-500 focus:ring-green-500' : passwordMismatch ? 'border-red-500 focus:ring-red-500' : ''}`}
                                            autoComplete="new-password"
                                            placeholder="Confirm password"
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1">
                                            {confirmPassword !== '' && !isStrong && newPassword && <CircleX className="h-4 w-4 text-amber-500" />}
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
                                    {confirmPassword !== '' && (
                                        <p
                                            className={`text-xs ${!isStrong && newPassword ? 'text-amber-600' : passwordMatch ? 'text-green-600' : 'text-red-500'}`}
                                        >
                                            {!isStrong && newPassword
                                                ? 'Please meet password requirements first'
                                                : passwordMatch
                                                  ? 'Passwords match'
                                                  : 'Passwords do not match'}
                                        </p>
                                    )}
                                    <InputError message={errors.password_confirmation} />
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button disabled={processing}>Save password</Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">Saved</p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
