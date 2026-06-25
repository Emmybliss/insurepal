import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { Head, useForm } from '@inertiajs/react';
import { KeyRound, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export default function TwoFactorChallenge() {
    const [useRecoveryCode, setUseRecoveryCode] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        code: '',
        recovery_code: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('two-factor.challenge.store'), {
            onError: () => reset('code', 'recovery_code'),
        });
    };

    return (
        <AuthLayout title="Two-Factor Authentication">
            <Head title="Two-Factor Authentication" />

            <div className="mb-6 flex flex-col items-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <ShieldCheck className="h-7 w-7 text-primary" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold">Confirm your identity</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {useRecoveryCode
                            ? 'Enter one of your emergency recovery codes to continue.'
                            : 'Open your authenticator app and enter the 6-digit code shown for InsurePal.'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {useRecoveryCode ? (
                    <div className="grid gap-2">
                        <Label htmlFor="recovery_code">Recovery Code</Label>
                        <Input
                            id="recovery_code"
                            type="text"
                            name="recovery_code"
                            autoFocus
                            autoComplete="one-time-code"
                            placeholder="xxxx-xxxx-xxxx"
                            value={data.recovery_code}
                            onChange={(e) => setData('recovery_code', e.target.value)}
                        />
                        <InputError message={errors.recovery_code} />
                    </div>
                ) : (
                    <div className="grid gap-2">
                        <Label htmlFor="code">Authentication Code</Label>
                        <Input
                            id="code"
                            type="text"
                            inputMode="numeric"
                            name="code"
                            autoFocus
                            autoComplete="one-time-code"
                            maxLength={6}
                            placeholder="000000"
                            className="text-center font-mono text-2xl tracking-[0.5em]"
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value.replace(/\D/g, ''))}
                        />
                        <InputError message={errors.code} />
                    </div>
                )}

                <Button type="submit" className="w-full" disabled={processing}>
                    {processing ? (
                        <>
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            Verifying…
                        </>
                    ) : (
                        'Verify & Sign In'
                    )}
                </Button>

                <button
                    type="button"
                    onClick={() => {
                        setUseRecoveryCode((v) => !v);
                        reset('code', 'recovery_code');
                    }}
                    className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                    <KeyRound className="h-3.5 w-3.5" />
                    {useRecoveryCode ? 'Use authenticator app instead' : 'Use a recovery code instead'}
                </button>
            </form>
        </AuthLayout>
    );
}
