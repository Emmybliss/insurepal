import { Can } from '@/components/auth/permission-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertCircle,
    Building2,
    Calendar,
    CheckCircle,
    Clock,
    CreditCard,
    Download,
    Edit,
    Eye,
    FileText,
    MapPin,
    Phone,
    Plus,
    Receipt,
    Shield,
    User,
    Users,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import CreateFinancialNoteModal from './CreateFinancialNoteModal';

interface PolicyType {
    id: number;
    name: string;
    code: string;
}

interface PolicyClass {
    id: number;
    name: string;
    code: string;
}

interface Customer {
    id: number;
    first_name: string;
    last_name: string;
    company_name?: string;
    email: string;
    phone: string;
    type: 'individual' | 'corporate';
    address?: string;
    city?: string;
    state?: string;
    country?: string;
}

interface PolicyProduct {
    id: number;
    name: string;
    code: string;
    description?: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Quote {
    id: number;
    quote_number: string;
    status: string;
}

interface PolicyDocument {
    id: number;
    document_type: string;
    document_name: string;
    file_name: string;
    status: string;
    is_customer_facing: boolean;
    created_at: string;
}

interface PolicyAmendment {
    id: number;
    amendment_number: string;
    amendment_type: string;
    status: string;
    amendment_reason: string;
    effective_date: string;
    premium_adjustment: number;
    new_premium_amount: number;
    created_at: string;
    created_by_user?: User;
}

interface Certificate {
    id: number;
    certificate_number: string;
    type: string;
    status: string;
    file_path?: string;
    file_name?: string;
    issued_at?: string;
    expires_at?: string;
    created_at: string;
}

interface DebitNote {
    id: number;
    note_number: string;
    status: string;
    amount: number;
    tax_amount?: number;
    description?: string;
    due_date?: string;
    file_path?: string;
    file_name?: string;
    created_at: string;
}

interface CreditNote {
    id: number;
    note_number: string;
    status: string;
    amount: number;
    tax_amount?: number;
    description?: string;
    file_path?: string;
    file_name?: string;
    created_at: string;
}

interface Invoice {
    id: number;
    invoice_number: string;
    status: string;
    total_amount: number;
    due_date?: string;
    notes?: string;
    created_at: string;
}

interface PolicyReceipt {
    id: number;
    receipt_number: string;
    status: string;
    amount_paid: number;
    payment_method?: string;
    payment_date?: string;
    created_at: string;
}

interface Policy {
    id: number;
    tenant_id: number;
    customer_id: number;
    quote_id?: number;
    policy_product_id: number;
    policy_class_id?: number;
    policy_type_id?: number;
    policy_number: string;
    source_type: string;
    status: string;
    approval_status: string;
    effective_date: string;
    expiry_date: string;
    coverage_details: Record<string, any>;
    premium_amount: number;
    commission_amount: number;
    total_amount: number;
    payment_frequency: string;
    form_data?: Record<string, any>;
    terms_conditions?: string;
    notes?: string;
    internal_notes?: string;
    created_by: number;
    approved_by?: number;
    approved_at?: string;
    issued_at?: string;
    renewed_at?: string;
    created_at: string;
    updated_at: string;
    broker_slip_number?: string;
    placement_date?: string;
    schedule_file_path?: string;
    broker_slip_file_path?: string;

    // Relationships
    customer: Customer;
    policy_product: PolicyProduct;
    policy_type?: PolicyType;
    policy_class?: PolicyClass;
    created_by_user?: User;
    approved_by_user?: User;
    quote?: Quote;
    documents?: PolicyDocument[];
    amendments?: PolicyAmendment[];
    certificates?: Certificate[];
    debit_notes?: DebitNote[];
    credit_notes?: CreditNote[];
    invoices?: Invoice[];
    receipts?: PolicyReceipt[];
    issued_by?: User;
    broker_tenant?: { id: number; name: string };
}

interface Props {
    policy: Policy;
}

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

const noteStatusColor = (status: string) => {
    switch (status) {
        case 'paid':
        case 'generated':
        case 'issued':
        case 'completed':
            return 'bg-green-100 text-green-700';
        case 'draft':
            return 'bg-gray-100 text-gray-700';
        case 'cancelled':
        case 'voided':
            return 'bg-red-100 text-red-700';
        case 'sent':
        case 'partially_paid':
            return 'bg-blue-100 text-blue-700';
        default:
            return 'bg-yellow-100 text-yellow-700';
    }
};

const approvalStatusColors: Record<string, string> = {
    not_required: 'bg-gray-100 text-gray-600',
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
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

type FinancialTab = 'debit' | 'credit' | 'invoices' | 'receipts';

export default function Show({ policy }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<FinancialTab>('debit');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewTitle, setPreviewTitle] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType] = useState<'debit' | 'credit'>('debit');

