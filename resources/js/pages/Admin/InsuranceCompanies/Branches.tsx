import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Building2, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Branch {
    id: number;
    name: string;
    code: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    email: string | null;
    phone: string | null;
    is_active: boolean;
    created_at: string;
}

interface Company {
    id: number;
    name: string;
    branches_count: number;
}

interface Props {
    company: Company;
    branches: {
        data: Branch[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function InsuranceCompanyBranches({ company, branches }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: '',
        city: '',
        state: '',
        email: '',
        phone: '',
        is_active: true,
    });
    const [processing, setProcessing] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Super Admin', href: route('admin.dashboard') },
        { title: 'Insurance Companies', href: route('admin.insurance-companies.index') },
        { title: company.name, href: route('admin.insurance-companies.show', company.id) },
        { title: 'Branches', href: route('admin.insurance-companies.branches.index', company.id) },
    ];

    const resetForm = () => {
        setFormData({ name: '', code: '', address: '', city: '', state: '', email: '', phone: '', is_active: true });
        setEditingBranch(null);
        setShowForm(false);
    };

    const openEdit = (branch: Branch) => {
        setFormData({
            name: branch.name,
            code: branch.code || '',
            address: branch.address || '',
            city: branch.city || '',
            state: branch.state || '',
            email: branch.email || '',
            phone: branch.phone || '',
            is_active: branch.is_active,
        });
        setEditingBranch(branch);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        try {
            if (editingBranch) {
                await router.put(
                    route('admin.insurance-companies.branches.update', [company.id, editingBranch.id]),
                    formData as any,
                    {
                        onSuccess: () => {
                            toast.success('Branch updated successfully');
                            resetForm();
                        },
                        onError: (err) => {
                            toast.error(Object.values(err)[0] as string || 'Failed to update branch');
                        },
                        onFinish: () => setProcessing(false),
                    }
                );
            } else {
                await router.post(
                    route('admin.insurance-companies.branches.store', company.id),
                    formData as any,
                    {
                        onSuccess: () => {
                            toast.success('Branch created successfully');
                            resetForm();
                        },
                        onError: (err) => {
                            toast.error(Object.values(err)[0] as string || 'Failed to create branch');
                        },
                        onFinish: () => setProcessing(false),
                    }
                );
            }
        } catch {
            setProcessing(false);
            toast.error('An unexpected error occurred');
        }
    };

    const handleDelete = (branch: Branch) => {
        if (!confirm(`Delete branch "${branch.name}"? This may affect tenants using this branch.`)) return;
        router.delete(route('admin.insurance-companies.branches.destroy', [company.id, branch.id]), {
            onSuccess: () => toast.success('Branch deleted successfully'),
            onError: () => toast.error('Failed to delete branch'),
        });
    };

    const handleToggle = (branch: Branch) => {
        router.post(route('admin.insurance-companies.branches.toggle', [company.id, branch.id]), undefined, {
            onSuccess: () => toast.success(branch.is_active ? 'Branch deactivated' : 'Branch activated'),
            onError: () => toast.error('Failed to toggle branch status'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${company.name} - Branches`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{company.name}</h2>
                        <p className="text-muted-foreground">Manage branches for this insurance company</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={route('admin.insurance-companies.show', company.id)}>
                            <Button variant="outline">Back to Company</Button>
                        </Link>
                        <Button onClick={() => { resetForm(); setShowForm(true); }}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Branch
                        </Button>
                    </div>
                </div>

                {showForm && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>{editingBranch ? 'Edit Branch' : 'New Branch'}</CardTitle>
                                <Button variant="ghost" size="sm" onClick={resetForm}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <CardDescription>
                                {editingBranch ? 'Update branch details' : 'Add a new branch for this company'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="branch_name">Branch Name *</Label>
                                        <Input
                                            id="branch_name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Lagos Main Branch"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="branch_code">Branch Code</Label>
                                        <Input
                                            id="branch_code"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            placeholder="LAG-001"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="branch_email">Email</Label>
                                        <Input
                                            id="branch_email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="lagos@company.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="branch_phone">Phone</Label>
                                        <Input
                                            id="branch_phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+234 xxx xxx xxxx"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="branch_address">Address</Label>
                                    <Input
                                        id="branch_address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Branch street address"
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="branch_city">City</Label>
                                        <Input
                                            id="branch_city"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            placeholder="Lagos"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="branch_state">State</Label>
                                        <Input
                                            id="branch_state"
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                            placeholder="Lagos"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div>
                                        <p className="font-medium">Active Status</p>
                                        <p className="text-sm text-muted-foreground">
                                            Inactive branches won't be available for tenants to select
                                        </p>
                                    </div>
                                    <Switch
                                        checked={formData.is_active}
                                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                    />
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Saving...' : editingBranch ? 'Update Branch' : 'Create Branch'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Branches ({branches.total})</CardTitle>
                        <CardDescription>All branches registered for {company.name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {branches.data.length === 0 ? (
                            <div className="py-8 text-center">
                                <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                                <p className="mt-4 text-muted-foreground">No branches yet</p>
                                <Button variant="outline" className="mt-4" onClick={() => { resetForm(); setShowForm(true); }}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add First Branch
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="pb-3 text-left font-medium">Branch</th>
                                            <th className="pb-3 text-left font-medium">Code</th>
                                            <th className="pb-3 text-left font-medium">Location</th>
                                            <th className="pb-3 text-left font-medium">Contact</th>
                                            <th className="pb-3 text-center font-medium">Active</th>
                                            <th className="pb-3 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {branches.data.map((branch) => (
                                            <tr key={branch.id} className="border-b">
                                                <td className="py-3 font-medium">{branch.name}</td>
                                                <td className="py-3 text-muted-foreground">{branch.code || '—'}</td>
                                                <td className="py-3 text-sm text-muted-foreground">
                                                    {[branch.city, branch.state].filter(Boolean).join(', ') || '—'}
                                                </td>
                                                <td className="py-3 text-sm">
                                                    {branch.email && <div>{branch.email}</div>}
                                                    {branch.phone && <div className="text-muted-foreground">{branch.phone}</div>}
                                                    {!branch.email && !branch.phone && <span className="text-muted-foreground">—</span>}
                                                </td>
                                                <td className="py-3 text-center">
                                                    <Switch
                                                        checked={branch.is_active}
                                                        onCheckedChange={() => handleToggle(branch)}
                                                    />
                                                </td>
                                                <td className="py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => openEdit(branch)}>
                                                            Edit
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(branch)}>
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
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
