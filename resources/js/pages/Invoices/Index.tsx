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
import { SearchInput } from '@/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    Calendar,
    CheckCircle,
    Clock,
    Download,
    Edit,
    Eye,
    FileText,
    MoreHorizontal,
    PlusCircle,
    Trash2,
    User,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

interface Customer {
    id: number;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    type: string;
}

interface Policy {
    id: number;
    policy_number: string;
}

interface Invoice {
    id: number;
    invoice_number: string;
    total_amount: number;
    formatted_total_amount: string;
    status: string;
    due_date: string;
    is_overdue: boolean;
    days_overdue: number;
    customer: Customer;
    policy?: Policy;
    created_by: {
        name: string;
    };
}

interface Props {
    invoices: {
        data: Invoice[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    customers: Customer[];
    filters: {
        search?: string;
        status?: string;
        customer_id?: string;
    };
    stats: {
        total_invoiced: number;
        outstanding_amount: number;
        overdue_count: number;
    };
}

export default function InvoicesIndex({ invoices, customers, filters, stats }: Props) {
    const [search, setSearch] = useState(filters?.search || '');
    const [status, setStatus] = useState(filters?.status || '');
    const [customerId, setCustomerId] = useState(filters?.customer_id || '');

    const handleSearch = (searchOverride?: string, statusOverride?: string, customerIdOverride?: string) => {
        router.get(
            route('invoices.index'),
            {
                search: searchOverride !== undefined ? searchOverride : search,
                status: statusOverride !== undefined ? statusOverride : status,
                customer_id: customerIdOverride !== undefined ? customerIdOverride : customerId,
            },
            { preserveState: true, replace: true },
        );
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        setCustomerId('');
        router.get(route('invoices.index'));
    };

    const getStatusIcon = (invoice: Invoice) => {
        if (invoice.status === 'paid') {
            return <CheckCircle className="h-4 w-4 text-green-600" />;
        } else if (invoice.status === 'cancelled') {
            return <XCircle className="h-4 w-4 text-red-600" />;
        } else if (invoice.is_overdue) {
            return <AlertCircle className="h-4 w-4 text-red-600" />;
        } else if (invoice.status === 'sent') {
            return <Clock className="h-4 w-4 text-yellow-600" />;
        } else {
            return <FileText className="h-4 w-4 text-gray-600" />;
        }
    };

    const getStatusColor = (invoice: Invoice) => {
        if (invoice.status === 'paid') {
            return 'bg-green-100 text-green-800';
        } else if (invoice.status === 'cancelled') {
            return 'bg-red-100 text-red-800';
        } else if (invoice.is_overdue) {
            return 'bg-red-100 text-red-800';
        } else if (invoice.status === 'sent') {
            return 'bg-yellow-100 text-yellow-800';
        } else {
            return 'bg-gray-100 text-gray-800';
        }
    };

    const getCustomerName = (customer: Customer) => {
        return customer.type === 'individual' ? `${customer.first_name} ${customer.last_name}` : customer.company_name;
    };

    return (
        <AppLayout>
            <Head title="Invoices" />

            <div className="flex-1 space-y-4 pt-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
                        <p className="text-muted-foreground">Manage your Invoices</p>
                    </div>
                    <div>
                        <Link href={route('invoices.create')}>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create Invoice
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
                            <FileText className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">₦{stats?.total_invoiced.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">All invoices</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">₦{stats?.outstanding_amount.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Unpaid invoices</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                            <XCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats?.overdue_count}</div>
                            <p className="text-xs text-muted-foreground">Invoices past due date</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div className="w-full flex-1">
                                <SearchInput
                                    placeholder="Search invoices..."
                                    value={search}
                                    onChange={(val) => {
                                        setSearch(val);
                                        handleSearch(val, status, customerId);
                                    }}
                                />
                            </div>

                            <Select
                                value={status || 'all'}
                                onValueChange={(val) => {
                                    const newStatus = val === 'all' ? '' : val;
                                    setStatus(newStatus);
                                    handleSearch(search, newStatus, customerId);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="sent">Sent</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={customerId || 'all'}
                                onValueChange={(val) => {
                                    const newCustomerId = val === 'all' ? '' : val;
                                    setCustomerId(newCustomerId);
                                    handleSearch(search, status, newCustomerId);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All customers" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Customers</SelectItem>
                                    {customers?.map((customer) => (
                                        <SelectItem key={customer.id} value={customer.id.toString()}>
                                            {getCustomerName(customer)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="flex space-x-2">
                                {(search || status || customerId) && (
                                    <Button variant="ghost" onClick={clearFilters}>
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Invoices Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Invoices</CardTitle>
                            <Button variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Export
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {invoices.data.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full table-auto">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="px-4 py-3 text-left">Invoice Number</th>
                                            <th className="px-4 py-3 text-left">Customer</th>
                                            <th className="px-4 py-3 text-left">Amount</th>
                                            <th className="px-4 py-3 text-left">Status</th>
                                            <th className="px-4 py-3 text-left">Due Date</th>
                                            <th className="px-4 py-3 text-left">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoices.data.map((invoice) => (
                                            <tr key={invoice.id} className="border-b hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <div className="font-mono text-sm">{invoice.invoice_number}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center space-x-2">
                                                        <User className="h-4 w-4 text-gray-400" />
                                                        <span className="text-sm">{getCustomerName(invoice.customer)}</span>
                                                    </div>
                                                    {invoice.policy && (
                                                        <div className="text-xs text-gray-500">Policy: {invoice.policy.policy_number}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-semibold text-green-600">{invoice.formatted_total_amount}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center space-x-2">
                                                        {getStatusIcon(invoice)}
                                                        <Badge variant="outline" className={getStatusColor(invoice)}>
                                                            {invoice.is_overdue ? 'Overdue' : invoice.status}
                                                        </Badge>
                                                    </div>
                                                    {invoice.is_overdue && (
                                                        <div className="mt-1 text-xs text-red-600">{invoice.days_overdue} days overdue</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm">
                                                        {invoice.due_date ? (
                                                            <div className="flex items-center space-x-1">
                                                                <Calendar className="h-3 w-3" />
                                                                <span>{new Date(invoice.due_date).toLocaleDateString()}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400">N/A</span>
                                                        )}
                                                    </div>
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
                                                            <Link href={route('invoices.show', invoice.id)}>
                                                                <DropdownMenuItem>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View
                                                                </DropdownMenuItem>
                                                            </Link>
                                                            {invoice.status === 'draft' && (
                                                                <Link href={route('invoices.edit', invoice.id)}>
                                                                    <DropdownMenuItem>
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                </Link>
                                                            )}
                                                            <Link href={route('invoices.download', invoice.id)}>
                                                                <DropdownMenuItem>
                                                                    <Download className="mr-2 h-4 w-4" />
                                                                    Download PDF
                                                                </DropdownMenuItem>
                                                            </Link>
                                                            <DropdownMenuSeparator />
                                                            {invoice.status === 'draft' && (
                                                                <DropdownMenuItem
                                                                    className="text-red-600"
                                                                    onClick={() => router.delete(route('invoices.destroy', invoice.id))}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
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
                                <h3 className="mb-2 text-lg font-semibold text-gray-600">No invoices found</h3>
                                <p className="mb-4 text-gray-500">Create your first invoice to get started.</p>
                                <Link href={route('invoices.create')}>
                                    <Button>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Create Invoice
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {invoices.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing {(invoices.current_page - 1) * invoices.per_page + 1} to{' '}
                            {Math.min(invoices.current_page * invoices.per_page, invoices.total)} of {invoices.total} results
                        </div>
                        <div className="flex space-x-2">
                            {invoices.current_page > 1 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.get(route('invoices.index'), { page: invoices.current_page - 1 }, { preserveState: true })}
                                >
                                    Previous
                                </Button>
                            )}
                            {invoices.current_page < invoices.last_page && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.get(route('invoices.index'), { page: invoices.current_page + 1 }, { preserveState: true })}
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
