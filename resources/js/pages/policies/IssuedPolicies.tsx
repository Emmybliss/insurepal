import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Head, Link, router } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Clock, FileText, Filter, MoreHorizontal, Plus, Search, XCircle } from 'lucide-react';
import React, { useState } from 'react';
// import { Pagination } from '@/components/pagination';
// import { Pagination } from '@/components/ui/pagination';
import { Pagination } from '@/components/pagination';
import { toast } from 'sonner';

interface Policy {
    id: number;
    policy_number: string;
    source_type: string;
    status: string;
    approval_status: string;
    customer: {
        name: string;
        email: string;
    };
    policy_product: {
        name: string;
    };
    premium_amount: number;
    total_amount: number;
    effective_date: string;
    expiry_date: string;
    created_at: string;
    status_label: string;
    approval_status_label: string;
    source_type_label: string;
}

interface Stats {
    total: number;
    active: number;
    pending: number;
    expired: number;
    expiring_soon: number;
}

interface Filters {
    search?: string;
    status?: string;
    approval_status?: string;
    expiring_soon?: boolean;
}

interface Props {
    policies: {
        data: Policy[];
        links: any[];
        meta: any;
    };
    stats: Stats;
    filters: Filters;
}

const sourceTypeColors: Record<string, string> = {
    DIRECT_ISSUANCE: 'bg-blue-100 text-blue-800',
    BROKER_RECORDED: 'bg-purple-100 text-purple-800',
    IMPORTED: 'bg-gray-100 text-gray-800',
    API: 'bg-green-100 text-green-800',
};

const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    pending_approval: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
    suspended: 'bg-orange-100 text-orange-800',
    rejected: 'bg-red-100 text-red-800',
    expiring_soon: 'bg-orange-100 text-orange-800',
};

const approvalStatusColors: Record<string, string> = {
    not_required: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
};
const statusIcons: Record<string, React.ReactNode> = {
    draft: <FileText className="h-4 w-4" />,
    pending_approval: <Clock className="h-4 w-4" />,
    approved: <CheckCircle className="h-4 w-4" />,
    active: <CheckCircle className="h-4 w-4" />,
    expired: <XCircle className="h-4 w-4" />,
    cancelled: <XCircle className="h-4 w-4" />,
    suspended: <AlertCircle className="h-4 w-4" />,
    rejected: <XCircle className="h-4 w-4" />,
    expiring_soon: <AlertCircle className="h-4 w-4" />,
};

