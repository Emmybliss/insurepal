import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { type SubscriptionPlan } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ArrowRight, CheckCircle, Headphones, Loader2, Rocket } from 'lucide-react';
import { useState } from 'react';

interface Props {
    plan: SubscriptionPlan;
}

export default function ChooseOnboarding({ plan }: Props) {
    const [payingFee, setPayingFee] = useState(false);
    const [skipLoading, setSkipLoading] = useState(false);

    const fmtNGN = (amount: number | string) =>
        new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
        }).format(Number(amount));

    const setupFeeAmount = Number(plan?.setup_fee ?? 0);

    const handleGuidedOnboarding = async () => {
        setPayingFee(true);
        try {
            const res = await fetch(route('payment.setup-fee'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
                body: JSON.stringify({ plan_id: plan.id }),
            });
            const data = await res.json();
            if (data.status && data.authorization_url) {
                window.location.href = data.authorization_url;
            } else {
                alert(data.message ?? 'Payment initialization failed. Please try again.');
                setPayingFee(false);
            }
        } catch {
            alert('Network error. Please try again.');
            setPayingFee(false);
        }
    };

    const handleSelfOnboarding = () => {
        setSkipLoading(true);
        router.get(
            route('onboarding.company-details'),
            {},
            {
                onError: () => setSkipLoading(false),
            },
        );
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background px-4">
            <Head title="Choose Your Onboarding" />

            <div className="w-full max-w-2xl space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mb-4 flex justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <CheckCircle className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Payment Successful! 🎉</h1>
                    <p className="mt-2 text-muted-foreground">
                        You're now on the <strong>{plan.name}</strong> plan. Choose how you'd like to get started.
                    </p>
                </div>

                {/* Options */}
                <div className="grid gap-4 sm:grid-cols-2">
                    {/* Self-Onboarding (Free) */}
                    <Card className="relative cursor-pointer border-2 transition-all hover:border-primary/50 hover:shadow-md">
                        <CardContent className="flex flex-col gap-4 p-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                                <Rocket className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Self-Onboarding</h3>
                                <p className="text-2xl font-bold text-green-600">Free</p>
                            </div>
                            <ul className="space-y-1.5 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                                    Access to full documentation & tutorials
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                                    Standard support channel
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                                    Get started immediately
                                </li>
                            </ul>
                            <Button className="mt-auto w-full" variant="outline" onClick={handleSelfOnboarding} disabled={skipLoading || payingFee}>
                                {skipLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Loading…
                                    </>
                                ) : (
                                    <>
                                        <ArrowRight className="mr-2 h-4 w-4" />
                                        Start Self-Onboarding
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Guided Onboarding (Paid) */}
                    <Card className="relative cursor-pointer border-2 border-primary/30 bg-primary/5 transition-all hover:border-primary hover:shadow-md">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Recommended</span>
                        </div>
                        <CardContent className="flex flex-col gap-4 p-6 pt-8">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Headphones className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Guided Onboarding</h3>
                                {setupFeeAmount > 0 ? (
                                    <p className="text-2xl font-bold text-primary">{fmtNGN(setupFeeAmount)}</p>
                                ) : (
                                    <p className="text-2xl font-bold text-primary">Contact Us</p>
                                )}
                                <p className="text-xs text-muted-foreground">One-time setup fee</p>
                            </div>
                            <ul className="space-y-1.5 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                                    Hands-on account & workspace setup
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                                    Data import & configuration help
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                                    Live onboarding session with our team
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                                    Priority support during setup
                                </li>
                            </ul>
                            <Button
                                className="mt-auto w-full"
                                onClick={handleGuidedOnboarding}
                                disabled={payingFee || skipLoading || setupFeeAmount <= 0}
                            >
                                {payingFee ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Redirecting to payment…
                                    </>
                                ) : (
                                    <>
                                        <Headphones className="mr-2 h-4 w-4" />
                                        Pay & Get Guided Setup
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Footer note */}
                <p className="text-center text-xs text-muted-foreground">
                    🔒 Guided onboarding payments are processed securely through Paystack. You can always upgrade to guided onboarding later via your
                    account settings.
                </p>
            </div>
        </div>
    );
}
