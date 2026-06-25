import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { Customer, PolicyProduct } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Calendar, Edit, Eye, FileText, PlusCircle, Send, Shield, User } from 'lucide-react';
import { useState } from 'react';

interface InsuranceCompany {
    id: number;
    name: string;
}

interface PlacementMarket {
    id: number;
    insurance_company_id: number;
    participation_percentage: string | null;
    offered_rate: string | null;
    gross_premium: string | null;
    status: string;
    response_date: string | null;
    response_notes: string | null;
    insurer_reference: string | null;
    insurance_company: InsuranceCompany | null;
    brokerSlips: any[];
}

interface Quote {
    id: number;
    quote_number: string;
    status: string;
}

interface Policy {
    id: number;
    policy_number: string;
    status: string;
}

interface User {
    id: number;
    name: string;
}

interface Placement {
    id: number;
    placement_number: string;
    status: string;
    currency: string;
    total_sum_insured: number | null;
    proposed_start_date: string;
    proposed_end_date: string;
    notes: string | null;
    risk_details: Record<string, any> | null;
    created_at: string;
    customer: Customer | null;
    insured: Customer | null;
    policyProduct: (PolicyProduct & { policyClass?: { id: number; name: string } }) | null;
    markets: PlacementMarket[];
    createdBy: User | null;
    policy: Policy | null;
    brokerSlips: any[];
}

interface Props {
    placement: Placement;
}

const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    in_market: 'bg-blue-100 text-blue-800',
    accepted: 'bg-green-100 text-green-800',
    partially_accepted: 'bg-yellow-100 text-yellow-800',
    declined: 'bg-red-100 text-red-800',
    bound: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-slate-100 text-slate-800',
};

const marketStatusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    countered: 'bg-blue-100 text-blue-800',
    declined: 'bg-red-100 text-red-800',
    withdrawn: 'bg-gray-100 text-gray-800',
};

