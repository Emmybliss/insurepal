import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Head } from '@inertiajs/react';
import { CheckCircle, Shield, XCircle } from 'lucide-react';
import React from 'react';

interface Customer {
    id: number;
    first_name: string;
    last_name: string;
    company_name?: string;
    email: string;
    type: 'individual' | 'corporate';
}

interface InsuranceCompany {
    id: number;
    name: string;
}

interface BrokerSlipItem {
    id: number;
    item_type: string;
    description: string;
    identifier?: string;
    location?: string;
    quantity?: number;
    sum_insured: number;
    rate: number;
    rate_basis: 'percentage' | 'per_mille' | 'fixed';
    premium: number;
    sort_order: number;
}

interface BrokerSlipClause {
    id: number;
    clause_type: string;
    title: string;
    content: string;
    is_standard: boolean;
    sort_order: number;
}

interface BrokerSlipVersion {
    id: number;
    version: number;
    created_at: string;
}

interface BrokerSlip {
    id: number;
    slip_number: string;
    version: number;
    status: string;
    currency: string;
    sum_insured: number;
    rate: number;
    rate_basis: string;
    gross_premium: number;
    net_premium: number;
    period_start: string;
    period_end: string;
    created_at: string;
    issued_at?: string;

    placement: {
        placement_number: string;
        customer: Customer;
    };
    placement_market?: {
        insurance_company: InsuranceCompany;
    };
    items: BrokerSlipItem[];
    clauses: BrokerSlipClause[];
    versions: BrokerSlipVersion[];
}

interface Props {
    brokerSlip: BrokerSlip;
    checksumValid: boolean | null;
}

const statusStyles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    pending_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    changes_requested: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    issued: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    superseded: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    withdrawn: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
};

