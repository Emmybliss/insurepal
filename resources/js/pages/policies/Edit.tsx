import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Calculator } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PolicyType {
    id: number;
    name: string;
    code: string;
}
interface PolicyClass {
    id: number;
    name: string;
    code: string;
    policy_type_id: number;
    calculated_premium?: number;
}

interface Policy {
    id: number;
    tenant_id: number | null;
    policy_type_id: number;
    policy_class_id: number;
    name: string;
    code: string;
    description: string | null;
    is_active: boolean;
    base_premium: number;
    commission_rate: number;
    default_coverage_period: number;
    min_sum_assured: number;
    max_sum_assured: number | null;
    requires_underwriting: boolean;
    requires_medical_exam: boolean;
    currency: string;
    sort_order: number;
    policy_type: PolicyType;
    policy_class: PolicyClass;
}

interface Props {
    policy: Policy;
    policyTypes: PolicyType[];
    policyClasses: PolicyClass[];
}

export default function Edit({ policy, policyTypes, policyClasses }: Props) {
    const { data, setData, put, processing, errors } = useForm<{
        policy_type_id: number | null;
        policy_class_id: number | null;
        name: string;
        code: string;
        description: string;
        is_active: boolean;
        base_premium: number | null;
        commission_rate: number | null;
        default_coverage_period: number;
        min_sum_assured: number;
        max_sum_assured: number | null;
        requires_underwriting: boolean;
        requires_medical_exam: boolean;
        currency: string;
        sort_order: number;
    }>({
        policy_type_id: policy.policy_type_id,
        policy_class_id: policy.policy_class_id,
        name: policy.name,
        code: policy.code,
        description: policy.description || '',
        is_active: policy.is_active,
        base_premium: policy.base_premium,
        commission_rate: policy.commission_rate,
        default_coverage_period: policy.default_coverage_period,
        min_sum_assured: policy.min_sum_assured,
        max_sum_assured: policy.max_sum_assured ?? null,
        requires_underwriting: policy.requires_underwriting,
        requires_medical_exam: policy.requires_medical_exam,
        currency: policy.currency,
        sort_order: policy.sort_order,
    });

    const [filteredClasses, setFilteredClasses] = useState<PolicyClass[]>(policyClasses);
    const [calculatedPremium, setCalculatedPremium] = useState<number | null>(null);

    // Auto-calculate premium when class changes
    useEffect(() => {
        if (data.policy_class_id) {
            fetchCalculatedPremium(data.policy_class_id);
        }
    }, [data.policy_class_id]);

    const fetchCalculatedPremium = async (classId: number | string) => {
        try {
            const policyClass = policyClasses.find((cls) => cls.id.toString() === classId.toString());
            if (policyClass?.calculated_premium) {
                setCalculatedPremium(policyClass.calculated_premium);
            }
        } catch (error) {
            console.error('Error fetching calculated premium:', error);
        }
    };

    // Filter classes based on type selection
    useEffect(() => {
        if (data.policy_type_id != null) {
            const filtered = policyClasses.filter((cls) => cls.policy_type_id === data.policy_type_id);
            setFilteredClasses(filtered);
            if (data.policy_class_id && !filtered.some((cls) => cls.id === data.policy_class_id)) {
                setData('policy_class_id', null);
            }
        } else {
            setFilteredClasses(policyClasses);
        }
    }, [data.policy_type_id, policyClasses]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('policies.update', policy.id), {
            onSuccess: () => {
                toast.success('Policy updated successfully');
            },
            onError: (errors) => {
                console.log(errors);
                toast.error('Failed to update policy');
            },
        });
    };

    return (
        <AppLayout>
            <Head title={`Edit Policy: ${policy.name}`} />
            <div className="space-y-6">
                <div className="mb-8">
                    <div className="mb-4">
                        <Link href={route('policies.show', policy.id)} className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Back to Policy Details
                        </Link>
                    </div>
                    <div className="mt-4">
                        <h1 className="text-3xl font-bold tracking-tight">Edit Policy</h1>
                        <p className="text-muted-foreground">Update your insurance policy product details.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Policy Hierarchy */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label>Policy Type *</Label>
                                    <Select
                                        value={data.policy_type_id ? data.policy_type_id.toString() : ''}
                                        onValueChange={(value) => setData('policy_type_id', parseInt(value))}
                                    >
                                        <SelectTrigger className={errors.policy_type_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select policy type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {policyTypes.map((type) => (
                                                <SelectItem key={type.id} value={type.id.toString()}>
                                                    {type.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.policy_type_id && <p className="mt-1 text-sm text-red-600">{errors.policy_type_id}</p>}
                                </div>

                                <div>
                                    <Label>Policy Class *</Label>
                                    <Select
                                        value={data.policy_class_id ? data.policy_class_id.toString() : ''}
                                        onValueChange={(value) => setData('policy_class_id', parseInt(value))}
                                    >
                                        <SelectTrigger className={errors.policy_class_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredClasses.map((cls) => (
                                                <SelectItem key={cls.id} value={cls.id.toString()}>
                                                    {cls.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.policy_class_id && <p className="mt-1 text-sm text-red-600">{errors.policy_class_id}</p>}
                                </div>
                            </div>

                            {/* Name and Code */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="name">Policy Name *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className={errors.name ? 'border-red-500' : ''}
                                        placeholder="e.g., Comprehensive Life Cover"
                                    />
                                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="code">Policy Code *</Label>
                                    <Input
                                        id="code"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                        className={errors.code ? 'border-red-500' : ''}
                                        placeholder="e.g., LIFE_COMP_001"
                                    />
                                    {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Detailed description of the policy"
                                    rows={3}
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch checked={data.is_active} onCheckedChange={(checked) => setData('is_active', checked)} />
                                <Label>Active</Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing Configuration */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calculator className="h-5 w-5" />
                                Pricing Configuration
                            </CardTitle>
                            {calculatedPremium && (
                                <p className="text-sm text-gray-600">Calculated base premium from hierarchy: ₦{calculatedPremium.toLocaleString()}</p>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                                <div>
                                    <Label htmlFor="base_premium">Base Premium (₦) *</Label>
                                    <Input
                                        id="base_premium"
                                        type="number"
                                        step="0.01"
                                        value={data.base_premium ?? ''}
                                        onChange={(e) => setData('base_premium', e.target.value === '' ? null : parseFloat(e.target.value))}
                                        className={errors.base_premium ? 'border-red-500' : ''}
                                    />
                                    {errors.base_premium && <p className="mt-1 text-sm text-red-600">{errors.base_premium}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="commission_rate">Commission Rate (%) *</Label>
                                    <Input
                                        id="commission_rate"
                                        type="number"
                                        step="0.01"
                                        value={data.commission_rate ?? ''}
                                        onChange={(e) => setData('commission_rate', e.target.value === '' ? null : parseFloat(e.target.value))}
                                        className={errors.commission_rate ? 'border-red-500' : ''}
                                    />
                                    {errors.commission_rate && <p className="mt-1 text-sm text-red-600">{errors.commission_rate}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="currency">Currency</Label>
                                    <Select value={data.currency} onValueChange={(value) => setData('currency', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NGN">NGN (₦)</SelectItem>
                                            <SelectItem value="USD">USD ($)</SelectItem>
                                            <SelectItem value="EUR">EUR (€)</SelectItem>
                                            <SelectItem value="GBP">GBP (£)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="sort_order">Sort Order</Label>
                                    <Input
                                        id="sort_order"
                                        type="number"
                                        value={data.sort_order}
                                        onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Coverage Configuration */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Coverage Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <Label htmlFor="default_coverage_period">Default Coverage Period (days)</Label>
                                    <Input
                                        id="default_coverage_period"
                                        type="number"
                                        value={data.default_coverage_period}
                                        onChange={(e) => setData('default_coverage_period', parseInt(e.target.value) || 365)}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="min_sum_assured">Min Sum Assured (₦)</Label>
                                    <Input
                                        id="min_sum_assured"
                                        type="number"
                                        step="0.01"
                                        value={data.min_sum_assured}
                                        onChange={(e) => setData('min_sum_assured', parseFloat(e.target.value) || 0)}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="max_sum_assured">Max Sum Assured (₦)</Label>
                                    <Input
                                        id="max_sum_assured"
                                        type="number"
                                        step="0.01"
                                        value={data.max_sum_assured ?? ''}
                                        onChange={(e) => setData('max_sum_assured', e.target.value === '' ? null : parseFloat(e.target.value))}
                                        placeholder="Leave empty for no limit"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-8">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={data.requires_underwriting}
                                        onCheckedChange={(checked) => setData('requires_underwriting', checked)}
                                    />
                                    <Label>Requires Underwriting</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={data.requires_medical_exam}
                                        onCheckedChange={(checked) => setData('requires_medical_exam', checked)}
                                    />
                                    <Label>Requires Medical Exam</Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Buttons */}
                    <div className="flex justify-end space-x-4">
                        <Link href={route('policies.show', policy.id)}>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Updating...' : 'Update Policy'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