export default function Show({ placement }: Props) {
    const [activeTab, setActiveTab] = useState<'markets' | 'quotes' | 'policies'>('markets');

    const formatCurrency = (amount: number | null | undefined, currency = 'NGN') => {
        if (amount === null || amount === undefined) return '—';
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getCustomerDisplayName = (customer: Customer | null) => {
        if (!customer) return '—';
        if (customer.type === 'corporate') {
            return customer.company_name || `${customer.first_name} ${customer.last_name}`;
        }
        return `${customer.first_name} ${customer.last_name}`;
    };

    const handleSubmitToMarket = () => {
        if (confirm('Submit this placement to market?')) {
            router.post(route('placements.submit-to-market', placement.id), {}, {
                onSuccess: () => {
                    router.reload({ only: ['placement'] });
                },
            });
        }
    };

    const handleConvertToPolicy = () => {
        if (confirm('Convert this placement to a policy?')) {
            router.post(route('placements.convert-to-policy', placement.id), {});
        }
    };

    const handleDelete = () => {
        if (confirm(`Delete placement "${placement.placement_number}"?`)) {
            router.delete(route('placements.destroy', placement.id));
        }
    };

    const tabs = [
        { key: 'markets' as const, label: 'Markets', icon: <Send className="h-4 w-4" />, count: placement.markets?.length ?? 0 },
        { key: 'quotes' as const, label: 'Quotes', icon: <FileText className="h-4 w-4" />, count: 0 },
        { key: 'policies' as const, label: 'Policies', icon: <Shield className="h-4 w-4" />, count: placement.policy ? 1 : 0 },
    ];

    return (
        <AppLayout>
            <Head title={`Placement: ${placement.placement_number}`} />

            <div className="space-y-6">
                <div className="mb-4">
                    <Link href={route('placements.index')} className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Placements
                    </Link>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">{placement.placement_number}</h1>
                            <Badge className={`${statusColors[placement.status] || 'bg-gray-100 text-gray-800'}`}>
                                {placement.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                                Customer: <span className="font-medium">{getCustomerDisplayName(placement.customer)}</span>
                            </span>
                            {placement.policyProduct && (
                                <>
                                    <span>•</span>
                                    <span>
                                        Product: <span className="font-medium">{placement.policyProduct.name}</span>
                                    </span>
                                </>
                            )}
                            <span>•</span>
                            <span>Created: {formatDate(placement.created_at)}</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {(placement.status === 'draft' || placement.status === 'in_market') && (
                            <Link href={route('placements.edit', placement.id)}>
                                <Button variant="outline">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                        )}
                        {placement.status === 'draft' && (
                            <Button onClick={handleSubmitToMarket}>
                                <Send className="mr-2 h-4 w-4" />
                                Submit to Market
                            </Button>
                        )}
                        {(placement.status === 'accepted' || placement.status === 'bound') && (
                            <Button onClick={handleConvertToPolicy} className="bg-emerald-600 hover:bg-emerald-700">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Convert to Policy
                            </Button>
                        )}
                        {placement.status === 'draft' && (
                            <Button variant="outline" className="text-red-600" onClick={handleDelete}>
                                Delete
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Customer Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {placement.customer ? (
                                <>
                                    <div>
                                        <h4 className="font-medium text-gray-900">{getCustomerDisplayName(placement.customer)}</h4>
                                        <Badge variant="outline" className="mt-1">
                                            {placement.customer.type === 'corporate' ? 'Corporate' : 'Individual'}
                                        </Badge>
                                    </div>
                                    <div className="text-sm">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-gray-400" />
                                            <span>{placement.customer.email}</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-gray-500">No customer information</p>
                            )}

                            {placement.insured && placement.insured.id !== placement.customer?.id && (
                                <>
                                    <Separator />
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-600">Insured Party</h4>
                                        <p className="font-medium">{getCustomerDisplayName(placement.insured)}</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Placement Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {placement.policyProduct && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-600">Product</h4>
                                    <p className="font-medium">{placement.policyProduct.name}</p>
                                    {placement.policyProduct.policyClass && (
                                        <p className="text-sm text-gray-500">Class: {placement.policyProduct.policyClass.name}</p>
                                    )}
                                </div>
                            )}

                            <div>
                                <h4 className="text-sm font-medium text-gray-600">Coverage Period</h4>
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span>
                                        {formatDate(placement.proposed_start_date)} - {formatDate(placement.proposed_end_date)}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-600">Sum Insured</h4>
                                <p className="text-lg font-bold">{formatCurrency(placement.total_sum_insured, placement.currency)}</p>
                            </div>

                            {placement.createdBy && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-600">Created By</h4>
                                    <p className="text-sm">{placement.createdBy.name}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Notes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {placement.notes ? (
                                <p className="whitespace-pre-wrap text-sm text-gray-700">{placement.notes}</p>
                            ) : (
                                <p className="text-sm text-gray-400">No notes added.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="mt-3 flex gap-1 border-b">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                                        activeTab === tab.key
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800'
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span
                                            className={`ml-1 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                                                activeTab === tab.key ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </CardHeader>

                    <CardContent>
                        {activeTab === 'markets' && (
                            <>
                                {placement.markets.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-left text-gray-500">
                                                    <th className="pb-2 font-medium">Insurer</th>
                                                    <th className="pb-2 font-medium">Participation %</th>
                                                    <th className="pb-2 font-medium">Rate</th>
                                                    <th className="pb-2 font-medium">Gross Premium</th>
                                                    <th className="pb-2 font-medium">Status</th>
                                                    <th className="pb-2 font-medium">Response</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {placement.markets.map((market) => (
                                                    <tr key={market.id}>
                                                        <td className="py-3 font-medium">
                                                            {market.insurance_company?.name || '—'}
                                                        </td>
                                                        <td className="py-3">{market.participation_percentage ? `${market.participation_percentage}%` : '—'}</td>
                                                        <td className="py-3">{market.offered_rate ? `${market.offered_rate}%` : '—'}</td>
                                                        <td className="py-3">{formatCurrency(parseFloat(market.gross_premium || '0'), placement.currency)}</td>
                                                        <td className="py-3">
                                                            <Badge className={`${marketStatusColors[market.status] || 'bg-gray-100 text-gray-800'}`}>
                                                                {market.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-3">
                                                            <div className="max-w-xs">
                                                                {market.response_notes ? (
                                                                    <p className="truncate text-gray-600" title={market.response_notes}>
                                                                        {market.response_notes}
                                                                    </p>
                                                                ) : (
                                                                    <span className="text-gray-400">—</span>
                                                                )}
                                                                {market.response_date && (
                                                                    <p className="text-xs text-gray-400">{formatDateTime(market.response_date)}</p>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <Send className="mb-3 h-10 w-10 text-gray-300" />
                                        <p className="font-medium text-gray-500">No markets added yet</p>
                                        <p className="mt-1 text-sm text-gray-400">
                                            Add insurers to this placement before submitting to market.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === 'quotes' && (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <FileText className="mb-3 h-10 w-10 text-gray-300" />
                                <p className="font-medium text-gray-500">No quotes yet</p>
                                <p className="mt-1 text-sm text-gray-400">Quotes associated with this placement will appear here.</p>
                            </div>
                        )}

                        {activeTab === 'policies' && (
                            <>
                                {placement.policy ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <Shield className="mb-3 h-10 w-10 text-emerald-500" />
                                        <p className="font-medium text-gray-900">Converted to Policy</p>
                                        <Link href={route('policy-management.show', placement.policy.id)} className="mt-2">
                                            <Button variant="outline">
                                                <Eye className="mr-2 h-4 w-4" />
                                                View Policy: {placement.policy.policy_number}
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <Shield className="mb-3 h-10 w-10 text-gray-300" />
                                        <p className="font-medium text-gray-500">Not yet converted</p>
                                        <p className="mt-1 text-sm text-gray-400">
                                            Accept a market offer and convert this placement to a policy.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
