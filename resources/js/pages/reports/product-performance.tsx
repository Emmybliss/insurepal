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
import { Calendar, RefreshCw, Shield, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface ProductPerformanceData {
    total_products: number;
    total_premium: number;
    total_policies: number;
    avg_premium_per_policy: number;
    total_commission: number;
    loss_ratio: number;
    expense_ratio: number;
    combined_ratio: number;
}

interface ProductPerformance {
    product_name: string;
    product_type: string;
    policy_count: number;
    total_premium: number;
    avg_premium: number;
    commission_earned: number;
    loss_ratio: number;
    profitability_score: number;
}

interface ProductTrend {
    date: string;
    premium: number;
    policies: number;
}

interface Props {
    data: ProductPerformanceData;
    productPerformance: ProductPerformance[];
    trends: {
        premium_trends: ProductTrend[];
    };
    period: string;
    startDate: string;
    endDate: string;
}

export default function ProductPerformance({ data, productPerformance, trends, period, startDate, endDate }: Props) {
    const [selectedPeriod, setSelectedPeriod] = useState(period);
    const [isGenerating, setIsGenerating] = useState(false);

    const generateReport = () => {
        setIsGenerating(true);
        router.get(
            '/reports/product-performance',
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
            title: 'Total Premium',
            value: formatCurrency(data?.total_premium),
            icon: TrendingUp,
            trend: {
                value: 12.5,
                isPositive: true,
                label: 'vs last period',
            },
        },
        {
            title: 'Total Policies',
            value: data?.total_policies?.toLocaleString(),
            icon: Shield,
            trend: {
                value: 8.2,
                isPositive: true,
                label: 'vs last period',
            },
        },
        {
            title: 'Avg Premium per Policy',
            value: formatCurrency(data?.avg_premium_per_policy),
            icon: TrendingUp,
            trend: {
                value: 5.7,
                isPositive: true,
                label: 'vs last period',
            },
        },
        {
            title: 'Total Commission',
            value: formatCurrency(data?.total_commission),
            icon: TrendingUp,
            trend: {
                value: 6.3,
                isPositive: true,
                label: 'vs last period',
            },
        },
    ];

    const getStatus = (value: number, thresholds: { success: number; warning: number }): 'success' | 'warning' | 'error' => {
        if (value <= thresholds.success) return 'success';
        if (value <= thresholds.warning) return 'warning';
        return 'error';
    };

    const performanceMetrics = [
        {
            title: 'Loss Ratio',
            value: `${data?.loss_ratio?.toFixed(1)}%`,
            subtitle: 'Claims as % of premium',
            status: getStatus(data?.loss_ratio, { success: 60, warning: 80 }),
        },
        {
            title: 'Expense Ratio',
            value: `${data?.expense_ratio?.toFixed(1)}%`,
            subtitle: 'Expenses as % of premium',
            status: getStatus(data?.expense_ratio, { success: 25, warning: 35 }),
        },
        {
            title: 'Combined Ratio',
            value: `${data?.combined_ratio?.toFixed(1)}%`,
            subtitle: 'Loss + Expense ratio',
            status: getStatus(data?.combined_ratio, { success: 85, warning: 100 }),
        },
    ];

    const productDistributionData = productPerformance?.map((product) => ({
        name: product?.product_name,
        value: product?.policy_count,
    }));

    const premiumComparisonData = productPerformance?.map((product) => ({
        name: product?.product_name,
        premium: product?.total_premium,
        policies: product?.policy_count,
        commission: product?.commission_earned,
    }));

    const premiumTrendData = trends?.premium_trends?.map((trend) => ({
        date: trend.date,
        value: trend.premium,
    }));

    const getProfitabilityColor = (score: number) => {
        if (score >= 8) return 'text-green-600';
        if (score >= 6) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <AppLayout>
            <Head title="Product Performance" />

            <div className="flex-1 space-y-4 pt-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Product Performance</h2>
                        <p className="text-muted-foreground">Analysis of insurance product performance and profitability metrics</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>
                                {startDate} to {endDate}
                            </span>
                        </div>
                        <ExportButton reportType="product-performance" period={selectedPeriod} />
                    </div>
                </div>

                {/* Report Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <RefreshCw className="mr-2 h-5 w-5" />
                            Report Configuration
                        </CardTitle>
                        <CardDescription>Configure the reporting period and generate product performance report</CardDescription>
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
                    {kpiCards?.map((kpi, index) => (
                        <KPICard key={index} title={kpi.title} value={kpi.value} icon={kpi.icon} trend={kpi.trend} />
                    ))}
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {performanceMetrics?.map((metric, index) => (
                        <KPICard key={index} title={metric.title} value={metric.value} subtitle={metric.subtitle} status={metric.status} />
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Premium Trends */}
                    <TrendChart
                        title="Premium Trends"
                        description="Total premium collection over time"
                        data={premiumTrendData}
                        dataKey="value"
                        color="hsl(var(--chart-1))"
                    />

                    {/* Product Distribution */}
                    <DistributionChart title="Product Distribution" description="Policies by product type" data={productDistributionData} />
                </div>

                {/* Premium Comparison */}
                <ComparisonChart
                    title="Product Performance Comparison"
                    description="Premium, policies, and commission by product"
                    data={premiumComparisonData}
                    dataKeys={[
                        { key: 'premium', label: 'Premium (₦)', color: 'hsl(var(--chart-1))' },
                        { key: 'policies', label: 'Policy Count', color: 'hsl(var(--chart-2))' },
                        { key: 'commission', label: 'Commission (₦)', color: 'hsl(var(--chart-3))' },
                    ]}
                />

                {/* Product Performance Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Product Performance Summary</CardTitle>
                        <CardDescription>Detailed breakdown of product performance and profitability</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full table-auto">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-4 py-3 text-left">Product</th>
                                        <th className="px-4 py-3 text-left">Type</th>
                                        <th className="px-4 py-3 text-right">Policies</th>
                                        <th className="px-4 py-3 text-right">Premium</th>
                                        <th className="px-4 py-3 text-right">Avg Premium</th>
                                        <th className="px-4 py-3 text-right">Commission</th>
                                        <th className="px-4 py-3 text-right">Loss Ratio</th>
                                        <th className="px-4 py-3 text-right">Profitability</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productPerformance?.map((product, index) => (
                                        <tr key={index} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium">{product?.product_name}</td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                                    {product?.product_type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">{product?.policy_count.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right font-semibold text-green-600">
                                                {formatCurrency(product?.total_premium)}
                                            </td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(product?.avg_premium)}</td>
                                            <td className="px-4 py-3 text-right font-semibold text-blue-600">
                                                {formatCurrency(product?.commission_earned)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span
                                                    className={`font-semibold ${
                                                        product?.loss_ratio <= 60
                                                            ? 'text-green-600'
                                                            : product?.loss_ratio <= 80
                                                              ? 'text-yellow-600'
                                                              : 'text-red-600'
                                                    }`}
                                                >
                                                    {product?.loss_ratio.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`font-semibold ${getProfitabilityColor(product?.profitability_score)}`}>
                                                    {product?.profitability_score.toFixed(1)}/10
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Performance Insights */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
                                Top Performers
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {productPerformance
                                    ?.sort((a, b) => b.total_premium - a.total_premium)
                                    .slice(0, 3)
                                    .map((product, index) => (
                                        <div key={index} className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">{product.product_name}</span>
                                            <span className="font-semibold">{formatCurrency(product.total_premium)}</span>
                                        </div>
                                    ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Shield className="mr-2 h-5 w-5 text-blue-600" />
                                Profitability Leaders
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {productPerformance
                                    ?.sort((a, b) => b.profitability_score - a.profitability_score)
                                    .slice(0, 3)
                                    .map((product, index) => (
                                        <div key={index} className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">{product.product_name}</span>
                                            <span className={`font-semibold ${getProfitabilityColor(product.profitability_score)}`}>
                                                {product.profitability_score.toFixed(1)}/10
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Calendar className="mr-2 h-5 w-5 text-purple-600" />
                                Market Share
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {productPerformance
                                    ?.sort((a, b) => b.total_premium - a.total_premium)
                                    .slice(0, 3)
                                    .map((product, index) => {
                                        const marketShare = (product.total_premium / data.total_premium) * 100;
                                        return (
                                            <div key={index} className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">{product.product_name}</span>
                                                <span className="font-semibold">{marketShare.toFixed(1)}%</span>
                                            </div>
                                        );
                                    })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
