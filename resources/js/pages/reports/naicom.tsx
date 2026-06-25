import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    Building,
    Calendar,
    CheckCircle,
    Download,
    FileBarChart,
    FileSpreadsheet,
    RefreshCw,
    Shield,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useState } from 'react';

interface CompanyInfo {
    name: string;
    registration_number: string;
    license_number: string;
    address: string;
    phone: string;
    email: string;
}

interface FinancialSummary {
    gross_premium_written: number;
    net_premium_written: number;
    commission_paid: number;
    premium_refunded: number;
    outstanding_premiums: number;
}

interface PolicyStat {
    class_of_business: string;
    product_name: string;
    policy_count: number;
    total_premium: number;
    average_premium: number;
}

interface CustomerDemographics {
    individual_customers: number;
    corporate_customers: number;
    new_customers_period: number;
    total_active_customers: number;
}

interface NAICOMData {
    period: {
        start: string;
        end: string;
    };
    company_info: CompanyInfo;
    financial_summary: FinancialSummary;
    policy_stats: PolicyStat[];
    customer_demographics: CustomerDemographics;
}

interface Props {
    data?: NAICOMData;
    period: string;
    date: string;
    startDate: string;
    endDate: string;
}

export default function NAICOMReports({ data, period, date, startDate, endDate }: Props) {
    const [selectedPeriod, setSelectedPeriod] = useState(period);
    const [selectedDate, setSelectedDate] = useState(date);
    const [isGenerating, setIsGenerating] = useState(false);

    const generateReport = () => {
        setIsGenerating(true);
        router.get(
            '/reports/naicom',
            {
                period: selectedPeriod,
                date: selectedDate,
            },
            {
                onFinish: () => setIsGenerating(false),
                preserveState: true,
            },
        );
    };

    const downloadPDF = () => {
        window.open(`/reports/naicom?period=${selectedPeriod}&date=${selectedDate}&download=pdf`, '_blank');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <AppLayout>
            <Head title="NAICOM Compliance Reports" />

            <div className="flex-1 space-y-4 pt-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src="/images/naicom_logo.png" alt="NAICOM Logo" className="h-16 w-auto" />
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight"> NAICOM Compliance Reports</h2>
                            <p className="text-muted-foreground">Generate regulatory compliance reports for the National Insurance Commission</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => router.visit('/reports/naicom/runs')} variant="default">
                            <FileBarChart className="mr-2 h-4 w-4" />
                            Form 7.2 Reports
                        </Button>
                        <Button>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                        </Button>

                        <Button variant="outline">
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Download Excel
                        </Button>
                        <Button variant="secondary">
                            <Calendar className="mr-2 h-4 w-4" />
                            Schedule Report
                        </Button>
                    </div>
                </div>
                {/* Report Generation Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <FileBarChart className="mr-2 h-6 w-6 text-blue-600" />
                            Report Configuration
                        </CardTitle>
                        <CardDescription>Configure the reporting period and generate NAICOM compliance reports</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="period">Report Period</Label>
                                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="quarterly">Quarterly</SelectItem>
                                        <SelectItem value="yearly">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date">
                                    {selectedPeriod === 'monthly' ? 'Month' : selectedPeriod === 'quarterly' ? 'Quarter' : 'Year'}
                                </Label>
                                <Input
                                    type={selectedPeriod === 'yearly' ? 'number' : 'month'}
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    min={selectedPeriod === 'yearly' ? '2020' : undefined}
                                    max={selectedPeriod === 'yearly' ? new Date().getFullYear().toString() : undefined}
                                />
                            </div>

                            <div className="flex flex-col justify-end space-y-2">
                                <Button onClick={generateReport} disabled={isGenerating}>
                                    {isGenerating ? (
                                        <>
                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <FileBarChart className="mr-2 h-4 w-4" />
                                            Generate Report
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {data && (
                            <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                                        <span className="font-medium text-green-800">
                                            Report generated successfully for {formatDate(startDate)} to {formatDate(endDate)}
                                        </span>
                                    </div>
                                    <Button onClick={downloadPDF} variant="outline" size="sm">
                                        <Download className="mr-2 h-4 w-4" />
                                        Download PDF
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {data && (
                    <>
                        {/* Company Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Building className="mr-2 h-5 w-5 text-blue-600" />
                                    Company Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-sm font-medium text-gray-600">Company Name</Label>
                                            <p className="text-sm text-gray-900">{data.company_info.name}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-600">Registration Number</Label>
                                            <p className="text-sm text-gray-900">{data.company_info.registration_number}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-600">License Number</Label>
                                            <p className="text-sm text-gray-900">{data.company_info.license_number}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-sm font-medium text-gray-600">Address</Label>
                                            <p className="text-sm text-gray-900">{data.company_info.address}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-600">Phone</Label>
                                            <p className="text-sm text-gray-900">{data.company_info.phone}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-600">Email</Label>
                                            <p className="text-sm text-gray-900">{data.company_info.email}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Financial Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
                                    Financial Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-blue-600">Gross Premium Written</p>
                                                <p className="text-2xl font-bold text-blue-900">
                                                    {formatCurrency(data.financial_summary.gross_premium_written)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-green-600">Net Premium Written</p>
                                                <p className="text-2xl font-bold text-green-900">
                                                    {formatCurrency(data.financial_summary.net_premium_written)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-purple-600">Commission Paid</p>
                                                <p className="text-2xl font-bold text-purple-900">
                                                    {formatCurrency(data.financial_summary.commission_paid)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-orange-600">Premium Refunded</p>
                                                <p className="text-2xl font-bold text-orange-900">
                                                    {formatCurrency(data.financial_summary.premium_refunded)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-red-600">Outstanding Premiums</p>
                                                <p className="text-2xl font-bold text-red-900">
                                                    {formatCurrency(data.financial_summary.outstanding_premiums)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Policy Statistics */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Shield className="mr-2 h-5 w-5 text-blue-600" />
                                    Policy Statistics by Class of Business
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {data.policy_stats.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full table-auto">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="px-4 py-3 text-left">Class of Business</th>
                                                    <th className="px-4 py-3 text-left">Product Name</th>
                                                    <th className="px-4 py-3 text-right">Policies</th>
                                                    <th className="px-4 py-3 text-right">Total Premium</th>
                                                    <th className="px-4 py-3 text-right">Average Premium</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.policy_stats.map((stat, index) => (
                                                    <tr key={index} className="border-b hover:bg-gray-50">
                                                        <td className="px-4 py-3">
                                                            <Badge variant="outline" className="capitalize">
                                                                {stat.class_of_business}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3">{stat.product_name}</td>
                                                        <td className="px-4 py-3 text-right font-semibold">{stat.policy_count.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-right font-semibold text-blue-600">
                                                            {formatCurrency(stat.total_premium)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">{formatCurrency(stat.average_premium)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center">
                                        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                        <p className="text-gray-500">No policy data available for the selected period.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Customer Demographics */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Users className="mr-2 h-5 w-5 text-purple-600" />
                                    Customer Demographics
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                                    <div className="rounded-lg bg-gray-50 p-4 text-center">
                                        <p className="text-3xl font-bold text-gray-900">
                                            {data.customer_demographics.total_active_customers.toLocaleString()}
                                        </p>
                                        <p className="text-sm text-gray-600">Total Active Customers</p>
                                    </div>

                                    <div className="rounded-lg bg-blue-50 p-4 text-center">
                                        <p className="text-3xl font-bold text-blue-600">
                                            {data.customer_demographics.individual_customers.toLocaleString()}
                                        </p>
                                        <p className="text-sm text-gray-600">Individual Customers</p>
                                    </div>

                                    <div className="rounded-lg bg-green-50 p-4 text-center">
                                        <p className="text-3xl font-bold text-green-600">
                                            {data.customer_demographics.corporate_customers.toLocaleString()}
                                        </p>
                                        <p className="text-sm text-gray-600">Corporate Customers</p>
                                    </div>

                                    <div className="rounded-lg bg-purple-50 p-4 text-center">
                                        <p className="text-3xl font-bold text-purple-600">
                                            {data.customer_demographics.new_customers_period.toLocaleString()}
                                        </p>
                                        <p className="text-sm text-gray-600">New Customers (Period)</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Export Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Export Options</CardTitle>
                                <CardDescription>Download your NAICOM compliance report in different formats</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-4">
                                    <Button onClick={downloadPDF}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Download PDF Report
                                    </Button>
                                    <Button variant="outline">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        Schedule Report
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}

                {!data && (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <FileBarChart className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                            <h3 className="mb-2 text-lg font-semibold text-gray-600">Generate Your First NAICOM Report</h3>
                            <p className="mb-6 text-gray-500">
                                Select a reporting period above and click "Generate Report" to create your NAICOM compliance report.
                            </p>
                            <Button onClick={generateReport} disabled={isGenerating}>
                                {isGenerating ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <FileBarChart className="mr-2 h-4 w-4" />
                                        Generate Report
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
