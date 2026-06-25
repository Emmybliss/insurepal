import { DistributionChart } from '@/components/reports/DistributionChart';
import { ExportButton } from '@/components/reports/ExportButton';
import { KPICard } from '@/components/reports/KPICard';
import { PeriodSelector } from '@/components/reports/PeriodSelector';
import { TrendChart } from '@/components/reports/TrendChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Calendar, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';

interface CustomerAnalyticsData {
    total_customers: number;
    new_customers: number;
    individual_customers: number;
    corporate_customers: number;
    customers_with_policies: number;
    customers_without_policies: number;
    avg_policies_per_customer: number;
    customer_retention_rate: number;
}

interface AcquisitionTrend {
    date: string;
    count: number;
}

interface TopCustomer {
    id: number;
    display_name: string;
    type: string;
    total_premium: number;
}

interface Props {
    data: CustomerAnalyticsData;
    acquisitionTrends: AcquisitionTrend[];
    topCustomers: TopCustomer[];
    period: string;
    startDate: string;
    endDate: string;
}

export default function CustomerAnalytics({ data, acquisitionTrends, topCustomers, period, startDate, endDate }: Props) {
    const [selectedPeriod, setSelectedPeriod] = useState(period);
    const [isGenerating, setIsGenerating] = useState(false);

    const generateReport = () => {
        setIsGenerating(true);
        router.get(
            '/reports/customer-analytics',
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
            title: 'Total Customers',
            value: data.total_customers.toLocaleString(),
            icon: Users,
            trend: {
                value: 8.5,
                isPositive: true,
                label: 'vs last period',
            },
        },
        {
            title: 'New Customers',
            value: data.new_customers.toLocaleString(),
            icon: TrendingUp,
            trend: {
                value: 12.3,
                isPositive: true,
                label: 'vs last period',
            },
        },
        {
            title: 'Retention Rate',
            value: `${data.customer_retention_rate.toFixed(1)}%`,
            icon: Users,
            trend: {
                value: 2.1,
                isPositive: true,
                label: 'vs last period',
            },
        },
        {
            title: 'Avg Policies per Customer',
            value: data.avg_policies_per_customer.toFixed(1),
            icon: TrendingUp,
            trend: {
                value: 5.7,
                isPositive: true,
                label: 'vs last period',
            },
        },
    ];

    const customerSegmentation = [
        {
            title: 'Individual Customers',
            value: data.individual_customers.toLocaleString(),
            subtitle: `${((data.individual_customers / data.total_customers) * 100).toFixed(1)}% of total`,
            status: 'info' as const,
        },
        {
            title: 'Corporate Customers',
            value: data.corporate_customers.toLocaleString(),
            subtitle: `${((data.corporate_customers / data.total_customers) * 100).toFixed(1)}% of total`,
            status: 'success' as const,
        },
        {
            title: 'Customers with Policies',
            value: data.customers_with_policies.toLocaleString(),
            subtitle: `${((data.customers_with_policies / data.total_customers) * 100).toFixed(1)}% of total`,
            status: 'success' as const,
        },
        {
            title: 'Customers without Policies',
            value: data.customers_without_policies.toLocaleString(),
            subtitle: `${((data.customers_without_policies / data.total_customers) * 100).toFixed(1)}% of total`,
            status: 'warning' as const,
        },
    ];

    const customerTypeData = [
        { name: 'Individual', value: data.individual_customers },
        { name: 'Corporate', value: data.corporate_customers },
    ];

    const acquisitionTrendData = acquisitionTrends.map((trend) => ({
        date: trend.date,
        value: trend.count,
    }));

    return (
        <AppLayout>
            <Head title="Customer Analytics" />

            <div className="flex-1 space-y-4 pt-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Customer Analytics</h2>
                        <p className="text-muted-foreground">Detailed insights into customer behavior, acquisition, and retention patterns</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>
                                {startDate} to {endDate}
                            </span>
                        </div>
                        <ExportButton reportType="customer-analytics" period={selectedPeriod} />
                    </div>
                </div>

                {/* Report Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <RefreshCw className="mr-2 h-5 w-5" />
                            Report Configuration
                        </CardTitle>
                        <CardDescription>Configure the reporting period and generate customer analytics report</CardDescription>
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

                {/* Customer Segmentation */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {customerSegmentation.map((segment, index) => (
                        <KPICard key={index} title={segment.title} value={segment.value} subtitle={segment.subtitle} status={segment.status} />
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Customer Acquisition Trends */}
                    <TrendChart
                        title="Customer Acquisition Trends"
                        description="New customer registrations over time"
                        data={acquisitionTrendData}
                        dataKey="value"
                        color="hsl(var(--chart-1))"
                    />

                    {/* Customer Type Distribution */}
                    <DistributionChart title="Customer Type Distribution" description="Individual vs Corporate customers" data={customerTypeData} />
                </div>

                {/* Top Customers Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Customers by Premium</CardTitle>
                        <CardDescription>Customers with highest premium contributions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full table-auto">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-4 py-3 text-left">Customer</th>
                                        <th className="px-4 py-3 text-left">Type</th>
                                        <th className="px-4 py-3 text-right">Total Premium</th>
                                        <th className="px-4 py-3 text-right">% of Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topCustomers.map((customer, index) => (
                                        <tr key={index} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium">{customer.display_name}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        customer.type === 'individual' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                    }`}
                                                >
                                                    {customer.type.charAt(0).toUpperCase() + customer.type.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-green-600">
                                                {formatCurrency(customer.total_premium)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {((customer.total_premium / topCustomers.reduce((sum, c) => sum + c.total_premium, 0)) * 100).toFixed(
                                                    1,
                                                )}
                                                %
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Customer Insights */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
                                Growth Metrics
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Customer Growth Rate</span>
                                    <span className="font-semibold text-green-600">12.3%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Policy Penetration</span>
                                    <span className="font-semibold">{((data.customers_with_policies / data.total_customers) * 100).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Avg Customer Value</span>
                                    <span className="font-semibold">{formatCurrency(150000)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Users className="mr-2 h-5 w-5 text-blue-600" />
                                Retention Analysis
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Retention Rate</span>
                                    <span className="font-semibold text-green-600">{data.customer_retention_rate.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Churn Rate</span>
                                    <span className="font-semibold text-red-600">{(100 - data.customer_retention_rate).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Lifetime Value</span>
                                    <span className="font-semibold">{formatCurrency(450000)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Calendar className="mr-2 h-5 w-5 text-purple-600" />
                                Engagement Metrics
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Active Customers</span>
                                    <span className="font-semibold">{data.customers_with_policies.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Inactive Customers</span>
                                    <span className="font-semibold text-yellow-600">{data.customers_without_policies.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Engagement Score</span>
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
