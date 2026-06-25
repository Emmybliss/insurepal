import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerSimple } from '@/components/ui/date-picker-simple';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import { ArrowLeft, Save } from 'lucide-react';
import React from 'react';
import CompanySearchCombobox from '@/components/insurance/CompanySearchCombobox';

interface Policy {
    id: number;
    policy_number: string;
    status: string;
    effective_date: string;
    expiry_date: string;
    notes?: string;
    internal_notes?: string;
    customer: {
        first_name: string;
        last_name: string;
        company_name?: string;
    };
    policy_product: {
        name: string;
    };
}

interface Props {
    policy: Policy;
}

export default function EditIssued({ policy }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        status: policy.status,
        effective_date: policy.effective_date.split('T')[0],
        expiry_date: policy.expiry_date.split('T')[0],
        notes: policy.notes || '',
        internal_notes: policy.internal_notes || '',
        insurer_id: (policy as any).insurer_id || '',
        insurer_source: (policy as any).insurer_source || '',
        insurer_name: (policy as any).insurer_name || '',
        insurer_address: (policy as any).insurer_address || '',
        insurer_email: (policy as any).insurer_email || '',
        insurer_phone: (policy as any).insurer_phone || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('policy-management.update', policy.id));
    };

    const getCustomerName = () => {
        return policy.customer.company_name || `${policy.customer.first_name} ${policy.customer.last_name}`;
    };

    return (
        <AppLayout>
            <Head title={`Edit Policy: ${policy.policy_number}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href={route('policy-management.show', policy.id)}
                            className="flex items-center text-sm text-muted-foreground hover:text-primary"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Policy
                        </Link>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight">Edit Policy: {policy.policy_number}</h1>
                        <p className="text-muted-foreground">
                            {policy.policy_product.name} for {getCustomerName()}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Policy Status & Dates</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="status">Policy Status</Label>
                                    <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                        <SelectTrigger id="status">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="pending_approval">Pending Approval</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="expired">Expired</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                            <SelectItem value="suspended">Suspended</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="effective_date">Effective Date</Label>
                                    <DatePickerSimple
                                        date={data.effective_date ? new Date(data.effective_date) : undefined}
                                        onSelect={(date) => setData('effective_date', date ? dayjs(date).format('YYYY-MM-DD') : '')}
                                        placeholder="Select effective date"
                                    />
                                    {errors.effective_date && <p className="text-sm text-red-500">{errors.effective_date}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="expiry_date">Expiry Date</Label>
                                    <DatePickerSimple
                                        date={data.expiry_date ? new Date(data.expiry_date) : undefined}
                                        onSelect={(date) => setData('expiry_date', date ? dayjs(date).format('YYYY-MM-DD') : '')}
                                        placeholder="Select expiry date"
                                    />
                                    {errors.expiry_date && <p className="text-sm text-red-500">{errors.expiry_date}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="insurer">Insurer (Underwriter)</Label>
                                    <CompanySearchCombobox
                                        companyType="underwriter"
                                        value={data.insurer_name}
                                        scope="tenant"
                                        onSelect={(company) => {
                                            setData((prev) => ({
                                                ...prev,
                                                insurer_name: company.name,
                                                insurer_address: company.address || '',
                                                insurer_email: company.email || '',
                                                insurer_phone: company.phone || '',
                                                insurer_id: String(company.company_id || company.id),
                                                insurer_source: company.source,
                                            }));
                                        }}
                                        placeholder="Search for an insurance company..."
                                    />
                                    {errors.insurer_id && <p className="text-sm text-red-600">{errors.insurer_id}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="notes">Policy Notes (Visible to Customer)</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Enter policy notes..."
                                    value={data.notes}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('notes', e.target.value)}
                                    rows={4}
                                />
                                {errors.notes && <p className="text-sm text-red-500">{errors.notes}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="internal_notes">Internal Notes (Staff Only)</Label>
                                <Textarea
                                    id="internal_notes"
                                    placeholder="Enter internal staff notes..."
                                    value={data.internal_notes}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('internal_notes', e.target.value)}
                                    rows={4}
                                />
                                {errors.internal_notes && <p className="text-sm text-red-500">{errors.internal_notes}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Link href={route('policy-management.show', policy.id)}>
                            <Button variant="outline" type="button">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
