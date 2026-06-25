import { AnimatedList, AnimatedListItem } from '@/components/animations/animated-list';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/use-permissions';
import AdminLayout from '@/layouts/AdminLayout';
import { getImageUrl } from '@/lib/constants';
import { getTimeBasedGreeting } from '@/lib/greeting';
import { type BreadcrumbItem, type SuperAdminStats, type Tenant } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Activity, AlertTriangle, BarChart3, Building2, Calendar, DollarSign, Shield, TrendingUp, UserCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DashboardProps {
    stats?: SuperAdminStats;
    recentTenants?: Tenant[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Super Admin Dashboard',
        href: '/super-admin/dashboard',
    },
];

const SuperAdminDashboard = ({ stats, recentTenants }: DashboardProps) => {
    const auth = useAuth();
    const user = auth.user;

    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    const StatCard = ({
        title,
        value,
        description,
        icon: Icon,
        trend,
    }: {
        title: string;
        value: number;
        description: string;
        icon: any;
        trend?: string;
    }) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="mb-1 h-8 w-20" /> : <div className="text-2xl font-bold">{value.toLocaleString()}</div>}
                <p className="text-xs text-muted-foreground">{description}</p>
                {trend && (
                    <div className="flex items-center pt-1">
                        <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600">{trend}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'active':
                return 'default';
            case 'suspended':
                return 'destructive';
            case 'inactive':
                return 'secondary';
            default:
                return 'secondary';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'underwriter':
                return <Shield className="h-5 w-5 text-blue-500" />;
            case 'broker':
                return <Building2 className="h-5 w-5 text-green-500" />;
            default:
                return <Building2 className="h-5 w-5 text-gray-500" />;
        }
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Super Admin Dashboard" />

            <div className="space-y-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">{getTimeBasedGreeting()}, {user?.name} 👋</h1>
                        <p className="mt-1 text-muted-foreground">Here's what's happening with Insure Pal today.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                            <BarChart3 className="mr-2 h-4 w-4" />
                            View Analytics
                        </Button>
                        <Button variant="outline" size="sm">
                            <Activity className="mr-2 h-4 w-4" />
                            System Health
                        </Button>
                    </div>
                </div>

                <AnimatedList className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" staggerDelay={0.1}>
                    <AnimatedListItem>
                        <StatCard
                            title="Total Tenants"
                            value={stats?.total_tenants ?? 0}
                            description="All registered organizations"
                            icon={Building2}
                            trend="+12% from last month"
                        />
                    </AnimatedListItem>
                    <AnimatedListItem>
                        <StatCard
                            title="Active Tenants"
                            value={stats?.active_tenants ?? 0}
                            description="Currently subscribed"
                            icon={UserCheck}
                            trend="+8% from last month"
                        />
                    </AnimatedListItem>
                    <AnimatedListItem>
                        <StatCard
                            title="Total Users"
                            value={stats?.total_users ?? 0}
                            description="All platform users"
                            icon={Users}
                            trend="+15% from last month"
                        />
                    </AnimatedListItem>
                    <AnimatedListItem>
                        <StatCard
                            title="Total Customers"
                            value={stats?.total_customers ?? 0}
                            description="End-user customers"
                            icon={DollarSign}
                            trend="+18% from last month"
                        />
                    </AnimatedListItem>
                </AnimatedList>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Shield className="mr-2 h-5 w-5 text-blue-500" />
                                Underwriters
                            </CardTitle>
                            <CardDescription>Insurance underwriting companies</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-12 w-16" />
                            ) : (
                                <div className="text-3xl font-bold text-blue-600">{stats?.underwriters ?? 0}</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Building2 className="mr-2 h-5 w-5 text-green-500" />
                                Brokers
                            </CardTitle>
                            <CardDescription>Insurance brokerage firms</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-12 w-16" />
                            ) : (
                                <div className="text-3xl font-bold text-green-600">{stats?.brokers ?? 0}</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
                                Health Status
                            </CardTitle>
                            <CardDescription>System operational status</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-2">
                                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                <span className="text-sm font-medium">All Systems Operational</span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">99.9% uptime this month</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center">
                                <Calendar className="mr-2 h-5 w-5" />
                                Recent Tenants
                            </CardTitle>
                            <CardDescription>Latest organizations that joined the platform</CardDescription>
                        </div>
                        <Badge variant="secondary" className="font-mono">
                            {recentTenants?.length ?? 0} Total
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="space-y-4 p-6">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center space-x-4">
                                        <Skeleton className="h-10 w-10 rounded" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-48" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                        <Skeleton className="h-6 w-16" />
                                        <Skeleton className="h-6 w-16" />
                                    </div>
                                ))}
                            </div>
                        ) : recentTenants && recentTenants.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[60px] pl-6">#</TableHead>
                                        <TableHead className="w-[300px]">Tenant</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Users</TableHead>
                                        <TableHead className="pr-6 text-right">Date Created</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentTenants.map((tenant, index) => (
                                        <TableRow key={tenant.id} className="group transition-colors hover:bg-muted/30">
                                            <TableCell className="pl-6 font-medium text-muted-foreground">{index + 1}.</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 border shadow-sm">
                                                        <AvatarImage src={`${getImageUrl()}${tenant?.logo}`} />
                                                        <AvatarFallback className="bg-muted">
                                                            {getTypeIcon(tenant.type)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="leading-tight font-semibold">{tenant.name}</span>
                                                        <span className="text-xs text-muted-foreground">{tenant.email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {tenant.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusBadgeVariant(tenant.status)} className="capitalize">
                                                    {tenant.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{tenant.users?.length || 0}</span>
                                                    <span className="text-[10px] tracking-wider text-muted-foreground uppercase">Users</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="pr-6 text-right">
                                                <span className="text-sm text-muted-foreground">
                                                    {new Date(tenant.created_at).toLocaleDateString()}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="py-12 text-center">
                                <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <p className="text-muted-foreground">No recent tenants found</p>
                            </div>
                        )}

                        {!isLoading && recentTenants && recentTenants.length > 0 && (
                            <div className="flex items-center justify-between border-t px-6 py-4">
                                <p className="text-sm text-muted-foreground">
                                    Showing {recentTenants.length} of {recentTenants.length} recent tenants
                                </p>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={route('admin.tenants.index')}>View All Tenants</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Common administrative tasks</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                            <Button variant="outline" className="justify-start" asChild>
                                <Link href={route('admin.tenants.index')}>
                                    <Users className="mr-2 h-4 w-4" />
                                    Manage Tenants
                                </Link>
                            </Button>

                            <Button variant="outline" className="justify-start" asChild>
                                <Link href={route('admin.analytics')}>
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                    View Analytics
                                </Link>
                            </Button>
                            <Button variant="outline" className="justify-start" asChild>
                                <Link href={route('admin.reports.index')}>
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    Billing Reports
                                </Link>
                            </Button>
                            <Button variant="outline" className="justify-start">
                                <Activity className="mr-2 h-4 w-4" />
                                System Logs
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
};

export default SuperAdminDashboard;
