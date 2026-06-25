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
import { CheckCircle, Download, Eye, FileText, Filter, MoreHorizontal, PlusCircle, Search, XCircle } from 'lucide-react';
import { useState } from 'react';

interface Invoice {
    id: number;
    invoice_number: string;
}

interface Receipt {
    id: number;
    receipt_number: string;
    amount_paid: number;
    formatted_amount_paid: string;
    payment_date: string;
    payment_method: string;
    payment_status: string;
    customer: Customer;
    invoice: Invoice;
}

interface Props {
    receipts: {
        data: Receipt[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    customers: Customer[];
    stats: {
        total_receipts: number;
        total_refunded: number;
    };
    filters: {
        search?: string;
        status?: string;
        customer_id?: string;
    };
}

export default function ReceiptsIndex({ receipts, stats, filters, customers }: Props) {
    const [search, setSearch] = useState(filters?.search || '');
    const [status, setStatus] = useState(filters?.status || '');
    const [customerId, setCustomerId] = useState(filters?.customer_id || '');

    const handleSearch = () => {
        router.get(route('receipts.index'), { search, status, customer_id: customerId }, { preserveState: true, replace: true });
    };
    const getStatusIcon = (receipt: Receipt) => {
        if (receipt.payment_status === 'completed') {
            return <CheckCircle className="h-4 w-4 text-green-600" />;
        } else if (receipt.payment_status === 'refunded') {
            return <XCircle className="h-4 w-4 text-red-600" />;
        } else {
            return <FileText className="h-4 w-4 text-gray-600" />;
        }
    };

    const getStatusColor = (receipt: Receipt) => {
        if (receipt.payment_status === 'completed') {
            return 'bg-green-100 text-green-800';
        } else if (receipt.payment_status === 'refunded') {
            return 'bg-red-100 text-red-800';
        } else {
            return 'bg-gray-100 text-gray-800';
        }
    };

    const getCustomerName = (customer: Customer) => {
        return customer.type === 'individual' ? `${customer.first_name} ${customer.last_name}` : customer.company_name;
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        setCustomerId('');
        router.get(route('invoices.index'));
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
                            <div className="text-2xl font-bold text-green-600">₦{stats?.total_receipts.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">All receipts</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Refunded</CardTitle>
                            <XCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">₦{stats?.total_refunded.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">All refunded receipts</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div className="relative">
                                <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search invoices..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="pl-8"
                                />
                            </div>

                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="sent">Sent</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={customerId} onValueChange={setCustomerId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All customers" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers?.map((customer) => (
                                        <SelectItem key={customer.id} value={customer.id.toString()}>
                                            {getCustomerName(customer)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="flex space-x-2">
                                <Button onClick={handleSearch}>
                                    <Filter className="mr-2 h-4 w-4" />
                                    Filter
                                </Button>
                                <Button variant="outline" onClick={clearFilters}>
                                    Clear
                                </Button>
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
                                            <tr key={receipt.id} className="border-b hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <div className="font-mono text-sm">{receipt.receipt_number}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm">{getCustomerName(receipt.customer)}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Link
                                                        href={route('invoices.show', receipt.invoice.id)}
                                                        className="text-sm text-blue-600 hover:underline"
                                                    >
                                                        {receipt.invoice.invoice_number}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-semibold text-green-600">{receipt.formatted_amount_paid}</div>
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
                                                            <Link href={route('receipts.show', receipt.id)}>
                                                                <DropdownMenuItem>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View
                                                                </DropdownMenuItem>
                                                            </Link>
                                                            <Link href={route('receipts.download', receipt.id)}>
                                                                <DropdownMenuItem>
                                                                    <Download className="mr-2 h-4 w-4" />
                                                                    Download PDF
                                                                </DropdownMenuItem>
                                                            </Link>
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
