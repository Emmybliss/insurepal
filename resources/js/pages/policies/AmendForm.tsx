import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerSimple } from '@/components/ui/date-picker-simple';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import { FileEdit } from 'lucide-react';
import { useState } from 'react';

interface Policy {
    id: number;
    policy_number: string;
    status: string;
    effective_date: string;
    expiry_date: string;
    premium_amount: number;
    total_amount: number;
    payment_frequency: string;
    coverage_details: Record<string, any>;
    notes?: string;
    customer: {
        first_name: string;
        last_name: string;
        company_name?: string;
        type: string;
    };
    policy_product: {
        name: string;
    };
}

interface Props {
    policy: Policy;
}

interface AmendmentData {
    amendment_type: string;
    amendment_reason: string;
    effective_date: string;
    customer_notes: string;
    coverage_details: Record<string, any>;
    new_premium_amount: string;
    new_expiry_date: string;
    payment_frequency: string;
    notes: string;
}

const amendmentTypes = [
    { value: 'coverage_change', label: 'Coverage Change' },
    { value: 'premium_adjustment', label: 'Premium Adjustment' },
    { value: 'policy_details_update', label: 'Policy Details Update' },
    { value: 'term_extension', label: 'Term Extension' },
    { value: 'endorsement', label: 'Endorsement' },
    { value: 'correction', label: 'Correction' },
];

