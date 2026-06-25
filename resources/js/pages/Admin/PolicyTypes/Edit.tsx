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

interface FormField {
    name: string;
    type: string;
    label: string;
    required: boolean;
    options?: string[];
}

interface PolicyType {
    id: number;
    name: string;
    code: string;
    description: string | null;
    is_active: boolean;
    form_fields: FormField[];
    base_premium: number;
    commission_rate: number;
    sort_order: number;
}

interface Props {
    policyType: PolicyType;
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

export default function Edit({ policyType }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: policyType.name,
        code: policyType.code,
        description: policyType.description || '',
        is_active: policyType.is_active,
        form_fields: policyType.form_fields || [],
        base_premium: policyType.base_premium,
        commission_rate: policyType.commission_rate,
        sort_order: policyType.sort_order,
    });

    const [newField, setNewField] = useState<FormField>({
        name: '',
        type: 'text',
        label: '',
        required: false,
        options: [],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.policy-types.update', policyType.id), {
            onSuccess: () => {
                toast.success('Policy type updated successfully');
            },
            onError: () => {
                toast.error('Failed to update policy type');
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

    const updateFieldOptions = (value: string) => {
        const options = value.split('\n').filter((option) => option.trim());
        setNewField({ ...newField, options });
    };

    return (
        <AppLayout>
            <Head title={`Edit ${policyType.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4"></div>
                    <div className="mt-4">
                        <h2 className="text-3xl font-bold tracking-tight">Edit Policy Type</h2>
                        <p className="text-muted-foreground">Update the configuration for {policyType.name}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className={errors.name ? 'border-red-500' : ''}
                                        placeholder="e.g., Life Insurance"
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
                                        placeholder="e.g., LIFE_INS"
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
                                    placeholder="Brief description of this policy type"
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
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <Label htmlFor="base_premium">Base Premium (₦)</Label>
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
                                    <Label htmlFor="commission_rate">Commission Rate (%)</Label>
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

                    {/* Form Fields Configuration */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Custom Form Fields</CardTitle>
                            <p className="text-sm text-gray-600">
                                Define additional form fields that will be required when creating quotes for this policy type.
                            </p>
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
                                            placeholder="e.g., vehicle_year"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="field_label">Label</Label>
                                        <Input
                                            id="field_label"
                                            value={newField.label}
                                            onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                                            placeholder="e.g., Vehicle Year"
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
                        <Link href={route('admin.policy-types.index')}>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Updating...' : 'Update Policy Type'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
