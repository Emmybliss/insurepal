import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AdminLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle, CreditCard, Edit, Package, Star, Users, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Plan {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    setup_fee: number;
    currency: string;
    billing_cycle: string;
    features: string[];
    max_users: number | null;
    max_storage_gb: number | null;
    is_active: boolean;
    is_popular: boolean;
    sort_order: number;
    tenant_count: number;
    deleted_at: string | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Super Admin', href: route('admin.dashboard') },
    { title: 'Subscription Plans', href: route('admin.plans.index') },
];

function fmt(amount: number, currency = 'NGN') {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
    }).format(Number(amount));
}

export default function SubscriptionPlansIndex({ plans }: { plans: Plan[] }) {
    const [toggling, setToggling] = useState<number | null>(null);

    const handleToggle = (plan: Plan) => {
        setToggling(plan.id);
        router.post(
            route('admin.plans.toggle', plan.id),
            {},
            {
                onSuccess: () => {
                    toast.success(`Plan "${plan.name}" ${plan.is_active ? 'deactivated' : 'activated'}.`);
                    setToggling(null);
                },
                onError: () => {
                    toast.error('Failed to toggle plan status.');
                    setToggling(null);
                },
            },
        );
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Subscription Plans - Super Admin" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Subscription Plans</h2>
                        <p className="text-muted-foreground">Manage pricing, setup fees, and plan features</p>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid gap-4 md:grid-cols-3">
                    {plans.map((plan) => (
                        <Card key={plan.id} className={plan.is_popular ? 'border-primary ring-1 ring-primary' : ''}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Package className="h-4 w-4" />
                                        {plan.name}
                                        {plan.is_popular && (
                                            <Badge className="bg-primary text-xs text-white">
                                                <Star className="mr-1 h-3 w-3" />
                                                Popular
                                            </Badge>
                                        )}
                                    </CardTitle>
                                    {plan.is_active ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-red-500" />
                                    )}
                                </div>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <CreditCard className="h-3 w-3" />
                                        Monthly
                                    </div>
                                    <div className="font-semibold text-foreground">{fmt(plan.price, plan.currency)}</div>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <CreditCard className="h-3 w-3" />
                                        Setup Fee
                                    </div>
                                    <div className="font-semibold text-foreground">{fmt(plan.setup_fee ?? 0, plan.currency)}</div>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <Users className="h-3 w-3" />
                                        Tenants
                                    </div>
                                    <div className="font-semibold text-foreground">{plan.tenant_count}</div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={plan.is_active}
                                                    disabled={toggling === plan.id}
                                                    onCheckedChange={() => handleToggle(plan)}
                                                />
                                                <span className="text-sm text-muted-foreground">{plan.is_active ? 'Active' : 'Inactive'}</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>Toggle plan visibility on landing page</TooltipContent>
                                    </Tooltip>

                                    <Button size="sm" asChild>
                                        <Link href={route('admin.plans.edit', plan.id)}>
                                            <Edit className="mr-1 h-3 w-3" />
                                            Edit Plan
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Features overview table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Plan Features Overview</CardTitle>
                        <CardDescription>Features listed on each plan's card</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 md:grid-cols-3">
                            {plans.map((plan) => (
                                <div key={plan.id}>
                                    <h4 className="mb-3 font-semibold">{plan.name}</h4>
                                    <ul className="space-y-1">
                                        {(plan.features ?? []).map((f, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                <CheckCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-green-500" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
