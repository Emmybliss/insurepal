import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit, Power, PowerOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface PolicyType {
    id: number;
    name: string;
}

interface PolicyClass {
    id: number;
    name: string;
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

interface Policy {
    id: number;
    policy_number: string;
    customer_name: string;
    effective_date: string;
    expiry_date: string;
    premium_amount: number;
    status: string;
}

interface PolicyProduct {
    id: number;
    name: string;
    code: string;
    description: string | null;
    is_active: boolean;
    base_premium: number;
    commission_rate: number;
    requires_underwriting: boolean;
    requires_medical_exam: boolean;
    currency: string;
    form_fields: FormField[] | null;
    default_values: Record<string, any> | null;
    premium_factors: PremiumFactor[] | null;
    coverage_details: CoverageDetail[] | null;
    terms_conditions: string[] | null;
    exclusions: string[] | null;
    default_coverage_period: number;
    min_sum_assured: number;
    max_sum_assured: number | null;
    required_documents: string[] | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
    policyType: PolicyType;
    policyClass: PolicyClass;
    tenant: { id: number; name: string } | null;
    policies: Policy[];
}

interface Props {
    policyProduct: PolicyProduct;
}

export default function Show({ policyProduct }: Props) {
    const handleToggleStatus = () => {
        router.post(
            route('admin.policy-products.toggle-status', policyProduct.id),
            {},
            {
                onSuccess: () => {
                    toast.success(`Policy product ${policyProduct.is_active ? 'deactivated' : 'activated'} successfully`);
                },
                onError: () => {
                    toast.error('Failed to update policy product status');
                },
                preserveScroll: true,
            },
        );
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this policy product? This action cannot be undone.')) {
            router.delete(route('admin.policy-products.destroy', policyProduct.id), {
                onSuccess: () => {
                    toast.success('Policy product deleted successfully');
                },
                onError: () => {
                    toast.error('Failed to delete policy product');
                },
            });
        }
    };

