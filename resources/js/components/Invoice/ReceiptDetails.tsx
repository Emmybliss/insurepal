import { MoneyDisplay, ReceiptStatusBadge } from '@/components/Invoice/InvoiceComponents';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Receipt } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Download, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ReceiptDetailsProps {
    receipt: Receipt;
    templates: any[];
}

export function ReceiptDetails({ receipt, templates }: ReceiptDetailsProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { post } = useForm();
    // const [isModalOpen, setIsModalOpen] = useState(false);

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this pending receipt?')) {
            router.delete(route('receipts.destroy', receipt.id), {
                onSuccess: () => toast.success('Receipt deleted successfully'),
            });
        }
    };

    const handleMarkAsRefunded = async (id: number) => {
        if (!confirm('Are you sure you want to mark this receipt as refunded?')) {
            return;
        }

        try {
            post(route('receipts.mark-refunded', id));
            window.location.reload();
        } catch (error) {
            console.error('Failed to mark receipt as refunded:', error);
            alert('Failed to mark receipt as refunded. Please try again.');
        }
    };

    return (
        <AppLayout>
            <Head title={`Receipt ${receipt.receipt_number}`} />

            <div className="flex-1 space-y-4 pt-4">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">Receipt {receipt.receipt_number}</h2>
                    <div className="flex items-center space-x-2">
                        {receipt.payment_status === 'pending' && (
                            <Button variant="destructive" onClick={handleDelete}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        )}
                        {receipt.payment_status === 'completed' && (
                            <Button
                                onClick={() => handleMarkAsRefunded(receipt.id)}
                                className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
                            >
                                Mark as Refunded
                            </Button>
                        )}
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            <Download className="h-4 w-4" />
                            Generate PDF
                        </button>
                    </div>
                </div>

                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Receipt Details</h3>
                                <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Receipt Number</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{receipt.receipt_number}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                                        <dd className="mt-1">
                                            <ReceiptStatusBadge status={receipt.payment_status} />
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Payment Date</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{new Date(receipt.payment_date).toLocaleDateString()}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Amount Paid</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            <MoneyDisplay amount={receipt.amount_paid} currency={receipt.currency} />
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{receipt.payment_method}</dd>
                                    </div>
                                    {receipt.transaction_id && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Transaction ID</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{receipt.transaction_id}</dd>
                                        </div>
                                    )}
                                </dl>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Invoice Details</h3>
                                <div className="mt-4">
                                    <Link href={route('invoices.show', receipt.invoice.id)} className="text-indigo-600 hover:text-indigo-900">
                                        Invoice #{receipt.invoice.invoice_number}
                                    </Link>
                                    <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Invoice Status</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{receipt.invoice.status}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Invoice Total</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                <MoneyDisplay amount={receipt.invoice.total_amount} currency={receipt.invoice.currency} />
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        </div>

                        {receipt.notes && (
                            <div className="mt-8">
                                <h3 className="text-lg font-medium text-gray-900">Notes</h3>
                                <div className="mt-2 text-sm text-gray-900">{receipt.notes}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
