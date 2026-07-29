import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Customer } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Head, Link, router } from '@inertiajs/react';
import { AlertCircle, CheckCircle, FileText, Filter, Plus, Search, Trash2, XCircle } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
interface Policy {
    id: number;
    policy_number: string;
    policy_number_display: string;
    internal_reference: string;
    source_type: string;
    status: string;
    approval_status: string;
    customer: Customer;
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
    expiring_soon: number;
    expired: number;
}

interface Filters {
    search?: string;
    status?: string;
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

const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    pending_approval: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800',
    expiring_soon: 'bg-orange-100 text-orange-800',
    cancelled: 'bg-gray-100 text-gray-800',
    suspended: 'bg-orange-100 text-orange-800',
    rejected: 'bg-red-100 text-red-800',
    recorded: 'bg-purple-100 text-purple-800',
};

const statusIcons: Record<string, React.ReactNode> = {
    draft: <FileText className="h-4 w-4" />,
    pending_approval: <FileText className="h-4 w-4" />,
    approved: <CheckCircle className="h-4 w-4" />,
    active: <CheckCircle className="h-4 w-4" />,
    expired: <XCircle className="h-4 w-4" />,
    expiring_soon: <AlertCircle className="h-4 w-4" />,
    cancelled: <XCircle className="h-4 w-4" />,
    suspended: <AlertCircle className="h-4 w-4" />,
    rejected: <XCircle className="h-4 w-4" />,
    recorded: <FileText className="h-4 w-4" />,
};

const getPolicyStatus = (policy: Policy) => {
    const dateStatuses = ['active', 'expired', 'recorded'];
    if (!dateStatuses.includes(policy.status)) return policy.status;

    if (!policy.expiry_date) return policy.status === 'recorded' ? 'recorded' : 'active';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(policy.expiry_date);
    expiryDate.setHours(0, 0, 0, 0);

    if (expiryDate < today) return 'expired';

    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 60) return 'expiring_soon';

    return 'active';
};

export default function RecordedPolicies({ policies, stats, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [policyToDelete, setPolicyToDelete] = useState<Policy | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeletePolicy = () => {
        if (!policyToDelete) return;
        setIsDeleting(true);
        router.delete(route('policy-management.destroy', policyToDelete.id), {
            onSuccess: (page) => {
                if (page.props.flash?.error) {
                    toast.error(page.props.flash.error);
                } else {
                    toast.success('Policy moved to Recycle Bin successfully.');
                    setPolicyToDelete(null);
                }
            },
            onError: (errors: Record<string, string>) => {
                const message = errors?.error || errors?.message || 'Cannot delete policy due to existing related records.';
                toast.error(message);
            },
            onFinish: () => setIsDeleting(false),
        });
    };

    const handleSearch = () => {
        router.get(
            route('policy-management.recorded-policies'),
            { search: searchTerm, status: statusFilter },
            { preserveState: true, replace: true },
        );
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        router.get(route('policy-management.recorded-policies'));
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

    const getCustomerName = (customer: Customer) => {
        return customer.type === 'individual' ? `${customer.first_name} ${customer.last_name}` : customer.company_name;
    };

    return (
        <AppSidebarLayout>
            <Head title="Recorded Policies" />

            <div className="flex flex-1 flex-col space-y-8 p-8">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Recorded Policies</h2>
                        <p className="text-muted-foreground">Track and manage policies recorded from underwriters</p>
                    </div>
                    <Button asChild>
                        <Link href={route('policy-management.record-placed')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Record Placed Policy
                        </Link>
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card
                        className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${!statusFilter ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}
                        onClick={() => {
                            setStatusFilter('');
                            router.get(
                                route('policy-management.recorded-policies'),
                                { search: searchTerm, status: '' },
                                { preserveState: true, replace: true },
                            );
                        }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Recorded</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card
                        className={`cursor-pointer transition-colors hover:bg-orange-50 dark:hover:bg-gray-700 ${statusFilter === 'expiring_soon' ? 'border-orange-500 ring-1 ring-orange-500' : ''}`}
                        onClick={() => {
                            setStatusFilter('expiring_soon');
                            router.get(
                                route('policy-management.recorded-policies'),
                                { search: searchTerm, status: 'expiring_soon' },
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
                        className={`cursor-pointer transition-colors hover:bg-green-50 dark:hover:bg-gray-700 ${statusFilter === 'active' ? 'border-green-500 ring-1 ring-green-500' : ''}`}
                        onClick={() => {
                            setStatusFilter('active');
                            router.get(
                                route('policy-management.recorded-policies'),
                                { search: searchTerm, status: 'active' },
                                { preserveState: true, replace: true },
                            );
                        }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active}</div>
                        </CardContent>
                    </Card>
                    <Card
                        className={`cursor-pointer transition-colors hover:bg-red-50 dark:hover:bg-gray-700 ${statusFilter === 'expired' ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                        onClick={() => {
                            setStatusFilter('expired');
                            router.get(
                                route('policy-management.recorded-policies'),
                                { search: searchTerm, status: 'expired' },
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
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
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
                                        <SelectItem value="recorded">Recorded</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                                        <SelectItem value="expired">Expired</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
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
                        <CardTitle>Recorded Policies</CardTitle>
                        <CardDescription>{policies?.meta?.total} policies found</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Policy Number</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Premium</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Effective Date</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {policies.data.map((policy) => (
                                    <TableRow key={policy.id}>
                                        <TableCell className="font-medium">
                                            <Link href={route('policy-management.show', policy.id)} className="text-blue-600 hover:text-blue-800">
                                                {policy.policy_number_display || policy.policy_number}<br /> Ref: {policy.internal_reference}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{getCustomerName(policy.customer)}</div>
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
                                        <TableCell>{formatDate(policy.effective_date)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={route('policy-management.show', policy.id)}>View</Link>
                                                </Button>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={route('policy-management.edit', policy.id)}>Edit</Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setPolicyToDelete(policy)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {policies.data.length === 0 && (
                            <div className="py-8 text-center">
                                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-2 text-sm font-semibold">No policies found</h3>
                                <p className="mt-1 text-sm text-muted-foreground">No recorded policies match your current filters.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {policies.data.length > 0 && <Pagination links={policies.meta.links} meta={policies.meta} />}
            </div>

            <Dialog open={!!policyToDelete} onOpenChange={(open) => !open && setPolicyToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Move Policy to Recycle Bin</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete policy{' '}
                            <span className="font-semibold text-foreground">
                                {policyToDelete?.policy_number_display || policyToDelete?.policy_number || policyToDelete?.internal_reference}
                            </span>
                            ? The policy will be moved to the Recycle Bin and can be restored later. It will not be permanently deleted.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setPolicyToDelete(null)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeletePolicy} disabled={isDeleting}>
                            {isDeleting ? 'Moving to Recycle Bin...' : 'Move to Recycle Bin'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppSidebarLayout>
    );
}