    // Quick Note Generation State
    const [isGeneratingNote, setIsGeneratingNote] = useState(false);

    const openPreview = (url: string, title: string) => {
        setPreviewUrl(url);
        setPreviewTitle(title);
    };

    const formatCurrency = (amount: number | string | null | undefined) => {
        const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (numericAmount === null || numericAmount === undefined || isNaN(numericAmount)) {
            return '₦0.00';
        }
        return `₦${numericAmount.toLocaleString('en-NG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString)?.toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString)?.toLocaleString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const storageUrl = (path: string) => `/storage/${path}`;

    const getDaysUntilExpiry = () => {
        const today = new Date();
        const expiryDate = new Date(policy.expiry_date);
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getCustomerDisplayName = () => {
        if (policy.customer.type === 'corporate') {
            return policy.customer.company_name || `${policy.customer.first_name} ${policy.customer.last_name}`;
        }
        return `${policy.customer.first_name} ${policy.customer.last_name}`;
    };

    const handleIssuePolicy = async () => {
        if (!confirm('Are you sure you want to issue this policy?')) return;

        setIsLoading(true);
        try {
            router.post(
                route('policy-management.issue', policy.id),
                {
                    policy_id: policy.id,
                },
                {
                    onSuccess: () => {
                        // Policy will be refreshed automatically
                    },
                    onError: (errors) => {
                        console.error('Failed to issue policy:', errors);
                        alert('Failed to issue policy. Please try again.');
                    },
                },
            );
        } catch (error) {
            console.error('Error issuing policy:', error);
            alert('An error occurred while issuing the policy.');
        } finally {
            setIsLoading(false);
        }
    };

    const generateQuickNote = async (type: 'debit' | 'credit' | 'invoice' | 'receipt') => {
        setIsGeneratingNote(true);
        try {
            let url = '';
            switch (type) {
                case 'debit':
                    url = route('policies.quick-debit-note', policy.id);
                    break;
                case 'credit':
                    url = route('policies.quick-credit-note', policy.id);
                    break;
                case 'invoice':
                    url = route('policies.quick-invoice', policy.id);
                    break;
                case 'receipt':
                    url = route('policies.quick-receipt', policy.id);
                    break;
            }

            const response = await axios.post(url);

            if (response.data.success && (response.data.note_id || response.data.invoice_id || response.data.receipt_id)) {
                const id = response.data.note_id || response.data.invoice_id || response.data.receipt_id;

                // Navigate to template options page
                let targetRoute = '';
                switch (type) {
                    case 'debit':
                        targetRoute = route('debit-notes.template-options', id);
                        break;
                    case 'credit':
                        targetRoute = route('credit-notes.template-options', id);
                        break;
                    case 'invoice':
                        targetRoute = route('invoices.template-options', id);
                        break;
                    case 'receipt':
                        targetRoute = route('receipts.template-options', id);
                        break;
                }

                router.visit(targetRoute);
            }
        } catch (error) {
            console.error(`Failed to generate ${type}:`, error);
            alert(`An error occurred while generating the ${type}.`);
            setIsGeneratingNote(false);
        }
    };

    const daysUntilExpiry = getDaysUntilExpiry();
    const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    const isExpired = daysUntilExpiry < 0;

    const tabs: { key: FinancialTab; label: string; icon: React.ReactNode; count: number }[] = [
        {
            key: 'debit',
            label: 'Debit Notes',
            icon: <CreditCard className="h-4 w-4" />,
            count: policy.debit_notes?.length ?? 0,
        },
        {
            key: 'credit',
            label: 'Credit Notes',
            icon: <Receipt className="h-4 w-4" />,
            count: policy.credit_notes?.length ?? 0,
        },
        {
            key: 'invoices',
            label: 'Invoices',
            icon: <FileText className="h-4 w-4" />,
            count: policy.invoices?.length ?? 0,
        },
        {
            key: 'receipts',
            label: 'Receipts',
            icon: <CheckCircle className="h-4 w-4" />,
            count: policy.receipts?.length ?? 0,
        },
    ];

    return (
        <AppLayout>
            <Head title={`Policy: ${policy.policy_number}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">{policy.policy_number}</h1>
                            {(() => {
                                const derivedStatus = getPolicyStatus(policy);
                                return (
                                    <Badge className={`${statusColors[derivedStatus] || statusColors[policy.status]} flex items-center gap-1`}>
                                        {statusIcons[derivedStatus] || statusIcons[policy.status]}
                                        {derivedStatus.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                );
                            })()}
                            <Badge className={`${approvalStatusColors[policy.approval_status]}`}>
                                {policy.approval_status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            {policy.source_type === 'BROKER_RECORDED' && (
                                <Badge className="bg-purple-100 text-purple-800">Broker Recorded</Badge>
                            )}
                            {policy.source_type === 'DIRECT_ISSUANCE' && (
                                <Badge className="bg-blue-100 text-blue-800">Direct Issuance</Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                                Product: <span className="font-medium">{policy.policy_product?.name}</span>
                            </span>
                            <span>•</span>
                            <span>
                                Customer: <span className="font-medium">{getCustomerDisplayName()}</span>
                            </span>
                            <span>•</span>
                            <span>Created: {formatDate(policy.created_at)}</span>
                        </div>

                        {/* Expiry Warning */}
                        {isExpiringSoon && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-orange-600">
                                <AlertCircle className="h-4 w-4" />
                                <span>Expires in {daysUntilExpiry} days</span>
                            </div>
                        )}
                        {isExpired && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                                <XCircle className="h-4 w-4" />
                                <span>Expired {Math.abs(daysUntilExpiry)} days ago</span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        {policy.status === 'approved' && policy.approval_status !== 'pending' && !isExpired && (
                            <Can permission="create_policies">
                                <Button onClick={handleIssuePolicy} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    {isLoading ? 'Issuing...' : 'Issue Policy'}
                                </Button>
                            </Can>
                        )}

                        <Can permission="edit_policies">
                            <div className="flex gap-2">
                                <Link
                                    href={isExpired ? '#' : route('policy-management.amend', policy.id)}
                                    onClick={(e) => isExpired && e.preventDefault()}
                                >
                                    <Button variant="outline" disabled={isExpired} title={isExpired ? 'Cannot amend an expired policy' : ''}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Amend Policy
                                    </Button>
                                </Link>
                                <Link href={route('policy-management.edit', policy.id)}>
                                    <Button variant="outline">
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Details
                                    </Button>
                                </Link>
                            </div>
                        </Can>

                        {policy.certificates && policy.certificates.length > 0 ? (
                            <div className="flex gap-2">
                                {/* Download existing certificate */}
                                <Button
                                    variant="outline"
                                    onClick={() => window.open(route('certificates.download', policy.certificates![0].id), '_blank')}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Certificate
                                </Button>
                                {/* Preview certificate */}
                                <Button
                                    variant="outline"
                                    onClick={() => window.open(route('certificates.preview', policy.certificates![0].id), '_blank')}
                                >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Preview
                                </Button>
                            </div>
                        ) : (
                            <Can permission="generate_certificates">
                                <Button asChild disabled={isExpired}>
                                    {isExpired ? (
                                        <div className="flex cursor-not-allowed items-center opacity-50">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Generate Certificate
                                        </div>
                                    ) : (
                                        <Link href={route('policies.certificate-options', policy.id)}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Generate Certificate
                                        </Link>
                                    )}
                                </Button>
                            </Can>
                        )}

                        <Button variant="outline" onClick={() => window.print()}>
                            <FileText className="mr-2 h-4 w-4" />
                            Print
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Customer Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {policy.customer.type === 'corporate' ? <Users className="h-5 w-5" /> : <User className="h-5 w-5" />}
                                Customer Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-medium text-gray-900">{getCustomerDisplayName()}</h4>
                                <Badge variant="outline" className="mt-1">
                                    {policy.customer.type === 'corporate' ? 'Corporate' : 'Individual'}
                                </Badge>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <span>{policy.customer.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span>{policy.customer.phone}</span>
                                </div>
                                {policy.customer.address && (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="mt-0.5 h-4 w-4 text-gray-400" />
                                        <div>
                                            <div>{policy.customer.address}</div>
                                            {policy.customer.city && (
                                                <div className="text-gray-600">
                                                    {policy.customer.city}, {policy.customer.state}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Policy Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Policy Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium text-gray-600">Product</h4>
                                <p className="font-medium">{policy.policy_product?.name}</p>
                                <p className="text-sm text-gray-500">{policy.policy_product?.code}</p>
                            </div>

                            {policy.policy_type && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-600">Classification</h4>
                                    <div className="space-y-1 text-sm">
                                        <div>
                                            Type: <span className="font-medium">{policy.policy_type.name}</span>
                                        </div>
                                        {policy.policy_class && (
                                            <div>
                                                Class: <span className="font-medium">{policy.policy_class.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="text-sm font-medium text-gray-600">Coverage Period</h4>
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span>
                                        {formatDate(policy.effective_date)} - {formatDate(policy.expiry_date)}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    {Math.ceil(
                                        (new Date(policy.expiry_date).getTime() - new Date(policy.effective_date).getTime()) / (1000 * 60 * 60 * 24),
                                    )}{' '}
                                    days coverage
                                </p>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-600">Payment Frequency</h4>
                                <p className="font-medium capitalize">{policy.payment_frequency.replace('_', ' ')}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Issuance Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {policy.source_type === 'BROKER_RECORDED' ? (
                                    <Building2 className="h-5 w-5" />
                                ) : (
                                    <Shield className="h-5 w-5" />
                                )}
                                Issuance Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {policy.source_type === 'DIRECT_ISSUANCE' && policy.issued_by && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-600">Issued By</h4>
                                    <div className="mt-1 flex items-center gap-2">
                                        <User className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium">{policy.issued_by.name}</span>
                                    </div>
                                    {policy.issued_at && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            {formatDateTime(policy.issued_at)}
                                        </p>
                                    )}
                                </div>
                            )}

                            {policy.source_type === 'BROKER_RECORDED' && (
                                <>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-600">Broker</h4>
                                        <div className="mt-1 flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-gray-400" />
                                            <span className="font-medium">{policy.broker_tenant?.name ?? '—'}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-gray-600">Placement Date</h4>
                                        <div className="mt-1 flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <span>{policy.placement_date ? formatDate(policy.placement_date) : '—'}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-gray-600">Broker Slip Number</h4>
                                        <div className="mt-1 flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-gray-400" />
                                            <span className="font-medium">{policy.broker_slip_number ?? '—'}</span>
                                        </div>
                                    </div>

                                    {policy.schedule_file_path && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-600">Schedule File</h4>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-1"
                                                onClick={() => window.open(storageUrl(policy.schedule_file_path!), '_blank')}
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                Download Schedule
                                            </Button>
                                        </div>
                                    )}

                                    {policy.broker_slip_file_path && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-600">Broker Slip File</h4>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-1"
                                                onClick={() => window.open(storageUrl(policy.broker_slip_file_path!), '_blank')}
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                Download Broker Slip
                                            </Button>
                                        </div>
                                    )}
                                </>
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
                                    <span className="text-sm text-gray-600">Premium Amount</span>
                                    <span className="font-medium">{formatCurrency(policy.premium_amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Commission</span>
                                    <span className="font-medium">{formatCurrency(policy.commission_amount)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-lg font-semibold">
                                    <span>Total Amount</span>
                                    <span className="text-green-600">{formatCurrency(policy.total_amount)}</span>
                                </div>


                            </div>
                            <div className="mt-2 text-center text-xs text-gray-500">
                                See <span className="font-medium">Financial Notes</span> section below to create & download notes
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ═══════════════════════════════════════════════════════
                    FINANCIAL NOTES PANEL
                    ═══════════════════════════════════════════════════════ */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Financial Notes
                            </CardTitle>
                            {/* Quick create action per tab */}
                            {activeTab === 'debit' && (
                                <Button size="sm" onClick={() => generateQuickNote('debit')} disabled={isExpired || isGeneratingNote}>
                                    <FileText className="mr-1 h-4 w-4" />
                                    {isGeneratingNote ? 'Generating...' : 'Generate Debit Note'}
                                </Button>
                            )}
                            {activeTab === 'credit' && (
                                <Button size="sm" onClick={() => generateQuickNote('credit')} disabled={isExpired || isGeneratingNote}>
                                    <FileText className="mr-1 h-4 w-4" />
                                    {isGeneratingNote ? 'Generating...' : 'Generate Credit Note'}
                                </Button>
                            )}
                            {activeTab === 'invoices' && (
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => generateQuickNote('invoice')} disabled={isExpired || isGeneratingNote}>
                                        <FileText className="mr-1 h-4 w-4" />
                                        {isGeneratingNote ? 'Generating...' : 'Generate Invoice'}
                                    </Button>
                                    <Link href={route('invoices.create') + `?customer_id=${policy.customer_id}&policy_id=${policy.id}`}>
                                        <Button size="sm" variant="outline" disabled={isExpired}>
                                            <Plus className="mr-1 h-4 w-4" />
                                            Manual Invoice
                                        </Button>
                                    </Link>
                                </div>
                            )}
                            {activeTab === 'receipts' && (
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => generateQuickNote('receipt')} disabled={isExpired || isGeneratingNote}>
                                        <FileText className="mr-1 h-4 w-4" />
                                        {isGeneratingNote ? 'Generating...' : 'Generate Receipt'}
                                    </Button>
                                    <Link href={route('receipts.create') + `?policy_id=${policy.id}&customer_id=${policy.customer_id}`}>
                                        <Button size="sm" variant="outline">
                                            <Plus className="mr-1 h-4 w-4" />
                                            Manual Receipt
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Tabs */}
                        <div className="mt-3 flex gap-1 border-b">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.key
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800'
                                        }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span
                                            className={`ml-1 rounded-full px-1.5 py-0.5 text-xs font-semibold ${activeTab === tab.key ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </CardHeader>

                    <CardContent>
                        {/* ─── DEBIT NOTES ─── */}
                        {activeTab === 'debit' && (
                            <>
                                {policy.debit_notes && policy.debit_notes.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-left text-gray-500">
                                                    <th className="pb-2 font-medium">Note #</th>
                                                    <th className="pb-2 font-medium">Amount</th>
                                                    <th className="pb-2 font-medium">Due Date</th>
                                                    <th className="pb-2 font-medium">Status</th>
                                                    <th className="pb-2 font-medium">Created</th>
                                                    <th className="pb-2 text-right font-medium">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {policy.debit_notes.map((note) => (
                                                    <tr key={note.id} className="py-2">
                                                        <td className="py-3 font-medium">{note.note_number}</td>
                                                        <td className="py-3">{formatCurrency(note.amount)}</td>
                                                        <td className="py-3">{note.due_date ? formatDate(note.due_date) : '—'}</td>
                                                        <td className="py-3">
                                                            <span
                                                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${noteStatusColor(note.status)}`}
                                                            >
                                                                {note.status.replace('_', ' ').toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-gray-500">{formatDate(note.created_at)}</td>
                                                        <td className="py-3">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Link href={route('debit-notes.show', note.id)}>
                                                                    <Button size="sm" variant="ghost" title="View Details">
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                </Link>
                                                                {note.file_path && (
                                                                    <>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            title="Preview PDF"
                                                                            onClick={() =>
                                                                                openPreview(
                                                                                    route('debit-notes.preview', note.id),
                                                                                    `Debit Note ${note.note_number}`,
                                                                                )
                                                                            }
                                                                        >
                                                                            <Eye className="h-4 w-4 text-blue-600" />
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            title="Download PDF"
                                                                            onClick={() =>
                                                                                window.open(route('debit-notes.download', note.id), '_blank')
                                                                            }
                                                                        >
                                                                            <Download className="h-4 w-4 text-green-600" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                                {!note.file_path && (
                                                                    <Link href={route('debit-notes.template-options', note.id)}>
                                                                        <Button size="sm" variant="outline" title="Generate PDF">
                                                                            <FileText className="mr-1 h-4 w-4" />
                                                                            Generate
                                                                        </Button>
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <CreditCard className="mb-3 h-10 w-10 text-gray-300" />
                                        <p className="font-medium text-gray-500">No debit notes yet</p>
                                        <p className="mt-1 text-sm text-gray-400">
                                            Click <strong>Generate Debit Note</strong> to create one for this policy.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {/* ─── CREDIT NOTES ─── */}
                        {activeTab === 'credit' && (
                            <>
                                {policy.credit_notes && policy.credit_notes.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-left text-gray-500">
                                                    <th className="pb-2 font-medium">Note #</th>
                                                    <th className="pb-2 font-medium">Amount</th>
                                                    <th className="pb-2 font-medium">Status</th>
                                                    <th className="pb-2 font-medium">Created</th>
                                                    <th className="pb-2 text-right font-medium">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {policy.credit_notes.map((note) => (
                                                    <tr key={note.id} className="py-2">
                                                        <td className="py-3 font-medium">{note.note_number}</td>
                                                        <td className="py-3">{formatCurrency(note.amount)}</td>
                                                        <td className="py-3">
                                                            <span
                                                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${noteStatusColor(note.status)}`}
                                                            >
                                                                {note.status.replace('_', ' ').toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-gray-500">{formatDate(note.created_at)}</td>
                                                        <td className="py-3">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Link href={route('credit-notes.show', note.id)}>
                                                                    <Button size="sm" variant="ghost" title="View Details">
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                </Link>
                                                                {note.file_path && (
                                                                    <>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            title="Preview PDF"
                                                                            onClick={() =>
                                                                                openPreview(
                                                                                    route('credit-notes.preview', note.id),
                                                                                    `Credit Note ${note.note_number}`,
                                                                                )
                                                                            }
                                                                        >
                                                                            <Eye className="h-4 w-4 text-blue-600" />
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            title="Download PDF"
                                                                            onClick={() =>
                                                                                window.open(route('credit-notes.download', note.id), '_blank')
                                                                            }
                                                                        >
                                                                            <Download className="h-4 w-4 text-green-600" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                                {!note.file_path && (
                                                                    <Link href={route('credit-notes.template-options', note.id)}>
                                                                        <Button size="sm" variant="outline" title="Generate PDF">
                                                                            <FileText className="mr-1 h-4 w-4" />
                                                                            Generate
                                                                        </Button>
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <Receipt className="mb-3 h-10 w-10 text-gray-300" />
                                        <p className="font-medium text-gray-500">No credit notes yet</p>
                                        <p className="mt-1 text-sm text-gray-400">
                                            Click <strong>Generate Credit Note</strong> to create one for this policy.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {/* ─── INVOICES ─── */}
                        {activeTab === 'invoices' && (
                            <>
                                {policy.invoices && policy.invoices.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-left text-gray-500">
                                                    <th className="pb-2 font-medium">Invoice #</th>
                                                    <th className="pb-2 font-medium">Total</th>
                                                    <th className="pb-2 font-medium">Due Date</th>
                                                    <th className="pb-2 font-medium">Status</th>
                                                    <th className="pb-2 font-medium">Created</th>
                                                    <th className="pb-2 text-right font-medium">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {policy.invoices.map((invoice) => (
                                                    <tr key={invoice.id} className="py-2">
                                                        <td className="py-3 font-medium">{invoice.invoice_number}</td>
                                                        <td className="py-3">{formatCurrency(invoice.total_amount)}</td>
                                                        <td className="py-3">{invoice.due_date ? formatDate(invoice.due_date) : '—'}</td>
                                                        <td className="py-3">
                                                            <span
                                                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${noteStatusColor(invoice.status)}`}
                                                            >
                                                                {invoice.status.replace('_', ' ').toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-gray-500">{formatDate(invoice.created_at)}</td>
                                                        <td className="py-3">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Link href={route('invoices.show', invoice.id)}>
                                                                    <Button size="sm" variant="ghost" title="View Details">
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                </Link>
                                                                {invoice.file_path && (
                                                                    <>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            title="Preview PDF"
                                                                            onClick={() =>
                                                                                openPreview(
                                                                                    route('invoices.preview', invoice.id),
                                                                                    `Invoice ${invoice.invoice_number}`,
                                                                                )
                                                                            }
                                                                        >
                                                                            <Eye className="h-4 w-4 text-blue-600" />
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            title="Download PDF"
                                                                            onClick={() =>
                                                                                window.open(route('invoices.download', invoice.id), '_blank')
                                                                            }
                                                                        >
                                                                            <Download className="h-4 w-4 text-green-600" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                                {!invoice.file_path && (
                                                                    <Link href={route('invoices.template-options', invoice.id)}>
                                                                        <Button size="sm" variant="outline" title="Generate PDF">
                                                                            <FileText className="mr-1 h-4 w-4" />
                                                                            Generate
                                                                        </Button>
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <FileText className="mb-3 h-10 w-10 text-gray-300" />
                                        <p className="font-medium text-gray-500">No invoices yet</p>
                                        <p className="mt-1 text-sm text-gray-400">
                                            Click <strong>New Invoice</strong> to create one for this policy.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {/* ─── RECEIPTS ─── */}
                        {activeTab === 'receipts' && (
                            <>
                                {policy.receipts && policy.receipts.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-left text-gray-500">
                                                    <th className="pb-2 font-medium">Receipt #</th>
                                                    <th className="pb-2 font-medium">Amount Paid</th>
                                                    <th className="pb-2 font-medium">Payment Method</th>
                                                    <th className="pb-2 font-medium">Payment Date</th>
                                                    <th className="pb-2 font-medium">Status</th>
                                                    <th className="pb-2 text-right font-medium">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {policy.receipts.map((receipt) => (
                                                    <tr key={receipt.id} className="py-2">
                                                        <td className="py-3 font-medium">{receipt.receipt_number}</td>
                                                        <td className="py-3">{formatCurrency(receipt.amount_paid)}</td>
                                                        <td className="py-3 capitalize">{receipt.payment_method?.replace('_', ' ') ?? '—'}</td>
                                                        <td className="py-3">{receipt.payment_date ? formatDate(receipt.payment_date) : '—'}</td>
                                                        <td className="py-3">
                                                            <span
                                                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${noteStatusColor(receipt.status)}`}
                                                            >
                                                                {receipt.status.replace('_', ' ').toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="py-3">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Link href={route('receipts.show', receipt.id)}>
                                                                    <Button size="sm" variant="ghost" title="View Details">
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                </Link>
                                                                {receipt.file_path && (
                                                                    <>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            title="Preview PDF"
                                                                            onClick={() =>
                                                                                openPreview(
                                                                                    route('receipts.preview', receipt.id),
                                                                                    `Receipt ${receipt.receipt_number}`,
                                                                                )
                                                                            }
                                                                        >
                                                                            <Eye className="h-4 w-4 text-blue-600" />
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            title="Download PDF"
                                                                            onClick={() =>
                                                                                window.open(route('receipts.download', receipt.id), '_blank')
                                                                            }
                                                                        >
                                                                            <Download className="h-4 w-4 text-green-600" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                                {!receipt.file_path && (
                                                                    <Link href={route('receipts.template-options', receipt.id)}>
                                                                        <Button size="sm" variant="outline" title="Generate PDF">
                                                                            <FileText className="mr-1 h-4 w-4" />
                                                                            Generate
                                                                        </Button>
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <Receipt className="mb-3 h-10 w-10 text-gray-300" />
                                        <p className="font-medium text-gray-500">No receipts yet</p>
                                        <p className="mt-1 text-sm text-gray-400">
                                            Click <strong>New Receipt</strong> to record a payment for this policy.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Coverage Details */}
                {policy.coverage_details && Object.keys(policy.coverage_details).length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Coverage Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {Object.entries(policy.coverage_details).map(([key, value]) => (
                                    <div key={key} className="space-y-1">
                                        <h4 className="text-sm font-medium text-gray-600 capitalize">{key.replace(/_/g, ' ')}</h4>
                                        <p className="font-medium">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Policy Lifecycle */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Policy Lifecycle
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between border-b py-2">
                                    <span className="text-sm font-medium">Created</span>
                                    <span className="text-sm text-gray-600">{formatDateTime(policy.created_at)}</span>
                                </div>

                                {policy.approved_at && (
                                    <div className="flex items-center justify-between border-b py-2">
                                        <span className="text-sm font-medium">Approved</span>
                                        <span className="text-sm text-gray-600">{formatDateTime(policy.approved_at)}</span>
                                    </div>
                                )}

                                {policy.issued_at && (
                                    <div className="flex items-center justify-between border-b py-2">
                                        <span className="text-sm font-medium">Issued</span>
                                        <span className="text-sm text-gray-600">{formatDateTime(policy.issued_at)}</span>
                                    </div>
                                )}

                                {policy.renewed_at && (
                                    <div className="flex items-center justify-between border-b py-2">
                                        <span className="text-sm font-medium">Last Renewed</span>
                                        <span className="text-sm text-gray-600">{formatDateTime(policy.renewed_at)}</span>
                                    </div>
                                )}
                            </div>

                            {(policy.created_by_user || policy.approved_by_user) && (
                                <div className="border-t pt-4">
                                    <h5 className="mb-2 font-medium text-gray-900">Personnel</h5>
                                    <div className="space-y-2 text-sm">
                                        {policy.created_by_user && (
                                            <div>
                                                Created by: <span className="font-medium">{policy.created_by_user.name}</span>
                                            </div>
                                        )}
                                        {policy.approved_by_user && (
                                            <div>
                                                Approved by: <span className="font-medium">{policy.approved_by_user.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Documents & Notes */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Documents & Notes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Documents */}
                            {policy.documents && policy.documents.length > 0 ? (
                                <div>
                                    <h5 className="mb-2 font-medium text-gray-900">Policy Documents</h5>
                                    <div className="space-y-2">
                                        {policy.documents.map((doc) => (
                                            <div key={doc.id} className="flex items-center justify-between rounded bg-gray-50 p-2 dark:bg-gray-800">
                                                <div>
                                                    <p className="text-sm font-medium">{doc.document_name}</p>
                                                    <p className="text-xs text-gray-500">{doc.document_type}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={doc.status === 'generated' ? 'default' : 'secondary'}>{doc.status}</Badge>
                                                    {doc.status === 'generated' && (
                                                        <Button size="sm" variant="outline">
                                                            <Download className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="py-4 text-center">
                                    <FileText className="mx-auto h-8 w-8 text-gray-400" />
                                    <p className="mt-2 text-sm text-gray-500">No documents generated yet</p>
                                </div>
                            )}

                            {/* Notes */}
                            {(policy.notes || policy.internal_notes) && (
                                <div className="border-t pt-4">
                                    <h5 className="mb-2 font-medium text-gray-900">Notes</h5>
                                    <div className="space-y-3">
                                        {policy.notes && (
                                            <div>
                                                <h6 className="text-sm font-medium text-gray-600">Policy Notes</h6>
                                                <p className="mt-1 text-sm text-gray-800">{policy.notes}</p>
                                            </div>
                                        )}
                                        {policy.internal_notes && (
                                            <div>
                                                <h6 className="text-sm font-medium text-gray-600">Internal Notes</h6>
                                                <p className="mt-1 text-sm text-gray-800">{policy.internal_notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Quote Reference */}
                {policy.quote && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Receipt className="h-5 w-5" />
                                Quote Reference
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Quote #{policy.quote.quote_number}</p>
                                    <p className="text-sm text-gray-600">This policy was converted from the above quote</p>
                                </div>
                                <Link href={route('quotes.show', policy.quote.id)}>
                                    <Button variant="outline" size="sm">
                                        View Quote
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Policy Amendments */}
                {policy.amendments && policy.amendments.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Edit className="h-5 w-5" />
                                Policy Amendments
                                <Badge variant="outline">{policy.amendments.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {policy.amendments.map((amendment) => (
                                    <div key={amendment.id} className="rounded-lg border p-4">
                                        <div className="mb-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium">{amendment.amendment_number}</h4>
                                                <Badge
                                                    variant={
                                                        amendment.status === 'active'
                                                            ? 'default'
                                                            : amendment.status === 'approved'
                                                                ? 'secondary'
                                                                : amendment.status === 'pending_approval'
                                                                    ? 'outline'
                                                                    : 'destructive'
                                                    }
                                                >
                                                    {amendment.status.replace('_', ' ').toUpperCase()}
                                                </Badge>
                                            </div>
                                            <span className="text-sm text-gray-500">{formatDate(amendment.created_at)}</span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                                            <div>
                                                <p className="text-gray-600">Type</p>
                                                <p className="font-medium capitalize">{amendment.amendment_type.replace('_', ' ')}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Effective Date</p>
                                                <p className="font-medium">{formatDate(amendment.effective_date)}</p>
                                            </div>
                                            {amendment.premium_adjustment !== 0 && (
                                                <div>
                                                    <p className="text-gray-600">Premium Adjustment</p>
                                                    <p
                                                        className={`font-medium ${amendment.premium_adjustment > 0 ? 'text-green-600' : 'text-red-600'}`}
                                                    >
                                                        {amendment.premium_adjustment > 0 ? '+' : ''}
                                                        {formatCurrency(amendment.premium_adjustment)}
                                                    </p>
                                                </div>
                                            )}
                                            {amendment.new_premium_amount && (
                                                <div>
                                                    <p className="text-gray-600">New Premium</p>
                                                    <p className="font-medium text-green-600">{formatCurrency(amendment.new_premium_amount)}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-3">
                                            <p className="text-sm text-gray-600">Reason</p>
                                            <p className="text-sm">{amendment.amendment_reason}</p>
                                        </div>

                                        {amendment.created_by_user && (
                                            <div className="mt-2 text-xs text-gray-500">Created by: {amendment.created_by_user.name}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* ─── Debit / Credit Note Create Modal ─── */}
            {isModalOpen && <CreateFinancialNoteModal policy={policy} type={modalType} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}

            {/* ─── PDF Preview Modal ─── */}
            {previewUrl && (
                <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
                    <DialogContent className="flex h-[90vh] max-w-4xl flex-col p-0">
                        <DialogHeader className="flex-shrink-0 border-b px-6 py-4">
                            <div className="flex items-center justify-between">
                                <DialogTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    {previewTitle}
                                </DialogTitle>
                                <Button size="sm" variant="outline" onClick={() => window.open(previewUrl, '_blank')} className="mr-6">
                                    <Download className="mr-1 h-4 w-4" />
                                    Open in new tab
                                </Button>
                            </div>
                        </DialogHeader>
                        <div className="flex-1 overflow-hidden">
                            <iframe src={previewUrl} className="h-full w-full border-0" title={previewTitle} />
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </AppLayout>
    );
}
