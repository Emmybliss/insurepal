import { Can } from '@/components/auth/permission-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SearchInput } from '@/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Policy, PolicyClass, PolicyType } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Download, Edit, Eye, MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Props {
    policies: {
        data: Policy[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
    };
    policyTypes: PolicyType[];
    policyClasses: PolicyClass[];
    filters: {
        search?: string;
        status?: string;
        policy_type_id?: string;
        policy_class_id?: string;
    };
    stats: {
        total: number;
        active: number;
        inactive: number;
        total_premium: number;
    };
}

export default function Index({ policies, policyTypes, policyClasses, filters, stats }: Props) {
    const { flash } = usePage().props as any;
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [policyTypeId, setPolicyTypeId] = useState(filters.policy_type_id || '');
    const [policyClassId, setPolicyClassId] = useState(filters.policy_class_id || '');

    const [filteredClasses, setFilteredClasses] = useState<PolicyClass[]>(policyClasses);

    useEffect(() => {
        if (policyTypeId) {
            const filtered = policyClasses.filter((cls) => cls.policy_type_id.toString() === policyTypeId);
            setFilteredClasses(filtered);
            if (policyClassId && !filtered.some((cls) => cls.id.toString() === policyClassId)) {
                setPolicyClassId('');
            }
        } else {
            setFilteredClasses(policyClasses);
        }
    }, [policyTypeId, policyClasses]);

    const handleSearch = (
        searchOverride?: string,
        statusOverride?: string,
        policyTypeIdOverride?: string,
        policyClassIdOverride?: string,
    ) => {
        router.get(
            route('policies.index'),
            {
                search: searchOverride !== undefined ? searchOverride : search || undefined,
                status: statusOverride !== undefined ? statusOverride : status || undefined,
                policy_type_id: policyTypeIdOverride !== undefined ? policyTypeIdOverride : policyTypeId || undefined,
                policy_class_id: policyClassIdOverride !== undefined ? policyClassIdOverride : policyClassId || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const formatCurrency = (amount: number, currency = 'NGN') => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const handleDelete = (policy: Policy) => {
        if (confirm(`Are you sure you want to delete the policy "${policy.name}"? This action cannot be undone.`)) {
            router.delete(route('policies.destroy', policy.id), {
                onSuccess: () => {
                    toast.success(`Policy "${policy.name}" has been deleted successfully`);
                },
                onError: () => {
                    toast.error('Failed to delete policy. It may have associated quotes or policies.');
                },
            });
        }
    };

    return (
        <AppLayout>
            <Head title="Policies" />
            <div className="space-y-6">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Policy Products</h2>
                        <p className="text-muted-foreground">Manage your insurance policy products and offerings.</p>
                    </div>
                    <Can permission="create_policies">
                        <Link href={route('policies.create')}>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add New Policy Product
                            </Button>
                        </Link>
                    </Can>
                </div>

                {(flash?.success || flash?.error) && (
                    <div className={`mb-6 rounded-md p-4 ${flash?.success ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className={`text-sm ${flash?.success ? 'text-green-800' : 'text-red-800'}`}>{flash?.success || flash?.error}</div>
                    </div>
                )}

                {/* Statistics Cards */}
                <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Inactive Policies</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Premium Value</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.total_premium)}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            <SearchInput
                                placeholder="Search policies..."
                                value={search}
                                onChange={(val) => {
                                    setSearch(val);
                                    handleSearch(val, status, policyTypeId, policyClassId);
                                }}
                                className="max-w-sm"
                            />
                            <Select
                                value={policyTypeId}
                                onValueChange={(val) => {
                                    setPolicyTypeId(val);
                                    handleSearch(search, status, val, policyClassId);
                                }}
                            >
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    {policyTypes?.map((type) => (
                                        <SelectItem key={type.id} value={type.id.toString()}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={policyClassId}
                                onValueChange={(val) => {
                                    setPolicyClassId(val);
                                    handleSearch(search, status, policyTypeId, val);
                                }}
                            >
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="All Classes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Classes</SelectItem>
                                    {filteredClasses?.map((cls) => (
                                        <SelectItem key={cls.id} value={cls.id.toString()}>
                                            {cls.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={status}
                                onValueChange={(val) => {
                                    setStatus(val);
                                    handleSearch(search, val, policyTypeId, policyClassId);
                                }}
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">All Status</SelectItem>
                                    <SelectItem value="1">Active</SelectItem>
                                    <SelectItem value="0">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                            {/* <Button type="submit">
                                <Search className="mr-2 h-4 w-4" />
                                Search
                            </Button> */}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Policy Name</TableHead>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Hierarchy</TableHead>
                                        <TableHead>Premium</TableHead>
                                        <TableHead>Commission</TableHead>
                                        <TableHead>Requirements</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {policies.data.length > 0 ? (
                                        policies?.data?.map((policy) => (
                                            <TableRow key={policy.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{policy.name}</div>
                                                        {policy.description && <div className="text-sm text-gray-500">{policy.description}</div>}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <code className="rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-800">{policy.code}</code>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs">
                                                        <div>{policy.policy_type.name}</div>
                                                        <div>→ {policy.policy_class.name}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{formatCurrency(policy.base_premium, policy.currency)}</TableCell>
                                                <TableCell>{policy.commission_rate}%</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {policy.requires_underwriting && (
                                                            <Badge variant="outline" className="text-xs">
                                                                Underwriting
                                                            </Badge>
                                                        )}
                                                        {policy.requires_medical_exam && (
                                                            <Badge variant="outline" className="text-xs">
                                                                Medical
                                                            </Badge>
                                                        )}
                                                        {!policy.requires_underwriting && !policy.requires_medical_exam && (
                                                            <span className="text-xs text-gray-500">None</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={policy.is_active ? 'default' : 'secondary'}>
                                                        {policy.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <Can permission="view_policies">
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={route('policies.show', policy.id)}>
                                                                        <Eye className="mr-2 h-4 w-4" />
                                                                        View
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            </Can>
                                                            <Can permission="edit_policies">
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={route('policies.edit', policy.id)}>
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            </Can>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={route('policies.download', policy.id)} target="_blank">
                                                                    <Download className="mr-2 h-4 w-4" />
                                                                    Download PDF
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <Can permission="delete_policies">
                                                                <DropdownMenuItem
                                                                    onClick={() => handleDelete(policy)}
                                                                    className="text-red-600 focus:text-red-600"
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </Can>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="py-8 text-center">
                                                <div className="text-gray-500">
                                                    No policies found.
                                                    <Can permission="create_policies">
                                                        <Link href={route('policies.create')} className="ml-1 text-blue-600 hover:text-blue-800">
                                                            Create your first policy
                                                        </Link>
                                                    </Can>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {policies.last_page > 1 && (
                            <div className="flex items-center justify-between border-t p-4">
                                <div className="text-sm text-gray-500">
                                    Showing {policies.from} to {policies.to} of {policies.total} results
                                </div>
                                <div className="flex gap-2">
                                    {policies.links.map((link, index) => (
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
