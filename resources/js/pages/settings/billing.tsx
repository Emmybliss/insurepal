import { PricingPlans } from '@/components/pricing/pricing-plans';
import { ReceiptPreviewModal } from '@/components/subscription/receipt-preview-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { SubscriptionPlan } from '@/types';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { CheckCircle, CreditCard, Download, Eye, RefreshCw, Zap } from 'lucide-react';
import { useState } from 'react';

interface Tenant {
    id: number;
    name: string;
    company_name: string;
    subscription_plan_id: number | null;
    subscription_started_at: string | null;
    subscription_expires_at: string | null;
    paystack_subscription_code: string | null;
}

interface Props {
    tenant: Tenant;
    currentPlan: SubscriptionPlan | null;
    availablePlans: SubscriptionPlan[];
    paymentHistory: any[];
    plans: SubscriptionPlan[];
}

export default function BillingSettings({ tenant, currentPlan, availablePlans, paymentHistory, plans }: Props) {
    const [open, setOpen] = useState(false);
    const [previewReceiptId, setPreviewReceiptId] = useState<number | null>(null);
    const formatPrice = (price: number, currency: string) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
        }).format(price);
    };

    const handleChangePlan = (planId: number) => {
        router.post(route('settings.billing.change-plan'), { plan_id: planId });
    };

    const handleCancelSubscription = () => {
        if (confirm('Are you sure you want to cancel your subscription?')) {
            router.post(route('settings.billing.cancel'));
        }
    };

    const handleDownloadReceipt = (subscriptionId: number) => {
        window.open(route('settings.billing.download-receipt', { subscriptionId }), '_blank');
    };

    return (
        <AppLayout>
            <Head title="Billing & Subscription" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
                    <p className="text-muted-foreground">Manage your subscription plan and payment methods</p>
                </div>

                {/* Current Plan */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Current Plan
                        </CardTitle>
                        <CardDescription>Your active subscription details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {currentPlan ? (
                            <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-2xl font-bold">{currentPlan.name}</h3>
                                            {currentPlan.is_popular && (
                                                <Badge className="bg-primary">
                                                    <Zap className="mr-1 h-3 w-3" />
                                                    Popular
                                                </Badge>
                                            )}
                                            {tenant.subscription_expires_at && new Date(tenant.subscription_expires_at) < new Date() && (
                                                <Badge variant="destructive">Expired</Badge>
                                            )}
                                        </div>
                                        <p className="mt-1 text-muted-foreground">{currentPlan.description}</p>
                                        <div className="mt-2 text-3xl font-bold text-primary">
                                            {formatPrice(currentPlan.price, currentPlan.currency)}
                                            <span className="text-sm font-normal text-muted-foreground">
                                                /
                                                {currentPlan.billing_cycle === 'monthly'
                                                    ? 'month'
                                                    : currentPlan.billing_cycle === 'yearly'
                                                      ? 'year'
                                                      : 'quarter'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Dialog open={open} onOpenChange={setOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline">
                                                    <RefreshCw className="mr-2 h-4 w-4" />
                                                    Change Plan
                                                </Button>
                                            </DialogTrigger>

                                            <DialogContent className="w-full min-w-5xl">
                                                <DialogHeader className="flex flex-col items-center justify-center text-center">
                                                    <DialogTitle>Select a new plan</DialogTitle>
                                                    <DialogDescription>
                                                        Choose a plan that best fits your business needs. You can upgrade or downgrade anytime.
                                                    </DialogDescription>
                                                </DialogHeader>

                                                <div className="mt-6">
                                                    <PricingPlans
                                                        plans={plans}
                                                        currentPlanId={currentPlan?.id}
                                                        onPlanSelected={() => setOpen(false)} // close modal after selecting
                                                    />
                                                </div>
                                            </DialogContent>
                                        </Dialog>

                                        {tenant.subscription_expires_at && new Date(tenant.subscription_expires_at) < new Date() && (
                                            <Button
                                                onClick={() => {
                                                    axios
                                                        .post(route('payment.initialize'), {
                                                            plan_id: currentPlan.id,
                                                            tenant_id: tenant.id,
                                                        })
                                                        .then((response) => {
                                                            if (response.data.status && response.data.data.authorization_url) {
                                                                window.location.href = response.data.data.authorization_url;
                                                            } else {
                                                                alert('Payment initialization failed.');
                                                            }
                                                        })
                                                        .catch((error) => {
                                                            alert(error.response?.data?.message || 'Payment initialization failed.');
                                                        });
                                                }}
                                            >
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                Renew Plan
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Plan Features */}
                                <div className="border-t pt-4">
                                    <h4 className="mb-3 font-semibold">Plan Features</h4>
                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                        {currentPlan?.features?.map((feature, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
                                                <span className="text-sm">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Subscription Dates */}
                                {tenant.subscription_started_at && (
                                    <div className="grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-2">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Started on</p>
                                            <p className="font-medium">{new Date(tenant.subscription_started_at).toLocaleDateString()}</p>
                                        </div>
                                        {tenant.subscription_expires_at && (
                                            <div>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(tenant.subscription_expires_at) < new Date() ? 'Expired on' : 'Renews on'}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">{new Date(tenant.subscription_expires_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <p className="mb-4 text-muted-foreground">You don't have an active subscription</p>
                                <Button onClick={() => router.visit(route('onboarding.select-plan'))}>Choose a Plan</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Available Plans */}
                {currentPlan && availablePlans.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Available Plans</CardTitle>
                            <CardDescription>Upgrade or downgrade your subscription</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                {availablePlans
                                    .filter((plan) => plan.id !== currentPlan.id)
                                    .map((plan) => (
                                        <Card key={plan.id} className={plan.is_popular ? 'border-primary' : ''}>
                                            <CardHeader>
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                                                    {plan.is_popular && (
                                                        <Badge className="bg-primary text-xs">
                                                            <Zap className="mr-1 h-3 w-3" />
                                                            Popular
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-2xl font-bold text-primary">
                                                    {formatPrice(plan.price, plan.currency)}
                                                    <span className="text-sm font-normal text-muted-foreground">
                                                        /{plan.billing_cycle === 'monthly' ? 'mo' : plan.billing_cycle === 'yearly' ? 'yr' : 'qtr'}
                                                    </span>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                <p className="text-sm text-muted-foreground">{plan.description}</p>
                                                <Button
                                                    variant={plan.is_popular ? 'default' : 'outline'}
                                                    className="w-full"
                                                    onClick={() => handleChangePlan(plan.id)}
                                                >
                                                    {Number(plan.price) > Number(currentPlan.price) ? 'Upgrade' : 'Downgrade'}
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Payment History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payment History</CardTitle>
                        <CardDescription>Your recent transactions and invoices</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {paymentHistory && paymentHistory.length > 0 ? (
                            <div className="space-y-2">
                                {paymentHistory.map((payment, index) => (
                                    <div key={index} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                                        <div>
                                            <p className="font-medium">{payment.description}</p>
                                            <p className="text-sm text-muted-foreground">{new Date(payment.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="font-semibold">{formatPrice(payment.amount, payment.currency)}</p>
                                            <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>{payment.status}</Badge>
                                            <div className="flex -space-x-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setPreviewReceiptId(payment.id)}
                                                    title="Preview Receipt"
                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDownloadReceipt(payment.id)}
                                                    title="Download Receipt"
                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="py-8 text-center text-muted-foreground">No payment history available</p>
                        )}
                    </CardContent>
                </Card>

                {/* Cancel Subscription */}
                {currentPlan && (
                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="text-destructive">Danger Zone</CardTitle>
                            <CardDescription>Irreversible actions that affect your subscription</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Cancel Subscription</p>
                                    <p className="text-sm text-muted-foreground">
                                        You will lose access to all features at the end of your billing period
                                    </p>
                                </div>
                                <Button variant="destructive" onClick={handleCancelSubscription}>
                                    Cancel Subscription
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
            {/* Receipt Preview Modal */}
            <ReceiptPreviewModal isOpen={!!previewReceiptId} onClose={() => setPreviewReceiptId(null)} subscriptionId={previewReceiptId} />
        </AppLayout>
    );
}
