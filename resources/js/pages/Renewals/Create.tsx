import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerSimple } from '@/components/ui/date-picker-simple';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import { ArrowLeft, Calendar, DollarSign, FileText, RefreshCw, User } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface Customer {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    company_name?: string;
    type: string;
}

interface PolicyClass {
    id: number;
    name: string;
}

interface Policy {
    id: number;
    policy_number: string;
    status: string;
    expiry_date: string;
    premium_amount: number;
    renewed_at?: string;
    customer: Customer;
    policy_class?: PolicyClass;
}

interface Props extends PageProps {
    policies: Policy[];
}

export default function CreateRenewal({ policies }: Props) {
    const [selectedPolicyId, setSelectedPolicyId] = useState<string>('');

    const selectedPolicy = policies.find((p) => p.id.toString() === selectedPolicyId);

    const getCustomerDisplayName = (customer?: Customer) => {
        if (!customer) return '';
        if (customer.type === 'individual') {
            return `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
        }
        return customer.company_name || 'Unknown Customer';
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatCurrency = (amount?: number) => {
        if (amount === undefined || amount === null) return '₦0.00';
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    const form = useForm({
        policy_id: '',
        new_expiry_date: '',
        new_premium: 0,
        renewal_notes: '',
    });

    const handlePolicySelect = (policyId: string) => {
        setSelectedPolicyId(policyId);
        form.setData('policy_id', policyId);

        const pol = policies.find((p) => p.id.toString() === policyId);
        if (pol) {
            const nextExp = new Date(pol.expiry_date);
            nextExp.setFullYear(nextExp.getFullYear() + 1);

            form.setData((prev) => ({
                ...prev,
                policy_id: policyId,
                new_expiry_date: nextExp.toISOString().split('T')[0],
                new_premium: pol.premium_amount ?? 0,
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPolicyId) {
            toast.error('Please select a policy to renew');
            return;
        }

        form.post(route('renewals.process', selectedPolicyId), {
            onSuccess: () => {
                toast.success('Policy renewed successfully');
            },
            onError: () => {
                toast.error('Failed to process policy renewal');
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Process Policy Renewal" />

            <div className="space-y-6 p-6">
                {/* Navigation & Header */}
                <div className="flex items-center space-x-3">
                    <Link href={route('renewals.index')} className="flex items-center text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Process Policy Renewal</h1>
                        <p className="text-sm text-muted-foreground">Select an active or expiring policy to process its renewal</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Form Column */}
                    <div className="space-y-6 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <RefreshCw className="h-5 w-5 text-primary" />
                                    Renewal Details
                                </CardTitle>
                                <CardDescription>
                                    Select a policy and specify the new coverage period and premium amount.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Policy Selector */}
                                    <div className="space-y-2">
                                        <Label htmlFor="policy_select">Select Policy to Renew *</Label>
                                        <Select value={selectedPolicyId} onValueChange={handlePolicySelect}>
                                            <SelectTrigger className={form.errors.policy_id ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Choose a policy..." />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-72">
                                                {policies.map((p) => (
                                                    <SelectItem key={p.id} value={p.id.toString()}>
                                                        {p.policy_number} — {getCustomerDisplayName(p.customer)} (Expires: {new Date(p.expiry_date).toLocaleDateString()})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {form.errors.policy_id && <p className="text-xs text-red-600">{form.errors.policy_id}</p>}
                                    </div>

                                    {selectedPolicy && (
                                        <>
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="new_expiry_date">New Expiry Date *</Label>
                                                    <DatePickerSimple
                                                        id="new_expiry_date"
                                                        date={form.data.new_expiry_date ? new Date(form.data.new_expiry_date) : undefined}
                                                        onSelect={(date) => form.setData('new_expiry_date', date ? dayjs(date).format('YYYY-MM-DD') : '')}
                                                        placeholder="Select new expiry date"
                                                        className={form.errors.new_expiry_date ? 'border-red-500' : ''}
                                                    />
                                                    {form.errors.new_expiry_date && (
                                                        <p className="text-xs text-red-600">{form.errors.new_expiry_date}</p>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="new_premium">Renewed Premium (₦) *</Label>
                                                    <Input
                                                        id="new_premium"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={form.data.new_premium}
                                                        onChange={(e) => form.setData('new_premium', parseFloat(e.target.value) || 0)}
                                                        className={form.errors.new_premium ? 'border-red-500' : ''}
                                                    />
                                                    {form.errors.new_premium && (
                                                        <p className="text-xs text-red-600">{form.errors.new_premium}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="renewal_notes">Renewal Notes</Label>
                                                <Textarea
                                                    id="renewal_notes"
                                                    rows={3}
                                                    placeholder="Add optional renewal notes or terms..."
                                                    value={form.data.renewal_notes}
                                                    onChange={(e) => form.setData('renewal_notes', e.target.value)}
                                                />
                                                {form.errors.renewal_notes && (
                                                    <p className="text-xs text-red-600">{form.errors.renewal_notes}</p>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    <div className="flex justify-end gap-3 pt-2">
                                        <Link href={route('renewals.index')}>
                                            <Button type="button" variant="outline">
                                                Cancel
                                            </Button>
                                        </Link>
                                        <Button type="submit" disabled={form.processing || !selectedPolicyId} className="flex items-center gap-2">
                                            <RefreshCw className={`h-4 w-4 ${form.processing ? 'animate-spin' : ''}`} />
                                            {form.processing ? 'Processing...' : 'Process Renewal'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Summary Column */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    Selected Policy Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                {selectedPolicy ? (
                                    <>
                                        <div className="space-y-1">
                                            <span className="text-xs font-medium text-muted-foreground">Policy Number</span>
                                            <p className="font-mono font-semibold">{selectedPolicy.policy_number}</p>
                                        </div>

                                        <div className="space-y-1">
                                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                                <User className="h-3.5 w-3.5" /> Customer
                                            </span>
                                            <p className="font-medium">{getCustomerDisplayName(selectedPolicy.customer)}</p>
                                            <p className="text-xs text-muted-foreground">{selectedPolicy.customer?.email}</p>
                                        </div>

                                        <div className="border-t pt-3 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="h-3.5 w-3.5" /> Current Expiry
                                                </span>
                                                <span className="text-xs font-semibold text-amber-600">
                                                    {formatDate(selectedPolicy.expiry_date)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <DollarSign className="h-3.5 w-3.5" /> Current Premium
                                                </span>
                                                <span className="text-xs font-bold text-foreground">
                                                    {formatCurrency(selectedPolicy.premium_amount)}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="py-8 text-center text-muted-foreground">
                                        <RefreshCw className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                                        <p className="text-xs">Select a policy from the dropdown to view its current details.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
