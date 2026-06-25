import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchInput } from '@/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, Clock, Copy, DollarSign, Edit, Eye, Filter, PlusCircle, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Customer {
    id: number;
    type: 'individual' | 'corporate';
    first_name?: string;
    last_name?: string;
    company_name?: string;
}

interface InsuranceProduct {
    id: number;
    name: string;
    type: string;
}

interface User {
    id: number;
    name: string;
}

interface Quote {
    id: number;
    quote_number: string;
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
    premium_amount: string;
    total_amount: string;
    valid_until: string;
    customer: Customer;
    insurance_product: InsuranceProduct;
    created_by: User;
    created_at: string;
    formatted_premium_amount: string;
    formatted_total_amount: string;
    is_expired: boolean;
    status_color: string;
    customer_name: string;
}

interface Statistics {
    total: number;
    draft: number;
    sent: number;
    accepted: number;
    rejected: number;
    expired: number;
    expiring_soon: number;
    total_value: string;
    average_value: string;
    conversion_rate: number;
}

interface Props {
    quotes: {
        data: Quote[];
        links: any;
        meta: any;
    };
    customers: Customer[];
    products: InsuranceProduct[];
    statistics: Statistics;
    filters: {
        search?: string;
        status?: string;
        customer_id?: string;
        product_id?: string;
        date_from?: string;
        date_to?: string;
    };
    statuses: Record<string, string>;
}

