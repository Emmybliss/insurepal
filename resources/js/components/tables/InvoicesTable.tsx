import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { Invoice } from '@/types/billing';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

interface InvoicesTableProps {
    invoices: Invoice[];
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'draft':
            return 'bg-gray-100 text-gray-800';
        case 'sent':
            return 'bg-blue-100 text-blue-800';
        case 'viewed':
            return 'bg-purple-100 text-purple-800';
        case 'paid':
            return 'bg-green-100 text-green-800';
        case 'overdue':
            return 'bg-red-100 text-red-800';
        case 'cancelled':
            return 'bg-yellow-100 text-yellow-800';
        case 'void':
            return 'bg-gray-100 text-gray-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const getPaymentStatusColor = (status: string) => {
    switch (status) {
        case 'unpaid':
            return 'bg-red-100 text-red-800';
        case 'partially_paid':
            return 'bg-yellow-100 text-yellow-800';
        case 'paid':
            return 'bg-green-100 text-green-800';
        case 'overpaid':
            return 'bg-blue-100 text-blue-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export function InvoicesTable({ invoices }: InvoicesTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                            <Link href={route('invoices.show', invoice.id)}>{invoice.invoice_number}</Link>
                        </TableCell>
                        <TableCell>
                            {invoice.customer?.type === 'corporate'
                                ? invoice.customer.company_name
                                : `${invoice.customer?.first_name} ${invoice.customer?.last_name}`}
                        </TableCell>
                        <TableCell className="capitalize">{invoice.type}</TableCell>
                        <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                        <TableCell>{formatCurrency(invoice.total_amount, invoice.currency)}</TableCell>
                        <TableCell>
                            <Badge variant="secondary" className={getStatusColor(invoice.status)}>
                                {invoice.status}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <Badge variant="secondary" className={getPaymentStatusColor(invoice.payment_status)}>
                                {invoice.payment_status.replace('_', ' ')}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <EllipsisHorizontalIcon className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            window.location.href = route('invoices.show', invoice.id);
                                        }}
                                    >
                                        View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            window.location.href = route('invoices.edit', invoice.id);
                                        }}
                                    >
                                        Edit
                                    </DropdownMenuItem>
                                    {invoice.status === 'draft' && (
                                        <DropdownMenuItem
                                            onClick={() => {
                                                // Handle send invoice
                                            }}
                                        >
                                            Send
                                        </DropdownMenuItem>
                                    )}
                                    {['sent', 'viewed', 'overdue'].includes(invoice.status) && (
                                        <DropdownMenuItem
                                            onClick={() => {
                                                window.location.href = route('receipts.create', { invoice_id: invoice.id });
                                            }}
                                        >
                                            Record Payment
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
