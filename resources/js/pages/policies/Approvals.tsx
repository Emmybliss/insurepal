import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Check, CheckCircle, Clock, Eye, FileText, Filter, MoreHorizontal, X, XCircle } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface PolicyApproval {
    id: number;
    status: string;
    approval_type: string;
    policy_amount: number;
    request_notes: string;
    approval_notes: string;
    requested_at: string;
    approved_at: string;
    status_label: string;
    approval_type_label: string;
    policy: {
        id: number;
        policy_number: string;
        customer: {
            name: string;
            email: string;
        };
        insurance_product: {
            name: string;
        };
    };
    requested_by: {
        name: string;
        email: string;
    };
    approved_by?: {
        name: string;
        email: string;
    };
}

interface Stats {
    pending: number;
    under_review: number;
    approved: number;
    rejected: number;
}

interface Filters {
    status?: string;
    approval_type?: string;
}

interface Props {
    approvals: {
        data: PolicyApproval[];
        links: any[];
        meta: any;
    };
    stats: Stats;
    filters: Filters;
}

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    under_review: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
};

const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="h-4 w-4" />,
    under_review: <Eye className="h-4 w-4" />,
    approved: <CheckCircle className="h-4 w-4" />,
    rejected: <XCircle className="h-4 w-4" />,
    cancelled: <XCircle className="h-4 w-4" />,
};

