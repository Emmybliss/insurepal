import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Tenant, type User } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import {
    AlertOctagon,
    AlertTriangle,
    Briefcase,
    Building2,
    Calendar,
    CheckCircle,
    CheckCircle2,
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
    RefreshCw,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
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
        data: (User & { tenant?: Tenant; approved_by_user?: { id: number; name: string } })[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats?: {
        total_users: number;
        total_tenants: number;
        active_tenants: number;
        total_tenant_users: number;
        total_customers: number;
        underwriters: number;
        brokers: number;
        super_admins: number;
        pending_verification: number;
        manually_approved: number;
        email_verified: number;
    };
    filters?: {
        search?: string;
        role?: string;
        tenant_id?: string;
        status?: string;
        verification_status?: string;
        approval_method?: string;
    };
    tenants?: Tenant[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Super Admin',
        href: route('admin.dashboard'),
    },
    {
        title: 'Users & Approval Management',
        href: route('admin.users.index'),
    },
];

export default function UsersIndex({ users, stats, filters, tenants }: UsersIndexProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Modal dialog states
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [showRevokeDialog, setShowRevokeDialog] = useState(false);
    const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
    const [showActivateDialog, setShowActivateDialog] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    // Filter states
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [roleFilter, setRoleFilter] = useState(filters?.role || 'all');
    const [tenantFilter, setTenantFilter] = useState(filters?.tenant_id || 'all');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
    const [verificationFilter, setVerificationFilter] = useState(filters?.verification_status || 'all');
    const [approvalMethodFilter, setApprovalMethodFilter] = useState(filters?.approval_method || 'all');

    // Multi-select bulk state
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [bulkAction, setBulkAction] = useState<string>('');
    const [showBulkModal, setShowBulkModal] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 400);
        return () => clearTimeout(timer);
    }, []);

    const handleSearch = (overrides?: Record<string, string>) => {
        router.get(
            route('admin.users.index'),
            {
                search: searchTerm,
                role: roleFilter !== 'all' ? roleFilter : undefined,
                tenant_id: tenantFilter !== 'all' ? tenantFilter : undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                verification_status: verificationFilter !== 'all' ? verificationFilter : undefined,
                approval_method: approvalMethodFilter !== 'all' ? approvalMethodFilter : undefined,
                ...overrides,
            },
            { preserveState: true },
        );
    };

    const handleQuickTab = (statusTab: string) => {
        setStatusFilter(statusTab);
        handleSearch({ status: statusTab !== 'all' ? statusTab : undefined });
    };

    const toggleSelectAll = () => {
        if (!users?.data) return;
        if (selectedUserIds.length === users.data.length) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(users.data.map((u) => u.id));
        }
    };

    const toggleSelectUser = (id: number) => {
        setSelectedUserIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    // Actions
    const confirmApprove = () => {
        if (selectedUser) {
            router.post(
                route('admin.users.force-verify-email', selectedUser.id),
                {},
                {
                    onSuccess: () => {
                        setShowApproveDialog(false);
                        setSelectedUser(null);
                    },
                },
            );
        }
    };

    const confirmReject = () => {
        if (selectedUser) {
            router.post(
                route('admin.users.reject', selectedUser.id),
                { reason: rejectReason },
                {
                    onSuccess: () => {
                        setShowRejectDialog(false);
                        setSelectedUser(null);
                        setRejectReason('');
                    },
                },
            );
        }
    };

    const confirmRevoke = () => {
        if (selectedUser) {
            router.post(
                route('admin.users.revoke-verification', selectedUser.id),
                {},
                {
                    onSuccess: () => {
                        setShowRevokeDialog(false);
                        setSelectedUser(null);
                    },
                },
            );
        }
    };

    const handleResendVerification = (user: User) => {
        router.post(route('admin.users.resend-verification', user.id));
    };

    const confirmToggleStatus = () => {
        if (selectedUser) {
            router.post(
                route('admin.users.toggle-status', selectedUser.id),
                {},
                {
                    onSuccess: () => {
                        setShowDeactivateDialog(false);
                        setShowActivateDialog(false);
                        setSelectedUser(null);
                    },
                },
            );
        }
    };

    const executeBulkAction = () => {
        if (selectedUserIds.length === 0 || !bulkAction) return;

        router.post(
            route('admin.users.bulk-action'),
            {
                action: bulkAction,
                user_ids: selectedUserIds,
            },
            {
                onSuccess: () => {
                    setSelectedUserIds([]);
                    setBulkAction('');
                    setShowBulkModal(false);
                },
            },
        );
    };

    const getStatusBadge = (user: User) => {
        const isVerified = !!user.email_verified_at;
        const status = user.status || (isVerified ? 'active' : 'pending_verification');

        switch (status) {
            case 'pending_verification':
                return (
                    <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                        <Clock className="mr-1 h-3 w-3 text-amber-500" />
                        Pending Verification
                    </Badge>
                );
            case 'active':
                return (
                    <Badge variant="outline" className="border-green-400 bg-green-50 text-green-800 dark:bg-green-950/50 dark:text-green-300">
                        <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />
                        Active
                    </Badge>
                );
            case 'suspended':
                return (
                    <Badge variant="outline" className="border-yellow-400 bg-yellow-50 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300">
                        <AlertTriangle className="mr-1 h-3 w-3 text-yellow-500" />
                        Suspended
                    </Badge>
                );
            case 'disabled':
                return (
                    <Badge variant="outline" className="border-red-400 bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300">
                        <XCircle className="mr-1 h-3 w-3 text-red-500" />
                        Disabled / Rejected
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getApprovalMethodBadge = (user: User) => {
        if (!user.email_verified_at) {
            return (
                <Badge variant="secondary" className="text-xs font-normal text-muted-foreground">
                    Unverified
                </Badge>
            );
        }

        if (user.approval_method === 'manual') {
            return (
                <Badge variant="default" className="border-purple-300 bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    Manual Admin
                </Badge>
            );
        }

        return (
            <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                <Mail className="mr-1 h-3 w-3" />
                Email Link
            </Badge>
        );
    };

    const getUserInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users & Verification Management - Super Admin" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">User Verification & Approval</h2>
                        <p className="text-muted-foreground">Manage user email verification, manual admin approvals, and status lifecycles.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button size="sm" asChild>
                            <Link href={route('admin.users.create')}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add New User
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card
                        className={`cursor-pointer transition-all hover:border-amber-300 ${statusFilter === 'pending_verification' ? 'border-amber-500 ring-2 ring-amber-500/20' : ''}`}
                        onClick={() => handleQuickTab('pending_verification')}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-semibold text-amber-800 dark:text-amber-300">Pending Verification</CardTitle>
                            <ShieldAlert className="h-5 w-5 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-amber-900 dark:text-amber-200">
                                {isLoading ? <Skeleton className="h-8 w-16" /> : (stats?.pending_verification ?? 0).toLocaleString()}
                            </div>
                            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">Awaiting link click or manual approval</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Manually Approved</CardTitle>
                            <ShieldCheck className="h-5 w-5 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : (stats?.manually_approved ?? 0).toLocaleString()}</div>
                            <p className="mt-1 text-xs text-muted-foreground">Approved via Super Admin override</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Email Verified</CardTitle>
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : (stats?.email_verified ?? 0).toLocaleString()}</div>
                            <p className="mt-1 text-xs text-muted-foreground">Verified automatically via email link</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Registered Users</CardTitle>
                            <UsersIcon className="h-5 w-5 text-slate-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : (stats?.total_users ?? 0).toLocaleString()}</div>
                            <p className="mt-1 text-xs text-muted-foreground">Super admins & tenant staff</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center text-base">
                            <Filter className="mr-2 h-4 w-4" />
                            Search & Filter Controls
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-6">
                            <div className="relative md:col-span-2">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="pl-9"
                                />
                            </div>

                            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Lifecycle Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending_verification">Pending Verification</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                    <SelectItem value="disabled">Disabled / Rejected</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={approvalMethodFilter} onValueChange={(val) => setApprovalMethodFilter(val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Approval Method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Methods</SelectItem>
                                    <SelectItem value="manual">Manual Admin</SelectItem>
                                    <SelectItem value="email">Email Link</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={tenantFilter} onValueChange={(val) => setTenantFilter(val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Tenant" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Tenants</SelectItem>
                                    <SelectItem value="none">Super Admin (No Tenant)</SelectItem>
                                    {tenants?.map((t) => (
                                        <SelectItem key={t.id} value={t.id.toString()}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button onClick={() => handleSearch()} className="w-full">
                                Apply Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Bulk Action Toolbar */}
                {selectedUserIds.length > 0 && (
                    <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-4 transition-all">
                        <div className="flex items-center space-x-2 text-sm font-medium">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                {selectedUserIds.length}
                            </span>
                            <span>users selected for bulk operation</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                size="sm"
                                variant="default"
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={() => {
                                    setBulkAction('verify_email');
                                    executeBulkAction();
                                }}
                            >
                                <ShieldCheck className="mr-1.5 h-4 w-4" />
                                Bulk Approve (Manual)
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    setBulkAction('resend_verification');
                                    executeBulkAction();
                                }}
                            >
                                <RefreshCw className="mr-1.5 h-4 w-4" />
                                Resend Verification
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setSelectedUserIds([])}>
                                Clear Selection
                            </Button>
                        </div>
                    </div>
                )}

                {/* Users List */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <div>
                            <CardTitle>Registered Users ({users?.total ?? 0})</CardTitle>
                            <CardDescription>
                                Showing page {users?.current_page ?? 1} of {users?.last_page ?? 1}
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                                ))}
                            </div>
                        ) : users?.data && users.data.length > 0 ? (
                            <div className="space-y-3">
                                {/* Table Header Bar */}
                                <div className="hidden grid-cols-12 gap-4 border-b pb-2 text-xs font-semibold text-muted-foreground md:grid">
                                    <div className="col-span-1 flex items-center">
                                        <Checkbox
                                            checked={selectedUserIds.length === users.data.length && users.data.length > 0}
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </div>
                                    <div className="col-span-4">User Info & Tenant</div>
                                    <div className="col-span-3">Status & Verification</div>
                                    <div className="col-span-2">Approval Details</div>
                                    <div className="col-span-2 text-right">Actions</div>
                                </div>

                                {users.data.map((user) => (
                                    <div
                                        key={user.id}
                                        className={`flex flex-col justify-between gap-3 rounded-lg border p-4 transition-all hover:bg-muted/40 md:grid md:grid-cols-12 md:items-center ${selectedUserIds.includes(user.id) ? 'border-primary/50 bg-primary/5' : ''}`}
                                    >
                                        {/* Checkbox & Avatar & Info */}
                                        <div className="col-span-1 flex items-center space-x-3">
                                            <Checkbox checked={selectedUserIds.includes(user.id)} onCheckedChange={() => toggleSelectUser(user.id)} />
                                        </div>

                                        <div className="col-span-4 flex items-center space-x-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={user.avatar} />
                                                <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <div className="flex items-center space-x-2">
                                                    <span className="truncate font-semibold text-foreground">{user.name}</span>
                                                    {user.role === 'super_admin' && <Crown className="h-3.5 w-3.5 text-purple-600" />}
                                                </div>
                                                <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                                                {user.tenant ? (
                                                    <div className="flex items-center text-xs text-slate-500">
                                                        <Building2 className="mr-1 h-3 w-3" />
                                                        {user.tenant.name}
                                                    </div>
                                                ) : (
                                                    <div className="text-xs font-medium text-purple-600">Super Admin Workspace</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status & Verification */}
                                        <div className="col-span-3 space-y-1">
                                            <div className="flex items-center gap-2">{getStatusBadge(user)}</div>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                Joined {new Date(user.created_at).toLocaleDateString()}
                                            </div>
                                        </div>

                                        {/* Approval Details */}
                                        <div className="col-span-2 space-y-1">
                                            <div>{getApprovalMethodBadge(user)}</div>
                                            {user.approved_by_user && (
                                                <div className="text-xs text-muted-foreground">By: {user.approved_by_user.name}</div>
                                            )}
                                            {user.last_verification_sent_at && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex items-center text-xs text-slate-500">
                                                            <Mail className="mr-1 h-3 w-3 text-slate-400" />
                                                            Sent {formatDistanceToNow(new Date(user.last_verification_sent_at), { addSuffix: true })}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Last verification email sent at {user.last_verification_sent_at}</TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>

                                        {/* Action Menu */}
                                        <div className="col-span-2 flex items-center justify-end space-x-2">
                                            {!user.email_verified_at && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300"
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setShowApproveDialog(true);
                                                    }}
                                                >
                                                    <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                                                    Approve
                                                </Button>
                                            )}

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={route('admin.users.show', user.id)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Full Details
                                                        </Link>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem asChild>
                                                        <Link href={route('admin.users.edit', user.id)}>
                                                            <PenBox className="mr-2 h-4 w-4" />
                                                            Edit Account
                                                        </Link>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator />

                                                    {!user.email_verified_at ? (
                                                        <>
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setSelectedUser(user);
                                                                    setShowApproveDialog(true);
                                                                }}
                                                            >
                                                                <ShieldCheck className="mr-2 h-4 w-4 text-purple-600" />
                                                                Manually Approve
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleResendVerification(user)}>
                                                                <RefreshCw className="mr-2 h-4 w-4 text-blue-600" />
                                                                Resend Verification Email
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setSelectedUser(user);
                                                                    setShowRejectDialog(true);
                                                                }}
                                                                className="text-amber-600"
                                                            >
                                                                <AlertOctagon className="mr-2 h-4 w-4" />
                                                                Reject Registration
                                                            </DropdownMenuItem>
                                                        </>
                                                    ) : (
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedUser(user);
                                                                setShowRevokeDialog(true);
                                                            }}
                                                            className="text-amber-600"
                                                        >
                                                            <RefreshCw className="mr-2 h-4 w-4" />
                                                            Revoke Verification
                                                        </DropdownMenuItem>
                                                    )}

                                                    <DropdownMenuSeparator />

                                                    {user.is_active ? (
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedUser(user);
                                                                setShowDeactivateDialog(true);
                                                            }}
                                                            className="text-red-600"
                                                        >
                                                            <UserX className="mr-2 h-4 w-4" />
                                                            Suspend Account
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedUser(user);
                                                                setShowActivateDialog(true);
                                                            }}
                                                            className="text-green-600"
                                                        >
                                                            <UserCheck className="mr-2 h-4 w-4" />
                                                            Activate Account
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
                                <ShieldAlert className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                                <h3 className="text-base font-semibold">No users found</h3>
                                <p className="mt-1 text-sm text-muted-foreground">No users match your selected filters.</p>
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setRoleFilter('all');
                                        setTenantFilter('all');
                                        setStatusFilter('all');
                                        setVerificationFilter('all');
                                        setApprovalMethodFilter('all');
                                        handleSearch({
                                            search: '',
                                            role: undefined,
                                            tenant_id: undefined,
                                            status: undefined,
                                            verification_status: undefined,
                                            approval_method: undefined,
                                        });
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        )}

                        {/* Pagination */}
                        {users && users.last_page > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-xs text-muted-foreground">
                                    Showing page {users.current_page} of {users.last_page} ({users.total} total)
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={users.current_page <= 1}
                                        onClick={() => router.get(route('admin.users.index', { page: users.current_page - 1 }))}
                                    >
                                        <ChevronLeft className="mr-1 h-4 w-4" />
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={users.current_page >= users.last_page}
                                        onClick={() => router.get(route('admin.users.index', { page: users.current_page + 1 }))}
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

            {/* Manual Approve Dialog */}
            <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                            <ShieldCheck className="h-5 w-5" />
                            Manually Approve User
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to manually approve <strong>{selectedUser?.name}</strong> ({selectedUser?.email})?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-md bg-purple-50 p-3 text-xs text-purple-900 dark:bg-purple-950/40 dark:text-purple-300">
                        This action will mark their email address as verified, set their status to Active, and record your Super Admin ID in the audit trail.
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={confirmApprove} className="bg-purple-600 hover:bg-purple-700 text-white">
                            Approve & Verify Account
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Registration Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                            <AlertOctagon className="h-5 w-5" />
                            Reject User Registration
                        </DialogTitle>
                        <DialogDescription>
                            Rejecting <strong>{selectedUser?.name}</strong> will disable their access to the platform.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <Label htmlFor="reason">Rejection Reason (Optional):</Label>
                        <Textarea
                            id="reason"
                            placeholder="Provide a reason for rejecting this user request..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={confirmReject} variant="destructive">
                            Reject User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Revoke Verification Dialog */}
            <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                            <RefreshCw className="h-5 w-5" />
                            Revoke User Verification
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to revoke verification for <strong>{selectedUser?.name}</strong>? Their status will return to Pending Verification.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRevokeDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={confirmRevoke} className="bg-amber-600 hover:bg-amber-700 text-white">
                            Revoke Verification
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Deactivate Dialog */}
            <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Suspend User Account</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to suspend access for <strong>{selectedUser?.name}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={confirmToggleStatus} variant="destructive">
                            Suspend Account
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Activate Dialog */}
            <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Activate User Account</DialogTitle>
                        <DialogDescription>
                            Restore access for <strong>{selectedUser?.name}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowActivateDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={confirmToggleStatus} className="bg-green-600 hover:bg-green-700 text-white">
                            Activate Account
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
