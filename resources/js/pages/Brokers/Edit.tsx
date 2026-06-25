import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Building2, Calendar, Mail, MapPin, Percent, Phone, User } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import CompanySearchCombobox from '@/components/insurance/CompanySearchCombobox';

interface User {
    id: number;
    name: string;
    email: string;
    roles: Array<{
        id: number;
        name: string;
        label: string;
    }>;
}

interface Broker {
    id: number;
    company_name: string;
    contact_email: string;
    contact_phone: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    logo?: string;
    settings: {
        commission_rate?: number;
        payment_terms?: number;
    };
    users: User[];
}

interface BrokerEditProps extends PageProps {
    broker: Broker;
    primaryUser?: User;
}

export default function BrokerEdit({ broker, primaryUser }: BrokerEditProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(broker.logo ? `/storage/${broker.logo}` : null);

    const { data, setData, post, processing, errors } = useForm({
        _method: 'PATCH',
        company_name: broker.company_name,
        contact_email: broker.contact_email,
        contact_phone: broker.contact_phone,
        address: broker.address || '',
        city: broker.city || '',
        state: broker.state || '',
        postal_code: broker.postal_code || '',
        country: broker.country || 'Nigeria',
        commission_rate: broker.settings?.commission_rate || 10,
        payment_terms: broker.settings?.payment_terms || 30,
        primary_contact_name: primaryUser?.name || '',
        primary_contact_email: primaryUser?.email || '',
        password: '',
        password_confirmation: '',
        logo: null as File | null,
        known_company_id: (broker as any).known_company_id || '',
        known_company_source: (broker as any).known_company_source || '',
    });

    const breadcrumbs = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Brokers', href: route('brokers.index') },
        { title: broker.company_name, href: route('brokers.show', broker.id) },
        { title: 'Edit', href: '#' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('brokers.update', broker.id), {
            forceFormData: true,
            onStart: () => {
                toast.loading('Updating broker information...', { id: 'update-broker' });
            },
            onSuccess: () => {
                toast.success(`${broker.company_name} updated successfully!`, {
                    id: 'update-broker',
                    description: 'All broker information has been saved',
                    duration: 4000,
                });
            },
            onError: () => {
                toast.error('Failed to update broker', {
                    id: 'update-broker',
                    description: 'Please check the form errors and try again',
                    duration: 5000,
                });
            },
        });
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('logo', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${broker.company_name}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit {broker.company_name}</h1>
                        <p className="text-muted-foreground">Update broker information and settings</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Company Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Company Information
                            </CardTitle>
                            <CardDescription>Basic information about the broker company</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="mb-6 flex flex-col gap-6 md:flex-row">
                                <div className="flex flex-col items-center gap-4">
                                    <Avatar className="h-24 w-24 border-2 border-muted shadow-sm">
                                        <AvatarImage src={previewUrl || ''} alt={data.company_name} />
                                        <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                                            {data.company_name?.substring(0, 1).toUpperCase() || 'B'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col items-center">
                                        <Label htmlFor="logo" className="cursor-pointer text-sm text-primary hover:underline">
                                            Change Logo
                                        </Label>
                                        <Input id="logo" type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                                        <p className="mt-1 text-[10px] text-muted-foreground">Square image, max 2MB</p>
                                    </div>
                                </div>

                                <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="company_name">Company Name</Label>
                                        <CompanySearchCombobox
                                            companyType="broker"
                                            value={data.company_name}
                                            scope="registry"
                                            onSelect={(company) => {
                                                setData({
                                                    ...data,
                                                    company_name: company.name,
                                                    contact_email: company.email || data.contact_email,
                                                    contact_phone: company.phone || data.contact_phone,
                                                    address: company.address || data.address,
                                                    known_company_id: company.id,
                                                    known_company_source: company.source,
                                                });
                                            }}
                                            placeholder="Search for a broker..."
                                        />
                                        {errors.company_name && <p className="text-xs text-destructive">{errors.company_name}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="contact_phone">Company Phone</Label>
                                        <div className="relative">
                                            <Phone className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                            <Input
                                                id="contact_phone"
                                                value={data.contact_phone}
                                                onChange={(e) => setData('contact_phone', e.target.value)}
                                                placeholder="+234 xxx xxx xxxx"
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                        {errors.contact_phone && <p className="text-xs text-destructive">{errors.contact_phone}</p>}
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="contact_email">Company Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                            <Input
                                                id="contact_email"
                                                type="email"
                                                value={data.contact_email}
                                                onChange={(e) => setData('contact_email', e.target.value)}
                                                placeholder="company@example.com"
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                        {errors.contact_email && <p className="text-xs text-destructive">{errors.contact_email}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <div className="relative">
                                    <MapPin className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                    <Textarea
                                        id="address"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        placeholder="Enter company address"
                                        className="min-h-[80px] pl-10"
                                    />
                                </div>
                                {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input id="city" value={data.city} onChange={(e) => setData('city', e.target.value)} placeholder="Lagos" />
                                    {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="state">State</Label>
                                    <Input
                                        id="state"
                                        value={data.state}
                                        onChange={(e) => setData('state', e.target.value)}
                                        placeholder="Lagos State"
                                    />
                                    {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="postal_code">Postal Code</Label>
                                    <Input
                                        id="postal_code"
                                        value={data.postal_code}
                                        onChange={(e) => setData('postal_code', e.target.value)}
                                        placeholder="100001"
                                    />
                                    {errors.postal_code && <p className="text-xs text-destructive">{errors.postal_code}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Input id="country" value={data.country} onChange={(e) => setData('country', e.target.value)} />
                                {errors.country && <p className="text-xs text-destructive">{errors.country}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Primary Contact */}
                    {primaryUser && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Primary Contact & Login
                                </CardTitle>
                                <CardDescription>Primary contact person who manages this broker account</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="primary_contact_name">Contact Name</Label>
                                        <Input
                                            id="primary_contact_name"
                                            value={data.primary_contact_name}
                                            onChange={(e) => setData('primary_contact_name', e.target.value)}
                                            placeholder="John Doe"
                                            required
                                        />
                                        {errors.primary_contact_name && <p className="text-xs text-destructive">{errors.primary_contact_name}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="primary_contact_email">Contact Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                            <Input
                                                id="primary_contact_email"
                                                type="email"
                                                value={data.primary_contact_email}
                                                onChange={(e) => setData('primary_contact_email', e.target.value)}
                                                placeholder="john@company.com"
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                        {errors.primary_contact_email && <p className="text-xs text-destructive">{errors.primary_contact_email}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="password">New Password (Optional)</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder="Leave blank to keep current password"
                                        />
                                        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password_confirmation">Confirm New Password</Label>
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            placeholder="Confirm new password"
                                        />
                                        {errors.password_confirmation && <p className="text-xs text-destructive">{errors.password_confirmation}</p>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Business Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Percent className="h-5 w-5" />
                                Business Settings
                            </CardTitle>
                            <CardDescription>Commission rates and payment terms for this broker</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                                    <div className="relative">
                                        <Percent className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                        <Input
                                            id="commission_rate"
                                            type="number"
                                            min="0"
                                            max="50"
                                            step="0.1"
                                            value={data.commission_rate}
                                            onChange={(e) => setData('commission_rate', e.target.value)}
                                            placeholder="10.0"
                                            className="pl-10"
                                        />
                                    </div>
                                    {errors.commission_rate && <p className="text-xs text-destructive">{errors.commission_rate}</p>}
                                    <p className="text-xs text-muted-foreground">Default commission rate for this broker</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="payment_terms">Payment Terms (Days)</Label>
                                    <div className="relative">
                                        <Calendar className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                        <Input
                                            id="payment_terms"
                                            type="number"
                                            min="1"
                                            max="365"
                                            value={data.payment_terms}
                                            onChange={(e) => setData('payment_terms', e.target.value)}
                                            placeholder="30"
                                            className="pl-10"
                                        />
                                    </div>
                                    {errors.payment_terms && <p className="text-xs text-destructive">{errors.payment_terms}</p>}
                                    <p className="text-xs text-muted-foreground">Number of days for payment settlement</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Actions */}
                    <div className="flex items-center justify-end gap-4 pb-12">
                        <Link href={route('brokers.show', broker.id)}>
                            <Button variant="outline" type="button">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Updating Broker...' : 'Update Broker'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
