import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Edit, FileText, FolderOpen } from 'lucide-react';

interface FormField {
    name: string;
    type: string;
    label: string;
    required: boolean;
    options?: Array<string | { label: string; value: string }>;
}

interface PolicyClass {
    id: number;
    name: string;
    code: string;
    is_active: boolean;
}

interface Policy {
    id: number;
    name: string;
    code: string;
    is_active: boolean;
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
    created_at: string;
    updated_at: string;
    policy_classes: PolicyClass[];
    policies: Policy[];
}

interface Props {
    policyType: PolicyType;
}

export default function Show({ policyType }: Props) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <AppLayout>
            <Head title={policyType.name} />

            <div className="space-y-6">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-bold tracking-tight">{policyType.name}</h2>
                            <Badge variant={policyType.is_active ? 'default' : 'secondary'}>{policyType.is_active ? 'Active' : 'Inactive'}</Badge>
                        </div>
                        <p className="text-muted-foreground">{policyType.description || 'No description provided'}</p>
                    </div>
                    <Link href={route('admin.policy-types.edit', policyType.id)}>
                        <Button size="sm">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Code</dt>
                                <dd className="mt-1">
                                    <code className="rounded bg-gray-100 px-2 py-1 text-sm">{policyType.code}</code>
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-gray-500">Status</dt>
                                <dd className="mt-1">
                                    <Badge variant={policyType.is_active ? 'default' : 'secondary'}>
                                        {policyType.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-gray-500">Sort Order</dt>
                                <dd className="mt-1 text-sm text-gray-900">{policyType.sort_order}</dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-gray-500">Created</dt>
                                <dd className="mt-1 text-sm text-gray-900">{formatDate(policyType.created_at)}</dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                                <dd className="mt-1 text-sm text-gray-900">{formatDate(policyType.updated_at)}</dd>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing Configuration */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Base Premium</dt>
                                <dd className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(policyType.base_premium)}</dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-gray-500">Commission Rate</dt>
                                <dd className="mt-1 text-lg font-semibold text-gray-900">{policyType.commission_rate}%</dd>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Custom Form Fields */}
                {policyType.form_fields && policyType.form_fields.length > 0 && (
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle>Custom Form Fields</CardTitle>
                            <p className="text-sm text-gray-600">Additional fields required when creating quotes for this policy type.</p>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {policyType.form_fields.map((field, index) => (
                                    <div key={index} className="rounded-lg border p-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium">{field.label}</h4>
                                            {field.required && (
                                                <Badge variant="outline" className="text-xs">
                                                    Required
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="mt-1 text-sm text-gray-600">
                                            {field.name} ({field.type})
                                        </p>
                                        {field.options && field.options.length > 0 && (
                                            <div className="mt-2">
                                                <p className="text-xs text-gray-500">Options:</p>
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {field.options.map((option, optIndex) => (
                                                        <span key={optIndex} className="rounded bg-gray-100 px-2 py-1 text-xs">
                                                            {typeof option === 'string' ? option : option.label}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Policy Classes */}
                {policyType.policy_classes && policyType.policy_classes.length > 0 && (
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FolderOpen className="h-5 w-5" />
                                Policy Classes ({policyType.policy_classes.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {policyType.policy_classes.map((policyClass) => (
                                        <TableRow key={policyClass.id}>
                                            <TableCell>{policyClass.name}</TableCell>
                                            <TableCell>
                                                <code className="rounded bg-gray-100 px-2 py-1 text-sm">{policyClass.code}</code>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={policyClass.is_active ? 'default' : 'secondary'}>
                                                    {policyClass.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={route('admin.policy-classes.show', policyClass.id)}>
                                                    <Button variant="ghost" size="sm">
                                                        View
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {/* Direct Policies */}
                {policyType.policies && policyType.policies.length > 0 && (
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Direct Policies ({policyType.policies.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {policyType.policies.map((policy) => (
                                        <TableRow key={policy.id}>
                                            <TableCell>{policy.name}</TableCell>
                                            <TableCell>
                                                <code className="rounded bg-gray-100 px-2 py-1 text-sm">{policy.code}</code>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={policy.is_active ? 'default' : 'secondary'}>
                                                    {policy.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={route('admin.policies.show', policy.id)}>
                                                    <Button variant="ghost" size="sm">
                                                        View
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {/* Empty States */}
                {(!policyType.policy_classes || policyType.policy_classes.length === 0) &&
                    (!policyType.policies || policyType.policies.length === 0) && (
                        <Card className="mt-8">
                            <CardContent className="py-8 text-center">
                                <div className="text-gray-500">
                                    <FolderOpen className="mx-auto h-12 w-12 opacity-50" />
                                    <h3 className="mt-4 text-sm font-medium">No classes or policies</h3>
                                    <p className="mt-2 text-sm">This policy type doesn't have any associated classes or direct policies yet.</p>
                                    <div className="mt-6 flex justify-center gap-4">
                                        <Link href={route('admin.policy-classes.create')}>
                                            <Button variant="outline">Add Class</Button>
                                        </Link>
                                        <Link href={route('admin.policies.create')}>
                                            <Button variant="outline">Add Policy</Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
            </div>
        </AppLayout>
    );
}
