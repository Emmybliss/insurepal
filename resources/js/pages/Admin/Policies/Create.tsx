import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Calculator, PlusCircle, Trash2 } from 'lucide-react';
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
    tenant_id: number | string;
    policy_type_id: number | string;
    policy_class_id: number | string;
    name: string;
    code: string;
    description: string;
    is_active: boolean;
    form_fields: FormField[];
    default_values: Record<string, any>;
    base_premium: number | string;
    commission_rate: number | string;
    premium_factors: PremiumFactor[];
    coverage_details: CoverageDetail[];
    terms_conditions: string[];
    exclusions: string[];
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

export default function Create({ policyTypes, policyClasses }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        tenant_id: '',
        policy_type_id: '',
        policy_class_id: '',
        name: '',
        code: '',
        description: '',
        is_active: true,
        form_fields: [],
        default_values: {},
        base_premium: '',
        commission_rate: '',
        premium_factors: [],
        coverage_details: [],
        terms_conditions: [],
        exclusions: [],
        default_coverage_period: 365,
        min_sum_assured: 0,
        max_sum_assured: '',
        requires_underwriting: false,
        requires_medical_exam: false,
        required_documents: [],
        currency: 'NGN',
        sort_order: 0,
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
                if (!data.base_premium) {
                    setData('base_premium', policyClass.calculated_premium);
                }
            }
        } catch (error) {
            console.error('Error fetching calculated premium:', error);
        }
    };

    // Filter classes based on type selection
    useEffect(() => {
        if (data.policy_type_id) {
            const filtered = policyClasses.filter((cls) => cls.policy_type_id.toString() === data.policy_type_id.toString());
            setFilteredClasses(filtered);
            if (data.policy_class_id && !filtered.some((cls) => cls.id.toString() === data.policy_class_id.toString())) {
                setData('policy_class_id', '');
            }
        } else {
            setFilteredClasses(policyClasses);
        }
    }, [data.policy_type_id, policyClasses]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.policies.store'), {
            onSuccess: () => {
                toast.success('Policy created successfully');
            },
            onError: (errors) => {
                console.log(errors);
                toast.error('Failed to create policy');
            },
        });
    };

    const addPremiumFactor = () => {
        setData('premium_factors', [...data.premium_factors, { name: '', rate: 0 }]);
    };

    const updatePremiumFactor = (index: number, field: keyof PremiumFactor, value: string | number) => {
        const updated = [...data.premium_factors];
        updated[index] = { ...updated[index], [field]: value };
        setData('premium_factors', updated);
    };

    const removePremiumFactor = (index: number) => {
        setData(
            'premium_factors',
            data.premium_factors.filter((_, i) => i !== index),
        );
    };

    const addCoverageDetail = () => {
        setData('coverage_details', [...data.coverage_details, { name: '', description: '', limit: undefined }]);
    };

    const updateCoverageDetail = (index: number, field: keyof CoverageDetail, value: string | number | undefined) => {
        const updated = [...data.coverage_details];
        updated[index] = { ...updated[index], [field]: value };
        setData('coverage_details', updated);
    };

    const removeCoverageDetail = (index: number) => {
        setData(
            'coverage_details',
            data.coverage_details.filter((_, i) => i !== index),
        );
    };

    const addStringArrayItem = (field: 'terms_conditions' | 'exclusions' | 'required_documents') => {
        setData(field, [...data[field], '']);
    };

    const updateStringArrayItem = (field: 'terms_conditions' | 'exclusions' | 'required_documents', index: number, value: string) => {
        const updated = [...data[field]];
        updated[index] = value;
        setData(field, updated);
    };

    const removeStringArrayItem = (field: 'terms_conditions' | 'exclusions' | 'required_documents', index: number) => {
        setData(
            field,
            data[field].filter((_, i) => i !== index),
        );
    };

    return (
        <AppLayout>
            <Head title="Create Policy" />
            <div className="space-y-6">
                <div className="mb-8">
                    <div className="mt-4">
                        <h1 className="text-3xl font-bold tracking-tight">Create Policy</h1>
                        <p className="text-muted-foreground">Create a complete insurance policy product.</p>
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
                                        value={data.policy_type_id.toString()}
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
                                        value={data.policy_class_id.toString()}
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
                                    <Label htmlFor="base_premium">Base Premium (₦)</Label>
                                    <Input
                                        id="base_premium"
                                        type="number"
                                        step="0.01"
                                        value={data.base_premium}
                                        onChange={(e) => setData('base_premium', e.target.value ? parseFloat(e.target.value) : '')}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                                    <Input
                                        id="commission_rate"
                                        type="number"
                                        step="0.01"
                                        value={data.commission_rate}
                                        onChange={(e) => setData('commission_rate', e.target.value ? parseFloat(e.target.value) : '')}
                                    />
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

                            {/* Premium Factors */}
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <Label>Premium Factors</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addPremiumFactor}>
                                        <PlusCircle className="mr-1 h-4 w-4" />
                                        Add Factor
                                    </Button>
                                </div>
                                {data.premium_factors.map((factor, index) => (
                                    <div key={index} className="mb-2 flex gap-2">
                                        <Input
                                            placeholder="Factor name"
                                            value={factor.name}
                                            onChange={(e) => updatePremiumFactor(index, 'name', e.target.value)}
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Rate %"
                                            value={factor.rate}
                                            onChange={(e) => updatePremiumFactor(index, 'rate', parseFloat(e.target.value) || 0)}
                                        />
                                        <Button type="button" variant="outline" size="sm" onClick={() => removePremiumFactor(index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
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
                                        value={data.max_sum_assured}
                                        onChange={(e) => setData('max_sum_assured', e.target.value ? parseFloat(e.target.value) : '')}
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
                        <Link href={route('admin.policies.index')}>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create Policy'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
