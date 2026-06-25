import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { CheckCircle, Clock, Download, Eye, FileText, RotateCcw, Send, User, X } from 'lucide-react';
import { useState } from 'react';

interface Customer {
    first_name: string;
    last_name: string;
    company_name?: string;
    type: string;
    email?: string;
    phone?: string;
}

interface PolicyProduct {
    name: string;
    description?: string;
}

interface Policy {
    id: number;
    policy_number: string;
    effective_date: string;
    expiry_date: string;
    premium_amount: number;
    total_amount: number;
    status: string;
    customer: Customer;
    policy_product: PolicyProduct;
}

interface CertificateTemplate {
    id: number;
    name: string;
    type: string;
    category: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface AuditTrailItem {
    action: string;
    description: string;
    notes?: string;
    user_name: string;
    timestamp: string;
    ip_address?: string;
}

interface Certificate {
    id: number;
    certificate_number: string;
    type: string;
    status: string;
    generated_at: string;
    issued_at?: string;
    expires_at?: string;
    file_path?: string;
    file_name?: string;
    file_size?: number;
    certificate_image_path?: string;
    certificate_image_name?: string;
    certificate_image_size?: number;
    barcode_data?: string;
    qr_code_data?: string;
    notes?: string;
    audit_trail: AuditTrailItem[];
    policy: Policy;
    template: CertificateTemplate;
    document_template_id?: number;
    document_template?: CertificateTemplate;
    generator?: User;
    issuer?: User;
}

interface Props {
    certificate: Certificate;
}

export default function CertificateShow({ certificate }: Props) {
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    const {
        data: issueData,
        setData: setIssueData,
        post: postIssue,
        processing: issueProcessing,
    } = useForm({
        notes: '',
    });

    const {
        data: cancelData,
        setData: setCancelData,
        post: postCancel,
        processing: cancelProcessing,
    } = useForm({
        reason: '',
    });

    const getCustomerName = (customer: Customer) => {
        if (customer.type === 'corporate') {
            return customer.company_name || `${customer.first_name} ${customer.last_name}`;
        }
        return `${customer.first_name} ${customer.last_name}`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 text-gray-800';
            case 'generated':
                return 'bg-blue-100 text-blue-800';
            case 'issued':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleIssue = (e: React.FormEvent) => {
        e.preventDefault();
        postIssue(route('certificates.issue', certificate.id), {
            onSuccess: () => {
                setShowIssueModal(false);
                setIssueData({ notes: '' });
            },
        });
    };

    const handleCancel = (e: React.FormEvent) => {
        e.preventDefault();
        postCancel(route('certificates.cancel', certificate.id), {
            onSuccess: () => {
                setShowCancelModal(false);
                setCancelData({ reason: '' });
            },
        });
    };

    const handleRegenerate = () => {
        // For regeneration, we need to redirect to the generate page with the same template
        // This allows the user to modify the design and regenerate
        router.visit(route('policies.certificate-options', certificate.policy.id), {
            data: {
                template_id: certificate.document_template_id,
                regenerate_certificate_id: certificate.id,
            },
        });
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'generated':
                return <FileText className="h-4 w-4 text-blue-500" />;
            case 'issued':
                return <Send className="h-4 w-4 text-green-500" />;
            case 'cancelled':
                return <X className="h-4 w-4 text-red-500" />;
            case 'downloaded':
                return <Download className="h-4 w-4 text-gray-500" />;
            case 'verified':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            default:
                return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    return (
        <AppLayout>
            <Head title={`Certificate: ${certificate.certificate_number}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <h1 className="text-tracking-tight text-2xl font-bold">Certificate Details</h1>
                        <p className="text-muted-foreground">{certificate.certificate_number}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => setShowPreviewModal(true)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                        </Button>

                        {certificate.file_path && (
                            <Button variant="outline" onClick={() => (window.location.href = route('certificates.download', certificate.id))}>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </Button>
                        )}
                        {certificate.status === 'generated' && (
                            <Button onClick={() => setShowIssueModal(true)}>
                                <Send className="mr-2 h-4 w-4" />
                                Issue Certificate
                            </Button>
                        )}
                        {(certificate.status === 'generated' || certificate.status === 'issued') && (
                            <Button variant="outline" onClick={handleRegenerate}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Regenerate
                            </Button>
                        )}
                        {(certificate.status === 'generated' || certificate.status === 'issued') && (
                            <Button variant="destructive" onClick={() => setShowCancelModal(true)}>
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Certificate Information */}
                    <div className="space-y-6 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Certificate Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Certificate Number</Label>
                                        <p className="text-sm font-medium">{certificate.certificate_number}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Status</Label>
                                        <Badge className={getStatusColor(certificate.status)}>
                                            {certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)}
                                        </Badge>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Type</Label>
                                        <p className="text-sm">
                                            {certificate.type
                                                .split('_')
                                                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                                .join(' ')}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Template</Label>
                                        <p className="text-sm">{certificate?.document_template?.name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Generated</Label>
                                        <p className="text-sm">{formatDate(certificate?.generated_at)}</p>
                                    </div>
                                    {certificate.issued_at && (
                                        <div>
                                            <Label className="text-sm font-medium text-gray-600">Issued</Label>
                                            <p className="text-sm">{formatDate(certificate?.issued_at)}</p>
                                        </div>
                                    )}
                                </div>

                                {certificate.file_path && (
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">File Information</Label>
                                        <div className="mt-2 space-y-2">
                                            {certificate.file_path && (
                                                <div className="rounded border bg-gray-50 p-3 dark:bg-gray-800">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm font-medium">PDF: {certificate.file_name}</p>
                                                            {certificate.file_size && (
                                                                <p className="text-xs text-gray-500">{formatFileSize(certificate.file_size)}</p>
                                                            )}
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => (window.location.href = route('certificates.download', certificate.id))}
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {certificate.notes && (
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Notes</Label>
                                        <p className="mt-1 text-sm text-gray-700">{certificate.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Policy Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Related Policy</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Policy Number</Label>
                                        <p className="text-sm font-medium">{certificate?.policy?.policy_number}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Product</Label>
                                        <p className="text-sm">{certificate?.policy?.policy_product?.name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Customer</Label>
                                        <p className="text-sm">{getCustomerName(certificate?.policy?.customer)}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Premium</Label>
                                        <p className="text-sm">₦{certificate?.policy?.premium_amount.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Effective Date</Label>
                                        <p className="text-sm">{new Date(certificate?.policy?.effective_date).toLocaleDateString('en-NG')}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Expiry Date</Label>
                                        <p className="text-sm">{new Date(certificate?.policy?.expiry_date).toLocaleDateString('en-NG')}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => window.open(route('certificates.preview', certificate.id), '_blank')}
                                >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Preview Certificate
                                </Button>
                                {(certificate.file_path || certificate.certificate_image_path) && (
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => (window.location.href = route('certificates.download', certificate.id))}
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Download Certificate
                                    </Button>
                                )}
                                {certificate.qr_code_data && (
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => window.open(certificate.qr_code_data, '_blank')}
                                    >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Verify Online
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {/* Generation Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Generation Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {certificate.generator && (
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Generated By</Label>
                                        <div className="mt-1 flex items-center gap-2">
                                            <User className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm">{certificate?.generator?.name}</span>
                                        </div>
                                    </div>
                                )}
                                {certificate.issuer && (
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Issued By</Label>
                                        <div className="mt-1 flex items-center gap-2">
                                            <User className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm">{certificate?.issuer?.name}</span>
                                        </div>
                                    </div>
                                )}
                                <Separator />
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Template Category</Label>
                                    <p className="mt-1 text-sm capitalize">{certificate?.template?.category}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Activity Log */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Activity Log</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {certificate.audit_trail.map((item, index) => (
                                        <div key={index} className="flex gap-3">
                                            {getActionIcon(item.action)}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium">{item.description}</p>
                                                <p className="text-xs text-gray-500">
                                                    {item.user_name} • {formatDate(item.timestamp)}
                                                </p>
                                                {item.notes && <p className="mt-1 text-xs text-gray-600">{item.notes}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Issue Certificate Modal */}
                {showIssueModal && (
                    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                        <div className="w-full max-w-md rounded-lg bg-white p-6">
                            <h3 className="mb-4 text-lg font-semibold">Issue Certificate</h3>
                            <form onSubmit={handleIssue}>
                                <div className="mb-4">
                                    <Label htmlFor="notes">Notes (Optional)</Label>
                                    <Textarea
                                        id="notes"
                                        value={issueData.notes}
                                        onChange={(e) => setIssueData('notes', e.target.value)}
                                        placeholder="Add any notes about issuing this certificate..."
                                        rows={3}
                                        className="mt-1"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button type="submit" disabled={issueProcessing} className="flex-1">
                                        {issueProcessing ? 'Issuing...' : 'Issue Certificate'}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => setShowIssueModal(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                {/* Show Preview Modal */}
                {showPreviewModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                        <div className="relative w-full max-w-5xl rounded-lg bg-white shadow-xl dark:bg-gray-700">
                            <div className="flex items-center justify-between border-b px-4 py-2">
                                <h3 className="text-lg font-semibold">Certificate Preview</h3>
                                <button onClick={() => setShowPreviewModal(false)} className="rounded-full p-2 hover:bg-gray-100">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex h-[90vh] justify-center overflow-auto bg-gray-50 p-4 dark:bg-gray-600">
                                {certificate.file_path && (
                                    <iframe src={route('certificates.preview', certificate.id)} className="h-full w-full rounded border" />
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Cancel Certificate Modal */}
                {showCancelModal && (
                    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
                        <div className="w-full max-w-md rounded-lg bg-white p-6">
                            <h3 className="mb-4 text-lg font-semibold">Cancel Certificate</h3>
                            <form onSubmit={handleCancel}>
                                <div className="mb-4">
                                    <Label htmlFor="reason">Cancellation Reason *</Label>
                                    <Textarea
                                        id="reason"
                                        value={cancelData.reason}
                                        onChange={(e) => setCancelData('reason', e.target.value)}
                                        placeholder="Please provide a reason for cancelling this certificate..."
                                        rows={3}
                                        className="mt-1"
                                        required
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button type="submit" variant="destructive" disabled={cancelProcessing} className="flex-1">
                                        {cancelProcessing ? 'Cancelling...' : 'Cancel Certificate'}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => setShowCancelModal(false)}>
                                        Close
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
