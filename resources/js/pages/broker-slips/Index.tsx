import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SearchInput } from '@/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronDown, Edit, Eye, FileText, MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface BrokerSlip {
    id: number;
    slip_number: string;
    version: number;
    currency: string;
    sum_insured: string;
    gross_premium: string;
    net_premium: string;
    status: string;
    period_start: string;
    period_end: string;
    created_at: string;
    placement: {
        id: number;
        placement_number: string;
        customer: {
            id: number;
            type: string;
            first_name: string;
            last_name: string;
            company_name: string;
        };
    };
    placement_market: {
        insurance_company: {
            id: number;
            name: string;
        };
    };
    created_by: {
        id: number;
        name: string;
    };
}

interface Props {
    brokerSlips: {
        data: BrokerSlip[];
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
    };
}

const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    pending_review: { label: 'Pending Review', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    changes_requested: { label: 'Changes Requested', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    issued: { label: 'Issued', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    superseded: { label: 'Superseded', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    withdrawn: { label: 'Withdrawn', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

function StatusBadge({ status }: { status: string }) {
    const config = statusConfig[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' };
    return <Badge className={config.className}>{config.label}</Badge>;
}

function formatCurrency(amount: string | number, currency = 'NGN') {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency,
    }).format(Number(amount));
}

function getCustomerName(customer: BrokerSlip['placement']['customer']): string {
    if (!customer) return '—';
    if (customer.type === 'corporate') return customer.company_name;
    return `${customer.first_name} ${customer.last_name}`;
}

const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'changes_requested', label: 'Changes Requested' },
    { value: 'approved', label: 'Approved' },
    { value: 'issued', label: 'Issued' },
    { value: 'superseded', label: 'Superseded' },
    { value: 'withdrawn', label: 'Withdrawn' },
];

export default function Index({ brokerSlips, filters }: Props) {
    const { flash } = usePage().props as any;
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleSearch = (searchOverride?: string, statusOverride?: string) => {
        router.get(
            route('broker-slips.index'),
            {
                search: searchOverride !== undefined ? searchOverride || undefined : search || undefined,
                status: statusOverride !== undefined ? statusOverride || undefined : status || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleDelete = (slip: BrokerSlip) => {
        if (confirm(`Are you sure you want to delete broker slip "${slip.slip_number}"? This action cannot be undone.`)) {
            router.delete(route('broker-slips.destroy', slip.id), {
                onSuccess: () => {
                    toast.success(`Broker slip "${slip.slip_number}" has been deleted successfully`);
                },
                onError: () => {
                    toast.error('Failed to delete broker slip.');
                },
            });
        }
    };

    const canEdit = (status: string) => status === 'draft' || status === 'changes_requested';
    const canDelete = (status: string) => status === 'draft';

    return (
        <AppLayout>
            <Head title="Broker Slips" />
            <div className="space-y-6">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Broker Slips</h2>
                        <p className="text-muted-foreground">Manage broker slips, submissions, and issued slips.</p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create Broker Slip
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                            <DropdownMenuItem asChild>
                                <Link href={route('broker-slips.create')} className="cursor-pointer">
                                    <FileText className="mr-2 h-4 w-4" />
                                    <div>
                                        <p className="font-medium">From Placement</p>
                                        <p className="text-xs text-muted-foreground">Create from an existing placement</p>
                                    </div>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={route('broker-slips.create-direct')} className="cursor-pointer">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    <div>
                                        <p className="font-medium">Create Directly</p>
                                        <p className="text-xs text-muted-foreground">Quick create for single-insurer business</p>
                                    </div>
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {(flash?.success || flash?.error) && (
                    <div className={`mb-6 rounded-md p-4 ${flash?.success ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className={`text-sm ${flash?.success ? 'text-green-800' : 'text-red-800'}`}>{flash?.success || flash?.error}</div>
                    </div>
                )}

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            <SearchInput
                                placeholder="Search by slip number or insured name..."
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
                                    <SelectValue placeholder="All Status" />
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
                                        <TableHead>Slip Number</TableHead>
                                        <TableHead>Version</TableHead>
                                        <TableHead>Insured</TableHead>
                                        <TableHead>Placement</TableHead>
                                        <TableHead>Sum Insured</TableHead>
                                        <TableHead>Net Premium</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {brokerSlips.data.length > 0 ? (
                                        brokerSlips.data.map((slip) => (
                                            <TableRow key={slip.id}>
                                                <TableCell>
                                                    <div className="font-medium">{slip.slip_number}</div>
                                                    {slip.created_by && (
                                                        <div className="text-xs text-gray-500">
                                                            by {slip.created_by.name}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">v{slip.version}</span>
                                                </TableCell>
                                                <TableCell>
                                                    {slip.placement?.customer ? (
                                                        <div className="text-sm">
                                                            {getCustomerName(slip.placement.customer)}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {slip.placement ? (
                                                        <code className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
                                                            {slip.placement.placement_number}
                                                        </code>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>{formatCurrency(slip.sum_insured, slip.currency)}</TableCell>
                                                <TableCell>{formatCurrency(slip.net_premium, slip.currency)}</TableCell>
                                                <TableCell>
                                                    <StatusBadge status={slip.status} />
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
                                                                <Link href={route('broker-slips.show', slip.id)}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            {canEdit(slip.status) && (
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={route('broker-slips.edit', slip.id)}>
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            )}
                                                            {canDelete(slip.status) && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleDelete(slip)}
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
                                                    No broker slips found.
                                                    <Link href={route('broker-slips.create-direct')} className="ml-1 text-blue-600 hover:text-blue-800">
                                                        Create your first broker slip
                                                    </Link>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {brokerSlips.last_page > 1 && (
                            <div className="flex items-center justify-between border-t p-4">
                                <div className="text-sm text-gray-500">
                                    Showing {brokerSlips.from} to {brokerSlips.to} of {brokerSlips.total} results
                                </div>
                                <div className="flex gap-2">
                                    {brokerSlips.links.map((link, index) => (
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
