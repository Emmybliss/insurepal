import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Head } from '@inertiajs/react';
import { CheckCircle, Shield, XCircle } from 'lucide-react';

interface Customer {
    id: number;
    first_name: string;
    last_name: string;
    company_name?: string;
    email: string;
    type: 'individual' | 'corporate';
}

interface QuoteRisk {
    id: number;
    description: string;
    identifier?: string;
    location?: string;
    coverage_amount: number;
    rate: number;
    rate_basis: 'percentage' | 'per_mille' | 'fixed';
    premium: number;
}

interface QuoteClause {
    id: number;
    clause_type: string;
    title: string;
    content: string;
    is_standard: boolean;
}

interface QuoteVersion {
    id: number;
    version: number;
    created_at: string;
}

interface Quote {
    id: number;
    quote_number: string;
    version: number;
    status: string;
    currency: string;
    period_start?: string;
    period_end?: string;
    valid_until?: string;
    sum_insured: number;
    gross_premium: number;
    net_premium: number;
    created_at: string;
    issued_at?: string;

    customer?: Customer;
    risks: QuoteRisk[];
    clauses: QuoteClause[];
    versions: QuoteVersion[];
}

interface Props {
    quote: Quote;
    checksumValid: boolean | null;
    isBackfilled?: boolean;
}

const statusStyles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    pending_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    converted: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    expired: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
};

export default function Verify({ quote, checksumValid, isBackfilled = false }: Props) {
    const formatCurrency = (amount: number | string | null | undefined) => {
        const n = typeof amount === 'string' ? parseFloat(amount) : amount;
        const cur = quote.currency || 'NGN';
        if (n === null || n === undefined || isNaN(n)) return `${cur} 0.00`;
        return `${cur} ${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const customer = quote.customer;
    const customerName = customer
        ? customer.type === 'corporate'
            ? customer.company_name || `${customer.first_name || ''} ${customer.last_name || ''}`
            : `${customer.first_name || ''} ${customer.last_name || ''}`
        : '—';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Head title={`Verify Quote: ${quote.quote_number}`} />

            <div className="mx-auto max-w-4xl px-4 py-8">
                <div className="mb-8 flex items-center justify-center gap-3">
                    <img src="/images/insurepal-logo.png" alt="InsurePal" className="h-10 w-10 sm:h-12 sm:w-12" />
                    <span className="text-2xl font-bold tracking-tight">InsurePal</span>
                </div>

                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold tracking-tight">Customer Quote Verification</h1>
                    <p className="mt-1 text-muted-foreground">Digital Insurance Document Authenticity Check</p>
                </div>

                <div className="mb-8 flex justify-center">
                    {checksumValid === true && (
                        <div className="inline-flex items-center gap-3 rounded-full border border-green-200 bg-green-50 px-6 py-3 dark:border-green-800 dark:bg-green-900/20">
                            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                            <div className="text-left">
                                <p className="text-lg font-semibold text-green-800 dark:text-green-300">Valid Document</p>
                                <p className="text-sm text-green-600 dark:text-green-400">
                                    {isBackfilled
                                        ? 'Verification snapshot generated from current quote data'
                                        : 'Digital signature verified — quote contents have not been altered'}
                                </p>
                            </div>
                        </div>
                    )}
                    {checksumValid === false && (
                        <div className="inline-flex items-center gap-3 rounded-full border border-red-200 bg-red-50 px-6 py-3 dark:border-red-800 dark:bg-red-900/20">
                            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                            <div className="text-left">
                                <p className="text-lg font-semibold text-red-800 dark:text-red-300">Invalid Document</p>
                                <p className="text-sm text-red-600 dark:text-red-400">Checksum mismatch — document may have been modified</p>
                            </div>
                        </div>
                    )}
                    {checksumValid === null && (
                        <div className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-800">
                            <Shield className="h-8 w-8 text-gray-400" />
                            <div className="text-left">
                                <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">Verification Pending</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Quote snapshot baseline loaded for reference.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Quote Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-sm text-muted-foreground">Quote Number</p>
                                <p className="font-medium">{quote.quote_number}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Version</p>
                                <p className="font-medium">v{quote.version || 1}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge className={statusStyles[quote.status] || 'bg-gray-100 text-gray-800'}>
                                    {quote.status.replace(/_/g, ' ').toUpperCase()}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Valid Until</p>
                                <p className="font-medium text-blue-600">{formatDate(quote.valid_until)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Customer</p>
                                <p className="font-medium">{customerName}</p>
                                {customer?.email && <p className="text-sm text-muted-foreground">{customer.email}</p>}
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Sum Insured</p>
                                <p className="font-medium">{formatCurrency(quote.sum_insured)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Gross Premium</p>
                                <p className="font-medium">{formatCurrency(quote.gross_premium)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Net Amount Payable</p>
                                <p className="font-medium text-green-600">{formatCurrency(quote.net_premium)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {quote.risks && quote.risks.length > 0 && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>
                                Risk Schedule
                                <Badge variant="outline" className="ml-2">
                                    {quote.risks.length}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="px-6 pb-3 font-medium">#</th>
                                            <th className="px-6 pb-3 font-medium">Description</th>
                                            <th className="px-6 pb-3 text-right font-medium">Sum Insured</th>
                                            <th className="px-6 pb-3 text-right font-medium">Rate</th>
                                            <th className="px-6 pb-3 text-right font-medium">Premium</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {quote.risks.map((item, idx) => (
                                            <tr key={item.id} className="hover:bg-muted/30">
                                                <td className="px-6 py-3 text-muted-foreground">{idx + 1}</td>
                                                <td className="px-6 py-3 font-medium">{item.description}</td>
                                                <td className="px-6 py-3 text-right">{formatCurrency(item.coverage_amount)}</td>
                                                <td className="px-6 py-3 text-right">{item.rate ? `${item.rate}%` : '—'}</td>
                                                <td className="px-6 py-3 text-right font-medium">{formatCurrency(item.premium)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="mt-12 border-t pt-6 text-center">
                    <p className="text-sm text-muted-foreground">This is an official insurance quote issued by InsurePal</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Quote #{quote.quote_number} · v{quote.version} · {formatDate(quote.created_at)}
                    </p>
                </div>
            </div>
        </div>
    );
}
