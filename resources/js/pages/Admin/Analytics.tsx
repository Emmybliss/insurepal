import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import AdminLayout from '@/layouts/AdminLayout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    Activity,
    BarChart3,
    Building2,
    Calendar,
    DollarSign,
    Download,
    Filter,
    RefreshCw,
    Shield,
    TrendingDown,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface AnalyticsData {
    revenue: {
        total: number;
        monthly: number;
        growth: number;
        trend: 'up' | 'down';
    };
    users: {
        total: number;
        active: number;
        new: number;
        churn: number;
    };
    tenants: {
        total: number;
        active: number;
        suspended: number;
        conversion: number;
    };
    policies: {
        total: number;
        active: number;
        expired: number;
        renewal_rate: number;
    };
    monthlyRevenue: Array<{
        month: string;
        revenue: number;
        growth: number;
    }>;
    tenantGrowth: Array<{
        month: string;
        underwriters: number;
        brokers: number;
    }>;
    topTenants: Array<{
        id: number;
        name: string;
        type: 'underwriter' | 'broker';
        revenue: number;
        policies: number;
        growth: number;
    }>;
}

interface AnalyticsProps {
    analytics?: AnalyticsData;
}

type Props = AnalyticsProps;

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Super Admin',
        href: route('admin.dashboard'),
    },
    {
        title: 'Analytics',
        href: route('admin.analytics'),
    },
];

