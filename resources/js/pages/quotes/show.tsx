import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
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
    Loader2,
    Mail,
    Send,
    Shield,
    User,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Customer {
    id: number;
    first_name: string;
    last_name: string;
    company_name?: string;
    email: string;
    phone: string;
    type: 'individual' | 'corporate';
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface QuoteRisk {
    id: number;
    description: string;
    identifier?: string;
    location?: string;
    coverage_amount: number;
    rate: number;
    rate_basis: 'percentage' | 'per_mille' | 'fixed';
    premium: number;
    taxes: number;
    fees: number;
    dynamic_fields: Record<string, any>;
    policy_product_id?: number;
    policy_product?: { id: number; name: string };
}

interface QuoteClause {
    id: number;
    clause_type: string;
    title: string;
    content: string;
    is_standard: boolean;
}

interface QuoteVersion {
    id: number;
    version: number;
    snapshot_json: Record<string, any>;
    created_by?: User;
    created_at: string;
}

interface QuoteApproval {
    id: number;
    status: string;
    request_notes?: string;
    approval_notes?: string;
    rejection_reason?: string;
    changes_requested?: string;
    requested_at: string;
    reviewed_at?: string;
    requestedBy?: User;
    reviewedBy?: User;
}

interface QuoteEmailLog {
    id: number;
    recipient_email: string;
    status: string;
    sent_at: string;
}

interface Quote {
    id: number;
    quote_number: string;
    version: number;
    status: string;
    currency: string;
    period_start?: string;
    period_end?: string;
    valid_until?: string;
    claim_payment_condition?: string;
    notes?: string;
    issued_at?: string;
    created_at: string;
    updated_at: string;

    sum_insured: number | string;
    gross_premium: number | string;
    commission_rate?: number | string;
    commission_amount?: number | string;
    fees?: number | string;
    tax_rate?: number | string;
    taxes?: number | string;
    discount?: number | string;
    net_premium?: number | string;
    total_amount?: number | string;

    customer?: Customer;
    policy_class?: { id: number; name: string };
    policy_type?: { id: number; name: string };
    insurance_product?: { id: number; name: string };

    risks: QuoteRisk[];
    clauses: QuoteClause[];
    versions: QuoteVersion[];
    approvals: QuoteApproval[];
    email_logs?: QuoteEmailLog[];

    created_by?: User;
    issued_by?: User;
    approved_by?: User;
}

interface Props {
    quote: Quote;
}

const statusStyles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    pending_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    changes_requested: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    converted: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    superseded: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
    withdrawn: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300',
    expired: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
};

const statusIcons: Record<string, React.ReactNode> = {
    draft: <FileText className="h-4 w-4" />,
    pending_review: <Clock className="h-4 w-4" />,
    approved: <CheckCircle className="h-4 w-4" />,
    sent: <Send className="h-4 w-4" />,
    accepted: <CheckCircle className="h-4 w-4" />,
    rejected: <XCircle className="h-4 w-4" />,
    converted: <ArrowRight className="h-4 w-4" />,
    expired: <AlertCircle className="h-4 w-4" />,
};

