import { ComparisonChart } from '@/components/reports/ComparisonChart';
import { DistributionChart } from '@/components/reports/DistributionChart';
import { ExportButton } from '@/components/reports/ExportButton';
import { KPICard } from '@/components/reports/KPICard';
import { PeriodSelector } from '@/components/reports/PeriodSelector';
import { TrendChart } from '@/components/reports/TrendChart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, Calendar, CheckCircle, Clock, RefreshCw, TrendingDown, TrendingUp, XCircle } from 'lucide-react';
import { useState } from 'react';

interface ClaimsAnalyticsData {
    total_claims: number;
    settled_claims: number;
    pending_claims: number;
    rejected_claims: number;
    settlement_ratio: number;
    average_claim_amount: number;
    total_claim_amount: number;
    total_settled_amount: number;
}

interface ClaimsByType {
    claim_type: string;
    count: number;
    total_amount: number;
}

interface ClaimsTrend {
    date: string;
    claims: number;
    amount: number;
}

interface Props {
    data: ClaimsAnalyticsData;
    claimsByType: ClaimsByType[];
    trends: {
        premium_trends: ClaimsTrend[];
    };
    period: string;
    startDate: string;
    endDate: string;
}

export default function ClaimsAnalytics({ data, claimsByType, trends, period, startDate, endDate }: Props) {
    const [selectedPeriod, setSelectedPeriod] = useState(period);
    const [isGenerating, setIsGenerating] = useState(false);

    const generateReport = () => {
        setIsGenerating(true);
        router.get(
            '/reports/claims-analytics',
            {
                period: selectedPeriod,
            },
            {
                onFinish: () => setIsGenerating(false),
                preserveState: true,
            },
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const kpiCards = [
        {
            title: 'Total Claims',
            value: data.total_claims.toLocaleString(),
            icon: AlertTriangle,
            trend: {
                value: 5.2,
                isPositive: false,
                label: 'vs last period',
            },
        },
        {
            title: 'Settlement Ratio',
            value: `${data.settlement_ratio.toFixed(1)}%`,
            icon: CheckCircle,
            trend: {
                value: 2.1,
                isPositive: true,
                label: 'vs last period',
            },
        },
        {
            title: 'Average Claim Amount',
            value: formatCurrency(data.average_claim_amount),
            icon: TrendingUp,
            trend: {
                value: 8.7,
                isPositive: false,
                label: 'vs last period',
            },
        },
        {
            title: 'Total Settled Amount',
            value: formatCurrency(data.total_settled_amount),
            icon: CheckCircle,
            trend: {
                value: 12.3,
                isPositive: true,
                label: 'vs last period',
            },
        },
    ];

    const statusCards = [
        {
            title: 'Settled Claims',
            value: data.settled_claims.toLocaleString(),
            subtitle: `${((data.settled_claims / data.total_claims) * 100).toFixed(1)}% of total`,
            status: 'success' as const,
            icon: CheckCircle,
        },
        {
            title: 'Pending Claims',
            value: data.pending_claims.toLocaleString(),
            subtitle: 'Awaiting review',
            status: 'warning' as const,
            icon: Clock,
        },
        {
            title: 'Rejected Claims',
            value: data.rejected_claims.toLocaleString(),
            subtitle: `${((data.rejected_claims / data.total_claims) * 100).toFixed(1)}% of total`,
            status: 'error' as const,
            icon: XCircle,
        },
    ];

    const claimsByTypeData = claimsByType.map((claim) => ({
        name: claim.claim_type.charAt(0).toUpperCase() + claim.claim_type.slice(1),
        value: claim.count,
    }));

    const claimsAmountData = claimsByType.map((claim) => ({
        name: claim.claim_type.charAt(0).toUpperCase() + claim.claim_type.slice(1),
        count: claim.count,
        amount: claim.total_amount,
    }));

    const claimsTrendData = trends.premium_trends.map((trend) => ({
        date: trend.date,
        claims: trend.claims,
        amount: trend.amount,
    }));

    return (
        <AppLayout>
            <Head title="Claims Analytics" />

            <div className="flex-1 space-y-4 pt-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Claims Analytics</h2>
                        <p className="text-muted-foreground">Comprehensive analysis of claims processing and settlement metrics</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>
                                {startDate} to {endDate}
                            </span>
                        </div>
                        <ExportButton reportType="claims-analytics" period={selectedPeriod} />
                    </div>
                </div>

                {/* Report Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <RefreshCw className="mr-2 h-5 w-5" />
                            Report Configuration
                        </CardTitle>
                        <CardDescription>Configure the reporting period and generate claims analytics report</CardDescription>
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

                {/* Key Performance Indicators */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {kpiCards.map((kpi, index) => (
                        <KPICard key={index} title={kpi.title} value={kpi.value} icon={kpi.icon} trend={kpi.trend} />
                    ))}
                </div>

                {/* Claims Status Overview */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {statusCards.map((status, index) => (
                        <KPICard
                            key={index}
                            title={status.title}
                            value={status.value}
                            subtitle={status.subtitle}
                            status={status.status}
                            icon={status.icon}
                        />
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Claims Trends */}
                    <TrendChart
                        title="Claims Trends"
                        description="Claims volume and amount over time"
                        data={claimsTrendData.map((trend) => ({
                            date: trend.date,
                            value: trend.claims,
                        }))}
                        dataKey="value"
                        color="hsl(var(--chart-1))"
                    />

                    {/* Claims by Type */}
                    <DistributionChart title="Claims by Type" description="Distribution of claims by type" data={claimsByTypeData} />
                </div>

                {/* Claims Amount Comparison */}
                <ComparisonChart
                    title="Claims Amount by Type"
                    description="Claim count and total amount by type"
                    data={claimsAmountData}
                    dataKeys={[
                        { key: 'count', label: 'Claim Count', color: 'hsl(var(--chart-1))' },
                        { key: 'amount', label: 'Total Amount (₦)', color: 'hsl(var(--chart-2))' },
                    ]}
                />

                {/* Claims Summary Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Claims Summary by Type</CardTitle>
                        <CardDescription>Detailed breakdown of claims by type and status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full table-auto">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-4 py-3 text-left">Claim Type</th>
                                        <th className="px-4 py-3 text-right">Count</th>
                                        <th className="px-4 py-3 text-right">Total Amount</th>
                                        <th className="px-4 py-3 text-right">Average Amount</th>
                                        <th className="px-4 py-3 text-right">% of Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {claimsByType.map((claim, index) => (
                                        <tr key={index} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className="capitalize">
                                                    {claim.claim_type}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold">{claim.count.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right font-semibold text-green-600">
                                                {formatCurrency(claim.total_amount)}
                                            </td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(claim.total_amount / claim.count)}</td>
                                            <td className="px-4 py-3 text-right">{((claim.count / data.total_claims) * 100).toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Processing Efficiency Metrics */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
                                Processing Efficiency
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Settlement Rate</span>
                                    <span className="font-semibold">{data.settlement_ratio.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Avg Processing Time</span>
                                    <span className="font-semibold">7.2 days</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Rejection Rate</span>
                                    <span className="font-semibold text-red-600">
                                        {((data.rejected_claims / data.total_claims) * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <TrendingDown className="mr-2 h-5 w-5 text-red-600" />
                                Risk Indicators
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">High Value Claims</span>
                                    <span className="font-semibold">12</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Fraud Indicators</span>
                                    <span className="font-semibold text-yellow-600">3</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Outstanding Claims</span>
                                    <span className="font-semibold">{data.pending_claims}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <CheckCircle className="mr-2 h-5 w-5 text-blue-600" />
                                Quality Metrics
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">First Pass Rate</span>
                                    <span className="font-semibold text-green-600">85.2%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Customer Satisfaction</span>
                                    <span className="font-semibold text-green-600">4.2/5</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Appeal Rate</span>
                                    <span className="font-semibold text-blue-600">8.1%</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
