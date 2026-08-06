import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SearchInput } from '@/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { CheckCircle2, Copy, Download, Edit, Eye, FileText, MoreHorizontal, PlusCircle, Send, Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Quote {
    id: number;
    quote_number: string;
    version: number;
    currency: string;
    sum_insured: number | string;
    gross_premium: number | string;
    net_premium: number | string;
    total_amount: number | string;
    status: string;
    valid_until: string;
    period_start: string;
    period_end: string;
    created_at: string;
    customer?: {
        id: number;
        type: string;
        first_name: string;
        last_name: string;
        company_name: string;
        email: string;
    };
    insurance_product?: {
        id: number;
        name: string;
        type: string;
    };
    policy_class?: {
        id: number;
        name: string;
    };
    created_by?: {
        id: number;
        name: string;
    };
}

interface Props {
    quotes: {
        data: Quote[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
    };
    statistics?: {
        total: number;
        draft: number;
        sent: number;
        accepted: number;
        rejected: number;
        expired: number;
        total_value: number;
        conversion_rate: number;
    };
    filters: {
        search?: string;
        status?: string;
    };
}

const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    pending_review: { label: 'Pending Review', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    changes_requested: { label: 'Changes Requested', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    sent: { label: 'Sent to Customer', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    accepted: { label: 'Accepted', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    converted: { label: 'Converted to Policy', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    superseded: { label: 'Superseded', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    withdrawn: { label: 'Withdrawn', className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
    expired: { label: 'Expired', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
};

function StatusBadge({ status }: { status: string }) {
    const config = statusConfig[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' };
    return <Badge className={config.className}>{config.label}</Badge>;
}

function formatCurrency(amount: string | number, currency = 'NGN') {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency,
    }).format(Number(amount || 0));
}

function getCustomerName(customer: Quote['customer']): string {
    if (!customer) return '—';
    if (customer.type === 'corporate') return customer.company_name;
    return `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || '—';
}

const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'sent', label: 'Sent to Customer' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'converted', label: 'Converted to Policy' },
    { value: 'expired', label: 'Expired' },
];

export default function Index({ quotes, statistics, filters }: Props) {
    const { flash } = usePage().props as any;
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleSearch = (searchOverride?: string, statusOverride?: string) => {
        router.get(
            route('quotes.index'),
            {
                search: searchOverride !== undefined ? searchOverride || undefined : search || undefined,
                status: statusOverride !== undefined ? statusOverride || undefined : status || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleDelete = (quote: Quote) => {
        if (confirm(`Are you sure you want to delete quote "${quote.quote_number}"? This action cannot be undone.`)) {
            router.delete(route('quotes.destroy', quote.id), {
                onSuccess: () => {
                    toast.success(`Quote "${quote.quote_number}" deleted successfully`);
                },
                onError: (errs) => {
                    toast.error(errs.error || 'Failed to delete quote.');
                },
            });
        }
    };

    const canEdit = (status: string) => ['draft', 'pending_review', 'changes_requested'].includes(status);
    const canDelete = (status: string) => ['draft', 'sent', 'rejected', 'expired'].includes(status);

    return (
        <AppLayout>
            <Head title="Customer Quotes" />
            <div className="space-y-6">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Customer Quotes</h2>
                        <p className="text-muted-foreground">Manage customer quotes, coverage schedules, and policy conversions.</p>
                    </div>
                    <Button asChild>
                        <Link href={route('quotes.create')}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Customer Quote
                        </Link>
                    </Button>
                </div>

                {statistics && (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Quotes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{statistics.total}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Sent to Customers</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">{statistics.sent}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Accepted</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{statistics.accepted}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{statistics.conversion_rate}%</div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {(flash?.success || flash?.error) && (
                    <div className={`mb-6 rounded-md p-4 ${flash?.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        {flash?.success || flash?.error}
                    </div>
                )}

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Filter & Search</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            <SearchInput
                                placeholder="Search by quote # or customer name..."
                                value={search}
                                onChange={(val) => {
                                    setSearch(val);
                                    handleSearch(val, status);
                                }}
                                className="max-w-sm"
                            />
                            <Select
                                value={status}
                                onValueChange={(val) => {
                                    setStatus(val);
                                    handleSearch(search, val);
                                }}
                            >
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Quote Number</TableHead>
                                        <TableHead>Ver.</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Class / Product</TableHead>
                                        <TableHead>Sum Insured</TableHead>
                                        <TableHead>Net Premium</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {quotes.data.length > 0 ? (
                                        quotes.data.map((quote) => (
                                            <TableRow key={quote.id}>
                                                <TableCell>
                                                    <Link className="font-medium text-blue-600 hover:underline" href={route('quotes.show', quote.id)}>
                                                        {quote.quote_number}
                                                    </Link>
                                                    {quote.created_by && <div className="text-xs text-gray-500">by {quote.created_by.name}</div>}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">v{quote.version || 1}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm font-medium">{getCustomerName(quote.customer)}</div>
                                                    {quote.customer?.email && <div className="text-xs text-gray-500">{quote.customer.email}</div>}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {quote.policy_class?.name || quote.insurance_product?.name || 'General Risk'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{formatCurrency(quote.sum_insured, quote.currency)}</TableCell>
                                                <TableCell className="font-semibold">{formatCurrency(quote.net_premium || quote.total_amount || quote.gross_premium, quote.currency)}</TableCell>
                                                <TableCell>
                                                    <StatusBadge status={quote.status} />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={route('quotes.show', quote.id)}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View Quote
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            {canEdit(quote.status) && (
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={route('quotes.edit', quote.id)}>
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem asChild>
                                                                <a href={route('quotes.download', quote.id)} target="_blank" rel="noreferrer">
                                                                    <Download className="mr-2 h-4 w-4" />
                                                                    Download PDF
                                                                </a>
                                                            </DropdownMenuItem>
                                                            {canDelete(quote.status) && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleDelete(quote)}
                                                                    className="text-red-600 focus:text-red-600"
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="py-8 text-center text-gray-500">
                                                No quotes found.
                                                <Link href={route('quotes.create')} className="ml-1 text-blue-600 hover:underline">
                                                    Create your first customer quote
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {quotes.last_page > 1 && (
                            <div className="flex items-center justify-between border-t p-4">
                                <div className="text-sm text-gray-500">
                                    Showing {quotes.from} to {quotes.to} of {quotes.total} results
                                </div>
                                <div className="flex gap-2">
                                    {quotes.links.map((link, index) => (
                                        <Button
                                            key={index}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.visit(link.url)}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
