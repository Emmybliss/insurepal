import InputError from '@/components/input-error';
import CompanySearchCombobox from '@/components/insurance/CompanySearchCombobox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerSimple } from '@/components/ui/date-picker-simple';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Customer } from '@/types';
import dayjs from 'dayjs';
import { Loader2, Save } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

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

interface CustomerCreateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCustomerCreated: (customer: Customer) => void;
}

function getCsrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

export default function CustomerCreateModal({ open, onOpenChange, onCustomerCreated }: CustomerCreateModalProps) {
    const [dateOfBirthObj, setDateOfBirthObj] = useState<Date | undefined>(undefined);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [data, setData] = useState<FormData>({
        type: '',
        first_name: '',
        last_name: '',
        company_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        gender: '',
        occupation: '',
        annual_income: '',
        address: '',
        city: '',
        state: '',
        country: 'Nigeria',
        logo_upload: null,
        is_active: true,
        known_company_id: '',
        known_company_source: '',
    });

    useEffect(() => {
        if (data.date_of_birth) {
            const parsed = dayjs(data.date_of_birth);
            if (parsed.isValid()) {
                setDateOfBirthObj(parsed.toDate());
            }
        }
    }, [data.date_of_birth]);

    const resetForm = () => {
        setData({
            type: '',
            first_name: '',
            last_name: '',
            company_name: '',
            email: '',
            phone: '',
            date_of_birth: '',
            gender: '',
            occupation: '',
            annual_income: '',
            address: '',
            city: '',
            state: '',
            country: 'Nigeria',
            logo_upload: null,
            is_active: true,
            known_company_id: '',
            known_company_source: '',
        });
        setDateOfBirthObj(undefined);
        setErrors({});
    };

    const handleClose = () => {
        resetForm();
        onOpenChange(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!data.type) {
            setErrors({ type: 'Please select customer type.' });
            return;
        }

        setProcessing(true);
        setErrors({});

        try {
            const formData = new FormData();
            formData.append('type', data.type);
            if (data.type === 'individual') {
                formData.append('first_name', data.first_name);
                formData.append('last_name', data.last_name);
            }
            if (data.type === 'corporate') {
                formData.append('company_name', data.company_name);
            }
            formData.append('email', data.email);
            formData.append('phone', data.phone);
            formData.append('date_of_birth', data.date_of_birth);
            formData.append('gender', data.gender);
            formData.append('occupation', data.occupation);
            formData.append('annual_income', data.annual_income);
            formData.append('address', data.address);
            formData.append('city', data.city);
            formData.append('state', data.state);
            formData.append('country', data.country);
            formData.append('is_active', data.is_active ? '1' : '0');
            formData.append('known_company_id', data.known_company_id);
            formData.append('known_company_source', data.known_company_source);
            if (data.logo_upload) {
                formData.append('logo_upload', data.logo_upload);
            }

            const response = await fetch(route('customers.store').toString(), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Quick-Create': 'true',
                    'Accept': 'application/json',
                },
                body: formData,
            });

            if (!response.ok) {
                if (response.status === 422) {
                    const json = await response.json();
                    setErrors(json.errors || {});
                } else {
                    const text = await response.text();
                    console.error('Unexpected response:', text.slice(0, 200));
                    toast.error('An unexpected error occurred.');
                }
                return;
            }

            const customer: Customer = await response.json();
            onCustomerCreated(customer);
            toast.success('Customer created successfully');
            handleClose();
        } catch (err) {
            console.error('Customer creation error:', err);
            toast.error('Failed to create customer. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const isIndividual = data.type === 'individual';
    const isCorporate = data.type === 'corporate';

    const setFormValue = <K extends keyof FormData>(field: K, value: FormData[K]) => {
        setData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); else onOpenChange(true); }}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Customer</DialogTitle>
                    <DialogDescription>Create a new individual or corporate customer</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Type</CardTitle>
                            <CardDescription>Select whether this is an individual or corporate customer</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="modal-type">Customer Type</Label>
                                <Select
                                    value={data.type}
                                    onValueChange={(value: 'individual' | 'corporate') => setFormValue('type', value)}
                                >
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

                    {data.type && (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Basic Information</CardTitle>
                                    <CardDescription>{isIndividual ? 'Personal details' : 'Company information'}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {isIndividual && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="modal-first_name">First Name</Label>
                                                <Input
                                                    id="modal-first_name"
                                                    value={data.first_name}
                                                    onChange={(e) => setFormValue('first_name', e.target.value)}
                                                />
                                                <InputError message={errors.first_name} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="modal-last_name">Last Name</Label>
                                                <Input
                                                    id="modal-last_name"
                                                    value={data.last_name}
                                                    onChange={(e) => setFormValue('last_name', e.target.value)}
                                                />
                                                <InputError message={errors.last_name} />
                                            </div>
                                        </div>
                                    )}

                                    {isCorporate && (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="modal-company_name">Company Name</Label>
                                                <CompanySearchCombobox
                                                    companyType={'corporate' as 'underwriter'}
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
                                                <Label htmlFor="modal-logo_upload">Company Logo</Label>
                                                <Input
                                                    id="modal-logo_upload"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => setFormValue('logo_upload', e.target.files?.[0] || null)}
                                                />
                                                <InputError message={errors.logo_upload} />
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="modal-email">Email Address</Label>
                                            <Input
                                                id="modal-email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setFormValue('email', e.target.value)}
                                            />
                                            <InputError message={errors.email} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="modal-phone">Phone Number</Label>
                                            <Input
                                                id="modal-phone"
                                                value={data.phone}
                                                onChange={(e) => setFormValue('phone', e.target.value)}
                                            />
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
                                                id="modal-date_of_birth"
                                                label="Date of Birth"
                                                date={dateOfBirthObj}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        setDateOfBirthObj(date);
                                                        setFormValue('date_of_birth', dayjs(date).format('YYYY-MM-DD'));
                                                    }
                                                }}
                                            />
                                            <InputError message={errors.date_of_birth} />
                                            <div className="space-y-2">
                                                <Label htmlFor="modal-gender">Gender</Label>
                                                <Select value={data.gender} onValueChange={(value) => setFormValue('gender', value)}>
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
                                                <Label htmlFor="modal-occupation">Occupation</Label>
                                                <Input
                                                    id="modal-occupation"
                                                    value={data.occupation}
                                                    onChange={(e) => setFormValue('occupation', e.target.value)}
                                                />
                                                <InputError message={errors.occupation} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="modal-annual_income">Annual Income (₦)</Label>
                                            <Input
                                                id="modal-annual_income"
                                                type="number"
                                                value={data.annual_income}
                                                onChange={(e) => setFormValue('annual_income', e.target.value)}
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
                                        <Label htmlFor="modal-address">Address</Label>
                                        <Textarea
                                            id="modal-address"
                                            value={data.address}
                                            onChange={(e) => setFormValue('address', e.target.value)}
                                            rows={3}
                                        />
                                        <InputError message={errors.address} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="modal-city">City</Label>
                                            <Input id="modal-city" value={data.city} onChange={(e) => setFormValue('city', e.target.value)} />
                                            <InputError message={errors.city} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="modal-state">State</Label>
                                            <Input id="modal-state" value={data.state} onChange={(e) => setFormValue('state', e.target.value)} />
                                            <InputError message={errors.state} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="modal-country">Country</Label>
                                            <Input
                                                id="modal-country"
                                                value={data.country}
                                                onChange={(e) => setFormValue('country', e.target.value)}
                                            />
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
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="modal-is_active"
                                            checked={data.is_active}
                                            onCheckedChange={(checked) => setFormValue('is_active', !!checked)}
                                        />
                                        <Label htmlFor="modal-is_active">Active Customer</Label>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex items-center justify-end space-x-4">
                                <Button type="button" variant="outline" onClick={handleClose} disabled={processing}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Create Customer
                                        </>
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                </form>
            </DialogContent>
        </Dialog>
    );
}