export default function Approvals({ approvals, stats, filters }: Props) {
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [approvalTypeFilter, setApprovalTypeFilter] = useState(filters.approval_type || '');
    const [selectedApproval, setSelectedApproval] = useState<PolicyApproval | null>(null);
    const [approvalNotes, setApprovalNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [showApprovalDialog, setShowApprovalDialog] = useState(false);
    const [showRejectionDialog, setShowRejectionDialog] = useState(false);

    const handleSearch = () => {
        router.get(
            route('policy-approvals.index'),
            {
                status: statusFilter,
                approval_type: approvalTypeFilter,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const clearFilters = () => {
        setStatusFilter('');
        setApprovalTypeFilter('');
        router.get(route('policy-approvals.index'));
    };

    const handleApprove = async () => {
        if (!selectedApproval) return;

        try {
            await router.post(
                route('policy-approvals.approve'),
                {
                    policy_id: selectedApproval.policy.id,
                    notes: approvalNotes,
                },
                {
                    onSuccess: () => {
                        toast.success('Policy approved successfully');
                        setShowApprovalDialog(false);
                        setApprovalNotes('');
                        setSelectedApproval(null);
                    },
                    onError: (errors) => {
                        toast.error(errors.message || 'Failed to approve policy');
                    },
                },
            );
        } catch (error) {
            toast.error('An error occurred while approving policy');
        }
    };

    const handleReject = async () => {
        if (!selectedApproval) return;

        try {
            await router.post(
                route('policy-approvals.reject'),
                {
                    policy_id: selectedApproval.policy.id,
                    reason: rejectionReason,
                },
                {
                    onSuccess: () => {
                        toast.success('Policy rejected successfully');
                        setShowRejectionDialog(false);
                        setRejectionReason('');
                        setSelectedApproval(null);
                    },
                    onError: (errors) => {
                        toast.error(errors.message || 'Failed to reject policy');
                    },
                },
            );
        } catch (error) {
            toast.error('An error occurred while rejecting policy');
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
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppSidebarLayout>
            <Head title="Policy Approvals" />

            <div className="flex flex-1 flex-col space-y-8 p-8">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Policy Approvals</h2>
                        <p className="text-muted-foreground">Review and approve policy applications</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pending}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
                            <Eye className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.under_review}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Approved</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.approved}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                            <XCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.rejected}</div>
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
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="under_review">Under Review</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Approval Type</Label>
                                <Select value={approvalTypeFilter} onValueChange={setApprovalTypeFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new_policy">New Policy</SelectItem>
                                        <SelectItem value="policy_amendment">Amendment</SelectItem>
                                        <SelectItem value="policy_renewal">Renewal</SelectItem>
                                        <SelectItem value="policy_reinstatement">Reinstatement</SelectItem>
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

                {/* Approvals Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Approval Requests</CardTitle>
                        <CardDescription>{approvals.meta?.total} approval requests found</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Policy Number</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Requested</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {approvals.data.map((approval) => (
                                    <TableRow key={approval.id}>
                                        <TableCell className="font-medium">
                                            <Link
                                                href={route('policy-management.show', approval.policy.id)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                {approval.policy.policy_number}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{approval.policy.customer.name}</div>
                                                <div className="text-sm text-muted-foreground">{approval.policy.customer.email}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{approval.policy.insurance_product?.name}</TableCell>
                                        <TableCell>{formatCurrency(approval.policy_amount)}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{approval.approval_type_label}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${statusColors[approval.status]} flex items-center gap-1`}>
                                                {statusIcons[approval.status]}
                                                {approval.status_label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <div>{formatDate(approval.requested_at)}</div>
                                                <div className="text-muted-foreground">by {approval.requested_by.name}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={route('policy-management.show', approval.policy.id)}>View Policy</Link>
                                                    </DropdownMenuItem>
                                                    {approval.status === 'pending' && (
                                                        <>
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setSelectedApproval(approval);
                                                                    setShowApprovalDialog(true);
                                                                }}
                                                            >
                                                                <Check className="mr-2 h-4 w-4" />
                                                                Approve
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setSelectedApproval(approval);
                                                                    setShowRejectionDialog(true);
                                                                }}
                                                            >
                                                                <X className="mr-2 h-4 w-4" />
                                                                Reject
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {approvals.data.length === 0 && (
                            <div className="py-8 text-center">
                                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-2 text-sm font-semibold">No approval requests found</h3>
                                <p className="mt-1 text-sm text-muted-foreground">No approval requests match your current filters.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {approvals.data.length > 0 && <Pagination links={approvals.links} meta={approvals.meta} />}
            </div>

            {/* Approval Dialog */}
            <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Policy</DialogTitle>
                        <DialogDescription>Are you sure you want to approve this policy? This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    {selectedApproval && (
                        <div className="space-y-4">
                            <div className="rounded-lg bg-muted p-4">
                                <h4 className="mb-2 font-medium">Policy Details</h4>
                                <div className="space-y-1 text-sm">
                                    <p>
                                        <strong>Policy Number:</strong> {selectedApproval.policy.policy_number}
                                    </p>
                                    <p>
                                        <strong>Customer:</strong> {selectedApproval.policy.customer.name}
                                    </p>
                                    <p>
                                        <strong>Amount:</strong> {formatCurrency(selectedApproval.policy_amount)}
                                    </p>
                                    <p>
                                        <strong>Type:</strong> {selectedApproval.approval_type_label}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="approval-notes">Approval Notes (Optional)</Label>
                                <Textarea
                                    id="approval-notes"
                                    value={approvalNotes}
                                    onChange={(e) => setApprovalNotes(e.target.value)}
                                    placeholder="Add any notes for this approval..."
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleApprove}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve Policy
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rejection Dialog */}
            <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Policy</DialogTitle>
                        <DialogDescription>Please provide a reason for rejecting this policy application.</DialogDescription>
                    </DialogHeader>
                    {selectedApproval && (
                        <div className="space-y-4">
                            <div className="rounded-lg bg-muted p-4">
                                <h4 className="mb-2 font-medium">Policy Details</h4>
                                <div className="space-y-1 text-sm">
                                    <p>
                                        <strong>Policy Number:</strong> {selectedApproval.policy.policy_number}
                                    </p>
                                    <p>
                                        <strong>Customer:</strong> {selectedApproval.policy.customer.name}
                                    </p>
                                    <p>
                                        <strong>Amount:</strong> {formatCurrency(selectedApproval.policy_amount)}
                                    </p>
                                    <p>
                                        <strong>Type:</strong> {selectedApproval.approval_type_label}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                                <Textarea
                                    id="rejection-reason"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Please explain why this policy is being rejected..."
                                    rows={4}
                                    required
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRejectionDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject Policy
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppSidebarLayout>
    );
}
