import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Activity, BarChart3, Building2, Download, FileText, PieChart, TrendingUp, UserCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MonthlyGrowthData {
    month: number;
    year: number;
    count: number;
}

interface SubscriptionBreakdown {
    active: number;
    inactive: number;
    suspended: number;
}

interface ReportsData {
    total_tenants: number;
    active_tenants: number;
    total_users: number;
    total_customers: number;
    monthly_growth: MonthlyGrowthData[];
    subscription_breakdown: SubscriptionBreakdown;
}

interface ReportsProps {
    reports: ReportsData;
}

export default function SuperAdminReports({ reports }: ReportsProps) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate loading state for better UX
        const timer = setTimeout(() => setIsLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    const StatCard = ({
        title,
        value,
        description,
        icon: Icon,
        color = 'default',
    }: {
        title: string;
        value: number;
        description: string;
        icon: any;
        color?: 'default' | 'success' | 'warning' | 'danger';
    }) => {
        const colorClasses = {
            default: 'text-muted-foreground',
            success: 'text-green-600',
            warning: 'text-yellow-600',
            danger: 'text-red-600',
        };

        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <Icon className={`h-4 w-4 ${colorClasses[color]}`} />
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Skeleton className="h-8 w-20" />
                    ) : (
                        <>
                            <div className="text-2xl font-bold">{value.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">{description}</p>
                        </>
                    )}
                </CardContent>
            </Card>
        );
    };

    const getMonthName = (month: number) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[month - 1];
    };

    const calculateGrowthRate = () => {
        if (!reports.monthly_growth || reports.monthly_growth.length < 2) return 0;

        const sortedData = [...reports.monthly_growth].sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });

        const current = sortedData[sortedData.length - 1];
        const previous = sortedData[sortedData.length - 2];

        if (previous.count === 0) return 100;
        return Math.round(((current.count - previous.count) / previous.count) * 100);
    };

    const totalSubscriptions =
        reports.subscription_breakdown.active + reports.subscription_breakdown.inactive + reports.subscription_breakdown.suspended;

    const activeRate = totalSubscriptions > 0 ? Math.round((reports.subscription_breakdown.active / totalSubscriptions) * 100) : 0;

    return (
        <AppLayout>
            <Head title="Super Admin Reports" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">System Reports</h1>
                        <p className="text-muted-foreground">Comprehensive analytics and reporting dashboard</p>
                    </div>
                    <div className="flex space-x-2">
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Export Reports
                        </Button>
                        <Button asChild>
                            <Link href={route('admin.analytics')}>
                                <BarChart3 className="mr-2 h-4 w-4" />
                                View Analytics
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Overview Stats */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Tenants"
                        value={reports.total_tenants}
                        description="Registered organizations"
                        icon={Building2}
                        color="default"
                    />
                    <StatCard
                        title="Active Tenants"
                        value={reports.active_tenants}
                        description={`${activeRate}% of total tenants`}
                        icon={UserCheck}
                        color="success"
                    />
                    <StatCard title="Total Users" value={reports.total_users} description="Platform users" icon={Users} color="default" />
                    <StatCard
                        title="Total Customers"
                        value={reports.total_customers}
                        description="End customers served"
                        icon={Activity}
                        color="default"
                    />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Monthly Growth Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Monthly Growth Trend
                            </CardTitle>
                            <CardDescription>Tenant registration growth over the last 12 months</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            ) : reports.monthly_growth && reports.monthly_growth.length > 0 ? (
                                <>
                                    <div className="mb-4">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-2xl font-bold text-green-600">
                                                {calculateGrowthRate() > 0 ? '+' : ''}
                                                {calculateGrowthRate()}%
                                            </span>
                                            <Badge variant={calculateGrowthRate() >= 0 ? 'default' : 'destructive'}>
                                                {calculateGrowthRate() >= 0 ? 'Growth' : 'Decline'}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">Month-over-month change</p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="grid grid-cols-3 gap-4 text-sm font-medium text-muted-foreground">
                                            <span>Period</span>
                                            <span>New Tenants</span>
                                            <span>Growth</span>
                                        </div>

                                        {reports.monthly_growth
                                            .sort((a, b) => {
                                                if (a.year !== b.year) return b.year - a.year;
                                                return b.month - a.month;
                                            })
                                            .slice(0, 6)
                                            .map((item, index) => {
                                                const prevItem = reports.monthly_growth[index + 1];
                                                const growth = prevItem
                                                    ? Math.round(((item.count - prevItem.count) / (prevItem.count || 1)) * 100)
                                                    : 0;

                                                return (
                                                    <div key={`${item.year}-${item.month}`} className="grid grid-cols-3 gap-4 text-sm">
                                                        <span className="font-medium">
                                                            {getMonthName(item.month)} {item.year}
                                                        </span>
                                                        <span>{item.count}</span>
                                                        <span className={growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                            {growth > 0 ? '+' : ''}
                                                            {growth}%
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </>
                            ) : (
                                <div className="py-8 text-center">
                                    <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                    <h3 className="mt-4 text-lg font-semibold">No Growth Data</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">Growth data will appear as tenants register</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Subscription Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PieChart className="h-5 w-5" />
                                Subscription Status
                            </CardTitle>
                            <CardDescription>Current distribution of tenant subscription statuses</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold">{totalSubscriptions}</div>
                                        <p className="text-sm text-muted-foreground">Total Subscriptions</p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                                <span className="text-sm font-medium">Active</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold">{reports.subscription_breakdown.active}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {totalSubscriptions > 0
                                                        ? Math.round((reports.subscription_breakdown.active / totalSubscriptions) * 100)
                                                        : 0}
                                                    %
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                                                <span className="text-sm font-medium">Inactive</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold">{reports.subscription_breakdown.inactive}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {totalSubscriptions > 0
                                                        ? Math.round((reports.subscription_breakdown.inactive / totalSubscriptions) * 100)
                                                        : 0}
                                                    %
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                                                <span className="text-sm font-medium">Suspended</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold">{reports.subscription_breakdown.suspended}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {totalSubscriptions > 0
                                                        ? Math.round((reports.subscription_breakdown.suspended / totalSubscriptions) * 100)
                                                        : 0}
                                                    %
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {reports.subscription_breakdown.suspended > 0 && (
                                        <div className="mt-4 rounded-lg bg-red-50 p-3">
                                            <div className="flex items-center space-x-2">
                                                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                                <span className="text-sm font-medium text-red-800">
                                                    {reports.subscription_breakdown.suspended} suspended accounts need attention
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Quick Actions
                        </CardTitle>
                        <CardDescription>Common reporting and management tasks</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
                                <Link href={route('admin.tenants.index')}>
                                    <Building2 className="h-6 w-6" />
                                    <span>Manage Tenants</span>
                                </Link>
                            </Button>

                            <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
                                <Link href={route('admin.users.index')}>
                                    <Users className="h-6 w-6" />
                                    <span>Manage Users</span>
                                </Link>
                            </Button>

                            <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
                                <Link href={route('admin.analytics')}>
                                    <BarChart3 className="h-6 w-6" />
                                    <span>View Analytics</span>
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* System Health */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            System Health Overview
                        </CardTitle>
                        <CardDescription>Key metrics for platform health monitoring</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{activeRate}%</div>
                                <p className="text-sm text-muted-foreground">Active Rate</p>
                            </div>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {reports.total_users > 0 ? Math.round(reports.total_customers / reports.total_users) : 0}
                                </div>
                                <p className="text-sm text-muted-foreground">Customers per User</p>
                            </div>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                    {reports.total_tenants > 0 ? Math.round(reports.total_users / reports.total_tenants) : 0}
                                </div>
                                <p className="text-sm text-muted-foreground">Users per Tenant</p>
                            </div>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">{calculateGrowthRate()}%</div>
                                <p className="text-sm text-muted-foreground">Growth Rate</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
