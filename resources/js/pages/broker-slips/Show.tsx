import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    Clock,
    CreditCard,
    Download,
    Edit,
    Eye,
    FileText,
    Globe,
    Shield,
    User,
    Users,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

interface Customer {
    id: number;
    first_name: string;
    last_name: string;
    company_name?: string;
    email: string;
    phone: string;
    type: 'individual' | 'corporate';
}

interface Insured {
    id: number;
    first_name: string;
    last_name: string;
    company_name?: string;
}

interface InsuranceCompany {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface BrokerSlipItem {
    id: number;
    item_type: string;
    description: string;
    identifier?: string;
    location?: string;
    quantity?: number;
    sum_insured: number;
    rate: number;
    rate_basis: 'percentage' | 'per_mille' | 'fixed';
    premium: number;
    metadata: Record<string, any>;
    sort_order: number;
}

interface BrokerSlipClause {
    id: number;
    clause_type: string;
    title: string;
    content: string;
    is_standard: boolean;
    sort_order: number;
}

interface BrokerSlipVersion {
    id: number;
    version: number;
    snapshot_json: Record<string, any>;
    created_by: number;
    created_at: string;
    createdBy?: User;
}

interface BrokerSlipApproval {
    id: number;
    status: string;
    requested_by: number;
    reviewed_by?: number;
    request_notes?: string;
    approval_notes?: string;
    rejection_reason?: string;
    changes_requested?: string;
    requested_at: string;
    reviewed_at?: string;
    approved_at?: string;
    rejected_at?: string;
    requestedBy?: User;
    reviewedBy?: User;
}

interface BrokerSlip {
    id: number;
    slip_number: string;
    version: number;
    status: string;
    currency: string;
    sum_insured: number;
    rate: number;
    rate_basis: string;
    gross_premium: number;
    commission_rate: number;
    commission_amount: number;
    co_broker_commission: number;
    reporting_broker_commission: number;
    fees: number;
    taxes: number;
    discount: number;
    net_premium: number;
    period_start: string;
    period_end: string;
    claim_payment_condition?: string;
    issued_at?: string;
    pdf_path?: string;
    created_at: string;
    updated_at: string;

    placement: {
        id: number;
        placement_number: string;
        customer: Customer;
        insured: Insured;
        policy_product: { id: number; name: string; code: string; policy_class: { id: number; name: string; code: string } };
    };
    placement_market?: {
        id: number;
        insurance_company: InsuranceCompany;
        participation_percentage: string | null;
    };
    items: BrokerSlipItem[];
    clauses: BrokerSlipClause[];
    versions: BrokerSlipVersion[];
    approvals: BrokerSlipApproval[];
    createdBy: User;
    issuedBy?: User;
    approvedBy?: User;
    reviewedBy?: User;
    signedBy?: User;
}

interface Props {
    brokerSlip: BrokerSlip;
    canUpdate: boolean;
}

const statusStyles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    pending_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    changes_requested: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    issued: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    superseded: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    withdrawn: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
};

const statusIcons: Record<string, React.ReactNode> = {
    draft: <FileText className="h-4 w-4" />,
    pending_review: <Clock className="h-4 w-4" />,
    changes_requested: <AlertCircle className="h-4 w-4" />,
    approved: <CheckCircle className="h-4 w-4" />,
    issued: <CheckCircle className="h-4 w-4" />,
    superseded: <FileText className="h-4 w-4" />,
    withdrawn: <XCircle className="h-4 w-4" />,
};

const approvalStatusStyles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    under_review: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    changes_requested: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};