export default function Verify({ brokerSlip, checksumValid }: Props) {
    const formatCurrency = (amount: number | string | null | undefined) => {
        const n = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (n === null || n === undefined || isNaN(n)) return '—';
        return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const customer = brokerSlip.placement?.customer;
    const customerName = customer
        ? customer.type === 'corporate'
            ? customer.company_name || `${customer.first_name} ${customer.last_name}`
            : `${customer.first_name} ${customer.last_name}`
        : '—';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Head title={`Verify: ${brokerSlip.slip_number}`} />

            <div className="mx-auto max-w-4xl px-4 py-8">
                <div className="mb-8 flex items-center justify-center gap-3">
                    <img
                        src="/images/insurepal-logo.png"
                        alt="InsurePal"
                        className="h-10 w-10 sm:h-12 sm:w-12"
                    />
                    <span className="text-2xl font-bold tracking-tight">InsurePal</span>
                </div>

                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold tracking-tight">Document Verification</h1>
                    <p className="mt-1 text-muted-foreground">Broker Slip Authenticity Check</p>
                </div>

                <div className="mb-8 flex justify-center">
                    {checksumValid === true && (
                        <div className="inline-flex items-center gap-3 rounded-full border border-green-200 bg-green-50 px-6 py-3 dark:border-green-800 dark:bg-green-900/20">
                            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                            <div className="text-left">
                                <p className="text-lg font-semibold text-green-800 dark:text-green-300">Valid Document</p>
                                <p className="text-sm text-green-600 dark:text-green-400">Digital signature verified — content has not been altered</p>
                            </div>
                        </div>
                    )}
                    {checksumValid === false && (
                        <div className="inline-flex items-center gap-3 rounded-full border border-red-200 bg-red-50 px-6 py-3 dark:border-red-800 dark:bg-red-900/20">
                            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                            <div className="text-left">
                                <p className="text-lg font-semibold text-red-800 dark:text-red-300">Invalid Document</p>
                                <p className="text-sm text-red-600 dark:text-red-400">Checksum mismatch — content may have been tampered with</p>
                            </div>
                        </div>
                    )}
                    {checksumValid === null && (
                        <div className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-800">
                            <Shield className="h-8 w-8 text-gray-400" />
                            <div className="text-left">
                                <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">Verification Not Available</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">No digital snapshot exists for this document version</p>
                            </div>
                        </div>
                    )}
                </div>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Document Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-sm text-muted-foreground">Slip Number</p>
                                <p className="font-medium">{brokerSlip.slip_number}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Version</p>
                                <p className="font-medium">{brokerSlip.version}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge className={statusStyles[brokerSlip.status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}>
                                    {brokerSlip.status.replace(/_/g, ' ').toUpperCase()}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Issue Date</p>
                                <p className="font-medium">{formatDate(brokerSlip.issued_at || brokerSlip.created_at)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Insured / Customer</p>
                                <p className="font-medium">{customerName}</p>
                                {customer?.email && <p className="text-sm text-muted-foreground">{customer.email}</p>}
                            </div>
                            {brokerSlip.placement_market?.insurance_company && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Insurer</p>
                                    <p className="font-medium">{brokerSlip.placement_market.insurance_company.name}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-muted-foreground">Gross Premium</p>
                                <p className="font-medium">{formatCurrency(brokerSlip.gross_premium)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Net Premium</p>
                                <p className="font-medium">{formatCurrency(brokerSlip.net_premium)}</p>
                            </div>
                            {brokerSlip.period_start && (
                                <div className="sm:col-span-2">
                                    <p className="text-sm text-muted-foreground">Coverage Period</p>
                                    <p className="font-medium">{formatDate(brokerSlip.period_start)} — {formatDate(brokerSlip.period_end)}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {brokerSlip.items && brokerSlip.items.length > 0 && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>
                                Items
                                <Badge variant="outline" className="ml-2">{brokerSlip.items.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="px-6 pb-3 font-medium">#</th>
                                            <th className="px-6 pb-3 font-medium">Description</th>
                                            <th className="px-6 pb-3 font-medium text-right">Sum Insured</th>
                                            <th className="px-6 pb-3 font-medium text-right">Rate</th>
                                            <th className="px-6 pb-3 font-medium text-right">Premium</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {brokerSlip.items.map((item, idx) => (
                                            <tr key={item.id} className="hover:bg-muted/30">
                                                <td className="px-6 py-3 text-muted-foreground">{idx + 1}</td>
                                                <td className="px-6 py-3">
                                                    <p className="font-medium">{item.description}</p>
                                                    {item.item_type && (
                                                        <p className="text-xs text-muted-foreground capitalize">{item.item_type.replace(/_/g, ' ')}</p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 text-right">{formatCurrency(item.sum_insured)}</td>
                                                <td className="px-6 py-3 text-right">{item.rate ?? '—'}</td>
                                                <td className="px-6 py-3 text-right font-medium">{formatCurrency(item.premium)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {brokerSlip.clauses && brokerSlip.clauses.length > 0 && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>
                                Clauses
                                <Badge variant="outline" className="ml-2">{brokerSlip.clauses.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {brokerSlip.clauses.map((clause) => (
                                <div key={clause.id} className="rounded-lg border p-4">
                                    <div className="mb-1 flex items-center gap-2">
                                        <p className="font-medium text-sm">{clause.title}</p>
                                        {clause.clause_type && (
                                            <Badge variant="outline" className="text-xs capitalize">
                                                {clause.clause_type.replace(/_/g, ' ')}
                                            </Badge>
                                        )}
                                        {clause.is_standard && (
                                            <span className="text-xs text-muted-foreground">Standard</span>
                                        )}
                                    </div>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{clause.content}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {brokerSlip.versions && brokerSlip.versions.length > 0 && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>
                                Version History
                                <Badge variant="outline" className="ml-2">{brokerSlip.versions.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {brokerSlip.versions.map((ver) => (
                                    <div key={ver.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                                        <p className="text-sm font-medium">Version {ver.version}</p>
                                        <p className="text-sm text-muted-foreground">{formatDate(ver.created_at)}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="mt-12 border-t pt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        This is a digitally verified document issued by InsurePal
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Slip #{brokerSlip.slip_number} · v{brokerSlip.version} · {formatDate(brokerSlip.created_at)}
                    </p>
                </div>
            </div>
        </div>
    );
}