    const formatCurrency = (amount: number, currency = 'NGN') => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout>
            <Head title={`Policy Product: ${policyProduct.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('admin.policy-products.index')}>
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Policy Products
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{policyProduct.name}</h1>
                            <p className="text-muted-foreground">
                                Code: <code className="rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-800">{policyProduct.code}</code>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={policyProduct.is_active ? 'default' : 'secondary'}>{policyProduct.is_active ? 'Active' : 'Inactive'}</Badge>
                        <Link href={route('admin.policy-products.edit', policyProduct.id)}>
                            <Button>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        <Button variant="outline" onClick={handleToggleStatus}>
                            {policyProduct.is_active ? (
                                <>
                                    <PowerOff className="mr-2 h-4 w-4" />
                                    Deactivate
                                </>
                            ) : (
                                <>
                                    <Power className="mr-2 h-4 w-4" />
                                    Activate
                                </>
                            )}
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Basic Information */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Description</label>
                                <p className="mt-1">{policyProduct.description || 'No description provided'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Base Premium</label>
                                    <p className="mt-1 text-lg font-semibold">{formatCurrency(policyProduct.base_premium, policyProduct.currency)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Commission Rate</label>
                                    <p className="mt-1 text-lg font-semibold">{policyProduct.commission_rate}%</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Min Sum Assured</label>
                                    <p className="mt-1 font-medium">{formatCurrency(policyProduct.min_sum_assured, policyProduct.currency)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Max Sum Assured</label>
                                    <p className="mt-1 font-medium">
                                        {policyProduct.max_sum_assured
                                            ? formatCurrency(policyProduct.max_sum_assured, policyProduct.currency)
                                            : 'No limit'}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Default Coverage Period</label>
                                <p className="mt-1">{policyProduct.default_coverage_period} days</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Policy Hierarchy</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Policy Type</label>
                                <p className="mt-1 font-medium">{policyProduct.policyType.name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Policy Class</label>
                                <p className="mt-1 font-medium">{policyProduct.policyClass.name}</p>
                            </div>
                            {policyProduct.tenant && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Tenant</label>
                                    <p className="mt-1 font-medium">{policyProduct.tenant.name}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Requirements and Features */}
                <Card>
                    <CardHeader>
                        <CardTitle>Requirements & Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <h4 className="mb-3 font-medium">Processing Requirements</h4>
                                <div className="flex flex-wrap gap-2">
                                    {policyProduct.requires_underwriting && <Badge variant="secondary">Requires Underwriting</Badge>}
                                    {policyProduct.requires_medical_exam && <Badge variant="secondary">Requires Medical Exam</Badge>}
                                    {!policyProduct.requires_underwriting && !policyProduct.requires_medical_exam && (
                                        <span className="text-sm text-gray-500">No special requirements</span>
                                    )}
                                </div>
                            </div>
                            {policyProduct.required_documents && policyProduct.required_documents.length > 0 && (
                                <div>
                                    <h4 className="mb-3 font-medium">Required Documents</h4>
                                    <ul className="space-y-1">
                                        {policyProduct.required_documents.map((doc, index) => (
                                            <li key={index} className="text-sm">
                                                • {doc}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Form Fields */}
                {policyProduct.form_fields && policyProduct.form_fields.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Form Fields Configuration</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-hidden rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Field Name</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Label</TableHead>
                                            <TableHead>Required</TableHead>
                                            <TableHead>Options</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {policyProduct.form_fields.map((field, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <code className="rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-800">{field.name}</code>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{field.type}</Badge>
                                                </TableCell>
                                                <TableCell>{field.label}</TableCell>
                                                <TableCell>
                                                    {field.required ? (
                                                        <Badge variant="destructive" className="text-xs">
                                                            Required
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Optional
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {field.options && field.options.length > 0 ? (
                                                        <div className="text-sm text-gray-600">{field.options.join(', ')}</div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">—</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Coverage Details */}
                {policyProduct.coverage_details && policyProduct.coverage_details.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Coverage Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                {policyProduct.coverage_details.map((coverage, index) => (
                                    <div key={index} className="rounded-lg border p-4">
                                        <h4 className="font-medium">{coverage.name}</h4>
                                        <p className="mt-1 text-sm text-gray-600">{coverage.description}</p>
                                        {coverage.limit && (
                                            <p className="mt-2 text-sm font-medium">
                                                Limit: {formatCurrency(coverage.limit, policyProduct.currency)}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Terms & Exclusions */}
                <div className="grid gap-6 md:grid-cols-2">
                    {policyProduct.terms_conditions && policyProduct.terms_conditions.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Terms & Conditions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {policyProduct.terms_conditions.map((term, index) => (
                                        <li key={index} className="text-sm">
                                            • {term}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {policyProduct.exclusions && policyProduct.exclusions.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Exclusions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {policyProduct.exclusions.map((exclusion, index) => (
                                        <li key={index} className="text-sm">
                                            • {exclusion}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Issued Policies */}
                <Card>
                    <CardHeader>
                        <CardTitle>Issued Policies ({policyProduct.policies?.length || 0})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {policyProduct.policies && policyProduct.policies.length > 0 ? (
                            <div className="overflow-hidden rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Policy Number</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Effective Date</TableHead>
                                            <TableHead>Expiry Date</TableHead>
                                            <TableHead>Premium</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {policyProduct.policies.slice(0, 10).map((policy) => (
                                            <TableRow key={policy.id}>
                                                <TableCell>
                                                    <code className="rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-800">
                                                        {policy.policy_number}
                                                    </code>
                                                </TableCell>
                                                <TableCell>{policy.customer_name}</TableCell>
                                                <TableCell>{formatDate(policy.effective_date)}</TableCell>
                                                <TableCell>{formatDate(policy.expiry_date)}</TableCell>
                                                <TableCell>{formatCurrency(policy.premium_amount, policyProduct.currency)}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            policy.status === 'active'
                                                                ? 'default'
                                                                : policy.status === 'expired'
                                                                  ? 'destructive'
                                                                  : 'secondary'
                                                        }
                                                    >
                                                        {policy.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {policyProduct.policies.length > 10 && (
                                    <div className="border-t p-4 text-center">
                                        <p className="text-sm text-gray-500">Showing 10 of {policyProduct.policies.length} policies</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <p className="text-gray-500">No policies have been issued using this product template yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Metadata */}
                <Card>
                    <CardHeader>
                        <CardTitle>Metadata</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Sort Order</label>
                                <p className="mt-1">{policyProduct.sort_order}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Created</label>
                                <p className="mt-1">{formatDate(policyProduct.created_at)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                                <p className="mt-1">{formatDate(policyProduct.updated_at)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