const getPolicyStatus = (policy: Policy) => {
    if (policy.status !== 'active' && policy.status !== 'expired') return policy.status;

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

export default function IssuedPolicies({ policies, stats, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [approvalStatusFilter, setApprovalStatusFilter] = useState(filters.approval_status || '');
    const [expiringSoonFilter, setExpiringSoonFilter] = useState(!!filters.expiring_soon);

    const handleSearch = () => {
        router.get(
            route('policy-management.index'),
            {
                search: searchTerm,
                status: statusFilter,
                approval_status: approvalStatusFilter,
                expiring_soon: expiringSoonFilter ? 1 : 0,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };
    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setApprovalStatusFilter('');
        setExpiringSoonFilter(false);
        router.get(route('policy-management.index'));
    };

    const handleIssuePolicy = async (policyId: number) => {
        try {
            await router.post(
                route('policy-management.issue', policyId),
                {},
                {
                    onSuccess: () => {
                        toast.success('Policy issued successfully');
                    },
                    onError: (errors) => {
                        toast.error(errors.message || 'Failed to issue policy');
                    },
                },
            );
        } catch (error: any) {
            toast.error(error.message || 'An error occurred while issuing policy');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    console.log(stats);
    return (
        <AppSidebarLayout>
            <Head title="Issued Policies" />

            <div className="flex flex-1 flex-col space-y-8 p-8">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Issued Policies</h2>
                        <p className="text-muted-foreground">Manage and track all issued insurance policies</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        {(() => {
                            const tenantType = (window as any).__tenant_type__;
                            if (tenantType === 'broker') {
                                return (
                                    <Button asChild>
                                        <Link href={route('policy-management.record-placed')}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Record Placed Policy
                                        </Link>
                                    </Button>
                                );
                            }
                            return (
                                <Button asChild>
                                    <Link href={route('policy-management.create-direct')}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Issue New Policy
                                    </Link>
                                </Button>
                            );
                        })()}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-5">
                    <Card
                        className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${!statusFilter && !expiringSoonFilter ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}
                        onClick={() => {
                            setStatusFilter('');
                            setExpiringSoonFilter(false);
                            router.get(
                                route('policy-management.index'),
                                { search: searchTerm, status: '', approval_status: approvalStatusFilter, expiring_soon: 0 },
                                { preserveState: true, replace: true },
                            );
                        }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card
                        className={`cursor-pointer transition-colors hover:bg-green-50 dark:hover:bg-gray-700 ${statusFilter === 'active' && !expiringSoonFilter ? 'border-green-500 ring-1 ring-green-500' : ''}`}
                        onClick={() => {
                            setStatusFilter('active');
                            setExpiringSoonFilter(false);
                            router.get(
                                route('policy-management.index'),
                                { search: searchTerm, status: 'active', approval_status: approvalStatusFilter, expiring_soon: 0 },
                                { preserveState: true, replace: true },
                            );
                        }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active}</div>
                        </CardContent>
                    </Card>
                    <Card
                        className={`cursor-pointer transition-colors hover:bg-yellow-50 dark:hover:bg-gray-700 ${statusFilter === 'pending_approval' ? 'border-yellow-500 ring-1 ring-yellow-500' : ''}`}
                        onClick={() => {
                            setStatusFilter('pending_approval');
                            setExpiringSoonFilter(false);
                            router.get(
                                route('policy-management.index'),
                                { search: searchTerm, status: 'pending_approval', approval_status: approvalStatusFilter, expiring_soon: 0 },
                                { preserveState: true, replace: true },
                            );
                        }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pending}</div>
                        </CardContent>
                    </Card>
                    <Card
                        className={`cursor-pointer transition-colors hover:bg-orange-50 dark:hover:bg-gray-700 ${expiringSoonFilter ? 'border-orange-500 ring-1 ring-orange-500' : ''}`}
                        onClick={() => {
                            setExpiringSoonFilter(!expiringSoonFilter);
                            if (!expiringSoonFilter) setStatusFilter('active'); // Usually expiring implies active status
                            router.get(
                                route('policy-management.index'),
                                {
                                    search: searchTerm,
                                    status: !expiringSoonFilter ? 'active' : statusFilter,
                                    approval_status: approvalStatusFilter,
                                    expiring_soon: !expiringSoonFilter ? 1 : 0,
                                },
                                { preserveState: true, replace: true },
                            );
                        }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.expiring_soon}</div>
                            <p className="text-xs text-muted-foreground">Next 60 days</p>
                        </CardContent>
                    </Card>
                    <Card
                        className={`cursor-pointer transition-colors hover:bg-red-50 dark:hover:bg-gray-700 ${statusFilter === 'expired' ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                        onClick={() => {
                            setStatusFilter('expired');
                            setExpiringSoonFilter(false);
                            router.get(
                                route('policy-management.index'),
                                { search: searchTerm, status: 'expired', approval_status: approvalStatusFilter, expiring_soon: 0 },
                                { preserveState: true, replace: true },
                            );
                        }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Expired</CardTitle>
                            <XCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.expired}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="space-y-2">
                                <Label htmlFor="search">Search</Label>
                                <div className="relative">
                                    <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="search"
                                        placeholder="Policy number, customer..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8"
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="pending_approval">Pending Approval</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="expired">Expired</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                        <SelectItem value="suspended">Suspended</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Approval Status</Label>
                                <Select value={approvalStatusFilter} onValueChange={setApprovalStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select approval status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="not_required">Not Required</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end space-x-2">
                                <Button onClick={handleSearch} className="flex-1">
                                    Apply Filters
                                </Button>
                                <Button variant="outline" onClick={clearFilters}>
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Policies Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Policies</CardTitle>
                        <CardDescription>{policies?.meta?.total} policies found</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Policy Number</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Premium</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Approval</TableHead>
                                    <TableHead>Effective Date</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {policies.data.map((policy) => (
                                    <TableRow key={policy.id}>
                                        <TableCell className="font-medium">
                                            <Link href={route('policy-management.show', policy.id)} className="text-blue-600 hover:text-blue-800">
                                                {policy.policy_number}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={sourceTypeColors[policy.source_type] || 'bg-gray-100 text-gray-800'}>
                                                {policy.source_type_label || policy.source_type?.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{policy.customer.name}</div>
                                                <div className="text-sm text-muted-foreground">{policy.customer.email}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{policy?.policy_product?.name}</TableCell>
                                        <TableCell>{formatCurrency(policy.premium_amount)}</TableCell>
                                        <TableCell>
                                            {(() => {
                                                const derivedStatus = getPolicyStatus(policy);
                                                return (
                                                    <Badge
                                                        className={`${statusColors[derivedStatus] || statusColors[policy.status]} flex items-center gap-1`}
                                                    >
                                                        {statusIcons[derivedStatus] || statusIcons[policy.status]}
                                                        {derivedStatus.replace('_', ' ').toUpperCase()}
                                                    </Badge>
                                                );
                                            })()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={approvalStatusColors[policy.approval_status]}>{policy.approval_status}</Badge>
                                        </TableCell>
                                        <TableCell>{formatDate(policy.effective_date)}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={route('policy-management.show', policy.id)}>View Details</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={route('policy-management.edit', policy.id)}>Edit Details</Link>
                                                    </DropdownMenuItem>
                                                    {policy.status === 'approved' && (
                                                        <DropdownMenuItem onClick={() => handleIssuePolicy(policy.id)}>Issue Policy</DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {policies.data.length === 0 && (
                            <div className="py-8 text-center">
                                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-2 text-sm font-semibold">No policies found</h3>
                                <p className="mt-1 text-sm text-muted-foreground">No policies match your current filters.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {policies.data.length > 0 && <Pagination links={policies.links} meta={policies.meta} />}
            </div>
        </AppSidebarLayout>
    );
}
