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

interface Policy {
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
    policy_type: PolicyType;
    policy_class: PolicyClass;
    tenant: { id: number; name: string } | null;
}

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
        tenant_id?: string;
    };
}

export default function Index({ policies, policyTypes, policyClasses, filters }: Props) {
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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('admin.policies.index'),
            {
                search: search || undefined,
                status: status || undefined,
                policy_type_id: policyTypeId || undefined,
                policy_class_id: policyClassId || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleToggleStatus = (policy: Policy) => {
        router.post(
            route('admin.policies.toggle-status', policy.id),
            {},
            {
                onSuccess: () => {
                    toast.success(`Policy ${policy.is_active ? 'deactivated' : 'activated'} successfully`);
                },
                onError: () => {
                    toast.error('Failed to update policy status');
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
            <Head title="Policies" />
            <div className="space-y-6">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Insurance Policies</h2>
                        <p className="text-muted-foreground">Manage complete insurance policy products with full configuration.</p>
                    </div>
                    <Link href={route('admin.policies.create')}>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Policy
                        </Button>
                    </Link>
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
                        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
                            <Input placeholder="Search policies..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
                            <Select value={policyTypeId} onValueChange={setPolicyTypeId}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    {/* <SelectItem value="">All Types</SelectItem> */}
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
                                    {filteredClasses.map((cls) => (
                                        <SelectItem key={cls.id} value={cls.id.toString()}>
                                            {cls.name}
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
                                        policies.data.map((policy) => (
                                            <TableRow key={policy.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{policy.name}</div>
                                                        {policy.description && <div className="text-sm text-gray-500">{policy.description}</div>}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <code className="rounded bg-gray-100 px-2 py-1 text-sm">{policy.code}</code>
                                                </TableCell>
                                                <TableCell>
                                                <div className="text-xs text-gray-600">
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
                                                            <DropdownMenuItem asChild>
                                                                <Link href={route('admin.policies.show', policy.id)}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={route('admin.policies.edit', policy.id)}>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleToggleStatus(policy)}>
                                                                {policy.is_active ? (
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
                                                    No policies found.
                                                    <Link href={route('admin.policies.create')} className="ml-1 text-blue-600 hover:text-blue-800">
                                                        Create your first policy
                                                    </Link>
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
