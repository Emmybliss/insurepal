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
import { Head, Link, router } from '@inertiajs/react';
import { Download, Edit, FileText, Filter, MoreHorizontal, PlusCircle, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
}

interface Expense {
    id: number;
    category: string;
    amount: number;
    currency: string;
    description: string;
    expense_date: string;
    receipt_path: string;
    status: string;
    user: User;
}

interface Props {
    expenses: {
        data: Expense[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        category?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
    };
}

export default function ExpensesIndex({ expenses, filters }: Props) {
    const [search, setSearch] = useState(filters?.search || '');
    const [category, setCategory] = useState(filters?.category || '');
    const [status, setStatus] = useState(filters?.status || '');

    const handleSearch = () => {
        router.get(route('expenses.index'), { search, category, status }, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        setSearch('');
        setCategory('');
        setStatus('');
        router.get(route('expenses.index'));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            case 'reimbursed':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AppLayout>
            <Head title="Expenses" />

            <div className="flex-1 space-y-4 pt-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Expenses</h2>
                        <p className="text-muted-foreground">Track and manage your expenditures</p>
                    </div>
                    <div>
                        <Link href={route('expenses.create')}>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                New Expense
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div className="relative">
                                <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search descriptions..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="pl-8"
                                />
                            </div>

                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Travel">Travel</SelectItem>
                                    <SelectItem value="Meals">Meals</SelectItem>
                                    <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                                    <SelectItem value="Marketing">Marketing</SelectItem>
                                    <SelectItem value="Utilities">Utilities</SelectItem>
                                    <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="reimbursed">Reimbursed</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
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

                {/* Expenses Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Expense Records</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {expenses.data.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full table-auto">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">User</th>
                                            <th className="px-4 py-3">Category</th>
                                            <th className="px-4 py-3">Amount</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Description</th>
                                            <th className="px-4 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expenses.data.map((expense) => (
                                            <tr key={expense.id} className="border-b transition-colors hover:bg-gray-50/50">
                                                <td className="px-4 py-3 text-sm">{new Date(expense.expense_date).toLocaleDateString()}</td>
                                                <td className="px-4 py-3 text-sm">{expense.user.name}</td>
                                                <td className="px-4 py-3 text-sm font-medium">{expense.category}</td>
                                                <td className="px-4 py-3 text-sm font-semibold">
                                                    {expense.currency}{' '}
                                                    {parseFloat(expense.amount.toString()).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className={getStatusColor(expense.status)}>
                                                        {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                                                    </Badge>
                                                </td>
                                                <td className="max-w-xs truncate px-4 py-3 text-sm text-muted-foreground">{expense.description}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <Link href={route('expenses.edit', expense.id)}>
                                                                <DropdownMenuItem>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                            </Link>
                                                            {expense.receipt_path && (
                                                                <DropdownMenuItem
                                                                    onClick={() => window.open(`/storage/${expense.receipt_path}`, '_blank')}
                                                                >
                                                                    <Download className="mr-2 h-4 w-4" />
                                                                    View Receipt
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => {
                                                                    if (confirm('Are you sure you want to delete this expense?')) {
                                                                        router.delete(route('expenses.destroy', expense.id));
                                                                    }
                                                                }}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-12 text-center">
                                <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                                <h3 className="mb-2 text-lg font-semibold text-muted-foreground">No expenses found</h3>
                                <p className="mb-4 text-muted-foreground">You haven't recorded any expenses yet.</p>
                                <Link href={route('expenses.create')}>
                                    <Button variant="outline" size="sm">
                                        Record your first expense
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination (if needed) */}
                {expenses.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Showing {(expenses.current_page - 1) * expenses.per_page + 1} to{' '}
                            {Math.min(expenses.current_page * expenses.per_page, expenses.total)} of {expenses.total} results
                        </div>
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={expenses.current_page === 1}
                                onClick={() => router.get(expenses.prev_page_url)}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={expenses.current_page === expenses.last_page}
                                onClick={() => router.get(expenses.next_page_url)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
