import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Building2, GitBranch, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface InsuranceCompany {
    id: number;
    name: string;
    company_type: 'underwriter' | 'broker' | 'both';
    email: string | null;
    phone: string | null;
    website: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    naicom_reg_number: string | null;
    ncrib_reg_number: string | null;
    rc_number: string | null;
    is_active: boolean;
    branches_count: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    companies: {
        data: InsuranceCompany[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        search: string;
        type: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Super Admin', href: route('admin.dashboard') },
    { title: 'Insurance Companies', href: route('admin.insurance-companies.index') },
];

const COMPANY_TYPE_LABELS: Record<string, string> = {
    underwriter: 'Underwriter',
    broker: 'Broker',
    both: 'Both',
};

export default function InsuranceCompaniesIndex({ companies, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || 'all');

    useEffect(() => {
        setSearch(filters.search || '');
        setTypeFilter(filters.type || 'all');
    }, [filters.search, filters.type]);

    const handleSearch = () => {
        router.get(route('admin.insurance-companies.index'), { search, type: typeFilter }, { replace: true });
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleToggle = async (company: InsuranceCompany) => {
        try {
            await router.post(route('admin.insurance-companies.toggle', company.id));
            toast.success(company.is_active ? 'Company deactivated' : 'Company activated');
        } catch {
            toast.error('Failed to update company status');
        }
    };

    const handleDelete = async (company: InsuranceCompany) => {
        if (!confirm(`Are you sure you want to delete "${company.name}"?`)) return;
        try {
            await router.delete(route('admin.insurance-companies.destroy', company.id));
            toast.success('Company deleted successfully');
        } catch {
            toast.error('Failed to delete company');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Insurance Companies - Super Admin" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Insurance Companies</h2>
                        <p className="text-muted-foreground">Manage insurance company directory (reference data)</p>
                    </div>
                    <Link href={route('admin.insurance-companies.create')}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Company
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Search & Filter
                        </CardTitle>
                        <CardDescription>Find insurance companies in the directory</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4 md:flex-row">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, email, phone, reg number..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    className="pl-9"
                                />
                            </div>
                            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); router.get(route('admin.insurance-companies.index'), { search, type: v }, { replace: true }); }}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="underwriter">Underwriters</SelectItem>
                                    <SelectItem value="broker">Brokers</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Companies ({companies.total})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {companies.data.length === 0 ? (
                            <div className="py-8 text-center">
                                <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                                <p className="mt-4 text-muted-foreground">No insurance companies found</p>
                                <Link href={route('admin.insurance-companies.create')} className="mt-4 inline-block">
                                    <Button variant="outline">Add First Company</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="pb-3 text-left font-medium w-12">#</th>
                                            <th className="pb-3 text-left font-medium">Company</th>
                                            <th className="pb-3 text-left font-medium">Type</th>
                                            <th className="pb-3 text-center font-medium">Branches</th>
                                            <th className="pb-3 text-left font-medium">Contact</th>
                                            <th className="pb-3 text-left font-medium">Location</th>
                                            <th className="pb-3 text-left font-medium">Reg Numbers</th>
                                            <th className="pb-3 text-center font-medium">Status</th>
                                            <th className="pb-3 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {companies.data.map((company, index) => (
                                            <tr key={company.id} className="border-b">
                                                <td className="py-3 text-muted-foreground">
                                                    {(companies.current_page - 1) * companies.per_page + index + 1}
                                                </td>
                                                <td className="py-3">
                                                    <Link
                                                        href={route('admin.insurance-companies.edit', company.id)}
                                                        className="font-medium hover:underline"
                                                    >
                                                        {company.name}
                                                    </Link>
                                                </td>
                                                <td className="py-3 text-center">
                                                    <Link
                                                        href={route('admin.insurance-companies.branches.index', company.id)}
                                                        className="inline-flex items-center gap-1 text-sm hover:underline"
                                                    >
                                                        <GitBranch className="h-3.5 w-3.5" />
                                                        {company.branches_count}
                                                    </Link>
                                                </td>
                                                <td className="py-3">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                            company.company_type === 'underwriter'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : company.company_type === 'broker'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-purple-100 text-purple-800'
                                                        }`}
                                                    >
                                                        {COMPANY_TYPE_LABELS[company.company_type]}
                                                    </span>
                                                </td>
                                                <td className="py-3">
                                                    <div className="text-sm">
                                                        {company.email && <div>{company.email}</div>}
                                                        {company.phone && <div className="text-muted-foreground">{company.phone}</div>}
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    <div className="text-sm text-muted-foreground">
                                                        {company.city && <div>{company.city}</div>}
                                                        {company.state && <div>{company.state}</div>}
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    <div className="text-sm">
                                                        {company.naicom_reg_number && (
                                                            <div>
                                                                <span className="text-xs text-muted-foreground">NAICOM:</span> {company.naicom_reg_number}
                                                            </div>
                                                        )}
                                                        {company.ncrib_reg_number && (
                                                            <div>
                                                                <span className="text-xs text-muted-foreground">NCRIB:</span> {company.ncrib_reg_number}
                                                            </div>
                                                        )}
                                                        {company.rc_number && (
                                                            <div>
                                                                <span className="text-xs text-muted-foreground">RC:</span> {company.rc_number}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 text-center">
                                                    <Switch
                                                        checked={company.is_active}
                                                        onCheckedChange={() => handleToggle(company)}
                                                    />
                                                </td>
                                                <td className="py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Link href={route('admin.insurance-companies.edit', company.id)}>
                                                            <Button variant="outline" size="sm">
                                                                Edit
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700"
                                                            onClick={() => handleDelete(company)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {companies.last_page > 1 && (
                            <div className="mt-4 flex justify-center gap-2">
                                {companies.links.map((link, index) => (
                                    <Button
                                        key={index}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url)}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}