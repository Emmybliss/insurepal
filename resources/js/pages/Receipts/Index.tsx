import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Customer } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { AlertCircle, Ban, CheckCircle, Clock, Download, Eye, FileText, MoreHorizontal, Pencil, PlusCircle, Search, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface Invoice {
    id: number;
    invoice_number: string;
}

interface Receipt {
    id: number;
    receipt_number: string;
    amount_paid: number;
    formatted_amount_paid?: string;
    payment_date: string;
    payment_method: string;
    payment_status: string;
    customer?: Customer | null;
    invoice?: Invoice | null;
}

interface Props {
    receipts: {
        data: Receipt[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats: {
        total_receipts: number;
        total_refunded: number;
    };
    filters: {
        search?: string;
        status?: string;
    };
}

export default function ReceiptsIndex({ receipts, stats, filters }: Props) {
    const [search, setSearch] = useState(filters?.search || '');
    const [status, setStatus] = useState(filters?.status || '');
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timer = setTimeout(() => {
            router.get(
                route('receipts.index'),
                {
                    ...(search ? { search } : {}),
                    ...(status && status !== 'all' ? { status } : {}),
                },
                { preserveState: true, replace: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [search, status]);

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

    const getStatusIcon = (receipt: Receipt) => {
        switch (receipt.payment_status) {
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'pending':
                return <Clock className="h-4 w-4 text-amber-600" />;
            case 'refunded':
                return <XCircle className="h-4 w-4 text-red-600" />;
            case 'failed':
                return <AlertCircle className="h-4 w-4 text-rose-600" />;
            case 'voided':
                return <Ban className="h-4 w-4 text-gray-500" />;
            default:
                return <FileText className="h-4 w-4 text-gray-600" />;
        }
    };

    const getStatusColor = (receipt: Receipt) => {
        switch (receipt.payment_status) {
            case 'completed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'pending':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'refunded':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'failed':
                return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'voided':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getCustomerName = (customer?: Customer | null) => {
        if (!customer) return 'N/A';
        return customer.type === 'individual' ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'N/A' : customer.company_name || 'N/A';
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        router.get(route('receipts.index'), {}, { preserveState: true, replace: true });
    };

    return (
        <AppLayout>
            <Head title="Receipts" />

            <div className="flex-1 space-y-4 pt-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Receipts</h2>
                        <p className="text-muted-foreground">Manage your Receipts</p>
                    </div>
                    <div>
                        <Link href={route('receipts.create')}>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                New Receipt
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
                            <FileText className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                ₦{Number(stats?.total_receipts || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-muted-foreground">Total completed receipts</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Refunded</CardTitle>
                            <XCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                ₦{Number(stats?.total_refunded || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-muted-foreground">Total refunded receipts</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="relative">
                                <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search receipt #, customer, invoice..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>

                            <Select value={status || 'all'} onValueChange={(val) => setStatus(val === 'all' ? '' : val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All statuses</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="refunded">Refunded</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                    <SelectItem value="voided">Voided</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex items-center space-x-2">
                                {(search || status) && (
                                    <Button variant="outline" onClick={clearFilters}>
                                        Clear Filters
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Receipts Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Receipts</CardTitle>
                            <Button variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Export
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {receipts.data.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full table-auto">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="px-4 py-3 text-left">Receipt Number</th>
                                            <th className="px-4 py-3 text-left">Customer</th>
                                            <th className="px-4 py-3 text-left">Invoice</th>
                                            <th className="px-4 py-3 text-left">Amount</th>
                                            <th className="px-4 py-3 text-left">Status</th>
                                            <th className="px-4 py-3 text-left">Payment Date</th>
                                            <th className="px-4 py-3 text-left">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {receipts.data?.map((receipt) => (
                                            <tr key={receipt.id} className="border-b ">
                                                <td className="px-4 py-3">
                                                    <div className="font-mono text-sm">{receipt.receipt_number}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm">{getCustomerName(receipt.customer)}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {receipt.invoice ? (
                                                        <Link
                                                            href={route('invoices.show', receipt.invoice.id)}
                                                            className="text-sm text-blue-600 hover:underline"
                                                        >
                                                            {receipt.invoice.invoice_number}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-semibold text-green-600">
                                                        {receipt.formatted_amount_paid ?? (receipt.amount_paid != null ? `₦${Number(receipt.amount_paid).toLocaleString('en-NG', { minimumFractionDigits: 2 })}` : '—')}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center space-x-2">
                                                        {getStatusIcon(receipt)}
                                                        <Badge variant="outline" className={getStatusColor(receipt)}>
                                                            {receipt.payment_status}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm">{new Date(receipt.payment_date).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
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
                                                            {receipt.payment_status === 'completed' && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="text-red-600"
                                                                        onClick={() => router.post(route('receipts.mark-refunded', receipt.id))}
                                                                    >
                                                                        <XCircle className="mr-2 h-4 w-4" />
                                                                        Mark as Refunded
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                <h3 className="mb-2 text-lg font-semibold text-gray-600">No receipts found</h3>
                                <p className="mb-4 text-gray-500">No receipts have been recorded yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {receipts.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing {(receipts.current_page - 1) * receipts.per_page + 1} to{' '}
                            {Math.min(receipts.current_page * receipts.per_page, receipts.total)} of {receipts.total} results
                        </div>
                        <div className="flex space-x-2">
                            {receipts.current_page > 1 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.get(route('receipts.index'), { page: receipts.current_page - 1 }, { preserveState: true })}
                                >
                                    Previous
                                </Button>
                            )}
                            {receipts.current_page < receipts.last_page && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.get(route('receipts.index'), { page: receipts.current_page + 1 }, { preserveState: true })}
                                >
                                    Next
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

