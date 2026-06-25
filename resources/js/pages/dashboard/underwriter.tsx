import { PremiumChart, type PremiumTrendData } from '@/components/dashboard/premium-chart';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-permissions';
import useFlashToast from '@/hooks/useFlashToast';
import { useLang } from '@/hooks/useLang';
import { getTimeBasedGreeting } from '@/lib/greeting';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, Calendar, Clock, Eye, FileText, PlusCircle, Shield, TrendingUp, Users, XCircle } from 'lucide-react';

interface Stats {
    total_customers: number;
    total_quotes: number;
    total_policies: number;
    active_policies: number;
    monthly_premium: number;
    expiring_policies: number;
    expired_policies: number;
}

interface Quote {
    id: number;
    quote_number: string;
    customer: {
        id: number;
        first_name?: string;
        last_name?: string;
        company_name?: string;
        type: string;
    };
    insurance_product: {
        name: string;
        type: string;
    };
    status: string;
    premium_amount: number;
    valid_until: string;
}

interface Policy {
    id: number;
    policy_number: string;
    customer: {
        id: number;
        first_name?: string;
        last_name?: string;
        company_name?: string;
        type: string;
    };
    expiry_date: string;
    premium_amount: number;
    status: string;
}

interface Props {
    tenant: {
        name: string;
        type: string;
    };
    stats: Stats;
    premium_trends: {
        data: PremiumTrendData[];
        categories: { name: string; key: string }[];
    };
    recent_quotes: Quote[];
    expiring_policies: Policy[];
}

