import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-permissions';
import { SubscriptionPlan } from '@/types';
import { Link, router } from '@inertiajs/react';
import { CheckCircle, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { useState } from 'react';

interface PricingPlansProps {
    plans: SubscriptionPlan[];
    onPlanSelected?: () => void;
    currentPlanId?: number | null;
}

export function PricingPlans({ plans, currentPlanId }: PricingPlansProps) {
    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
    const [expandedPlanIds, setExpandedPlanIds] = useState<Record<number, boolean>>({});
    const { user } = useAuth();

    const FEATURE_LIMIT = 5;

    const formatPrice = (price: number, currency: string) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
        }).format(price);
    };

    const toggleExpand = (planId: number) => {
        setExpandedPlanIds((prev) => ({
            ...prev,
            [planId]: !prev[planId],
        }));
    };

    /**
     * Annual price = 10 × monthly price  (i.e. 2 months FREE, ~16.67% off).
     * If the plan already stores an annual price we use that; otherwise we derive it.
     */
    const getDisplayPrice = (plan: SubscriptionPlan) => {
        if (billingCycle === 'annual') {
            return plan.price * 10; // pay 10 months, get 12
        }
        return plan.price;
    };

    const getAnnualSavings = (plan: SubscriptionPlan) => {
        const monthlyCost = plan.price * 12;
        const annualCost = plan.price * 10;
        return monthlyCost - annualCost; // always 2 × monthly price
    };

    const handleSelectPlan = (planId: number) => {
        setSelectedPlanId(planId);
        setIsProcessing(true);

        router.post(
            route('subscription.initialize'),
            { plan_id: planId, billing_cycle: billingCycle },
            {
                onFinish: () => setIsProcessing(false),
                onError: () => setIsProcessing(false),
            },
        );
    };

    const isCurrentPlan = (planId: number) => currentPlanId === planId;

    return (
        <div className="space-y-10">
            {/* ── Billing toggle ── */}
            <div className="flex flex-col items-center gap-3">
                <div className="inline-flex items-center rounded-full border bg-muted p-1 shadow-inner">
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
                            billingCycle === 'monthly' ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle('annual')}
                        className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
                            billingCycle === 'annual' ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Annual
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900 dark:text-green-300">
                            2 months FREE
                        </span>
                    </button>
                </div>

                {billingCycle === 'annual' && (
                    <p className="text-sm text-muted-foreground">
                        You pay for <strong>10 months</strong> and get <strong>12 months</strong> of access — saving&nbsp;
                        <strong className="text-green-600 dark:text-green-400">~16.67%</strong> compared to monthly billing.
                    </p>
                )}
            </div>

            {/* ── Plan cards ── */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {plans?.map((plan) => {
                    const isExpanded = !!expandedPlanIds[plan.id];
                    const hasMoreFeatures = (plan.features?.length ?? 0) > FEATURE_LIMIT;
                    const visibleFeatures = isExpanded ? plan.features : plan.features?.slice(0, FEATURE_LIMIT);

                    return (
                        <Card
                            key={plan.id}
                            className={`relative flex flex-col ${plan.is_popular ? 'ring-2 shadow-primary ring-primary' : ''} ${isCurrentPlan(plan.id) ? 'border-green-500 ring-2 ring-green-500' : ''}`}
                        >
                            {plan.is_popular && !isCurrentPlan(plan.id) && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                                    <Badge className="bg-primary text-primary-foreground">
                                        <Zap className="mr-1 h-3 w-3" />
                                        Most Popular
                                    </Badge>
                                </div>
                            )}
                            {isCurrentPlan(plan.id) && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                                    <Badge className="bg-green-600 text-white">
                                        <CheckCircle className="mr-1 h-3 w-3" />
                                        Current Plan
                                    </Badge>
                                </div>
                            )}

                            <CardHeader className="text-center">
                                <CardTitle className="text-2xl">{plan.name}</CardTitle>

                                {/* Price display */}
                                <div className="mt-2">
                                    <div className="text-4xl font-bold text-primary">
                                        {formatPrice(getDisplayPrice(plan), plan.currency)}
                                        <span className="ml-1 text-lg text-muted-foreground">
                                            /{billingCycle === 'annual' ? 'year' : plan.billing_cycle}
                                        </span>
                                    </div>

                                    {billingCycle === 'annual' && (
                                        <div className="mt-2 space-y-1">
                                            {/* Per-month equivalent */}
                                            <p className="text-sm text-muted-foreground">
                                                {formatPrice(getDisplayPrice(plan) / 12, plan.currency)}/mo · billed annually
                                            </p>

                                            {/* Savings callout */}
                                            <div className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 dark:bg-green-900">
                                                <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                                <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                                                    Save {formatPrice(getAnnualSavings(plan), plan.currency)} (2 months free)
                                                </span>
                                            </div>

                                            {/* Strikethrough full monthly cost */}
                                            <p className="text-xs text-muted-foreground line-through">
                                                {formatPrice(plan.price * 12, plan.currency)}/year without discount
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <CardDescription className="mt-2">{plan.description}</CardDescription>
                            </CardHeader>

                            <CardContent className="flex-grow space-y-4">
                                <div className="space-y-3">
                                    {visibleFeatures?.map((feature, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <CheckCircle className="text-success mt-0.5 h-5 w-5 flex-shrink-0" />
                                            <span className="text-sm text-foreground">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                {hasMoreFeatures && (
                                    <button
                                        onClick={() => toggleExpand(plan.id)}
                                        className="group flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                                    >
                                        {isExpanded ? (
                                            <>
                                                Show less <ChevronUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                                            </>
                                        ) : (
                                            <>
                                                View all features <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                                            </>
                                        )}
                                    </button>
                                )}

                                {/* Limits */}
                                <div className="space-y-2 border-t pt-4">
                                    {plan.max_users !== null && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Users:</span>
                                            <span className="font-semibold">Up to {plan.max_users}</span>
                                        </div>
                                    )}
                                    {plan.max_policies !== null && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Policies:</span>
                                            <span className="font-semibold">Up to {plan.max_policies}</span>
                                        </div>
                                    )}
                                    {plan.max_storage_gb !== null && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Storage:</span>
                                            <span className="font-semibold">{plan.max_storage_gb}GB</span>
                                        </div>
                                    )}
                                    {plan.max_users === null && (
                                        <div className="text-center text-sm font-semibold text-primary">✨ Unlimited Users</div>
                                    )}
                                </div>
                            </CardContent>

                            <CardFooter className="pt-2">
                                {user ? (
                                    <Button
                                        variant={isCurrentPlan(plan.id) ? 'secondary' : plan.is_popular ? 'default' : 'outline'}
                                        onClick={() => handleSelectPlan(plan.id)}
                                        disabled={isProcessing || isCurrentPlan(plan.id)}
                                        className="w-full"
                                        size="lg"
                                    >
                                        {isCurrentPlan(plan.id) ? (
                                            <>Selected (Active)</>
                                        ) : isProcessing && selectedPlanId === plan.id ? (
                                            <>Processing...</>
                                        ) : (
                                            <>{billingCycle === 'annual' ? 'Start Annual Plan' : `Select ${plan.name}`}</>
                                        )}
                                    </Button>
                                ) : (
                                    <Button asChild className="w-full" size="lg">
                                        <Link href={route('register')}>Get Started</Link>
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
