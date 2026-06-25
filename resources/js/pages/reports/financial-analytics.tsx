import { ComparisonChart } from '@/components/reports/ComparisonChart';
import { ExportButton } from '@/components/reports/ExportButton';
import { KPICard } from '@/components/reports/KPICard';
import { PeriodSelector } from '@/components/reports/PeriodSelector';
import { TrendChart } from '@/components/reports/TrendChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Calendar, DollarSign, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface FinancialAnalyticsData {
    total_revenue: number;
    total_expenses: number;
    net_profit: number;
    loss_ratio: number;
    expense_ratio: number;
    combined_ratio: number;
    profit_margin: number;
}

interface FinancialTrend {
    date: string;
    revenue: number;
    expenses: number;
    profit: number;
}

interface Props {
    data: FinancialAnalyticsData;
    trends: {
        premium_trends: FinancialTrend[];
    };
    period: string;
    startDate: string;
    endDate: string;
}

export default function FinancialAnalytics({ data, trends, period, startDate, endDate }: Props) {
    const [selectedPeriod, setSelectedPeriod] = useState(period);
    const [isGenerating, setIsGenerating] = useState(false);

    const generateReport = () => {
        setIsGenerating(true);
        router.get(
            '/reports/financial-analytics',
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
            title: 'Total Revenue',
            value: formatCurrency(data.total_revenue),
            icon: DollarSign,
            trend: {
                value: 15.2,
                isPositive: true,
                label: 'vs last period',
            },
        },
        {
            title: 'Net Profit',
            value: formatCurrency(data.net_profit),
            icon: TrendingUp,
            trend: {
                value: 8.7,
                isPositive: data.net_profit > 0,
                label: 'vs last period',
            },
        },
        {
            title: 'Loss Ratio',
            value: `${data.loss_ratio.toFixed(1)}%`,
            icon: TrendingDown,
            trend: {
                value: -2.3,
                isPositive: true,
                label: 'vs last period',
            },
        },
        {
            title: 'Combined Ratio',
            value: `${data.combined_ratio.toFixed(1)}%`,
            icon: TrendingUp,
            trend: {
                value: -1.8,
                isPositive: true,
                label: 'vs last period',
            },
        },
    ];

    const financialMetrics = [
        {
            title: 'Profit Margin',
            value: `${data.profit_margin.toFixed(1)}%`,
            subtitle: 'Net profit as % of revenue',
            status: data.profit_margin > 10 ? 'success' : data.profit_margin > 5 ? 'warning' : 'error',
        },
        {
            title: 'Expense Ratio',
            value: `${data.expense_ratio.toFixed(1)}%`,
            subtitle: 'Operating expenses as % of revenue',
            status: data.expense_ratio < 20 ? 'success' : data.expense_ratio < 30 ? 'warning' : 'error',
        },
        {
            title: 'Total Expenses',
            value: formatCurrency(data.total_expenses),
            subtitle: 'Operating and claims expenses',
            status: 'info',
        },
    ];

    const revenueTrendData = trends.premium_trends.map((trend) => ({
        date: trend.date,
        revenue: trend.revenue,
        expenses: trend.expenses,
        profit: trend.profit,
    }));

    const ratioComparisonData = [
        { name: 'Loss Ratio', value: data.loss_ratio, target: 60 },
        { name: 'Expense Ratio', value: data.expense_ratio, target: 25 },
        { name: 'Combined Ratio', value: data.combined_ratio, target: 85 },
    ];

    return (
        <AppLayout>
            <Head title="Financial Analytics" />

            <div className="flex-1 space-y-4 pt-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Financial Analytics</h2>
                        <p className="text-muted-foreground">Revenue trends, expense ratios, and profitability analysis</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>
                                {startDate} to {endDate}
                            </span>
                        </div>
                        <ExportButton reportType="financial-analytics" period={selectedPeriod} />
                    </div>
                </div>

                {/* Report Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <RefreshCw className="mr-2 h-5 w-5" />
                            Report Configuration
                        </CardTitle>
                        <CardDescription>Configure the reporting period and generate financial analytics report</CardDescription>
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

                {/* Financial Metrics */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {financialMetrics.map((metric, index) => (
                        <KPICard key={index} title={metric.title} value={metric.value} subtitle={metric.subtitle} status={metric.status} />
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Revenue vs Expenses Trend */}
                    <TrendChart
                        title="Revenue vs Expenses Trend"
                        description="Revenue and expense trends over time"
                        data={revenueTrendData.map((trend) => ({
                            date: trend.date,
                            value: trend.revenue,
                        }))}
                        dataKey="value"
                        color="hsl(var(--chart-1))"
                    />

                    {/* Profitability Trend */}
                    <TrendChart
                        title="Profitability Trend"
                        description="Net profit over time"
                        data={revenueTrendData.map((trend) => ({
                            date: trend.date,
                            value: trend.profit,
                        }))}
                        dataKey="value"
                        color="hsl(var(--chart-2))"
                    />
                </div>

                {/* Ratio Analysis */}
                <ComparisonChart
                    title="Ratio Analysis vs Targets"
                    description="Key financial ratios compared to industry targets"
                    data={ratioComparisonData}
                    dataKeys={[
                        { key: 'value', label: 'Current Ratio (%)', color: 'hsl(var(--chart-1))' },
                        { key: 'target', label: 'Target Ratio (%)', color: 'hsl(var(--chart-2))' },
                    ]}
                />

                {/* Financial Summary Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Financial Performance Summary</CardTitle>
                        <CardDescription>Detailed breakdown of financial performance metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full table-auto">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-4 py-3 text-left">Metric</th>
                                        <th className="px-4 py-3 text-right">Current</th>
                                        <th className="px-4 py-3 text-right">Target</th>
                                        <th className="px-4 py-3 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">Loss Ratio</td>
                                        <td className="px-4 py-3 text-right font-semibold">{data.loss_ratio.toFixed(1)}%</td>
                                        <td className="px-4 py-3 text-right">60.0%</td>
                                        <td className="px-4 py-3 text-right">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                    data.loss_ratio <= 60 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}
                                            >
                                                {data.loss_ratio <= 60 ? 'Good' : 'Needs Attention'}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">Expense Ratio</td>
                                        <td className="px-4 py-3 text-right font-semibold">{data.expense_ratio.toFixed(1)}%</td>
                                        <td className="px-4 py-3 text-right">25.0%</td>
                                        <td className="px-4 py-3 text-right">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                    data.expense_ratio <= 25 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}
                                            >
                                                {data.expense_ratio <= 25 ? 'Good' : 'Monitor'}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">Combined Ratio</td>
                                        <td className="px-4 py-3 text-right font-semibold">{data.combined_ratio.toFixed(1)}%</td>
                                        <td className="px-4 py-3 text-right">85.0%</td>
                                        <td className="px-4 py-3 text-right">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                    data.combined_ratio <= 85 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}
                                            >
                                                {data.combined_ratio <= 85 ? 'Good' : 'Needs Attention'}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Financial Health Indicators */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
                                Profitability
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Net Profit Margin</span>
                                    <span className="font-semibold text-green-600">{data.profit_margin.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Gross Profit</span>
                                    <span className="font-semibold">{formatCurrency(data.total_revenue - data.total_expenses)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">ROI</span>
                                    <span className="font-semibold text-green-600">12.5%</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <TrendingDown className="mr-2 h-5 w-5 text-red-600" />
                                Risk Management
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Loss Ratio</span>
                                    <span className="font-semibold">{data.loss_ratio.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Combined Ratio</span>
                                    <span className="font-semibold">{data.combined_ratio.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Risk Score</span>
                                    <span className="font-semibold text-yellow-600">Medium</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <DollarSign className="mr-2 h-5 w-5 text-blue-600" />
                                Efficiency
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Expense Ratio</span>
                                    <span className="font-semibold">{data.expense_ratio.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Cost per Policy</span>
                                    <span className="font-semibold">{formatCurrency(2500)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Efficiency Score</span>
                                    <span className="font-semibold text-green-600">8.2/10</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