export default function AmendForm({ policy }: Props) {
    const [selectedType, setSelectedType] = useState('');

    const initialData = {
        amendment_type: '',
        amendment_reason: '',
        effective_date: '',
        customer_notes: '',
        coverage_details: policy.coverage_details || {},
        new_premium_amount: policy.premium_amount.toString(),
        new_expiry_date: policy.expiry_date,
        payment_frequency: policy.payment_frequency,
        notes: policy.notes || '',
    } satisfies AmendmentData;

    const { data, setData, post, processing, errors } = useForm<AmendmentData>(initialData);

    const getCustomerDisplayName = () => {
        if (policy.customer.type === 'corporate') {
            return policy.customer.company_name || `${policy.customer.first_name} ${policy.customer.last_name}`;
        }
        return `${policy.customer.first_name} ${policy.customer.last_name}`;
    };

    const formatCurrency = (amount: number) => {
        return `₦${amount?.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString)?.toLocaleDateString('en-NG');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('policy-management.amend.store', policy.id));
    };

    const handleTypeChange = (value: string) => {
        setSelectedType(value);
        setData('amendment_type', value);
    };

    const renderTypeSpecificFields = () => {
        switch (selectedType) {
            case 'coverage_change':
                return (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="sum_assured">Sum Assured</Label>
                            <Input
                                id="sum_assured"
                                type="number"
                                value={data.coverage_details.sum_assured || ''}
                                onChange={(e) =>
                                    setData('coverage_details', {
                                        ...data.coverage_details,
                                        sum_assured: e.target.value,
                                    } as AmendmentData['coverage_details'])
                                }
                                placeholder="Enter new sum assured amount"
                            />
                        </div>
                        <div>
                            <Label htmlFor="coverage_type">Coverage Type</Label>
                            <Select
                                value={data.coverage_details.coverage_type || ''}
                                onValueChange={(value) =>
                                    setData('coverage_details', {
                                        ...data.coverage_details,
                                        coverage_type: value,
                                    } as AmendmentData['coverage_details'])
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select coverage type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="third_party">Third Party</SelectItem>
                                    <SelectItem value="comprehensive">Comprehensive</SelectItem>
                                    <SelectItem value="fire_theft">Fire & Theft</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                );

            case 'premium_adjustment':
                return (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="current_premium">Current Premium</Label>
                            <div className="rounded border bg-gray-50 p-2">{formatCurrency(policy.premium_amount)}</div>
                        </div>
                        <div>
                            <Label htmlFor="new_premium_amount">New Premium Amount</Label>
                            <Input
                                id="new_premium_amount"
                                type="number"
                                step="0.01"
                                value={data.new_premium_amount}
                                onChange={(e) => setData('new_premium_amount', e.target.value)}
                                placeholder="Enter new premium amount"
                            />
                            {errors.new_premium_amount && <p className="mt-1 text-sm text-red-600">{errors.new_premium_amount}</p>}
                        </div>
                        <div className="rounded bg-blue-50 p-3">
                            <p className="text-sm text-blue-800">
                                <strong>Premium Adjustment:</strong>{' '}
                                {data.new_premium_amount ? formatCurrency(parseFloat(data.new_premium_amount) - policy.premium_amount) : '₦0.00'}
                            </p>
                        </div>
                    </div>
                );

            case 'term_extension':
                return (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="current_expiry">Current Expiry Date</Label>
                            <div className="rounded border bg-gray-50 p-2">{formatDate(policy.expiry_date)}</div>
                        </div>
                        <div>
                            <Label htmlFor="new_expiry_date">New Expiry Date</Label>
                            <DatePickerSimple
                                date={data.new_expiry_date ? new Date(data.new_expiry_date) : undefined}
                                onSelect={(date) => setData('new_expiry_date', date ? dayjs(date).format('YYYY-MM-DD') : '')}
                                placeholder="Select new expiry date"
                            />
                            {errors.new_expiry_date && <p className="mt-1 text-sm text-red-600">{errors.new_expiry_date}</p>}
                        </div>
                    </div>
                );

            case 'policy_details_update':
                return (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="payment_frequency">Payment Frequency</Label>
                            <Select value={data.payment_frequency} onValueChange={(value) => setData('payment_frequency', value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                    <SelectItem value="semi_annual">Semi Annual</SelectItem>
                                    <SelectItem value="annual">Annual</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="notes">Policy Notes</Label>
                            <Textarea
                                id="notes"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Update policy notes..."
                                rows={4}
                            />
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <AppLayout>
            <Head title={`Amend Policy: ${policy.policy_number}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Amend Policy</h1>
                        <p className="text-gray-600">
                            Policy: <span className="font-medium">{policy.policy_number}</span> - {getCustomerDisplayName()}
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Policy Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileEdit className="h-5 w-5" />
                                Policy Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <Label className="text-sm font-medium text-gray-600">Product</Label>
                                <p className="font-medium">{policy.policy_product.name}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-600">Customer</Label>
                                <p className="font-medium">{getCustomerDisplayName()}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-600">Status</Label>
                                <Badge variant="outline" className="mt-1">
                                    {policy.status.toUpperCase()}
                                </Badge>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-600">Current Premium</Label>
                                <p className="font-medium text-green-600">{formatCurrency(policy.premium_amount)}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-600">Effective Period</Label>
                                <p className="text-sm">
                                    {formatDate(policy.effective_date)} - {formatDate(policy.expiry_date)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Amendment Form */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Amendment Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Amendment Type */}
                                    <div>
                                        <Label htmlFor="amendment_type">Amendment Type</Label>
                                        <Select value={data.amendment_type} onValueChange={handleTypeChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select amendment type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {amendmentTypes.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.amendment_type && <p className="mt-1 text-sm text-red-600">{errors.amendment_type}</p>}
                                    </div>

                                    {/* Amendment Reason */}
                                    <div>
                                        <Label htmlFor="amendment_reason">Amendment Reason</Label>
                                        <Textarea
                                            id="amendment_reason"
                                            value={data.amendment_reason}
                                            onChange={(e) => setData('amendment_reason', e.target.value)}
                                            placeholder="Explain the reason for this amendment..."
                                            rows={3}
                                            required
                                        />
                                        {errors.amendment_reason && <p className="mt-1 text-sm text-red-600">{errors.amendment_reason}</p>}
                                    </div>

                                    {/* Effective Date */}
                                    <div>
                                        <Label htmlFor="effective_date">Effective Date</Label>
                                        <DatePickerSimple
                                            date={data.effective_date ? new Date(data.effective_date) : undefined}
                                            onSelect={(date) => setData('effective_date', date ? dayjs(date).format('YYYY-MM-DD') : '')}
                                            placeholder="Select effective date"
                                        />
                                        {errors.effective_date && <p className="mt-1 text-sm text-red-600">{errors.effective_date}</p>}
                                    </div>

                                    {/* Type-specific fields */}
                                    {selectedType && (
                                        <div className="rounded-lg bg-gray-50 p-4">
                                            <h4 className="mb-4 font-medium">Amendment Details</h4>
                                            {renderTypeSpecificFields()}
                                        </div>
                                    )}

                                    {/* Customer Notes */}
                                    <div>
                                        <Label htmlFor="customer_notes">Notes for Customer (Optional)</Label>
                                        <Textarea
                                            id="customer_notes"
                                            value={data.customer_notes}
                                            onChange={(e) => setData('customer_notes', e.target.value)}
                                            placeholder="Additional notes that will be visible to the customer..."
                                            rows={2}
                                        />
                                        {errors.customer_notes && <p className="mt-1 text-sm text-red-600">{errors.customer_notes}</p>}
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex gap-3 pt-4">
                                        <Button type="submit" disabled={processing || !data.amendment_type} className="flex items-center gap-2">
                                            <FileEdit className="h-4 w-4" />
                                            {processing ? 'Creating Amendment...' : 'Create Amendment'}
                                        </Button>
                                        <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
