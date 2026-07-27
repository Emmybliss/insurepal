import { Invoice, InvoiceItem, InvoiceStatus, PaymentStatus } from '@/types/invoices';
import { formatCurrency } from '@/utils/formatting';
import React from 'react';

interface InvoiceStatusBadgeProps {
    status: InvoiceStatus;
}

export const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({ status }) => {
    const getStatusColor = () => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 text-gray-800';
            case 'sent':
                return 'bg-blue-100 text-blue-800';
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'partially_paid':
                return 'bg-yellow-100 text-yellow-800';
            case 'overdue':
                return 'bg-red-100 text-red-800';
            case 'cancelled':
                return 'bg-gray-100 text-gray-600';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor()}`}>
            {status?.replace('_', ' ').toUpperCase()}
        </span>
    );
};

interface ReceiptStatusBadgeProps {
    status: PaymentStatus;
}

export const ReceiptStatusBadge: React.FC<ReceiptStatusBadgeProps> = ({ status }) => {
    const getStatusColor = () => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'refunded':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor()}`}>{status?.toUpperCase()}</span>
    );
};

interface MoneyDisplayProps {
    amount: number;
    currency?: string;
}

export const MoneyDisplay: React.FC<MoneyDisplayProps> = ({ amount, currency = 'USD' }) => {
    return <span>{formatCurrency(amount, currency)}</span>;
};

interface InvoiceSummaryProps {
    invoice: Invoice;
}

export const InvoiceSummary: React.FC<InvoiceSummaryProps> = ({ invoice }) => {
    return (
        <div className="overflow-hidden rounded-lg bg-white dark:bg-background shadow">
            <div className="px-4 py-5 sm:p-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-white">Invoice Number</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">{invoice.invoice_number}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-white">Status</dt>
                        <dd className="mt-1">
                            <InvoiceStatusBadge status={invoice.status} />
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-white">Due Date</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                            {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-white">Total Amount</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                            <MoneyDisplay amount={invoice.total_amount} currency={invoice.currency} />
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    );
};

interface InvoiceItemsTableProps {
    items: InvoiceItem[];
}

export const InvoiceItemsTable: React.FC<InvoiceItemsTableProps> = ({ items }) => {
    return (
        <div className="mt-8 flex flex-col">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <div className="overflow-hidden border-b border-gray-200 shadow sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 dark:bg-gray-500">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 dark:text-white uppercase">
                                        Description
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 dark:text-white uppercase">
                                        Quantity
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 dark:text-white uppercase">
                                        Unit Price
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 dark:text-white uppercase">
                                        Tax
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 dark:text-white uppercase">
                                        Discount
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 dark:text-white uppercase">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white dark:bg-background">
                                {items.map((item, index) => (
                                    <tr key={item.id || index}>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-white">{item.description}</td>
                                        <td className="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900 dark:text-white">{item.quantity}</td>
                                        <td className="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900 dark:text-white">
                                            <MoneyDisplay amount={item.unit_price} />
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900 dark:text-white">
                                            <MoneyDisplay amount={item.tax_amount} />
                                            {item.tax_rate > 0 && <span className="ml-1 text-gray-500 dark:text-white">({item.tax_rate}%)</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900 dark:text-white">
                                            <MoneyDisplay amount={item.discount_amount} />
                                            {item.discount_rate > 0 && <span className="ml-1 text-gray-500 dark:text-white">({item.discount_rate}%)</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900 dark:text-white">
                                            <MoneyDisplay amount={item.total} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50 dark:bg-gray-500">
                                <tr>
                                    <th scope="row" colSpan={5} className="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-white">
                                        Subtotal
                                    </th>
                                    <td className="px-6 py-3 text-right text-sm whitespace-nowrap text-gray-900 dark:text-white">
                                        <MoneyDisplay amount={items.reduce((sum, item) => sum + Number(item.total), 0)} />
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
