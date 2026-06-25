import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Calendar, CheckCircle, Clock, Copy, Download, Edit, FileText, Mail, RefreshCw, Send, Trash2, User, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Customer {
    id: number;
    type: 'individual' | 'corporate';
    first_name?: string;
    last_name?: string;
    company_name?: string;
    email: string;
    phone?: string;
    address?: string;
}

interface InsuranceProduct {
    id: number;
    name: string;
    type: string;
    description?: string;
}

interface User {
    id: number;
    name: string;
}

interface Policy {
    id: number;
    policy_number: string;
    status: string;
}

interface Quote {
    id: number;
    quote_number: string;
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
    coverage_details: any[];
    premium_amount: string;
    commission_amount: string;
    total_amount: string;
    valid_until: string;
    form_data: Record<string, any>;
    notes?: string;
    internal_notes?: string;
    customer: Customer;
    insurance_product: InsuranceProduct;
    created_by: User;
    policy?: Policy;
    created_at: string;
    updated_at: string;
    sent_at?: string;
    accepted_at?: string;
    rejected_at?: string;
    expired_at?: string;
    formatted_premium_amount: string;
    formatted_total_amount: string;
    is_expired: boolean;
    status_color: string;
    customer_name: string;
}

interface Props {
    quote: Quote;
    canEdit: boolean;
    canSend: boolean;
    canAccept: boolean;
    canReject: boolean;
    canConvertToPolicy: boolean;
}

