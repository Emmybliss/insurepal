import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AdminLayout from '@/layouts/app-layout';
import { getImageUrl } from '@/lib/constants';
import { type BreadcrumbItem, type Tenant } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Briefcase,
    Building2,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    CreditCard,
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
    Wifi,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface TenantsIndexProps {
    tenants?: {
        data: Tenant[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats?: {
        total_tenants: number;
        active_tenants: number;
        underwriters: number;
        brokers: number;
        on_trial: number;
        with_subscription: number;
    };
    filters?: {
        search?: string;
        type?: string;
        status?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Super Admin',
        href: route('admin.dashboard'),
    },
    {
        title: 'Tenants',
        href: route('admin.tenants.index'),
    },
];

export default function TenantsIndex({ tenants, stats, filters }: TenantsIndexProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
    const [showActivateDialog, setShowActivateDialog] = useState(false);
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [typeFilter, setTypeFilter] = useState(filters?.type || 'all');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
    console.log(tenants?.data);
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 600);
        return () => clearTimeout(timer);
    }, []);

    const handleSearch = () => {
        router.get(
            route('admin.tenants.index'),
            {
                search: searchTerm,
                type: typeFilter !== 'all' ? typeFilter : undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
            },
            { preserveState: true },
        );
    };

    const handleDeactivateTenant = (tenant: Tenant) => {
        setSelectedTenant(tenant);
        setShowDeactivateDialog(true);
    };

    const handleActivateTenant = (tenant: Tenant) => {
        setSelectedTenant(tenant);
        setShowActivateDialog(true);
    };

    const confirmDeactivate = () => {
        if (selectedTenant) {
            router.post(
                route('admin.tenants.toggle-status', selectedTenant.id),
                {},
                {
                    onSuccess: () => {
                        setShowDeactivateDialog(false);
                        setSelectedTenant(null);
                        toast.success('Tenant deactivated successfully');
                    },
                    onError: () => {
                        toast.error('Failed to deactivate tenant');
                    },
                },
            );
        }
    };

    const confirmActivate = () => {
        if (selectedTenant) {
            router.post(
                route('admin.tenants.toggle-status', selectedTenant.id),
                {},
                {
                    onSuccess: () => {
                        setShowActivateDialog(false);
                        setSelectedTenant(null);
                        toast.success('Tenant activated successfully');
                    },
                    onError: () => {
                        toast.error('Failed to activate tenant');
                    },
                },
            );
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'underwriter':
                return <Shield className="h-4 w-4 text-blue-500" />;
            case 'broker':
                return <Briefcase className="h-4 w-4 text-green-500" />;
            default:
                return <Building2 className="h-4 w-4 text-gray-500" />;
        }
    };

    const getTypeBadgeVariant = (type: string) => {
        switch (type) {
            case 'underwriter':
                return 'default';
            case 'broker':
                return 'secondary';
            default:
                return 'outline';
        }
    };

    const getStatusIcon = (tenant: Tenant) => {
        switch (tenant.status) {
            case 'active':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'inactive':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'suspended':
                return <AlertTriangle className="h-4 w-4 text-orange-500" />;
            default:
                return <XCircle className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusBadge = (tenant: Tenant) => {
        switch (tenant.status) {
            case 'active':
                return <Badge className="border-green-200 bg-green-100 text-green-700">Active</Badge>;
            case 'inactive':
                return <Badge variant="destructive">Inactive</Badge>;
            case 'suspended':
                return <Badge className="border-orange-200 bg-orange-100 text-orange-700">Suspended</Badge>;
            default:
                return <Badge variant="secondary">Unknown</Badge>;
        }
    };

    const getTenantInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
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
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Tenants - Super Admin" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Tenant Management</h2>
                        <p className="text-muted-foreground">Manage all tenants across the platform</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Button size="sm" asChild>
                            <Link href={route('admin.tenants.create')}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Tenant
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                    <StatCard
                        title="Total Tenants"
                        value={stats?.total_tenants ?? 0}
                        description="All registered tenants"
                        icon={Building2}
                        trend="+12% from last month"
                    />
                    <StatCard
                        title="Active Tenants"
                        value={stats?.active_tenants ?? 0}
                        description="Currently active"
                        icon={CheckCircle}
                        trend="+8% from last month"
                    />
                    <StatCard title="Underwriters" value={stats?.underwriters ?? 0} description="Insurance providers" icon={Shield} />
                    <StatCard title="Brokers" value={stats?.brokers ?? 0} description="Insurance brokers" icon={Briefcase} />
                    <StatCard
                        title="On Trial"
                        value={stats?.on_trial ?? 0}
                        description="Trial period active"
                        icon={Clock}
                        trend="+15% from last month"
                    />
                    <StatCard
                        title="With Subscription"
                        value={stats?.with_subscription ?? 0}
                        description="Paid subscriptions"
                        icon={CreditCard}
                        trend="+20% from last month"
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Filter className="mr-2 h-5 w-5" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                <Input
                                    placeholder="Search tenants..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="underwriter">Underwriter</SelectItem>
                                    <SelectItem value="broker">Broker</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleSearch} className="w-full">
                                Apply Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div className="space-y-1">
                            <CardTitle>All Tenants</CardTitle>
                            <CardDescription>A list of all tenants including their contact info, type, and status.</CardDescription>
                        </div>
                        <Badge variant="secondary" className="font-mono">
                            {tenants?.total ?? 0} Total
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="space-y-4 p-6">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center space-x-4">
                                        <Skeleton className="h-12 w-12 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-48" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                        <Skeleton className="h-6 w-16" />
                                        <Skeleton className="h-6 w-16" />
                                    </div>
                                ))}
                            </div>
                        ) : tenants?.data && tenants.data.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[60px] pl-6">#</TableHead>
                                        <TableHead className="w-[300px]">Tenant</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Users</TableHead>
                                        <TableHead>Date Created</TableHead>
                                        <TableHead className="pr-6 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tenants.data.map((tenant, index) => {
                                        const serialNumber = (tenants.current_page - 1) * tenants.per_page + index + 1;
                                        return (
                                            <TableRow key={tenant.id} className="group transition-colors hover:bg-muted/30">
                                                <TableCell className="pl-6 font-medium text-muted-foreground">{serialNumber}.</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10 border shadow-sm">
                                                            <AvatarImage src={`${getImageUrl()}${tenant?.logo}`} />
                                                            <AvatarFallback className="bg-primary/5 text-xs font-semibold text-primary">
                                                                {getTenantInitials(tenant.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="leading-tight font-semibold">{tenant.name}</span>
                                                                <Tooltip>
                                                                    <TooltipTrigger>{getStatusIcon(tenant)}</TooltipTrigger>
                                                                    <TooltipContent>{tenant.status} tenant</TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                            <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                                                                <span className="flex items-center">
                                                                    <Mail className="mr-1 h-3 w-3" />
                                                                    {tenant.email}
                                                                </span>
                                                                {tenant.phone && (
                                                                    <span className="flex items-center">
                                                                        <Phone className="mr-1 h-3 w-3" />
                                                                        {tenant.phone}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {getTypeIcon(tenant.type)}
                                                        <Badge variant={getTypeBadgeVariant(tenant.type)} className="capitalize">
                                                            {tenant.type}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(tenant)}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{tenant.users?.length || 0}</span>
                                                        <span className="text-[10px] tracking-wider text-muted-foreground uppercase">Users</span>
                                                        {tenant.users && tenant.users.filter((u) => u.is_online).length > 0 && (
                                                            <span className="mt-0.5 flex items-center gap-1 text-[10px] text-green-600">
                                                                <Wifi className="h-3 w-3" />
                                                                {tenant.users.filter((u) => u.is_online).length} online
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-sm text-muted-foreground">
                                                            {new Date(tenant.created_at).toLocaleDateString()}
                                                        </span>
                                                        {isOnTrial(tenant) && (
                                                            <span className="flex items-center text-xs text-orange-600">
                                                                <Clock className="mr-1 h-3 w-3" />
                                                                Trial: {getTrialDaysRemaining(tenant)} days left
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="pr-6 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={route('admin.tenants.show', tenant.id)}>
                                                                        <Eye className="mr-2 h-4 w-4" />
                                                                        View Details
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={route('admin.tenants.edit', tenant.id)}>
                                                                        <PenBox className="mr-2 h-4 w-4" />
                                                                        Edit Details
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem>
                                                                    <Mail className="mr-2 h-4 w-4" />
                                                                    Send Email
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                {tenant.status === 'active' ? (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDeactivateTenant(tenant)}
                                                                        className="text-red-600"
                                                                    >
                                                                        <XCircle className="mr-2 h-4 w-4" />
                                                                        Deactivate
                                                                    </DropdownMenuItem>
                                                                ) : (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleActivateTenant(tenant)}
                                                                        className="text-green-600"
                                                                    >
                                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                                        Activate
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="py-12 text-center">
                                <Building2 className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                                <h3 className="mb-2 text-lg font-semibold">No tenants found</h3>
                                <p className="mb-4 text-muted-foreground">No tenants match your current filters.</p>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setTypeFilter('all');
                                        setStatusFilter('all');
                                        handleSearch();
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        )}

                        {tenants && tenants.last_page > 1 && (
                            <div className="flex items-center justify-between border-t px-6 py-4">
                                <p className="text-sm text-muted-foreground">
                                    Showing {(tenants.current_page - 1) * tenants.per_page + 1} to{' '}
                                    {Math.min(tenants.current_page * tenants.per_page, tenants.total)} of {tenants.total} results
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={tenants.current_page <= 1}
                                        onClick={() =>
                                            router.get(
                                                route('admin.tenants.index'),
                                                { ...filters, page: tenants.current_page - 1 },
                                                { preserveState: true },
                                            )
                                        }
                                    >
                                        <ChevronLeft className="mr-1 h-4 w-4" />
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={tenants.current_page >= tenants.last_page}
                                        onClick={() =>
                                            router.get(
                                                route('admin.tenants.index'),
                                                { ...filters, page: tenants.current_page + 1 },
                                                { preserveState: true },
                                            )
                                        }
                                    >
                                        Next
                                        <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Deactivate Tenant</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to deactivate "{selectedTenant?.name}"? This will prevent them from accessing the platform.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={confirmDeactivate} className="bg-red-600 hover:bg-red-700">
                            Deactivate Tenant
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Activate Tenant</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to activate "{selectedTenant?.name}"? This will restore their access to the platform.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowActivateDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={confirmActivate} className="bg-green-600 hover:bg-green-700">
                            Activate Tenant
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
