import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Tenant, type User } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { Activity, Building2, Calendar, Clock, FileText, Mail, Phone, Shield, User as UserIcon, Users, Wifi } from 'lucide-react';

interface UserActivity {
    type: 'quote' | 'policy';
    description: string;
    created_at: string;
}

interface UserShowProps {
    user: User & {
        tenant?: Tenant & {
            customers?: Array<{
                id: number;
                name: string;
                created_at: string;
            }>;
        };
        roles?: Array<{
            id: number;
            name: string;
            permissions?: Array<{ name: string }>;
        }>;
    };
    stats: {
        total_customers: number;
        active_policies: number;
        total_quotes: number;
        last_login: string | null;
    };
    recentActivity: UserActivity[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Super Admin',
        href: route('admin.dashboard'),
    },
    {
        title: 'Users',
        href: route('admin.users.index'),
    },
    {
        title: 'User Details',
        href: '#',
    },
];

const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'active':
            return <Badge className="border-green-200 bg-green-100 text-green-800">Active</Badge>;
        case 'suspended':
            return <Badge variant="destructive">Suspended</Badge>;
        case 'inactive':
            return <Badge variant="secondary">Inactive</Badge>;
        default:
            return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
};

const getTenantTypeBadge = (type: string) => {
    switch (type?.toLowerCase()) {
        case 'underwriter':
            return <Badge className="border-blue-200 bg-blue-100 text-blue-800">Underwriter</Badge>;
        case 'broker':
            return <Badge className="border-purple-200 bg-purple-100 text-purple-800">Broker</Badge>;
        case 'customer':
            return <Badge className="border-gray-200 bg-gray-100 text-gray-800">Customer</Badge>;
        default:
            return <Badge variant="outline">{type || 'Unknown'}</Badge>;
    }
};

const getActivityIcon = (type: string) => {
    switch (type) {
        case 'quote':
            return <FileText className="h-4 w-4 text-blue-500" />;
        case 'policy':
            return <Shield className="h-4 w-4 text-green-500" />;
        default:
            return <Activity className="h-4 w-4 text-gray-500" />;
    }
};

export default function UserShow({ user, stats, recentActivity }: UserShowProps) {
    const initials =
        user.name
            ?.split(' ')
            .map((name) => name[0])
            .join('')
            .toUpperCase() || 'U';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${user.name} - User Details`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">User Details</h2>
                            <p className="text-muted-foreground">View user information and activity</p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* User Information */}
                    <div className="space-y-6 md:col-span-2">
                        {/* Basic Info Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <UserIcon className="mr-2 h-5 w-5" />
                                    User Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-start space-x-4">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src={user.avatar_url} alt={user.name} />
                                        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xl font-semibold">{user.name}</h3>
                                                {user.is_online ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                                        <Wifi className="h-3 w-3" />
                                                        Online
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                                                        <span className="h-2 w-2 rounded-full bg-gray-400" />
                                                        Offline
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                        </div>

                                        <div className="flex items-center space-x-4">
                                            {getStatusBadge(user.tenant?.status || 'active')}
                                            {user.tenant && getTenantTypeBadge(user.tenant.type)}
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                                            <div className="flex items-center">
                                                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                                                <span>{user.email}</span>
                                            </div>
                                            {user.phone && (
                                                <div className="flex items-center">
                                                    <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                                                    <span>{user.phone}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center">
                                                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                                <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                                            </div>
                                            {user.is_online ? (
                                                <div className="flex items-center">
                                                    <Wifi className="mr-2 h-4 w-4 text-green-500" />
                                                    <span className="text-green-600">Active now</span>
                                                </div>
                                            ) : user.last_active_at ? (
                                                <div className="flex items-center">
                                                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                                    <span>
                                                        Last active{' '}
                                                        {formatDistanceToNow(new Date(user.last_active_at), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            ) : stats.last_login ? (
                                                <div className="flex items-center">
                                                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                                    <span>Last login {stats.last_login}</span>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tenant Information */}
                        {user.tenant && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Building2 className="mr-2 h-5 w-5" />
                                        Tenant Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h4 className="font-medium">{user.tenant.name}</h4>
                                        <p className="text-sm text-muted-foreground">{user.tenant.email}</p>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        {getTenantTypeBadge(user.tenant.type)}
                                        {getStatusBadge(user.tenant.status)}
                                    </div>

                                    {user.tenant.address && <p className="text-sm">{user.tenant.address}</p>}

                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-sm text-muted-foreground">
                                            Tenant created {new Date(user.tenant.created_at).toLocaleDateString()}
                                        </span>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={route('admin.tenants.show', user.tenant.id)}>View Tenant Details</Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Roles & Permissions */}
                        {user.roles && user.roles.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Shield className="mr-2 h-5 w-5" />
                                        Roles & Permissions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {user.roles.map((role) => (
                                            <Badge key={role.id} variant="outline" className="capitalize">
                                                {role.name.replace('_', ' ')}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Recent Activity */}
                        {recentActivity.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Activity className="mr-2 h-5 w-5" />
                                        Recent Activity
                                    </CardTitle>
                                    <CardDescription>Recent quotes and policies from this user's tenant</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {recentActivity.slice(0, 5).map((activity, index) => (
                                            <div key={index} className="flex items-center space-x-3">
                                                {getActivityIcon(activity.type)}
                                                <div className="flex-1">
                                                    <p className="text-sm">{activity.description}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(activity.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Stats Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center text-base">
                                    <Users className="mr-2 h-4 w-4" />
                                    Quick Stats
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Customers</span>
                                    <span className="font-medium">{stats?.total_customers?.toLocaleString()}</span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Active Policies</span>
                                    <span className="font-medium">{stats?.active_policies?.toLocaleString()}</span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Total Quotes</span>
                                    <span className="font-medium">{stats?.total_quotes?.toLocaleString()}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Customers */}
                        {user.tenant?.customers && user.tenant.customers.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center text-base">
                                        <UserIcon className="mr-2 h-4 w-4" />
                                        Recent Customers
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {user.tenant.customers.map((customer) => (
                                        <div key={customer.id} className="flex items-center space-x-3">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">
                                                    {(customer.first_name || '') + ' ' + (customer.last_name || '')}{' '}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Added {new Date(customer.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
