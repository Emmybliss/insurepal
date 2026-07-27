import { InvoiceItemsTable, InvoiceSummary, MoneyDisplay, ReceiptStatusBadge } from '@/components/Invoice/InvoiceComponents';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { getCustomerName } from '@/lib/constants';
import { Invoice } from '@/types/invoices';
import { Head, Link, router } from '@inertiajs/react';
import { Download, Eye, Printer, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';

interface InvoiceDetailsProps {
    invoice: Invoice;
    templates: any[];
}

export function InvoiceDetails({ invoice }: InvoiceDetailsProps) {
    const printFrameRef = useRef<HTMLIFrameElement>(null);

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this draft invoice?')) {
            router.delete(route('invoices.destroy', invoice.id), {
                onSuccess: () => toast.success('Invoice deleted successfully'),
            });
        }
    };

    const handlePrint = () => {
        const previewUrl = route('invoices.preview', invoice.id);
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
            <Head title={`Invoice ${invoice.invoice_number}`} />

            <div className="flex-1 space-y-4 pt-4">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">Invoice {invoice.invoice_number}</h2>
                    <div className="flex space-x-4">
                        {invoice.status === 'draft' && (
                            <Link
                                href={route('invoices.edit', invoice.id)}
                                className="inline-flex items-center rounded-md border border-transparent bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                            >
                                Edit Invoice
                            </Link>
                        )}
                        {invoice.status === 'draft' && (
                            <Button variant="destructive" onClick={handleDelete}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        )}
                        {['draft', 'sent'].includes(invoice.status) && (
                            <Link
                                href={route('receipts.create', { invoice: invoice.id })}
                                className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
                            >
                                Record Payment
                            </Link>
                        )}
                        <a
                            href={route('invoices.preview', invoice.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                            <Eye className="h-4 w-4" />
                            Preview PDF
                        </a>
                        <a
                            href={route('invoices.download-pdf', invoice.id)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                        >
                            <Download className="h-4 w-4" />
                            Download PDF
                        </a>
                        <Button variant="outline" onClick={handlePrint} className="gap-1.5">
                            <Printer className="h-4 w-4" />
                            Print
                        </Button>
                    </div>
                </div>

                <div className="overflow-hidden bg-white dark:bg-background shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <InvoiceSummary invoice={invoice} />

                        <div className="mt-8">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Customer Information</h3>
                            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Billing Address</h4>
                                    <div className="mt-2 text-sm text-gray-900 dark:text-white">
                                        <p>{getCustomerName(invoice?.customer)}</p>
                                        <p>{invoice?.customer?.email}</p>
                                        <p>
                                            {invoice?.customer?.phone}, {invoice?.billing_address?.state} {invoice?.billing_address?.zip}
                                        </p>
                                        <p>{invoice?.billing_address?.country}</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Billing Address</h4>

                                    {invoice?.billing_address ? (
                                        <div className="mt-2 space-y-1 text-sm text-gray-900 dark:text-white">
                                            {invoice.billing_address.address && (
                                                <p>{invoice.billing_address.address}</p>
                                            )}

                                            {(invoice.billing_address.city ||
                                                invoice.billing_address.state ||
                                                invoice.billing_address.zip) && (
                                                    <p>
                                                        {[
                                                            invoice.billing_address.city,
                                                            invoice.billing_address.state,
                                                            invoice.billing_address.zip,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(", ")}
                                                    </p>
                                                )}

                                            {invoice.billing_address.country && (
                                                <p>{invoice.billing_address.country}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="mt-2 text-sm text-gray-400 italic">
                                            No billing address available.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Invoice Items</h3>
                            <InvoiceItemsTable items={invoice.items} />
                        </div>

                        {invoice.notes && (
                            <div className="mt-8">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notes</h3>
                                <div className="mt-2 text-sm text-gray-900 dark:text-white">{invoice.notes}</div>
                            </div>
                        )}

                        {invoice.receipts && invoice.receipts.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Payment History</h3>
                                <div className="mt-4">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                                >
                                                    Receipt Number
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                                >
                                                    Date
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                                >
                                                    Amount
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                                >
                                                    Method
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                                >
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {invoice.receipts.map((receipt) => (
                                                <tr key={receipt.id}>
                                                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white">
                                                        <Link href={route('receipts.show', receipt.id)} className="hover:text-indigo-600">
                                                            {receipt.receipt_number}
                                                        </Link>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                                                        {new Date(receipt.payment_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                                                        <MoneyDisplay amount={receipt.amount_paid} currency={receipt.currency} />
                                                    </td>
                                                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">{receipt.payment_method}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <ReceiptStatusBadge status={receipt.payment_status} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Hidden iframe used for print — never visible to the user */}
            <iframe ref={printFrameRef} className="hidden" title="print-frame" />
        </AppLayout>
    );
}
