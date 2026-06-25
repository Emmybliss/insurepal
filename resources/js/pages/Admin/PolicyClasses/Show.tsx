import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit, FileText } from 'lucide-react';

interface PolicyClass {
    id: number;
    name: string;
    code: string;
    description: string | null;
    is_active: boolean;
    premium_multiplier: number;
    commission_multiplier: number;
    min_coverage_period: number;
    max_coverage_period: number;
    min_sum_assured: number;
    max_sum_assured: number | null;
    risk_factors: Array<{ name: string; weight: number }>;
    form_fields: Array<{ name: string; type: string; label: string; required: boolean; options?: string[] }>;
    policy_type: {
        id: number;
        name: string;
        code: string;
    };
    policies: Array<{
        id: number;
        name: string;
        code: string;
        is_active: boolean;
    }>;
}

interface Props {
    policyClass: PolicyClass;
}

export default function Show({ policyClass }: Props) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    return (
        <AppLayout>
            <Head title={policyClass.name} />

            <div className="py-8">
                <div className="mx-auto max-w-6xl px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-4">
                            <Link href={route('admin.policy-classes.index')}>
                                <Button variant="outline" size="sm">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Policy Classes
                                </Button>
                            </Link>
                            <Link href={route('admin.policy-classes.edit', policyClass.id)}>
                                <Button size="sm">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                        </div>
                        <div className="mt-4">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-gray-900">{policyClass.name}</h1>
                                <Badge variant={policyClass.is_active ? 'default' : 'secondary'}>
                                    {policyClass.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">{policyClass.description || 'No description provided'}</p>
                        </div>
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
                                        <code className="rounded bg-gray-100 px-2 py-1 text-sm">{policyClass.code}</code>
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Policy Type</dt>
                                    <dd className="mt-1 text-sm">
                                        <Link
                                            href={route('admin.policy-types.show', policyClass.policy_type.id)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            {policyClass.policy_type.name}
                                        </Link>
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Coverage Period Range</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {policyClass.min_coverage_period} - {policyClass.max_coverage_period} days
                                    </dd>
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
                                    <dt className="text-sm font-medium text-gray-500">Premium Multiplier</dt>
                                    <dd className="mt-1 text-lg font-semibold text-gray-900">{policyClass.premium_multiplier}x</dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Commission Multiplier</dt>
                                    <dd className="mt-1 text-lg font-semibold text-gray-900">{policyClass.commission_multiplier}x</dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Sum Assured Range</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {formatCurrency(policyClass.min_sum_assured)} -{' '}
                                        {policyClass.max_sum_assured ? formatCurrency(policyClass.max_sum_assured) : 'No limit'}
                                    </dd>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Risk Factors */}
                    {policyClass.risk_factors && policyClass.risk_factors.length > 0 && (
                        <Card className="mt-8">
                            <CardHeader>
                                <CardTitle>Risk Factors</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {policyClass.risk_factors.map((factor, index) => (
                                        <div key={index} className="rounded-lg border p-4">
                                            <h4 className="font-medium">{factor.name}</h4>
                                            <p className="text-sm text-gray-600">Weight: {factor.weight}%</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Form Fields */}
                    {policyClass.form_fields && policyClass.form_fields.length > 0 && (
                        <Card className="mt-8">
                            <CardHeader>
                                <CardTitle>Additional Form Fields</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {policyClass.form_fields.map((field, index) => (
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
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Associated Policies */}
                    {policyClass.policies && policyClass.policies.length > 0 && (
                        <Card className="mt-8">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Associated Policies ({policyClass.policies.length})
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
                                        {policyClass.policies.map((policy) => (
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
                </div>
            </div>
        </AppLayout>
    );
}
