import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
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

interface FormField {
    name: string;
    type: string;
    label: string;
    required: boolean;
    options?: string[];
}

interface PremiumFactor {
    name: string;
    rate: number;
}

interface CoverageDetail {
    name: string;
    description: string;
    limit?: number;
}

interface FormData {
    policy_type_id: number | string;
    policy_class_id: number | string;
    name: string;
    code: string;
    description: string;
    is_active: boolean;
    form_fields: FormField[];
    default_values: Record<string, any>;
    base_premium: number;
    commission_rate: number;
    premium_factors: PremiumFactor[];
    coverage_details: CoverageDetail[];
    terms_conditions: Record<string, any>;
    exclusions: Record<string, any>;
    default_coverage_period: number;
    min_sum_assured: number;
    max_sum_assured: number | string;
    requires_underwriting: boolean;
    requires_medical_exam: boolean;
    required_documents: string[];
    currency: string;
    sort_order: number;
}

interface Props {
    policyTypes: PolicyType[];
    policyClasses: PolicyClass[];
}

const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'select', label: 'Select' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'date', label: 'Date' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
];

export default function Create({ policyTypes, policyClasses }: Props) {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        policy_type_id: '',
        policy_class_id: '',
        name: '',
        code: '',
        description: '',
        is_active: true,
        form_fields: [],
        default_values: {},
        base_premium: 0,
        commission_rate: 0,
        premium_factors: [],
        coverage_details: [],
        terms_conditions: {},
        exclusions: {},
        default_coverage_period: 365,
        min_sum_assured: 0,
        max_sum_assured: '',
        requires_underwriting: false,
        requires_medical_exam: false,
        required_documents: [],
        currency: 'NGN',
        sort_order: 0,
    });

    const [selectedTypeId, setSelectedTypeId] = useState('');
    const [filteredClasses, setFilteredClasses] = useState<PolicyClass[]>(policyClasses);

    // Filter classes when policy type changes
    useEffect(() => {
        if (selectedTypeId) {
            const filtered = policyClasses.filter((cls) => cls.policy_type_id.toString() === selectedTypeId);
            setFilteredClasses(filtered);
            setData('policy_type_id', selectedTypeId);
            if (!filtered.some((cls) => cls.id.toString() === data.policy_class_id.toString())) {
                setData('policy_class_id', '');
            }
        } else {
            setFilteredClasses(policyClasses);
        }
    }, [selectedTypeId, policyClasses]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.policy-products.store'), {
            onSuccess: () => {
                toast.success('Policy product created successfully');
            },
            onError: (errors) => {
                console.log(errors);
                toast.error('Failed to create policy product');
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Create Policy Product" />

            <div className="space-y-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="mt-4">
                        <h1 className="text-3xl font-bold tracking-tight">Create Policy Product</h1>
                        <p className="text-muted-foreground">Create a new insurance policy product template.</p>
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
                                    <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                                        <SelectTrigger className={errors.policy_type_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select policy type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {policyTypes.map((type) => (
                                                <SelectItem key={type.id} value={type.id.toString()}>
                                                    {type.name} ({type.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.policy_type_id && <p className="mt-1 text-sm text-red-600">{errors.policy_type_id}</p>}
                                </div>

                                <div>
                                    <Label>Policy Class *</Label>
                                    <Select value={data.policy_class_id.toString()} onValueChange={(value) => setData('policy_class_id', value)}>
                                        <SelectTrigger className={errors.policy_class_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select policy class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredClasses.map((policyClass) => (
                                                <SelectItem key={policyClass.id} value={policyClass.id.toString()}>
                                                    {policyClass.name} ({policyClass.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.policy_class_id && <p className="mt-1 text-sm text-red-600">{errors.policy_class_id}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="name">Product Name *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className={errors.name ? 'border-red-500' : ''}
                                        placeholder="e.g., Premium Life Insurance"
                                    />
                                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="code">Product Code *</Label>
                                    <Input
                                        id="code"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                        className={errors.code ? 'border-red-500' : ''}
                                        placeholder="e.g., PREM_LIFE_001"
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
                                    className={errors.description ? 'border-red-500' : ''}
                                    placeholder="Detailed description of this policy product"
                                    rows={3}
                                />
                                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch id="is_active" checked={data.is_active} onCheckedChange={(checked) => setData('is_active', checked)} />
                                <Label htmlFor="is_active">Active</Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing Configuration */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                                <div>
                                    <Label htmlFor="base_premium">Base Premium (₦) *</Label>
                                    <Input
                                        id="base_premium"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.base_premium}
                                        onChange={(e) => setData('base_premium', parseFloat(e.target.value) || 0)}
                                        className={errors.base_premium ? 'border-red-500' : ''}
                                    />
                                    {errors.base_premium && <p className="mt-1 text-sm text-red-600">{errors.base_premium}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="commission_rate">Commission Rate (%) *</Label>
                                    <Input
                                        id="commission_rate"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={data.commission_rate}
                                        onChange={(e) => setData('commission_rate', parseFloat(e.target.value) || 0)}
                                        className={errors.commission_rate ? 'border-red-500' : ''}
                                    />
                                    {errors.commission_rate && <p className="mt-1 text-sm text-red-600">{errors.commission_rate}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="currency">Currency *</Label>
                                    <Select value={data.currency} onValueChange={(value) => setData('currency', value)}>
                                        <SelectTrigger className={errors.currency ? 'border-red-500' : ''}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NGN">Nigerian Naira (₦)</SelectItem>
                                            <SelectItem value="USD">US Dollar ($)</SelectItem>
                                            <SelectItem value="EUR">Euro (€)</SelectItem>
                                            <SelectItem value="GBP">British Pound (£)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.currency && <p className="mt-1 text-sm text-red-600">{errors.currency}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="sort_order">Sort Order *</Label>
                                    <Input
                                        id="sort_order"
                                        type="number"
                                        min="0"
                                        value={data.sort_order}
                                        onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                                        className={errors.sort_order ? 'border-red-500' : ''}
                                    />
                                    {errors.sort_order && <p className="mt-1 text-sm text-red-600">{errors.sort_order}</p>}
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
                                    <Label htmlFor="default_coverage_period">Default Coverage Period (days) *</Label>
                                    <Input
                                        id="default_coverage_period"
                                        type="number"
                                        min="1"
                                        max="3650"
                                        value={data.default_coverage_period}
                                        onChange={(e) => setData('default_coverage_period', parseInt(e.target.value) || 365)}
                                        className={errors.default_coverage_period ? 'border-red-500' : ''}
                                    />
                                    {errors.default_coverage_period && <p className="mt-1 text-sm text-red-600">{errors.default_coverage_period}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="min_sum_assured">Minimum Sum Assured *</Label>
                                    <Input
                                        id="min_sum_assured"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.min_sum_assured}
                                        onChange={(e) => setData('min_sum_assured', parseFloat(e.target.value) || 0)}
                                        className={errors.min_sum_assured ? 'border-red-500' : ''}
                                    />
                                    {errors.min_sum_assured && <p className="mt-1 text-sm text-red-600">{errors.min_sum_assured}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="max_sum_assured">Maximum Sum Assured</Label>
                                    <Input
                                        id="max_sum_assured"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.max_sum_assured}
                                        onChange={(e) => setData('max_sum_assured', e.target.value ? parseFloat(e.target.value) : '')}
                                        className={errors.max_sum_assured ? 'border-red-500' : ''}
                                        placeholder="Leave empty for no limit"
                                    />
                                    {errors.max_sum_assured && <p className="mt-1 text-sm text-red-600">{errors.max_sum_assured}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="requires_underwriting"
                                        checked={data.requires_underwriting}
                                        onCheckedChange={(checked) => setData('requires_underwriting', checked)}
                                    />
                                    <Label htmlFor="requires_underwriting">Requires Underwriting</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="requires_medical_exam"
                                        checked={data.requires_medical_exam}
                                        onCheckedChange={(checked) => setData('requires_medical_exam', checked)}
                                    />
                                    <Label htmlFor="requires_medical_exam">Requires Medical Exam</Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Buttons */}
                    <div className="flex justify-end space-x-4">
                        <Link href={route('admin.policy-products.index')}>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create Policy Product'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
