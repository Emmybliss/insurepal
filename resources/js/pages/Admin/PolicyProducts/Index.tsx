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
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PolicyType {
    id: number;
    name: string;
}
interface PolicyClass {
    id: number;
    name: string;
    policy_type_id: number;
}

interface PolicyProduct {
    id: number;
    name: string;
    code: string;
    description: string | null;
    is_active: boolean;
    base_premium: number;
    commission_rate: number;
    requires_underwriting: boolean;
    requires_medical_exam: boolean;
    currency: string;
    policyType: PolicyType;
    policyClass: PolicyClass;
    tenant: { id: number; name: string } | null;
}

interface Props {
    policyProducts: {
        data: PolicyProduct[];
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
        tenant_id?: string;
    };
}

export default function Index({ policyProducts, policyTypes, policyClasses, filters }: Props) {
    const { flash } = usePage().props as any;
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [policyTypeId, setPolicyTypeId] = useState(filters.policy_type_id || '');
    const [policyClassId, setPolicyClassId] = useState(filters.policy_class_id || '');

    const [filteredClasses, setFilteredClasses] = useState<PolicyClass[]>(policyClasses);

    // Filter classes when policy type changes
    useEffect(() => {
        if (policyTypeId) {
            const filtered = policyClasses.filter((cls) => cls.policy_type_id.toString() === policyTypeId);
            setFilteredClasses(filtered);
            // Reset class if it doesn't belong to the new type
            if (policyClassId && !filtered.some((cls) => cls.id.toString() === policyClassId)) {
                setPolicyClassId('');
            }
        } else {
            setFilteredClasses(policyClasses);
        }
    }, [policyTypeId, policyClasses]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('admin.policy-products.index'),
            {
                search: search || undefined,
                status: status || undefined,
                policy_type_id: policyTypeId || undefined,
                policy_class_id: policyClassId || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleToggleStatus = (policyProduct: PolicyProduct) => {
        router.post(
            route('admin.policy-products.toggle-status', policyProduct.id),
            {},
            {
                onSuccess: () => {
                    toast.success(`Policy product ${policyProduct.is_active ? 'deactivated' : 'activated'} successfully`);
                },
                onError: () => {
                    toast.error('Failed to update policy product status');
                },
                preserveScroll: true,
            },
        );
    };

    const formatCurrency = (amount: number, currency = 'NGN') => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    return (
        <AppLayout>
            <Head title="Policy Products" />

            <div className="space-y-6">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Policy Products</h1>
                        <p className="text-muted-foreground">Manage insurance policy product templates.</p>
                    </div>
                    <Link href={route('admin.policy-products.create')}>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Policy Product
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
                                <Input placeholder="Search policy products..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
                            <Select value={policyClassId} onValueChange={setPolicyClassId}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="All Classes" />
                                </SelectTrigger>
                                <SelectContent>
                                    {/* <SelectItem value="">All Classes</SelectItem> */}
                                    {filteredClasses.map((policyClass) => (
                                        <SelectItem key={policyClass.id} value={policyClass.id.toString()}>
                                            {policyClass.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-32">
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product Name</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Policy Hierarchy</TableHead>
                                    <TableHead>Base Premium</TableHead>
                                    <TableHead>Commission Rate</TableHead>
                                    <TableHead>Requirements</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {policyProducts.data.length > 0 ? (
                                    policyProducts.data.map((policyProduct) => (
                                        <TableRow key={policyProduct.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{policyProduct.name}</div>
                                                    {policyProduct.description && (
                                                        <div className="max-w-xs truncate text-sm text-gray-500">{policyProduct.description}</div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <code className="rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-400">{policyProduct.code}</code>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <div className="font-medium">{policyProduct?.policyType?.name}</div>
                                                    <div className="text-gray-500">{policyProduct?.policyClass?.name}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {formatCurrency(policyProduct.base_premium, policyProduct.currency)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{policyProduct.commission_rate}%</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    {policyProduct.requires_underwriting && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Underwriting
                                                        </Badge>
                                                    )}
                                                    {policyProduct.requires_medical_exam && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Medical Exam
                                                        </Badge>
                                                    )}
                                                    {!policyProduct.requires_underwriting && !policyProduct.requires_medical_exam && (
                                                        <span className="text-xs text-gray-500">None</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={policyProduct.is_active ? 'default' : 'secondary'}>
                                                    {policyProduct.is_active ? 'Active' : 'Inactive'}
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
                                                            <Link href={route('admin.policy-products.show', policyProduct.id)}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={route('admin.policy-products.edit', policyProduct.id)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleToggleStatus(policyProduct)}>
                                                            {policyProduct.is_active ? (
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
                                                No policy products found.
                                                <Link href={route('admin.policy-products.create')} className="ml-1 text-blue-600 hover:text-blue-800">
                                                    Create your first policy product
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        {policyProducts.last_page > 1 && (
                            <div className="flex items-center justify-between border-t p-4">
                                <div className="text-sm text-gray-500">
                                    Showing {policyProducts.from} to {policyProducts.to} of {policyProducts.total} results
                                </div>
                                <div className="flex gap-2">
                                    {policyProducts.links.map((link, index) => (
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
