import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerSimple } from '@/components/ui/date-picker-simple';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import { AlertCircle, ArrowLeft, Calendar, DollarSign, FileText, RefreshCw, Save, User } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

interface Customer {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    type: string;
    company_name?: string;
}

interface PolicyClass {
    id: number;
    name: string;
}

interface Quote {
    id: number;
    quote_number: string;
}

interface Policy {
    id: number;
    policy_number: string;
    status: string;
    effective_date: string;
    expiry_date: string;
    premium_amount: number;
    commission_amount: number;
    total_amount: number;
    payment_frequency: string;
    notes?: string;
    renewed_at?: string;
    customer: Customer;
    policy_class?: PolicyClass;
    quote?: Quote;
}

interface Props extends PageProps {
    policy: Policy;
}

export default function EditRenewal({ policy }: Props) {
    const getCustomerDisplayName = () => {
        if (policy?.customer?.type === 'individual') {
            return `${policy.customer.first_name || ''} ${policy.customer.last_name || ''}`.trim();
        }
        return policy?.customer?.company_name || 'Unknown Customer';
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

    // Calculate default next expiry date (1 year after current expiry date)
    const getInitialNextExpiryDate = () => {
        if (!policy.expiry_date) return '';
        const date = new Date(policy.expiry_date);
        date.setFullYear(date.getFullYear() + 1);
        return date.toISOString().split('T')[0];
    };

    // Form for updating renewal details (PUT renewals.update)
    const updateForm = useForm({
        expiry_date: policy.expiry_date ? new Date(policy.expiry_date).toISOString().split('T')[0] : '',
        premium_amount: policy.premium_amount ?? 0,
        notes: policy.notes || '',
    });

    // Form for processing renewal (POST renewals.process)
    const processForm = useForm({
        new_expiry_date: getInitialNextExpiryDate(),
        new_premium: policy.premium_amount ?? 0,
        renewal_notes: '',
    });

    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateForm.put(route('renewals.update', policy.id), {
            onSuccess: () => {
                toast.success('Renewal details updated successfully');
            },
            onError: () => {
                toast.error('Failed to update renewal details. Please check the inputs.');
            },
        });
    };

    const handleProcessSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        processForm.post(route('renewals.process', policy.id), {
            onSuccess: () => {
                toast.success('Policy renewed successfully');
            },
            onError: () => {
                toast.error('Failed to process policy renewal. Please check the inputs.');
            },
        });
    };

    return (
        <AppLayout>
            <Head title={`Edit Renewal - ${policy.policy_number}`} />

            <div className="space-y-6 p-6">
                {/* Navigation & Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Link href={route('renewals.show', policy.id)} className="flex items-center text-gray-500 hover:text-gray-700">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit Policy Renewal</h1>
                            <p className="text-sm text-muted-foreground">
                                {policy.policy_number} • {getCustomerDisplayName()}
                            </p>
                        </div>
                    </div>
                    <Badge variant={policy.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                        {policy.status}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left Column: Form Tabs */}
                    <div className="space-y-6 lg:col-span-2">
                        <Tabs defaultValue="process" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="process" className="flex items-center gap-2">
                                    <RefreshCw className="h-4 w-4" />
                                    Process Renewal
                                </TabsTrigger>
                                <TabsTrigger value="update" className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    Update Details
                                </TabsTrigger>
                            </TabsList>

                            {/* Tab 1: Process Renewal */}
                            <TabsContent value="process" className="mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <RefreshCw className="h-5 w-5 text-primary" />
                                            Process Policy Renewal
                                        </CardTitle>
                                        <CardDescription>
                                            Extend the policy period and record the renewed premium. This will mark the policy as renewed.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleProcessSubmit} className="space-y-5">
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="new_expiry_date">New Expiry Date *</Label>
                                                    <DatePickerSimple
                                                        id="new_expiry_date"
                                                        date={processForm.data.new_expiry_date ? new Date(processForm.data.new_expiry_date) : undefined}
                                                        onSelect={(date) => processForm.setData('new_expiry_date', date ? dayjs(date).format('YYYY-MM-DD') : '')}
                                                        placeholder="Select new expiry date"
                                                        className={processForm.errors.new_expiry_date ? 'border-red-500' : ''}
                                                    />
                                                    {processForm.errors.new_expiry_date && (
                                                        <p className="text-xs text-red-600">{processForm.errors.new_expiry_date}</p>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="new_premium">Renewed Premium (₦) *</Label>
                                                    <Input
                                                        id="new_premium"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={processForm.data.new_premium}
                                                        onChange={(e) => processForm.setData('new_premium', parseFloat(e.target.value) || 0)}
                                                        className={processForm.errors.new_premium ? 'border-red-500' : ''}
                                                    />
                                                    {processForm.errors.new_premium && (
                                                        <p className="text-xs text-red-600">{processForm.errors.new_premium}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="renewal_notes">Renewal Notes</Label>
                                                <Textarea
                                                    id="renewal_notes"
                                                    rows={3}
                                                    placeholder="Add optional notes about terms, endorsements, or discounts for this renewal..."
                                                    value={processForm.data.renewal_notes}
                                                    onChange={(e) => processForm.setData('renewal_notes', e.target.value)}
                                                />
                                                {processForm.errors.renewal_notes && (
                                                    <p className="text-xs text-red-600">{processForm.errors.renewal_notes}</p>
                                                )}
                                            </div>

                                            {policy.renewed_at && (
                                                <Alert className="bg-amber-50 text-amber-900 border-amber-200">
                                                    <AlertCircle className="h-4 w-4 text-amber-600" />
                                                    <AlertTitle>Policy Previously Renewed</AlertTitle>
                                                    <AlertDescription className="text-xs">
                                                        This policy was last renewed on {formatDate(policy.renewed_at)}. Submitting again will update the renewal record and extend expiry.
                                                    </AlertDescription>
                                                </Alert>
                                            )}

                                            <div className="flex justify-end gap-3 pt-2">
                                                <Link href={route('renewals.show', policy.id)}>
                                                    <Button type="button" variant="outline">
                                                        Cancel
                                                    </Button>
                                                </Link>
                                                <Button type="submit" disabled={processForm.processing} className="flex items-center gap-2">
                                                    <RefreshCw className={`h-4 w-4 ${processForm.processing ? 'animate-spin' : ''}`} />
                                                    {processForm.processing ? 'Processing...' : 'Complete Policy Renewal'}
                                                </Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Tab 2: Update Details */}
                            <TabsContent value="update" className="mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Save className="h-5 w-5 text-primary" />
                                            Update Renewal Schedule & Details
                                        </CardTitle>
                                        <CardDescription>
                                            Modify the policy expiration date, premium, or internal notes without completing a full renewal cycle.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleUpdateSubmit} className="space-y-5">
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="expiry_date">Current Expiry Date *</Label>
                                                    <DatePickerSimple
                                                        id="expiry_date"
                                                        date={updateForm.data.expiry_date ? new Date(updateForm.data.expiry_date) : undefined}
                                                        onSelect={(date) => updateForm.setData('expiry_date', date ? dayjs(date).format('YYYY-MM-DD') : '')}
                                                        placeholder="Select expiry date"
                                                        className={updateForm.errors.expiry_date ? 'border-red-500' : ''}
                                                    />
                                                    {updateForm.errors.expiry_date && (
                                                        <p className="text-xs text-red-600">{updateForm.errors.expiry_date}</p>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="premium_amount">Premium Amount (₦) *</Label>
                                                    <Input
                                                        id="premium_amount"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={updateForm.data.premium_amount}
                                                        onChange={(e) => updateForm.setData('premium_amount', parseFloat(e.target.value) || 0)}
                                                        className={updateForm.errors.premium_amount ? 'border-red-500' : ''}
                                                    />
                                                    {updateForm.errors.premium_amount && (
                                                        <p className="text-xs text-red-600">{updateForm.errors.premium_amount}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="notes">Policy Notes</Label>
                                                <Textarea
                                                    id="notes"
                                                    rows={3}
                                                    placeholder="Internal notes or updates regarding policy renewal..."
                                                    value={updateForm.data.notes}
                                                    onChange={(e) => updateForm.setData('notes', e.target.value)}
                                                />
                                                {updateForm.errors.notes && <p className="text-xs text-red-600">{updateForm.errors.notes}</p>}
                                            </div>

                                            <div className="flex justify-end gap-3 pt-2">
                                                <Link href={route('renewals.show', policy.id)}>
                                                    <Button type="button" variant="outline">
                                                        Cancel
                                                    </Button>
                                                </Link>
                                                <Button type="submit" disabled={updateForm.processing} className="flex items-center gap-2">
                                                    <Save className="h-4 w-4" />
                                                    {updateForm.processing ? 'Saving...' : 'Save Renewal Details'}
                                                </Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Right Column: Policy Context Card */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    Policy Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground">Policy Number</span>
                                    <p className="font-mono font-semibold">{policy.policy_number}</p>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground">Policy Class</span>
                                    <p className="font-medium">{policy.policy_class?.name || 'General Policy'}</p>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                        <User className="h-3.5 w-3.5" /> Customer
                                    </span>
                                    <p className="font-medium">{getCustomerDisplayName()}</p>
                                    <p className="text-xs text-muted-foreground">{policy.customer?.email}</p>
                                </div>

                                <div className="border-t pt-3 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5" /> Effective Date
                                        </span>
                                        <span className="text-xs font-medium">{formatDate(policy.effective_date)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5" /> Expiry Date
                                        </span>
                                        <span className="text-xs font-semibold text-amber-600">{formatDate(policy.expiry_date)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <DollarSign className="h-3.5 w-3.5" /> Premium Amount
                                        </span>
                                        <span className="text-xs font-bold text-foreground">{formatCurrency(policy.premium_amount)}</span>
                                    </div>
                                </div>

                                {policy.renewed_at && (
                                    <div className="rounded-md bg-green-50 p-3 dark:bg-green-950/30 text-green-800 dark:text-green-300 text-xs space-y-1">
                                        <p className="font-semibold flex items-center gap-1">
                                            <RefreshCw className="h-3.5 w-3.5" /> Last Renewed
                                        </p>
                                        <p>{formatDate(policy.renewed_at)}</p>
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
