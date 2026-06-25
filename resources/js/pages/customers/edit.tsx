import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerSimple } from '@/components/ui/date-picker-simple';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import { Save } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import CompanySearchCombobox from '@/components/insurance/CompanySearchCombobox';

interface Customer {
    id: number;
    type: 'individual' | 'corporate';
    first_name?: string;
    last_name?: string;
    company_name?: string;
    logo?: string | null;
    email: string;
    phone?: string;
    date_of_birth?: string;
    gender?: string;
    occupation?: string;
    annual_income?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    is_active: boolean;
    known_company_id?: string;
    known_company_source?: string;
}

interface FormData {
    type: 'individual' | 'corporate' | '';
    first_name: string;
    last_name: string;
    company_name: string;
    email: string;
    phone: string;
    date_of_birth: string;
    gender: string;
    occupation: string;
    annual_income: string;
    address: string;
    city: string;
    state: string;
    country: string;
    logo_upload: File | null;
    is_active: boolean;
    known_company_id: string;
    known_company_source: string;
}

interface Props {
    customer: Customer;
}

export default function CustomerEdit({ customer }: Props) {
    const [dateOfBirthObj, setDateOfBirthObj] = useState<Date | undefined>(undefined);

    const { data, setData, post, processing, errors } = useForm<FormData & { _method: string }>({
        _method: 'put',
        type: customer.type,
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        company_name: customer.company_name || '',
        email: customer.email,
        phone: customer.phone || '',
        date_of_birth: customer.date_of_birth || '',
        gender: customer.gender || '',
        occupation: customer.occupation || '',
        annual_income: customer.annual_income || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        country: customer.country || 'Nigeria',
        logo_upload: null,
        is_active: Boolean(customer.is_active),
        known_company_id: customer.known_company_id || '',
        known_company_source: customer.known_company_source || '',
    });

    useEffect(() => {
        if (data.date_of_birth) {
            const parsed = dayjs(data.date_of_birth);
            if (parsed.isValid()) {
                setDateOfBirthObj(parsed.toDate());
            }
        }
    }, [data.date_of_birth]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('customers.update', customer.id), {
            forceFormData: true,
            onSuccess: () => {
                toast.success('Customer updated successfully');
            },
            onError: (errors) => {
                console.log(errors);
                toast.error('Failed to update customer. Please check the form and try again.');
            },
        });
    };

    const getCustomerName = () => {
        return customer.type === 'corporate' ? customer.company_name : `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
    };

    const isIndividual = data.type === 'individual';
    const isCorporate = data.type === 'corporate';

    return (
        <AppLayout>
            <Head title={`Edit ${getCustomerName()} - Customer`} />

            <div className="flex-1 space-y-4 pt-4">
                <div className="flex items-center space-x-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Edit Customer</h2>
                        <p className="text-muted-foreground">Update customer information</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Type</CardTitle>
                            <CardDescription>Customer type cannot be changed after creation</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="type">Customer Type</Label>
                                <Select value={data.type} onValueChange={(value: 'individual' | 'corporate') => setData('type', value)} disabled>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select customer type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="individual">Individual</SelectItem>
                                        <SelectItem value="corporate">Corporate</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.type} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>{isIndividual ? 'Personal details' : 'Company information'}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isIndividual && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="first_name">
                                            First Name <span className="text-destructive">*</span>
                                        </Label>
                                        <Input id="first_name" value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} />
                                        <InputError message={errors.first_name} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="last_name">
                                            Last Name <span className="text-destructive">*</span>
                                        </Label>
                                        <Input id="last_name" value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} />
                                        <InputError message={errors.last_name} />
                                    </div>
                                </div>
                            )}

                            {isCorporate && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="company_name">
                                            Company Name <span className="text-destructive">*</span>
                                        </Label>
                                        <CompanySearchCombobox
                                            companyType="corporate"
                                            value={data.company_name}
                                            scope="registry"
                                            onSelect={(company) => {
                                                setData((prev) => ({
                                                    ...prev,
                                                    company_name: company.name,
                                                    email: company.email || prev.email,
                                                    phone: company.phone || prev.phone,
                                                    address: company.address || prev.address,
                                                    known_company_id: String(company.id),
                                                    known_company_source: company.source,
                                                }));
                                            }}
                                            placeholder="Search or enter company name..."
                                        />
                                        <InputError message={errors.company_name} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="logo_upload">
                                            Company Logo <span className="text-xs text-muted-foreground">(optional)</span>
                                        </Label>
                                        {customer.logo && (
                                            <div className="mb-2">
                                                <img
                                                    src={`/storage/${customer.logo}`}
                                                    alt="Current logo"
                                                    className="h-16 w-16 rounded border object-contain p-1"
                                                />
                                            </div>
                                        )}
                                        <Input
                                            id="logo_upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setData('logo_upload', e.target.files?.[0] || null)}
                                        />
                                        {/* @ts-expect-error - message may be undefined */}
                                        <InputError message={errors.logo_upload} />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">
                                        Email Address <span className="text-xs text-muted-foreground">(optional)</span>
                                    </Label>
                                    <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                                    <InputError message={errors.email} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">
                                        Phone Number <span className="text-xs text-muted-foreground">(optional)</span>
                                    </Label>
                                    <Input id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                                    <InputError message={errors.phone} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {isIndividual && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Personal Details</CardTitle>
                                <CardDescription>Additional information for individual customers</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <DatePickerSimple
                                        id="date_of_birth"
                                        label="Date of Birth"
                                        date={dateOfBirthObj}
                                        onSelect={(date) => {
                                            if (date) {
                                                setDateOfBirthObj(date);
                                                setData('date_of_birth', dayjs(date).format('YYYY-MM-DD'));
                                            }
                                        }}
                                    />
                                    <InputError message={errors.date_of_birth} />
                                    <div className="space-y-2">
                                        <Label htmlFor="gender">
                                            Gender <span className="text-xs text-muted-foreground">(optional)</span>
                                        </Label>
                                        <Select value={data.gender} onValueChange={(value) => setData('gender', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.gender} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="occupation">
                                            Occupation <span className="text-xs text-muted-foreground">(optional)</span>
                                        </Label>
                                        <Input id="occupation" value={data.occupation} onChange={(e) => setData('occupation', e.target.value)} />
                                        <InputError message={errors.occupation} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="annual_income">
                                        Annual Income (₦) <span className="text-xs text-muted-foreground">(optional)</span>
                                    </Label>
                                    <Input
                                        id="annual_income"
                                        type="number"
                                        value={data.annual_income}
                                        onChange={(e) => setData('annual_income', e.target.value)}
                                        placeholder="0"
                                    />
                                    <InputError message={errors.annual_income} />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Address Information</CardTitle>
                            <CardDescription>Contact and location details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="address">
                                    Address <span className="text-xs text-muted-foreground">(optional)</span>
                                </Label>
                                <Textarea id="address" value={data.address} onChange={(e) => setData('address', e.target.value)} rows={3} />
                                <InputError message={errors.address} />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                            <Label htmlFor="city">
                                                City <span className="text-xs text-muted-foreground">(optional)</span>
                                            </Label>
                                    <Input id="city" value={data.city} onChange={(e) => setData('city', e.target.value)} />
                                    <InputError message={errors.city} />
                                </div>
                                <div className="space-y-2">
                                            <Label htmlFor="state">
                                                State <span className="text-xs text-muted-foreground">(optional)</span>
                                            </Label>
                                    <Input id="state" value={data.state} onChange={(e) => setData('state', e.target.value)} />
                                    <InputError message={errors.state} />
                                </div>
                                <div className="space-y-2">
                                            <Label htmlFor="country">
                                                Country <span className="text-xs text-muted-foreground">(optional)</span>
                                            </Label>
                                    <Input id="country" value={data.country} onChange={(e) => setData('country', e.target.value)} />
                                    <InputError message={errors.country} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Settings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-3">
                                <Switch id="is_active" checked={data.is_active} onCheckedChange={(checked) => setData('is_active', checked)} />
                                <Label htmlFor="is_active">{data.is_active ? 'Active' : 'Inactive'}</Label>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end space-x-4">
                        <Link href={route('customers.show', customer.id)}>
                            <Button variant="outline">Cancel</Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Updating...' : 'Update Customer'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
