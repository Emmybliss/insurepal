import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { Receipt } from '@/types/billing';
import { Link } from '@inertiajs/react';
import { Download, Eye, MoreHorizontal, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface ReceiptsTableProps {
    receipts: Receipt[];
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'completed':
            return 'bg-green-100 text-green-800';
        case 'failed':
            return 'bg-red-100 text-red-800';
        case 'refunded':
            return 'bg-purple-100 text-purple-800';
        case 'voided':
            return 'bg-gray-100 text-gray-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export function ReceiptsTable({ receipts }: ReceiptsTableProps) {
    const handleDownload = async (receiptId: number | string, receiptNumber: string) => {
        try {
            toast.loading('Downloading receipt PDF...', { id: `download-${receiptId}` });
            const response = await fetch(route('receipts.download', receiptId));
            if (!response.ok) throw new Error('Download failed');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `receipt-${receiptNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Download completed', { id: `download-${receiptId}` });
        } catch (error) {
            console.error(error);
            toast.error('Failed to download PDF.', { id: `download-${receiptId}` });
        }
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {receipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                        <TableCell className="font-medium">
                            <Link href={route('receipts.show', receipt.id)}>{receipt.receipt_number}</Link>
                        </TableCell>
                        <TableCell>
                            {receipt.customer?.type === 'corporate'
                                ? receipt.customer.company_name
                                : `${receipt.customer?.first_name} ${receipt.customer?.last_name}`}
                        </TableCell>
                        <TableCell>
                            {receipt.invoice_id ? (
                                <Link href={route('invoices.show', receipt.invoice_id)}>{receipt.invoice?.invoice_number ?? `INV-${receipt.invoice_id}`}</Link>
                            ) : (
                                <span className="text-muted-foreground">—</span>
                            )}
                        </TableCell>
                        <TableCell>{new Date(receipt.payment_date).toLocaleDateString()}</TableCell>
                        <TableCell className="capitalize">{receipt.payment_method.replace('_', ' ')}</TableCell>
                        <TableCell>{formatCurrency(receipt.amount_paid, receipt.currency)}</TableCell>
                        <TableCell>
                            <Badge variant="secondary" className={getStatusColor(receipt.status)}>
                                {receipt.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem asChild>
                                        <Link href={route('receipts.show', receipt.id)}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            View
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href={route('receipts.edit', receipt.id)}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Edit
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownload(receipt.id, receipt.receipt_number)}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Download PDF
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