export default function SuperAdminAnalytics(props: Props) {
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30d');
    const [refreshing, setRefreshing] = useState(false);

    const analytics = props.analytics || {
        revenue: { total: 0, monthly: 0, growth: 0, trend: 'up' as const },
        users: { total: 0, active: 0, new: 0, churn: 0 },
        tenants: { total: 0, active: 0, suspended: 0, conversion: 0 },
        policies: { total: 0, active: 0, expired: 0, renewal_rate: 0 },
        monthlyRevenue: [],
        tenantGrowth: [],
        topTenants: [],
    };

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        // Simulate refresh
        setTimeout(() => setRefreshing(false), 1000);
    };

    const MetricCard = ({
        title,
        value,
        subtitle,
        change,
        trend,
        icon: Icon,
        format = 'number',
    }: {
        title: string;
        value: number;
        subtitle: string;
        change: number;
        trend: 'up' | 'down';
        icon: any;
        format?: 'number' | 'currency' | 'percentage';
    }) => {
        const formatValue = (val: number) => {
            if (format === 'currency') {
                return new Intl.NumberFormat('en-NG', {
                    style: 'currency',
                    currency: 'NGN',
                    minimumFractionDigits: 0,
                }).format(val);
            }
            if (format === 'percentage') {
                return `${val}%`;
            }
            return val.toLocaleString();
        };

        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <>
                            <Skeleton className="mb-1 h-8 w-24" />
                            <Skeleton className="h-4 w-20" />
                        </>
                    ) : (
                        <>
                            <div className="text-2xl font-bold">{formatValue(value)}</div>
                            <div className="flex items-center text-xs text-muted-foreground">
                                <span className="mr-2">{subtitle}</span>
                                <div className={`flex items-center ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                    {trend === 'up' ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                                    <span>{Math.abs(change)}%</span>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Analytics - Super Admin" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
                        <p className="text-muted-foreground">Comprehensive platform metrics and insights</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7d">Last 7 days</SelectItem>
                                <SelectItem value="30d">Last 30 days</SelectItem>
                                <SelectItem value="90d">Last 90 days</SelectItem>
                                <SelectItem value="1y">Last year</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title="Total Revenue"
                        value={analytics.revenue.total}
                        subtitle="Monthly recurring"
                        change={analytics.revenue.growth}
                        trend={analytics.revenue.trend}
                        icon={DollarSign}
                        format="currency"
                    />
                    <MetricCard
                        title="Active Users"
                        value={analytics.users.active}
                        subtitle={`${analytics.users.new} new this month`}
                        change={15.2}
                        trend="up"
                        icon={Users}
                    />
                    <MetricCard
                        title="Active Tenants"
                        value={analytics.tenants.active}
                        subtitle={`${analytics.tenants.conversion}% conversion`}
                        change={8.1}
                        trend="up"
                        icon={Building2}
                    />
                    <MetricCard
                        title="Policy Renewal Rate"
                        value={analytics.policies.renewal_rate}
                        subtitle="Above industry avg"
                        change={2.4}
                        trend="up"
                        icon={Shield}
                        format="percentage"
                    />
                </div>

                {/* Charts */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Revenue Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue Trend</CardTitle>
                            <CardDescription>Monthly recurring revenue over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-80 w-full" />
                            ) : analytics.monthlyRevenue.length > 0 ? (
                                <div className="space-y-4">
                                    {analytics.monthlyRevenue.map((item) => (
                                        <div key={item.month} className="flex items-center justify-between">
                                            <span className="text-sm font-medium">{item.month}</span>
                                            <div className="flex items-center gap-4">
                                                <div className="h-2 w-48 overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className="h-full rounded-full bg-primary"
                                                        style={{
                                                            width: `${Math.min((item.revenue / Math.max(...analytics.monthlyRevenue.map((d) => d.revenue))) * 100, 100)}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="w-32 text-right text-sm font-medium">
                                                    {new Intl.NumberFormat('en-NG', {
                                                        style: 'currency',
                                                        currency: 'NGN',
                                                        minimumFractionDigits: 0,
                                                    }).format(item.revenue)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex h-80 items-center justify-center rounded-lg border">
                                    <div className="text-center">
                                        <BarChart3 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">No revenue data available</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tenant Growth */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tenant Growth</CardTitle>
                            <CardDescription>Underwriters vs Brokers over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-80 w-full" />
                            ) : analytics.tenantGrowth.length > 0 ? (
                                <div className="space-y-4">
                                    {analytics.tenantGrowth.map((item) => (
                                        <div key={item.month} className="flex items-center justify-between">
                                            <span className="text-sm font-medium">{item.month}</span>
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center">
                                                    <div className="mr-2 h-3 w-3 rounded bg-blue-500"></div>
                                                    <span className="text-sm">{item.underwriters} Underwriters</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className="mr-2 h-3 w-3 rounded bg-green-500"></div>
                                                    <span className="text-sm">{item.brokers} Brokers</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex h-80 items-center justify-center rounded-lg border">
                                    <div className="text-center">
                                        <TrendingUp className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">No tenant growth data available</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Top Performing Tenants */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Top Performing Tenants</CardTitle>
                            <CardDescription>Highest revenue generating organizations</CardDescription>
                        </div>
                        <Button variant="outline" size="sm">
                            <Filter className="mr-2 h-4 w-4" />
                            Filter
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <Skeleton className="h-10 w-10 rounded" />
                                            <div>
                                                <Skeleton className="mb-1 h-4 w-32" />
                                                <Skeleton className="h-3 w-20" />
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Skeleton className="mb-1 h-4 w-24" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {analytics.topTenants.map((tenant, index) => (
                                    <div key={tenant.id} className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                                                #{index + 1}
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                {tenant.type === 'underwriter' ? (
                                                    <Shield className="h-5 w-5 text-blue-500" />
                                                ) : (
                                                    <Building2 className="h-5 w-5 text-green-500" />
                                                )}
                                                <div>
                                                    <p className="font-medium">{tenant.name}</p>
                                                    <div className="flex items-center space-x-2">
                                                        <Badge variant="outline" className="text-xs capitalize">
                                                            {tenant.type}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">{tenant.policies} policies</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">
                                                {new Intl.NumberFormat('en-NG', {
                                                    style: 'currency',
                                                    currency: 'NGN',
                                                    minimumFractionDigits: 0,
                                                }).format(tenant.revenue)}
                                            </p>
                                            <div className={`flex items-center text-xs ${tenant.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {tenant.growth >= 0 ? (
                                                    <TrendingUp className="mr-1 h-3 w-3" />
                                                ) : (
                                                    <TrendingDown className="mr-1 h-3 w-3" />
                                                )}
                                                {Math.abs(tenant.growth)}%
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Additional Insights */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Activity className="mr-2 h-5 w-5" />
                                User Engagement
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm">Daily Active Users</span>
                                    <span className="text-sm font-medium">{isLoading ? <Skeleton className="h-4 w-12" /> : '2,845'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm">Avg Session Duration</span>
                                    <span className="text-sm font-medium">{isLoading ? <Skeleton className="h-4 w-12" /> : '24m'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm">User Retention (30d)</span>
                                    <span className="text-sm font-medium">{isLoading ? <Skeleton className="h-4 w-12" /> : '89%'}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Calendar className="mr-2 h-5 w-5" />
                                Policy Metrics
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm">Total Policies</span>
                                    <span className="text-sm font-medium">
                                        {isLoading ? <Skeleton className="h-4 w-12" /> : analytics.policies.total.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm">Expiring This Month</span>
                                    <span className="text-sm font-medium">{isLoading ? <Skeleton className="h-4 w-12" /> : '284'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm">Avg Policy Value</span>
                                    <span className="text-sm font-medium">{isLoading ? <Skeleton className="h-4 w-12" /> : '₦125K'}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <DollarSign className="mr-2 h-5 w-5" />
                                Financial Health
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm">MRR Growth</span>
                                    <span className="text-sm font-medium text-green-600">
                                        {isLoading ? <Skeleton className="h-4 w-12" /> : '+12.5%'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm">Customer LTV</span>
                                    <span className="text-sm font-medium">{isLoading ? <Skeleton className="h-4 w-12" /> : '₦450K'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm">Churn Rate</span>
                                    <span className="text-sm font-medium text-orange-600">
                                        {isLoading ? <Skeleton className="h-4 w-12" /> : '3.2%'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
