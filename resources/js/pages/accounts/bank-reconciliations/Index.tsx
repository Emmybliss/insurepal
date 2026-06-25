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
import { Eye, MoreHorizontal, PlusCircle, Search } from 'lucide-react';
import { useState } from 'react';

interface ClientBankAccount {
    id: number;
    bank_name: string;
    account_name: string;
}

interface Reconciliation {
    id: number;
    client_bank_account: ClientBankAccount | null;
    reconciliation_date: string;
    closing_balance: number | null;
    calculated_balance: number;
    difference: number | null;
    status: 'draft' | 'reconciled' | 'difference_identified';
    reconciled_at: string | null;
    reconciled_by: string | null;
    notes: string | null;
}

interface PaginatedData {
    data: Reconciliation[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    reconciliations: PaginatedData;
    filters: {
        search?: string;
        status?: string;
    };
}

const statusBadge: Record<string, 'default' | 'secondary' | 'warning'> = {
    draft: 'secondary',
    reconciled: 'default',
    difference_identified: 'warning',
};

function formatCurrency(amount: number | null): string {
    if (amount === null) return '—';
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
}

export default function BankReconciliationsIndex({ reconciliations, filters }: Props) {
    const [search, setSearch] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || '');

    const handleSearch = () => {
        router.get(route('bank-reconciliations.index'), { search, status: statusFilter || undefined }, { preserveState: true, replace: true });
    };

    const handleStatusFilter = (value: string) => {
        setStatusFilter(value);
        router.get(route('bank-reconciliations.index'), { search, status: value || undefined }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Accounts', href: route('client-bank-accounts.index') }, { title: 'Bank Reconciliations' }]}>
            <Head title="Bank Reconciliations" />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Bank Reconciliations</h1>
                        <p className="text-sm text-muted-foreground">Reconcile bank account balances with system records</p>
                    </div>
                    <Link href={route('bank-reconciliations.create')}>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Reconciliation
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Reconciliations</CardTitle>
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search by bank or account name..."
                                    className="pl-10"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={handleStatusFilter}>
                                <SelectTrigger className="w-44">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Statuses</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="reconciled">Reconciled</SelectItem>
                                    <SelectItem value="difference_identified">Difference Identified</SelectItem>
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
                                        <th className="px-4 py-3 text-left text-sm font-medium">Bank Account</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium">Closing Balance</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium">Calculated Balance</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium">Difference</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Reconciled By</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium">Status</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reconciliations.data.map((rec) => (
                                        <tr key={rec.id} className="border-b last:border-0">
                                            <td className="px-4 py-3 font-medium">
                                                {rec.client_bank_account
                                                    ? `${rec.client_bank_account.bank_name} - ${rec.client_bank_account.account_name}`
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3">{rec.reconciliation_date}</td>
                                            <td className="px-4 py-3 text-right font-mono">{formatCurrency(rec.closing_balance)}</td>
                                            <td className="px-4 py-3 text-right font-mono">{formatCurrency(rec.calculated_balance)}</td>
                                            <td className="px-4 py-3 text-right font-mono">
                                                {rec.difference !== null ? (
                                                    <span className={rec.difference !== 0 ? 'text-destructive' : ''}>
                                                        {formatCurrency(rec.difference)}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td className="px-4 py-3">{rec.reconciled_by ?? '—'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant={statusBadge[rec.status]}>
                                                    {rec.status === 'difference_identified'
                                                        ? 'Difference Identified'
                                                        : rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
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
                                                            <Link href={route('bank-reconciliations.show', rec.id)}>
                                                                <Eye className="mr-2 h-4 w-4" /> View
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                    {reconciliations.data.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                                No reconciliations found. Create one to get started.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {reconciliations.last_page > 1 && (
                            <Pagination className="mt-4">
                                <PaginationContent>
                                    {reconciliations.current_page > 1 && (
                                        <PaginationItem>
                                            <PaginationPrevious href={route('bank-reconciliations.index', { page: reconciliations.current_page - 1, search, status: statusFilter || undefined })} />
                                        </PaginationItem>
                                    )}
                                    {Array.from({ length: reconciliations.last_page }, (_, i) => i + 1).map((page) => (
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                href={route('bank-reconciliations.index', { page, search, status: statusFilter || undefined })}
                                                isActive={page === reconciliations.current_page}
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}
                                    {reconciliations.current_page < reconciliations.last_page && (
                                        <PaginationItem>
                                            <PaginationNext href={route('bank-reconciliations.index', { page: reconciliations.current_page + 1, search, status: statusFilter || undefined })} />
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
