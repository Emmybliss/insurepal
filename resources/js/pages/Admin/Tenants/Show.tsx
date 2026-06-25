import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Tenant, type User } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import {
    Building2,
    Calendar,
    Clock,
    CreditCard,
    Download,
    Edit,
    Eye,
    EyeOff,
    FileText,
    Globe,
    KeyRound,
    Lock,
    Mail,
    MapPin,
    Phone,
    Settings,
    Shield,
    Trash2,
    User as UserIcon,
    Users,
    Wifi,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

// interface TenantActivity {
//     type: 'user_created' | 'policy_created' | 'quote_created' | 'payment_received';
//     description: string;
//     created_at: string;
// }

interface TenantUser {
    id: number;
    name: string;
    email: string;
}

interface TenantShowProps {
    tenant: Tenant & {
        users?: User[];
        customers?: Array<{
            id: number;
            name: string;
            email: string;
            type: string;
            created_at: string;
        }>;
        policies?: Array<{
            id: number;
            policy_number: string;
            status: string;
            premium_amount: number;
            created_at: string;
        }>;
        subscription?: {
            id: number;
            status: string;
            current_period_start: string;
            current_period_end: string;
            plan?: {
                name: string;
                price: number;
                currency: string;
            };
        };
    };
    stats: {
        total_users: number;
        active_users: number;
        total_customers: number;
        total_policies: number;
        active_policies: number;
        trial_days_remaining: number;
        account_age: string;
        subscription_status: string;
    };

    transactions: Array<{
        id: number;
        description: string;
        amount: number;
        currency: string;
        status: string;
        created_at: string;
    }>;
    tenantUsers: TenantUser[];
}

const breadcrumbs = (tenant: Tenant): BreadcrumbItem[] => [
    {
        title: 'Super Admin',
        href: route('admin.dashboard'),
    },
    {
        title: 'Tenants',
        href: route('admin.tenants.index'),
    },
    {
        title: tenant.name,
        href: route('admin.tenants.show', tenant.id),
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

const getTypeBadge = (type: string) => {
    switch (type?.toLowerCase()) {
        case 'underwriter':
            return <Badge className="border-blue-200 bg-blue-100 text-blue-800">Underwriter</Badge>;
        case 'broker':
            return <Badge className="border-purple-200 bg-purple-100 text-purple-800">Broker</Badge>;
        default:
            return <Badge variant="outline">{type || 'Unknown'}</Badge>;
    }
};

const getSubscriptionBadge = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'active':
            return <Badge className="border-green-200 bg-green-100 text-green-800">Active</Badge>;
        case 'trialing':
            return <Badge className="border-yellow-200 bg-yellow-100 text-yellow-800">Trial</Badge>;
        case 'canceled':
        case 'cancelled':
            return <Badge variant="destructive">Cancelled</Badge>;
        case 'past_due':
            return <Badge className="border-orange-200 bg-orange-100 text-orange-800">Past Due</Badge>;
        case 'unpaid':
            return <Badge variant="destructive">Unpaid</Badge>;
        default:
            return <Badge variant="outline">{status || 'None'}</Badge>;
    }
};

const isOnTrial = (tenant: Tenant) => {
    return tenant.trial_ends_at && new Date(tenant.trial_ends_at) > new Date();
};

const getTrialDaysRemaining = (tenant: Tenant) => {
    if (!tenant.trial_ends_at) return 0;
    const trialEnd = new Date(tenant.trial_ends_at);
    const today = new Date();
    const diffTime = trialEnd.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
};

const handleDelete = (tenant: Tenant) => {
    if (confirm(`Are you sure you want to delete "${tenant.name}"? This action cannot be undone.`)) {
        router.delete(route('admin.tenants.destroy', tenant.id), {
            onSuccess: () => {
                toast.success('Tenant deleted successfully');
            },
            onError: (errors) => {
                console.log('errors ', errors);
                toast.error('Failed to delete tenant');
            },
        });
    }
};

const handleToggleStatus = (tenant: Tenant) => {
    const action = tenant.status === 'active' ? 'deactivate' : 'activate';
    if (confirm(`Are you sure you want to ${action} "${tenant.name}"?`)) {
        router.post(
            route('admin.tenants.toggle-status', tenant.id),
            {},
            {
                onSuccess: () => {
                    toast.success(`Tenant ${action}d successfully`);
                },
                onError: () => {
                    toast.error(`Failed to ${action} tenant`);
                },
            },
        );
    }
};

export default function TenantShow({ tenant, stats, transactions, tenantUsers = [] }: TenantShowProps) {
    const initials =
        tenant.name
            ?.split(' ')
            .map((name) => name[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'T';

    // Password reset state
    const [showPwPanel, setShowPwPanel] = useState(false);
    const [pwData, setPwData] = useState({
        user_id: tenantUsers[0]?.id ? String(tenantUsers[0].id) : '',
        password: '',
        password_confirmation: '',
    });
    const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
    const [pwProcessing, setPwProcessing] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [showPwConfirm, setShowPwConfirm] = useState(false);

    const handlePasswordReset = (e: React.FormEvent) => {
        e.preventDefault();
        setPwProcessing(true);
        setPwErrors({});

        router.post(
            route('admin.tenants.reset-password', tenant.id),
            {
                password: pwData.password,
                password_confirmation: pwData.password_confirmation,
                user_id: pwData.user_id || null,
            },
            {
                onSuccess: () => {
                    setPwProcessing(false);
                    setPwData({ ...pwData, password: '', password_confirmation: '' });
                    setShowPwPanel(false);
                    toast.success('Password updated successfully');
                },
                onError: (errs) => {
                    setPwErrors(errs);
                    setPwProcessing(false);
                    toast.error('Failed to update password. Please check the form.');
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(tenant)}>
            <Head title={`${tenant.name} - Super Admin`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">{tenant.name}</h2>
                            <p className="text-muted-foreground">Tenant Details & Management</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('admin.tenants.edit', tenant.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                        <Button variant={tenant.status === 'active' ? 'destructive' : 'default'} size="sm" onClick={() => handleToggleStatus(tenant)}>
                            {tenant.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(tenant)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Tenant Overview */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Tenant Overview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-start space-x-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src={tenant.logo ? `/storage/${tenant.logo}` : ''} />
                                        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center space-x-3">
                                            <h3 className="text-xl font-semibold">{tenant.name}</h3>
                                            {getStatusBadge(tenant.status)}
                                            {getTypeBadge(tenant.type)}
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 text-sm text-muted-foreground md:grid-cols-2">
                                            <div className="flex items-center">
                                                <Mail className="mr-2 h-4 w-4" />
                                                {tenant.email}
                                            </div>
                                            {tenant.phone && (
                                                <div className="flex items-center">
                                                    <Phone className="mr-2 h-4 w-4" />
                                                    {tenant.phone}
                                                </div>
                                            )}
                                            <div className="flex items-center">
                                                <Calendar className="mr-2 h-4 w-4" />
                                                Created {new Date(tenant.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center">
                                                <Globe className="mr-2 h-4 w-4" />
                                                {tenant.slug}.test
                                            </div>
                                            {tenant.address && (
                                                <div className="flex items-start md:col-span-2">
                                                    <MapPin className="mt-0.5 mr-2 h-4 w-4" />
                                                    {tenant.address}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Stats Cards */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.total_users}</div>
                                    <p className="text-xs text-muted-foreground">{stats.active_users} active users</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.total_customers}</div>
                                    <p className="text-xs text-muted-foreground">Customer accounts</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.active_policies}</div>
                                    <p className="text-xs text-muted-foreground">of {stats.total_policies} total</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Tenant Users */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle>Tenant Users</CardTitle>
                                    <CardDescription>Manage users associated with this tenant</CardDescription>
                                </div>
                                <Button size="sm" asChild>
                                    <Link href={route('admin.users.create', { tenant_id: tenant.id })}>
                                        <Users className="mr-2 h-4 w-4" />
                                        Add User
                                    </Link>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {tenant.users && tenant.users.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Created</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {tenant.users.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell className="font-medium">{user.name}</TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize">
                                                            {user.role || 'User'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            {user.is_active ? (
                                                                <Badge className="bg-green-100 text-green-700">Active</Badge>
                                                            ) : (
                                                                <Badge variant="secondary">Inactive</Badge>
                                                            )}
                                                            {user.is_online ? (
                                                                <span className="flex items-center gap-1 text-[10px] text-green-600">
                                                                    <Wifi className="h-3 w-3" />
                                                                    Online now
                                                                </span>
                                                            ) : user.last_active_at ? (
                                                                <span className="flex items-center text-[10px] text-muted-foreground">
                                                                    <Clock className="mr-1 h-3 w-3" />
                                                                    Last active{' '}
                                                                    {formatDistanceToNow(new Date(user.last_active_at), {
                                                                        addSuffix: true,
                                                                    })}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" asChild title="Edit User">
                                                            <Link href={route('admin.users.edit', user.id)}>
                                                                <Edit className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <p className="py-4 text-center text-sm text-muted-foreground">No users found. Create one to get started.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Transaction History */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Transaction History</CardTitle>
                                <CardDescription>Recent billing and subscription payments</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {transactions && transactions.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transactions.slice(0, 10).map((transaction) => (
                                                <TableRow key={transaction.id}>
                                                    <TableCell className="font-medium">{transaction.description}</TableCell>
                                                    <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                                                    <TableCell>
                                                        {new Intl.NumberFormat('en-NG', {
                                                            style: 'currency',
                                                            currency: transaction.currency || 'NGN',
                                                            minimumFractionDigits: 0,
                                                        }).format(transaction.amount)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={transaction.status === 'paid' ? 'default' : 'secondary'}
                                                            className="capitalize"
                                                        >
                                                            {transaction.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            asChild
                                                            title="Download Receipt"
                                                            className="text-muted-foreground hover:text-foreground"
                                                        >
                                                            <a
                                                                href={route('admin.tenants.receipt', {
                                                                    tenant: tenant.id,
                                                                    subscriptionId: transaction.id,
                                                                })}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </a>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <p className="py-8 text-center text-muted-foreground">No transaction history available</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Trial & Subscription Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <CreditCard className="mr-2 h-5 w-5" />
                                    Subscription Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Status</span>
                                        {getSubscriptionBadge(stats.subscription_status)}
                                    </div>
                                </div>

                                {isOnTrial(tenant) && (
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Trial Days Left</span>
                                            <span className="text-sm font-bold text-orange-600">{getTrialDaysRemaining(tenant)} days</span>
                                        </div>
                                        <div className="mt-1 text-xs text-muted-foreground">
                                            Expires {new Date(tenant.trial_ends_at!).toLocaleDateString()}
                                        </div>
                                    </div>
                                )}

                                {tenant.subscription && (
                                    <div className="space-y-2">
                                        <Separator />
                                        <div>
                                            <div className="text-sm font-medium">Current Plan</div>
                                            <div className="text-sm text-muted-foreground">{tenant.subscription.plan?.name || 'Unknown Plan'}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium">Billing Period</div>
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(tenant.subscription.current_period_start).toLocaleDateString()} -{' '}
                                                {new Date(tenant.subscription.current_period_end).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Account Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Building2 className="mr-2 h-5 w-5" />
                                    Account Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <div className="text-sm font-medium">Account Age</div>
                                    <div className="text-sm text-muted-foreground">{stats.account_age}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium">Tenant Type</div>
                                    <div className="text-sm text-muted-foreground capitalize">{tenant.type}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium">Default Locale</div>
                                    <div className="text-sm text-muted-foreground">{tenant.default_locale || 'en'}</div>
                                </div>
                                {tenant.settings?.company_profile?.registration_number && (
                                    <div>
                                        <div className="text-sm font-medium">Registration Number</div>
                                        <div className="text-sm text-muted-foreground">{tenant.settings.company_profile.registration_number}</div>
                                    </div>
                                )}
                                {tenant.settings?.company_profile?.website && (
                                    <div>
                                        <div className="text-sm font-medium">Website</div>
                                        <div className="text-sm text-blue-600">
                                            <a
                                                href={tenant.settings.company_profile.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:underline"
                                            >
                                                {tenant.settings.company_profile.website}
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button variant="outline" size="sm" className="w-full justify-start">
                                    <Clock className="mr-2 h-4 w-4" />
                                    Extend Trial
                                </Button>
                                <Button variant="outline" size="sm" className="w-full justify-start">
                                    <Mail className="mr-2 h-4 w-4" />
                                    Send Email
                                </Button>
                                <Button variant="outline" size="sm" className="w-full justify-start">
                                    <FileText className="mr-2 h-4 w-4" />
                                    View Reports
                                </Button>
                                <Button variant="outline" size="sm" className="w-full justify-start">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Manage Settings
                                </Button>
                                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setShowPwPanel((v) => !v)}>
                                    <KeyRound className="mr-2 h-4 w-4" />
                                    {showPwPanel ? 'Hide Password Reset' : 'Reset Password'}
                                </Button>

                                {/* Inline password reset panel */}
                                {showPwPanel && (
                                    <div onSubmit={handlePasswordReset} className="space-y-3 rounded-lg border p-3">
                                        <p className="text-xs font-medium text-muted-foreground">Reset user password</p>

                                        {tenantUsers.length > 0 ? (
                                            <>
                                                <div className="space-y-1">
                                                    <label htmlFor="show_pw_user" className="text-xs font-medium">
                                                        User
                                                    </label>
                                                    <select
                                                        id="show_pw_user"
                                                        value={pwData.user_id}
                                                        onChange={(e) => setPwData({ ...pwData, user_id: e.target.value })}
                                                        className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                                    >
                                                        {tenantUsers.map((u) => (
                                                            <option key={u.id} value={String(u.id)}>
                                                                {u.name} ({u.email})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="space-y-1">
                                                    <label htmlFor="show_pw_pass" className="text-xs font-medium">
                                                        New Password
                                                    </label>
                                                    <div className="relative">
                                                        <Lock className="pointer-events-none absolute inset-y-0 left-2.5 my-auto h-3.5 w-3.5 text-muted-foreground" />
                                                        <input
                                                            id="show_pw_pass"
                                                            type={showPw ? 'text' : 'password'}
                                                            value={pwData.password}
                                                            onChange={(e) => setPwData({ ...pwData, password: e.target.value })}
                                                            placeholder="Min. 8 characters"
                                                            className={`flex h-8 w-full rounded-md border bg-transparent py-1 pr-8 pl-8 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none ${pwErrors.password ? 'border-red-500' : 'border-input'}`}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                                                            onClick={() => setShowPw((v) => !v)}
                                                            tabIndex={-1}
                                                        >
                                                            {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                                        </button>
                                                    </div>
                                                    {pwErrors.password && <p className="text-xs text-red-500">{pwErrors.password}</p>}
                                                </div>

                                                <div className="space-y-1">
                                                    <label htmlFor="show_pw_confirm" className="text-xs font-medium">
                                                        Confirm Password
                                                    </label>
                                                    <div className="relative">
                                                        <Lock className="pointer-events-none absolute inset-y-0 left-2.5 my-auto h-3.5 w-3.5 text-muted-foreground" />
                                                        <input
                                                            id="show_pw_confirm"
                                                            type={showPwConfirm ? 'text' : 'password'}
                                                            value={pwData.password_confirmation}
                                                            onChange={(e) => setPwData({ ...pwData, password_confirmation: e.target.value })}
                                                            placeholder="Re-enter password"
                                                            className={`flex h-8 w-full rounded-md border bg-transparent py-1 pr-8 pl-8 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none ${pwErrors.password_confirmation ? 'border-red-500' : 'border-input'}`}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                                                            onClick={() => setShowPwConfirm((v) => !v)}
                                                            tabIndex={-1}
                                                        >
                                                            {showPwConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                                        </button>
                                                    </div>
                                                    {pwErrors.password_confirmation && (
                                                        <p className="text-xs text-red-500">{pwErrors.password_confirmation}</p>
                                                    )}
                                                </div>

                                                <Button type="button" size="sm" disabled={pwProcessing} className="w-full">
                                                    <KeyRound className="mr-2 h-3.5 w-3.5" />
                                                    {pwProcessing ? 'Updating...' : 'Update Password'}
                                                </Button>
                                            </>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">No users found for this tenant.</p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
