import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Calculator, Edit, FileText, Shield, Users } from 'lucide-react';

interface PolicyType {
    id: number;
    name: string;
    code: string;
}
interface PolicyClass {
    id: number;
    name: string;
    code: string;
}
interface Tenant {
    id: number;
    name: string;
    type: string;
}

interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
}

interface Quote {
    id: number;
    quote_number: string;
    status: string;
    premium: number;
    customer: Customer;
    created_at: string;
}

interface Policy {
    id: number;
    tenant_id: number | null;
    policy_type_id: number;
    policy_class_id: number;
    name: string;
    code: string;
    description: string | null;
    is_active: boolean;
    base_premium: number;
    commission_rate: number;
    default_coverage_period: number;
    min_sum_assured: number;
    max_sum_assured: number | null;
    requires_underwriting: boolean;
    requires_medical_exam: boolean;
    currency: string;
    sort_order: number;
    created_at: string;
    updated_at: string;
    policy_type: PolicyType;
    policy_class: PolicyClass;
    tenant?: Tenant;
    quotes?: Quote[];
}

interface Props {
    policy: Policy;
}

export default function Show({ policy }: Props) {
    const formatCurrency = (amount: number) => {
        const symbols = { NGN: '₦', USD: '$', EUR: '€', GBP: '£' };
        const symbol = symbols[policy.currency as keyof typeof symbols] || policy.currency;
        return `${symbol}${amount?.toLocaleString()}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString)?.toLocaleDateString();
    };

    const getStatusBadge = (status: boolean) => {
        return status ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
                Active
            </Badge>
        ) : (
            <Badge variant="secondary" className="bg-red-100 text-red-800">
                Inactive
            </Badge>
        );
    };

    const getQuoteStatusBadge = (status: string) => {
        const variants = {
            draft: 'secondary',
            pending: 'default',
            approved: 'default',
            rejected: 'destructive',
            expired: 'outline',
        };

        return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
    };

    return (
        <AppLayout>
            <Head title={`Policy: ${policy.name}`} />
            <div className="space-y-6">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <div className="flex-col items-center gap-3">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-gray-900">{policy.name}</h1>
                                {getStatusBadge(policy.is_active)}
                            </div>
                            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                                <span>
                                    Code: <span className="font-mono font-medium">{policy.code}</span>
                                </span>
                                <span>•</span>
                                <span>Created: {formatDate(policy.created_at)}</span>
                                <span>•</span>
                                <span>Updated: {formatDate(policy.updated_at)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex justify-center">
                        <div className="flex gap-4">
                            <Link href={route('admin.policies.edit', policy.id)}>
                                <Button>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Policy
                                </Button>
                            </Link>
                            <Button variant="outline" onClick={() => window.print()}>
                                <FileText className="mr-2 h-4 w-4" />
                                Print Details
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Policy Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-medium text-gray-900">Policy Hierarchy</h4>
                                <div className="mt-2 text-sm text-gray-600">
                                    <div>
                                        Type: <span className="font-medium">{policy.policy_type.name}</span>
                                    </div>
                                    <div>
                                        Class: <span className="font-medium">{policy.policy_class.name}</span>
                                    </div>
                                </div>
                            </div>

                            {policy.description && (
                                <div>
                                    <h4 className="font-medium text-gray-900">Description</h4>
                                    <p className="mt-1 text-sm text-gray-600">{policy.description}</p>
                                </div>
                            )}

                            {policy.tenant && (
                                <div>
                                    <h4 className="font-medium text-gray-900">Tenant</h4>
                                    <div className="mt-1 text-sm text-gray-600">
                                        <span className="font-medium">{policy.tenant.name}</span>
                                        <Badge variant="outline" className="ml-2">
                                            {policy.tenant.type.charAt(0).toUpperCase() + policy.tenant.type.slice(1)}
                                        </Badge>
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="font-medium text-gray-900">Sort Order</h4>
                                <p className="mt-1 text-sm text-gray-600">{policy.sort_order}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calculator className="h-5 w-5" />
                                Pricing & Coverage
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-medium text-gray-900">Base Premium</h4>
                                    <p className="mt-1 text-lg font-semibold text-green-600">{formatCurrency(policy.base_premium)}</p>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900">Commission Rate</h4>
                                    <p className="mt-1 text-lg font-semibold text-blue-600">{policy.commission_rate}%</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-900">Sum Assured Range</h4>
                                <div className="mt-1 text-sm text-gray-600">
                                    <div>
                                        Minimum: <span className="font-medium">{formatCurrency(policy.min_sum_assured)}</span>
                                    </div>
                                    <div>
                                        Maximum:{' '}
                                        <span className="font-medium">
                                            {policy.max_sum_assured ? formatCurrency(policy.max_sum_assured) : 'No limit'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-900">Coverage Period</h4>
                                <p className="mt-1 text-sm text-gray-600">
                                    {policy.default_coverage_period} days ({Math.round((policy.default_coverage_period / 365) * 10) / 10} years)
                                </p>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-900">Currency</h4>
                                <p className="mt-1 text-sm text-gray-600">{policy.currency}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Requirements */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Policy Requirements
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Requires Underwriting</span>
                                {policy.requires_underwriting ? (
                                    <Badge variant="default" className="bg-orange-100 text-orange-800">
                                        Required
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                                        Not Required
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Requires Medical Exam</span>
                                {policy.requires_medical_exam ? (
                                    <Badge variant="default" className="bg-purple-100 text-purple-800">
                                        Required
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                                        Not Required
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Quotes */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Recent Quotes
                                {policy.quotes && policy.quotes.length > 0 && <Badge variant="outline">{policy.quotes.length}</Badge>}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {policy.quotes && policy.quotes.length > 0 ? (
                                <div className="space-y-3">
                                    {policy.quotes.slice(0, 5).map((quote) => (
                                        <div key={quote.id} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sm">{quote.quote_number}</span>
                                                    {getQuoteStatusBadge(quote.status)}
                                                </div>
                                                <div className="text-xs text-gray-600">
                                                    {quote.customer.name} • {formatDate(quote.created_at)}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold text-green-600">{formatCurrency(quote.premium)}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {policy.quotes.length > 5 && (
                                        <div className="pt-2 text-center">
                                            <Button variant="outline" size="sm">
                                                View All {policy.quotes.length} Quotes
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-6 text-center">
                                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                                    <p className="mt-2 text-sm text-gray-600">No quotes found for this policy</p>
                                    <p className="text-xs text-gray-500">Quotes will appear here once customers request them</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
