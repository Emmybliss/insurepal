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
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Select } from '@radix-ui/react-select';
import {
    AlertCircle,
    Calendar,
    CheckCircle,
    Clock,
    Download,
    Edit,
    Eye,
    FileText,
    Filter,
    MoreHorizontal,
    PlusCircle,
    Search,
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

interface CreditNote {
    id: number;
    note_number: string;
    amount: number;
    formatted_amount: string;
    description: string;
    status: string;
    issue_date: string;
    due_date?: string;
    paid_at?: string;
    is_overdue: boolean;
    days_overdue: number;
    customer: Customer;
    policy?: Policy;
    created_by: {
        name: string;
    };
}

interface Props {
    notes: {
        data: CreditNote[];
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
        total_credit: number;
        outstanding_credit: number;
        overdue_count: number;
    };
    templates: any[];
}

export default function CreditNotesIndex({ notes, customers, filters, stats, templates }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [customerId, setCustomerId] = useState(filters.customer_id || '');
    const [selectedNoteForPdf, setSelectedNoteForPdf] = useState<CreditNote | null>(null);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

    const handleSearch = () => {
        router.get(route('credit-notes.index'), { search, status, customer_id: customerId }, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        setCustomerId('');
        router.get(route('credit-notes.index'));
    };

    const getStatusIcon = (note: CreditNote) => {
        if (note.status === 'paid') {
            return <CheckCircle className="h-4 w-4 text-green-600" />;
        } else if (note.status === 'cancelled') {
            return <XCircle className="h-4 w-4 text-red-600" />;
        } else if (note.is_overdue) {
            return <AlertCircle className="h-4 w-4 text-red-600" />;
        } else if (note.status === 'issued') {
            return <Clock className="h-4 w-4 text-yellow-600" />;
        } else {
            return <FileText className="h-4 w-4 text-gray-600" />;
        }
    };

    const getStatusColor = (note: CreditNote) => {
        if (note.status === 'paid') {
            return 'bg-green-100 text-green-800';
        } else if (note.status === 'cancelled') {
            return 'bg-red-100 text-red-800';
        } else if (note.is_overdue) {
            return 'bg-red-100 text-red-800';
        } else if (note.status === 'issued') {
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
            <Head title="Credit Notes" />

            <div className="flex-1 space-y-4 pt-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Credit Notes</h2>
                        <p className="text-muted-foreground">Manage your Credit Notes</p>
                    </div>
                    <div>
                        <Link href={route('credit-notes.create')}>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create Credit Note
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Credit</CardTitle>
                            <FileText className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">₦{stats.total_credit.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">All credit notes</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">₦{stats.outstanding_credit.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Unpaid credit notes</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                            <XCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.overdue_count}</div>
                            <p className="text-xs text-muted-foreground">Notes past due date</p>
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
                                    placeholder="Search notes..."
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
                                    <SelectItem value="issued">Issued</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={customerId} onValueChange={setCustomerId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All customers" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map((customer) => (
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

                {/* Notes Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Credit Notes</CardTitle>
                            <Button variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Export
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {notes.data.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full table-auto">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="px-4 py-3 text-left">Note Number</th>
                                            <th className="px-4 py-3 text-left">Customer</th>
                                            <th className="px-4 py-3 text-left">Amount</th>
                                            <th className="px-4 py-3 text-left">Status</th>
                                            <th className="px-4 py-3 text-left">Due Date</th>
                                            <th className="px-4 py-3 text-left">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {notes.data.map((note) => (
                                            <tr key={note.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                                <td className="px-4 py-3">
                                                    <div className="font-mono text-sm">{note.note_number}</div>
                                                    <div className="text-xs text-gray-500">{note.description}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center space-x-2">
                                                        <User className="h-4 w-4 text-gray-400" />
                                                        <span className="text-sm">{getCustomerName(note.customer)}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500">Policy: {note.policy?.policy_number ?? 'To Be Advised'}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-semibold text-green-600">{note.formatted_amount}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center space-x-2">
                                                        {getStatusIcon(note)}
                                                        <Badge variant="outline" className={getStatusColor(note)}>
                                                            {note.is_overdue ? 'Overdue' : note.status}
                                                        </Badge>
                                                    </div>
                                                    {note.is_overdue && (
                                                        <div className="mt-1 text-xs text-red-600">{note.days_overdue} days overdue</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm">
                                                        {note.due_date ? (
                                                            <div className="flex items-center space-x-1">
                                                                <Calendar className="h-3 w-3" />
                                                                <span>{new Date(note.due_date).toLocaleDateString()}</span>
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
                                                            <Link href={route('credit-notes.show', note.id)}>
                                                                <DropdownMenuItem>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View
                                                                </DropdownMenuItem>
                                                            </Link>
                                                            {note.status === 'draft' && (
                                                                <Link href={route('credit-notes.edit', note.id)}>
                                                                    <DropdownMenuItem>
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                </Link>
                                                            )}
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setSelectedNoteForPdf(note);
                                                                    setIsGeneratorOpen(true);
                                                                }}
                                                            >
                                                                <Download className="mr-2 h-4 w-4" />
                                                                Download PDF
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            {note.status === 'draft' && (
                                                                <DropdownMenuItem
                                                                    className="text-red-600"
                                                                    onClick={() => router.delete(route('credit-notes.destroy', note.id))}
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
                                <h3 className="mb-2 text-lg font-semibold text-gray-600">No credit notes found</h3>
                                <p className="mb-4 text-gray-500">Create your first credit note to get started.</p>
                                <Link href={route('credit-notes.create')}>
                                    <Button>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Create Credit Note
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {notes.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing {(notes.current_page - 1) * notes.per_page + 1} to {Math.min(notes.current_page * notes.per_page, notes.total)} of{' '}
                            {notes.total} results
                        </div>
                        <div className="flex space-x-2">
                            {notes.current_page > 1 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.get(route('credit-notes.index'), { page: notes.current_page - 1 }, { preserveState: true })}
                                >
                                    Previous
                                </Button>
                            )}
                            {notes.current_page < notes.last_page && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.get(route('credit-notes.index'), { page: notes.current_page + 1 }, { preserveState: true })}
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
