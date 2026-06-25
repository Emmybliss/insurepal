import { InvoiceItemsTable, InvoiceSummary, MoneyDisplay, ReceiptStatusBadge } from '@/components/Invoice/InvoiceComponents';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Invoice } from '@/types/invoices';
import { Head, Link, router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface InvoiceDetailsProps {
    invoice: Invoice;
    templates: any[];
}

export function InvoiceDetails({ invoice, templates }: InvoiceDetailsProps) {
    console.log('Templates:', templates); // Silence unused lint if not used yet
    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this draft invoice?')) {
            router.delete(route('invoices.destroy', invoice.id), {
                onSuccess: () => toast.success('Invoice deleted successfully'),
            });
        }
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
                                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
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
                        <button
                            // onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            Generate PDF
                        </button>
                    </div>
                </div>

                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <InvoiceSummary invoice={invoice} />

                        <div className="mt-8">
                            <h3 className="text-lg font-medium text-gray-900">Customer Information</h3>
                            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Billing Address</h4>
                                    <div className="mt-2 text-sm text-gray-900">
                                        <p>{invoice?.billing_address?.address}</p>
                                        <p>{invoice?.billing_address?.state}</p>
                                        <p>
                                            {invoice?.billing_address?.city}, {invoice?.billing_address?.state} {invoice?.billing_address?.zip}
                                        </p>
                                        <p>{invoice?.billing_address?.country}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <h3 className="text-lg font-medium text-gray-900">Invoice Items</h3>
                            <InvoiceItemsTable items={invoice.items} />
                        </div>

                        {invoice.notes && (
                            <div className="mt-8">
                                <h3 className="text-lg font-medium text-gray-900">Notes</h3>
                                <div className="mt-2 text-sm text-gray-900">{invoice.notes}</div>
                            </div>
                        )}

                        {invoice.receipts && invoice.receipts.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
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
                                                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
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

            {/* <DocumentGeneratorModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                documentType="invoice"
                documentData={invoice}
                templates={templates}
                downloadRoute="invoices.download-pdf"
            /> */}
        </AppLayout>
    );
}
