import { ComparisonChart } from '@/components/reports/ComparisonChart';
import { DistributionChart } from '@/components/reports/DistributionChart';
import { ExportButton } from '@/components/reports/ExportButton';
import { KPICard } from '@/components/reports/KPICard';
import { PeriodSelector } from '@/components/reports/PeriodSelector';
import { TrendChart } from '@/components/reports/TrendChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Calendar, DollarSign, RefreshCw, Shield, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';

interface BusinessOverviewData {
    total_customers: number;
    active_policies: number;
    total_premium: number;
    total_commission: number;
    policy_renewals: number;
    policy_cancellations: number;
    debit_notes_issued: number;
    credit_notes_issued: number;
    outstanding_premiums: number;
}

interface PremiumTrend {
    date: string;
    premium: number;
    policies: number;
}

interface PolicyDistribution {
    name: string;
    count: number;
    premium: number;
}

interface Props {
    data: BusinessOverviewData;
    trends: {
        premium_trends: PremiumTrend[];
    };
    policyDistribution: PolicyDistribution[];
    period: string;
    startDate: string;
    endDate: string;
}

export default function BusinessOverview({ data, trends, policyDistribution, period, startDate, endDate }: Props) {
    const [selectedPeriod, setSelectedPeriod] = useState(period);
    const [isGenerating, setIsGenerating] = useState(false);

    const generateReport = () => {
        setIsGenerating(true);
        router.get(
            '/reports/business-overview',
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

    const renewalRate = data.active_policies > 0 ? ((data.policy_renewals / data.active_policies) * 100).toFixed(1) : '0';

    const cancellationRate = data.active_policies > 0 ? ((data.policy_cancellations / data.active_policies) * 100).toFixed(1) : '0';

    const kpiCards = [
        {
            title: 'Total Premium',
            value: formatCurrency(data.total_premium),
            icon: DollarSign,
            trend: {
                value: 12.5,
                isPositive: true,
                label: 'vs last period',
            },
        },
        {
            title: 'Active Policies',
            value: data.active_policies.toLocaleString(),
            icon: Shield,
            trend: {
                value: 8.2,
                isPositive: true,
                label: 'vs last period',
            },
        },
        {
            title: 'Total Customers',
            value: data.total_customers.toLocaleString(),
            icon: Users,
            trend: {
                value: 15.3,
                isPositive: true,
                label: 'vs last period',
            },
        },
        {
            title: 'Commission Earned',
            value: formatCurrency(data.total_commission),
            icon: TrendingUp,
            trend: {
                value: 6.7,
                isPositive: true,
                label: 'vs last period',
            },
        },
    ];

    const performanceMetrics = [
        {
            title: 'Renewal Rate',
            value: `${renewalRate}%`,
            subtitle: 'Policy renewals',
            status: 'success' as const,
        },
        {
            title: 'Cancellation Rate',
            value: `${cancellationRate}%`,
            subtitle: 'Policy cancellations',
            status: 'warning' as const,
        },
        {
            title: 'Outstanding Premiums',
            value: formatCurrency(data.outstanding_premiums),
            subtitle: 'Pending collection',
            status: 'error' as const,
        },
        {
            title: 'Financial Notes',
            value: `${data.debit_notes_issued + data.credit_notes_issued}`,
            subtitle: 'Issued this period',
            status: 'info' as const,
        },
    ];

    const distributionData = policyDistribution.map((item) => ({
        name: item.name,
        value: item.count,
    }));

    const premiumComparisonData = policyDistribution.map((item) => ({
        name: item.name,
        premium: item.premium,
        count: item.count,
    }));

    return (
        <AppLayout>
            <Head title="Business Overview" />

            <div className="flex-1 space-y-4 pt-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Business Overview</h2>
                        <p className="text-muted-foreground">Comprehensive overview of your insurance business performance</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>
                                {startDate} to {endDate}
                            </span>
                        </div>
                        <ExportButton reportType="business-overview" period={selectedPeriod} />
                    </div>
                </div>

                {/* Report Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <RefreshCw className="mr-2 h-5 w-5" />
                            Report Configuration
                        </CardTitle>
                        <CardDescription>Configure the reporting period and generate business overview report</CardDescription>
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

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {performanceMetrics.map((metric, index) => (
                        <KPICard key={index} title={metric.title} value={metric.value} subtitle={metric.subtitle} status={metric.status} />
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Premium Trends */}
                    <TrendChart
                        title="Premium Trends"
                        description="Premium collection over time"
                        data={trends.premium_trends.map((trend) => ({
                            date: trend.date,
                            value: trend.premium,
                        }))}
                        dataKey="value"
                        color="hsl(var(--chart-1))"
                    />

                    {/* Policy Distribution */}
                    <DistributionChart title="Policy Distribution" description="Policies by product type" data={distributionData} />
                </div>

                {/* Premium Comparison */}
                <ComparisonChart
                    title="Premium by Product"
                    description="Premium collection and policy count by product"
                    data={premiumComparisonData}
                    dataKeys={[
                        { key: 'premium', label: 'Premium (₦)', color: 'hsl(var(--chart-1))' },
                        { key: 'count', label: 'Policy Count', color: 'hsl(var(--chart-2))' },
                    ]}
                />

                {/* Summary Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Product Performance Summary</CardTitle>
                        <CardDescription>Detailed breakdown of product performance metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full table-auto">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-4 py-3 text-left">Product</th>
                                        <th className="px-4 py-3 text-right">Policies</th>
                                        <th className="px-4 py-3 text-right">Premium</th>
                                        <th className="px-4 py-3 text-right">Avg Premium</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {policyDistribution.map((product, index) => (
                                        <tr key={index} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium">{product.name}</td>
                                            <td className="px-4 py-3 text-right">{product.count.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right font-semibold text-green-600">{formatCurrency(product.premium)}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(product.premium / product.count)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