export default function QuotesIndex({ quotes, customers, products, statistics, filters, statuses }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [customerId, setCustomerId] = useState(filters.customer_id || '');
    const [productId, setProductId] = useState(filters.product_id || '');
    const [showFilters, setShowFilters] = useState(false);

    const handleFilter = (searchOverride?: string, statusOverride?: string, customerIdOverride?: string, productIdOverride?: string) => {
        const s = searchOverride !== undefined ? searchOverride : search;
        const st = statusOverride !== undefined ? statusOverride : status;
        const c = customerIdOverride !== undefined ? customerIdOverride : customerId;
        const p = productIdOverride !== undefined ? productIdOverride : productId;

        const params = new URLSearchParams();
        if (s) params.append('search', s);
        if (st) params.append('status', st);
        if (c) params.append('customer_id', c);
        if (p) params.append('product_id', p);

        router.get(route('quotes.index'), Object.fromEntries(params), { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        setCustomerId('');
        setProductId('');
        router.get(route('quotes.index'));
    };

    const handleDelete = (quote: Quote) => {
        if (confirm(`Are you sure you want to delete quote #${quote.quote_number}?`)) {
            router.delete(route('quotes.destroy', quote.id), {
                onSuccess: () => {
                    toast.success(`Quote #${quote.quote_number} has been deleted successfully`);
                },
                onError: () => {
                    toast.error('Failed to delete quote');
                },
            });
        }
    };

    const handleSendQuote = (quote: Quote) => {
        if (confirm(`Send quote #${quote.quote_number} to customer?`)) {
            router.post(
                route('quotes.send', quote.id),
                {},
                {
                    onSuccess: () => {
                        toast.success(`Quote #${quote.quote_number} has been sent to customer`);
                    },
                    onError: () => {
                        toast.error('Failed to send quote');
                    },
                },
            );
        }
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'draft':
                return 'secondary';
            case 'sent':
                return 'default';
            case 'accepted':
                return 'default';
            case 'rejected':
                return 'destructive';
            case 'expired':
                return 'outline';
            default:
                return 'secondary';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    const getCustomerName = (customer: Customer) => {
        return customer.type === 'corporate' ? customer.company_name : `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
    };

    return (
        <AppLayout>
            <Head title="Quotes" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">Quotes</h1>
                        <p className="text-muted-foreground">Manage insurance quotes and track their progress</p>
                    </div>
                    <Link href={route('quotes.create')}>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Quote
                        </Button>
                    </Link>
                </div>

                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total}</div>
                            <p className="text-xs text-muted-foreground">₦{parseFloat(statistics.total_value || '0').toLocaleString()} total value</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.conversion_rate}%</div>
                            <p className="text-xs text-muted-foreground">
                                {statistics.accepted} of {statistics.sent} sent quotes accepted
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{statistics.expiring_soon}</div>
                            <p className="text-xs text-muted-foreground">Quotes expiring within 7 days</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Average Value</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₦{parseFloat(statistics.average_value || '0').toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Per quote average</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Search & Filter</CardTitle>
                            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                                <Filter className="mr-2 h-4 w-4" />
                                {showFilters ? 'Hide Filters' : 'Show Filters'}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <SearchInput
                                    placeholder="Search quotes, customers..."
                                    value={search}
                                    onChange={(val) => {
                                        setSearch(val);
                                        handleFilter(val, status, customerId, productId);
                                    }}
                                />
                            </div>
                            {/* <Button onClick={() => handleFilter()}>
                                <Search className="mr-2 h-4 w-4" />
                                Search
                            </Button> */}
                        </div>

                        {showFilters && (
                            <div className="grid gap-4 md:grid-cols-3">
                                <Select
                                    value={status}
                                    onValueChange={(val) => {
                                        setStatus(val);
                                        handleFilter(search, val, customerId, productId);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        {Object.entries(statuses).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={customerId}
                                    onValueChange={(val) => {
                                        const newCustomerId = val === 'all' ? '' : val;
                                        setCustomerId(newCustomerId);
                                        handleFilter(search, status, newCustomerId, productId);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filter by customer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Customers</SelectItem>
                                        {customers.map((customer) => (
                                            <SelectItem key={customer.id} value={customer.id.toString()}>
                                                {getCustomerName(customer)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={productId}
                                    onValueChange={(val) => {
                                        const newProductId = val === 'all' ? '' : val;
                                        setProductId(newProductId);
                                        handleFilter(search, status, customerId, newProductId);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filter by product" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Products</SelectItem>
                                        {products.map((product) => (
                                            <SelectItem key={product.id} value={product.id.toString()}>
                                                {product.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {(search || status || customerId || productId) && (
                            <div className="flex justify-end">
                                <Button variant="outline" onClick={clearFilters}>
                                    Clear Filters
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quotes List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quotes ({quotes.meta?.total || 0})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {quotes.data.length > 0 ? (
                            <div className="rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[60px] pl-6">#</TableHead>
                                            <TableHead>Quote Number</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Amounts</TableHead>
                                            <TableHead>Valid Until</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="pr-6 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {quotes.data.map((quote, index) => {
                                            const currentPage = quotes.meta?.current_page || (quotes as any).current_page || 1;
                                            const perPage = quotes.meta?.per_page || (quotes as any).per_page || 10;
                                            const serialNumber = (currentPage - 1) * perPage + index + 1;

                                            return (
                                                <TableRow key={quote.id} className="group transition-colors hover:bg-muted/30">
                                                    <TableCell className="pl-6 font-medium text-muted-foreground">{serialNumber}.</TableCell>
                                                    <TableCell>
                                                        <span className="font-semibold text-foreground">#{quote.quote_number}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm font-medium">{quote.customer_name}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm">{quote.insurance_product.name}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-foreground">{quote.formatted_total_amount}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                Premium: {quote.formatted_premium_amount}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm">{formatDate(quote.valid_until)}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant={getStatusBadgeVariant(quote.status)}>
                                                                {statuses[quote.status] || quote.status}
                                                            </Badge>
                                                            {quote.is_expired && <Badge variant="destructive">Expired</Badge>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="pr-6 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Link href={route('quotes.show', quote.id)}>
                                                                <Button variant="outline" size="icon" className="hover:bg-emerald/10 h-8 w-8">
                                                                    <Eye className="h-4 w-4 text-emerald-500" />
                                                                </Button>
                                                            </Link>

                                                            {quote.status === 'draft' && (
                                                                <>
                                                                    <Link href={route('quotes.edit', quote.id)}>
                                                                        <Button variant="ghost" size="icon" className="hover:bg-orange/10 h-8 w-8">
                                                                            <Edit className="h-4 w-4 text-orange-500" />
                                                                        </Button>
                                                                    </Link>

                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="hover:bg-blue/10 h-8 w-8"
                                                                        onClick={() => handleSendQuote(quote)}
                                                                        title="Send Quote"
                                                                    >
                                                                        <Send className="h-4 w-4 text-blue-500" />
                                                                    </Button>
                                                                </>
                                                            )}

                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => router.post(route('quotes.duplicate', quote.id))}
                                                                title="Duplicate Quote"
                                                            >
                                                                <Copy className="h-4 w-4" />
                                                            </Button>

                                                            {quote.status === 'draft' && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 hover:bg-destructive/10"
                                                                    onClick={() => handleDelete(quote)}
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <p className="text-muted-foreground">No quotes found</p>
                                <Link href={route('quotes.create')}>
                                    <Button className="mt-4">
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Create Your First Quote
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Pagination would go here */}
                        {quotes.links && <div className="mt-6 flex justify-center">{/* Implement pagination component */}</div>}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
