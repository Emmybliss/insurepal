import { Can } from '@/components/auth/permission-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SearchInput } from '@/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Customer } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Edit, Eye, MoreHorizontal, PlusCircle, Send, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Placement {
    id: number;
    placement_number: string;
    status: string;
    currency: string;
    total_sum_insured: number | null;
    proposed_start_date: string;
    proposed_end_date: string;
    notes: string | null;
    created_at: string;
    customer: Pick<Customer, 'id' | 'type' | 'first_name' | 'last_name' | 'company_name' | 'email'>;
    policyProduct: { id: number; name: string; code: string } | null;
    createdBy: { id: number; name: string } | null;
    markets: Array<{ id: number; placement_id: number; insurance_company_id: number; status: string; insurance_company: { id: number; name: string } | null }>;
}

interface Props {
    placements: {
        data: Placement[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
    };
    filters: {
        search?: string;
        status?: string;
        customer_id?: string;
        date_from?: string;
        date_to?: string;
    };
    customers: Customer[];
}

const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    in_market: 'bg-blue-100 text-blue-800',
    accepted: 'bg-green-100 text-green-800',
    partially_accepted: 'bg-yellow-100 text-yellow-800',
    declined: 'bg-red-100 text-red-800',
    bound: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-slate-100 text-slate-800',
};

export default function Index({ placements, filters, customers }: Props) {
    const { flash } = usePage().props as any;
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [customerId, setCustomerId] = useState(filters.customer_id || '');

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const handleSearch = (
        searchOverride?: string,
        statusOverride?: string,
        customerIdOverride?: string,
    ) => {
        router.get(
            route('placements.index'),
            {
                search: searchOverride !== undefined ? searchOverride : search || undefined,
                status: statusOverride !== undefined ? statusOverride : status || undefined,
                customer_id: customerIdOverride !== undefined ? customerIdOverride : customerId || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const formatCurrency = (amount: number | null, currency = 'NGN') => {
        if (amount === null || amount === undefined) return '—';
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getCustomerDisplayName = (customer: Placement['customer']) => {
        if (!customer) return '—';
        if (customer.type === 'corporate') {
            return customer.company_name || `${customer.first_name} ${customer.last_name}`;
        }
        return `${customer.first_name} ${customer.last_name}`;
    };

    const handleDelete = (placement: Placement) => {
        if (confirm(`Are you sure you want to delete placement "${placement.placement_number}"? This action cannot be undone.`)) {
            router.delete(route('placements.destroy', placement.id), {
                onSuccess: () => {
                    toast.success(`Placement "${placement.placement_number}" has been deleted`);
                },
                onError: () => {
                    toast.error('Failed to delete placement.');
                },
            });
        }
    };

    const handleSubmitToMarket = (placement: Placement) => {
        if (confirm(`Submit placement "${placement.placement_number}" to market?`)) {
            router.post(route('placements.submit-to-market', placement.id), {}, {
                onSuccess: () => {
                    toast.success('Placement submitted to market');
                },
                onError: () => {
                    toast.error('Failed to submit placement to market.');
                },
            });
        }
    };

    const handleConvertToPolicy = (placement: Placement) => {
        if (confirm(`Convert placement "${placement.placement_number}" to a policy?`)) {
            router.post(route('placements.convert-to-policy', placement.id), {}, {
                onSuccess: () => {
                    toast.success('Placement converted to policy');
                },
                onError: () => {
                    toast.error('Failed to convert placement to policy.');
                },
            });
        }
    };

    return (
        <AppLayout>
            <Head title="Placements" />
            <div className="space-y-6">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Placements</h2>
                        <p className="text-muted-foreground">Manage insurance placements submitted to market.</p>
                    </div>
                    <Link href={route('placements.create')}>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Placement
                        </Button>
                    </Link>
                </div>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            <SearchInput
                                placeholder="Search placements or customer..."
                                value={search}
                                onChange={(val) => {
                                    setSearch(val);
                                    handleSearch(val, status, customerId);
                                }}
                                className="max-w-sm"
                            />
                            <Select
                                value={status}
                                onValueChange={(val) => {
                                    const newStatus = val === 'all' ? '' : val;
                                    setStatus(newStatus);
                                    handleSearch(search, newStatus, customerId);
                                }}
                            >
                                <SelectTrigger className="w-44">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="in_market">In Market</SelectItem>
                                    <SelectItem value="accepted">Accepted</SelectItem>
                                    <SelectItem value="partially_accepted">Partially Accepted</SelectItem>
                                    <SelectItem value="declined">Declined</SelectItem>
                                    <SelectItem value="bound">Bound</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={customerId}
                                onValueChange={(val) => {
                                    const newId = val === 'all' ? '' : val;
                                    setCustomerId(newId);
                                    handleSearch(search, status, newId);
                                }}
                            >
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="All Customers" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Customers</SelectItem>
                                    {customers.map((customer) => (
                                        <SelectItem key={customer.id} value={customer.id.toString()}>
                                            {customer.type === 'corporate' ? customer.company_name : `${customer.first_name} ${customer.last_name}`}
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
                                        <TableHead>Placement #</TableHead>
                                        <TableHead>Customer / Insured</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Product Class</TableHead>
                                        <TableHead>Sum Insured</TableHead>
                                        <TableHead>Markets</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {placements.data.length > 0 ? (
                                        placements.data.map((placement) => (
                                            <TableRow key={placement.id}>
                                                <TableCell>
                                                    <Link href={route('placements.show', placement.id)} className="font-medium hover:text-blue-600">
                                                        {placement.placement_number}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{getCustomerDisplayName(placement.customer)}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`${statusColors[placement.status] || 'bg-gray-100 text-gray-800'}`}>
                                                        {placement.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {placement.policyProduct?.name || '—'}
                                                </TableCell>
                                                <TableCell>{formatCurrency(placement.total_sum_insured, placement.currency)}</TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                                                        {placement.markets?.length || 0}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-500">{formatDate(placement.created_at)}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={route('placements.show', placement.id)}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            {(placement.status === 'draft' || placement.status === 'in_market') && (
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={route('placements.edit', placement.id)}>
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            )}
                                                            {placement.status === 'draft' && (
                                                                <DropdownMenuItem onClick={() => handleSubmitToMarket(placement)}>
                                                                    <Send className="mr-2 h-4 w-4" />
                                                                    Submit to Market
                                                                </DropdownMenuItem>
                                                            )}
                                                            {(placement.status === 'accepted' || placement.status === 'bound') && (
                                                                <DropdownMenuItem onClick={() => handleConvertToPolicy(placement)}>
                                                                    <PlusCircle className="mr-2 h-4 w-4" />
                                                                    Convert to Policy
                                                                </DropdownMenuItem>
                                                            )}
                                                            {placement.status === 'draft' && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleDelete(placement)}
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
                                            <TableCell colSpan={8} className="py-8 text-center">
                                                <div className="text-gray-500">
                                                    No placements found.
                                                    <Link href={route('placements.create')} className="ml-1 text-blue-600 hover:text-blue-800">
                                                        Create your first placement
                                                    </Link>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {placements.last_page > 1 && (
                            <div className="flex items-center justify-between border-t p-4">
                                <div className="text-sm text-gray-500">
                                    Showing {placements.from} to {placements.to} of {placements.total} results
                                </div>
                                <div className="flex gap-2">
                                    {placements.links.map((link, index) => (
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