export default function QuoteShow({ quote, canEdit, canSend, canAccept, canReject, canConvertToPolicy }: Props) {
    const [showActionModal, setShowActionModal] = useState<string | null>(null);

    const {
        data: acceptData,
        setData: setAcceptData,
        post: postAccept,
        processing: acceptProcessing,
    } = useForm({
        reason: '',
    });

    const {
        data: rejectData,
        setData: setRejectData,
        post: postReject,
        processing: rejectProcessing,
    } = useForm({
        reason: '',
    });

    const {
        data: extendData,
        setData: setExtendData,
        post: postExtend,
        processing: extendProcessing,
    } = useForm({
        days: 30,
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'draft':
                return <FileText className="h-5 w-5 text-gray-500" />;
            case 'sent':
                return <Mail className="h-5 w-5 text-blue-500" />;
            case 'accepted':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'rejected':
                return <XCircle className="h-5 w-5 text-red-500" />;
            case 'expired':
                return <Clock className="h-5 w-5 text-orange-500" />;
            default:
                return <FileText className="h-5 w-5 text-gray-500" />;
        }
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'draft':
                return 'secondary';
            case 'sent':
                return 'default';
            case 'accepted':
                return 'default';
            case 'rejected':
                return 'destructive';
            case 'expired':
                return 'outline';
            default:
                return 'secondary';
        }
    };

    const handleSendQuote = () => {
        router.post(
            route('quotes.send', quote.id),
            {},
            {
                onSuccess: () => {
                    toast.success('Quote has been sent to customer successfully');
                },
                onError: () => {
                    toast.error('Failed to send quote');
                },
            },
        );
    };

    const handleAcceptQuote = () => {
        postAccept(route('quotes.accept', quote.id), {
            onSuccess: () => {
                toast.success('Quote has been accepted successfully');
                setShowActionModal(null);
            },
            onError: () => {
                toast.error('Failed to accept quote');
            },
        });
    };

    const handleRejectQuote = () => {
        postReject(route('quotes.reject', quote.id), {
            onSuccess: () => {
                toast.success('Quote has been rejected successfully');
                setShowActionModal(null);
            },
            onError: () => {
                toast.error('Failed to reject quote');
            },
        });
    };

    const handleExtendValidity = () => {
        postExtend(route('quotes.extend-validity', quote.id), {
            onSuccess: () => {
                toast.success(`Quote validity extended by ${extendData.days} days`);
                setShowActionModal(null);
            },
            onError: () => {
                toast.error('Failed to extend quote validity');
            },
        });
    };

    const handleDuplicate = () => {
        router.post(
            route('quotes.duplicate', quote.id),
            {},
            {
                onSuccess: () => {
                    toast.success('Quote has been duplicated successfully');
                },
                onError: () => {
                    toast.error('Failed to duplicate quote');
                },
            },
        );
    };

    const handleConvertToPolicy = () => {
        router.post(
            route('quotes.convert-to-policy', quote.id),
            {},
            {
                onSuccess: () => {
                    toast.success('Quote has been converted to policy successfully');
                },
                onError: () => {
                    toast.error('Failed to convert quote to policy');
                },
            },
        );
    };

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete quote #${quote.quote_number}?`)) {
            router.delete(route('quotes.destroy', quote.id), {
                onSuccess: () => {
                    toast.success('Quote has been deleted successfully');
                    router.visit(route('quotes.index'));
                },
                onError: () => {
                    toast.error('Failed to delete quote');
                },
            });
        }
    };

    return (
        <AppLayout>
            <Head title={`Quote #${quote.quote_number}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div>
                            <div className="flex items-center space-x-3">
                                {getStatusIcon(quote.status)}
                                <h1 className="text-2xl font-semibold text-foreground">Quote #{quote.quote_number}</h1>
                                <Badge variant={getStatusBadgeVariant(quote.status)}>
                                    {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                                </Badge>
                                {quote.is_expired && <Badge variant="destructive">Expired</Badge>}
                            </div>
                            <p className="text-muted-foreground">Created on {formatDate(quote.created_at)}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        {canEdit && (
                            <Link href={route('quotes.edit', quote.id)}>
                                <Button variant="outline">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                        )}

                        {canSend && (
                            <Button onClick={handleSendQuote}>
                                <Send className="mr-2 h-4 w-4" />
                                Send Quote
                            </Button>
                        )}

                        <Button variant="outline" onClick={handleDuplicate}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                        </Button>

                        <Button variant="outline" onClick={() => window.print()}>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                        </Button>
                    </div>
                </div>

                {/* Quick Actions */}
                {(canAccept || canReject || canConvertToPolicy) && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-2">
                                {canAccept && (
                                    <Button
                                        variant="default"
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => setShowActionModal('accept')}
                                    >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Accept Quote
                                    </Button>
                                )}

                                {canReject && (
                                    <Button variant="destructive" onClick={() => setShowActionModal('reject')}>
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Reject Quote
                                    </Button>
                                )}

                                {canConvertToPolicy && (
                                    <Button variant="default" onClick={handleConvertToPolicy}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Convert to Policy
                                    </Button>
                                )}

                                {(quote.status === 'sent' || quote.status === 'expired') && (
                                    <Button variant="outline" onClick={() => setShowActionModal('extend')}>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Extend Validity
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Customer Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <User className="h-5 w-5" />
                                    <span>Customer Information</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">Name:</span>
                                        <span className="font-medium">{quote.customer_name}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">Type:</span>
                                        <Badge variant="outline">{quote.customer.type.charAt(0).toUpperCase() + quote.customer.type.slice(1)}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">Email:</span>
                                        <span>{quote.customer.email}</span>
                                    </div>
                                    {quote.customer.phone && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-muted-foreground">Phone:</span>
                                            <span>{quote.customer.phone}</span>
                                        </div>
                                    )}
                                    {quote.customer.address && (
                                        <div className="flex items-start justify-between">
                                            <span className="text-sm font-medium text-muted-foreground">Address:</span>
                                            <span className="max-w-xs text-right">{quote.customer.address}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Insurance Product */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Insurance Product</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">Product:</span>
                                        <span className="font-medium">{quote.insurance_product.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">Type:</span>
                                        <Badge variant="secondary">{quote.insurance_product.type}</Badge>
                                    </div>
                                    {quote.insurance_product.description && (
                                        <div className="pt-2">
                                            <span className="text-sm font-medium text-muted-foreground">Description:</span>
                                            <p className="mt-1 text-sm">{quote.insurance_product.description}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Coverage Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Coverage Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {quote.coverage_details && quote.coverage_details.length > 0 ? (
                                        quote.coverage_details.map((detail, index) => (
                                            <div key={index} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                                                <div>
                                                    <span className="font-medium">{detail.type}</span>
                                                    {detail.description && <p className="text-sm text-muted-foreground">{detail.description}</p>}
                                                </div>
                                                <span className="font-medium">₦{parseFloat(detail.amount || 0).toLocaleString()}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground">No coverage details specified</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Form Data */}
                        {quote.form_data && Object.keys(quote.form_data).length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Additional Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {Object.entries(quote.form_data).map(([key, value]) => (
                                            <div key={key} className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-muted-foreground capitalize">
                                                    {key.replace(/_/g, ' ')}:
                                                </span>
                                                <span>{String(value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Notes */}
                        {(quote.notes || quote.internal_notes) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notes</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {quote.notes && (
                                        <div>
                                            <Label className="text-sm font-medium">Customer Notes</Label>
                                            <p className="mt-1 rounded-md bg-muted p-3 text-sm">{quote.notes}</p>
                                        </div>
                                    )}
                                    {quote.internal_notes && (
                                        <div>
                                            <Label className="text-sm font-medium">Internal Notes</Label>
                                            <p className="mt-1 rounded-md bg-muted p-3 text-sm">{quote.internal_notes}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quote Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">Premium Amount:</span>
                                    <span className="font-semibold">{quote.formatted_premium_amount}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">Commission:</span>
                                    <span>₦{parseFloat(quote.commission_amount).toLocaleString()}</span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-base font-semibold">Total Amount:</span>
                                    <span className="text-lg font-bold text-primary">{quote.formatted_total_amount}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Timeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Calendar className="h-5 w-5" />
                                    <span>Timeline</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-start space-x-3">
                                    <div className="mt-2 h-2 w-2 rounded-full bg-blue-500"></div>
                                    <div>
                                        <p className="text-sm font-medium">Quote Created</p>
                                        <p className="text-xs text-muted-foreground">{formatDate(quote.created_at)}</p>
                                        <p className="text-xs text-muted-foreground">by {quote.created_by.name}</p>
                                    </div>
                                </div>

                                {quote.sent_at && (
                                    <div className="flex items-start space-x-3">
                                        <div className="mt-2 h-2 w-2 rounded-full bg-green-500"></div>
                                        <div>
                                            <p className="text-sm font-medium">Quote Sent</p>
                                            <p className="text-xs text-muted-foreground">{formatDate(quote.sent_at)}</p>
                                        </div>
                                    </div>
                                )}

                                {quote.accepted_at && (
                                    <div className="flex items-start space-x-3">
                                        <div className="mt-2 h-2 w-2 rounded-full bg-green-500"></div>
                                        <div>
                                            <p className="text-sm font-medium">Quote Accepted</p>
                                            <p className="text-xs text-muted-foreground">{formatDate(quote.accepted_at)}</p>
                                        </div>
                                    </div>
                                )}

                                {quote.rejected_at && (
                                    <div className="flex items-start space-x-3">
                                        <div className="mt-2 h-2 w-2 rounded-full bg-red-500"></div>
                                        <div>
                                            <p className="text-sm font-medium">Quote Rejected</p>
                                            <p className="text-xs text-muted-foreground">{formatDate(quote.rejected_at)}</p>
                                        </div>
                                    </div>
                                )}

                                {quote.expired_at && (
                                    <div className="flex items-start space-x-3">
                                        <div className="mt-2 h-2 w-2 rounded-full bg-orange-500"></div>
                                        <div>
                                            <p className="text-sm font-medium">Quote Expired</p>
                                            <p className="text-xs text-muted-foreground">{formatDate(quote.expired_at)}</p>
                                        </div>
                                    </div>
                                )}

                                <Separator />
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-muted-foreground">Valid Until:</span>
                                    <span className={`font-medium ${quote.is_expired ? 'text-destructive' : 'text-foreground'}`}>
                                        {new Date(quote.valid_until).toLocaleDateString('en-GB')}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Related Policy */}
                        {quote.policy && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Related Policy</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-muted-foreground">Policy Number:</span>
                                            <span className="font-medium">{quote.policy.policy_number}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-muted-foreground">Status:</span>
                                            <Badge variant="default">{quote.policy.status}</Badge>
                                        </div>
                                        <div className="mt-3">
                                            <Link href={route('policies.show', quote.policy.id)}>
                                                <Button variant="outline" size="sm" className="w-full">
                                                    View Policy
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Danger Zone */}
                        {quote.status === 'draft' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="destructive" size="sm" className="w-full" onClick={handleDelete}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Quote
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Action Modals */}
                {showActionModal === 'accept' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <Card className="w-full max-w-md">
                            <CardHeader>
                                <CardTitle>Accept Quote</CardTitle>
                                <CardDescription>Are you sure you want to accept this quote?</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="accept-reason">Reason (optional)</Label>
                                    <Textarea
                                        id="accept-reason"
                                        value={acceptData.reason}
                                        onChange={(e) => setAcceptData('reason', e.target.value)}
                                        placeholder="Enter reason for accepting this quote..."
                                    />
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <Button variant="outline" onClick={() => setShowActionModal(null)} disabled={acceptProcessing}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleAcceptQuote} disabled={acceptProcessing} className="bg-green-600 hover:bg-green-700">
                                        {acceptProcessing ? 'Accepting...' : 'Accept Quote'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {showActionModal === 'reject' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <Card className="w-full max-w-md">
                            <CardHeader>
                                <CardTitle>Reject Quote</CardTitle>
                                <CardDescription>Please provide a reason for rejecting this quote.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reject-reason">Reason *</Label>
                                    <Textarea
                                        id="reject-reason"
                                        value={rejectData.reason}
                                        onChange={(e) => setRejectData('reason', e.target.value)}
                                        placeholder="Enter reason for rejecting this quote..."
                                        required
                                    />
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <Button variant="outline" onClick={() => setShowActionModal(null)} disabled={rejectProcessing}>
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleRejectQuote}
                                        disabled={rejectProcessing || !rejectData.reason.trim()}
                                    >
                                        {rejectProcessing ? 'Rejecting...' : 'Reject Quote'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {showActionModal === 'extend' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <Card className="w-full max-w-md">
                            <CardHeader>
                                <CardTitle>Extend Quote Validity</CardTitle>
                                <CardDescription>Extend the validity period of this quote.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="extend-days">Extend by (days)</Label>
                                    <input
                                        id="extend-days"
                                        type="number"
                                        min="1"
                                        max="365"
                                        value={extendData.days}
                                        onChange={(e) => setExtendData('days', parseInt(e.target.value) || 30)}
                                        className="w-full rounded-md border px-3 py-2"
                                    />
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <Button variant="outline" onClick={() => setShowActionModal(null)} disabled={extendProcessing}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleExtendValidity} disabled={extendProcessing}>
                                        {extendProcessing ? 'Extending...' : 'Extend Validity'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
