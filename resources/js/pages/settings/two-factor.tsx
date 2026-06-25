import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SettingsLayout from '@/layouts/settings/layout';
import { Head, router, useForm } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, ClipboardCopy, KeyRound, LoaderCircle, QrCode, RefreshCw, ShieldCheck, ShieldOff, ShieldX } from 'lucide-react';
import { useState } from 'react';

interface TwoFactorProps {
    isOAuthUser: boolean;
    providerName?: string;
    enabled: boolean;
    confirming: boolean;
    qrCodeSvg?: string;
    recoveryCodes?: string[];
}

export default function TwoFactor({ isOAuthUser, providerName, enabled, confirming, qrCodeSvg, recoveryCodes }: TwoFactorProps) {
    const [showCodes, setShowCodes] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Form for confirming TOTP code
    const confirmForm = useForm({ code: '' });

    // Form for disabling 2FA (requires password confirmation)
    const disableForm = useForm({ password: '' });

    const handleEnable = () => {
        router.post(route('two-factor.store'), {}, { preserveScroll: true });
    };

    const handleConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        confirmForm.post(route('two-factor.confirm'), {
            preserveScroll: true,
            onSuccess: () => confirmForm.reset(),
        });
    };

    const handleDisable = (e: React.FormEvent) => {
        e.preventDefault();
        disableForm.delete(route('two-factor.destroy'), {
            preserveScroll: true,
            onSuccess: () => disableForm.reset(),
        });
    };

    const handleRegenerateCodes = () => {
        router.post(route('two-factor.recovery-codes'), {}, { preserveScroll: true });
    };

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    // ── OAuth User: managed by identity provider ──────────────────────────────
    if (isOAuthUser) {
        return (
            <SettingsLayout>
                <Head title="Two-Factor Authentication" />
                <div className="space-y-6">
                    <header>
                        <h2 className="text-lg font-medium">Two-Factor Authentication</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
                    </header>

                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-950/30">
                        <div className="flex items-start gap-3">
                            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                                    Security managed by{' '}
                                    {providerName ? `${providerName.charAt(0).toUpperCase() + providerName.slice(1)}` : 'your identity provider'}
                                </p>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    Your account uses{' '}
                                    <strong>
                                        {providerName ? `${providerName.charAt(0).toUpperCase() + providerName.slice(1)} Sign-In` : 'OAuth'}
                                    </strong>{' '}
                                    for authentication. Two-factor authentication is handled by your identity provider — you can manage it from your
                                    provider's security settings.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </SettingsLayout>
        );
    }

    // ── 2FA Enabled ───────────────────────────────────────────────────────────
    if (enabled) {
        return (
            <SettingsLayout>
                <Head title="Two-Factor Authentication" />
                <div className="space-y-6">
                    <header>
                        <h2 className="text-lg font-medium">Two-Factor Authentication</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Your account is secured with two-factor authentication.</p>
                    </header>

                    {/* Status Banner */}
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-medium text-green-900 dark:text-green-200">Two-factor authentication is enabled</span>
                        </div>
                    </div>

                    {/* Recovery Codes */}
                    <div className="space-y-3 rounded-lg border p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <KeyRound className="h-4 w-4 text-muted-foreground" />
                                <h3 className="text-sm font-medium">Recovery Codes</h3>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={handleRegenerateCodes}>
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    Regenerate
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setShowCodes((v) => !v)}>
                                    {showCodes ? 'Hide codes' : 'Show codes'}
                                </Button>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Store these codes in a safe place. Each can only be used once to access your account if you lose your authenticator
                            device.
                        </p>
                        {showCodes && recoveryCodes && (
                            <div className="mt-3 grid grid-cols-2 gap-1.5">
                                {recoveryCodes.map((code) => (
                                    <button
                                        key={code}
                                        onClick={() => copyToClipboard(code)}
                                        className="group flex items-center justify-between rounded-md bg-muted px-3 py-1.5 font-mono text-xs tracking-wider transition-colors hover:bg-muted/80"
                                    >
                                        <span>{code}</span>
                                        {copiedCode === code ? (
                                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                                        ) : (
                                            <ClipboardCopy className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Disable 2FA */}
                    <div className="space-y-4 rounded-lg border border-destructive/20 p-5">
                        <div className="flex items-center gap-2">
                            <ShieldOff className="h-4 w-4 text-destructive" />
                            <h3 className="text-sm font-medium text-destructive">Disable Two-Factor Authentication</h3>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Disabling 2FA will make your account less secure. Enter your password to confirm.
                        </p>
                        <form onSubmit={handleDisable} className="flex items-end gap-3">
                            <div className="flex-1 space-y-1">
                                <Label htmlFor="disable-password" className="text-xs">
                                    Current Password
                                </Label>
                                <Input
                                    id="disable-password"
                                    type="password"
                                    name="password"
                                    value={disableForm.data.password}
                                    onChange={(e) => disableForm.setData('password', e.target.value)}
                                    placeholder="Your password"
                                />
                                <InputError message={disableForm.errors.password} />
                            </div>
                            <Button type="submit" variant="destructive" disabled={disableForm.processing || !disableForm.data.password}>
                                {disableForm.processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Disable 2FA'}
                            </Button>
                        </form>
                    </div>
                </div>
            </SettingsLayout>
        );
    }

    // ── 2FA Setup in Progress (QR shown, not yet confirmed) ───────────────────
    if (confirming && qrCodeSvg) {
        return (
            <SettingsLayout>
                <Head title="Two-Factor Authentication" />
                <div className="space-y-6">
                    <header>
                        <h2 className="text-lg font-medium">Set Up Two-Factor Authentication</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Scan the QR code below with your authenticator app, then enter the one-time code to confirm.
                        </p>
                    </header>

                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                                Setup is not complete until you enter and confirm the code below. Do not close this page yet.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <div className="rounded-xl border-2 border-primary/20 bg-white p-4 shadow-sm dark:bg-zinc-900">
                            <img
                                src={`data:image/svg+xml;base64,${qrCodeSvg}`}
                                alt="2FA QR Code — scan with Google Authenticator or Authy"
                                className="h-48 w-48"
                            />
                        </div>
                        <p className="max-w-xs text-center text-xs text-muted-foreground">
                            Use <strong>Google Authenticator</strong>, <strong>Authy</strong>, or any TOTP-compatible app to scan this code.
                        </p>
                    </div>

                    <form onSubmit={handleConfirm} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="confirm-code">6-Digit Code from Authenticator App</Label>
                            <Input
                                id="confirm-code"
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                autoFocus
                                autoComplete="one-time-code"
                                placeholder="000000"
                                className="text-center font-mono text-2xl tracking-[0.5em]"
                                value={confirmForm.data.code}
                                onChange={(e) => confirmForm.setData('code', e.target.value.replace(/\D/g, ''))}
                            />
                            <InputError message={confirmForm.errors.code} />
                        </div>
                        <Button type="submit" className="w-full" disabled={confirmForm.processing || confirmForm.data.code.length !== 6}>
                            {confirmForm.processing ? (
                                <>
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                    Confirming…
                                </>
                            ) : (
                                'Confirm & Enable 2FA'
                            )}
                        </Button>
                    </form>
                </div>
            </SettingsLayout>
        );
    }

    // ── 2FA Disabled (default) ────────────────────────────────────────────────
    return (
        <SettingsLayout>
            <Head title="Two-Factor Authentication" />
            <div className="space-y-6">
                <header>
                    <h2 className="text-lg font-medium">Two-Factor Authentication</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Add an extra layer of security to your account using your phone's authenticator app.
                    </p>
                </header>

                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 dark:bg-destructive/10">
                    <div className="flex items-center gap-3">
                        <ShieldX className="h-5 w-5 text-destructive" />
                        <span className="text-sm font-medium text-destructive">Two-factor authentication is not enabled</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-lg border p-4">
                        <QrCode className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium">How it works</p>
                            <p className="text-xs text-muted-foreground">
                                After enabling 2FA, you'll be asked to enter a time-sensitive code from your authenticator app each time you log in.
                                This prevents unauthorised access even if your password is compromised.
                            </p>
                        </div>
                    </div>
                </div>

                <Button onClick={handleEnable} className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Enable Two-Factor Authentication
                </Button>
            </div>
        </SettingsLayout>
    );
}
