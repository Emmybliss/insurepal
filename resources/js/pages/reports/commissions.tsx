import { ExportButton } from '@/components/reports/ExportButton';
import { KPICard } from '@/components/reports/KPICard';
import { PeriodSelector } from '@/components/reports/PeriodSelector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Calendar, RefreshCw, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useState } from 'react';

interface CommissionEntry {
    id: number;
    transaction_type: string;
    amount: number;
    posting_date: string;
    description: string | null;
    reference_type: string | null;
    reference_id: number | null;
    policy: {
        id: number;
        policy_number: string;
        premium_amount: number;
    } | null;
    created_at: string;
}

interface BreakdownItem {
    transaction_type: string;
    total: number;
    count: number;
}

interface Props {
    entries: CommissionEntry[];
    breakdown: BreakdownItem[];
    summary: {
        gross_commission: number;
        net_commission: number;
        total_entries: number;
        cancellations: number;
        credit_notes: number;
        debit_notes: number;
    };
    period: string;
    startDate: string;
    endDate: string;
}

const TYPE_LABELS: Record<string, string> = {
    policy: 'Policy',
    renewal: 'Renewal',
    credit_note: 'Credit Note',
    debit_note: 'Debit Note',
    endorsement: 'Endorsement',
    cancellation: 'Cancellation',
    reversal: 'Reversal',
    manual_adjustment: 'Manual Adjustment',
};

const TYPE_COLORS: Record<string, string> = {
    policy: 'bg-green-100 text-green-800',
    renewal: 'bg-blue-100 text-blue-800',
    credit_note: 'bg-red-100 text-red-800',
    debit_note: 'bg-green-100 text-green-800',
    endorsement: 'bg-yellow-100 text-yellow-800',
    cancellation: 'bg-red-100 text-red-800',
    reversal: 'bg-gray-100 text-gray-800',
    manual_adjustment: 'bg-purple-100 text-purple-800',
};

function getTypeColor(type: string): string {
    return TYPE_COLORS[type] ?? 'bg-gray-100 text-gray-800';
}

function getTypeLabel(type: string): string {
    return TYPE_LABELS[type] ?? type.replace(/_/g, ' ');
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 2,
    }).format(amount);
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export default function Commissions({ entries, breakdown, summary, period, startDate, endDate }: Props) {
    const [selectedPeriod, setSelectedPeriod] = useState(period);
    const [isGenerating, setIsGenerating] = useState(false);

    const generateReport = () => {
        setIsGenerating(true);
        router.get(
            '/reports/commissions',
            {
                period: selectedPeriod,
            },
            {
                onFinish: () => setIsGenerating(false),
                preserveState: true,
            },
        );
    };

    const kpiCards = [
        {
            title: 'Gross Commission',
            value: formatCurrency(summary.gross_commission),
            icon: TrendingUp,
        },
        {
            title: 'Net Commission',
            value: formatCurrency(summary.net_commission),
            icon: Wallet,
        },
        {
            title: 'Total Entries',
            value: summary.total_entries.toLocaleString(),
            icon: TrendingUp,
        },
        {
            title: 'Cancellations',
            value: formatCurrency(summary.cancellations),
            icon: TrendingDown,
        },
    ];

    return (
        <AppLayout>
            <Head title="Commission Reports" />

            <div className="flex-1 space-y-4 pt-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Commission Reports</h2>
                        <p className="text-muted-foreground">Commission ledger breakdown and transaction history</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>
                                {startDate} to {endDate}
                            </span>
                        </div>
                        <ExportButton reportType="commissions" period={selectedPeriod} />
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <RefreshCw className="mr-2 h-5 w-5" />
                            Report Configuration
                        </CardTitle>
                        <CardDescription>Configure the reporting period and generate commission report</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <PeriodSelector value={selectedPeriod} onChange={setSelectedPeriod} className="flex-1" />
                            <Button onClick={generateReport} disabled={isGenerating}>
                                {isGenerating ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Generate Report
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {kpiCards.map((kpi, index) => (
                        <KPICard key={index} title={kpi.title} value={kpi.value} icon={kpi.icon} />
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaction Type Breakdown</CardTitle>
                            <CardDescription>Commission entries grouped by transaction type</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {breakdown.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge className={getTypeColor(item.transaction_type)}>{getTypeLabel(item.transaction_type)}</Badge>
                                            <span className="text-sm text-muted-foreground">({item.count})</span>
                                        </div>
                                        <span className={`font-semibold ${item.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(item.total)}
                                        </span>
                                    </div>
                                ))}
                                {breakdown.length === 0 && <p className="text-sm text-muted-foreground">No entries for this period.</p>}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Credit & Debit Notes</CardTitle>
                            <CardDescription>Commission adjustments from financial notes</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Credit Notes (reductions)</span>
                                    <span className="font-semibold text-red-600">{formatCurrency(summary.credit_notes)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Debit Notes (additions)</span>
                                    <span className="font-semibold text-green-600">{formatCurrency(summary.debit_notes)}</span>
                                </div>
                                <div className="flex items-center justify-between border-t pt-2">
                                    <span className="text-sm font-medium">Net Adjustment</span>
                                    <span
                                        className={`font-semibold ${summary.debit_notes + summary.credit_notes >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                    >
                                        {formatCurrency(summary.debit_notes + summary.credit_notes)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Commission Ledger</CardTitle>
                        <CardDescription>Detailed commission entry history</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full table-auto">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-4 py-3 text-left">Date</th>
                                        <th className="px-4 py-3 text-left">Policy</th>
                                        <th className="px-4 py-3 text-left">Type</th>
                                        <th className="px-4 py-3 text-right">Amount</th>
                                        <th className="px-4 py-3 text-left">Reference</th>
                                        <th className="px-4 py-3 text-left">Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map((entry) => (
                                        <tr key={entry.id} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDate(entry.posting_date)}</td>
                                            <td className="px-4 py-3 text-sm font-medium">{entry.policy?.policy_number ?? '—'}</td>
                                            <td className="px-4 py-3">
                                                <Badge className={getTypeColor(entry.transaction_type)}>{getTypeLabel(entry.transaction_type)}</Badge>
                                            </td>
                                            <td
                                                className={`px-4 py-3 text-right font-semibold ${entry.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                            >
                                                {formatCurrency(entry.amount)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {entry.reference_type ? `${entry.reference_type}#${entry.reference_id}` : '—'}
                                            </td>
                                            <td className="max-w-xs truncate px-4 py-3 text-sm text-muted-foreground">{entry.description ?? '—'}</td>
                                        </tr>
                                    ))}
                                    {entries.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                                                No commission entries found for this period.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