export default function UnderwriterDashboard({ tenant, stats, premium_trends, recent_quotes, expiring_policies }: Props) {
    useFlashToast();
    const { t } = useLang();

    const getCustomerName = (customer: Quote['customer'] | Policy['customer']) => {
        return customer.type === 'corporate' ? customer.company_name : `${customer.first_name} ${customer.last_name}`;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getPolicyStatus = (policy: Policy) => {
        if (policy.status && policy.status !== 'active' && policy.status !== 'expired') return policy.status;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiryDate = new Date(policy.expiry_date);
        expiryDate.setHours(0, 0, 0, 0);

        if (expiryDate < today) return 'expired';

        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 60) return 'expiring_soon';
        if (diffDays <= 90) return 'active';

        return 'active';
    };

    const policyStatusColors: Record<string, string> = {
        active: 'bg-green-100 text-green-800 hover:bg-green-100',
        expired: 'bg-red-100 text-red-800 hover:bg-red-100',
        expiring_soon: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
        cancelled: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
        suspended: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
        rejected: 'bg-red-100 text-red-800 hover:bg-red-100',
        approved: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
        pending_approval: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
        draft: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            draft: 'outline',
            sent: 'secondary',
            accepted: 'default',
            rejected: 'destructive',
            expired: 'destructive',
        };

        return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
    };

    const auth = useAuth();
    const user = auth.user;

    return (
        <AppLayout>
            <Head title="Underwriter Dashboard" />

            <div className="flex-1 space-y-4 pt-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight md:text-3xl">
                        {getTimeBasedGreeting()}, {user?.name} 👋
                    </h2>
                    <p className="text-muted-foreground">
                        {t("Here's what's happening with :company today.", { company: tenant?.name || 'your company' })}
                    </p>
                </div>

                {/* Key Metrics */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card
                        className="cursor-pointer bg-gradient-to-br from-primary/80 to-primary/60 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98]"
                        onClick={() => router.get(route('customers.index'))}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('Total Customers')}</CardTitle>
                            <Users className="h-4 w-4 text-muted" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_customers}</div>
                            <p className="text-xs text-muted">{t('Individual and corporate clients')}</p>
                        </CardContent>
                    </Card>

                    <Card
                        className="cursor-pointer bg-gradient-to-br from-blue-500/80 to-blue-500/60 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98]"
                        onClick={() => router.get(route('policy-management.index'), { status: 'active' })}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('Active Policies')}</CardTitle>
                            <Shield className="h-4 w-4 text-muted" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active_policies}</div>
                            <p className="text-xs text-muted">{t('Out of &{total} total policies', { total: stats.total_policies })}</p>
                        </CardContent>
                    </Card>

                    <Card
                        className="cursor-pointer bg-gradient-to-br from-green-500/80 to-green-500/60 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98]"
                        onClick={() => router.get(route('policy-management.index'), { status: 'active' })}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('Monthly Premiums')}</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.monthly_premium)}</div>
                            <p className="text-xs text-muted">{t('Active policy premiums')}</p>
                        </CardContent>
                    </Card>

                    <Card
                        className="cursor-pointer bg-gradient-to-br from-rose-500/80 to-rose-500/60 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98]"
                        onClick={() => router.get(route('policy-management.index'), { expiring_soon: 1 })}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('Expiring Policies')}</CardTitle>
                            <Clock className="h-4 w-4 text-muted" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.expiring_policies}</div>
                            <p className="text-xs text-muted">{t('Policies expiring in 60 days')}</p>
                        </CardContent>
                    </Card>

                    <Card
                        className="cursor-pointer bg-gradient-to-br from-red-600/80 to-red-600/60 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98]"
                        onClick={() => router.get(route('policy-management.index'), { status: 'expired' })}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('Expired Policies')}</CardTitle>
                            <XCircle className="h-4 w-4 text-muted" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.expired_policies}</div>
                            <p className="text-xs text-muted">{t('Policies past expiration')}</p>
                        </CardContent>
                    </Card>

                    <Card
                        className="cursor-pointer bg-gradient-to-br from-indigo-500/80 to-indigo-500/60 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98]"
                        onClick={() => router.get(route('quotes.index'), { status: 'pending' })}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('Total Quotes')}</CardTitle>
                            <FileText className="h-4 w-4 text-muted" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_quotes}</div>
                            <p className="text-xs text-muted">{t('All quotes')}</p>
                        </CardContent>
                    </Card>
                    <Card
                        className="cursor-pointer bg-gradient-to-br from-orange-500/80 to-orange-500/60 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98]"
                        onClick={() => router.get(route('quotes.index'), { status: 'pending' })}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('Pending Quotes')}</CardTitle>
                            <FileText className="h-4 w-4 text-muted" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_quotes}</div>
                            <p className="text-xs text-muted">{t('Awaiting customer response')}</p>
                        </CardContent>
                    </Card>
                </div>
                {/* Main Content Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Premium Chart - Takes 2 columns */}
                    <div className="lg:col-span-2">
                        <PremiumChart data={premium_trends} />
                    </div>

                    {/* Quick Actions */}
                    <QuickActions />
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Recent Quotes */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>{t('Recent Quotes')}</CardTitle>
                                    <CardDescription>{t('Latest quotes requiring attention')}</CardDescription>
                                </div>
                                <Link href={route('quotes.create')}>
                                    <Button size="sm">
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        {t('New Quote')}
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recent_quotes.length > 0 ? (
                                    recent_quotes.map((quote) => (
                                        <div key={quote.id} className="flex items-center justify-between rounded-lg border p-3">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <p className="font-medium">{quote.quote_number}</p>
                                                    {getStatusBadge(quote.status)}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {getCustomerName(quote.customer)} • {quote.insurance_product.name}
                                                </p>
                                                <p className="text-sm font-medium">{formatCurrency(quote.premium_amount)}</p>
                                            </div>
                                            <Link href={route('quotes.show', quote.id)}>
                                                <Button variant="outline" size="sm">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-4 text-center">
                                        <p className="text-muted-foreground">{t('No recent quotes')}</p>
                                        <Link href={route('quotes.create')}>
                                            <Button className="mt-2" size="sm">
                                                {t('Create Your First Quote')}
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Expiring Policies */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center">
                                        <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
                                        {t('Expiring Policies')}
                                    </CardTitle>
                                    <CardDescription>{t('Policies expiring in the next 60 days')}</CardDescription>
                                </div>
                                <Link href={route('policies.index', { filter: 'expiring' })}>
                                    <Button variant="outline" size="sm">
                                        {t('View All')}
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {expiring_policies.length > 0 ? (
                                    expiring_policies.map((policy) => (
                                        <div
                                            key={policy.id}
                                            className="flex items-center justify-between rounded-lg border bg-amber-50 p-3 dark:bg-amber-950/20"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <p className="font-medium">{policy.policy_number}</p>
                                                    {(() => {
                                                        const derivedStatus = getPolicyStatus(policy);
                                                        return (
                                                            <Badge
                                                                className={`${policyStatusColors[derivedStatus] || policyStatusColors[policy.status] || 'bg-gray-100'} text-xs`}
                                                            >
                                                                {derivedStatus.replace('_', ' ').toUpperCase()}
                                                            </Badge>
                                                        );
                                                    })()}
                                                    <Badge variant="outline" className="text-amber-600">
                                                        <Calendar className="mr-1 h-3 w-3" />
                                                        {new Date(policy.expiry_date).toLocaleDateString()}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{getCustomerName(policy.customer)}</p>
                                                <p className="text-sm font-medium">{formatCurrency(policy.premium_amount)}</p>
                                            </div>
                                            <Link href={route('policy-management.show', policy.id)}>
                                                <Button variant="outline" size="sm">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-4 text-center">
                                        <p className="text-muted-foreground">{t('No expiring policies')}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
