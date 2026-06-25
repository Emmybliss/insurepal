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
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Banknote, Eye, MoreHorizontal, PlusCircle, Search } from 'lucide-react';
import { useState } from 'react';

interface ClientBankAccount {
    id: number;
    bank_name: string;
    account_name: string;
    account_number: string;
    account_type: string;
    currency: string;
    is_active: boolean;
    opening_balance: number;
    reconciliations_count: number;
}

interface Props {
    accounts: {
        data: ClientBankAccount[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        status?: string;
    };
}

export default function ClientBankAccountsIndex({ accounts, filters }: Props) {
    const [search, setSearch] = useState(filters?.search || '');

    const handleSearch = () => {
        router.get(route('client-bank-accounts.index'), { search }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Accounts', href: route('client-bank-accounts.index') }, { title: 'Bank Accounts' }]}>
            <Head title="Client Bank Accounts" />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Client Bank Accounts</h1>
                        <p className="text-sm text-muted-foreground">Manage clients' bank accounts for NAICOM reporting</p>
                    </div>
                    <Link href={route('client-bank-accounts.create')}>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Account
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Accounts</CardTitle>
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search accounts..."
                                    className="pl-10"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <Button variant="secondary" onClick={handleSearch}>Search</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="px-4 py-3 text-left text-sm font-medium">Bank</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Account Name</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Number</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Currency</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium">Opening Balance</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium">Status</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accounts.data.map((account) => (
                                        <tr key={account.id} className="border-b last:border-0">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Banknote className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{account.bank_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{account.account_name}</td>
                                            <td className="px-4 py-3 font-mono text-sm">{account.account_number}</td>
                                            <td className="px-4 py-3 capitalize">{account.account_type}</td>
                                            <td className="px-4 py-3">{account.currency}</td>
                                            <td className="px-4 py-3 text-right">
                                                {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(account.opening_balance)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant={account.is_active ? 'default' : 'secondary'}>
                                                    {account.is_active ? 'Active' : 'Inactive'}
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
                                                            <Link href={route('client-bank-accounts.show', account.id)}>
                                                                <Eye className="mr-2 h-4 w-4" /> View
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={route('client-bank-accounts.edit', account.id)}>
                                                                <Eye className="mr-2 h-4 w-4" /> Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                    {accounts.data.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                                No bank accounts found. Create one to get started.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {accounts.last_page > 1 && (
                            <Pagination className="mt-4">
                                <PaginationContent>
                                    {accounts.current_page > 1 && (
                                        <PaginationItem>
                                            <PaginationPrevious href={route('client-bank-accounts.index', { page: accounts.current_page - 1 })} />
                                        </PaginationItem>
                                    )}
                                    {Array.from({ length: accounts.last_page }, (_, i) => i + 1).map((page) => (
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                href={route('client-bank-accounts.index', { page })}
                                                isActive={page === accounts.current_page}
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}
                                    {accounts.current_page < accounts.last_page && (
                                        <PaginationItem>
                                            <PaginationNext href={route('client-bank-accounts.index', { page: accounts.current_page + 1 })} />
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
