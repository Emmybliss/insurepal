import { MoneyDisplay, ReceiptStatusBadge } from '@/components/Invoice/InvoiceComponents';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Receipt } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Download, Eye, FileText, Loader2, Pencil, Printer, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

interface ReceiptDetailsProps {
    receipt: Receipt;
    templates?: unknown[];
}

export function ReceiptDetails({ receipt }: ReceiptDetailsProps) {
    const [isDownloading, setIsDownloading] = useState(false);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const printFrameRef = useRef<HTMLIFrameElement>(null);
    const { post } = useForm();

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const response = await fetch(route('receipts.download', receipt.id));
            if (!response.ok) throw new Error('Download failed');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `receipt-${receipt.receipt_number}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            toast.error('Failed to download PDF.');
        } finally {
            setIsDownloading(false);
        }
    };

    const handlePreviewClick = () => {
        setIsPreviewLoading(true);
        setShowPreviewModal(true);
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this pending receipt?')) {
            router.delete(route('receipts.destroy', receipt.id), {
                onSuccess: () => toast.success('Receipt deleted successfully'),
            });
        }
    };

    const handleMarkAsRefunded = async (id: number | string) => {
        if (!confirm('Are you sure you want to mark this receipt as refunded?')) {
            return;
        }

        try {
            post(route('receipts.mark-refunded', id), {
                onSuccess: () => toast.success('Receipt marked as refunded.'),
                onError: () => toast.error('Failed to mark receipt as refunded.'),
            });
        } catch (error) {
            console.error('Failed to mark receipt as refunded:', error);
            toast.error('Failed to mark receipt as refunded.');
        }
    };

    const handlePrint = () => {
        const previewUrl = receipt.file_path
            ? route('receipts.preview', receipt.id)
            : route('receipts.html-preview', { receipt: receipt.id });
        const iframe = printFrameRef.current;
        if (!iframe) return;

        iframe.src = previewUrl;
        iframe.onload = () => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
        };
    };

    return (
        <AppLayout>
            <Head title={`Receipt ${receipt.receipt_number}`} />

            <div className="flex-1 space-y-4 pt-4">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-3xl font-bold tracking-tight">Receipt {receipt.receipt_number}</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button asChild variant="outline">
                            <Link href={route('receipts.edit', receipt.id)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                        {receipt.payment_status === 'pending' && (
                            <Button variant="destructive" onClick={handleDelete}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        )}
                        {receipt.payment_status === 'completed' && (
                            <Button
                                variant="destructive"
                                onClick={() => handleMarkAsRefunded(receipt.id)}
                            >
                                Mark as Refunded
                            </Button>
                        )}
                        <Button variant="outline" onClick={handleDownload} disabled={isDownloading || isPreviewLoading}>
                            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            {isDownloading ? 'Downloading...' : 'Download PDF'}
                        </Button>
                        <Button variant="outline" onClick={handlePreviewClick} disabled={isDownloading || isPreviewLoading}>
                            {isPreviewLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                            Preview PDF
                        </Button>
                        {/* <Button asChild variant="default">
                            <Link href={route('receipts.template-options', receipt.id)}>
                                <FileText className="mr-2 h-4 w-4" />
                                {receipt.file_path ? 'Regenerate PDF' : 'Generate PDF'}
                            </Link>
                        </Button> */}
                        {/* <Button variant="outline" onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                        </Button> */}
                    </div>
                </div>

                <Card>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <div>
                                <h3 className="text-lg font-medium">Receipt Details</h3>
                                <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-4">
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">Receipt Number</dt>
                                        <dd className="mt-1 text-sm font-semibold">{receipt.receipt_number}</dd>
                                    </div>
                                    {receipt.customer && (
                                        <div>
                                            <dt className="text-sm font-medium text-muted-foreground">Customer</dt>
                                            <dd className="mt-1 text-sm font-semibold">
                                                {receipt.customer.type === 'corporate'
                                                    ? receipt.customer.company_name
                                                    : `${receipt.customer.first_name} ${receipt.customer.last_name}`}
                                            </dd>
                                        </div>
                                    )}
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                                        <dd className="mt-1">
                                            <ReceiptStatusBadge status={receipt.payment_status} />
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">Payment Date</dt>
                                        <dd className="mt-1 text-sm">{new Date(receipt.payment_date).toLocaleDateString()}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">Amount Paid</dt>
                                        <dd className="mt-1 text-sm font-semibold">
                                            <MoneyDisplay amount={receipt.amount_paid} currency={receipt.currency} />
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">Payment Method</dt>
                                        <dd className="mt-1 text-sm capitalize">{receipt.payment_method?.replace('_', ' ')}</dd>
                                    </div>
                                    {receipt.transaction_id && (
                                        <div>
                                            <dt className="text-sm font-medium text-muted-foreground">Transaction ID</dt>
                                            <dd className="mt-1 text-sm font-mono">{receipt.transaction_id}</dd>
                                        </div>
                                    )}
                                </dl>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium">Policy Details</h3>
                                {receipt.policy || receipt.invoice?.policy ? (
                                    <div className="mt-4">
                                        {receipt.policy?.id ? (
                                            <Link href={route('policies.show', receipt.policy.id)} className="text-indigo-600 hover:text-indigo-900 font-semibold text-sm">
                                                Policy #{receipt.policy.policy_number_display || receipt.policy.policy_number}
                                            </Link>
                                        ) : (
                                            <span className="font-semibold text-sm">
                                                Policy #{(receipt.policy || receipt.invoice?.policy)?.policy_number_display || (receipt.policy || receipt.invoice?.policy)?.policy_number}
                                            </span>
                                        )}
                                        <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-4">
                                            <div>
                                                <dt className="text-sm font-medium text-muted-foreground">Policy Status</dt>
                                                <dd className="mt-1 text-sm capitalize">{(receipt.policy || receipt.invoice?.policy)?.status || 'N/A'}</dd>
                                            </div>
                                            {(receipt.policy || receipt.invoice?.policy)?.premium_amount && (
                                                <div>
                                                    <dt className="text-sm font-medium text-muted-foreground">Premium Amount</dt>
                                                    <dd className="mt-1 text-sm font-semibold">
                                                        <MoneyDisplay
                                                            amount={(receipt.policy || receipt.invoice?.policy)?.premium_amount!}
                                                            currency={(receipt.policy || receipt.invoice?.policy)?.currency || 'NGN'}
                                                        />
                                                    </dd>
                                                </div>
                                            )}
                                        </dl>
                                    </div>
                                ) : (
                                    <div className="mt-4">
                                        <p className="text-sm text-muted-foreground">No linked policy</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="text-lg font-medium">Invoice Details</h3>
                                {receipt.invoice ? (
                                    <div className="mt-4">
                                        <Link href={route('invoices.show', receipt.invoice.id)} className="text-indigo-600 hover:text-indigo-900 font-semibold text-sm">
                                            Invoice #{receipt.invoice.invoice_number}
                                        </Link>
                                        <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-4">
                                            <div>
                                                <dt className="text-sm font-medium text-muted-foreground">Invoice Status</dt>
                                                <dd className="mt-1 text-sm capitalize">{receipt.invoice.status}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-sm font-medium text-muted-foreground">Invoice Total</dt>
                                                <dd className="mt-1 text-sm font-semibold">
                                                    <MoneyDisplay amount={receipt.invoice.total_amount} currency={receipt.invoice.currency} />
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                ) : (
                                    <div className="mt-4">
                                        <p className="text-sm text-muted-foreground">No linked invoice (Direct payment receipt)</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {receipt.notes && (
                            <div className="mt-8 border-t pt-6">
                                <h3 className="text-lg font-medium">Description / Payment Notes</h3>
                                <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{receipt.notes}</div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* PDF Preview Modal */}
                {showPreviewModal && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs duration-200 animate-in fade-in"
                        onClick={(e) => {
                            if (e.target === e.currentTarget && !isPreviewLoading) setShowPreviewModal(false);
                        }}
                    >
                        <div className="flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl duration-200 animate-in zoom-in-95 dark:bg-gray-900">
                            <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-6 py-4">
                                <span className="text-sm font-semibold text-white">
                                    Preview: Receipt {receipt.receipt_number}
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleDownload}
                                        disabled={isDownloading || isPreviewLoading}
                                        className="flex items-center gap-1 text-xs text-white hover:bg-white/10"
                                    >
                                        {isDownloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                                        Download
                                    </Button>
                                    <button
                                        id="close-preview-modal"
                                        onClick={() => setShowPreviewModal(false)}
                                        disabled={isPreviewLoading}
                                        className="rounded px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                                    >
                                        ✕ Close
                                    </button>
                                </div>
                            </div>
                            <div className="relative flex flex-1 items-center justify-center bg-gray-100 dark:bg-gray-950">
                                {isPreviewLoading && (
                                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-gray-900/60 text-white backdrop-blur-xs">
                                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                        <span className="text-sm font-medium">Generating PDF Preview...</span>
                                    </div>
                                )}
                                <iframe
                                    src={
                                        receipt.file_path
                                            ? route('receipts.preview', receipt.id)
                                            : route('receipts.html-preview', { receipt: receipt.id })
                                    }
                                    className="h-full w-full border-0"
                                    title={`Preview ${receipt.receipt_number}`}
                                    onLoad={() => setIsPreviewLoading(false)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Hidden iframe used for printing */}
                <iframe ref={printFrameRef} className="hidden" title="print-frame" />
            </div>
        </AppLayout>
    );
}


