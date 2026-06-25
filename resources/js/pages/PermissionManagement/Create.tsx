import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Info, Key, PlusCircle } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

interface Props {
    categories: string[];
}

export default function CreatePermission({ categories }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        display_name: '',
        description: '',
        category: '',
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Show loading toast
        const loadingToastId = toast.loading('Creating permission...', {
            description: 'Please wait while we create the new permission',
        });

        post(route('permission-management.store'), {
            onSuccess: () => {
                toast.dismiss(loadingToastId);
                toast.success('Permission created successfully! 🎉', {
                    description: `"${data.display_name || data.name}" has been added`,
                    duration: 5000,
                });
                reset();
            },
            onError: (errors) => {
                toast.dismiss(loadingToastId);

                // Handle specific validation errors
                if (errors.name) {
                    toast.error('Invalid permission name', {
                        description: errors.name,
                        duration: 6000,
                    });
                } else if (errors.display_name) {
                    toast.error('Invalid display name', {
                        description: errors.display_name,
                        duration: 6000,
                    });
                } else {
                    toast.error('Failed to create permission', {
                        description: 'Please check your input and try again',
                        duration: 6000,
                    });
                }
            },
        });
    };

    const generatePermissionName = () => {
        if (!data.display_name) return;

        const name = data.display_name
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_');

        setData('name', name);
    };

    const formatCategoryName = (category: string) => {
        return category
            .replace(/[-_]/g, ' ')
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <AppLayout>
            <Head title="Create Permission" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Create Permission</h1>
                            <p className="text-muted-foreground">Add a new custom permission</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Form */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Key className="h-5 w-5" />
                                    Permission Details
                                </CardTitle>
                                <CardDescription>Define the permission name, display name, and category</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="display_name">Display Name *</Label>
                                            <Input
                                                id="display_name"
                                                value={data.display_name}
                                                onChange={(e) => setData('display_name', e.target.value)}
                                                onBlur={generatePermissionName}
                                                placeholder="e.g., View Sensitive Data"
                                                required
                                            />
                                            {errors.display_name && <p className="text-sm text-red-600">{errors.display_name}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="name">Permission Name *</Label>
                                            <Input
                                                id="name"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="e.g., view_sensitive_data"
                                                required
                                            />
                                            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                                            <p className="text-xs text-muted-foreground">Unique identifier (lowercase, underscores allowed)</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="category">Category</Label>
                                        <Select value={data.category} onValueChange={(value) => setData('category', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select or type a category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((category) => (
                                                    <SelectItem key={category} value={category}>
                                                        {formatCategoryName(category)}
                                                    </SelectItem>
                                                ))}
                                                <SelectItem value="custom">Custom Category...</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {/* Fallback for custom category if needed, for now just using select or simple string input logic could be added */}
                                        {data.category === 'custom' && (
                                            <Input
                                                className="mt-2"
                                                placeholder="Enter new category name"
                                                onChange={(e) => setData('category', e.target.value)}
                                            />
                                        )}
                                        {errors.category && <p className="text-sm text-red-600">{errors.category}</p>}
                                        <p className="text-xs text-muted-foreground">Group this permission for better organization</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Describe what this permission allows users to do"
                                            rows={3}
                                        />
                                        {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="is_active"
                                            checked={data.is_active}
                                            onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                                        />
                                        <Label htmlFor="is_active">Active Permission</Label>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Info className="h-4 w-4 text-muted-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Inactive permissions cannot be assigned to roles</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>

                                    <div className="flex items-center justify-end space-x-4 pt-4">
                                        <Button type="button" variant="outline" onClick={() => router.visit(route('permission-management.index'))}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={processing}>
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            {processing ? 'Creating...' : 'Create Permission'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Guidelines */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Guidelines</CardTitle>
                                <CardDescription>Best practices for creating permissions</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium">Naming Convention</h4>
                                    <p className="text-sm text-muted-foreground">Use descriptive names relative to your organization's needs.</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium">Categories</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Group permissions logically (e.g., "HR", "Finance") to find them easily later.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
