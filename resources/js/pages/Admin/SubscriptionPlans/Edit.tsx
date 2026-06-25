import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AdminLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Plan {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    setup_fee: number;
    currency: string;
    billing_cycle: string;
    features: string[];
    max_users: number | null;
    max_storage_gb: number | null;
    is_active: boolean;
    is_popular: boolean;
    sort_order: number;
}

const breadcrumbs = (plan: Plan): BreadcrumbItem[] => [
    { title: 'Super Admin', href: route('admin.dashboard') },
    { title: 'Subscription Plans', href: route('admin.plans.index') },
    { title: `Edit ${plan.name}`, href: '#' },
];

export default function SubscriptionPlanEdit({ plan }: { plan: Plan }) {
    const { data, setData, put, processing, errors } = useForm({
        name: plan.name,
        description: plan.description ?? '',
        price: String(plan.price),
        setup_fee: String(plan.setup_fee ?? 0),
        currency: plan.currency,
        max_users: plan.max_users !== null ? String(plan.max_users) : '',
        max_storage_gb: plan.max_storage_gb !== null ? String(plan.max_storage_gb) : '',
        features: plan.features ?? [],
        is_active: plan.is_active,
        is_popular: plan.is_popular,
        sort_order: String(plan.sort_order),
    });

    const addFeature = () => setData('features', [...data.features, '']);

    const updateFeature = (index: number, value: string) => {
        const updated = [...data.features];
        updated[index] = value;
        setData('features', updated);
    };

    const removeFeature = (index: number) => {
        setData(
            'features',
            data.features.filter((_, i) => i !== index),
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.plans.update', plan.id), {
            onSuccess: () => toast.success(`Plan "${data.name}" updated successfully.`),
            onError: () => toast.error('Please check the form for errors.'),
        });
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs(plan)}>
            <Head title={`Edit ${plan.name} — Plans`} />

            <div className="mx-auto max-w-3xl space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Edit Plan: {plan.name}</h2>
                    <p className="text-muted-foreground">Update pricing, setup fee, and feature list</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="name">Plan Name</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Starter" />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Short description for the plan card"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="sort_order">Sort Order</Label>
                                    <Input
                                        id="sort_order"
                                        type="number"
                                        min={0}
                                        value={data.sort_order}
                                        onChange={(e) => setData('sort_order', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="currency">Currency</Label>
                                    <Input id="currency" value={data.currency} onChange={(e) => setData('currency', e.target.value)} maxLength={3} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing</CardTitle>
                            <CardDescription>Monthly subscription price and one-time guided onboarding setup fee</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="price">Monthly Price (₦)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    min={0}
                                    step="1"
                                    value={data.price}
                                    onChange={(e) => setData('price', e.target.value)}
                                />
                                {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="setup_fee">Setup Fee (₦) — Guided Onboarding</Label>
                                <Input
                                    id="setup_fee"
                                    type="number"
                                    min={0}
                                    step="1"
                                    value={data.setup_fee}
                                    onChange={(e) => setData('setup_fee', e.target.value)}
                                />
                                {errors.setup_fee && <p className="text-sm text-destructive">{errors.setup_fee}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Limits */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Plan Limits</CardTitle>
                            <CardDescription>Leave blank for unlimited</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="max_users">Max Staff Accounts</Label>
                                <Input
                                    id="max_users"
                                    type="number"
                                    min={1}
                                    value={data.max_users}
                                    onChange={(e) => setData('max_users', e.target.value)}
                                    placeholder="Unlimited"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="max_storage_gb">Max Storage (GB)</Label>
                                <Input
                                    id="max_storage_gb"
                                    type="number"
                                    min={1}
                                    value={data.max_storage_gb}
                                    onChange={(e) => setData('max_storage_gb', e.target.value)}
                                    placeholder="Unlimited"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Features */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Features</CardTitle>
                            <CardDescription>Each feature appears as a bullet point on the pricing card</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {data.features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input
                                        value={feature}
                                        onChange={(e) => updateFeature(index, e.target.value)}
                                        placeholder={`Feature ${index + 1}`}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeFeature(index)}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                                <Plus className="mr-1 h-4 w-4" />
                                Add Feature
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Visibility */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Visibility</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Active</p>
                                    <p className="text-sm text-muted-foreground">Show this plan on the landing page</p>
                                </div>
                                <Switch checked={data.is_active} onCheckedChange={(v) => setData('is_active', v)} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Mark as Popular</p>
                                    <p className="text-sm text-muted-foreground">Highlights this plan with a "Most Popular" badge</p>
                                </div>
                                <Switch checked={data.is_popular} onCheckedChange={(v) => setData('is_popular', v)} />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => router.visit(route('admin.plans.index'))}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
