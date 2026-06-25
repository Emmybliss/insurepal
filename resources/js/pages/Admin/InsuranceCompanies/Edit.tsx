import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { DEFAULT_COUNTRY, NIGERIAN_STATES } from '@/lib/constants';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Building2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
    company?: {
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
        notes: string | null;
        is_active: boolean;
    };
    isEditing?: boolean;
}

export default function InsuranceCompaniesCreate({ company, isEditing }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Super Admin', href: route('admin.dashboard') },
        { title: 'Insurance Companies', href: route('admin.insurance-companies.index') },
        { title: isEditing && company ? `Edit ${company.name}` : 'Edit Company', href: isEditing && company ? route('admin.insurance-companies.edit', company.id) : '#' },
    ];

    const [data, setData] = useState({
        name: company?.name || '',
        company_type: company?.company_type || 'underwriter',
        email: company?.email || '',
        phone: company?.phone || '',
        website: company?.website || '',
        address: company?.address || '',
        city: company?.city || '',
        state: company?.state || '',
        country: company?.country || DEFAULT_COUNTRY,
        naicom_reg_number: company?.naicom_reg_number || '',
        ncrib_reg_number: company?.ncrib_reg_number || '',
        rc_number: company?.rc_number || '',
        notes: company?.notes || '',
        is_active: company?.is_active ?? true,
    });

    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            const routeName = isEditing ? 'admin.insurance-companies.update' : 'admin.insurance-companies.store';
            const routeMethod = isEditing ? 'post' : 'post';

            await router[routeMethod](routeName, company?.id ? { ...data, _method: 'put' } : data, {
                onSuccess: () => {
                    toast.success(isEditing ? 'Company updated successfully' : 'Company created successfully');
                    router.visit(route('admin.insurance-companies.index'));
                },
                onError: (err) => {
                    setErrors(err);
                    toast.error('Please check the form for errors');
                },
                onFinish: () => setProcessing(false),
            });
        } catch {
            setProcessing(false);
            toast.error('An unexpected error occurred');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEditing ? 'Edit Company - Super Admin' : 'Add Company - Super Admin'} />

            <div className="mx-auto max-w-3xl space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">
                            {isEditing ? 'Edit Company' : 'Add Insurance Company'}
                        </h2>
                        <p className="text-muted-foreground">
                            {isEditing
                                ? 'Update insurance company details'
                                : 'Add a new insurance company to the directory'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Basic Information
                            </CardTitle>
                            <CardDescription>Primary company details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Company Name *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData({ ...data, name: e.target.value })}
                                        placeholder="AIICO Insurance Plc"
                                        required
                                    />
                                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="company_type">Company Type *</Label>
                                    <Select
                                        value={data.company_type}
                                        onValueChange={(value) => setData({ ...data, company_type: value as 'both' | 'underwriter' | 'broker' })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="underwriter">Underwriter</SelectItem>
                                            <SelectItem value="broker">Broker</SelectItem>
                                            <SelectItem value="both">Both (Underwriter & Broker)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.company_type && (
                                        <p className="text-sm text-red-500">{errors.company_type}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="naicom_reg_number">NAICOM Reg Number</Label>
                                    <Input
                                        id="naicom_reg_number"
                                        value={data.naicom_reg_number}
                                        onChange={(e) => setData({ ...data, naicom_reg_number: e.target.value })}
                                        placeholder="NAICOM/12345"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="ncrib_reg_number">NCRIB Reg Number</Label>
                                    <Input
                                        id="ncrib_reg_number"
                                        value={data.ncrib_reg_number}
                                        onChange={(e) => setData({ ...data, ncrib_reg_number: e.target.value })}
                                        placeholder="NCRIB/00123"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="rc_number">CAC RC Number</Label>
                                <Input
                                    id="rc_number"
                                    value={data.rc_number}
                                    onChange={(e) => setData({ ...data, rc_number: e.target.value })}
                                    placeholder="RC123456"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                            <CardDescription>How to reach this company</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData({ ...data, email: e.target.value })}
                                        placeholder="contact@company.com"
                                    />
                                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={data.phone}
                                        onChange={(e) => setData({ ...data, phone: e.target.value })}
                                        placeholder="+234 xxx xxx xxxx"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    id="website"
                                    type="url"
                                    value={data.website}
                                    onChange={(e) => setData({ ...data, website: e.target.value })}
                                    placeholder="https://www.company.com"
                                />
                                {errors.website && <p className="text-sm text-red-500">{errors.website}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Street Address</Label>
                                <Textarea
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData({ ...data, address: e.target.value })}
                                    placeholder="Enter company address"
                                    rows={3}
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        value={data.city}
                                        onChange={(e) => setData({ ...data, city: e.target.value })}
                                        placeholder="Lagos"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="state">State</Label>
                                    <Select value={data.state} onValueChange={(value) => setData({ ...data, state: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select state" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {NIGERIAN_STATES.map((state) => (
                                                <SelectItem key={state} value={state}>
                                                    {state}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="country">Country</Label>
                                    <Input
                                        id="country"
                                        value={data.country}
                                        onChange={(e) => setData({ ...data, country: e.target.value })}
                                        placeholder="Nigeria"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Additional Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData({ ...data, notes: e.target.value })}
                                    placeholder="Any additional notes..."
                                    rows={4}
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <p className="font-medium">Active Status</p>
                                    <p className="text-sm text-muted-foreground">
                                        Inactive companies won't appear in searches
                                    </p>
                                </div>
                                <Switch
                                    checked={data.is_active}
                                    onCheckedChange={(checked) => setData({ ...data, is_active: checked })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(route('admin.insurance-companies.index'))}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : isEditing ? 'Update Company' : 'Create Company'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}