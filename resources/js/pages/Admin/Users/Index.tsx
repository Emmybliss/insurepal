import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Tenant, type User } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import {
    Briefcase,
    Building2,
    Calendar,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    Crown,
    Download,
    Eye,
    Filter,
    Mail,
    MoreHorizontal,
    PenBox,
    Phone,
    PlusCircle,
    Search,
    Shield,
    UserCheck,
    UserCog,
    User as UserIcon,
    Users as UsersIcon,
    UserX,
    Wifi,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface UsersIndexProps {
    users?: {
        data: (User & { tenant?: Tenant })[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats?: {
        total_users: number;
        active: number;
        super_admins: number;
        underwriters: number;
        brokers: number;
        staff: number;
        total_customers: number;
    };
    filters?: {
        search?: string;
        role?: string;
        tenant?: string;
        status?: string;
    };
    tenants?: Tenant[];
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
];

export default function UsersIndex({ users, stats, filters, tenants }: UsersIndexProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
    const [showActivateDialog, setShowActivateDialog] = useState(false);
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [roleFilter, setRoleFilter] = useState(filters?.role || 'all');
    const [tenantFilter, setTenantFilter] = useState(filters?.tenant || 'all');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 600);
        return () => clearTimeout(timer);
    }, []);

    const handleSearch = () => {
        router.get(
            route('admin.users.index'),
            {
                search: searchTerm,
                role: roleFilter !== 'all' ? roleFilter : undefined,
                tenant: tenantFilter !== 'all' ? tenantFilter : undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
            },
            { preserveState: true },
        );
    };

    const handleDeactivateUser = (user: User) => {
        setSelectedUser(user);
        setShowDeactivateDialog(true);
    };

    const handleActivateUser = (user: User) => {
        setSelectedUser(user);
        setShowActivateDialog(true);
    };

    const confirmDeactivate = () => {
        if (selectedUser) {
            router.post(
                route('admin.users.toggle-status', selectedUser.id),
                {},
                {
                    onSuccess: () => {
                        setShowDeactivateDialog(false);
                        setSelectedUser(null);
                    },
                },
            );
        }
    };

    const confirmActivate = () => {
        if (selectedUser) {
            router.post(
                route('admin.users.toggle-status', selectedUser.id),
                {},
                {
                    onSuccess: () => {
                        setShowActivateDialog(false);
                        setSelectedUser(null);
                    },
                },
            );
        }
    };

    const getRoleIcon = (role?: string) => {
        switch (role) {
            case 'super_admin':
                return <Crown className="h-4 w-4 text-purple-500" />;
            case 'underwriter':
                return <Shield className="h-4 w-4 text-blue-500" />;
            case 'broker':
                return <Briefcase className="h-4 w-4 text-green-500" />;
            case 'staff':
                return <UserCog className="h-4 w-4 text-orange-500" />;
            case 'customer':
                return <UserIcon className="h-4 w-4 text-gray-500" />;
            default:
                return <UserIcon className="h-4 w-4 text-gray-400" />;
        }
    };

    const getRoleBadgeVariant = (role?: string) => {
        switch (role) {
            case 'super_admin':
                return 'default';
            case 'underwriter':
                return 'secondary';
            case 'broker':
                return 'outline';
            default:
                return 'secondary';
        }
    };

    const getStatusIcon = (user: User) => {
        const isActive = user.is_active;

        return isActive ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />;
    };

    const getVerificationBadge = (user: User) => {
        const isVerified = !!user.email_verified_at;

        if (isVerified) {
            return (
                <Badge variant="secondary" className="border-green-200 bg-green-100 text-green-700">
                    Verified
                </Badge>
            );
        } else {
            return (
                <Badge variant="secondary" className="border-orange-200 bg-orange-100 text-orange-700">
                    Unverified
                </Badge>
            );
        }
    };

    const getUserInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

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
                {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{value.toLocaleString()}</div>}
                <p className="text-xs text-muted-foreground">{description}</p>
                {trend && <p className="mt-1 text-xs text-green-600">{trend}</p>}
            </CardContent>
        </Card>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users - Super Admin" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
                        <p className="text-muted-foreground">Manage all users across the platform</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Button size="sm" asChild>
                            <Link href={route('admin.users.create')}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add User
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Users"
                        value={stats?.total_users ?? 0}
                        description="All registered users"
                        icon={UsersIcon}
                        trend="+15% from last month"
                    />
                    <StatCard title="Super Admins" value={stats?.super_admins ?? 0} description="Platform administrators" icon={Crown} />
                    <StatCard
                        title="Tenant Users"
                        value={(stats?.underwriters ?? 0) + (stats?.brokers ?? 0) + (stats?.staff ?? 0)}
                        description="Underwriters, brokers & staff"
                        icon={Building2}
                        trend="+18% from last month"
                    />
                    <StatCard
                        title="Customers"
                        value={stats?.total_customers ?? 0}
                        description="End-user customers"
                        icon={UserIcon}
                        trend="+22% from last month"
                    />
                </div>

                {/* Filters and Search */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Filter className="mr-2 h-5 w-5" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-5">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                <Input
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="super_admin">Super Admin</SelectItem>
                                    <SelectItem value="underwriter">Underwriter</SelectItem>
                                    <SelectItem value="broker">Broker</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                    <SelectItem value="customer">Customer</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={tenantFilter} onValueChange={setTenantFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Tenant" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Tenants</SelectItem>
                                    <SelectItem value="none">No Tenant</SelectItem>
                                    {tenants?.map((tenant) => (
                                        <SelectItem key={tenant.id} value={tenant.id.toString()}>
                                            {tenant.name}
                                        </SelectItem>
                                    )) ?? []}
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="verified">Verified</SelectItem>
                                    <SelectItem value="unverified">Unverified</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleSearch} className="w-full">
                                Apply Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Users Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Users ({users?.total ?? 0})</CardTitle>
                        <CardDescription>
                            Showing {users?.data?.length ?? 0} of {users?.total ?? 0} users
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="flex items-center space-x-4">
                                            <Skeleton className="h-12 w-12 rounded-full" />
                                            <div>
                                                <Skeleton className="mb-2 h-4 w-32" />
                                                <Skeleton className="mb-1 h-3 w-24" />
                                                <Skeleton className="h-3 w-20" />
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Skeleton className="h-6 w-16" />
                                            <Skeleton className="h-6 w-20" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : users?.data && users.data.length > 0 ? (
                            <div className="space-y-4">
                                {users.data.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50">
                                        <div className="flex items-center space-x-4">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={user.avatar} />
                                                <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="mb-2 flex items-center space-x-3">
                                                    <h3 className="text-lg font-semibold">{user.name}</h3>
                                                    <Tooltip>
                                                        <TooltipTrigger>{getStatusIcon(user)}</TooltipTrigger>
                                                        <TooltipContent>{user.is_active ? 'Active account' : 'Inactive account'}</TooltipContent>
                                                    </Tooltip>

                                                    {user.role === 'super_admin' && (
                                                        <Badge variant="default" className="border-purple-200 bg-purple-100 text-purple-800">
                                                            <Crown className="mr-1 h-3 w-3" />
                                                            Super Admin
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground md:grid-cols-3">
                                                    <div className="flex items-center">
                                                        <Mail className="mr-1 h-3 w-3" />
                                                        {user.email}
                                                    </div>
                                                    {user.phone && (
                                                        <div className="flex items-center">
                                                            <Phone className="mr-1 h-3 w-3" />
                                                            {user.phone}
                                                        </div>
                                                    )}
                                                    {user.tenant && (
                                                        <div className="flex items-center">
                                                            <Building2 className="mr-1 h-3 w-3" />
                                                            {user.tenant.name}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center">
                                                        <Calendar className="mr-1 h-3 w-3" />
                                                        Joined {new Date(user.created_at).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center">
                                                        {user.is_online ? (
                                                            <>
                                                                <Wifi className="mr-1 h-3 w-3 text-green-500" />
                                                                <span className="font-medium text-green-600">Online now</span>
                                                            </>
                                                        ) : user.last_active_at ? (
                                                            <>
                                                                <Clock className="mr-1 h-3 w-3" />
                                                                Last seen{' '}
                                                                {formatDistanceToNow(new Date(user.last_active_at), { addSuffix: true })}
                                                            </>
                                                        ) : user.last_login_at ? (
                                                            <>
                                                                <Clock className="mr-1 h-3 w-3" />
                                                                Last seen{' '}
                                                                {formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true })}
                                                            </>
                                                        ) : null}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {' '}
                                                        <Tooltip>
                                                            <TooltipTrigger>{getVerificationBadge(user)}</TooltipTrigger>
                                                            <TooltipContent>
                                                                {user.is_active ? 'Verified Email' : 'Email not verified'}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className="text-right">
                                                <div className="mb-1 flex items-center justify-end space-x-1">
                                                    {getRoleIcon(user.role)}
                                                    <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs capitalize">
                                                        {user.role || 'User'}
                                                    </Badge>
                                                </div>
                                                {user.tenant && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {user.tenant.type}
                                                    </Badge>
                                                )}
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={route('admin.users.show', user.id)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={route('admin.users.edit', user.id)}>
                                                            <PenBox className="mr-2 h-4 w-4" />
                                                            Edit Details
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Mail className="mr-2 h-4 w-4" />
                                                        Send Email
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {user.is_active ? (
                                                        <DropdownMenuItem onClick={() => handleDeactivateUser(user)} className="text-red-600">
                                                            <UserX className="mr-2 h-4 w-4" />
                                                            Deactivate
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem onClick={() => handleActivateUser(user)} className="text-green-600">
                                                            <UserCheck className="mr-2 h-4 w-4" />
                                                            Activate
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center">
                                <UsersIcon className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                                <h3 className="mb-2 text-lg font-semibold">No users found</h3>
                                <p className="mb-4 text-muted-foreground">No users match your current filters.</p>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setRoleFilter('all');
                                        setTenantFilter('all');
                                        setStatusFilter('all');
                                        handleSearch();
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        )}

                        {/* Pagination */}
                        {users && users.last_page > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Showing {(users.current_page - 1) * users.per_page + 1} to{' '}
                                    {Math.min(users.current_page * users.per_page, users.total)} of {users.total} results
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="sm" disabled={users.current_page <= 1}>
                                        <ChevronLeft className="mr-1 h-4 w-4" />
                                        Previous
                                    </Button>
                                    <div className="flex items-center space-x-1">
                                        <span className="text-sm">{users.current_page}</span>
                                        <span className="text-sm text-muted-foreground">of</span>
                                        <span className="text-sm">{users.last_page}</span>
                                    </div>
                                    <Button variant="outline" size="sm" disabled={users.current_page >= users.last_page}>
                                        Next
                                        <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Deactivate Dialog */}
            <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Deactivate User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to deactivate "{selectedUser?.name}"? This will prevent them from accessing the platform.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={confirmDeactivate} className="bg-red-600 hover:bg-red-700">
                            Deactivate User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Activate Dialog */}
            <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Activate User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to activate "{selectedUser?.name}"? This will restore their access to the platform.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowActivateDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={confirmActivate} className="bg-green-600 hover:bg-green-700">
                            Activate User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
