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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowUpDown, Eye, MoreHorizontal, PlusCircle, RotateCcw, Search } from 'lucide-react';
import { useState } from 'react';

interface Insurer {
    id: number;
    name: string;
}

interface ClientBankAccount {
    id: number;
    bank_name: string;
    account_name: string;
}

interface Allocation {
    id: number;
    allocation_type: string;
    amount: number;
    currency: string;
}

interface Remittance {
    id: number;
    remittance_number: string;
    client_bank_account: ClientBankAccount | null;
    insurer: Insurer | null;
    remittance_date: string;
    total_amount: number;
    currency: string;
    payment_method: string;
    reference: string | null;
    status: 'draft' | 'completed' | 'reversed' | 'failed';
    reversal_reason: string | null;
    notes: string | null;
    allocations: Allocation[];
}

interface PaginatedData {
    data: Remittance[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    remittances: PaginatedData;
    filters: {
        search?: string;
        status?: string;
    };
}

const statusBadge: Record<string, 'default' | 'secondary' | 'destructive' | 'warning'> = {
    draft: 'secondary',
    completed: 'default',
    reversed: 'destructive',
    failed: 'warning',
};

function formatCurrency(amount: number, currency: string = 'NGN'): string {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amount);
}

export default function RemittancesIndex({ remittances, filters }: Props) {
    const [search, setSearch] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || '');

    const handleSearch = () => {
        router.get(route('remittances.index'), { search, status: statusFilter || undefined }, { preserveState: true, replace: true });
    };

    const handleStatusFilter = (value: string) => {
        setStatusFilter(value);
        router.get(route('remittances.index'), { search, status: value || undefined }, { preserveState: true, replace: true });
    };

    const handleComplete = (remittance: Remittance) => {
        router.post(route('remittances.complete', remittance.id), {}, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Accounts', href: route('client-bank-accounts.index') }, { title: 'Remittances' }]}>
            <Head title="Remittances" />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Remittances</h1>
                        <p className="text-sm text-muted-foreground">Manage premium remittances to insurers</p>
                    </div>
                    <Link href={route('remittances.create')}>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Remittance
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Remittances</CardTitle>
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search remittances..."
                                    className="pl-10"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={handleStatusFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Statuses</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="reversed">Reversed</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="secondary" onClick={handleSearch}>Search</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="px-4 py-3 text-left text-sm font-medium">Remittance #</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Insurer</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Bank Account</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Method</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium">Status</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {remittances.data.map((remittance) => (
                                        <tr key={remittance.id} className="border-b last:border-0">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{remittance.remittance_number}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{remittance.insurer?.name ?? '—'}</td>
                                            <td className="px-4 py-3">
                                                {remittance.client_bank_account
                                                    ? `${remittance.client_bank_account.bank_name} - ${remittance.client_bank_account.account_name}`
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3">{remittance.remittance_date}</td>
                                            <td className="px-4 py-3 text-right font-mono">
                                                {formatCurrency(remittance.total_amount, remittance.currency)}
                                            </td>
                                            <td className="px-4 py-3 capitalize">{remittance.payment_method.replace('_', ' ')}</td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant={statusBadge[remittance.status]}>
                                                    {remittance.status.charAt(0).toUpperCase() + remittance.status.slice(1)}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem asChild>
                                                            <Link href={route('remittances.show', remittance.id)}>
                                                                <Eye className="mr-2 h-4 w-4" /> View
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        {remittance.status === 'draft' && (
                                                            <DropdownMenuItem onClick={() => handleComplete(remittance)}>
                                                                <RotateCcw className="mr-2 h-4 w-4" /> Complete
                                                            </DropdownMenuItem>
                                                        )}
                                                        {remittance.status === 'completed' && (
                                                            <DropdownMenuItem asChild>
                                                                <Link href={route('remittances.show', remittance.id)}>
                                                                    <RotateCcw className="mr-2 h-4 w-4" /> Reverse
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                    {remittances.data.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                                No remittances found. Create one to get started.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {remittances.last_page > 1 && (
                            <Pagination className="mt-4">
                                <PaginationContent>
                                    {remittances.current_page > 1 && (
                                        <PaginationItem>
                                            <PaginationPrevious href={route('remittances.index', { page: remittances.current_page - 1, search, status: statusFilter || undefined })} />
                                        </PaginationItem>
                                    )}
                                    {Array.from({ length: remittances.last_page }, (_, i) => i + 1).map((page) => (
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                href={route('remittances.index', { page, search, status: statusFilter || undefined })}
                                                isActive={page === remittances.current_page}
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}
                                    {remittances.current_page < remittances.last_page && (
                                        <PaginationItem>
                                            <PaginationNext href={route('remittances.index', { page: remittances.current_page + 1, search, status: statusFilter || undefined })} />
                                        </PaginationItem>
                                    )}
                                </PaginationContent>
                            </Pagination>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