export default function Show({ quote }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [expandedClauses, setExpandedClauses] = useState<Set<number>>(new Set());
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showChangesModal, setShowChangesModal] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);
    const [actionNotes, setActionNotes] = useState('');

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const response = await fetch(route('quotes.download', quote.id));
            if (!response.ok) throw new Error('Download failed');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${quote.quote_number}-v${quote.version}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error('Failed to download PDF');
        } finally {
            setIsDownloading(false);
        }
    };

    const formatCurrency = (amount: number | string | null | undefined) => {
        const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const cur = quote.currency || 'NGN';
        if (numericAmount === null || numericAmount === undefined || isNaN(numericAmount)) return `${cur} 0.00`;
        return `${cur} ${numericAmount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatDateTime = (dateString?: string) => {
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

    const getCustomerDisplayName = () => {
        const c = quote.customer;
        if (!c) return '—';
        if (c.type === 'corporate') return c.company_name || `${c.first_name || ''} ${c.last_name || ''}`;
        return `${c.first_name || ''} ${c.last_name || ''}`;
    };

    const handleAction = (endpoint: string, dataObj = {}) => {
        setIsSubmitting(true);
        router.post(route(endpoint, quote.id), dataObj, {
            onSuccess: () => {
                toast.success('Action executed successfully');
                setShowSubmitModal(false);
                setShowApproveModal(false);
                setShowChangesModal(false);
                setShowSendModal(false);
                setActionNotes('');
            },
            onError: () => toast.error('Action failed. Check logs.'),
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <AppLayout>
            <Head title={`Customer Quote: ${quote.quote_number}`} />

            <div className="space-y-6">
                {/* Header Toolbar */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="mb-2 flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">{quote.quote_number}</h1>
                            <Badge className={`flex items-center gap-1 ${statusStyles[quote.status] || 'bg-gray-100 text-gray-800'}`}>
                                {statusIcons[quote.status]}
                                {quote?.status?.replace(/_/g, ' ').toUpperCase() || ''}
                            </Badge>
                            <Badge variant="outline">v{quote.version || 1}</Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span>
                                Class/Product: <span className="font-medium">{quote.policy_class?.name || quote.insurance_product?.name || 'General Risk'}</span>
                            </span>
                            <span>•</span>
                            <span>
                                Customer: <span className="font-medium">{getCustomerDisplayName()}</span>
                            </span>
                            <span>•</span>
                            <span>Created: {formatDate(quote.created_at)}</span>
                            {quote.created_by && (
                                <>
                                    <span>•</span>
                                    <span>
                                        By: <span className="font-medium">{quote.created_by.name}</span>
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                        {quote.status === 'draft' && (
                            <Button onClick={() => setShowSubmitModal(true)} disabled={isSubmitting}>
                                <Clock className="mr-2 h-4 w-4" />
                                Submit for Review
                            </Button>
                        )}

                        {quote.status === 'pending_review' && (
                            <>
                                <Button onClick={() => setShowApproveModal(true)} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                </Button>
                                <Button variant="outline" onClick={() => setShowChangesModal(true)} disabled={isSubmitting}>
                                    <AlertCircle className="mr-2 h-4 w-4" />
                                    Request Changes
                                </Button>
                            </>
                        )}

                        {['approved', 'draft'].includes(quote.status) && (
                            <Button onClick={() => setShowSendModal(true)} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                                <Send className="mr-2 h-4 w-4" />
                                Send to Customer
                            </Button>
                        )}

                        {quote.status === 'sent' && (
                            <>
                                <Button onClick={() => handleAction('quotes.accept')} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Customer Accept
                                </Button>
                                <Button variant="destructive" onClick={() => handleAction('quotes.reject')} disabled={isSubmitting}>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Customer Reject
                                </Button>
                            </>
                        )}

                        {quote.status === 'accepted' && (
                            <Button onClick={() => handleAction('quotes.convert-to-policy')} disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700">
                                <ArrowRight className="mr-2 h-4 w-4" />
                                Convert to Policy
                            </Button>
                        )}

                        {['draft', 'pending_review', 'changes_requested'].includes(quote.status) && (
                            <Link href={route('quotes.edit', quote.id)}>
                                <Button variant="outline">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Quote
                                </Button>
                            </Link>
                        )}

                        {['approved', 'sent', 'accepted'].includes(quote.status) && (
                            <Button variant="outline" onClick={() => handleAction('quotes.create-new-version')}>
                                <Edit className="mr-2 h-4 w-4" />
                                New Version
                            </Button>
                        )}

                        <Button variant="outline" onClick={handleDownload} disabled={isDownloading}>
                            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Download PDF
                        </Button>

                        <Button variant="outline" onClick={() => setShowPreviewModal(true)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Preview PDF
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Customer & Coverage Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Customer & Policy
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500">Customer Name</h4>
                                <p className="font-medium">{getCustomerDisplayName()}</p>
                                {quote.customer?.email && <p className="text-sm text-gray-500">{quote.customer.email}</p>}
                                {quote.customer?.phone && <p className="text-sm text-gray-500">{quote.customer.phone}</p>}
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-500">Class / Product</h4>
                                <p className="font-medium">{quote.policy_class?.name || quote.insurance_product?.name || 'General Risk'}</p>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-500">Coverage Period</h4>
                                <p className="text-sm">
                                    {formatDate(quote.period_start)} to {formatDate(quote.period_end)}
                                </p>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-500">Quote Validity</h4>
                                <p className="text-sm font-semibold text-blue-600">{formatDate(quote.valid_until)}</p>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-500">Currency</h4>
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium">{quote.currency || 'NGN'}</span>
                                </div>
                            </div>
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
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Total Sum Insured</span>
                                <span className="font-medium">{formatCurrency(quote.sum_insured)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Gross Premium</span>
                                <span className="font-medium">{formatCurrency(quote.gross_premium)}</span>
                            </div>
                            {Number(quote.taxes) > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Taxes (VAT/Duty)</span>
                                    <span className="font-medium text-red-600">+{formatCurrency(quote.taxes)}</span>
                                </div>
                            )}
                            {Number(quote.fees) > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Issuance Fees</span>
                                    <span className="font-medium text-red-600">+{formatCurrency(quote.fees)}</span>
                                </div>
                            )}
                            {Number(quote.discount) > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Discount</span>
                                    <span className="font-medium text-green-600">-{formatCurrency(quote.discount)}</span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total Net Payable</span>
                                <span className="text-green-600">{formatCurrency(quote.net_premium || quote.total_amount || quote.gross_premium)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notes & Verification */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Verification & Notes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {quote.claim_payment_condition && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Payment & Coverage Condition</h4>
                                    <p className="text-sm">{quote.claim_payment_condition}</p>
                                </div>
                            )}
                            {quote.notes && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Special Notes</h4>
                                    <p className="text-sm">{quote.notes}</p>
                                </div>
                            )}
                            <div>
                                <h4 className="text-sm font-medium text-gray-500">Public Verification</h4>
                                <a
                                    href={route('quotes.verify', quote.id)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-blue-600 underline hover:text-blue-800"
                                >
                                    Open public verification portal
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Risk Schedule Table */}
                {quote.risks && quote.risks.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Schedule of Insured Risks
                                <Badge variant="outline">{quote.risks.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-gray-500">
                                            <th className="px-6 pb-3 font-medium">#</th>
                                            <th className="px-6 pb-3 font-medium">Description</th>
                                            <th className="px-6 pb-3 text-right font-medium">Sum Insured</th>
                                            <th className="px-6 pb-3 text-right font-medium">Rate</th>
                                            <th className="px-6 pb-3 text-right font-medium">Premium</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {quote.risks.map((item, idx) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-3 text-gray-500">{idx + 1}</td>
                                                <td className="px-6 py-3 font-medium">{item.description}</td>
                                                <td className="px-6 py-3 text-right">{formatCurrency(item.coverage_amount)}</td>
                                                <td className="px-6 py-3 text-right">{item.rate ? `${item.rate}%` : '—'}</td>
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
                {quote.clauses && quote.clauses.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Coverage Clauses & Endorsements
                                <Badge variant="outline">{quote.clauses.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {quote.clauses.map((clause) => (
                                <div key={clause.id} className="rounded-lg border">
                                    <button
                                        type="button"
                                        onClick={() => toggleClause(clause.id)}
                                        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                                    >
                                        <span className="text-sm font-medium">{clause.title}</span>
                                        {expandedClauses.has(clause.id) ? (
                                            <ChevronDown className="h-4 w-4 text-gray-400" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4 text-gray-400" />
                                        )}
                                    </button>
                                    {expandedClauses.has(clause.id) && (
                                        <div className="border-t px-4 py-3">
                                            <p className="text-sm whitespace-pre-wrap">{clause.content}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Preview PDF Modal */}
            <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
                <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-4">
                    <DialogHeader>
                        <DialogTitle>Quote Document Preview ({quote.quote_number})</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 w-full rounded border overflow-hidden">
                        <iframe src={route('quotes.preview', quote.id)} className="w-full h-full" title="Quote PDF Preview" />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Action Modals */}
            <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submit Quote for Review</DialogTitle>
                        <DialogDescription>Submit this quote to your manager or underwriting team for approval.</DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder="Optional review notes..."
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        rows={3}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSubmitModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => handleAction('quotes.submit-for-review', { notes: actionNotes })} disabled={isSubmitting}>
                            Submit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Customer Quote</DialogTitle>
                        <DialogDescription>Approve this quote for sending to the customer.</DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder="Optional approval notes..."
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        rows={3}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowApproveModal(false)}>
                            Cancel
                        </Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAction('quotes.approve', { notes: actionNotes })} disabled={isSubmitting}>
                            Approve Quote
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send Quote to Customer</DialogTitle>
                        <DialogDescription>Send this quote PDF directly to {quote.customer?.email || 'the customer'}.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSendModal(false)}>
                            Cancel
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleAction('quotes.send')} disabled={isSubmitting}>
                            <Send className="mr-2 h-4 w-4" />
                            Send Now
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
