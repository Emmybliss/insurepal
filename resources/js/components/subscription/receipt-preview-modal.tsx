import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import axios from 'axios';
import { Download, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ReceiptPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    subscriptionId: number | null;
}

export function ReceiptPreviewModal({ isOpen, onClose, subscriptionId }: ReceiptPreviewModalProps) {
    const [loading, setLoading] = useState(false);
    const [receiptData, setReceiptData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && subscriptionId) {
            setLoading(true);
            setError(null);

            axios
                .get(route('settings.billing.preview-receipt', { subscriptionId }))
                .then((response) => {
                    if (response.data.status && response.data.data) {
                        setReceiptData(response.data.data);
                    } else {
                        setError('Failed to load receipt data.');
                    }
                })
                .catch((err) => {
                    setError('Error retrieving receipt details.');
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [isOpen, subscriptionId]);

    const handleDownload = () => {
        if (subscriptionId) {
            window.open(route('settings.billing.download-receipt', { subscriptionId }), '_blank');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Receipt Preview</span>
                        <Button variant="outline" size="sm" onClick={handleDownload} disabled={loading || !!error}>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-4 rounded-lg border bg-white p-6 shadow-sm dark:bg-zinc-950">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            <p className="mt-4 text-sm text-muted-foreground">Loading receipt details...</p>
                        </div>
                    ) : error ? (
                        <div className="py-20 text-center text-destructive">
                            <p>{error}</p>
                        </div>
                    ) : receiptData ? (
                        <div className="space-y-8 text-sm">
                            {/* Header Section */}
                            <div className="flex items-start justify-between border-b pb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-primary">{receiptData.company_name}</h2>
                                    <div className="mt-2 text-muted-foreground">
                                        <p>{receiptData.company_address}</p>
                                        <p>{receiptData.company_email}</p>
                                        <p>{receiptData.company_phone}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h1 className="mb-2 text-3xl font-light tracking-tight">RECEIPT</h1>
                                    <div className="text-muted-foreground">
                                        <p>
                                            <span className="mr-2 font-medium">Receipt No:</span> {receiptData.receipt_number}
                                        </p>
                                        <p>
                                            <span className="mr-2 font-medium">Date:</span> {receiptData.receipt_date}
                                        </p>
                                        <p>
                                            <span className="mr-2 font-medium">Payment Ref:</span> {receiptData.payment_reference}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Bill To Section */}
                            <div>
                                <h3 className="mb-2 text-lg font-bold">Billed To:</h3>
                                <div className="text-muted-foreground">
                                    <p className="font-medium text-foreground">{receiptData.customer_name}</p>
                                    <p>{receiptData.customer_email}</p>
                                    <p>{receiptData.customer_phone}</p>
                                    <p>{receiptData.customer_address}</p>
                                </div>
                            </div>

                            {/* Items Section */}
                            <div>
                                <h3 className="mb-4 text-lg font-bold text-primary">Subscription Details</h3>
                                <div className="overflow-hidden rounded-md border">
                                    <table className="w-full">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-medium">Description</th>
                                                <th className="px-4 py-3 text-center font-medium">Billing Cycle</th>
                                                <th className="px-4 py-3 text-right font-medium">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b last:border-0">
                                                <td className="px-4 py-4">
                                                    <p className="font-medium">{receiptData.plan_name} Plan</p>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        Period: {receiptData.period_start} - {receiptData.period_end}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4 text-center text-muted-foreground uppercase">{receiptData.billing_cycle}</td>
                                                <td className="px-4 py-4 text-right font-medium">
                                                    {new Intl.NumberFormat('en-NG', { style: 'currency', currency: receiptData.currency }).format(
                                                        receiptData.amount,
                                                    )}
                                                </td>
                                            </tr>
                                        </tbody>
                                        <tfoot className="border-t bg-muted/50">
                                            <tr>
                                                <td colSpan={2} className="px-4 py-4 text-right font-bold">
                                                    Total Paid:
                                                </td>
                                                <td className="px-4 py-4 text-right text-lg font-bold text-primary">
                                                    {new Intl.NumberFormat('en-NG', { style: 'currency', currency: receiptData.currency }).format(
                                                        receiptData.amount,
                                                    )}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Footer Section */}
                            <div className="pt-8 text-center text-xs text-muted-foreground">
                                <p>This is a computer-generated receipt and requires no signature.</p>
                                <p className="mt-1">Thank you for your business!</p>
                            </div>
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}
