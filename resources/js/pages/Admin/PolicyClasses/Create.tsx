import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { PlusCircle, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface PolicyType {
    id: number;
    name: string;
    code: string;
}

interface FormField {
    name: string;
    type: string;
    label: string;
    required: boolean;
    options?: string[];
}

interface RiskFactor {
    name: string;
    weight: number;
}

interface FormData {
    policy_type_id: number | string;
    name: string;
    code: string;
    description: string;
    is_active: boolean;
    form_fields: FormField[];
    premium_multiplier: number;
    commission_multiplier: number;
    risk_factors: RiskFactor[];
    min_coverage_period: number;
    max_coverage_period: number;
    min_sum_assured: number;
    max_sum_assured: number | string;
    sort_order: number;
}

interface Props {
    policyTypes: PolicyType[];
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

export default function Create({ policyTypes }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        policy_type_id: '',
        name: '',
        code: '',
        description: '',
        is_active: true,
        form_fields: [],
        premium_multiplier: 1.0,
        commission_multiplier: 1.0,
        risk_factors: [],
        min_coverage_period: 30,
        max_coverage_period: 365,
        min_sum_assured: 0,
        max_sum_assured: '',
        sort_order: 0,
    });

    const [newField, setNewField] = useState<FormField>({
        name: '',
        type: 'text',
        label: '',
        required: false,
        options: [],
    });
    const [newRiskFactor, setNewRiskFactor] = useState<RiskFactor>({
        name: '',
        weight: 1,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.policy-classes.store'), {
            onSuccess: () => {
                toast.success('Policy class created successfully');
            },
            onError: () => {
                toast.error('Failed to create policy class');
            },
        });
    };

    const addFormField = () => {
        if (!newField.name || !newField.label) return;

        setData('form_fields', [...data.form_fields, { ...newField }]);
        setNewField({
            name: '',
            type: 'text',
            label: '',
            required: false,
            options: [],
        });
    };

    const removeFormField = (index: number) => {
        const updatedFields = data.form_fields.filter((_, i) => i !== index);
        setData('form_fields', updatedFields);
    };

    const addRiskFactor = () => {
        if (!newRiskFactor.name) return;

        setData('risk_factors', [...data.risk_factors, { ...newRiskFactor }]);
        setNewRiskFactor({
            name: '',
            weight: 1,
        });
    };

    const removeRiskFactor = (index: number) => {
        const updatedFactors = data.risk_factors.filter((_, i) => i !== index);
        setData('risk_factors', updatedFactors);
    };

    const updateFieldOptions = (value: string) => {
        const options = value.split('\n').filter((option) => option.trim());
        setNewField({ ...newField, options });
    };

    return (
        <AppLayout>
            <Head title="Create Policy Class" />

            <div className="space-y-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="mt-4">
                        <h1 className="text-3xl font-bold tracking-tight">Create Policy Class</h1>
                        <p className="text-muted-foreground">Create a new policy class within a specific policy category.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="policy_type_id">Policy Type *</Label>
                                <Select
                                    value={data.policy_type_id.toString()}
                                    onValueChange={(value) => setData('policy_type_id', parseInt(value))}
                                >
                                    <SelectTrigger className={errors.policy_type_id ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Select a policy type" />
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

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className={errors.name ? 'border-red-500' : ''}
                                        placeholder="e.g., Standard Coverage"
                                    />
                                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="code">Code *</Label>
                                    <Input
                                        id="code"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                        className={errors.code ? 'border-red-500' : ''}
                                        placeholder="e.g., LIFE_STD"
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
                                    placeholder="Brief description of this policy class"
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
                            <p className="text-sm text-gray-600">
                                Multipliers applied to the calculated premium and commission from the category level.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <Label htmlFor="premium_multiplier">Premium Multiplier</Label>
                                    <Input
                                        id="premium_multiplier"
                                        type="number"
                                        min="0.0001"
                                        max="99.9999"
                                        step="0.0001"
                                        value={data.premium_multiplier}
                                        onChange={(e) => setData('premium_multiplier', parseFloat(e.target.value) || 1)}
                                        className={errors.premium_multiplier ? 'border-red-500' : ''}
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Multiply category premium by this factor</p>
                                    {errors.premium_multiplier && <p className="mt-1 text-sm text-red-600">{errors.premium_multiplier}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="commission_multiplier">Commission Multiplier</Label>
                                    <Input
                                        id="commission_multiplier"
                                        type="number"
                                        min="0.0001"
                                        max="99.9999"
                                        step="0.0001"
                                        value={data.commission_multiplier}
                                        onChange={(e) => setData('commission_multiplier', parseFloat(e.target.value) || 1)}
                                        className={errors.commission_multiplier ? 'border-red-500' : ''}
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Multiply category commission by this factor</p>
                                    {errors.commission_multiplier && <p className="mt-1 text-sm text-red-600">{errors.commission_multiplier}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="sort_order">Sort Order</Label>
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
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="min_coverage_period">Min Coverage Period (days)</Label>
                                    <Input
                                        id="min_coverage_period"
                                        type="number"
                                        min="1"
                                        max="3650"
                                        value={data.min_coverage_period}
                                        onChange={(e) => setData('min_coverage_period', parseInt(e.target.value) || 30)}
                                        className={errors.min_coverage_period ? 'border-red-500' : ''}
                                    />
                                    {errors.min_coverage_period && <p className="mt-1 text-sm text-red-600">{errors.min_coverage_period}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="max_coverage_period">Max Coverage Period (days)</Label>
                                    <Input
                                        id="max_coverage_period"
                                        type="number"
                                        min="1"
                                        max="3650"
                                        value={data.max_coverage_period}
                                        onChange={(e) => setData('max_coverage_period', parseInt(e.target.value) || 365)}
                                        className={errors.max_coverage_period ? 'border-red-500' : ''}
                                    />
                                    {errors.max_coverage_period && <p className="mt-1 text-sm text-red-600">{errors.max_coverage_period}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="min_sum_assured">Min Sum Assured (₦)</Label>
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
                                    <Label htmlFor="max_sum_assured">Max Sum Assured (₦)</Label>
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
                        </CardContent>
                    </Card>

                    {/* Risk Factors */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Risk Factors</CardTitle>
                            <p className="text-sm text-gray-600">Define risk factors that affect premium calculations for this class.</p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Existing Risk Factors */}
                            {data.risk_factors.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium">Configured Risk Factors</h4>
                                    {data.risk_factors.map((factor, index) => (
                                        <div key={index} className="flex items-center justify-between rounded-lg border p-4">
                                            <div>
                                                <div className="font-medium">{factor.name}</div>
                                                <div className="text-sm text-gray-600">Weight: {factor.weight}%</div>
                                            </div>
                                            <Button type="button" variant="outline" size="sm" onClick={() => removeRiskFactor(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add New Risk Factor */}
                            <div className="rounded-lg border-2 border-dashed border-gray-300 p-6">
                                <h4 className="mb-4 text-sm font-medium">Add Risk Factor</h4>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label htmlFor="risk_factor_name">Factor Name</Label>
                                        <Input
                                            id="risk_factor_name"
                                            value={newRiskFactor.name}
                                            onChange={(e) => setNewRiskFactor({ ...newRiskFactor, name: e.target.value })}
                                            placeholder="e.g., Age Range"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="risk_factor_weight">Weight (%)</Label>
                                        <Input
                                            id="risk_factor_weight"
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={newRiskFactor.weight}
                                            onChange={(e) => setNewRiskFactor({ ...newRiskFactor, weight: parseFloat(e.target.value) || 1 })}
                                            placeholder="e.g., 10"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <Button type="button" variant="outline" onClick={addRiskFactor} disabled={!newRiskFactor.name}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add Risk Factor
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Additional Form Fields */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Additional Form Fields</CardTitle>
                            <p className="text-sm text-gray-600">Define class-specific form fields in addition to type and category fields.</p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Existing Fields */}
                            {data.form_fields.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium">Configured Fields</h4>
                                    {data.form_fields.map((field, index) => (
                                        <div key={index} className="flex items-center justify-between rounded-lg border p-4">
                                            <div>
                                                <div className="font-medium">{field.label}</div>
                                                <div className="text-sm text-gray-600">
                                                    {field.name} ({field.type}){field.required && ' - Required'}
                                                </div>
                                            </div>
                                            <Button type="button" variant="outline" size="sm" onClick={() => removeFormField(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add New Field */}
                            <div className="rounded-lg border-2 border-dashed border-gray-300 p-6">
                                <h4 className="mb-4 text-sm font-medium">Add New Field</h4>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label htmlFor="field_name">Field Name</Label>
                                        <Input
                                            id="field_name"
                                            value={newField.name}
                                            onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                                            placeholder="e.g., medical_history"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="field_label">Label</Label>
                                        <Input
                                            id="field_label"
                                            value={newField.label}
                                            onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                                            placeholder="e.g., Medical History"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="field_type">Type</Label>
                                        <Select value={newField.type} onValueChange={(value) => setNewField({ ...newField, type: value })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {fieldTypes.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="field_required"
                                            checked={newField.required}
                                            onCheckedChange={(checked) => setNewField({ ...newField, required: checked })}
                                        />
                                        <Label htmlFor="field_required">Required</Label>
                                    </div>

                                    {newField.type === 'select' && (
                                        <div className="sm:col-span-2">
                                            <Label htmlFor="field_options">Options (one per line)</Label>
                                            <Textarea
                                                id="field_options"
                                                placeholder="Option 1\nOption 2\nOption 3"
                                                onChange={(e) => updateFieldOptions(e.target.value)}
                                                rows={3}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4">
                                    <Button type="button" variant="outline" onClick={addFormField} disabled={!newField.name || !newField.label}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add Field
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Buttons */}
                    <div className="flex justify-end space-x-4">
                        <Link href={route('admin.policy-classes.index')}>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create Policy Class'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