export default function Show({ brokerSlip, canUpdate }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedClauses, setExpandedClauses] = useState<Set<number>>(new Set());
    const [approvalNotes, setApprovalNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [changeRequests, setChangeRequests] = useState('');
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [showChangesDialog, setShowChangesDialog] = useState(false);
    const [showSubmitDialog, setShowSubmitDialog] = useState(false);
    const [submitNotes, setSubmitNotes] = useState('');

    const formatCurrency = (amount: number | string | null | undefined) => {
        const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (numericAmount === null || numericAmount === undefined || isNaN(numericAmount)) return '₦0.00';
        return `₦${numericAmount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatDateTime = (dateString: string) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const toggleClause = (id: number) => {
        setExpandedClauses((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSubmitForReview = () => {
        setIsSubmitting(true);
        router.post(route('broker-slips.submit-for-review', brokerSlip.id), {
            notes: submitNotes,
        }, {
            onFinish: () => {
                setIsSubmitting(false);
                setShowSubmitDialog(false);
                setSubmitNotes('');
            },
        });
    };

    const handleApprove = () => {
        setIsSubmitting(true);
        router.post(route('broker-slips.approve', brokerSlip.id), {
            notes: approvalNotes,
        }, {
            onFinish: () => {
                setIsSubmitting(false);
                setShowApproveDialog(false);
                setApprovalNotes('');
            },
        });
    };

    const handleReject = () => {
        setIsSubmitting(true);
        router.post(route('broker-slips.request-changes', brokerSlip.id), {
            changes: rejectionReason,
        }, {
            onFinish: () => {
                setIsSubmitting(false);
                setShowRejectDialog(false);
                setRejectionReason('');
            },
        });
    };

    const handleRequestChanges = () => {
        setIsSubmitting(true);
        router.post(route('broker-slips.request-changes', brokerSlip.id), {
            changes: changeRequests,
        }, {
            onFinish: () => {
                setIsSubmitting(false);
                setShowChangesDialog(false);
                setChangeRequests('');
            },
        });
    };

    const handleIssue = () => {
        if (!confirm('Are you sure you want to issue this broker slip?')) return;
        setIsSubmitting(true);
        router.post(route('broker-slips.issue', brokerSlip.id), {}, {
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleWithdraw = () => {
        if (!confirm('Are you sure you want to withdraw this broker slip?')) return;
        setIsSubmitting(true);
        router.post(route('broker-slips.withdraw', brokerSlip.id), {}, {
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleCreateNewVersion = () => {
        router.post(route('broker-slips.create-new-version', brokerSlip.id));
    };

    const getCustomerDisplayName = () => {
        const c = brokerSlip.placement.customer;
        if (c.type === 'corporate') return c.company_name || `${c.first_name} ${c.last_name}`;
        return `${c.first_name} ${c.last_name}`;
    };

    const getInsuredDisplayName = () => {
        const i = brokerSlip.placement.insured;
        if (!i) return 'Same as customer';
        return i.company_name || `${i.first_name} ${i.last_name}`;
    };

    const latestApproval = brokerSlip.approvals?.[0];

    const rateBasisLabel = (basis: string) => {
        switch (basis) {
            case 'percentage': return '%';
            case 'per_mille': return '‰';
            case 'fixed': return 'Fixed';
            default: return basis;
        }
    };

    return (
        <AppLayout>
            <Head title={`Broker Slip: ${brokerSlip.slip_number}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">{brokerSlip.slip_number}</h1>
                            <Badge className={`flex items-center gap-1 ${statusStyles[brokerSlip.status] || 'bg-gray-100 text-gray-800'}`}>
                                {statusIcons[brokerSlip.status]}
                                {brokerSlip.status.replace(/_/g, ' ').toUpperCase()}
                            </Badge>
                            <Badge variant="outline">
                                v{brokerSlip.version}
                            </Badge>
                            {(brokerSlip.placement as any)?.is_system_generated && (
                                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                    Direct Slip
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                                Product: <span className="font-medium">{brokerSlip.placement.policy_product?.name}</span>
                            </span>
                            <span>•</span>
                            <span>
                                Customer: <span className="font-medium">{getCustomerDisplayName()}</span>
                            </span>
                            <span>•</span>
                            <span>Created: {formatDate(brokerSlip.created_at)}</span>
                            <span>•</span>
                            <span>
                                By: <span className="font-medium">{brokerSlip.createdBy?.name}</span>
                            </span>
                        </div>
                    </div>

                    {/* Actions */}

                    <div className="flex flex-wrap gap-2">
                        {brokerSlip.status === 'draft' && (
                            <Button onClick={() => setShowSubmitDialog(true)} disabled={isSubmitting}>
                                <Clock className="mr-2 h-4 w-4" />
                                Submit for Review
                            </Button>
                        )}

                        {brokerSlip.status === 'pending_review' && (
                            <>
                                <Button onClick={() => setShowApproveDialog(true)} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                </Button>
                                <Button variant="destructive" onClick={() => setShowRejectDialog(true)} disabled={isSubmitting}>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                </Button>
                                <Button variant="outline" onClick={() => setShowChangesDialog(true)} disabled={isSubmitting}>
                                    <AlertCircle className="mr-2 h-4 w-4" />
                                    Request Changes
                                </Button>
                            </>
                        )}

                        {brokerSlip.status === 'approved' && (
                            <Button onClick={handleIssue} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Issue Slip
                            </Button>
                        )}

                        {brokerSlip.status === 'issued' && (
                            <Button variant="outline" onClick={handleWithdraw} disabled={isSubmitting}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Withdraw
                            </Button>
                        )}

                        {(brokerSlip.status === 'approved' || brokerSlip.status === 'issued') && (
                            <Button variant="outline" onClick={handleCreateNewVersion}>
                                <Edit className="mr-2 h-4 w-4" />
                                New Version
                            </Button>
                        )}

                        {(brokerSlip.status === 'draft' || brokerSlip.status === 'changes_requested') && (
                            <Link href={route('broker-slips.edit', brokerSlip.id)}>
                                <Button variant="outline">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                        )}

                        {brokerSlip.pdf_path && (
                            <Button variant="outline" onClick={() => window.open(route('broker-slips.download', brokerSlip.id), '_blank')}>
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                            </Button>
                        )}

                        <Button variant="outline" onClick={() => window.open(route('broker-slips.preview', brokerSlip.id), '_blank')}>
                            <Eye className="mr-2 h-4 w-4" />
                            Preview PDF
                        </Button>
                    </div>

                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Insured & Coverage Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Coverage Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Customer</h4>
                                <p className="font-medium">{getCustomerDisplayName()}</p>
                                <p className="text-sm text-gray-500">{brokerSlip.placement.customer.email}</p>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Insured</h4>
                                <p className="font-medium">{getInsuredDisplayName()}</p>
                            </div>

                            {brokerSlip?.placement_market?.insurance_company && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Insurer</h4>
                                    <p className="font-medium">
                                        {brokerSlip.placement_market.insurance_company.name}
                                        {brokerSlip.placement_market.participation_percentage && (
                                            <span className="ml-2 text-sm text-gray-500">
                                                ({brokerSlip.placement_market.participation_percentage}%)
                                            </span>
                                        )}
                                    </p>
                                </div>
                            )}

                            <div>
                                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Coverage Period</h4>
                                <div className="flex items-center gap-2 text-sm">
                                    <span>{formatDate(brokerSlip.period_start)} - {formatDate(brokerSlip.period_end)}</span>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Currency</h4>
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium">{brokerSlip.currency || 'NGN'}</span>
                                </div>
                            </div>

                            {brokerSlip.claim_payment_condition && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Claim Payment Condition</h4>
                                    <p className="text-sm">{brokerSlip.claim_payment_condition}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Financial Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Financial Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Sum Insured</span>
                                    <span className="font-medium">{formatCurrency(brokerSlip.sum_insured)}</span>
                                </div>
                                {brokerSlip.rate && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Rate</span>
                                        <span className="font-medium">
                                            {brokerSlip.rate}{rateBasisLabel(brokerSlip.rate_basis)}
                                        </span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Gross Premium</span>
                                    <span className="font-medium">{formatCurrency(brokerSlip.gross_premium)}</span>
                                </div>
                                {brokerSlip.commission_amount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Commission{brokerSlip.commission_rate ? ` (${brokerSlip.commission_rate}%)` : ''}
                                        </span>
                                        <span className="font-medium text-red-600">-{formatCurrency(brokerSlip.commission_amount)}</span>
                                    </div>
                                )}
                                {brokerSlip.co_broker_commission > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Co-Broker Commission</span>
                                        <span className="font-medium text-red-600">-{formatCurrency(brokerSlip.co_broker_commission)}</span>
                                    </div>
                                )}
                                {brokerSlip.reporting_broker_commission > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Reporting Broker Commission</span>
                                        <span className="font-medium text-red-600">-{formatCurrency(brokerSlip.reporting_broker_commission)}</span>
                                    </div>
                                )}
                                {brokerSlip.fees > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Fees</span>
                                        <span className="font-medium">{formatCurrency(brokerSlip.fees)}</span>
                                    </div>
                                )}
                                {brokerSlip.taxes > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Taxes</span>
                                        <span className="font-medium">{formatCurrency(brokerSlip.taxes)}</span>
                                    </div>
                                )}
                                {brokerSlip.discount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Discount</span>
                                        <span className="font-medium text-green-600">-{formatCurrency(brokerSlip.discount)}</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between text-lg font-semibold">
                                    <span>Net Premium</span>
                                    <span className="text-green-600">{formatCurrency(brokerSlip.net_premium)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Placement Reference */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Placement Reference
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Placement Number</h4>
                                <p className="font-medium">{brokerSlip.placement.placement_number}</p>
                            </div>

                            {brokerSlip.placement.policy_product && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Product</h4>
                                    <p className="font-medium">{brokerSlip.placement.policy_product.name}</p>
                                    {brokerSlip.placement.policy_product.policy_class && (
                                        <p className="text-sm text-gray-500">{brokerSlip.placement.policy_product.policy_class.name}</p>
                                    )}
                                </div>
                            )}

                            {brokerSlip.issuedBy && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Issued By</h4>
                                    <p className="font-medium">{brokerSlip.issuedBy.name}</p>
                                    {brokerSlip.issued_at && (
                                        <p className="text-sm text-gray-500">{formatDateTime(brokerSlip.issued_at)}</p>
                                    )}
                                </div>
                            )}

                            <div>
                                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Created By</h4>
                                <p className="font-medium">{brokerSlip.createdBy?.name}</p>
                                <p className="text-sm text-gray-500">{formatDateTime(brokerSlip.created_at)}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Items Table */}
                {brokerSlip.items && brokerSlip.items.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Items
                                <Badge variant="outline">{brokerSlip.items.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-gray-500 dark:text-gray-400">
                                            <th className="px-6 pb-3 font-medium">#</th>
                                            <th className="px-6 pb-3 font-medium">Description</th>
                                            <th className="px-6 pb-3 font-medium text-right">Sum Insured</th>
                                            <th className="px-6 pb-3 font-medium text-right">Rate</th>
                                            <th className="px-6 pb-3 font-medium text-right">Basis</th>
                                            <th className="px-6 pb-3 font-medium text-right">Premium</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {brokerSlip.items.map((item, idx) => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="px-6 py-3 text-gray-500">{idx + 1}</td>
                                                <td className="px-6 py-3">
                                                    <div>
                                                        <p className="font-medium">{item.description}</p>
                                                        {item.item_type && (
                                                            <p className="text-xs text-gray-500 capitalize">{item.item_type.replace(/_/g, ' ')}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-right">{formatCurrency(item.sum_insured)}</td>
                                                <td className="px-6 py-3 text-right">{item.rate ?? '—'}</td>
                                                <td className="px-6 py-3 text-right capitalize">{item.rate_basis?.replace(/_/g, ' ') || '—'}</td>
                                                <td className="px-6 py-3 text-right font-medium">{formatCurrency(item.premium)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Clauses */}
                {brokerSlip.clauses && brokerSlip.clauses.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Clauses
                                <Badge variant="outline">{brokerSlip.clauses.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {brokerSlip.clauses.map((clause) => (
                                <div key={clause.id} className="rounded-lg border">
                                    <button
                                        type="button"
                                        onClick={() => toggleClause(clause.id)}
                                        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">{clause.title}</span>
                                            {clause.clause_type && (
                                                <Badge variant="outline" className="text-xs capitalize">
                                                    {clause.clause_type.replace(/_/g, ' ')}
                                                </Badge>
                                            )}
                                            {clause.is_standard && (
                                                <span className="text-xs text-gray-400">Standard</span>
                                            )}
                                        </div>
                                        {expandedClauses.has(clause.id) ? (
                                            <ChevronDown className="h-4 w-4 text-gray-400" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4 text-gray-400" />
                                        )}
                                    </button>
                                    {expandedClauses.has(clause.id) && (
                                        <div className="border-t px-4 py-3">
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{clause.content}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Version History */}
                    {brokerSlip.versions && brokerSlip.versions.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Version History
                                    <Badge variant="outline">{brokerSlip.versions.length}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {brokerSlip.versions.map((ver) => (
                                        <div key={ver.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-medium text-sm">Version {ver.version}</p>
                                                <p className="text-xs text-gray-500">{formatDateTime(ver.created_at)}</p>
                                                {ver.createdBy && (
                                                    <p className="text-xs text-gray-400">by {ver.createdBy.name}</p>
                                                )}
                                            </div>
                                            <Badge variant="secondary" className="text-xs">
                                                v{ver.version}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Approval Timeline */}
                    {latestApproval && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5" />
                                    Approval Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {latestApproval.requestedBy && (
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                                                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">
                                                    Submitted by {latestApproval.requestedBy.name}
                                                </p>
                                                <p className="text-xs text-gray-500">{formatDateTime(latestApproval.requested_at)}</p>
                                                {latestApproval.request_notes && (
                                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{latestApproval.request_notes}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {latestApproval.status === 'under_review' && latestApproval.reviewedBy && (
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">
                                                    Under review by {latestApproval.reviewedBy.name}
                                                </p>
                                                <p className="text-xs text-gray-500">{formatDateTime(latestApproval.reviewed_at!)}</p>
                                            </div>
                                        </div>
                                    )}

                                    {latestApproval.status === 'approved' && (
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">
                                                    Approved{latestApproval.reviewedBy ? ` by ${latestApproval.reviewedBy.name}` : ''}
                                                </p>
                                                <p className="text-xs text-gray-500">{formatDateTime(latestApproval.approved_at!)}</p>
                                                {latestApproval.approval_notes && (
                                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{latestApproval.approval_notes}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {latestApproval.status === 'rejected' && (
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                                                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">Rejected</p>
                                                <p className="text-xs text-gray-500">{formatDateTime(latestApproval.rejected_at!)}</p>
                                                {latestApproval.rejection_reason && (
                                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{latestApproval.rejection_reason}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {latestApproval.status === 'changes_requested' && (
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                                                <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">Changes Requested</p>
                                                <p className="text-xs text-gray-500">{formatDateTime(latestApproval.rejected_at!)}</p>
                                                {latestApproval.changes_requested && (
                                                    <p className="mt-1 text-sm text-orange-600 dark:text-orange-400">{latestApproval.changes_requested}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-2">
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${approvalStatusStyles[latestApproval.status]}`}>
                                            {latestApproval.status.replace(/_/g, ' ').toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Submit for Review Dialog */}
            {showSubmitDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
                        <h2 className="text-lg font-semibold">Submit for Review</h2>
                        <p className="mt-1 text-sm text-gray-500">Add any notes for the reviewer (optional).</p>
                        <textarea
                            className="mt-4 w-full rounded-md border p-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                            rows={3}
                            value={submitNotes}
                            onChange={(e) => setSubmitNotes(e.target.value)}
                            placeholder="Notes for reviewer..."
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => { setShowSubmitDialog(false); setSubmitNotes(''); }}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmitForReview} disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Submit'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approve Dialog */}
            {showApproveDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
                        <h2 className="text-lg font-semibold">Approve Slip</h2>
                        <p className="mt-1 text-sm text-gray-500">Add approval notes (optional).</p>
                        <textarea
                            className="mt-4 w-full rounded-md border p-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                            rows={3}
                            value={approvalNotes}
                            onChange={(e) => setApprovalNotes(e.target.value)}
                            placeholder="Approval notes..."
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => { setShowApproveDialog(false); setApprovalNotes(''); }}>
                                Cancel
                            </Button>
                            <Button onClick={handleApprove} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                                {isSubmitting ? 'Approving...' : 'Approve'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Dialog */}
            {showRejectDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
                        <h2 className="text-lg font-semibold text-red-600">Reject Slip</h2>
                        <p className="mt-1 text-sm text-gray-500">Provide a reason for rejection.</p>
                        <textarea
                            className="mt-4 w-full rounded-md border p-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                            rows={3}
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Reason for rejection..."
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => { setShowRejectDialog(false); setRejectionReason(''); }}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleReject} disabled={isSubmitting || !rejectionReason}>
                                {isSubmitting ? 'Rejecting...' : 'Reject'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Request Changes Dialog */}
            {showChangesDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
                        <h2 className="text-lg font-semibold text-orange-600">Request Changes</h2>
                        <p className="mt-1 text-sm text-gray-500">Describe what changes are needed.</p>
                        <textarea
                            className="mt-4 w-full rounded-md border p-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                            rows={3}
                            value={changeRequests}
                            onChange={(e) => setChangeRequests(e.target.value)}
                            placeholder="Describe the changes needed..."
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => { setShowChangesDialog(false); setChangeRequests(''); }}>
                                Cancel
                            </Button>
                            <Button onClick={handleRequestChanges} disabled={isSubmitting || !changeRequests}>
                                {isSubmitting ? 'Submitting...' : 'Request Changes'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
