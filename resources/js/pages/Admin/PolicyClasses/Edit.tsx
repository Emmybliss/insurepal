import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import React, { useEffect, useState } from 'react';
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

interface PolicyClass {
    id: number;
    policy_type_id: number;
    name: string;
    code: string;
    description: string | null;
    is_active: boolean;
    form_fields: FormField[];
    premium_multiplier: number;
    commission_multiplier: number;
    risk_factors: RiskFactor[];
    min_coverage_period: number;
    max_coverage_period: number;
    min_sum_assured: number;
    max_sum_assured: number | null;
    sort_order: number;
}

interface Props {
    policyClass: PolicyClass;
    policyTypes: PolicyType[];
}

export default function Edit({ policyClass, policyTypes }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        policy_type_id: policyClass.policy_type_id,
        name: policyClass.name,
        code: policyClass.code,
        description: policyClass.description || '',
        is_active: policyClass.is_active,
        form_fields: policyClass.form_fields || [],
        premium_multiplier: policyClass.premium_multiplier,
        commission_multiplier: policyClass.commission_multiplier,
        risk_factors: policyClass.risk_factors || [],
        min_coverage_period: policyClass.min_coverage_period,
        max_coverage_period: policyClass.max_coverage_period,
        min_sum_assured: policyClass.min_sum_assured,
        max_sum_assured: policyClass.max_sum_assured || '',
        sort_order: policyClass.sort_order,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.policy-classes.update', policyClass.id), {
            onSuccess: () => {
                toast.success('Policy class updated successfully');
            },
            onError: () => {
                toast.error('Failed to update policy class');
            },
        });
    };

    return (
        <AppLayout>
            <Head title={`Edit ${policyClass.name}`} />

            <div className="py-8">
                <div className="mx-auto max-w-4xl px-6 lg:px-8">
                    <div className="mb-8">
                        <div className="flex items-center gap-4">
                            <Link href={route('admin.policy-classes.index')}>
                                <Button variant="outline" size="sm">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Policy Classes
                                </Button>
                            </Link>
                        </div>
                        <div className="mt-4">
                            <h1 className="text-3xl font-bold text-gray-900">Edit Policy Class</h1>
                            <p className="mt-2 text-sm text-gray-600">Update the configuration for {policyClass.name}.</p>
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
                                        rows={3}
                                    />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch id="is_active" checked={data.is_active} onCheckedChange={(checked) => setData('is_active', checked)} />
                                    <Label htmlFor="is_active">Active</Label>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pricing and Coverage */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Pricing & Coverage Configuration</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="premium_multiplier">Premium Multiplier</Label>
                                        <Input
                                            id="premium_multiplier"
                                            type="number"
                                            step="0.0001"
                                            value={data.premium_multiplier}
                                            onChange={(e) => setData('premium_multiplier', parseFloat(e.target.value) || 1)}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="commission_multiplier">Commission Multiplier</Label>
                                        <Input
                                            id="commission_multiplier"
                                            type="number"
                                            step="0.0001"
                                            value={data.commission_multiplier}
                                            onChange={(e) => setData('commission_multiplier', parseFloat(e.target.value) || 1)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
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
                                {processing ? 'Updating...' : 'Update Policy Class'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
