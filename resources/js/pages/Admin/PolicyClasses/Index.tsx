import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Edit, Eye, MoreHorizontal, PlusCircle, Power, PowerOff, Search } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface PolicyType {
    id: number;
    name: string;
    code: string;
}

interface PolicyClass {
    id: number;
    name: string;
    code: string;
    description: string | null;
    is_active: boolean;
    premium_multiplier: number;
    commission_multiplier: number;
    min_sum_assured: number;
    max_sum_assured: number | null;
    sort_order: number;
    policy_type: PolicyType;
    created_at: string;
    updated_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PolicyClassesData {
    current_page: number;
    data: PolicyClass[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: PaginationLink[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

interface Props {
    policyClasses: PolicyClassesData;
    policyTypes: PolicyType[];
    filters: {
        search?: string;
        status?: string;
        policy_type_id?: string;
    };
}

export default function Index({ policyClasses, policyTypes, filters }: Props) {
    const { flash } = usePage().props as any;
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [policyTypeId, setPolicyTypeId] = useState(filters.policy_type_id || '');
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('admin.policy-classes.index'),
            {
                search: search || undefined,
                status: status || undefined,
                policy_type_id: policyTypeId || undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleToggleStatus = (policyClass: PolicyClass) => {
        router.post(
            route('admin.policy-classes.toggle-status', policyClass.id),
            {},
            {
                onSuccess: () => {
                    toast.success(`Policy class ${policyClass.is_active ? 'deactivated' : 'activated'} successfully`);
                },
                onError: () => {
                    toast.error('Failed to update policy class status');
                },
                preserveScroll: true,
            },
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    return (
        <AppLayout>
            <Head title="Policy Classes" />

            <div className="space-y-6">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Policy Classes</h1>
                        <p className="text-muted-foreground">Manage specific policy classes within categories for detailed risk assessment.</p>
                    </div>
                    <Link href={route('admin.policy-classes.create')}>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Policy Class
                        </Button>
                    </Link>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="mb-6 rounded-md bg-green-50 p-4">
                        <div className="text-sm text-green-800">{flash.success}</div>
                    </div>
                )}

                {flash?.error && (
                    <div className="mb-6 rounded-md bg-red-50 p-4">
                        <div className="text-sm text-red-800">{flash.error}</div>
                    </div>
                )}

                {/* Filters */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
                            <div className="min-w-64 flex-1">
                                <Input
                                    placeholder="Search policy classes..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="max-w-sm"
                                />
                            </div>
                            <Select value={policyTypeId} onValueChange={setPolicyTypeId}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="All Policy Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    {/* <SelectItem value="">All Policy Types</SelectItem> */}
                                    {policyTypes.map((type) => (
                                        <SelectItem key={type.id} value={type.id.toString()}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {/* <SelectItem value="">All Status</SelectItem> */}
                                    <SelectItem value="1">Active</SelectItem>
                                    <SelectItem value="0">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button type="submit">
                                <Search className="mr-2 h-4 w-4" />
                                Search
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Class Name</TableHead>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Policy Type</TableHead>
                                        <TableHead>Premium Multiplier</TableHead>
                                        <TableHead>Commission Multiplier</TableHead>
                                        <TableHead>Sum Assured Range</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {policyClasses.data.length > 0 ? (
                                        policyClasses.data.map((policyClass) => (
                                            <TableRow key={policyClass.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{policyClass.name}</div>
                                                        {policyClass.description && (
                                                            <div className="text-sm text-gray-500">{policyClass.description}</div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <code className="rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-400">{policyClass.code}</code>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <div className="font-medium">{policyClass.policy_type.name}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-medium">{policyClass.premium_multiplier}x</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-medium">{policyClass.commission_multiplier}x</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <div>{formatCurrency(policyClass.min_sum_assured)}</div>
                                                        <div className="text-gray-500">
                                                            to{' '}
                                                            {policyClass.max_sum_assured ? formatCurrency(policyClass.max_sum_assured) : 'No limit'}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={policyClass.is_active ? 'default' : 'secondary'}>
                                                        {policyClass.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={route('admin.policy-classes.show', policyClass.id)}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={route('admin.policy-classes.edit', policyClass.id)}>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleToggleStatus(policyClass)}>
                                                                {policyClass.is_active ? (
                                                                    <>
                                                                        <PowerOff className="mr-2 h-4 w-4" />
                                                                        Deactivate
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Power className="mr-2 h-4 w-4" />
                                                                        Activate
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="py-8 text-center">
                                                <div className="text-gray-500">
                                                    No policy classes found.
                                                    <Link
                                                        href={route('admin.policy-classes.create')}
                                                        className="ml-1 text-blue-600 hover:text-blue-800"
                                                    >
                                                        Create your first policy class
                                                    </Link>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {policyClasses.last_page > 1 && (
                            <div className="flex items-center justify-between border-t p-4">
                                <div className="text-sm text-gray-500">
                                    Showing {policyClasses.from} to {policyClasses.to} of {policyClasses.total} results
                                </div>
                                <div className="flex gap-2">
                                    {policyClasses.links.map((link, index) => (
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
